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
import WebIcon from '@mui/icons-material/Web';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: string;
  htmlContent: string;
  viewCount: number;
  conversionCount: number;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'slug', label: 'Slug' },
  { id: 'status', label: 'Status' },
  { id: 'viewCount', label: 'Views' },
  { id: 'conversionCount', label: 'Conversions' },
  { id: 'convRate', label: 'Conv Rate', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return 'success';
    case 'ARCHIVED': return 'error';
    default: return 'default';
  }
};

export default function LandingPagesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'DRAFT',
    htmlContent: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    status: 'DRAFT',
    htmlContent: '',
  });

  const {
    data: pages,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<LandingPage>({
    url: '/api/landing-pages',
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
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create landing page');
      setOpenDialog(false);
      setFormData({ name: '', slug: '', status: 'DRAFT', htmlContent: '' });
      toast.showSuccess('Landing page created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPage) return;
    try {
      const response = await fetch(`/api/landing-pages/${selectedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update landing page');
      toast.showSuccess('Landing page updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Landing Page',
      message: 'Are you sure you want to delete this landing page? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/landing-pages/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete landing page');
      toast.showSuccess('Landing page deleted successfully');
      setOpenDetailDialog(false);
      setSelectedPage(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const getConversionRate = (views: number, conversions: number) => {
    if (!views || views === 0) return '0.0%';
    return ((conversions / views) * 100).toFixed(1) + '%';
  };

  const handleRowClick = (page: LandingPage) => {
    setSelectedPage(page);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedPage) return;
    setEditFormData({
      name: selectedPage.name,
      slug: selectedPage.slug,
      status: selectedPage.status,
      htmlContent: selectedPage.htmlContent || '',
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return pages.map((p) => ({
      Name: p.name,
      Slug: p.slug,
      Status: p.status,
      Views: p.viewCount,
      Conversions: p.conversionCount,
      'Conv Rate': getConversionRate(p.viewCount, p.conversionCount),
      Created: new Date(p.createdAt).toLocaleDateString(),
    }));
  }, [pages]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <WebIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Landing Pages</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="landing-pages" title="Landing Pages" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Landing Page
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {pages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary">No landing pages found. Create your first page!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pages.map((page) => (
                        <TableRow key={page.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(page)}>
                          <TableCell>{page.name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>/{page.slug}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={page.status} size="small" color={getStatusColor(page.status) as any} />
                          </TableCell>
                          <TableCell>{page.viewCount.toLocaleString()}</TableCell>
                          <TableCell>{page.conversionCount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={getConversionRate(page.viewCount, page.conversionCount)}
                              size="small"
                              color={page.conversionCount > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(page)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedPage(page); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(page.id)} title="Delete" color="error">
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
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Landing Page</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Page Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                fullWidth
                required
                placeholder="my-landing-page"
                helperText="URL-friendly identifier. Only lowercase letters, numbers, and hyphens."
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
                <MenuItem value="ARCHIVED">Archived</MenuItem>
              </TextField>
              <TextField
                label="HTML Content"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                multiline
                rows={12}
                fullWidth
                placeholder="<html>...</html>"
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name || !formData.slug}>
              Create Page
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Landing Page' : 'Landing Page Details'}</DialogTitle>
          <DialogContent>
            {selectedPage && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4} flexWrap="wrap">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedPage.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Slug</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>/{selectedPage.slug}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedPage.status} size="small" color={getStatusColor(selectedPage.status) as any} />
                  </Box>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Views</Typography>
                    <Typography variant="h6">{selectedPage.viewCount.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Conversions</Typography>
                    <Typography variant="h6">{selectedPage.conversionCount.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Conversion Rate</Typography>
                    <Typography variant="h6">{getConversionRate(selectedPage.viewCount, selectedPage.conversionCount)}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">HTML Content</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 400, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {selectedPage.htmlContent || 'No HTML content.'}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {selectedPage && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Page Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Slug"
                  value={editFormData.slug}
                  onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
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
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </TextField>
                <TextField
                  label="HTML Content"
                  value={editFormData.htmlContent}
                  onChange={(e) => setEditFormData({ ...editFormData, htmlContent: e.target.value })}
                  multiline
                  rows={12}
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.name || !editFormData.slug}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedPage && handleDelete(selectedPage.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
