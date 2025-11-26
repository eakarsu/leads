'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
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
  Tab,
  Tabs,
  Alert,
  Tooltip,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HandshakeIcon from '@mui/icons-material/Handshake';
import DashboardLayout from '@/components/DashboardLayout';

interface PartnerAccount {
  id: string;
  name: string;
  isPartner: boolean;
  partnerLevel: string | null;
  _count: {
    leads: number;
    opportunities: number;
  };
}

interface PartnerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isPartnerUser: boolean;
  portalStatus: string | null;
  account: {
    id: string;
    name: string;
    isPartner: boolean;
    partnerLevel: string | null;
  } | null;
}

export default function PartnerPortalPage() {
  const [partnerUsers, setPartnerUsers] = useState<PartnerUser[]>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<PartnerAccount[]>([]);
  const [stats, setStats] = useState({
    totalPartners: 0,
    activeUsers: 0,
    totalLeads: 0,
    totalOpportunities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PartnerUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PartnerAccount | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contactId: '',
    accountId: '',
    partnerLevel: 'SILVER',
  });

  useEffect(() => {
    fetchData();
    fetchContacts();
    fetchAccounts();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/partner-portal');
      const data = await response.json();
      setPartnerUsers(data.partnerUsers || []);
      setPartnerAccounts(data.partnerAccounts || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data.contacts || data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setAccounts(data.clients || data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleEnablePartner = async () => {
    try {
      const response = await fetch('/api/partner-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: formData.contactId,
          accountId: formData.accountId,
          enablePortalAccess: true,
          partnerLevel: formData.partnerLevel,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchData();
        setFormData({ contactId: '', accountId: '', partnerLevel: 'SILVER' });
      }
    } catch (error) {
      console.error('Error enabling partner:', error);
    }
  };

  const handleUpdateStatus = async (contactId: string, status: string) => {
    try {
      await fetch('/api/partner-portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, portalStatus: status }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
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

  const getPartnerLevelColor = (level: string | null) => {
    switch (level) {
      case 'PLATINUM':
        return '#E5E4E2';
      case 'GOLD':
        return '#FFD700';
      case 'SILVER':
        return '#C0C0C0';
      case 'BRONZE':
        return '#CD7F32';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Partner Portal</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Partner
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HandshakeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Partners</Typography>
                </Box>
                <Typography variant="h4">{stats.totalPartners}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="success" sx={{ mr: 1 }} />
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
                  <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Partner Leads</Typography>
                </Box>
                <Typography variant="h4">{stats.totalLeads}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Opportunities</Typography>
                </Box>
                <Typography variant="h4">{stats.totalOpportunities}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder={tabValue === 0 ? "Search users..." : "Search accounts..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Partner Users" />
            <Tab label="Partner Accounts" />
          </Tabs>
        </Paper>

        {/* Partner Users Tab */}
        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Partner Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partnerUsers.filter((user) => {
                  const searchLower = search.toLowerCase();
                  return !search ||
                    user.firstName?.toLowerCase().includes(searchLower) ||
                    user.lastName?.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    user.account?.name.toLowerCase().includes(searchLower);
                }).map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedAccount(null);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        {user.firstName} {user.lastName}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.account?.name || '-'}</TableCell>
                    <TableCell>
                      {user.account?.partnerLevel && (
                        <Chip
                          label={user.account.partnerLevel}
                          size="small"
                          sx={{
                            bgcolor: getPartnerLevelColor(user.account.partnerLevel),
                            color: user.account.partnerLevel === 'GOLD' ? 'black' : 'white',
                          }}
                        />
                      )}
                    </TableCell>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(user.id, 'ACTIVE');
                            }}
                          >
                            <CheckCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {partnerUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No partner users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Partner Accounts Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Partner Level</TableCell>
                  <TableCell>Leads Generated</TableCell>
                  <TableCell>Opportunities</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partnerAccounts.filter((account) => {
                  const searchLower = search.toLowerCase();
                  return !search || account.name.toLowerCase().includes(searchLower);
                }).map((account) => (
                  <TableRow
                    key={account.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAccount(account);
                      setSelectedUser(null);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {account.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {account.partnerLevel && (
                        <Chip
                          label={account.partnerLevel}
                          size="small"
                          sx={{
                            bgcolor: getPartnerLevelColor(account.partnerLevel),
                            color: account.partnerLevel === 'GOLD' ? 'black' : 'white',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{account._count.leads}</TableCell>
                    <TableCell>{account._count.opportunities}</TableCell>
                  </TableRow>
                ))}
                {partnerAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No partner accounts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add Partner Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Partner Access</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Account</InputLabel>
            <Select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              label="Account"
            >
              {accounts.map((account: any) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Contact</InputLabel>
            <Select
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              label="Contact"
            >
              {contacts
                .filter((c: any) => !formData.accountId || c.accountId === formData.accountId)
                .map((contact: any) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.email}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Partner Level</InputLabel>
            <Select
              value={formData.partnerLevel}
              onChange={(e) => setFormData({ ...formData, partnerLevel: e.target.value })}
              label="Partner Level"
            >
              <MenuItem value="BRONZE">Bronze</MenuItem>
              <MenuItem value="SILVER">Silver</MenuItem>
              <MenuItem value="GOLD">Gold</MenuItem>
              <MenuItem value="PLATINUM">Platinum</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEnablePartner}
            variant="contained"
            disabled={!formData.contactId || !formData.accountId}
          >
            Enable Partner Access
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {selectedUser && (
                <>
                  <Typography variant="h6">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Partner User
                  </Typography>
                </>
              )}
              {selectedAccount && (
                <>
                  <Typography variant="h6">{selectedAccount.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Partner Account
                  </Typography>
                </>
              )}
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{selectedUser.phone || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedUser.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Portal Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedUser.portalStatus || 'PENDING'}
                    color={getStatusColor(selectedUser.portalStatus) as any}
                  />
                </Box>
              </Grid>
              {selectedUser.account?.partnerLevel && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Partner Level</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedUser.account.partnerLevel}
                      sx={{
                        bgcolor: getPartnerLevelColor(selectedUser.account.partnerLevel),
                        color: selectedUser.account.partnerLevel === 'GOLD' ? 'black' : 'white',
                      }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
          {selectedAccount && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Partner Level</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {selectedAccount.partnerLevel ? (
                    <Chip
                      label={selectedAccount.partnerLevel}
                      sx={{
                        bgcolor: getPartnerLevelColor(selectedAccount.partnerLevel),
                        color: selectedAccount.partnerLevel === 'GOLD' ? 'black' : 'white',
                      }}
                    />
                  ) : (
                    <Typography variant="body1">-</Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Is Partner</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedAccount.isPartner ? 'Yes' : 'No'}
                    color={selectedAccount.isPartner ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Leads Generated</Typography>
                <Typography variant="h6">{selectedAccount._count.leads}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Opportunities</Typography>
                <Typography variant="h6">{selectedAccount._count.opportunities}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedUser && selectedUser.portalStatus !== 'ACTIVE' && (
            <Button
              color="success"
              variant="contained"
              onClick={() => {
                handleUpdateStatus(selectedUser.id, 'ACTIVE');
                setDetailOpen(false);
              }}
            >
              Activate User
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
