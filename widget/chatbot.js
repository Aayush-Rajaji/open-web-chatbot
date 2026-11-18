/**
 * open-web-chatbot — Zero-Dependency Floating Chat Widget
 * Load widget/chatbot.css and widget/chatbot.config.js before this script.
 */
(function initOpenWebChatbot() {
  if (document.getElementById('owc-chat-root')) return;

  const userConfig = window.OPEN_WEB_CHATBOT_CONFIG || {};
  const brand = Object.assign(
    {
      name: 'Site Assistant',
      badge: 'AI',
      subtitle: 'Hybrid Website Assistant',
      triggerTitle: 'Ask Assistant',
      triggerSub: 'Site AI · Ask me',
      shortcutKey: 'k',
      shortcutLabel: 'Ctrl+K',
      placeholder: 'Ask a question...',
      footerLeft: 'Powered by Open Web Chatbot',
      welcomeEyebrow: 'Website Assistant',
      welcomeTitle: 'How can I help?',
      welcomeBody: 'Ask a question or choose a starter prompt below.',
    },
    userConfig.brand || {}
  );

  const apiEndpoint =
    typeof userConfig.apiEndpoint === 'string' ? userConfig.apiEndpoint.trim() : '/api/assistant';
  const footerLink = userConfig.footerLink || null;
  const actionChips = Array.isArray(userConfig.actionChips) ? userConfig.actionChips : [];
  const suggestedQuestions = Array.isArray(userConfig.suggestedQuestions)
    ? userConfig.suggestedQuestions
    : [];
  const localKnowledge = Array.isArray(userConfig.localKnowledge) ? userConfig.localKnowledge : [];
  const fallbackReply =
    typeof userConfig.fallbackReply === 'string' && userConfig.fallbackReply.trim()
      ? userConfig.fallbackReply
      : 'Thanks for your message! Configure `localKnowledge` or connect `/api/assistant` to customize replies.';

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function matchesTrigger(query, trigger) {
    const t = String(trigger || '').trim();
    if (!t) return false;
    return new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(query);
  }

  function getLocalFallback(text) {
    const q = String(text || '').trim();
    for (const item of localKnowledge) {
      if (Array.isArray(item.triggers) && item.triggers.some((t) => matchesTrigger(q, t))) {
        return item.reply;
      }
    }
    return fallbackReply;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeHref(href) {
    if (typeof href !== 'string') return false;
    const trimmed = href.trim();
    return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed);
  }

  function formatInline(raw) {
    let html = escapeHtml(raw);
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/(https?:\/\/[^\s<]+)/g, (match) => {
      const cleanUrl = match.replace(/[.,!?;:)\]]+$/, '');
      const trailing = match.slice(cleanUrl.length);
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${trailing}`;
    });
    html = html.replace(
      /(^|[\s(])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '$1<a href="mailto:$2">$2</a>'
    );
    return html;
  }

  function renderRichContent(text) {
    const wrap = document.createElement('div');
    const lines = String(text || '').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const bullet = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
      if (bullet) {
        const row = document.createElement('div');
        row.className = 'owc-bullet';
        row.innerHTML = `<span class="owc-bullet-dot" aria-hidden="true"></span><div>${formatInline(
          bullet[1]
        )}</div>`;
        wrap.append(row);
      } else {
        const p = document.createElement('p');
        p.innerHTML = formatInline(trimmed);
        wrap.append(p);
      }
    }
    return wrap;
  }

  function buildFooterLinkHtml() {
    if (!footerLink || !isSafeHref(footerLink.href)) return '';
    return `<a href="${escapeHtml(footerLink.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
      footerLink.label || 'Docs'
    )}</a>`;
  }

  const root = document.createElement('div');
  root.id = 'owc-chat-root';
  root.innerHTML = `
    <div class="owc-chat-backdrop" id="owc-chat-backdrop" hidden></div>
    <section class="owc-chat-dialog" id="owc-chat-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(
      brand.name
    )}" hidden>
      <header class="owc-chat-head">
        <div class="owc-chat-id">
          <div class="owc-orb-wrap">
            <span class="owc-orb-glow" aria-hidden="true"></span>
            <span class="owc-orb-dot" aria-hidden="true"></span>
          </div>
          <div>
            <div class="owc-chat-title-row">
              <h3>${escapeHtml(brand.name)}</h3>
              <span class="owc-ai-badge"><i aria-hidden="true"></i>${escapeHtml(brand.badge)}</span>
            </div>
            <p class="owc-chat-sub">${escapeHtml(brand.subtitle)}</p>
          </div>
        </div>
        <div class="owc-head-btns">
          <button type="button" class="owc-icon-btn" id="owc-chat-reset" title="Reset chat" aria-label="Reset conversation">↺</button>
          <button type="button" class="owc-icon-btn" id="owc-chat-close" title="Close (Esc)" aria-label="Close assistant">✕</button>
        </div>
      </header>
      <div class="owc-chat-log" id="owc-chat-log" role="log" aria-live="polite"></div>
      <div class="owc-chat-foot">
        <form class="owc-chat-form" id="owc-chat-form">
          <textarea class="owc-chat-input" id="owc-chat-input" rows="1" maxlength="1200" placeholder="${escapeHtml(
            brand.placeholder
          )}" aria-label="Message ${escapeHtml(brand.name)}"></textarea>
          <button type="submit" class="owc-send-btn" id="owc-chat-send" disabled aria-label="Send message">↑</button>
        </form>
        <div class="owc-foot-meta">
          <span>${escapeHtml(brand.footerLeft)}</span>
          ${buildFooterLinkHtml()}
        </div>
      </div>
    </section>
    <button type="button" class="owc-chat-trigger" id="owc-chat-trigger" aria-label="Open ${escapeHtml(
      brand.name
    )} (${escapeHtml(brand.shortcutLabel)})" aria-expanded="false">
      <div class="owc-orb-wrap">
        <span class="owc-orb-glow" aria-hidden="true"></span>
        <span class="owc-orb-dot" aria-hidden="true"></span>
      </div>
      <div class="owc-trigger-copy">
        <div class="owc-trigger-top">
          <span class="owc-trigger-title">${escapeHtml(brand.triggerTitle)}</span>
          <kbd class="owc-kbd">${escapeHtml(brand.shortcutLabel)}</kbd>
        </div>
        <span class="owc-trigger-sub">${escapeHtml(brand.triggerSub)}</span>
      </div>
      <span class="owc-trigger-icon" aria-hidden="true">↗</span>
    </button>
  `;
  document.body.append(root);

  const trigger = document.getElementById('owc-chat-trigger');
  const dialog = document.getElementById('owc-chat-dialog');
  const backdrop = document.getElementById('owc-chat-backdrop');
  const logEl = document.getElementById('owc-chat-log');
  const form = document.getElementById('owc-chat-form');
  const input = document.getElementById('owc-chat-input');
  const sendBtn = document.getElementById('owc-chat-send');
  const closeBtn = document.getElementById('owc-chat-close');
  const resetBtn = document.getElementById('owc-chat-reset');

  let isOpen = false;
  let pending = false;
  let messages = [];

  function setOpen(next) {
    isOpen = next;
    dialog.hidden = !isOpen;
    backdrop.hidden = !isOpen;
    trigger.hidden = isOpen;
    trigger.setAttribute('aria-expanded', String(isOpen));
    if (window.innerWidth < 640) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    if (isOpen) {
      if (messages.length === 0) renderWelcome();
      setTimeout(() => input.focus(), 20);
    } else {
      trigger.focus();
    }
  }

  function renderWelcome() {
    logEl.innerHTML = '';
    const welcome = document.createElement('div');
    welcome.className = 'owc-welcome';
    welcome.innerHTML = `
      <p class="owc-welcome-eyebrow">${escapeHtml(brand.welcomeEyebrow)}</p>
      <h4>${escapeHtml(brand.welcomeTitle)}</h4>
      <p>${escapeHtml(brand.welcomeBody)}</p>
    `;
    logEl.append(welcome);

    if (suggestedQuestions.length > 0) {
      const lbl = document.createElement('p');
      lbl.className = 'owc-suggestions-label';
      lbl.textContent = 'Start here';

      const list = document.createElement('div');
      list.className = 'owc-suggestions';
      for (const item of suggestedQuestions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'owc-q-btn';
        btn.innerHTML = `<div><span class="owc-q-cat">${escapeHtml(
          item.cat || 'TOPIC'
        )}</span><p class="owc-q-text">${escapeHtml(
          item.q || ''
        )}</p></div><span class="owc-q-arrow" aria-hidden="true">↗</span>`;
        btn.addEventListener('click', () => sendMessage(item.q || ''));
        list.append(btn);
      }
      logEl.append(lbl, list);
    }
  }

  function renderThread() {
    logEl.innerHTML = '';
    for (const msg of messages) {
      const row = document.createElement('div');
      row.className = `owc-msg ${msg.role}`;
      const bubble = document.createElement('div');
      bubble.className = 'owc-bubble';

      if (msg.role === 'user') {
        const p = document.createElement('p');
        p.textContent = msg.content;
        bubble.append(p);
      } else {
        bubble.append(renderRichContent(msg.content));
        const actions = document.createElement('div');
        actions.className = 'owc-bubble-actions';

        for (const chip of actionChips) {
          if (!chip || !isSafeHref(chip.href)) continue;
          const a = document.createElement('a');
          a.className = chip.primary ? 'owc-chip' : 'owc-chip secondary';
          a.href = chip.href;
          if (/^https?:\/\//i.test(chip.href)) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          a.textContent = chip.label || 'Open';
          actions.append(a);
        }

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'owc-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(msg.content);
            copyBtn.textContent = 'Copied ✓';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 1800);
          } catch {}
        });
        actions.append(copyBtn);
        bubble.append(actions);
      }
      row.append(bubble);
      logEl.append(row);
    }

    if (pending) {
      const t = document.createElement('div');
      t.className = 'owc-thinking';
      t.innerHTML = '<i aria-hidden="true"></i><span>Thinking...</span>';
      logEl.append(t);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function sendMessage(rawText) {
    const content = String(rawText || '').trim();
    if (!content || pending) return;

    messages.push({ role: 'user', content });
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    pending = true;
    renderThread();

    let reply = '';
    try {
      if (apiEndpoint && window.location.protocol !== 'file:') {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messages.slice(-8) }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string' && data.reply.trim()) {
            reply = data.reply.trim();
          }
        }
      }
    } catch {}

    if (!reply) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      reply = getLocalFallback(content);
    }

    messages.push({ role: 'assistant', content: reply });
    pending = false;
    renderThread();
    setTimeout(() => input.focus(), 10);
  }

  trigger.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  resetBtn.addEventListener('click', () => {
    messages = [];
    pending = false;
    renderWelcome();
    input.focus();
  });

  input.addEventListener('input', () => {
    sendBtn.disabled = pending || !input.value.trim();
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  const shortcutKey = String(brand.shortcutKey || 'k').toLowerCase();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      setOpen(false);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcutKey) {
      const tag = e.target && e.target.tagName;
      if (
        e.target !== input &&
        (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable))
      ) {
        return;
      }
      e.preventDefault();
      setOpen(!isOpen);
    }
  });

  // Expose minimal programmatic API for buttons on the host page
  window.OpenWebChatbot = {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    ask: (question) => {
      setOpen(true);
      sendMessage(question);
    },
  };
})();
