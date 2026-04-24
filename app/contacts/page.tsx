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
import CancelIcon from '@mui/icons-material/Close';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  department: string | null;
  isPrimary: boolean;
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
  } | null;
  _count: {
    opportunities: number;
    tasks: number;
    events: number;
    subContacts: number;
  };
}

const columns: Column[] = [
  { id: 'lastName', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'title', label: 'Title' },
  { id: 'client', label: 'Company/Account', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
  { id: 'isPrimary', label: 'Primary' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function ContactsPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [clientFilter, setClientFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [isPrimaryFilter, setIsPrimaryFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Sort state
  const [sortBy, setSortByState] = useState('createdAt');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    clientId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    linkedinUrl: '',
    isPrimary: false,
    ownerId: '',
    notes: '',
  });

  // Build extra params from filters
  const extraParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (clientFilter) params.clientId = clientFilter;
    if (ownerFilter) params.ownerId = ownerFilter;
    if (isPrimaryFilter) params.isPrimary = isPrimaryFilter;
    return params;
  }, [clientFilter, ownerFilter, isPrimaryFilter]);

  const {
    data: contacts,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Contact>({
    url: '/api/contacts',
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

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortByState(col);
    setSortOrderState(newOrder);
    setSort(col, newOrder);
  };

  const handleCreateContact = async () => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create contact');

      setOpenDialog(false);
      setFormData({
        clientId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        department: '',
        linkedinUrl: '',
        isPrimary: false,
        ownerId: '',
        notes: '',
      });
      toast.showSuccess('Contact created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete contact');
      toast.showSuccess('Contact deleted successfully');
      setOpenDetailDialog(false);
      setSelectedContact(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedContact) return;
    setEditFormData({
      firstName: selectedContact.firstName,
      lastName: selectedContact.lastName,
      email: selectedContact.email,
      phone: selectedContact.phone || '',
      title: selectedContact.title || '',
      department: selectedContact.department || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContact) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update contact');
      toast.showSuccess('Contact updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      setSelectedContact(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const exportData = useMemo(() => {
    return contacts.map((c) => ({
      'First Name': c.firstName,
      'Last Name': c.lastName,
      Email: c.email,
      Phone: c.phone || '',
      Title: c.title || '',
      Department: c.department || '',
      Company: c.client.name,
      Owner: c.owner.name,
      Primary: c.isPrimary ? 'Yes' : 'No',
    }));
  }, [contacts]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Contacts</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="contacts" title="Contacts" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Contact
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
                label="Primary Contact"
                value={isPrimaryFilter}
                onChange={(e) => setIsPrimaryFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Primary Only</MenuItem>
                <MenuItem value="false">Non-Primary Only</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  setClientFilter('');
                  setOwnerFilter('');
                  setIsPrimaryFilter('');
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
              <TableSkeleton rows={5} columns={8} />
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
                    {contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary">
                            No contacts found. Create your first contact!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contacts.map((contact) => (
                        <TableRow
                          key={contact.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' },
                          }}
                          onClick={() => handleRowClick(contact)}
                        >
                          <TableCell>
                            {contact.firstName} {contact.lastName}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.phone || '-'}</TableCell>
                          <TableCell>{contact.title || '-'}</TableCell>
                          <TableCell>
                            {contact.account
                              ? `${contact.account.firstName} ${contact.account.lastName}`
                              : contact.client.name}
                          </TableCell>
                          <TableCell>{contact.owner.name}</TableCell>
                          <TableCell>
                            {contact.isPrimary && (
                              <Chip label="Primary" size="small" color="primary" />
                            )}
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedContact(contact);
                                setEditFormData({
                                  firstName: contact.firstName,
                                  lastName: contact.lastName,
                                  email: contact.email,
                                  phone: contact.phone || '',
                                  title: contact.title || '',
                                  department: contact.department || '',
                                });
                                setEditMode(true);
                                setOpenDetailDialog(true);
                              }}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteContact(contact.id)}
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
          <DialogTitle>{editMode ? 'Edit Contact' : 'Contact Details'}</DialogTitle>
          <DialogContent>
            {selectedContact && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedContact.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedContact.phone || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                  <Typography variant="body1">{selectedContact.title || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedContact.department || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Company/Account</Typography>
                  <Typography variant="body1">
                    {selectedContact.account
                      ? `${selectedContact.account.firstName} ${selectedContact.account.lastName}`
                      : selectedContact.client.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                  <Typography variant="body1">{selectedContact.owner.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Primary</Typography>
                  {selectedContact.isPrimary ? (
                    <Chip label="Primary" size="small" color="primary" />
                  ) : (
                    <Typography variant="body1">No</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Related Counts</Typography>
                  <Typography variant="body2">
                    Opportunities: {selectedContact._count.opportunities} | Tasks: {selectedContact._count.tasks} | Events: {selectedContact._count.events}
                  </Typography>
                </Box>
              </Box>
            )}
            {selectedContact && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="First Name"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Department"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                  disabled={editSaving || !editFormData.firstName || !editFormData.lastName || !editFormData.email}
                >
                  {editSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => { setOpenDetailDialog(false); setEditMode(false); }}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleStartEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if (selectedContact) handleDeleteContact(selectedContact.id);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Create Contact Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
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
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />

              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
              />

              <TextField
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                fullWidth
              />

              <TextField
                label="LinkedIn URL"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                fullWidth
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
                select
                label="Primary Contact"
                value={formData.isPrimary ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.value === 'true' })}
                fullWidth
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateContact}
              variant="contained"
              disabled={!formData.clientId || !formData.firstName || !formData.lastName || !formData.email || !formData.ownerId}
            >
              Create Contact
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
