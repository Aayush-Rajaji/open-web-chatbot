#!/usr/bin/env node
/**
 * Zero-dependency unit tests for api/assistant.js
 * Run with: npm test  (or node scripts/test-api.mjs)
 */

import assert from 'node:assert/strict';
import handler, { resetInternalState } from '../api/assistant.js';

function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let body = null;
  return {
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
    end() {
      return this;
    },
    get result() {
      return { statusCode, headers, body };
    },
  };
}

async function runTests() {
  // Ensure tests never make live network calls
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  // 1. CORS OPTIONS preflight
  resetInternalState();
  {
    const res = createMockRes();
    await handler({ method: 'OPTIONS', headers: {} }, res);
    assert.equal(res.result.statusCode, 204);
    assert.equal(res.result.headers['access-control-allow-origin'], '*');
  }

  // 2. Reject non-POST
  {
    const res = createMockRes();
    await handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.result.statusCode, 405);
  }

  // 3. Reject empty message
  {
    const res = createMockRes();
    await handler({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body: { messages: [] } }, res);
    assert.equal(res.result.statusCode, 400);
  }

  // 4. Canonical cache hit
  {
    const res = createMockRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '2.2.2.2' },
        body: { messages: [{ role: 'user', content: 'How does this hybrid architecture work?' }] },
      },
      res
    );
    assert.equal(res.result.statusCode, 200);
    assert.equal(res.result.body.source, 'canonical');
    assert.match(res.result.body.reply, /3-layer hybrid architecture/i);
  }

  // 5. Fallback reply when no LLM keys are configured
  {
    const res = createMockRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '3.3.3.3' },
        body: { messages: [{ role: 'user', content: 'Tell me something completely unmatched xyz123' }] },
      },
      res
    );
    assert.equal(res.result.statusCode, 200);
    assert.equal(res.result.body.source, 'fallback');
    assert.ok(res.result.body.reply.length > 10);
  }

  // 6. Rate limiting after 30 requests per IP
  resetInternalState();
  {
    for (let i = 0; i < 30; i++) {
      const res = createMockRes();
      await handler(
        {
          method: 'POST',
          headers: { 'x-forwarded-for': '4.4.4.4' },
          body: { messages: [{ role: 'user', content: 'hello' }] },
        },
        res
      );
      assert.equal(res.result.statusCode, 200);
    }
    const blocked = createMockRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '4.4.4.4' },
        body: { messages: [{ role: 'user', content: 'hello' }] },
      },
      blocked
    );
    assert.equal(blocked.result.statusCode, 429);
  }

  console.log('✅ All 6 API handler tests passed!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
