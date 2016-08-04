import Reader from "../src/reader";
import test from 'ava';

test("should read a numeric", t => {
  let reader = new Reader("42");
  let r = reader.read();

  t.is(r.get(0).val(), 42);
  // t.true(r.get(0).isNumericLiteral());
});
