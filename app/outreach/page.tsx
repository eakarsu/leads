'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

type Outreach = { id: string; state: string; subject: string | null; attempts: number; lastErrorCode: string | null; createdBy: string; lead: { fullName: string; email: string | null; company: string | null } };

export default function OutreachPage() {
  const { data: session, status } = useSession();
  const clientId = session?.user?.clientId;
  const [rows, setRows] = useState<Outreach[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    const response = await fetch(`/api/lead-operations/outreach${query}`);
    const body = await response.json();
    if (response.ok) { setRows(body.data); setError(''); } else setError(body.message || 'Outreach could not be loaded');
    setLoading(false);
  }, [clientId, status]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function act(row: Outreach, action: 'review' | 'cancel' | 'retry', approve?: boolean) {
    const reason = window.prompt('Record the reason for this action:');
    if (!reason) return;
    const response = await fetch(`/api/lead-operations/outreach/${row.id}/${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId, reason, ...(action === 'review' && { approve }) }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.message || 'Action failed'); else await load();
  }
  return (
    <DashboardLayout>
      <Typography variant="h4" fontWeight={700} gutterBottom>Outreach review and delivery</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>A separate reviewer approves content before the leased worker can deliver it.</Typography>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {loading ? <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box> : <Stack spacing={2}>
        {rows.map((row) => <Card key={row.id} variant="outlined"><CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'start' }}><Box><Typography variant="h6">{row.subject || '(no subject)'}</Typography><Typography color="text.secondary">{row.lead.fullName} · {row.lead.company || row.lead.email || 'No destination'}</Typography></Box><Chip label={row.state} color={row.state === 'SENT' ? 'success' : row.state === 'DEAD_LETTER' || row.state === 'BLOCKED' ? 'error' : 'default'} /></Box>
          <Typography variant="body2" sx={{ mt: 1 }}>Attempts: {row.attempts}{row.lastErrorCode ? ` · ${row.lastErrorCode}` : ''}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {row.state === 'REVIEW_PENDING' ? <><Button variant="contained" onClick={() => act(row, 'review', true)}>Approve</Button><Button color="error" onClick={() => act(row, 'review', false)}>Reject</Button></> : null}
            {['DRAFT', 'REVIEW_PENDING', 'APPROVED', 'RETRY', 'BLOCKED'].includes(row.state) ? <Button onClick={() => act(row, 'cancel')}>Cancel</Button> : null}
            {['BLOCKED', 'DEAD_LETTER'].includes(row.state) ? <Button variant="outlined" onClick={() => act(row, 'retry')}>Repair and retry</Button> : null}
          </Stack>
        </CardContent></Card>)}
        {rows.length === 0 ? <Alert severity="info">No governed outreach has been created.</Alert> : null}
      </Stack>}
    </DashboardLayout>
  );
}
