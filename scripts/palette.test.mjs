import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import postcss from 'postcss';

const styles = ['beauty.scss', 'core-care-palette.scss'].map(file =>
  fs.readFileSync(new URL(`../src/assets/styles/06-beauty/${file}`, import.meta.url), 'utf8'),
).join('\n');
const css = postcss.parse(sass.compileString(styles).css);

// Resolve the actual compiled body rules, including specificity and source order.
// Descendant and conditional rules cannot set custom properties on the body.
function bodyTokens(classes) {
  const values = new Map();
  css.walkRules(rule => {
    if (rule.parent.type !== 'root') return;
    for (const selector of rule.selectors) {
      if (!/^(?:body)?(?:\.[\w-]+)+$/.test(selector)) continue;
      const required = selector.match(/\.[\w-]+/g).map(name => name.slice(1));
      if (!required.every(name => classes.includes(name))) continue;
      const specificity = required.length * 100 + Number(selector.startsWith('body'));
      rule.walkDecls(/^--/, declaration => {
        if ((values.get(declaration.prop)?.specificity ?? -1) <= specificity) {
          values.set(declaration.prop, { value: declaration.value, specificity });
        }
      });
    }
  });
  return Object.fromEntries([...values].map(([name, entry]) => [name, entry.value]));
}

for (const page of ['home', 'inner']) {
  test(`neutral identity wins over legacy ${page} palette variants`, () => {
    for (const palette of ['olive', 'rose', 'store']) {
      const tokens = bodyTokens(['theme-beauty', `beauty-palette-${palette}`,
        ...(page === 'home' ? ['beauty-reference-home', 'beauty-alternate-sections'] : [])]);
      for (const [name, value] of Object.entries({
        '--cc-canvas': '#f8f8f8', '--cc-surface': '#fff', '--cc-text': '#000',
        '--cc-sale': '#ee2d64', '--cc-announcement': '#e874a5', '--cc-secondary': '#997adb',
        '--cc-border': '#e5e7eb', '--beauty-paper': 'var(--cc-surface)',
        '--beauty-ink': 'var(--cc-text)', '--beauty-olive': 'var(--cc-action)',
        '--cc-action': palette === 'store' ? 'var(--color-primary)' : '#222',
        '--cc-action-text': palette === 'store' ? 'var(--cc-primary-contrast, var(--color-primary-reverse))' : '#fff',
      })) assert.equal(tokens[name], value, `${page}/${palette}: ${name}`);
    }
  });
}
