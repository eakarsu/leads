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
  Typography,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type Opportunity = { id: string; name: string; amount: number; stage: string };
type LedgerEntry = { id: string; sourceId: string; amount: number; recognizedAt: string; glAccount: string; status: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Financial sync request failed';
}

export default function FinancialSyncPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [opportunityId, setOpportunityId] = useState('');
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [oppsResponse, ledgerResponse] = await Promise.all([
        fetch('/api/opportunities?pageSize=50'),
        fetch('/api/financial-sync'),
      ]);
      const oppsPayload = await oppsResponse.json() as { error?: string; data?: Opportunity[] };
      const ledgerPayload = await ledgerResponse.json() as { error?: string; entries?: LedgerEntry[] };
      if (!oppsResponse.ok) throw new Error(oppsPayload.error || 'Failed to load opportunities');
      if (!ledgerResponse.ok) throw new Error(ledgerPayload.error || 'Failed to load ledger');
      setOpportunities(oppsPayload.data || []);
      setEntries(ledgerPayload.entries || []);
      if (!opportunityId && oppsPayload.data?.[0]) setOpportunityId(oppsPayload.data[0].id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/financial-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, force }),
      });
      const payload = await response.json() as { error?: string; entry?: LedgerEntry; integrations?: { message?: string } };
      if (!response.ok) throw new Error(payload.error || 'Financial sync failed');
      setSuccess(`Revenue entry ${payload.entry?.id || ''} ${payload.entry?.status || 'created'}. ${payload.integrations?.message || ''}`);
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
            <Typography variant="h4">Financial Sync</Typography>
            <Typography color="text.secondary">Create invoice-ready revenue recognition entries from closed-won opportunities.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <PaidIcon color="primary" />
                <Typography variant="h6">Run Sync</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Opportunity</InputLabel>
                  <Select label="Opportunity" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>
                    {opportunities.map((opp) => (
                      <MenuItem key={opp.id} value={opp.id}>{opp.name} - ${Number(opp.amount || 0).toLocaleString()} - {opp.stage}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel control={<Checkbox checked={force} onChange={(event) => setForce(event.target.checked)} />} label="Force sync if not Closed Won" />
                <Button variant="contained" startIcon={<SyncIcon />} disabled={!opportunityId} onClick={sync}>Create Revenue Entry</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue Ledger</Typography>
              {loading ? <CircularProgress /> : entries.length === 0 ? (
                <Typography color="text.secondary">No revenue entries yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Entry</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>GL Account</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Recognized</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(entry)}>
                        <TableCell>{entry.id}</TableCell>
                        <TableCell>{entry.sourceId}</TableCell>
                        <TableCell>${Number(entry.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{entry.glAccount}</TableCell>
                        <TableCell><Chip size="small" label={entry.status} color={entry.status === 'posted' ? 'success' : 'warning'} /></TableCell>
                        <TableCell>{new Date(entry.recognizedAt).toLocaleString()}</TableCell>
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
          title="Revenue Ledger Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
