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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SendIcon from '@mui/icons-material/Send';
import CircleIcon from '@mui/icons-material/Circle';
import DashboardLayout from '@/components/DashboardLayout';

interface LiveChat {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: string;
  createdAt: string;
  endedAt: string | null;
  rating: number | null;
  contact: { id: string; firstName: string; lastName: string; email: string } | null;
  agent: { id: string; name: string; email: string } | null;
  queue: { id: string; name: string } | null;
  case: { id: string; caseNumber: string; subject: string } | null;
  messages: any[];
  _count: { messages: number };
}

interface RoutingQueue {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  routingType: string;
  isActive: boolean;
  _count: { chats: number };
}

interface AgentPresence {
  userId: string;
  status: string;
  capacity: number;
  channels: string[];
  lastActivity: string;
  user: { id: string; name: string; email: string };
  activeChats: number;
}

export default function LiveChatPage() {
  const [chats, setChats] = useState<LiveChat[]>([]);
  const [queues, setQueues] = useState<RoutingQueue[]>([]);
  const [presence, setPresence] = useState<AgentPresence[]>([]);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    waitingChats: 0,
    avgWaitTime: 0,
    avgDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [queueFormData, setQueueFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    routingType: 'ROUND_ROBIN',
    maxCapacity: 5,
  });
  const [myStatus, setMyStatus] = useState('OFFLINE');

  useEffect(() => {
    fetchChats();
    fetchQueues();
    fetchPresence();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/live-chat');
      const data = await response.json();
      setChats(data.chats || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/live-chat?type=queues');
      const data = await response.json();
      setQueues(data.queues || []);
    } catch (error) {
      console.error('Error fetching queues:', error);
    }
  };

  const fetchPresence = async () => {
    try {
      const response = await fetch('/api/live-chat?type=presence');
      const data = await response.json();
      setPresence(data.presence || []);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  };

  const handleCreateQueue = async () => {
    try {
      const response = await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'queue',
          ...queueFormData,
        }),
      });

      if (response.ok) {
        setQueueDialogOpen(false);
        fetchQueues();
        setQueueFormData({
          name: '',
          description: '',
          priority: 1,
          routingType: 'ROUND_ROBIN',
          maxCapacity: 5,
        });
      }
    } catch (error) {
      console.error('Error creating queue:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'presence',
          status,
          capacity: 5,
          channels: ['CHAT'],
        }),
      });
      setMyStatus(status);
      setStatusDialogOpen(false);
      fetchPresence();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !message.trim()) return;

    try {
      await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          chatId: selectedChat.id,
          content: message,
          isFromAgent: true,
        }),
      });
      setMessage('');
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEndChat = async (chatId: string) => {
    try {
      await fetch('/api/live-chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, status: 'ENDED' }),
      });
      setSelectedChat(null);
      setChatDialogOpen(false);
      fetchChats();
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'WAITING':
        return 'warning';
      case 'ENDED':
        return 'default';
      case 'MISSED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'BUSY':
        return 'warning';
      case 'AWAY':
        return 'info';
      case 'OFFLINE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Live Chat & Omnichannel</Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={() => setStatusDialogOpen(true)}
              sx={{ mr: 1 }}
              startIcon={
                <CircleIcon
                  sx={{
                    fontSize: 12,
                    color:
                      myStatus === 'AVAILABLE'
                        ? 'success.main'
                        : myStatus === 'BUSY'
                        ? 'warning.main'
                        : 'error.main',
                  }}
                />
              }
            >
              {myStatus}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setQueueDialogOpen(true)}
            >
              New Queue
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ChatIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active Chats</Typography>
                </Box>
                <Typography variant="h4">{stats.activeChats}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Waiting</Typography>
                </Box>
                <Typography variant="h4">{stats.waitingChats}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SupportAgentIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Agents Online</Typography>
                </Box>
                <Typography variant="h4">
                  {presence.filter((p) => p.status === 'AVAILABLE').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Today</Typography>
                </Box>
                <Typography variant="h4">{stats.totalChats}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Active Chats" />
            <Tab label="Queues" />
            <Tab label="Agent Status" />
          </Tabs>
        </Paper>

        {/* Active Chats Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ height: 500, overflow: 'auto' }}>
                <List>
                  {chats
                    .filter((c) => ['ACTIVE', 'WAITING'].includes(c.status))
                    .map((chat) => (
                      <ListItemButton
                        key={chat.id}
                        selected={selectedChat?.id === chat.id}
                        onClick={() => {
                          setSelectedChat(chat);
                          setChatDialogOpen(true);
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={chat._count.messages}
                            color="primary"
                            overlap="circular"
                          >
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={chat.visitorName || chat.visitorEmail || 'Visitor'}
                          secondary={
                            <>
                              <Chip
                                label={chat.status}
                                size="small"
                                color={getStatusColor(chat.status) as any}
                                sx={{ mr: 1 }}
                              />
                              {formatTime(chat.createdAt)}
                            </>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItemButton>
                    ))}
                  {chats.filter((c) => ['ACTIVE', 'WAITING'].includes(c.status)).length === 0 && (
                    <ListItem>
                      <ListItemText secondary="No active chats" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ height: 500, p: 2, display: 'flex', flexDirection: 'column' }}>
                {selectedChat ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        {selectedChat.visitorName || selectedChat.visitorEmail || 'Visitor'}
                      </Typography>
                      <Box>
                        <Tooltip title="Transfer">
                          <IconButton size="small">
                            <SwapHorizIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="End Chat">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEndChat(selectedChat.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Divider />
                    <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
                      {selectedChat.messages.map((msg: any, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: msg.isFromAgent ? 'flex-end' : 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 1,
                              maxWidth: '70%',
                              bgcolor: msg.isFromAgent ? 'primary.light' : 'grey.100',
                              color: msg.isFromAgent ? 'white' : 'inherit',
                            }}
                          >
                            <Typography variant="body2">{msg.content}</Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button variant="contained" onClick={handleSendMessage}>
                        <SendIcon />
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography color="textSecondary">Select a chat to view</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Queues Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Queue Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Routing Type</TableCell>
                  <TableCell>Active Chats</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queues.map((queue) => (
                  <TableRow key={queue.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {queue.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{queue.description || '-'}</TableCell>
                    <TableCell>{queue.priority}</TableCell>
                    <TableCell>
                      <Chip label={queue.routingType} size="small" />
                    </TableCell>
                    <TableCell>{queue._count.chats}</TableCell>
                    <TableCell>
                      <Chip
                        label={queue.isActive ? 'Active' : 'Inactive'}
                        color={queue.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {queues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No queues found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Agent Status Tab */}
        {tabValue === 2 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Active Chats</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presence.map((agent) => (
                  <TableRow key={agent.userId}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <CircleIcon
                              sx={{
                                fontSize: 12,
                                color:
                                  agent.status === 'AVAILABLE'
                                    ? 'success.main'
                                    : agent.status === 'BUSY'
                                    ? 'warning.main'
                                    : 'error.main',
                              }}
                            />
                          }
                        >
                          <Avatar sx={{ mr: 2 }}>
                            <SupportAgentIcon />
                          </Avatar>
                        </Badge>
                        {agent.user.name}
                      </Box>
                    </TableCell>
                    <TableCell>{agent.user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.status}
                        color={getPresenceColor(agent.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{agent.activeChats}</TableCell>
                    <TableCell>{agent.capacity}</TableCell>
                    <TableCell>
                      {new Date(agent.lastActivity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {presence.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No agents online
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create Queue Dialog */}
      <Dialog open={queueDialogOpen} onClose={() => setQueueDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Routing Queue</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Queue Name"
            value={queueFormData.name}
            onChange={(e) => setQueueFormData({ ...queueFormData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={queueFormData.description}
            onChange={(e) => setQueueFormData({ ...queueFormData, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={queueFormData.priority}
                onChange={(e) =>
                  setQueueFormData({ ...queueFormData, priority: parseInt(e.target.value) || 1 })
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Max Capacity"
                type="number"
                value={queueFormData.maxCapacity}
                onChange={(e) =>
                  setQueueFormData({ ...queueFormData, maxCapacity: parseInt(e.target.value) || 5 })
                }
              />
            </Grid>
          </Grid>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Routing Type</InputLabel>
            <Select
              value={queueFormData.routingType}
              onChange={(e) => setQueueFormData({ ...queueFormData, routingType: e.target.value })}
              label="Routing Type"
            >
              <MenuItem value="ROUND_ROBIN">Round Robin</MenuItem>
              <MenuItem value="LEAST_ACTIVE">Least Active</MenuItem>
              <MenuItem value="MOST_AVAILABLE">Most Available</MenuItem>
              <MenuItem value="SKILL_BASED">Skill Based</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueueDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateQueue} variant="contained" disabled={!queueFormData.name}>
            Create Queue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Your Status</DialogTitle>
        <DialogContent>
          <List>
            {['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'].map((status) => (
              <ListItemButton
                key={status}
                onClick={() => handleUpdateStatus(status)}
                selected={myStatus === status}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor:
                        status === 'AVAILABLE'
                          ? 'success.main'
                          : status === 'BUSY'
                          ? 'warning.main'
                          : status === 'AWAY'
                          ? 'info.main'
                          : 'error.main',
                    }}
                  >
                    <CircleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={status} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
