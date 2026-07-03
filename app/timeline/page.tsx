'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskIcon from '@mui/icons-material/Task';
import TimelineIcon from '@mui/icons-material/Timeline';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type TimelineItem = {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description: string;
  user?: { id: string; name: string };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Timeline request failed';
}

function iconFor(type: string) {
  if (type === 'task') return <TaskIcon color="primary" />;
  if (type === 'event') return <EventIcon color="primary" />;
  if (type === 'email') return <EmailIcon color="primary" />;
  if (type === 'attachment') return <AttachmentIcon color="primary" />;
  if (type === 'note') return <NotesIcon color="primary" />;
  return <TimelineIcon color="primary" />;
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/timeline');
      const payload = await response.json() as TimelineItem[] | { error?: string };
      if (!response.ok) throw new Error(Array.isArray(payload) ? 'Failed to load timeline' : payload.error || 'Failed to load timeline');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">CRM Timeline</Typography>
            <Typography color="text.secondary">Global activity feed across notes, tasks, events, files, lead activities, and emails.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <CircularProgress /> : items.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary">No timeline activity found.</Typography></CardContent></Card>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(item)}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ mt: 0.5 }}>{iconFor(item.type)}</Box>
                      <Box>
                        <Typography variant="h6">{item.title}</Typography>
                        <Typography color="text.secondary">{item.description}</Typography>
                        <Stack direction="row" spacing={1} mt={1}>
                          <Chip size="small" label={item.type.replace(/_/g, ' ')} />
                          {item.user?.name && <Chip size="small" label={item.user.name} />}
                        </Stack>
                      </Box>
                    </Stack>
                    <Typography color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{new Date(item.timestamp).toLocaleString()}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Timeline Activity Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
