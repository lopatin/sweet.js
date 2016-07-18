import { testEval } from './assertions';
import test from 'ava';

test('should handle interpoations for normal tokens', t => {
  return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
   output = function f() {
     m 1;
   }()`, output => t.is(output, 1)).then(() => {
    return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
     output = function f() {
       m 'a';
     }()`, output => t.is(output, 'a'));
   }).then(() => {
    return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
     output = function f() {
       m false;
     }()`, output => t.is(output, false));
   });
});

test('should handle interpoations for delimiter tokens', t => {
  return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
   output = function f() {
     m (1);
   }()`, output => t.is(output, 1)).then(() => {
    return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
     output = function f() {
       m [
         1
       ];
     }()`, output => t.deepEqual(output, [1]));
   }).then(() => {
     return testEval(`syntax m = ctx => #\`return \${ctx.next().value}\`;
     output = function f() {
       m {
         a: 1
       };
     }()`, output => t.deepEqual(output, {a: 1}));
   });
});

// test('should handle interpoations for terms', t => {
//   return testEval(`syntax m = ctx => #\`return \${ctx.next('expr').value}\`;
//    output = function f() {
//      m 1
//    }()`, output => t.is(output, 1));
// });
