import * as _ from "ramda";
import Term, * as T from './terms';
import ASTDispatcher from './ast-dispatcher';
import codegen from './codegen';
import { List } from 'immutable';
import reduce from './reduce';
import RuntimeReducer from './runtime-reducer';


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
    let ast = reduce(new RuntimeReducer(), new Term('Module', {
      items: this.items, directives: List()
    }));
    return codegen(ast).code;
  }
}
