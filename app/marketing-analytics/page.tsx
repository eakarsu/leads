'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableRow, Chip, Grid, Card,
  CardContent, Alert,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import EmailIcon from '@mui/icons-material/Email';
import RouteIcon from '@mui/icons-material/Route';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import ExportToolbar from '@/components/ExportToolbar';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  channel: string;
  _count?: { leads: number };
  createdAt: string;
}

interface EmailData {
  id: string;
  subject: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

interface JourneyData {
  id: string;
  name: string;
  status: string;
  enrollmentCount: number;
  createdAt: string;
}

const campaignColumns: Column[] = [
  { id: 'name', label: 'Campaign Name', sortable: false },
  { id: 'status', label: 'Status', sortable: false },
  { id: 'channel', label: 'Channel', sortable: false },
  { id: 'leads', label: 'Leads', sortable: false },
];

const emailColumns: Column[] = [
  { id: 'subject', label: 'Subject', sortable: false },
  { id: 'status', label: 'Status', sortable: false },
  { id: 'sentCount', label: 'Sent', sortable: false },
  { id: 'openCount', label: 'Opens', sortable: false },
  { id: 'clickCount', label: 'Clicks', sortable: false },
  { id: 'openRate', label: 'Open Rate', sortable: false },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'COMPLETED': return 'info';
    case 'PAUSED': return 'warning';
    case 'SENT': return 'success';
    default: return 'default';
  }
};

export default function MarketingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [journeys, setJourneys] = useState<JourneyData[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [campaignRes, emailRes, journeyRes] = await Promise.all([
        fetch('/api/campaigns?pageSize=100'),
        fetch('/api/mass-email?pageSize=100'),
        fetch('/api/journeys?pageSize=100'),
      ]);

      if (campaignRes.ok) {
        const cData = await campaignRes.json();
        setCampaigns(cData.data || (Array.isArray(cData) ? cData : []));
      }
      if (emailRes.ok) {
        const eData = await emailRes.json();
        setEmails(eData.data || (Array.isArray(eData) ? eData : []));
      }
      if (journeyRes.ok) {
        const jData = await journeyRes.json();
        setJourneys(jData.data || (Array.isArray(jData) ? jData : []));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const totalEmailsSent = emails.reduce((sum, e) => sum + (e.sentCount || 0), 0);
  const totalJourneyEnrollments = journeys.reduce((sum, j) => sum + (j.enrollmentCount || 0), 0);

  const statCards = [
    { label: 'Total Campaigns', value: campaigns.length, icon: <CampaignIcon />, color: '#1976d2' },
    { label: 'Active Campaigns', value: activeCampaigns, icon: <TrendingUpIcon />, color: '#388e3c' },
    { label: 'Total Emails Sent', value: totalEmailsSent.toLocaleString(), icon: <EmailIcon />, color: '#f57c00' },
    { label: 'Journey Enrollments', value: totalJourneyEnrollments.toLocaleString(), icon: <RouteIcon />, color: '#7b1fa2' },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Marketing Analytics</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <>
            {/* Stat Cards */}
            <Grid container spacing={2} mb={3}>
              {statCards.map((card) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
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

            {/* Campaign Performance */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Campaign Performance</Typography>
                  <ExportToolbar
                    data={campaigns.map((c) => ({
                      Name: c.name, Status: c.status, Channel: c.channel,
                      Leads: c._count?.leads || 0,
                    }))}
                    filename="campaign-performance"
                    title="Campaign Performance"
                  />
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={campaignColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {campaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">No campaign data available.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaigns.slice(0, 10).map((campaign) => (
                          <TableRow key={campaign.id} hover>
                            <TableCell>{campaign.name}</TableCell>
                            <TableCell>
                              <Chip label={campaign.status} size="small" color={getStatusColor(campaign.status) as any} />
                            </TableCell>
                            <TableCell><Chip label={campaign.channel} size="small" variant="outlined" /></TableCell>
                            <TableCell>{campaign._count?.leads || 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {campaigns.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Showing top 10 of {campaigns.length} campaigns
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Email Metrics */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Email Metrics</Typography>
                  <ExportToolbar
                    data={emails.map((e) => ({
                      Subject: e.subject, Status: e.status,
                      Sent: e.sentCount, Opens: e.openCount, Clicks: e.clickCount,
                      'Open Rate': e.sentCount > 0 ? `${((e.openCount / e.sentCount) * 100).toFixed(1)}%` : '0%',
                    }))}
                    filename="email-metrics"
                    title="Email Metrics"
                  />
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead columns={emailColumns} sortBy="" sortOrder="asc" onSort={() => {}} />
                    <TableBody>
                      {emails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">No email data available.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        emails.slice(0, 10).map((email) => {
                          const openRate = email.sentCount > 0 ? ((email.openCount / email.sentCount) * 100).toFixed(1) : '0.0';
                          return (
                            <TableRow key={email.id} hover>
                              <TableCell>{email.subject}</TableCell>
                              <TableCell>
                                <Chip label={email.status} size="small" color={getStatusColor(email.status) as any} />
                              </TableCell>
                              <TableCell>{(email.sentCount || 0).toLocaleString()}</TableCell>
                              <TableCell>{(email.openCount || 0).toLocaleString()}</TableCell>
                              <TableCell>{(email.clickCount || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${openRate}%`}
                                  size="small"
                                  color={Number(openRate) >= 20 ? 'success' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {emails.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Showing top 10 of {emails.length} emails
                  </Typography>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
