'use client';

import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function CardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="50%" />
      </CardContent>
    </Card>
  );
}
