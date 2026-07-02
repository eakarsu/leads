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

export default function SecurityCenterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/security-center');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load Security Center');
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

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Security Center</Typography>
            <Typography color="text.secondary">
              CRM posture, authentication hygiene, AI execution risk, and data exposure signals.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}

        {data && (
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Org Risk Score</Typography>
                  <Chip label={data.posture} color={data.riskScore >= 85 ? 'success' : data.riskScore >= 70 ? 'warning' : 'error'} />
                </Stack>
                <Typography variant="h3">{data.riskScore}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.riskScore}
                  color={data.riskScore >= 85 ? 'success' : data.riskScore >= 70 ? 'warning' : 'error'}
                  sx={{ mt: 1, height: 10, borderRadius: 1 }}
                />
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Metric label="Users" value={data.stats.users} />
              <Metric label="Admins" value={data.stats.admins} />
              <Metric label="Unverified Users" value={data.stats.unverifiedUsers} />
              <Metric label="AI Errors - 7d" value={data.stats.aiErrors} />
              <Metric label="Attachments" value={data.stats.attachments} />
              <Metric label="Inactive Controls" value={data.stats.inactiveValidationRules + data.stats.inactiveWorkflows} />
            </Box>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Findings</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Finding</TableCell>
                      <TableCell>Recommended Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.findings.map((finding: any) => (
                      <TableRow key={finding.key}>
                        <TableCell><Chip size="small" label={finding.severity} /></TableCell>
                        <TableCell>
                          <Typography fontWeight={700}>{finding.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{finding.detail}</Typography>
                        </TableCell>
                        <TableCell>{finding.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Field Changes</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Object</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell>Old</TableCell>
                      <TableCell>New</TableCell>
                      <TableCell>Changed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentFieldChanges.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.objectType}</TableCell>
                        <TableCell>{item.fieldName}</TableCell>
                        <TableCell>{item.oldValue || '-'}</TableCell>
                        <TableCell>{item.newValue || '-'}</TableCell>
                        <TableCell>{new Date(item.changedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h5">{Number(value || 0).toLocaleString()}</Typography>
      </CardContent>
    </Card>
  );
}
