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
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import HistoryIcon from '@mui/icons-material/History';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, totalFolders: 0 });
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Home' },
  ]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'file' | 'folder'>('file');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    storageUrl: '',
    mimeType: '',
    fileSize: 0,
  });

  useEffect(() => {
    fetchData();
  }, [currentFolder, search]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set('folderId', currentFolder);
      if (search) params.set('search', search);

      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setRecentFiles(data.recentFiles || []);
      setStats(data.stats || { totalFiles: 0, totalSize: 0, totalFolders: 0 });
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
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
        fetchData();
        setFormData({ name: '', description: '', isPublic: false, storageUrl: '', mimeType: '', fileSize: 0 });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
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
        fetchData();
        setFormData({ name: '', description: '', isPublic: false, storageUrl: '', mimeType: '', fileSize: 0 });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      await fetch(`/api/files?id=${id}&type=${type}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
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

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Files</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => {
                setDialogType('folder');
                setDialogOpen(true);
              }}
              sx={{ mr: 1 }}
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
            <Paper>
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
                {files.map((file) => (
                  <ListItem key={file.id}>
                    <ListItemIcon>{getFileIcon(file.mimeType)}</ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${formatFileSize(file.fileSize)} • ${file._count.versions} versions`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Download">
                        <IconButton edge="end" sx={{ mr: 1 }}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton edge="end" onClick={() => handleDelete(file.id, 'file')}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {folders.length === 0 && files.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No files or folders"
                      secondary="Create a folder or upload a file to get started"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
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
                  <ListItem key={file.id}>
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
