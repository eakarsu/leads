'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Typography,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import CampaignIcon from '@mui/icons-material/Campaign';
import ContactsIcon from '@mui/icons-material/Contacts';

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'opportunity' | 'client' | 'campaign';
  title: string;
  subtitle: string;
  metadata?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);

    // Debounce search
    if (searchTimer) clearTimeout(searchTimer);

    const timer = setTimeout(() => {
      handleSearch(value);
    }, 300);

    setSearchTimer(timer);
  };

  const handleResultClick = (result: SearchResult) => {
    let path = '';
    switch (result.type) {
      case 'lead':
        path = `/leads/${result.id}`;
        break;
      case 'contact':
        path = `/contacts/${result.id}`;
        break;
      case 'opportunity':
        path = `/opportunities/${result.id}`;
        break;
      case 'client':
        path = `/clients/${result.id}`;
        break;
      case 'campaign':
        path = `/campaigns/${result.id}`;
        break;
    }
    router.push(path);
    onClose();
    setQuery('');
    setResults([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <PersonIcon />;
      case 'contact':
        return <ContactsIcon />;
      case 'opportunity':
        return <WorkIcon />;
      case 'client':
        return <BusinessIcon />;
      case 'campaign':
        return <CampaignIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead':
        return 'primary';
      case 'contact':
        return 'success';
      case 'opportunity':
        return 'warning';
      case 'client':
        return 'info';
      case 'campaign':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { position: 'fixed', top: 100, m: 0 }
      }}
    >
      <DialogTitle>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search leads, contacts, opportunities, clients, campaigns..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
          }}
          variant="standard"
        />
      </DialogTitle>
      <DialogContent dividers>
        {!query.trim() ? (
          <Box py={4} textAlign="center">
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              Start typing to search across all records
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Search by name, email, company, or any field
            </Typography>
          </Box>
        ) : results.length === 0 && !loading ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              No results found for "{query}"
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {Object.entries(groupedResults).map(([type, items], groupIndex) => (
              <Box key={type}>
                {groupIndex > 0 && <Divider sx={{ my: 1 }} />}
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ px: 2, py: 1, display: 'block' }}
                >
                  {type}s ({items.length})
                </Typography>
                {items.map((result) => (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton onClick={() => handleResultClick(result)}>
                      <ListItemIcon>
                        {getIcon(result.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{result.title}</span>
                            <Chip
                              label={result.type}
                              size="small"
                              color={getTypeColor(result.type) as any}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {result.subtitle}
                            {result.metadata && (
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {result.metadata}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
