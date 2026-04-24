'use client';

import { TableHead, TableRow, TableCell, TableSortLabel } from '@mui/material';

export interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

interface SortableTableHeadProps {
  columns: Column[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnId: string) => void;
}

export default function SortableTableHead({
  columns,
  sortBy,
  sortOrder,
  onSort,
}: SortableTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align}
            sx={column.width ? { width: column.width } : undefined}
          >
            {column.sortable !== false ? (
              <TableSortLabel
                active={sortBy === column.id}
                direction={sortBy === column.id ? sortOrder : 'asc'}
                onClick={() => onSort(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
