// @flow
import Term, * as S from 'sweet-spec';
import { List } from 'immutable';
import type Syntax from './syntax.js';

export default class extends Term.CloneReducer {
  phase: number;

  constructor(phase: number) {
    super();
    this.phase = phase;
  }

  reduceModule(t: Term, s: { directives: List<any>, items: List<any> }) {
    return new S.Module({
      directives: s.directives.toArray(),
      items: s.items.toArray()
    });
  }

  reduceIdentifierExpression(t: Term, s: { name: Syntax }) {
    return new S.IdentifierExpression({
      name: s.name.resolve(this.phase)
    });
  }

  reduceStaticPropertyName(t: Term, s: { value: Syntax }) {
    return new S.StaticPropertyName({
      value: s.value.val().toString()
    });
  }

  reduceBindingIdentifier(t: Term, s: { name: Syntax }) {
    return new S.BindingIdentifier({
      name: s.name.resolve(this.phase)
    });
  }

  reduceStaticMemberExpression(t: Term, s: { object: any, property: Syntax }) {
    return new S.StaticMemberExpression({
      object: s.object,
      property: s.property.val()
    });
  }
}
