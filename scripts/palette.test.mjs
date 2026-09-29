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
        '--beauty-paper': '#fff', '--beauty-cream': '#f8f8f8',
        '--beauty-ink': '#222', '--beauty-muted': '#666',
        '--beauty-olive': '#222', '--beauty-gold': '#222',
        '--beauty-border': '#e5e5e5', '--color-primary': '#222',
        '--color-primary-reverse': '#fff',
      })) assert.equal(tokens[name], value, `${page}/${palette}: ${name}`);
    }
  });
}
