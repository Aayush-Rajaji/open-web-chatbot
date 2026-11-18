/**
 * open-web-chatbot — Single-File Site Configuration
 *
 * Edit ONLY this file to customize the widget for your own website.
 * Keep secrets (API keys) out of this file — put API keys in Vercel/server env vars!
 */
window.OPEN_WEB_CHATBOT_CONFIG = {
  // Optional serverless API endpoint.
  // - Use '/api/assistant' when deployed together on Vercel.
  // - Use 'https://your-api.vercel.app/api/assistant' if hosting frontend on GitHub Pages.
  // - Set to '' (empty string) for 100% static/offline mode with zero backend.
  apiEndpoint: '/api/assistant',

  brand: {
    name: 'Site Assistant',
    badge: 'AI',
    subtitle: 'Acme Studio · Hybrid Web Assistant',
    triggerTitle: 'Ask Assistant',
    triggerSub: 'Site AI · Ask me',
    shortcutKey: 'k',
    shortcutLabel: 'Ctrl+K',
    placeholder: 'Ask about projects, architecture, or how to embed...',
    footerLeft: 'Open Web Chatbot · Ctrl+K',
    welcomeEyebrow: 'Acme Studio · Hybrid AI',
    welcomeTitle: 'How can I help you today?',
    welcomeBody:
      'Ask about our products, how this zero-dependency chatbot works, or how to fork and deploy your own copy with Git.',
  },

  footerLink: {
    label: 'Docs ↗',
    href: 'https://github.com/YOUR_USERNAME/open-web-chatbot',
  },

  // Quick action buttons shown below every assistant reply
  actionChips: [
    {
      label: 'GitHub Guide ↗',
      href: 'https://github.com/YOUR_USERNAME/open-web-chatbot',
      primary: true,
    },
    {
      label: 'Email Us ↗',
      href: 'mailto:hello@example.com',
      primary: false,
    },
    {
      label: 'Contact Page ↗',
      href: 'https://example.com/contact',
      primary: false,
    },
  ],

  // Starter questions displayed before the first message
  suggestedQuestions: [
    {
      cat: 'OVERVIEW',
      q: 'How does this zero-dependency website chatbot work?',
    },
    {
      cat: 'STATIC VS AI',
      q: 'Can I run this for free without an API key or backend?',
    },
    {
      cat: 'CUSTOMIZE',
      q: 'How do I customize the branding, colors, and knowledge base?',
    },
    {
      cat: 'GIT & DEPLOY',
      q: 'How do I fork this repo and deploy it with Git?',
    },
    {
      cat: 'CONTACT',
      q: 'How can visitors reach the site owner directly?',
    },
  ],

  // Instant local knowledge base (used offline, on GitHub Pages, or if the API is unreachable)
  localKnowledge: [
    {
      triggers: ['how does', 'architecture', 'how it works', 'hybrid', 'zero-dependency', 'overview'],
      reply:
        '**Open Web Chatbot** uses a 3-layer hybrid architecture with **zero npm dependencies**:\n\n' +
        '• **Layer 1 (Instant Local / Canonical Cache)**: Common questions answer in `<10ms` with `$0` LLM cost.\n' +
        '• **Layer 2 (Serverless LLM API)**: Unmatched questions hit `/api/assistant` with per-IP rate limiting, 30-minute response caching, and automatic **Gemini → OpenRouter** fallback.\n' +
        '• **Layer 3 (Offline Fallback)**: If hosted on a static host like GitHub Pages (or offline), it seamlessly answers from `widget/chatbot.config.js`.',
    },
    {
      triggers: ['free', 'without an api', 'no api', 'static', 'offline', 'backend', 'cost', 'pricing'],
      reply:
        'Yes! You can run this chatbot **100% free** in two ways:\n\n' +
        '• **Static Mode (`$0`, no backend)**: Set `apiEndpoint: ""` in `widget/chatbot.config.js` and deploy to **GitHub Pages**, Cloudflare Pages, or Netlify.\n' +
        '• **Hybrid AI Mode (free tiers)**: Deploy on **Vercel Hobby** and add a free `GEMINI_API_KEY` or `OPENROUTER_API_KEY` in your Vercel Project Environment Variables.',
    },
    {
      triggers: ['customize', 'branding', 'color', 'theme', 'knowledge', 'config', 'embed', 'style'],
      reply:
        'Customizing takes under 5 minutes:\n\n' +
        '• **Identity & Q&A**: Edit `widget/chatbot.config.js` (frontend) and `api/knowledge.js` (server prompt + canonical cache).\n' +
        '• **Colors & Themes**: Override `--owc-accent` and `--owc-bg` in `widget/chatbot.css`, or set `data-owc-theme="light"` or `"ocean"` on `<body>`.\n' +
        '• **Embed anywhere**: Add `<link rel="stylesheet" href="widget/chatbot.css">`, `<script src="widget/chatbot.config.js"></script>`, and `<script src="widget/chatbot.js" defer></script>` to any HTML page.',
    },
    {
      triggers: ['git', 'github', 'fork', 'clone', 'deploy', 'vercel', 'pages', 'push'],
      reply:
        'Shipping your own copy with Git:\n\n' +
        '1. **Fork & clone** the repo: `git clone https://github.com/YOUR_USERNAME/open-web-chatbot.git`\n' +
        '2. **Edit** `widget/chatbot.config.js` and `api/knowledge.js` with your own facts.\n' +
        '3. **Run the PII/secret check**: `node scripts/check-pii.mjs`\n' +
        '4. **Commit & push**: `git add . && git commit -m "Customize site chatbot" && git push origin main`\n' +
        '• Never commit `.env.local` — add API keys in your hosting provider dashboard!',
    },
    {
      triggers: ['contact', 'reach', 'email', 'support', 'talk', 'hire', 'connect'],
      reply:
        'Replace these placeholder links in `widget/chatbot.config.js` with your real details:\n\n' +
        '• **Email**: hello@example.com\n' +
        '• **Website**: https://example.com/contact\n' +
        '• **Repository**: https://github.com/YOUR_USERNAME/open-web-chatbot',
    },
    {
      triggers: ['hi', 'hello', 'hey', 'start'],
      reply:
        'Hey! I am the **Open Web Chatbot** demo assistant. Ask me how the hybrid architecture works, how to customize themes, or how to deploy your own copy with Git.',
    },
  ],

  fallbackReply:
    'I am running in **local static fallback mode**. Add your own triggers in `widget/chatbot.config.js`, or connect a free **Gemini** / **OpenRouter** key in `/api/assistant` to answer open-ended questions.\n\nNeed help? Visit https://github.com/YOUR_USERNAME/open-web-chatbot or email hello@example.com.',
};
