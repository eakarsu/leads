'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  LinearProgress,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { industryFields, type CustomField } from '@/lib/industry-fields';
import VoiceInput from '@/components/VoiceInput';

interface Lead {
  id: string;
  fullName: string;
  company: string | null;
  title: string | null;
  email: string;
  status: string;
  qualificationScore: number;
  leadSource: string;
  campaign: {
    name: string;
  } | null;
  client: {
    name: string;
  };
  _count: {
    activities: number;
  };
}

export default function LeadsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [leadSourceFilter, setLeadSourceFilter] = useState('');
  const [inputMode, setInputMode] = useState<'manual' | 'ai' | 'voice'>('manual');
  const [aiInputText, setAiInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(10);
  const [importSector, setImportSector] = useState('');

  const [formData, setFormData] = useState({
    campaignId: '',
    clientId: '',
    fullName: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    source: '',
    customFields: {} as Record<string, any>,
  });

  useEffect(() => {
    fetchLeads();
    fetchCampaigns();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [leadSourceFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (leadSourceFilter) params.append('leadSource', leadSourceFilter);

      const url = `/api/leads${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleAIParse = async () => {
    if (!aiInputText.trim()) return;

    setParsing(true);
    setError('');

    try {
      const businessSector = (session?.user as any)?.businessSector;

      const response = await fetch('/api/leads/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiInputText,
          businessSector: businessSector,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse lead information');
      }

      const result = await response.json();
      const parsed = result.data;

      // Pre-fill the form with parsed data
      setFormData({
        ...formData,
        ...parsed.commonFields,
        customFields: parsed.customFields || {},
      });

      // Switch to manual mode so user can review
      setInputMode('manual');
      setAiInputText('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse lead information');
    } finally {
      setParsing(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create lead');

      setOpenDialog(false);
      setFormData({
        campaignId: '',
        clientId: '',
        fullName: '',
        company: '',
        title: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        source: '',
        customFields: {},
      });
      setInputMode('manual');
      setAiInputText('');
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkImport = async () => {
    if (!importSector) {
      setError('Please select a business sector');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const response = await fetch('/api/seed/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: importSector,
          count: importCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import seed data');
      }

      const result = await response.json();

      setImportDialog(false);
      setImportSector('');
      setImportCount(10);
      fetchLeads();

      // Show success message with counts
      alert(`Successfully imported seed data!\n\nClients: ${result.created.clients}\nCampaigns: ${result.created.campaigns}\nLeads: ${result.created.leads}\nContacts: ${result.created.contacts}\nOpportunities: ${result.created.opportunities}\nTasks: ${result.created.tasks}\nProducts: ${result.created.products}\nActivities: ${result.created.activities}\nEmails: ${result.created.emails}\nWorkflows: ${result.created.workflows}`);
    } catch (err: any) {
      setError(err.message || 'Failed to import seed data');
    } finally {
      setImporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'success';
      case 'QUALIFIED':
        return 'info';
      case 'CONTACTED':
        return 'warning';
      case 'LOST':
      case 'UNQUALIFIED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  const businessSector = (session?.user as any)?.businessSector;
  const sectorName = businessSector?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

  // Example lead data for each business sector
  const sectorExamples: Record<string, string[]> = {
    HOME_SERVICES: [
      `Sarah Johnson, homeowner at 456 Oak Street
AC stopped working last night, urgent need
2,500 sq ft residential home
Budget: $8,000 - $12,000
Needs installation within 1 week
sarah.j@email.com
Phone: (555) 234-5678
Found us through Google search`,
      `Mike Chen - Property Manager
Commercial building needs complete HVAC overhaul
15,000 sq ft office complex, 3 floors
Looking for maintenance contract too
Budget approved: $45,000
Timeline: Before winter (3 months)
mike.chen@propertygroup.com / 555-987-6543
Referral from existing client`
    ],
    LEGAL_SERVICES: [
      `Jennifer Martinez
Car accident victim, rear-ended at stoplight 3 weeks ago
Neck and back pain, ongoing physical therapy
Other driver's insurance denying claim
Medical bills: $15,000 so far
jennifer.m82@email.com
(555) 123-4567
Referred by friend who used your firm`,
      `Robert Williams, needs divorce attorney
Married 8 years, 2 children (ages 5 and 7)
Spouse filed papers last month
Need help with custody and asset division
Own home together, value ~$400k
robert.williams@email.com
555-876-5432
Found firm through online search`
    ],
    FINANCIAL_SERVICES: [
      `David and Lisa Thompson
Looking for life insurance for both spouses
Ages: 35 and 33, both healthy non-smokers
2 young children, need $750k coverage each
Prefer term life, 30-year policy
Budget: $200/month combined
david.thompson@email.com
Phone: 555-345-6789
Referral from financial advisor`,
      `James Rodriguez, first-time homebuyer
Pre-approved for $350k mortgage
Good credit score (740)
20% down payment ready
Looking at homes in suburbs
Want to close within 60 days
james.r@email.com / 555-456-7890
Found us on Zillow`
    ],
    REAL_ESTATE: [
      `Amanda Chen, ready to buy first home
Budget: $400,000 - $500,000
Pre-approved with 15% down
Looking for 3BR/2BA in downtown area
Good school district important
Flexible on move-in date
amanda.chen@email.com
(555) 234-5678
Referred by coworker`,
      `Tom Anderson selling family home
4BR/3BA house, 2,800 sq ft
Recently updated kitchen and bathrooms
Need to sell by end of quarter
Asking $625,000 (comps at $600-650k)
tom.anderson@email.com
555-789-0123
Saw your For Sale signs in neighborhood`
    ],
    HEALTHCARE: [
      `Emily Parker wants cosmetic dentistry consultation
Getting married in 8 months
Interested in teeth whitening and veneers
Has dental insurance (MetLife)
Age 28, no major dental issues
emily.parker@email.com
Phone: 555-345-6789
Instagram ad brought her here`,
      `The Johnson Family - new patients
Family of 4 (parents + kids ages 8 and 11)
Need general dentist for whole family
Looking for cleaning, checkups, preventive care
Have dental insurance through employer
Want same-day appointments if possible
mjohnson@email.com / 555-678-9012
Moving to area, found you on Google`
    ],
    B2B_SAAS: [
      `Rachel Kim - VP of Sales at TechStart Inc
Company has 120 employees, growing fast
Current CRM (Salesforce) too expensive and complex
Need something easier for sales team to use
Budget: $30,000 - $50,000 annually
Want to switch by Q2
rachel.kim@techstart.io
Phone: 555-234-5678
Saw demo at SaaStr conference`,
      `Michael Brown, CTO at FinanceHub
200-person fintech company
Need better project management tool
Current tool: Jira (team hates it)
Looking for something more visual and collaborative
Budget approved: $25k/year
Timeline: Need to migrate within 90 days
michael.b@financehub.com
555-876-5432
LinkedIn outreach`
    ],
    EDUCATION: [
      `Jessica Taylor - career changer
Currently working in retail management (5 years)
Wants to transition to web development
No coding experience but very motivated
Can commit to full-time bootcamp
Needs financing options
jessica.taylor@email.com
(555) 123-4567
Saw Facebook ad`,
      `Kevin Martinez - software engineer
Want to learn data science and machine learning
Has CS degree, 3 years experience
Employer will cover tuition
Prefers part-time evening classes
Goal: move to data science role within company
kevin.martinez@email.com / 555-345-6789
Found you through Google search for bootcamps`
    ],
    AUTOMOTIVE: [
      `Sarah Williams looking for family SUV
Need 3-row seating for 3 kids
Budget: $40,000 - $50,000
Interested in Honda Pilot or Toyota Highlander
Have 2019 Honda Accord to trade in
Good credit, need financing
sarah.williams@email.com
555-234-5678
Saw dealership ad on Facebook`,
      `Jason Chen ready to buy Tesla Model 3
Interested in Long Range model
Budget: $50,000 max
Have $12,000 for down payment
Excellent credit (780)
Want delivery within 2 weeks
jason.chen@email.com
(555) 789-0123
Researching online, ready to buy now`
    ]
  };

  const currentExamples = businessSector && sectorExamples[businessSector]
    ? sectorExamples[businessSector]
    : [];

  // Get industry-specific fields for the user's business sector
  const customFieldsConfig = businessSector && industryFields[businessSector]
    ? industryFields[businessSector]
    : [];

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldName]: value,
      },
    });
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData.customFields[field.name] || '';

    if (field.type === 'select') {
      return (
        <TextField
          key={field.name}
          select
          label={field.label}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
          fullWidth
          required={field.required}
          helperText={field.helperText}
        >
          {field.options?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (field.type === 'textarea') {
      return (
        <TextField
          key={field.name}
          label={field.label}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
          fullWidth
          multiline
          rows={3}
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helperText}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <TextField
          key={field.name}
          type="date"
          label={field.label}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
          fullWidth
          required={field.required}
          InputLabelProps={{ shrink: true }}
          helperText={field.helperText}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <TextField
          key={field.name}
          type="number"
          label={field.label}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
          fullWidth
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helperText}
        />
      );
    }

    // Default: text field
    return (
      <TextField
        key={field.name}
        label={field.label}
        value={value}
        onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
        fullWidth
        required={field.required}
        placeholder={field.placeholder}
        helperText={field.helperText}
      />
    );
  };

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Leads</Typography>
            {businessSector && businessSector !== 'GENERAL' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Business Sector: {sectorName}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => setImportDialog(true)}
            >
              Import Seed Data
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Lead
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                select
                label="Lead Source"
                value={leadSourceFilter}
                onChange={(e) => {
                  setLeadSourceFilter(e.target.value);
                }}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Sources</MenuItem>
                <MenuItem value="AGENCY">Agency</MenuItem>
                <MenuItem value="CLIENT_SUBMITTED">Client Submitted</MenuItem>
                <MenuItem value="IMPORTED">Imported</MenuItem>
                <MenuItem value="API">API</MenuItem>
                <MenuItem value="MANUAL">Manual</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  setLeadSourceFilter('');
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Activities</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No leads found. Create your first lead!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <TableCell>{lead.fullName}</TableCell>
                        <TableCell>{lead.company || '-'}</TableCell>
                        <TableCell>{lead.title || '-'}</TableCell>
                        <TableCell>{lead.campaign?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={lead.leadSource?.replace('_', ' ') || 'AGENCY'}
                            size="small"
                            color={lead.leadSource === 'CLIENT_SUBMITTED' ? 'secondary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.status}
                            size="small"
                            color={getStatusColor(lead.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{lead.qualificationScore}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={lead.qualificationScore}
                              sx={{ width: 50, height: 6, borderRadius: 3 }}
                              color={getScoreColor(lead.qualificationScore) as any}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{lead._count.activities}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create Lead Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box>
              <Typography variant="h6">Create New Lead</Typography>
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                onChange={(e, value) => {
                  if (value) setInputMode(value as 'manual' | 'ai' | 'voice');
                }}
                size="small"
                sx={{ mt: 2 }}
              >
                <ToggleButton value="manual">
                  Manual Entry
                </ToggleButton>
                <ToggleButton value="ai">
                  <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  AI Parse
                </ToggleButton>
                <ToggleButton value="voice">
                  <MicIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Voice Input
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </DialogTitle>
          <DialogContent>
            {inputMode === 'voice' ? (
              <Box sx={{ pt: 2 }}>
                <VoiceInput
                  onTranscriptComplete={async (text) => {
                    setAiInputText(text);
                    setInputMode('ai');
                    // Auto-trigger AI parsing
                    setTimeout(() => {
                      handleAIParse();
                    }, 500);
                  }}
                  language="en-US"
                />
              </Box>
            ) : inputMode === 'ai' ? (
              <Box sx={{ pt: 2 }}>
                {currentExamples.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Try these examples for {sectorName}:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {currentExamples.map((example, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          onClick={() => setAiInputText(example)}
                        >
                          Example {index + 1}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
                <TextField
                  label="Paste Lead Information"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  fullWidth
                  multiline
                  rows={14}
                  placeholder={`Paste any lead information here in any format...

The AI will automatically extract:
- Contact details (name, email, phone)
- ${sectorName} specific information
- Budget, timeline, and other relevant details

Just paste the text and click "Parse with AI"!`}
                  helperText="Paste any lead information in any format - AI will extract the relevant fields"
                />
                <Button
                  variant="contained"
                  onClick={handleAIParse}
                  disabled={parsing || !aiInputText.trim()}
                  startIcon={parsing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                  sx={{ mt: 2 }}
                  fullWidth
                  size="large"
                >
                  {parsing ? 'Parsing with AI...' : 'Parse with AI'}
                </Button>
              </Box>
            ) : (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Only show Client field if user is not a CLIENT, or if CLIENT doesn't have clientId */}
              {(session?.user?.role !== 'CLIENT' || !(session.user as any).clientId) && (
                <TextField
                  select
                  label="Client"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  fullWidth
                  required={session?.user?.role !== 'CLIENT'}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                select
                label="Campaign"
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                fullWidth
                helperText="Optional - can be assigned later"
              >
                <MenuItem value="">
                  <em>None (assign later)</em>
                </MenuItem>
                {campaigns
                  .filter((c) => {
                    // For CLIENT role users, use their clientId from session
                    const clientIdToFilter = session?.user?.role === 'CLIENT'
                      ? (session.user as any).clientId
                      : formData.clientId;
                    return !clientIdToFilter || c.clientId === clientIdToFilter;
                  })
                  .map((campaign) => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                fullWidth
                helperText={businessSector === 'B2B_SAAS' ? 'Required for B2B leads' : 'Optional'}
              />

              <TextField
                label="Title / Job Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                helperText={businessSector === 'B2B_SAAS' ? 'Required for B2B leads' : 'Optional'}
              />

              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />

              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />

              <TextField
                label="LinkedIn URL"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                fullWidth
              />

              <TextField
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                fullWidth
                placeholder="e.g., LinkedIn, Website, Referral"
              />

              {/* Industry-Specific Custom Fields */}
              {customFieldsConfig.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {sectorName} Specific Information
                    </Typography>
                  </Divider>
                  {customFieldsConfig.map((field) => renderCustomField(field))}
                </>
              )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setInputMode('manual');
              setAiInputText('');
            }}>Cancel</Button>
            {inputMode === 'manual' && (
              <Button
                onClick={handleCreateLead}
                variant="contained"
                disabled={
                  !formData.fullName ||
                  // Client field required for non-CLIENT users OR CLIENT users without clientId
                  ((session?.user?.role !== 'CLIENT' || !(session.user as any).clientId) && !formData.clientId)
                }
              >
                Create Lead
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Import Seed Data Dialog */}
        <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Import Seed Data</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                This will generate realistic test data for all CRM modules (Clients, Campaigns, Leads, Contacts, Opportunities, Tasks, Products, Activities, Emails, Workflows) based on the selected business sector.
              </Alert>

              <TextField
                select
                label="Business Sector"
                value={importSector}
                onChange={(e) => setImportSector(e.target.value)}
                fullWidth
                required
                helperText="Select the business sector for realistic data"
              >
                <MenuItem value="HOME_SERVICES">Home Services</MenuItem>
                <MenuItem value="LEGAL_SERVICES">Legal Services</MenuItem>
                <MenuItem value="FINANCIAL_SERVICES">Financial Services</MenuItem>
                <MenuItem value="REAL_ESTATE">Real Estate</MenuItem>
                <MenuItem value="HEALTHCARE">Healthcare</MenuItem>
                <MenuItem value="B2B_SAAS">B2B SaaS</MenuItem>
                <MenuItem value="EDUCATION">Education</MenuItem>
                <MenuItem value="AUTOMOTIVE">Automotive</MenuItem>
                <MenuItem value="HOSPITALITY">Hospitality</MenuItem>
                <MenuItem value="FITNESS_WELLNESS">Fitness & Wellness</MenuItem>
                <MenuItem value="CONSTRUCTION">Construction</MenuItem>
                <MenuItem value="ECOMMERCE">E-Commerce</MenuItem>
                <MenuItem value="INSURANCE">Insurance</MenuItem>
                <MenuItem value="SOLAR_ENERGY">Solar Energy</MenuItem>
                <MenuItem value="GENERAL">General</MenuItem>
              </TextField>

              <TextField
                type="number"
                label="Number of Records"
                value={importCount}
                onChange={(e) => setImportCount(parseInt(e.target.value) || 10)}
                fullWidth
                required
                helperText="How many records to generate for each module"
                inputProps={{ min: 1, max: 50 }}
              />

              <Alert severity="warning">
                This will create approximately {importCount * 10} total records across all modules. This operation may take a few seconds.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialog(false)} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              variant="contained"
              disabled={importing || !importSector}
              startIcon={importing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
