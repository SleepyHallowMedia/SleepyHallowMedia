#!/usr/bin/env node
/* Build sitemap.xml from newsletters/index.json */
'use strict';
const fs = require('fs').promises;
const path = require('path');

// Set your public base (trailing slash). You can override in CI with SITE_BASE env var.
const BASE = process.env.SITE_BASE || 'https://sleepyhallowmedia.github.io/SleepyHallowMedia/'; // trailing slash
const OUT  = path.join(__dirname, '..', 'sitemap.xml');
const MANI = path.join(__dirname, '..', 'newsletters', 'index.json');

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function main(){
  const raw = await fs.readFile(MANI,'utf8');
  const files = JSON.parse(raw); // ['foo.txt', ...]
  const urls = [
    { loc: BASE,                                     changefreq: 'daily',  priority: '0.9' },
    { loc: BASE + 'newsletters.html',                changefreq: 'daily',  priority: '0.8' },
    ...files.map(f => ({ loc: `${BASE}article.html?article=${encodeURIComponent(f)}`, changefreq: 'weekly', priority: '0.6' }))
  ];
  const body = urls.map(u => `  <url>
    <loc>${esc(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  await fs.writeFile(OUT, xml, 'utf8');
  console.log('Wrote', OUT);
}
main().catch(e => { console.error(e); process.exit(1); });