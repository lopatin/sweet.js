'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyntaxOrTermWrapper = undefined;
exports.unwrap = unwrap;

var _errors = require('./errors');

var _immutable = require('immutable');

var _enforester = require('./enforester');

var _syntax = require('./syntax');

var _ramda = require('ramda');

var _ = _interopRequireWildcard(_ramda);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const symWrap = Symbol('wrapper');
const privateData = new WeakMap();

const getVal = t => {
  if (t.match("delimiter")) {
    return null;
  }
  if (typeof t.val === 'function') {
    return t.val();
  }
  return null;
};

class SyntaxOrTermWrapper {
  constructor(s) {
    let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    this[symWrap] = s;
    this.context = context;
  }

  from(type, value) {
    let stx = this[symWrap];
    if (typeof stx.from === 'function') {
      return stx.from(type, value);
    }
  }
  fromNull() {
    return this.from("null", null);
  }

  fromNumber(value) {
    return this.from('number', value);
  }

  fromString(value) {
    return this.from("string", value);
  }

  fromPunctuator(value) {
    return this.from("punctuator", value);
  }

  fromKeyword(value) {
    return this.from("keyword", value);
  }

  fromIdentifier(value) {
    return this.from("identifier", value);
  }

  fromRegularExpression(value) {
    return this.from("regularExpression", value);
  }

  fromBraces(inner) {
    return this.from("braces", inner);
  }

  fromBrackets(inner) {
    return this.from("brackets", inner);
  }

  fromParens(inner) {
    return this.from("parens", inner);
  }

  match(type, value) {
    let stx = this[symWrap];
    if (typeof stx.match === 'function') {
      return stx.match(type, value);
    }
  }

  isIdentifier(value) {
    return this.match("identifier", value);
  }

  isAssign(value) {
    return this.match("assign", value);
  }

  isBooleanLiteral(value) {
    return this.match("boolean", value);
  }

  isKeyword(value) {
    return this.match("keyword", value);
  }

  isNullLiteral(value) {
    return this.match("null", value);
  }

  isNumericLiteral(value) {
    return this.match("number", value);
  }

  isPunctuator(value) {
    return this.match("punctuator", value);
  }

  isStringLiteral(value) {
    return this.match("string", value);
  }

  isRegularExpression(value) {
    return this.match("regularExpression", value);
  }

  isTemplate(value) {
    return this.match("template", value);
  }

  isDelimiter(value) {
    return this.match("delimiter", value);
  }

  isParens(value) {
    return this.match("parens", value);
  }

  isBraces(value) {
    return this.match("braces", value);
  }

  isBrackets(value) {
    return this.match("brackets", value);
  }

  isSyntaxTemplate(value) {
    return this.match("syntaxTemplate", value);
  }

  isEOF(value) {
    return this.match("eof", value);
  }

  lineNumber() {
    return this[symWrap].lineNumber();
  }

  val() {
    return getVal(this[symWrap]);
  }

  inner() {
    let stx = this[symWrap];
    if (!stx.match("delimiter")) {
      throw new Error('Can only get inner syntax on a delimiter');
    }

    let enf = new _enforester.Enforester(stx.inner(), (0, _immutable.List)(), this.context);
    return new MacroContext(enf, 'inner', this.context);
  }
}

exports.SyntaxOrTermWrapper = SyntaxOrTermWrapper;
function unwrap(x) {
  if (x instanceof SyntaxOrTermWrapper) {
    return x[symWrap];
  }
  return x;
}

function cloneEnforester(enf) {
  const rest = enf.rest,
        prev = enf.prev,
        context = enf.context;

  return new _enforester.Enforester(rest, prev, context);
}

function Marker() {}

/*
ctx :: {
  of: (Syntax) -> ctx
  next: (String) -> Syntax or Term
}
*/
class MacroContext {

  constructor(enf, name, context, useScope, introducedScope) {
    const startMarker = new Marker();
    const startEnf = cloneEnforester(enf);
    const priv = {
      name: name,
      context: context,
      enf: startEnf,
      startMarker: startMarker,
      markers: new Map([[startMarker, enf]])
    };

    if (useScope && introducedScope) {
      priv.noScopes = false;
      priv.useScope = useScope;
      priv.introducedScope = introducedScope;
    } else {
      priv.noScopes = true;
    }
    privateData.set(this, priv);
    this.reset(); // set current enforester

    this[Symbol.iterator] = () => this;
  }

  name() {
    var _privateData$get = privateData.get(this);

    const name = _privateData$get.name,
          context = _privateData$get.context;

    return new SyntaxOrTermWrapper(name, context);
  }

