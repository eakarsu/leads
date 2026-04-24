'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as FormIcon,
  CheckCircle as ActiveIcon,
  People as LeadIcon,
  SupportAgent as CaseIcon,
  TouchApp as SubmissionIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface WebForm {
  id: string;
  publicToken: string;
  name: string;
  formType: string;
  description: string | null;
  fields: any;
  isActive: boolean;
  submissionCount: number;
  captchaEnabled: boolean;
  redirectUrl: string | null;
  notifyEmails: string[];
  createdAt: string;
  _count?: { submissions: number };
}

interface Stats {
  totalForms: number;
  activeForms: number;
  leadForms: number;
  caseForms: number;
  totalSubmissions: number;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

const tableColumns: Column[] = [
  { id: 'name', label: 'Form Name' },
  { id: 'formType', label: 'Type' },
  { id: 'isActive', label: 'Status' },
  { id: 'fields', label: 'Fields', sortable: false },
  { id: 'submissionCount', label: 'Submissions', align: 'right' },
  { id: 'captchaEnabled', label: 'CAPTCHA' },
  { id: 'createdAt', label: 'Created' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function WebFormsPage() {
  const [forms, setForms] = useState<WebForm[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalForms: 0,
    activeForms: 0,
    leadForms: 0,
    caseForms: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<WebForm | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { showSuccess, showError: showToastError } = useToast();
  const { confirm } = useConfirmDialog();

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    formType: 'LEAD',
    description: '',
    redirectUrl: '',
    isActive: true,
    captchaEnabled: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    formType: 'LEAD',
    description: '',
    redirectUrl: '',
    captchaEnabled: true,
    notifyEmails: '',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'company', label: 'Company', type: 'text', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ] as FormField[],
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/web-forms');
      const data = await res.json();

      if (data.forms) {
        setForms(data.forms);
        setStats(data.stats);
      } else if (Array.isArray(data)) {
        setForms(data);
      } else if (data.data) {
        setForms(data.data);
      }
    } catch (err) {
      setError('Failed to fetch forms');
      showToastError('Failed to load web forms');
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      const res = await fetch('/api/web-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          notifyEmails: formData.notifyEmails
            ? formData.notifyEmails.split(',').map((e) => e.trim())
            : [],
        }),
      });

