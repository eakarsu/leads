'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Tab,
  Tabs,
  LinearProgress,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import InventoryIcon from '@mui/icons-material/Inventory';
import RuleIcon from '@mui/icons-material/Rule';
import QuizIcon from '@mui/icons-material/Quiz';
import SearchIcon from '@mui/icons-material/Search';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DashboardLayout from '@/components/DashboardLayout';

interface ProductBundle {
  id: string;
  name: string;
  description: string | null;
  bundleType: string;
  isActive: boolean;
  basePrice: number | null;
  discountPercent: number | null;
  createdAt: string;
  _count?: { items: number };
}

interface ProductRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  discountType: string | null;
  discountValue: number | null;
  priority: number;
  createdAt: string;
}

interface GuidedSellingQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: string[];
  questionOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export default function CPQPage() {
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [rules, setRules] = useState<ProductRule[]>([]);
  const [questions, setQuestions] = useState<GuidedSellingQuestion[]>([]);
  const [stats, setStats] = useState({
    totalBundles: 0,
    activeBundles: 0,
    totalRules: 0,
    activeRules: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<ProductBundle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    bundleType: '',
    basePrice: 0,
    discountPercent: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [bundleFormData, setBundleFormData] = useState({
    name: '',
    description: '',
    bundleType: 'STATIC',
    basePrice: 0,
    discountPercent: 0,
  });
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    description: '',
    ruleType: 'PRICING',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/cpq');
      const data = await response.json();
      setBundles(data.bundles || []);
      setRules(data.rules || []);
      setQuestions(data.questions || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching CPQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBundle = async () => {
    try {
      const response = await fetch('/api/cpq/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleFormData),
      });

      if (response.ok) {
        setBundleDialogOpen(false);
        fetchData();
        resetBundleForm();
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/cpq/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleFormData),
      });

      if (response.ok) {
        setRuleDialogOpen(false);
        fetchData();
        resetRuleForm();
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const handleToggleBundleActive = async (bundleId: string, isActive: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/cpq/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bundleId, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating bundle:', error);
    }
  };

  const handleToggleRuleActive = async (ruleId: string, isActive: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/cpq/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleDeleteBundle = async (bundleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      await fetch(`/api/cpq/bundles?id=${bundleId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await fetch(`/api/cpq/rules?id=${ruleId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleStartEdit = () => {
    if (!selectedBundle) return;
    setEditFormData({
      name: selectedBundle.name || '',
      description: selectedBundle.description || '',
      bundleType: selectedBundle.bundleType || '',
      basePrice: selectedBundle.basePrice || 0,
      discountPercent: selectedBundle.discountPercent || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBundle) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/cpq/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBundle.id, ...editFormData }),
      });
      if (response.ok) {
        setEditMode(false);
        setDetailDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating bundle:', error);
    } finally {
      setEditSaving(false);
    }
  };

  const handleRowClick = (bundle: ProductBundle) => {
    setSelectedBundle(bundle);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const resetBundleForm = () => {
    setBundleFormData({
      name: '',
      description: '',
      bundleType: 'STATIC',
      basePrice: 0,
      discountPercent: 0,
    });
  };

  const resetRuleForm = () => {
    setRuleFormData({
      name: '',
      description: '',
      ruleType: 'PRICING',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      priority: 0,
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'PRICING':
        return 'success';
      case 'VALIDATION':
        return 'error';
      case 'SELECTION':
        return 'primary';
      case 'FILTER':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsSuggestIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">CPQ Configurator</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RuleIcon />}
              onClick={() => setRuleDialogOpen(true)}
            >
              New Rule
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setBundleDialogOpen(true)}
            >
              New Bundle
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Bundles</Typography>
                </Box>
                <Typography variant="h4">{stats.totalBundles}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.activeBundles} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RuleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Rules</Typography>
                </Box>
                <Typography variant="h4">{stats.totalRules}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.activeRules} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <QuizIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Questions</Typography>
                </Box>
                <Typography variant="h4">{stats.totalQuestions}</Typography>
                <Typography variant="caption" color="text.secondary">
                  guided selling
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalOfferIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Pricing Rules</Typography>
                </Box>
                <Typography variant="h4">
                  {rules.filter(r => r.ruleType === 'PRICING').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Validation Rules</Typography>
                </Box>
                <Typography variant="h4">
                  {rules.filter(r => r.ruleType === 'VALIDATION').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`Product Bundles (${stats.totalBundles})`} />
            <Tab label={`Product Rules (${stats.totalRules})`} />
            <Tab label={`Guided Selling (${stats.totalQuestions})`} />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Product Bundles Tab */}
        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bundle Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bundles
                  .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))
                  .map((bundle) => (
                    <TableRow
                      key={bundle.id}
                      hover
                      onClick={() => handleRowClick(bundle)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {bundle.name}
                        </Typography>
                        {bundle.description && (
                          <Typography variant="caption" color="textSecondary">
                            {bundle.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={bundle.bundleType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{bundle._count?.items || 0}</TableCell>
                      <TableCell>{formatCurrency(bundle.basePrice)}</TableCell>
                      <TableCell>
                        {bundle.discountPercent ? `${bundle.discountPercent}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bundle.isActive ? 'Active' : 'Inactive'}
                          color={bundle.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={bundle.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleBundleActive(bundle.id, !bundle.isActive, e)}
                          >
                            <CheckCircleIcon color={bundle.isActive ? 'success' : 'disabled'} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => handleDeleteBundle(bundle.id, e)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                {bundles.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No product bundles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Product Rules Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rule Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules
                  .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
                  .map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {rule.name}
                        </Typography>
                        {rule.description && (
                          <Typography variant="caption" color="textSecondary">
                            {rule.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.ruleType}
                          size="small"
                          color={getRuleTypeColor(rule.ruleType) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {rule.discountValue
                          ? `${rule.discountValue}${rule.discountType === 'PERCENTAGE' ? '%' : '$'}`
                          : '-'}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Chip
                          label={rule.isActive ? 'Active' : 'Inactive'}
                          color={rule.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={rule.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleRuleActive(rule.id, !rule.isActive, e)}
                          >
                            <CheckCircleIcon color={rule.isActive ? 'success' : 'disabled'} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => handleDeleteRule(rule.id, e)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                {rules.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No product rules found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Guided Selling Tab */}
        {tabValue === 2 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Options</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions
                  .filter(q => !search || q.questionText.toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((question) => (
                    <TableRow key={question.id} hover>
                      <TableCell>{question.questionOrder}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {question.questionText}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={question.questionType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {question.options.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {question.options.slice(0, 3).map((opt, i) => (
                              <Chip key={i} label={opt} size="small" variant="outlined" />
                            ))}
                            {question.options.length > 3 && (
                              <Chip label={`+${question.options.length - 3}`} size="small" />
                            )}
                          </Box>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {question.isRequired ? (
                          <Chip label="Yes" size="small" color="primary" />
                        ) : (
                          <Chip label="No" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={question.isActive ? 'Active' : 'Inactive'}
                          color={question.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                {questions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No guided selling questions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create Bundle Dialog */}
      <Dialog open={bundleDialogOpen} onClose={() => setBundleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Product Bundle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Bundle Name *"
                value={bundleFormData.name}
                onChange={(e) => setBundleFormData({ ...bundleFormData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={bundleFormData.description}
                onChange={(e) => setBundleFormData({ ...bundleFormData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Bundle Type *</InputLabel>
                <Select
                  value={bundleFormData.bundleType}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, bundleType: e.target.value })}
                  label="Bundle Type *"
                >
                  <MenuItem value="STATIC">Static</MenuItem>
                  <MenuItem value="CONFIGURABLE">Configurable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={bundleFormData.basePrice}
                onChange={(e) => setBundleFormData({ ...bundleFormData, basePrice: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Bundle Discount %"
                type="number"
                value={bundleFormData.discountPercent}
                onChange={(e) => setBundleFormData({ ...bundleFormData, discountPercent: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBundleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBundle}
            variant="contained"
            disabled={!bundleFormData.name}
          >
            Create Bundle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Product Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Rule Name *"
                value={ruleFormData.name}
                onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={ruleFormData.description}
                onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Rule Type *</InputLabel>
                <Select
                  value={ruleFormData.ruleType}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, ruleType: e.target.value })}
                  label="Rule Type *"
                >
                  <MenuItem value="PRICING">Pricing</MenuItem>
                  <MenuItem value="VALIDATION">Validation</MenuItem>
                  <MenuItem value="SELECTION">Selection</MenuItem>
                  <MenuItem value="FILTER">Filter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={ruleFormData.priority}
                onChange={(e) => setRuleFormData({ ...ruleFormData, priority: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            {ruleFormData.ruleType === 'PRICING' && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={ruleFormData.discountType}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, discountType: e.target.value })}
                      label="Discount Type"
                    >
                      <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                      <MenuItem value="FIXED">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Discount Value"
                    type="number"
                    value={ruleFormData.discountValue}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, discountValue: parseFloat(e.target.value) || 0 })}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>{ruleFormData.discountType === 'PERCENTAGE' ? '%' : '$'}</Typography>,
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRule}
            variant="contained"
            disabled={!ruleFormData.name}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bundle Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => { setDetailDialogOpen(false); setEditMode(false); }}
        maxWidth="md"
        fullWidth
      >
        {selectedBundle && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="h6">{editMode ? 'Edit Bundle' : selectedBundle.name}</Typography>
                </Box>
                <IconButton onClick={() => { setDetailDialogOpen(false); setEditMode(false); }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {selectedBundle && !editMode && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedBundle.isActive ? 'Active' : 'Inactive'}
                        color={selectedBundle.isActive ? 'success' : 'default'}
                      />
                      <Chip label={selectedBundle.bundleType} variant="outlined" />
                      {selectedBundle.discountPercent && (
                        <Chip label={`${selectedBundle.discountPercent}% discount`} color="info" variant="outlined" />
                      )}
                    </Box>
                  </Grid>

                  {selectedBundle.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBundle.description}
                      </Typography>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {formatCurrency(selectedBundle.basePrice)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Base Price</Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4">
                        {selectedBundle.discountPercent || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Bundle Discount</Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4">
                        {selectedBundle._count?.items || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Products</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              {selectedBundle && editMode && (
                <Grid container spacing={2} sx={{ pt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Bundle Type"
                      value={editFormData.bundleType}
                      onChange={(e) => setEditFormData({ ...editFormData, bundleType: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Base Price"
                      type="number"
                      value={editFormData.basePrice}
                      onChange={(e) => setEditFormData({ ...editFormData, basePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Discount Percent"
                      type="number"
                      value={editFormData.discountPercent}
                      onChange={(e) => setEditFormData({ ...editFormData, discountPercent: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {!editMode ? (
                <>
                  <Button
                    startIcon={<CheckCircleIcon />}
                    onClick={(e) => {
                      handleToggleBundleActive(selectedBundle.id, !selectedBundle.isActive, e);
                      setDetailDialogOpen(false);
                    }}
                  >
                    {selectedBundle.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                  <Button startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => {
                      handleDeleteBundle(selectedBundle.id, e);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button startIcon={<CloseIcon />} onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                  >
                    {editSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
