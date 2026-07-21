import assert from 'node:assert/strict';
import test from 'node:test';
import { destinationHash, leadDedupeKey, normalizeEmail, payloadHash, stableJson } from '../../lib/lead-operations/identity';

test('identity normalization is deterministic and rejects invalid email', () => {
  assert.equal(normalizeEmail('  Person@Example.COM '), 'person@example.com');
  assert.throws(() => normalizeEmail('not-an-email'), /deliverable email/);
  assert.equal(
    leadDedupeKey({ fullName: 'One Person', email: 'person@example.com' }),
    leadDedupeKey({ fullName: 'Changed Name', email: ' PERSON@example.com ' }),
  );
  assert.equal(destinationHash('EMAIL', 'Person@Example.com'), destinationHash('email', 'person@example.com'));
});

test('payload hashes are independent of object key order', () => {
  assert.equal(stableJson({ b: 2, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(payloadHash({ b: 2, a: 1 }), payloadHash({ a: 1, b: 2 }));
});
