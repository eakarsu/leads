'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface SocialPost {
  id: string;
  platform: string;
  authorName: string;
  content: string;
  sentiment: string;
  status: string;
  response: string;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'platform', label: 'Platform' },
  { id: 'authorName', label: 'Author' },
  { id: 'content', label: 'Content' },
  { id: 'sentiment', label: 'Sentiment' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'TWITTER': return 'info';
    case 'FACEBOOK': return 'primary';
    case 'INSTAGRAM': return 'secondary';
    default: return 'default';
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'POSITIVE': return 'success';
    case 'NEGATIVE': return 'error';
    default: return 'default';
  }
};

export default function SocialServicePage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const [formData, setFormData] = useState({
    platform: 'TWITTER',
    authorName: '',
    content: '',
    sentiment: 'NEUTRAL',
    status: 'NEW',
  });

  const [editFormData, setEditFormData] = useState({
    platform: 'TWITTER',
    authorName: '',
    content: '',
    sentiment: 'NEUTRAL',
    status: 'NEW',
    response: '',
  });

  const {
    data: posts,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<SocialPost>({
    url: '/api/social-service',
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
      const response = await fetch('/api/social-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create social post');
      setOpenDialog(false);
      setFormData({ platform: 'TWITTER', authorName: '', content: '', sentiment: 'NEUTRAL', status: 'NEW' });
      toast.showSuccess('Social post created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPost) return;
    try {
      const response = await fetch(`/api/social-service/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update social post');
      toast.showSuccess('Social post updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Social Post',
      message: 'Are you sure you want to delete this social post? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/social-service/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete social post');
      toast.showSuccess('Social post deleted successfully');
      setOpenDetailDialog(false);
      setSelectedPost(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (post: SocialPost) => {
    setSelectedPost(post);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedPost) return;
    setEditFormData({
      platform: selectedPost.platform,
      authorName: selectedPost.authorName,
      content: selectedPost.content,
      sentiment: selectedPost.sentiment,
      status: selectedPost.status,
      response: selectedPost.response || '',
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return posts.map((p) => ({
      Platform: p.platform,
      Author: p.authorName,
      Content: p.content,
      Sentiment: p.sentiment,
      Status: p.status,
      Created: new Date(p.createdAt).toLocaleDateString(),
    }));
  }, [posts]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Social Service</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="social-service" title="Social Service" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Social Post
            </Button>
          </Box>
        </Box>

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
                    {posts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No social posts found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.map((post) => (
                        <TableRow key={post.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(post)}>
                          <TableCell>
                            <Chip label={post.platform} size="small" color={getPlatformColor(post.platform) as any} />
                          </TableCell>
                          <TableCell>{post.authorName}</TableCell>
                          <TableCell>
                            <Tooltip title={post.content}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                                {post.content}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip label={post.sentiment} size="small" color={getSentimentColor(post.sentiment) as any} />
                          </TableCell>
                          <TableCell>
                            <Chip label={post.status} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(post)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedPost(post); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(post.id)} title="Delete" color="error">
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
          <DialogTitle>Create Social Post</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                fullWidth
              >
                <MenuItem value="TWITTER">Twitter</MenuItem>
                <MenuItem value="FACEBOOK">Facebook</MenuItem>
                <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
              </TextField>
              <TextField
                label="Author Name"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={4}
                fullWidth
                required
              />
              <TextField
                select
                label="Sentiment"
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                fullWidth
              >
                <MenuItem value="POSITIVE">Positive</MenuItem>
                <MenuItem value="NEUTRAL">Neutral</MenuItem>
                <MenuItem value="NEGATIVE">Negative</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="NEW">New</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESPONDED">Responded</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.authorName || !formData.content}>
              Create Post
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Social Post' : 'Social Post Details'}</DialogTitle>
          <DialogContent>
            {selectedPost && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Platform</Typography>
                    <Chip label={selectedPost.platform} size="small" color={getPlatformColor(selectedPost.platform) as any} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Sentiment</Typography>
                    <Chip label={selectedPost.sentiment} size="small" color={getSentimentColor(selectedPost.sentiment) as any} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedPost.status} size="small" variant="outlined" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Author</Typography>
                  <Typography variant="body1">{selectedPost.authorName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedPost.content}</Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Response</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedPost.response || 'No response yet.'}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{new Date(selectedPost.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            )}

            {selectedPost && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Platform"
                  value={editFormData.platform}
                  onChange={(e) => setEditFormData({ ...editFormData, platform: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="TWITTER">Twitter</MenuItem>
                  <MenuItem value="FACEBOOK">Facebook</MenuItem>
                  <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                  <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                </TextField>
                <TextField
                  label="Author Name"
                  value={editFormData.authorName}
                  onChange={(e) => setEditFormData({ ...editFormData, authorName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Content"
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
                />
                <TextField
                  select
                  label="Sentiment"
                  value={editFormData.sentiment}
                  onChange={(e) => setEditFormData({ ...editFormData, sentiment: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="POSITIVE">Positive</MenuItem>
                  <MenuItem value="NEUTRAL">Neutral</MenuItem>
                  <MenuItem value="NEGATIVE">Negative</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="RESPONDED">Responded</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </TextField>
                <TextField
                  label="Response"
                  value={editFormData.response}
                  onChange={(e) => setEditFormData({ ...editFormData, response: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Write your response to this social post..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedPost && handleDelete(selectedPost.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
