'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Tooltip,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import HistoryIcon from '@mui/icons-material/History';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface FileItem {
  id: string;
  name: string;
  description: string | null;
  mimeType: string | null;
  fileSize: number;
  storageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string } | null;
  _count: { versions: number; links: number };
}

interface FolderItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { files: number; children: number };
  owner: { id: string; name: string } | null;
}

const fileColumns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'fileSize', label: 'Size' },
  { id: 'mimeType', label: 'Type', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
  { id: 'updatedAt', label: 'Modified' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

export default function FilesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, totalFolders: 0 });
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Home' },
  ]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'file' | 'folder'>('file');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', isPublic: false });
  const [editSaving, setEditSaving] = useState(false);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    storageUrl: '',
    mimeType: '',
    fileSize: 0,
  });

  const extraParams: Record<string, string> = {};
  if (currentFolder) extraParams.folderId = currentFolder;
  if (search) extraParams.search = search;

  const {
    data: files,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<FileItem>({
    url: '/api/files',
    defaultSortBy: 'updatedAt',
    defaultSortOrder: 'desc',
    extraParams,
  });

  useEffect(() => {
    fetchFoldersAndStats();
  }, [currentFolder, search]);

  const fetchFoldersAndStats = async () => {
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folderId', currentFolder);
      if (search) params.set('search', search);

      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      setFolders(data.folders || []);
      setRecentFiles(data.recentFiles || []);
      setStats(data.stats || { totalFiles: 0, totalSize: 0, totalFolders: 0 });
    } catch (error) {
      console.error('Error fetching files data:', error);
    }
  };

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreateFolder = async () => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'folder',
          name: formData.name,
          description: formData.description,
          folderId: currentFolder,
          isPublic: formData.isPublic,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        toast.showSuccess('Folder created successfully');
        refresh();
        fetchFoldersAndStats();
        setFormData({ name: '', description: '', isPublic: false, storageUrl: '', mimeType: '', fileSize: 0 });
      }
    } catch (error) {
      toast.showError('Error creating folder');
    }
  };

  const handleUploadFile = async () => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          name: formData.name,
          description: formData.description,
          folderId: currentFolder,
          isPublic: formData.isPublic,
          storageUrl: formData.storageUrl || `/files/${formData.name}`,
          mimeType: formData.mimeType || 'application/octet-stream',
          fileSize: formData.fileSize,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        toast.showSuccess('File uploaded successfully');
        refresh();
        fetchFoldersAndStats();
        setFormData({ name: '', description: '', isPublic: false, storageUrl: '', mimeType: '', fileSize: 0 });
      }
    } catch (error) {
      toast.showError('Error uploading file');
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    const confirmed = await confirm({
      title: `Delete ${type === 'folder' ? 'Folder' : 'File'}`,
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/files?id=${id}&type=${type}`, { method: 'DELETE' });
      toast.showSuccess(`${type === 'folder' ? 'Folder' : 'File'} deleted successfully`);
      refresh();
      fetchFoldersAndStats();
    } catch (error) {
      toast.showError(`Error deleting ${type}`);
    }
  };

  const handleStartEdit = () => {
    if (!selectedFile) return;
    setEditFormData({
      name: selectedFile.name || '',
      description: selectedFile.description || '',
      isPublic: selectedFile.isPublic || false,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFile) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFile.id, ...editFormData }),
      });
      if (response.ok) {
        toast.showSuccess('File updated successfully');
        setEditMode(false);
        setDetailOpen(false);
        refresh();
        fetchFoldersAndStats();
      } else {
        toast.showError('Failed to update file');
      }
    } catch (error) {
      toast.showError('Error updating file');
    } finally {
      setEditSaving(false);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setFolderPath([{ id: null, name: 'Home' }]);
    } else {
      const existingIndex = folderPath.findIndex((f) => f.id === folderId);
      if (existingIndex >= 0) {
        setFolderPath(folderPath.slice(0, existingIndex + 1));
      } else {
        setFolderPath([...folderPath, { id: folderId, name: folderName }]);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <InsertDriveFileIcon />;
    if (mimeType.startsWith('image/')) return <ImageIcon color="info" />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon color="error" />;
    if (mimeType.includes('document') || mimeType.includes('text')) return <DescriptionIcon color="primary" />;
    return <InsertDriveFileIcon />;
  };

  const exportData = files.map((f) => ({
    Name: f.name,
    Size: formatFileSize(f.fileSize),
    Type: f.mimeType || 'Unknown',
    Owner: f.owner?.name || '-',
    Modified: new Date(f.updatedAt).toLocaleDateString(),
    Versions: f._count.versions,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Files</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="files" title="Files" />
            <Button
              variant="outlined"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => {
                setDialogType('folder');
                setDialogOpen(true);
              }}
            >
              New Folder
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => {
                setDialogType('file');
                setDialogOpen(true);
              }}
            >
              Upload File
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InsertDriveFileIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Files</Typography>
                </Box>
                <Typography variant="h4">{stats.totalFiles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FolderIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Folders</Typography>
                </Box>
                <Typography variant="h4">{stats.totalFolders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Storage Used</Typography>
                </Box>
                <Typography variant="h4">{formatFileSize(stats.totalSize)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Breadcrumbs */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Breadcrumbs>
                {folderPath.map((folder, index) => (
                  <Link
                    key={index}
                    component="button"
                    variant="body1"
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {folder.name}
                  </Link>
                ))}
              </Breadcrumbs>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Files and Folders */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Folders List */}
            {folders.length > 0 && (
              <Paper sx={{ mb: 2 }}>
                <List>
                  {folders.map((folder) => (
                    <ListItem
                      key={folder.id}
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(folder.id, 'folder');
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton onClick={() => navigateToFolder(folder.id, folder.name)}>
                        <ListItemIcon>
                          <FolderIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={folder.name}
                          secondary={`${folder._count.files} files, ${folder._count.children} folders`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Files Table */}
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <Paper>
                <TableContainer>
                  <Table>
                    <SortableTableHead
                      columns={fileColumns}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <TableBody>
                      {files.map((file) => (
                        <TableRow
                          key={file.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedFile(file);
                            setEditMode(false);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getFileIcon(file.mimeType)}
                              <Typography variant="body2">{file.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                          <TableCell>{file.mimeType || '-'}</TableCell>
                          <TableCell>{file.owner?.name || '-'}</TableCell>
                          <TableCell>{new Date(file.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Download">
                              <IconButton size="small" sx={{ mr: 1 }}>
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(file.id, 'file')}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {files.length === 0 && folders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No files or folders found. Create a folder or upload a file to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <PaginationControls
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </Paper>
            )}
          </Grid>

          {/* Recent Files */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Files
              </Typography>
              <List dense>
                {recentFiles.slice(0, 5).map((file) => (
                  <ListItem
                    key={file.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedFile(file);
                      setEditMode(false);
                      setDetailOpen(true);
                    }}
                  >
                    <ListItemIcon>{getFileIcon(file.mimeType)}</ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.fileSize)}
                    />
                  </ListItem>
                ))}
                {recentFiles.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="No recent files" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* File Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={1}>
              {selectedFile && getFileIcon(selectedFile.mimeType)}
              <Typography variant="h6">{editMode ? 'Edit File' : selectedFile?.name}</Typography>
            </Box>
            <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFile && !editMode && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedFile.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{selectedFile.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                <Typography>{formatFileSize(selectedFile.fileSize)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography>{selectedFile.mimeType || 'Unknown'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                <Typography>{selectedFile.owner?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Visibility</Typography>
                <Chip label={selectedFile.isPublic ? 'Public' : 'Private'} size="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Versions</Typography>
                <Typography>{selectedFile._count.versions}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Last Modified</Typography>
                <Typography>{new Date(selectedFile.updatedAt).toLocaleString()}</Typography>
              </Box>
            </Box>
          )}
          {selectedFile && editMode && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Visibility"
                select
                value={editFormData.isPublic ? 'Yes' : 'No'}
                onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.value === 'Yes' })}
              >
                <MenuItem value="Yes">Yes (Public)</MenuItem>
                <MenuItem value="No">No (Private)</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!editMode ? (
            <>
              <Button startIcon={<DownloadIcon />}>Download</Button>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              <Button startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedFile) {
                    handleDelete(selectedFile.id, 'file');
                    setDetailOpen(false);
                  }
                }}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button startIcon={<CloseIcon />} onClick={() => setEditMode(false)}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Create/Upload Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'folder' ? 'Create New Folder' : 'Upload File'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          {dialogType === 'file' && (
            <>
              <TextField
                fullWidth
                label="File URL (or upload path)"
                value={formData.storageUrl}
                onChange={(e) => setFormData({ ...formData, storageUrl: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="File Size (bytes)"
                type="number"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={dialogType === 'folder' ? handleCreateFolder : handleUploadFile}
            variant="contained"
            disabled={!formData.name}
          >
            {dialogType === 'folder' ? 'Create Folder' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
