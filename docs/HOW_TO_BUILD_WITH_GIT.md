# How to Build and Ship Your Own Website Chatbot with Git

This step-by-step guide walks you through building, customizing, testing, and deploying your own website chatbot using **Git** and **GitHub**—while keeping your API keys and personal secrets completely safe.

---

## Prerequisites

1. **Git** installed ([git-scm.com](https://git-scm.com/downloads)) — check with `git --version`.
2. **A GitHub account** ([github.com](https://github.com)).
3. **Node.js 18+** (optional, only needed to run local tests and the PII scanner).
4. **Optional free AI API key** (skip if you want 100% static mode):
   - Google Gemini API key from Google AI Studio, or
   - OpenRouter API key (includes free-tier models).

---

## Step 1: Fork & Clone the Repository

1. Open the `open-web-chatbot` repository on GitHub and click **Fork** (or **Use this template**) to create your own copy under your GitHub account.
2. Clone **your** fork to your computer:

```bash
git clone https://github.com/YOUR_USERNAME/open-web-chatbot.git
cd open-web-chatbot
```

3. Verify your Git remote points to your fork:

```bash
git remote -v
```

---

## Step 2: Create a Working Branch

Never make experimental edits directly on `main` when learning—create a clean feature branch:

```bash
git checkout -b feat/customize-my-chatbot
```

Now every change you make is safely isolated on `feat/customize-my-chatbot`.

---

## Step 3: Customize Your Chatbot (Zero-Code Config)

You only need to edit **two files** to turn this template into your own assistant:

### A. Frontend Widget (`widget/chatbot.config.js`)
Open `widget/chatbot.config.js` and update:
- `brand.name`, `brand.subtitle`, `brand.welcomeTitle`, `brand.welcomeBody`
- `footerLink` and `actionChips` (your own docs, contact email, or booking link)
- `suggestedQuestions` (the 4–5 starter buttons visitors see first)
- `localKnowledge` (instant keyword-matched answers that work offline and at `$0`)

> **Want 100% static mode (no server, no API key)?**  
> Set `apiEndpoint: ''` at the top of `widget/chatbot.config.js`.

### B. Optional AI Backend (`api/knowledge.js`)
If you plan to deploy the serverless AI endpoint on Vercel, open `api/knowledge.js` and update:
- `SYSTEM_PROMPT`: Replace the Acme Studio placeholder facts with verified facts about your site, product, or portfolio.
- `CANONICAL_CACHE`: Add your highest-frequency questions so they answer in `<10ms` without spending API tokens.
- `SITE_REFERER` and `SITE_TITLE`: Set your real website URL and assistant name.

### C. Optional Theme (`widget/chatbot.css`)
To match your website's brand color, change `--owc-accent` at the top of `widget/chatbot.css`:

```css
:root {
  --owc-accent: #6366f1;
  --owc-accent-hover: #818cf8;
  --owc-accent-deep: #4f46e5;
  --owc-accent-rgb: 99, 102, 241;
  --owc-on-accent: #ffffff;
}
```

Or activate a built-in theme by adding `data-owc-theme="light"` or `data-owc-theme="ocean"` to your `<html>` or `<body>` tag.

---

## Step 4: Test Locally

### Static / Widget Test
Open `index.html` directly in your browser (or start a local server):

```bash
npx serve .
# or with Python:
python -m http.server 8000
```

Click the floating button (or press `Ctrl+K`), test your starter prompts, and try typing custom questions.

### API Unit Tests
Run the included zero-dependency test suite:

```bash
npm test
```

### Testing Live AI Locally (Optional)
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Paste your `GEMINI_API_KEY` or `OPENROUTER_API_KEY` into `.env.local`.
3. Run Vercel's local dev server:
   ```bash
   npx vercel dev
   ```

---

## Step 5: Protect Your Secrets Before Committing

This is the **most important Git habit** when building AI apps: **never commit API keys or private credentials to Git.**

1. Run the built-in PII & secret scanner:
   ```bash
   npm run check:pii
   ```
2. Inspect what Git is about to track:
   ```bash
   git status
   ```
   Confirm that `.env` and `.env.local` do **not** appear in `git status` (they are blocked by `.gitignore`).
3. Review your exact line-by-line changes:
   ```bash
   git diff
   ```

---

## Step 6: Commit and Push to GitHub

1. Stage your changes:
   ```bash
   git add widget/chatbot.config.js api/knowledge.js widget/chatbot.css
   ```
   *(Or `git add .` after confirming `git status` is clean.)*
2. Create a clear, descriptive commit:
   ```bash
   git commit -m "Customize chatbot branding, theme, and knowledge base"
   ```
3. Push your branch to GitHub:
   ```bash
   git push -u origin feat/customize-my-chatbot
   ```
4. Merge into `main` (either via a Pull Request on GitHub or locally):
   ```bash
   git checkout main
   git merge feat/customize-my-chatbot
   git push origin main
   ```

---

## Step 7: Deploy Live (Choose Option A or B)

### Option A: GitHub Pages (100% Free, Static Mode)
1. Make sure `apiEndpoint: ''` is set in `widget/chatbot.config.js` (or leave it as `/api/assistant`—the widget will automatically fall back to `localKnowledge` on GitHub Pages!).
2. On GitHub, open your repository → **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Push to `main`. The included `.github/workflows/deploy-pages.yml` workflow will publish your live demo at:
   `https://YOUR_USERNAME.github.io/open-web-chatbot/`

### Option B: Vercel (Free Tier, Full Hybrid AI Mode)
1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your `open-web-chatbot` GitHub repository.
3. Open **Environment Variables** and add:
   - `GEMINI_API_KEY` = *(your key)*
   - *(Optional)* `OPENROUTER_API_KEY` = *(your backup key)*
4. Click **Deploy**.
5. Every future `git push origin main` will automatically redeploy both your widget and `/api/assistant`!

---

## Step 8: Embed on Your Real Website

Copy `widget/chatbot.css`, `widget/chatbot.config.js`, and `widget/chatbot.js` into your main website repo and include them right before `</body>`:

```html
<link rel="stylesheet" href="/widget/chatbot.css" />
<script src="/widget/chatbot.config.js"></script>
<script src="/widget/chatbot.js" defer></script>
```

If your main website is hosted on GitHub Pages while your `/api/assistant` lives on Vercel:
1. Set `ALLOWED_ORIGIN=https://your-site.github.io` in your Vercel Environment Variables.
2. Set `apiEndpoint: 'https://your-project.vercel.app/api/assistant'` in `widget/chatbot.config.js`.

---

## Common Git Mistakes & How to Fix Them

### "Oops! I accidentally staged `.env.local`!"
Unstage it immediately before committing:
```bash
git reset HEAD .env.local
```

### "I already pushed an API key to a public GitHub repo!"
1. **Revoke and regenerate the API key immediately** in Google AI Studio / OpenRouter. Removing it from a later commit does **not** erase it from Git history!
2. Delete `.env.local` from Git tracking:
   ```bash
   git rm --cached .env.local
   git commit -m "Stop tracking local env file"
   git push origin main
   ```

### "How do I pull updates from the original upstream template?"
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/open-web-chatbot.git
git fetch upstream
git merge upstream/main
```