      if (res.ok) {
        setShowCreateDialog(false);
        resetFormData();
        fetchForms();
        showSuccess('Web form created successfully');
      } else {
        showToastError('Failed to create web form');
      }
    } catch (err) {
      console.error('Error creating form:', err);
      showToastError('Failed to create web form');
    }
  };

  const handleDeleteForm = async (formId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Web Form',
      message: 'Are you sure you want to delete this form? All submissions will be lost.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/web-forms?id=${formId}`, { method: 'DELETE' });
      fetchForms();
      if (selectedForm?.id === formId) {
        setSelectedForm(null);
      }
      showSuccess('Web form deleted successfully');
    } catch (err) {
      console.error('Error deleting form:', err);
      showToastError('Failed to delete web form');
    }
  };

  const handleStartEdit = () => {
    if (!selectedForm) return;
    setEditFormData({
      name: selectedForm.name,
      formType: selectedForm.formType,
      description: selectedForm.description || '',
      redirectUrl: selectedForm.redirectUrl || '',
      isActive: selectedForm.isActive,
      captchaEnabled: selectedForm.captchaEnabled,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedForm) return;
    try {
      const res = await fetch(`/api/web-forms/${selectedForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) throw new Error('Failed to update web form');
      showSuccess('Web form updated successfully');
      setEditMode(false);
      setSelectedForm(null);
      fetchForms();
    } catch (err: any) {
      console.error('Error updating form:', err);
      showToastError(err.message || 'Failed to update web form');
    }
  };

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      formType: 'LEAD',
      description: '',
      redirectUrl: '',
      captchaEnabled: true,
      notifyEmails: '',
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'company', label: 'Company', type: 'text', required: false },
        { name: 'message', label: 'Message', type: 'textarea', required: false },
      ],
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', label: '', type: 'text', required: false }],
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const fields = [...formData.fields];
    fields[index] = { ...fields[index], [key]: value };
    if (key === 'label') {
      fields[index].name = value.toLowerCase().replace(/\s+/g, '_');
    }
    setFormData({ ...formData, fields });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    });
  };

  const getPublicFormUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/form/${token}`;
    }
    return `/form/${token}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToastError('Failed to copy to clipboard');
    }
  };

  const getFilteredForms = () => {
    switch (tabValue) {
      case 1:
        return forms.filter((f) => f.isActive);
      case 2:
        return forms.filter((f) => f.formType === 'LEAD');
      case 3:
        return forms.filter((f) => f.formType === 'CASE');
      default:
        return forms;
    }
  };

  const getFormTypeColor = (type: string) => {
    switch (type) {
      case 'LEAD': return 'primary';
      case 'CASE': return 'success';
      default: return 'default';
    }
  };

  const filteredForms = getFilteredForms()
    .sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const totalItems = filteredForms.length;
  const paginatedForms = filteredForms.slice((page - 1) * pageSize, page * pageSize);

  const exportData = filteredForms.map(f => ({
    Name: f.name,
    Type: f.formType === 'LEAD' ? 'Web-to-Lead' : 'Web-to-Case',
    Status: f.isActive ? 'Active' : 'Inactive',
    Fields: Array.isArray(f.fields) ? f.fields.length : 0,
    Submissions: f.submissionCount || 0,
    CAPTCHA: f.captchaEnabled ? 'Enabled' : 'Disabled',
    Created: new Date(f.createdAt).toLocaleDateString(),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Web-to-Lead/Case Forms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create embeddable forms for lead and case capture
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="web-forms" title="Web Forms" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              New Form
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Forms
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                  {stats.totalForms}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ActiveIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Active Forms
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>
                  {stats.activeForms}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LeadIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Lead Forms
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
                  {stats.leadForms}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CaseIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Case Forms
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ mt: 1 }}>
                  {stats.caseForms}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SubmissionIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mt: 1 }}>
                  {stats.totalSubmissions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={`All (${forms.length})`} />
            <Tab label={`Active (${forms.filter((f) => f.isActive).length})`} />
            <Tab label={`Lead (${forms.filter((f) => f.formType === 'LEAD').length})`} />
            <Tab label={`Case (${forms.filter((f) => f.formType === 'CASE').length})`} />
          </Tabs>
        </Paper>

        {/* Forms Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : paginatedForms.length === 0 ? (
          <TableContainer component={Paper}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FormIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No forms found</Typography>
              <Button
                variant="text"
                onClick={() => setShowCreateDialog(true)}
                sx={{ mt: 1 }}
              >
                Create your first form
              </Button>
            </Box>
          </TableContainer>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={tableColumns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableBody>
                {paginatedForms.map((form) => (
                  <TableRow
                    key={form.id}
                    hover
                    onClick={() => setSelectedForm(form)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography fontWeight="medium">{form.name}</Typography>
                      {form.description && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {form.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={form.formType === 'LEAD' ? 'Web-to-Lead' : 'Web-to-Case'}
                        color={getFormTypeColor(form.formType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={form.isActive ? 'Active' : 'Inactive'}
                        color={form.isActive ? 'success' : 'default'}
                        size="small"
                        variant={form.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Array.isArray(form.fields) ? form.fields.length : 0} fields
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium">
                        {(form.submissionCount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={form.captchaEnabled ? 'Enabled' : 'Disabled'}
                        color={form.captchaEnabled ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedForm(form); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy URL">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(getPublicFormUrl(form.publicToken), 'Form URL'); }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy Embed Code">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(
                              `<iframe src="${getPublicFormUrl(form.publicToken)}" width="100%" height="500" frameborder="0"></iframe>`,
                              'Embed code'
                            );
                          }}
                        >
                          <CodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteForm(form.id, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </TableContainer>
        )}

        {/* Create Form Dialog */}
        <Dialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Web Form</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Form Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  placeholder="e.g., Contact Us"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Form Type</InputLabel>
                  <Select
                    value={formData.formType}
                    label="Form Type"
                    onChange={(e) => setFormData({ ...formData, formType: e.target.value })}
                  >
                    <MenuItem value="LEAD">Web-to-Lead</MenuItem>
                    <MenuItem value="CASE">Web-to-Case</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Redirect URL (after submission)"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                  fullWidth
                  placeholder="https://example.com/thank-you"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Notification Emails"
                  value={formData.notifyEmails}
                  onChange={(e) => setFormData({ ...formData, notifyEmails: e.target.value })}
                  fullWidth
                  placeholder="email1@example.com, email2@example.com"
                  helperText="Comma-separated emails"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.captchaEnabled}
                      onChange={(e) => setFormData({ ...formData, captchaEnabled: e.target.checked })}
                    />
                  }
                  label="Enable CAPTCHA protection"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Form Fields
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addField}>
                    Add Field
                  </Button>
                </Box>
                {formData.fields.map((field, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="Field Label"
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={field.type}
                            label="Type"
                            onChange={(e) => updateField(index, 'type', e.target.value)}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="tel">Phone</MenuItem>
                            <MenuItem value="textarea">Text Area</MenuItem>
                            <MenuItem value="select">Dropdown</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) => updateField(index, 'required', e.target.checked)}
                              size="small"
                            />
                          }
                          label="Required"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <IconButton
                          color="error"
                          onClick={() => removeField(index)}
                          disabled={formData.fields.length <= 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateForm}
              disabled={!formData.name || formData.fields.length === 0}
            >
              Create Form
            </Button>
          </DialogActions>
        </Dialog>

        {/* Form Detail Dialog */}
        <Dialog
          open={!!selectedForm}
          onClose={() => { setSelectedForm(null); setEditMode(false); }}
          maxWidth="md"
          fullWidth
        >
          {selectedForm && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormIcon color="primary" />
                  {editMode ? `Edit: ${selectedForm.name}` : selectedForm.name}
                </Box>
              </DialogTitle>
              <DialogContent>
                {editMode ? (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Form Name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Form Type</InputLabel>
                        <Select
                          value={editFormData.formType}
                          label="Form Type"
                          onChange={(e) => setEditFormData({ ...editFormData, formType: e.target.value })}
                        >
                          <MenuItem value="LEAD">Web-to-Lead</MenuItem>
                          <MenuItem value="CASE">Web-to-Case</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Redirect URL (after submission)"
                        value={editFormData.redirectUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, redirectUrl: e.target.value })}
                        fullWidth
                        placeholder="https://example.com/thank-you"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editFormData.isActive ? 'active' : 'inactive'}
                          label="Status"
                          onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'active' })}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editFormData.captchaEnabled}
                            onChange={(e) => setEditFormData({ ...editFormData, captchaEnabled: e.target.checked })}
                          />
                        }
                        label="Enable CAPTCHA protection"
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    {/* Form URL Section */}
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Public Form URL
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            value={getPublicFormUrl(selectedForm.publicToken)}
                            fullWidth
                            size="small"
                            InputProps={{ readOnly: true }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CopyIcon />}
                            onClick={() => copyToClipboard(getPublicFormUrl(selectedForm.publicToken), 'Form URL')}
                          >
                            Copy
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Embed Code Section */}
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Embed Code
                        </Typography>
                        <TextField
                          value={`<iframe src="${getPublicFormUrl(selectedForm.publicToken)}" width="100%" height="500" frameborder="0"></iframe>`}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                        />
                        <Button
                          size="small"
                          startIcon={<CopyIcon />}
                          onClick={() =>
                            copyToClipboard(
                              `<iframe src="${getPublicFormUrl(selectedForm.publicToken)}" width="100%" height="500" frameborder="0"></iframe>`,
                              'Embed code'
                            )
                          }
                          sx={{ mt: 1 }}
                        >
                          Copy Embed Code
                        </Button>
                      </Paper>
                    </Grid>

                    {/* Form Details */}
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Form Type
                      </Typography>
                      <Chip
                        label={selectedForm.formType === 'LEAD' ? 'Web-to-Lead' : 'Web-to-Case'}
                        color={getFormTypeColor(selectedForm.formType)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={selectedForm.isActive ? 'Active' : 'Inactive'}
                        color={selectedForm.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Submissions
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {(selectedForm.submissionCount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        CAPTCHA
                      </Typography>
                      <Chip
                        label={selectedForm.captchaEnabled ? 'Enabled' : 'Disabled'}
                        color={selectedForm.captchaEnabled ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>

                    {/* Description */}
                    {selectedForm.description && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography>{selectedForm.description}</Typography>
                      </Grid>
                    )}

                    {/* Redirect URL */}
                    {selectedForm.redirectUrl && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">
                          Redirect URL
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedForm.redirectUrl}
                        </Typography>
                      </Grid>
                    )}

                    {/* Form Fields */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Form Fields ({Array.isArray(selectedForm.fields) ? selectedForm.fields.length : 0})
                      </Typography>
                      <Paper variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Label</TableCell>
                              <TableCell>Field Name</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Required</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Array.isArray(selectedForm.fields) &&
                              selectedForm.fields.map((field: FormField, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{field.label}</TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    {field.name}
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={field.type} size="small" variant="outlined" />
                                  </TableCell>
                                  <TableCell>
                                    {field.required ? (
                                      <Chip label="Yes" color="error" size="small" />
                                    ) : (
                                      <Chip label="No" size="small" variant="outlined" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </DialogContent>
              <DialogActions>
                {editMode ? (
                  <>
                    <Button onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveEdit}
                      disabled={!editFormData.name}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => handleDeleteForm(selectedForm.id, e)}
                    >
                      Delete
                    </Button>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleStartEdit}
                    >
                      Edit
                    </Button>
                    <Button onClick={() => setSelectedForm(null)}>Close</Button>
                  </>
                )}</DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
