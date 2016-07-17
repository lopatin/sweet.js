import test from 'ava';

import compile, { load, SweetLoader } from '../src/sweet-loader';

// SweetLoader unit tests

test('locate pulls out the phase from the path', t => {
  let l = new SweetLoader();

  return l.locate({ name: '/foo/bar:0'}).then(addr => {
    t.is(addr.path, '/foo/bar');
    t.is(addr.phase, 0);

    return l.locate({ name: '/foo/bar:0      '}).then(addr => {
      t.is(addr.path, '/foo/bar');
      t.is(addr.phase, 0);
    });
  });
});

test('locate throws an error if phase is missing', t => {
  let l = new SweetLoader();

  t.throws(l.locate({ name: '/foo/bar'}));
});


// High-level API

test('compiling a simple file', t => {
  let store = new Map();
  store.set('entry.js', '42');
  return compile('entry.js', store).then(mod => {
    t.is(mod, null);
  });
});

// test('loading a no-dep single var export module', t => {
//   let store = new Map();
//   store.set('entry.js', `export var a = 'a'`);
//
//   return load('entry.js', store).then(mod => {
//     t.deepEqual(mod, {a: 'a'});
//   });
// });
