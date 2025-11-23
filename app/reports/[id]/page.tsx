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
  Button,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  metrics: {
    emailsSent?: number;
    opens?: number;
    clicks?: number;
    replies?: number;
    meetings?: number;
    won?: number;
    openRate?: number;
    clickRate?: number;
    replyRate?: number;
    conversionRate?: number;
  };
  aiSummary: string | null;
  client: {
    id: string;
    name: string;
  };
  campaign: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReport(data);
      // Don't load cached AI summary - always generate fresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!report) return;

    setLoadingSummary(true);
    setAiSummary(null); // Clear any old data
    setError(''); // Clear any errors

    try {
      const response = await fetch('/api/ai/report-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: report.metrics,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          campaignName: report.campaign?.name || 'All Campaigns',
          clientName: report.client?.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI summary');
      }

      const data = await response.json();
      setAiSummary(data);

      // Save the summary to the report
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiSummary: JSON.stringify(data),
        }),
      });

      // Refresh report to get updated summary
      fetchReport();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const calculateRate = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
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

  if (!report) {
    return (
      <DashboardLayout>
        <Alert severity="error">Report not found</Alert>
      </DashboardLayout>
    );
  }

  const m = report.metrics;
  const openRate = m.emailsSent ? calculateRate(m.opens || 0, m.emailsSent) : '0%';
  const clickRate = m.opens ? calculateRate(m.clicks || 0, m.opens) : '0%';
  const replyRate = m.emailsSent ? calculateRate(m.replies || 0, m.emailsSent) : '0%';
  const conversionRate = m.emailsSent ? calculateRate(m.won || 0, m.emailsSent) : '0%';

  return (
    <DashboardLayout>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/reports')}
          sx={{ mb: 2 }}
        >
          Back to Reports
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Campaign Report</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {new Date(report.periodStart).toLocaleDateString()} -{' '}
              {new Date(report.periodEnd).toLocaleDateString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => {
              setOpenSummaryDialog(true);
              handleGenerateSummary();
            }}
          >
            Generate AI Summary
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Report Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Details
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {report.client.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Campaign
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {report.campaign?.name || 'All Campaigns'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Period
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(report.periodStart).toLocaleDateString()} to{' '}
                    {new Date(report.periodEnd).toLocaleDateString()}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Generated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outreach Metrics
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="body2">Emails Sent</Typography>
                      <Typography variant="h4">{m.emailsSent || 0}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                      <Typography variant="body2">Opens</Typography>
                      <Typography variant="h4">{m.opens || 0}</Typography>
                      <Typography variant="caption">{openRate}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                      <Typography variant="body2">Clicks</Typography>
                      <Typography variant="h4">{m.clicks || 0}</Typography>
                      <Typography variant="caption">{clickRate}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="body2">Replies</Typography>
                      <Typography variant="h4">{m.replies || 0}</Typography>
                      <Typography variant="caption">{replyRate}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Conversion Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversion Metrics
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                      <Typography variant="body2">Meetings</Typography>
                      <Typography variant="h4">{m.meetings || 0}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.main', color: 'success.contrastText' }}>
                      <Typography variant="body2">Deals Won</Typography>
                      <Typography variant="h4">{m.won || 0}</Typography>
                      <Typography variant="caption">{conversionRate}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Overall Conversion Rate
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h5" color="success.main">
                          {conversionRate}
                        </Typography>
                        {parseFloat(conversionRate) >= 5 ? (
                          <TrendingUpIcon color="success" />
                        ) : (
                          <TrendingDownIcon color="error" />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Funnel Visualization */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversion Funnel
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Emails Sent</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {m.emailsSent || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ bgcolor: 'primary.main', height: 40, width: '100%' }} />
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Opens ({openRate})</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {m.opens || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          bgcolor: 'info.main',
                          height: 40,
                          width: m.emailsSent ? `${((m.opens || 0) / m.emailsSent) * 100}%` : '0%',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Replies ({replyRate})</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {m.replies || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          bgcolor: 'warning.main',
                          height: 40,
                          width: m.emailsSent ? `${((m.replies || 0) / m.emailsSent) * 100}%` : '0%',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Meetings</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {m.meetings || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          bgcolor: 'secondary.main',
                          height: 40,
                          width: m.emailsSent ? `${((m.meetings || 0) / m.emailsSent) * 100}%` : '0%',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Deals Won ({conversionRate})</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {m.won || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          bgcolor: 'success.main',
                          height: 40,
                          width: m.emailsSent ? `${((m.won || 0) / m.emailsSent) * 100}%` : '0%',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AI Summary Dialog */}
        <Dialog
          open={openSummaryDialog}
          onClose={() => setOpenSummaryDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AutoAwesomeIcon color="secondary" />
              AI Report Summary
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {loadingSummary ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Analyzing campaign performance with AI...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  This may take 10-30 seconds
                </Typography>
              </Box>
            ) : aiSummary ? (
              <Box>
                {aiSummary.performanceOverview && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Performance Overview
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {aiSummary.performanceOverview}
                    </Typography>
                  </>
                )}

                {aiSummary.keyWins && aiSummary.keyWins.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Key Wins
                    </Typography>
                    {aiSummary.keyWins.map((win: string, idx: number) => (
                      <Box key={idx} display="flex" alignItems="start" gap={1} mb={1}>
                        <Chip label="✓" size="small" color="success" sx={{ minWidth: 32 }} />
                        <Typography variant="body2">{win}</Typography>
                      </Box>
                    ))}
                  </>
                )}

                {aiSummary.insights && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Insights & Analysis
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {aiSummary.insights}
                    </Typography>
                  </>
                )}

                {aiSummary.opportunities && aiSummary.opportunities.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Areas of Opportunity
                    </Typography>
                    {aiSummary.opportunities.map((opp: string, idx: number) => (
                      <Box key={idx} display="flex" alignItems="start" gap={1} mb={1}>
                        <Chip label="→" size="small" color="warning" sx={{ minWidth: 32 }} />
                        <Typography variant="body2">{opp}</Typography>
                      </Box>
                    ))}
                  </>
                )}

                {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Recommendations
                    </Typography>
                    {aiSummary.recommendations.map((rec: string, idx: number) => (
                      <Box key={idx} display="flex" alignItems="start" gap={1} mb={1}>
                        <Chip label={idx + 1} size="small" color="secondary" sx={{ minWidth: 32 }} />
                        <Typography variant="body2">{rec}</Typography>
                      </Box>
                    ))}
                  </>
                )}

                {!aiSummary.performanceOverview && !aiSummary.keyWins && !aiSummary.insights && (
                  <Alert severity="warning">
                    AI summary was generated but appears to be empty. Please try generating again.
                  </Alert>
                )}
              </Box>
            ) : (
              <Typography>Click "Generate AI Summary" to create an executive summary of this report.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSummaryDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
