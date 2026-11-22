
const test = require('node:test');
const assert = require('node:assert/strict');

test('Beauty Shop: перевірка структури товару', () => {
  const product = {
    id: 1,
    name: 'Крем для обличчя'
  };

  assert.equal(product.id, 1);
  assert.equal(product.name, 'Крем для обличчя');
});
