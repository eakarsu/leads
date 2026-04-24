'use client';

import { useState } from 'react';
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
import EmailIcon from '@mui/icons-material/Email';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            LeadGenFlow AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Reset Your Password
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {sent ? (
              <Box sx={{ textAlign: 'center' }}>
                <EmailIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  If an account exists with {email}, we&apos;ve sent a password reset link.
                  Please check your inbox and spam folder.
                </Typography>
                <Button variant="outlined" component={Link} href="/login">
                  Back to Sign In
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="h5" component="h2" gutterBottom>
                  Forgot Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="email"
                    autoFocus
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !email}
                    sx={{ mt: 3, mb: 2 }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Remember your password?{' '}
                      <Link href="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                        Sign In
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
