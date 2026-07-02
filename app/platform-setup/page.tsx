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
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

export default function PlatformSetupPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/platform-setup');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load platform setup');
      setData(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyPack = async () => {
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/platform-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: 'enterprise-salesforce-parity' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to apply setup pack');
      setSuccess('Enterprise setup pack applied: record types, page layouts, roles, permission sets, sharing rules, and webhook templates are ready.');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3} gap={2}>
          <Box>
            <Typography variant="h4">Platform Setup Center</Typography>
            <Typography color="text.secondary">
              Salesforce-style metadata coverage for record types, layouts, sharing, roles, permission sets, and webhook integrations.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load}>Refresh</Button>
            <Button variant="contained" onClick={applyPack} disabled={applying}>
              {applying ? <CircularProgress size={18} /> : 'Apply Enterprise Setup Pack'}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading && <CircularProgress />}

        {data && (
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Salesforce Platform Coverage</Typography>
                  <Chip
                    label={`${data.completenessScore}% complete`}
                    color={data.completenessScore >= 85 ? 'success' : data.completenessScore >= 60 ? 'warning' : 'error'}
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data.completenessScore}
                  color={data.completenessScore >= 85 ? 'success' : data.completenessScore >= 60 ? 'warning' : 'error'}
                  sx={{ height: 10, borderRadius: 1 }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Coverage Checklist</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Area</TableCell>
                      <TableCell>Detail</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.checks.map((check: any) => (
                      <TableRow key={check.key}>
                        <TableCell>
                          <Chip size="small" label={check.complete ? 'Ready' : 'Gap'} color={check.complete ? 'success' : 'warning'} />
                        </TableCell>
                        <TableCell>{check.label}</TableCell>
                        <TableCell>{check.detail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <RecordsTable title="Record Types" rows={data.recordTypes} columns={['objectType', 'name', 'isDefault']} />
              <RecordsTable title="Page Layouts" rows={data.pageLayouts} columns={['objectType', 'name', 'isDefault']} />
              <RecordsTable title="Sharing Rules" rows={data.sharingRules} columns={['objectType', 'name', 'accessLevel']} />
              <RecordsTable title="Permission Sets" rows={data.permissionSets} columns={['name', 'label', 'isCustom']} />
              <RecordsTable title="Role Hierarchy" rows={data.roles} columns={['name', 'label', 'allowForecast']} />
              <RecordsTable title="Webhook Templates" rows={data.webhookSubscriptions} columns={['name', 'url', 'isActive']} />
            </Box>
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

function RecordsTable({ title, rows, columns }: { title: string; rows: any[]; columns: string[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{title}</Typography>
        {rows.length === 0 ? (
          <Typography color="text.secondary">No records configured.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => <TableCell key={column}>{formatLabel(column)}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(0, 8).map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column}>{formatValue(row[column])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
}
