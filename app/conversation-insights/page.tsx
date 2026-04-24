'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ConversationInsight {
  id: string;
  objectType: string;
  objectId: string;
  transcript: string;
  sentiment: string;
  keyTopics: string[];
  actionItems: string[];
  aiSummary: string;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'objectType', label: 'Object Type' },
  { id: 'objectId', label: 'Object ID' },
  { id: 'sentiment', label: 'Sentiment' },
  { id: 'keyTopics', label: 'Key Topics', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'POSITIVE': return 'success';
    case 'NEGATIVE': return 'error';
    default: return 'default';
  }
};

export default function ConversationInsightsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<ConversationInsight | null>(null);

  const [formData, setFormData] = useState({
    objectType: 'CALL',
    objectId: '',
    transcript: '',
    sentiment: 'NEUTRAL',
    keyTopics: '',
    actionItems: '',
    aiSummary: '',
  });

  const [editFormData, setEditFormData] = useState({
    objectType: 'CALL',
    objectId: '',
    transcript: '',
    sentiment: 'NEUTRAL',
    keyTopics: '',
    actionItems: '',
    aiSummary: '',
  });

  const {
    data: insights,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<ConversationInsight>({
    url: '/api/conversation-insights',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
  });

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortOrder(newOrder);
    setSort(col, newOrder);
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        keyTopics: formData.keyTopics.split(',').map((t) => t.trim()).filter(Boolean),
        actionItems: formData.actionItems.split(',').map((a) => a.trim()).filter(Boolean),
      };
      const response = await fetch('/api/conversation-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create conversation insight');
      setOpenDialog(false);
      setFormData({ objectType: 'CALL', objectId: '', transcript: '', sentiment: 'NEUTRAL', keyTopics: '', actionItems: '', aiSummary: '' });
      toast.showSuccess('Conversation insight created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedInsight) return;
    try {
      const payload = {
        ...editFormData,
        keyTopics: editFormData.keyTopics.split(',').map((t) => t.trim()).filter(Boolean),
        actionItems: editFormData.actionItems.split(',').map((a) => a.trim()).filter(Boolean),
      };
      const response = await fetch(`/api/conversation-insights/${selectedInsight.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update conversation insight');
      toast.showSuccess('Conversation insight updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Conversation Insight',
      message: 'Are you sure you want to delete this insight? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/conversation-insights/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete conversation insight');
      toast.showSuccess('Conversation insight deleted successfully');
      setOpenDetailDialog(false);
      setSelectedInsight(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (insight: ConversationInsight) => {
    setSelectedInsight(insight);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedInsight) return;
    setEditFormData({
      objectType: selectedInsight.objectType,
      objectId: selectedInsight.objectId,
      transcript: selectedInsight.transcript || '',
      sentiment: selectedInsight.sentiment,
      keyTopics: (selectedInsight.keyTopics || []).join(', '),
      actionItems: (selectedInsight.actionItems || []).join(', '),
      aiSummary: selectedInsight.aiSummary || '',
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return insights.map((i) => ({
      'Object Type': i.objectType,
      'Object ID': i.objectId,
      Sentiment: i.sentiment,
      'Key Topics': (i.keyTopics || []).join(', '),
      'Action Items': (i.actionItems || []).join(', '),
      Created: new Date(i.createdAt).toLocaleDateString(),
    }));
  }, [insights]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Conversation Insights</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="conversation-insights" title="Conversation Insights" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Insight
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {insights.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No conversation insights found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      insights.map((insight) => (
                        <TableRow key={insight.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(insight)}>
                          <TableCell><Chip label={insight.objectType} size="small" variant="outlined" /></TableCell>
                          <TableCell>{insight.objectId}</TableCell>
                          <TableCell>
                            <Chip label={insight.sentiment} size="small" color={getSentimentColor(insight.sentiment) as any} />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {(insight.keyTopics || []).slice(0, 3).map((topic, idx) => (
                                <Chip key={idx} label={topic} size="small" variant="outlined" />
                              ))}
                              {(insight.keyTopics || []).length > 3 && (
                                <Chip label={`+${insight.keyTopics.length - 3}`} size="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(insight)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedInsight(insight); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(insight.id)} title="Delete" color="error">
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
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Conversation Insight</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Object Type"
                value={formData.objectType}
                onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                fullWidth
              >
                <MenuItem value="CALL">Call</MenuItem>
                <MenuItem value="MEETING">Meeting</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
              </TextField>
              <TextField
                label="Object ID"
                value={formData.objectId}
                onChange={(e) => setFormData({ ...formData, objectId: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Transcript"
                value={formData.transcript}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                multiline
                rows={6}
                fullWidth
              />
              <TextField
                select
                label="Sentiment"
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                fullWidth
              >
                <MenuItem value="POSITIVE">Positive</MenuItem>
                <MenuItem value="NEUTRAL">Neutral</MenuItem>
                <MenuItem value="NEGATIVE">Negative</MenuItem>
              </TextField>
              <TextField
                label="Key Topics"
                value={formData.keyTopics}
                onChange={(e) => setFormData({ ...formData, keyTopics: e.target.value })}
                fullWidth
                placeholder="Comma-separated: pricing, features, timeline"
              />
              <TextField
                label="Action Items"
                value={formData.actionItems}
                onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                fullWidth
                placeholder="Comma-separated: follow up, send proposal, schedule demo"
              />
              <TextField
                label="AI Summary"
                value={formData.aiSummary}
                onChange={(e) => setFormData({ ...formData, aiSummary: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.objectId}>
              Create Insight
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Conversation Insight' : 'Conversation Insight Details'}</DialogTitle>
          <DialogContent>
            {selectedInsight && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Object Type</Typography>
                    <Chip label={selectedInsight.objectType} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Object ID</Typography>
                    <Typography variant="body1">{selectedInsight.objectId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Sentiment</Typography>
                    <Chip label={selectedInsight.sentiment} size="small" color={getSentimentColor(selectedInsight.sentiment) as any} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Key Topics</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                    {(selectedInsight.keyTopics || []).map((topic, idx) => (
                      <Chip key={idx} label={topic} size="small" />
                    ))}
                    {(!selectedInsight.keyTopics || selectedInsight.keyTopics.length === 0) && (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Action Items</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                    {(selectedInsight.actionItems || []).map((item, idx) => (
                      <Chip key={idx} label={item} size="small" color="primary" variant="outlined" />
                    ))}
                    {(!selectedInsight.actionItems || selectedInsight.actionItems.length === 0) && (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Transcript</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedInsight.transcript || 'No transcript available.'}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">AI Summary</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedInsight.aiSummary || 'No AI summary available.'}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {selectedInsight && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Object Type"
                  value={editFormData.objectType}
                  onChange={(e) => setEditFormData({ ...editFormData, objectType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="CALL">Call</MenuItem>
                  <MenuItem value="MEETING">Meeting</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                </TextField>
                <TextField
                  label="Object ID"
                  value={editFormData.objectId}
                  onChange={(e) => setEditFormData({ ...editFormData, objectId: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Transcript"
                  value={editFormData.transcript}
                  onChange={(e) => setEditFormData({ ...editFormData, transcript: e.target.value })}
                  multiline
                  rows={6}
                  fullWidth
                />
                <TextField
                  select
                  label="Sentiment"
                  value={editFormData.sentiment}
                  onChange={(e) => setEditFormData({ ...editFormData, sentiment: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="POSITIVE">Positive</MenuItem>
                  <MenuItem value="NEUTRAL">Neutral</MenuItem>
                  <MenuItem value="NEGATIVE">Negative</MenuItem>
                </TextField>
                <TextField
                  label="Key Topics"
                  value={editFormData.keyTopics}
                  onChange={(e) => setEditFormData({ ...editFormData, keyTopics: e.target.value })}
                  fullWidth
                  placeholder="Comma-separated"
                />
                <TextField
                  label="Action Items"
                  value={editFormData.actionItems}
                  onChange={(e) => setEditFormData({ ...editFormData, actionItems: e.target.value })}
                  fullWidth
                  placeholder="Comma-separated"
                />
                <TextField
                  label="AI Summary"
                  value={editFormData.aiSummary}
                  onChange={(e) => setEditFormData({ ...editFormData, aiSummary: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.objectId}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedInsight && handleDelete(selectedInsight.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
