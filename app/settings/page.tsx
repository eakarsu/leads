'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

type Connector = { id: string; kind: string; provider: string; baseUrl: string; syncDirection: string; enabled: boolean; lastSucceededAt: string | null; consecutiveFailures: number };
type SyncOperation = { id: string; direction: string; entityType: string; externalId: string; status: string; attempts: number; lastErrorCode: string | null; connector: { provider: string; kind: string } };

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const clientId = session?.user?.clientId;
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [connector, setConnector] = useState({ kind: 'CRM', provider: '', baseUrl: '', credentialRef: '', webhookSecretRef: '', syncDirection: 'BOTH' });
  const [policy, setPolicy] = useState({ region: 'US', channel: 'EMAIL', requireConsent: true, requireHumanReview: true, maxPerHour: 50, maxPerDay: 250, quietHoursStart: 20, quietHoursEnd: 8, timezone: 'UTC', enabled: true });
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    const [connectorResponse, syncResponse] = await Promise.all([fetch(`/api/lead-operations/connectors${query}`), fetch(`/api/lead-operations/sync${query}`)]);
    const [connectorBody, syncBody] = await Promise.all([connectorResponse.json(), syncResponse.json()]);
    if (connectorResponse.ok) setConnectors(connectorBody.data); else setMessage({ severity: 'error', text: connectorBody.message });
    if (syncResponse.ok) setOperations(syncBody.data); else setMessage({ severity: 'error', text: syncBody.message });
  }, [query, status]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function saveConnector(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/lead-operations/connectors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...connector, clientId, serviceUserId: session?.user.id }) });
    const body = await response.json();
    if (!response.ok) setMessage({ severity: 'error', text: body.message }); else { setMessage({ severity: 'success', text: 'Connector saved. Secret values remain outside the database.' }); setConnector({ ...connector, provider: '', baseUrl: '', credentialRef: '', webhookSecretRef: '' }); await load(); }
  }
  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/lead-operations/policies', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...policy, clientId }) });
    const body = await response.json();
    setMessage(response.ok ? { severity: 'success', text: 'Regional outreach policy saved.' } : { severity: 'error', text: body.message });
  }
  async function retry(operation: SyncOperation) {
    const reason = window.prompt('Describe the repair that makes this retry safe:');
    if (!reason) return;
    const response = await fetch(`/api/lead-operations/sync/${operation.id}/retry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId, reason }) });
    const body = await response.json();
    if (!response.ok) setMessage({ severity: 'error', text: body.message }); else await load();
  }
  return (
    <DashboardLayout>
      <Typography variant="h4" fontWeight={700} gutterBottom>Sync and outreach controls</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Connector records contain secret references only. Workers resolve the values at runtime.</Typography>
      {message ? <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert> : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent component="form" onSubmit={saveConnector}>
          <Typography variant="h6" gutterBottom>Add connector</Typography><Stack spacing={2}>
            <TextField select label="Kind" value={connector.kind} onChange={(event) => setConnector({ ...connector, kind: event.target.value })}>{['CRM', 'EMAIL', 'CALENDAR', 'ENRICHMENT', 'CONSENT', 'SUPPRESSION'].map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}</TextField>
            <TextField required label="Provider" value={connector.provider} onChange={(event) => setConnector({ ...connector, provider: event.target.value })} />
            <TextField required type="url" label="HTTPS endpoint" value={connector.baseUrl} onChange={(event) => setConnector({ ...connector, baseUrl: event.target.value })} />
            <TextField required label="Credential environment reference" helperText="Example: CRM_BEARER_TOKEN" value={connector.credentialRef} onChange={(event) => setConnector({ ...connector, credentialRef: event.target.value.toUpperCase() })} />
            <TextField required label="Webhook secret environment reference" helperText="Example: CRM_WEBHOOK_SECRET" value={connector.webhookSecretRef} onChange={(event) => setConnector({ ...connector, webhookSecretRef: event.target.value.toUpperCase() })} />
            <TextField select label="Sync direction" value={connector.syncDirection} onChange={(event) => setConnector({ ...connector, syncDirection: event.target.value })}>{['INBOUND', 'OUTBOUND', 'BOTH'].map((direction) => <MenuItem key={direction} value={direction}>{direction}</MenuItem>)}</TextField>
            <Button type="submit" variant="contained">Save connector</Button>
          </Stack>
        </CardContent></Card></Grid>
        <Grid size={{ xs: 12, lg: 6 }}><Card variant="outlined"><CardContent component="form" onSubmit={savePolicy}>
          <Typography variant="h6" gutterBottom>Regional email policy</Typography><Stack spacing={2}>
            <TextField required label="Region" value={policy.region} onChange={(event) => setPolicy({ ...policy, region: event.target.value.toUpperCase() })} />
            <TextField required type="number" label="Maximum per hour" value={policy.maxPerHour} onChange={(event) => setPolicy({ ...policy, maxPerHour: Number(event.target.value) })} />
            <TextField required type="number" label="Maximum per day" value={policy.maxPerDay} onChange={(event) => setPolicy({ ...policy, maxPerDay: Number(event.target.value) })} />
            <TextField required type="number" label="Quiet hours start (0-23)" value={policy.quietHoursStart} onChange={(event) => setPolicy({ ...policy, quietHoursStart: Number(event.target.value) })} />
            <TextField required type="number" label="Quiet hours end (0-23)" value={policy.quietHoursEnd} onChange={(event) => setPolicy({ ...policy, quietHoursEnd: Number(event.target.value) })} />
            <TextField required label="IANA timezone" value={policy.timezone} onChange={(event) => setPolicy({ ...policy, timezone: event.target.value })} />
            <Typography variant="body2">Consent and separate human review are mandatory by default.</Typography><Button type="submit" variant="contained">Save policy</Button>
          </Stack>
        </CardContent></Card></Grid>
      </Grid>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Connectors</Typography><Stack spacing={1}>{connectors.map((item) => <Card key={item.id} variant="outlined"><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography>{item.kind}/{item.provider} · {item.syncDirection}</Typography><Chip label={item.enabled ? 'ENABLED' : 'DISABLED'} /></Box><Typography variant="body2" color="text.secondary">{item.baseUrl} · failures {item.consecutiveFailures}</Typography></CardContent></Card>)}</Stack>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Recent sync operations</Typography><Stack spacing={1}>{operations.map((item) => <Card key={item.id} variant="outlined"><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography>{item.connector.kind}/{item.connector.provider} · {item.direction} {item.entityType} {item.externalId}</Typography><Chip label={item.status} color={item.status === 'DEAD_LETTER' ? 'error' : item.status === 'COMPLETED' ? 'success' : 'default'} /></Box><Typography variant="body2">Attempts: {item.attempts}{item.lastErrorCode ? ` · ${item.lastErrorCode}` : ''}</Typography>{item.status === 'DEAD_LETTER' ? <Button onClick={() => retry(item)}>Repair and retry</Button> : null}</CardContent></Card>)}</Stack>
    </DashboardLayout>
  );
}
