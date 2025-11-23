'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface Campaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  client: {
    id: string;
    name: string;
  };
  owner: {
    name: string;
  };
  _count: {
    leads: number;
  };
  createdAt: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiBrief, setAiBrief] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    status: 'DRAFT',
    channel: 'EMAIL',
    targetPersona: '',
    targetRegions: '',
  });

  // AI form state
  const [aiFormData, setAiFormData] = useState({
    industry: '',
    icp: '',
    offer: '',
    channels: '',
    geo: '',
    tone: 'Professional',
  });

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      setOpenDialog(false);
      setFormData({
        clientId: '',
        name: '',
        description: '',
        status: 'DRAFT',
        channel: 'EMAIL',
        targetPersona: '',
        targetRegions: '',
      });
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateAICampaignBrief = async () => {
    setLoadingAI(true);
    setError('');

    try {
      const response = await fetch('/api/ai/campaign-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) throw new Error('Failed to generate campaign brief');
      const data = await response.json();
      setAiBrief(data.brief);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI campaign brief');
    } finally {
      setLoadingAI(false);
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

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Campaigns</Typography>
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setOpenAIDialog(true)}
              sx={{ mr: 2 }}
            >
              AI Campaign Brief
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Campaign
            </Button>
          </Box>
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
                    <TableCell>Campaign Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Channel</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Leads</TableCell>
                    <TableCell>Owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          No campaigns found. Create your first campaign!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      >
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>{campaign.client.name}</TableCell>
                        <TableCell>
                          <Chip label={campaign.channel} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={campaign.status}
                            size="small"
                            color={getStatusColor(campaign.status) as any}
                          />
                        </TableCell>
                        <TableCell>{campaign._count.leads}</TableCell>
                        <TableCell>{campaign.owner.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create Campaign Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                fullWidth
                required
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                select
                label="Channel"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                fullWidth
              >
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                <MenuItem value="COLD_CALL">Cold Call</MenuItem>
                <MenuItem value="PAID_ADS">Paid Ads</MenuItem>
                <MenuItem value="MULTI_CHANNEL">Multi-Channel</MenuItem>
              </TextField>

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>

              <TextField
                label="Target Persona"
                value={formData.targetPersona}
                onChange={(e) => setFormData({ ...formData, targetPersona: e.target.value })}
                multiline
                rows={2}
                fullWidth
                placeholder="e.g., CTO at enterprise companies with 1000+ employees"
              />

              <TextField
                label="Target Regions"
                value={formData.targetRegions}
                onChange={(e) => setFormData({ ...formData, targetRegions: e.target.value })}
                fullWidth
                placeholder="e.g., United States, Canada, UK"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateCampaign}
              variant="contained"
              disabled={!formData.clientId || !formData.name || !formData.channel}
            >
              Create Campaign
            </Button>
          </DialogActions>
        </Dialog>

        {/* AI Campaign Brief Dialog */}
        <Dialog
          open={openAIDialog}
          onClose={() => setOpenAIDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AutoAwesomeIcon color="secondary" sx={{ mr: 1 }} />
              AI Campaign Brief Generator
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Provide details about your campaign, and AI will generate a comprehensive campaign
                brief including ICP summary, messaging angles, and channel recommendations.
              </Alert>

              <TextField
                label="Industry"
                value={aiFormData.industry}
                onChange={(e) => setAiFormData({ ...aiFormData, industry: e.target.value })}
                fullWidth
                required
                placeholder="e.g., SaaS, Manufacturing, Healthcare"
              />

              <TextField
                label="Ideal Customer Profile (ICP)"
                value={aiFormData.icp}
                onChange={(e) => setAiFormData({ ...aiFormData, icp: e.target.value })}
                multiline
                rows={2}
                fullWidth
                required
                placeholder="e.g., CTO at companies with 500+ employees in enterprise software"
              />

              <TextField
                label="Offer / Value Proposition"
                value={aiFormData.offer}
                onChange={(e) => setAiFormData({ ...aiFormData, offer: e.target.value })}
                multiline
                rows={2}
                fullWidth
                placeholder="e.g., Enterprise automation platform that reduces manual work by 70%"
              />

              <TextField
                label="Channel Mix"
                value={aiFormData.channels}
                onChange={(e) => setAiFormData({ ...aiFormData, channels: e.target.value })}
                fullWidth
                placeholder="e.g., Email, LinkedIn, Cold Calling"
              />

              <TextField
                label="Geographic Target"
                value={aiFormData.geo}
                onChange={(e) => setAiFormData({ ...aiFormData, geo: e.target.value })}
                fullWidth
                placeholder="e.g., United States, Canada, UK"
              />

              <TextField
                select
                label="Tone"
                value={aiFormData.tone}
                onChange={(e) => setAiFormData({ ...aiFormData, tone: e.target.value })}
                fullWidth
              >
                <MenuItem value="Professional">Professional</MenuItem>
                <MenuItem value="Casual">Casual</MenuItem>
                <MenuItem value="Consultative">Consultative</MenuItem>
                <MenuItem value="Direct">Direct</MenuItem>
              </TextField>

              {aiBrief && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Generated Campaign Brief:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                  >
                    {aiBrief}
                  </Typography>
                </Paper>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAIDialog(false)}>Close</Button>
            <Button
              onClick={generateAICampaignBrief}
              variant="contained"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              disabled={loadingAI || !aiFormData.industry || !aiFormData.icp}
            >
              {loadingAI ? 'Generating...' : 'Generate Brief'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
