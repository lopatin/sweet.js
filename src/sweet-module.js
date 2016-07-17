import * as _ from "ramda";
import Term, * as T from './terms';
import ASTDispatcher from './ast-dispatcher';
import codegen from '../src/codegen';
import { List } from 'immutable';


export default class SweetModule {
  constructor(items) {
    this.items = items;
  }

  runtimeItems() {
    return this.items.filter(_.complement(T.isCompiletimeStatement));
  }

  compiletimeItems() {
    return this.items.filter(T.isCompiletimeStatement);
  }

  importEntries() {
    return this.items.filter(T.isImportDeclaration);
  }

  exportEntries() {
    return this.items.filter(T.isExportDeclaration);
  }

  codegen() {
    return codegen(new Term('Module', {
      items: this.runtimeItems(),
      directives: List()
    })).code;
  }
}
