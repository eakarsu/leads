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
  FormControlLabel,
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
import ForumIcon from '@mui/icons-material/Forum';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type ChatterGroup = {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  isArchived: boolean;
  owner?: { name: string; email: string };
  isMember: boolean;
  _count?: { members: number };
  createdAt: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Chatter group request failed';
}

export default function ChatterGroupsPage() {
  const [groups, setGroups] = useState<ChatterGroup[]>([]);
  const [type, setType] = useState('ALL');
  const [myGroups, setMyGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
    isArchived: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (type !== 'ALL') params.set('type', type);
      if (myGroups) params.set('myGroups', 'true');
      const response = await fetch(`/api/chatter-groups?${params.toString()}`);
      const payload = await response.json() as { error?: string; data?: ChatterGroup[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load groups');
      setGroups(payload.data || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [type, myGroups]);

  useEffect(() => {
    load();
  }, [load]);

  const createGroup = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/chatter-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create group');
      setSuccess(`${form.name} created`);
      setForm((prev) => ({ ...prev, name: '', description: '' }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const groupAction = async (group: ChatterGroup, action: 'join' | 'leave') => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/chatter-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, action }),
      });
      const payload = await response.json() as { error?: string; status?: string };
      if (!response.ok) throw new Error(payload.error || 'Group action failed');
      setSuccess(`${group.name}: ${payload.status || action}`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Chatter Groups</Typography>
            <Typography color="text.secondary">Create collaboration spaces and manage membership for sales and service teams.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="PUBLIC">Public</MenuItem>
                <MenuItem value="PRIVATE">Private</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <ForumIcon color="primary" />
                <Typography variant="h6">New Group</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField label="Description" multiline minRows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                <FormControl size="small">
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                    <MenuItem value="PUBLIC">Public</MenuItem>
                    <MenuItem value="PRIVATE">Private</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel control={<Checkbox checked={form.isArchived} onChange={(event) => setForm((prev) => ({ ...prev, isArchived: event.target.checked }))} />} label="Archived" />
                <FormControlLabel control={<Checkbox checked={myGroups} onChange={(event) => setMyGroups(event.target.checked)} />} label="Show my groups only" />
                <Button variant="contained" startIcon={<GroupAddIcon />} onClick={createGroup} disabled={saving || !form.name.trim()}>
                  Create Group
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Groups</Typography>
              {loading ? <CircularProgress /> : groups.length === 0 ? (
                <Typography color="text.secondary">No groups found.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Group</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Members</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(group)}>
                        <TableCell>
                          <Typography fontWeight={700}>{group.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{group.description || '-'}</Typography>
                        </TableCell>
                        <TableCell>{group.owner?.name || '-'}</TableCell>
                        <TableCell>{group._count?.members || 0}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Chip size="small" label={group.isPublic ? 'Public' : 'Private'} color={group.isPublic ? 'success' : 'default'} />
                            {group.isArchived && <Chip size="small" label="Archived" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                          <Button size="small" variant={group.isMember ? 'outlined' : 'contained'} onClick={() => groupAction(group, group.isMember ? 'leave' : 'join')}>
                            {group.isMember ? 'Leave' : 'Join'}
                          </Button>
                        </TableCell>
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
          title="Chatter Group Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
