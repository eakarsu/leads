'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Grid,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
// Temporarily disabled due to date-fns compatibility issue
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
// import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

interface Task {
  id: string;
  subject: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  relatedTo: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  opportunity: {
    id: string;
    name: string;
  } | null;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    dueDate: '',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    assignedTo: '',
    contactId: '',
    opportunityId: '',
    relatedTo: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchContacts();
    fetchOpportunities();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, assigneeFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assigneeFilter) params.append('assignedTo', assigneeFilter);

      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      const data = await response.json();
      setOpportunities(data);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setOpenViewDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      subject: task.subject,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignee.id,
      contactId: task.contact?.id || '',
      opportunityId: task.opportunity?.id || '',
      relatedTo: task.relatedTo || '',
    });
    setOpenDialog(true);
  };

  const handleCreateTask = async () => {
    try {
      if (selectedTask) {
        // Update existing task
        const response = await fetch(`/api/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: formData.subject,
            description: formData.description,
            dueDate: formData.dueDate || null,
            status: formData.status,
            priority: formData.priority,
            assignedTo: formData.assignedTo,
            contactId: formData.contactId || null,
            opportunityId: formData.opportunityId || null,
            relatedTo: formData.relatedTo || null,
          }),
        });

        if (!response.ok) throw new Error('Failed to update task');
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: formData.subject,
            description: formData.description,
            dueDate: formData.dueDate || null,
            status: formData.status,
            priority: formData.priority,
            assignedTo: formData.assignedTo,
            contactId: formData.contactId || null,
            opportunityId: formData.opportunityId || null,
            relatedTo: formData.relatedTo || null,
          }),
        });

        if (!response.ok) throw new Error('Failed to create task');
      }

      setOpenDialog(false);
      setSelectedTask(null);
      setFormData({
        subject: '',
        description: '',
        dueDate: '',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        assignedTo: '',
        contactId: '',
        opportunityId: '',
        relatedTo: '',
      });
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'NOT_STARTED':
        return 'default';
      case 'DEFERRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const ServerDay = (props: PickersDayProps<Date>) => {
    const { day, ...other } = props;
    const tasksForDay = getTasksForDate(day);

    return (
      <Badge
        key={day.toString()}
        overlap="circular"
        badgeContent={tasksForDay.length > 0 ? tasksForDay.length : undefined}
        color="primary"
      >
        <PickersDay {...other} day={day} />
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Tasks</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTask(null);
              setFormData({
                subject: '',
                description: '',
                dueDate: '',
                status: 'NOT_STARTED',
                  priority: 'MEDIUM',
                  assignedTo: '',
                  contactId: '',
                  opportunityId: '',
                  relatedTo: '',
                });
                setOpenDialog(true);
              }}
            >
              New Task
            </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="List View" />
            <Tab label="Calendar View" />
          </Tabs>
        </Card>

        {tabValue === 0 ? (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                  <TextField
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="DEFERRED">Deferred</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Priority"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Assigned To"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                      setAssigneeFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Related To</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="text.secondary">
                              No tasks found. Create your first task!
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task) => (
                          <TableRow
                            key={task.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewTask(task)}
                          >
                            <TableCell>{task.subject}</TableCell>
                            <TableCell>{formatDate(task.dueDate)}</TableCell>
                            <TableCell>
                              <Chip
                                label={task.status.replace('_', ' ')}
                                size="small"
                                color={getStatusColor(task.status) as any}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={task.priority}
                                size="small"
                                color={getPriorityColor(task.priority) as any}
                              />
                            </TableCell>
                            <TableCell>{task.assignee.name}</TableCell>
                            <TableCell>
                              {task.opportunity
                                ? task.opportunity.name
                                : task.contact
                                ? `${task.contact.firstName} ${task.contact.lastName}`
                                : task.relatedTo || '-'}
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditTask(task)}
                                title="Edit"
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  {/* Temporarily disabled due to date-fns compatibility issue */}
                  <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 8 }}>
                    Calendar view temporarily unavailable
                  </Typography>
                  {/* <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateCalendar
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      slots={{
                        day: ServerDay,
                      }}
                    />
                  </LocalizationProvider> */}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tasks on {selectedDate?.toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {selectedDateTasks.length === 0 ? (
                    <Typography color="text.secondary">No tasks for this date</Typography>
                  ) : (
                    selectedDateTasks.map((task) => (
                      <Box key={task.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2">{task.subject}</Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            label={task.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(task.status) as any}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority) as any}
                          />
                        </Box>
                        <Typography variant="caption" display="block" mt={1}>
                          Assigned to: {task.assignee.name}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="DEFERRED">Deferred</MenuItem>
              </TextField>

              <TextField
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                fullWidth
              >
                <MenuItem value="URGENT">Urgent</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </TextField>

              <TextField
                select
                label="Assigned To"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                fullWidth
                required
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Related Contact (Optional)"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {contacts.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Related Opportunity (Optional)"
                value={formData.opportunityId}
                onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {opportunities.map((opp) => (
                  <MenuItem key={opp.id} value={opp.id}>
                    {opp.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Related To (Other)"
                value={formData.relatedTo}
                onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value })}
                fullWidth
                helperText="Optional - any other related entity or note"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTask}
              variant="contained"
              disabled={!formData.subject || !formData.assignedTo}
            >
              {selectedTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Task Details</DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                  <Typography variant="body1">{selectedTask.subject}</Typography>
                </Box>

                {selectedTask.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedTask.description}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{formatDate(selectedTask.dueDate)}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedTask.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(selectedTask.status) as any}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip
                    label={selectedTask.priority}
                    size="small"
                    color={getPriorityColor(selectedTask.priority) as any}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1">{selectedTask.assignee.name}</Typography>
                </Box>

                {(selectedTask.opportunity || selectedTask.contact || selectedTask.relatedTo) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Related To</Typography>
                    <Typography variant="body1">
                      {selectedTask.opportunity
                        ? selectedTask.opportunity.name
                        : selectedTask.contact
                        ? `${selectedTask.contact.firstName} ${selectedTask.contact.lastName}`
                        : selectedTask.relatedTo}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{selectedTask.creator.name}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            <Button
              onClick={() => {
                if (selectedTask) {
                  setOpenViewDialog(false);
                  handleEditTask(selectedTask);
                }
              }}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
