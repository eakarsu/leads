'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface GeoLocation {
  id: string;
  objectType: string;
  objectId: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'objectType', label: 'Object Type' },
  { id: 'objectId', label: 'Object ID' },
  { id: 'latitude', label: 'Latitude' },
  { id: 'longitude', label: 'Longitude' },
  { id: 'address', label: 'Address' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function MapsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);

  const [formData, setFormData] = useState({
    objectType: 'ACCOUNT',
    objectId: '',
    latitude: '',
    longitude: '',
    address: '',
  });

  const [editFormData, setEditFormData] = useState({
    objectType: 'ACCOUNT',
    objectId: '',
    latitude: '',
    longitude: '',
    address: '',
  });

  const {
    data: locations,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<GeoLocation>({
    url: '/api/geo-locations',
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
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };
      const response = await fetch('/api/geo-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create geo location');
      setOpenDialog(false);
      setFormData({ objectType: 'ACCOUNT', objectId: '', latitude: '', longitude: '', address: '' });
      toast.showSuccess('Geo location created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLocation) return;
    try {
      const payload = {
        ...editFormData,
        latitude: parseFloat(editFormData.latitude),
        longitude: parseFloat(editFormData.longitude),
      };
      const response = await fetch(`/api/geo-locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update geo location');
      toast.showSuccess('Geo location updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Geo Location',
      message: 'Are you sure you want to delete this geo location? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/geo-locations/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete geo location');
      toast.showSuccess('Geo location deleted successfully');
      setOpenDetailDialog(false);
      setSelectedLocation(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (location: GeoLocation) => {
    setSelectedLocation(location);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedLocation) return;
    setEditFormData({
      objectType: selectedLocation.objectType,
      objectId: selectedLocation.objectId,
      latitude: selectedLocation.latitude.toString(),
      longitude: selectedLocation.longitude.toString(),
      address: selectedLocation.address || '',
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return locations.map((l) => ({
      'Object Type': l.objectType,
      'Object ID': l.objectId,
      Latitude: l.latitude,
      Longitude: l.longitude,
      Address: l.address,
    }));
  }, [locations]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <MapIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Maps</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="geo-locations" title="Geo Locations" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Location
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Manage geo locations for your records. Map visualization requires a map library integration.
        </Alert>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {locations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No geo locations found. Add your first location!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      locations.map((location) => (
                        <TableRow key={location.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(location)}>
                          <TableCell><Chip label={location.objectType} size="small" variant="outlined" /></TableCell>
                          <TableCell>{location.objectId}</TableCell>
                          <TableCell>{location.latitude.toFixed(6)}</TableCell>
                          <TableCell>{location.longitude.toFixed(6)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                              {location.address || '---'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(location)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedLocation(location); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(location.id)} title="Delete" color="error">
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
          <DialogTitle>Add Geo Location</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Object Type"
                value={formData.objectType}
                onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                fullWidth
              >
                <MenuItem value="ACCOUNT">Account</MenuItem>
                <MenuItem value="CONTACT">Contact</MenuItem>
                <MenuItem value="TERRITORY">Territory</MenuItem>
                <MenuItem value="WORK_ORDER">Work Order</MenuItem>
              </TextField>
              <TextField
                label="Object ID"
                value={formData.objectId}
                onChange={(e) => setFormData({ ...formData, objectId: e.target.value })}
                fullWidth
                required
                placeholder="Enter the record ID"
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  fullWidth
                  required
                  placeholder="40.7128"
                  inputProps={{ step: 'any' }}
                />
                <TextField
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  fullWidth
                  required
                  placeholder="-74.0060"
                  inputProps={{ step: 'any' }}
                />
              </Box>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                fullWidth
                placeholder="123 Main St, New York, NY 10001"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.objectId || !formData.latitude || !formData.longitude}>
              Add Location
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Geo Location' : 'Geo Location Details'}</DialogTitle>
          <DialogContent>
            {selectedLocation && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Object Type</Typography>
                    <Chip label={selectedLocation.objectType} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Object ID</Typography>
                    <Typography variant="body1">{selectedLocation.objectId}</Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Latitude</Typography>
                    <Typography variant="body1">{selectedLocation.latitude.toFixed(6)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Longitude</Typography>
                    <Typography variant="body1">{selectedLocation.longitude.toFixed(6)}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{selectedLocation.address || '---'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Coordinates Link</Typography>
                  <Typography
                    variant="body2"
                    component="a"
                    href={`https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'primary.main' }}
                  >
                    View on Google Maps
                  </Typography>
                </Box>
              </Box>
            )}

            {selectedLocation && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Object Type"
                  value={editFormData.objectType}
                  onChange={(e) => setEditFormData({ ...editFormData, objectType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="ACCOUNT">Account</MenuItem>
                  <MenuItem value="CONTACT">Contact</MenuItem>
                  <MenuItem value="TERRITORY">Territory</MenuItem>
                  <MenuItem value="WORK_ORDER">Work Order</MenuItem>
                </TextField>
                <TextField
                  label="Object ID"
                  value={editFormData.objectId}
                  onChange={(e) => setEditFormData({ ...editFormData, objectId: e.target.value })}
                  fullWidth
                  required
                />
                <Box display="flex" gap={2}>
                  <TextField
                    label="Latitude"
                    type="number"
                    value={editFormData.latitude}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    fullWidth
                    required
                    inputProps={{ step: 'any' }}
                  />
                  <TextField
                    label="Longitude"
                    type="number"
                    value={editFormData.longitude}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    fullWidth
                    required
                    inputProps={{ step: 'any' }}
                  />
                </Box>
                <TextField
                  label="Address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.objectId || !editFormData.latitude || !editFormData.longitude}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedLocation && handleDelete(selectedLocation.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
