'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

export default function DataMaskSeedPage() {
  const [data, setData] = useState<any>(null);
  const [count, setCount] = useState(5);
  const [action, setAction] = useState('seed');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const payload = await fetch('/api/data-mask-seed').then((response) => response.json());
    setData(payload);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/data-mask-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, count }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Data action failed');
      setResult(payload);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Data Mask & Seed</Typography>
            <Typography color="text.secondary">
              Generate safe synthetic CRM data and preview masked records for demos, QA, and sandboxes.
            </Typography>
          </Box>
          <Chip label="Safe data tools" color="primary" />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
          {Object.entries(data?.counts || {}).map(([key, value]) => (
            <Card key={key} sx={{ minWidth: 180 }}>
              <CardContent>
                <Typography color="text.secondary">{formatLabel(key)}</Typography>
                <Typography variant="h5">{Number(value || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField select label="Action" value={action} onChange={(event) => setAction(event.target.value)} sx={{ minWidth: 220 }}>
                <MenuItem value="seed">Seed safe synthetic data</MenuItem>
                <MenuItem value="preview-mask">Preview masked lead data</MenuItem>
              </TextField>
              <TextField label="Count" type="number" value={count} onChange={(event) => setCount(Number(event.target.value))} sx={{ width: 140 }} />
              <Button variant="contained" onClick={run} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : 'Run'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {result?.created && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Created 1 client, 1 campaign, {result.created.leads.length} leads, {result.created.contacts.length} contacts, and {result.created.opportunities.length} opportunities.
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {result?.records ? 'Masked Preview' : 'Latest Mask Preview'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Company</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(result?.records || data?.preview || []).map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.phone || '-'}</TableCell>
                    <TableCell>{row.company || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
