'use client';

import { useState, useEffect, useCallback } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsePaginationOptions {
  url: string;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  defaultPageSize?: number;
  extraParams?: Record<string, string>;
}

interface UsePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: string;
  pagination: PaginationInfo;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => void;
}

export function usePagination<T = any>(options: UsePaginationOptions): UsePaginationReturn<T> {
  const { url, defaultSortBy = 'createdAt', defaultSortOrder = 'desc', defaultPageSize = 25, extraParams = {} } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: defaultPageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [state, setState] = useState<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: state.page.toString(),
        pageSize: state.pageSize.toString(),
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...extraParams,
      });
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const json = await response.json();

      if (json.pagination) {
        setData(json.data);
        setPagination(json.pagination);
      } else {
        // Backwards compatibility: API returns plain array
        const items = Array.isArray(json) ? json : [];
        setData(items);
        setPagination({
          page: 1,
          pageSize: items.length,
          totalItems: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, state.page, state.pageSize, state.sortBy, state.sortOrder, JSON.stringify(extraParams), refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = (page: number) => setState((prev) => ({ ...prev, page }));
  const setPageSize = (pageSize: number) => setState((prev) => ({ ...prev, pageSize, page: 1 }));
  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc') =>
    setState((prev) => ({ ...prev, sortBy, sortOrder }));
  const refresh = () => setRefreshKey((k) => k + 1);

  return { data, loading, error, pagination, setPage, setPageSize, setSort, refresh };
}
