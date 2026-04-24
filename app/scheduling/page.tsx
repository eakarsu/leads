'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead,
  Card, CardContent, Grid, Chip, Radio, RadioGroup, FormControlLabel,
  TextField, CircularProgress, Alert,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastProvider';

const steps = ['Select Work Order', 'Choose Date', 'Select Resource & Time', 'Review', 'Confirmation'];

export default function SchedulingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/scheduling');
      const data = await res.json();
      setWorkOrders(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSlots = async () => {
    if (!selectedWO || !selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scheduling/available-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: selectedWO.id, date: selectedDate }),
      });
      const data = await res.json();
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error:', error);
      toast.showError('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedWO || !selectedResource || !selectedSlot) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scheduling/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWO.id,
          resourceId: selectedResource.id,
          date: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBooking(data);
        setActiveStep(4);
        toast.showSuccess('Appointment booked successfully!');
      } else {
        toast.showError(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      toast.showError('Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1) fetchSlots();
    if (activeStep === 3) handleBook();
    else setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleReset = () => {
    setActiveStep(0);
    setSelectedWO(null);
    setSelectedDate('');
    setAvailableSlots(null);
    setSelectedResource(null);
    setSelectedSlot(null);
    setBooking(null);
    fetchWorkOrders();
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return !!selectedWO;
      case 1: return !!selectedDate;
      case 2: return !!selectedResource && !!selectedSlot;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Scheduling Wizard</Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3 }}>
          {/* Step 0: Select Work Order */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select a Work Order to Schedule</Typography>
              {workOrders.length === 0 ? (
                <Alert severity="info">No schedulable work orders found</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell>WO#</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Territory</TableCell>
                        <TableCell>Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workOrders.map(wo => (
                        <TableRow
                          key={wo.id}
                          hover
                          selected={selectedWO?.id === wo.id}
                          onClick={() => setSelectedWO(wo)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Radio checked={selectedWO?.id === wo.id} />
                          </TableCell>
                          <TableCell>{wo.workOrderNumber}</TableCell>
                          <TableCell>{wo.subject}</TableCell>
                          <TableCell>
                            <Chip label={wo.priority} size="small" color={
                              wo.priority === 'CRITICAL' || wo.priority === 'EMERGENCY' ? 'error' :
                              wo.priority === 'HIGH' ? 'warning' : 'default'
                            } />
                          </TableCell>
                          <TableCell>{wo.territory?.name || '-'}</TableCell>
                          <TableCell>{wo.workType?.estimatedDurationMinutes || 60} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Step 1: Choose Date */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select Date</Typography>
              <TextField
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="Appointment Date"
                sx={{ minWidth: 300 }}
              />
            </Box>
          )}

          {/* Step 2: Select Resource & Time */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select Resource & Time Slot</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
              ) : availableSlots ? (
                availableSlots.resources.length === 0 ? (
                  <Alert severity="warning">No available resources for this date</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {availableSlots.resources.map((r: any) => (
                      <Grid size={{ xs: 12, md: 6 }} key={r.resource.id}>
                        <Card
                          variant={selectedResource?.id === r.resource.id ? 'elevation' : 'outlined'}
                          sx={{
                            border: selectedResource?.id === r.resource.id ? '2px solid #1976d2' : undefined,
                            cursor: 'pointer',
                          }}
                          onClick={() => { setSelectedResource(r.resource); setSelectedSlot(null); }}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold">{r.resource.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Skills: {r.resource.skills.map((s: any) => s.name).join(', ') || 'None'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {r.availableSlots.length} slots available
                            </Typography>
                            {selectedResource?.id === r.resource.id && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {r.availableSlots.map((slot: any, idx: number) => (
                                  <Chip
                                    key={idx}
                                    label={`${slot.start} - ${slot.end}`}
                                    color={selectedSlot?.start === slot.start ? 'primary' : 'default'}
                                    onClick={(e) => { e.stopPropagation(); setSelectedSlot(slot); }}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )
              ) : (
                <Alert severity="info">Click &quot;Find Slots&quot; to search for availability</Alert>
              )}
            </Box>
          )}

          {/* Step 3: Review */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Review Appointment</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Work Order</Typography>
                      <Typography>{selectedWO?.workOrderNumber} - {selectedWO?.subject}</Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Date</Typography>
                      <Typography>{selectedDate}</Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Resource</Typography>
                      <Typography>{selectedResource?.name}</Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Time</Typography>
                      <Typography>{selectedSlot?.start} - {selectedSlot?.end}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 4: Confirmation */}
          {activeStep === 4 && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Appointment booked successfully!
              </Alert>
              {booking && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Appointment Details</Typography>
                    <Typography>Appointment #: {booking.appointment?.appointmentNumber}</Typography>
                    <Typography>Status: {booking.appointment?.status}</Typography>
                    <Typography>Scheduled: {new Date(booking.appointment?.scheduledStart).toLocaleString()} - {new Date(booking.appointment?.scheduledEnd).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              )}
              <Button variant="contained" onClick={handleReset} sx={{ mt: 2 }}>
                Schedule Another
              </Button>
            </Box>
          )}
        </Paper>

        {activeStep < 4 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed() || loading}
            >
              {loading ? <CircularProgress size={24} /> : activeStep === 3 ? 'Book Appointment' : 'Next'}
            </Button>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
