'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import NextBestActions from '@/components/NextBestActions';
import EinsteinBots from '@/components/EinsteinBots';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SyncIcon from '@mui/icons-material/Sync';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import ArticleIcon from '@mui/icons-material/Article';

interface AIInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  priority: string;
  actionItems: string[];
  createdAt: string;
}

interface Forecast {
  id: string;
  period: string;
  forecastType: string;
  predictedAmount: number;
  confidence: number;
  createdAt: string;
}

interface Lead {
  id: string;
  fullName: string;
  company: string | null;
  email: string;
  status: string;
  aiScore?: number;
  aiConfidence?: number;
}

interface Account {
  id: string;
  name: string;
  industry: string | null;
  healthScore?: number;
  healthStatus?: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  client: { name: string } | null;
}

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  stage: string;
  client: { name: string };
  winProbability?: number;
  aiConfidence?: number;
}

const normalizeInsights = (payload: unknown): AIInsight[] => {
  const items =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : [];

  return items.map((insight) => {
    const item = insight as AIInsight;
    return {
      ...item,
      actionItems: Array.isArray(item.actionItems) ? item.actionItems : [],
    };
  });
};

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const readRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeLeadScore = (payload: unknown): { score?: number; confidence?: number } => {
  const data = readRecord(payload);
  const prediction = readRecord(data.prediction);
  const score = readNumber(data.score) ?? readNumber(prediction.score);
  const confidence = readNumber(data.confidence) ?? readNumber(prediction.confidence);

  return {
    score,
    confidence: confidence !== undefined && confidence > 1 ? confidence / 100 : confidence,
  };
};

