'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Box,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getFieldLabel } from '@/lib/fieldHistoryClient';

interface FieldChange {
  id: string;
  objectType: string;
  objectId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
}

interface FieldHistorySectionProps {
  objectType: string;
  objectId: string;
}

export default function FieldHistorySection({
  objectType,
  objectId,
}: FieldHistorySectionProps) {
  const [history, setHistory] = useState<FieldChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchHistory();
  }, [objectType, objectId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        objectType,
        objectId,
      });
      const response = await fetch(`/api/field-history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch field history');
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching field history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (value: string | null) => {
    if (!value) return <em style={{ color: '#999' }}>(blank)</em>;
    if (value.length > 100) {
      return (
        <Box>
          <Typography variant="body2" component="span">
            {value.substring(0, 100)}...
          </Typography>
        </Box>
      );
    }
    return value;
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={<HistoryIcon />}
        title="Field History"
        subheader={`${history.length} changes tracked`}
      />
      <CardContent sx={{ maxHeight: 600, overflowY: 'auto' }}>
        {history.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            No field changes recorded yet
          </Typography>
        ) : (
          <List disablePadding>
            {history.map((change, index) => {
              const isLongValue =
                (change.oldValue && change.oldValue.length > 100) ||
                (change.newValue && change.newValue.length > 100);
              const isExpanded = expanded[change.id];

              return (
                <Box key={change.id}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={getFieldLabel(change.fieldName)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(change.changedAt)}
                        </Typography>
                      </Box>
                      {isLongValue && (
                        <IconButton size="small" onClick={() => toggleExpand(change.id)}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </Box>

                    <Box width="100%" pl={2}>
                      <Box mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          From:
                        </Typography>
                        <Typography variant="body2" component="div">
                          {isLongValue && !isExpanded
                            ? formatValue(change.oldValue)
                            : change.oldValue || <em style={{ color: '#999' }}>(blank)</em>}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          To:
                        </Typography>
                        <Typography variant="body2" component="div" fontWeight="bold">
                          {isLongValue && !isExpanded
                            ? formatValue(change.newValue)
                            : change.newValue || <em style={{ color: '#999' }}>(blank)</em>}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < history.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
