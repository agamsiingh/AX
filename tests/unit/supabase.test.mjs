import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../../assets/js/config.js';
import { insertRow, SubmitError } from '../../assets/js/supabase.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('posts a minimal insert with the publishable key', async () => {
  let call;
  globalThis.fetch = async (url, init) => {
    call = { url, init };
    return new Response(null, { status: 201 });
  };

  await insertRow('contact_submissions', { name: 'Asha', email: 'asha@example.com' });

  assert.equal(call.url, `${CONFIG.supabaseUrl}/rest/v1/contact_submissions`);
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers.apikey, CONFIG.supabaseKey);
  assert.equal(call.init.headers.Authorization, `Bearer ${CONFIG.supabaseKey}`);
  assert.equal(call.init.headers.Prefer, 'return=minimal');
  assert.deepEqual(JSON.parse(call.init.body), { name: 'Asha', email: 'asha@example.com' });
});

test('maps a unique-constraint violation to a duplicate error', async () => {
  globalThis.fetch = async () => jsonResponse(409, { code: '23505', message: 'duplicate key value' });
  await assert.rejects(insertRow('newsletter_subscribers', { email: 'a@b.co' }), (err) => {
    assert.ok(err instanceof SubmitError);
    assert.equal(err.kind, 'duplicate');
    return true;
  });
});

test('maps other API errors to a server error with the API message', async () => {
  globalThis.fetch = async () => jsonResponse(401, { code: '42501', message: 'permission denied' });
  await assert.rejects(insertRow('demo_requests', {}), (err) => {
    assert.equal(err.kind, 'server');
    assert.equal(err.code, '42501');
    assert.match(err.message, /permission denied/);
    return true;
  });
});

test('handles non-JSON error bodies', async () => {
  globalThis.fetch = async () => new Response('Bad gateway', { status: 502 });
  await assert.rejects(insertRow('demo_requests', {}), (err) => {
    assert.equal(err.kind, 'server');
    assert.match(err.message, /502/);
    return true;
  });
});

test('maps network failures and aborts', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(insertRow('contact_submissions', {}), { kind: 'network' });

  globalThis.fetch = async () => {
    throw new DOMException('The operation was aborted.', 'AbortError');
  };
  await assert.rejects(insertRow('contact_submissions', {}), { kind: 'timeout' });
});
