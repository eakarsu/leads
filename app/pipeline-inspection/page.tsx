'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableRow, Chip, Grid, Card,
  CardContent, Alert, LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import ExportToolbar from '@/components/ExportToolbar';

interface PipelineStats {
  totalPipeline: number;
  weightedPipeline: number;
  avgDealSize: number;
  dealCount: number;
  stuckDeals: number;
  closingSoon: number;
}

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  daysSinceUpdate: number;
  owner: string;
  probability: number;
}

const stuckColumns: Column[] = [
  { id: 'name', label: 'Deal Name', sortable: false },
  { id: 'stage', label: 'Stage', sortable: false },
  { id: 'amount', label: 'Amount', sortable: false },
  { id: 'daysSinceUpdate', label: 'Days Stuck', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
];

const closingSoonColumns: Column[] = [
  { id: 'name', label: 'Deal Name', sortable: false },
  { id: 'stage', label: 'Stage', sortable: false },
  { id: 'amount', label: 'Amount', sortable: false },
  { id: 'closeDate', label: 'Close Date', sortable: false },
  { id: 'probability', label: 'Probability', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
];

const STAGE_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f',
  '#0288d1', '#689f38', '#ffa000', '#512da8', '#c2185b',
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

export default function PipelineInspectionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<PipelineStats>({
    totalPipeline: 0, weightedPipeline: 0, avgDealSize: 0,
    dealCount: 0, stuckDeals: 0, closingSoon: 0,
  });
  const [stageData, setStageData] = useState<StageData[]>([]);
  const [stuckDeals, setStuckDeals] = useState<Deal[]>([]);
  const [closingSoonDeals, setClosingSoonDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/pipeline-inspection');
      if (!response.ok) throw new Error('Failed to fetch pipeline data');
      const data = await response.json();
      setStats(data.stats || {
        totalPipeline: 0, weightedPipeline: 0, avgDealSize: 0,
        dealCount: 0, stuckDeals: 0, closingSoon: 0,
      });
      setStageData(data.stageData || []);
      setStuckDeals(data.stuckDeals || []);
      setClosingSoonDeals(data.closingSoonDeals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const maxStageValue = Math.max(...stageData.map((s) => s.value), 1);

  const statCards = [
    { label: 'Total Pipeline', value: formatCurrency(stats.totalPipeline), icon: <AttachMoneyIcon />, color: '#1976d2' },
    { label: 'Weighted Pipeline', value: formatCurrency(stats.weightedPipeline), icon: <TrendingUpIcon />, color: '#388e3c' },
    { label: 'Avg Deal Size', value: formatCurrency(stats.avgDealSize), icon: <AttachMoneyIcon />, color: '#7b1fa2' },
    { label: 'Deal Count', value: stats.dealCount.toString(), icon: <TrendingUpIcon />, color: '#0288d1' },
    { label: 'Stuck Deals', value: stats.stuckDeals.toString(), icon: <WarningIcon />, color: '#d32f2f' },
    { label: 'Closing Soon', value: stats.closingSoon.toString(), icon: <ScheduleIcon />, color: '#f57c00' },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Pipeline Inspection</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            {/* Stat Cards */}
            <Grid container spacing={2} mb={3}>
              {statCards.map((card) => (
                <Grid size={{ xs: 12, sm: 6, md: 2 }} key={card.label}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                      <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Stage Chart */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Deals by Stage</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stageData.map((stage, idx) => (
                    <Box key={stage.stage} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'right' }}>
                        {stage.stage}
                      </Typography>
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            height: 28,
                            width: `${(stage.value / maxStageValue) * 100}%`,
                            minWidth: 4,
                            bgcolor: STAGE_COLORS[idx % STAGE_COLORS.length],
                            borderRadius: 1,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {stage.count} deals - {formatCurrency(stage.value)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {stageData.length === 0 && (
                    <Typography color="text.secondary" textAlign="center">No stage data available.</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Stuck Deals */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Stuck Deals <Chip label={stuckDeals.length} size="small" color="error" sx={{ ml: 1 }} />
                  </Typography>
                  <ExportToolbar
                    data={stuckDeals.map((d) => ({
                      Name: d.name, Stage: d.stage, Amount: d.amount,
                      'Days Stuck': d.daysSinceUpdate, Owner: d.owner,
                    }))}
                    filename="stuck-deals"
                    title="Stuck Deals"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Deals that have not been updated in over 14 days
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={stuckColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {stuckDeals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">No stuck deals found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        stuckDeals.map((deal) => (
                          <TableRow key={deal.id} hover>
                            <TableCell>{deal.name}</TableCell>
                            <TableCell><Chip label={deal.stage} size="small" /></TableCell>
                            <TableCell>{formatCurrency(deal.amount)}</TableCell>
                            <TableCell>
                              <Chip label={`${deal.daysSinceUpdate} days`} size="small" color="error" />
                            </TableCell>
                            <TableCell>{deal.owner}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Closing Soon */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Closing Soon <Chip label={closingSoonDeals.length} size="small" color="warning" sx={{ ml: 1 }} />
                  </Typography>
                  <ExportToolbar
                    data={closingSoonDeals.map((d) => ({
                      Name: d.name, Stage: d.stage, Amount: d.amount,
                      'Close Date': new Date(d.closeDate).toLocaleDateString(),
                      Probability: `${d.probability}%`, Owner: d.owner,
                    }))}
                    filename="closing-soon-deals"
                    title="Closing Soon Deals"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Deals with close dates within the next 30 days
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={closingSoonColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {closingSoonDeals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">No deals closing soon.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        closingSoonDeals.map((deal) => (
                          <TableRow key={deal.id} hover>
                            <TableCell>{deal.name}</TableCell>
                            <TableCell><Chip label={deal.stage} size="small" /></TableCell>
                            <TableCell>{formatCurrency(deal.amount)}</TableCell>
                            <TableCell>{new Date(deal.closeDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={deal.probability}
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2">{deal.probability}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{deal.owner}</TableCell>
                          </TableRow>
                        ))
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
