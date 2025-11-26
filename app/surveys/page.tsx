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
  LinearProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PollIcon from '@mui/icons-material/Poll';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DashboardLayout from '@/components/DashboardLayout';

interface Survey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  isAnonymous: boolean;
  totalResponses: number;
  avgCompletionTime: number | null;
  createdAt: string;
  _count?: { questions: number; responses: number };
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    closedSurveys: 0,
    totalResponses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SATISFACTION',
    isAnonymous: false,
    showProgressBar: true,
    thankYouMessage: 'Thank you for your feedback!',
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys');
      const data = await response.json();
      setSurveys(data.surveys || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchSurveys();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating survey:', error);
    }
  };

  const handleStatusChange = async (surveyId: string, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/surveys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: surveyId, status }),
      });
      fetchSurveys();
    } catch (error) {
      console.error('Error updating survey status:', error);
    }
  };

  const handleDeleteSurvey = async (surveyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this survey?')) return;

    try {
      await fetch(`/api/surveys?id=${surveyId}`, { method: 'DELETE' });
      fetchSurveys();
      if (selectedSurvey?.id === surveyId) {
        setDetailDialogOpen(false);
        setSelectedSurvey(null);
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
    }
  };

  const handleRowClick = (survey: Survey) => {
    setSelectedSurvey(survey);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'SATISFACTION',
      isAnonymous: false,
      showProgressBar: true,
      thankYouMessage: 'Thank you for your feedback!',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'CLOSED':
        return 'error';
      case 'DRAFT':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SATISFACTION':
        return 'Satisfaction';
      case 'NPS':
        return 'NPS';
      case 'FEEDBACK':
        return 'Feedback';
      case 'CUSTOM':
        return 'Custom';
      default:
        return type;
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredSurveys = surveys
    .filter((survey) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        survey.name.toLowerCase().includes(searchLower) ||
        survey.type.toLowerCase().includes(searchLower);

      let matchesTab = true;
      if (tabValue === 1) matchesTab = survey.status === 'ACTIVE';
      else if (tabValue === 2) matchesTab = survey.status === 'CLOSED';
      else if (tabValue === 3) matchesTab = survey.status === 'DRAFT';

      return matchesSearch && matchesTab;
    });

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PollIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Survey Management</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Survey
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PollIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Surveys</Typography>
                </Box>
                <Typography variant="h4">{stats.totalSurveys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active</Typography>
                </Box>
                <Typography variant="h4">{stats.activeSurveys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PauseIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Closed</Typography>
                </Box>
                <Typography variant="h4">{stats.closedSurveys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Responses</Typography>
                </Box>
                <Typography variant="h4">{stats.totalResponses}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search surveys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalSurveys})`} />
            <Tab label={`Active (${stats.activeSurveys})`} />
            <Tab label={`Closed (${stats.closedSurveys})`} />
            <Tab label="Draft" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Surveys Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Survey Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell>Responses</TableCell>
                <TableCell>Avg. Time</TableCell>
                <TableCell>Anonymous</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <TableRow
                  key={survey.id}
                  hover
                  onClick={() => handleRowClick(survey)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {survey.name}
                    </Typography>
                    {survey.description && (
                      <Typography variant="caption" color="textSecondary">
                        {survey.description.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={getTypeLabel(survey.type)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{survey._count?.questions || 0}</TableCell>
                  <TableCell>{survey.totalResponses.toLocaleString()}</TableCell>
                  <TableCell>{formatTime(survey.avgCompletionTime)}</TableCell>
                  <TableCell>
                    {survey.isAnonymous ? (
                      <Chip label="Yes" size="small" color="info" />
                    ) : (
                      <Chip label="No" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={survey.status}
                      color={getStatusColor(survey.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {survey.status === 'DRAFT' && (
                      <Tooltip title="Activate">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => handleStatusChange(survey.id, 'ACTIVE', e)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {survey.status === 'ACTIVE' && (
                      <Tooltip title="Close">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={(e) => handleStatusChange(survey.id, 'CLOSED', e)}
                        >
                          <PauseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Copy Link">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.id}`);
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteSurvey(survey.id, e)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSurveys.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No surveys found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSurvey && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PollIcon color="primary" />
                  <Typography variant="h6">{selectedSurvey.name}</Typography>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedSurvey.status}
                      color={getStatusColor(selectedSurvey.status) as any}
                    />
                    <Chip label={getTypeLabel(selectedSurvey.type)} variant="outlined" />
                    {selectedSurvey.isAnonymous && (
                      <Chip label="Anonymous" color="info" variant="outlined" />
                    )}
                  </Box>
                </Grid>

                {selectedSurvey.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedSurvey.description}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <QuestionAnswerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">{selectedSurvey._count?.questions || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Questions</Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <PeopleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">{selectedSurvey.totalResponses.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">Responses</Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <AccessTimeIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">{formatTime(selectedSurvey.avgCompletionTime)}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg. Completion</Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Survey Link
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${selectedSurvey.id}`}
                        InputProps={{ readOnly: true }}
                      />
                      <IconButton
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/survey/${selectedSurvey.id}`)}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {selectedSurvey.status === 'DRAFT' && (
                <Button
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={(e) => {
                    handleStatusChange(selectedSurvey.id, 'ACTIVE', e);
                    setDetailDialogOpen(false);
                  }}
                >
                  Activate
                </Button>
              )}
              {selectedSurvey.status === 'ACTIVE' && (
                <Button
                  color="warning"
                  startIcon={<PauseIcon />}
                  onClick={(e) => {
                    handleStatusChange(selectedSurvey.id, 'CLOSED', e);
                    setDetailDialogOpen(false);
                  }}
                >
                  Close Survey
                </Button>
              )}
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => handleDeleteSurvey(selectedSurvey.id, e)}
              >
                Delete
              </Button>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Survey</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Survey Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Survey Type *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Survey Type *"
                >
                  <MenuItem value="SATISFACTION">Satisfaction</MenuItem>
                  <MenuItem value="NPS">NPS</MenuItem>
                  <MenuItem value="FEEDBACK">Feedback</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  />
                }
                label="Anonymous Responses"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Thank You Message"
                value={formData.thankYouMessage}
                onChange={(e) => setFormData({ ...formData, thankYouMessage: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSurvey}
            variant="contained"
            disabled={!formData.name}
          >
            Create Survey
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
