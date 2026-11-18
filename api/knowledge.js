/**
 * Server-side Knowledge Base & Persona Prompt for /api/assistant
 *
 * Replace the placeholder facts below with your own product, portfolio,
 * or company documentation. Keep sensitive credentials out of this file.
 */

export const SITE_REFERER = 'https://example.com/';
export const SITE_TITLE = 'Open Web Chatbot Demo';

export const SYSTEM_PROMPT = `You are the website AI assistant for Acme Studio ("Site Assistant").
Voice: Concise, helpful, accurate, grounded, and free of corporate buzzwords. Keep replies under 130 words unless the user asks for technical depth.
Rules:
- Only state facts listed below. If asked something outside these facts, say you do not have that information and point the visitor to hello@example.com.
- Never invent pricing, private details, or unverified claims.

Verified facts about Acme Studio:
- Overview: Acme Studio builds lightweight, fast, local-first web tools and open-source developer utilities.
- Flagship Template: Open Web Chatbot — a zero-dependency vanilla JS website assistant with instant canonical caching, optional Gemini/OpenRouter LLM backend, per-IP rate limiting, and static fallback mode.
- Pricing & Hosting: Works 100% free on GitHub Pages in static mode, or on Vercel's free tier with a free Gemini or OpenRouter API key.
- Customization: Edit widget/chatbot.config.js for UI copy and local Q&A, widget/chatbot.css for themes, and api/knowledge.js for the server system prompt.
- Contact: hello@example.com | https://example.com/contact | https://github.com/YOUR_USERNAME/open-web-chatbot`;

export const CANONICAL_CACHE = [
  {
    triggers: ['how does', 'architecture', 'how it works', 'hybrid', 'zero-dependency', 'overview'],
    reply:
      '**Open Web Chatbot** uses a 3-layer hybrid architecture with **zero npm dependencies**:\n\n' +
      '• **Layer 1 (Instant Canonical Cache)**: Frequent questions answer in `<10ms` with `$0` LLM token usage.\n' +
      '• **Layer 2 (Serverless LLM + TTL Cache)**: Open-ended questions route to **Gemini** or **OpenRouter** with per-IP rate limiting and 30-minute caching.\n' +
      '• **Layer 3 (Static Fallback)**: Works even on static hosts like GitHub Pages or offline.',
  },
  {
    triggers: ['free', 'without an api', 'no api', 'static', 'offline', 'backend', 'cost', 'pricing'],
    reply:
      'You can run this chatbot **100% free**:\n\n' +
      '• **Static Mode**: Set `apiEndpoint: ""` in `widget/chatbot.config.js` and host on GitHub Pages.\n' +
      '• **Hybrid AI Mode**: Deploy on Vercel Hobby and configure a free `GEMINI_API_KEY` or `OPENROUTER_API_KEY` environment variable.',
  },
  {
    triggers: ['customize', 'branding', 'color', 'theme', 'knowledge', 'config', 'embed'],
    reply:
      'To make this chatbot yours:\n\n' +
      '• Edit `widget/chatbot.config.js` for widget text, starter prompts, and local fallback replies.\n' +
      '• Edit `api/knowledge.js` for your AI system prompt and server-side FAQ cache.\n' +
      '• Change colors in `widget/chatbot.css` via `--owc-accent` or switch themes with `data-owc-theme="light"`.',
  },
  {
    triggers: ['git', 'github', 'fork', 'clone', 'deploy', 'vercel', 'pages', 'push'],
    reply:
      'Quick Git workflow to ship your chatbot:\n\n' +
      '1. Clone or fork the template repository.\n' +
      '2. Update `widget/chatbot.config.js` and `api/knowledge.js`.\n' +
      '3. Run `node scripts/check-pii.mjs` to ensure no secrets are staged.\n' +
      '4. Push to GitHub and connect your repo to GitHub Pages or Vercel.',
  },
  {
    triggers: ['contact', 'reach', 'email', 'support', 'talk', 'connect'],
    reply:
      'Reach the site team (replace these placeholders in `api/knowledge.js`):\n\n' +
      '• **Email**: hello@example.com\n' +
      '• **Website**: https://example.com/contact\n' +
      '• **Repository**: https://github.com/YOUR_USERNAME/open-web-chatbot',
  },
  {
    triggers: ['hi', 'hello', 'hey', 'start'],
    reply:
      'Hey! I am the **Open Web Chatbot** assistant. Ask how the hybrid architecture works, how to style the widget, or how to deploy your own copy with Git.',
  },
];

export const FALLBACK_REPLY =
  'I can answer questions about **Open Web Chatbot**, its hybrid architecture, customization, and Git deployment.\n\nTo enable open-ended AI answers, add `GEMINI_API_KEY` or `OPENROUTER_API_KEY` in your hosting environment variables, or reach out at hello@example.com.';
