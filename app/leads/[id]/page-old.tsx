'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  LinearProgress,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI states
  const [loadingQualify, setLoadingQualify] = useState(false);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<any>(null);
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);
  const [openQualifyDialog, setOpenQualifyDialog] = useState(false);
  const [openEnrichDialog, setOpenEnrichDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchLead();
    }
  }, [params.id]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch lead');
      const data = await response.json();
      setLead(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQualifyLead = async () => {
    setLoadingQualify(true);
    setError('');

    try {
      const response = await fetch('/api/ai/lead-qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: params.id }),
      });

      if (!response.ok) throw new Error('Failed to qualify lead');
      const data = await response.json();
      setQualificationResult(data);
      setOpenQualifyDialog(true);

      // Update lead score
      if (data.qualificationScore) {
        await fetch(`/api/leads/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qualificationScore: data.qualificationScore }),
        });
        fetchLead();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to qualify lead');
    } finally {
      setLoadingQualify(false);
    }
  };

  const handleEnrichLead = async () => {
    if (!lead) return;

    setLoadingEnrich(true);
    setError('');

    try {
      const response = await fetch('/api/ai/lead-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: lead.fullName,
          title: lead.title,
          company: lead.company,
          website: lead.website,
          linkedinUrl: lead.linkedinUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to enrich lead');
      const data = await response.json();
      setEnrichmentResult(data);
      setOpenEnrichDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to enrich lead data');
    } finally {
      setLoadingEnrich(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
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

  if (!lead) {
    return (
      <DashboardLayout>
        <Alert severity="error">Lead not found</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/leads')}
          sx={{ mb: 2 }}
        >
          Back to Leads
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{lead.fullName}</Typography>
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<EnhancedEncryptionIcon />}
              onClick={handleEnrichLead}
              disabled={loadingEnrich}
              sx={{ mr: 2 }}
            >
              {loadingEnrich ? 'Enriching...' : 'AI Enrich'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AssessmentIcon />}
              onClick={handleQualifyLead}
              disabled={loadingQualify}
            >
              {loadingQualify ? 'Qualifying...' : 'AI Qualify'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Lead Information */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lead Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body1">{lead.company}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Title
                    </Typography>
                    <Typography variant="body1">{lead.title}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{lead.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">{lead.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      LinkedIn
                    </Typography>
                    <Typography variant="body1">
                      {lead.linkedinUrl ? (
                        <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          View Profile
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Source
                    </Typography>
                    <Typography variant="body1">{lead.source || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign
                </Typography>
                <Typography variant="body1">{lead.campaign.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {lead.campaign.channel} • {lead.client.name}
                </Typography>
              </CardContent>
            </Card>

            {/* Enrichment Data */}
            {lead.enrichmentData && lead.enrichmentData.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Enrichment Data
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Company Size
                      </Typography>
                      <Typography variant="body1">
                        {lead.enrichmentData[0].companySize || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Industry
                      </Typography>
                      <Typography variant="body1">
                        {lead.enrichmentData[0].industry || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tech Stack
                      </Typography>
                      <Typography variant="body2">
                        {lead.enrichmentData[0].techStack || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {lead.enrichmentData[0].location || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Activities */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Timeline
                </Typography>
                {lead.activities.length === 0 ? (
                  <Typography color="text.secondary">No activities recorded yet</Typography>
                ) : (
                  <List>
                    {lead.activities.map((activity: any, index: number) => (
                      <div key={activity.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip label={activity.type} size="small" />
                                <Typography variant="body2">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2">{activity.content}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  By {activity.user.name}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < lead.activities.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={lead.status}
                  color={getStatusColor(lead.status) as any}
                  sx={{ mb: 2 }}
                />

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Qualification Score
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h3">{lead.qualificationScore}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={lead.qualificationScore}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={getScoreColor(lead.qualificationScore) as any}
                  />
                </Box>

                {lead.notes && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lead.notes}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Qualification Dialog */}
        <Dialog
          open={openQualifyDialog}
          onClose={() => setOpenQualifyDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AssessmentIcon color="secondary" sx={{ mr: 1 }} />
              AI Lead Qualification
            </Box>
          </DialogTitle>
          <DialogContent>
            {qualificationResult && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Qualification Score
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h2" color="primary">
                      {qualificationResult.qualificationScore}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={qualificationResult.qualificationScore}
                      sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                      color={getScoreColor(qualificationResult.qualificationScore) as any}
                    />
                  </Box>
                </Box>

                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fit Summary
                  </Typography>
                  <Typography variant="body2">{qualificationResult.fitSummary}</Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Next Best Action
                  </Typography>
                  <Typography variant="body2">{qualificationResult.nextBestAction}</Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenQualifyDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Enrichment Dialog */}
        <Dialog
          open={openEnrichDialog}
          onClose={() => setOpenEnrichDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <EnhancedEncryptionIcon color="secondary" sx={{ mr: 1 }} />
              AI Data Enrichment
            </Box>
          </DialogTitle>
          <DialogContent>
            {enrichmentResult && (
              <Box sx={{ pt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This data is inferred by AI based on available information. Please verify before
                  use.
                </Alert>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Company Size
                    </Typography>
                    <Typography variant="body1">{enrichmentResult.companySize}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Industry
                    </Typography>
                    <Typography variant="body1">{enrichmentResult.industry}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Tech Stack
                    </Typography>
                    <Typography variant="body2">{enrichmentResult.techStack}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">{enrichmentResult.location}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Decision Maker Relevance
                    </Typography>
                    <Typography variant="body2">
                      {enrichmentResult.decisionMakerRelevance}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEnrichDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
