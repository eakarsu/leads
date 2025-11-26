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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import GridOnIcon from '@mui/icons-material/GridOn';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CategoryIcon from '@mui/icons-material/Category';
import ScheduleIcon from '@mui/icons-material/Schedule';

// Builder Report interface
interface BuilderReport {
  id: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'SUMMARY' | 'MATRIX';
  objectType: string;
  columns: string[];
  filters?: any;
  groupings?: string[];
  sortBy?: any;
  chartConfig?: any;
  isPublic: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Legacy Snapshot Report interface
interface SnapshotReport {
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
  isSnapshot: true;
}

type Report = BuilderReport | SnapshotReport;

function isSnapshotReport(report: Report): report is SnapshotReport {
  return 'isSnapshot' in report && report.isSnapshot === true;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningReport, setRunningReport] = useState(false);
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

      // Auto-run builder reports
      if (!('isSnapshot' in data)) {
        runReport(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runReport = async (reportConfig?: BuilderReport) => {
    const config = reportConfig || (report as BuilderReport);
    if (!config || isSnapshotReport(config)) return;

    setRunningReport(true);
    setError('');

    try {
      const response = await fetch('/api/reports/builder/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectType: config.objectType,
          columns: config.columns,
          filters: config.filters,
          groupings: config.groupings,
          sortBy: config.sortBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run report');
      }

      const data = await response.json();
      setReportData(data.results || []);

      // Update lastRunAt
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastRunAt: new Date().toISOString() }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningReport(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!report || !isSnapshotReport(report)) return;

    setLoadingSummary(true);
    setAiSummary(null);
    setError('');

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

      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiSummary: JSON.stringify(data),
        }),
      });

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

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'TABULAR': return <TableChartIcon />;
      case 'SUMMARY': return <BarChartIcon />;
      case 'MATRIX': return <GridOnIcon />;
      default: return <TableChartIcon />;
    }
  };

  const formatColumnName = (col: string) => {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
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
        <Alert severity="error" sx={{ mb: 2 }}>Report not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/reports')}>
          Back to Reports
        </Button>
      </DashboardLayout>
    );
  }

  // Render Snapshot Report (legacy campaign reports)
  if (isSnapshotReport(report)) {
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
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Report Details</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Client</Typography>
                    <Typography variant="body1" gutterBottom>{report.client.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Campaign</Typography>
                    <Typography variant="body1" gutterBottom>{report.campaign?.name || 'All Campaigns'}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Outreach Metrics</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Typography variant="body2">Emails Sent</Typography>
                        <Typography variant="h4">{m.emailsSent || 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Typography variant="body2">Opens</Typography>
                        <Typography variant="h4">{m.opens || 0}</Typography>
                        <Typography variant="caption">{openRate}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Typography variant="body2">Clicks</Typography>
                        <Typography variant="h4">{m.clicks || 0}</Typography>
                        <Typography variant="caption">{clickRate}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Conversion Metrics</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                        <Typography variant="body2">Meetings</Typography>
                        <Typography variant="h4">{m.meetings || 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.main', color: 'success.contrastText' }}>
                        <Typography variant="body2">Deals Won</Typography>
                        <Typography variant="h4">{m.won || 0}</Typography>
                        <Typography variant="caption">{conversionRate}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Overall Conversion Rate</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h5" color="success.main">{conversionRate}</Typography>
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
          </Grid>

          {/* AI Summary Dialog */}
          <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <AutoAwesomeIcon color="secondary" />
                AI Report Summary
              </Box>
            </DialogTitle>
            <DialogContent>
              {loadingSummary ? (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Analyzing campaign performance with AI...
                  </Typography>
                </Box>
              ) : aiSummary ? (
                <Box>
                  {aiSummary.performanceOverview && (
                    <>
                      <Typography variant="h6" gutterBottom>Performance Overview</Typography>
                      <Typography variant="body1" paragraph>{aiSummary.performanceOverview}</Typography>
                    </>
                  )}
                  {aiSummary.keyWins?.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Key Wins</Typography>
                      {aiSummary.keyWins.map((win: string, idx: number) => (
                        <Box key={idx} display="flex" alignItems="start" gap={1} mb={1}>
                          <Chip label="✓" size="small" color="success" sx={{ minWidth: 32 }} />
                          <Typography variant="body2">{win}</Typography>
                        </Box>
                      ))}
                    </>
                  )}
                  {aiSummary.recommendations?.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Recommendations</Typography>
                      {aiSummary.recommendations.map((rec: string, idx: number) => (
                        <Box key={idx} display="flex" alignItems="start" gap={1} mb={1}>
                          <Chip label={idx + 1} size="small" color="secondary" sx={{ minWidth: 32 }} />
                          <Typography variant="body2">{rec}</Typography>
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              ) : (
                <Typography>Click "Generate AI Summary" to create an executive summary.</Typography>
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

  // Render Builder Report
  const builderReport = report as BuilderReport;

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

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Box display="flex" alignItems="center" gap={2}>
              {getReportTypeIcon(builderReport.reportType)}
              <Typography variant="h4">{builderReport.name}</Typography>
            </Box>
            {builderReport.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {builderReport.description}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => runReport()}
              disabled={runningReport}
            >
              {runningReport ? 'Running...' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/report-builder?edit=${reportId}`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Report Info Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CategoryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Object Type</Typography>
                <Typography variant="h6">{builderReport.objectType}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ViewColumnIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Columns</Typography>
                <Typography variant="h6">{Array.isArray(builderReport.columns) ? builderReport.columns.length : 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                {builderReport.isPublic ? (
                  <PublicIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                ) : (
                  <LockIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                )}
                <Typography variant="body2" color="text.secondary">Visibility</Typography>
                <Typography variant="h6">{builderReport.isPublic ? 'Public' : 'Private'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Last Run</Typography>
                <Typography variant="h6">
                  {builderReport.lastRunAt
                    ? new Date(builderReport.lastRunAt).toLocaleDateString()
                    : 'Never'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Report Configuration */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Report Configuration</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Chip
                  icon={getReportTypeIcon(builderReport.reportType)}
                  label={builderReport.reportType}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Columns</Typography>
                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.isArray(builderReport.columns) && builderReport.columns.slice(0, 5).map((col) => (
                    <Chip key={col} label={formatColumnName(col)} size="small" variant="outlined" />
                  ))}
                  {Array.isArray(builderReport.columns) && builderReport.columns.length > 5 && (
                    <Chip label={`+${builderReport.columns.length - 5} more`} size="small" />
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Filters</Typography>
                <Typography variant="body2">
                  {builderReport.filters && Object.keys(builderReport.filters).length > 0
                    ? `${Object.keys(builderReport.filters).length} active filter(s)`
                    : 'No filters applied'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Report Results */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Results ({reportData.length} records)
              </Typography>
              {runningReport && <CircularProgress size={24} />}
            </Box>

            {runningReport ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Running report...</Typography>
              </Box>
            ) : reportData.length === 0 ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={8}>
                <TableChartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No data found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your filters or run the report to fetch data.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => runReport()}
                >
                  Run Report
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {Array.isArray(builderReport.columns) && builderReport.columns.map((col) => (
                        <TableCell key={col} sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>
                          {formatColumnName(col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        {Array.isArray(builderReport.columns) && builderReport.columns.map((col) => (
                          <TableCell key={col}>
                            {typeof row[col] === 'object'
                              ? JSON.stringify(row[col])
                              : row[col]?.toString() || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
