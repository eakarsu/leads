'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

const roleOptions = [
  'DECISION_MAKER',
  'INFLUENCER',
  'ECONOMIC_BUYER',
  'TECHNICAL_BUYER',
  'CHAMPION',
  'EVALUATOR',
  'END_USER',
];

type Opportunity = {
  id: string;
  name: string;
  stage?: string;
  amount?: number;
};

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  title?: string;
};

type ContactRole = {
  id: string;
  opportunityId: string;
  contactId: string;
  role: string;
  isPrimary: boolean;
  createdAt: string;
  contact?: Contact;
  opportunity?: { id: string; name: string };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Opportunity contact role request failed';
}

function roleLabel(role: string) {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OpportunityContactRolesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [roles, setRoles] = useState<ContactRole[]>([]);
  const [opportunityId, setOpportunityId] = useState('');
  const [contactId, setContactId] = useState('');
  const [role, setRole] = useState('DECISION_MAKER');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.id === opportunityId),
    [opportunities, opportunityId]
  );

  const loadReferenceData = useCallback(async () => {
    const [opportunitiesResponse, contactsResponse] = await Promise.all([
      fetch('/api/opportunities?pageSize=100'),
      fetch('/api/contacts?pageSize=100'),
    ]);
    const opportunitiesPayload = await opportunitiesResponse.json() as { error?: string; data?: Opportunity[] };
    const contactsPayload = await contactsResponse.json() as { error?: string; data?: Contact[] };
    if (!opportunitiesResponse.ok) throw new Error(opportunitiesPayload.error || 'Failed to load opportunities');
    if (!contactsResponse.ok) throw new Error(contactsPayload.error || 'Failed to load contacts');

    const nextOpportunities = opportunitiesPayload.data || [];
    const nextContacts = contactsPayload.data || [];
    setOpportunities(nextOpportunities);
    setContacts(nextContacts);
    if (!opportunityId && nextOpportunities[0]) setOpportunityId(nextOpportunities[0].id);
    if (!contactId && nextContacts[0]) setContactId(nextContacts[0].id);
  }, [contactId, opportunityId]);

  const loadRoles = useCallback(async () => {
    if (!opportunityId) {
      setRoles([]);
      return;
    }
    const response = await fetch(`/api/opportunity-contact-roles?opportunityId=${opportunityId}`);
    const payload = await response.json() as ContactRole[] | { error?: string };
    if (!response.ok) {
      throw new Error(Array.isArray(payload) ? 'Failed to load contact roles' : payload.error || 'Failed to load contact roles');
    }
    setRoles(Array.isArray(payload) ? payload : []);
  }, [opportunityId]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await loadReferenceData();
      await loadRoles();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadReferenceData, loadRoles]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!opportunityId) return;
    loadRoles().catch((err) => setError(errorMessage(err)));
  }, [loadRoles, opportunityId]);

  const createRole = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/opportunity-contact-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, contactId, role, isPrimary }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create opportunity contact role');
      setSuccess('Contact role added to the opportunity');
      setIsPrimary(false);
      await loadRoles();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Opportunity Contact Roles</Typography>
            <Typography color="text.secondary">
              Map buying committee members to opportunities and identify the primary relationship owner.
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadPage}>
            Refresh
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Opportunity</InputLabel>
                <Select label="Opportunity" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>
                  {opportunities.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}{item.stage ? ` - ${roleLabel(item.stage)}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Contact</InputLabel>
                <Select label="Contact" value={contactId} onChange={(event) => setContactId(event.target.value)}>
                  {contacts.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}{item.email ? ` - ${item.email}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Role</InputLabel>
                <Select label="Role" value={role} onChange={(event) => setRole(event.target.value)}>
                  {roleOptions.map((option) => (
                    <MenuItem key={option} value={option}>{roleLabel(option)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} />}
                label="Primary"
              />
              <Button
                startIcon={<GroupAddIcon />}
                variant="contained"
                onClick={createRole}
                disabled={saving || !opportunityId || !contactId}
              >
                Add Role
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
              <Box>
                <Typography variant="h6">Buying Committee</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedOpportunity ? selectedOpportunity.name : 'Select an opportunity'} has {roles.length} contact role{roles.length === 1 ? '' : 's'}.
                </Typography>
              </Box>
            </Stack>

            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Contact</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Primary</TableCell>
                    <TableCell>Added</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(item)}>
                      <TableCell>{item.contact ? `${item.contact.firstName} ${item.contact.lastName}` : item.contactId}</TableCell>
                      <TableCell>{item.contact?.title || '-'}</TableCell>
                      <TableCell>{item.contact?.email || '-'}</TableCell>
                      <TableCell><Chip size="small" label={roleLabel(item.role)} /></TableCell>
                      <TableCell>{item.isPrimary ? <Chip color="primary" size="small" label="Primary" /> : '-'}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {!roles.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No contact roles for this opportunity yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Opportunity Contact Role Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
