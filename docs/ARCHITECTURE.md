# Architecture & Security Design

`open-web-chatbot` is engineered to be **fast, cheap to operate, resilient offline, and safe to embed** on any website.

---

## 1. The 3-Layer Hybrid Resolution Order

When a visitor sends a message, the chatbot resolves the reply in strict priority order:

| Layer | Where It Runs | Latency | Token Cost | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **1. Canonical Cache** | `api/knowledge.js` (or `widget/chatbot.config.js` offline) | `<10ms` | `$0` | Deterministic, brand-accurate answers for top FAQs (pricing, contact, about, docs). |
| **2. Dynamic TTL Cache** | In-memory `Map` in `api/assistant.js` | `<15ms` | `$0` | Deduplicates repeated open-ended visitor questions for 30 minutes (up to 400 entries). |
| **3. LLM Cascade** | Gemini → OpenRouter (`api/assistant.js`) | `500–1800ms` | Free tier / low | Handles nuanced, multi-turn, or unexpected questions using your `SYSTEM_PROMPT`. |
| **4. Graceful Fallback** | `api/assistant.js` & `widget/chatbot.js` | `<200ms` | `$0` | Guarantees visitors never see an ugly `500 Internal Server Error` if keys expire or quotas run out. |

---

## 2. Security Safeguards Built In

### Zero Client-Side Secrets
- API keys (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`) live **only** on the server in `process.env`.
- Browser DevTools users can never inspect or steal your keys.

### XSS-Safe Rich Formatting
- User messages are inserted via `textContent` (never `innerHTML`).
- Assistant replies pass through `escapeHtml()` **before** inline Markdown (`**bold**`, `` `code` ``, URLs, and emails) is converted to HTML tags.
- Configured link URLs (`footerLink`, `actionChips`) are checked by `isSafeHref()` to block `javascript:` URIs.

### Abuse & Quota Protection
- **Per-IP Rate Limiting**: Default `30 requests per 5 minutes` per IP address (returns HTTP `429`).
- **Payload Caps**: Only the last `8` messages are sent per request, and each message is truncated to `1200` characters to prevent prompt-stuffing or token drain.
- **Output Token Ceiling**: LLM generation is capped (`320` tokens) with low temperature (`0.4`) for crisp, low-hallucination replies.

### CORS Control for Split Hosting
- `api/assistant.js` handles `OPTIONS` preflight requests and reads `process.env.ALLOWED_ORIGIN` (default `*`).
- For production split hosting (e.g., GitHub Pages frontend + Vercel API), set `ALLOWED_ORIGIN` to your exact site origin so third-party websites cannot piggyback on your endpoint.

---

## 3. Why Zero Dependencies?

1. **Instant load**: The entire widget (`chatbot.js` + `chatbot.css` + `chatbot.config.js`) is just a few kilobytes—zero impact on Lighthouse or Core Web Vitals.
2. **Zero supply-chain maintenance**: No weekly Dependabot vulnerabilities or broken webpack upgrades.
3. **Universal compatibility**: Works inside static HTML, React, Next.js, Vue, Astro, Hugo, WordPress, Webflow, or Shopify without framework conflicts.
