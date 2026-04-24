'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import ExportToolbar from '@/components/ExportToolbar';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Button,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Grid,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ChatBubbleOutline as CommentIcon,
  Link as LinkIcon,
  Campaign as AnnouncementIcon,
  Article as TextPostIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  PersonAdd as JoinIcon,
  ExitToApp as LeaveIcon,
  Close as CloseIcon,
  Forum as ForumIcon,
  TrendingUp as TrendingIcon,
  OpenInNew as OpenInNewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface FeedItem {
  id: string;
  type: string;
  body: string;
  parentType: string | null;
  parentId: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  likeCount: number;
  commentCount: number;
  authorId: string;
  visibility: string;
  author?: { id: string; name: string | null; email: string | null };
  comments: Comment[];
  likes: Like[];
  mentions: Mention[];
  _count: { comments: number; likes: number };
  createdAt: string;
  updatedAt?: string;
}

interface Comment {
  id: string;
  body: string;
  authorId: string;
  author?: { id: string; name: string | null; email: string | null };
  likeCount: number;
  createdAt: string;
}

interface Like {
  id: string;
  userId: string;
}

interface Mention {
  id: string;
  userId: string;
}

interface ChatterGroup {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isArchived?: boolean;
  ownerId: string;
  memberCount: number;
  owner?: { id: string; name: string | null; email: string | null };
  _count: { members: number };
  isMember?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ChatterPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [groups, setGroups] = useState<ChatterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatterGroup | null>(null);

  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  const [postFormData, setPostFormData] = useState({
    bodyText: '',
    linkUrl: '',
    linkTitle: '',
  });

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
  });

  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [detailCommentText, setDetailCommentText] = useState('');

  // Edit mode state for posts
  const [postEditMode, setPostEditMode] = useState(false);
  const [postEditFormData, setPostEditFormData] = useState({ body: '' });
  const [postEditSaving, setPostEditSaving] = useState(false);

  // Edit mode state for groups
  const [groupEditMode, setGroupEditMode] = useState(false);
  const [groupEditFormData, setGroupEditFormData] = useState({ name: '', description: '' });
  const [groupEditSaving, setGroupEditSaving] = useState(false);

  useEffect(() => {
    fetchFeed();
    fetchGroups();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      setFeedItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      showError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/chatter-groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showError('Failed to load groups');
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: postFormData.linkUrl ? 'LINK_POST' : 'TEXT_POST',
          ...postFormData,
        }),
      });

      if (res.ok) {
        setShowPostModal(false);
        setPostFormData({ bodyText: '', linkUrl: '', linkTitle: '' });
        fetchFeed();
        showSuccess('Post created successfully');
      } else {
        showError('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showError('Failed to create post');
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/chatter-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupFormData),
      });

      if (res.ok) {
        setShowGroupModal(false);
        setGroupFormData({ name: '', description: '', type: 'PUBLIC' });
        fetchGroups();
        showSuccess('Group created successfully');
      } else {
        showError('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showError('Failed to create group');
    }
  };

  const handleLike = async (feedItemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', feedItemId }),
      });
      fetchFeed();
    } catch (error) {
      console.error('Error liking post:', error);
      showError('Failed to like post');
    }
  };

  const handleComment = async (feedItemId: string, isDetailView = false) => {
    const body = isDetailView ? detailCommentText : commentText[feedItemId];
    if (!body?.trim()) return;

    try {
      await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', feedItemId, commentBody: body }),
      });
      if (isDetailView) {
        setDetailCommentText('');
      } else {
        setCommentText({ ...commentText, [feedItemId]: '' });
      }
      fetchFeed();
      showSuccess('Comment added');
    } catch (error) {
      console.error('Error commenting:', error);
      showError('Failed to add comment');
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/feed?id=${postId}`, { method: 'DELETE' });
      fetchFeed();
      setSelectedPost(null);
      showSuccess('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const confirmed = await confirm({
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/chatter-groups?id=${groupId}`, { method: 'DELETE' });
      fetchGroups();
      setSelectedGroup(null);
      showSuccess('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      showError('Failed to delete group');
    }
  };

  // Post edit handlers
  const handleStartPostEdit = () => {
    if (!selectedPost) return;
    setPostEditFormData({ body: selectedPost.body });
    setPostEditMode(true);
  };

  const handleSavePostEdit = async () => {
    if (!selectedPost) return;
    setPostEditSaving(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', feedItemId: selectedPost.id, body: postEditFormData.body }),
      });
      if (!res.ok) throw new Error('Failed to update post');
      showSuccess('Post updated successfully');
      setPostEditMode(false);
      fetchFeed();
    } catch (error: any) {
      showError(error.message || 'Failed to update post');
    } finally {
      setPostEditSaving(false);
    }
  };

  // Group edit handlers
  const handleStartGroupEdit = () => {
    if (!selectedGroup) return;
    setGroupEditFormData({
      name: selectedGroup.name,
      description: selectedGroup.description || '',
    });
    setGroupEditMode(true);
  };

  const handleSaveGroupEdit = async () => {
    if (!selectedGroup) return;
    setGroupEditSaving(true);
    try {
      const res = await fetch('/api/chatter-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroup.id, action: 'edit', ...groupEditFormData }),
      });
      if (!res.ok) throw new Error('Failed to update group');
      showSuccess('Group updated successfully');
      setGroupEditMode(false);
      fetchGroups();
    } catch (error: any) {
      showError(error.message || 'Failed to update group');
    } finally {
      setGroupEditSaving(false);
    }
  };

  const handleJoinGroup = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/chatter-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, action: 'join' }),
      });
      fetchGroups();
      showSuccess('Joined group successfully');
    } catch (error) {
      console.error('Error joining group:', error);
      showError('Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/chatter-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, action: 'leave' }),
      });
      fetchGroups();
      showSuccess('Left group successfully');
    } catch (error) {
      console.error('Error leaving group:', error);
      showError('Failed to leave group');
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'LINK_POST':
        return <LinkIcon fontSize="small" />;
      case 'ANNOUNCEMENT':
        return <AnnouncementIcon fontSize="small" color="warning" />;
      case 'STATUS_UPDATE':
        return <TrendingIcon fontSize="small" color="info" />;
      default:
        return <TextPostIcon fontSize="small" />;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'LINK_POST':
        return 'shared a link';
      case 'ANNOUNCEMENT':
        return 'made an announcement';
      case 'STATUS_UPDATE':
        return 'updated their status';
      case 'TEXT_POST':
      default:
        return 'posted';
    }
  };

  const getPostTypeChip = (type: string) => {
    switch (type) {
      case 'LINK_POST':
        return <Chip icon={<LinkIcon />} label="Link Post" size="small" color="info" />;
      case 'ANNOUNCEMENT':
        return <Chip icon={<AnnouncementIcon />} label="Announcement" size="small" color="warning" />;
      case 'STATUS_UPDATE':
        return <Chip icon={<TrendingIcon />} label="Status Update" size="small" color="success" />;
      case 'TEXT_POST':
      default:
        return <Chip icon={<TextPostIcon />} label="Text Post" size="small" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string | null | undefined) => {
    if (!name) return '#9e9e9e';
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0288d1', '#c2185b'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Stats calculations
  const totalPosts = feedItems.length;
  const totalComments = feedItems.reduce((sum, item) => sum + (item.commentCount || 0), 0);
  const totalLikes = feedItems.reduce((sum, item) => sum + (item.likeCount || 0), 0);
  const totalGroups = groups.length;

  // Export data
  const feedExportData = feedItems.map(item => ({
    Author: item.author?.name || 'Unknown',
    Type: item.type,
    Body: item.body.substring(0, 100),
    Likes: item.likeCount,
    Comments: item.commentCount,
    Created: new Date(item.createdAt).toLocaleString(),
  }));

  const groupExportData = groups.map(group => ({
    Name: group.name,
    Description: group.description || '',
    Visibility: group.isPublic ? 'Public' : 'Private',
    Members: group.memberCount || group._count.members,
    Owner: group.owner?.name || 'Unknown',
  }));

  // Update selectedPost when feedItems change
  useEffect(() => {
    if (selectedPost) {
      const updated = feedItems.find(item => item.id === selectedPost.id);
      if (updated) setSelectedPost(updated);
    }
  }, [feedItems]);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Chatter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Collaborate and share updates with your team
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar
              data={activeTab === 0 ? feedExportData : groupExportData}
              filename={activeTab === 0 ? 'chatter-feed' : 'chatter-groups'}
              title={activeTab === 0 ? 'Chatter Feed' : 'Chatter Groups'}
            />
            {activeTab === 1 && (
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => setShowGroupModal(true)}
              >
                New Group
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowPostModal(true)}
            >
              New Post
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <ForumIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{totalPosts}</Typography>
              <Typography variant="body2" color="text.secondary">Total Posts</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <CommentIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{totalComments}</Typography>
              <Typography variant="body2" color="text.secondary">Comments</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <ThumbUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{totalLikes}</Typography>
              <Typography variant="body2" color="text.secondary">Total Likes</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{totalGroups}</Typography>
              <Typography variant="body2" color="text.secondary">Groups</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="Feed"
              icon={<Badge badgeContent={totalPosts} color="primary"><ForumIcon /></Badge>}
              iconPosition="start"
            />
            <Tab
              label={`Groups (${groups.length})`}
              icon={<GroupIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Feed Tab */}
        {activeTab === 0 && (
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : feedItems.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <ForumIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No posts yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Be the first to share something with your team!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowPostModal(true)}
                >
                  Create a Post
                </Button>
              </Paper>
            ) : (
              feedItems.map((item) => (
                <Card
                  key={item.id}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4, bgcolor: 'action.hover' },
                    transition: 'box-shadow 0.2s, background-color 0.2s'
                  }}
                  onClick={() => { setSelectedPost(item); setPostEditMode(false); }}
                >
                  {/* Post Header */}
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(item.author?.name),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getInitials(item.author?.name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography fontWeight="bold">
                            {item.author?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getPostTypeLabel(item.type)}
                          </Typography>
                          <Tooltip title={item.type.replace('_', ' ')}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getPostIcon(item.type)}
                            </Box>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(item.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Post Body */}
                    <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                      {item.body.length > 300 ? `${item.body.slice(0, 300)}...` : item.body}
                    </Typography>

                    {/* Link Preview */}
                    {item.linkUrl && (
                      <Paper
                        variant="outlined"
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.linkUrl!, '_blank');
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle2" color="primary">
                              {item.linkTitle || 'View Link'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {item.linkUrl}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </CardContent>

                  {/* Post Actions */}
                  <CardActions sx={{ px: 2 }}>
                    <Button
                      size="small"
                      startIcon={item.likeCount > 0 ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                      onClick={(e) => handleLike(item.id, e)}
                      color={item.likeCount > 0 ? 'primary' : 'inherit'}
                    >
                      {item.likeCount || 0} Like{item.likeCount !== 1 ? 's' : ''}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CommentIcon />}
                      color="inherit"
                    >
                      {item.commentCount || 0} Comment{item.commentCount !== 1 ? 's' : ''}
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Click to view details
                    </Typography>
                  </CardActions>
                </Card>
              ))
            )}
          </Box>
        )}

        {/* Groups Tab */}
        {activeTab === 1 && (
          <Box>
            {loading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : groups.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <GroupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No groups yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Create one to start collaborating with your team!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowGroupModal(true)}
                >
                  Create a Group
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {groups.map((group) => (
                  <Grid key={group.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4, bgcolor: 'action.hover' },
                        transition: 'box-shadow 0.2s, background-color 0.2s'
                      }}
                      onClick={() => { setSelectedGroup(group); setGroupEditMode(false); }}
                    >
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: group.isPublic ? 'primary.main' : 'secondary.main',
                              width: 56,
                              height: 56,
                            }}
                          >
                            {group.isPublic ? <PublicIcon /> : <PrivateIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {group.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {group.description || 'No description'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<GroupIcon />}
                            label={`${group.memberCount || group._count.members} members`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={group.isPublic ? <PublicIcon /> : <PrivateIcon />}
                            label={group.isPublic ? 'Public' : 'Private'}
                            size="small"
                            color={group.isPublic ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Owner: {group.owner?.name || 'Unknown'}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        {group.isMember ? (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<LeaveIcon />}
                            onClick={(e) => handleLeaveGroup(group.id, e)}
                          >
                            Leave Group
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<JoinIcon />}
                            onClick={(e) => handleJoinGroup(group.id, e)}
                          >
                            Join Group
                          </Button>
                        )}
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Click for details
                        </Typography>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Post Detail Dialog */}
        <Dialog
          open={!!selectedPost}
          onClose={() => { setSelectedPost(null); setPostEditMode(false); }}
          maxWidth="md"
          fullWidth
        >
          {selectedPost && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(selectedPost.author?.name),
                        width: 48,
                        height: 48,
                      }}
                    >
                      {getInitials(selectedPost.author?.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {postEditMode ? 'Edit Post' : (selectedPost.author?.name || 'Unknown User')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(selectedPost.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => { setSelectedPost(null); setPostEditMode(false); }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {/* View Mode */}
                {!postEditMode && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {getPostTypeChip(selectedPost.type)}
                      <Chip
                        icon={<VisibilityIcon />}
                        label={selectedPost.visibility || 'ALL_USERS'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                      {selectedPost.body}
                    </Typography>

                    {selectedPost.linkUrl && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          mb: 2,
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                        }}
                        onClick={() => window.open(selectedPost.linkUrl!, '_blank')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkIcon color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="primary">
                              {selectedPost.linkTitle || 'View Link'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedPost.linkUrl}
                            </Typography>
                          </Box>
                          <OpenInNewIcon fontSize="small" color="action" />
                        </Box>
                      </Paper>
                    )}

                    {/* Post Info Table */}
                    <Paper variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Post ID</TableCell>
                            <TableCell>{selectedPost.id}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Author Email</TableCell>
                            <TableCell>{selectedPost.author?.email || 'N/A'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                            <TableCell>{formatDateTime(selectedPost.createdAt)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Likes</TableCell>
                            <TableCell>{selectedPost.likeCount}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Comments</TableCell>
                            <TableCell>{selectedPost.commentCount}</TableCell>
                          </TableRow>
                          {selectedPost.parentType && (
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Posted In</TableCell>
                              <TableCell>{selectedPost.parentType}: {selectedPost.parentId}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <Button
                        variant={selectedPost.likeCount > 0 ? 'contained' : 'outlined'}
                        startIcon={<ThumbUpIcon />}
                        onClick={() => handleLike(selectedPost.id)}
                      >
                        {selectedPost.likeCount} Like{selectedPost.likeCount !== 1 ? 's' : ''}
                      </Button>
                    </Box>

                    {/* Comments Section */}
                    <Typography variant="h6" gutterBottom>
                      Comments ({selectedPost.commentCount})
                    </Typography>

                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                      <List sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                        {selectedPost.comments.map((comment) => (
                          <ListItem key={comment.id} alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: getAvatarColor(comment.author?.name),
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {getInitials(comment.author?.name)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontWeight="bold" variant="body2">
                                    {comment.author?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTimeAgo(comment.createdAt)}
                                  </Typography>
                                </Box>
                              }
                              secondary={comment.body}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        No comments yet. Be the first to comment!
                      </Typography>
                    )}

                    {/* Add Comment */}
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Write a comment..."
                      value={detailCommentText}
                      onChange={(e) => setDetailCommentText(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              color="primary"
                              onClick={() => handleComment(selectedPost.id, true)}
                              disabled={!detailCommentText.trim()}
                            >
                              <SendIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                )}

                {/* Edit Mode */}
                {postEditMode && (
                  <Box>
                    <TextField
                      label="Post Content"
                      value={postEditFormData.body}
                      onChange={(e) => setPostEditFormData({ ...postEditFormData, body: e.target.value })}
                      fullWidth
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                {!postEditMode ? (
                  <>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleStartPostEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeletePost(selectedPost.id)}
                    >
                      Delete
                    </Button>
                    <Button onClick={() => { setSelectedPost(null); setPostEditMode(false); }}>Close</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setPostEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSavePostEdit} disabled={postEditSaving}>
                      {postEditSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Group Detail Dialog */}
        <Dialog
          open={!!selectedGroup}
          onClose={() => { setSelectedGroup(null); setGroupEditMode(false); }}
          maxWidth="sm"
          fullWidth
        >
          {selectedGroup && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: selectedGroup.isPublic ? 'primary.main' : 'secondary.main',
                        width: 56,
                        height: 56,
                      }}
                    >
                      {selectedGroup.isPublic ? <PublicIcon /> : <PrivateIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {groupEditMode ? 'Edit Group' : selectedGroup.name}
                      </Typography>
                      {!groupEditMode && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            icon={selectedGroup.isPublic ? <PublicIcon /> : <PrivateIcon />}
                            label={selectedGroup.isPublic ? 'Public' : 'Private'}
                            size="small"
                            color={selectedGroup.isPublic ? 'success' : 'default'}
                          />
                          {selectedGroup.isMember && (
                            <Chip label="Member" size="small" color="primary" />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <IconButton onClick={() => { setSelectedGroup(null); setGroupEditMode(false); }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {/* View Mode */}
                {!groupEditMode && (
                  <>
                    {/* Description */}
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography sx={{ mb: 3 }}>
                      {selectedGroup.description || 'No description provided'}
                    </Typography>

                    {/* Group Info Table */}
                    <Paper variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 150 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CategoryIcon fontSize="small" />
                                Group ID
                              </Box>
                            </TableCell>
                            <TableCell>{selectedGroup.id}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" />
                                Owner
                              </Box>
                            </TableCell>
                            <TableCell>{selectedGroup.owner?.name || 'Unknown'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" />
                                Owner Email
                              </Box>
                            </TableCell>
                            <TableCell>{selectedGroup.owner?.email || 'N/A'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupIcon fontSize="small" />
                                Members
                              </Box>
                            </TableCell>
                            <TableCell>{selectedGroup.memberCount || selectedGroup._count.members}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <VisibilityIcon fontSize="small" />
                                Visibility
                              </Box>
                            </TableCell>
                            <TableCell>{selectedGroup.isPublic ? 'Public - Anyone can join' : 'Private - Requires approval'}</TableCell>
                          </TableRow>
                          {selectedGroup.createdAt && (
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ScheduleIcon fontSize="small" />
                                  Created
                                </Box>
                              </TableCell>
                              <TableCell>{formatDateTime(selectedGroup.createdAt)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>
                  </>
                )}

                {/* Edit Mode */}
                {groupEditMode && (
                  <Box>
                    <TextField
                      label="Group Name"
                      value={groupEditFormData.name}
                      onChange={(e) => setGroupEditFormData({ ...groupEditFormData, name: e.target.value })}
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      label="Description"
                      value={groupEditFormData.description}
                      onChange={(e) => setGroupEditFormData({ ...groupEditFormData, description: e.target.value })}
                      fullWidth
                      margin="normal"
                      multiline
                      rows={3}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                {!groupEditMode ? (
                  <>
                    {selectedGroup.isMember ? (
                      <Button
                        color="inherit"
                        startIcon={<LeaveIcon />}
                        onClick={(e) => {
                          handleLeaveGroup(selectedGroup.id, e);
                          setSelectedGroup(null);
                        }}
                      >
                        Leave Group
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<JoinIcon />}
                        onClick={(e) => {
                          handleJoinGroup(selectedGroup.id, e);
                          setSelectedGroup(null);
                        }}
                      >
                        Join Group
                      </Button>
                    )}
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleStartGroupEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteGroup(selectedGroup.id)}
                    >
                      Delete
                    </Button>
                    <Button onClick={() => { setSelectedGroup(null); setGroupEditMode(false); }}>Close</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setGroupEditMode(false)} startIcon={<CloseIcon />}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveGroupEdit} disabled={groupEditSaving}>
                      {groupEditSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* New Post Dialog */}
        <Dialog
          open={showPostModal}
          onClose={() => setShowPostModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">New Post</Typography>
              <IconButton size="small" onClick={() => setShowPostModal(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handlePostSubmit}>
            <DialogContent dividers>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="What's on your mind?"
                value={postFormData.bodyText}
                onChange={(e) => setPostFormData({ ...postFormData, bodyText: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Link URL (optional)"
                type="url"
                value={postFormData.linkUrl}
                onChange={(e) => setPostFormData({ ...postFormData, linkUrl: e.target.value })}
                placeholder="https://..."
                sx={{ mb: 2 }}
              />
              {postFormData.linkUrl && (
                <TextField
                  fullWidth
                  label="Link Title"
                  value={postFormData.linkTitle}
                  onChange={(e) => setPostFormData({ ...postFormData, linkTitle: e.target.value })}
                  placeholder="Title for the link"
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setShowPostModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={!postFormData.bodyText.trim()}>
                Post
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* New Group Dialog */}
        <Dialog
          open={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">New Group</Typography>
              <IconButton size="small" onClick={() => setShowGroupModal(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handleGroupSubmit}>
            <DialogContent dividers>
              <TextField
                fullWidth
                label="Group Name"
                value={groupFormData.name}
                onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={groupFormData.description}
                onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Group Type</InputLabel>
                <Select
                  value={groupFormData.type}
                  label="Group Type"
                  onChange={(e) => setGroupFormData({ ...groupFormData, type: e.target.value })}
                >
                  <MenuItem value="PUBLIC">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PublicIcon fontSize="small" />
                      Public - Anyone can join
                    </Box>
                  </MenuItem>
                  <MenuItem value="PRIVATE">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PrivateIcon fontSize="small" />
                      Private - Requires approval
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setShowGroupModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={!groupFormData.name.trim()}>
                Create Group
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
