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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import NotesSection from '@/components/NotesSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import ActivityTimeline from '@/components/ActivityTimeline';
import EmailSection from '@/components/EmailSection';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  closedDate: string | null;
  description: string | null;
  nextSteps: string | null;
  client: {
    id: string;
    name: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  lineItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
    product: {
      name: string;
    } | null;
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

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editStage, setEditStage] = useState('');

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/opportunities/${id}`);
      if (!response.ok) throw new Error('Failed to fetch opportunity');
      const data = await response.json();
      setOpportunity(data);
      setEditStage(data.stage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async () => {
    try {
      let probability = opportunity?.probability || 0;
      if (editStage === 'PROSPECTING') probability = 10;
      if (editStage === 'QUALIFICATION') probability = 25;
      if (editStage === 'NEEDS_ANALYSIS') probability = 50;
      if (editStage === 'PROPOSAL') probability = 75;
      if (editStage === 'NEGOTIATION') probability = 90;
      if (editStage === 'CLOSED_WON') probability = 100;
      if (editStage === 'CLOSED_LOST') probability = 0;

      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: editStage,
          probability,
          ...(editStage === 'CLOSED_WON' || editStage === 'CLOSED_LOST'
            ? { closedDate: new Date().toISOString() }
            : {}),
        }),
      });

      if (!response.ok) throw new Error('Failed to update opportunity');
      setOpenEditDialog(false);
      fetchOpportunity();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOpportunity = async () => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete opportunity');
      router.push('/opportunities');
    } catch (err: any) {
      setError(err.message);
    }
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

  const stages = [
    'PROSPECTING',
    'QUALIFICATION',
    'NEEDS_ANALYSIS',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
  ];

  const getActiveStep = (stage: string) => {
    if (stage === 'CLOSED_LOST') return -1;
    return stages.indexOf(stage);
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

  if (!opportunity) {
    return (
      <DashboardLayout>
        <Alert severity="error">Opportunity not found</Alert>
      </DashboardLayout>
    );
  }

  const calculateWeightedValue = (amount: number, probability: number) => {
    return (amount * probability) / 100;
  };

  const lineItemsTotal = (opportunity.lineItems || []).reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/opportunities')}
            >
              Back
            </Button>
            <Typography variant="h4">{opportunity.name}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setOpenEditDialog(true)}
            >
              Change Stage
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteOpportunity}
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
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stage Progress
                </Typography>
                <Stepper activeStep={getActiveStep(opportunity.stage)} alternativeLabel>
                  {stages.map((stage) => (
                    <Step key={stage}>
                      <StepLabel>{stage.replace('_', ' ')}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                {opportunity.stage === 'CLOSED_LOST' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    This opportunity was closed as lost
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Opportunity Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="body1">{opportunity.client?.name || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Contact
                    </Typography>
                    <Typography variant="body1">
                      {opportunity.contact
                        ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Stage
                    </Typography>
                    <Chip
                      label={opportunity.stage.replace('_', ' ')}
                      size="small"
                      color={getStageColor(opportunity.stage) as any}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography variant="body1">{opportunity.owner?.name || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(opportunity.amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Probability
                    </Typography>
                    <Typography variant="h6">{opportunity.probability}%</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Weighted Value
                    </Typography>
                    <Typography variant="h6" color="secondary">
                      {formatCurrency(
                        calculateWeightedValue(opportunity.amount, opportunity.probability)
                      )}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Expected Close Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(opportunity.expectedCloseDate)}
                    </Typography>
                  </Grid>
                  {opportunity.closedDate && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Closed Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(opportunity.closedDate)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  {opportunity.description || 'No description provided'}
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Next Steps
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {opportunity.nextSteps || 'No next steps defined'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Line Items
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {(opportunity.lineItems || []).length === 0 ? (
                  <Typography color="text.secondary">No line items added yet</Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Discount</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(opportunity.lineItems || []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell align="right">{item.discount}%</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right">
                            <strong>Total:</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(lineItemsTotal)}</strong>
                          </TableCell>
                        </TableRow>
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
                  Tasks ({(opportunity.tasks || []).length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {(opportunity.tasks || []).length === 0 ? (
                  <Typography color="text.secondary">No tasks</Typography>
                ) : (
                  <List>
                    {(opportunity.tasks || []).map((task) => (
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
                            task.assignee?.name || 'Unassigned'
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
                  Events ({(opportunity.events || []).length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {(opportunity.events || []).length === 0 ? (
                  <Typography color="text.secondary">No events</Typography>
                ) : (
                  <List>
                    {(opportunity.events || []).map((event) => (
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
                          )} | Owner: ${event.owner?.name || 'Unknown'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Email Section */}
          <Grid size={{ xs: 12 }}>
            <EmailSection
              opportunityId={id}
              contactId={opportunity?.contact?.id}
              defaultToAddress={opportunity?.contact?.email || ''}
            />
          </Grid>

          {/* Notes Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <NotesSection
              opportunityId={id}
              currentUserId={opportunity?.owner?.id}
            />
          </Grid>

          {/* Attachments Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <AttachmentsSection
              opportunityId={id}
              currentUserId={opportunity?.owner?.id}
            />
          </Grid>

          {/* Activity Timeline */}
          <Grid size={{ xs: 12 }}>
            <ActivityTimeline opportunityId={id} />
          </Grid>
        </Grid>

        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Change Opportunity Stage</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                select
                label="Stage"
                value={editStage}
                onChange={(e) => setEditStage(e.target.value)}
                fullWidth
              >
                <MenuItem value="PROSPECTING">Prospecting</MenuItem>
                <MenuItem value="QUALIFICATION">Qualification</MenuItem>
                <MenuItem value="NEEDS_ANALYSIS">Needs Analysis</MenuItem>
                <MenuItem value="PROPOSAL">Proposal</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
                <MenuItem value="CLOSED_WON">Closed Won</MenuItem>
                <MenuItem value="CLOSED_LOST">Closed Lost</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStage} variant="contained">
              Update Stage
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
