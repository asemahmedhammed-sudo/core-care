#!/usr/bin/env node
/** Repository checks only. This does not validate a deployed Salla theme. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] || 'docs/evidence/technical/static-audit.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : entry.isFile() ? [full] : [];
});
const relative = file => path.relative(root, file).split(path.sep).join('/');
// Preserve positions for useful line numbers, while excluding Twig comments.
const cleanTwig = value => value.replace(/\{#[\s\S]*?#\}/g, match => match.replace(/[^\n]/g, ' '));
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => {
  const name = prefix ? `${prefix}.${key}` : key;
  return item && typeof item === 'object' && !Array.isArray(item) ? flatten(item, name) : [[name, item]];
});
const checks = [];
const check = (id, passed, details) => checks.push({ id, status: passed ? 'pass' : 'fail', details });
const baseline = JSON.parse(read('docs/evidence/technical/upstream-baseline.json'));
const report = { kind: 'static-repository-audit', generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch }, root, upstream: { source: baseline.source, commit: baseline.commit, version: baseline.version }, limitations: ['No authenticated Salla preview was tested by this script.', 'Pattern searches cannot prove security, localization coverage, schema acceptance, or network efficiency.', 'Raw expressions remain review items even when inherited from official Raed.'], checks };
try {
  const manifest = JSON.parse(read('twilight.json'));
  check('manifest-json', true, 'JSON parsed; this is not Salla schema validation.');
  const locales = fs.readdirSync(path.join(root, 'src/locales')).filter(name => name.endsWith('.json')).sort();
  const keySets = Object.fromEntries(locales.map(name => [name, new Map(flatten(JSON.parse(read(`src/locales/${name}`))))]));
  const union = [...new Set(Object.values(keySets).flatMap(keys => [...keys.keys()]))].sort();
  report.localization = { locales, keyCount: union.length, missing: {}, nonString: {} };
  for (const [locale, keys] of Object.entries(keySets)) {
    report.localization.missing[locale] = union.filter(key => !keys.has(key));
    report.localization.nonString[locale] = [...keys].filter(([, value]) => typeof value !== 'string').map(([key]) => key);
  }
  check('locale-key-parity', locales.includes('ar.json') && locales.includes('en.json') && Object.values(report.localization.missing).every(items => !items.length), report.localization.missing);
  check('locale-values-string', Object.values(report.localization.nonString).every(items => !items.length), report.localization.nonString);

  const components = Array.isArray(manifest.components) ? manifest.components : [];
  report.components = components.map(component => {
    const safePath = typeof component.path === 'string' && /^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+$/.test(component.path);
    const file = safePath ? `src/views/components/${component.path.replaceAll('.', '/')}.twig` : null;
    return { path: component.path, file, exists: !!file && exists(file), fields: (component.fields || []).map(field => field.id).filter(Boolean) };
  });
  check('custom-component-files', report.components.every(component => component.exists), report.components);
  const duplicatePaths = report.components.filter((component, index) => report.components.findIndex(other => other.path === component.path) !== index).map(component => component.path);
  check('unique-component-paths', !duplicatePaths.length, duplicatePaths);
  report.declaredFeatures = manifest.features || [];
  report.customFieldReferences = [];
  for (const component of components.filter(item => item.path.startsWith('home.beauty-') || item.path === 'home.main-links')) {
    const file = `src/views/components/${component.path.replaceAll('.', '/')}.twig`;
    if (!exists(file)) continue;
    const view = cleanTwig(read(file));
    function inspect(fields) {
      for (const field of fields) {
        const parts = field.id?.split('.') || [];
        const nestedName = component.path === 'home.main-links' && parts[0] === 'links' ? 'item' : parts[0].replace(/s$/, '');
        const reference = parts.length > 1 ? `${nestedName}.${parts.slice(1).join('.')}` : `component.${parts[0]}`;
        report.customFieldReferences.push({ component: component.path, field: field.id, expectedReference: reference, found: view.includes(reference) });
        if (field.fields) inspect(field.fields);
      }
    }
    inspect(component.fields || []);
  }
  check('custom-field-template-references', report.customFieldReferences.every(item => item.found), report.customFieldReferences.filter(item => !item.found));

  const fields = [];
  function visit(value, location) {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${location}[${index}]`));
    if (!value || typeof value !== 'object') return;
    if (value.id && value.type) fields.push({ location, id: value.id, type: value.type, format: value.format, inputType: value.inputType });
    for (const [key, item] of Object.entries(value)) visit(item, `${location}.${key}`);
  }
  visit(manifest.settings || [], 'settings');
  components.forEach((component, index) => visit(component.fields || [], `components[${index}].fields`));
  report.merchantFields = fields;
  report.htmlInputFields = fields.filter(field => [field.type, field.format, field.inputType].some(value => typeof value === 'string' && /^(?:html|rich[-_]?text|wysiwyg|code|code-editor)$/i.test(value)) || /(?:^|_)(?:custom_html|html_code|html_content)(?:$|_)/i.test(field.id));
  check('no-merchant-html-input-field', !report.htmlInputFields.length, { fields: report.htmlInputFields, limitation: 'Plain textarea is not treated as HTML. Admin labelHTML metadata is not a merchant HTML entry field. Escaping remains a separate review.' });
  report.lengthInventory = [];
  function lengths(value, location = '$') {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (/length/i.test(key)) report.lengthInventory.push({ location: `${location}.${key}`, value: item });
      lengths(item, `${location}.${key}`);
    }
  }
  lengths(manifest);
  report.lengthRequirement = { status: 'official-clarification-required', documentedMaximum: 1000, reason: 'Technical review says Length in Twilight without identifying a property or the measured object. This inventory makes no binding interpretation.' };
  report.lengthValuesOver1000 = report.lengthInventory.filter(entry => Number.isFinite(Number(entry.value)) && Number(entry.value) > 1000);

  const master = cleanTwig(read('src/views/layouts/master.twig'));
  report.master = { blocks: [...master.matchAll(/\{%\s*block\s+(\w+)/g)].map(match => match[1]), hooks: [...master.matchAll(/\{%\s*hook\s+(?:['"]([^'"]+)['"]|(\w+))\s*%\}/g)].map(match => match[1] || match[2]) };
  check('preserve-upstream-master-blocks', baseline.master.blocks.every(name => report.master.blocks.includes(name)), { upstream: baseline.master.blocks, current: report.master.blocks });
  check('preserve-upstream-master-hooks', baseline.master.hooks.every(name => report.master.hooks.includes(name)), { upstream: baseline.master.hooks, current: report.master.hooks });
  check('documented-master-head-block', report.master.blocks.includes('head'), { note: 'Master layout documentation lists head; current official Raed uses head_scripts. Additional head block preserves both extension points.' });
  const integrations = [...baseline.master.components.map(name => ({ kind: 'component', value: name, found: new RegExp(`\\{%\\s*component\\s+['"]${name.replaceAll('.', '\\.')}['"]`).test(master) })), ...baseline.master.sallaElements.map(name => ({ kind: 'element', value: name, found: master.includes(`<${name}`) })), ...baseline.master.assets.map(name => ({ kind: 'asset', value: name, found: master.includes(name) }))];
  check('preserve-upstream-master-integrations', integrations.every(item => item.found), integrations);

  const templates = walk(path.join(root, 'src/views')).filter(file => file.endsWith('.twig'));
  report.changedTemplates = [];
  report.rawInventory = [];
  report.hardcodedCommerce = [];
  report.literalTextCandidates = [];
  function classify(expression, attribute) {
    if (attribute) return { source: 'expression inside an HTML attribute', risk: 'Attribute escaping bypassed; remove raw. URLs also need normal platform URL provenance.', review: 'unsafe-context' };
    if (/product_desc|product\.description/.test(expression)) return { source: 'Salla product rich description (product_desc assignment must be checked)', risk: 'Platform-managed rich content; upstream origin does not prove sanitation.', review: 'verify-platform-sanitization' };
    if (/page\.content|article\.body|order\.instructions/.test(expression)) return { source: 'Platform-managed page, article, or order rich content', risk: 'Confirm documented sanitation before retaining raw.', review: 'verify-platform-sanitization' };
    if (/order\.rating\./.test(expression)) return { source: 'Customer-generated review text', risk: 'Text should be escaped.', review: 'remove-raw' };
    if (/trans\(|pluralize\(/.test(expression)) return { source: 'Translation result, potentially interpolated', risk: 'Inspect arguments and intended markup; ordinary text can be escaped.', review: 'review-translation-and-arguments' };
    if (/store\.description|brand\.description|sub_title|theme\.settings|component\./.test(expression)) return { source: 'Merchant-managed platform content or merchant component/settings text', risk: 'Escape plain text; do not expose a custom HTML entry facility.', review: 'remove-raw-or-prove-rich-content-contract' };
    if (/page\.title|refund_message|shipping_company/.test(expression)) return { source: 'Platform title, message, or shipping value', risk: 'Ordinary text should be escaped.', review: 'remove-raw' };
    return { source: 'Unclassified dynamic value', risk: 'Trace producer, trust boundary, and output context.', review: 'unclassified' };
  }
  for (const file of templates) {
    const rel = relative(file), original = fs.readFileSync(file, 'utf8'), text = cleanTwig(original);
    const changed = baseline.files[rel] !== hash(original);
    if (changed) report.changedTemplates.push({ file: rel, kind: baseline.files[rel] ? 'modified-upstream' : 'new-template', sha256: hash(original) });
    for (const match of text.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
      if (!/\|\s*raw\b/.test(match[1])) continue;
      const before = text.slice(0, match.index), open = before.lastIndexOf('<'), close = before.lastIndexOf('>');
      const attribute = open > close && !before.slice(open).startsWith('<!--');
      report.rawInventory.push({ file: rel, line: before.split('\n').length, expression: match[1].trim().replace(/\s+/g, ' '), outputContext: attribute ? 'attribute' : 'element-content', upstreamFile: !!baseline.files[rel], ...classify(match[1], attribute) });
    }
    if (changed) {
      for (const match of text.matchAll(/core\s*care|كور\s*كير|كود\s+(?:الخصم|خصم)\s*[:：]?\s*[A-Za-z0-9]{3,}|(?:coupon|promo)_?code\s*[:=]\s*['"][A-Za-z0-9]+/gi)) report.hardcodedCommerce.push({ file: rel, line: text.slice(0, match.index).split('\n').length, literal: match[0] });
      const withoutTwig = text.replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, '');
      for (const match of withoutTwig.matchAll(/>\s*([^<>{}\n]*[\p{L}][^<>{}\n]*)\s*</gu)) {
        const literal = match[1].trim();
        if (literal && !literal.startsWith('//')) report.literalTextCandidates.push({ file: rel, literal });
      }
    }
  }
  check('no-reference-brand-or-fixed-coupon-in-changed-templates', !report.hardcodedCommerce.length, { findings: report.hardcodedCommerce, limitation: 'Pattern search for the reference brand and obvious fixed coupon literals. Manual review is still required for products, prices, and ratings.' });
  check('no-raw-in-new-custom-templates', !report.rawInventory.some(item => !item.upstreamFile), report.rawInventory.filter(item => !item.upstreamFile));
  report.rawReview = { status: report.rawInventory.length ? 'review-required' : 'no-raw-found', count: report.rawInventory.length, note: 'No source is marked safe merely because it occurs in upstream Raed.' };
  report.networkSourceCandidates = [];
  for (const file of walk(path.join(root, 'src/assets/js')).filter(file => file.endsWith('.js'))) {
    const text = fs.readFileSync(file, 'utf8'), rel = relative(file);
    if (baseline.files[rel] === hash(text)) continue;
    for (const match of text.matchAll(/\bfetch\s*\(|\baxios[.(]|salla\.(?:product|products)\.[\w]+\s*\(/g)) report.networkSourceCandidates.push({ file: rel, line: text.slice(0, match.index).split('\n').length, pattern: match[0] });
  }
  report.ownerMetadata = { status: 'pending-owner-data', fields: { name: manifest.name ?? manifest.theme_name ?? null, repository: manifest.repository ?? manifest.repo_url ?? null, support: manifest.author_email ?? manifest.support_url ?? null }, note: 'Empty owner metadata is intentional pending real owner values; JSON parsing does not imply publication validity.' };
} catch (error) {
  checks.push({ id: 'audit-completed', status: 'fail', details: error.message });
}
report.result = checks.some(item => item.status === 'fail') ? 'static-checks-failed' : 'static-checks-passed-with-platform-tests-pending';
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`${report.result}: ${checks.filter(item => item.status === 'pass').length}/${checks.length} repository checks passed. Report: ${path.relative(root, output)}`);
for (const item of checks.filter(item => item.status === 'fail')) console.error(`FAIL ${item.id}: ${JSON.stringify(item.details)}`);
process.exitCode = checks.some(item => item.status === 'fail') ? 1 : 0;
