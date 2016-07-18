import { parse } from "../src/sweet";
import expect from "expect.js";
import test from 'ava';

import { expr, stmt, testEval } from "./assertions";

test("should handle basic expansion at a statement expression position", t => {
  return testEval(`
syntaxrec m = function(ctx) {
  return #\`200\`;
}
output = m`, output => t.is(output, 200));
});

test("should handle basic expansion with an arrow transformer", t => {
  return testEval(`
syntaxrec m = ctx => #\`200\`
output = m`, output => t.is(output, 200));
});

test("should handle basic expansion at an expression position", t => {
  return testEval(`
syntaxrec m = function (ctx) {
  return #\`200\`;
}
let v = m;
output = v;`, output => t.is(output, 200));
});

test("should handle expansion where an argument is eaten", t => {
  return testEval(`
syntaxrec m = function(ctx) {
  ctx.next();
  return #\`200\`
}
output = m 42`, output => t.is(output, 200));
});

test("should handle expansion that eats an expression", t => {
  return testEval(`
syntaxrec m = function(ctx) {
  let term = ctx.expand('expr')
  return #\`200\`
}
output = m 100 + 200`, output => t.is(output, 200));
});

test('should handle expansion that takes an argument', t => {
  return testEval(`
    syntaxrec m = function(ctx) {
      var x = ctx.next().value;
      return #\`40 + \${x}\`;
    }
    output = m 2;`, output => t.is(output, 42));
});

test('should handle expansion that matches an expression argument', t => {
  return testEval(`
    syntaxrec m = function(ctx) {
      let x = ctx.expand('expr').value;
      return #\`40 + \${x}\`;
    }
    output = m 2;`, output => t.is(output, 42));
});

test('should handle the macro returning an array', t => {
  return testEval(`
    syntax m = function (ctx) {
      let x = ctx.next().value;
      return [x];
    }
    output = m 42;`, output => t.is(output, 42));
});

test('should handle the full macro context api', t => {
  return testEval(`
    syntaxrec def = function(ctx) {
      let id = ctx.next().value;
      ctx.reset();
      id = ctx.next().value;
      let parens = ctx.next().value;
      let body = ctx.next().value;

      let parenCtx = parens.inner();
      let paren_id = parenCtx.next().value;
      parenCtx.next() // =
      let paren_init = parenCtx.expand('expr').value;

      let bodyCtx = body.inner();
      let b = [];
      for (let s of bodyCtx) {
        b.push(s);
      }

      return #\`function \${id} (\${paren_id}) {
        \${paren_id} = \${paren_id} || \${paren_init};
        \${b}
      }\`;
    }

    def foo (x = 10 + 100) { return x; }
    output = foo();
    `, output => t.is(output, 110));
});

test('should handle iterators inside a syntax template', t => {
  return testEval(`
    syntax let = function (ctx) {
      let ident = ctx.next().value;
      ctx.next();
      let init = ctx.expand('expr').value;
      return #\`
        (function (\${ident}) {
          \${ctx}
        }(\${init}))
      \`
    }
    let x = 42;
    output = x;
  `, output => t.is(output, 42));
});

test('should allow macros to be defined with @', t => {
  return testEval(`
    syntax @ = function (ctx) {
      return #\`42\`;
    }
    output = @
  `, output => t.is(output, 42));
});

test('should allow macros to be defined with #', t => {
  return testEval(`
    syntax # = function (ctx) {
      return #\`42\`;
    }
    output = #
  `, output => t.is(output, 42));
});

test('should allow macros to be defined with #', t => {
  return testEval(`
    syntax * = function (ctx) {
      return #\`42\`;
    }
    output = *
  `, output => t.is(output, 42));
});

test('should allow the macro context to be reset', t => {
  return testEval(`
    syntax m = ctx => {
      ctx.expand('expr'); // 42 + 66
      // oops, just wanted one token
      ctx.reset();
      let value = ctx.next().value; // 42
      ctx.next();
      ctx.next();
      return #\`\${value}\`;
    }

    output = m 42 + 66
  `, output => t.is(output, 42));
});

test('should allow the macro context to match on a identifier expression', t => {
  return testEval(`
    syntax m = ctx => {
      let expr = ctx.expand('IdentifierExpression').value;
      return #\`\${expr}\`;
    }
    var foo = 1;
    output = m foo
  `, output => t.is(output, 1))
  .then(() => {
    return testEval(`
    syntax m = ctx => {
      let expr = ctx.expand('IdentifierExpression').value;
      return #\`1\`;
    }
    var foo = 1;
    output = m foo + 1
  `, output => t.is(output, 2));
  });
});

test('should allow the macro context to match on a binary expression', t => {
  return testEval(`
    syntax m = ctx => {
      let expr = ctx.expand('BinaryExpression').value;
      return #\`\${expr}\`;
    }
    output = m 1 + 1 - 1
  `, output => t.is(output, 1));
});

test('should throw an error if the match fails for MacroContext::expand', t => {
  return t.throws(testEval(`
      syntax m = ctx => {
        let expr = ctx.expand('BinaryExpression').value;
        return #\`\${expr}\`;
      }
      output = m foo
    `));
});
