import test from 'node:test';
import assert from 'node:assert/strict';
import { staticTranslationRows, messageTranslations } from '../studio/i18n.js';

const placeholders = (value) =>
  [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((match) => match[1]).sort();

function assertTrilingual(entries) {
  for (const [key, translations] of entries) {
    assert.equal(translations.length, 3, `${key}: expected FR, EN and ES`);
    for (const [index, value] of translations.entries())
      assert.ok(typeof value === 'string' && value.trim(), `${key}: empty locale ${index}`);
    assert.deepEqual(placeholders(translations[1]), placeholders(translations[0]), key);
    assert.deepEqual(placeholders(translations[2]), placeholders(translations[0]), key);
  }
}

test('static UI copy has unique source strings and complete FR/EN/ES translations', () => {
  const keys = staticTranslationRows.map(([fr]) => fr);
  assert.equal(new Set(keys).size, keys.length, 'duplicate source string');
  assertTrilingual(staticTranslationRows.map((row) => [row[0], row]));
});

test('dynamic UI copy has complete FR/EN/ES translations and matching placeholders', () => {
  assertTrilingual(Object.entries(messageTranslations));
});
