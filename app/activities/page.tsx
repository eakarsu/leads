'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  MenuItem,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  content: string;
  aiSummary: string | null;
  lead: {
    id: string;
    fullName: string;
    company: string;
  };
  user: {
    name: string;
  };
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'primary';
      case 'CALL':
        return 'success';
      case 'LINKEDIN':
        return 'info';
      case 'MEETING':
        return 'secondary';
      case 'NOTE':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredActivities = activities.filter(
    (activity) => filterType === 'ALL' || activity.type === filterType
  );

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Activities</Typography>
          <TextField
            select
            label="Filter by Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="ALL">All Activities</MenuItem>
            <MenuItem value="EMAIL">Email</MenuItem>
            <MenuItem value="CALL">Call</MenuItem>
            <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
            <MenuItem value="MEETING">Meeting</MenuItem>
            <MenuItem value="NOTE">Note</MenuItem>
          </TextField>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Lead</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          {filterType === 'ALL'
                            ? 'No activities found.'
                            : `No ${filterType.toLowerCase()} activities found.`}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.map((activity) => (
                      <TableRow
                        key={activity.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/leads/${activity.lead.id}`)}
                      >
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.type}
                            size="small"
                            color={getActivityColor(activity.type) as any}
                          />
                        </TableCell>
                        <TableCell>{activity.lead.fullName}</TableCell>
                        <TableCell>{activity.lead.company}</TableCell>
                        <TableCell>{activity.user.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                            {activity.aiSummary || activity.content}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
