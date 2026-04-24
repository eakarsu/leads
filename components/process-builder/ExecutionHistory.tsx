'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface ExecutionHistoryProps {
  flowId: string;
}

export default function ExecutionHistory({ flowId }: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flowId || flowId.startsWith('temp-')) {
      setLoading(false);
      return;
    }
    fetchExecutions();
  }, [flowId]);

  const fetchExecutions = async () => {
    try {
      const res = await fetch(`/api/process-flows/${flowId}/executions`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail - executions endpoint may not exist
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'RUNNING': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Execution History
      </Typography>
      {executions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No executions yet. Test run the flow to see history.
        </Typography>
      ) : (
        <List dense>
          {executions.slice(0, 10).map((exec, idx) => (
            <Box key={exec.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={exec.status}
                        size="small"
                        color={getStatusColor(exec.status)}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption">
                        {new Date(exec.startedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={exec.error ? `Error: ${exec.error}` : undefined}
                />
              </ListItem>
              {idx < executions.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
