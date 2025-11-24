'use client';

import { useEffect, useState } from 'react';
import {
  Box,
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
  Paper,
  Button,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardLayout from '@/components/DashboardLayout';

interface WorkflowAction {
  type: string;
  field?: string;
  value?: string;
  subject?: string;
  priority?: string;
  dueInDays?: number;
  template?: string;
  to?: string;
  activityType?: string;
  content?: string;
  recipient?: string;
  message?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  objectType: string;
  triggerType: string;
  conditions: any;
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectType: 'Lead',
    triggerType: 'field_update',
    conditions: '{}',
    actions: '[]',
    isActive: true,
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update workflow');
      fetchWorkflows();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenDialog = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setFormData({
        name: workflow.name,
        description: workflow.description || '',
        objectType: workflow.objectType,
        triggerType: workflow.triggerType,
        conditions: JSON.stringify(workflow.conditions, null, 2),
        actions: JSON.stringify(workflow.actions, null, 2),
        isActive: workflow.isActive,
      });
    } else {
      setEditingWorkflow(null);
      setFormData({
        name: '',
        description: '',
        objectType: 'Lead',
        triggerType: 'field_update',
        conditions: '{}',
        actions: '[]',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleSaveWorkflow = async () => {
    if (!formData.name || !formData.conditions || !formData.actions) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const parsedConditions = JSON.parse(formData.conditions);
      const parsedActions = JSON.parse(formData.actions);

      setSaving(true);
      const url = editingWorkflow ? `/api/workflows/${editingWorkflow.id}` : '/api/workflows';
      const method = editingWorkflow ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          objectType: formData.objectType,
          triggerType: formData.triggerType,
          conditions: parsedConditions,
          actions: parsedActions,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to save workflow');

      setOpenDialog(false);
      setEditingWorkflow(null);
      fetchWorkflows();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');
      fetchWorkflows();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'field_update':
        return 'Field Update';
      case 'record_created':
        return 'Record Created';
      case 'time_based':
        return 'Time-Based';
      default:
        return type;
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'field_update':
        return 'primary';
      case 'record_created':
        return 'success';
      case 'time_based':
        return 'warning';
      default:
        return 'default';
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

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Workflow Automation</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Workflow
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Object Type</TableCell>
                    <TableCell>Trigger</TableCell>
                    <TableCell>Actions</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workflows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          No workflows found. Create your first workflow to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    workflows.map((workflow) => (
                      <TableRow
                        key={workflow.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedWorkflow(workflow);
                          setOpenDetailsDialog(true);
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {workflow.name}
                            </Typography>
                            {workflow.description && (
                              <Typography variant="body2" color="text.secondary">
                                {workflow.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={workflow.objectType} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTriggerTypeLabel(workflow.triggerType)}
                            size="small"
                            color={getTriggerTypeColor(workflow.triggerType) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={workflow.isActive}
                            onChange={() => handleToggleActive(workflow)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Workflow Details Dialog */}
        <Dialog
          open={openDetailsDialog}
          onClose={() => setOpenDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{selectedWorkflow?.name}</Typography>
              <Chip
                label={selectedWorkflow?.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={selectedWorkflow?.isActive ? 'success' : 'default'}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedWorkflow && (
              <Box sx={{ pt: 2 }}>
                {selectedWorkflow.description && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">{selectedWorkflow.description}</Typography>
                  </Box>
                )}

                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Object Type
                  </Typography>
                  <Chip label={selectedWorkflow.objectType} size="small" />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Trigger Type
                  </Typography>
                  <Chip
                    label={getTriggerTypeLabel(selectedWorkflow.triggerType)}
                    size="small"
                    color={getTriggerTypeColor(selectedWorkflow.triggerType) as any}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Conditions
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {selectedWorkflow.conditions && typeof selectedWorkflow.conditions === 'object' ? (
                      <Box>
                        {Object.entries(selectedWorkflow.conditions).map(([key, value]: [string, any]) => (
                          <Box key={key} mb={1}>
                            <Typography variant="body2">
                              <strong>{key}:</strong>{' '}
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No conditions defined
                      </Typography>
                    )}
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Actions ({selectedWorkflow.actions.length})
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {selectedWorkflow.actions.length > 0 ? (
                      selectedWorkflow.actions.map((action: WorkflowAction, index: number) => (
                        <Box
                          key={index}
                          mb={2}
                          pb={index < selectedWorkflow.actions.length - 1 ? 2 : 0}
                          sx={{
                            borderBottom:
                              index < selectedWorkflow.actions.length - 1
                                ? '1px solid #e0e0e0'
                                : 'none',
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Action {index + 1}: {action.type.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          {action.field && (
                            <Typography variant="body2" color="text.secondary">
                              • Field: {action.field}
                            </Typography>
                          )}
                          {action.value && (
                            <Typography variant="body2" color="text.secondary">
                              • Value: {action.value}
                            </Typography>
                          )}
                          {action.subject && (
                            <Typography variant="body2" color="text.secondary">
                              • Subject: {action.subject}
                            </Typography>
                          )}
                          {action.priority && (
                            <Typography variant="body2" color="text.secondary">
                              • Priority: {action.priority}
                            </Typography>
                          )}
                          {action.dueInDays !== undefined && (
                            <Typography variant="body2" color="text.secondary">
                              • Due in: {action.dueInDays} days
                            </Typography>
                          )}
                          {action.template && (
                            <Typography variant="body2" color="text.secondary">
                              • Template: {action.template}
                            </Typography>
                          )}
                          {action.to && (
                            <Typography variant="body2" color="text.secondary">
                              • To: {action.to}
                            </Typography>
                          )}
                          {action.activityType && (
                            <Typography variant="body2" color="text.secondary">
                              • Activity Type: {action.activityType}
                            </Typography>
                          )}
                          {action.content && (
                            <Typography variant="body2" color="text.secondary">
                              • Content: {action.content}
                            </Typography>
                          )}
                          {action.recipient && (
                            <Typography variant="body2" color="text.secondary">
                              • Recipient: {action.recipient}
                            </Typography>
                          )}
                          {action.message && (
                            <Typography variant="body2" color="text.secondary">
                              • Message: {action.message}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No actions defined
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                select
                label="Object Type"
                value={formData.objectType}
                onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                fullWidth
                required
              >
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Contact">Contact</MenuItem>
                <MenuItem value="Opportunity">Opportunity</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
              </TextField>
              <TextField
                select
                label="Trigger Type"
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                fullWidth
                required
              >
                <MenuItem value="field_update">Field Update</MenuItem>
                <MenuItem value="record_created">Record Created</MenuItem>
                <MenuItem value="time_based">Time-Based</MenuItem>
              </TextField>
              <TextField
                label="Conditions (JSON)"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                fullWidth
                multiline
                rows={6}
                required
                helperText="Enter conditions as valid JSON"
                sx={{ fontFamily: 'monospace' }}
              />
              <TextField
                label="Actions (JSON)"
                value={formData.actions}
                onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                fullWidth
                multiline
                rows={8}
                required
                helperText="Enter actions as valid JSON array"
                sx={{ fontFamily: 'monospace' }}
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="primary"
                />
                <Typography>Active</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveWorkflow}
              variant="contained"
              disabled={saving || !formData.name}
            >
              {saving ? 'Saving...' : editingWorkflow ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
