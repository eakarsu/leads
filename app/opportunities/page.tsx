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
  IconButton,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  client: {
    id: string;
    name: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    tasks: number;
    events: number;
  };
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    contactId: '',
    name: '',
    stage: 'PROSPECTING',
    amount: '',
    probability: '10',
    expectedCloseDate: '',
    ownerId: '',
    description: '',
    nextSteps: '',
  });

  useEffect(() => {
    fetchOpportunities();
    fetchClients();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [stageFilter, ownerFilter, clientFilter]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.append('stage', stageFilter);
      if (ownerFilter) params.append('ownerId', ownerFilter);
      if (clientFilter) params.append('clientId', clientFilter);

      const url = `/api/opportunities${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      const data = await response.json();
      setOpportunities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
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

  const fetchContactsByClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/contacts?clientId=${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleCreateOpportunity = async () => {
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
          probability: parseInt(formData.probability) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to create opportunity');

      setOpenDialog(false);
      setFormData({
        clientId: '',
        contactId: '',
        name: '',
        stage: 'PROSPECTING',
        amount: '',
        probability: '10',
        expectedCloseDate: '',
        ownerId: '',
        description: '',
        nextSteps: '',
      });
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete opportunity');
      fetchOpportunities();
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

  const calculateWeightedValue = (amount: number, probability: number) => {
    return (amount * probability) / 100;
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

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Opportunities</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Opportunity
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <TextField
                select
                label="Stage"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Stages</MenuItem>
                <MenuItem value="PROSPECTING">Prospecting</MenuItem>
                <MenuItem value="QUALIFICATION">Qualification</MenuItem>
                <MenuItem value="NEEDS_ANALYSIS">Needs Analysis</MenuItem>
                <MenuItem value="PROPOSAL">Proposal</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
                <MenuItem value="CLOSED_WON">Closed Won</MenuItem>
                <MenuItem value="CLOSED_LOST">Closed Lost</MenuItem>
              </TextField>
              <TextField
                select
                label="Owner"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Owners</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  setStageFilter('');
                  setOwnerFilter('');
                  setClientFilter('');
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
                    <TableCell>Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Probability</TableCell>
                    <TableCell align="right">Weighted Value</TableCell>
                    <TableCell>Expected Close</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opportunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography color="text.secondary">
                          No opportunities found. Create your first opportunity!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    opportunities.map((opp) => (
                      <TableRow
                        key={opp.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/opportunities/${opp.id}`)}
                      >
                        <TableCell>{opp.name}</TableCell>
                        <TableCell>{opp.client.name}</TableCell>
                        <TableCell>
                          {opp.contact
                            ? `${opp.contact.firstName} ${opp.contact.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={opp.stage.replace('_', ' ')}
                            size="small"
                            color={getStageColor(opp.stage) as any}
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(opp.amount)}</TableCell>
                        <TableCell align="center">{opp.probability}%</TableCell>
                        <TableCell align="right">
                          {formatCurrency(calculateWeightedValue(opp.amount, opp.probability))}
                        </TableCell>
                        <TableCell>{formatDate(opp.expectedCloseDate)}</TableCell>
                        <TableCell>{opp.owner.name}</TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/opportunities/${opp.id}`)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteOpportunity(opp.id)}
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Opportunity</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Client"
                value={formData.clientId}
                onChange={(e) => {
                  setFormData({ ...formData, clientId: e.target.value, contactId: '' });
                  fetchContactsByClient(e.target.value);
                }}
                fullWidth
                required
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Contact"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                fullWidth
                disabled={!formData.clientId}
                helperText="Optional - select a client first"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {contacts.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.email}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Opportunity Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                select
                label="Stage"
                value={formData.stage}
                onChange={(e) => {
                  const stage = e.target.value;
                  let probability = formData.probability;
                  if (stage === 'PROSPECTING') probability = '10';
                  if (stage === 'QUALIFICATION') probability = '25';
                  if (stage === 'NEEDS_ANALYSIS') probability = '50';
                  if (stage === 'PROPOSAL') probability = '75';
                  if (stage === 'NEGOTIATION') probability = '90';
                  if (stage === 'CLOSED_WON') probability = '100';
                  if (stage === 'CLOSED_LOST') probability = '0';
                  setFormData({ ...formData, stage, probability });
                }}
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

              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: '$',
                }}
              />

              <TextField
                label="Probability (%)"
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
              />

              <TextField
                label="Expected Close Date"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                select
                label="Owner"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
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
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Next Steps"
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateOpportunity}
              variant="contained"
              disabled={!formData.clientId || !formData.name || !formData.ownerId}
            >
              Create Opportunity
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
