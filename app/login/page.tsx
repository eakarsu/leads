'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Grid,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CloudIcon from '@mui/icons-material/Cloud';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HotelIcon from '@mui/icons-material/Hotel';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ConstructionIcon from '@mui/icons-material/Construction';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

const demoAccounts = [
  { email: 'admin@leadgenflow.com', name: 'Admin', sector: 'System Admin', icon: <AdminPanelSettingsIcon />, color: '#d32f2f' },
  { email: 'john@acmehvac.com', name: 'John', sector: 'Home Services', icon: <HomeRepairServiceIcon />, color: '#1565c0' },
  { email: 'michael@smithlawfirm.com', name: 'Michael', sector: 'Legal', icon: <GavelIcon />, color: '#4527a0' },
  { email: 'lisa@premierinsurance.com', name: 'Lisa', sector: 'Financial', icon: <AccountBalanceIcon />, color: '#2e7d32' },
  { email: 'jennifer@dreamhomerealty.com', name: 'Jennifer', sector: 'Real Estate', icon: <HomeWorkIcon />, color: '#e65100' },
  { email: 'james@brightsmile.com', name: 'James', sector: 'Healthcare', icon: <LocalHospitalIcon />, color: '#00838f' },
  { email: 'alex@cloudflow.io', name: 'Alex', sector: 'B2B SaaS', icon: <CloudIcon />, color: '#283593' },
  { email: 'maria@techacademy.edu', name: 'Maria', sector: 'Education', icon: <SchoolIcon />, color: '#6a1b9a' },
  { email: 'robert@premierauto.com', name: 'Robert', sector: 'Automotive', icon: <DirectionsCarIcon />, color: '#37474f' },
  { email: 'emily@grandviewhotel.com', name: 'Emily', sector: 'Hospitality', icon: <HotelIcon />, color: '#ad1457' },
  { email: 'marcus@zenfitstudio.com', name: 'Marcus', sector: 'Fitness', icon: <FitnessCenterIcon />, color: '#ff6f00' },
  { email: 'david@premierbuilders.com', name: 'David', sector: 'Construction', icon: <ConstructionIcon />, color: '#795548' },
  { email: 'jessica@trendygoods.com', name: 'Jessica', sector: 'E-Commerce', icon: <ShoppingCartIcon />, color: '#c62828' },
  { email: 'brian@shieldinsurance.com', name: 'Brian', sector: 'Insurance', icon: <SecurityIcon />, color: '#1b5e20' },
  { email: 'amanda@sunshinepowersolar.com', name: 'Amanda', sector: 'Solar Energy', icon: <WbSunnyIcon />, color: '#f9a825' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingInAs, setLoggingInAs] = useState('');
  const [sessionCleared, setSessionCleared] = useState(false);

  useEffect(() => {
    fetch('/api/auth/clear-session', { method: 'POST' }).finally(() => {
      setSessionCleared(true);
    });
  }, []);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please check your email to verify, then sign in.');
    }
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now sign in.');
    }
    if (searchParams.get('reset') === 'true') {
      setSuccess('Password reset successfully! Please sign in with your new password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!sessionCleared) {
        await fetch('/api/auth/clear-session', { method: 'POST' });
        setSessionCleared(true);
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail: string) => {
    setError('');
    setLoggingInAs(accountEmail);

    try {
      if (!sessionCleared) {
        await fetch('/api/auth/clear-session', { method: 'POST' });
        setSessionCleared(true);
      }

      const result = await signIn('credentials', {
        email: accountEmail,
        password: 'password123',
        redirect: false,
      });

      if (result?.error) {
        setError(`Failed to sign in as ${accountEmail}`);
        setLoggingInAs('');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoggingInAs('');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            LeadGenFlow AI
          </Typography>
          <Typography variant="h6" color="text.secondary">
            AI-Powered CRM & Lead Generation Platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left: Quick Login Cards */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Quick Login — Click to sign in
            </Typography>
            <Grid container spacing={1.5}>
              {demoAccounts.map((account) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={account.email}>
                  <Card
                    elevation={loggingInAs === account.email ? 6 : 1}
                    sx={{
                      transition: 'all 0.2s',
                      border: loggingInAs === account.email ? '2px solid' : '1px solid',
                      borderColor: loggingInAs === account.email ? account.color : 'divider',
                      opacity: loggingInAs && loggingInAs !== account.email ? 0.5 : 1,
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-2px)',
                        borderColor: account.color,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleQuickLogin(account.email)}
                      disabled={!!loggingInAs}
                      sx={{ p: 1.5, textAlign: 'center' }}
                    >
                      {loggingInAs === account.email ? (
                        <CircularProgress size={32} sx={{ mb: 0.5 }} />
                      ) : (
                        <Avatar
                          sx={{
                            bgcolor: account.color,
                            width: 40,
                            height: 40,
                            mx: 'auto',
                            mb: 0.5,
                          }}
                        >
                          {account.icon}
                        </Avatar>
                      )}
                      <Typography variant="subtitle2" noWrap>
                        {account.name}
                      </Typography>
                      <Chip
                        label={account.sector}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          mt: 0.5,
                          bgcolor: `${account.color}15`,
                          color: account.color,
                          fontWeight: 500,
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        noWrap
                        sx={{ mt: 0.5, fontSize: '0.6rem' }}
                      >
                        {account.email}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Right: Manual Login Form */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Manual Sign In
                </Typography>
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
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="current-password"
                    size="small"
                  />
                  <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                    <Link href="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none', fontSize: '0.8rem' }}>
                      Forgot password?
                    </Link>
                  </Box>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !!loggingInAs}
                    sx={{ mt: 2, mb: 1 }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                      Sign Up
                    </Link>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
