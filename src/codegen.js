import reduce from "shift-reducer";
import ParseReducer from "./parse-reducer";
import shiftCodegen, { FormattedCodeGen } from "shift-codegen";
import Term from "./terms";
import { List } from 'immutable';

export default function codegen(mod) {
  let ast = reduce(new ParseReducer({phase: 0}), new Term('Module', {
    items: mod.items,
    directives: List()
  }));
  return {
    code: shiftCodegen(ast, new FormattedCodeGen())
  };
}
