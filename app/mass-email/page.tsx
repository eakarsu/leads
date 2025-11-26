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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DashboardLayout from '@/components/DashboardLayout';

interface MassEmailJob {
  id: string;
  name: string;
  subject: string;
  body: string;
  recipientType: string;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  createdAt: string;
}

export default function MassEmailPage() {
  const [jobs, setJobs] = useState<MassEmailJob[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    draftJobs: 0,
    scheduledJobs: 0,
    completedJobs: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MassEmailJob | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    recipientType: 'Lead',
    scheduledAt: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/mass-email');
      const data = await response.json();
      setJobs(data.jobs || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      const response = await fetch('/api/mass-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchJobs();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleSendJob = async (jobId: string) => {
    try {
      await fetch('/api/mass-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'send' }),
      });
      fetchJobs();
    } catch (error) {
      console.error('Error sending job:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      recipientType: 'Lead',
      scheduledAt: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'SCHEDULED':
        return 'info';
      case 'SENDING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOpenRate = (job: MassEmailJob) => {
    if (job.sentCount === 0) return 0;
    return ((job.openedCount / job.sentCount) * 100).toFixed(1);
  };

  const getClickRate = (job: MassEmailJob) => {
    if (job.openedCount === 0) return 0;
    return ((job.clickedCount / job.openedCount) * 100).toFixed(1);
  };

  const filteredJobs = jobs.filter((j) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      j.name.toLowerCase().includes(searchLower) ||
      j.subject.toLowerCase().includes(searchLower);

    // Tab filter
    let matchesTab = true;
    if (tabValue === 1) matchesTab = j.status === 'DRAFT';
    else if (tabValue === 2) matchesTab = j.status === 'SCHEDULED';
    else if (tabValue === 3) matchesTab = j.status === 'COMPLETED';

    return matchesSearch && matchesTab;
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Mass Email</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Campaign
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Campaigns</Typography>
                </Box>
                <Typography variant="h4">{stats.totalJobs}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SendIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Emails Sent</Typography>
                </Box>
                <Typography variant="h4">{formatNumber(stats.totalSent)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <OpenInNewIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Opened</Typography>
                </Box>
                <Typography variant="h4">{formatNumber(stats.totalOpened)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TouchAppIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Clicked</Typography>
                </Box>
                <Typography variant="h4">{formatNumber(stats.totalClicked)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalJobs})`} />
            <Tab label={`Drafts (${stats.draftJobs})`} />
            <Tab label={`Scheduled (${stats.scheduledJobs})`} />
            <Tab label={`Completed (${stats.completedJobs})`} />
          </Tabs>
        </Paper>

        {/* Jobs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Open Rate</TableCell>
                <TableCell>Click Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow
                  key={job.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedJob(job);
                    setDetailOpen(true);
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {job.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {job.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.recipientType}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    {formatNumber(job.totalRecipients)}
                  </TableCell>
                  <TableCell>
                    {job.status === 'SENDING' ? (
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(job.sentCount / job.totalRecipients) * 100}
                        />
                        <Typography variant="caption">
                          {formatNumber(job.sentCount)} / {formatNumber(job.totalRecipients)}
                        </Typography>
                      </Box>
                    ) : (
                      formatNumber(job.sentCount)
                    )}
                  </TableCell>
                  <TableCell>
                    {job.sentCount > 0 ? (
                      <Chip
                        label={`${getOpenRate(job)}%`}
                        size="small"
                        color={parseFloat(getOpenRate(job) as string) > 25 ? 'success' : 'default'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {job.openedCount > 0 ? (
                      <Chip
                        label={`${getClickRate(job)}%`}
                        size="small"
                        color={parseFloat(getClickRate(job) as string) > 10 ? 'success' : 'default'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {job.completedAt
                      ? new Date(job.completedAt).toLocaleDateString()
                      : job.scheduledAt
                      ? new Date(job.scheduledAt).toLocaleDateString()
                      : new Date(job.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {job.status === 'DRAFT' && (
                      <Tooltip title="Send Now">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendJob(job.id);
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create Campaign Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Campaign Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Recipient Type</InputLabel>
                <Select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                  label="Recipient Type"
                >
                  <MenuItem value="Lead">Leads</MenuItem>
                  <MenuItem value="Contact">Contacts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Schedule (optional)"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject *"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Use {{fullName}} for personalization"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Body *"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                multiline
                rows={10}
                placeholder="Write your email content here. Use {{fullName}} for personalization."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateJob}
            variant="contained"
            disabled={!formData.name || !formData.subject || !formData.body}
          >
            Create Campaign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedJob?.name}</Typography>
              <Typography variant="body2" color="textSecondary">{selectedJob?.subject}</Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip
                  label={selectedJob.status}
                  color={getStatusColor(selectedJob.status) as any}
                />
                <Chip
                  label={selectedJob.recipientType}
                  variant="outlined"
                />
              </Box>

              {/* Metrics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5">{formatNumber(selectedJob.totalRecipients)}</Typography>
                    <Typography variant="caption" color="textSecondary">Recipients</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5">{formatNumber(selectedJob.sentCount)}</Typography>
                    <Typography variant="caption" color="textSecondary">Sent</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">{formatNumber(selectedJob.openedCount)}</Typography>
                    <Typography variant="caption" color="textSecondary">Opened ({getOpenRate(selectedJob)}%)</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main">{formatNumber(selectedJob.clickedCount)}</Typography>
                    <Typography variant="caption" color="textSecondary">Clicked ({getClickRate(selectedJob)}%)</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="error.main">{formatNumber(selectedJob.failedCount)}</Typography>
                    <Typography variant="caption" color="textSecondary">Failed</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">{formatNumber(selectedJob.bouncedCount)}</Typography>
                    <Typography variant="caption" color="textSecondary">Bounced</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">
                      {selectedJob.sentCount > 0
                        ? ((1 - selectedJob.failedCount / selectedJob.sentCount) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Delivery Rate</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Email Content Preview
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedJob.body }} />
                </Paper>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary">Created</Typography>
                  <Typography variant="body2">
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedJob.completedAt && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">Completed</Typography>
                    <Typography variant="body2">
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedJob && selectedJob.status === 'DRAFT' && (
            <Button
              color="success"
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                handleSendJob(selectedJob.id);
                setDetailOpen(false);
              }}
            >
              Send Now
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