  expand(type) {
    var _privateData$get2 = privateData.get(this);

    const enf = _privateData$get2.enf,
          context = _privateData$get2.context;

    if (enf.rest.size === 0) {
      return {
        done: true,
        value: null
      };
    }
    enf.expandMacro();
    let originalRest = enf.rest;
    let value;
    switch (type) {
      case 'AssignmentExpression':
      case 'expr':
        value = enf.enforestExpressionLoop();
        break;
      case 'Expression':
        value = enf.enforestExpression();
        break;
      case 'Statement':
      case 'stmt':
        value = enf.enforestStatement();
        break;
      case 'BlockStatement':
      case 'WhileStatement':
      case 'IfStatement':
      case 'ForStatement':
      case 'SwitchStatement':
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'DebuggerStatement':
      case 'WithStatement':
      case 'TryStatement':
      case 'ThrowStatement':
      case 'ClassDeclaration':
      case 'FunctionDeclaration':
      case 'LabeledStatement':
      case 'VariableDeclarationStatement':
      case 'ReturnStatement':
      case 'ExpressionStatement':
        value = enf.enforestStatement();
        (0, _errors.expect)(_.whereEq({ type: type }, value), `Expecting a ${ type }`, value, originalRest);
        break;
      case 'YieldExpression':
        value = enf.enforestYieldExpression();
        break;
      case 'ClassExpression':
        value = enf.enforestClass({ isExpr: true });
        break;
      case 'ArrowExpression':
        value = enf.enforestArrowExpression();
        break;
      case 'NewExpression':
        value = enf.enforestNewExpression();
        break;
      case 'ThisExpression':
      case 'FunctionExpression':
      case 'IdentifierExpression':
      case 'LiteralNumericExpression':
      case 'LiteralInfinityExpression':
      case 'LiteralStringExpression':
      case 'TemplateExpression':
      case 'LiteralBooleanExpression':
      case 'LiteralNullExpression':
      case 'LiteralRegExpExpression':
      case 'ObjectExpression':
      case 'ArrayExpression':
        value = enf.enforestPrimaryExpression();
        break;
      case 'UnaryExpression':
      case 'UpdateExpression':
      case 'BinaryExpression':
      case 'StaticMemberExpression':
      case 'ComputedMemberExpression':
      case 'CompoundAssignmentExpression':
      case 'ConditionalExpression':
        value = enf.enforestExpressionLoop();
        (0, _errors.expect)(_.whereEq({ type: type }, value), `Expecting a ${ type }`, value, originalRest);
        break;
      default:
        throw new Error('Unknown term type: ' + type);
    }
    return {
      done: false,
      value: new SyntaxOrTermWrapper(value, context)
    };
  }

  _rest(enf) {
    const priv = privateData.get(this);
    if (priv.markers.get(priv.startMarker) === enf) {
      return priv.enf.rest;
    }
    throw Error("Unauthorized access!");
  }

  reset(marker) {
    const priv = privateData.get(this);
    let enf;
    if (marker == null) {
      // go to the beginning
      enf = priv.markers.get(priv.startMarker);
    } else if (marker && marker instanceof Marker) {
      // marker could be from another context
      if (priv.markers.has(marker)) {
        enf = priv.markers.get(marker);
      } else {
        throw new Error('marker must originate from this context');
      }
    } else {
      throw new Error('marker must be an instance of Marker');
    }
    priv.enf = cloneEnforester(enf);
  }

  mark() {
    const priv = privateData.get(this);
    let marker;

    // the idea here is that marking at the beginning shouldn't happen more than once.
    // We can reuse startMarker.
    if (priv.enf.rest === priv.markers.get(priv.startMarker).rest) {
      marker = priv.startMarker;
    } else if (priv.enf.rest.isEmpty()) {
      // same reason as above
      if (!priv.endMarker) priv.endMarker = new Marker();
      marker = priv.endMarker;
    } else {
      //TODO(optimization/dubious): check that there isn't already a marker for this index?
      marker = new Marker();
    }
    if (!priv.markers.has(marker)) {
      priv.markers.set(marker, cloneEnforester(priv.enf));
    }
    return marker;
  }

