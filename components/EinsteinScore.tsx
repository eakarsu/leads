'use client';

import { Box, Card, CardContent, Typography, CircularProgress, Chip, LinearProgress, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';

interface EinsteinScoreProps {
  title: string;
  score: number | null;
  confidence: number | null;
  reasoning: string | null;
  loading: boolean;
  onRefresh?: () => void;
  scoreLabel?: string;
  additionalInfo?: React.ReactNode;
}

export default function EinsteinScore({
  title,
  score,
  confidence,
  reasoning,
  loading,
  onRefresh,
  scoreLabel = 'Score',
  additionalInfo,
}: EinsteinScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 75) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (score >= 50) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
  };

  if (loading) {
    return (
      <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AutoAwesomeIcon />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress color="inherit" />
          </Box>
          <Typography variant="body2" align="center">
            Einstein AI is analyzing...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <AutoAwesomeIcon />
              <Typography variant="h6">{title}</Typography>
            </Box>
            {onRefresh && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                sx={{ color: 'white', borderColor: 'white' }}
                variant="outlined"
              >
                Generate
              </Button>
            )}
          </Box>
          <Typography variant="body2">
            No AI prediction available yet. Click Generate to get Einstein AI insights.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ background: getScoreGradient(score), color: 'white' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon />
            <Typography variant="h6">{title}</Typography>
          </Box>
          {onRefresh && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              sx={{ color: 'white', borderColor: 'white' }}
              variant="outlined"
            >
              Refresh
            </Button>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Box>
            <Typography variant="h2" fontWeight="bold">
              {Math.round(score)}
            </Typography>
            <Typography variant="caption">{scoreLabel}</Typography>
          </Box>
          {confidence !== null && (
            <Box flex={1}>
              <Typography variant="body2" gutterBottom>
                Confidence: {Math.round(confidence * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={confidence * 100}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {reasoning && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {reasoning}
            </Typography>
          </Box>
        )}

        {additionalInfo && <Box mt={2}>{additionalInfo}</Box>}

        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 2 }}>
          Powered by Einstein AI
        </Typography>
      </CardContent>
    </Card>
  );
}
