'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No verification token provided');
      setLoading(false);
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        setVerified(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {loading && (
              <>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h5">Verifying your email...</Typography>
              </>
            )}
            {verified && (
              <>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Email Verified!</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Your email has been verified successfully. You can now sign in.
                </Typography>
                <Button variant="contained" component={Link} href="/login?verified=true">
                  Sign In
                </Button>
              </>
            )}
            {error && (
              <>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Verification Failed</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {error}
                </Typography>
                <Button variant="contained" component={Link} href="/login">
                  Go to Sign In
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
