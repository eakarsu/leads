'use client';

import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
} from '@mui/material';

type DetailRecord = Record<string, unknown>;

type RecordDetailDialogProps = {
  open: boolean;
  title: string;
  record: DetailRecord | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  hideFields?: string[];
};

const defaultHidden = new Set(['id', 'password', 'hashedPassword', 'fileData']);

function labelize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrimitive(value: unknown) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (typeof value === 'string') {
    const maybeDate = Date.parse(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(maybeDate)) return new Date(value).toLocaleString();
    return value.replace(/_/g, ' ');
  }
  return String(value);
}

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    if (!value.length) return <Typography color="text.secondary">None</Typography>;
    return (
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {value.slice(0, 12).map((item, index) => (
          <Chip key={`${formatPrimitive(item)}-${index}`} size="small" label={summarizeValue(item)} />
        ))}
        {value.length > 12 && <Chip size="small" label={`+${value.length - 12} more`} />}
      </Stack>
    );
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as DetailRecord)
      .filter(([key]) => !defaultHidden.has(key))
      .slice(0, 6);
    if (!entries.length) return <Typography color="text.secondary">N/A</Typography>;
    return (
      <Stack spacing={0.5}>
        {entries.map(([key, nestedValue]) => (
          <Typography key={key} variant="body2">
            <Typography component="span" variant="body2" color="text.secondary">{labelize(key)}: </Typography>
            {summarizeValue(nestedValue)}
          </Typography>
        ))}
      </Stack>
    );
  }

  return <Typography variant="body2">{formatPrimitive(value)}</Typography>;
}

function summarizeValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value !== 'object') return formatPrimitive(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  const record = value as DetailRecord;
  return String(record.name || record.fullName || record.subject || record.title || record.email || record.id || 'Record');
}

export default function RecordDetailDialog({
  open,
  title,
  record,
  onClose,
  onEdit,
  onDelete,
  hideFields = [],
}: RecordDetailDialogProps) {
  const hidden = new Set([...defaultHidden, ...hideFields]);
  const entries = Object.entries(record || {}).filter(([key]) => !hidden.has(key));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {!record ? (
          <Typography color="text.secondary">No record selected.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' }, gap: 1.5 }}>
            {entries.map(([key, value]) => (
              <Box key={key} sx={{ display: 'contents' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{labelize(key)}</Typography>
                <Box sx={{ minWidth: 0 }}>{renderValue(value)}</Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {onDelete && <Button color="error" onClick={onDelete}>Delete</Button>}
        {onEdit && <Button variant="contained" onClick={onEdit}>Edit</Button>}
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
