'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor, Stack } from '@mui/material';

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
}

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, severity: AlertColor) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, message, severity }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const showError = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const showWarning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);
  const showInfo = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  const handleClose = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Stack spacing={1} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            <Alert
              severity={toast.severity}
              variant="filled"
              onClose={() => handleClose(toast.id)}
              sx={{ minWidth: 300 }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
