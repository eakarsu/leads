'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Chip,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface NextBestAction {
  priority: string;
  action: string;
  description: string;
  estimatedImpact: string;
  objectType: string;
  objectId: string | null;
  dueBy: string;
}

interface NextBestActionsProps {
  autoLoad?: boolean;
}

export default function NextBestActions({ autoLoad = false }: NextBestActionsProps) {
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (autoLoad) {
      fetchActions();
    }
  }, [autoLoad]);

  const fetchActions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/next-best-action');
      if (!response.ok) throw new Error('Failed to fetch actions');
      const data = await response.json();
      setActions(data.actions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">Einstein Next Best Actions</Typography>
          </Box>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchActions}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && actions.length === 0 && (
          <Box textAlign="center" py={4}>
            <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No recommendations yet. Click Refresh to get AI-powered action items.
            </Typography>
          </Box>
        )}

        {!loading && actions.length > 0 && (
          <List>
            {actions.map((action, index) => (
              <ListItem
                key={index}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={action.priority} size="small" color={getPriorityColor(action.priority)} />
                    <Chip label={action.objectType} size="small" variant="outlined" />
                  </Box>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={action.estimatedImpact}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Box width="100%">
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {action.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {action.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due by: {action.dueBy}
                  </Typography>
                </Box>
                <Box width="100%" display="flex" justifyContent="flex-end" mt={1}>
                  <Button size="small" startIcon={<CheckCircleIcon />}>
                    Mark Complete
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
