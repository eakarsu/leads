import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function parsePaginationParams(
  req: NextRequest,
  defaults?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
): PaginationParams {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25')));
  const sortBy = searchParams.get('sortBy') || defaults?.sortBy || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  return { page, pageSize, sortBy, sortOrder };
}

export function buildPrismaQuery(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
    orderBy: { [params.sortBy]: params.sortOrder },
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
  extra?: Record<string, any>
): PaginatedResponse<T> & Record<string, any> {
  const totalPages = Math.ceil(total / params.pageSize);
  return {
    ...extra,
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalItems: total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
}
