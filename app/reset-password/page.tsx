'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccess(true);
      setTimeout(() => router.push('/login?reset=true'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>Invalid Link</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This password reset link is invalid or has expired.
              </Typography>
              <Button variant="contained" component={Link} href="/forgot-password">
                Request New Link
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>LeadGenFlow AI</Typography>
          <Typography variant="body1" color="text.secondary">Set New Password</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Password Reset!</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Your password has been reset successfully. Redirecting to login...
                </Typography>
                <Button variant="contained" component={Link} href="/login">Sign In Now</Button>
              </Box>
            ) : (
              <>
                <Typography variant="h5" component="h2" gutterBottom>Reset Password</Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="new-password"
                  />
                  <PasswordStrengthIndicator password={password} />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="new-password"
                    error={!!confirmPassword && password !== confirmPassword}
                    helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !password || !confirmPassword}
                    sx={{ mt: 3 }}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
