'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DraftsIcon from '@mui/icons-material/Drafts';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const notificationTypes = [
  'SYSTEM',
  'LEAD_ASSIGNED',
  'TASK_ASSIGNED',
  'OPPORTUNITY_WON',
  'OPPORTUNITY_LOST',
  'EMAIL_RECEIVED',
  'MENTION',
  'COMMENT',
  'WORKFLOW_TRIGGERED',
];

const typeLabels: Record<string, string> = {
  SYSTEM: 'System',
  LEAD_ASSIGNED: 'Lead Assigned',
  TASK_ASSIGNED: 'Task Assigned',
  OPPORTUNITY_WON: 'Opportunity Won',
  OPPORTUNITY_LOST: 'Opportunity Lost',
  EMAIL_RECEIVED: 'Email Received',
  MENTION: 'Mention',
  COMMENT: 'Comment',
  WORKFLOW_TRIGGERED: 'Workflow Triggered',
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected notification error';
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [tab, setTab] = useState('all');
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [compose, setCompose] = useState({
    type: 'SYSTEM',
    title: '',
    message: '',
    link: '',
  });

  const query = useMemo(() => {
    const params = new URLSearchParams({ pageSize: '50' });
    if (tab === 'unread') params.set('read', 'false');
    if (tab === 'read') params.set('read', 'true');
    if (type !== 'ALL') params.set('type', type);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [tab, type, search]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(`/api/notifications?${query}`),
        fetch('/api/notifications/unread-count'),
      ]);
      const notificationsPayload = await notificationsResponse.json() as { error?: string; data?: NotificationRecord[] } | NotificationRecord[];
      const countPayload = await countResponse.json() as { error?: string; count?: number };

      if (!notificationsResponse.ok) {
        const errorPayload = Array.isArray(notificationsPayload) ? undefined : notificationsPayload.error;
        throw new Error(errorPayload || 'Failed to load notifications');
      }
      if (!countResponse.ok) {
        throw new Error(countPayload.error || 'Failed to load unread count');
      }

      setItems(Array.isArray(notificationsPayload) ? notificationsPayload : notificationsPayload.data || []);
      setUnreadCount(countPayload.count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const createNotification = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...compose,
          link: compose.link.trim() || null,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create notification');
      setCompose({ type: 'SYSTEM', title: '', message: '', link: '' });
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateReadState = async (item: NotificationRecord, isRead: boolean) => {
    setError('');
    try {
      const response = await fetch(`/api/notifications/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update notification');
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteNotification = async (item: NotificationRecord) => {
    setError('');
    try {
      const response = await fetch(`/api/notifications/${item.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete notification');
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const markAllRead = async () => {
    setError('');
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to mark notifications read');
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Notification Center</Typography>
            <Typography color="text.secondary">
              Review CRM alerts, workflow events, mentions, assignments, and follow-up actions.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${unreadCount} unread`} color={unreadCount > 0 ? 'error' : 'default'} />
            <Button variant="outlined" startIcon={<MarkEmailReadIcon />} onClick={markAllRead} disabled={unreadCount === 0}>
              Mark All Read
            </Button>
            <Tooltip title="Refresh notifications">
              <IconButton onClick={loadNotifications}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
            gap: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Create Notification</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a CRM alert for the current user to test workflow and Agentforce-style prompts.
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    label="Type"
                    value={compose.type}
                    onChange={(event) => setCompose((prev) => ({ ...prev, type: event.target.value }))}
                  >
                    {notificationTypes.map((item) => (
                      <MenuItem key={item} value={item}>{typeLabels[item]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Title"
                  size="small"
                  value={compose.title}
                  onChange={(event) => setCompose((prev) => ({ ...prev, title: event.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Message"
                  minRows={4}
                  multiline
                  value={compose.message}
                  onChange={(event) => setCompose((prev) => ({ ...prev, message: event.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Action Link"
                  size="small"
                  placeholder="/leads"
                  value={compose.link}
                  onChange={(event) => setCompose((prev) => ({ ...prev, link: event.target.value }))}
                  fullWidth
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={createNotification}
                  disabled={saving || !compose.title.trim() || !compose.message.trim()}
                >
                  Create Alert
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                  <Tab value="all" label="All" />
                  <Tab value="unread" label="Unread" />
                  <Tab value="read" label="Read" />
                </Tabs>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl size="small" sx={{ minWidth: 190 }}>
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
                      <MenuItem value="ALL">All Types</MenuItem>
                      {notificationTypes.map((item) => (
                        <MenuItem key={item} value={item}>{typeLabels[item]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Search"
                    size="small"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />

              {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : items.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6">No notifications found</Typography>
                  <Typography color="text.secondary">Adjust the filters or create a test alert.</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Notification</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(item)}>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.isRead ? 'Read' : 'Unread'}
                            color={item.isRead ? 'default' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={item.isRead ? 500 : 800}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                        </TableCell>
                        <TableCell>{typeLabels[item.type] || item.type}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                        <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                          <Tooltip title={item.isRead ? 'Mark unread' : 'Mark read'}>
                            <IconButton onClick={() => updateReadState(item, !item.isRead)}>
                              {item.isRead ? <DraftsIcon /> : <MarkEmailReadIcon />}
                            </IconButton>
                          </Tooltip>
                          {item.link && (
                            <Tooltip title="Open linked record">
                              <IconButton href={item.link}>
                                <OpenInNewIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete notification">
                            <IconButton color="error" onClick={() => deleteNotification(item)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Notification Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
