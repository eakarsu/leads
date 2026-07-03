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
  TextField,
  Typography,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RefreshIcon from '@mui/icons-material/Refresh';
import SellIcon from '@mui/icons-material/Sell';
import DashboardLayout from '@/components/DashboardLayout';
import RecordDetailDialog from '@/components/RecordDetailDialog';

type Product = { id: string; name: string; code?: string | null; unitPrice: number };
type PriceBookEntry = { id: string; productId: string; unitPrice: number; isActive: boolean; useStandardPrice: boolean };
type PriceBook = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isStandard: boolean;
  entries: PriceBookEntry[];
  _count?: { entries: number };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Price book request failed';
}

export default function PriceBooksPage() {
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isStandard: false,
    productId: '',
    unitPrice: '',
    useStandardPrice: false,
  });

  const productById = useMemo(() => {
    return products.reduce<Record<string, Product>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [priceBooksResponse, productsResponse] = await Promise.all([
        fetch('/api/price-books'),
        fetch('/api/products?pageSize=100&isActive=true'),
      ]);
      const priceBooksPayload = await priceBooksResponse.json() as PriceBook[] | { error?: string };
      const productsPayload = await productsResponse.json() as { error?: string; data?: Product[] };

      if (!priceBooksResponse.ok) throw new Error(Array.isArray(priceBooksPayload) ? 'Failed to load price books' : priceBooksPayload.error || 'Failed to load price books');
      if (!productsResponse.ok) throw new Error(productsPayload.error || 'Failed to load products');

      setPriceBooks(Array.isArray(priceBooksPayload) ? priceBooksPayload : []);
      setProducts(productsPayload.data || []);
      if (!form.productId && productsPayload.data?.[0]) {
        setForm((prev) => ({
          ...prev,
          productId: productsPayload.data?.[0]?.id || '',
          unitPrice: String(productsPayload.data?.[0]?.unitPrice || ''),
        }));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [form.productId]);

  useEffect(() => {
    load();
  }, [load]);

  const createPriceBook = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const entries = form.productId
        ? [{
            productId: form.productId,
            unitPrice: Number(form.unitPrice || productById[form.productId]?.unitPrice || 0),
            isActive: true,
            useStandardPrice: form.useStandardPrice,
          }]
        : [];

      const response = await fetch('/api/price-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          isStandard: form.isStandard,
          entries,
        }),
      });
      const payload = await response.json() as { error?: string; name?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create price book');
      setSuccess(`${form.name} created`);
      setForm((prev) => ({ ...prev, name: '', description: '', isStandard: false }));
      await load();
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
            <Typography variant="h4">Price Books</Typography>
            <Typography color="text.secondary">Manage standard and custom price books for products, quotes, and CPQ flows.</Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px minmax(0, 1fr)' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <SellIcon color="primary" />
                <Typography variant="h6">New Price Book</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField size="small" label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={form.isStandard} onChange={(event) => setForm((prev) => ({ ...prev, isStandard: event.target.checked }))} />} label="Set as standard price book" />
                <FormControl size="small">
                  <InputLabel>Initial Product</InputLabel>
                  <Select
                    label="Initial Product"
                    value={form.productId}
                    onChange={(event) => {
                      const product = productById[event.target.value];
                      setForm((prev) => ({ ...prev, productId: event.target.value, unitPrice: String(product?.unitPrice || '') }));
                    }}
                  >
                    <MenuItem value="">No initial product</MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>{product.name} {product.code ? `(${product.code})` : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Unit Price" type="number" value={form.unitPrice} onChange={(event) => setForm((prev) => ({ ...prev, unitPrice: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={form.useStandardPrice} onChange={(event) => setForm((prev) => ({ ...prev, useStandardPrice: event.target.checked }))} />} label="Use standard price" />
                <Button variant="contained" startIcon={<LibraryBooksIcon />} onClick={createPriceBook} disabled={saving || !form.name.trim()}>
                  Create Price Book
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Price Books</Typography>
              {loading ? <CircularProgress /> : priceBooks.length === 0 ? (
                <Typography color="text.secondary">No active price books found.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Price Book</TableCell>
                      <TableCell>Entries</TableCell>
                      <TableCell>Products</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceBooks.map((book) => (
                      <TableRow key={book.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(book)}>
                        <TableCell>
                          <Typography fontWeight={700}>{book.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{book.description || '-'}</Typography>
                        </TableCell>
                        <TableCell>{book._count?.entries ?? book.entries.length}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {book.entries.slice(0, 4).map((entry) => (
                              <Typography key={entry.id} variant="body2">
                                {productById[entry.productId]?.name || entry.productId}: ${Number(entry.unitPrice || 0).toLocaleString()}
                              </Typography>
                            ))}
                            {book.entries.length > 4 && <Typography variant="body2" color="text.secondary">+{book.entries.length - 4} more</Typography>}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Chip size="small" label={book.isActive ? 'Active' : 'Inactive'} color={book.isActive ? 'success' : 'default'} />
                            {book.isStandard && <Chip size="small" label="Standard" color="primary" />}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Box>
        <RecordDetailDialog
          open={Boolean(selectedRecord)}
          title="Price Book Details"
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </Box>
    </DashboardLayout>
  );
}
