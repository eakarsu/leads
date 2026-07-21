import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asLeadOperationsError, LeadOperationsError } from './errors';

export async function parseJson<T extends z.ZodTypeAny>(request: NextRequest, schema: T): Promise<z.infer<T>> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 1024 * 1024) throw new LeadOperationsError('PAYLOAD_TOO_LARGE', 'Request body exceeds 1 MiB', 413);
  let body: unknown;
  try { body = await request.json(); } catch { throw new LeadOperationsError('INVALID_JSON', 'Request body must be valid JSON'); }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new LeadOperationsError('VALIDATION_ERROR', result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  }
  return result.data;
}

export function apiError(error: unknown): NextResponse {
  const known = asLeadOperationsError(error);
  if (known.status >= 500) console.error(`[lead-operations] ${known.code}`, error);
  return NextResponse.json({ error: known.code, message: known.message }, { status: known.status });
}

export const idSchema = z.string().uuid();
export const reasonSchema = z.string().trim().min(3).max(1000);
