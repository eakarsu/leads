import dns from 'node:dns/promises';
import net from 'node:net';
import { LeadOperationsError } from './errors';

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 10
      || a === 127
      || a === 0
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127)
      || a >= 224;
  }
  const normalized = address.toLowerCase().split('%')[0];
  return normalized === '::1'
    || normalized === '::'
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || normalized.startsWith('fe8')
    || normalized.startsWith('fe9')
    || normalized.startsWith('fea')
    || normalized.startsWith('feb')
    || normalized.startsWith('::ffff:127.')
    || normalized.startsWith('::ffff:10.')
    || normalized.startsWith('::ffff:192.168.');
}

export async function assertSafeConnectorUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new LeadOperationsError('INVALID_CONNECTOR_URL', 'Connector URL is invalid'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') {
    throw new LeadOperationsError('UNSAFE_CONNECTOR_URL', 'Connector delivery requires HTTPS on the standard port');
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new LeadOperationsError('UNSAFE_CONNECTOR_URL', 'Local connector destinations are not allowed');
  }
  const allowlist = (process.env.CONNECTOR_ALLOWED_HOSTS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(hostname)) {
    throw new LeadOperationsError('CONNECTOR_HOST_NOT_ALLOWED', 'Connector host is not in CONNECTOR_ALLOWED_HOSTS');
  }
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new LeadOperationsError('UNSAFE_CONNECTOR_URL', 'Connector host resolves to a private or reserved address');
  }
  return url;
}

async function readBounded(response: Response, limit = 64 * 1024): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new LeadOperationsError('CONNECTOR_RESPONSE_TOO_LARGE', 'Connector response exceeded 64 KiB', 502);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function postConnector(input: {
  url: string;
  credentialRef: string;
  idempotencyKey: string;
  body: unknown;
}): Promise<{ receipt: string; status: number }> {
  const url = await assertSafeConnectorUrl(input.url);
  const credential = process.env[input.credentialRef];
  if (!credential) {
    throw new LeadOperationsError('CONNECTOR_CREDENTIAL_MISSING', `Secret ${input.credentialRef} is not configured`, 503, true);
  }
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
    headers: {
      authorization: `Bearer ${credential}`,
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
      'user-agent': 'LeadOperationsSync/1.0',
    },
    body: JSON.stringify(input.body),
  });
  const responseBody = await readBounded(response);
  if (response.status >= 300 && response.status < 400) {
    throw new LeadOperationsError('CONNECTOR_REDIRECT_BLOCKED', 'Connector redirects are not followed', 502);
  }
  if (!response.ok) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new LeadOperationsError(`CONNECTOR_HTTP_${response.status}`, 'Connector rejected the operation', 502, retryable);
  }
  let receipt = response.headers.get('x-request-id') || response.headers.get('x-receipt-id') || '';
  if (!receipt && responseBody) {
    try {
      const parsed = JSON.parse(responseBody) as { id?: unknown; receipt?: unknown };
      receipt = String(parsed.receipt || parsed.id || '');
    } catch {
      receipt = '';
    }
  }
  return { receipt: receipt || `http-${response.status}`, status: response.status };
}
