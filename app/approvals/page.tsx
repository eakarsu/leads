'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import GavelIcon from '@mui/icons-material/Gavel';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';

interface ApprovalStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  approverType: string;
  approverIds: string[];
  unanimousApproval: boolean;
  rejectBehavior: string;
}

interface ApprovalProcess {
  id: string;
  name: string;
  description?: string;
  objectType: string;
  isActive: boolean;
  allowRecall: boolean;
  steps: ApprovalStep[];
  _count?: { instances: number };
}

interface ApprovalAction {
  id: string;
  stepNumber: number;
  actorId: string;
  action: string;
  comments?: string;
  actionAt: string;
}

interface ApprovalInstance {
  id: string;
  processId: string;
  objectType: string;
  objectId: string;
  submittedBy: string;
  status: string;
  currentStep: number;
  comments?: string;
  submittedAt: string;
  completedAt?: string;
  process: ApprovalProcess & { steps: ApprovalStep[] };
  actions: ApprovalAction[];
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalInstance[]>([]);
  const [mySubmissions, setMySubmissions] = useState<ApprovalInstance[]>([]);
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionDialog, setActionDialog] = useState<{ open: boolean; instanceId: string; action: string }>({
    open: false, instanceId: '', action: '',
  });
  const [comments, setComments] = useState('');
  const [processDialog, setProcessDialog] = useState(false);
  const [processForm, setProcessForm] = useState({
    name: '',
    description: '',
    objectType: 'Lead',
    allowRecall: true,
    steps: [{ name: 'Step 1', approverIds: [] as string[], unanimousApproval: false, rejectBehavior: 'FINAL' }],
  });
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ApprovalProcess | null>(null);
  const [processDetailOpen, setProcessDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [instanceDetailOpen, setInstanceDetailOpen] = useState(false);

  const { confirm } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchAll();
    fetchUsers();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingRes, processesRes, submissionsRes] = await Promise.all([
        fetch('/api/approvals'),
        fetch('/api/approvals?type=processes'),
        fetch('/api/approvals?submittedBy=me'),
      ]);

      if (pendingRes.ok) {
        const pd = await pendingRes.json();
        setPendingApprovals(Array.isArray(pd) ? pd : pd.data || []);
      }
      if (processesRes.ok) {
        const pr = await processesRes.json();
        setProcesses(Array.isArray(pr) ? pr : pr.data || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setMySubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // Users fetch is optional
    }
  };

  const handleAction = async (action: string, instanceId: string) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, instanceId, comments }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      setSuccess(`Successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'recalled'}`);
      setActionDialog({ open: false, instanceId: '', action: '' });
      setComments('');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateProcess = async () => {
    if (!processForm.name) {
      setError('Process name is required');
      return;
    }
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create process');
      }
      setSuccess('Approval process created');
      setProcessDialog(false);
      setProcessForm({
        name: '',
        description: '',
        objectType: 'Lead',
        allowRecall: true,
        steps: [{ name: 'Step 1', approverIds: [], unanimousApproval: false, rejectBehavior: 'FINAL' }],
      });
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleProcessRowClick = (process: ApprovalProcess) => {
    setSelectedProcess(process);
    setEditMode(false);
    setProcessDetailOpen(true);
  };

  const handleInstanceRowClick = (instance: ApprovalInstance) => {
    setSelectedInstance(instance);
    setInstanceDetailOpen(true);
  };

  const handleStartEditProcess = () => {
    if (!selectedProcess) return;
    setEditFormData({
      name: selectedProcess.name || '',
      description: selectedProcess.description || '',
    });
    setEditMode(true);
  };

  const handleSaveEditProcess = async () => {
    if (!selectedProcess) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProcess.id, ...editFormData }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      showSuccess('Process updated successfully');
      setEditMode(false);
      setProcessDetailOpen(false);
      fetchAll();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Approval Process',
      message: 'Are you sure you want to delete this approval process? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/approvals?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      showSuccess('Process deleted successfully');
      setProcessDetailOpen(false);
      setSelectedProcess(null);
      fetchAll();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const getStatusChip = (status: string) => {
    const colorMap: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      RECALLED: 'default',
    };
    return <Chip label={status} size="small" color={colorMap[status] || 'default'} />;
  };

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <GavelIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Approvals</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setProcessDialog(true)}>
            New Process
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label={`My Pending (${pendingApprovals.length})`} />
          <Tab label={`My Submissions (${mySubmissions.length})`} />
          <Tab label={`Processes (${processes.length})`} />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tab 0: My Pending */}
            {tab === 0 && (
              <Card>
                <CardContent>
                  {pendingApprovals.length === 0 ? (
                    <Typography color="text.secondary" align="center" py={4}>
                      No pending approvals
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Process</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Object Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Step</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Submitted</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingApprovals.map((instance) => (
                            <TableRow key={instance.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleInstanceRowClick(instance)}>
                              <TableCell>{instance.process.name}</TableCell>
                              <TableCell>{instance.objectType}</TableCell>
                              <TableCell>
                                Step {instance.currentStep} of {instance.process.steps.length}
                              </TableCell>
                              <TableCell>{new Date(instance.submittedAt).toLocaleDateString()}</TableCell>
                              <TableCell>{getStatusChip(instance.status)}</TableCell>
                              <TableCell>
                                <Tooltip title="Approve">
                                  <IconButton
                                    color="success"
                                    onClick={(e) => { e.stopPropagation(); setActionDialog({ open: true, instanceId: instance.id, action: 'approve' }); }}
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    color="error"
                                    onClick={(e) => { e.stopPropagation(); setActionDialog({ open: true, instanceId: instance.id, action: 'reject' }); }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab 1: My Submissions */}
            {tab === 1 && (
              <Card>
                <CardContent>
                  {mySubmissions.length === 0 ? (
                    <Typography color="text.secondary" align="center" py={4}>
                      No submissions yet
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Process</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Object Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Step</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Submitted</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mySubmissions.map((instance) => (
                            <TableRow key={instance.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleInstanceRowClick(instance)}>
                              <TableCell>{instance.process?.name || 'N/A'}</TableCell>
                              <TableCell>{instance.objectType}</TableCell>
                              <TableCell>
                                Step {instance.currentStep} of {instance.process?.steps?.length || '?'}
                              </TableCell>
                              <TableCell>{new Date(instance.submittedAt).toLocaleDateString()}</TableCell>
                              <TableCell>{getStatusChip(instance.status)}</TableCell>
                              <TableCell>
                                {instance.status === 'PENDING' && (
                                  <Tooltip title="Recall">
                                    <IconButton
                                      color="warning"
                                      onClick={(e) => { e.stopPropagation(); setActionDialog({ open: true, instanceId: instance.id, action: 'recall' }); }}
                                    >
                                      <UndoIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab 2: Processes */}
            {tab === 2 && (
              <Card>
                <CardContent>
                  {processes.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary" gutterBottom>
                        No approval processes configured
                      </Typography>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setProcessDialog(true)}>
                        Create First Process
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Object Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Steps</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Instances</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Recall</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {processes.map((process) => (
                            <TableRow key={process.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleProcessRowClick(process)}>
                              <TableCell>
                                <Typography variant="subtitle2">{process.name}</Typography>
                                {process.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {process.description}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{process.objectType}</TableCell>
                              <TableCell>{process.steps.length}</TableCell>
                              <TableCell>{process._count?.instances || 0}</TableCell>
                              <TableCell>
                                <Chip
                                  label={process.isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={process.isActive ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={process.allowRecall ? 'Allowed' : 'Disabled'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Action Dialog (Approve/Reject/Recall) */}
        <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, instanceId: '', action: '' })} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionDialog.action === 'approve' ? 'Approve Request' :
             actionDialog.action === 'reject' ? 'Reject Request' : 'Recall Submission'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Comments (optional)"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setActionDialog({ open: false, instanceId: '', action: '' }); setComments(''); }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={actionDialog.action === 'approve' ? 'success' : actionDialog.action === 'reject' ? 'error' : 'warning'}
              onClick={() => handleAction(actionDialog.action, actionDialog.instanceId)}
            >
              {actionDialog.action === 'approve' ? 'Approve' :
               actionDialog.action === 'reject' ? 'Reject' : 'Recall'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Process Dialog */}
        <Dialog open={processDialog} onClose={() => setProcessDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Approval Process</DialogTitle>
          <DialogContent>
            <TextField
              label="Process Name"
              value={processForm.name}
              onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Description"
              value={processForm.description}
              onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              select
              label="Object Type"
              value={processForm.objectType}
              onChange={(e) => setProcessForm({ ...processForm, objectType: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['Lead', 'Opportunity', 'Contact', 'Case', 'Quote', 'Contract', 'Order'].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Approval Steps</Typography>
            {processForm.steps.map((step, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Step {idx + 1}</Typography>
                  {processForm.steps.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const steps = processForm.steps.filter((_, i) => i !== idx);
                        setProcessForm({ ...processForm, steps });
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  label="Step Name"
                  value={step.name}
                  onChange={(e) => {
                    const steps = [...processForm.steps];
                    steps[idx] = { ...steps[idx], name: e.target.value };
                    setProcessForm({ ...processForm, steps });
                  }}
                  fullWidth
                  size="small"
                  margin="dense"
                />
                <TextField
                  select
                  label="Approver"
                  value={step.approverIds[0] || ''}
                  onChange={(e) => {
                    const steps = [...processForm.steps];
                    steps[idx] = { ...steps[idx], approverIds: e.target.value ? [e.target.value] : [] };
                    setProcessForm({ ...processForm, steps });
                  }}
                  fullWidth
                  size="small"
                  margin="dense"
                >
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                  ))}
                  {users.length === 0 && <MenuItem disabled>No users available</MenuItem>}
                </TextField>
              </Paper>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setProcessForm({
                  ...processForm,
                  steps: [...processForm.steps, {
                    name: `Step ${processForm.steps.length + 1}`,
                    approverIds: [],
                    unanimousApproval: false,
                    rejectBehavior: 'FINAL',
                  }],
                });
              }}
            >
              Add Step
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProcessDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateProcess} disabled={!processForm.name}>
              Create Process
            </Button>
          </DialogActions>
        </Dialog>
        {/* Process Detail Dialog */}
        <Dialog open={processDetailOpen} onClose={() => { setProcessDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Approval Process' : 'Approval Process Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedProcess && !editMode && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography gutterBottom>{selectedProcess.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography gutterBottom>{selectedProcess.description || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Object Type</Typography>
                <Typography gutterBottom>{selectedProcess.objectType}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip label={selectedProcess.isActive ? 'Active' : 'Inactive'} size="small" color={selectedProcess.isActive ? 'success' : 'default'} />
                </Box>
                <Typography variant="subtitle2" color="text.secondary">Allow Recall</Typography>
                <Typography gutterBottom>{selectedProcess.allowRecall ? 'Yes' : 'No'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Steps</Typography>
                <Typography gutterBottom>{selectedProcess.steps.length}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Instances</Typography>
                <Typography>{selectedProcess._count?.instances || 0}</Typography>
              </Box>
            )}
            {selectedProcess && editMode && (
              <Box>
                <TextField
                  label="Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!editMode ? (
              <>
                <Button onClick={() => { setProcessDetailOpen(false); setEditMode(false); }}>Close</Button>
                <Button startIcon={<EditIcon />} onClick={handleStartEditProcess}>Edit</Button>
                <Button startIcon={<DeleteIcon />} color="error" onClick={() => selectedProcess && handleDeleteProcess(selectedProcess.id)}>Delete</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveEditProcess} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Instance Detail Dialog */}
        <Dialog open={instanceDetailOpen} onClose={() => setInstanceDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approval Instance Details</DialogTitle>
          <DialogContent dividers>
            {selectedInstance && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Process</Typography>
                <Typography gutterBottom>{selectedInstance.process?.name || 'N/A'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Object Type</Typography>
                <Typography gutterBottom>{selectedInstance.objectType}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Object ID</Typography>
                <Typography gutterBottom>{selectedInstance.objectId}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box sx={{ mb: 1 }}>{getStatusChip(selectedInstance.status)}</Box>
                <Typography variant="subtitle2" color="text.secondary">Current Step</Typography>
                <Typography gutterBottom>Step {selectedInstance.currentStep} of {selectedInstance.process?.steps?.length || '?'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
                <Typography gutterBottom>{new Date(selectedInstance.submittedAt).toLocaleString()}</Typography>
                {selectedInstance.completedAt && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
                    <Typography gutterBottom>{new Date(selectedInstance.completedAt).toLocaleString()}</Typography>
                  </>
                )}
                {selectedInstance.comments && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">Comments</Typography>
                    <Typography gutterBottom>{selectedInstance.comments}</Typography>
                  </>
                )}
                {selectedInstance.actions && selectedInstance.actions.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Actions History</Typography>
                    {selectedInstance.actions.map((action) => (
                      <Box key={action.id} sx={{ ml: 1, mb: 1 }}>
                        <Typography variant="body2">
                          <Chip label={action.action} size="small" sx={{ mr: 1 }} />
                          Step {action.stepNumber} - {new Date(action.actionAt).toLocaleString()}
                        </Typography>
                        {action.comments && <Typography variant="caption" color="text.secondary">{action.comments}</Typography>}
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInstanceDetailOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
