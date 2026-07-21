'use client';

import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Typography } from '@mui/material';

export default function OptOutPage({ params }: { params: Promise<{ token: string }> }) {
  const [state, setState] = useState<'ready' | 'submitting' | 'done' | 'error'>('ready');
  async function optOut() {
    setState('submitting');
    const { token } = await params;
    const response = await fetch(`/api/lead-operations/opt-out/${encodeURIComponent(token)}`, { method: 'POST' });
    setState(response.ok ? 'done' : 'error');
  }
  return (
    <Container maxWidth="sm"><Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Card><CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Communication preferences</Typography>
        <Typography sx={{ mb: 3 }}>Stop future outreach for the purpose and address associated with this message.</Typography>
        {state === 'done' ? <Alert severity="success">You have been opted out. Future queued outreach is blocked.</Alert> : null}
        {state === 'error' ? <Alert severity="error">The link is invalid or expired. Contact the sender to update your preferences.</Alert> : null}
        {state !== 'done' ? <Button variant="contained" color="error" disabled={state === 'submitting'} onClick={optOut}>Opt out</Button> : null}
      </CardContent></Card>
    </Box></Container>
  );
}
