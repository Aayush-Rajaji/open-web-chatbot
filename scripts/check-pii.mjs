#!/usr/bin/env node
/**
 * Zero-dependency PII & Secret Scanner for open-web-chatbot
 * Run `node scripts/check-pii.mjs` before committing or pushing to Git!
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.vercel', '_site']);
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.json',
  '.html',
  '.css',
  '.md',
  '.yml',
  '.yaml',
  '.txt',
  '.example',
]);

// Safe placeholder emails allowed in open-source docs & templates
const ALLOWED_EMAILS = new Set([
  'hello@example.com',
  'support@example.com',
  'you@example.com',
  'user@example.com',
]);

const RULES = [
  {
    name: 'Google / Gemini API key',
    regex: /AIza[0-9A-Za-z_-]{30,}/g,
  },
  {
    name: 'OpenRouter API key',
    regex: /sk-or-v1-[0-9a-fA-F]{20,}/g,
  },
  {
    name: 'OpenAI / Generic secret key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'Non-placeholder email address',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    filter: (match) => !ALLOWED_EMAILS.has(match.toLowerCase()),
  },
  {
    name: 'Possible phone number',
    regex: /\+[1-9][0-9]{0,2}[\s.-]?(?:\(?[0-9]{3,5}\)?[\s.-]?){2,3}[0-9]{2,5}\b/g,
    filter: (match) => !match.includes('555'),
  },
];

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext) || entry.name === 'LICENSE' || entry.name === '.gitignore') {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const findings = [];

// Warn if real .env files exist inside the repo directory
for (const envName of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(ROOT, envName))) {
    console.warn(`⚠️  Notice: ${envName} exists locally. Make sure it stays ignored by .gitignore.`);
  }
}

for (const filePath of walk(ROOT)) {
  const rel = path.relative(ROOT, filePath);
  if (rel === path.join('scripts', 'check-pii.mjs')) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        const value = match[0];
        if (rule.filter && !rule.filter(value)) continue;
        findings.push({
          file: rel,
          line: idx + 1,
          rule: rule.name,
          value,
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('\n❌ Potential PII or secret(s) detected:\n');
  for (const f of findings) {
    console.error(`  - ${f.file}:${f.line} [${f.rule}] -> ${f.value}`);
  }
  console.error('\nRemove or replace with safe placeholders before committing to Git.\n');
  process.exit(1);
}

console.log('✅ PII & Secret check passed: zero personal emails, phone numbers, or API keys found.');
