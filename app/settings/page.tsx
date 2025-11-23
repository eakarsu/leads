'use client';

import { useSession } from 'next-auth/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {session?.user?.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {session?.user?.email}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Role
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {session?.user?.role}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  API keys and configuration are managed in the <code>.env</code> file.
                  <br />
                  <br />
                  <strong>OpenRouter API:</strong> Required for all AI features
                  <br />
                  <strong>Database:</strong> PostgreSQL connection configured
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Information
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Version
                    </Typography>
                    <Typography variant="body1">1.0.0</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">LeadGenFlow AI</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      AI Provider
                    </Typography>
                    <Typography variant="body1">OpenRouter</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Database
                    </Typography>
                    <Typography variant="body1">PostgreSQL with Prisma</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="warning">
              <strong>Note:</strong> User management and advanced settings are currently managed
              through the database. Contact your administrator for role changes or additional
              configuration options.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
