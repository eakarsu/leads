'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Chip,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getScoreGrade } from '@/lib/leadScoring';

interface ScoreBreakdown {
  category: string;
  points: number;
  reason: string;
}

interface LeadScoreData {
  demographic: number;
  behavioral: number;
  engagement: number;
  firmographic: number;
  total: number;
  breakdown: ScoreBreakdown[];
}

interface ScoreHistory {
  id: string;
  score: number;
  category: string;
  reason: string;
  calculatedAt: string;
}

interface LeadScoreCardProps {
  leadId: string;
}

export default function LeadScoreCard({ leadId }: LeadScoreCardProps) {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [scoreData, setScoreData] = useState<LeadScoreData | null>(null);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScore();
  }, [leadId]);

  const fetchScore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${leadId}/score`);
      if (!response.ok) throw new Error('Failed to fetch score');
      const data = await response.json();
      setScoreData(data.current);
      setHistory(data.history || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching score:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setCalculating(true);
      const response = await fetch(`/api/leads/${leadId}/score`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to recalculate score');
      await fetchScore();
    } catch (err: any) {
      console.error('Error recalculating score:', err);
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const getTrend = () => {
    if (history.length < 2) return null;
    const latestScore = history[0].score;
    const previousScore = history[1].score;
    if (latestScore > previousScore) {
      return { direction: 'up', diff: latestScore - previousScore };
    } else if (latestScore < previousScore) {
      return { direction: 'down', diff: previousScore - latestScore };
    }
    return null;
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

  if (error || !scoreData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error || 'Failed to load score'}</Alert>
        </CardContent>
      </Card>
    );
  }

  const scoreGrade = getScoreGrade(scoreData.total);
  const trend = getTrend();

  return (
    <Card>
      <CardHeader
        title="Lead Score"
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRecalculate}
            disabled={calculating}
            size="small"
          >
            {calculating ? 'Calculating...' : 'Recalculate'}
          </Button>
        }
      />
      <CardContent>
        {/* Overall Score Display */}
        <Box textAlign="center" mb={3}>
          <Box position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={(scoreData.total / 100) * 100}
              size={120}
              thickness={4}
              color={scoreGrade.color as any}
            />
            <Box
              top={0}
              left={0}
              bottom={0}
              right={0}
              position="absolute"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Typography variant="h3" component="div" fontWeight="bold">
                {scoreData.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / 100
              </Typography>
            </Box>
          </Box>
          <Box mt={2}>
            <Chip
              label={scoreGrade.label}
              color={scoreGrade.color as any}
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
            {trend && (
              <Chip
                icon={
                  trend.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />
                }
                label={`${trend.direction === 'up' ? '+' : '-'}${trend.diff} pts`}
                color={trend.direction === 'up' ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* Score Breakdown by Category */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Score Breakdown
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 6 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">Demographic</Typography>
                <Typography variant="caption" fontWeight="bold">
                  {scoreData.demographic}/25
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(scoreData.demographic / 25) * 100}
                color="primary"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">Behavioral</Typography>
                <Typography variant="caption" fontWeight="bold">
                  {scoreData.behavioral}/30
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(scoreData.behavioral / 30) * 100}
                color="secondary"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">Engagement</Typography>
                <Typography variant="caption" fontWeight="bold">
                  {scoreData.engagement}/25
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(scoreData.engagement / 25) * 100}
                color="success"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption">Firmographic</Typography>
                <Typography variant="caption" fontWeight="bold">
                  {scoreData.firmographic}/20
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(scoreData.firmographic / 20) * 100}
                color="info"
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Detailed Breakdown */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Scoring Factors
        </Typography>
        <List dense disablePadding>
          {scoreData.breakdown.map((item, index) => (
            <ListItem key={index} disableGutters>
              <ListItemText
                primary={item.reason}
                secondary={item.category}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Chip label={`+${item.points}`} size="small" color="primary" variant="outlined" />
            </ListItem>
          ))}
        </List>

        {scoreData.breakdown.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No scoring factors available. Add more information to this lead to improve the score.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
