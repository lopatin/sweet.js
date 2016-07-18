import CloneReducer from './clone-reducer';
import Term, * as T from './terms';
import * as _ from 'ramda';


const isNotCompiletimeStatement = _.complement(T.isCompiletimeStatement);

export default class RuntimeReducer extends CloneReducer {
  reduceModule(term, state) {
    let items = state.items.filter(isNotCompiletimeStatement);
    return new Term('Module', {
      items,
      directives: term.directives
    });
  }

  reduceFunctionBody(term, state) {
    let statements = state.statements.filter(isNotCompiletimeStatement);
    return new Term('FunctionBody', {
      statements, directives: state.directives
    });
  }

  reduceBlock(term, state) {
    let statements = state.statements.filter(isNotCompiletimeStatement);
    return new Term('Block', {
      statements
    });
  }
}
