import assert from 'node:assert/strict';
import test from 'node:test';
import { scopedClientId } from '../../lib/lead-operations/auth';
import { LeadOperationsError } from '../../lib/lead-operations/errors';
import { rolesAllowedToMutate } from '../../lib/lead-operations/service';

test('client actors are confined to their own tenant', () => {
  const actor = { id: 'client-user', role: 'CLIENT' as const, clientId: 'client-a' };
  assert.equal(scopedClientId(actor), 'client-a');
  assert.equal(scopedClientId(actor, 'client-a'), 'client-a');
  assert.throws(
    () => scopedClientId(actor, 'client-b'),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'TENANT_MISMATCH',
  );
});

test('staff mutations require an explicit tenant and exclude client users', () => {
  const actor = { id: 'staff-user', role: 'ACCOUNT_MANAGER' as const, clientId: null };
  assert.equal(scopedClientId(actor, 'client-a'), 'client-a');
  assert.throws(
    () => scopedClientId(actor),
    (error: unknown) => error instanceof LeadOperationsError && error.code === 'TENANT_REQUIRED',
  );
  assert.deepEqual(rolesAllowedToMutate(), ['ADMIN', 'ACCOUNT_MANAGER', 'CAMPAIGN_SPECIALIST']);
});
