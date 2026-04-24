import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, IconButton } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import TaskIcon from '@mui/icons-material/Task';
import EditIcon from '@mui/icons-material/Edit';
import ApiIcon from '@mui/icons-material/Api';
import CloseIcon from '@mui/icons-material/Close';

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; borderColor: string; label: string }> = {
  email: { icon: <EmailIcon fontSize="small" />, color: '#9c27b0', borderColor: '#6a1b9a', label: 'Send Email' },
  task: { icon: <TaskIcon fontSize="small" />, color: '#f44336', borderColor: '#c62828', label: 'Create Task' },
  update: { icon: <EditIcon fontSize="small" />, color: '#00bcd4', borderColor: '#00838f', label: 'Update Field' },
  api: { icon: <ApiIcon fontSize="small" />, color: '#ff5722', borderColor: '#bf360c', label: 'API Call' },
};

function ActionNode({ data, id }: NodeProps) {
  const actionType = data.type || 'api';
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.api;

  const getSubtitle = () => {
    if (actionType === 'email' && data.config?.subject) return data.config.subject;
    if (actionType === 'task' && data.config?.title) return data.config.title;
    if (actionType === 'update' && data.config?.field) return `${data.config.field} = ${data.config.value}`;
    if (actionType === 'api' && data.config?.url) {
      try {
        const url = new URL(data.config.url.replace(/\{\{.*?\}\}/g, 'x'));
        return `${data.config.method || 'POST'} ${url.pathname}`;
      } catch {
        return data.config.method || 'API Call';
      }
    }
    return '';
  };

  return (
    <Box
      sx={{
        background: config.color,
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        border: `2px solid ${config.borderColor}`,
        minWidth: 160,
        maxWidth: 220,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: config.borderColor }} />
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box display="flex" alignItems="center" gap={0.5}>
          {config.icon}
          <Typography variant="subtitle2" fontWeight="bold">{config.label}</Typography>
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
      {getSubtitle() && (
        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }} noWrap>
          {getSubtitle()}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: config.borderColor }} />
    </Box>
  );
}

export default memo(ActionNode);
