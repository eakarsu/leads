'use client';

import { useState, useEffect, useRef } from 'react';
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
  Grid,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Sync as ProcessingIcon,
  Storage as ImportIcon,
  DataObject as RecordsIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ImportJob {
  id: string;
  name: string;
  objectType: string;
  fileName: string;
  fileSize: number;
  status: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  duplicateRows: number;
  duplicateHandling: string;
  errorLog: any[] | null;
  createdAt: string;
  completedAt: string | null;
}

interface Stats {
  totalImports: number;
  completedImports: number;
  processingImports: number;
  failedImports: number;
  totalRecordsImported: number;
  totalRecordsFailed: number;
}

const steps = ['Upload File', 'Map Fields', 'Review & Import'];

export default function DataImportPage() {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalImports: 0,
    completedImports: 0,
    processingImports: 0,
    failedImports: 0,
    totalRecordsImported: 0,
    totalRecordsFailed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    objectType: 'Lead',
    duplicateHandling: 'SKIP',
    fieldMapping: {} as Record<string, string>,
  });

  const targetFields: Record<string, string[]> = {
    Lead: ['fullName', 'email', 'phone', 'company', 'title', 'source', 'status', 'notes'],
    Contact: ['firstName', 'lastName', 'email', 'phone', 'title', 'department', 'mailingCity', 'mailingState'],
    Account: ['name', 'website', 'phone', 'industry', 'type', 'billingCity', 'billingState', 'billingCountry'],
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data-import');
      const data = await res.json();

      if (data.imports) {
        setImports(data.imports);
        setStats(data.stats);
      } else if (Array.isArray(data)) {
        setImports(data);
      } else if (data.data) {
        setImports(data.data);
      }
    } catch (error) {
      console.error('Error fetching imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);

      const rows = text.split('\n').filter((row) => row.trim());
      const headerRow = rows[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      setHeaders(headerRow);

      const preview = rows.slice(1, 6).map((row) => row.split(',').map((v) => v.trim().replace(/"/g, '')));
      setPreviewRows(preview);

      setFormData({
        ...formData,
        name: file.name.replace('.csv', '') + ' Import',
      });

      setActiveStep(1);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      // Create import job
      const createRes = await fetch('/api/data-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileName: formData.name + '.csv',
          fileSize: csvData.length,
          csvData,
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create import job');
      }

      const importJob = await createRes.json();

      // Start processing
      const processRes = await fetch('/api/data-import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId: importJob.id,
          action: 'start',
          csvData,
        }),
      });

      if (processRes.ok) {
        resetWizard();
        fetchImports();
      }
    } catch (error) {
      console.error('Error processing import:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetWizard = () => {
    setActiveStep(0);
    setCsvData('');
    setHeaders([]);
    setPreviewRows([]);
    setFormData({
      name: '',
      objectType: 'Lead',
      duplicateHandling: 'SKIP',
      fieldMapping: {},
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <SuccessIcon color="success" />;
      case 'PROCESSING':
        return <ProcessingIcon color="info" className="animate-spin" />;
      case 'FAILED':
        return <ErrorIcon color="error" />;
      case 'PARTIALLY_COMPLETED':
        return <WarningIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'info' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'info';
      case 'FAILED':
        return 'error';
      case 'PARTIALLY_COMPLETED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getProgressPercent = (job: ImportJob) => {
    if (job.totalRows === 0) return 0;
    return Math.round((job.processedRows / job.totalRows) * 100);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Data Import
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Import records from CSV files into your CRM
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchImports}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImportIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Imports
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                  {stats.totalImports}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuccessIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>
                  {stats.completedImports}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProcessingIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Processing
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ mt: 1 }}>
                  {stats.processingImports}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecordsIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Records Imported
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mt: 1 }}>
                  {stats.totalRecordsImported.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="body2" color="text.secondary">
                    Records Failed
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mt: 1 }}>
                  {stats.totalRecordsFailed.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Import Wizard */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              New Import
            </Typography>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Step 0: Upload */}
            {activeStep === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  style={{ display: 'none' }}
                />
                <Paper
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    mx: 'auto',
                    maxWidth: 400,
                    p: 4,
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to upload CSV file
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or drag and drop
                  </Typography>
                </Paper>
                <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tips:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                    <li>First row should contain column headers</li>
                    <li>Use comma-separated values (.csv format)</li>
                    <li>Maximum file size: 10MB</li>
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Step 1: Map Fields */}
            {activeStep === 1 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Import Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Object Type</InputLabel>
                      <Select
                        value={formData.objectType}
                        label="Object Type"
                        onChange={(e) => setFormData({ ...formData, objectType: e.target.value, fieldMapping: {} })}
                      >
                        <MenuItem value="Lead">Lead</MenuItem>
                        <MenuItem value="Contact">Contact</MenuItem>
                        <MenuItem value="Account">Account</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Duplicate Handling
                  </Typography>
                  <RadioGroup
                    row
                    value={formData.duplicateHandling}
                    onChange={(e) => setFormData({ ...formData, duplicateHandling: e.target.value })}
                  >
                    <FormControlLabel value="SKIP" control={<Radio />} label="Skip duplicates" />
                    <FormControlLabel value="UPDATE" control={<Radio />} label="Update existing" />
                    <FormControlLabel value="CREATE_NEW" control={<Radio />} label="Create new" />
                  </RadioGroup>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Field Mapping
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>CSV Column</TableCell>
                        <TableCell>Maps To</TableCell>
                        <TableCell>Preview</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {headers.map((header, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography fontWeight="medium">{header}</Typography>
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={formData.fieldMapping[header] || ''}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fieldMapping: { ...formData.fieldMapping, [header]: e.target.value },
                                  })
                                }
                                displayEmpty
                              >
                                <MenuItem value="">
                                  <em>-- Do not import --</em>
                                </MenuItem>
                                {targetFields[formData.objectType]?.map((field) => (
                                  <MenuItem key={field} value={field}>
                                    {field}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {previewRows[0]?.[index] || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={resetWizard}>Back</Button>
                  <Button variant="contained" onClick={() => setActiveStep(2)}>
                    Continue
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 2: Review */}
            {activeStep === 2 && (
              <Box>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Import Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Import Name
                      </Typography>
                      <Typography fontWeight="medium">{formData.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Object Type
                      </Typography>
                      <Typography fontWeight="medium">{formData.objectType}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Rows
                      </Typography>
                      <Typography fontWeight="medium">
                        {csvData.split('\n').filter((r) => r.trim()).length - 1}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Duplicate Handling
                      </Typography>
                      <Typography fontWeight="medium">{formData.duplicateHandling}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle2" gutterBottom>
                  Field Mappings
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {Object.entries(formData.fieldMapping)
                    .filter(([, target]) => target)
                    .map(([source, target]) => (
                      <Box key={source} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={source} size="small" />
                        <ArrowIcon fontSize="small" color="action" />
                        <Chip label={target} size="small" color="primary" variant="outlined" />
                      </Box>
                    ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => setActiveStep(1)}>Back</Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  >
                    {uploading ? 'Processing...' : 'Start Import'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Import History */}
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Import History</Typography>
          </Box>
          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : imports.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ImportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">No imports yet</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Import Name</TableCell>
                    <TableCell>Object</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell align="right">Results</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {imports.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{job.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.fileName} ({formatFileSize(job.fileSize)})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={job.objectType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(job.status)}
                          label={job.status.replace('_', ' ')}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getProgressPercent(job)}
                            sx={{ width: 80, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {job.processedRows}/{job.totalRows}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {job.successRows} success
                        </Typography>
                        {job.failedRows > 0 && (
                          <Typography variant="body2" color="error.main">
                            {job.failedRows} failed
                          </Typography>
                        )}
                        {job.duplicateRows > 0 && (
                          <Typography variant="body2" color="warning.main">
                            {job.duplicateRows} duplicates
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => setSelectedImport(job)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
