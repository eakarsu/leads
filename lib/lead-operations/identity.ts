import crypto from 'node:crypto';
import { LeadOperationsError } from './errors';

export function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new LeadOperationsError('INVALID_EMAIL', 'A deliverable email address is required');
  }
  return normalized;
}

export function normalizePhone(value: string): string {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new LeadOperationsError('INVALID_PHONE', 'Phone numbers must contain 7 to 15 digits');
  }
  return raw.startsWith('+') ? `+${digits}` : digits;
}

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function destinationHash(channel: string, destination: string): string {
  const normalized = channel.toUpperCase() === 'EMAIL'
    ? normalizeEmail(destination)
    : normalizePhone(destination);
  return sha256(`${channel.toUpperCase()}:${normalized}`);
}

export function leadDedupeKey(input: {
  email?: string | null;
  phone?: string | null;
  fullName: string;
  company?: string | null;
}): string {
  if (input.email) return sha256(`email:${normalizeEmail(input.email)}`);
  if (input.phone) return sha256(`phone:${normalizePhone(input.phone)}`);
  const name = normalizeText(input.fullName);
  const company = normalizeText(input.company || '');
  if (!company) {
    throw new LeadOperationsError(
      'IDENTITY_REQUIRED',
      'A lead needs an email, phone, or company-backed identity for safe deduplication',
    );
  }
  return sha256(`name-company:${name}:${company}`);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function payloadHash(value: unknown): string {
  return sha256(stableJson(value));
}

export function safeIdempotencyKey(value: string): string {
  const key = value.trim();
  if (!/^[A-Za-z0-9:_./-]{8,200}$/.test(key)) {
    throw new LeadOperationsError(
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency keys must be 8-200 safe characters',
    );
  }
  return key;
}
