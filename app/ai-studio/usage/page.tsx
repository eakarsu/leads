'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

interface UsageFeature {
  feature: string;
  calls: number;
  successCalls: number;
  errorCalls: number;
  tokens: number;
  durationMs: number;
  models: Record<string, number>;
}

interface UsageResponse {
  windowDays: number;
  since: string;
  totals: { calls: number; successCalls: number; errorCalls: number; tokens: number; avgDurationMs: number };
  features: UsageFeature[];
  topUsers: { userId: string | null; calls: number; tokens: number }[];
}

export default function AIUsagePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/usage?days=${d}`);
      if (res.status === 503) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'AI service unavailable');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `Request failed (${res.status})`);
        return;
      }
      const j = (await res.json()) as UsageResponse;
      setData(j);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(days);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">AI Usage</Typography>
          <Chip label={`Window: ${data?.windowDays ?? days}d`} size="small" />
        </Stack>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <form onSubmit={reload}>
              <Stack direction="row" spacing={2} alignItems="end">
                <TextField
                  select
                  size="small"
                  label="Days"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  sx={{ width: 140 }}
                >
                  {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : 'Reload'}
                </Button>
              </Stack>
            </form>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </CardContent>
        </Card>

        {data && (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                  <Stat label="Total calls" value={data.totals.calls.toLocaleString()} />
                  <Stat label="Success" value={data.totals.successCalls.toLocaleString()} />
                  <Stat label="Errors" value={data.totals.errorCalls.toLocaleString()} />
                  <Stat label="Tokens" value={data.totals.tokens.toLocaleString()} />
                  <Stat label="Avg duration" value={`${data.totals.avgDurationMs} ms`} />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" mb={1}>By feature</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell align="right">Calls</TableCell>
                      <TableCell align="right">Errors</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                      <TableCell align="right">Avg duration (ms)</TableCell>
                      <TableCell>Models</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.features.map((f) => (
                      <TableRow key={f.feature}>
                        <TableCell><code>{f.feature}</code></TableCell>
                        <TableCell align="right">{f.calls}</TableCell>
                        <TableCell align="right">{f.errorCalls}</TableCell>
                        <TableCell align="right">{f.tokens.toLocaleString()}</TableCell>
                        <TableCell align="right">{f.calls > 0 ? Math.round(f.durationMs / f.calls) : 0}</TableCell>
                        <TableCell>
                          {Object.entries(f.models).map(([m, c]) => (
                            <Chip key={m} size="small" label={`${m}: ${c}`} sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.features.length === 0 && (
                      <TableRow><TableCell colSpan={6}><Typography color="text.secondary">No AI calls in this window.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" mb={1}>Top users</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="right">Calls</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topUsers.map((u) => (
                      <TableRow key={u.userId || 'unknown'}>
                        <TableCell><code>{u.userId || 'unknown'}</code></TableCell>
                        <TableCell align="right">{u.calls}</TableCell>
                        <TableCell align="right">{u.tokens.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {data.topUsers.length === 0 && (
                      <TableRow><TableCell colSpan={3}><Typography color="text.secondary">No users in this window.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5">{value}</Typography>
    </Box>
  );
}
