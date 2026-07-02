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

const presets = [
  'Configure lead routing, validation rules, and a revenue dashboard for enterprise SaaS sales.',
  'Create setup controls for healthcare sales teams: strict close dates, high-risk deal workflows, and compliance dashboard.',
  'Build a field-service sales setup with qualification fields, dispatch handoff workflow, and manager dashboard.',
];

export default function SetupAIPage() {
  const [objective, setObjective] = useState(presets[0]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recent, setRecent] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/setup-ai')
      .then((response) => response.json())
      .then(setRecent)
      .catch(() => {});
  }, []);

  const run = async (apply = false) => {
    setError('');
    apply ? setApplying(true) : setLoading(true);
    try {
      const response = await fetch('/api/setup-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, apply }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Setup AI failed');
      setResult(data);
      if (apply) {
        const refreshed = await fetch('/api/setup-ai').then((item) => item.json());
        setRecent(refreshed);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setApplying(false);
    }
  };

  const plan = result?.plan;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Setup with AI</Typography>
            <Typography color="text.secondary">
              Generate and apply CRM configuration for workflows, validation rules, custom fields, and dashboards.
            </Typography>
          </Box>
          <Chip label="Admin setup assistant" color="primary" />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {presets.map((preset) => (
                  <Button key={preset} size="small" variant="outlined" onClick={() => setObjective(preset)}>
                    {preset.split(':')[0]}
                  </Button>
                ))}
              </Box>
              <TextField
                label="Setup objective"
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                multiline
                rows={4}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => run(false)} disabled={loading || applying}>
                  {loading ? <CircularProgress size={18} /> : 'Generate Setup Plan'}
                </Button>
                <Button variant="outlined" onClick={() => run(true)} disabled={loading || applying || !objective.trim()}>
                  {applying ? <CircularProgress size={18} /> : 'Generate & Apply'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {plan && (
          <Stack spacing={2} mb={3}>
            <Alert severity={result.applied ? 'success' : 'info'}>
              <Typography fontWeight={700}>{result.applied ? 'Setup applied' : 'Setup plan ready'}</Typography>
              {plan.summary}
            </Alert>
            <PlanTable title="Workflows" rows={plan.workflows} columns={['name', 'objectType', 'triggerType']} />
            <PlanTable title="Validation Rules" rows={plan.validationRules} columns={['name', 'objectType', 'errorMessage']} />
            <PlanTable title="Dashboards" rows={plan.dashboards} columns={['name']} />
            <PlanTable title="Custom Objects" rows={plan.customObjects} columns={['name', 'label', 'pluralLabel']} />
          </Stack>
        )}

        <Typography variant="h6" gutterBottom>Recent Setup Artifacts</Typography>
        <Stack spacing={2}>
          <PlanTable title="Recent Workflows" rows={recent?.workflows || []} columns={['name', 'objectType', 'triggerType']} />
          <PlanTable title="Recent Validation Rules" rows={recent?.validationRules || []} columns={['name', 'objectType', 'errorMessage']} />
          <PlanTable title="Recent Dashboards" rows={recent?.dashboards || []} columns={['name']} />
        </Stack>
      </Box>
    </DashboardLayout>
  );
}

function PlanTable({ title, rows, columns }: { title: string; rows: any[]; columns: string[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{title}</Typography>
        {rows.length === 0 ? (
          <Typography color="text.secondary">No records yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => <TableCell key={column}>{formatLabel(column)}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id || `${title}-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column}>{String(row[column] ?? '-')}</TableCell>
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
