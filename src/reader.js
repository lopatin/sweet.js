import { List } from 'immutable';
import Tokenizer from './shift-tokenizer';
import Syntax from "./syntax";

export default class Reader {
  constructor(source, readtable) {
    this.lexer = new Tokenizer(source);
    this.readtable = readtable;
  }

  read() {
    let result = [];
    this.lexer.lex();

    while (!this.lexer.eof()) {
      result.push(new Syntax(this.lexer.lex()));
    }

    return List(result);
  }
}
