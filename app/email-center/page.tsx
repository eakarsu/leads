'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  IconButton,
  Divider,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
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
  ccAddress: string | null;
  bccAddress: string | null;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
  };
}

const columns: Column[] = [
  { id: 'subject', label: 'Subject' },
  { id: 'from', label: 'From/To', sortable: false },
  { id: 'campaign', label: 'Campaign', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'sentAt', label: 'Date' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function EmailCenterPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('sentAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    campaignId: '',
    templateId: '',
  });

  const {
    data: rawEmails,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<any>({
    url: '/api/emails',
    defaultSortBy: 'sentAt',
    defaultSortOrder: 'desc',
  });

  const emails: EmailMessage[] = useMemo(
    () =>
      rawEmails.map((email: any) => ({
        id: email.id,
        subject: email.subject,
        body: email.body,
        status: email.status,
        sentAt: email.sentAt,
        to: email.toAddress,
        from: email.sender?.email || email.sender?.name || 'Unknown',
        ccAddress: email.ccAddress || null,
        bccAddress: email.bccAddress || null,
        createdAt: email.createdAt,
      })),
    [rawEmails]
  );

  useEffect(() => {
    fetchTemplates();
    fetchCampaigns();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    body: '',
    toAddress: '',
    ccAddress: '',
    bccAddress: '',
    status: '',
  });

  const handleViewEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setEditMode(false);
    setOpenViewDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedEmail) return;
    setEditFormData({
      subject: selectedEmail.subject || '',
      body: selectedEmail.body || '',
      toAddress: selectedEmail.to || '',
      ccAddress: selectedEmail.ccAddress || '',
      bccAddress: selectedEmail.bccAddress || '',
      status: selectedEmail.status || '',
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmail) return;
    try {
      const response = await fetch(`/api/emails/${selectedEmail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editFormData.subject,
          body: editFormData.body,
          toAddress: editFormData.toAddress,
          ccAddress: editFormData.ccAddress || null,
          bccAddress: editFormData.bccAddress || null,
          status: editFormData.status,
        }),
      });
      if (!response.ok) throw new Error('Failed to update email');
      toast.showSuccess('Email updated successfully');
      setEditMode(false);
      setOpenViewDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    const confirmed = await confirm({
      title: 'Delete Email',
      message: 'Are you sure you want to delete this email? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/emails/${emailId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete email');
      toast.showSuccess('Email deleted successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
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
      toast.showSuccess('Email sent successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
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
      case 0:
        return emails.filter((e) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'].includes(e.status));
      case 1:
        return emails.filter((e) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(e.status));
      case 2:
        return emails.filter((e) => e.status === 'DRAFT');
      case 3:
        return templates;
      default:
        return [];
    }
  };

  const currentEmails = getTabEmails();

  const exportData = currentEmails.map((e: any) => ({
    Subject: e.subject,
    From: e.from || '',
    To: e.to || '',
    Status: e.status,
    Date: formatDateTime(e.sentAt || e.createdAt),
  }));

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Email Center</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="emails" title="Emails" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Compose Email
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
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
            ) : loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <SortableTableHead
                      columns={columns}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
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
                              <IconButton
                                size="small"
                                title="Delete"
                                color="error"
                                onClick={() => handleDeleteEmail(email.id)}
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
                <PaginationControls
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
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

        <Dialog open={openViewDialog} onClose={() => { setOpenViewDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Email' : 'Email Details'}</DialogTitle>
          <DialogContent>
            {selectedEmail && !editMode && (
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

                {selectedEmail.ccAddress && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">CC</Typography>
                    <Typography variant="body1">{selectedEmail.ccAddress}</Typography>
                  </Box>
                )}

                {selectedEmail.bccAddress && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">BCC</Typography>
                    <Typography variant="body1">{selectedEmail.bccAddress}</Typography>
                  </Box>
                )}

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

            {selectedEmail && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="To"
                  type="email"
                  value={editFormData.toAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, toAddress: e.target.value })}
                  fullWidth
                  required
                />

                <TextField
                  label="CC"
                  type="email"
                  value={editFormData.ccAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, ccAddress: e.target.value })}
                  fullWidth
                  helperText="Optional CC address"
                />

                <TextField
                  label="BCC"
                  type="email"
                  value={editFormData.bccAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, bccAddress: e.target.value })}
                  fullWidth
                  helperText="Optional BCC address"
                />

                <TextField
                  label="Subject"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                  fullWidth
                  required
                />

                <TextField
                  select
                  label="Status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  fullWidth
                >
                  {['DRAFT', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Message"
                  value={editFormData.body}
                  onChange={(e) => setEditFormData({ ...editFormData, body: e.target.value })}
                  multiline
                  rows={10}
                  fullWidth
                  required
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!editFormData.toAddress || !editFormData.subject || !editFormData.body}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => { setOpenViewDialog(false); setEditMode(false); }}>Close</Button>
                <Button
                  onClick={handleStartEdit}
                  variant="outlined"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
