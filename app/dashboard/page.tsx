'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

type Metrics = {
  totalLeads: number; converted: number; suppressed: number; reviewPending: number;
  outreachFailures: number; syncFailures: number; conversionRate: number;
  averageCompleteness: number; attributedConversions: number;
};

const cards: Array<{ key: keyof Metrics; label: string; suffix?: string }> = [
  { key: 'totalLeads', label: 'Governed leads' },
  { key: 'conversionRate', label: 'Conversion rate', suffix: '%' },
  { key: 'averageCompleteness', label: 'Average data completeness', suffix: '%' },
  { key: 'reviewPending', label: 'Awaiting human review' },
  { key: 'suppressed', label: 'Suppressed leads' },
  { key: 'attributedConversions', label: 'Attributed conversions' },
  { key: 'outreachFailures', label: 'Outreach dead letters' },
  { key: 'syncFailures', label: 'Sync dead letters' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (status !== 'authenticated') return;
    const clientId = session.user.clientId;
    const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    fetch(`/api/lead-operations/metrics${query}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'Metrics could not be loaded');
        setMetrics(body);
      })
      .catch((reason) => setError(reason.message));
  }, [session, status]);
  return (
    <DashboardLayout>
      <Typography variant="h4" fontWeight={700} gutterBottom>Operations dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Deterministic conversion and data-quality evidence from the governed workflow.</Typography>
      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
      {!metrics ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid key={card.key} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined"><CardContent>
                <Typography color="text.secondary" variant="body2">{card.label}</Typography>
                <Typography variant="h3" sx={{ mt: 1 }}>{metrics[card.key]}{card.suffix}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardLayout>
  );
}
