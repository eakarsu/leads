'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
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
  MenuItem,
} from '@mui/material';

const businessSectors = [
  { value: 'HOME_SERVICES', label: 'Home Services (HVAC, Roofing, Solar)' },
  { value: 'LEGAL_SERVICES', label: 'Legal Services (Personal Injury, Family Law)' },
  { value: 'FINANCIAL_SERVICES', label: 'Financial Services (Insurance, Mortgages)' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'HEALTHCARE', label: 'Healthcare (Dentists, Plastic Surgery)' },
  { value: 'B2B_SAAS', label: 'B2B SaaS (Enterprise Software)' },
  { value: 'EDUCATION', label: 'Education (Courses, Colleges)' },
  { value: 'AUTOMOTIVE', label: 'Automotive (Sales, Services)' },
  { value: 'HOSPITALITY', label: 'Hospitality (Hotels, Restaurants)' },
  { value: 'FITNESS_WELLNESS', label: 'Fitness & Wellness (Gyms, Studios)' },
  { value: 'CONSTRUCTION', label: 'Construction (Contractors, Builders)' },
  { value: 'ECOMMERCE', label: 'E-Commerce (Online Stores)' },
  { value: 'INSURANCE', label: 'Insurance (Life, Health, Auto)' },
  { value: 'SOLAR_ENERGY', label: 'Solar Energy (Solar Installation)' },
  { value: 'GENERAL', label: 'General / Other' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessSector, setBusinessSector] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
    } catch (err) {
      setError('An error occurred. Please try again.');
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
            AI-Powered Lead Generation Platform
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Sign In
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                select
                fullWidth
                label="Business Sector"
                value={businessSector}
                onChange={(e) => setBusinessSector(e.target.value)}
                margin="normal"
                required
              >
                {businessSectors.map((sector) => (
                  <MenuItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
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
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  Demo Accounts (All passwords: password123)
                </Typography>

                <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold' }}>
                  Admin:
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  admin@leadgenflow.com
                </Typography>

                <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold' }}>
                  Business Sectors:
                </Typography>

                <Typography variant="caption" display="block" sx={{ ml: 1, mt: 0.5 }}>
                  Home Services: john@acmehvac.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Legal Services: michael@smithlawfirm.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Financial: lisa@premierinsurance.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Real Estate: jennifer@dreamhomerealty.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Healthcare: james@brightsmile.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  B2B SaaS: alex@cloudflow.io
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Education: maria@techacademy.edu
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Automotive: robert@premierauto.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Hospitality: emily@grandviewhotel.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Fitness & Wellness: marcus@zenfitstudio.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Construction: david@premierbuilders.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  E-Commerce: jessica@trendygoods.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Insurance: brian@shieldinsurance.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                  Solar Energy: amanda@sunshinepowersolar.com
                </Typography>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
