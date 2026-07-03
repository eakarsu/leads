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
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RefreshIcon from '@mui/icons-material/Refresh';
import RuleIcon from '@mui/icons-material/Rule';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type AssignmentRule = {
  id: string;
  name: string;
  description?: string | null;
  criteria: { conditions?: Array<{ field: string; operator: string; value: string }> };
  assignmentMethod: string;
  assignToUserIds: string[];
  territoryId?: string | null;
  isActive: boolean;
  priority: number;
};

type UserOption = { id: string; name: string; email: string; role: string };
type TerritoryOption = { id: string; name: string; regions?: string[] };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Lead assignment request failed';
}

export default function LeadAssignmentPage() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [territories, setTerritories] = useState<TerritoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    field: 'industry',
    operator: 'equals',
    value: 'Technology',
    assignmentMethod: 'ROUND_ROBIN',
    assignToUserIds: [] as string[],
    territoryId: '',
    priority: '10',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rulesResponse, usersResponse, territoriesResponse] = await Promise.all([
        fetch('/api/lead-assignment'),
        fetch('/api/users'),
        fetch('/api/territories?isActive=true'),
      ]);
      const rulesPayload = await rulesResponse.json() as AssignmentRule[] | { error?: string };
      const usersPayload = await usersResponse.json() as UserOption[] | { error?: string };
      const territoriesPayload = await territoriesResponse.json() as TerritoryOption[] | { error?: string };

      if (!rulesResponse.ok) throw new Error(Array.isArray(rulesPayload) ? 'Failed to load rules' : rulesPayload.error || 'Failed to load rules');
      if (!usersResponse.ok) throw new Error(Array.isArray(usersPayload) ? 'Failed to load users' : usersPayload.error || 'Failed to load users');
      if (!territoriesResponse.ok) throw new Error(Array.isArray(territoriesPayload) ? 'Failed to load territories' : territoriesPayload.error || 'Failed to load territories');

      setRules(Array.isArray(rulesPayload) ? rulesPayload : []);
      setUsers(Array.isArray(usersPayload) ? usersPayload : []);
      setTerritories(Array.isArray(territoriesPayload) ? territoriesPayload : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createRule = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/lead-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          criteria: {
            conditions: [{ field: form.field, operator: form.operator, value: form.value }],
          },
          assignmentMethod: form.assignmentMethod,
          assignToUserIds: form.assignToUserIds,
          territoryId: form.territoryId || undefined,
          isActive: true,
          priority: Number(form.priority || 0),
        }),
      });
      const payload = await response.json() as { error?: string; name?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create assignment rule');
      setSuccess(`${form.name} created`);
      setForm((prev) => ({ ...prev, name: '', description: '' }));
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
            <Typography variant="h4">Lead Assignment Rules</Typography>
            <Typography color="text.secondary">Route leads by criteria, territory, priority, and assignment method.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <RuleIcon color="primary" />
                <Typography variant="h6">New Rule</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField size="small" label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="Field" value={form.field} onChange={(event) => setForm((prev) => ({ ...prev, field: event.target.value }))} />
                  <TextField size="small" label="Operator" value={form.operator} onChange={(event) => setForm((prev) => ({ ...prev, operator: event.target.value }))} />
                </Stack>
                <TextField size="small" label="Value" value={form.value} onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))} />
                <FormControl size="small">
                  <InputLabel>Method</InputLabel>
                  <Select label="Method" value={form.assignmentMethod} onChange={(event) => setForm((prev) => ({ ...prev, assignmentMethod: event.target.value }))}>
                    <MenuItem value="ROUND_ROBIN">Round Robin</MenuItem>
                    <MenuItem value="LOAD_BALANCED">Load Balanced</MenuItem>
                    <MenuItem value="TERRITORY">Territory</MenuItem>
                    <MenuItem value="MANUAL">Manual</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    multiple
                    label="Assign To"
                    value={form.assignToUserIds}
                    onChange={(event) => setForm((prev) => ({ ...prev, assignToUserIds: event.target.value as string[] }))}
                    renderValue={(selected) => selected.map((id) => users.find((user) => user.id === id)?.name || id).join(', ')}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Checkbox checked={form.assignToUserIds.includes(user.id)} />
                        <ListItemText primary={user.name} secondary={`${user.email} - ${user.role}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel>Territory</InputLabel>
                  <Select label="Territory" value={form.territoryId} onChange={(event) => setForm((prev) => ({ ...prev, territoryId: event.target.value }))}>
                    <MenuItem value="">None</MenuItem>
                    {territories.map((territory) => (
                      <MenuItem key={territory.id} value={territory.id}>{territory.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Priority" type="number" value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} />
                <Button variant="contained" startIcon={<AccountTreeIcon />} onClick={createRule} disabled={saving || !form.name.trim() || form.assignToUserIds.length === 0}>
                  Create Assignment Rule
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Rules</Typography>
              {loading ? <CircularProgress /> : rules.length === 0 ? (
                <Typography color="text.secondary">No assignment rules created.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule</TableCell>
                      <TableCell>Criteria</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Assignees</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(rule)}>
                        <TableCell>
                          <Typography fontWeight={700}>{rule.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{rule.description || '-'}</Typography>
                        </TableCell>
                        <TableCell>{(rule.criteria.conditions || []).map((item) => `${item.field} ${item.operator} ${item.value}`).join('; ')}</TableCell>
                        <TableCell>{rule.assignmentMethod.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{rule.assignToUserIds.map((id) => users.find((user) => user.id === id)?.name || id).join(', ')}</TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell><Chip size="small" label={rule.isActive ? 'Active' : 'Inactive'} color={rule.isActive ? 'success' : 'default'} /></TableCell>
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
          title="Lead Assignment Rule Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
