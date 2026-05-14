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
        {result && (
          <Box mt={3}>
            <Typography variant="subtitle2">Plan</Typography>
            <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(result.plan, null, 2)}
            </pre>
            <Typography variant="subtitle2">Data</Typography>
            <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 12, overflow: 'auto', maxHeight: 320 }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Box>
        )}
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
          <TextField label="From email" value={from} onChange={(e) => setFrom(e.target.value)} fullWidth />
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth />
          <TextField label="Body" value={body} onChange={(e) => setBody(e.target.value)} fullWidth multiline rows={6} />
          <Button variant="contained" onClick={submit} disabled={loading || !from || !body}>
            {loading ? <CircularProgress size={18} /> : 'Capture & Link'}
          </Button>
          {result?.data && (
            <Alert severity="info">
              <strong>{result.data.summary}</strong>
              <pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(result.data, null, 2)}</pre>
            </Alert>
          )}
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
  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ai/forecast-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs, period }),
      }).then((x) => x.json());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
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
        {result?.ensemble && (
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
      </CardContent>
    </Card>
  );
}

function PlaybookPanel() {
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
  const [objectType, setObjectType] = useState('Opportunity');
  const [objectId, setObjectId] = useState('');
  const [field, setField] = useState('stage');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ai/field-lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectType, objectId, field }),
      }).then((x) => x.json());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardContent>
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
        {result?.narrative && (
          <Alert severity="info">
            <Typography variant="body1" fontWeight={600}>{result.narrative}</Typography>
            <ul>
              {(result.evidence || []).map((e: string, i: number) => <li key={i}>{e}</li>)}
            </ul>
          </Alert>
        )}
        {result?.history && (
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

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (feature) qs.set('feature', feature);
    fetch(`/api/ai/results?${qs.toString()}`)
      .then((r) => r.json())
      .then((r) => {
        setItems(r.data || []);
        setPagination(r.pagination || { totalPages: 1 });
      });
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
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Feature</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Duration (ms)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{new Date(i.createdAt).toLocaleString()}</TableCell>
                <TableCell>{i.feature}</TableCell>
                <TableCell>{i.status}</TableCell>
                <TableCell align="right">{i.durationMs ?? '-'}</TableCell>
              </TableRow>
            ))}
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
