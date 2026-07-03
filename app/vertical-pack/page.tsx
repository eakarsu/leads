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
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type Pack = {
  id: string;
  industry: string;
  installedAt: string;
  customObjects: string[];
  workflows: string[];
  dashboards: string[];
};

function labelIndustry(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Vertical pack request failed';
}

export default function VerticalPackPage() {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [installed, setInstalled] = useState<Pack[]>([]);
  const [industry, setIndustry] = useState('healthcare');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/vertical-pack');
      const payload = await response.json() as { error?: string; catalog?: string[]; installed?: Pack[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load vertical packs');
      setCatalog(payload.catalog || []);
      setInstalled(payload.installed || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const install = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/vertical-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry }),
      });
      const payload = await response.json() as { error?: string; pack?: Pack };
      if (!response.ok) throw new Error(payload.error || 'Failed to install pack');
      setSuccess(`${labelIndustry(payload.pack?.industry || industry)} pack installed`);
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
            <Typography variant="h4">Vertical Solution Packs</Typography>
            <Typography color="text.secondary">Install industry-specific CRM objects, workflows, and dashboards.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <BusinessCenterIcon color="primary" />
                <Typography variant="h6">Install Pack</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl size="small">
                  <InputLabel>Industry</InputLabel>
                  <Select label="Industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                    {(catalog.length ? catalog : ['healthcare', 'financial_services', 'manufacturing']).map((item) => (
                      <MenuItem key={item} value={item}>{labelIndustry(item)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" startIcon={<CloudDownloadIcon />} onClick={install}>Install Industry Pack</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Installed Packs</Typography>
              {loading ? <CircularProgress /> : installed.length === 0 ? (
                <Typography color="text.secondary">No vertical packs installed yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Industry</TableCell>
                      <TableCell>Objects</TableCell>
                      <TableCell>Workflows</TableCell>
                      <TableCell>Dashboards</TableCell>
                      <TableCell>Installed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {installed.map((pack) => (
                      <TableRow key={pack.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(pack)}>
                        <TableCell><Chip size="small" label={labelIndustry(pack.industry)} color="primary" /></TableCell>
                        <TableCell>{pack.customObjects.join(', ')}</TableCell>
                        <TableCell>{pack.workflows.join(', ')}</TableCell>
                        <TableCell>{pack.dashboards.join(', ')}</TableCell>
                        <TableCell>{new Date(pack.installedAt).toLocaleString()}</TableCell>
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
          title="Vertical Solution Pack Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
