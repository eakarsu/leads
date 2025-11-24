'use client';

import { useEffect, useState } from 'react';
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
  Tabs,
  Tab,
  IconButton,
  Divider,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import DraftsIcon from '@mui/icons-material/Drafts';
import InboxIcon from '@mui/icons-material/Inbox';
import TemplateIcon from '@mui/icons-material/Description';

interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  to: string;
  from: string;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
  };
}

export default function EmailCenterPage() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    campaignId: '',
    templateId: '',
  });

  useEffect(() => {
    fetchEmails();
    fetchTemplates();
    fetchCampaigns();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails');
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();

      // Transform the data to match the expected interface
      const transformedEmails = data.map((email: any) => ({
        id: email.id,
        subject: email.subject,
        body: email.body,
        status: email.status,
        sentAt: email.sentAt,
        to: email.toAddress,
        from: email.sender?.email || email.sender?.name || 'Unknown',
        createdAt: email.createdAt,
      }));

      setEmails(transformedEmails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const handleViewEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setOpenViewDialog(true);
  };

  const handleComposeEmail = async () => {
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: formData.to,
          subject: formData.subject,
          body: formData.body,
          templateId: formData.templateId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      setOpenDialog(false);
      setFormData({
        to: '',
        subject: '',
        body: '',
        campaignId: '',
        templateId: '',
      });
      fetchEmails();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        subject: template.subject || formData.subject,
        body: template.body || formData.body,
      });
    }
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'success';
      case 'OPENED':
        return 'info';
      case 'CLICKED':
        return 'primary';
      case 'BOUNCED':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'DRAFT':
      case 'SCHEDULED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTabEmails = () => {
    switch (tabValue) {
      case 0: // Inbox (all received/sent emails)
        return emails.filter((e) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'].includes(e.status));
      case 1: // Sent
        return emails.filter((e) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(e.status));
      case 2: // Drafts
        return emails.filter((e) => e.status === 'DRAFT');
      case 3: // Templates
        return templates;
      default:
        return [];
    }
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

  const currentEmails = getTabEmails();

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Email Center</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Compose Email
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<InboxIcon />} label="Inbox" />
            <Tab icon={<SendIcon />} label="Sent" />
            <Tab icon={<DraftsIcon />} label="Drafts" />
            <Tab icon={<TemplateIcon />} label="Templates" />
          </Tabs>
        </Card>

        <Card>
          <CardContent>
            {tabValue === 3 ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Email Templates
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {templates.length === 0 ? (
                  <Alert severity="info">
                    No email templates found. Templates help you quickly compose emails with pre-defined content.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {templates.map((template) => (
                      <Card key={template.id} variant="outlined">
                        <CardContent>
                          <Typography variant="h6">{template.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Category: {template.category || 'General'}
                          </Typography>
                          <Typography variant="subtitle2" gutterBottom>
                            Subject: {template.subject}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {template.body}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>
                        {tabValue === 0 ? 'From' : tabValue === 1 ? 'To' : 'Recipient'}
                      </TableCell>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentEmails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">
                            {tabValue === 0 && 'No emails in inbox'}
                            {tabValue === 1 && 'No sent emails'}
                            {tabValue === 2 && 'No draft emails'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentEmails.map((email: any) => (
                        <TableRow
                          key={email.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleViewEmail(email)}
                        >
                          <TableCell>{email.subject}</TableCell>
                          <TableCell>
                            {tabValue === 0 ? email.from : email.to}
                          </TableCell>
                          <TableCell>
                            {email.campaign ? (
                              <Chip label={email.campaign.name} size="small" variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={email.status}
                              size="small"
                              color={getStatusColor(email.status) as any}
                            />
                          </TableCell>
                          <TableCell>
                            {formatDateTime(email.sentAt || email.createdAt)}
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" title="Delete" color="error">
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
          </CardContent>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Campaign (Optional)"
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                fullWidth
                helperText="Associate this email with a campaign"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Use Template (Optional)"
                value={formData.templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                fullWidth
                helperText="Select a template to pre-fill the email"
              >
                <MenuItem value="">
                  <em>None - Start from scratch</em>
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </TextField>

              <Divider />

              <TextField
                label="To"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                fullWidth
                required
                helperText="Recipient email address"
              />

              <TextField
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Message"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                multiline
                rows={12}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleComposeEmail}
              variant="contained"
              startIcon={<SendIcon />}
              disabled={!formData.to || !formData.subject || !formData.body}
            >
              Send Email
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Email Details</DialogTitle>
          <DialogContent>
            {selectedEmail && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                  <Typography variant="body1">{selectedEmail.subject}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">From</Typography>
                  <Typography variant="body1">{selectedEmail.from}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">To</Typography>
                  <Typography variant="body1">{selectedEmail.to}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedEmail.status}
                    size="small"
                    color={getStatusColor(selectedEmail.status) as any}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">{formatDateTime(selectedEmail.sentAt || selectedEmail.createdAt)}</Typography>
                </Box>

                {selectedEmail.campaign && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Campaign</Typography>
                    <Chip label={selectedEmail.campaign.name} size="small" variant="outlined" />
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Message</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {selectedEmail.body}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
