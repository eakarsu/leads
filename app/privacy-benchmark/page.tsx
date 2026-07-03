'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShieldIcon from '@mui/icons-material/Shield';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type BenchmarkResult = {
  metric: string;
  cohort: { industry?: string; region?: string; tenants: number };
  estimate: number;
  noiseEpsilon: number;
  ciLowerBound: number;
  ciUpperBound: number;
  sampleSizeAdequate: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Benchmark request failed';
}

export default function PrivacyBenchmarkPage() {
  const [metric, setMetric] = useState('avg_deal_size');
  const [industry, setIndustry] = useState('SaaS');
  const [region, setRegion] = useState('North America');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const runBenchmark = async () => {
    setError('');
    try {
      const response = await fetch('/api/privacy-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, industry, region }),
      });
      const payload = await response.json() as { error?: string; result?: BenchmarkResult };
      if (!response.ok) throw new Error(payload.error || 'Failed to calculate benchmark');
      setResult(payload.result || null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Privacy Benchmarks</Typography>
            <Typography color="text.secondary">Compare performance against anonymized cohorts with differential privacy noise.</Typography>
          </Box>
          <Button variant="contained" startIcon={<AnalyticsIcon />} onClick={runBenchmark}>Run Benchmark</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
          <Card sx={{ cursor: result ? 'pointer' : 'default' }} onClick={() => result && setSelectedRecord(result)}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <ShieldIcon color="primary" />
                <Typography variant="h6">Benchmark Request</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl size="small">
                  <InputLabel>Metric</InputLabel>
                  <Select label="Metric" value={metric} onChange={(event) => setMetric(event.target.value)}>
                    <MenuItem value="avg_deal_size">Average Deal Size</MenuItem>
                    <MenuItem value="win_rate">Win Rate</MenuItem>
                    <MenuItem value="cycle_days">Sales Cycle Days</MenuItem>
                    <MenuItem value="leads_per_rep">Leads Per Rep</MenuItem>
                  </Select>
                </FormControl>
                <TextField size="small" label="Industry" value={industry} onChange={(event) => setIndustry(event.target.value)} />
                <TextField size="small" label="Region" value={region} onChange={(event) => setRegion(event.target.value)} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Benchmark Result</Typography>
              {!result ? (
                <Typography color="text.secondary">Run a benchmark to see anonymized cohort performance.</Typography>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`${result.cohort.tenants} tenants`} color={result.sampleSizeAdequate ? 'success' : 'warning'} />
                    <Chip label={`epsilon ${result.noiseEpsilon}`} />
                    <Chip label={result.cohort.industry || 'All industries'} />
                    <Chip label={result.cohort.region || 'All regions'} />
                  </Stack>
                  <Typography variant="h3">{result.metric === 'win_rate' ? `${(result.estimate * 100).toFixed(1)}%` : result.estimate.toLocaleString()}</Typography>
                  <Typography color="text.secondary">Confidence interval: {result.ciLowerBound.toLocaleString()} to {result.ciUpperBound.toLocaleString()}</Typography>
                  <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, result.cohort.tenants))} />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Privacy Benchmark Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
