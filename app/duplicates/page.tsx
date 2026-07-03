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
  Divider,
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
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import RefreshIcon from '@mui/icons-material/Refresh';
import RuleIcon from '@mui/icons-material/Rule';
import SearchIcon from '@mui/icons-material/Search';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type DuplicateRule = {
  id: string;
  name: string;
  description?: string | null;
  objectType: string;
  matchCriteria: { fields?: string[]; matchType?: string };
  isActive: boolean;
  actionOnCreate: string;
  actionOnEdit: string;
};

type DuplicateSet = {
  id: string;
  objectType: string;
  recordIds: string[];
  masterRecordId?: string | null;
  status: string;
  createdAt: string;
};

type DuplicateRecord = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
};

const objectFields: Record<string, string[]> = {
  Lead: ['fullName', 'email', 'phone', 'company'],
  Contact: ['firstName', 'lastName', 'email', 'phone'],
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected duplicate management error';
}

function getRecordLabel(record: DuplicateRecord) {
  return record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.email || record.id;
}

export default function DuplicatesPage() {
  const [rules, setRules] = useState<DuplicateRule[]>([]);
  const [sets, setSets] = useState<DuplicateSet[]>([]);
  const [matches, setMatches] = useState<DuplicateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    objectType: 'Lead',
    fields: 'email,phone',
    matchType: 'EXACT',
    actionOnCreate: 'ALERT',
    actionOnEdit: 'ALERT',
  });
  const [scanForm, setScanForm] = useState({
    objectType: 'Lead',
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });

  const activeFields = useMemo(() => objectFields[scanForm.objectType] || [], [scanForm.objectType]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rulesResponse, setsResponse] = await Promise.all([
        fetch('/api/duplicates?type=rules'),
        fetch('/api/duplicates?status=PENDING'),
      ]);
      const rulesPayload = await rulesResponse.json() as DuplicateRule[] | { error?: string };
      const setsPayload = await setsResponse.json() as DuplicateSet[] | { error?: string };

      if (!rulesResponse.ok) {
        throw new Error(Array.isArray(rulesPayload) ? 'Failed to load duplicate rules' : rulesPayload.error || 'Failed to load duplicate rules');
      }
      if (!setsResponse.ok) {
        throw new Error(Array.isArray(setsPayload) ? 'Failed to load duplicate sets' : setsPayload.error || 'Failed to load duplicate sets');
      }

      setRules(Array.isArray(rulesPayload) ? rulesPayload : []);
      setSets(Array.isArray(setsPayload) ? setsPayload : []);
    } catch (err) {
      setError(getErrorMessage(err));
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
    try {
      const fields = ruleForm.fields.split(',').map((field) => field.trim()).filter(Boolean);
      const response = await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleForm.name,
          description: ruleForm.description,
          objectType: ruleForm.objectType,
          matchCriteria: { fields, matchType: ruleForm.matchType },
          actionOnCreate: ruleForm.actionOnCreate,
          actionOnEdit: ruleForm.actionOnEdit,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create duplicate rule');
      setRuleForm((prev) => ({ ...prev, name: '', description: '' }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const scanDuplicates = async () => {
    setSaving(true);
    setError('');
    setMatches([]);
    try {
      const recordData = activeFields.reduce<Record<string, string>>((acc, field) => {
        const value = scanForm[field as keyof typeof scanForm];
        if (typeof value === 'string' && value.trim()) acc[field] = value.trim();
        return acc;
      }, {});

      const response = await fetch('/api/duplicates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find',
          objectType: scanForm.objectType,
          recordData,
        }),
      });
      const payload = await response.json() as { error?: string; duplicates?: DuplicateRecord[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to scan duplicates');
      setMatches(payload.duplicates || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateDuplicateSet = async (set: DuplicateSet, action: 'merge' | 'ignore') => {
    setError('');
    try {
      const response = await fetch('/api/duplicates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          duplicateSetId: set.id,
          masterRecordId: action === 'merge' ? set.recordIds[0] : undefined,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update duplicate set');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Duplicate Management</Typography>
            <Typography color="text.secondary">
              Configure duplicate rules, scan CRM records, and resolve duplicate record sets.
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <RuleIcon color="primary" />
                  <Typography variant="h6">New Duplicate Rule</Typography>
                </Stack>
                <Stack spacing={2}>
                  <TextField label="Rule Name" size="small" value={ruleForm.name} onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <TextField label="Description" size="small" value={ruleForm.description} onChange={(event) => setRuleForm((prev) => ({ ...prev, description: event.target.value }))} />
                  <FormControl size="small">
                    <InputLabel>Object</InputLabel>
                    <Select label="Object" value={ruleForm.objectType} onChange={(event) => setRuleForm((prev) => ({ ...prev, objectType: event.target.value }))}>
                      <MenuItem value="Lead">Lead</MenuItem>
                      <MenuItem value="Contact">Contact</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Match Fields" size="small" helperText="Comma-separated fields" value={ruleForm.fields} onChange={(event) => setRuleForm((prev) => ({ ...prev, fields: event.target.value }))} />
                  <FormControl size="small">
                    <InputLabel>Match Type</InputLabel>
                    <Select label="Match Type" value={ruleForm.matchType} onChange={(event) => setRuleForm((prev) => ({ ...prev, matchType: event.target.value }))}>
                      <MenuItem value="EXACT">Exact</MenuItem>
                      <MenuItem value="FUZZY">Fuzzy</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={createRule} disabled={saving || !ruleForm.name.trim()} startIcon={<RuleIcon />}>
                    Create Rule
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <SearchIcon color="primary" />
                  <Typography variant="h6">Scan Record</Typography>
                </Stack>
                <Stack spacing={2}>
                  <FormControl size="small">
                    <InputLabel>Object</InputLabel>
                    <Select label="Object" value={scanForm.objectType} onChange={(event) => setScanForm((prev) => ({ ...prev, objectType: event.target.value }))}>
                      <MenuItem value="Lead">Lead</MenuItem>
                      <MenuItem value="Contact">Contact</MenuItem>
                    </Select>
                  </FormControl>
                  {activeFields.map((field) => (
                    <TextField
                      key={field}
                      label={field}
                      size="small"
                      value={scanForm[field as keyof typeof scanForm]}
                      onChange={(event) => setScanForm((prev) => ({ ...prev, [field]: event.target.value }))}
                    />
                  ))}
                  <Button variant="contained" onClick={scanDuplicates} disabled={saving} startIcon={<CompareArrowsIcon />}>
                    Find Duplicates
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Duplicate Rules</Typography>
                <Divider sx={{ mb: 2 }} />
                {loading ? <CircularProgress /> : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Object</TableCell>
                        <TableCell>Criteria</TableCell>
                        <TableCell>Actions</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...rule, recordType: 'Duplicate Rule' })}>
                          <TableCell>
                            <Typography fontWeight={700}>{rule.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{rule.description || 'No description'}</Typography>
                          </TableCell>
                          <TableCell>{rule.objectType}</TableCell>
                          <TableCell>{(rule.matchCriteria.fields || []).join(', ')} ({rule.matchCriteria.matchType || 'EXACT'})</TableCell>
                          <TableCell>Create: {rule.actionOnCreate}, Edit: {rule.actionOnEdit}</TableCell>
                          <TableCell><Chip size="small" label={rule.isActive ? 'Active' : 'Inactive'} color={rule.isActive ? 'success' : 'default'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Scan Results</Typography>
                {matches.length === 0 ? (
                  <Typography color="text.secondary">No matching records from the latest scan.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Record</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Company</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matches.map((record) => (
                        <TableRow key={record.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...record, recordType: 'Scan Match' })}>
                          <TableCell>{getRecordLabel(record)}</TableCell>
                          <TableCell>{record.email || '-'}</TableCell>
                          <TableCell>{record.phone || '-'}</TableCell>
                          <TableCell>{record.company || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pending Duplicate Sets</Typography>
                {sets.length === 0 ? (
                  <Typography color="text.secondary">No pending duplicate sets.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Object</TableCell>
                        <TableCell>Record IDs</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sets.map((set) => (
                        <TableRow key={set.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...set, recordType: 'Duplicate Set' })}>
                          <TableCell>{set.objectType}</TableCell>
                          <TableCell>{set.recordIds.join(', ')}</TableCell>
                          <TableCell>{new Date(set.createdAt).toLocaleString()}</TableCell>
                          <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                            <Button size="small" startIcon={<DoneAllIcon />} onClick={() => updateDuplicateSet(set, 'merge')} disabled={set.recordIds.length === 0}>
                              Merge
                            </Button>
                            <Button size="small" color="warning" startIcon={<NotInterestedIcon />} onClick={() => updateDuplicateSet(set, 'ignore')}>
                              Ignore
                            </Button>
                          </TableCell>
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
          title={selectedRecord?.recordType ? `${selectedRecord.recordType} Details` : 'Duplicate Details'}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
