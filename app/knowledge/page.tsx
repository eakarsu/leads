'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Tab,
  Tabs,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import DraftsIcon from '@mui/icons-material/Drafts';
import PublishIcon from '@mui/icons-material/Publish';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Article {
  id: string;
  articleNumber: string;
  title: string;
  summary: string | null;
  content: string;
  status: string;
  isPublic: boolean;
  viewCount: number;
  keywords: string[];
  category: { id: string; name: string } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const columns: Column[] = [
  { id: 'title', label: 'Article' },
  { id: 'category', label: 'Category', sortable: false },
  { id: 'viewCount', label: 'Views' },
  { id: 'status', label: 'Status' },
  { id: 'isPublic', label: 'Visibility' },
  { id: 'updatedAt', label: 'Updated' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function KnowledgePage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    summary: '',
    status: '',
    isPublic: false,
  });
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    publicArticles: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    keywords: '',
    isPublic: false,
  });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;

  const {
    data: articles,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Article>({
    url: '/api/knowledge',
    defaultSortBy: 'updatedAt',
    defaultSortOrder: 'desc',
    extraParams,
  });

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/knowledge');
      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/knowledge/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreateArticle = async () => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        toast.showSuccess('Article created successfully');
        refresh();
        fetchStats();
        resetForm();
      }
    } catch (error) {
      toast.showError('Error creating article');
    }
  };

  const handlePublishArticle = async (articleId: string) => {
    try {
      await fetch(`/api/knowledge/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      });
      toast.showSuccess('Article published successfully');
      refresh();
      fetchStats();
    } catch (error) {
      toast.showError('Error publishing article');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      categoryId: '',
      keywords: '',
      isPublic: false,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedArticle) return;
    try {
      const response = await fetch(`/api/knowledge/${selectedArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update article');
      toast.showSuccess('Article updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
      fetchStats();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;
    const confirmed = await confirm({
      title: 'Delete Article',
      message: `Are you sure you want to delete "${selectedArticle.title}"?`,
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/knowledge/${selectedArticle.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.showSuccess('Article deleted successfully');
      setDetailOpen(false);
      refresh();
      fetchStats();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PUBLISHED':
        return 'success';
      case 'ARCHIVED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredArticles = useMemo(() => {
    if (tabValue === 0) return articles;
    return articles.filter((a) => {
      if (tabValue === 1) return a.status === 'PUBLISHED';
      if (tabValue === 2) return a.status === 'DRAFT';
      if (tabValue === 3) return a.isPublic;
      return true;
    });
  }, [articles, tabValue]);

  const handleSearch = () => {
    refresh();
  };

  const exportData = filteredArticles.map((a) => ({
    Title: a.title,
    'Article Number': a.articleNumber,
    Category: a.category?.name || '-',
    Views: a.viewCount,
    Status: a.status,
    Visibility: a.isPublic ? 'Public' : 'Internal',
    Updated: new Date(a.updatedAt).toLocaleDateString(),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Knowledge Base</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="knowledge-articles" title="Knowledge Articles" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Article
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MenuBookIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Articles</Typography>
                </Box>
                <Typography variant="h4">{stats.totalArticles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PublishIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Published</Typography>
                </Box>
                <Typography variant="h4">{stats.publishedArticles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DraftsIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Drafts</Typography>
                </Box>
                <Typography variant="h4">{stats.draftArticles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PublicIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Public</Typography>
                </Box>
                <Typography variant="h4">{stats.publicArticles}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button variant="outlined" onClick={handleSearch} fullWidth>
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalArticles})`} />
            <Tab label={`Published (${stats.publishedArticles})`} />
            <Tab label={`Drafts (${stats.draftArticles})`} />
            <Tab label={`Public (${stats.publicArticles})`} />
          </Tabs>
        </Paper>

        {/* Articles Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
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
                {filteredArticles.map((article) => (
                  <TableRow
                    key={article.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedArticle(article);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {article.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {article.articleNumber}
                      </Typography>
                      {article.keywords && article.keywords.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {article.keywords.slice(0, 3).map((keyword, idx) => (
                            <Chip
                              key={idx}
                              label={keyword}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, fontSize: '0.65rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{article.category?.name || '-'}</TableCell>
                    <TableCell>{article.viewCount || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={article.status}
                        color={getStatusColor(article.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {article.isPublic ? (
                        <Chip label="Public" color="info" size="small" icon={<PublicIcon />} />
                      ) : (
                        <Chip label="Internal" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {article.status === 'DRAFT' && (
                        <Tooltip title="Publish">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePublishArticle(article.id)}
                          >
                            <PublishIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredArticles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No articles found
                    </TableCell>
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

      {/* Create Article Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Article</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((category: any) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Keywords (comma-separated)"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="e.g. setup, installation, guide"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Content *"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={10}
                placeholder="Write your article content here... Markdown is supported."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Make this article publicly visible"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateArticle}
            variant="contained"
            disabled={!formData.title || !formData.content}
          >
            Create Article
          </Button>
        </DialogActions>
      </Dialog>

      {/* Article Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {editMode ? 'Edit Article' : selectedArticle?.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedArticle?.articleNumber} | {selectedArticle?.category?.name || 'Uncategorized'}
              </Typography>
            </Box>
            <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedArticle && !editMode && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip
                  label={selectedArticle.status}
                  color={getStatusColor(selectedArticle.status) as any}
                />
                {selectedArticle.isPublic && (
                  <Chip label="Public" color="info" icon={<PublicIcon />} />
                )}
                <Chip label={`${selectedArticle.viewCount || 0} views`} variant="outlined" />
              </Box>

              {selectedArticle.summary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body1">{selectedArticle.summary}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Content
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedArticle.content}
                  </Typography>
                </Paper>
              </Box>

              {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedArticle.keywords.map((keyword, idx) => (
                      <Chip key={idx} label={keyword} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary">Created</Typography>
                  <Typography variant="body2">
                    {new Date(selectedArticle.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary">Last Updated</Typography>
                  <Typography variant="body2">
                    {new Date(selectedArticle.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {selectedArticle && editMode && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
              <TextField
                fullWidth
                label="Summary"
                value={editFormData.summary}
                onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Content"
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                multiline
                rows={10}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editFormData.isPublic}
                    onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })}
                  />
                }
                label="Make this article publicly visible"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedArticle && !editMode && (
            <>
              {selectedArticle.status === 'DRAFT' && (
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => {
                    handlePublishArticle(selectedArticle.id);
                    setDetailOpen(false);
                  }}
                >
                  Publish
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditFormData({
                    title: selectedArticle.title,
                    content: selectedArticle.content,
                    summary: selectedArticle.summary || '',
                    status: selectedArticle.status,
                    isPublic: selectedArticle.isPublic,
                  });
                  setEditMode(true);
                }}
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />}>
                Delete
              </Button>
            </>
          )}
          {selectedArticle && editMode && (
            <>
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                color="primary"
                disabled={!editFormData.title || !editFormData.content}
              >
                Save
              </Button>
              <Button onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </>
          )}
          <Button onClick={() => { setDetailOpen(false); setEditMode(false); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
