'use client';

import { useState, useEffect, useMemo } from 'react';
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
  TableRow,
  Chip,
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
import ViewListIcon from '@mui/icons-material/ViewList';
import TimelineIcon from '@mui/icons-material/Timeline';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DashboardLayout from '@/components/DashboardLayout';
import ActivityTimeline from '@/components/ActivityTimeline';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

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

const columns: Column[] = [
  { id: 'timestamp', label: 'Date & Time' },
  { id: 'type', label: 'Type' },
  { id: 'leadName', label: 'Lead', sortable: false },
  { id: 'company', label: 'Company', sortable: false },
  { id: 'userName', label: 'User', sortable: false },
  { id: 'content', label: 'Details', sortable: false },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [filterType, setFilterType] = useState('ALL');
  const [editMode, setEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'EMAIL',
    content: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });

  const urlType = searchParams.get('type');
  const campaignId = searchParams.get('campaignId');

  const extraParams: Record<string, string> = {};
  if (campaignId) extraParams.campaignId = campaignId;

  const {
    data: activities,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Activity>({
    url: '/api/activities',
    defaultSortBy: 'timestamp',
    defaultSortOrder: 'desc',
    extraParams,
  });

  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  // Fetch leads for autocomplete
  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => setLeads(Array.isArray(data) ? data : data.data || []))
      .catch(console.error);
  }, []);

  const filteredActivities = useMemo(
    () => activities.filter((activity) => filterType === 'ALL' || activity.type === filterType),
    [activities, filterType]
  );

  const handleCreateActivity = async () => {
    if (!formData.leadId || !formData.content) {
      toast.showError('Please select a lead and enter content');
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
      toast.showSuccess('Activity created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedActivity) return;
    try {
      const response = await fetch(`/api/activities/${selectedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update');
      toast.showSuccess('Activity updated successfully');
      setEditMode(false);
      setDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    const confirmed = await confirm({
      title: 'Delete Activity',
      message: `Are you sure you want to delete this activity?`,
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/activities/${selectedActivity.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.showSuccess('Activity deleted successfully');
      setDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
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

  const exportData = filteredActivities.map((a) => ({
    'Date & Time': new Date(a.timestamp).toLocaleString(),
    Type: a.type,
    Lead: a.lead.fullName,
    Company: a.lead.company,
    User: a.user.name,
    Details: a.aiSummary || a.content,
  }));

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Activities</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => { if (v) setViewMode(v); }}
              size="small"
            >
              <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="timeline"><TimelineIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            <ExportToolbar data={exportData} filename="activities" title="Activities" />
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
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        {viewMode === 'timeline' ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Global activity timeline across all objects
            </Typography>
            <ActivityTimeline />
          </Box>
        ) : (
        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
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
                          onClick={() => {
                            setSelectedActivity(activity);
                            setDetailDialog(true);
                          }}
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
        )}

        {/* Activity Detail Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Activity Details</DialogTitle>
          <DialogContent>
            {selectedActivity && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip
                    label={selectedActivity.type}
                    size="small"
                    color={getActivityColor(selectedActivity.type) as any}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                  <Typography>{new Date(selectedActivity.timestamp).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Lead</Typography>
                  <Typography>{selectedActivity.lead.fullName} - {selectedActivity.lead.company}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">User</Typography>
                  <Typography>{selectedActivity.user.name}</Typography>
                </Box>
                {selectedActivity.aiSummary && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">AI Summary</Typography>
                    <Typography>{selectedActivity.aiSummary}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                  <Typography sx={{ whiteSpace: 'pre-line' }}>{selectedActivity.content}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedActivity && (
              <>
                <Button onClick={() => {
                  router.push(`/leads/${selectedActivity.lead.id}`);
                  setDetailDialog(false);
                }}>
                  View Lead
                </Button>
                <Button
                  onClick={() => {
                    setFormData({
                      leadId: selectedActivity.lead.id,
                      type: selectedActivity.type,
                      content: selectedActivity.content,
                      timestamp: selectedActivity.timestamp.slice(0, 16),
                    });
                    setEditMode(true);
                  }}
                  color="primary"
                >
                  Edit
                </Button>
                <Button onClick={handleDelete} color="error">
                  Delete
                </Button>
              </>
            )}
            <Button onClick={() => { setDetailDialog(false); setEditMode(false); }}>Close</Button>
          </DialogActions>
        </Dialog>

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
