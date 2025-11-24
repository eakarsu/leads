# Bulk Operations Integration Guide

## Overview
The bulk operations backend APIs and toolbar component are ready. This guide shows how to integrate them into your table pages.

---

## What's Already Done ✅

1. **Backend APIs:**
   - `/api/leads/bulk` - PATCH & DELETE
   - `/api/contacts/bulk` - PATCH & DELETE
   - `/api/opportunities/bulk` - PATCH & DELETE
   - `/api/tasks/bulk` - PATCH & DELETE

2. **Frontend Component:**
   - `BulkActionsToolbar` component (`components/BulkActionsToolbar.tsx`)

---

## Integration Steps (for each page)

### Step 1: Add Imports

```typescript
import BulkActionsToolbar from '@/components/BulkActionsToolbar';
import { Checkbox } from '@mui/material';
```

### Step 2: Add State

```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

### Step 3: Add Handler Functions

```typescript
const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.checked) {
    const allIds = items.map((item) => item.id);
    setSelectedIds(allIds);
  } else {
    setSelectedIds([]);
  }
};

const handleSelectOne = (id: string) => {
  setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const handleBulkDelete = async () => {
  if (!confirm(`Delete ${selectedIds.length} items?`)) return;

  try {
    const response = await fetch('/api/RESOURCE/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (response.ok) {
      setSelectedIds([]);
      fetchItems(); // Refresh list
    }
  } catch (error) {
    console.error('Bulk delete failed:', error);
  }
};

const handleBulkEdit = () => {
  // Open dialog for bulk editing
  // Set bulk edit mode
};
```

### Step 4: Add Toolbar Before Table

```typescript
<BulkActionsToolbar
  selectedCount={selectedIds.length}
  onBulkDelete={handleBulkDelete}
  onBulkEdit={handleBulkEdit}
/>

<TableContainer>
  <Table>
    ...
```

### Step 5: Add Select All Checkbox in Table Header

```typescript
<TableHead>
  <TableRow>
    <TableCell padding="checkbox">
      <Checkbox
        indeterminate={
          selectedIds.length > 0 && selectedIds.length < items.length
        }
        checked={items.length > 0 && selectedIds.length === items.length}
        onChange={handleSelectAll}
      />
    </TableCell>
    <TableCell>Name</TableCell>
    ...
  </TableRow>
</TableHead>
```

### Step 6: Add Checkbox in Each Row

```typescript
<TableBody>
  {items.map((item) => (
    <TableRow key={item.id}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onChange={() => handleSelectOne(item.id)}
        />
      </TableCell>
      <TableCell>{item.name}</TableCell>
      ...
    </TableRow>
  ))}
</TableBody>
```

---

## Complete Example for Leads Page

Here's a minimal example showing the key changes:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import BulkActionsToolbar from '@/components/BulkActionsToolbar';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ... existing code ...

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(leads.map((lead) => lead.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} leads?`)) return;

    try {
      const response = await fetch('/api/leads/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchLeads();
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  return (
    <DashboardLayout>
      {/* ... existing header ... */}

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
      />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < leads.length
                  }
                  checked={leads.length > 0 && selectedIds.length === leads.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              {/* ... other headers ... */}
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => handleSelectOne(lead.id)}
                  />
                </TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.status}</TableCell>
                {/* ... other cells ... */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardLayout>
  );
}
```

---

## Bulk Edit Implementation (Optional)

For bulk edit, you'll need to:

1. Create a dialog for bulk updates
2. Show fields that can be bulk edited
3. Call the bulk edit API

Example:

```typescript
const [bulkEditDialog, setBulkEditDialog] = useState(false);
const [bulkUpdates, setBulkUpdates] = useState({});

const handleBulkEdit = () => {
  setBulkEditDialog(true);
};

const saveBulkEdit = async () => {
  try {
    const response = await fetch('/api/leads/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        updates: bulkUpdates,
      }),
    });

    if (response.ok) {
      setSelectedIds([]);
      setBulkEditDialog(false);
      fetchLeads();
    }
  } catch (error) {
    console.error('Bulk edit failed:', error);
  }
};

// Dialog component
<Dialog open={bulkEditDialog} onClose={() => setBulkEditDialog(false)}>
  <DialogTitle>Bulk Edit {selectedIds.length} Leads</DialogTitle>
  <DialogContent>
    <TextField
      select
      label="Status"
      value={bulkUpdates.status || ''}
      onChange={(e) => setBulkUpdates({ ...bulkUpdates, status: e.target.value })}
    >
      <MenuItem value="NEW">New</MenuItem>
      <MenuItem value="CONTACTED">Contacted</MenuItem>
      <MenuItem value="QUALIFIED">Qualified</MenuItem>
    </TextField>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setBulkEditDialog(false)}>Cancel</Button>
    <Button onClick={saveBulkEdit} variant="contained">Save</Button>
  </DialogActions>
</Dialog>
```

---

## Summary

**What you need to add to each page:**
1. Import `BulkActionsToolbar` and `Checkbox`
2. Add `selectedIds` state
3. Add handler functions (select, bulk delete, bulk edit)
4. Add `BulkActionsToolbar` before table
5. Add checkbox column in table header
6. Add checkbox in each table row

**Files to modify:**
- `/app/leads/page.tsx`
- `/app/contacts/page.tsx`
- `/app/opportunities/page.tsx`
- `/app/tasks/page.tsx`

The backend APIs are ready and the toolbar component exists - just needs integration! 🚀
