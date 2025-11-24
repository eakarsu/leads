'use client';

import { Box, Button, Toolbar, Typography, Menu, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkEdit?: () => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
}

export default function BulkActionsToolbar({
  selectedCount,
  onBulkDelete,
  onBulkEdit,
  customActions = [],
}: BulkActionsToolbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (selectedCount === 0) return null;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
      }}
    >
      <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1" component="div">
        {selectedCount} selected
      </Typography>

      {onBulkEdit && (
        <Button
          startIcon={<EditIcon />}
          onClick={onBulkEdit}
          sx={{ mr: 1, color: 'inherit' }}
        >
          Edit
        </Button>
      )}

      <Button
        startIcon={<DeleteIcon />}
        onClick={onBulkDelete}
        sx={{ mr: 1, color: 'inherit' }}
      >
        Delete
      </Button>

      {customActions.length > 0 && (
        <>
          <Button
            startIcon={<MoreVertIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: 'inherit' }}
          >
            More
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {customActions.map((action, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  action.onClick();
                  setAnchorEl(null);
                }}
              >
                {action.icon && <Box component="span" sx={{ mr: 1 }}>{action.icon}</Box>}
                {action.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Toolbar>
  );
}
