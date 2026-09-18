#!/usr/bin/env node
/** Explicit measurement scopes, with no guessed interpretation of Salla 1MB. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.argv[2] || 'docs/evidence/technical/size-report.json');
const exclusions = new Set(['.git', 'node_modules', '.pnpm-store', '.twilight', 'docs', 'scripts', '.agents', '.codex']);
const walk = directory => !fs.existsSync(directory) ? [] : fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (exclusions.has(entry.name)) return [];
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : entry.isFile() ? [full] : [];
});
const rel = file => path.relative(root, file).split(path.sep).join('/');
const files = walk(root).sort().map(file => {
  const data = fs.readFileSync(file);
  return { file: rel(file), bytes: data.length, gzipBytes: gzipSync(data, { level: 9 }).length, brotliBytes: brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
});
function scope(id, description, include) {
  const selected = files.filter(include);
  const sum = key => selected.reduce((total, item) => total + item[key], 0);
  return { id, description, fileCount: selected.length, rawBytes: sum('bytes'), gzipBytes: sum('gzipBytes'), brotliBytes: sum('brotliBytes'), files: selected };
}
const report = { generatedAt: new Date().toISOString(), environment: { node: process.version, os: `${os.type()} ${os.release()}`, arch: os.arch() }, method: { units: 'bytes', gzip: 'each file independently, level 9, summed', brotli: 'each file independently, quality 11, summed', exclusions: [...exclusions], note: 'Compressed totals are hypothetical encodings, not a measured uploaded archive or actual HTTP transfer. Source and built files may duplicate each other in broader scopes.' }, officialRequirement: { source: 'https://docs.salla.dev/421888m0', clause: '1.1', text: 'Theme size should not exceed 1mb.', status: 'official-clarification-required', undefined: ['which files belong to the submitted theme', 'raw files vs archive vs network encodings', 'decimal MB vs binary MiB'], referenceBytes: { decimalMB: 1000000, binaryMiB: 1048576 }, acceptance: 'No scope in this report is asserted to be the official acceptance scope.' }, scopes: [scope('built-public-all', 'All files in public/, including images.', item => item.file.startsWith('public/')), scope('built-public-js-css', 'Only generated JavaScript and CSS in public/.', item => item.file.startsWith('public/') && /\.(js|css)$/.test(item.file)), scope('source-runtime', 'Twilight manifest plus src/ assets, translations, and Twig; excludes public/.', item => item.file === 'twilight.json' || item.file.startsWith('src/')), scope('runtime-manifest-views-locales-built', 'Manifest, Twig, locales, and all built public files; source assets excluded.', item => item.file === 'twilight.json' || item.file.startsWith('src/views/') || item.file.startsWith('src/locales/') || item.file.startsWith('public/')), scope('project-excluding-tooling-docs', 'Project files excluding declared directories; includes build config, locks, source, and output.', () => true)] };
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
for (const item of report.scopes) console.log(`${item.id}: ${item.fileCount} files; raw=${item.rawBytes}; gzip=${item.gzipBytes}; brotli=${item.brotliBytes} bytes`);
console.log('Official 1MB acceptance remains unclassified pending Salla scope clarification.');
