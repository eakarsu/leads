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
  TextField,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import NotesSection from '@/components/NotesSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import ActivityTimeline from '@/components/ActivityTimeline';
import LeadScoreCard from '@/components/LeadScoreCard';
import FieldHistorySection from '@/components/FieldHistorySection';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import EmailIcon from '@mui/icons-material/Email';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function LeadDetailPageFull() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI states
  const [loadingQualify, setLoadingQualify] = useState(false);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [loadingActivitySummary, setLoadingActivitySummary] = useState<string | null>(null);

  const [qualificationResult, setQualificationResult] = useState<any>(null);
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);
  const [outreachResult, setOutreachResult] = useState<any>(null);
  const [activitySummaryResult, setActivitySummaryResult] = useState<any>(null);

  const [openQualifyDialog, setOpenQualifyDialog] = useState(false);
  const [openEnrichDialog, setOpenEnrichDialog] = useState(false);
  const [openOutreachDialog, setOpenOutreachDialog] = useState(false);
  const [openActivitySummaryDialog, setOpenActivitySummaryDialog] = useState(false);
  const [openNewActivityDialog, setOpenNewActivityDialog] = useState(false);

  const [outreachChannel, setOutreachChannel] = useState('EMAIL');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [newActivityData, setNewActivityData] = useState({
    type: 'EMAIL',
    content: '',
  });
  const [creatingActivity, setCreatingActivity] = useState(false);

  // Convert to Opportunity states
  const [openConvertDialog, setOpenConvertDialog] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertData, setConvertData] = useState({
    opportunityName: '',
    amount: '',
    stage: 'QUALIFICATION',
    probability: '25',
    expectedCloseDate: '',
    createContact: true,
  });

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
          customFields: lead.customFields,
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

  const handleGenerateOutreach = async () => {
    if (!lead) return;

    setLoadingOutreach(true);
    setError('');

    try {
      const response = await fetch('/api/ai/outreach-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: outreachChannel,
          leadName: lead.fullName,
          leadTitle: lead.title,
          leadCompany: lead.company,
          campaignBrief: lead.campaign?.description || '',
          leadPersona: lead.campaign?.targetPersona || '',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate outreach copy');
      const data = await response.json();
      setOutreachResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate outreach copy');
    } finally {
      setLoadingOutreach(false);
    }
  };

  const handleSummarizeActivity = async (activityId: string, content: string, type: string) => {
    setLoadingActivitySummary(activityId);
    setSelectedActivityId(activityId);
    setError('');

    try {
      const response = await fetch('/api/ai/activity-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: type,
          content: content,
        }),
      });

      if (!response.ok) throw new Error('Failed to summarize activity');
      const data = await response.json();
      setActivitySummaryResult(data);
      setOpenActivitySummaryDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to summarize activity');
    } finally {
      setLoadingActivitySummary(null);
    }
  };

  const handleCreateActivity = async () => {
    setCreatingActivity(true);
    setError('');

    try {
      const response = await fetch(`/api/leads/${params.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivityData),
      });

      if (!response.ok) throw new Error('Failed to create activity');

      setOpenNewActivityDialog(false);
      setNewActivityData({ type: 'EMAIL', content: '' });
      fetchLead(); // Refresh lead data to show new activity
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    } finally {
      setCreatingActivity(false);
    }
  };

  const handleConvertToOpportunity = async () => {
    setConverting(true);
    setError('');

    try {
      const nameParts = lead.fullName.split(' ');
      const response = await fetch(`/api/leads/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createContact: convertData.createContact,
          contactData: convertData.createContact ? {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: lead.email,
            phone: lead.phone,
            title: lead.title,
          } : null,
          opportunityData: {
            name: convertData.opportunityName || `${lead.fullName} - ${lead.client?.name || 'Opportunity'}`,
            stage: convertData.stage,
            amount: convertData.amount ? parseFloat(convertData.amount) : 0,
            probability: parseInt(convertData.probability),
            expectedCloseDate: convertData.expectedCloseDate || null,
            description: lead.notes,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to convert lead');
      }

      const result = await response.json();
      setOpenConvertDialog(false);

      // Redirect to the new opportunity
      router.push(`/opportunities/${result.opportunity.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to convert lead to opportunity');
    } finally {
      setConverting(false);
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
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<EnhancedEncryptionIcon />}
              onClick={handleEnrichLead}
              disabled={loadingEnrich}
              size="small"
            >
              {loadingEnrich ? 'Enriching...' : 'Enrich'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<EmailIcon />}
              onClick={() => setOpenOutreachDialog(true)}
              size="small"
            >
              Generate Outreach
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
            <Button
              variant="contained"
              color="success"
              startIcon={<TrendingUpIcon />}
              onClick={() => setOpenConvertDialog(true)}
              disabled={lead?.status === 'WON' || converting}
            >
              Convert to Opportunity
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Lead Info Card */}
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

            {/* Industry-Specific Custom Fields */}
            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(lead.customFields).map(([key, value]) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={key}>
                        <Typography variant="caption" color="text.secondary">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Typography>
                        <Typography variant="body1">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Campaign Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign
                </Typography>
                {lead.campaign ? (
                  <>
                    <Typography variant="body1">{lead.campaign.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.campaign.channel} • {lead.client.name}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No campaign assigned
                  </Typography>
                )}
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
                    <Grid size={{ xs: 12 }}>
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

            {/* Activities with AI Summary */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Activity Timeline
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenNewActivityDialog(true)}
                  >
                    New Activity
                  </Button>
                </Box>
                {lead.activities.length === 0 ? (
                  <Typography color="text.secondary">No activities recorded yet</Typography>
                ) : (
                  <List>
                    {lead.activities.map((activity: any, index: number) => (
                      <div key={activity.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Chip label={activity.type} size="small" />
                                <Typography variant="body2">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </Typography>
                                {activity.aiSummary && (
                                  <Chip
                                    label="AI Summary"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                                <Button
                                  size="small"
                                  startIcon={<SummarizeIcon />}
                                  onClick={() =>
                                    handleSummarizeActivity(
                                      activity.id,
                                      activity.content,
                                      activity.type
                                    )
                                  }
                                  disabled={loadingActivitySummary === activity.id}
                                >
                                  {loadingActivitySummary === activity.id
                                    ? 'Summarizing...'
                                    : 'AI Summarize'}
                                </Button>
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Box component="span" display="block" sx={{ mb: 0.5 }}>
                                  {activity.aiSummary || activity.content}
                                </Box>
                                <Box component="span" display="block" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                  By {activity.user.name}
                                </Box>
                              </Box>
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

          {/* Lead Score Card */}
          <Grid size={{ xs: 12 }}>
            <LeadScoreCard leadId={params.id as string} />
          </Grid>

          {/* Notes Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <NotesSection
              leadId={params.id as string}
              currentUserId={lead?.owner?.id}
            />
          </Grid>

          {/* Attachments Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <AttachmentsSection
              leadId={params.id as string}
              currentUserId={lead?.owner?.id}
            />
          </Grid>

          {/* Activity Timeline */}
          <Grid size={{ xs: 12 }}>
            <ActivityTimeline leadId={params.id as string} />
          </Grid>

          {/* Field History */}
          <Grid size={{ xs: 12 }}>
            <FieldHistorySection objectType="Lead" objectId={params.id as string} />
          </Grid>
        </Grid>

        {/* AI Qualification Dialog */}
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

        {/* AI Enrichment Dialog */}
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
                  This data is inferred by AI. Please verify before use.
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

                  {enrichmentResult.additionalInsights && Object.keys(enrichmentResult.additionalInsights).length > 0 && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Additional Insights
                          </Typography>
                        </Divider>
                      </Grid>
                      {Object.entries(enrichmentResult.additionalInsights).map(([key, value]) => (
                        <Grid size={{ xs: 6 }} key={key}>
                          <Typography variant="caption" color="text.secondary">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Typography variant="body2">{String(value)}</Typography>
                        </Grid>
                      ))}
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEnrichDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* AI Outreach Copy Dialog */}
        <Dialog
          open={openOutreachDialog}
          onClose={() => setOpenOutreachDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AutoAwesomeIcon color="secondary" sx={{ mr: 1 }} />
              AI Outreach Copy Generator
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Generate personalized outreach content. Review and edit before sending!
              </Alert>

              <TextField
                select
                label="Channel"
                value={outreachChannel}
                onChange={(e) => setOutreachChannel(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn Message</MenuItem>
                <MenuItem value="CALL_SCRIPT">Call Script</MenuItem>
              </TextField>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerateOutreach}
                disabled={loadingOutreach}
                fullWidth
                sx={{ mb: 2 }}
              >
                {loadingOutreach ? 'Generating...' : 'Generate Outreach Copy'}
              </Button>

              {outreachResult && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Generated {outreachChannel} Copy:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                  >
                    {outreachResult.copy}
                  </Typography>
                </Paper>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOutreachDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* AI Activity Summary Dialog */}
        <Dialog
          open={openActivitySummaryDialog}
          onClose={() => setOpenActivitySummaryDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <SummarizeIcon color="secondary" sx={{ mr: 1 }} />
              AI Activity Summary
            </Box>
          </DialogTitle>
          <DialogContent>
            {activitySummaryResult && (
              <Box sx={{ pt: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body2">{activitySummaryResult.summary}</Typography>
                </Paper>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sentiment
                  </Typography>
                  <Chip
                    label={activitySummaryResult.sentiment}
                    color={
                      activitySummaryResult.sentiment === 'Positive'
                        ? 'success'
                        : activitySummaryResult.sentiment === 'Negative'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {activitySummaryResult.sentimentReason}
                  </Typography>
                </Box>

                {activitySummaryResult.keyInsights &&
                  activitySummaryResult.keyInsights.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Insights
                      </Typography>
                      <List dense>
                        {activitySummaryResult.keyInsights.map((insight: string, idx: number) => (
                          <ListItem key={idx}>
                            <ListItemText primary={`• ${insight}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                {activitySummaryResult.nextSteps && activitySummaryResult.nextSteps.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Next Steps
                    </Typography>
                    <List dense>
                      {activitySummaryResult.nextSteps.map((step: string, idx: number) => (
                        <ListItem key={idx}>
                          <ListItemText primary={`• ${step}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActivitySummaryDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* New Activity Dialog */}
        <Dialog open={openNewActivityDialog} onClose={() => setOpenNewActivityDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Activity</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Activity Type"
                value={newActivityData.type}
                onChange={(e) => setNewActivityData({ ...newActivityData, type: e.target.value })}
                fullWidth
                required
              >
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="CALL">Call</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                <MenuItem value="MEETING">Meeting</MenuItem>
                <MenuItem value="NOTE">Note</MenuItem>
              </TextField>

              <TextField
                label="Activity Details"
                value={newActivityData.content}
                onChange={(e) => setNewActivityData({ ...newActivityData, content: e.target.value })}
                fullWidth
                multiline
                rows={4}
                required
                placeholder="Enter details about this activity..."
                helperText="Describe what happened during this interaction"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNewActivityDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateActivity}
              variant="contained"
              disabled={creatingActivity || !newActivityData.content}
            >
              {creatingActivity ? 'Creating...' : 'Create Activity'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Convert to Opportunity Dialog */}
        <Dialog
          open={openConvertDialog}
          onClose={() => !converting && setOpenConvertDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Convert Lead to Opportunity</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Opportunity Name"
                value={convertData.opportunityName}
                onChange={(e) => setConvertData({ ...convertData, opportunityName: e.target.value })}
                margin="normal"
                helperText="Leave blank to auto-generate"
              />
              <TextField
                fullWidth
                select
                label="Stage"
                value={convertData.stage}
                onChange={(e) => setConvertData({ ...convertData, stage: e.target.value })}
                margin="normal"
              >
                <MenuItem value="PROSPECTING">Prospecting</MenuItem>
                <MenuItem value="QUALIFICATION">Qualification</MenuItem>
                <MenuItem value="NEEDS_ANALYSIS">Needs Analysis</MenuItem>
                <MenuItem value="PROPOSAL">Proposal</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Estimated Amount ($)"
                value={convertData.amount}
                onChange={(e) => setConvertData({ ...convertData, amount: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="number"
                label="Probability (%)"
                value={convertData.probability}
                onChange={(e) => setConvertData({ ...convertData, probability: e.target.value })}
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                fullWidth
                type="date"
                label="Expected Close Date"
                value={convertData.expectedCloseDate}
                onChange={(e) => setConvertData({ ...convertData, expectedCloseDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <input
                    type="checkbox"
                    checked={convertData.createContact}
                    onChange={(e) => setConvertData({ ...convertData, createContact: e.target.checked })}
                    style={{ marginRight: 8 }}
                  />
                  Also create a Contact record from this lead
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConvertDialog(false)} disabled={converting}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertToOpportunity}
              variant="contained"
              color="success"
              disabled={converting}
              startIcon={<TrendingUpIcon />}
            >
              {converting ? 'Converting...' : 'Convert to Opportunity'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
