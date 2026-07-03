'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type BookingCalendar = {
  id: string;
  name: string;
  type: string;
  duration: number;
  publicToken: string;
  _count?: { bookings: number };
};

type Booking = {
  id: string;
  calendarId: string;
  bookerName: string;
  bookerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  calendar?: { name: string };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Booking request failed';
}

export default function BookingCalendarsPage() {
  const [calendars, setCalendars] = useState<BookingCalendar[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    type: 'TEAM',
    duration: '30',
  });
  const [bookingForm, setBookingForm] = useState({
    calendarId: '',
    bookerName: '',
    bookerEmail: '',
    startTime: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [calendarsResponse, bookingsResponse] = await Promise.all([
        fetch('/api/booking-calendars?pageSize=100'),
        fetch('/api/bookings?pageSize=100'),
      ]);
      const calendarsPayload = await calendarsResponse.json() as { error?: string; data?: BookingCalendar[] };
      const bookingsPayload = await bookingsResponse.json() as { error?: string; data?: Booking[] };
      if (!calendarsResponse.ok) throw new Error(calendarsPayload.error || 'Failed to load calendars');
      if (!bookingsResponse.ok) throw new Error(bookingsPayload.error || 'Failed to load bookings');
      const calendarRows = calendarsPayload.data || [];
      setCalendars(calendarRows);
      setBookings(bookingsPayload.data || []);
      if (!bookingForm.calendarId && calendarRows[0]) {
        setBookingForm((prev) => ({ ...prev, calendarId: calendarRows[0].id }));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bookingForm.calendarId]);

  useEffect(() => {
    load();
  }, [load]);

  const createCalendar = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/booking-calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: calendarForm.name,
          type: calendarForm.type,
          duration: Number(calendarForm.duration || 30),
          availability: {
            weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            start: '09:00',
            end: '17:00',
          },
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create calendar');
      setSuccess(`${calendarForm.name} created`);
      setCalendarForm((prev) => ({ ...prev, name: '' }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createBooking = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const calendar = calendars.find((item) => item.id === bookingForm.calendarId);
      const start = new Date(bookingForm.startTime);
      const end = new Date(start.getTime() + (calendar?.duration || 30) * 60000);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: bookingForm.calendarId,
          bookerName: bookingForm.bookerName,
          bookerEmail: bookingForm.bookerEmail,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: bookingForm.notes,
          status: 'CONFIRMED',
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create booking');
      setSuccess(`Booking created for ${bookingForm.bookerName}`);
      setBookingForm((prev) => ({ ...prev, bookerName: '', bookerEmail: '', notes: '' }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Booking Calendars</Typography>
            <Typography color="text.secondary">Manage scheduling calendars, public booking links, and confirmed appointments.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '400px minmax(0, 1fr)' }, gap: 3 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <CalendarMonthIcon color="primary" />
                  <Typography variant="h6">New Calendar</Typography>
                </Stack>
                <Stack spacing={2}>
                  <TextField size="small" label="Name" value={calendarForm.name} onChange={(event) => setCalendarForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <FormControl size="small">
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={calendarForm.type} onChange={(event) => setCalendarForm((prev) => ({ ...prev, type: event.target.value }))}>
                      <MenuItem value="PERSONAL">Personal</MenuItem>
                      <MenuItem value="TEAM">Team</MenuItem>
                      <MenuItem value="SERVICE">Service</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField size="small" label="Duration Minutes" type="number" value={calendarForm.duration} onChange={(event) => setCalendarForm((prev) => ({ ...prev, duration: event.target.value }))} />
                  <Button variant="contained" onClick={createCalendar} disabled={saving || !calendarForm.name.trim()}>Create Calendar</Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <EventAvailableIcon color="primary" />
                  <Typography variant="h6">New Booking</Typography>
                </Stack>
                <Stack spacing={2}>
                  <FormControl size="small">
                    <InputLabel>Calendar</InputLabel>
                    <Select label="Calendar" value={bookingForm.calendarId} onChange={(event) => setBookingForm((prev) => ({ ...prev, calendarId: event.target.value }))}>
                      {calendars.map((calendar) => (
                        <MenuItem key={calendar.id} value={calendar.id}>{calendar.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField size="small" label="Booker Name" value={bookingForm.bookerName} onChange={(event) => setBookingForm((prev) => ({ ...prev, bookerName: event.target.value }))} />
                  <TextField size="small" label="Booker Email" value={bookingForm.bookerEmail} onChange={(event) => setBookingForm((prev) => ({ ...prev, bookerEmail: event.target.value }))} />
                  <TextField size="small" label="Start Time" type="datetime-local" InputLabelProps={{ shrink: true }} value={bookingForm.startTime} onChange={(event) => setBookingForm((prev) => ({ ...prev, startTime: event.target.value }))} />
                  <TextField label="Notes" multiline minRows={2} value={bookingForm.notes} onChange={(event) => setBookingForm((prev) => ({ ...prev, notes: event.target.value }))} />
                  <Button variant="contained" onClick={createBooking} disabled={saving || !bookingForm.calendarId || !bookingForm.bookerName || !bookingForm.bookerEmail || !bookingForm.startTime}>
                    Create Booking
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Calendars</Typography>
                {loading ? <CircularProgress /> : calendars.length === 0 ? (
                  <Typography color="text.secondary">No booking calendars created.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Bookings</TableCell>
                        <TableCell>Public Token</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calendars.map((calendar) => (
                        <TableRow key={calendar.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...calendar, recordType: 'Booking Calendar' })}>
                          <TableCell>{calendar.name}</TableCell>
                          <TableCell><Chip size="small" label={calendar.type} /></TableCell>
                          <TableCell>{calendar.duration} min</TableCell>
                          <TableCell>{calendar._count?.bookings || 0}</TableCell>
                          <TableCell>{calendar.publicToken}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Bookings</Typography>
                {bookings.length === 0 ? (
                  <Typography color="text.secondary">No bookings created.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Booker</TableCell>
                        <TableCell>Calendar</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord({ ...booking, recordType: 'Booking' })}>
                          <TableCell>
                            <Typography fontWeight={700}>{booking.bookerName}</Typography>
                            <Typography variant="body2" color="text.secondary">{booking.bookerEmail}</Typography>
                          </TableCell>
                          <TableCell>{booking.calendar?.name || booking.calendarId}</TableCell>
                          <TableCell>{new Date(booking.startTime).toLocaleString()}</TableCell>
                          <TableCell><Chip size="small" label={booking.status} color={booking.status === 'CONFIRMED' ? 'success' : 'default'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title={selectedRecord?.recordType ? `${selectedRecord.recordType} Details` : 'Booking Details'}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
