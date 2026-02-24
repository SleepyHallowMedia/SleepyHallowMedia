#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Validate newsletters manifest + frontmatter.
 * Exits:
 *   0 - OK
 *   2 - Validation errors (CI should fail)
 *   1 - Unexpected runtime error
 */
'use strict';

const fs = require('fs').promises;
const path = require('path');

function stripBomAndNormalize(text) {
  return String(text || '')
    .replace(/^\uFEFF/, '') // BOM
    .replace(/\r/g, '');    // CRLF -> LF
}

function parseFrontmatter(text) {
  const src = stripBomAndNormalize(text).replace(/^\s+/, ''); // allow leading whitespace
  if (!src.startsWith('---\n') && src !== '---') {
    return { meta: {}, body: src.trim() };
  }
  const parts = src.split('\n');
  const meta = {};
  let i = 1;
  for (; i < parts.length; i++) {
    const line = parts[i].trim();
    if (line === '---') { i++; break; }
    if (!line) continue;
    const m = line.match(/^([^:]+)\s*:\s*(.*)$/);
    if (m) meta[m[1].trim()] = m[2].trim();
  }
  const body = parts.slice(i).join('\n').trim();
  return { meta, body };
}

function validateDateYMD(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))) return { ok: false, reason: 'not-YYYY-MM-DD' };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { ok: false, reason: 'invalid-date' };
  return { ok: true, value: d };
}

function isBoolish(v) {
  if (typeof v === 'boolean') return true;
  if (typeof v === 'number') return v === 0 || v === 1;
  if (typeof v === 'string') return /^(true|false|yes|no|0|1)$/i.test(v.trim());
  return v === undefined; // missing is fine
}

function looksTxt(name) {
  return typeof name === 'string' && name.toLowerCase().endsWith('.txt');
}

async function loadManifest() {
  const manifestPath = path.join(__dirname, '..', 'newsletters', 'index.json');
  let raw;
  try {
    raw = await fs.readFile(manifestPath, 'utf8');
  } catch (e) {
    throw new Error(`Failed to load newsletters/index.json: ${e.message}`);
  }
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in newsletters/index.json: ${e.message}`);
  }
  if (!Array.isArray(arr)) throw new Error('index.json is not an array');
  return arr;
}

async function readNewsletter(relFile) {
  const filePath = path.join(__dirname, '..', 'newsletters', relFile);
  const text = await fs.readFile(filePath, 'utf8');
  return { filePath, text };
}

async function main() {
  let ok = true;
  try {
    const manifest = await loadManifest(); // [/path/file.txt, ...]  [1](https://onvccs-my.sharepoint.com/personal/has95324_email_vccs_edu/Documents/Microsoft%20Copilot%20Chat%20Files/validate-news.yml)

    if (manifest.length === 0) {
      console.warn('Warning: manifest is empty');
    }

    for (const entry of manifest) {
      if (typeof entry !== 'string') {
        console.error('Manifest contains non-string entry:', entry);
        ok = false;
        continue;
      }

      if (!looksTxt(entry)) {
        console.warn(`${entry}: not a .txt file (allowed, but check generator configuration)`);
      }

      let text;
      try {
        const { text: raw } = await readNewsletter(entry);
        text = raw;
      } catch (e) {
        console.error(`Missing or unreadable file listed in manifest: ${entry}`);
        ok = false;
        continue;
      }

      const { meta } = parseFrontmatter(text); // original behavior with enhancements  [1](https://onvccs-my.sharepoint.com/personal/has95324_email_vccs_edu/Documents/Microsoft%20Copilot%20Chat%20Files/validate-news.yml)

      // Title: warn if missing (keep original policy)  [1](https://onvccs-my.sharepoint.com/personal/has95324_email_vccs_edu/Documents/Microsoft%20Copilot%20Chat%20Files/validate-news.yml)
      if (!meta.Title) {
        console.warn(`${entry}: missing Title in frontmatter`);
      }

      // Date: must be YYYY-MM-DD
      if (meta.Date) {
        const d = validateDateYMD(meta.Date);
        if (!d.ok) {
          console.error(`${entry}: Date must be YYYY-MM-DD (got: ${meta.Date})`);
          ok = false;
        } else {
          const now = new Date();
          if (d.value.getTime() - now.getTime() > 36 * 60 * 60 * 1000) {
            console.warn(`${entry}: Date appears to be in the future (${meta.Date})`);
          }
        }
      }

      // Hidden / Draft: boolean-ish only (soft-hide support)
      if (!isBoolish(meta.Hidden)) {
        console.warn(`${entry}: Hidden should be boolean-ish (true/false/yes/no/0/1)`);
      }
      if (!isBoolish(meta.Draft)) {
        console.warn(`${entry}: Draft should be boolean-ish (true/false/yes/no/0/1)`);
      }
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  if (!ok) process.exit(2);
  console.log('Validation passed');
}

main();