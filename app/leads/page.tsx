'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/DashboardLayout';

type LeadRow = {
  id: string; fullName: string; email: string | null; phone: string | null; company: string | null;
  governance: { stage: string; version: number; region: string; ownerId: string } | null;
  _count: { activities: number; outreach: number };
};

const stages = ['', 'CAPTURED', 'DEDUPED', 'ENRICHED', 'REVIEW_PENDING', 'OUTREACH_APPROVED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'HANDOFF_PENDING', 'HANDED_OFF', 'RETRY_PENDING', 'CONVERTED', 'DISQUALIFIED', 'SUPPRESSED'];

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', company: '', title: '', region: 'US', lawfulBasis: '' });
  const clientId = session?.user?.clientId;

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    const query = new URLSearchParams();
    if (clientId) query.set('clientId', clientId);
    if (stage) query.set('stage', stage);
    const response = await fetch(`/api/leads?${query}`);
    const body = await response.json();
    if (response.ok) { setRows(body.data); setError(''); } else setError(body.message || 'Leads could not be loaded');
    setLoading(false);
  }, [clientId, stage, status]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch('/api/leads', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, clientId, email: form.email || null, phone: form.phone || null, lawfulBasis: form.lawfulBasis || null }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) { setError(body.message || 'Lead could not be created'); return; }
    setOpen(false);
    setForm({ fullName: '', email: '', phone: '', company: '', title: '', region: 'US', lawfulBasis: '' });
    await load();
  }

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h4" fontWeight={700}>Governed leads</Typography><Typography color="text.secondary">Deduplicated capture with explicit lifecycle and ownership.</Typography></Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Capture lead</Button>
      </Box>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Card variant="outlined">
        <CardContent>
          <TextField select size="small" label="Lifecycle stage" value={stage} onChange={(event) => setStage(event.target.value)} sx={{ minWidth: 240, mb: 2 }}>
            {stages.map((value) => <MenuItem key={value || 'ALL'} value={value}>{value || 'All stages'}</MenuItem>)}
          </TextField>
          {loading ? <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box> : (
            <Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Company</TableCell><TableCell>Destination</TableCell><TableCell>Stage</TableCell><TableCell>Region</TableCell><TableCell>Activity</TableCell></TableRow></TableHead>
              <TableBody>{rows.map((lead) => (
                <TableRow key={lead.id} hover onClick={() => router.push(`/leads/${lead.id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{lead.fullName}</TableCell><TableCell>{lead.company || '—'}</TableCell><TableCell>{lead.email || lead.phone || '—'}</TableCell>
                  <TableCell><Chip size="small" label={lead.governance?.stage || 'UNGOVERNED'} color={lead.governance?.stage === 'SUPPRESSED' ? 'error' : lead.governance?.stage === 'CONVERTED' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{lead.governance?.region || '—'}</TableCell><TableCell>{lead._count.activities} activities · {lead._count.outreach} outreach</TableCell>
                </TableRow>
              ))}{rows.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No leads match this filter.</TableCell></TableRow> : null}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={create}><DialogTitle>Capture a lead</DialogTitle><DialogContent>
          <TextField required fullWidth label="Full name" margin="normal" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          <TextField fullWidth type="email" label="Email" margin="normal" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextField fullWidth label="Phone" margin="normal" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <TextField fullWidth label="Company" margin="normal" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
          <TextField fullWidth label="Title" margin="normal" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField required fullWidth label="Privacy region" margin="normal" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value.toUpperCase() })} />
          <TextField fullWidth label="Lawful basis" helperText="For example: EXPLICIT_CONSENT" margin="normal" value={form.lawfulBasis} onChange={(event) => setForm({ ...form, lawfulBasis: event.target.value })} />
          {!form.email && !form.phone && !form.company ? <Alert severity="info" sx={{ mt: 2 }}>Email, phone, or company is required for deterministic deduplication.</Alert> : null}
        </DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Capturing…' : 'Capture'}</Button></DialogActions></Box>
      </Dialog>
    </DashboardLayout>
  );
}
