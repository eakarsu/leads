'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  DataObject as DataIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showImportResultDialog, setShowImportResultDialog] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDemoData = async () => {
    setShowConfirmDialog(false);
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/seed/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate demo data');
      }

      setResult(data);
      setShowResultDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate demo data');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadData = () => {
    if (!result?.data) return;

    const jsonString = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportToDatabase = async () => {
    if (!result?.data) return;

    setShowImportConfirmDialog(false);
    setShowResultDialog(false);
    setImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/seed/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: result.data }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import demo data');
      }

      setImportResult(data);
      setShowImportResultDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to import demo data');
    } finally {
      setImporting(false);
    }
  };

  // Direct import - generates and imports in one step
  const handleDirectImport = async () => {
    setImporting(true);
    setError(null);

    try {
      // First generate the data
      const generateResponse = await fetch('/api/seed/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const generateData = await generateResponse.json();

      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate demo data');
      }

      // Then import it
      const importResponse = await fetch('/api/seed/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: generateData.data }),
      });

      const importData = await importResponse.json();

      if (!importResponse.ok) {
        throw new Error(importData.error || 'Failed to import demo data');
      }

      setImportResult(importData);
      setShowImportResultDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to import demo data');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
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

          <Grid size={{ xs: 12, md: 6 }}>
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

          {/* Demo Data Section */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <DataIcon color="primary" />
                  <Typography variant="h6">Demo Data Management</Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>Import Sample Data:</strong> Generate and import realistic demo data directly into your database.
                  <br />
                  <strong>Preview Only:</strong> Generate sample data without saving to database (download as JSON).
                  <br /><br />
                  Includes: Clients, Contacts, Leads, Opportunities, Cases, Contracts, Quotes, Orders,
                  Invoices, Reports, Roles, Permissions, and more.
                </Alert>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <ImportIcon />}
                    onClick={handleDirectImport}
                    disabled={generating || importing}
                  >
                    {importing ? 'Importing...' : 'Import Sample Data'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DataIcon />}
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={generating || importing}
                  >
                    {generating ? 'Generating...' : 'Preview Only'}
                  </Button>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    This will generate data for:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {[
                      'Clients', 'Contacts', 'Leads', 'Campaigns', 'Opportunities',
                      'Cases', 'Contracts', 'Quotes', 'Orders', 'Invoices',
                      'Assets', 'Entitlements', 'Tasks', 'Events', 'Knowledge Articles',
                      'Mass Email Jobs', 'Web Forms', 'Data Imports', 'Custom Objects',
                      'Notes', 'Email Templates', 'Reports', 'Workflows'
                    ].map((item) => (
                      <Chip key={item} label={item} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Information
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Version
                    </Typography>
                    <Typography variant="body1">1.0.0</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">LeadGenFlow AI</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      AI Provider
                    </Typography>
                    <Typography variant="body1">OpenRouter</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Database
                    </Typography>
                    <Typography variant="body1">PostgreSQL with Prisma</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Alert severity="warning">
              <strong>Note:</strong> User management and advanced settings are currently managed
              through the database. Contact your administrator for role changes or additional
              configuration options.
            </Alert>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DataIcon color="primary" />
              Preview Demo Data?
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              This will generate approximately <strong>300+ sample records</strong> for preview:
            </Typography>
            <List dense sx={{ mt: 1 }}>
              <ListItem>
                <ListItemText primary="15 Client Companies (Partners & Customers)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="20 Contacts (with Portal & Partner users)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="20 Leads, 15 Opportunities, 15 Cases" />
              </ListItem>
              <ListItem>
                <ListItemText primary="12 each: Contracts, Quotes, Assets" />
              </ListItem>
              <ListItem>
                <ListItemText primary="10 each: Orders, Invoices, Entitlements, Products" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Tasks, Events, Knowledge Articles, and more..." />
              </ListItem>
            </List>
            <Alert severity="success" sx={{ mt: 2 }}>
              No data will be inserted into the database. This is preview only.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleGenerateDemoData} color="primary">
              Preview Data
            </Button>
          </DialogActions>
        </Dialog>

        {/* Result Dialog */}
        <Dialog
          open={showResultDialog}
          onClose={() => setShowResultDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon color="success" />
              Demo Data Preview Generated!
            </Box>
          </DialogTitle>
          <DialogContent>
            {result && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Generated <strong>{result.totalRecords}</strong> sample records (not saved to database)
                </Alert>
                <Typography variant="subtitle2" gutterBottom>
                  Records generated by type:
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {result.created && Object.entries(result.created).map(([key, value]) => (
                      <ListItem key={key} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                              <Chip label={value as number} size="small" color="primary" />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadData}
              color="primary"
            >
              Download JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<ImportIcon />}
              onClick={() => setShowImportConfirmDialog(true)}
              color="success"
            >
              Import to Database
            </Button>
            <Button onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import Confirmation Dialog */}
        <Dialog open={showImportConfirmDialog} onClose={() => setShowImportConfirmDialog(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Import to Database?
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              This will insert <strong>{result?.totalRecords || 0} records</strong> into your PostgreSQL database.
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. The data will be permanently added to your database.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowImportConfirmDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <ImportIcon />}
              onClick={handleImportToDatabase}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import Result Dialog */}
        <Dialog
          open={showImportResultDialog}
          onClose={() => setShowImportResultDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon color="success" />
              Data Imported Successfully!
            </Box>
          </DialogTitle>
          <DialogContent>
            {importResult && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Imported <strong>{importResult.totalRecords}</strong> records into the database
                </Alert>
                <Typography variant="subtitle2" gutterBottom>
                  Records imported by type:
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {importResult.imported && Object.entries(importResult.imported).map(([key, value]) => (
                      <ListItem key={key} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                              <Chip label={value as number} size="small" color="success" />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => {
              setShowImportResultDialog(false);
              setResult(null);
            }}>
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading overlay for import */}
        {importing && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">Importing data to database...</Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a few moments
              </Typography>
            </Card>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
