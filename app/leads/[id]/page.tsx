'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, MenuItem,
  Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardLayout from '@/components/DashboardLayout';

const stages = ['DEDUPED', 'ENRICHED', 'REVIEW_PENDING', 'OUTREACH_APPROVED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'HANDOFF_PENDING', 'HANDED_OFF', 'RETRY_PENDING', 'CONVERTED', 'DISQUALIFIED', 'SUPPRESSED'];
type LeadDetail = {
  id: string; fullName: string; company: string | null; title: string | null; email: string | null; phone: string | null;
  governance: { stage: string; version: number; region: string; ownerId: string };
  consents: Array<{ id: string; channel: string; purpose: string; state: string; sourceSystem: string; effectiveAt: string }>;
  outreach: Array<{ id: string; subject: string | null; state: string; approvedBy: string | null; attempts: number; lastErrorCode: string | null; createdAt: string }>;
  syncRecords: Array<{ id: string; externalId: string; externalVersion: string; connector: { kind: string; provider: string } }>;
  attributions: Array<{ id: string; model: string; dataQuality: unknown; convertedAt: string }>;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const clientId = session?.user?.clientId;
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [transition, setTransition] = useState({ to: 'DEDUPED', reason: '' });
  const [consent, setConsent] = useState({ state: 'GRANTED', purpose: 'MARKETING', sourceSystem: 'CONSENT_PORTAL', sourceReference: '', evidence: '' });
  const [outreach, setOutreach] = useState({ subject: '', body: '', purpose: 'MARKETING' });
  const [handoffOwner, setHandoffOwner] = useState('');

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    const response = await fetch(`/api/leads/${id}${query}`);
    const body = await response.json();
    if (response.ok) { setLead(body); setError(''); } else setError(body.message || 'Lead could not be loaded');
  }, [clientId, id, status]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function action(url: string, body: unknown) {
    setBusy(true); setError('');
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setError(result.message || 'Operation failed'); return false; }
    await load();
    return true;
  }
  async function submitTransition(event: FormEvent) {
    event.preventDefault(); if (!lead) return;
    if (await action(`/api/leads/${lead.id}/transition`, { clientId, expectedVersion: lead.governance.version, ...transition })) setTransition({ ...transition, reason: '' });
  }
  async function submitConsent(event: FormEvent) {
    event.preventDefault(); if (!lead) return;
    let evidence: Record<string, unknown>;
    try { evidence = consent.evidence ? JSON.parse(consent.evidence) : { recordedBy: 'operator' }; } catch { setError('Consent evidence must be valid JSON'); return; }
    if (await action(`/api/leads/${lead.id}/consent`, { clientId, channel: 'EMAIL', region: lead.governance.region, ...consent, evidence })) setConsent({ ...consent, sourceReference: '', evidence: '' });
  }
  async function submitOutreach(event: FormEvent) {
    event.preventDefault(); if (!lead) return;
    const created = await action('/api/lead-operations/outreach', { clientId, leadId: lead.id, channel: 'EMAIL', region: lead.governance.region, ...outreach, idempotencyKey: `ui:${lead.id}:${crypto.randomUUID()}` });
    if (created) setOutreach({ ...outreach, subject: '', body: '' });
  }

  return (
    <DashboardLayout>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/leads')} sx={{ mb: 2 }}>Back to leads</Button>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {!lead ? <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box> : <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}><Box><Typography variant="h4" fontWeight={700}>{lead.fullName}</Typography><Typography color="text.secondary">{lead.title || 'No title'} · {lead.company || 'No company'}</Typography></Box><Chip label={lead.governance.stage} color={lead.governance.stage === 'SUPPRESSED' ? 'error' : lead.governance.stage === 'CONVERTED' ? 'success' : 'primary'} /></Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent>
            <Typography variant="h6">Identity and ownership</Typography><Divider sx={{ my: 2 }} />
            <Typography>Email: {lead.email || '—'}</Typography><Typography>Phone: {lead.phone || '—'}</Typography><Typography>Region: {lead.governance.region}</Typography><Typography>Owner: {lead.governance.ownerId}</Typography><Typography>Version: {lead.governance.version}</Typography>
          </CardContent></Card></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent component="form" onSubmit={submitTransition}>
            <Typography variant="h6">Lifecycle transition</Typography><Divider sx={{ my: 2 }} />
            <Stack spacing={2}><TextField select label="Next stage" value={transition.to} onChange={(event) => setTransition({ ...transition, to: event.target.value })}>{stages.map((stage) => <MenuItem key={stage} value={stage}>{stage}</MenuItem>)}</TextField>
              <TextField required label="Reason" value={transition.reason} onChange={(event) => setTransition({ ...transition, reason: event.target.value })} /><Button type="submit" variant="contained" disabled={busy}>Apply transition</Button></Stack>
          </CardContent></Card></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent component="form" onSubmit={submitConsent}>
            <Typography variant="h6">Consent evidence</Typography><Divider sx={{ my: 2 }} />
            <Stack spacing={2}><TextField select label="State" value={consent.state} onChange={(event) => setConsent({ ...consent, state: event.target.value })}>{['PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED'].map((state) => <MenuItem key={state} value={state}>{state}</MenuItem>)}</TextField>
              <TextField required label="Purpose" value={consent.purpose} onChange={(event) => setConsent({ ...consent, purpose: event.target.value.toUpperCase() })} />
              <TextField required label="Source system" value={consent.sourceSystem} onChange={(event) => setConsent({ ...consent, sourceSystem: event.target.value })} />
              <TextField required label="Source reference" value={consent.sourceReference} onChange={(event) => setConsent({ ...consent, sourceReference: event.target.value })} />
              <TextField label="Evidence JSON" multiline minRows={2} value={consent.evidence} onChange={(event) => setConsent({ ...consent, evidence: event.target.value })} /><Button type="submit" variant="contained" disabled={busy}>Record immutable evidence</Button></Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>{lead.consents.slice(0, 5).map((item) => <Chip key={item.id} label={`${item.channel}/${item.purpose}: ${item.state} · ${item.sourceSystem}`} />)}</Stack>
          </CardContent></Card></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent component="form" onSubmit={submitOutreach}>
            <Typography variant="h6">Draft governed outreach</Typography><Divider sx={{ my: 2 }} />
            <Stack spacing={2}><TextField required label="Purpose" value={outreach.purpose} onChange={(event) => setOutreach({ ...outreach, purpose: event.target.value.toUpperCase() })} /><TextField required label="Subject" value={outreach.subject} onChange={(event) => setOutreach({ ...outreach, subject: event.target.value })} /><TextField required multiline minRows={5} label="Message body" value={outreach.body} onChange={(event) => setOutreach({ ...outreach, body: event.target.value })} /><Button type="submit" variant="contained" disabled={busy}>Submit for human review</Button></Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>{lead.outreach.slice(0, 5).map((item) => <Chip key={item.id} label={`${item.subject || '(no subject)'}: ${item.state}${item.lastErrorCode ? ` · ${item.lastErrorCode}` : ''}`} />)}</Stack>
          </CardContent></Card></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent>
            <Typography variant="h6">Ownership handoff</Typography><Divider sx={{ my: 2 }} />
            <Stack spacing={2}><TextField label="New owner user ID" value={handoffOwner} onChange={(event) => setHandoffOwner(event.target.value)} /><Button variant="contained" disabled={busy || !handoffOwner} onClick={() => action(`/api/leads/${lead.id}/handoff`, { clientId, toOwnerId: handoffOwner })}>Request reviewed handoff</Button></Stack>
          </CardContent></Card></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent>
            <Typography variant="h6">External sync identities</Typography><Divider sx={{ my: 2 }} />
            {lead.syncRecords.length ? lead.syncRecords.map((record) => <Typography key={record.id}>{record.connector.kind}/{record.connector.provider}: {record.externalId} ({record.externalVersion})</Typography>) : <Typography color="text.secondary">No external mappings yet.</Typography>}
          </CardContent></Card></Grid>
        </Grid>
      </>}
    </DashboardLayout>
  );
}
