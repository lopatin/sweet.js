import expect from "expect.js";
import test from 'ava';

import { testThrow, expr, stmt, testEval } from "./assertions";

test("should work with references to function expression parameters", t => {
  return testEval(`
output = function foo(x) {
   syntaxrec m = function (ctx) {
       return syntaxQuote\`x\`
   }
   return function (x) {
       return m;
   }(2);
}(1);`, output => t.is(output, 1));
  });

test("should work with references to function declaration parameters", t => {
  return testEval(`
function foo(x) {
   syntaxrec m = function (ctx) {
       return syntaxQuote\`x\`
   }
   function bar(x) {
       return m;
   }
   return bar(2);
};
output = foo(1)`, output => t.is(output, 1));
});

test("should work with introduced var declarations", t => {
  return testEval(`
syntaxrec m = function (ctx) {
return syntaxQuote\`var x = 42;\`
}
output = function foo() {
var x = 100;
m;
return x;
}()`, output => t.is(output, 100));
});


test('should allow duplicate var declarations', t => {
  return testEval(`
    var x = 100;
    var x = 200;
    output = x;
  `, output => t.is(output, 200));
});

test('should throw exception for duplicate let declarations', t => {
  return t.throws(testEval(`
    let x = 100;
    let x = 200`));
});
