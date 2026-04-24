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
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  List,
  ListItem,
  Divider,
  Avatar,
  Stack,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import TodayIcon from '@mui/icons-material/Today';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RepeatIcon from '@mui/icons-material/Repeat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import ExportToolbar from '@/components/ExportToolbar';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface CalendarEvent {
  id: string;
  subject: string;
  description: string | null;
  location: string | null;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  isPrivate: boolean;
  recurrenceRule: string | null;
  status: string;
  ownerId: string;
  attendees: any[];
}

interface DayEvents {
  date: Date;
  dateStr: string;
  events: CalendarEvent[];
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, todayCount: 0, upcomingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    description: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    isPrivate: false,
    status: 'CONFIRMED',
  });

  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    location: '',
    startDateTime: new Date(),
    endDateTime: new Date(Date.now() + 60 * 60 * 1000),
    isAllDay: false,
    isPrivate: false,
    recurrenceRule: '',
    reminderMinutes: 15,
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      });

      const response = await fetch(`/api/calendar?${params}`);
      const data = await response.json();
      setEvents(data.events || []);
      setTodayEvents(data.todayEvents || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching events:', error);
      showError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDateTime: formData.startDateTime.toISOString(),
          endDateTime: formData.endDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchEvents();
        resetForm();
        showSuccess('Event created successfully');
      } else {
        showError('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showError('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = await confirm({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this calendar event?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/calendar?id=${eventId}`, { method: 'DELETE' });
      setDetailDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
      showSuccess('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Failed to delete event');
    }
  };

  const toLocalDateTimeString = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const handleStartEdit = () => {
    if (!selectedEvent) return;
    setEditFormData({
      subject: selectedEvent.subject || '',
      description: selectedEvent.description || '',
      location: selectedEvent.location || '',
      startDateTime: toLocalDateTimeString(selectedEvent.startDateTime),
      endDateTime: toLocalDateTimeString(selectedEvent.endDateTime),
      isAllDay: selectedEvent.isAllDay,
      isPrivate: selectedEvent.isPrivate,
      status: selectedEvent.status || 'CONFIRMED',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent) return;
    try {
      const response = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEvent.id,
          subject: editFormData.subject,
          description: editFormData.description || null,
          location: editFormData.location || null,
          startDateTime: new Date(editFormData.startDateTime).toISOString(),
          endDateTime: new Date(editFormData.endDateTime).toISOString(),
          isAllDay: editFormData.isAllDay,
          isPrivate: editFormData.isPrivate,
          status: editFormData.status,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        setDetailDialogOpen(false);
        setSelectedEvent(null);
        fetchEvents();
        showSuccess('Event updated successfully');
      } else {
        showError('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      showError('Failed to update event');
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      location: '',
      startDateTime: new Date(),
      endDateTime: new Date(Date.now() + 60 * 60 * 1000),
      isAllDay: false,
      isPrivate: false,
      recurrenceRule: '',
      reminderMinutes: 15,
    });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  // Group events by date, only include days with events
  const getEventsByDay = (): DayEvents[] => {
    const eventsByDate: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const eventDate = new Date(event.startDateTime);
      const dateKey = eventDate.toDateString();
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    // Convert to array and sort by date
    return Object.entries(eventsByDate)
      .map(([dateStr, dayEvents]) => ({
        date: new Date(dateStr),
        dateStr,
        events: dayEvents.sort((a, b) =>
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        ),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFullDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventColor = (index: number) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#0097a7'];
    return colors[index % colors.length];
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysWithEvents = getEventsByDay();

  const exportData = events.map(e => ({
    Subject: e.subject,
    Start: new Date(e.startDateTime).toLocaleString(),
    End: new Date(e.endDateTime).toLocaleString(),
    Location: e.location || '',
    'All Day': e.isAllDay ? 'Yes' : 'No',
    Recurring: e.recurrenceRule ? 'Yes' : 'No',
    Attendees: e.attendees?.length || 0,
  }));

  return (
    <DashboardLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Calendar</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ExportToolbar data={exportData} filename="calendar-events" title="Calendar Events" />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                New Event
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TodayIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="textSecondary">Today's Events</Typography>
                  </Box>
                  <Typography variant="h4">{stats.todayCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScheduleIcon color="info" sx={{ mr: 1 }} />
                    <Typography color="textSecondary">Upcoming</Typography>
                  </Box>
                  <Typography variant="h4">{stats.upcomingCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon color="success" sx={{ mr: 1 }} />
                    <Typography color="textSecondary">This Month</Typography>
                  </Box>
                  <Typography variant="h4">{stats.totalEvents}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Month Navigation */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5" fontWeight="medium">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Typography>
              <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Agenda View - Only days with events */}
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : daysWithEvents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No appointments this month
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click "New Event" to schedule your first appointment
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Create Event
              </Button>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {daysWithEvents.map((dayData, dayIndex) => (
                <Paper key={dayData.dateStr} sx={{ overflow: 'hidden' }}>
                  {/* Day Header */}
                  <Box
                    sx={{
                      bgcolor: dayData.date.toDateString() === new Date().toDateString()
                        ? 'primary.main'
                        : 'grey.100',
                      color: dayData.date.toDateString() === new Date().toDateString()
                        ? 'white'
                        : 'text.primary',
                      px: 3,
                      py: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="medium">
                      {formatDate(dayData.date)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {dayData.events.length} appointment{dayData.events.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Events List */}
                  <List disablePadding>
                    {dayData.events.map((event, eventIndex) => (
                      <Box key={event.id}>
                        <ListItem
                          sx={{
                            py: 2,
                            px: 3,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 50,
                              bgcolor: getEventColor(eventIndex),
                              borderRadius: 1,
                              mr: 2,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {event.subject}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    {event.isAllDay
                                      ? 'All Day'
                                      : `${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}`
                                    }
                                  </Typography>
                                </Box>
                                {event.location && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary" component="span">
                                      {event.location}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              {event.recurrenceRule && (
                                <Chip
                                  icon={<RepeatIcon />}
                                  label="Recurring"
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          </Box>
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                        {eventIndex < dayData.events.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Event Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => { setDetailDialogOpen(false); setEditMode(false); }}
          maxWidth="sm"
          fullWidth
        >
          {selectedEvent && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h5" fontWeight="medium">
                      {editMode ? 'Edit Event' : selectedEvent.subject}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => { setDetailDialogOpen(false); setEditMode(false); }} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {editMode ? (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={editFormData.subject}
                      onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      multiline
                      rows={3}
                    />
                    <TextField
                      fullWidth
                      label="Location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Start Date & Time"
                      type="datetime-local"
                      value={editFormData.startDateTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startDateTime: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      fullWidth
                      label="End Date & Time"
                      type="datetime-local"
                      value={editFormData.endDateTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endDateTime: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editFormData.isAllDay}
                          onChange={(e) => setEditFormData({ ...editFormData, isAllDay: e.target.checked })}
                        />
                      }
                      label="All Day Event"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editFormData.isPrivate}
                          onChange={(e) => setEditFormData({ ...editFormData, isPrivate: e.target.checked })}
                        />
                      }
                      label="Private"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                        <MenuItem value="TENTATIVE">Tentative</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                ) : (
                <Stack spacing={3}>
                  {/* Date and Time */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date & Time
                      </Typography>
                      {selectedEvent.isAllDay ? (
                        <Typography variant="body1">
                          All Day - {new Date(selectedEvent.startDateTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="body1">
                            {formatFullDateTime(selectedEvent.startDateTime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            to {formatFullDateTime(selectedEvent.endDateTime)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Location */}
                  {selectedEvent.location && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <LocationOnIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.location}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.description}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Recurring */}
                  {selectedEvent.recurrenceRule && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <RepeatIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Recurrence
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.recurrenceRule}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Attendees */}
                  {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Attendees ({selectedEvent.attendees.length})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          {selectedEvent.attendees.map((attendee, i) => (
                            <Chip
                              key={i}
                              label={attendee.name || attendee.email}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Stack>
                )}
              </DialogContent>
              <DialogActions>
                {editMode ? (
                  <>
                    <Button onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveEdit}
                      disabled={!editFormData.subject}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleStartEdit}
                    >
                      Edit
                    </Button>
                    <Button variant="contained" onClick={() => setDetailDialogOpen(false)}>
                      Close
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Event Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                />
              }
              label="All Day Event"
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <DateTimePicker
                  label="Start"
                  value={formData.startDateTime}
                  onChange={(date) => date && setFormData({ ...formData, startDateTime: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DateTimePicker
                  label="End"
                  value={formData.endDateTime}
                  onChange={(date) => date && setFormData({ ...formData, endDateTime: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Reminder</InputLabel>
              <Select
                value={formData.reminderMinutes}
                onChange={(e) => setFormData({ ...formData, reminderMinutes: e.target.value as number })}
                label="Reminder"
              >
                <MenuItem value={0}>None</MenuItem>
                <MenuItem value={5}>5 minutes before</MenuItem>
                <MenuItem value={15}>15 minutes before</MenuItem>
                <MenuItem value={30}>30 minutes before</MenuItem>
                <MenuItem value={60}>1 hour before</MenuItem>
                <MenuItem value={1440}>1 day before</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} variant="contained" disabled={!formData.subject}>
              Create Event
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </DashboardLayout>
  );
}
