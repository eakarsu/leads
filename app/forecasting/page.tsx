'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastData {
  summary: {
    totalPipelineValue: number;
    weightedPipeline: number;
    openOpportunities: number;
    closedOpportunities: number;
    wonOpportunities: number;
    winRate: number;
    averageDealSize: number;
  };
  byStage: Array<{
    stage: string;
    count: number;
    value: number;
    weighted: number;
  }>;
  byOwner: Array<{
    ownerId: string;
    ownerName: string;
    count: number;
    value: number;
    weighted: number;
  }>;
  byCloseDatePeriod: {
    thisMonth: { count: number; value: number; weighted: number };
    nextMonth: { count: number; value: number; weighted: number };
    thisQuarter: { count: number; value: number; weighted: number };
    later: { count: number; value: number; weighted: number };
    unscheduled: { count: number; value: number; weighted: number };
  };
}

export default function ForecastingPage() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [clientFilter, ownerFilter]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientFilter) params.append('clientId', clientFilter);
      if (ownerFilter) params.append('ownerId', ownerFilter);

      const url = `/api/forecasting${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch forecast data');
      const data = await response.json();
      setForecastData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!forecastData) {
    return (
      <DashboardLayout>
        <Alert severity="error">Failed to load forecast data</Alert>
      </DashboardLayout>
    );
  }

  const stageChartData = forecastData.byStage.map((stage) => ({
    name: stage.stage.replace('_', ' '),
    'Total Value': stage.value,
    'Weighted Value': stage.weighted,
    Count: stage.count,
  }));

  const closeDateChartData = [
    {
      name: 'This Month',
      'Total Value': forecastData.byCloseDatePeriod.thisMonth.value,
      'Weighted Value': forecastData.byCloseDatePeriod.thisMonth.weighted,
      Count: forecastData.byCloseDatePeriod.thisMonth.count,
    },
    {
      name: 'Next Month',
      'Total Value': forecastData.byCloseDatePeriod.nextMonth.value,
      'Weighted Value': forecastData.byCloseDatePeriod.nextMonth.weighted,
      Count: forecastData.byCloseDatePeriod.nextMonth.count,
    },
    {
      name: 'This Quarter',
      'Total Value': forecastData.byCloseDatePeriod.thisQuarter.value,
      'Weighted Value': forecastData.byCloseDatePeriod.thisQuarter.weighted,
      Count: forecastData.byCloseDatePeriod.thisQuarter.count,
    },
    {
      name: 'Later',
      'Total Value': forecastData.byCloseDatePeriod.later.value,
      'Weighted Value': forecastData.byCloseDatePeriod.later.weighted,
      Count: forecastData.byCloseDatePeriod.later.count,
    },
    {
      name: 'Unscheduled',
      'Total Value': forecastData.byCloseDatePeriod.unscheduled.value,
      'Weighted Value': forecastData.byCloseDatePeriod.unscheduled.weighted,
      Count: forecastData.byCloseDatePeriod.unscheduled.count,
    },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Sales Forecasting
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <TextField
                select
                label="Client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Owner"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Owners</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Total Pipeline
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {formatCurrency(forecastData.summary.totalPipelineValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {forecastData.summary.openOpportunities} opportunities
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoneyIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Weighted Pipeline
                  </Typography>
                </Box>
                <Typography variant="h5" color="secondary">
                  {formatCurrency(forecastData.summary.weightedPipeline)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Probability adjusted
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <EmojiEventsIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Win Rate
                  </Typography>
                </Box>
                <Typography variant="h5" color="success.main">
                  {formatPercentage(forecastData.summary.winRate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {forecastData.summary.wonOpportunities} won of{' '}
                  {forecastData.summary.closedOpportunities} closed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <BarChartIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Avg Deal Size
                  </Typography>
                </Box>
                <Typography variant="h5" color="info.main">
                  {formatCurrency(forecastData.summary.averageDealSize)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on closed won
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pipeline by Stage
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Total Value" fill="#8884d8" />
                    <Bar dataKey="Weighted Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pipeline by Expected Close Date
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={closeDateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Total Value" fill="#8884d8" />
                    <Bar dataKey="Weighted Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pipeline by Owner
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Owner</TableCell>
                        <TableCell align="center">Opportunities</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                        <TableCell align="right">Weighted Value</TableCell>
                        <TableCell align="right">Avg Deal Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {forecastData.byOwner.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">No data available</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        forecastData.byOwner.map((owner) => (
                          <TableRow key={owner.ownerId}>
                            <TableCell>{owner.ownerName}</TableCell>
                            <TableCell align="center">
                              <Chip label={owner.count} size="small" />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(owner.value)}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(owner.weighted)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(owner.count > 0 ? owner.value / owner.count : 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
