'use client';

import { FormEvent, Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Box, Button, Card, CardContent, Container, TextField, Typography } from '@mui/material';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function fillDemoCredentials() {
    setError('');
    setDemoLoading(true);
    try {
      const response = await fetch('/api/auth/demo-credentials', { cache: 'no-store' });
      if (!response.ok) throw new Error('Demo credentials unavailable');
      const credentials = await response.json() as { email?: string; password?: string };
      if (!credentials.email || !credentials.password) throw new Error('Demo credentials unavailable');
      setEmail(credentials.email);
      setPassword(credentials.password);
    } catch {
      setError('Demo credentials are unavailable.');
    } finally {
      setDemoLoading(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password, or the account is suspended.');
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Card sx={{ width: '100%' }}><CardContent sx={{ p: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>Lead Operations</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in with an explicitly provisioned account.</Typography>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          <Box component="form" onSubmit={submit}>
            <TextField fullWidth required type="email" label="Email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} margin="normal" />
            <TextField fullWidth required type="password" label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} margin="normal" />
            <Box sx={{ textAlign: 'right', my: 1 }}><Link href="/forgot-password">Forgot password?</Link></Box>
            <button
              type="button"
              onClick={fillDemoCredentials}
              disabled={demoLoading || loading}
              aria-label="Auto Fill Demo Credentials"
              style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
            >
              {demoLoading ? 'Loading Demo Credentials…' : 'Auto Fill Demo Credentials'}
            </button>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
          </Box>
        </CardContent></Card>
      </Box>
    </Container>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
