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
} from '@mui/icons-material';

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

      if (data.objects) {
        setObjects(data.objects);
        setStats(data.stats);
      } else if (Array.isArray(data)) {
        setObjects(data);
      }
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
      setRecords(data.records || []);
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
                            <Typography fontWeight="medium">{obj.label}</Typography>
                            <Chip
                              label={obj.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={obj.isActive ? 'success' : 'default'}
                              variant="outlined"
                            />
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
                            <TableRow key={record.id} hover>
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
      </Box>
    </DashboardLayout>
  );
}
