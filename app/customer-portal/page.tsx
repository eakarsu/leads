'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Avatar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardLayout from '@/components/DashboardLayout';

interface PortalUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isPortalUser: boolean;
  portalStatus: string | null;
  account: {
    id: string;
    name: string;
    type: string | null;
  } | null;
}

export default function CustomerPortalPage() {
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCases: 0,
    openCases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contactId: '',
    sendWelcomeEmail: true,
  });

  useEffect(() => {
    fetchData();
    fetchContacts();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/customer-portal');
      const data = await response.json();
      setPortalUsers(data.portalUsers || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      // Filter out contacts that already have portal access
      const availableContacts = (data.contacts || data || []).filter(
        (c: any) => !c.isPortalUser
      );
      setContacts(availableContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleEnablePortal = async () => {
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchData();
        fetchContacts();
        setFormData({ contactId: '', sendWelcomeEmail: true });
      }
    } catch (error) {
      console.error('Error enabling portal:', error);
    }
  };

  const handleUpdateStatus = async (contactId: string, status: string) => {
    try {
      await fetch('/api/customer-portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, portalStatus: status }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDisablePortal = async (contactId: string) => {
    try {
      await fetch(`/api/customer-portal?contactId=${contactId}`, {
        method: 'DELETE',
      });
      fetchData();
      fetchContacts();
    } catch (error) {
      console.error('Error disabling portal:', error);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'DISABLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Customer Portal</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Enable Portal Access
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          The Customer Portal allows your customers to submit and track support cases, view knowledge articles, and manage their account information.
        </Alert>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Users</Typography>
                </Box>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active Users</Typography>
                </Box>
                <Typography variant="h4">{stats.activeUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ConfirmationNumberIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Cases</Typography>
                </Box>
                <Typography variant="h4">{stats.totalCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SupportAgentIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Open Cases</Typography>
                </Box>
                <Typography variant="h4">{stats.openCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Portal Users Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portalUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      {user.firstName} {user.lastName}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.account?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.portalStatus || 'PENDING'}
                      color={getStatusColor(user.portalStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.portalStatus !== 'ACTIVE' && (
                      <Tooltip title="Activate">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Disable Access">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDisablePortal(user.id)}
                      >
                        <PersonOffIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {portalUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No portal users found. Click "Enable Portal Access" to add users.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Enable Portal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Customer Portal Access</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Contact</InputLabel>
            <Select
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              label="Contact"
            >
              {contacts.map((contact: any) => (
                <MenuItem key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName} - {contact.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
              />
            }
            label="Send welcome email with login instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEnablePortal}
            variant="contained"
            disabled={!formData.contactId}
          >
            Enable Access
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
