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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Category as ObjectIcon,
  CheckCircle as ActiveIcon,
  Storage as FieldIcon,
  DataObject as RecordIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Code as ApiIcon,
  Save as SaveIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';

interface CustomObject {
  id: string;
  name: string;
  label: string;
  pluralLabel: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  fields?: CustomField[];
  _count?: { fields?: number; records?: number };
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  unique: boolean;
  defaultValue: string | null;
  picklistValues: string[] | null;
  order: number;
}

interface CustomRecord {
  id: string;
  name: string;
  data: Record<string, any>;
  owner: { id: string; name: string | null } | null;
  createdAt: string;
}

interface Stats {
  totalObjects: number;
  activeObjects: number;
  totalFields: number;
  totalRecords: number;
}

const fieldTypes = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'DATE', label: 'Date' },
  { value: 'DATETIME', label: 'Date/Time' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'PICKLIST', label: 'Picklist' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'URL', label: 'URL' },
  { value: 'TEXTAREA', label: 'Text Area' },
];

export default function CustomObjectsPage() {
  const [objects, setObjects] = useState<CustomObject[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalObjects: 0,
    activeObjects: 0,
    totalFields: 0,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showObjectDialog, setShowObjectDialog] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CustomObject | null>(null);
  const [records, setRecords] = useState<CustomRecord[]>([]);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [objectFormData, setObjectFormData] = useState({
    name: '',
    label: '',
    pluralLabel: '',
    description: '',
    fields: [] as { name: string; label: string; type: string; required: boolean; unique: boolean }[],
  });

  const [recordFormData, setRecordFormData] = useState<Record<string, any>>({});
  const [selectedRecord, setSelectedRecord] = useState<CustomRecord | null>(null);
  const [recordDetailOpen, setRecordDetailOpen] = useState(false);
  const [recordEditMode, setRecordEditMode] = useState(false);
  const [recordEditFormData, setRecordEditFormData] = useState<Record<string, any>>({});
  const [recordEditSaving, setRecordEditSaving] = useState(false);
  const [objectDetailOpen, setObjectDetailOpen] = useState(false);
  const [objectEditMode, setObjectEditMode] = useState(false);
  const [objectEditFormData, setObjectEditFormData] = useState({ label: '', pluralLabel: '', description: '' });
  const [objectEditSaving, setObjectEditSaving] = useState(false);

  const { confirm } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (selectedObject) {
      fetchRecords(selectedObject.id);
    }
  }, [selectedObject]);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/custom-objects?includeFields=true');
      const data = await res.json();

      const arr = Array.isArray(data) ? data : data.data || [];
      setObjects(arr);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (objectId: string) => {
    try {
      setLoadingRecords(true);
      const res = await fetch(`/api/custom-objects/${objectId}/records`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : data.data || data.records || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleObjectSubmit = async () => {
    try {
      const apiName = objectFormData.name.replace(/\s+/g, '_') + '__c';
      const res = await fetch('/api/custom-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...objectFormData,
          name: apiName,
          fields: objectFormData.fields.map((f, i) => ({
            ...f,
            name: f.name.replace(/\s+/g, '_') + '__c',
            order: i,
          })),
        }),
      });

      if (res.ok) {
        setShowObjectDialog(false);
        resetObjectForm();
        fetchObjects();
      }
    } catch (error) {
      console.error('Error creating object:', error);
    }
  };

  const handleRecordSubmit = async () => {
    if (!selectedObject) return;

    try {
      const res = await fetch(`/api/custom-objects/${selectedObject.id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recordFormData.Name || 'New Record',
          data: recordFormData,
        }),
      });

      if (res.ok) {
        setShowRecordDialog(false);
        setRecordFormData({});
        fetchRecords(selectedObject.id);
      }
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const resetObjectForm = () => {
    setObjectFormData({
      name: '',
      label: '',
      pluralLabel: '',
      description: '',
      fields: [],
    });
  };

  const addField = () => {
    setObjectFormData({
      ...objectFormData,
      fields: [...objectFormData.fields, { name: '', label: '', type: 'TEXT', required: false, unique: false }],
    });
  };

  const updateField = (index: number, field: string, value: any) => {
    const fields = [...objectFormData.fields];
    fields[index] = { ...fields[index], [field]: value };
    if (field === 'label') {
      fields[index].name = value;
    }
    setObjectFormData({ ...objectFormData, fields });
  };

  const removeField = (index: number) => {
    setObjectFormData({
      ...objectFormData,
      fields: objectFormData.fields.filter((_, i) => i !== index),
    });
  };

  // Record detail handlers
  const handleRecordRowClick = (record: CustomRecord) => {
    setSelectedRecord(record);
    setRecordEditMode(false);
    setRecordDetailOpen(true);
  };

  const handleStartRecordEdit = () => {
    if (!selectedRecord) return;
    setRecordEditFormData({ Name: selectedRecord.name, ...selectedRecord.data });
    setRecordEditMode(true);
  };

  const handleSaveRecordEdit = async () => {
    if (!selectedRecord || !selectedObject) return;
    setRecordEditSaving(true);
    try {
      const { Name, ...data } = recordEditFormData;
      const res = await fetch(`/api/custom-objects/${selectedObject.id}/records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: selectedRecord.id, name: Name, data }),
      });
      if (!res.ok) throw new Error('Failed to update record');
      showSuccess('Record updated successfully');
      setRecordEditMode(false);
      setRecordDetailOpen(false);
      fetchRecords(selectedObject.id);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setRecordEditSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!selectedObject) return;
    const confirmed = await confirm({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/custom-objects/${selectedObject.id}/records?recordId=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      showSuccess('Record deleted successfully');
      setRecordDetailOpen(false);
      setSelectedRecord(null);
      fetchRecords(selectedObject.id);
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Object detail handlers
  const handleObjectDetailClick = (obj: CustomObject) => {
    setSelectedObject(obj);
    setObjectEditMode(false);
    setObjectDetailOpen(true);
  };

  const handleStartObjectEdit = () => {
    if (!selectedObject) return;
    setObjectEditFormData({
      label: selectedObject.label || '',
      pluralLabel: selectedObject.pluralLabel || '',
      description: selectedObject.description || '',
    });
    setObjectEditMode(true);
  };

  const handleSaveObjectEdit = async () => {
    if (!selectedObject) return;
    setObjectEditSaving(true);
    try {
      const res = await fetch('/api/custom-objects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedObject.id, ...objectEditFormData }),
      });
      if (!res.ok) throw new Error('Failed to update object');
      showSuccess('Object updated successfully');
      setObjectEditMode(false);
      setObjectDetailOpen(false);
      fetchObjects();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setObjectEditSaving(false);
    }
  };

  const handleDeleteObject = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Custom Object',
      message: 'Are you sure you want to delete this custom object and all its records?',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/custom-objects?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete object');
      showSuccess('Object deleted successfully');
      setObjectDetailOpen(false);
      setSelectedObject(null);
      fetchObjects();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const getFieldTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'TEXT':
      case 'TEXTAREA':
        return 'primary';
      case 'NUMBER':
      case 'CURRENCY':
        return 'secondary';
      case 'DATE':
      case 'DATETIME':
        return 'info';
      case 'CHECKBOX':
        return 'success';
      case 'PICKLIST':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderFieldInput = (field: CustomField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'NUMBER':
      case 'CURRENCY':
        return (
          <TextField
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            fullWidth
            size="small"
          />
        );
      case 'DATE':
        return (
          <TextField
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'DATETIME':
        return (
          <TextField
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'CHECKBOX':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => onChange(e.target.checked)}
              />
            }
            label=""
          />
        );
      case 'PICKLIST':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            >
              <MenuItem value="">Select...</MenuItem>
              {(field.picklistValues || []).map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'TEXTAREA':
        return (
          <TextField
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        );
      case 'EMAIL':
        return (
          <TextField
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
          />
        );
      case 'PHONE':
        return (
          <TextField
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
          />
        );
      case 'URL':
        return (
          <TextField
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
          />
        );
      default:
        return (
          <TextField
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Custom Objects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage custom data objects for your CRM
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowObjectDialog(true)}
          >
            New Object
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ObjectIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Objects
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                  {stats.totalObjects}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ActiveIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Active Objects
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>
                  {stats.activeObjects}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FieldIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Total Fields
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ mt: 1 }}>
                  {stats.totalFields}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecordIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mt: 1 }}>
                  {stats.totalRecords.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Objects List */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Objects</Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : objects.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <ObjectIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No custom objects yet</Typography>
                  <Button
                    variant="text"
                    onClick={() => setShowObjectDialog(true)}
                    sx={{ mt: 1 }}
                  >
                    Create your first object
                  </Button>
                </Box>
              ) : (
                <List>
                  {objects.map((obj) => (
                    <ListItemButton
                      key={obj.id}
                      selected={selectedObject?.id === obj.id}
                      onClick={() => setSelectedObject(obj)}
                      sx={{
                        borderLeft: selectedObject?.id === obj.id ? 3 : 0,
                        borderColor: 'primary.main',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="medium" sx={{ flex: 1 }}>{obj.label}</Typography>
                            <Chip
                              label={obj.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={obj.isActive ? 'success' : 'default'}
                              variant="outlined"
                            />
                            <Tooltip title="Object Details">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleObjectDetailClick(obj); }}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {obj.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {obj._count?.fields || (obj.fields ? obj.fields.length : 0)} fields
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {obj._count?.records || 0} records
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Records View */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ height: '100%', minHeight: 400 }}>
              {selectedObject ? (
                <>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{selectedObject.pluralLabel}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedObject.description || 'No description'}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setRecordFormData({});
                        setShowRecordDialog(true);
                      }}
                    >
                      New Record
                    </Button>
                  </Box>

                  {/* Fields Info */}
                  {selectedObject.fields && selectedObject.fields.length > 0 && (
                    <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedObject.fields.map((field) => (
                          <Chip
                            key={field.id}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {field.label}
                                {field.required && <span style={{ color: 'red' }}>*</span>}
                              </Box>
                            }
                            size="small"
                            color={getFieldTypeColor(field.type)}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Records Table */}
                  <TableContainer>
                    {loadingRecords ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : records.length === 0 ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <RecordIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary">No records yet</Typography>
                        <Button
                          variant="text"
                          onClick={() => setShowRecordDialog(true)}
                          sx={{ mt: 1 }}
                        >
                          Create your first record
                        </Button>
                      </Box>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            {selectedObject.fields?.slice(0, 4).map((field) => (
                              <TableCell key={field.id}>{field.label}</TableCell>
                            ))}
                            <TableCell>Created</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {records.map((record) => (
                            <TableRow key={record.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRecordRowClick(record)}>
                              <TableCell>
                                <Typography fontWeight="medium">{record.name}</Typography>
                              </TableCell>
                              {selectedObject.fields?.slice(0, 4).map((field) => (
                                <TableCell key={field.id}>
                                  <Typography variant="body2" color="text.secondary">
                                    {String(record.data[field.name] ?? '-')}
                                  </Typography>
                                </TableCell>
                              ))}
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TableContainer>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ObjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      Select an object to view its records
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* New Object Dialog */}
        <Dialog
          open={showObjectDialog}
          onClose={() => setShowObjectDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Custom Object</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Label"
                  value={objectFormData.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setObjectFormData({
                      ...objectFormData,
                      label,
                      name: label,
                      pluralLabel: objectFormData.pluralLabel || label + 's',
                    });
                  }}
                  fullWidth
                  required
                  placeholder="e.g., Project"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Plural Label"
                  value={objectFormData.pluralLabel}
                  onChange={(e) => setObjectFormData({ ...objectFormData, pluralLabel: e.target.value })}
                  fullWidth
                  placeholder="e.g., Projects"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApiIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    API Name: <code>{objectFormData.name.replace(/\s+/g, '_')}__c</code>
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  value={objectFormData.description}
                  onChange={(e) => setObjectFormData({ ...objectFormData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Custom Fields
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addField}>
                    Add Field
                  </Button>
                </Box>

                {objectFormData.fields.length === 0 ? (
                  <Alert severity="info">
                    No custom fields defined. Click "Add Field" to create fields.
                  </Alert>
                ) : (
                  objectFormData.fields.map((field, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Field Label"
                            value={field.label}
                            onChange={(e) => {
                              updateField(index, 'label', e.target.value);
                            }}
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
                              {fieldTypes.map((ft) => (
                                <MenuItem key={ft.value} value={ft.value}>
                                  {ft.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
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
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={field.unique}
                                onChange={(e) => updateField(index, 'unique', e.target.checked)}
                                size="small"
                              />
                            }
                            label="Unique"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1 }}>
                          <IconButton
                            color="error"
                            onClick={() => removeField(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowObjectDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleObjectSubmit}
              disabled={!objectFormData.label}
            >
              Create Object
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Record Dialog */}
        <Dialog
          open={showRecordDialog}
          onClose={() => setShowRecordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedObject && (
            <>
              <DialogTitle>New {selectedObject.label}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Record Name"
                      value={recordFormData.Name || ''}
                      onChange={(e) => setRecordFormData({ ...recordFormData, Name: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  {selectedObject.fields?.map((field) => (
                    <Grid size={{ xs: 12 }} key={field.id}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {field.label}
                        {field.required && <span style={{ color: 'red' }}> *</span>}
                      </Typography>
                      {renderFieldInput(
                        field,
                        recordFormData[field.name],
                        (value) => setRecordFormData({ ...recordFormData, [field.name]: value })
                      )}
                    </Grid>
                  ))}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowRecordDialog(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleRecordSubmit}
                  disabled={!recordFormData.Name}
                >
                  Create Record
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Record Detail Dialog */}
        <Dialog open={recordDetailOpen} onClose={() => { setRecordDetailOpen(false); setRecordEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {recordEditMode ? 'Edit Record' : 'Record Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedRecord && !recordEditMode && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography gutterBottom>{selectedRecord.name}</Typography>
                {selectedObject?.fields?.map((field) => (
                  <Box key={field.id}>
                    <Typography variant="subtitle2" color="text.secondary">{field.label}</Typography>
                    <Typography gutterBottom>{String(selectedRecord.data[field.name] ?? 'N/A')}</Typography>
                  </Box>
                ))}
                <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                <Typography gutterBottom>{selectedRecord.owner?.name || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography>{new Date(selectedRecord.createdAt).toLocaleString()}</Typography>
              </Box>
            )}
            {selectedRecord && recordEditMode && (
              <Box>
                <TextField
                  label="Record Name"
                  value={recordEditFormData.Name || ''}
                  onChange={(e) => setRecordEditFormData({ ...recordEditFormData, Name: e.target.value })}
                  fullWidth
                  margin="normal"
                />
                {selectedObject?.fields?.map((field) => (
                  <Box key={field.id} sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {field.label}
                      {field.required && <span style={{ color: 'red' }}> *</span>}
                    </Typography>
                    {renderFieldInput(
                      field,
                      recordEditFormData[field.name],
                      (value) => setRecordEditFormData({ ...recordEditFormData, [field.name]: value })
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!recordEditMode ? (
              <>
                <Button onClick={() => { setRecordDetailOpen(false); setRecordEditMode(false); }}>Close</Button>
                <Button startIcon={<EditIcon />} onClick={handleStartRecordEdit}>Edit</Button>
                <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedRecord && handleDeleteRecord(selectedRecord.id)}>Delete</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setRecordEditMode(false)} startIcon={<CancelIcon />}>Cancel</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveRecordEdit} disabled={recordEditSaving}>
                  {recordEditSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Object Detail Dialog */}
        <Dialog open={objectDetailOpen} onClose={() => { setObjectDetailOpen(false); setObjectEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {objectEditMode ? 'Edit Custom Object' : 'Custom Object Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedObject && !objectEditMode && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Label</Typography>
                <Typography gutterBottom>{selectedObject.label}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Plural Label</Typography>
                <Typography gutterBottom>{selectedObject.pluralLabel}</Typography>
                <Typography variant="subtitle2" color="text.secondary">API Name</Typography>
                <Typography gutterBottom sx={{ fontFamily: 'monospace' }}>{selectedObject.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography gutterBottom>{selectedObject.description || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip label={selectedObject.isActive ? 'Active' : 'Inactive'} size="small" color={selectedObject.isActive ? 'success' : 'default'} />
                </Box>
                <Typography variant="subtitle2" color="text.secondary">Fields</Typography>
                <Typography gutterBottom>{selectedObject._count?.fields || (selectedObject.fields ? selectedObject.fields.length : 0)}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Records</Typography>
                <Typography gutterBottom>{selectedObject._count?.records || 0}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography>{new Date(selectedObject.createdAt).toLocaleString()}</Typography>
              </Box>
            )}
            {selectedObject && objectEditMode && (
              <Box>
                <TextField
                  label="Label"
                  value={objectEditFormData.label}
                  onChange={(e) => setObjectEditFormData({ ...objectEditFormData, label: e.target.value })}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Plural Label"
                  value={objectEditFormData.pluralLabel}
                  onChange={(e) => setObjectEditFormData({ ...objectEditFormData, pluralLabel: e.target.value })}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Description"
                  value={objectEditFormData.description}
                  onChange={(e) => setObjectEditFormData({ ...objectEditFormData, description: e.target.value })}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!objectEditMode ? (
              <>
                <Button onClick={() => { setObjectDetailOpen(false); setObjectEditMode(false); }}>Close</Button>
                <Button startIcon={<EditIcon />} onClick={handleStartObjectEdit}>Edit</Button>
                <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedObject && handleDeleteObject(selectedObject.id)}>Delete</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setObjectEditMode(false)} startIcon={<CancelIcon />}>Cancel</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveObjectEdit} disabled={objectEditSaving}>
                  {objectEditSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
