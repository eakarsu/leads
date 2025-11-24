'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';

interface VoiceInputProps {
  onTranscriptComplete: (text: string) => void;
  language?: string;
}

export default function VoiceInput({ onTranscriptComplete, language = 'en-US' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const processChunks = async () => {
    if (audioChunksRef.current.length === 0) return;

    // Create a complete audio blob with all chunks collected so far
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    console.log('Processing chunk - size:', audioBlob.size, 'bytes');

    // Don't clear chunks - keep accumulating for complete audio
    // Send to transcribe but replace (not append) to get full context
    await transcribeAudio(audioBlob, false);
  };

  const startRecording = async () => {
    setError(null);
    setIsRecording(true);
    setTranscript(''); // Clear previous transcript
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use timeslice to collect data every 100ms
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped - processing final audio');

        // Clear the interval
        if (chunkIntervalRef.current) {
          clearInterval(chunkIntervalRef.current);
          chunkIntervalRef.current = null;
        }

        // Process final complete audio
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Final audio blob size:', audioBlob.size, 'bytes');
          await transcribeAudio(audioBlob, false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      // Start with timeslice of 100ms to capture audio continuously
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      console.log('Recording started with real-time transcription');

      // Process chunks every 3 seconds for real-time transcription
      chunkIntervalRef.current = setInterval(() => {
        processChunks();
      }, 3000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  };

  const transcribeAudio = async (audioBlob: Blob, append = false) => {
    setIsProcessing(true);
    console.log('Sending audio to Whisper API. Size:', audioBlob.size, 'bytes');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('Whisper API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Whisper API error:', errorData);
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription result:', data);

      if (data.text) {
        if (append) {
          // Append new text to existing transcript
          setTranscript(prev => prev ? prev + ' ' + data.text : data.text);
          console.log('Appended to transcript:', data.text);
        } else {
          setTranscript(data.text);
          console.log('Transcript set to:', data.text);
        }
      } else {
        setError('No transcription received');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim());
      clearTranscript();
    }
  };


  return (
    <Box sx={{ width: '100%' }}>
      {/* Recording Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={isProcessing}
            size="large"
          >
            Start Recording
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            size="large"
          >
            Stop Recording
          </Button>
        )}

        {transcript && (
          <>
            <IconButton onClick={clearTranscript} color="error" title="Clear transcript">
              <DeleteIcon />
            </IconButton>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!transcript.trim()}
            >
              Parse with AI
            </Button>
          </>
        )}
      </Box>

      {/* Recording Status */}
      {isRecording && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'error.main',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
          <Typography variant="body2" color="error.dark" fontWeight="bold">
            Recording... Speak now
          </Typography>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Transcribing audio with Whisper...
          </Typography>
        </Box>
      )}

      {/* Transcript Display */}
      <TextField
        label="Transcript"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        fullWidth
        multiline
        rows={10}
        placeholder="Click 'Start Recording' and speak... Transcript will appear here after you stop recording."
        helperText="You can edit the transcript before sending to AI"
        InputProps={{
          sx: {
            fontFamily: 'monospace',
          },
        }}
      />

      {/* Instructions */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Instructions:</strong>
          <br />
          1. Click "Start Recording" and allow microphone access
          <br />
          2. Speak clearly about the lead information
          <br />
          3. Click "Stop Recording" when done
          <br />
          4. Review and edit the transcript if needed
          <br />
          5. Click "Parse with AI" to extract lead information
        </Typography>
      </Box>
    </Box>
  );
}
