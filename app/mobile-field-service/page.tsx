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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type SyncBatch = {
  id: string;
  technicianId: string;
  workOrderUpdates: Array<{ workOrderId: string; status?: string; notes?: string; partsUsed?: string[]; gps?: { lat: number; lng: number } }>;
  receivedAt: string;
  appliedCount: number;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Mobile sync request failed';
}

export default function MobileFieldServicePage() {
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [technicianId, setTechnicianId] = useState('tech-demo-001');
  const [workOrderId, setWorkOrderId] = useState('WO-1001');
  const [status, setStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('Completed service visit, captured customer signature, and checked out replacement part.');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/mobile-field-service');
      const payload = await response.json() as { error?: string; batches?: SyncBatch[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load sync batches');
      setBatches(payload.batches || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitBatch = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/mobile-field-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          workOrderUpdates: [{
            workOrderId,
            status,
            notes,
            partsUsed: ['FILTER-20X20', 'THERMOSTAT-BATTERY'],
            signatureBase64: 'demo-signature',
            gps: { lat: 37.7749, lng: -122.4194 },
          }],
        }),
      });
      const payload = await response.json() as { error?: string; batch?: SyncBatch };
      if (!response.ok) throw new Error(payload.error || 'Failed to submit mobile batch');
      setSuccess(`Batch ${payload.batch?.id || ''} synced`);
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
            <Typography variant="h4">Mobile Field Service</Typography>
            <Typography color="text.secondary">Offline-first technician sync for work orders, GPS, signatures, notes, and parts usage.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <PhoneIphoneIcon color="primary" />
                <Typography variant="h6">Simulate Offline Sync</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Technician ID" value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} />
                <TextField size="small" label="Work Order ID" value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)} />
                <TextField size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} />
                <TextField label="Notes" multiline minRows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
                <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={submitBatch}>Upload Batch</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Sync Batches</Typography>
              {loading ? <CircularProgress /> : batches.length === 0 ? (
                <Typography color="text.secondary">No mobile batches received.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch</TableCell>
                      <TableCell>Technician</TableCell>
                      <TableCell>Applied</TableCell>
                      <TableCell>Work Orders</TableCell>
                      <TableCell>Received</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(batch)}>
                        <TableCell>{batch.id}</TableCell>
                        <TableCell>{batch.technicianId}</TableCell>
                        <TableCell><Chip size="small" label={batch.appliedCount} color="success" /></TableCell>
                        <TableCell>{batch.workOrderUpdates.map((item) => item.workOrderId).join(', ')}</TableCell>
                        <TableCell>{new Date(batch.receivedAt).toLocaleString()}</TableCell>
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
          title="Mobile Sync Batch Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
