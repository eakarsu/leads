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
  OutlinedInput,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type CaseQueue = {
  id: string;
  name: string;
  description?: string | null;
  memberIds: string[];
  isActive: boolean;
  createdAt: string;
  _count?: { cases: number };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Case queue request failed';
}

export default function CaseQueuesPage() {
  const [queues, setQueues] = useState<CaseQueue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [queuesResponse, usersResponse] = await Promise.all([
        fetch('/api/case-queues'),
        fetch('/api/users'),
      ]);
      const queuesPayload = await queuesResponse.json() as CaseQueue[] | { error?: string };
      const usersPayload = await usersResponse.json() as User[] | { error?: string };
      if (!queuesResponse.ok) throw new Error(Array.isArray(queuesPayload) ? 'Failed to load queues' : queuesPayload.error || 'Failed to load queues');
      if (!usersResponse.ok) throw new Error(Array.isArray(usersPayload) ? 'Failed to load users' : usersPayload.error || 'Failed to load users');
      setQueues(Array.isArray(queuesPayload) ? queuesPayload : []);
      setUsers(Array.isArray(usersPayload) ? usersPayload : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const createQueue = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/case-queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create queue');
      setSuccess('Case queue created');
      setForm({ name: '', description: '', memberIds: [] });
      await loadPage();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const userLabel = (id: string) => {
    const user = users.find((item) => item.id === id);
    return user ? user.name || user.email : id;
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Case Queues</Typography>
            <Typography color="text.secondary">Route service cases to specialized teams and monitor queue load.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadPage}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Create Queue</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Queue Name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <TextField
                size="small"
                label="Description"
                sx={{ minWidth: 280 }}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Members</InputLabel>
                <Select
                  multiple
                  label="Members"
                  value={form.memberIds}
                  input={<OutlinedInput label="Members" />}
                  onChange={(event) => setForm((prev) => ({ ...prev, memberIds: event.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {(selected as string[]).map((id) => <Chip key={id} size="small" label={userLabel(id)} />)}
                    </Stack>
                  )}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name || user.email} - {user.role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button startIcon={<AddIcon />} variant="contained" onClick={createQueue} disabled={saving || !form.name}>
                Create
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Active Queues</Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell>Open Cases</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queues.map((queue) => (
                    <TableRow key={queue.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(queue)}>
                      <TableCell>{queue.name}</TableCell>
                      <TableCell>{queue.description || '-'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {queue.memberIds.length ? queue.memberIds.map((id) => <Chip key={id} size="small" label={userLabel(id)} />) : '-'}
                        </Stack>
                      </TableCell>
                      <TableCell>{queue._count?.cases ?? 0}</TableCell>
                      <TableCell><Chip size="small" color={queue.isActive ? 'success' : 'default'} label={queue.isActive ? 'Active' : 'Inactive'} /></TableCell>
                    </TableRow>
                  ))}
                  {!queues.length && (
                    <TableRow><TableCell colSpan={5} align="center">No case queues yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Case Queue Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
