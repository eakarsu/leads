'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Alert,
  MenuItem,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

type TabKey = 'agent' | 'activity' | 'forecast' | 'playbook' | 'lineage' | 'history';

const agentPresets = [
  { label: 'Pipeline Summary', value: 'Summarize the current sales pipeline by stage and call out the biggest revenue concentration risks.' },
  { label: 'Stalled Deals', value: 'List opportunities that have not moved in 30 days and recommend the next follow-up action for each.' },
  { label: 'Top Leads', value: 'Show the top 10 newest qualified leads and summarize which ones should be contacted first.' },
];

const activityPresets = [
  {
    label: 'Pricing Follow-Up',
    from: 'maya.chen@northstar-retail.example',
    subject: 'Pricing approval and rollout timeline',
    body: `Hi team,

We reviewed the proposal with our VP of Operations today. Budget is approved if we can keep implementation under 45 days. The main need is better lead routing visibility for our regional managers.

Can you send the security packet and a revised rollout plan by Friday? We are targeting a July 15 launch.

Best,
Maya`,
  },
  {
    label: 'Renewal Risk',
    from: 'jordan.reed@apexmanufacturing.example',
    subject: 'Contract renewal concerns',
    body: `Hello,

We are evaluating renewal options, but adoption has been slower than expected. The plant managers need clearer reporting and the team is concerned about support response times.

Please schedule time with our director next week to discuss whether the current package still fits.

Jordan`,
  },
  {
    label: 'Expansion Signal',
    from: 'sofia.martin@veridianhealth.example',
    subject: 'Additional teams for pilot',
    body: `Hi,

The pilot is going well and our compliance lead wants to include two more departments. If the pricing works, we may expand from 25 users to 90 users this quarter.

Can you share an enterprise quote and implementation checklist?

Sofia`,
  },
];

const forecastPresets = [
  { label: 'Monthly Fast', runs: 3, period: 'month' as const },
  { label: 'Monthly Deep', runs: 8, period: 'month' as const },
  { label: 'Quarterly', runs: 5, period: 'quarter' as const },
];

const playbookPresets = [
  { label: 'SaaS Qualified', industry: 'Software', status: 'QUALIFIED' },
  { label: 'Healthcare New', industry: 'Healthcare', status: 'NEW' },
  { label: 'Finance Nurture', industry: 'Finance', status: 'CONTACTED' },
];

const lineagePresets = [
  { label: 'Lead Status', objectType: 'Lead', field: 'status', url: '/api/leads' },
  { label: 'Lead Score', objectType: 'Lead', field: 'qualificationScore', url: '/api/leads' },
  { label: 'Lead Company', objectType: 'Lead', field: 'company', url: '/api/leads' },
];

const getLineagePresetValues = (field: string, record: any) => {
  const currentValue = record?.[field];

  if (field === 'status') {
    return {
      oldValue: currentValue === 'NEW' ? null : 'NEW',
      newValue: currentValue || 'NEW',
    };
  }

  if (field === 'qualificationScore') {
    const score = Number(currentValue ?? 0);
    return {
      oldValue: String(Math.max(0, score - 25)),
      newValue: String(score),
    };
  }

  if (field === 'company') {
    return {
      oldValue: 'Unknown Company',
      newValue: currentValue || 'Unassigned Company',
    };
  }

  return {
    oldValue: null,
    newValue: currentValue ?? '',
  };
};

async function createLineagePresetHistory(preset: (typeof lineagePresets)[number], record: any) {
  const values = getLineagePresetValues(preset.field, record);
  const response = await fetch('/api/field-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectType: preset.objectType,
      objectId: record.id,
      fieldName: preset.field,
      ...values,
    }),
  });

  await readJsonResponse(response);
}

const summarizeAIOutput = (item: any) => {
  if (item.errorMessage) return item.errorMessage;
  const output = item.output;
  if (!output) return '-';
  if (typeof output === 'string') return output.slice(0, 120);
  if (output.summary) return String(output.summary).slice(0, 120);
  if (output.narrative) return String(output.narrative).slice(0, 120);
  if (output.name) return String(output.name).slice(0, 120);
  if (output.playbook?.name) return String(output.playbook.name).slice(0, 120);
  return JSON.stringify(output).slice(0, 120);
};

const uniqueNotice = (message: string) => {
  const parts = message
    .split(/(?<=\.)\s+(?=AI result history is not available|Run Prisma migrations|Failed to load)/)
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(' ');
};

const formatLabel = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

