'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  metrics: any;
  aiSummary: string | null;
  client: {
    name: string;
  };
  campaign: {
    name: string;
  } | null;
  createdAt: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Reports</Typography>
          <Button variant="contained" startIcon={<AssessmentIcon />}>
            New Report
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Key Metrics</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No reports found. Reports are generated from campaign performance data.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow
                        key={report.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/reports/${report.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(report.periodStart).toLocaleDateString()} -{' '}
                            {new Date(report.periodEnd).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>{report.client.name}</TableCell>
                        <TableCell>
                          {report.campaign ? report.campaign.name : 'All Campaigns'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {report.metrics.emailsSent && (
                              <Chip
                                label={`${report.metrics.emailsSent} sent`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {report.metrics.opens && (
                              <Chip
                                label={`${report.metrics.opens} opens`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                            {report.metrics.replies && (
                              <Chip
                                label={`${report.metrics.replies} replies`}
                                size="small"
                                variant="outlined"
                                color="success"
                              />
                            )}
                            {report.metrics.won && (
                              <Chip
                                label={`${report.metrics.won} won`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="View Report" size="small" color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
