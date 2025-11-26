'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  CircularProgress,
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
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

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
      }
    } catch (err) {
      setError('Failed to fetch forms');
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
      }
    } catch (err) {
      console.error('Error creating form:', err);
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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      case 'LEAD':
        return 'primary';
      case 'CASE':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredForms = getFilteredForms();

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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            New Form
          </Button>
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
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredForms.length === 0 ? (
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
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Form Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fields</TableCell>
                  <TableCell align="right">Submissions</TableCell>
                  <TableCell>CAPTCHA</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id} hover>
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
                        <IconButton size="small" onClick={() => setSelectedForm(form)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy URL">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(getPublicFormUrl(form.publicToken), `url-${form.id}`)}
                        >
                          <LinkIcon fontSize="small" color={copySuccess === `url-${form.id}` ? 'success' : 'inherit'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy Embed Code">
                        <IconButton
                          size="small"
                          onClick={() =>
                            copyToClipboard(
                              `<iframe src="${getPublicFormUrl(form.publicToken)}" width="100%" height="500" frameborder="0"></iframe>`,
                              `embed-${form.id}`
                            )
                          }
                        >
                          <CodeIcon fontSize="small" color={copySuccess === `embed-${form.id}` ? 'success' : 'inherit'} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

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
          onClose={() => setSelectedForm(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedForm && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormIcon color="primary" />
                  {selectedForm.name}
                </Box>
              </DialogTitle>
              <DialogContent>
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
                          onClick={() =>
                            copyToClipboard(getPublicFormUrl(selectedForm.publicToken), 'detail-url')
                          }
                          color={copySuccess === 'detail-url' ? 'success' : 'primary'}
                        >
                          {copySuccess === 'detail-url' ? 'Copied!' : 'Copy'}
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
                            'detail-embed'
                          )
                        }
                        sx={{ mt: 1 }}
                        color={copySuccess === 'detail-embed' ? 'success' : 'primary'}
                      >
                        {copySuccess === 'detail-embed' ? 'Copied!' : 'Copy Embed Code'}
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
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedForm(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
