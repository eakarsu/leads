'use client';

import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Page error:', error);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            An unexpected error occurred. Please try again or return to the home page.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={reset}>
              Try Again
            </Button>
            <Button variant="outlined" startIcon={<HomeIcon />} href="/dashboard">
              Go Home
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
