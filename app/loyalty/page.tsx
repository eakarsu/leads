'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, Tabs, Tab, FormControlLabel, Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface LoyaltyProgram {
  id: string;
  name: string;
  status: string;
  pointsPerDollar: number;
  redemptionRate: number;
  tierEnabled: boolean;
  _count?: { members: number; tiers: number };
  createdAt: string;
}

interface LoyaltyMember {
  id: string;
  program: { id: string; name: string };
  contact: { id: string; firstName: string; lastName: string };
  currentPoints: number;
  lifetimePoints: number;
  currentTier: string;
  createdAt: string;
}

const programColumns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'pointsPerDollar', label: 'Points/Dollar' },
  { id: 'redemptionRate', label: 'Redemption Rate' },
  { id: 'tiers', label: 'Tiers', sortable: false },
  { id: 'members', label: 'Members', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const memberColumns: Column[] = [
  { id: 'program', label: 'Program', sortable: false },
  { id: 'contact', label: 'Contact', sortable: false },
  { id: 'currentPoints', label: 'Points' },
  { id: 'lifetimePoints', label: 'Lifetime Points' },
  { id: 'currentTier', label: 'Tier' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PAUSED': return 'warning';
    case 'ARCHIVED': return 'error';
    default: return 'default';
  }
};

const getTierColor = (tier: string) => {
  switch (tier?.toUpperCase()) {
    case 'GOLD': return '#FFD700';
    case 'SILVER': return '#C0C0C0';
    case 'PLATINUM': return '#E5E4E2';
    case 'DIAMOND': return '#B9F2FF';
    default: return undefined;
  }
};

export default function LoyaltyPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [tab, setTab] = useState(0);

  // Programs state
  const [programSortBy, setProgramSortBy] = useState('createdAt');
  const [programSortOrder, setProgramSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [openProgramDetailDialog, setOpenProgramDetailDialog] = useState(false);
  const [editProgramMode, setEditProgramMode] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<LoyaltyProgram | null>(null);
  const [programForm, setProgramForm] = useState({
    name: '', status: 'ACTIVE', pointsPerDollar: 1, redemptionRate: 0.01, tierEnabled: false,
  });
  const [editProgramForm, setEditProgramForm] = useState({
    name: '', status: 'ACTIVE', pointsPerDollar: 1, redemptionRate: 0.01, tierEnabled: false,
  });

  // Members state
  const [memberSortBy, setMemberSortBy] = useState('createdAt');
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [openMemberDetailDialog, setOpenMemberDetailDialog] = useState(false);
  const [editMemberMode, setEditMemberMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [memberForm, setMemberForm] = useState({
    programId: '', contactId: '', currentPoints: 0, currentTier: 'BRONZE',
  });
  const [editMemberForm, setEditMemberForm] = useState({
    currentPoints: 0, currentTier: 'BRONZE',
  });

  const {
    data: programData,
    loading: programLoading,
    error: programError,
    pagination: programPagination,
    setPage: setProgramPage,
    setPageSize: setProgramPageSize,
    setSort: setProgramSort,
    refresh: refreshPrograms,
  } = usePagination<LoyaltyProgram>({
    url: '/api/loyalty',
    defaultSortBy: programSortBy,
    defaultSortOrder: programSortOrder,
  });

  const {
    data: memberData,
    loading: memberLoading,
    error: memberError,
    pagination: memberPagination,
    setPage: setMemberPage,
    setPageSize: setMemberPageSize,
    setSort: setMemberSort,
    refresh: refreshMembers,
  } = usePagination<LoyaltyMember>({
    url: '/api/loyalty/members',
    defaultSortBy: memberSortBy,
    defaultSortOrder: memberSortOrder,
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/loyalty?pageSize=100');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.data || (Array.isArray(data) ? data : []));
      }
    } catch {
      // ignore
    }
  };

  const handleProgramSort = (col: string) => {
    const newOrder = programSortBy === col && programSortOrder === 'asc' ? 'desc' : 'asc';
    setProgramSortBy(col);
    setProgramSortOrder(newOrder);
    setProgramSort(col, newOrder);
  };

  const handleMemberSort = (col: string) => {
    const newOrder = memberSortBy === col && memberSortOrder === 'asc' ? 'desc' : 'asc';
    setMemberSortBy(col);
    setMemberSortOrder(newOrder);
    setMemberSort(col, newOrder);
  };

  // Program CRUD
  const handleCreateProgram = async () => {
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programForm),
      });
      if (!response.ok) throw new Error('Failed to create loyalty program');
      setOpenProgramDialog(false);
      setProgramForm({ name: '', status: 'ACTIVE', pointsPerDollar: 1, redemptionRate: 0.01, tierEnabled: false });
      toast.showSuccess('Loyalty program created successfully');
      refreshPrograms();
      fetchPrograms();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdateProgram = async () => {
    if (!selectedProgram) return;
    try {
      const response = await fetch(`/api/loyalty/${selectedProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProgramForm),
      });
      if (!response.ok) throw new Error('Failed to update loyalty program');
      toast.showSuccess('Loyalty program updated successfully');
      setEditProgramMode(false);
      setOpenProgramDetailDialog(false);
      refreshPrograms();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Loyalty Program',
      message: 'Are you sure you want to delete this loyalty program? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/loyalty/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete loyalty program');
      toast.showSuccess('Loyalty program deleted successfully');
      setOpenProgramDetailDialog(false);
      refreshPrograms();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  // Member CRUD
  const handleCreateMember = async () => {
    try {
      const response = await fetch('/api/loyalty/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      });
      if (!response.ok) throw new Error('Failed to add loyalty member');
      setOpenMemberDialog(false);
      setMemberForm({ programId: '', contactId: '', currentPoints: 0, currentTier: 'BRONZE' });
      toast.showSuccess('Loyalty member added successfully');
      refreshMembers();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove Loyalty Member',
      message: 'Are you sure you want to remove this member? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Remove',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/loyalty/members/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove loyalty member');
      toast.showSuccess('Loyalty member removed successfully');
      refreshMembers();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleMemberRowClick = (member: LoyaltyMember) => {
    setSelectedMember(member);
    setEditMemberMode(false);
    setOpenMemberDetailDialog(true);
  };

  const handleStartMemberEdit = () => {
    if (!selectedMember) return;
    setEditMemberForm({
      currentPoints: selectedMember.currentPoints,
      currentTier: selectedMember.currentTier,
    });
    setEditMemberMode(true);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      const response = await fetch(`/api/loyalty/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMemberForm),
      });
      if (!response.ok) throw new Error('Failed to update loyalty member');
      toast.showSuccess('Loyalty member updated successfully');
      setEditMemberMode(false);
      setOpenMemberDetailDialog(false);
      refreshMembers();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleProgramRowClick = (program: LoyaltyProgram) => {
    setSelectedProgram(program);
    setEditProgramMode(false);
    setOpenProgramDetailDialog(true);
  };

  const handleStartProgramEdit = () => {
    if (!selectedProgram) return;
    setEditProgramForm({
      name: selectedProgram.name,
      status: selectedProgram.status,
      pointsPerDollar: selectedProgram.pointsPerDollar,
      redemptionRate: selectedProgram.redemptionRate,
      tierEnabled: selectedProgram.tierEnabled,
    });
    setEditProgramMode(true);
  };

  const programExportData = useMemo(() => {
    return programData.map((p) => ({
      Name: p.name, Status: p.status, 'Points/Dollar': p.pointsPerDollar,
      'Redemption Rate': p.redemptionRate, Tiers: p._count?.tiers || 0,
      Members: p._count?.members || 0,
    }));
  }, [programData]);

  const memberExportData = useMemo(() => {
    return memberData.map((m) => ({
      Program: m.program?.name || '---',
      Contact: m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : '---',
      Points: m.currentPoints, 'Lifetime Points': m.lifetimePoints, Tier: m.currentTier,
    }));
  }, [memberData]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <LoyaltyIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Loyalty</Typography>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Programs" />
          <Tab label="Members" />
        </Tabs>

        {/* Programs Tab */}
        {tab === 0 && (
          <>
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <ExportToolbar data={programExportData} filename="loyalty-programs" title="Loyalty Programs" />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenProgramDialog(true)}>
                New Program
              </Button>
            </Box>

            {programError && <Alert severity="error" sx={{ mb: 2 }}>{programError}</Alert>}

            <Card>
              <CardContent>
                {programLoading ? (
                  <TableSkeleton rows={5} columns={7} />
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <SortableTableHead columns={programColumns} sortBy={programSortBy} sortOrder={programSortOrder} onSort={handleProgramSort} />
                      <TableBody>
                        {programData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary">No loyalty programs found. Create your first program!</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          programData.map((program) => (
                            <TableRow key={program.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleProgramRowClick(program)}>
                              <TableCell>{program.name}</TableCell>
                              <TableCell>
                                <Chip label={program.status} size="small" color={getStatusColor(program.status) as any} />
                              </TableCell>
                              <TableCell>{program.pointsPerDollar}</TableCell>
                              <TableCell>{program.redemptionRate}</TableCell>
                              <TableCell>{program._count?.tiers || 0}</TableCell>
                              <TableCell>{program._count?.members || 0}</TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={() => handleProgramRowClick(program)} title="View">
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => { setSelectedProgram(program); handleStartProgramEdit(); setOpenProgramDetailDialog(true); }} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDeleteProgram(program.id)} title="Delete" color="error">
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
                <PaginationControls
                  page={programPagination.page}
                  pageSize={programPagination.pageSize}
                  totalItems={programPagination.totalItems}
                  onPageChange={setProgramPage}
                  onPageSizeChange={setProgramPageSize}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Members Tab */}
        {tab === 1 && (
          <>
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <ExportToolbar data={memberExportData} filename="loyalty-members" title="Loyalty Members" />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenMemberDialog(true)}>
                Add Member
              </Button>
            </Box>

            {memberError && <Alert severity="error" sx={{ mb: 2 }}>{memberError}</Alert>}

            <Card>
              <CardContent>
                {memberLoading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <SortableTableHead columns={memberColumns} sortBy={memberSortBy} sortOrder={memberSortOrder} onSort={handleMemberSort} />
                      <TableBody>
                        {memberData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography color="text.secondary">No loyalty members found.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          memberData.map((member) => (
                            <TableRow key={member.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleMemberRowClick(member)}>
                              <TableCell>{member.program?.name || '---'}</TableCell>
                              <TableCell>
                                {member.contact ? `${member.contact.firstName} ${member.contact.lastName}` : '---'}
                              </TableCell>
                              <TableCell>{member.currentPoints.toLocaleString()}</TableCell>
                              <TableCell>{member.lifetimePoints.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={member.currentTier}
                                  size="small"
                                  sx={getTierColor(member.currentTier) ? {
                                    bgcolor: getTierColor(member.currentTier),
                                    color: member.currentTier?.toUpperCase() === 'GOLD' ? '#333' : undefined,
                                  } : {}}
                                />
                              </TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={() => handleDeleteMember(member.id)} title="Remove" color="error">
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
                <PaginationControls
                  page={memberPagination.page}
                  pageSize={memberPagination.pageSize}
                  totalItems={memberPagination.totalItems}
                  onPageChange={setMemberPage}
                  onPageSizeChange={setMemberPageSize}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Program Dialog */}
        <Dialog open={openProgramDialog} onClose={() => setOpenProgramDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Loyalty Program</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Program Name"
                value={programForm.name}
                onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Status"
                value={programForm.status}
                onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="ARCHIVED">Archived</MenuItem>
              </TextField>
              <TextField
                label="Points per Dollar"
                type="number"
                value={programForm.pointsPerDollar}
                onChange={(e) => setProgramForm({ ...programForm, pointsPerDollar: parseFloat(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="Redemption Rate"
                type="number"
                value={programForm.redemptionRate}
                onChange={(e) => setProgramForm({ ...programForm, redemptionRate: parseFloat(e.target.value) || 0 })}
                fullWidth
                helperText="Dollar value per point (e.g., 0.01 = 1 cent per point)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={programForm.tierEnabled}
                    onChange={(e) => setProgramForm({ ...programForm, tierEnabled: e.target.checked })}
                  />
                }
                label="Enable Tiers"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProgramDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProgram} variant="contained" disabled={!programForm.name}>
              Create Program
            </Button>
          </DialogActions>
        </Dialog>

        {/* Program Detail / Edit Dialog */}
        <Dialog open={openProgramDetailDialog} onClose={() => { setOpenProgramDetailDialog(false); setEditProgramMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editProgramMode ? 'Edit Loyalty Program' : 'Loyalty Program Details'}</DialogTitle>
          <DialogContent>
            {selectedProgram && !editProgramMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedProgram.name}</Typography>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedProgram.status} size="small" color={getStatusColor(selectedProgram.status) as any} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Tiers Enabled</Typography>
                    <Chip label={selectedProgram.tierEnabled ? 'Yes' : 'No'} size="small" color={selectedProgram.tierEnabled ? 'primary' : 'default'} />
                  </Box>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Points per Dollar</Typography>
                    <Typography variant="h6">{selectedProgram.pointsPerDollar}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Redemption Rate</Typography>
                    <Typography variant="h6">${selectedProgram.redemptionRate}/pt</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Members</Typography>
                    <Typography variant="h6">{selectedProgram._count?.members || 0}</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {selectedProgram && editProgramMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Program Name"
                  value={editProgramForm.name}
                  onChange={(e) => setEditProgramForm({ ...editProgramForm, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Status"
                  value={editProgramForm.status}
                  onChange={(e) => setEditProgramForm({ ...editProgramForm, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </TextField>
                <TextField
                  label="Points per Dollar"
                  type="number"
                  value={editProgramForm.pointsPerDollar}
                  onChange={(e) => setEditProgramForm({ ...editProgramForm, pointsPerDollar: parseFloat(e.target.value) || 0 })}
                  fullWidth
                />
                <TextField
                  label="Redemption Rate"
                  type="number"
                  value={editProgramForm.redemptionRate}
                  onChange={(e) => setEditProgramForm({ ...editProgramForm, redemptionRate: parseFloat(e.target.value) || 0 })}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editProgramForm.tierEnabled}
                      onChange={(e) => setEditProgramForm({ ...editProgramForm, tierEnabled: e.target.checked })}
                    />
                  }
                  label="Enable Tiers"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editProgramMode ? (
              <>
                <Button onClick={() => setEditProgramMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateProgram} disabled={!editProgramForm.name}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenProgramDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartProgramEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedProgram && handleDeleteProgram(selectedProgram.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Create Member Dialog */}
        <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Loyalty Member</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Program"
                value={memberForm.programId}
                onChange={(e) => setMemberForm({ ...memberForm, programId: e.target.value })}
                fullWidth
                required
              >
                {programs.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Contact ID"
                value={memberForm.contactId}
                onChange={(e) => setMemberForm({ ...memberForm, contactId: e.target.value })}
                fullWidth
                required
                placeholder="Enter contact ID"
              />
              <TextField
                label="Initial Points"
                type="number"
                value={memberForm.currentPoints}
                onChange={(e) => setMemberForm({ ...memberForm, currentPoints: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                select
                label="Current Tier"
                value={memberForm.currentTier}
                onChange={(e) => setMemberForm({ ...memberForm, currentTier: e.target.value })}
                fullWidth
              >
                <MenuItem value="BRONZE">Bronze</MenuItem>
                <MenuItem value="SILVER">Silver</MenuItem>
                <MenuItem value="GOLD">Gold</MenuItem>
                <MenuItem value="PLATINUM">Platinum</MenuItem>
                <MenuItem value="DIAMOND">Diamond</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMember} variant="contained" disabled={!memberForm.programId || !memberForm.contactId}>
              Add Member
            </Button>
          </DialogActions>
        </Dialog>

        {/* Member Detail / Edit Dialog */}
        <Dialog open={openMemberDetailDialog} onClose={() => { setOpenMemberDetailDialog(false); setEditMemberMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editMemberMode ? 'Edit Loyalty Member' : 'Loyalty Member Details'}</DialogTitle>
          <DialogContent>
            {selectedMember && !editMemberMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Program</Typography>
                  <Typography variant="body1">{selectedMember.program?.name || '---'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                  <Typography variant="body1">
                    {selectedMember.contact ? `${selectedMember.contact.firstName} ${selectedMember.contact.lastName}` : '---'}
                  </Typography>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Current Points</Typography>
                    <Typography variant="h6">{selectedMember.currentPoints.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Lifetime Points</Typography>
                    <Typography variant="h6">{selectedMember.lifetimePoints.toLocaleString()}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Current Tier</Typography>
                  <Chip
                    label={selectedMember.currentTier}
                    size="small"
                    sx={getTierColor(selectedMember.currentTier) ? {
                      bgcolor: getTierColor(selectedMember.currentTier),
                      color: selectedMember.currentTier?.toUpperCase() === 'GOLD' ? '#333' : undefined,
                    } : {}}
                  />
                </Box>
              </Box>
            )}

            {selectedMember && editMemberMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Current Points"
                  type="number"
                  value={editMemberForm.currentPoints}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, currentPoints: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
                <TextField
                  select
                  label="Current Tier"
                  value={editMemberForm.currentTier}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, currentTier: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="BRONZE">Bronze</MenuItem>
                  <MenuItem value="SILVER">Silver</MenuItem>
                  <MenuItem value="GOLD">Gold</MenuItem>
                  <MenuItem value="PLATINUM">Platinum</MenuItem>
                  <MenuItem value="DIAMOND">Diamond</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMemberMode ? (
              <>
                <Button onClick={() => setEditMemberMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateMember}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenMemberDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartMemberEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedMember && handleDeleteMember(selectedMember.id)}>Remove</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
