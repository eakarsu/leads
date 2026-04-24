'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableRow, Chip, Grid, Card,
  CardContent, Alert, LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import ExportToolbar from '@/components/ExportToolbar';

interface RevenueStats {
  winRate: number;
  totalRevenue: number;
  avgDealSize: number;
}

interface Forecast {
  id: string;
  period: string;
  predictedRevenue: number;
  actualRevenue: number;
  confidence: number;
}

interface RepPerformance {
  id: string;
  name: string;
  won: number;
  lost: number;
  pipelineValue: number;
  revenue: number;
}

const forecastColumns: Column[] = [
  { id: 'period', label: 'Period', sortable: false },
  { id: 'predictedRevenue', label: 'Predicted Revenue', sortable: false },
  { id: 'actualRevenue', label: 'Actual Revenue', sortable: false },
  { id: 'confidence', label: 'Confidence', sortable: false },
  { id: 'variance', label: 'Variance', sortable: false },
];

const repColumns: Column[] = [
  { id: 'name', label: 'Rep Name', sortable: false },
  { id: 'won', label: 'Won', sortable: false },
  { id: 'lost', label: 'Lost', sortable: false },
  { id: 'pipelineValue', label: 'Pipeline Value', sortable: false },
  { id: 'revenue', label: 'Revenue', sortable: false },
  { id: 'winRate', label: 'Win Rate', sortable: false },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

export default function RevenueIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<RevenueStats>({ winRate: 0, totalRevenue: 0, avgDealSize: 0 });
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [repPerformance, setRepPerformance] = useState<RepPerformance[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/revenue-intelligence');
      if (!response.ok) throw new Error('Failed to fetch revenue intelligence data');
      const data = await response.json();
      setStats(data.stats || { winRate: 0, totalRevenue: 0, avgDealSize: 0 });
      setForecasts(data.forecasts || []);
      setRepPerformance(data.repPerformance || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: <EmojiEventsIcon />, color: '#388e3c' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: <AttachMoneyIcon />, color: '#1976d2' },
    { label: 'Avg Deal Size', value: formatCurrency(stats.avgDealSize), icon: <TrendingUpIcon />, color: '#7b1fa2' },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Revenue Intelligence</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            {/* Stat Cards */}
            <Grid container spacing={2} mb={3}>
              {statCards.map((card) => (
                <Grid size={{ xs: 12, sm: 4 }} key={card.label}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                      <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Forecasts Table */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Revenue Forecasts</Typography>
                  <ExportToolbar
                    data={forecasts.map((f) => ({
                      Period: f.period,
                      'Predicted Revenue': f.predictedRevenue,
                      'Actual Revenue': f.actualRevenue,
                      Confidence: `${f.confidence}%`,
                    }))}
                    filename="revenue-forecasts"
                    title="Revenue Forecasts"
                  />
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={forecastColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {forecasts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">No forecast data available.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        forecasts.map((forecast) => {
                          const variance = forecast.actualRevenue > 0
                            ? ((forecast.actualRevenue - forecast.predictedRevenue) / forecast.predictedRevenue * 100).toFixed(1)
                            : '---';
                          return (
                            <TableRow key={forecast.id} hover>
                              <TableCell>{forecast.period}</TableCell>
                              <TableCell>{formatCurrency(forecast.predictedRevenue)}</TableCell>
                              <TableCell>{forecast.actualRevenue > 0 ? formatCurrency(forecast.actualRevenue) : '---'}</TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={forecast.confidence}
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2">{forecast.confidence}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {variance !== '---' ? (
                                  <Chip
                                    label={`${Number(variance) >= 0 ? '+' : ''}${variance}%`}
                                    size="small"
                                    color={Number(variance) >= 0 ? 'success' : 'error'}
                                  />
                                ) : (
                                  '---'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Rep Performance Table */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Rep Performance</Typography>
                  <ExportToolbar
                    data={repPerformance.map((r) => ({
                      Name: r.name, Won: r.won, Lost: r.lost,
                      'Pipeline Value': r.pipelineValue, Revenue: r.revenue,
                      'Win Rate': r.won + r.lost > 0 ? `${((r.won / (r.won + r.lost)) * 100).toFixed(1)}%` : '---',
                    }))}
                    filename="rep-performance"
                    title="Rep Performance"
                  />
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={repColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {repPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">No rep performance data available.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        repPerformance.map((rep) => {
                          const winRate = rep.won + rep.lost > 0 ? ((rep.won / (rep.won + rep.lost)) * 100).toFixed(1) : '---';
                          return (
                            <TableRow key={rep.id} hover>
                              <TableCell>{rep.name}</TableCell>
                              <TableCell>
                                <Chip label={rep.won} size="small" color="success" />
                              </TableCell>
                              <TableCell>
                                <Chip label={rep.lost} size="small" color="error" />
                              </TableCell>
                              <TableCell>{formatCurrency(rep.pipelineValue)}</TableCell>
                              <TableCell>{formatCurrency(rep.revenue)}</TableCell>
                              <TableCell>
                                {winRate !== '---' ? (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Number(winRate)}
                                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                      color={Number(winRate) >= 50 ? 'success' : 'warning'}
                                    />
                                    <Typography variant="body2">{winRate}%</Typography>
                                  </Box>
                                ) : '---'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
