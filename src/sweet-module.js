import * as _ from "ramda";
import * as T from './terms';
import ASTDispatcher from './ast-dispatcher';


export default class SweetModule {
  constructor(items) {
    this.items = items;
  }

  runtimeItems() {
    return this.items.filter(_.complement(isCompiletimeItem));
  }

  compiletimeItems() {
    return this.items.filter(isCompiletimeItem);
  }

  importEntries() {
    return this.items.filter(T.isImportDeclaration);
  }

  exportEntries() {
    return this.items.filter(T.isExportDeclaration);
  }

  codegen() {
    // must filter out all compiletime code
    // new RuntimeReducer(this.items)
  }
}
