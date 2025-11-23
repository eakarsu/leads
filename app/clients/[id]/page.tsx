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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Client {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string | null;
    _count: {
      leads: number;
    };
  }>;
  leads: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    qualificationScore: number | null;
    campaign: {
      name: string;
    };
  }>;
  reports: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }>;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client');
      const data = await response.json();
      setClient(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <Alert severity="error">Client not found</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/clients')}
          sx={{ mb: 2 }}
        >
          Back to Clients
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">{client.name}</Typography>
            {client.industry && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {client.industry}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              icon={<CampaignIcon />}
              label={`${client.campaigns.length} Campaigns`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PeopleIcon />}
              label={`${client.leads.length} Leads`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Client Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {client.website && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Website
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <a href={client.website} target="_blank" rel="noopener noreferrer">
                          {client.website}
                        </a>
                      </Typography>
                    </>
                  )}

                  {client.contactName && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Contact Name
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {client.contactName}
                      </Typography>
                    </>
                  )}

                  {client.contactEmail && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Contact Email
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <a href={`mailto:${client.contactEmail}`}>{client.contactEmail}</a>
                      </Typography>
                    </>
                  )}

                  {client.contactPhone && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Contact Phone
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <a href={`tel:${client.contactPhone}`}>{client.contactPhone}</a>
                      </Typography>
                    </>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Client Since
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </Typography>

                  {client.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {client.notes}
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Reports */}
            {client.reports.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Reports
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {client.reports.map((report) => (
                      <Box
                        key={report.id}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => router.push(`/reports/${report.id}`)}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(report.periodStart).toLocaleDateString()} -{' '}
                          {new Date(report.periodEnd).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Generated {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Campaigns */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Campaigns ({client.campaigns.length})</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CampaignIcon />}
                    size="small"
                    onClick={() => router.push('/campaigns')}
                  >
                    View All Campaigns
                  </Button>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Campaign Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell align="right">Leads</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.campaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">
                              No campaigns yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        client.campaigns.map((campaign) => (
                          <TableRow
                            key={campaign.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <TableCell>{campaign.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={campaign.status}
                                size="small"
                                color={getStatusColor(campaign.status) as any}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(campaign.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">{campaign._count.leads}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Leads */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Recent Leads ({client.leads.length})</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    size="small"
                    onClick={() => router.push('/leads')}
                  >
                    View All Leads
                  </Button>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Campaign</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              No leads yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        client.leads.map((lead) => (
                          <TableRow
                            key={lead.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <TableCell>{lead.fullName}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.campaign.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={lead.status}
                                size="small"
                                color={getLeadStatusColor(lead.status) as any}
                              />
                            </TableCell>
                            <TableCell>
                              {lead.qualificationScore !== null ? (
                                <Typography variant="body2">
                                  {lead.qualificationScore}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
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
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
