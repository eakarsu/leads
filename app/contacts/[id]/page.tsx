'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import NotesSection from '@/components/NotesSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import ActivityTimeline from '@/components/ActivityTimeline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  department: string | null;
  linkedinUrl: string | null;
  isPrimary: boolean;
  notes: string | null;
  client: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  account: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  subContacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    title: string | null;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number;
    probability: number;
    expectedCloseDate: string | null;
    owner: {
      id: string;
      name: string;
    };
  }>;
  tasks: Array<{
    id: string;
    subject: string;
    dueDate: string | null;
    status: string;
    priority: string;
    assignee: {
      id: string;
      name: string;
    };
  }>;
  events: Array<{
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
    eventType: string;
    owner: {
      id: string;
      name: string;
    };
  }>;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contact');
      const data = await response.json();
      setContact(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete contact');
      router.push('/contacts');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING':
        return 'default';
      case 'QUALIFICATION':
        return 'info';
      case 'NEEDS_ANALYSIS':
        return 'primary';
      case 'PROPOSAL':
        return 'secondary';
      case 'NEGOTIATION':
        return 'warning';
      case 'CLOSED_WON':
        return 'success';
      case 'CLOSED_LOST':
        return 'error';
      default:
        return 'default';
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

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!contact) {
    return (
      <DashboardLayout>
        <Alert severity="error">Contact not found</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/contacts')}
            >
              Back
            </Button>
            <Typography variant="h4">
              {contact.firstName} {contact.lastName}
            </Typography>
            {contact.isPrimary && (
              <Chip label="Primary Contact" color="primary" />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteContact}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon color="action" />
                      <Typography variant="body1">{contact.email}</Typography>
                    </Box>
                  </Grid>
                  {contact.phone && (
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon color="action" />
                        <Typography variant="body1">{contact.phone}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {contact.linkedinUrl && (
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinkedInIcon color="action" />
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          LinkedIn Profile
                        </a>
                      </Box>
                    </Grid>
                  )}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Title
                    </Typography>
                    <Typography variant="body1">{contact.title || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1">{contact.department || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body1">{contact.client.name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography variant="body1">{contact.owner.name}</Typography>
                  </Grid>
                  {contact.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body1">{contact.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {contact.account && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Hierarchy
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Parent Account
                  </Typography>
                  <Typography variant="body1">
                    {contact.account.firstName} {contact.account.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {contact.account.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {contact.subContacts.length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sub-Contacts ({contact.subContacts.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    {contact.subContacts.map((subContact) => (
                      <ListItem key={subContact.id} divider>
                        <ListItemText
                          primary={`${subContact.firstName} ${subContact.lastName}`}
                          secondary={
                            <>
                              {subContact.email}
                              {subContact.title && ` | ${subContact.title}`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Related Opportunities ({contact.opportunities.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {contact.opportunities.length === 0 ? (
                  <Typography color="text.secondary">No opportunities</Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Stage</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="center">Probability</TableCell>
                          <TableCell>Expected Close</TableCell>
                          <TableCell>Owner</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contact.opportunities.map((opp) => (
                          <TableRow
                            key={opp.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/opportunities/${opp.id}`)}
                          >
                            <TableCell>{opp.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={opp.stage.replace('_', ' ')}
                                size="small"
                                color={getStageColor(opp.stage) as any}
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(opp.amount)}</TableCell>
                            <TableCell align="center">{opp.probability}%</TableCell>
                            <TableCell>{formatDate(opp.expectedCloseDate)}</TableCell>
                            <TableCell>{opp.owner.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tasks ({contact.tasks.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {contact.tasks.length === 0 ? (
                  <Typography color="text.secondary">No tasks</Typography>
                ) : (
                  <List>
                    {contact.tasks.map((task) => (
                      <ListItem key={task.id} divider>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <span>{task.subject}</span>
                              <Chip
                                label={task.status}
                                size="small"
                                color={getStatusColor(task.status) as any}
                              />
                              <Chip
                                label={task.priority}
                                size="small"
                                color={getPriorityColor(task.priority) as any}
                              />
                            </Box>
                          }
                          secondary={`Due: ${formatDate(task.dueDate)} | Assigned to: ${
                            task.assignee.name
                          }`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Events ({contact.events.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {contact.events.length === 0 ? (
                  <Typography color="text.secondary">No events</Typography>
                ) : (
                  <List>
                    {contact.events.map((event) => (
                      <ListItem key={event.id} divider>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <span>{event.subject}</span>
                              <Chip label={event.eventType} size="small" />
                            </Box>
                          }
                          secondary={`${formatDateTime(event.startTime)} - ${formatDateTime(
                            event.endTime
                          )} | Owner: ${event.owner.name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Notes Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <NotesSection
              contactId={id}
              currentUserId={contact?.owner.id}
            />
          </Grid>

          {/* Attachments Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <AttachmentsSection
              contactId={id}
              currentUserId={contact?.owner.id}
            />
          </Grid>

          {/* Activity Timeline */}
          <Grid size={{ xs: 12 }}>
            <ActivityTimeline contactId={id} />
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
