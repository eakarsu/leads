'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

interface ConfirmOptions {
  title: string;
  message: string;
  severity?: 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(false);
  };

  const Icon = options.severity === 'error' ? ErrorIcon : WarningIcon;
  const iconColor = options.severity === 'error' ? 'error' : 'warning';

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon color={iconColor} />
            {options.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>{options.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>{options.cancelText || 'Cancel'}</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={options.severity === 'error' ? 'error' : 'warning'}
          >
            {options.confirmText || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmDialogContextType {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
}