export default function EinsteinPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInsights, setEmailInsights] = useState<any>(null);
  const [emailForm, setEmailForm] = useState({
    recipientType: 'Lead',
    recipientId: '',
    context: '',
    purpose: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({});
  const [searchInsights, setSearchInsights] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [engagementScores, setEngagementScores] = useState<any[]>([]);
  const [conversationInsights, setConversationInsights] = useState<any>(null);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [activityCapture, setActivityCapture] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [caseSubject, setCaseSubject] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseClassification, setCaseClassification] = useState<any>(null);
  const [articleQuery, setArticleQuery] = useState('');
  const [articleRecommendations, setArticleRecommendations] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState('');

  useEffect(() => {
    fetchInsights();
    fetchForecasts();
    if (tabValue === 2) fetchLeads();
    if (tabValue === 3) fetchOpportunities();
    if (tabValue === 4) fetchAccounts();
    if (tabValue === 6) fetchEmails();
    if (tabValue === 9) { fetchEmails(); fetchEvents(); }
    if (tabValue === 12) fetchAnalytics();
  }, [tabValue]);

  useEffect(() => {
    if (emailDialogOpen) {
      if (leads.length === 0) fetchLeads();
      if (accounts.length === 0) fetchAccounts();
      if (contacts.length === 0) fetchContacts();
      if (opportunities.length === 0) fetchOpportunities();
    }
  }, [emailDialogOpen]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      setInsights(normalizeInsights(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecasts = async () => {
    try {
      const response = await fetch('/api/ai/generate-forecast');
      if (!response.ok) return;
      const data = await response.json();
      setForecasts(data.forecasts || []);
    } catch (err: any) {
      // Silently fail
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setLeads(arr.slice(0, 10)); // Top 10 leads
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setAccounts(arr.slice(0, 10)); // Top 10 accounts
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setEvents(arr.slice(0, 10));
    } catch (err: any) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchAnalytics = async () => {
    if (analyticsData) return;
    try {
      const [leadsRes, oppsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/opportunities'),
      ]);
      const leadsJson = await leadsRes.json();
      const oppsJson = await oppsRes.json();
      const allLeads = Array.isArray(leadsJson) ? leadsJson : leadsJson.data || [];
      const allOpps = Array.isArray(oppsJson) ? oppsJson : oppsJson.data || [];

      if (leads.length === 0) setLeads(allLeads.slice(0, 10));
      if (opportunities.length === 0) setOpportunities(allOpps.slice(0, 50));

      const totalLeads = allLeads.length;
      const wonLeads = allLeads.filter((l: any) => l.status === 'WON').length;
      const qualifiedLeads = allLeads.filter((l: any) => l.status === 'QUALIFIED' || l.status === 'WON').length;
      const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
      const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

      const totalOpps = allOpps.length;
      const closedWon = allOpps.filter((o: any) => o.stage === 'CLOSED_WON').length;
      const closedLost = allOpps.filter((o: any) => o.stage === 'CLOSED_LOST').length;
      const openOpps = allOpps.filter((o: any) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST');
      const winRate = (closedWon + closedLost) > 0 ? Math.round((closedWon / (closedWon + closedLost)) * 100) : 0;
      const avgProbability = openOpps.length > 0 ? Math.round(openOpps.reduce((s: number, o: any) => s + (o.probability || 0), 0) / openOpps.length) : 0;
      const pipelineValue = openOpps.reduce((s: number, o: any) => s + (o.amount || 0), 0);
      const healthScore = Math.round((winRate * 0.4) + (avgProbability * 0.3) + (Math.min(conversionRate * 2, 30)));

      const prompt = `Analyze this CRM performance data and provide 3 concise, specific AI-powered insights:

Lead Metrics: ${totalLeads} total leads, ${wonLeads} won (${conversionRate}% conversion), ${qualifiedLeads} qualified (${qualificationRate}% qualification rate)
Opportunity Metrics: ${totalOpps} total, ${closedWon} won, ${closedLost} lost (${winRate}% win rate), ${openOpps.length} open, $${pipelineValue.toLocaleString()} pipeline value, ${avgProbability}% avg probability

Respond with ONLY a JSON array of 3 short insight strings (max 15 words each):
["<insight 1>", "<insight 2>", "<insight 3>"]`;

      const aiRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      let aiInsights: string[] = [];
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.response || aiData.message || '';
        try {
          const match = content.match(/\[[\s\S]*\]/);
          if (match) aiInsights = JSON.parse(match[0]);
        } catch { /* use empty */ }
      }

      setAnalyticsData({
        conversionRate,
        qualificationRate,
        winRate,
        avgProbability,
        pipelineValue,
        healthScore: Math.min(healthScore, 100),
        totalLeads,
        totalOpps,
        closedWon,
        closedLost,
        aiInsights,
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setContacts(arr.slice(0, 20));
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
    }
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/opportunities');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      const data = await response.json();
      const oppArr = Array.isArray(data) ? data : data.data || [];
      setOpportunities(oppArr.slice(0, 50)); // Top 50 opportunities
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreAllOpportunities = async () => {
    setGenerating(true);
    try {
      for (const opp of opportunities) {
        const response = await fetch(`/api/ai/opportunity-score/${opp.id}`);
        if (response.ok) {
          const data = await response.json();
          // Normalize winProbability to be between 0-100
          let winProb = data.prediction?.winProbability;
          if (winProb !== undefined) {
            // If it's in 0-1 range, convert to 0-100
            if (winProb <= 1) {
              winProb = winProb * 100;
            }
            // Clamp to 0-100 range
            winProb = Math.min(100, Math.max(0, winProb));
          }

          setOpportunities((prev) =>
            prev.map((o) =>
              o.id === opp.id
                ? { ...o, winProbability: winProb, aiConfidence: data.confidence }
                : o
            )
          );
        }
      }
      setSuccess('Opportunity scores generated!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/insights', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate insights');
      const data = await response.json();
      setInsights(normalizeInsights(data));
      setSuccess('AI insights generated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateForecast = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-forecast', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate forecast');
      const data = await response.json();
      setForecasts(data.forecasts);
      setSuccess('Revenue forecast generated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const scoreAllLeads = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      let scoredCount = 0;
      let failedCount = 0;

      for (const lead of leads) {
        const response = await fetch(`/api/ai/lead-score/${lead.id}`);
        if (!response.ok) {
          failedCount += 1;
          continue;
        }

        const data = await response.json();
        const leadScore = normalizeLeadScore(data);
        if (leadScore.score === undefined) {
          failedCount += 1;
          continue;
        }

        scoredCount += 1;
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, aiScore: leadScore.score, aiConfidence: leadScore.confidence }
              : l
          )
        );
      }

      if (scoredCount === 0) {
        throw new Error('No lead scores were generated. Check the AI configuration and try again.');
      }

      setSuccess(
        failedCount > 0
          ? `Generated scores for ${scoredCount} leads. ${failedCount} leads could not be scored.`
          : `Generated scores for ${scoredCount} leads.`
      );
      if (failedCount > 0) {
        setError(`${failedCount} leads could not be scored.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const analyzeAllAccounts = async () => {
    setGenerating(true);
    try {
      for (const account of accounts) {
        const response = await fetch(`/api/ai/account-insights/${account.id}`);
        if (response.ok) {
          const data = await response.json();
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === account.id
                ? { ...a, healthScore: data.healthScore, healthStatus: data.healthStatus }
                : a
            )
          );
        }
      }
      setSuccess('Account health analyzed!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateEmailInsights = async () => {
    if (!emailForm.recipientId) {
      setError('Please select a recipient');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/email-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: emailForm.recipientId,
          recipientType: emailForm.recipientType,
          context: emailForm.context,
          purpose: emailForm.purpose,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate email insights');
      const data = await response.json();
      setEmailInsights(data);
      setSuccess('Email insights generated!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const response = await fetch(`/api/ai/insights/${insightId}/dismiss`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to dismiss insight');
      setInsights(insights.filter((i) => i.id !== insightId));
      setSuccess('Insight dismissed');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const analyzeEngagement = async (emailSubject: string, recipientEmail: string) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/engagement-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: 'draft', subject: emailSubject, recipientEmail }),
      });
      if (!response.ok) throw new Error('Failed to analyze engagement');
      const data = await response.json();
      setEngagementScores([...engagementScores, { subject: emailSubject, recipient: recipientEmail, ...data }]);
      setSuccess('Engagement analysis complete!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const analyzeConversation = async () => {
    if (!transcriptInput.trim()) {
      setError('Please enter a conversation transcript');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/conversation-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptInput }),
      });
      if (!response.ok) throw new Error('Failed to analyze conversation');
      const data = await response.json();
      setConversationInsights(data);
      setSuccess('Conversation analyzed!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.results);
      setSearchInsights(data.aiInsights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const classifyCase = async () => {
    if (!caseSubject.trim()) {
      setError('Please enter a case subject');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/classify-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: caseSubject, description: caseDescription }),
      });
      if (!response.ok) throw new Error('Failed to classify case');
      const data = await response.json();
      setCaseClassification(data);
      setSuccess('Case classified successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const recommendArticles = async () => {
    if (!articleQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/ai/recommend-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: articleQuery }),
      });
      if (!response.ok) throw new Error('Failed to get recommendations');
      const data = await response.json();
      setArticleRecommendations(data.articles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'lead_conversion':
        return <TrendingUpIcon />;
      case 'opportunity_risk':
        return <LightbulbIcon />;
      case 'activity_recommendation':
        return <AutoAwesomeIcon />;
      case 'revenue_opportunity':
        return <TrendingUpIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (loading && tabValue === 0) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon fontSize="large" color="primary" />
            <Typography variant="h4">Einstein AI</Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                if (tabValue === 0) fetchInsights();
                if (tabValue === 1) fetchForecasts();
                if (tabValue === 2) fetchLeads();
                if (tabValue === 3) fetchAccounts();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {generating && (
          <Box mb={2}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" mt={1}>
              Einstein AI is analyzing...
            </Typography>
          </Box>
        )}

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="AI Insights" />
          <Tab label="Revenue Forecast" />
          <Tab label="Lead Scoring" />
          <Tab label="Opportunity Scoring" />
          <Tab label="Account Health" />
          <Tab label="Email Insights" />
          <Tab label="Engagement Scoring" />
          <Tab label="Next Best Actions" />
          <Tab label="Conversation Insights" />
          <Tab label="Activity Capture" />
          <Tab label="Einstein Search" />
          <Tab label="Einstein Bots" />
          <Tab label="Einstein Analytics" />
          <Tab label="Case Classification" />
          <Tab label="Article Recommendations" />
        </Tabs>

        {/* Tab 0: AI Insights */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {insights.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Box textAlign="center" py={4}>
                      <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No AI insights yet
                      </Typography>
                      <Typography color="text.secondary" mb={2}>
                        Generate AI insights to get smart recommendations for your sales pipeline
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={generateInsights}
                      >
                        Generate Insights
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={generateInsights}
                      disabled={generating}
                    >
                      Generate New Insights
                    </Button>
                  </Box>
                </Grid>
                {insights.map((insight) => (
                  <Grid size={{ xs: 12, md: 6 }} key={insight.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="flex-start" gap={2}>
                          <Box color="primary.main" mt={0.5}>
                            {getInsightIcon(insight.insightType)}
                          </Box>
                          <Box flex={1}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              mb={1}
                            >
                              <Typography variant="h6">{insight.title}</Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={insight.priority}
                                  size="small"
                                  color={getPriorityColor(insight.priority)}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => dismissInsight(insight.id)}
                                  title="Dismiss insight"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography color="text.secondary" paragraph>
                              {insight.description}
                            </Typography>
                            {insight.actionItems.length > 0 && (
                              <>
                                <Typography variant="subtitle2" gutterBottom>
                                  Recommended Actions:
                                </Typography>
                                <List dense>
                                  {insight.actionItems.map((action, idx) => (
                                    <ListItem key={idx}>
                                      <ListItemText primary={`• ${action}`} />
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(insight.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </>
            )}
          </Grid>
        )}

        {/* Tab 1: Revenue Forecast */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {forecasts.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Box textAlign="center" py={4}>
                      <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No revenue forecasts yet
                      </Typography>
                      <Typography color="text.secondary" mb={2}>
                        Generate AI-powered revenue forecasts based on your pipeline
                      </Typography>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<TrendingUpIcon />}
                        onClick={generateForecast}
                      >
                        Generate Forecast
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<TrendingUpIcon />}
                      onClick={generateForecast}
                      disabled={generating}
                    >
                      Regenerate Forecast
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Forecast
                      </Typography>
                      <List>
                        {forecasts
                          .filter((f) => f.forecastType === 'MONTHLY')
                          .map((forecast) => (
                            <ListItem key={forecast.id}>
                              <Box width="100%">
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                  {forecast.period}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(forecast.predictedAmount)}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={forecast.confidence * 100}
                                    sx={{ flex: 1 }}
                                  />
                                  <Typography variant="caption">
                                    {formatConfidence(forecast.confidence)} confidence
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quarterly Forecast
                      </Typography>
                      <List>
                        {forecasts
                          .filter((f) => f.forecastType === 'QUARTERLY')
                          .map((forecast) => (
                            <ListItem key={forecast.id}>
                              <Box width="100%">
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                  {forecast.period}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(forecast.predictedAmount)}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={forecast.confidence * 100}
                                    sx={{ flex: 1 }}
                                  />
                                  <Typography variant="caption">
                                    {formatConfidence(forecast.confidence)} confidence
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* Tab 2: Lead Scoring */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Lead Conversion Scores</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={scoreAllLeads}
                      disabled={generating}
                    >
                      Score All Leads
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Company</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>AI Score</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>{lead.fullName}</TableCell>
                            <TableCell>{lead.company || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip label={lead.status} size="small" />
                            </TableCell>
                            <TableCell>
                              {lead.aiScore !== undefined ? (
                                <Chip
                                  label={Math.round(lead.aiScore)}
                                  color={
                                    lead.aiScore >= 75
                                      ? 'success'
                                      : lead.aiScore >= 50
                                      ? 'warning'
                                      : 'error'
                                  }
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Not scored
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {lead.aiConfidence !== undefined
                                ? formatConfidence(lead.aiConfidence)
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Opportunity Scoring */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Opportunity Win Probability</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={scoreAllOpportunities}
                      disabled={generating || opportunities.length === 0}
                    >
                      Score All Opportunities
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Opportunity</TableCell>
                          <TableCell>Account</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Stage</TableCell>
                          <TableCell align="center">Win Probability</TableCell>
                          <TableCell align="center">Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {opportunities.map((opp) => (
                          <TableRow key={opp.id}>
                            <TableCell>{opp.name}</TableCell>
                            <TableCell>{opp.client.name}</TableCell>
                            <TableCell align="right">${opp.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip label={opp.stage} size="small" />
                            </TableCell>
                            <TableCell align="center">
                              {opp.winProbability !== undefined ? (
                                <Chip
                                  label={`${Math.round(opp.winProbability)}%`}
                                  color={
                                    opp.winProbability >= 70
                                      ? 'success'
                                      : opp.winProbability >= 40
                                      ? 'warning'
                                      : 'error'
                                  }
                                  size="small"
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {opp.aiConfidence !== undefined
                                ? `${Math.round(opp.aiConfidence * 100)}%`
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {opportunities.length === 0 && !loading && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      No opportunities found
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 4: Account Health */}
        {tabValue === 4 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Account Health Analysis</Typography>
                    <Button
                      variant="contained"
                      startIcon={<BusinessIcon />}
                      onClick={analyzeAllAccounts}
                      disabled={generating}
                    >
                      Analyze All Accounts
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Account Name</TableCell>
                          <TableCell>Industry</TableCell>
                          <TableCell>Health Score</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>{account.industry || 'N/A'}</TableCell>
                            <TableCell>
                              {account.healthScore ? (
                                <Chip
                                  label={Math.round(account.healthScore)}
                                  color={
                                    account.healthScore >= 75
                                      ? 'success'
                                      : account.healthScore >= 50
                                      ? 'warning'
                                      : 'error'
                                  }
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Not analyzed
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {account.healthStatus ? (
                                <Chip
                                  label={account.healthStatus}
                                  color={
                                    account.healthStatus === 'HEALTHY'
                                      ? 'success'
                                      : account.healthStatus === 'AT_RISK'
                                      ? 'warning'
                                      : 'error'
                                  }
                                />
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 5: Email Insights */}
        {tabValue === 5 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Email Optimization Insights
                    </Typography>
                    <Typography color="text.secondary" mb={2}>
                      Get AI-powered recommendations for your sales emails
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<EmailIcon />}
                      onClick={() => setEmailDialogOpen(true)}
                    >
                      Get Email Insights
                    </Button>
                  </Box>

                  {emailInsights && (
                    <Box mt={4}>
                      <Typography variant="h6" gutterBottom>
                        Recommendations
                      </Typography>

                      <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Suggested Subject Lines:
                        </Typography>
                        <List>
                          {emailInsights.subjectLines?.map((subject: string, idx: number) => (
                            <ListItem key={idx}>
                              <ListItemText primary={`${idx + 1}. ${subject}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Key Talking Points:
                        </Typography>
                        <List>
                          {emailInsights.talkingPoints?.map((point: string, idx: number) => (
                            <ListItem key={idx}>
                              <ListItemText primary={`• ${point}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Best Send Time:
                        </Typography>
                        <Typography>
                          {emailInsights.bestSendTime?.dayOfWeek} {emailInsights.bestSendTime?.timeOfDay}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {emailInsights.bestSendTime?.reasoning}
                        </Typography>
                      </Box>

                      <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Recommended Tone: <Chip label={emailInsights.tone} size="small" />
                        </Typography>
                        <Typography variant="body2">{emailInsights.approach}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Call-to-Action Options:
                        </Typography>
                        <List>
                          {emailInsights.callToAction?.map((cta: string, idx: number) => (
                            <ListItem key={idx}>
                              <ListItemText primary={`• ${cta}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 6: Engagement Scoring */}
        {tabValue === 6 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Engagement Prediction
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Select an email from your Email Center or enter details manually to predict engagement metrics
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={2} mb={3}>
                    <TextField
                      select
                      label="Select Email from Email Center"
                      value={selectedEmailId}
                      onChange={(e) => {
                        const emailId = e.target.value;
                        setSelectedEmailId(emailId);
                        if (emailId) {
                          const email = emails.find((em: any) => em.id === emailId);
                          if (email) {
                            analyzeEngagement(email.subject, email.toAddress);
                          }
                        }
                      }}
                      fullWidth
                      helperText={emails.length === 0 ? 'No emails found. Create emails in Email Center first.' : 'Select an email to analyze its engagement potential'}
                    >
                      <MenuItem value="">
                        <em>-- Select an email --</em>
                      </MenuItem>
                      {emails.map((email: any) => (
                        <MenuItem key={email.id} value={email.id}>
                          {email.subject} - {email.toAddress}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Divider>
                      <Typography variant="caption" color="text.secondary">OR enter manually</Typography>
                    </Divider>

                    <Box display="flex" gap={2}>
                      <TextField
                        label="Email Subject"
                        placeholder="Enter email subject line"
                        fullWidth
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            const emailField = (e.currentTarget.parentElement?.querySelector('input[placeholder*="recipient"]') as HTMLInputElement);
                            if (target.value && emailField?.value) {
                              analyzeEngagement(target.value, emailField.value);
                            }
                          }
                        }}
                      />
                      <TextField
                        label="Recipient Email"
                        placeholder="recipient@example.com"
                        sx={{ minWidth: 250 }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={(e) => {
                          const container = e.currentTarget.parentElement;
                          const subjectField = (container?.querySelector('input[placeholder*="subject"]') as HTMLInputElement);
                          const emailField = (container?.querySelector('input[placeholder*="recipient"]') as HTMLInputElement);
                          if (subjectField?.value && emailField?.value) {
                            analyzeEngagement(subjectField.value, emailField.value);
                          }
                        }}
                        disabled={generating}
                      >
                        Analyze
                      </Button>
                    </Box>
                  </Box>

                  {engagementScores.length > 0 && (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Subject</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell align="center">Open Rate</TableCell>
                            <TableCell align="center">Response Rate</TableCell>
                            <TableCell>Best Send Time</TableCell>
                            <TableCell>Tips</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {engagementScores.map((score, index) => (
                            <TableRow key={index}>
                              <TableCell>{score.subject}</TableCell>
                              <TableCell>{score.recipient}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${Math.round(score.openProbability * 100)}%`}
                                  color={score.openProbability >= 0.7 ? 'success' : score.openProbability >= 0.4 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${Math.round(score.responseProbability * 100)}%`}
                                  color={score.responseProbability >= 0.5 ? 'success' : score.responseProbability >= 0.3 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{score.bestSendTime}</TableCell>
                              <TableCell>
                                <Box display="flex" flexDirection="column" gap={0.5}>
                                  {score.tips?.map((tip: string, i: number) => (
                                    <Chip key={i} label={tip} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {engagementScores.length === 0 && !generating && (
                    <Box textAlign="center" py={4}>
                      <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Enter an email subject to get AI-powered engagement predictions
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 7: Next Best Actions */}
        {tabValue === 7 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <NextBestActions autoLoad={true} />
            </Grid>
          </Grid>
        )}

        {/* Tab 8: Conversation Insights */}
        {tabValue === 8 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <RecordVoiceOverIcon color="primary" />
                      <Typography variant="h6">Conversation Analysis</Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setTranscriptInput(`Sales Rep: Hi John, thanks for taking the time to speak with me today. I understand you've been looking into CRM solutions for your team.

Customer: Yes, we've been struggling with our current system. It's outdated and our sales team is spending too much time on manual data entry instead of actually selling.

Sales Rep: I completely understand. Many of our clients had the same challenge before switching to our platform. Can you tell me more about your team size and what specific pain points you're experiencing?

Customer: We have about 25 sales reps across three regions. The main issues are poor reporting, no mobile access, and terrible integration with our email system. We're losing deals because follow-ups slip through the cracks.

Sales Rep: Those are common challenges we solve every day. Our platform offers real-time dashboards, a fully-featured mobile app, and seamless email integration that automatically logs all communications. Would a 20% improvement in follow-up rates be meaningful for your team?

Customer: Absolutely, that would be huge. What about pricing? We've looked at Salesforce but it seems expensive for our size.

Sales Rep: Great question. We're typically 40% less expensive than Salesforce for teams your size, and we include features they charge extra for. Based on what you've shared, I'd estimate around $150 per user per month. Would you be open to a demo next week with your team leads?

Customer: That sounds reasonable. Let me check with my VP of Sales, but I think we could do Thursday afternoon.

Sales Rep: Perfect, I'll send over a calendar invite for Thursday at 2 PM. I'll also include a case study from a similar-sized company in your industry. Is there anything specific you'd like me to address during the demo?

Customer: Yes, please show us the reporting capabilities and how the email integration works. Those are our top priorities.

Sales Rep: Will do. Thanks John, I'm looking forward to showing your team how we can help. Talk soon!

Customer: Thanks, bye.`)}
                    >
                      Load Example Script
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Paste a call or meeting transcript to get AI-powered insights, or load an example script to try it out
                  </Typography>

                  <TextField
                    label="Conversation Transcript"
                    multiline
                    rows={8}
                    fullWidth
                    placeholder="Paste your call or meeting transcript here..."
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={analyzeConversation}
                    disabled={generating || !transcriptInput.trim()}
                    fullWidth
                  >
                    Analyze Conversation
                  </Button>

                  {conversationInsights && (
                    <Box mt={3}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Sentiment
                            </Typography>
                            <Chip
                              label={conversationInsights.sentiment}
                              color={
                                conversationInsights.sentiment === 'POSITIVE' ? 'success' :
                                conversationInsights.sentiment === 'NEGATIVE' ? 'error' : 'default'
                              }
                            />
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Deal Score
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={conversationInsights.dealScore}
                                sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {conversationInsights.dealScore}%
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Key Topics
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {conversationInsights.keyTopics?.map((topic: string, i: number) => (
                                <Chip key={i} label={topic} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Action Items
                            </Typography>
                            <List dense>
                              {conversationInsights.actionItems?.map((item: string, i: number) => (
                                <ListItem key={i}>
                                  <Typography variant="body2">• {item}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Summary
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {conversationInsights.summary}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Recommended Next Steps
                            </Typography>
                            <List dense>
                              {conversationInsights.nextSteps?.map((step: string, i: number) => (
                                <ListItem key={i}>
                                  <Typography variant="body2">✓ {step}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 9: Activity Capture */}
        {tabValue === 9 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EmailIcon color="primary" />
                    <Typography variant="h6">Email Sync Status</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip label={emails.length > 0 ? 'Active' : 'No Emails'} color={emails.length > 0 ? 'success' : 'default'} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {emails.length > 0 ? `${emails.length} emails in system` : 'No email data available'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Email Activities
                  </Typography>
                  <List dense>
                    {emails.length === 0 && (
                      <ListItem>
                        <Typography variant="body2" color="text.secondary">No emails found. Create emails in Email Center first.</Typography>
                      </ListItem>
                    )}
                    {emails.slice(0, 5).map((email: any) => (
                      <ListItem key={email.id}>
                        <Box width="100%">
                          <Typography variant="body2" fontWeight="bold">
                            {email.status === 'SENT' ? 'Sent' : email.status}: {email.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            To: {email.toAddress} {email.sentAt ? `• ${new Date(email.sentAt).toLocaleDateString()}` : ''} • {email.status}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      {emails.length} emails tracked
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SyncIcon color="primary" />
                    <Typography variant="h6">Calendar Sync Status</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip label={events.length > 0 ? 'Active' : 'No Events'} color={events.length > 0 ? 'success' : 'default'} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {events.length > 0 ? `${events.length} events in system` : 'No calendar events available'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Upcoming Events
                  </Typography>
                  <List dense>
                    {events.length === 0 && (
                      <ListItem>
                        <Typography variant="body2" color="text.secondary">No events found. Create events in the Calendar first.</Typography>
                      </ListItem>
                    )}
                    {events.slice(0, 5).map((event: any) => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                      return (
                        <ListItem key={event.id}>
                          <Box width="100%">
                            <Typography variant="body2" fontWeight="bold">
                              {event.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {durationMin} min{event.location ? ` • ${event.location}` : ''}
                            </Typography>
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      {events.length} events tracked
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Alert severity={emails.length > 0 || events.length > 0 ? 'success' : 'info'}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {emails.length > 0 || events.length > 0 ? 'Activity Capture is Active' : 'No Activities Captured Yet'}
                </Typography>
                <Typography variant="body2">
                  {emails.length > 0 || events.length > 0
                    ? `Tracking ${emails.length} emails and ${events.length} calendar events from your CRM records.`
                    : 'No emails or events found. Create emails in Email Center and events in Calendar to see activity tracking here.'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}

        {/* Tab 10: Einstein Search */}
        {tabValue === 10 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SearchIcon color="primary" />
                    <Typography variant="h6">AI-Powered Search</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Search across leads, opportunities, accounts, and contacts with natural language
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Search for anything... (e.g., 'show me all tech companies')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        performSearch();
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={performSearch} disabled={loading || !searchQuery.trim()}>
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  {searchInsights && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {searchInsights.insight}
                      </Typography>
                      <Box mt={1}>
                        {searchInsights.suggestions?.map((suggestion: string, i: number) => (
                          <Chip key={i} label={suggestion} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    </Alert>
                  )}

                  {searchResults && Object.keys(searchResults).length > 0 && (
                    <Grid container spacing={2}>
                      {searchResults.leads?.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Leads ({searchResults.leads.length})
                            </Typography>
                            <List dense>
                              {searchResults.leads.slice(0, 5).map((lead: any) => (
                                <ListItem key={lead.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{lead.fullName}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {lead.company} • {lead.status}
                                    </Typography>
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                      )}

                      {searchResults.opportunities?.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Opportunities ({searchResults.opportunities.length})
                            </Typography>
                            <List dense>
                              {searchResults.opportunities.slice(0, 5).map((opp: any) => (
                                <ListItem key={opp.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{opp.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ${opp.amount?.toLocaleString()} • {opp.stage}
                                    </Typography>
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                      )}

                      {searchResults.clients?.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Accounts ({searchResults.clients.length})
                            </Typography>
                            <List dense>
                              {searchResults.clients.slice(0, 5).map((client: any) => (
                                <ListItem key={client.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{client.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {client.industry || 'No industry'}
                                    </Typography>
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                      )}

                      {searchResults.contacts?.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Contacts ({searchResults.contacts.length})
                            </Typography>
                            <List dense>
                              {searchResults.contacts.slice(0, 5).map((contact: any) => (
                                <ListItem key={contact.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {contact.firstName} {contact.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {contact.title || 'No title'} • {contact.email}
                                    </Typography>
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  )}

                  {!loading && searchQuery && Object.keys(searchResults).length === 0 && (
                    <Box textAlign="center" py={4}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No results found for "{searchQuery}"
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 11: Einstein Bots */}
        {tabValue === 11 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <EinsteinBots />
            </Grid>
          </Grid>
        )}

        {/* Tab 12: Einstein Analytics */}
        {tabValue === 12 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BarChartIcon color="primary" />
                    <Typography variant="h6">Einstein Analytics</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Advanced analytics dashboards with AI-powered insights
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" fontWeight="bold">
                          {leads.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Leads
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <BusinessIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" fontWeight="bold">
                          {opportunities.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Opportunities
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <AutoAwesomeIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" fontWeight="bold">
                          {insights.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          AI Insights Generated
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2} mt={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Lead Conversion Trend
                        </Typography>
                        {analyticsData ? (
                          <>
                            <Box display="flex" alignItems="center" gap={2} mt={2}>
                              <Box flex={1}>
                                <Typography variant="caption" color="text.secondary">Conversion Rate (Won / Total)</Typography>
                                <LinearProgress variant="determinate" value={analyticsData.conversionRate} sx={{ mt: 0.5, mb: 0.5 }} />
                                <Typography variant="caption">{analyticsData.conversionRate}% conversion rate ({analyticsData.totalLeads} leads)</Typography>
                              </Box>
                            </Box>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Box flex={1}>
                                <Typography variant="caption" color="text.secondary">Qualification Rate</Typography>
                                <LinearProgress variant="determinate" value={analyticsData.qualificationRate} sx={{ mt: 0.5, mb: 0.5 }} color="success" />
                                <Typography variant="caption">{analyticsData.qualificationRate}% qualification rate</Typography>
                              </Box>
                            </Box>
                            <Chip label={`${analyticsData.winRate}% win rate (${analyticsData.closedWon}W / ${analyticsData.closedLost}L)`} color={analyticsData.winRate >= 50 ? 'success' : 'warning'} size="small" sx={{ mt: 1 }} />
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading analytics...</Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Pipeline Health Score
                        </Typography>
                        {analyticsData ? (
                          <>
                            <Box textAlign="center" py={2}>
                              <Typography variant="h2" fontWeight="bold" color={analyticsData.healthScore >= 70 ? 'success.main' : analyticsData.healthScore >= 40 ? 'warning.main' : 'error.main'}>
                                {analyticsData.healthScore}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {analyticsData.healthScore >= 70 ? 'Excellent' : analyticsData.healthScore >= 40 ? 'Fair' : 'Needs Attention'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Based on {analyticsData.winRate}% win rate, {analyticsData.avgProbability}% avg probability, ${analyticsData.pipelineValue?.toLocaleString()} pipeline
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading analytics...</Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          AI-Powered Insights
                        </Typography>
                        <List dense>
                          {analyticsData?.aiInsights?.length > 0 ? (
                            analyticsData.aiInsights.map((insight: string, i: number) => (
                              <ListItem key={i}>
                                <LightbulbIcon color={i === 0 ? 'warning' : i === 1 ? 'info' : 'success'} sx={{ mr: 1 }} />
                                <Typography variant="body2">{insight}</Typography>
                              </ListItem>
                            ))
                          ) : analyticsData ? (
                            <ListItem>
                              <Typography variant="body2" color="text.secondary">No AI insights available. Ensure OpenRouter API is configured.</Typography>
                            </ListItem>
                          ) : (
                            <ListItem>
                              <Typography variant="body2" color="text.secondary">Loading AI insights...</Typography>
                            </ListItem>
                          )}
                        </List>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 13: Case Classification */}
        {tabValue === 13 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CategoryIcon color="primary" />
                      <Typography variant="h6">Case Classification</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Automatically categorize support cases using AI. Try an example or enter your own case.
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCaseSubject('Unable to login to my account');
                        setCaseDescription('I have been trying to login to my account for the past 2 hours but keep getting an "Invalid credentials" error. I am 100% sure my password is correct as I just reset it yesterday. I have tried clearing my browser cache and using incognito mode but nothing works. This is urgent as I have a demo with a client in 30 minutes and need access to my dashboard. Please help ASAP!');
                      }}
                    >
                      Login Issue (Urgent)
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCaseSubject('Request for bulk data export');
                        setCaseDescription('Hi team, I need to export all our contact and lead data from the past 12 months for our quarterly business review. Can you please provide a CSV export of all contacts, leads, and opportunities with their associated activities? We need this by end of next week. Thank you!');
                      }}
                    >
                      Data Export Request
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCaseSubject('Integration with Slack not working');
                        setCaseDescription('Our Slack integration stopped working yesterday. We used to get notifications for new leads and deals but now nothing is coming through. I checked the integration settings and everything looks connected. The webhook URL is correct and the Slack app shows as authorized. Not sure what changed. This is affecting our team productivity as we rely on these notifications.');
                      }}
                    >
                      Integration Problem
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCaseSubject('Billing discrepancy on invoice');
                        setCaseDescription('I just received our monthly invoice and noticed we were charged for 50 users but we only have 35 active users in our account. This has been happening for the past 3 months and I need a refund for the overcharges. I have attached screenshots of our user list showing only 35 users. Please investigate and credit our account accordingly.');
                      }}
                    >
                      Billing Issue
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCaseSubject('Feature request: Custom dashboard widgets');
                        setCaseDescription('We love the platform but would really benefit from the ability to create custom dashboard widgets. Specifically, we need to display our own KPIs and metrics that are specific to our industry (real estate). It would be great to have drag-and-drop widget creation with custom data sources. Is this something on your roadmap?');
                      }}
                    >
                      Feature Request
                    </Button>
                  </Box>

                  <TextField
                    label="Case Subject"
                    fullWidth
                    value={caseSubject}
                    onChange={(e) => setCaseSubject(e.target.value)}
                    placeholder="e.g., Unable to login to account"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Case Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={classifyCase}
                    disabled={generating || !caseSubject.trim()}
                    fullWidth
                  >
                    Classify Case
                  </Button>

                  {caseClassification && (
                    <Box mt={3}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Category
                            </Typography>
                            <Chip label={caseClassification.category} color="primary" />
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Priority
                            </Typography>
                            <Chip label={caseClassification.priority} color={getPriorityColor(caseClassification.priority)} />
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Sentiment
                            </Typography>
                            <Chip label={caseClassification.sentiment} color={
                              caseClassification.sentiment === 'POSITIVE' ? 'success' :
                              caseClassification.sentiment === 'NEGATIVE' ? 'error' : 'default'
                            } />
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Suggested Assignee
                            </Typography>
                            <Typography variant="body2">{caseClassification.suggestedAssignee}</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Estimated Resolution Time
                            </Typography>
                            <Typography variant="body2">{caseClassification.estimatedResolutionTime}</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Tags
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {caseClassification.tags?.map((tag: string, i: number) => (
                                <Chip key={i} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 14: Article Recommendations */}
        {tabValue === 14 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ArticleIcon color="primary" />
                    <Typography variant="h6">Article Recommendations</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Get AI-powered knowledge base article suggestions based on your search query. Try an example or enter your own question.
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('How do I reset my password? I forgot my login credentials and cannot access my account. I need to regain access as soon as possible.')}
                    >
                      Password Reset
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('How can I import contacts from a CSV file? I have a spreadsheet with 500 leads that I need to upload to the CRM.')}
                    >
                      Import Contacts
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('How do I set up email integration with Gmail? I want to automatically log emails sent to customers in the CRM.')}
                    >
                      Email Integration
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('How can I create custom reports and dashboards? I need to track our sales team performance by region and product line.')}
                    >
                      Custom Reports
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('What are the API rate limits and how can I authenticate API requests? We are building a custom integration with our ERP system.')}
                    >
                      API & Integration
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setArticleQuery('How do I configure workflow automation? I want to automatically assign leads to sales reps based on territory and send follow-up emails.')}
                    >
                      Workflow Automation
                    </Button>
                  </Box>

                  <Box mb={3}>
                    <TextField
                      fullWidth
                      label="What do you need help with?"
                      placeholder="e.g., password reset, login issues, billing questions..."
                      value={articleQuery}
                      onChange={(e) => setArticleQuery(e.target.value)}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={recommendArticles}
                      disabled={loading || !articleQuery.trim()}
                      sx={{ mt: 1 }}
                    >
                      {loading ? 'Searching...' : 'Get Recommendations'}
                    </Button>
                  </Box>

                  {articleRecommendations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
                        Recommended Articles ({articleRecommendations.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {articleRecommendations.map((article, index) => (
                          <Grid size={{ xs: 12 }} key={index}>
                            <Paper sx={{ p: 2 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                <Box flex={1}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {article.title}
                                  </Typography>
                                  <Box display="flex" gap={1} mt={0.5}>
                                    <Chip label={article.category} size="small" color="primary" variant="outlined" />
                                    <Chip label={article.estimatedReadTime} size="small" />
                                  </Box>
                                </Box>
                                <Box textAlign="right" ml={2}>
                                  <Typography variant="h6" color="primary" fontWeight="bold">
                                    {article.matchScore}%
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Match
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {article.summary}
                              </Typography>
                              <Box mt={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={article.matchScore}
                                  color={
                                    article.matchScore >= 80
                                      ? 'success'
                                      : article.matchScore >= 60
                                      ? 'primary'
                                      : 'warning'
                                  }
                                />
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {!articleRecommendations.length && !loading && (
                    <Box textAlign="center" py={4}>
                      <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Enter a search query above to get AI-powered article recommendations
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Email Insights Dialog */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Email Insights</DialogTitle>
          <DialogContent>
            <TextField
              select
              label="Recipient Type"
              value={emailForm.recipientType}
              onChange={(e) => setEmailForm({ ...emailForm, recipientType: e.target.value, recipientId: '' })}
              fullWidth
              margin="normal"
            >
              <MenuItem value="Lead">Lead</MenuItem>
              <MenuItem value="Contact">Contact</MenuItem>
              <MenuItem value="Opportunity">Opportunity</MenuItem>
            </TextField>
            <TextField
              select
              label="Select Recipient"
              value={emailForm.recipientId}
              onChange={(e) => setEmailForm({ ...emailForm, recipientId: e.target.value })}
              fullWidth
              margin="normal"
              helperText="Select a recipient to generate personalized email insights"
            >
              {emailForm.recipientType === 'Lead' && leads.map((lead) => (
                <MenuItem key={lead.id} value={lead.id}>
                  {lead.fullName} {lead.company ? `- ${lead.company}` : ''}
                </MenuItem>
              ))}
              {emailForm.recipientType === 'Contact' && contacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName} {contact.client ? `- ${contact.client.name}` : ''}
                </MenuItem>
              ))}
              {emailForm.recipientType === 'Opportunity' && opportunities.map((opp) => (
                <MenuItem key={opp.id} value={opp.id}>
                  {opp.name} - ${opp.amount?.toLocaleString()} ({opp.stage})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Context"
              value={emailForm.context}
              onChange={(e) => setEmailForm({ ...emailForm, context: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="e.g., First outreach, Follow-up after demo"
            />
            <TextField
              label="Purpose"
              value={emailForm.purpose}
              onChange={(e) => setEmailForm({ ...emailForm, purpose: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder="e.g., Schedule a discovery call, Share product information"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                generateEmailInsights();
                setEmailDialogOpen(false);
              }}
              variant="contained"
              disabled={generating || !emailForm.recipientId}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
