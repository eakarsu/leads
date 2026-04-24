'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, FormControl, InputLabel, Select,
  OutlinedInput, Checkbox, ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface EinsteinBot {
  id: string;
  name: string;
  status: string;
  welcomeMessage: string;
  channels: string[];
  dialogs: any[];
  _count?: { dialogs: number };
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'channels', label: 'Channels', sortable: false },
  { id: 'dialogs', label: 'Dialogs', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const CHANNEL_OPTIONS = ['WEB', 'FACEBOOK', 'WHATSAPP', 'SMS'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'INACTIVE': return 'error';
    default: return 'default';
  }
};

export default function EinsteinBotsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBot, setSelectedBot] = useState<EinsteinBot | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    status: 'DRAFT',
    welcomeMessage: '',
    channels: [] as string[],
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    status: 'DRAFT',
    welcomeMessage: '',
    channels: [] as string[],
  });

  const {
    data: bots,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<EinsteinBot>({
    url: '/api/einstein-bots',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
  });

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortOrder(newOrder);
    setSort(col, newOrder);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/einstein-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create bot');
      setOpenDialog(false);
      setFormData({ name: '', status: 'DRAFT', welcomeMessage: '', channels: [] });
      toast.showSuccess('Einstein Bot created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBot) return;
    try {
      const response = await fetch(`/api/einstein-bots/${selectedBot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update bot');
      toast.showSuccess('Einstein Bot updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Einstein Bot',
      message: 'Are you sure you want to delete this bot? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/einstein-bots/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete bot');
      toast.showSuccess('Einstein Bot deleted successfully');
      setOpenDetailDialog(false);
      setSelectedBot(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (bot: EinsteinBot) => {
    setSelectedBot(bot);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedBot) return;
    setEditFormData({
      name: selectedBot.name,
      status: selectedBot.status,
      welcomeMessage: selectedBot.welcomeMessage || '',
      channels: selectedBot.channels || [],
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return bots.map((b) => ({
      Name: b.name,
      Status: b.status,
      Channels: (b.channels || []).join(', '),
      Dialogs: b._count?.dialogs || b.dialogs?.length || 0,
      Created: new Date(b.createdAt).toLocaleDateString(),
    }));
  }, [bots]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToyIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Einstein Bots</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="einstein-bots" title="Einstein Bots" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Bot
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {bots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No Einstein Bots found. Create your first bot!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      bots.map((bot) => (
                        <TableRow key={bot.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(bot)}>
                          <TableCell>{bot.name}</TableCell>
                          <TableCell>
                            <Chip label={bot.status} size="small" color={getStatusColor(bot.status) as any} />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {(bot.channels || []).map((ch) => (
                                <Chip key={ch} label={ch} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>{bot._count?.dialogs || bot.dialogs?.length || 0}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(bot)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedBot(bot); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(bot.id)} title="Delete" color="error">
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

        {/* Create Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Einstein Bot</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Bot Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
              <TextField
                label="Welcome Message"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Hello! How can I help you today?"
              />
              <FormControl fullWidth>
                <InputLabel>Channels</InputLabel>
                <Select
                  multiple
                  value={formData.channels}
                  onChange={(e) => setFormData({ ...formData, channels: e.target.value as string[] })}
                  input={<OutlinedInput label="Channels" />}
                  renderValue={(selected) => (
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {selected.map((val) => <Chip key={val} label={val} size="small" />)}
                    </Box>
                  )}
                >
                  {CHANNEL_OPTIONS.map((channel) => (
                    <MenuItem key={channel} value={channel}>
                      <Checkbox checked={formData.channels.includes(channel)} />
                      <ListItemText primary={channel} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
              Create Bot
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Einstein Bot' : 'Einstein Bot Details'}</DialogTitle>
          <DialogContent>
            {selectedBot && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedBot.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={selectedBot.status} size="small" color={getStatusColor(selectedBot.status) as any} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Channels</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                    {(selectedBot.channels || []).map((ch) => (
                      <Chip key={ch} label={ch} size="small" />
                    ))}
                    {(!selectedBot.channels || selectedBot.channels.length === 0) && (
                      <Typography variant="body2" color="text.secondary">None configured</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Welcome Message</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5 }}>
                    <Typography variant="body2">{selectedBot.welcomeMessage || 'No welcome message set.'}</Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Dialogs ({selectedBot._count?.dialogs || selectedBot.dialogs?.length || 0})</Typography>
                  {selectedBot.dialogs && selectedBot.dialogs.length > 0 ? (
                    <Box sx={{ mt: 1 }}>
                      {selectedBot.dialogs.map((dialog: any, idx: number) => (
                        <Paper key={dialog.id || idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">{dialog.name || `Dialog ${idx + 1}`}</Typography>
                          <Typography variant="caption" color="text.secondary">{dialog.description || 'No description'}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>No dialogs configured.</Typography>
                  )}
                </Box>
              </Box>
            )}

            {selectedBot && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Bot Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
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
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
                <TextField
                  label="Welcome Message"
                  value={editFormData.welcomeMessage}
                  onChange={(e) => setEditFormData({ ...editFormData, welcomeMessage: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Channels</InputLabel>
                  <Select
                    multiple
                    value={editFormData.channels}
                    onChange={(e) => setEditFormData({ ...editFormData, channels: e.target.value as string[] })}
                    input={<OutlinedInput label="Channels" />}
                    renderValue={(selected) => (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {selected.map((val) => <Chip key={val} label={val} size="small" />)}
                      </Box>
                    )}
                  >
                    {CHANNEL_OPTIONS.map((channel) => (
                      <MenuItem key={channel} value={channel}>
                        <Checkbox checked={editFormData.channels.includes(channel)} />
                        <ListItemText primary={channel} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.name}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedBot && handleDelete(selectedBot.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
