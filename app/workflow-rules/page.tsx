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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import RuleIcon from '@mui/icons-material/Rule';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type WorkflowRule = {
  id: string;
  name: string;
  description?: string | null;
  objectType: string;
  triggerType: string;
  conditions: { field?: string; operator?: string; value?: string };
  actions: { type?: string; target?: string; value?: string };
  isActive: boolean;
  priority: number;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Workflow rule request failed';
}

export default function WorkflowRulesPage() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    objectType: 'Lead',
    triggerType: 'created_or_updated',
    conditionField: 'status',
    conditionOperator: 'equals',
    conditionValue: 'NEW',
    actionType: 'create_task',
    actionTarget: 'owner',
    actionValue: 'Follow up with new lead',
    priority: '10',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/workflow-rules?pageSize=100');
      const payload = await response.json() as { error?: string; data?: WorkflowRule[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load workflow rules');
      setRules(payload.data || []);
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
      const response = await fetch('/api/workflow-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          objectType: form.objectType,
          triggerType: form.triggerType,
          conditions: {
            field: form.conditionField,
            operator: form.conditionOperator,
            value: form.conditionValue,
          },
          actions: {
            type: form.actionType,
            target: form.actionTarget,
            value: form.actionValue,
          },
          isActive: form.isActive,
          priority: Number(form.priority || 0),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create workflow rule');
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
            <Typography variant="h4">Workflow Rules</Typography>
            <Typography color="text.secondary">Create rule-based CRM automation for record triggers, conditions, and actions.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <RuleIcon color="primary" />
                <Typography variant="h6">New Workflow Rule</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField size="small" label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Object</InputLabel>
                    <Select label="Object" value={form.objectType} onChange={(event) => setForm((prev) => ({ ...prev, objectType: event.target.value }))}>
                      <MenuItem value="Lead">Lead</MenuItem>
                      <MenuItem value="Contact">Contact</MenuItem>
                      <MenuItem value="Opportunity">Opportunity</MenuItem>
                      <MenuItem value="Case">Case</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Trigger</InputLabel>
                    <Select label="Trigger" value={form.triggerType} onChange={(event) => setForm((prev) => ({ ...prev, triggerType: event.target.value }))}>
                      <MenuItem value="created">Created</MenuItem>
                      <MenuItem value="updated">Updated</MenuItem>
                      <MenuItem value="created_or_updated">Created or Updated</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="Condition Field" value={form.conditionField} onChange={(event) => setForm((prev) => ({ ...prev, conditionField: event.target.value }))} />
                  <TextField size="small" label="Operator" value={form.conditionOperator} onChange={(event) => setForm((prev) => ({ ...prev, conditionOperator: event.target.value }))} />
                </Stack>
                <TextField size="small" label="Condition Value" value={form.conditionValue} onChange={(event) => setForm((prev) => ({ ...prev, conditionValue: event.target.value }))} />
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="Action Type" value={form.actionType} onChange={(event) => setForm((prev) => ({ ...prev, actionType: event.target.value }))} />
                  <TextField size="small" label="Target" value={form.actionTarget} onChange={(event) => setForm((prev) => ({ ...prev, actionTarget: event.target.value }))} />
                </Stack>
                <TextField size="small" label="Action Value" value={form.actionValue} onChange={(event) => setForm((prev) => ({ ...prev, actionValue: event.target.value }))} />
                <TextField size="small" label="Priority" type="number" value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="Active" />
                <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={createRule} disabled={saving || !form.name.trim()}>
                  Create Workflow Rule
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Rules</Typography>
              {loading ? <CircularProgress /> : rules.length === 0 ? (
                <Typography color="text.secondary">No workflow rules created.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule</TableCell>
                      <TableCell>Object</TableCell>
                      <TableCell>Trigger</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Action</TableCell>
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
                        <TableCell>{rule.objectType}</TableCell>
                        <TableCell>{rule.triggerType}</TableCell>
                        <TableCell>{rule.conditions.field} {rule.conditions.operator} {rule.conditions.value}</TableCell>
                        <TableCell>{rule.actions.type} - {rule.actions.value}</TableCell>
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
          title="Workflow Rule Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
