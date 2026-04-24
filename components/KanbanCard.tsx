'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface KanbanCardProps {
  id: string;
  name: string;
  amount: number;
  probability: number;
  closeDate: string | null;
  clientName: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | null) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function KanbanCard({ id, name, amount, probability, closeDate, clientName, onDragStart, onClick }: KanbanCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onClick={onClick}
      sx={{
        mb: 1.5,
        cursor: 'grab',
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        '&:active': { cursor: 'grabbing', opacity: 0.8 },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="flex-start" gap={0.5}>
          <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.3, flexShrink: 0 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" gutterBottom noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {clientName}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {formatCurrency(amount)}
              </Typography>
              <Chip label={`${probability}%`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {formatDate(closeDate)}
            </Typography>
            <Typography variant="caption" color="secondary" display="block">
              {formatCurrency((amount * probability) / 100)} weighted
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
