'use client';

import { useEffect, useState, useMemo } from 'react';
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
  TableRow,
  Chip,
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
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  description: string | null;
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

interface EditFormData {
  name: string;
  amount: string;
  stage: string;
  probability: string;
  description: string;
  expectedCloseDate: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'client', label: 'Client', sortable: false },
  { id: 'contact', label: 'Contact', sortable: false },
  { id: 'stage', label: 'Stage' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'probability', label: 'Probability', align: 'center' },
  { id: 'weightedValue', label: 'Weighted Value', align: 'right', sortable: false },
  { id: 'expectedCloseDate', label: 'Expected Close' },
  { id: 'owner', label: 'Owner', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [clients, setClients] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    amount: '',
    stage: '',
    probability: '',
    description: '',
    expectedCloseDate: '',
  });

  // Sort state
  const [sortBy, setSortByState] = useState('createdAt');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');

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

  // Build extra params from filters
  const extraParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (stageFilter) params.stage = stageFilter;
    if (ownerFilter) params.ownerId = ownerFilter;
    if (clientFilter) params.clientId = clientFilter;
    return params;
  }, [stageFilter, ownerFilter, clientFilter]);

  const {
    data: opportunities,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Opportunity>({
    url: '/api/opportunities',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
    extraParams,
  });

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(Array.isArray(data) ? data : data.data || []);
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
      setContacts(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortByState(col);
    setSortOrderState(newOrder);
    setSort(col, newOrder);
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
      toast.showSuccess('Opportunity created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Opportunity',
      message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete opportunity');
      toast.showSuccess('Opportunity deleted successfully');
      setOpenDetailDialog(false);
      setSelectedOpportunity(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleStartEdit = (opp: Opportunity) => {
    setEditFormData({
      name: opp.name,
      amount: String(opp.amount),
      stage: opp.stage,
      probability: String(opp.probability),
      description: opp.description || '',
      expectedCloseDate: opp.expectedCloseDate
        ? new Date(opp.expectedCloseDate).toISOString().split('T')[0]
        : '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOpportunity) return;
    try {
      const response = await fetch(`/api/opportunities/${selectedOpportunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          amount: parseFloat(editFormData.amount) || 0,
          stage: editFormData.stage,
          probability: parseInt(editFormData.probability) || 0,
          description: editFormData.description,
          expectedCloseDate: editFormData.expectedCloseDate
            ? new Date(editFormData.expectedCloseDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update opportunity');

      toast.showSuccess('Opportunity updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      setSelectedOpportunity(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
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

  const handleRowClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const exportData = useMemo(() => {
    return opportunities.map((opp) => ({
      Name: opp.name,
      Client: opp.client.name,
      Contact: opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : '',
      Stage: opp.stage.replace('_', ' '),
      Amount: opp.amount,
      'Probability (%)': opp.probability,
      'Weighted Value': calculateWeightedValue(opp.amount, opp.probability),
      'Expected Close': opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : '',
      Owner: opp.owner.name,
    }));
  }, [opportunities]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Opportunities</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="opportunities" title="Opportunities" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Opportunity
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
            {loading ? (
              <TableSkeleton rows={5} columns={10} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead
                    columns={columns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
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
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' },
                          }}
                          onClick={() => handleRowClick(opp)}
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
            )}
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>

        {/* Detail / Quick-Action Dialog */}
        <Dialog
          open={openDetailDialog}
          onClose={() => { setOpenDetailDialog(false); setEditMode(false); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editMode ? 'Edit Opportunity' : 'Opportunity Details'}</DialogTitle>
          <DialogContent>
            {selectedOpportunity && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedOpportunity.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                  <Typography variant="body1">{selectedOpportunity.client.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                  <Typography variant="body1">
                    {selectedOpportunity.contact
                      ? `${selectedOpportunity.contact.firstName} ${selectedOpportunity.contact.lastName}`
                      : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Stage</Typography>
                  <Chip
                    label={selectedOpportunity.stage.replace('_', ' ')}
                    size="small"
                    color={getStageColor(selectedOpportunity.stage) as any}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1">{formatCurrency(selectedOpportunity.amount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Probability</Typography>
                  <Typography variant="body1">{selectedOpportunity.probability}%</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Weighted Value</Typography>
                  <Typography variant="body1">
                    {formatCurrency(calculateWeightedValue(selectedOpportunity.amount, selectedOpportunity.probability))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Expected Close</Typography>
                  <Typography variant="body1">{formatDate(selectedOpportunity.expectedCloseDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedOpportunity.description || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                  <Typography variant="body1">{selectedOpportunity.owner.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Related Counts</Typography>
                  <Typography variant="body2">
                    Tasks: {selectedOpportunity._count.tasks} | Events: {selectedOpportunity._count.events}
                  </Typography>
                </Box>
              </Box>
            )}
            {selectedOpportunity && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Amount"
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
                <TextField
                  select
                  label="Stage"
                  value={editFormData.stage}
                  onChange={(e) => {
                    const stage = e.target.value;
                    let probability = editFormData.probability;
                    if (stage === 'PROSPECTING') probability = '10';
                    if (stage === 'QUALIFICATION') probability = '25';
                    if (stage === 'NEEDS_ANALYSIS') probability = '50';
                    if (stage === 'PROPOSAL') probability = '75';
                    if (stage === 'NEGOTIATION') probability = '90';
                    if (stage === 'CLOSED_WON') probability = '100';
                    if (stage === 'CLOSED_LOST') probability = '0';
                    setEditFormData({ ...editFormData, stage, probability });
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
                  label="Probability (%)"
                  type="number"
                  value={editFormData.probability}
                  onChange={(e) => setEditFormData({ ...editFormData, probability: e.target.value })}
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
                <TextField
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  label="Expected Close Date"
                  type="date"
                  value={editFormData.expectedCloseDate}
                  onChange={(e) => setEditFormData({ ...editFormData, expectedCloseDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!editMode ? (
              <>
                <Button onClick={() => { setOpenDetailDialog(false); setEditMode(false); }}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    if (selectedOpportunity) handleStartEdit(selectedOpportunity);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if (selectedOpportunity) handleDeleteOpportunity(selectedOpportunity.id);
                  }}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                  disabled={!editFormData.name}
                >
                  Save
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Create Opportunity Dialog */}
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
