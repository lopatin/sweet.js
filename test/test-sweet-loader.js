import test from 'ava';

import compile, { load } from '../src/sweet-loader';

test('loading a no-dep single var export module', t => {
  let registry = {
    'entry.js': `export var a = 'a'`
  };

  return load('entry.js', registry).then(mod => {
    t.deepEqual(mod, {a: 'a'});
  });
});
