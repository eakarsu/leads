'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Grid, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface OperatingHours {
  id: string;
  name: string;
  timezone: string;
  mondayStart: string | null;
  mondayEnd: string | null;
  tuesdayStart: string | null;
  tuesdayEnd: string | null;
  wednesdayStart: string | null;
  wednesdayEnd: string | null;
  thursdayStart: string | null;
  thursdayEnd: string | null;
  fridayStart: string | null;
  fridayEnd: string | null;
  saturdayStart: string | null;
  saturdayEnd: string | null;
  sundayStart: string | null;
  sundayEnd: string | null;
  status: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'timezone', label: 'Timezone' },
  { id: 'monday', label: 'Mon', sortable: false },
  { id: 'tuesday', label: 'Tue', sortable: false },
  { id: 'wednesday', label: 'Wed', sortable: false },
  { id: 'thursday', label: 'Thu', sortable: false },
  { id: 'friday', label: 'Fri', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultHours = {
  name: '',
  timezone: 'America/New_York',
  mondayStart: '09:00',
  mondayEnd: '17:00',
  tuesdayStart: '09:00',
  tuesdayEnd: '17:00',
  wednesdayStart: '09:00',
  wednesdayEnd: '17:00',
  thursdayStart: '09:00',
  thursdayEnd: '17:00',
  fridayStart: '09:00',
  fridayEnd: '17:00',
  saturdayStart: '',
  saturdayEnd: '',
  sundayStart: '',
  sundayEnd: '',
  status: 'ACTIVE',
};

export default function OperatingHoursPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OperatingHours | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({ ...defaultHours });
  const [editFormData, setEditFormData] = useState({ ...defaultHours });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;

  const {
    data: items,
    loading,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<OperatingHours>({
    url: '/api/operating-hours',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
    extraParams,
  });

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const formatHours = (start: string | null, end: string | null) => {
    if (!start || !end) return '-';
    return `${start}-${end}`;
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/operating-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create operating hours');
      setDialogOpen(false);
      toast.showSuccess('Operating hours created successfully');
      refresh();
      setFormData({ ...defaultHours });
    } catch (err: any) {
      toast.showError(err.message || 'Error creating operating hours');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Operating Hours',
      message: 'Are you sure you want to delete these operating hours? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/operating-hours/${id}`, { method: 'DELETE' });
      toast.showSuccess('Operating hours deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting operating hours');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      name: selectedItem.name,
      timezone: selectedItem.timezone,
      mondayStart: selectedItem.mondayStart || '',
      mondayEnd: selectedItem.mondayEnd || '',
      tuesdayStart: selectedItem.tuesdayStart || '',
      tuesdayEnd: selectedItem.tuesdayEnd || '',
      wednesdayStart: selectedItem.wednesdayStart || '',
      wednesdayEnd: selectedItem.wednesdayEnd || '',
      thursdayStart: selectedItem.thursdayStart || '',
      thursdayEnd: selectedItem.thursdayEnd || '',
      fridayStart: selectedItem.fridayStart || '',
      fridayEnd: selectedItem.fridayEnd || '',
      saturdayStart: selectedItem.saturdayStart || '',
      saturdayEnd: selectedItem.saturdayEnd || '',
      sundayStart: selectedItem.sundayStart || '',
      sundayEnd: selectedItem.sundayEnd || '',
      status: selectedItem.status,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/operating-hours/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update operating hours');
      toast.showSuccess('Operating hours updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const exportData = items.map((item) => ({
    Name: item.name,
    Timezone: item.timezone,
    Monday: formatHours(item.mondayStart, item.mondayEnd),
    Tuesday: formatHours(item.tuesdayStart, item.tuesdayEnd),
    Wednesday: formatHours(item.wednesdayStart, item.wednesdayEnd),
    Thursday: formatHours(item.thursdayStart, item.thursdayEnd),
    Friday: formatHours(item.fridayStart, item.fridayEnd),
    Saturday: formatHours(item.saturdayStart, item.saturdayEnd),
    Sunday: formatHours(item.sundayStart, item.sundayEnd),
    Status: item.status,
  }));

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const renderDayFields = (data: any, setData: (d: any) => void) => (
    <>
      {days.map((day) => (
        <Grid container spacing={2} key={day.key} sx={{ mb: 1 }}>
          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ pt: 1 }}>{day.label}</Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Start"
              placeholder="HH:MM"
              value={data[`${day.key}Start`]}
              onChange={(e) => setData({ ...data, [`${day.key}Start`]: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="End"
              placeholder="HH:MM"
              value={data[`${day.key}End`]}
              onChange={(e) => setData({ ...data, [`${day.key}End`]: e.target.value })}
            />
          </Grid>
        </Grid>
      ))}
    </>
  );

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Operating Hours</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="operating-hours" title="Operating Hours" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Operating Hours
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search operating hours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Paper>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={9} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={columns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedItem(item); setDetailOpen(true); setEditMode(false); }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                    </TableCell>
                    <TableCell>{item.timezone}</TableCell>
                    <TableCell>{formatHours(item.mondayStart, item.mondayEnd)}</TableCell>
                    <TableCell>{formatHours(item.tuesdayStart, item.tuesdayEnd)}</TableCell>
                    <TableCell>{formatHours(item.wednesdayStart, item.wednesdayEnd)}</TableCell>
                    <TableCell>{formatHours(item.thursdayStart, item.thursdayEnd)}</TableCell>
                    <TableCell>{formatHours(item.fridayStart, item.fridayEnd)}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={item.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setSelectedItem(item); setDetailOpen(true); handleStartEdit(); }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No operating hours found</TableCell>
                  </TableRow>
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
      </Box>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Operating Hours</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Schedule</Typography>
              {renderDayFields(formData, setFormData)}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Operating Hours' : selectedItem?.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!editMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={handleStartEdit}><EditIcon /></IconButton>
                </Tooltip>
              )}
              <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && editMode ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={editFormData.timezone}
                  onChange={(e) => setEditFormData({ ...editFormData, timezone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Schedule</Typography>
                {renderDayFields(editFormData, setEditFormData)}
              </Grid>
            </Grid>
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Timezone</Typography>
                <Typography variant="body1">{selectedItem.timezone}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedItem.status}
                    color={selectedItem.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Weekly Schedule</Typography>
                {days.map((day) => (
                  <Box key={day.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="bold">{day.label}</Typography>
                    <Typography variant="body2">
                      {formatHours(
                        (selectedItem as any)[`${day.key}Start`],
                        (selectedItem as any)[`${day.key}End`]
                      )}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          {selectedItem && (
            <Button color="error" onClick={() => handleDelete(selectedItem.id)} sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)} startIcon={<CancelIcon />}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.name}>
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => { setDetailOpen(false); setEditMode(false); }}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
