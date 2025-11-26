'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as RunIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TableChart as TabularIcon,
  BarChart as SummaryIcon,
  GridOn as MatrixIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

const OBJECT_TYPES = [
  { value: 'Lead', label: 'Leads', icon: '👤' },
  { value: 'Contact', label: 'Contacts', icon: '📇' },
  { value: 'Account', label: 'Accounts', icon: '🏢' },
  { value: 'Opportunity', label: 'Opportunities', icon: '💰' },
  { value: 'Case', label: 'Cases', icon: '📋' },
  { value: 'Campaign', label: 'Campaigns', icon: '📣' },
  { value: 'Task', label: 'Tasks', icon: '✓' },
  { value: 'Contract', label: 'Contracts', icon: '📄' },
  { value: 'Quote', label: 'Quotes', icon: '💵' },
  { value: 'Order', label: 'Orders', icon: '🛒' },
  { value: 'Invoice', label: 'Invoices', icon: '🧾' },
];

const FIELD_OPTIONS: Record<string, string[]> = {
  Lead: ['Full Name', 'Email', 'Phone', 'Company', 'Status', 'Lead Source', 'Created Date', 'Owner'],
  Contact: ['First Name', 'Last Name', 'Email', 'Phone', 'Title', 'Account', 'Created Date', 'Owner'],
  Account: ['Name', 'Industry', 'Type', 'Website', 'Phone', 'Created Date', 'Owner'],
  Opportunity: ['Name', 'Stage', 'Amount', 'Probability', 'Close Date', 'Account', 'Created Date', 'Owner'],
  Case: ['Case Number', 'Subject', 'Status', 'Priority', 'Origin', 'Contact', 'Account', 'Created Date', 'Owner'],
  Campaign: ['Name', 'Status', 'Type', 'Start Date', 'End Date', 'Expected Revenue', 'Actual Cost'],
  Task: ['Subject', 'Status', 'Priority', 'Due Date', 'Related To', 'Assigned To', 'Created Date'],
  Contract: ['Contract Number', 'Account', 'Status', 'Start Date', 'End Date', 'Value'],
  Quote: ['Quote Number', 'Name', 'Account', 'Status', 'Total Price', 'Expiration Date'],
  Order: ['Order Number', 'Account', 'Status', 'Order Date', 'Total Amount'],
  Invoice: ['Invoice Number', 'Account', 'Status', 'Invoice Date', 'Due Date', 'Total Amount'],
};

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface ReportResult {
  data: any[];
  total: number;
  columns: string[];
}

