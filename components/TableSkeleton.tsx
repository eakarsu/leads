'use client';

import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton variant="text" width="80%" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width={colIndex === 0 ? '90%' : '70%'} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
