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
  Tooltip,
  Tab,
  Tabs,
  LinearProgress,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DashboardLayout from '@/components/DashboardLayout';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';

interface EmailSyncAccount {
  id: string;
  userId: string;
  provider: string;
  email: string;
  syncEnabled: boolean;
  syncDirection: string;
  syncFolders: string[];
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  createdAt: string;
}

interface CalendarSyncAccount {
  id: string;
  userId: string;
  provider: string;
  email: string;
  calendarName: string | null;
  syncEnabled: boolean;
  syncDirection: string;
  defaultReminder: number | null;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  createdAt: string;
}

export default function SyncSettingsPage() {
  const [emailAccounts, setEmailAccounts] = useState<EmailSyncAccount[]>([]);
  const [calendarAccounts, setCalendarAccounts] = useState<CalendarSyncAccount[]>([]);
  const [stats, setStats] = useState({
    totalEmailAccounts: 0,
    activeEmailSyncs: 0,
    totalCalendarAccounts: 0,
    activeCalendarSyncs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    provider: 'GMAIL',
    email: '',
    syncDirection: 'BOTH',
    syncFolders: ['INBOX', 'SENT'],
  });
  const [calendarFormData, setCalendarFormData] = useState({
    provider: 'GOOGLE',
    email: '',
    calendarName: 'Work Calendar',
    syncDirection: 'BOTH',
    defaultReminder: 15,
  });

  // Email detail dialog state
  const [selectedEmailAccount, setSelectedEmailAccount] = useState<EmailSyncAccount | null>(null);
  const [emailDetailOpen, setEmailDetailOpen] = useState(false);
  const [emailEditMode, setEmailEditMode] = useState(false);
  const [emailEditFormData, setEmailEditFormData] = useState({ syncEnabled: true, syncDirection: 'BOTH' });
  const [emailEditSaving, setEmailEditSaving] = useState(false);

  // Calendar detail dialog state
  const [selectedCalAccount, setSelectedCalAccount] = useState<CalendarSyncAccount | null>(null);
  const [calDetailOpen, setCalDetailOpen] = useState(false);
  const [calEditMode, setCalEditMode] = useState(false);
  const [calEditFormData, setCalEditFormData] = useState({ syncEnabled: true, syncDirection: 'BOTH' });
  const [calEditSaving, setCalEditSaving] = useState(false);

  const { confirm } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sync-settings');
      const data = await response.json();
      setEmailAccounts(data.emailAccounts || []);
      setCalendarAccounts(data.calendarAccounts || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching sync settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmailAccount = async () => {
    try {
      const response = await fetch('/api/sync-settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailFormData),
      });

      if (response.ok) {
        setEmailDialogOpen(false);
        fetchData();
        resetEmailForm();
      }
    } catch (error) {
      console.error('Error adding email account:', error);
    }
  };

  const handleAddCalendarAccount = async () => {
    try {
      const response = await fetch('/api/sync-settings/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarFormData),
      });

      if (response.ok) {
        setCalendarDialogOpen(false);
        fetchData();
        resetCalendarForm();
      }
    } catch (error) {
      console.error('Error adding calendar account:', error);
    }
  };

  const handleToggleEmailSync = async (accountId: string, syncEnabled: boolean) => {
    try {
      await fetch('/api/sync-settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, syncEnabled }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating email sync:', error);
    }
  };

  const handleToggleCalendarSync = async (accountId: string, syncEnabled: boolean) => {
    try {
      await fetch('/api/sync-settings/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, syncEnabled }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating calendar sync:', error);
    }
  };

  const handleDeleteEmailAccount = async (accountId: string) => {
    const confirmed = await confirm({
      title: 'Remove Email Account',
      message: 'Are you sure you want to remove this email account?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/sync-settings/email?id=${accountId}`, { method: 'DELETE' });
      showSuccess('Email account removed');
      setEmailDetailOpen(false);
      setSelectedEmailAccount(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting email account:', error);
      showError('Failed to delete email account');
    }
  };

  const handleDeleteCalendarAccount = async (accountId: string) => {
    const confirmed = await confirm({
      title: 'Remove Calendar Account',
      message: 'Are you sure you want to remove this calendar account?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/sync-settings/calendar?id=${accountId}`, { method: 'DELETE' });
      showSuccess('Calendar account removed');
      setCalDetailOpen(false);
      setSelectedCalAccount(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting calendar account:', error);
      showError('Failed to delete calendar account');
    }
  };

  // Email detail handlers
  const handleEmailRowClick = (account: EmailSyncAccount) => {
    setSelectedEmailAccount(account);
    setEmailEditMode(false);
    setEmailDetailOpen(true);
  };

  const handleStartEmailEdit = () => {
    if (!selectedEmailAccount) return;
    setEmailEditFormData({
      syncEnabled: selectedEmailAccount.syncEnabled,
      syncDirection: selectedEmailAccount.syncDirection,
    });
    setEmailEditMode(true);
  };

  const handleSaveEmailEdit = async () => {
    if (!selectedEmailAccount) return;
    setEmailEditSaving(true);
    try {
      await fetch('/api/sync-settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEmailAccount.id, ...emailEditFormData }),
      });
      showSuccess('Email account updated');
      setEmailEditMode(false);
      setEmailDetailOpen(false);
      fetchData();
    } catch (error) {
      showError('Failed to update email account');
    } finally {
      setEmailEditSaving(false);
    }
  };

  // Calendar detail handlers
  const handleCalRowClick = (account: CalendarSyncAccount) => {
    setSelectedCalAccount(account);
    setCalEditMode(false);
    setCalDetailOpen(true);
  };

  const handleStartCalEdit = () => {
    if (!selectedCalAccount) return;
    setCalEditFormData({
      syncEnabled: selectedCalAccount.syncEnabled,
      syncDirection: selectedCalAccount.syncDirection,
    });
    setCalEditMode(true);
  };

  const handleSaveCalEdit = async () => {
    if (!selectedCalAccount) return;
    setCalEditSaving(true);
    try {
      await fetch('/api/sync-settings/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCalAccount.id, ...calEditFormData }),
      });
      showSuccess('Calendar account updated');
      setCalEditMode(false);
      setCalDetailOpen(false);
      fetchData();
    } catch (error) {
      showError('Failed to update calendar account');
    } finally {
      setCalEditSaving(false);
    }
  };

  const handleSyncNow = async (type: 'email' | 'calendar', accountId: string) => {
    try {
      await fetch(`/api/sync-settings/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, action: 'sync_now' }),
      });
      fetchData();
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const resetEmailForm = () => {
    setEmailFormData({
      provider: 'GMAIL',
      email: '',
      syncDirection: 'BOTH',
      syncFolders: ['INBOX', 'SENT'],
    });
  };

  const resetCalendarForm = () => {
    setCalendarFormData({
      provider: 'GOOGLE',
      email: '',
      calendarName: 'Work Calendar',
      syncDirection: 'BOTH',
      defaultReminder: 15,
    });
  };

  const getProviderLogo = (provider: string) => {
    switch (provider) {
      case 'GMAIL':
      case 'GOOGLE':
        return '🔴';
      case 'OUTLOOK':
        return '🔵';
      case 'EXCHANGE':
        return '🟣';
      default:
        return '⚪';
    }
  };

  const getSyncStatusIcon = (status: string | null) => {
    switch (status) {
      case 'OK':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'ERROR':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'SYNCING':
        return <SyncIcon color="primary" fontSize="small" className="rotating" />;
      default:
        return <WarningIcon color="warning" fontSize="small" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SyncIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Email & Calendar Sync</Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Email Accounts</Typography>
                </Box>
                <Typography variant="h4">{stats.totalEmailAccounts}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.activeEmailSyncs} syncing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarMonthIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Calendar Accounts</Typography>
                </Box>
                <Typography variant="h4">{stats.totalCalendarAccounts}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.activeCalendarSyncs} syncing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Healthy</Typography>
                </Box>
                <Typography variant="h4">
                  {emailAccounts.filter(a => a.syncStatus === 'OK').length + calendarAccounts.filter(a => a.syncStatus === 'OK').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Errors</Typography>
                </Box>
                <Typography variant="h4">
                  {emailAccounts.filter(a => a.syncStatus === 'ERROR').length + calendarAccounts.filter(a => a.syncStatus === 'ERROR').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab
              icon={<EmailIcon />}
              label={`Email Sync (${stats.totalEmailAccounts})`}
              iconPosition="start"
            />
            <Tab
              icon={<CalendarMonthIcon />}
              label={`Calendar Sync (${stats.totalCalendarAccounts})`}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Email Sync Tab */}
        {tabValue === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEmailDialogOpen(true)}
              >
                Connect Email Account
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Sync Direction</TableCell>
                    <TableCell>Folders</TableCell>
                    <TableCell>Last Sync</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emailAccounts.map((account) => (
                    <TableRow key={account.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleEmailRowClick(account)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {account.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getProviderLogo(account.provider)}</span>
                          {account.provider}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={account.syncDirection} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {account.syncFolders.map((folder, i) => (
                            <Chip key={i} label={folder} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(account.lastSyncAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                          {getSyncStatusIcon(account.syncStatus)}
                          <Switch
                            size="small"
                            checked={account.syncEnabled}
                            onChange={(e) => handleToggleEmailSync(account.id, e.target.checked)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Sync Now">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleSyncNow('email', account.id); }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Account">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleDeleteEmailAccount(account.id); }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emailAccounts.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 4 }}>
                          <EmailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                          <Typography color="text.secondary">
                            No email accounts connected
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setEmailDialogOpen(true)}
                            sx={{ mt: 2 }}
                          >
                            Connect Email Account
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Calendar Sync Tab */}
        {tabValue === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCalendarDialogOpen(true)}
              >
                Connect Calendar Account
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Calendar</TableCell>
                    <TableCell>Sync Direction</TableCell>
                    <TableCell>Reminder</TableCell>
                    <TableCell>Last Sync</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calendarAccounts.map((account) => (
                    <TableRow key={account.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleCalRowClick(account)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {account.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getProviderLogo(account.provider)}</span>
                          {account.provider}
                        </Box>
                      </TableCell>
                      <TableCell>{account.calendarName || '-'}</TableCell>
                      <TableCell>
                        <Chip label={account.syncDirection} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {account.defaultReminder ? `${account.defaultReminder} min` : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(account.lastSyncAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                          {getSyncStatusIcon(account.syncStatus)}
                          <Switch
                            size="small"
                            checked={account.syncEnabled}
                            onChange={(e) => handleToggleCalendarSync(account.id, e.target.checked)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Sync Now">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleSyncNow('calendar', account.id); }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Account">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleDeleteCalendarAccount(account.id); }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {calendarAccounts.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box sx={{ py: 4 }}>
                          <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                          <Typography color="text.secondary">
                            No calendar accounts connected
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setCalendarDialogOpen(true)}
                            sx={{ mt: 2 }}
                          >
                            Connect Calendar Account
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      {/* Email Account Detail Dialog */}
      <Dialog open={emailDetailOpen} onClose={() => { setEmailDetailOpen(false); setEmailEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {emailEditMode ? 'Edit Email Account' : 'Email Account Details'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmailAccount && !emailEditMode && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography gutterBottom>{selectedEmailAccount.email}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
              <Typography gutterBottom>{selectedEmailAccount.provider}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Enabled</Typography>
              <Typography gutterBottom>{selectedEmailAccount.syncEnabled ? 'Yes' : 'No'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Direction</Typography>
              <Typography gutterBottom>{selectedEmailAccount.syncDirection}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Folders</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {selectedEmailAccount.syncFolders.map((folder, i) => (
                  <Chip key={i} label={folder} size="small" variant="outlined" />
                ))}
              </Box>
              <Typography variant="subtitle2" color="text.secondary">Last Sync</Typography>
              <Typography gutterBottom>{formatDate(selectedEmailAccount.lastSyncAt)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getSyncStatusIcon(selectedEmailAccount.syncStatus)}
                <Typography>{selectedEmailAccount.syncStatus || 'Unknown'}</Typography>
              </Box>
              {selectedEmailAccount.syncError && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Sync Error</Typography>
                  <Typography gutterBottom color="error">{selectedEmailAccount.syncError}</Typography>
                </>
              )}
              <Typography variant="subtitle2" color="text.secondary">Created</Typography>
              <Typography>{new Date(selectedEmailAccount.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
          {selectedEmailAccount && emailEditMode && (
            <Box>
              <TextField
                select
                label="Sync Enabled"
                value={emailEditFormData.syncEnabled ? 'Yes' : 'No'}
                onChange={(e) => setEmailEditFormData({ ...emailEditFormData, syncEnabled: e.target.value === 'Yes' })}
                fullWidth
                margin="normal"
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
              <TextField
                select
                label="Sync Direction"
                value={emailEditFormData.syncDirection}
                onChange={(e) => setEmailEditFormData({ ...emailEditFormData, syncDirection: e.target.value })}
                fullWidth
                margin="normal"
              >
                <MenuItem value="INBOUND">Inbound Only</MenuItem>
                <MenuItem value="OUTBOUND">Outbound Only</MenuItem>
                <MenuItem value="BOTH">Both Directions</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!emailEditMode ? (
            <>
              <Button onClick={() => { setEmailDetailOpen(false); setEmailEditMode(false); }}>Close</Button>
              <Button startIcon={<EditIcon />} onClick={handleStartEmailEdit}>Edit</Button>
              <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedEmailAccount && handleDeleteEmailAccount(selectedEmailAccount.id)}>Delete</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEmailEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveEmailEdit} disabled={emailEditSaving}>
                {emailEditSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Calendar Account Detail Dialog */}
      <Dialog open={calDetailOpen} onClose={() => { setCalDetailOpen(false); setCalEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {calEditMode ? 'Edit Calendar Account' : 'Calendar Account Details'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedCalAccount && !calEditMode && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography gutterBottom>{selectedCalAccount.email}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
              <Typography gutterBottom>{selectedCalAccount.provider}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Calendar Name</Typography>
              <Typography gutterBottom>{selectedCalAccount.calendarName || 'N/A'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Enabled</Typography>
              <Typography gutterBottom>{selectedCalAccount.syncEnabled ? 'Yes' : 'No'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Direction</Typography>
              <Typography gutterBottom>{selectedCalAccount.syncDirection}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Default Reminder</Typography>
              <Typography gutterBottom>{selectedCalAccount.defaultReminder ? `${selectedCalAccount.defaultReminder} min` : 'N/A'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Last Sync</Typography>
              <Typography gutterBottom>{formatDate(selectedCalAccount.lastSyncAt)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Sync Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getSyncStatusIcon(selectedCalAccount.syncStatus)}
                <Typography>{selectedCalAccount.syncStatus || 'Unknown'}</Typography>
              </Box>
              {selectedCalAccount.syncError && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Sync Error</Typography>
                  <Typography gutterBottom color="error">{selectedCalAccount.syncError}</Typography>
                </>
              )}
              <Typography variant="subtitle2" color="text.secondary">Created</Typography>
              <Typography>{new Date(selectedCalAccount.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
          {selectedCalAccount && calEditMode && (
            <Box>
              <TextField
                select
                label="Sync Enabled"
                value={calEditFormData.syncEnabled ? 'Yes' : 'No'}
                onChange={(e) => setCalEditFormData({ ...calEditFormData, syncEnabled: e.target.value === 'Yes' })}
                fullWidth
                margin="normal"
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
              <TextField
                select
                label="Sync Direction"
                value={calEditFormData.syncDirection}
                onChange={(e) => setCalEditFormData({ ...calEditFormData, syncDirection: e.target.value })}
                fullWidth
                margin="normal"
              >
                <MenuItem value="INBOUND">Inbound Only</MenuItem>
                <MenuItem value="OUTBOUND">Outbound Only</MenuItem>
                <MenuItem value="BOTH">Both Directions</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!calEditMode ? (
            <>
              <Button onClick={() => { setCalDetailOpen(false); setCalEditMode(false); }}>Close</Button>
              <Button startIcon={<EditIcon />} onClick={handleStartCalEdit}>Edit</Button>
              <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedCalAccount && handleDeleteCalendarAccount(selectedCalAccount.id)}>Delete</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setCalEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveCalEdit} disabled={calEditSaving}>
                {calEditSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Email Account Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Email Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            In production, this would initiate OAuth authentication with your email provider.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Email Provider *</InputLabel>
                <Select
                  value={emailFormData.provider}
                  onChange={(e) => setEmailFormData({ ...emailFormData, provider: e.target.value })}
                  label="Email Provider *"
                >
                  <MenuItem value="GMAIL">Gmail</MenuItem>
                  <MenuItem value="OUTLOOK">Outlook</MenuItem>
                  <MenuItem value="EXCHANGE">Exchange</MenuItem>
                  <MenuItem value="IMAP">IMAP/SMTP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email Address *"
                value={emailFormData.email}
                onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                type="email"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Sync Direction</InputLabel>
                <Select
                  value={emailFormData.syncDirection}
                  onChange={(e) => setEmailFormData({ ...emailFormData, syncDirection: e.target.value })}
                  label="Sync Direction"
                >
                  <MenuItem value="INBOUND">Inbound Only</MenuItem>
                  <MenuItem value="OUTBOUND">Outbound Only</MenuItem>
                  <MenuItem value="BOTH">Both Directions</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddEmailAccount}
            variant="contained"
            disabled={!emailFormData.email}
          >
            Connect Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Calendar Account Dialog */}
      <Dialog open={calendarDialogOpen} onClose={() => setCalendarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Calendar Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            In production, this would initiate OAuth authentication with your calendar provider.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Calendar Provider *</InputLabel>
                <Select
                  value={calendarFormData.provider}
                  onChange={(e) => setCalendarFormData({ ...calendarFormData, provider: e.target.value })}
                  label="Calendar Provider *"
                >
                  <MenuItem value="GOOGLE">Google Calendar</MenuItem>
                  <MenuItem value="OUTLOOK">Outlook Calendar</MenuItem>
                  <MenuItem value="EXCHANGE">Exchange</MenuItem>
                  <MenuItem value="CALDAV">CalDAV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email Address *"
                value={calendarFormData.email}
                onChange={(e) => setCalendarFormData({ ...calendarFormData, email: e.target.value })}
                type="email"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Calendar Name"
                value={calendarFormData.calendarName}
                onChange={(e) => setCalendarFormData({ ...calendarFormData, calendarName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Default Reminder (minutes)"
                type="number"
                value={calendarFormData.defaultReminder}
                onChange={(e) => setCalendarFormData({ ...calendarFormData, defaultReminder: parseInt(e.target.value) || 15 })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Sync Direction</InputLabel>
                <Select
                  value={calendarFormData.syncDirection}
                  onChange={(e) => setCalendarFormData({ ...calendarFormData, syncDirection: e.target.value })}
                  label="Sync Direction"
                >
                  <MenuItem value="INBOUND">Inbound Only</MenuItem>
                  <MenuItem value="OUTBOUND">Outbound Only</MenuItem>
                  <MenuItem value="BOTH">Both Directions</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddCalendarAccount}
            variant="contained"
            disabled={!calendarFormData.email}
          >
            Connect Account
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
