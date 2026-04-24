'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, Tabs, Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface BookingCalendar {
  id: string;
  name: string;
  type: string;
  duration: number;
  availability: any;
  publicLink: string;
  _count?: { bookings: number };
  createdAt: string;
}

interface Booking {
  id: string;
  calendar: { id: string; name: string };
  bookerName: string;
  bookerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  createdAt: string;
}

const calendarColumns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'duration', label: 'Duration' },
  { id: 'publicLink', label: 'Public Link', sortable: false },
  { id: 'bookings', label: 'Bookings', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const bookingColumns: Column[] = [
  { id: 'calendar', label: 'Calendar', sortable: false },
  { id: 'bookerName', label: 'Booker Name' },
  { id: 'bookerEmail', label: 'Email' },
  { id: 'startTime', label: 'Start' },
  { id: 'endTime', label: 'End' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED': return 'success';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'error';
    case 'COMPLETED': return 'info';
    default: return 'default';
  }
};

export default function SchedulerPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [tab, setTab] = useState(0);

  // Calendar state
  const [calSortBy, setCalSortBy] = useState('createdAt');
  const [calSortOrder, setCalSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openCalDialog, setOpenCalDialog] = useState(false);
  const [openCalDetailDialog, setOpenCalDetailDialog] = useState(false);
  const [editCalMode, setEditCalMode] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<BookingCalendar | null>(null);
  const [calForm, setCalForm] = useState({
    name: '', type: 'PERSONAL', duration: 30, availability: '',
  });
  const [editCalForm, setEditCalForm] = useState({
    name: '', type: 'PERSONAL', duration: 30, availability: '',
  });

  // Booking state
  const [bookSortBy, setBookSortBy] = useState('startTime');
  const [bookSortOrder, setBookSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openBookDialog, setOpenBookDialog] = useState(false);
  const [openBookDetailDialog, setOpenBookDetailDialog] = useState(false);
  const [editBookMode, setEditBookMode] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [calendars, setCalendars] = useState<BookingCalendar[]>([]);
  const [bookForm, setBookForm] = useState({
    calendarId: '', bookerName: '', bookerEmail: '', startTime: '', endTime: '', status: 'PENDING', notes: '',
  });
  const [editBookForm, setEditBookForm] = useState({
    bookerName: '', bookerEmail: '', startTime: '', endTime: '', status: 'PENDING', notes: '',
  });

  const {
    data: calendarData,
    loading: calLoading,
    error: calError,
    pagination: calPagination,
    setPage: setCalPage,
    setPageSize: setCalPageSize,
    setSort: setCalSort,
    refresh: refreshCalendars,
  } = usePagination<BookingCalendar>({
    url: '/api/booking-calendars',
    defaultSortBy: calSortBy,
    defaultSortOrder: calSortOrder,
  });

  const {
    data: bookingData,
    loading: bookLoading,
    error: bookError,
    pagination: bookPagination,
    setPage: setBookPage,
    setPageSize: setBookPageSize,
    setSort: setBookSort,
    refresh: refreshBookings,
  } = usePagination<Booking>({
    url: '/api/bookings',
    defaultSortBy: bookSortBy,
    defaultSortOrder: bookSortOrder,
  });

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const res = await fetch('/api/booking-calendars?pageSize=100');
      if (res.ok) {
        const data = await res.json();
        setCalendars(data.data || (Array.isArray(data) ? data : []));
      }
    } catch {
      // ignore
    }
  };

  const handleCalSort = (col: string) => {
    const newOrder = calSortBy === col && calSortOrder === 'asc' ? 'desc' : 'asc';
    setCalSortBy(col);
    setCalSortOrder(newOrder);
    setCalSort(col, newOrder);
  };

  const handleBookSort = (col: string) => {
    const newOrder = bookSortBy === col && bookSortOrder === 'asc' ? 'desc' : 'asc';
    setBookSortBy(col);
    setBookSortOrder(newOrder);
    setBookSort(col, newOrder);
  };

  const parseJSON = (str: string) => {
    try { return JSON.parse(str); } catch { return str || null; }
  };

  // Calendar CRUD
  const handleCreateCalendar = async () => {
    try {
      const payload = {
        name: calForm.name,
        type: calForm.type,
        duration: calForm.duration,
        availability: parseJSON(calForm.availability),
      };
      const response = await fetch('/api/booking-calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create calendar');
      setOpenCalDialog(false);
      setCalForm({ name: '', type: 'PERSONAL', duration: 30, availability: '' });
      toast.showSuccess('Calendar created successfully');
      refreshCalendars();
      fetchCalendars();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdateCalendar = async () => {
    if (!selectedCalendar) return;
    try {
      const payload = {
        name: editCalForm.name,
        type: editCalForm.type,
        duration: editCalForm.duration,
        availability: parseJSON(editCalForm.availability),
      };
      const response = await fetch(`/api/booking-calendars/${selectedCalendar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update calendar');
      toast.showSuccess('Calendar updated successfully');
      setEditCalMode(false);
      setOpenCalDetailDialog(false);
      refreshCalendars();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Calendar',
      message: 'Are you sure you want to delete this calendar? All associated bookings will also be removed.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/booking-calendars/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete calendar');
      toast.showSuccess('Calendar deleted successfully');
      setOpenCalDetailDialog(false);
      refreshCalendars();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  // Booking CRUD
  const handleCreateBooking = async () => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      setOpenBookDialog(false);
      setBookForm({ calendarId: '', bookerName: '', bookerEmail: '', startTime: '', endTime: '', status: 'PENDING', notes: '' });
      toast.showSuccess('Booking created successfully');
      refreshBookings();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete booking');
      toast.showSuccess('Booking deleted successfully');
      refreshBookings();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleBookRowClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookMode(false);
    setOpenBookDetailDialog(true);
  };

  const handleStartBookEdit = () => {
    if (!selectedBooking) return;
    setEditBookForm({
      bookerName: selectedBooking.bookerName,
      bookerEmail: selectedBooking.bookerEmail,
      startTime: selectedBooking.startTime ? new Date(selectedBooking.startTime).toISOString().slice(0, 16) : '',
      endTime: selectedBooking.endTime ? new Date(selectedBooking.endTime).toISOString().slice(0, 16) : '',
      status: selectedBooking.status,
      notes: selectedBooking.notes || '',
    });
    setEditBookMode(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBookForm),
      });
      if (!response.ok) throw new Error('Failed to update booking');
      toast.showSuccess('Booking updated successfully');
      setEditBookMode(false);
      setOpenBookDetailDialog(false);
      refreshBookings();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleCalRowClick = (calendar: BookingCalendar) => {
    setSelectedCalendar(calendar);
    setEditCalMode(false);
    setOpenCalDetailDialog(true);
  };

  const handleStartCalEdit = () => {
    if (!selectedCalendar) return;
    setEditCalForm({
      name: selectedCalendar.name,
      type: selectedCalendar.type,
      duration: selectedCalendar.duration,
      availability: selectedCalendar.availability ? JSON.stringify(selectedCalendar.availability, null, 2) : '',
    });
    setEditCalMode(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.showSuccess('Link copied to clipboard');
  };

  const calExportData = useMemo(() => {
    return calendarData.map((c) => ({
      Name: c.name, Type: c.type, 'Duration (min)': c.duration,
      'Public Link': c.publicLink || '---', Bookings: c._count?.bookings || 0,
    }));
  }, [calendarData]);

  const bookExportData = useMemo(() => {
    return bookingData.map((b) => ({
      Calendar: b.calendar?.name || '---', 'Booker Name': b.bookerName,
      Email: b.bookerEmail, Start: new Date(b.startTime).toLocaleString(),
      End: new Date(b.endTime).toLocaleString(), Status: b.status,
    }));
  }, [bookingData]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarMonthIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Scheduler</Typography>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Calendars" />
          <Tab label="Bookings" />
        </Tabs>

        {/* Calendars Tab */}
        {tab === 0 && (
          <>
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <ExportToolbar data={calExportData} filename="booking-calendars" title="Booking Calendars" />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCalDialog(true)}>
                New Calendar
              </Button>
            </Box>

            {calError && <Alert severity="error" sx={{ mb: 2 }}>{calError}</Alert>}

            <Card>
              <CardContent>
                {calLoading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <SortableTableHead columns={calendarColumns} sortBy={calSortBy} sortOrder={calSortOrder} onSort={handleCalSort} />
                      <TableBody>
                        {calendarData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography color="text.secondary">No calendars found. Create your first calendar!</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          calendarData.map((calendar) => (
                            <TableRow key={calendar.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleCalRowClick(calendar)}>
                              <TableCell>{calendar.name}</TableCell>
                              <TableCell><Chip label={calendar.type} size="small" variant="outlined" /></TableCell>
                              <TableCell>{calendar.duration} min</TableCell>
                              <TableCell>
                                {calendar.publicLink ? (
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                      {calendar.publicLink}
                                    </Typography>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); copyToClipboard(calendar.publicLink); }}>
                                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Box>
                                ) : '---'}
                              </TableCell>
                              <TableCell>{calendar._count?.bookings || 0}</TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={() => handleCalRowClick(calendar)} title="View">
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => { setSelectedCalendar(calendar); handleStartCalEdit(); setOpenCalDetailDialog(true); }} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDeleteCalendar(calendar.id)} title="Delete" color="error">
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
                  page={calPagination.page}
                  pageSize={calPagination.pageSize}
                  totalItems={calPagination.totalItems}
                  onPageChange={setCalPage}
                  onPageSizeChange={setCalPageSize}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Bookings Tab */}
        {tab === 1 && (
          <>
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <ExportToolbar data={bookExportData} filename="bookings" title="Bookings" />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenBookDialog(true)}>
                New Booking
              </Button>
            </Box>

            {bookError && <Alert severity="error" sx={{ mb: 2 }}>{bookError}</Alert>}

            <Card>
              <CardContent>
                {bookLoading ? (
                  <TableSkeleton rows={5} columns={7} />
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <SortableTableHead columns={bookingColumns} sortBy={bookSortBy} sortOrder={bookSortOrder} onSort={handleBookSort} />
                      <TableBody>
                        {bookingData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary">No bookings found.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          bookingData.map((booking) => (
                            <TableRow key={booking.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleBookRowClick(booking)}>
                              <TableCell>{booking.calendar?.name || '---'}</TableCell>
                              <TableCell>{booking.bookerName}</TableCell>
                              <TableCell>{booking.bookerEmail}</TableCell>
                              <TableCell>{new Date(booking.startTime).toLocaleString()}</TableCell>
                              <TableCell>{new Date(booking.endTime).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip label={booking.status} size="small" color={getStatusColor(booking.status) as any} />
                              </TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={() => handleDeleteBooking(booking.id)} title="Delete" color="error">
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
                  page={bookPagination.page}
                  pageSize={bookPagination.pageSize}
                  totalItems={bookPagination.totalItems}
                  onPageChange={setBookPage}
                  onPageSizeChange={setBookPageSize}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Calendar Dialog */}
        <Dialog open={openCalDialog} onClose={() => setOpenCalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Booking Calendar</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Calendar Name"
                value={calForm.name}
                onChange={(e) => setCalForm({ ...calForm, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Type"
                value={calForm.type}
                onChange={(e) => setCalForm({ ...calForm, type: e.target.value })}
                fullWidth
              >
                <MenuItem value="PERSONAL">Personal</MenuItem>
                <MenuItem value="TEAM">Team</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
              </TextField>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={calForm.duration}
                onChange={(e) => setCalForm({ ...calForm, duration: parseInt(e.target.value) || 30 })}
                fullWidth
              />
              <TextField
                label="Availability (JSON)"
                value={calForm.availability}
                onChange={(e) => setCalForm({ ...calForm, availability: e.target.value })}
                multiline
                rows={5}
                fullWidth
                placeholder='{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}}'
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCalendar} variant="contained" disabled={!calForm.name}>
              Create Calendar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Calendar Detail / Edit Dialog */}
        <Dialog open={openCalDetailDialog} onClose={() => { setOpenCalDetailDialog(false); setEditCalMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editCalMode ? 'Edit Calendar' : 'Calendar Details'}</DialogTitle>
          <DialogContent>
            {selectedCalendar && !editCalMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedCalendar.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                    <Chip label={selectedCalendar.type} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">{selectedCalendar.duration} min</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Public Link</Typography>
                  <Typography variant="body1">{selectedCalendar.publicLink || '---'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Bookings</Typography>
                  <Typography variant="body1">{selectedCalendar._count?.bookings || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {selectedCalendar.availability ? JSON.stringify(selectedCalendar.availability, null, 2) : 'Not configured.'}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {selectedCalendar && editCalMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Calendar Name"
                  value={editCalForm.name}
                  onChange={(e) => setEditCalForm({ ...editCalForm, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Type"
                  value={editCalForm.type}
                  onChange={(e) => setEditCalForm({ ...editCalForm, type: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="TEAM">Team</MenuItem>
                  <MenuItem value="SERVICE">Service</MenuItem>
                </TextField>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  value={editCalForm.duration}
                  onChange={(e) => setEditCalForm({ ...editCalForm, duration: parseInt(e.target.value) || 30 })}
                  fullWidth
                />
                <TextField
                  label="Availability (JSON)"
                  value={editCalForm.availability}
                  onChange={(e) => setEditCalForm({ ...editCalForm, availability: e.target.value })}
                  multiline
                  rows={5}
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editCalMode ? (
              <>
                <Button onClick={() => setEditCalMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateCalendar} disabled={!editCalForm.name}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenCalDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartCalEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedCalendar && handleDeleteCalendar(selectedCalendar.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Create Booking Dialog */}
        <Dialog open={openBookDialog} onClose={() => setOpenBookDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Booking</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Calendar"
                value={bookForm.calendarId}
                onChange={(e) => setBookForm({ ...bookForm, calendarId: e.target.value })}
                fullWidth
                required
              >
                {calendars.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.duration} min)</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Booker Name"
                value={bookForm.bookerName}
                onChange={(e) => setBookForm({ ...bookForm, bookerName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Booker Email"
                value={bookForm.bookerEmail}
                onChange={(e) => setBookForm({ ...bookForm, bookerEmail: e.target.value })}
                fullWidth
                required
                type="email"
              />
              <TextField
                label="Start Time"
                type="datetime-local"
                value={bookForm.startTime}
                onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="datetime-local"
                value={bookForm.endTime}
                onChange={(e) => setBookForm({ ...bookForm, endTime: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Status"
                value={bookForm.status}
                onChange={(e) => setBookForm({ ...bookForm, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>
              <TextField
                label="Notes"
                value={bookForm.notes}
                onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBookDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateBooking}
              variant="contained"
              disabled={!bookForm.calendarId || !bookForm.bookerName || !bookForm.bookerEmail || !bookForm.startTime || !bookForm.endTime}
            >
              Create Booking
            </Button>
          </DialogActions>
        </Dialog>

        {/* Booking Detail / Edit Dialog */}
        <Dialog open={openBookDetailDialog} onClose={() => { setOpenBookDetailDialog(false); setEditBookMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editBookMode ? 'Edit Booking' : 'Booking Details'}</DialogTitle>
          <DialogContent>
            {selectedBooking && !editBookMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Calendar</Typography>
                  <Typography variant="body1">{selectedBooking.calendar?.name || '---'}</Typography>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Booker Name</Typography>
                    <Typography variant="body1">{selectedBooking.bookerName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedBooking.bookerEmail}</Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Start Time</Typography>
                    <Typography variant="body1">{new Date(selectedBooking.startTime).toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">End Time</Typography>
                    <Typography variant="body1">{new Date(selectedBooking.endTime).toLocaleString()}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={selectedBooking.status} size="small" color={getStatusColor(selectedBooking.status) as any} />
                </Box>
                {selectedBooking.notes && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedBooking.notes}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {selectedBooking && editBookMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Booker Name"
                  value={editBookForm.bookerName}
                  onChange={(e) => setEditBookForm({ ...editBookForm, bookerName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Booker Email"
                  value={editBookForm.bookerEmail}
                  onChange={(e) => setEditBookForm({ ...editBookForm, bookerEmail: e.target.value })}
                  fullWidth
                  required
                  type="email"
                />
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  value={editBookForm.startTime}
                  onChange={(e) => setEditBookForm({ ...editBookForm, startTime: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Time"
                  type="datetime-local"
                  value={editBookForm.endTime}
                  onChange={(e) => setEditBookForm({ ...editBookForm, endTime: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  select
                  label="Status"
                  value={editBookForm.status}
                  onChange={(e) => setEditBookForm({ ...editBookForm, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </TextField>
                <TextField
                  label="Notes"
                  value={editBookForm.notes}
                  onChange={(e) => setEditBookForm({ ...editBookForm, notes: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editBookMode ? (
              <>
                <Button onClick={() => setEditBookMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateBooking} disabled={!editBookForm.bookerName || !editBookForm.bookerEmail}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenBookDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartBookEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedBooking && handleDeleteBooking(selectedBooking.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
