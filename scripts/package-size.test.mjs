import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

// Salla rejects private themes whose compressed package exceeds 2 MB; keep headroom for compressor differences.
const LIMIT = 1.8 * 1024 * 1024;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

test('tracked theme package stays under the Salla private theme size limit', t => {
  const files = trackedFiles();
  if (!files) return t.skip('not a git checkout');
  // Approximate a zip archive: deflated content plus local/central headers per entry and the end record.
  let total = 22;
  const sizes = [];
  for (const file of files) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const data = fs.readFileSync(absolute);
    const size = Math.min(data.length, zlib.deflateRawSync(data, { level: 9 }).length) + 76 + 2 * Buffer.byteLength(file);
    total += size;
    sizes.push([size, file]);
  }
  const largest = sizes.sort((a, b) => b[0] - a[0]).slice(0, 5).map(([size, file]) => `${file} (${(size / 1024).toFixed(0)} KB)`);
  assert.ok(total <= LIMIT, `compressed package ≈ ${(total / 1048576).toFixed(2)} MB exceeds ${(LIMIT / 1048576).toFixed(1)} MB; largest: ${largest.join(', ')}`);
});