export default function CreateReportPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reportType: 'TABULAR',
    objectType: '',
    columns: [] as string[],
    filters: [] as Filter[],
    groupings: [] as string[],
    isPublic: false,
  });

  const steps = ['Select Object', 'Choose Columns', 'Add Filters', 'Review & Save'];

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const addFilter = () => {
    if (!formData.objectType) return;
    setFormData({
      ...formData,
      filters: [
        ...formData.filters,
        { field: FIELD_OPTIONS[formData.objectType][0], operator: 'equals', value: '' },
      ],
    });
  };

  const updateFilter = (index: number, key: string, value: string) => {
    const filters = [...formData.filters];
    filters[index] = { ...filters[index], [key]: value };
    setFormData({ ...formData, filters });
  };

  const removeFilter = (index: number) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.objectType || formData.columns.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          reportType: formData.reportType,
          objectType: formData.objectType,
          columns: formData.columns,
          filters: formData.filters,
          groupings: formData.groupings,
          isPublic: formData.isPublic,
        }),
      });

      if (!response.ok) throw new Error('Failed to save report');

      router.push('/reports');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunPreview = async () => {
    if (formData.columns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    setRunning(true);
    setError('');

    try {
      const response = await fetch('/api/reports/builder/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectType: formData.objectType,
          columns: formData.columns,
          filters: formData.filters,
          groupings: formData.groupings,
        }),
      });

      if (!response.ok) throw new Error('Failed to run report');

      const data = await response.json();
      setReportResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'TABULAR': return <TabularIcon />;
      case 'SUMMARY': return <SummaryIcon />;
      case 'MATRIX': return <MatrixIcon />;
      default: return <TabularIcon />;
    }
  };

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => router.push('/reports')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">Create New Report</Typography>
            <Typography variant="body2" color="text.secondary">
              Build a custom report to analyze your CRM data
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={3}>
          {/* Left Panel - Configuration */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                {/* Step 0: Select Object */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Report Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Report Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          fullWidth
                          required
                          placeholder="e.g., Monthly Sales Pipeline"
                        />
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
                        <FormControl fullWidth required>
                          <InputLabel>Report Type</InputLabel>
                          <Select
                            value={formData.reportType}
                            onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                            label="Report Type"
                          >
                            <MenuItem value="TABULAR">
                              <Box display="flex" alignItems="center" gap={1}>
                                <TabularIcon fontSize="small" /> Tabular
                              </Box>
                            </MenuItem>
                            <MenuItem value="SUMMARY">
                              <Box display="flex" alignItems="center" gap={1}>
                                <SummaryIcon fontSize="small" /> Summary
                              </Box>
                            </MenuItem>
                            <MenuItem value="MATRIX">
                              <Box display="flex" alignItems="center" gap={1}>
                                <MatrixIcon fontSize="small" /> Matrix
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Primary Object</InputLabel>
                          <Select
                            value={formData.objectType}
                            onChange={(e) => setFormData({
                              ...formData,
                              objectType: e.target.value,
                              columns: [],
                              filters: [],
                              groupings: [],
                            })}
                            label="Primary Object"
                          >
                            {OBJECT_TYPES.map((obj) => (
                              <MenuItem key={obj.value} value={obj.value}>
                                {obj.icon} {obj.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.isPublic}
                              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                            />
                          }
                          label="Make this report public"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Step 1: Choose Columns */}
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Select Columns
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Choose the fields to include in your report
                    </Typography>
                    {formData.objectType ? (
                      <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                        <Grid container spacing={1}>
                          {FIELD_OPTIONS[formData.objectType]?.map((field) => (
                            <Grid size={{ xs: 6 }} key={field}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={formData.columns.includes(field)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, columns: [...formData.columns, field] });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          columns: formData.columns.filter((c) => c !== field),
                                        });
                                      }
                                    }}
                                    size="small"
                                  />
                                }
                                label={<Typography variant="body2">{field}</Typography>}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    ) : (
                      <Alert severity="warning">Please select an object type first</Alert>
                    )}
                    {formData.columns.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Selected ({formData.columns.length}):
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {formData.columns.map((col) => (
                            <Chip
                              key={col}
                              label={col}
                              size="small"
                              onDelete={() =>
                                setFormData({
                                  ...formData,
                                  columns: formData.columns.filter((c) => c !== col),
                                })
                              }
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Step 2: Add Filters */}
                {activeStep === 2 && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">Filters</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addFilter}
                        disabled={!formData.objectType}
                      >
                        Add Filter
                      </Button>
                    </Box>
                    {formData.filters.length === 0 ? (
                      <Alert severity="info">
                        No filters added. Click "Add Filter" to filter your report data.
                      </Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {formData.filters.map((filter, index) => (
                          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={1} alignItems="center">
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Field</InputLabel>
                                  <Select
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                                    label="Field"
                                  >
                                    {FIELD_OPTIONS[formData.objectType]?.map((field) => (
                                      <MenuItem key={field} value={field}>
                                        {field}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Operator</InputLabel>
                                  <Select
                                    value={filter.operator}
                                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                    label="Operator"
                                  >
                                    {OPERATORS.map((op) => (
                                      <MenuItem key={op.value} value={op.value}>
                                        {op.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 10, sm: 4 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Value"
                                  value={filter.value}
                                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 2, sm: 1 }}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeFilter(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Groupings for Summary/Matrix */}
                    {(formData.reportType === 'SUMMARY' || formData.reportType === 'MATRIX') && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Group By
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Grouping Fields</InputLabel>
                          <Select
                            multiple
                            value={formData.groupings}
                            onChange={(e) =>
                              setFormData({ ...formData, groupings: e.target.value as string[] })
                            }
                            label="Grouping Fields"
                            renderValue={(selected) => (
                              <Box display="flex" gap={0.5} flexWrap="wrap">
                                {(selected as string[]).map((value) => (
                                  <Chip key={value} label={value} size="small" />
                                ))}
                              </Box>
                            )}
                          >
                            {FIELD_OPTIONS[formData.objectType]?.map((field) => (
                              <MenuItem key={field} value={field}>
                                {field}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Step 3: Review & Save */}
                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Review Your Report
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Report Name
                          </Typography>
                          <Typography variant="body1">{formData.name || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Report Type
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getReportTypeIcon(formData.reportType)}
                            <Typography variant="body1">{formData.reportType}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Object
                          </Typography>
                          <Typography variant="body1">{formData.objectType || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Visibility
                          </Typography>
                          <Typography variant="body1">
                            {formData.isPublic ? 'Public' : 'Private'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Columns ({formData.columns.length})
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {formData.columns.map((col) => (
                              <Chip key={col} label={col} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                        {formData.filters.length > 0 && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">
                              Filters ({formData.filters.length})
                            </Typography>
                            <Box mt={0.5}>
                              {formData.filters.map((f, i) => (
                                <Typography key={i} variant="body2">
                                  {f.field} {f.operator} "{f.value}"
                                </Typography>
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {/* Navigation */}
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                  </Button>
                  <Box display="flex" gap={1}>
                    {activeStep === 3 ? (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={running ? <CircularProgress size={20} /> : <RunIcon />}
                          onClick={handleRunPreview}
                          disabled={running || formData.columns.length === 0}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                          onClick={handleSave}
                          disabled={saving || !formData.name || formData.columns.length === 0}
                        >
                          Save Report
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={
                          (activeStep === 0 && !formData.objectType) ||
                          (activeStep === 1 && formData.columns.length === 0)
                        }
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Panel - Preview */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%', minHeight: 500 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Preview
                </Typography>
                {reportResult ? (
                  <>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Found {reportResult.total} records
                    </Alert>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {reportResult.columns?.map((col) => (
                              <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                                {col}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportResult.data?.slice(0, 20).map((row, idx) => (
                            <TableRow key={idx} hover>
                              {reportResult.columns?.map((col) => (
                                <TableCell key={col}>
                                  {row[col] !== null && row[col] !== undefined
                                    ? String(row[col])
                                    : '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {reportResult.data?.length > 20 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Showing 20 of {reportResult.data.length} records
                      </Typography>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                    }}
                  >
                    <Box textAlign="center">
                      <TabularIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">
                        Configure your report and click "Preview" to see results
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
