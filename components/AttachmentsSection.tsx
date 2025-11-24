'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
  };
}

interface AttachmentsSectionProps {
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  currentUserId?: string;
}

export default function AttachmentsSection({
  contactId,
  leadId,
  opportunityId,
  currentUserId,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [contactId, leadId, opportunityId]);

  const fetchAttachments = async () => {
    try {
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (leadId) params.append('leadId', leadId);
      if (opportunityId) params.append('opportunityId', opportunityId);

      const response = await fetch(`/api/attachments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attachments');
      const data = await response.json();
      setAttachments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (contactId) formData.append('contactId', contactId);
      if (leadId) formData.append('leadId', leadId);
      if (opportunityId) formData.append('opportunityId', opportunityId);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error('Failed to upload file');

      setOpenDialog(false);
      setSelectedFile(null);
      fetchAttachments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attachment');
      fetchAttachments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon />;
    if (fileType.includes('image')) return <ImageIcon />;
    if (fileType.includes('word') || fileType.includes('document')) return <DescriptionIcon />;
    return <InsertDriveFileIcon />;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Attachments ({attachments.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size="small"
          >
            Upload File
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography color="text.secondary">Loading attachments...</Typography>
        ) : attachments.length === 0 ? (
          <Typography color="text.secondary">
            No attachments yet. Upload your first file above.
          </Typography>
        ) : (
          <List>
            {attachments.map((attachment) => (
              <ListItem
                key={attachment.id}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => window.open(`/api/attachments/${attachment.id}`, '_blank')}
                      title="Download"
                    >
                      <DownloadIcon />
                    </IconButton>
                    {currentUserId === attachment.uploader.id && (
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(attachment.id)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemIcon>
                  {getFileIcon(attachment.fileType)}
                </ListItemIcon>
                <ListItemText
                  primary={attachment.fileName}
                  secondary={
                    <>
                      {formatFileSize(attachment.fileSize)} • Uploaded by{' '}
                      {attachment.uploader.name} on {formatDate(attachment.createdAt)}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Upload Dialog */}
        <Dialog open={openDialog} onClose={() => !uploading && setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <input
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={uploading}
                >
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Size: {formatFileSize(selectedFile.size)}
                </Typography>
              )}
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }} align="center">
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!selectedFile || uploading}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
