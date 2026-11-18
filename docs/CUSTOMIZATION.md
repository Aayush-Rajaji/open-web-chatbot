# Customization & Embedding Recipes

## 1. Plain HTML Website

Place the `widget/` folder in your site root and add these 3 lines right before `</body>`:

```html
<link rel="stylesheet" href="/widget/chatbot.css" />
<script src="/widget/chatbot.config.js"></script>
<script src="/widget/chatbot.js" defer></script>
```

---

## 2. React / Next.js (App Router)

Copy `widget/chatbot.css`, `widget/chatbot.config.js`, and `widget/chatbot.js` into your `public/widget/` folder, then load them in `app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/widget/chatbot.css" />
      </head>
      <body>
        {children}
        <Script src="/widget/chatbot.config.js" strategy="afterInteractive" />
        <Script src="/widget/chatbot.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
```

---

## 3. Programmatic Triggers on Your Page

`widget/chatbot.js` exposes `window.OpenWebChatbot` so any button on your site can open the widget or pre-fill a question:

```html
<button onclick="window.OpenWebChatbot.open()">Chat with AI</button>
<button onclick="window.OpenWebChatbot.ask('How does pricing work?')">Ask about Pricing</button>
```

Available methods:
- `window.OpenWebChatbot.open()`
- `window.OpenWebChatbot.close()`
- `window.OpenWebChatbot.toggle()`
- `window.OpenWebChatbot.ask(questionText)`

---

## 4. Customizing Colors & Themes

### Option A: Switch built-in themes
Add `data-owc-theme` to `<html>` or `<body>`:
- Default: Dark Neon (no attribute needed)
- Light: `<html data-owc-theme="light">`
- Ocean: `<html data-owc-theme="ocean">`

### Option B: Custom brand palette
Override any CSS variable in your own stylesheet loaded after `widget/chatbot.css`:

```css
:root {
  --owc-accent: #f97316;
  --owc-accent-hover: #fb923c;
  --owc-accent-deep: #ea580c;
  --owc-accent-rgb: 249, 115, 22;
  --owc-on-accent: #ffffff;
  --owc-radius: 18px;
}
```

---

## 5. Swapping or Adding Another LLM Provider

`api/assistant.js` uses the standard `fetch()` API—no SDKs required. To add any OpenAI-compatible provider (OpenAI, Groq, Together, Mistral, or local Ollama), add a block like this inside `api/assistant.js`:

```js
if (process.env.OPENAI_API_KEY) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.4,
      max_tokens: 320,
    }),
  });
  // parse data?.choices?.[0]?.message?.content
}
```
