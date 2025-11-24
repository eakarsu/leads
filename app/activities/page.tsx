'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Chip,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/DashboardLayout';

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  content: string;
  aiSummary: string | null;
  lead: {
    id: string;
    fullName: string;
    company: string;
  };
  user: {
    name: string;
  };
}

interface Lead {
  id: string;
  fullName: string;
  company: string;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'EMAIL',
    content: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });

  // Get URL parameters for filtering
  const urlType = searchParams.get('type');
  const campaignId = searchParams.get('campaignId');

  useEffect(() => {
    // Set initial filter type from URL
    if (urlType) {
      setFilterType(urlType);
    }
    fetchActivities();
    fetchLeads();
  }, [urlType, campaignId]);

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (campaignId) {
        params.append('campaignId', campaignId);
      }
      const url = `/api/activities${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    }
  };

  const handleCreateActivity = async () => {
    if (!formData.leadId || !formData.content) {
      setError('Please select a lead and enter content');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create activity');

      setOpenDialog(false);
      setFormData({
        leadId: '',
        type: 'EMAIL',
        content: '',
        timestamp: new Date().toISOString().slice(0, 16),
      });
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'primary';
      case 'CALL':
        return 'success';
      case 'LINKEDIN':
        return 'info';
      case 'MEETING':
        return 'secondary';
      case 'NOTE':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredActivities = activities.filter(
    (activity) => filterType === 'ALL' || activity.type === filterType
  );

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
          <Typography variant="h4">Activities</Typography>
          <Box display="flex" gap={2}>
            <TextField
              select
              label="Filter by Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="ALL">All Activities</MenuItem>
              <MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="CALL">Call</MenuItem>
              <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
              <MenuItem value="MEETING">Meeting</MenuItem>
              <MenuItem value="NOTE">Note</MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Activity
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
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Lead</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          {filterType === 'ALL'
                            ? 'No activities found.'
                            : `No ${filterType.toLowerCase()} activities found.`}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.map((activity) => (
                      <TableRow
                        key={activity.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/leads/${activity.lead.id}`)}
                      >
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.type}
                            size="small"
                            color={getActivityColor(activity.type) as any}
                          />
                        </TableCell>
                        <TableCell>{activity.lead.fullName}</TableCell>
                        <TableCell>{activity.lead.company}</TableCell>
                        <TableCell>{activity.user.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                            {activity.aiSummary || activity.content}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* New Activity Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Activity</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                options={leads}
                getOptionKey={(option) => option.id}
                getOptionLabel={(option) => `${option.fullName} - ${option.company || 'No Company'}`}
                value={leads.find((l) => l.id === formData.leadId) || null}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, leadId: newValue?.id || '' })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Lead" required fullWidth />
                )}
              />
              <TextField
                select
                label="Activity Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                label="Content"
                multiline
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateActivity}
              variant="contained"
              disabled={saving || !formData.leadId || !formData.content}
            >
              {saving ? 'Creating...' : 'Create Activity'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
