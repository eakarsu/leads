'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Step,
  Stepper,
  StepLabel,
} from '@mui/material';
import Link from 'next/link';

const businessSectors = [
  {
    value: 'HOME_SERVICES',
    label: 'Home Services',
    description: 'HVAC, Roofing, Solar, Plumbing, etc.',
    leadValue: '$50-$200 per lead',
  },
  {
    value: 'LEGAL_SERVICES',
    label: 'Legal Services',
    description: 'Personal Injury, Family Law, etc.',
    leadValue: '$200-$500 per lead',
  },
  {
    value: 'FINANCIAL_SERVICES',
    label: 'Financial Services',
    description: 'Insurance, Mortgages, Loans, etc.',
    leadValue: '$100-$300 per lead',
  },
  {
    value: 'REAL_ESTATE',
    label: 'Real Estate',
    description: 'Buyers, Sellers, Agents, etc.',
    leadValue: '$30-$100 per lead',
  },
  {
    value: 'HEALTHCARE',
    label: 'Healthcare',
    description: 'Dentists, Plastic Surgery, Rehab, etc.',
    leadValue: '$100-$400 per lead',
  },
  {
    value: 'B2B_SAAS',
    label: 'B2B SaaS',
    description: 'Enterprise Software, Cloud Services, etc.',
    leadValue: '$50-$200 per lead',
  },
  {
    value: 'EDUCATION',
    label: 'Education',
    description: 'Online Courses, Colleges, Training, etc.',
    leadValue: '$15-$50 per lead',
  },
  {
    value: 'AUTOMOTIVE',
    label: 'Automotive',
    description: 'Auto Sales, Auto Services, etc.',
    leadValue: '$20-$50 per lead',
  },
  {
    value: 'GENERAL',
    label: 'General / Other',
    description: 'Other business types',
    leadValue: 'Varies',
  },
];

const steps = ['Business Sector', 'Company Info', 'Account Details'];

export default function RegisterPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessSector: '',
    companyName: '',
    industry: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleNext = () => {
    setError('');

    // Validation for each step
    if (activeStep === 0 && !formData.businessSector) {
      setError('Please select a business sector');
      return;
    }

    if (activeStep === 1) {
      if (!formData.companyName || !formData.contactName) {
        setError('Company name and contact name are required');
        return;
      }
    }

    if (activeStep === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('All fields are required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      handleSubmit();
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to login page with success message
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSector = businessSectors.find((s) => s.value === formData.businessSector);

  return (
    <Container maxWidth="md">
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
            Get Started with AI-Powered Lead Generation
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Step 1: Business Sector */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Your Business Sector
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This helps us customize your lead generation experience
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="Business Sector"
                  value={formData.businessSector}
                  onChange={(e) => setFormData({ ...formData, businessSector: e.target.value })}
                  margin="normal"
                  required
                >
                  {businessSectors.map((sector) => (
                    <MenuItem key={sector.value} value={sector.value}>
                      <Box>
                        <Typography variant="body1">{sector.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sector.description} • {sector.leadValue}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                {selectedSector && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>{selectedSector.label}:</strong> {selectedSector.description}
                    </Typography>
                    <Typography variant="caption">
                      Average lead value: {selectedSector.leadValue}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* Step 2: Company Info */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Tell us about your business
                </Typography>

                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  margin="normal"
                  placeholder="e.g., HVAC, Personal Injury Law, Insurance"
                />

                <TextField
                  fullWidth
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  margin="normal"
                  placeholder="https://yourwebsite.com"
                />

                <TextField
                  fullWidth
                  label="Contact Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  margin="normal"
                />
              </Box>
            )}

            {/* Step 3: Account Details */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Create Your Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Set up your login credentials
                </Typography>

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  margin="normal"
                  required
                  autoComplete="email"
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  margin="normal"
                  required
                  autoComplete="new-password"
                  helperText="Minimum 8 characters"
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  margin="normal"
                  required
                  autoComplete="new-password"
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                fullWidth
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? (loading ? 'Creating Account...' : 'Create Account') : 'Next'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#1976d2' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
