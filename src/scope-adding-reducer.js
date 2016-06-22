// @flow
import Term, * as S from 'sweet-spec';
import type Syntax from './syntax.js';

export default class extends Term.CloneReducer {
  scopes: any;
  bindings: any;
  phase: any;

  constructor(scope: any, bindings: any, phase: any) {
    super();
    this.scope = scope;
    this.bindings = bindings;
    this.phase = phase;
  }

  reduceBindingIdentifier(t: Term, s: { name: Syntax }) {
    return new S.BindingIdentifier({
      name: s.name.addScope(this.scope, this.bindings, this.phase)
    });
  }
}
