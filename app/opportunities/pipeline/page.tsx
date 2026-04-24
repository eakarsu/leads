'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/DashboardLayout';
import KanbanCard from '@/components/KanbanCard';
import KanbanColumn from '@/components/KanbanColumn';

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  client: {
    name: string;
  };
  contact: {
    firstName: string;
    lastName: string;
  } | null;
}

interface PipelineData {
  pipeline: {
    PROSPECTING: Opportunity[];
    QUALIFICATION: Opportunity[];
    NEEDS_ANALYSIS: Opportunity[];
    PROPOSAL: Opportunity[];
    NEGOTIATION: Opportunity[];
  };
  totals: {
    PROSPECTING: number;
    QUALIFICATION: number;
    NEEDS_ANALYSIS: number;
    PROPOSAL: number;
    NEGOTIATION: number;
  };
  totalWeightedValue: number;
  totalCount: number;
}

const STAGE_PROBABILITY: Record<string, number> = {
  PROSPECTING: 10,
  QUALIFICATION: 25,
  NEEDS_ANALYSIS: 50,
  PROPOSAL: 65,
  NEGOTIATION: 80,
};

export default function PipelineViewPage() {
  const router = useRouter();
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const response = await fetch('/api/opportunities/pipeline');
      if (!response.ok) throw new Error('Failed to fetch pipeline');
      const data = await response.json();
      setPipelineData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING': return '#e3f2fd';
      case 'QUALIFICATION': return '#fff3e0';
      case 'NEEDS_ANALYSIS': return '#e8f5e9';
      case 'PROPOSAL': return '#f3e5f5';
      case 'NEGOTIATION': return '#fce4ec';
      default: return '#f5f5f5';
    }
  };

  const stages = [
    { key: 'PROSPECTING', label: 'Prospecting' },
    { key: 'QUALIFICATION', label: 'Qualification' },
    { key: 'NEEDS_ANALYSIS', label: 'Needs Analysis' },
    { key: 'PROPOSAL', label: 'Proposal' },
    { key: 'NEGOTIATION', label: 'Negotiation' },
  ];

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (oppId: string, newStage: string) => {
    if (!pipelineData) return;

    // Find the opportunity and its current stage
    let currentStage = '';
    let opp: Opportunity | undefined;
    for (const [stage, opps] of Object.entries(pipelineData.pipeline)) {
      const found = opps.find((o) => o.id === oppId);
      if (found) {
        currentStage = stage;
        opp = found;
        break;
      }
    }

    if (!opp || currentStage === newStage) return;

    const newProbability = STAGE_PROBABILITY[newStage] || opp.probability;

    // Optimistic update
    setPipelineData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const pipeline = { ...updated.pipeline };

      // Remove from old stage
      const oldStageOpps = [...(pipeline[currentStage as keyof typeof pipeline] || [])];
      pipeline[currentStage as keyof typeof pipeline] = oldStageOpps.filter((o) => o.id !== oppId) as any;

      // Add to new stage with updated probability
      const movedOpp = { ...opp!, probability: newProbability };
      const newStageOpps = [...(pipeline[newStage as keyof typeof pipeline] || [])];
      newStageOpps.push(movedOpp);
      pipeline[newStage as keyof typeof pipeline] = newStageOpps as any;

      // Recalculate totals
      const totals = { ...updated.totals };
      totals[currentStage as keyof typeof totals] = pipeline[currentStage as keyof typeof pipeline].reduce(
        (sum: number, o: Opportunity) => sum + (o.amount * o.probability) / 100, 0
      );
      totals[newStage as keyof typeof totals] = pipeline[newStage as keyof typeof pipeline].reduce(
        (sum: number, o: Opportunity) => sum + (o.amount * o.probability) / 100, 0
      );

      const totalWeightedValue = Object.values(totals).reduce((sum, v) => sum + v, 0);

      return { ...updated, pipeline: pipeline as any, totals, totalWeightedValue };
    });

    // API call to persist
    try {
      const response = await fetch(`/api/opportunities/${oppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, probability: newProbability }),
      });
      if (!response.ok) {
        throw new Error('Failed to update stage');
      }
    } catch (err: any) {
      setError(err.message);
      // Revert on failure
      fetchPipeline();
    }
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

  if (!pipelineData) {
    return (
      <DashboardLayout>
        <Alert severity="error">Failed to load pipeline data</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">Sales Pipeline</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/opportunities')}>
              New Opportunity
            </Button>
          </Box>
          <Box display="flex" gap={3} mt={2}>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Opportunities</Typography>
                <Typography variant="h5">{pipelineData.totalCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Weighted Value</Typography>
                <Typography variant="h5" color="primary">{formatCurrency(pipelineData.totalWeightedValue)}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {stages.map((stage) => {
            const opportunities = pipelineData.pipeline[stage.key as keyof typeof pipelineData.pipeline];
            const total = pipelineData.totals[stage.key as keyof typeof pipelineData.totals];

            return (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={stage.key}>
                <KanbanColumn
                  stageKey={stage.key}
                  label={stage.label}
                  count={opportunities.length}
                  totalValue={total}
                  bgColor={getStageColor(stage.key)}
                  onDrop={handleDrop}
                >
                  {opportunities.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No opportunities
                    </Typography>
                  ) : (
                    opportunities.map((opp) => (
                      <KanbanCard
                        key={opp.id}
                        id={opp.id}
                        name={opp.name}
                        amount={opp.amount}
                        probability={opp.probability}
                        closeDate={opp.expectedCloseDate}
                        clientName={opp.client.name}
                        onDragStart={handleDragStart}
                        onClick={() => router.push(`/opportunities/${opp.id}`)}
                      />
                    ))
                  )}
                </KanbanColumn>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