const isDisplayValue = (value: unknown) =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

async function readJsonResponse(response: Response) {
  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 180) || 'The server returned an invalid response.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || data.warning || `Request failed with status ${response.status}`);
  }

  return data;
}

function DataPreview({ title, data }: { title: string; data: any }) {
  if (data?.error) {
    return <Alert severity="warning">{data.error}</Alert>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <Alert severity="info">
          No matching records found.
        </Alert>
      );
    }

    const columns = Object.keys(data[0] || {})
      .filter((key) => isDisplayValue(data[0]?.[key]))
      .slice(0, 5);

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column}>{formatLabel(column)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 10).map((row, index) => (
              <TableRow key={row.id || index}>
                {columns.map((column) => (
                  <TableCell key={column}>{String(row[column] ?? '-')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }

  if (data?.byStage) {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip label={`Total: $${Number(data.total || 0).toLocaleString()}`} />
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Stage</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(data.byStage).map(([stage, value]: [string, any]) => (
              <TableRow key={stage}>
                <TableCell>{stage}</TableCell>
                <TableCell align="right">{value.count ?? '-'}</TableCell>
                <TableCell align="right">${Number(value.total || 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }

  if (data && typeof data === 'object') {
    const rows = Object.entries(data).filter(([, value]) => isDisplayValue(value));
    if (rows.length === 0) {
      return (
        <Alert severity="info">
          The AI completed the request, but there are no displayable fields in the result.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Table size="small">
          <TableBody>
            {rows.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell width={220}>{formatLabel(key)}</TableCell>
                <TableCell>{String(value ?? '-')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }

  return (
    <Alert severity="info">
      {String(data || 'No result returned.')}
    </Alert>
  );
}

function AgentResultView({ result }: { result: any }) {
  const plan = result?.plan || {};
  const summary = plan.narrative || plan.summary || 'Agent completed the request.';

  return (
    <Stack spacing={2} mt={3}>
      <Alert severity={result?.error ? 'warning' : 'info'}>
        <Typography variant="body1" fontWeight={600}>{summary}</Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
          {plan.tool && <Chip size="small" label={`Tool: ${formatLabel(plan.tool)}`} />}
          {result?.data && Array.isArray(result.data) && <Chip size="small" label={`${result.data.length} records`} />}
        </Box>
      </Alert>
      {result?.data !== undefined && <DataPreview title="Results" data={result.data} />}
    </Stack>
  );
}

function ActivityResultView({ result }: { result: any }) {
  const data = result?.data;
  if (!data) return null;

  const linked = data.linkedTo || {};
  const bant = data.bant || {};
  const linkedRows = Object.entries(linked).filter(([, value]) => value);
  const actions = Array.isArray(data.suggestedActions) ? data.suggestedActions : [];

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        <Typography variant="body1" fontWeight={600}>{data.summary || 'Activity captured.'}</Typography>
      </Alert>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {data.sentiment && <Chip size="small" label={`Sentiment: ${formatLabel(data.sentiment)}`} />}
        {data.engagementDelta !== undefined && <Chip size="small" label={`Engagement: ${data.engagementDelta > 0 ? '+' : ''}${data.engagementDelta}`} />}
        {linkedRows.length > 0 ? (
          linkedRows.map(([key, value]) => (
            <Chip key={key} size="small" label={`${formatLabel(key)}: ${String(value).slice(0, 8)}`} />
          ))
        ) : (
          <Chip size="small" label="No CRM link found" />
        )}
      </Box>
      <Box>
        <Typography variant="subtitle2" gutterBottom>BANT Signals</Typography>
        <Table size="small">
          <TableBody>
            {['budget', 'authority', 'need', 'timeline'].map((key) => (
              <TableRow key={key}>
                <TableCell width={160}>{formatLabel(key)}</TableCell>
                <TableCell>{bant[key] || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {actions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Suggested Actions</Typography>
          <ul style={{ marginTop: 0 }}>
            {actions.map((action: string, index: number) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </Box>
      )}
    </Stack>
  );
}

export default function AIStudioPage() {
  const [tab, setTab] = useState<TabKey>('agent');
  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">AI Studio</Typography>
          <Chip label="claude-3-5-sonnet · 20 req/hr per user" size="small" />
        </Stack>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="agent" label="Conversational Agent" />
          <Tab value="activity" label="Activity Capture" />
          <Tab value="forecast" label="Ensemble Forecast" />
          <Tab value="playbook" label="Cadence Playbook" />
          <Tab value="lineage" label="Field Lineage" />
          <Tab value="history" label="History" />
        </Tabs>
        {tab === 'agent' && <AgentPanel />}
        {tab === 'activity' && <ActivityPanel />}
        {tab === 'forecast' && <ForecastPanel />}
        {tab === 'playbook' && <PlaybookPanel />}
        {tab === 'lineage' && <LineagePanel />}
        {tab === 'history' && <HistoryPanel />}
      </Box>
    </DashboardLayout>
  );
}

function AgentPanel() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }).then((x) => x.json());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Ask anything: "summarize Q3 pipeline by territory" · "list stalled opps"
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {agentPresets.map((preset) => (
            <Button key={preset.label} size="small" variant="outlined" onClick={() => setMessage(preset.value)}>
              {preset.label}
            </Button>
          ))}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the agent…"
        />
        <Box mt={2}>
          <Button variant="contained" onClick={submit} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Send'}
          </Button>
        </Box>
        {result && <AgentResultView result={result} />}
      </CardContent>
    </Card>
  );
}

function ActivityPanel() {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fillPreset = (preset: (typeof activityPresets)[number]) => {
    setFrom(preset.from);
    setSubject(preset.subject);
    setBody(preset.body);
  };
  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ai/activity-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, subject, body }),
      }).then((x) => x.json());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {activityPresets.map((preset) => (
              <Button key={preset.label} size="small" variant="outlined" onClick={() => fillPreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </Box>
          <TextField label="From email" value={from} onChange={(e) => setFrom(e.target.value)} fullWidth />
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth />
          <TextField label="Body" value={body} onChange={(e) => setBody(e.target.value)} fullWidth multiline rows={6} />
          <Button variant="contained" onClick={submit} disabled={loading || !from || !body}>
            {loading ? <CircularProgress size={18} /> : 'Capture & Link'}
          </Button>
          {result?.data && <ActivityResultView result={result} />}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ForecastPanel() {
  const [runs, setRuns] = useState(3);
  const [period, setPeriod] = useState<'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/ai/forecast-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs, period }),
      });
      const r = await readJsonResponse(response);
      setResult(r);
    } catch (err: any) {
      setError(err.message || 'Failed to run ensemble forecast.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {forecastPresets.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              variant="outlined"
              onClick={() => {
                setRuns(preset.runs);
                setPeriod(preset.period);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField label="Runs" type="number" size="small" value={runs} onChange={(e) => setRuns(Number(e.target.value))} />
          <TextField select label="Period" size="small" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
            <MenuItem value="month">month</MenuItem>
            <MenuItem value="quarter">quarter</MenuItem>
          </TextField>
          <Button variant="contained" onClick={run} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Run Ensemble'}
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {result?.ensemble?.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Mean</TableCell>
                <TableCell align="right">Low (95%)</TableCell>
                <TableCell align="right">High (95%)</TableCell>
                <TableCell align="right">SD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.ensemble.map((row: any) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">${row.mean.toLocaleString()}</TableCell>
                  <TableCell align="right">${row.low.toLocaleString()}</TableCell>
                  <TableCell align="right">${row.high.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.sd}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {result && result.ensemble?.length === 0 && (
          <Alert severity="warning">
            No forecast rows were returned. {result.successful === 0 ? 'All AI forecast runs failed.' : 'The AI returned data that could not be grouped into forecast periods.'}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function PlaybookPanel() {
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fillPreset = (preset: (typeof playbookPresets)[number]) => {
    setIndustry(preset.industry);
    setStatus(preset.status);
  };
  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ai/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, status }),
      }).then((x) => x.json());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {playbookPresets.map((preset) => (
            <Button key={preset.label} size="small" variant="outlined" onClick={() => fillPreset(preset)}>
              {preset.label}
            </Button>
          ))}
        </Box>
        <Stack direction="row" spacing={2} mb={2}>
          <TextField label="Industry" size="small" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          <TextField label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} />
          <Button variant="contained" onClick={run} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Generate Playbook'}
          </Button>
        </Stack>
        {result?.playbook && (
          <Box>
            <Typography variant="subtitle1">{result.playbook.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {result.playbook.segmentDescription}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Subject / Action</TableCell>
                  <TableCell>Rationale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(result.playbook.steps || []).map((s: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{s.day}</TableCell>
                    <TableCell><Chip size="small" label={s.channel} /></TableCell>
                    <TableCell>{s.subject || s.template?.slice(0, 80)}</TableCell>
                    <TableCell>{s.rationale}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function LineagePanel() {
  const [objectType, setObjectType] = useState('Lead');
  const [objectId, setObjectId] = useState('');
  const [field, setField] = useState('status');
  const [loading, setLoading] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fillPreset = async (preset: (typeof lineagePresets)[number]) => {
    setPresetLoading(true);
    setObjectType(preset.objectType);
    setField(preset.field);
    setResult(null);
    setError('');
    try {
      const historyResponse = await fetch(
        `/api/field-history?objectType=${encodeURIComponent(preset.objectType)}&fieldName=${encodeURIComponent(preset.field)}&limit=1`
      );
      const historyData = await readJsonResponse(historyResponse);
      const historyRows = Array.isArray(historyData) ? historyData : historyData.data || [];

      if (historyRows[0]?.objectId) {
        setObjectId(historyRows[0].objectId);
        return;
      }

      const response = await fetch(preset.url);
      const data = await readJsonResponse(response);
      const records = Array.isArray(data) ? data : data.data || [];
      if (records[0]?.id) {
        await createLineagePresetHistory(preset, records[0]);
        setObjectId(records[0].id);
      } else {
        setObjectId('');
        setError(`No ${preset.objectType} records found to fill the ID field.`);
      }
    } catch (err: any) {
      setObjectId('');
      setError(err.message || 'Failed to load a sample record.');
    } finally {
      setPresetLoading(false);
    }
  };
  const run = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/ai/field-lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectType, objectId, field }),
      });
      const r = await readJsonResponse(response);
      setResult(r);
    } catch (err: any) {
      setError(err.message || 'Failed to explain field lineage.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {lineagePresets.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              variant="outlined"
              onClick={() => fillPreset(preset)}
              disabled={presetLoading}
            >
              {presetLoading ? <CircularProgress size={14} /> : preset.label}
            </Button>
          ))}
        </Box>
        <Stack direction="row" spacing={2} mb={2}>
          <TextField select label="Type" size="small" value={objectType} onChange={(e) => setObjectType(e.target.value)}>
            {['Lead', 'Contact', 'Opportunity', 'Account'].map((o) => (
              <MenuItem key={o} value={o}>{o}</MenuItem>
            ))}
          </TextField>
          <TextField label="ID" size="small" value={objectId} onChange={(e) => setObjectId(e.target.value)} />
          <TextField label="Field" size="small" value={field} onChange={(e) => setField(e.target.value)} />
          <Button variant="contained" onClick={run} disabled={loading || !objectId}>
            {loading ? <CircularProgress size={18} /> : 'Explain'}
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {result?.narrative && (
          <Alert severity={result?.history?.length === 0 ? 'warning' : 'info'}>
            <Typography variant="body1" fontWeight={600}>{result.narrative}</Typography>
            <ul>
              {(result.evidence || []).map((e: string, i: number) => <li key={i}>{e}</li>)}
            </ul>
          </Alert>
        )}
        {result?.history?.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.history.map((h: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{h.oldValue}</TableCell>
                  <TableCell>{h.newValue}</TableCell>
                  <TableCell>{new Date(h.changedAt || h.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1 });
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (feature) qs.set('feature', feature);
    setLoading(true);
    setNotice('');

    fetch(`/api/ai/results?${qs.toString()}`)
      .then(readJsonResponse)
      .then((data) => {
        if (cancelled) return;
        setItems(data.data || []);
        setPagination(data.pagination || { totalPages: 1 });
        setNotice(data.warning && !data.historyUnavailable ? uniqueNotice(data.warning) : '');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setItems([]);
        setPagination({ totalPages: 1 });
        setNotice(uniqueNotice(err.message || 'Failed to load AI results'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, feature]);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} mb={2}>
          <TextField select label="Feature" size="small" value={feature} onChange={(e) => { setFeature(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {['agent', 'activity-capture', 'forecast-ensemble', 'playbook', 'field-lineage', 'insights'].map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </TextField>
        </Stack>
        {notice && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {notice}
          </Alert>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Feature</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="right">Duration (ms)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{new Date(i.createdAt).toLocaleString()}</TableCell>
                <TableCell>{i.feature}</TableCell>
                <TableCell>{i.status}</TableCell>
                <TableCell>{summarizeAIOutput(i)}</TableCell>
                <TableCell align="right">{i.durationMs ?? '-'}</TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No AI results found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Stack direction="row" justifyContent="space-between" mt={2}>
          <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Typography variant="caption">page {page} / {pagination.totalPages}</Typography>
          <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
