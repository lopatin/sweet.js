import { List } from 'immutable';
import Tokenizer from './shift-tokenizer';

export default class Reader {
  constructor(source, readtable) {
    this.lexer = new Tokenizer(source);
    this.readtable = readtable;
  }

  read() {
    return List();
  }
}
