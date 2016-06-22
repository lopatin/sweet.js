// @flow
import Term, * as S from 'sweet-spec';
import type Syntax from './syntax.js';

export default class extends Term.CloneReducer {
  scopes: any;
  phase: any;

  constructor(scope: any, phase: any) {
    super();
    this.scope = scope;
    this.phase = phase;
  }

  reduceBindingIdentifier(t: Term, s: { name: Syntax }) {
    return new S.BindingIdentifier({
      name: s.name.removeScope(this.scope, this.phase)
    });
  }
}
