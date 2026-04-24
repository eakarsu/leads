import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, IconButton } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import CloseIcon from '@mui/icons-material/Close';

function TriggerNode({ data, id }: NodeProps) {
  return (
    <Box
      sx={{
        background: '#4caf50',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '2px solid #2e7d32',
        minWidth: 160,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <BoltIcon fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">Trigger</Typography>
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
      {data.config?.triggerType && (
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {data.config.triggerType === 'created' ? 'Record Created' :
           data.config.triggerType === 'updated' ? 'Record Updated' : 'Record Deleted'}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#2e7d32' }} />
    </Box>
  );
}

export default memo(TriggerNode);