  next() {
    var _privateData$get3 = privateData.get(this);

    const enf = _privateData$get3.enf,
          noScopes = _privateData$get3.noScopes,
          useScope = _privateData$get3.useScope,
          introducedScope = _privateData$get3.introducedScope,
          context = _privateData$get3.context;

    if (enf.rest.size === 0) {
      return {
        done: true,
        value: null
      };
    }
    let value = enf.advance();
    if (!noScopes) {
      value = value.addScope(useScope, context.bindings, _syntax.ALL_PHASES).addScope(introducedScope, context.bindings, _syntax.ALL_PHASES, { flip: true });
    }
    return {
      done: false,
      value: new SyntaxOrTermWrapper(value, context)
    };
  }
}
exports.default = MacroContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWNyby1jb250ZXh0LmpzIl0sIm5hbWVzIjpbInVud3JhcCIsIl8iLCJzeW1XcmFwIiwiU3ltYm9sIiwicHJpdmF0ZURhdGEiLCJXZWFrTWFwIiwiZ2V0VmFsIiwidCIsIm1hdGNoIiwidmFsIiwiU3ludGF4T3JUZXJtV3JhcHBlciIsImNvbnN0cnVjdG9yIiwicyIsImNvbnRleHQiLCJmcm9tIiwidHlwZSIsInZhbHVlIiwic3R4IiwiZnJvbU51bGwiLCJmcm9tTnVtYmVyIiwiZnJvbVN0cmluZyIsImZyb21QdW5jdHVhdG9yIiwiZnJvbUtleXdvcmQiLCJmcm9tSWRlbnRpZmllciIsImZyb21SZWd1bGFyRXhwcmVzc2lvbiIsImZyb21CcmFjZXMiLCJpbm5lciIsImZyb21CcmFja2V0cyIsImZyb21QYXJlbnMiLCJpc0lkZW50aWZpZXIiLCJpc0Fzc2lnbiIsImlzQm9vbGVhbkxpdGVyYWwiLCJpc0tleXdvcmQiLCJpc051bGxMaXRlcmFsIiwiaXNOdW1lcmljTGl0ZXJhbCIsImlzUHVuY3R1YXRvciIsImlzU3RyaW5nTGl0ZXJhbCIsImlzUmVndWxhckV4cHJlc3Npb24iLCJpc1RlbXBsYXRlIiwiaXNEZWxpbWl0ZXIiLCJpc1BhcmVucyIsImlzQnJhY2VzIiwiaXNCcmFja2V0cyIsImlzU3ludGF4VGVtcGxhdGUiLCJpc0VPRiIsImxpbmVOdW1iZXIiLCJFcnJvciIsImVuZiIsIk1hY3JvQ29udGV4dCIsIngiLCJjbG9uZUVuZm9yZXN0ZXIiLCJyZXN0IiwicHJldiIsIk1hcmtlciIsIm5hbWUiLCJ1c2VTY29wZSIsImludHJvZHVjZWRTY29wZSIsInN0YXJ0TWFya2VyIiwic3RhcnRFbmYiLCJwcml2IiwibWFya2VycyIsIk1hcCIsIm5vU2NvcGVzIiwic2V0IiwicmVzZXQiLCJpdGVyYXRvciIsImdldCIsImV4cGFuZCIsInNpemUiLCJkb25lIiwiZXhwYW5kTWFjcm8iLCJvcmlnaW5hbFJlc3QiLCJlbmZvcmVzdEV4cHJlc3Npb25Mb29wIiwiZW5mb3Jlc3RFeHByZXNzaW9uIiwiZW5mb3Jlc3RTdGF0ZW1lbnQiLCJ3aGVyZUVxIiwiZW5mb3Jlc3RZaWVsZEV4cHJlc3Npb24iLCJlbmZvcmVzdENsYXNzIiwiaXNFeHByIiwiZW5mb3Jlc3RBcnJvd0V4cHJlc3Npb24iLCJlbmZvcmVzdE5ld0V4cHJlc3Npb24iLCJlbmZvcmVzdFByaW1hcnlFeHByZXNzaW9uIiwiX3Jlc3QiLCJtYXJrZXIiLCJoYXMiLCJtYXJrIiwiaXNFbXB0eSIsImVuZE1hcmtlciIsIm5leHQiLCJhZHZhbmNlIiwiYWRkU2NvcGUiLCJiaW5kaW5ncyIsImZsaXAiXSwibWFwcGluZ3MiOiI7Ozs7OztRQWlLZ0JBLE0sR0FBQUEsTTs7QUFqS2hCOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQUFZQyxDOzs7O0FBRVosTUFBTUMsVUFBVUMsT0FBTyxTQUFQLENBQWhCO0FBQ0EsTUFBTUMsY0FBYyxJQUFJQyxPQUFKLEVBQXBCOztBQUVBLE1BQU1DLFNBQVNDLEtBQUs7QUFDbEIsTUFBSUEsRUFBRUMsS0FBRixDQUFRLFdBQVIsQ0FBSixFQUEwQjtBQUN4QixXQUFPLElBQVA7QUFDRDtBQUNELE1BQUksT0FBT0QsRUFBRUUsR0FBVCxLQUFpQixVQUFyQixFQUFpQztBQUMvQixXQUFPRixFQUFFRSxHQUFGLEVBQVA7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNELENBUkQ7O0FBVU8sTUFBTUMsbUJBQU4sQ0FBMEI7QUFDL0JDLGNBQVlDLENBQVosRUFBNkI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7O0FBQzNCLFNBQUtYLE9BQUwsSUFBZ0JVLENBQWhCO0FBQ0EsU0FBS0MsT0FBTCxHQUFlQSxPQUFmO0FBQ0Q7O0FBRURDLE9BQUtDLElBQUwsRUFBV0MsS0FBWCxFQUFrQjtBQUNoQixRQUFJQyxNQUFNLEtBQUtmLE9BQUwsQ0FBVjtBQUNBLFFBQUksT0FBT2UsSUFBSUgsSUFBWCxLQUFvQixVQUF4QixFQUFvQztBQUNsQyxhQUFPRyxJQUFJSCxJQUFKLENB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NEJDLGVBRDVCLHFCQUM0QkEsZUFENUI7QUFBQSxVQUM2QzNDLE9BRDdDLHFCQUM2Q0EsT0FEN0M7O0FBRUwsUUFBSWtDLElBQUlJLElBQUosQ0FBU2lCLElBQVQsS0FBa0IsQ0FBdEIsRUFBeUI7QUFDdkIsYUFBTztBQUNMQyxjQUFNLElBREQ7QUFFTHJELGVBQU87QUFGRixPQUFQO0FBSUQ7QUFDRCxRQUFJQSxRQUFRK0IsSUFBSTBDLE9BQUosRUFBWjtBQUNBLFFBQUksQ0FBQzNCLFFBQUwsRUFBZTtBQUNiOUMsY0FBUUEsTUFDTDBFLFFBREssQ0FDSW5DLFFBREosRUFDYzFDLFFBQVE4RSxRQUR0QixzQkFFTEQsUUFGSyxDQUVJbEMsZUFGSixFQUVxQjNDLFFBQVE4RSxRQUY3QixzQkFFbUQsRUFBRUMsTUFBTSxJQUFSLEVBRm5ELENBQVI7QUFHRDtBQUNELFdBQU87QUFDTHZCLFlBQU0sS0FERDtBQUVMckQsYUFBTyxJQUFJTixtQkFBSixDQUF3Qk0sS0FBeEIsRUFBK0JILE9BQS9CO0FBRkYsS0FBUDtBQUlEO0FBMUwrQjtrQkFBYm1DLFkiLCJmaWxlIjoibWFjcm8tY29udGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IExpc3QgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IHsgRW5mb3Jlc3RlciB9IGZyb20gJy4vZW5mb3Jlc3Rlcic7XG5pbXBvcnQgeyBBTExfUEhBU0VTIH0gZnJvbSAnLi9zeW50YXgnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdyYW1kYSc7XG5cbmNvbnN0IHN5bVdyYXAgPSBTeW1ib2woJ3dyYXBwZXInKTtcbmNvbnN0IHByaXZhdGVEYXRhID0gbmV3IFdlYWtNYXAoKTtcblxuY29uc3QgZ2V0VmFsID0gdCA9PiB7XG4gIGlmICh0Lm1hdGNoKFwiZGVsaW1pdGVyXCIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHR5cGVvZiB0LnZhbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB0LnZhbCgpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuZXhwb3J0IGNsYXNzIFN5bnRheE9yVGVybVdyYXBwZXIge1xuICBjb25zdHJ1Y3RvcihzLCBjb250ZXh0ID0ge30pIHtcbiAgICB0aGlzW3N5bVdyYXBdID0gcztcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG5cbiAgZnJvbSh0eXBlLCB2YWx1ZSkge1xuICAgIGxldCBzdHggPSB0aGlzW3N5bVdyYXBdO1xuICAgIGlmICh0eXBlb2Ygc3R4LmZyb20gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzdHguZnJvbSh0eXBlLCB2YWx1ZSk7XG4gICAgfVxuICB9XG4gIGZyb21OdWxsKCkge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJudWxsXCIsIG51bGwpO1xuICB9XG5cbiAgZnJvbU51bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmZyb20oJ251bWJlcicsIHZhbHVlKTtcbiAgfVxuXG4gIGZyb21TdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKFwic3RyaW5nXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGZyb21QdW5jdHVhdG9yKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShcInB1bmN0dWF0b3JcIiwgdmFsdWUpO1xuICB9XG5cbiAgZnJvbUtleXdvcmQodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKFwia2V5d29yZFwiLCB2YWx1ZSk7XG4gIH1cblxuICBmcm9tSWRlbnRpZmllcih2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJpZGVudGlmaWVyXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGZyb21SZWd1bGFyRXhwcmVzc2lvbih2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJyZWd1bGFyRXhwcmVzc2lvblwiLCB2YWx1ZSk7XG4gIH1cblxuICBmcm9tQnJhY2VzKGlubmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShcImJyYWNlc1wiLCBpbm5lcik7XG4gIH1cblxuICBmcm9tQnJhY2tldHMoaW5uZXIpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKFwiYnJhY2tldHNcIiwgaW5uZXIpO1xuICB9XG5cbiAgZnJvbVBhcmVucyhpbm5lcikge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJwYXJlbnNcIiwgaW5uZXIpO1xuICB9XG5cbiAgbWF0Y2godHlwZSwgdmFsdWUpIHtcbiAgICBsZXQgc3R4ID0gdGhpc1tzeW1XcmFwXTtcbiAgICBpZiAodHlwZW9mIHN0eC5tYXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHN0eC5tYXRjaCh0eXBlLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaXNJZGVudGlmaWVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJpZGVudGlmaWVyXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzQXNzaWduKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJhc3NpZ25cIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNCb29sZWFuTGl0ZXJhbCh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwiYm9vbGVhblwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc0tleXdvcmQodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcImtleXdvcmRcIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNOdWxsTGl0ZXJhbCh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwibnVsbFwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc051bWVyaWNMaXRlcmFsKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJudW1iZXJcIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNQdW5jdHVhdG9yKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJwdW5jdHVhdG9yXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzU3RyaW5nTGl0ZXJhbCh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwic3RyaW5nXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzUmVndWxhckV4cHJlc3Npb24odmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcInJlZ3VsYXJFeHByZXNzaW9uXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzVGVtcGxhdGUodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcInRlbXBsYXRlXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzRGVsaW1pdGVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJkZWxpbWl0ZXJcIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNQYXJlbnModmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcInBhcmVuc1wiLCB2YWx1ZSk7XG4gIH1cblxuICBpc0JyYWNlcyh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwiYnJhY2VzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzQnJhY2tldHModmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcImJyYWNrZXRzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzU3ludGF4VGVtcGxhdGUodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcInN5bnRheFRlbXBsYXRlXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzRU9GKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJlb2ZcIiwgdmFsdWUpO1xuICB9XG5cbiAgbGluZU51bWJlcigpIHtcbiAgICByZXR1cm4gdGhpc1tzeW1XcmFwXS5saW5lTnVtYmVyKCk7XG4gIH1cblxuICB2YWwoKSB7XG4gICAgcmV0dXJuIGdldFZhbCh0aGlzW3N5bVdyYXBdKTtcbiAgfVxuXG4gIGlubmVyKCkge1xuICAgIGxldCBzdHggPSB0aGlzW3N5bVdyYXBdO1xuICAgIGlmICghc3R4Lm1hdGNoKFwiZGVsaW1pdGVyXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IGdldCBpbm5lciBzeW50YXggb24gYSBkZWxpbWl0ZXInKTtcbiAgICB9XG5cbiAgICBsZXQgZW5mID0gbmV3IEVuZm9yZXN0ZXIoc3R4LmlubmVyKCksIExpc3QoKSwgdGhpcy5jb250ZXh0KTtcbiAgICByZXR1cm4gbmV3IE1hY3JvQ29udGV4dChlbmYsICdpbm5lcicsIHRoaXMuY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcCh4KSB7XG4gIGlmICh4IGluc3RhbmNlb2YgU3ludGF4T3JUZXJtV3JhcHBlcikge1xuICAgIHJldHVybiB4W3N5bVdyYXBdO1xuICB9XG4gIHJldHVybiB4O1xufVxuXG5mdW5jdGlvbiBjbG9uZUVuZm9yZXN0ZXIoZW5mKSB7XG4gIGNvbnN0IHsgcmVzdCwgcHJldiwgY29udGV4dCB9ID0gZW5mO1xuICByZXR1cm4gbmV3IEVuZm9yZXN0ZXIocmVzdCwgcHJldiwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIE1hcmtlciAoKSB7fVxuXG4vKlxuY3R4IDo6IHtcbiAgb2Y6IChTeW50YXgpIC0+IGN0eFxuICBuZXh0OiAoU3RyaW5nKSAtPiBTeW50YXggb3IgVGVybVxufVxuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hY3JvQ29udGV4dCB7XG5cbiAgY29uc3RydWN0b3IoZW5mLCBuYW1lLCBjb250ZXh0LCB1c2VTY29wZSwgaW50cm9kdWNlZFNjb3BlKSB7XG4gICAgY29uc3Qgc3RhcnRNYXJrZXIgPSBuZXcgTWFya2VyKCk7XG4gICAgY29uc3Qgc3RhcnRFbmYgPSBjbG9uZUVuZm9yZXN0ZXIoZW5mKTtcbiAgICBjb25zdCBwcml2ID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvbnRleHQsXG4gICAgICBlbmY6IHN0YXJ0RW5mLFxuICAgICAgc3RhcnRNYXJrZXIsXG4gICAgICBtYXJrZXJzOiBuZXcgTWFwKFtbc3RhcnRNYXJrZXIsIGVuZl1dKSxcbiAgICB9O1xuXG4gICAgaWYgKHVzZVNjb3BlICYmIGludHJvZHVjZWRTY29wZSkge1xuICAgICAgcHJpdi5ub1Njb3BlcyA9IGZhbHNlO1xuICAgICAgcHJpdi51c2VTY29wZSA9IHVzZVNjb3BlO1xuICAgICAgcHJpdi5pbnRyb2R1Y2VkU2NvcGUgPSBpbnRyb2R1Y2VkU2NvcGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByaXYubm9TY29wZXMgPSB0cnVlO1xuICAgIH1cbiAgICBwcml2YXRlRGF0YS5zZXQodGhpcywgcHJpdik7XG4gICAgdGhpcy5yZXNldCgpOyAvLyBzZXQgY3VycmVudCBlbmZvcmVzdGVyXG5cbiAgICB0aGlzW1N5bWJvbC5pdGVyYXRvcl0gPSAoKSA9PiB0aGlzO1xuICB9XG5cbiAgbmFtZSgpIHtcbiAgICBjb25zdCB7IG5hbWUsIGNvbnRleHQgfSA9IHByaXZhdGVEYXRhLmdldCh0aGlzKTtcbiAgICByZXR1cm4gbmV3IFN5bnRheE9yVGVybVdyYXBwZXIobmFtZSwgY29udGV4dCk7XG4gIH1cblxuICBleHBhbmQodHlwZSkge1xuICAgIGNvbnN0IHsgZW5mLCBjb250ZXh0IH0gPSBwcml2YXRlRGF0YS5nZXQodGhpcyk7XG4gICAgaWYgKGVuZi5yZXN0LnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRvbmU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBudWxsXG4gICAgICB9O1xuICAgIH1cbiAgICBlbmYuZXhwYW5kTWFjcm8oKTtcbiAgICBsZXQgb3JpZ2luYWxSZXN0ID0gZW5mLnJlc3Q7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICBjYXNlICdBc3NpZ25tZW50RXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdleHByJzpcbiAgICAgICAgdmFsdWUgPSBlbmYuZW5mb3Jlc3RFeHByZXNzaW9uTG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0V4cHJlc3Npb24nOlxuICAgICAgICB2YWx1ZSA9IGVuZi5lbmZvcmVzdEV4cHJlc3Npb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnc3RtdCc6XG4gICAgICAgIHZhbHVlID0gZW5mLmVuZm9yZXN0U3RhdGVtZW50KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnQmxvY2tTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnV2hpbGVTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnSWZTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnRm9yU3RhdGVtZW50JzpcbiAgICAgIGNhc2UgJ1N3aXRjaFN0YXRlbWVudCc6XG4gICAgICBjYXNlICdCcmVha1N0YXRlbWVudCc6XG4gICAgICBjYXNlICdDb250aW51ZVN0YXRlbWVudCc6XG4gICAgICBjYXNlICdEZWJ1Z2dlclN0YXRlbWVudCc6XG4gICAgICBjYXNlICdXaXRoU3RhdGVtZW50JzpcbiAgICAgIGNhc2UgJ1RyeVN0YXRlbWVudCc6XG4gICAgICBjYXNlICdUaHJvd1N0YXRlbWVudCc6XG4gICAgICBjYXNlICdDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgIGNhc2UgJ0Z1bmN0aW9uRGVjbGFyYXRpb24nOlxuICAgICAgY2FzZSAnTGFiZWxlZFN0YXRlbWVudCc6XG4gICAgICBjYXNlICdWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50JzpcbiAgICAgIGNhc2UgJ1JldHVyblN0YXRlbWVudCc6XG4gICAgICBjYXNlICdFeHByZXNzaW9uU3RhdGVtZW50JzpcbiAgICAgICAgdmFsdWUgPSBlbmYuZW5mb3Jlc3RTdGF0ZW1lbnQoKTtcbiAgICAgICAgZXhwZWN0KF8ud2hlcmVFcSh7dHlwZX0sIHZhbHVlKSwgYEV4cGVjdGluZyBhICR7dHlwZX1gLCB2YWx1ZSwgb3JpZ2luYWxSZXN0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdZaWVsZEV4cHJlc3Npb24nOlxuICAgICAgICB2YWx1ZSA9IGVuZi5lbmZvcmVzdFlpZWxkRXhwcmVzc2lvbigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0NsYXNzRXhwcmVzc2lvbic6XG4gICAgICAgIHZhbHVlID0gZW5mLmVuZm9yZXN0Q2xhc3Moe2lzRXhwcjogdHJ1ZX0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0Fycm93RXhwcmVzc2lvbic6XG4gICAgICAgIHZhbHVlID0gZW5mLmVuZm9yZXN0QXJyb3dFeHByZXNzaW9uKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTmV3RXhwcmVzc2lvbic6XG4gICAgICAgIHZhbHVlID0gZW5mLmVuZm9yZXN0TmV3RXhwcmVzc2lvbigpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1RoaXNFeHByZXNzaW9uJzpcbiAgICAgIGNhc2UgJ0Z1bmN0aW9uRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdJZGVudGlmaWVyRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdUZW1wbGF0ZUV4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uJzpcbiAgICAgIGNhc2UgJ0xpdGVyYWxOdWxsRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdPYmplY3RFeHByZXNzaW9uJzpcbiAgICAgIGNhc2UgJ0FycmF5RXhwcmVzc2lvbic6XG4gICAgICAgIHZhbHVlID0gZW5mLmVuZm9yZXN0UHJpbWFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdVbmFyeUV4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnVXBkYXRlRXhwcmVzc2lvbic6XG4gICAgICBjYXNlICdCaW5hcnlFeHByZXNzaW9uJzpcbiAgICAgIGNhc2UgJ1N0YXRpY01lbWJlckV4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uJzpcbiAgICAgIGNhc2UgJ0NvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnQ29uZGl0aW9uYWxFeHByZXNzaW9uJzpcbiAgICAgICAgdmFsdWUgPSBlbmYuZW5mb3Jlc3RFeHByZXNzaW9uTG9vcCgpO1xuICAgICAgICBleHBlY3QoXy53aGVyZUVxKHt0eXBlfSwgdmFsdWUpLCBgRXhwZWN0aW5nIGEgJHt0eXBlfWAsIHZhbHVlLCBvcmlnaW5hbFJlc3QpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biB0ZXJtIHR5cGU6ICcgKyB0eXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRvbmU6IGZhbHNlLFxuICAgICAgdmFsdWU6IG5ldyBTeW50YXhPclRlcm1XcmFwcGVyKHZhbHVlLCBjb250ZXh0KVxuICAgIH07XG4gIH1cblxuICBfcmVzdChlbmYpIHtcbiAgICBjb25zdCBwcml2ID0gcHJpdmF0ZURhdGEuZ2V0KHRoaXMpO1xuICAgIGlmIChwcml2Lm1hcmtlcnMuZ2V0KHByaXYuc3RhcnRNYXJrZXIpID09PSBlbmYpIHtcbiAgICAgIHJldHVybiBwcml2LmVuZi5yZXN0O1xuICAgIH1cbiAgICB0aHJvdyBFcnJvcihcIlVuYXV0aG9yaXplZCBhY2Nlc3MhXCIpO1xuICB9XG5cbiAgcmVzZXQobWFya2VyKSB7XG4gICAgY29uc3QgcHJpdiA9IHByaXZhdGVEYXRhLmdldCh0aGlzKTtcbiAgICBsZXQgZW5mO1xuICAgIGlmIChtYXJrZXIgPT0gbnVsbCkge1xuICAgICAgLy8gZ28gdG8gdGhlIGJlZ2lubmluZ1xuICAgICAgZW5mID0gcHJpdi5tYXJrZXJzLmdldChwcml2LnN0YXJ0TWFya2VyKTtcbiAgICB9IGVsc2UgaWYgKG1hcmtlciAmJiBtYXJrZXIgaW5zdGFuY2VvZiBNYXJrZXIpIHtcbiAgICAgIC8vIG1hcmtlciBjb3VsZCBiZSBmcm9tIGFub3RoZXIgY29udGV4dFxuICAgICAgaWYgKHByaXYubWFya2Vycy5oYXMobWFya2VyKSkge1xuICAgICAgICBlbmYgPSBwcml2Lm1hcmtlcnMuZ2V0KG1hcmtlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcmtlciBtdXN0IG9yaWdpbmF0ZSBmcm9tIHRoaXMgY29udGV4dCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcmtlciBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIE1hcmtlcicpO1xuICAgIH1cbiAgICBwcml2LmVuZiA9IGNsb25lRW5mb3Jlc3RlcihlbmYpO1xuICB9XG5cbiAgbWFyaygpIHtcbiAgICBjb25zdCBwcml2ID0gcHJpdmF0ZURhdGEuZ2V0KHRoaXMpO1xuICAgIGxldCBtYXJrZXI7XG5cbiAgICAvLyB0aGUgaWRlYSBoZXJlIGlzIHRoYXQgbWFya2luZyBhdCB0aGUgYmVnaW5uaW5nIHNob3VsZG4ndCBoYXBwZW4gbW9yZSB0aGFuIG9uY2UuXG4gICAgLy8gV2UgY2FuIHJldXNlIHN0YXJ0TWFya2VyLlxuICAgIGlmIChwcml2LmVuZi5yZXN0ID09PSBwcml2Lm1hcmtlcnMuZ2V0KHByaXYuc3RhcnRNYXJrZXIpLnJlc3QpIHtcbiAgICAgIG1hcmtlciA9IHByaXYuc3RhcnRNYXJrZXI7XG4gICAgfSBlbHNlIGlmIChwcml2LmVuZi5yZXN0LmlzRW1wdHkoKSkge1xuICAgICAgLy8gc2FtZSByZWFzb24gYXMgYWJvdmVcbiAgICAgIGlmICghcHJpdi5lbmRNYXJrZXIpIHByaXYuZW5kTWFya2VyID0gbmV3IE1hcmtlcigpO1xuICAgICAgbWFya2VyID0gcHJpdi5lbmRNYXJrZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vVE9ETyhvcHRpbWl6YXRpb24vZHViaW91cyk6IGNoZWNrIHRoYXQgdGhlcmUgaXNuJ3QgYWxyZWFkeSBhIG1hcmtlciBmb3IgdGhpcyBpbmRleD9cbiAgICAgIG1hcmtlciA9IG5ldyBNYXJrZXIoKTtcbiAgICB9XG4gICAgaWYgKCFwcml2Lm1hcmtlcnMuaGFzKG1hcmtlcikpIHtcbiAgICAgIHByaXYubWFya2Vycy5zZXQobWFya2VyLCBjbG9uZUVuZm9yZXN0ZXIocHJpdi5lbmYpKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgY29uc3QgeyBlbmYsIG5vU2NvcGVzLCB1c2VTY29wZSwgaW50cm9kdWNlZFNjb3BlLCBjb250ZXh0IH0gPSBwcml2YXRlRGF0YS5nZXQodGhpcyk7XG4gICAgaWYgKGVuZi5yZXN0LnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRvbmU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBudWxsXG4gICAgICB9O1xuICAgIH1cbiAgICBsZXQgdmFsdWUgPSBlbmYuYWR2YW5jZSgpO1xuICAgIGlmICghbm9TY29wZXMpIHtcbiAgICAgIHZhbHVlID0gdmFsdWVcbiAgICAgICAgLmFkZFNjb3BlKHVzZVNjb3BlLCBjb250ZXh0LmJpbmRpbmdzLCBBTExfUEhBU0VTKVxuICAgICAgICAuYWRkU2NvcGUoaW50cm9kdWNlZFNjb3BlLCBjb250ZXh0LmJpbmRpbmdzLCBBTExfUEhBU0VTLCB7IGZsaXA6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkb25lOiBmYWxzZSxcbiAgICAgIHZhbHVlOiBuZXcgU3ludGF4T3JUZXJtV3JhcHBlcih2YWx1ZSwgY29udGV4dClcbiAgICB9O1xuICB9XG59XG4iXX0=