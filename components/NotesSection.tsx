'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotesSectionProps {
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  currentUserId?: string;
}

export default function NotesSection({
  contactId,
  leadId,
  opportunityId,
  currentUserId,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [contactId, leadId, opportunityId]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (leadId) params.append('leadId', leadId);
      if (opportunityId) params.append('opportunityId', opportunityId);

      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          contactId,
          leadId,
          opportunityId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create note');

      setNewNote('');
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error('Failed to update note');

      setEditingId(null);
      setEditContent('');
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');
      setDeletingNoteId(null);
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
      setDeletingNoteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notes
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Add New Note */}
        <Box sx={{ mb: 3 }}>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNote}
            disabled={!newNote.trim() || saving}
          >
            Add Note
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Notes List */}
        {loading ? (
          <Typography color="text.secondary">Loading notes...</Typography>
        ) : notes.length === 0 ? (
          <Typography color="text.secondary">
            No notes yet. Add your first note above.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notes.map((note) => (
              <Card key={note.id} variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">
                        {note.creator.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(note.createdAt)}
                      </Typography>
                    </Box>
                    {currentUserId === note.creator.id && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {deletingNoteId === note.id ? (
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleDeleteNote(note.id)}
                            onBlur={() => setDeletingNoteId(null)}
                            sx={{ fontSize: '0.7rem', minWidth: 0, px: 1 }}
                          >
                            Confirm
                          </Button>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => setDeletingNoteId(note.id)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>

                  {editingId === note.id ? (
                    <Box>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={saving}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-line', mt: 1 }}
                    >
                      {note.content}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
