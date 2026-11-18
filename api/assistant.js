/**
 * Serverless Endpoint: POST /api/assistant
 *
 * Pipeline:
 *   1. CORS + Method validation + Per-IP sliding-window rate limiter
 *   2. Canonical Q&A cache (0ms, $0 token cost)
 *   3. Dynamic in-memory TTL cache (deduplicates repeated questions)
 *   4. Primary LLM: Google Gemini (GEMINI_API_KEY)
 *   5. Secondary LLM: OpenRouter free-tier model rotation (OPENROUTER_API_KEY)
 *   6. Graceful fallback reply (never crashes when API keys are absent)
 */

import {
  CANONICAL_CACHE,
  FALLBACK_REPLY,
  SITE_REFERER,
  SITE_TITLE,
  SYSTEM_PROMPT,
} from './knowledge.js';

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 30; // per IP per window
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 400;

const requestCounts = new Map();
const dynamicCache = new Map();

const FREE_OPENROUTER_MODELS = [
  'openrouter/free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
];
let rotationCounter = 0;

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesTrigger(query, trigger) {
  const t = String(trigger || '').trim();
  if (!t) return false;
  return new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(query);
}

function matchCanonical(query) {
  const q = query.trim();
  for (const entry of CANONICAL_CACHE) {
    if (entry.triggers.some((t) => matchesTrigger(q, t))) {
      return entry.reply;
    }
  }
  return null;
}

function pruneAndCheckRateLimit(ip, now) {
  if (requestCounts.size > 2000) {
    for (const [key, entry] of requestCounts.entries()) {
      if (now >= entry.resetAt) requestCounts.delete(key);
    }
  }
  const limit = requestCounts.get(ip);
  if (limit && now < limit.resetAt) {
    if (limit.count >= MAX_REQUESTS) {
      return false;
    }
    limit.count += 1;
    return true;
  }
  requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  return true;
}

function storeDynamicCache(cacheKey, reply, now) {
  if (dynamicCache.size >= MAX_CACHE_ENTRIES) {
    dynamicCache.delete(dynamicCache.keys().next().value);
  }
  dynamicCache.set(cacheKey, { reply, ts: now });
}

export function resetInternalState() {
  requestCounts.clear();
  dynamicCache.clear();
  rotationCounter = 0;
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forwarded = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ip = String(forwarded).split(',')[0].trim();
  const now = Date.now();

  if (!pruneAndCheckRateLimit(ip, now)) {
    return res.status(429).json({ error: 'Rate limit reached. Try again shortly.' });
  }

  const rawBody = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
  const messages = Array.isArray(rawBody?.messages) ? rawBody.messages.slice(-8) : [];
  const lastUser = [...messages]
    .reverse()
    .find((m) => m && m.role === 'user' && typeof m.content === 'string');
  const query = lastUser ? lastUser.content.trim().slice(0, 1200) : '';

  if (!query) {
    return res.status(400).json({ error: 'Message required' });
  }

  // 1. Instant canonical cache hit
  const canonical = matchCanonical(query);
  if (canonical) {
    return res.status(200).json({ reply: canonical, source: 'canonical' });
  }

  // 2. Dynamic in-memory cache hit
  const cacheKey = query.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const cached = dynamicCache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json({ reply: cached.reply, source: 'cache' });
  }

  // 3. Primary LLM: Google Gemini
  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    try {
      const gemRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(m.content || '').slice(0, 1200) }],
            })),
            generationConfig: { temperature: 0.4, maxOutputTokens: 320 },
          }),
        }
      );
      if (gemRes.ok) {
        const data = await gemRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          storeDynamicCache(cacheKey, reply, now);
          return res.status(200).json({ reply, source: 'gemini' });
        }
      }
    } catch {}
  }

  // 4. Secondary LLM: OpenRouter free models
  if (process.env.OPENROUTER_API_KEY) {
    const model = FREE_OPENROUTER_MODELS[rotationCounter++ % FREE_OPENROUTER_MODELS.length];
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_REFERER,
          'X-Title': SITE_TITLE,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          temperature: 0.4,
          max_tokens: 320,
        }),
      });
      if (orRes.ok) {
        const data = await orRes.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (reply) {
          storeDynamicCache(cacheKey, reply, now);
          return res.status(200).json({ reply, source: 'openrouter' });
        }
      }
    } catch {}
  }

  // 5. Graceful fallback
  return res.status(200).json({
    reply: FALLBACK_REPLY,
    source: 'fallback',
  });
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
