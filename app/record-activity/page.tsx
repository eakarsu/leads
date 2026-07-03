'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import NotesIcon from '@mui/icons-material/Notes';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type RelatedType = 'lead' | 'contact' | 'opportunity';
type RelatedRecord = { id: string; label: string };
type Note = { id: string; content: string; createdAt: string; creator?: { name: string }; leadId?: string; contactId?: string; opportunityId?: string };
type Attachment = { id: string; fileName: string; fileSize: number; fileType: string; createdAt: string; uploader?: { name: string }; leadId?: string; contactId?: string; opportunityId?: string };
type FieldHistory = { id: string; objectType: string; objectId: string; fieldName: string; oldValue?: string | null; newValue?: string | null; changedAt: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Record activity request failed';
}

function relationPayload(type: RelatedType, id: string) {
  return {
    leadId: type === 'lead' ? id : null,
    contactId: type === 'contact' ? id : null,
    opportunityId: type === 'opportunity' ? id : null,
  };
}

function fileSize(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordActivityPage() {
  const [tab, setTab] = useState(0);
  const [relatedType, setRelatedType] = useState<RelatedType>('lead');
  const [relatedId, setRelatedId] = useState('');
  const [relatedRecords, setRelatedRecords] = useState<Record<RelatedType, RelatedRecord[]>>({ lead: [], contact: [], opportunity: [] });
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<FieldHistory[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyForm, setHistoryForm] = useState({ objectType: 'Lead', fieldName: 'status', oldValue: '', newValue: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const selectedObjectType = useMemo(() => {
    if (relatedType === 'lead') return 'Lead';
    if (relatedType === 'contact') return 'Contact';
    return 'Opportunity';
  }, [relatedType]);

  const loadRelated = useCallback(async () => {
    const [leadsResponse, contactsResponse, opportunitiesResponse] = await Promise.all([
      fetch('/api/leads?pageSize=100'),
      fetch('/api/contacts?pageSize=100'),
      fetch('/api/opportunities?pageSize=100'),
    ]);
    const leadsPayload = await leadsResponse.json() as { data?: Array<{ id: string; fullName: string; email?: string }> };
    const contactsPayload = await contactsResponse.json() as { data?: Array<{ id: string; firstName: string; lastName: string; email?: string }> };
    const opportunitiesPayload = await opportunitiesResponse.json() as { data?: Array<{ id: string; name: string; stage?: string }> };

    const records = {
      lead: (leadsPayload.data || []).map((item) => ({ id: item.id, label: `${item.fullName}${item.email ? ` - ${item.email}` : ''}` })),
      contact: (contactsPayload.data || []).map((item) => ({ id: item.id, label: `${item.firstName} ${item.lastName}${item.email ? ` - ${item.email}` : ''}` })),
      opportunity: (opportunitiesPayload.data || []).map((item) => ({ id: item.id, label: `${item.name}${item.stage ? ` - ${item.stage}` : ''}` })),
    };
    setRelatedRecords(records);
    if (!relatedId) setRelatedId(records[relatedType][0]?.id || '');
  }, [relatedId, relatedType]);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await loadRelated();
      const relation: Record<string, string | null> = relatedId ? relationPayload(relatedType, relatedId) : {};
      const params = new URLSearchParams();
      Object.entries(relation).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const [notesResponse, attachmentsResponse, historyResponse] = await Promise.all([
        fetch(`/api/notes?pageSize=100&${params.toString()}`),
        fetch(`/api/attachments?pageSize=100&${params.toString()}`),
        fetch(`/api/field-history?limit=100${relatedId ? `&objectType=${selectedObjectType}&objectId=${relatedId}` : ''}`),
      ]);
      const notesPayload = await notesResponse.json() as { error?: string; data?: Note[] };
      const attachmentsPayload = await attachmentsResponse.json() as { error?: string; data?: Attachment[] };
      const historyPayload = await historyResponse.json() as FieldHistory[] | { error?: string };
      if (!notesResponse.ok) throw new Error(notesPayload.error || 'Failed to load notes');
      if (!attachmentsResponse.ok) throw new Error(attachmentsPayload.error || 'Failed to load attachments');
      if (!historyResponse.ok) throw new Error(Array.isArray(historyPayload) ? 'Failed to load history' : historyPayload.error || 'Failed to load history');
      setNotes(notesPayload.data || []);
      setAttachments(attachmentsPayload.data || []);
      setHistory(Array.isArray(historyPayload) ? historyPayload : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadRelated, relatedId, relatedType, selectedObjectType]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const createNote = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent, ...relationPayload(relatedType, relatedId) }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create note');
      setSuccess('Note added');
      setNoteContent('');
      await loadActivity();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadAttachment = async () => {
    if (!selectedFile) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const relation = relationPayload(relatedType, relatedId);
      Object.entries(relation).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const response = await fetch('/api/attachments', { method: 'POST', body: formData });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to upload attachment');
      setSuccess('Attachment uploaded');
      setSelectedFile(null);
      await loadActivity();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createHistory = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/field-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...historyForm, objectType: selectedObjectType, objectId: relatedId }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create field history');
      setSuccess('Field history entry logged');
      await loadActivity();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Record Activity Center</Typography>
            <Typography color="text.secondary">Manage notes, attachments, and field audit history across leads, contacts, and opportunities.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadActivity}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Record Type</InputLabel>
                <Select label="Record Type" value={relatedType} onChange={(event) => { setRelatedType(event.target.value as RelatedType); setRelatedId(''); }}>
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="contact">Contact</MenuItem>
                  <MenuItem value="opportunity">Opportunity</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Record</InputLabel>
                <Select label="Record" value={relatedId} onChange={(event) => setRelatedId(event.target.value)}>
                  {relatedRecords[relatedType].map((record) => (
                    <MenuItem key={record.id} value={record.id}>{record.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
              <Tab icon={<NotesIcon />} iconPosition="start" label="Notes" />
              <Tab icon={<AttachFileIcon />} iconPosition="start" label="Attachments" />
              <Tab icon={<HistoryIcon />} iconPosition="start" label="Field History" />
            </Tabs>

            {loading ? <CircularProgress /> : (
              <>
                {tab === 0 && (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField fullWidth label="New Note" multiline minRows={3} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
                      <Button variant="contained" onClick={createNote} disabled={saving || !relatedId || !noteContent.trim()}>Add Note</Button>
                    </Stack>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Note</TableCell><TableCell>Creator</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
                      <TableBody>
                        {notes.map((note) => (
                          <TableRow key={note.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...note, recordType: 'Note' })}>
                            <TableCell>{note.content}</TableCell>
                            <TableCell>{note.creator?.name || '-'}</TableCell>
                            <TableCell>{new Date(note.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Stack>
                )}

                {tab === 1 && (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                      <Button variant="outlined" component="label">
                        Choose File
                        <input hidden type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                      </Button>
                      <Typography color="text.secondary">{selectedFile?.name || 'No file selected'}</Typography>
                      <Button variant="contained" onClick={uploadAttachment} disabled={saving || !relatedId || !selectedFile}>Upload</Button>
                    </Stack>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>File</TableCell><TableCell>Type</TableCell><TableCell>Size</TableCell><TableCell>Uploader</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
                      <TableBody>
                        {attachments.map((attachment) => (
                          <TableRow key={attachment.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...attachment, recordType: 'Attachment' })}>
                            <TableCell>{attachment.fileName}</TableCell>
                            <TableCell>{attachment.fileType || '-'}</TableCell>
                            <TableCell>{fileSize(attachment.fileSize)}</TableCell>
                            <TableCell>{attachment.uploader?.name || '-'}</TableCell>
                            <TableCell>{new Date(attachment.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Stack>
                )}

                {tab === 2 && (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField size="small" label="Field" value={historyForm.fieldName} onChange={(event) => setHistoryForm((prev) => ({ ...prev, fieldName: event.target.value }))} />
                      <TextField size="small" label="Old Value" value={historyForm.oldValue} onChange={(event) => setHistoryForm((prev) => ({ ...prev, oldValue: event.target.value }))} />
                      <TextField size="small" label="New Value" value={historyForm.newValue} onChange={(event) => setHistoryForm((prev) => ({ ...prev, newValue: event.target.value }))} />
                      <Button variant="contained" onClick={createHistory} disabled={saving || !relatedId || !historyForm.fieldName}>Log Change</Button>
                    </Stack>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Object</TableCell><TableCell>Field</TableCell><TableCell>Old</TableCell><TableCell>New</TableCell><TableCell>Changed</TableCell></TableRow></TableHead>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...item, recordType: 'Field History' })}>
                            <TableCell><Chip size="small" label={item.objectType} /></TableCell>
                            <TableCell>{item.fieldName}</TableCell>
                            <TableCell>{item.oldValue || '-'}</TableCell>
                            <TableCell>{item.newValue || '-'}</TableCell>
                            <TableCell>{new Date(item.changedAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Stack>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title={selectedRecord?.recordType ? `${selectedRecord.recordType} Details` : 'Record Activity Details'}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
