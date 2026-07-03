'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ExtensionIcon from '@mui/icons-material/Extension';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type Listing = {
  id: string;
  name: string;
  type: string;
  publisher: string;
  description?: string;
  pricingModel: string;
  priceUSD?: number;
  revenueSharePct?: number;
  installs: number;
  rating?: number;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Marketplace request failed';
}

export default function AppExchangePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [type, setType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = type === 'ALL' ? '' : `?type=${type}`;
      const response = await fetch(`/api/appexchange${query}`);
      const payload = await response.json() as { error?: string; listings?: Listing[] };
      if (!response.ok) throw new Error(payload.error || 'Failed to load marketplace');
      setListings(payload.listings || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const install = async (listing: Listing) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/appexchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', id: listing.id }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Install failed');
      setSuccess(`${listing.name} installed`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">AppExchange</Typography>
            <Typography color="text.secondary">Install CRM integrations, industry templates, and Agentforce apps.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="integration">Integrations</MenuItem>
                <MenuItem value="template">Templates</MenuItem>
                <MenuItem value="app">Apps</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? <CircularProgress /> : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {listings.map((listing) => (
              <Card key={listing.id} sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(listing)}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ExtensionIcon color="primary" />
                      <Typography variant="h6">{listing.name}</Typography>
                    </Stack>
                    <Chip size="small" label={listing.type} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 48 }}>{listing.description}</Typography>
                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                    <Chip size="small" label={listing.publisher} />
                    <Chip size="small" label={`${listing.installs} installs`} />
                    {listing.rating && <Chip size="small" label={`${listing.rating}/5`} />}
                    <Chip size="small" label={listing.priceUSD ? `$${listing.priceUSD} ${listing.pricingModel}` : listing.pricingModel} />
                  </Stack>
                  <Button sx={{ mt: 2 }} variant="contained" startIcon={<AddShoppingCartIcon />} onClick={(event) => { event.stopPropagation(); install(listing); }}>
                    Install
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="AppExchange Listing Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
