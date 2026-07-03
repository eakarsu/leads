'use client';

import { useCallback, useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type CaseRecord = {
  id: string;
  caseNumber: string;
  subject: string;
  status: string;
  priority: string;
};

type CaseMilestone = {
  id: string;
  caseId: string;
  milestoneName: string;
  targetDate: string;
  completedDate?: string | null;
  status: string;
  createdAt: string;
};

const statusOptions = ['OPEN', 'COMPLETED', 'VIOLATED'];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Case milestone request failed';
}

function statusColor(status: string) {
  if (status === 'COMPLETED') return 'success';
  if (status === 'VIOLATED') return 'error';
  return 'warning';
}

function toDateTimeLocal(value: Date) {
  const offsetMs = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function CaseMilestonesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [milestones, setMilestones] = useState<CaseMilestone[]>([]);
  const [form, setForm] = useState({
    caseId: '',
    milestoneName: 'First Response',
    targetDate: toDateTimeLocal(new Date(Date.now() + 4 * 60 * 60 * 1000)),
    status: 'OPEN',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [casesResponse, milestonesResponse] = await Promise.all([
        fetch('/api/cases?pageSize=100'),
        fetch('/api/case-milestones?pageSize=100'),
      ]);
      const casesPayload = await casesResponse.json() as { error?: string; data?: CaseRecord[] };
      const milestonesPayload = await milestonesResponse.json() as { error?: string; data?: CaseMilestone[] };
      if (!casesResponse.ok) throw new Error(casesPayload.error || 'Failed to load cases');
      if (!milestonesResponse.ok) throw new Error(milestonesPayload.error || 'Failed to load milestones');
      const nextCases = casesPayload.data || [];
      setCases(nextCases);
      setMilestones(milestonesPayload.data || []);
      if (!form.caseId && nextCases[0]) setForm((prev) => ({ ...prev, caseId: nextCases[0].id }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [form.caseId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const createMilestone = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/case-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          targetDate: new Date(form.targetDate).toISOString(),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create milestone');
      setSuccess('Case milestone created');
      await loadPage();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateMilestone = async (milestone: CaseMilestone, status: string) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/case-milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          completedDate: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update milestone');
      setSuccess(`Milestone marked ${status.toLowerCase()}`);
      await loadPage();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteMilestone = async (id: string) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/case-milestones/${id}`, { method: 'DELETE' });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete milestone');
      setSuccess('Milestone deleted');
      await loadPage();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const caseLabel = (id: string) => {
    const caseRecord = cases.find((item) => item.id === id);
    return caseRecord ? `${caseRecord.caseNumber} - ${caseRecord.subject}` : id;
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Case Milestones</Typography>
            <Typography color="text.secondary">Track SLA commitments for first response, resolution, and escalation deadlines.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadPage}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Create Milestone</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <InputLabel>Case</InputLabel>
                <Select label="Case" value={form.caseId} onChange={(event) => setForm((prev) => ({ ...prev, caseId: event.target.value }))}>
                  {cases.map((caseRecord) => (
                    <MenuItem key={caseRecord.id} value={caseRecord.id}>
                      {caseRecord.caseNumber} - {caseRecord.subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Milestone Name"
                value={form.milestoneName}
                onChange={(event) => setForm((prev) => ({ ...prev, milestoneName: event.target.value }))}
              />
              <TextField
                size="small"
                type="datetime-local"
                label="Target Date"
                InputLabelProps={{ shrink: true }}
                value={form.targetDate}
                onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                  {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
              </FormControl>
              <Button startIcon={<AddIcon />} variant="contained" onClick={createMilestone} disabled={saving || !form.caseId || !form.milestoneName}>
                Create
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Milestone Register</Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Case</TableCell>
                    <TableCell>Milestone</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...milestone, case: caseLabel(milestone.caseId) })}>
                      <TableCell>{caseLabel(milestone.caseId)}</TableCell>
                      <TableCell>{milestone.milestoneName}</TableCell>
                      <TableCell>{new Date(milestone.targetDate).toLocaleString()}</TableCell>
                      <TableCell>{milestone.completedDate ? new Date(milestone.completedDate).toLocaleString() : '-'}</TableCell>
                      <TableCell><Chip size="small" color={statusColor(milestone.status)} label={milestone.status} /></TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" startIcon={<CheckCircleIcon />} disabled={saving} onClick={() => updateMilestone(milestone, 'COMPLETED')}>Complete</Button>
                          <Button size="small" color="warning" startIcon={<WarningIcon />} disabled={saving} onClick={() => updateMilestone(milestone, 'VIOLATED')}>Violate</Button>
                          <Button size="small" color="error" startIcon={<DeleteIcon />} disabled={saving} onClick={() => deleteMilestone(milestone.id)}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!milestones.length && (
                    <TableRow><TableCell colSpan={6} align="center">No case milestones yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Case Milestone Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
