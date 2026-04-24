'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Box,
  Divider,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SendIcon from '@mui/icons-material/Send';
import DraftsIcon from '@mui/icons-material/Drafts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface Email {
  id: string;
  subject: string;
  body: string;
  toAddress: string;
  ccAddress?: string | null;
  bccAddress?: string | null;
  status: 'DRAFT' | 'SENT' | 'FAILED';
  sentAt?: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  opportunity?: {
    id: string;
    name: string;
  } | null;
}

interface EmailSectionProps {
  contactId?: string;
  opportunityId?: string;
  defaultToAddress?: string;
}

export default function EmailSection({
  contactId,
  opportunityId,
  defaultToAddress,
}: EmailSectionProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    toAddress: defaultToAddress || '',
    ccAddress: '',
    bccAddress: '',
    subject: '',
    body: '',
  });

  useEffect(() => {
    fetchEmails();
  }, [contactId, opportunityId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (opportunityId) params.append('opportunityId', opportunityId);

      const response = await fetch(`/api/emails?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contactId,
          opportunityId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      setDialogOpen(false);
      setFormData({
        toAddress: defaultToAddress || '',
        ccAddress: '',
        bccAddress: '',
        subject: '',
        body: '',
      });
      fetchEmails();
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'DRAFT':
        return <DraftsIcon fontSize="small" color="action" />;
      case 'FAILED':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          avatar={<EmailIcon />}
          title="Emails"
          subheader={`${emails.length} emails`}
          action={
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Send Email
            </Button>
          }
        />
        <CardContent sx={{ maxHeight: 600, overflowY: 'auto' }}>
          {emails.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              No emails sent yet
            </Typography>
          ) : (
            <List disablePadding>
              {emails.map((email, index) => {
                const isExpanded = expanded[email.id];

                return (
                  <Box key={email.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ flexDirection: 'column', gap: 1 }}
                    >
                      <Box display="flex" justifyContent="space-between" width="100%">
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          {getStatusIcon(email.status)}
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {email.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              To: {email.toAddress}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={email.status}
                              size="small"
                              color={getStatusColor(email.status) as any}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {email.sentAt
                                ? formatTimestamp(email.sentAt)
                                : formatTimestamp(email.createdAt)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => toggleExpand(email.id)}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
                        <Box pl={2} pt={1}>
                          <Box mb={1}>
                            <Typography variant="caption" color="text.secondary">
                              From:
                            </Typography>
                            <Typography variant="body2">
                              {email.sender.name} ({email.sender.email})
                            </Typography>
                          </Box>

                          {email.ccAddress && (
                            <Box mb={1}>
                              <Typography variant="caption" color="text.secondary">
                                CC:
                              </Typography>
                              <Typography variant="body2">{email.ccAddress}</Typography>
                            </Box>
                          )}

                          {email.bccAddress && (
                            <Box mb={1}>
                              <Typography variant="caption" color="text.secondary">
                                BCC:
                              </Typography>
                              <Typography variant="body2">{email.bccAddress}</Typography>
                            </Box>
                          )}

                          <Box mt={2}>
                            <Typography variant="caption" color="text.secondary">
                              Message:
                            </Typography>
                            <Typography
                              variant="body2"
                              component="div"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                bgcolor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                                mt: 0.5,
                              }}
                            >
                              {email.body}
                            </Typography>
                          </Box>
                        </Box>
                      </Collapse>
                    </ListItem>
                    {index < emails.length - 1 && <Divider component="li" />}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="To"
              value={formData.toAddress}
              onChange={(e) =>
                setFormData({ ...formData, toAddress: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="CC"
              value={formData.ccAddress}
              onChange={(e) =>
                setFormData({ ...formData, ccAddress: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="BCC"
              value={formData.bccAddress}
              onChange={(e) =>
                setFormData({ ...formData, bccAddress: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Message"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              multiline
              rows={8}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={
              sending ||
              !formData.toAddress ||
              !formData.subject ||
              !formData.body
            }
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
