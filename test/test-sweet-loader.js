import test from 'ava';

import compile, { load, SweetLoader } from '../src/sweet-loader';

// SweetLoader unit tests

test('locate pulls out the phase from the path', t => {
  let l = new SweetLoader();

  let addr = l.locate({ name: '/foo/bar:0'});
  t.is(addr.path, '/foo/bar');
  t.is(addr.phase, 0);

  addr = l.locate({ name: '/foo/bar:0      '});
  t.is(addr.path, '/foo/bar');
  t.is(addr.phase, 0);
});

test('locate throws an error if phase is missing', t => {
  let l = new SweetLoader();

  t.throws(() => l.locate({ name: '/foo/bar'}));
});


// High-level API

test('loading a no-dep single var export module', t => {
  let store = new Map();
  store.set('entry.js', `export var a = 'a'`);

  return load('entry.js', store).then(mod => {
    t.deepEqual(mod, {a: 'a'});
  });
});
