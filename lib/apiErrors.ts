import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
