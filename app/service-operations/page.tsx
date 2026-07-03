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
  FormControl,
  InputLabel,
  ListItemText,
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
import QueueIcon from '@mui/icons-material/Queue';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type User = { id: string; name: string; email: string };
type CaseQueue = { id: string; name: string; description?: string | null; memberIds: string[]; isActive: boolean; _count?: { cases: number } };
type CaseRecord = { id: string; caseNumber: string; subject: string; status: string; priority: string };
type Milestone = { id: string; caseId: string; milestoneName: string; targetDate: string; completedDate?: string | null; status: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Service operation request failed';
}

export default function ServiceOperationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<CaseQueue[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [queueForm, setQueueForm] = useState({ name: '', description: '', memberIds: [] as string[] });
  const [milestoneForm, setMilestoneForm] = useState({ caseId: '', milestoneName: 'First Response', targetDate: '' });
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, queuesResponse, casesResponse, milestonesResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/case-queues'),
        fetch('/api/cases?pageSize=100'),
        fetch('/api/case-milestones?pageSize=100'),
      ]);
      const usersPayload = await usersResponse.json() as User[] | { error?: string };
      const queuesPayload = await queuesResponse.json() as CaseQueue[] | { error?: string };
      const casesPayload = await casesResponse.json() as { error?: string; data?: CaseRecord[] };
      const milestonesPayload = await milestonesResponse.json() as { error?: string; data?: Milestone[] };

      if (!usersResponse.ok) throw new Error(Array.isArray(usersPayload) ? 'Failed to load users' : usersPayload.error || 'Failed to load users');
      if (!queuesResponse.ok) throw new Error(Array.isArray(queuesPayload) ? 'Failed to load queues' : queuesPayload.error || 'Failed to load queues');
      if (!casesResponse.ok) throw new Error(casesPayload.error || 'Failed to load cases');
      if (!milestonesResponse.ok) throw new Error(milestonesPayload.error || 'Failed to load milestones');

      const caseRows = casesPayload.data || [];
      setUsers(Array.isArray(usersPayload) ? usersPayload : []);
      setQueues(Array.isArray(queuesPayload) ? queuesPayload : []);
      setCases(caseRows);
      setMilestones(milestonesPayload.data || []);
      if (!milestoneForm.caseId && caseRows[0]) {
        setMilestoneForm((prev) => ({ ...prev, caseId: caseRows[0].id }));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [milestoneForm.caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const createQueue = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/case-queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueForm),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create queue');
      setSuccess(`${queueForm.name} created`);
      setQueueForm({ name: '', description: '', memberIds: [] });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createMilestone = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/case-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: milestoneForm.caseId,
          milestoneName: milestoneForm.milestoneName,
          targetDate: new Date(milestoneForm.targetDate).toISOString(),
          status: 'OPEN',
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create milestone');
      setSuccess(`${milestoneForm.milestoneName} milestone created`);
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
            <Typography variant="h4">Service Operations</Typography>
            <Typography color="text.secondary">Manage case queues and service milestones for SLA-driven support operations.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px minmax(0, 1fr)' }, gap: 3 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <QueueIcon color="primary" />
                  <Typography variant="h6">New Case Queue</Typography>
                </Stack>
                <Stack spacing={2}>
                  <TextField size="small" label="Name" value={queueForm.name} onChange={(event) => setQueueForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <TextField label="Description" multiline minRows={2} value={queueForm.description} onChange={(event) => setQueueForm((prev) => ({ ...prev, description: event.target.value }))} />
                  <FormControl size="small">
                    <InputLabel>Members</InputLabel>
                    <Select
                      multiple
                      label="Members"
                      value={queueForm.memberIds}
                      onChange={(event) => setQueueForm((prev) => ({ ...prev, memberIds: event.target.value as string[] }))}
                      renderValue={(selected) => selected.map((id) => users.find((user) => user.id === id)?.name || id).join(', ')}
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Checkbox checked={queueForm.memberIds.includes(user.id)} />
                          <ListItemText primary={user.name} secondary={user.email} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={createQueue} disabled={saving || !queueForm.name.trim()}>Create Queue</Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <TimelapseIcon color="primary" />
                  <Typography variant="h6">New Milestone</Typography>
                </Stack>
                <Stack spacing={2}>
                  <FormControl size="small">
                    <InputLabel>Case</InputLabel>
                    <Select label="Case" value={milestoneForm.caseId} onChange={(event) => setMilestoneForm((prev) => ({ ...prev, caseId: event.target.value }))}>
                      {cases.map((caseItem) => (
                        <MenuItem key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber} - {caseItem.subject}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField size="small" label="Milestone" value={milestoneForm.milestoneName} onChange={(event) => setMilestoneForm((prev) => ({ ...prev, milestoneName: event.target.value }))} />
                  <TextField size="small" label="Target Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={milestoneForm.targetDate} onChange={(event) => setMilestoneForm((prev) => ({ ...prev, targetDate: event.target.value }))} />
                  <Button variant="contained" onClick={createMilestone} disabled={saving || !milestoneForm.caseId || !milestoneForm.milestoneName || !milestoneForm.targetDate}>
                    Create Milestone
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Case Queues</Typography>
                {loading ? <CircularProgress /> : queues.length === 0 ? (
                  <Typography color="text.secondary">No queues created.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Queue</TableCell>
                        <TableCell>Members</TableCell>
                        <TableCell>Cases</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queues.map((queue) => (
                        <TableRow key={queue.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...queue, recordType: 'Case Queue' })}>
                          <TableCell>
                            <Typography fontWeight={700}>{queue.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{queue.description || '-'}</Typography>
                          </TableCell>
                          <TableCell>{queue.memberIds.map((id) => users.find((user) => user.id === id)?.name || id).join(', ') || '-'}</TableCell>
                          <TableCell>{queue._count?.cases || 0}</TableCell>
                          <TableCell><Chip size="small" label={queue.isActive ? 'Active' : 'Inactive'} color={queue.isActive ? 'success' : 'default'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Case Milestones</Typography>
                {milestones.length === 0 ? (
                  <Typography color="text.secondary">No milestones created.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Milestone</TableCell>
                        <TableCell>Case</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {milestones.map((milestone) => (
                        <TableRow key={milestone.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...milestone, recordType: 'Case Milestone', case: cases.find((caseItem) => caseItem.id === milestone.caseId)?.caseNumber || milestone.caseId })}>
                          <TableCell>{milestone.milestoneName}</TableCell>
                          <TableCell>{cases.find((caseItem) => caseItem.id === milestone.caseId)?.caseNumber || milestone.caseId}</TableCell>
                          <TableCell>{new Date(milestone.targetDate).toLocaleString()}</TableCell>
                          <TableCell><Chip size="small" label={milestone.status} color={milestone.status === 'COMPLETED' ? 'success' : milestone.status === 'VIOLATED' ? 'error' : 'warning'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title={selectedRecord?.recordType ? `${selectedRecord.recordType} Details` : 'Service Record Details'}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
