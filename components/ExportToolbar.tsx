'use client';

import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

interface ExportToolbarProps {
  data: Record<string, any>[];
  filename: string;
  title?: string;
}

export default function ExportToolbar({ data, filename, title }: ExportToolbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FileDownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={data.length === 0}
      >
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            exportToCSV(data, filename);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportToPDF(title || filename, data);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
