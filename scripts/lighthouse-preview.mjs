#!/usr/bin/env node
/** Run only against the real Salla default preview store, never a static mock. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const help = `Usage: node scripts/lighthouse-preview.mjs --config <actual-preview.json> [--lighthouse <installed-binary>] [--chrome-path <binary>] [--output <directory>]
Requires actual home/product/collection URLs, confirmation this is Salla's default preview store, and a saved preview evidence file. No reports are generated without that input.
Six sequential Lighthouse runs: home, product, collection on mobile and desktop. Saves raw JSON, HTML, traces, devtools network logs, command logs, environment, dates, URLs, and averages.`;
if (argv.includes('--help') || !argv.length) { console.log(help); process.exit(argv.includes('--help') ? 0 : 2); }
const opts = {};
for (let index = 0; index < argv.length; index += 2) {
  const option = argv[index], value = argv[index + 1];
  if (!['--config', '--lighthouse', '--chrome-path', '--output'].includes(option) || !value || value.startsWith('--')) throw new Error(help);
  opts[option.slice(2)] = value;
}
if (!opts.config) throw new Error('Missing actual preview configuration. ' + help);
const configPath = path.resolve(root, opts.config);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (config.officialDefaultPreview !== true || !config.defaultStoreEvidence || !config.previewEvidenceFile) throw new Error('Confirm the default preview store and reference actual saved preview evidence. This confirmation is recorded as operator evidence, not automatically verified platform status.');
const evidenceFile = path.resolve(path.dirname(configPath), config.previewEvidenceFile);
if (!fs.existsSync(evidenceFile) || !fs.statSync(evidenceFile).isFile() || !fs.statSync(evidenceFile).size) throw new Error('Preview evidence file must exist and contain actual official preview output or captured default-store designation.');
const pages = ['home', 'product', 'collection'];
const parsed = pages.map(page => {
  if (typeof config.urls?.[page] !== 'string' || !config.urls[page]) throw new Error(`Missing real ${page} URL.`);
  const url = new URL(config.urls[page]);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /(?:^localhost$|\.localhost$|^127\.|^0\.0\.0\.0$|^\[?::1\]?$)/i.test(url.hostname) || /(?:example\.(?:com|org|net)$|\.invalid$|\.test$)/i.test(url.hostname)) throw new Error(`Use an actual official preview page for ${page}; local mocks and placeholder URLs cannot supply Salla review evidence.`);
  return url;
});
if (new Set(parsed.map(url => url.origin)).size !== 1) throw new Error('Runner expects the three pages on the same default preview store origin.');
if (new Set(parsed.map(url => url.href)).size !== 3) throw new Error('Provide distinct home, product, and collection page URLs.');
const binary = opts.lighthouse ? path.resolve(root, opts.lighthouse) : path.join(root, 'node_modules/.bin/lighthouse');
if (!fs.existsSync(binary)) throw new Error('Lighthouse is not installed here. Install isolated official Lighthouse tooling and pass --lighthouse; the theme dependency manifest is intentionally untouched.');
const chromePath = opts['chrome-path'] ? path.resolve(root, opts['chrome-path']) : process.env.CHROME_PATH;
if (chromePath && !fs.existsSync(chromePath)) throw new Error('Chrome executable does not exist.');
const startedAt = new Date().toISOString();
const directory = path.resolve(root, opts.output || `docs/evidence/lighthouse/${startedAt.replaceAll(':', '-')}`);
if (fs.existsSync(directory) && fs.readdirSync(directory).length) throw new Error('Use an empty output directory to preserve previous reports.');
fs.mkdirSync(directory, { recursive: true });
const version = spawnSync(binary, ['--version'], { encoding: 'utf8', env: process.env });
if (version.status !== 0) throw new Error(`Lighthouse version check failed: ${version.stderr || version.error?.message}`);
const evidence = fs.readFileSync(evidenceFile);
fs.copyFileSync(evidenceFile, path.join(directory, 'preview-evidence' + path.extname(evidenceFile)));
fs.copyFileSync(configPath, path.join(directory, 'input-config.json'));
const environment = { startedAt, node: process.version, lighthouseVersion: version.stdout.trim(), lighthouseBinary: binary, chromePath: chromePath || 'Lighthouse auto-detection; see LHR userAgent and environment', os: { type: os.type(), release: os.release(), arch: os.arch(), cpuModel: os.cpus()[0]?.model, logicalCpuCount: os.cpus().length, totalMemoryBytes: os.totalmem() }, preview: { urls: config.urls, officialDefaultPreviewOperatorConfirmed: true, defaultStoreEvidence: config.defaultStoreEvidence, evidenceFile, evidenceSha256: crypto.createHash('sha256').update(evidence).digest('hex') }, methodology: 'One navigation run per page per device, sequentially. Lighthouse default mobile preset and official desktop preset; default simulated throttling for each. Same-origin and distinct-URL checks are runner guardrails, not quoted Salla acceptance requirements.' };
fs.writeFileSync(path.join(directory, 'environment.json'), JSON.stringify(environment, null, 2) + '\n');
const runs = [];
async function command(args, logfile) {
  return new Promise(resolve => {
    const log = fs.createWriteStream(logfile);
    const child = spawn(binary, args, { cwd: root, env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) } });
    child.stdout.on('data', chunk => { log.write(chunk); process.stdout.write(chunk); });
    child.stderr.on('data', chunk => { log.write(chunk); process.stderr.write(chunk); });
    child.on('error', error => { log.end(error.stack); resolve({ exitCode: null, error: error.message }); });
    child.on('close', code => { log.end(); resolve({ exitCode: code }); });
  });
}
for (const device of ['mobile', 'desktop']) {
  for (const page of pages) {
    const id = `${device}-${page}`, prefix = path.join(directory, id);
    const args = [config.urls[page], '--only-categories=performance,accessibility', '--output=json', '--output=html', `--output-path=${prefix}`, '--save-assets', '--chrome-flags=--headless=new', ...(device === 'desktop' ? ['--preset=desktop'] : [])];
    const run = { id, device, page, requestedURL: config.urls[page], startedAt: new Date().toISOString(), command: { binary, args } };
    console.log(`Starting actual ${id} preview audit.`);
    const execution = await command(args, `${prefix}.command.log`);
    Object.assign(run, execution, { finishedAt: new Date().toISOString() });
    const reportFile = [`${prefix}.report.json`, `${prefix}.json`].find(file => fs.existsSync(file));
    if (execution.exitCode === 0 && reportFile) {
      try {
        const lhr = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
        Object.assign(run, { reportFile: path.basename(reportFile), lighthouseVersion: lhr.lighthouseVersion, fetchTime: lhr.fetchTime, finalURL: lhr.finalDisplayedUrl || lhr.finalUrl, userAgent: lhr.userAgent, environment: lhr.environment, configSettings: lhr.configSettings, runtimeError: lhr.runtimeError || null, warnings: lhr.runWarnings || [], performance: lhr.categories?.performance?.score == null ? null : lhr.categories.performance.score * 100, accessibility: lhr.categories?.accessibility?.score == null ? null : lhr.categories.accessibility.score * 100 });
        const final = new URL(run.finalURL);
        // Prevent a login, error, or redirected different page from replacing the requested audit.
        const requested = new URL(run.requestedURL);
        const normalizePath = url => url.pathname.replace(/\/$/, '') || '/';
        run.valid = !run.runtimeError && Number.isFinite(run.performance) && Number.isFinite(run.accessibility) && final.origin === requested.origin && normalizePath(final) === normalizePath(requested);
        if (!run.valid) run.invalidReason = 'Runtime/category failure or final page differs from requested preview route; inspect raw report.';
      } catch (error) { run.valid = false; run.invalidReason = error.message; }
    } else { run.valid = false; run.invalidReason = execution.error || `Lighthouse exited ${execution.exitCode}; actual JSON report ${reportFile ? 'exists' : 'missing'}.`; }
    runs.push(run);
    fs.writeFileSync(path.join(directory, 'runs.json'), JSON.stringify(runs, null, 2) + '\n');
  }
}
function average(items, metric) { return items.length && items.every(item => item.valid && Number.isFinite(item[metric])) ? items.reduce((total, item) => total + item[metric], 0) / items.length : null; }
const devices = Object.fromEntries(['mobile', 'desktop'].map(device => {
  const items = runs.filter(run => run.device === device);
  const performance = average(items, 'performance'), accessibility = average(items, 'accessibility');
  return [device, { runs: items.length, validRuns: items.filter(run => run.valid).length, performanceAverage: performance, accessibilityAverage: accessibility, performanceAtLeast60: performance == null ? null : performance >= 60, accessibilityAtLeast90: accessibility == null ? null : accessibility >= 90 }];
}));
const complete = runs.length === 6 && runs.every(run => run.valid);
const passed = complete && Object.values(devices).every(device => device.performanceAtLeast60 && device.accessibilityAtLeast90);
const summary = { startedAt, finishedAt: new Date().toISOString(), source: 'https://docs.salla.dev/421888m0', clauses: ['2.1.1', '2.1.2'], status: !complete ? 'incomplete-or-invalid-runs' : passed ? 'documented-lighthouse-thresholds-met' : 'documented-lighthouse-thresholds-not-met', calculation: 'Arithmetic mean of raw category scores × 100, across the three pages separately for each device; no rounding before threshold comparison. Also shows six-run mean for reference. Failed runs are never silently excluded from a passing average.', devices, allSixReferenceAverages: { performance: average(runs, 'performance'), accessibility: average(runs, 'accessibility') }, limitations: ['Default-store designation comes from recorded operator evidence and must be checked by the reviewer.', 'One run per route/device is a reproducible initial measurement, not a guarantee of every future run.', 'Lighthouse does not replace functional, browser, responsive, or security testing, or Salla approval.'], runs };
fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`${summary.status}: ${path.relative(root, directory)}`);
process.exitCode = passed ? 0 : 1;
