'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Email template request failed';
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    category: 'Sales Outreach',
    body: 'Hi {{firstName}},\n\nI wanted to follow up about {{company}} and share a quick next step.\n\nBest,\n{{senderName}}',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/email-templates?pageSize=100');
      const payload = await response.json() as { error?: string; data?: EmailTemplate[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load email templates');
      setTemplates(payload.data || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create template');
      setSuccess(`${form.name} created`);
      setForm((prev) => ({ ...prev, name: '', subject: '' }));
      await load();
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
            <Typography variant="h4">Email Templates</Typography>
            <Typography color="text.secondary">Create reusable CRM email templates for outreach, onboarding, renewals, and service follow-up.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <ArticleIcon color="primary" />
                <Typography variant="h6">New Template</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField size="small" label="Subject" value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} />
                <TextField size="small" label="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
                <TextField label="Body" multiline minRows={8} value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="Active" />
                <Button variant="contained" startIcon={<SaveIcon />} onClick={createTemplate} disabled={saving || !form.name.trim() || !form.subject.trim()}>
                  Create Template
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Templates</Typography>
              {loading ? <CircularProgress /> : templates.length === 0 ? (
                <Typography color="text.secondary">No email templates created.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(template)}>
                        <TableCell>
                          <Typography fontWeight={700}>{template.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }} noWrap>{template.body}</Typography>
                        </TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell>{template.category || '-'}</TableCell>
                        <TableCell><Chip size="small" label={template.isActive ? 'Active' : 'Inactive'} color={template.isActive ? 'success' : 'default'} /></TableCell>
                        <TableCell>{new Date(template.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Email Template Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
