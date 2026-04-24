'use client';

import { TablePagination } from '@mui/material';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  return (
    <TablePagination
      component="div"
      count={totalItems}
      page={page - 1}
      onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      rowsPerPage={pageSize}
      onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value))}
      rowsPerPageOptions={[10, 25, 50, 100]}
    />
  );
}
