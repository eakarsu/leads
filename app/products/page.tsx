'use client';

import { useEffect, useState } from 'react';
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
  IconButton,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Product {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  unitPrice: number;
  isActive: boolean;
  category: string | null;
  client: {
    id: string;
    name: string;
  };
  _count: {
    lineItems: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    code: '',
    description: '',
    unitPrice: '',
    category: '',
    isActive: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [clientFilter, categoryFilter, isActiveFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientFilter) params.append('clientId', clientFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (isActiveFilter) params.append('isActive', isActiveFilter);

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setOpenViewDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      clientId: product.client.id,
      name: product.name,
      code: product.code || '',
      description: product.description || '',
      unitPrice: product.unitPrice.toString(),
      category: product.category || '',
      isActive: product.isActive,
    });
    setOpenDialog(true);
  };

  const handleCreateProduct = async () => {
    try {
      if (selectedProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            unitPrice: parseFloat(formData.unitPrice) || 0,
          }),
        });

        if (!response.ok) throw new Error('Failed to update product');
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            unitPrice: parseFloat(formData.unitPrice) || 0,
          }),
        });

        if (!response.ok) throw new Error('Failed to create product');
      }

      setOpenDialog(false);
      setSelectedProduct(null);
      setFormData({
        clientId: '',
        name: '',
        code: '',
        description: '',
        unitPrice: '',
        category: '',
        isActive: true,
      });
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter((c) => c !== null))
  ) as string[];

  if (loading) {
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
          <Typography variant="h4">Products</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedProduct(null);
              setFormData({
                clientId: '',
                name: '',
                code: '',
                description: '',
                unitPrice: '',
                category: '',
                isActive: true,
              });
              setOpenDialog(true);
            }}
          >
            New Product
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <TextField
                select
                label="Client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active Only</MenuItem>
                <MenuItem value="false">Inactive Only</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  setClientFilter('');
                  setCategoryFilter('');
                  setIsActiveFilter('');
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
                    <TableCell>Code</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Usage</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No products found. Create your first product!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow
                        key={product.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewProduct(product)}
                      >
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.code || '-'}</TableCell>
                        <TableCell>
                          {product.category ? (
                            <Chip label={product.category} size="small" variant="outlined" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(product.unitPrice)}</TableCell>
                        <TableCell>{product.client.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={product.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={product.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${product._count.lineItems} opportunities`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditProduct(product)}
                            title="Edit"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                fullWidth
                required
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Product Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                fullWidth
                helperText="Optional - SKU or product identifier"
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                helperText="e.g., Software, Hardware, Service, Consulting"
              />

              <TextField
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: '$',
                }}
                required
              />

              <TextField
                select
                label="Active Status"
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                fullWidth
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateProduct}
              variant="contained"
              disabled={!formData.clientId || !formData.name || !formData.unitPrice}
            >
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Product Details</DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedProduct.name}</Typography>
                </Box>

                {selectedProduct.code && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Product Code</Typography>
                    <Typography variant="body1">{selectedProduct.code}</Typography>
                  </Box>
                )}

                {selectedProduct.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedProduct.description}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Unit Price</Typography>
                  <Typography variant="body1">{formatCurrency(selectedProduct.unitPrice)}</Typography>
                </Box>

                {selectedProduct.category && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    <Chip label={selectedProduct.category} size="small" variant="outlined" />
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                  <Typography variant="body1">{selectedProduct.client.name}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedProduct.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={selectedProduct.isActive ? 'success' : 'default'}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Usage</Typography>
                  <Typography variant="body1">
                    Used in {selectedProduct._count.lineItems} opportunity line items
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            <Button
              onClick={() => {
                if (selectedProduct) {
                  setOpenViewDialog(false);
                  handleEditProduct(selectedProduct);
                }
              }}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
