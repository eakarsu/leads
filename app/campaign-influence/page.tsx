'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#f44336', '#3f51b5'];

interface CampaignInfluence {
  id: string;
  campaignId: string;
  opportunityId: string;
  contactId?: string;
  influencePercent: number;
  isPrimary: boolean;
  createdAt: string;
  campaign?: { id: string; name: string; channel: string; status: string };
  opportunity?: { id: string; name: string; amount: number; stage: string };
  contact?: { id: string; firstName: string; lastName: string; email: string };
}

type AttributionModel = 'first-touch' | 'last-touch' | 'linear';

export default function CampaignInfluencePage() {
  const [influences, setInfluences] = useState<CampaignInfluence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [model, setModel] = useState<AttributionModel>('linear');
  const [selectedInfluence, setSelectedInfluence] = useState<CampaignInfluence | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ influencePercent: 0, isPrimary: false });
  const [editSaving, setEditSaving] = useState(false);

  const { confirm } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchInfluences();
  }, []);

  const fetchInfluences = async () => {
    try {
      const res = await fetch('/api/campaign-influence');
      if (!res.ok) throw new Error('Failed to fetch influences');
      const data = await res.json();
      setInfluences(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Campaign Influence',
      message: 'Are you sure you want to remove this attribution?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/campaign-influence?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showSuccess('Attribution removed');
      setDetailDialogOpen(false);
      setSelectedInfluence(null);
      fetchInfluences();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleRowClick = (inf: CampaignInfluence) => {
    setSelectedInfluence(inf);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedInfluence) return;
    setEditFormData({
      influencePercent: selectedInfluence.influencePercent,
      isPrimary: selectedInfluence.isPrimary,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInfluence) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/campaign-influence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedInfluence.id, ...editFormData }),
      });
      if (!res.ok) throw new Error('Failed to update');
      showSuccess('Influence updated successfully');
      setEditMode(false);
      setDetailDialogOpen(false);
      fetchInfluences();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleTogglePrimary = async (inf: CampaignInfluence) => {
    try {
      const res = await fetch('/api/campaign-influence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inf.id, isPrimary: !inf.isPrimary, influencePercent: inf.influencePercent }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchInfluences();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Attribution calculations per model
  const attributionData = useMemo(() => {
    const campaignMap: Record<string, { name: string; revenue: number; count: number; channel: string }> = {};

    // Group by opportunity to apply attribution model
    const oppGroups: Record<string, CampaignInfluence[]> = {};
    influences.forEach((inf) => {
      if (!oppGroups[inf.opportunityId]) oppGroups[inf.opportunityId] = [];
      oppGroups[inf.opportunityId].push(inf);
    });

    Object.values(oppGroups).forEach((group) => {
      const sorted = [...group].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const oppAmount = sorted[0]?.opportunity?.amount || 0;

      sorted.forEach((inf, idx) => {
        const campaignId = inf.campaignId;
        const name = inf.campaign?.name || 'Unknown';
        const channel = inf.campaign?.channel || 'Unknown';

        if (!campaignMap[campaignId]) {
          campaignMap[campaignId] = { name, revenue: 0, count: 0, channel };
        }
        campaignMap[campaignId].count++;

        let attribution = 0;
        switch (model) {
          case 'first-touch':
            attribution = idx === 0 ? oppAmount : 0;
            break;
          case 'last-touch':
            attribution = idx === sorted.length - 1 ? oppAmount : 0;
            break;
          case 'linear':
            attribution = oppAmount / sorted.length;
            break;
        }
        campaignMap[campaignId].revenue += attribution;
      });
    });

    return Object.values(campaignMap).sort((a, b) => b.revenue - a.revenue);
  }, [influences, model]);

  // Summary stats
  const totalRevenue = attributionData.reduce((sum, c) => sum + c.revenue, 0);
  const totalInfluences = influences.length;
  const uniqueCampaigns = new Set(influences.map((i) => i.campaignId)).size;
  const uniqueOpportunities = new Set(influences.map((i) => i.opportunityId)).size;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <CampaignIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Campaign Influence</Typography>
          </Box>
          <TextField
            select
            label="Attribution Model"
            value={model}
            onChange={(e) => setModel(e.target.value as AttributionModel)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="first-touch">First-Touch</MenuItem>
            <MenuItem value="last-touch">Last-Touch</MenuItem>
            <MenuItem value="linear">Linear</MenuItem>
          </TextField>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Attributed Revenue</Typography>
                <Typography variant="h5" color="primary">{formatCurrency(totalRevenue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Campaigns</Typography>
                <Typography variant="h5">{uniqueCampaigns}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Opportunities</Typography>
                <Typography variant="h5">{uniqueOpportunities}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Total Touches</Typography>
                <Typography variant="h5">{totalInfluences}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        {attributionData.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Revenue by Campaign ({model})</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attributionData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#1976d2" name="Attributed Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Revenue Share</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attributionData.filter((d) => d.revenue > 0).slice(0, 8)}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      >
                        {attributionData.slice(0, 8).map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Attribution Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>All Campaign Influences</Typography>
            {influences.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No campaign influences found. Create attributions from opportunity or campaign detail pages.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Campaign</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Opportunity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Influence %</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Primary</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {influences.map((inf) => (
                      <TableRow key={inf.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(inf)}>
                        <TableCell>
                          <Typography variant="body2">{inf.campaign?.name || 'Unknown'}</Typography>
                          {inf.campaign?.channel && (
                            <Chip label={inf.campaign.channel} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{inf.opportunity?.name || 'Unknown'}</Typography>
                          {inf.opportunity?.amount != null && (
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(inf.opportunity.amount)} - {inf.opportunity.stage}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {inf.contact ? `${inf.contact.firstName} ${inf.contact.lastName}` : '-'}
                        </TableCell>
                        <TableCell>{inf.influencePercent}%</TableCell>
                        <TableCell>
                          <Tooltip title={inf.isPrimary ? 'Primary attribution' : 'Set as primary'}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTogglePrimary(inf); }}>
                              {inf.isPrimary ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{new Date(inf.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Tooltip title="Remove attribution">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(inf.id); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        {/* Influence Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => { setDetailDialogOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Campaign Influence' : 'Campaign Influence Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedInfluence && !editMode && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Campaign</Typography>
                <Typography gutterBottom>{selectedInfluence.campaign?.name || 'Unknown'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Channel</Typography>
                <Typography gutterBottom>{selectedInfluence.campaign?.channel || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Opportunity</Typography>
                <Typography gutterBottom>{selectedInfluence.opportunity?.name || 'Unknown'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Opportunity Amount</Typography>
                <Typography gutterBottom>{selectedInfluence.opportunity?.amount != null ? formatCurrency(selectedInfluence.opportunity.amount) : 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Stage</Typography>
                <Typography gutterBottom>{selectedInfluence.opportunity?.stage || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                <Typography gutterBottom>{selectedInfluence.contact ? `${selectedInfluence.contact.firstName} ${selectedInfluence.contact.lastName}` : 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Influence Percent</Typography>
                <Typography gutterBottom>{selectedInfluence.influencePercent}%</Typography>
                <Typography variant="subtitle2" color="text.secondary">Primary</Typography>
                <Typography gutterBottom>{selectedInfluence.isPrimary ? 'Yes' : 'No'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography>{new Date(selectedInfluence.createdAt).toLocaleString()}</Typography>
              </Box>
            )}
            {selectedInfluence && editMode && (
              <Box>
                <TextField
                  label="Influence Percent"
                  type="number"
                  value={editFormData.influencePercent}
                  onChange={(e) => setEditFormData({ ...editFormData, influencePercent: Number(e.target.value) })}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  select
                  label="Primary"
                  value={editFormData.isPrimary ? 'Yes' : 'No'}
                  onChange={(e) => setEditFormData({ ...editFormData, isPrimary: e.target.value === 'Yes' })}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!editMode ? (
              <>
                <Button onClick={() => { setDetailDialogOpen(false); setEditMode(false); }}>Close</Button>
                <Button startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedInfluence && handleDelete(selectedInfluence.id)}>Delete</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveEdit} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
