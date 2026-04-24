'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import NoteIcon from '@mui/icons-material/Note';
import TaskIcon from '@mui/icons-material/Task';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface TimelineActivity {
  id: string;
  type: 'note' | 'task' | 'event' | 'email' | 'attachment' | 'lead_activity' | 'opportunity_change';
  timestamp: string;
  title: string;
  description: string;
  user?: {
    id: string;
    name: string;
  };
  metadata?: any;
}

interface ActivityTimelineProps {
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
}

export default function ActivityTimeline({
  contactId,
  leadId,
  opportunityId,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchActivities();
  }, [contactId, leadId, opportunityId]);

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (leadId) params.append('leadId', leadId);
      if (opportunityId) params.append('opportunityId', opportunityId);

      const response = await fetch(`/api/timeline?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const data = await response.json();
      setActivities(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EmailIcon />;
      case 'task':
        return <TaskIcon />;
      case 'event':
        return <EventIcon />;
      case 'note':
        return <NoteIcon />;
      case 'attachment':
        return <AttachFileIcon />;
      case 'lead_activity':
        return <LinkedInIcon />;
      case 'opportunity_change':
        return <TrendingUpIcon />;
      default:
        return <NoteIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'primary';
      case 'task':
        return 'warning';
      case 'event':
        return 'info';
      case 'note':
        return 'default';
      case 'attachment':
        return 'secondary';
      case 'lead_activity':
        return 'info';
      case 'opportunity_change':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatFullTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredActivities = activities.filter(
    (activity) => filter === 'ALL' || activity.type === filter
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Activity Timeline</Typography>
          <TextField
            select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Activities</MenuItem>
            <MenuItem value="note">Notes</MenuItem>
            <MenuItem value="task">Tasks</MenuItem>
            <MenuItem value="event">Events</MenuItem>
            <MenuItem value="email">Emails</MenuItem>
            <MenuItem value="attachment">Attachments</MenuItem>
            <MenuItem value="lead_activity">Lead Activities</MenuItem>
            <MenuItem value="opportunity_change">Opportunity Changes</MenuItem>
          </TextField>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {filteredActivities.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {filter === 'ALL' ? 'No activities yet' : `No ${filter} activities`}
          </Typography>
        ) : (
          <List>
            {filteredActivities.map((activity, index) => (
              <Box key={activity.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: getActivityColor(activity.type) as any,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5} component="span">
                        <Typography variant="subtitle2" component="span">
                          {activity.title}
                        </Typography>
                        <Chip
                          label={activity.type.replace('_', ' ')}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mb: 0.5 }}>
                          {activity.description}
                        </Typography>
                        {activity.user && (
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            by {activity.user.name} • {formatTimestamp(activity.timestamp)}
                          </Typography>
                        )}
                        {!activity.user && (
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {formatTimestamp(activity.timestamp)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredActivities.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
