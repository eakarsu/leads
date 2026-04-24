'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, Card,
  MenuItem, Alert, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Badge, Divider, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Message {
  id: string;
  direction: string;
  content: string;
  timestamp: string;
  status: string;
}

interface Conversation {
  id: string;
  channel: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  status: string;
  messages: Message[];
  _count?: { messages: number };
  lastMessageAt: string;
  createdAt: string;
}

const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'SMS': return '#4caf50';
    case 'WHATSAPP': return '#25D366';
    case 'FACEBOOK_MESSENGER': return '#0084FF';
    default: return '#9e9e9e';
  }
};

export default function MessagingPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    channel: 'SMS',
    contactId: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/messaging');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      const items = data.data || (Array.isArray(data) ? data : []);
      setConversations(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.messages && conversation.messages.length > 0) {
      setMessages(conversation.messages);
    } else {
      fetchMessages(conversation.id);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      const response = await fetch(`/api/messaging/${selectedConversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText, direction: 'OUTBOUND' }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      setMessageText('');
      // Refresh messages
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (err: any) {
      toast.showError(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await fetch('/api/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      setOpenDialog(false);
      setFormData({ channel: 'SMS', contactId: '', phoneNumber: '' });
      toast.showSuccess('Conversation created successfully');
      fetchConversations();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation and all its messages?',
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    try {
      const response = await fetch(`/api/messaging/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete conversation');
      toast.showSuccess('Conversation deleted');
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }
      fetchConversations();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.contactName || c.phoneNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <ChatIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Messaging</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            New Conversation
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel - Conversation List */}
          <Box sx={{ width: 360, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
              <TextField
                placeholder="Search conversations..."
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {loading ? (
                <Box p={2}><TableSkeleton rows={5} columns={2} /></Box>
              ) : filteredConversations.length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">No conversations found.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredConversations.map((conversation) => (
                    <ListItem
                      key={conversation.id}
                      component="div"
                      onClick={() => handleSelectConversation(conversation)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: selectedConversation?.id === conversation.id ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color={conversation.status === 'ACTIVE' ? 'success' : 'default'}
                          variant="dot"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar sx={{ bgcolor: getChannelColor(conversation.channel) }}>
                            <PersonIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" noWrap>
                              {conversation.contactName || conversation.phoneNumber || 'Unknown'}
                            </Typography>
                            <Chip label={conversation.channel} size="small" sx={{ fontSize: 10, height: 20 }} />
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {conversation.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {conversation._count?.messages || 0} msgs
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Right Panel - Message View */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {selectedConversation.contactName || selectedConversation.phoneNumber || 'Unknown'}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip label={selectedConversation.channel} size="small" />
                        <Chip
                          label={selectedConversation.status}
                          size="small"
                          color={selectedConversation.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                        {selectedConversation.phoneNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {selectedConversation.phoneNumber}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteConversation(selectedConversation.id)}
                      title="Delete conversation"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {messages.length === 0 ? (
                    <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                      <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          justifyContent: msg.direction === 'OUTBOUND' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            bgcolor: msg.direction === 'OUTBOUND' ? 'primary.main' : 'grey.100',
                            color: msg.direction === 'OUTBOUND' ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            borderTopRightRadius: msg.direction === 'OUTBOUND' ? 0 : 16,
                            borderTopLeftRadius: msg.direction === 'INBOUND' ? 0 : 16,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              textAlign: 'right',
                              mt: 0.5,
                              opacity: 0.7,
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Paper>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    multiline
                    maxRows={4}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || sendingMessage}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={2}>
                <ChatIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* New Conversation Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Channel"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                fullWidth
              >
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                <MenuItem value="FACEBOOK_MESSENGER">Facebook Messenger</MenuItem>
              </TextField>
              <TextField
                label="Contact ID"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                fullWidth
                placeholder="Enter contact ID"
              />
              <TextField
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                fullWidth
                placeholder="+1234567890"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateConversation} variant="contained" disabled={!formData.contactId && !formData.phoneNumber}>
              Create Conversation
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
