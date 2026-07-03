'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  route?: string;
  data?: unknown;
};

type AgentResponse = {
  response?: string;
  route?: string;
  data?: unknown;
  error?: string;
};

const suggestions = [
  'Show recent leads',
  'Create a task to follow up tomorrow',
  'Show pipeline summary',
  'Find contacts named Smith',
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function FloatingCRMChatbot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'I can operate this CRM from chat: create rows, update records, find data, summarize the pipeline, and open the related app page.',
      route: '/dashboard',
    },
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    setError('');
    setInput('');
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = await response.json() as AgentResponse;
      if (!response.ok) throw new Error(payload.error || 'Assistant request failed');

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          text: payload.response || 'Done.',
          route: payload.route,
          data: payload.data,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assistant request failed';
      setError(message);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', text: message }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1500 }}>
      {open && (
        <Paper
          elevation={10}
          sx={{
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            height: { xs: 'min(680px, calc(100vh - 96px))', sm: 620 },
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToyIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800}>CRM Assistant</Typography>
              <Typography variant="caption" color="text.secondary">Calls app APIs and creates CRM rows</Typography>
            </Box>
            <Tooltip title="Close assistant">
              <IconButton size="small" onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider />

          <Box sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                size="small"
                variant="outlined"
                onClick={() => sendMessage(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </Button>
            ))}
          </Box>

          {error && <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{error}</Alert>}

          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 1.5 }}>
            <Stack spacing={1.25}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      px: 1.5,
                      py: 1,
                      bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
                    {message.route && message.role === 'assistant' && (
                      <Button
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={() => router.push(message.route || '/dashboard')}
                        sx={{ mt: 1 }}
                      >
                        Open page
                      </Button>
                    )}
                    {Boolean(message.data) && message.role === 'assistant' && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Action completed through the app backend.
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))}
              {loading && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Thinking and calling the app...</Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />
          <Stack
            component="form"
            direction="row"
            spacing={1}
            sx={{ p: 1.5 }}
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Ask me to create, update, find, or summarize CRM data..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <IconButton color="primary" type="submit" disabled={loading || !input.trim()}>
              <SendIcon />
            </IconButton>
          </Stack>
        </Paper>
      )}

      <Badge color="success" variant="dot" overlap="circular">
        <Fab color="primary" onClick={() => setOpen((value) => !value)} aria-label="Open CRM assistant">
          <SmartToyIcon />
        </Fab>
      </Badge>
    </Box>
  );
}
