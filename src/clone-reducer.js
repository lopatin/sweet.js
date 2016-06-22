import TermSpec from './term-spec';

export default class CloneReducer {}

for (let termName of Object.keys(TermSpec.spec)) {
  CloneReducer.prototype[`reduce${termName}`] = function (term, state) {
    return state;
  };
}
