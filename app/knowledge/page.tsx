'use client';

import { useState, useEffect } from 'react';
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
  TableHead,
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
import DashboardLayout from '@/components/DashboardLayout';

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

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    publicArticles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    keywords: '',
    isPublic: false,
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/knowledge?${params}`);
      const data = await response.json();
      setArticles(data.articles || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
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
        fetchArticles();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handlePublishArticle = async (articleId: string) => {
    try {
      await fetch(`/api/knowledge/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      });
      fetchArticles();
    } catch (error) {
      console.error('Error publishing article:', error);
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

  const filteredArticles = tabValue === 0
    ? articles
    : articles.filter((a) => {
        if (tabValue === 1) return a.status === 'PUBLISHED';
        if (tabValue === 2) return a.status === 'DRAFT';
        if (tabValue === 3) return a.isPublic;
        return true;
      });

  const handleSearch = () => {
    fetchArticles();
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Knowledge Base</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Article
          </Button>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Article</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
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
                  <TableCell>
                    {article.status === 'DRAFT' && (
                      <Tooltip title="Publish">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishArticle(article.id);
                          }}
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
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedArticle?.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedArticle?.articleNumber} | {selectedArticle?.category?.name || 'Uncategorized'}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedArticle && (
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
        </DialogContent>
        <DialogActions>
          {selectedArticle && selectedArticle.status === 'DRAFT' && (
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
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
