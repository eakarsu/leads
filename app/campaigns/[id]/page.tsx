'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  client: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  leads: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    qualificationScore: number | null;
    activities?: any[];
  }>;
  reports?: any[];
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openBriefDialog, setOpenBriefDialog] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [aiBrief, setAiBrief] = useState<any>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      const data = await response.json();
      setCampaign(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBrief = async () => {
    setLoadingBrief(true);
    setAiBrief(null); // Clear any old data
    setError(''); // Clear any errors

    try {
      const response = await fetch('/api/ai/campaign-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: campaign?.client?.industry || 'Technology',
          icp: campaign?.targetPersona || 'Enterprise decision makers',
          offer: campaign?.description || 'Lead generation service',
          channels: campaign?.channel || 'Email, LinkedIn',
          geo: campaign?.targetRegions || 'North America',
          tone: 'Professional',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate brief');
      }

      const data = await response.json();
      setAiBrief(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingBrief(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'DRAFT':
        return 'default';
      default:
        return 'default';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'success';
      case 'QUALIFIED':
        return 'info';
      case 'CONTACTED':
        return 'warning';
      case 'LOST':
      case 'UNQUALIFIED':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateMetrics = () => {
    if (!campaign) return { total: 0, won: 0, qualified: 0, contacted: 0, new: 0, avgScore: 0 };

    const total = campaign.leads.length;
    const won = campaign.leads.filter((l) => l.status === 'WON').length;
    const qualified = campaign.leads.filter((l) => l.status === 'QUALIFIED').length;
    const contacted = campaign.leads.filter((l) => l.status === 'CONTACTED').length;
    const newLeads = campaign.leads.filter((l) => l.status === 'NEW').length;

    const scores = campaign.leads.filter((l) => l.qualificationScore !== null).map((l) => l.qualificationScore || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { total, won, qualified, contacted, new: newLeads, avgScore };
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

  if (!campaign) {
    return (
      <DashboardLayout>
        <Alert severity="error">Campaign not found</Alert>
      </DashboardLayout>
    );
  }

  const metrics = calculateMetrics();
  const conversionRate = metrics.total > 0 ? Math.round((metrics.won / metrics.total) * 100) : 0;

  return (
    <DashboardLayout>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/campaigns')}
          sx={{ mb: 2 }}
        >
          Back to Campaigns
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">{campaign.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {campaign.client.name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip label={campaign.status} color={getStatusColor(campaign.status) as any} />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => {
                setOpenBriefDialog(true);
                handleGenerateBrief();
              }}
            >
              AI Campaign Brief
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Campaign Info */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign Details
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {campaign.description || 'No description provided'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Start Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </Typography>

                  {campaign.endDate && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        End Date
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign Leads ({metrics.total})
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaign.leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">
                              No leads in this campaign yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaign.leads.map((lead) => (
                          <TableRow
                            key={lead.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <TableCell>{lead.fullName}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={lead.status}
                                size="small"
                                color={getLeadStatusColor(lead.status) as any}
                              />
                            </TableCell>
                            <TableCell>
                              {lead.qualificationScore !== null ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2">{lead.qualificationScore}</Typography>
                                  <Box sx={{ width: 60 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={lead.qualificationScore}
                                      color={
                                        lead.qualificationScore >= 70
                                          ? 'success'
                                          : lead.qualificationScore >= 40
                                          ? 'warning'
                                          : 'error'
                                      }
                                    />
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Not scored
                                </Typography>
                              )}
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

          {/* Metrics Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Performance Metrics */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Total Leads
                    </Typography>
                    <Typography variant="h6">{metrics.total}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Deals Won
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {metrics.won}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Qualified
                    </Typography>
                    <Typography variant="h6" color="info.main">
                      {metrics.qualified}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Contacted
                    </Typography>
                    <Typography variant="h6">{metrics.contacted}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      New Leads
                    </Typography>
                    <Typography variant="h6">{metrics.new}</Typography>
                  </Box>
                  <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Conversion Rate
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {conversionRate}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={conversionRate}
                      sx={{ mt: 1 }}
                      color={conversionRate >= 10 ? 'success' : conversionRate >= 5 ? 'warning' : 'error'}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Avg Qualification Score
                    </Typography>
                    <Typography variant="h4">{metrics.avgScore}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    fullWidth
                    onClick={() => router.push('/activities?type=EMAIL')}
                  >
                    View Email Activities
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    fullWidth
                    onClick={() => router.push('/activities?type=CALL')}
                  >
                    View Call Activities
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EventIcon />}
                    fullWidth
                    onClick={() => router.push('/activities?type=MEETING')}
                  >
                    View Meetings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AI Brief Dialog */}
        <Dialog
          open={openBriefDialog}
          onClose={() => setOpenBriefDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AutoAwesomeIcon color="secondary" />
              AI Campaign Brief
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {loadingBrief ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Generating AI campaign strategy...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  This may take 10-30 seconds
                </Typography>
              </Box>
            ) : aiBrief ? (
              <Box>
                {aiBrief.icpSummary && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      ICP Summary
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {aiBrief.icpSummary}
                    </Typography>
                  </>
                )}

                {aiBrief.messagingAngles && aiBrief.messagingAngles.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Messaging Angles
                    </Typography>
                    {aiBrief.messagingAngles.map((angle: string, idx: number) => (
                      <Typography key={idx} variant="body2" paragraph>
                        • {angle}
                      </Typography>
                    ))}
                  </>
                )}

                {aiBrief.valueProps && aiBrief.valueProps.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Value Propositions
                    </Typography>
                    {aiBrief.valueProps.map((prop: string, idx: number) => (
                      <Typography key={idx} variant="body2" paragraph>
                        • {prop}
                      </Typography>
                    ))}
                  </>
                )}

                {aiBrief.suggestedSegments && aiBrief.suggestedSegments.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Suggested Segments
                    </Typography>
                    {aiBrief.suggestedSegments.map((segment: string, idx: number) => (
                      <Typography key={idx} variant="body2" paragraph>
                        • {segment}
                      </Typography>
                    ))}
                  </>
                )}

                {aiBrief.channelRecommendations && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Channel Recommendations
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {aiBrief.channelRecommendations}
                    </Typography>
                  </>
                )}

                {aiBrief.timingCadence && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Timing & Cadence
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {aiBrief.timingCadence}
                    </Typography>
                  </>
                )}

                {!aiBrief.icpSummary && !aiBrief.messagingAngles && !aiBrief.channelRecommendations && (
                  <Alert severity="warning">
                    AI brief was generated but appears to be empty. Please try generating again.
                  </Alert>
                )}
              </Box>
            ) : (
              <Typography>Generating campaign brief...</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBriefDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
