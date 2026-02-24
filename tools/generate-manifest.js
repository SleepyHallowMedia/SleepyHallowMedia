#!/usr/bin/env node
// Scans newsletters/*.txt and writes newsletters/index.json

const fs = require('fs').promises;
const path = require('path');

async function listNewsletters() {
  const dir = path.join(__dirname, '..', 'newsletters');
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile())
      .map(e => e.name)
      .filter(name => name.toLowerCase().endsWith('.txt') && !name.startsWith('.'));
    files.sort();
    return files;
  } catch (err) {
    console.error('Could not read newsletters directory:', err.message);
    return [];
  }
}

async function ensureNewslettersDir() {
  const dir = path.join(__dirname, '..', 'newsletters');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function writeManifest(files) {
  const outPath = path.join(__dirname, '..', 'newsletters', 'index.json');
  const content = JSON.stringify(files, null, 2) + '\n';
  await fs.writeFile(outPath, content, 'utf8');
  console.log('Wrote', outPath);
}

async function main() {
  await ensureNewslettersDir();
  const files = await listNewsletters();
  await writeManifest(files);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});