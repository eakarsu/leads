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
import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type Client = { id: string; name: string; industry: string };
type Territory = {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  regions?: string | null;
  isActive: boolean;
  client?: Client;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Territory request failed';
}

export default function TerritoriesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    clientId: '',
    name: '',
    description: '',
    regions: 'North America, West Coast',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [clientsResponse, territoriesResponse] = await Promise.all([
        fetch('/api/clients?pageSize=100'),
        fetch('/api/territories'),
      ]);
      const clientsPayload = await clientsResponse.json() as { error?: string; data?: Client[] };
      const territoriesPayload = await territoriesResponse.json() as Territory[] | { error?: string };
      if (!clientsResponse.ok) throw new Error(clientsPayload.error || 'Failed to load clients');
      if (!territoriesResponse.ok) throw new Error(Array.isArray(territoriesPayload) ? 'Failed to load territories' : territoriesPayload.error || 'Failed to load territories');

      const clientRows = clientsPayload.data || [];
      setClients(clientRows);
      setTerritories(Array.isArray(territoriesPayload) ? territoriesPayload : []);
      if (!form.clientId && clientRows[0]) {
        setForm((prev) => ({ ...prev, clientId: clientRows[0].id }));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [form.clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTerritory = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create territory');
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
            <Typography variant="h4">Sales Territories</Typography>
            <Typography color="text.secondary">Define client sales territories, regions, and active assignment coverage.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <MapIcon color="primary" />
                <Typography variant="h6">New Territory</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl size="small">
                  <InputLabel>Client</InputLabel>
                  <Select label="Client" value={form.clientId} onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField size="small" label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                <TextField size="small" label="Regions" value={form.regions} onChange={(event) => setForm((prev) => ({ ...prev, regions: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="Active" />
                <Button variant="contained" startIcon={<SaveIcon />} onClick={createTerritory} disabled={saving || !form.clientId || !form.name.trim()}>
                  Create Territory
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Territories</Typography>
              {loading ? <CircularProgress /> : territories.length === 0 ? (
                <Typography color="text.secondary">No territories created.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Territory</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Regions</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {territories.map((territory) => (
                      <TableRow key={territory.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(territory)}>
                        <TableCell>
                          <Typography fontWeight={700}>{territory.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{territory.description || '-'}</Typography>
                        </TableCell>
                        <TableCell>{territory.client?.name || clients.find((client) => client.id === territory.clientId)?.name || territory.clientId}</TableCell>
                        <TableCell>{territory.regions || '-'}</TableCell>
                        <TableCell><Chip size="small" label={territory.isActive ? 'Active' : 'Inactive'} color={territory.isActive ? 'success' : 'default'} /></TableCell>
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
          title="Territory Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
