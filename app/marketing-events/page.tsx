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
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideocamIcon from '@mui/icons-material/Videocam';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DashboardLayout from '@/components/DashboardLayout';

interface MarketingEvent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  locationType: string;
  venue: string | null;
  city: string | null;
  state: string | null;
  virtualUrl: string | null;
  virtualPlatform: string | null;
  maxAttendees: number | null;
  currentAttendees: number;
  registrationRequired: boolean;
  registrationFee: number | null;
  createdAt: string;
  _count?: { registrations: number; sessions: number };
}

export default function MarketingEventsPage() {
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarketingEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'WEBINAR',
    locationType: 'ONLINE',
    startDateTime: '',
    endDateTime: '',
    venue: '',
    city: '',
    virtualUrl: '',
    virtualPlatform: 'ZOOM',
    maxAttendees: 100,
    registrationFee: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/marketing-events');
      const data = await response.json();
      setEvents(data.events || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching marketing events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const response = await fetch('/api/marketing-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchEvents();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleStatusChange = async (eventId: string, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/marketing-events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, status }),
      });
      fetchEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await fetch(`/api/marketing-events?id=${eventId}`, { method: 'DELETE' });
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setDetailDialogOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleRowClick = (event: MarketingEvent) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'WEBINAR',
      locationType: 'ONLINE',
      startDateTime: '',
      endDateTime: '',
      venue: '',
      city: '',
      virtualUrl: '',
      virtualPlatform: 'ZOOM',
      maxAttendees: 100,
      registrationFee: 0,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    return <EventIcon fontSize="small" />;
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'ONLINE':
        return <VideocamIcon fontSize="small" color="primary" />;
      case 'IN_PERSON':
        return <LocationOnIcon fontSize="small" color="error" />;
      case 'HYBRID':
        return <CalendarMonthIcon fontSize="small" color="warning" />;
      default:
        return <EventIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCapacityPercent = (event: MarketingEvent) => {
    if (!event.maxAttendees) return 0;
    return Math.round((event.currentAttendees / event.maxAttendees) * 100);
  };

  const filteredEvents = events
    .filter((event) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        event.name.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower);

      let matchesTab = true;
      if (tabValue === 1) matchesTab = event.status === 'PUBLISHED' && new Date(event.startDateTime) > new Date();
      else if (tabValue === 2) matchesTab = event.status === 'COMPLETED';
      else if (tabValue === 3) matchesTab = event.status === 'DRAFT';

      return matchesSearch && matchesTab;
    });

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Event Management</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Event
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Events</Typography>
                </Box>
                <Typography variant="h4">{stats.totalEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarMonthIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Upcoming</Typography>
                </Box>
                <Typography variant="h4">{stats.upcomingEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Completed</Typography>
                </Box>
                <Typography variant="h4">{stats.completedEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Registrations</Typography>
                </Box>
                <Typography variant="h4">{stats.totalRegistrations}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalEvents})`} />
            <Tab label={`Upcoming (${stats.upcomingEvents})`} />
            <Tab label={`Completed (${stats.completedEvents})`} />
            <Tab label="Draft" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Events Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Registrations</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  onClick={() => handleRowClick(event)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {event.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={event.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(event.startDateTime)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getLocationIcon(event.locationType)}
                      {event.locationType === 'ONLINE'
                        ? event.virtualPlatform || 'Online'
                        : `${event.city || ''} ${event.venue || ''}`}
                    </Box>
                  </TableCell>
                  <TableCell>{event.currentAttendees}</TableCell>
                  <TableCell>
                    {event.maxAttendees ? (
                      <Box>
                        <Typography variant="body2">
                          {event.currentAttendees}/{event.maxAttendees}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getCapacityPercent(event)}
                          color={getCapacityPercent(event) >= 90 ? 'error' : 'primary'}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                        />
                      </Box>
                    ) : (
                      'Unlimited'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {event.status === 'DRAFT' && (
                      <Tooltip title="Publish">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => handleStatusChange(event.id, 'PUBLISHED', e)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEvents.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No events found
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
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="primary" />
                  <Typography variant="h6">{selectedEvent.name}</Typography>
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
                      label={selectedEvent.status}
                      color={getStatusColor(selectedEvent.status) as any}
                    />
                    <Chip label={selectedEvent.type} variant="outlined" />
                    <Chip
                      icon={getLocationIcon(selectedEvent.locationType)}
                      label={selectedEvent.locationType}
                      variant="outlined"
                    />
                  </Box>
                </Grid>

                {selectedEvent.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEvent.description}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <CalendarMonthIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Date & Time
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(selectedEvent.startDateTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      to {formatDateTime(selectedEvent.endDateTime)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Location
                    </Typography>
                    {selectedEvent.locationType === 'ONLINE' ? (
                      <>
                        <Typography variant="body1">{selectedEvent.virtualPlatform}</Typography>
                        {selectedEvent.virtualUrl && (
                          <Typography variant="body2" color="primary" sx={{ wordBreak: 'break-all' }}>
                            {selectedEvent.virtualUrl}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        <Typography variant="body1">{selectedEvent.venue}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEvent.city}, {selectedEvent.state}
                        </Typography>
                      </>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">{selectedEvent.currentAttendees}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Registrations{selectedEvent.maxAttendees ? ` / ${selectedEvent.maxAttendees}` : ''}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                      {selectedEvent._count?.sessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Sessions</Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {selectedEvent.registrationFee ? `$${selectedEvent.registrationFee}` : 'Free'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Registration Fee</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {selectedEvent.status === 'DRAFT' && (
                <Button
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={(e) => {
                    handleStatusChange(selectedEvent.id, 'PUBLISHED', e);
                    setDetailDialogOpen(false);
                  }}
                >
                  Publish
                </Button>
              )}
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => handleDeleteEvent(selectedEvent.id, e)}
              >
                Delete
              </Button>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Event Name *"
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
                <InputLabel>Event Type *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Event Type *"
                >
                  <MenuItem value="WEBINAR">Webinar</MenuItem>
                  <MenuItem value="CONFERENCE">Conference</MenuItem>
                  <MenuItem value="WORKSHOP">Workshop</MenuItem>
                  <MenuItem value="MEETUP">Meetup</MenuItem>
                  <MenuItem value="TRADE_SHOW">Trade Show</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Location Type *</InputLabel>
                <Select
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  label="Location Type *"
                >
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="IN_PERSON">In Person</MenuItem>
                  <MenuItem value="HYBRID">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Date & Time *"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Date & Time *"
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {formData.locationType !== 'ONLINE' && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Grid>
              </>
            )}
            {formData.locationType !== 'IN_PERSON' && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Virtual Platform</InputLabel>
                    <Select
                      value={formData.virtualPlatform}
                      onChange={(e) => setFormData({ ...formData, virtualPlatform: e.target.value })}
                      label="Virtual Platform"
                    >
                      <MenuItem value="ZOOM">Zoom</MenuItem>
                      <MenuItem value="TEAMS">Microsoft Teams</MenuItem>
                      <MenuItem value="WEBEX">Webex</MenuItem>
                      <MenuItem value="CUSTOM">Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Virtual URL"
                    value={formData.virtualUrl}
                    onChange={(e) => setFormData({ ...formData, virtualUrl: e.target.value })}
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Max Attendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 100 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Registration Fee"
                type="number"
                value={formData.registrationFee}
                onChange={(e) => setFormData({ ...formData, registrationFee: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateEvent}
            variant="contained"
            disabled={!formData.name || !formData.startDateTime || !formData.endDateTime}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
