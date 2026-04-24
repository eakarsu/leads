'use client';

import { Box, LinearProgress, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getPasswordStrength } from '@/lib/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const progressValue = (score / 4) * 100;

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography variant="caption" color={`${color}.main`}>
          {label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <List dense sx={{ mt: 1, py: 0 }}>
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <ListItem key={req.label} sx={{ py: 0, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {met ? (
                  <CheckCircleIcon sx={{ fontSize: 16 }} color="success" />
                ) : (
                  <CancelIcon sx={{ fontSize: 16 }} color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={req.label}
                primaryTypographyProps={{
                  variant: 'caption',
                  color: met ? 'text.primary' : 'text.disabled',
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
