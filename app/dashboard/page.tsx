'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import BusinessIcon from '@mui/icons-material/Business';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface Stats {
  totalClients: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  leadsByStatus: Record<string, number>;
  recentActivities: any[];
  topCampaigns: any[];
}

interface AIInsights {
  keyInsights: string[];
  optimizationOpportunities: Array<{
    recommendation: string;
    expectedImpact: string;
    priority: string;
  }>;
  benchmarkComparison: string;
  summary: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (!stats) return;

    setLoadingAI(true);
    setError('');

    try {
      const funnelMetrics = {
        totalLeads: stats.totalLeads,
        qualifiedLeads: stats.qualifiedLeads,
        wonLeads: stats.wonLeads,
        activeCampaigns: stats.activeCampaigns,
        leadsByStatus: stats.leadsByStatus,
      };

      const response = await fetch('/api/ai/kpi-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelMetrics }),
      });

      if (!response.ok) throw new Error('Failed to generate AI insights');
      const data = await response.json();
      setAiInsights(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI insights');
    } finally {
      setLoadingAI(false);
    }
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

  if (!stats) {
    return (
      <DashboardLayout>
        <Alert severity="error">Failed to load dashboard data</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => router.push('/clients')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <BusinessIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Total Clients
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.totalClients}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => router.push('/campaigns')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CampaignIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Active Campaigns
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.activeCampaigns}</Typography>
                <Typography variant="caption" color="text.secondary">
                  of {stats.totalCampaigns} total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => router.push('/leads')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PeopleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Total Leads
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.totalLeads}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.qualifiedLeads} qualified
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => router.push('/leads?status=WON')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Deals Won
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.wonLeads}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.totalLeads > 0
                    ? ((stats.wonLeads / stats.totalLeads) * 100).toFixed(1)
                    : 0}
                  % conversion
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AI Insights Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <AutoAwesomeIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">AI Insights & Recommendations</Typography>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesomeIcon />}
                onClick={generateAIInsights}
                disabled={loadingAI}
              >
                {loadingAI ? 'Generating...' : 'Generate AI Insights'}
              </Button>
            </Box>

            {loadingAI && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {aiInsights && !loadingAI && (
              <Box>
                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                  {aiInsights.summary}
                </Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                  Key Insights:
                </Typography>
                <List>
                  {aiInsights.keyInsights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`• ${insight}`} />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Optimization Opportunities:
                </Typography>
                <List>
                  {aiInsights.optimizationOpportunities.map((opp, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={opp.priority}
                              size="small"
                              color={
                                opp.priority === 'High'
                                  ? 'error'
                                  : opp.priority === 'Medium'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                            <span>{opp.recommendation}</span>
                          </Box>
                        }
                        secondary={`Expected Impact: ${opp.expectedImpact}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Benchmark:</strong> {aiInsights.benchmarkComparison}
                </Alert>
              </Box>
            )}

            {!aiInsights && !loadingAI && (
              <Alert severity="info">
                Click "Generate AI Insights" to get personalized recommendations based on your
                current performance metrics.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities and Top Campaigns */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Campaigns
                </Typography>
                <List>
                  {stats.topCampaigns.map((campaign, index) => (
                    <div key={campaign.id}>
                      <ListItem>
                        <ListItemText
                          primary={campaign.name}
                          secondary={`${campaign.client.name} • ${campaign._count.leads} leads`}
                        />
                        <Chip
                          label={campaign.status}
                          size="small"
                          color={campaign.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </ListItem>
                      {index < stats.topCampaigns.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activities
                </Typography>
                <List>
                  {stats.recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={activity.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${activity.type}: ${activity.lead.fullName} (${activity.lead.company})`}
                          secondary={`By ${activity.user.name} • ${new Date(
                            activity.timestamp
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {index < 4 && <Divider />}
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
