'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Paper,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/DashboardLayout';

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  client: {
    name: string;
  };
  contact: {
    firstName: string;
    lastName: string;
  } | null;
}

interface PipelineData {
  pipeline: {
    PROSPECTING: Opportunity[];
    QUALIFICATION: Opportunity[];
    NEEDS_ANALYSIS: Opportunity[];
    PROPOSAL: Opportunity[];
    NEGOTIATION: Opportunity[];
  };
  totals: {
    PROSPECTING: number;
    QUALIFICATION: number;
    NEEDS_ANALYSIS: number;
    PROPOSAL: number;
    NEGOTIATION: number;
  };
  totalWeightedValue: number;
  totalCount: number;
}

export default function PipelineViewPage() {
  const router = useRouter();
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const response = await fetch('/api/opportunities/pipeline');
      if (!response.ok) throw new Error('Failed to fetch pipeline');
      const data = await response.json();
      setPipelineData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const formatDate = (date: string | null) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING':
        return '#e3f2fd';
      case 'QUALIFICATION':
        return '#fff3e0';
      case 'NEEDS_ANALYSIS':
        return '#e8f5e9';
      case 'PROPOSAL':
        return '#f3e5f5';
      case 'NEGOTIATION':
        return '#fce4ec';
      default:
        return '#f5f5f5';
    }
  };

  const stages = [
    { key: 'PROSPECTING', label: 'Prospecting' },
    { key: 'QUALIFICATION', label: 'Qualification' },
    { key: 'NEEDS_ANALYSIS', label: 'Needs Analysis' },
    { key: 'PROPOSAL', label: 'Proposal' },
    { key: 'NEGOTIATION', label: 'Negotiation' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!pipelineData) {
    return (
      <DashboardLayout>
        <Alert severity="error">Failed to load pipeline data</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">
              Sales Pipeline
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/opportunities')}
            >
              New Opportunity
            </Button>
          </Box>
          <Box display="flex" gap={3} mt={2}>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Opportunities
                </Typography>
                <Typography variant="h5">{pipelineData.totalCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Weighted Value
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(pipelineData.totalWeightedValue)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {stages.map((stage) => {
            const opportunities = pipelineData.pipeline[stage.key as keyof typeof pipelineData.pipeline];
            const total = pipelineData.totals[stage.key as keyof typeof pipelineData.totals];

            return (
              <Grid item xs={12} sm={6} md={2.4} key={stage.key}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: getStageColor(stage.key),
                    minHeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  elevation={2}
                >
                  <Box mb={2}>
                    <Typography variant="h6" gutterBottom>
                      {stage.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {opportunities.length} deals
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {formatCurrency(total)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      weighted value
                    </Typography>
                  </Box>

                  <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {opportunities.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" align="center">
                        No opportunities
                      </Typography>
                    ) : (
                      opportunities.map((opp) => (
                        <Card
                          key={opp.id}
                          sx={{
                            mb: 1.5,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => router.push(`/opportunities/${opp.id}`)}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="subtitle2" gutterBottom noWrap>
                              {opp.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {opp.client.name}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {formatCurrency(opp.amount)}
                              </Typography>
                              <Chip
                                label={`${opp.probability}%`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              {formatDate(opp.expectedCloseDate)}
                            </Typography>
                            <Typography variant="caption" color="secondary" display="block">
                              {formatCurrency((opp.amount * opp.probability) / 100)} weighted
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
