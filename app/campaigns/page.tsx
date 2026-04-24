'use client';

import { useState, useMemo } from 'react';
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
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  IconButton,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  channel: string;
  targetPersona?: string;
  startDate?: string;
  endDate?: string;
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

const columns: Column[] = [
  { id: 'name', label: 'Campaign Name' },
  { id: 'client', label: 'Client' },
  { id: 'channel', label: 'Channel' },
  { id: 'status', label: 'Status' },
  { id: 'leads', label: 'Leads', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function CampaignsPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [clients, setClients] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiBrief, setAiBrief] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: '',
    channel: '',
    targetPersona: '',
    startDate: '',
    endDate: '',
  });

  // Sort state
  const [sortBy, setSortByState] = useState('createdAt');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');

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

  const {
    data: campaigns,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Campaign>({
    url: '/api/campaigns',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
  });

  // Fetch clients for the create dialog
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortByState(col);
    setSortOrderState(newOrder);
    setSort(col, newOrder);
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
      toast.showSuccess('Campaign created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete campaign');
      toast.showSuccess('Campaign deleted successfully');
      setOpenDetailDialog(false);
      setSelectedCampaign(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleStartEdit = () => {
    if (!selectedCampaign) return;
    setEditFormData({
      name: selectedCampaign.name || '',
      description: selectedCampaign.description || '',
      status: selectedCampaign.status || '',
      channel: selectedCampaign.channel || '',
      targetPersona: selectedCampaign.targetPersona || '',
      startDate: selectedCampaign.startDate
        ? new Date(selectedCampaign.startDate).toISOString().split('T')[0]
        : '',
      endDate: selectedCampaign.endDate
        ? new Date(selectedCampaign.endDate).toISOString().split('T')[0]
        : '',
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedCampaign) return;
    try {
      const payload: Record<string, any> = {
        name: editFormData.name,
        description: editFormData.description,
        status: editFormData.status,
        channel: editFormData.channel,
        targetPersona: editFormData.targetPersona,
        startDate: editFormData.startDate || null,
        endDate: editFormData.endDate || null,
      };

      const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update campaign');

      toast.showSuccess('Campaign updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      setSelectedCampaign(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const generateAICampaignBrief = async () => {
    setLoadingAI(true);

    try {
      const response = await fetch('/api/ai/campaign-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) throw new Error('Failed to generate campaign brief');
      const data = await response.json();
      setAiBrief(data.brief);
      toast.showSuccess('AI brief generated successfully');
    } catch (err: any) {
      toast.showError(err.message || 'Failed to generate AI campaign brief');
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

  const exportData = useMemo(() => {
    return campaigns.map((c) => ({
      Name: c.name,
      Client: c.client.name,
      Channel: c.channel,
      Status: c.status,
      Leads: c._count.leads,
      Owner: c.owner.name,
      Created: new Date(c.createdAt).toLocaleDateString(),
    }));
  }, [campaigns]);

  const handleRowClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Campaigns</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="campaigns" title="Campaigns" />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setOpenAIDialog(true)}
            >
              AI Campaign Brief
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                fetchClients();
                setOpenDialog(true);
              }}
            >
              New Campaign
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead
                    columns={columns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
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
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' },
                          }}
                          onClick={() => handleRowClick(campaign)}
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
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setEditFormData({
                                  name: campaign.name || '',
                                  description: campaign.description || '',
                                  status: campaign.status || '',
                                  channel: campaign.channel || '',
                                  targetPersona: campaign.targetPersona || '',
                                  startDate: campaign.startDate
                                    ? new Date(campaign.startDate).toISOString().split('T')[0]
                                    : '',
                                  endDate: campaign.endDate
                                    ? new Date(campaign.endDate).toISOString().split('T')[0]
                                    : '',
                                });
                                setEditMode(true);
                                setOpenDetailDialog(true);
                              }}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              title="Delete"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>

        {/* Detail / Quick-Action Dialog */}
        <Dialog
          open={openDetailDialog}
          onClose={() => {
            setOpenDetailDialog(false);
            setEditMode(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editMode ? 'Edit Campaign' : 'Campaign Details'}</DialogTitle>
          <DialogContent>
            {selectedCampaign && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedCampaign.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedCampaign.description || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                  <Typography variant="body1">{selectedCampaign.client.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Channel</Typography>
                  <Chip label={selectedCampaign.channel} size="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedCampaign.status}
                    size="small"
                    color={getStatusColor(selectedCampaign.status) as any}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Target Persona</Typography>
                  <Typography variant="body1">{selectedCampaign.targetPersona || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">
                    {selectedCampaign.startDate
                      ? new Date(selectedCampaign.startDate).toLocaleDateString()
                      : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">
                    {selectedCampaign.endDate
                      ? new Date(selectedCampaign.endDate).toLocaleDateString()
                      : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Leads</Typography>
                  <Typography variant="body1">{selectedCampaign._count.leads}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                  <Typography variant="body1">{selectedCampaign.owner.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            )}
            {selectedCampaign && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Campaign Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  select
                  label="Status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Channel"
                  value={editFormData.channel}
                  onChange={(e) => setEditFormData({ ...editFormData, channel: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                  <MenuItem value="COLD_CALL">Cold Call</MenuItem>
                  <MenuItem value="PAID_ADS">Paid Ads</MenuItem>
                  <MenuItem value="MULTI_CHANNEL">Multi-Channel</MenuItem>
                </TextField>
                <TextField
                  label="Target Persona"
                  value={editFormData.targetPersona}
                  onChange={(e) => setEditFormData({ ...editFormData, targetPersona: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="e.g., CTO at enterprise companies with 1000+ employees"
                />
                <TextField
                  label="Start Date"
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                {/* Read-only info */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                  <Typography variant="body1">{selectedCampaign.client.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                  <Typography variant="body1">{selectedCampaign.owner.name}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button
                  onClick={handleCancelEdit}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                  disabled={!editFormData.name || !editFormData.channel}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleStartEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if (selectedCampaign) handleDeleteCampaign(selectedCampaign.id);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

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
