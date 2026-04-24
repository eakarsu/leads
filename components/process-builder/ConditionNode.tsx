import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, IconButton } from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CloseIcon from '@mui/icons-material/Close';

function ConditionNode({ data, id }: NodeProps) {
  return (
    <Box
      sx={{
        background: '#ff9800',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '2px solid #e65100',
        minWidth: 160,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        transform: 'rotate(0deg)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#e65100' }} />
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <CallSplitIcon fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">Condition</Typography>
        </Box>
        {data.onDelete && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
            sx={{ color: 'white', p: '2px', '&:hover': { background: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      {data.config?.field && (
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {data.config.field} {data.config.operator} {data.config.value}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#e65100' }} />
    </Box>
  );
}

export default memo(ConditionNode);
