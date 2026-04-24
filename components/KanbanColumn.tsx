'use client';

import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface KanbanColumnProps {
  stageKey: string;
  label: string;
  count: number;
  totalValue: number;
  bgColor: string;
  onDrop: (oppId: string, stage: string) => void;
  children: React.ReactNode;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function KanbanColumn({ stageKey, label, count, totalValue, bgColor, onDrop, children }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId) onDrop(oppId, stageKey);
  };

  return (
    <Paper
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 2,
        bgcolor: isOver ? 'action.hover' : bgColor,
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s',
        border: isOver ? '2px dashed' : '2px solid transparent',
        borderColor: isOver ? 'primary.main' : 'transparent',
      }}
      elevation={2}
    >
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {count} deals
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
          {formatCurrency(totalValue)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          weighted value
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
}
