'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ToastProvider } from '@/components/ToastProvider';
import { ConfirmDialogProvider } from '@/components/ConfirmDialog';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
