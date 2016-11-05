"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ALL_PHASES = exports.Types = undefined;

var _immutable = require("immutable");

var _errors = require("./errors");

var _bindingMap = require("./binding-map");

var _bindingMap2 = _interopRequireDefault(_bindingMap);

var _ramdaFantasy = require("ramda-fantasy");

var _ramda = require("ramda");

var _ = _interopRequireWildcard(_ramda);

var _tokenizer = require("shift-parser/dist/tokenizer");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getFirstSlice(stx) {
  if (!stx || typeof stx.isDelimiter !== 'function') return null; // TODO: should not have to do this
  if (!stx.isDelimiter()) {
    return stx.token.slice;
  }
  return stx.token.get(0).token.slice;
}

function sizeDecending(a, b) {
  if (a.scopes.size > b.scopes.size) {
    return -1;
  } else if (b.scopes.size > a.scopes.size) {
    return 1;
  } else {
    return 0;
  }
}

let Types = exports.Types = {
  null: {
    match: token => !Types.delimiter.match(token) && token.type === _tokenizer.TokenType.NULL,
    create: (value, stx) => new Syntax({
      type: _tokenizer.TokenType.NULL,
      value: null
    }, stx)
  },
  number: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.NumericLiteral,
    create: (value, stx) => new Syntax({
      type: _tokenizer.TokenType.NUMBER,
      value: value
    }, stx)
  },
  string: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.StringLiteral,
    create: (value, stx) => new Syntax({
      type: _tokenizer.TokenType.STRING,
      str: value
    }, stx)
  },
  punctuator: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.Punctuator,
    create: (value, stx) => new Syntax({
      type: {
        klass: _tokenizer.TokenClass.Punctuator,
        name: value
      },
      value: value
    }, stx)
  },
  keyword: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.Keyword,
    create: (value, stx) => new Syntax({
      type: {
        klass: _tokenizer.TokenClass.Keyword,
        name: value
      },
      value: value
    }, stx)
  },
  identifier: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.Ident,
    create: (value, stx) => new Syntax({
      type: _tokenizer.TokenType.IDENTIFIER,
      value: value
    }, stx)
  },
  regularExpression: {
    match: token => !Types.delimiter.match(token) && token.type.klass === _tokenizer.TokenClass.RegularExpression,
    create: (value, stx) => new Syntax({
      type: _tokenizer.TokenType.REGEXP,
      value: value
    }, stx)
  },
  braces: {
    match: token => Types.delimiter.match(token) && token.get(0).token.type === _tokenizer.TokenType.LBRACE,
    create: (inner, stx) => {
      let left = new Syntax({
        type: _tokenizer.TokenType.LBRACE,
        value: "{",
        slice: getFirstSlice(stx)
      });
      let right = new Syntax({
        type: _tokenizer.TokenType.RBRACE,
        value: "}",
        slice: getFirstSlice(stx)
      });
      return new Syntax(_immutable.List.of(left).concat(inner).push(right), stx);
    }
  },
  brackets: {
    match: token => Types.delimiter.match(token) && token.get(0).token.type === _tokenizer.TokenType.LBRACK,
    create: (inner, stx) => {
      let left = new Syntax({
        type: _tokenizer.TokenType.LBRACK,
        value: "[",
        slice: getFirstSlice(stx)
      });
      let right = new Syntax({
        type: _tokenizer.TokenType.RBRACK,
        value: "]",
        slice: getFirstSlice(stx)
      });
      return new Syntax(_immutable.List.of(left).concat(inner).push(right), stx);
    }
  },
  parens: {
    match: token => Types.delimiter.match(token) && token.get(0).token.type === _tokenizer.TokenType.LPAREN,
    create: (inner, stx) => {
      let left = new Syntax({
        type: _tokenizer.TokenType.LPAREN,
        value: "(",
        slice: getFirstSlice(stx)
      });
      let right = new Syntax({
        type: _tokenizer.TokenType.RPAREN,
        value: ")",
        slice: getFirstSlice(stx)
      });
      return new Syntax(_immutable.List.of(left).concat(inner).push(right), stx);
    }
  },

  assign: {
    match: token => {
      if (Types.punctuator.match(token)) {
        switch (token.value) {
          case "=":
          case "|=":
          case "^=":
          case "&=":
          case "<<=":
          case ">>=":
          case ">>>=":
          case "+=":
          case "-=":
          case "*=":
          case "/=":
          case "%=":
            return true;
          default:
            return false;
        }
      }
      return false;
    }
  },

  boolean: {
    match: token => !Types.delimiter.match(token) && token.type === _tokenizer.TokenType.TRUE || token.type === _tokenizer.TokenType.FALSE
  },

  template: {
    match: token => !Types.delimiter.match(token) && token.type === _tokenizer.TokenType.TEMPLATE
  },

  delimiter: {
    match: token => _immutable.List.isList(token)
  },

  syntaxTemplate: {
    match: token => Types.delimiter.match(token) && token.get(0).val() === '#`'
  },

  eof: {
    match: token => !Types.delimiter.match(token) && token.type === _tokenizer.TokenType.EOS
  }
};
const ALL_PHASES = exports.ALL_PHASES = {};

class Syntax {

  constructor(token, oldstx) {
    this.token = token;
    this.bindings = oldstx && oldstx.bindings != null ? oldstx.bindings : new _bindingMap2.default();
    this.scopesets = oldstx && oldstx.scopesets != null ? oldstx.scopesets : {
      all: (0, _immutable.List)(),
      phase: (0, _immutable.Map)()
    };
    Object.freeze(this);
  }
  // token: Token | List<Token>;


  static of(token, stx) {
    return new Syntax(token, stx);
  }

  static from(type, value, stx) {
    if (!Types[type]) {
      throw new Error(type + " is not a valid type");
    } else if (!Types[type].create) {
      throw new Error("Cannot create a syntax from type " + type);
    }
    let newstx = Types[type].create(value, stx);
    let slice = getFirstSlice(stx);
    if (slice != null) {
      newstx.token.slice = slice;
    }
    return newstx;
  }

  from(type, value) {
    return Syntax.from(type, value, this);
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

  static fromNull(stx) {
    return Syntax.from("null", null, stx);
  }

  static fromNumber(value, stx) {
    return Syntax.from("number", value, stx);
  }

  static fromString(value, stx) {
    return Syntax.from("string", value, stx);
  }

  static fromPunctuator(value, stx) {
    return Syntax.from("punctuator", value, stx);
  }

  static fromKeyword(value, stx) {
    return Syntax.from("keyword", value, stx);
  }

  static fromIdentifier(value, stx) {
    return Syntax.from("identifier", value, stx);
  }

  static fromRegularExpression(value, stx) {
    return Syntax.from("regularExpression", value, stx);
  }

  static fromBraces(inner, stx) {
    return Syntax.from("braces", inner, stx);
  }

  static fromBrackets(inner, stx) {
    return Syntax.from("brackets", inner, stx);
  }

  static fromParens(inner, stx) {
    return Syntax.from("parens", inner, stx);
  }

  // () -> string
  resolve(phase) {
    (0, _errors.assert)(phase != null, "must provide a phase to resolve");
    let allScopes = this.scopesets.all;
    let stxScopes = this.scopesets.phase.has(phase) ? this.scopesets.phase.get(phase) : (0, _immutable.List)();
    stxScopes = allScopes.concat(stxScopes);
    if (stxScopes.size === 0 || !(this.match('identifier') || this.match('keyword'))) {
      return this.token.value;
    }
    let scope = stxScopes.last();
    let bindings = this.bindings;
    if (scope) {
      // List<{ scopes: List<Scope>, binding: Symbol }>
      let scopesetBindingList = bindings.get(this);

      if (scopesetBindingList) {
        // { scopes: List<Scope>, binding: Symbol }
        let biggestBindingPair = scopesetBindingList.filter((_ref) => {
          let scopes = _ref.scopes;

          return scopes.isSubset(stxScopes);
        }).sort(sizeDecending);

        if (biggestBindingPair.size >= 2 && biggestBindingPair.get(0).scopes.size === biggestBindingPair.get(1).scopes.size) {
          let debugBase = '{' + stxScopes.map(s => s.toString()).join(', ') + '}';
          let debugAmbigousScopesets = biggestBindingPair.map((_ref2) => {
            let scopes = _ref2.scopes;

            return '{' + scopes.map(s => s.toString()).join(', ') + '}';
          }).join(', ');
          throw new Error('Scopeset ' + debugBase + ' has ambiguous subsets ' + debugAmbigousScopesets);
        } else if (biggestBindingPair.size !== 0) {
          let bindingStr = biggestBindingPair.get(0).binding.toString();
          if (_ramdaFantasy.Maybe.isJust(biggestBindingPair.get(0).alias)) {
            // null never happens because we just checked if it is a Just
            return biggestBindingPair.get(0).alias.getOrElse(null).resolve(phase);
          }
          return bindingStr;
        }
      }
    }
    return this.token.value;
  }

  val() {
    (0, _errors.assert)(!this.match("delimiter"), "cannot get the val of a delimiter");
    if (this.match("string")) {
      return this.token.str;
    }
    if (this.match("template")) {
      return this.token.items.map(el => {
        if (typeof el.match === 'function' && el.match("delimiter")) {
          return '${...}';
        }
        return el.slice.text;
      }).join('');
    }
    return this.token.value;
  }

  lineNumber() {
    if (!this.match("delimiter")) {
      return this.token.slice.startLocation.line;
    } else {
      return this.token.get(0).lineNumber();
    }
  }

  setLineNumber(line) {
    let newTok = {};
    if (this.isDelimiter()) {
      newTok = this.token.map(s => s.setLineNumber(line));
    } else {
      for (let key of Object.keys(this.token)) {
        newTok[key] = this.token[key];
      }
      (0, _errors.assert)(newTok.slice && newTok.slice.startLocation, 'all tokens must have line info');
      newTok.slice.startLocation.line = line;
    }
    return new Syntax(newTok, this);
  }

  // () -> List<Syntax>
  inner() {
    (0, _errors.assert)(this.match("delimiter"), "can only get the inner of a delimiter");
    return this.token.slice(1, this.token.size - 1);
  }

  addScope(scope, bindings, phase) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { flip: false };

    let token = this.match('delimiter') ? this.token.map(s => s.addScope(scope, bindings, phase, options)) : this.token;
    if (this.match('template')) {
      token = _.merge(token, {
        items: token.items.map(it => {
          if (it instanceof Syntax && it.match('delimiter')) {
            return it.addScope(scope, bindings, phase, options);
          }
          return it;
        })
      });
    }
    let oldScopeset;
    if (phase === ALL_PHASES) {
      oldScopeset = this.scopesets.all;
    } else {
      oldScopeset = this.scopesets.phase.has(phase) ? this.scopesets.phase.get(phase) : (0, _immutable.List)();
    }
    let newScopeset;
    if (options.flip) {
      let index = oldScopeset.indexOf(scope);
      if (index !== -1) {
        newScopeset = oldScopeset.remove(index);
      } else {
        newScopeset = oldScopeset.push(scope);
      }
    } else {
      newScopeset = oldScopeset.push(scope);
    }
    let newstx = {
      bindings: bindings,
      scopesets: {
        all: this.scopesets.all,
        phase: this.scopesets.phase
      }
    };

    if (phase === ALL_PHASES) {
      newstx.scopesets.all = newScopeset;
    } else {
      newstx.scopesets.phase = newstx.scopesets.phase.set(phase, newScopeset);
    }
    return new Syntax(token, newstx);
  }

  removeScope(scope, phase) {
    let token = this.match('delimiter') ? this.token.map(s => s.removeScope(scope, phase)) : this.token;
    let phaseScopeset = this.scopesets.phase.has(phase) ? this.scopesets.phase.get(phase) : (0, _immutable.List)();
    let allScopeset = this.scopesets.all;
    let newstx = {
      bindings: this.bindings,
      scopesets: {
        all: this.scopesets.all,
        phase: this.scopesets.phase
      }
    };

    let phaseIndex = phaseScopeset.indexOf(scope);
    let allIndex = allScopeset.indexOf(scope);
    if (phaseIndex !== -1) {
      newstx.scopesets.phase = this.scopesets.phase.set(phase, phaseScopeset.remove(phaseIndex));
    } else if (allIndex !== -1) {
      newstx.scopesets.all = allScopeset.remove(allIndex);
    }
    return new Syntax(token, newstx);
  }

  match(type, value) {
    if (!Types[type]) {
      throw new Error(type + " is an invalid type");
    }
    return Types[type].match(this.token) && (value == null || (value instanceof RegExp ? value.test(this.val()) : this.val() == value));
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

  toString() {
    if (this.match("delimiter")) {
      return this.token.map(s => s.toString()).join(" ");
    }
    if (this.match("string")) {
      return "'" + this.token.str;
    }
    if (this.match("template")) {
      return this.val();
    }
    return this.token.value;
  }
}
exports.default = Syntax;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zeW50YXguanMiXSwibmFtZXMiOlsiXyIsImdldEZpcnN0U2xpY2UiLCJzdHgiLCJpc0RlbGltaXRlciIsInRva2VuIiwic2xpY2UiLCJnZXQiLCJzaXplRGVjZW5kaW5nIiwiYSIsImIiLCJzY29wZXMiLCJzaXplIiwiVHlwZXMiLCJudWxsIiwibWF0Y2giLCJkZWxpbWl0ZXIiLCJ0eXBlIiwiTlVMTCIsImNyZWF0ZSIsInZhbHVlIiwiU3ludGF4IiwibnVtYmVyIiwia2xhc3MiLCJOdW1lcmljTGl0ZXJhbCIsIk5VTUJFUiIsInN0cmluZyIsIlN0cmluZ0xpdGVyYWwiLCJTVFJJTkciLCJzdHIiLCJwdW5jdHVhdG9yIiwiUHVuY3R1YXRvciIsIm5hbWUiLCJrZXl3b3JkIiwiS2V5d29yZCIsImlkZW50aWZpZXIiLCJJZGVudCIsIklERU5USUZJRVIiLCJyZWd1bGFyRXhwcmVzc2lvbiIsIlJlZ3VsYXJFeHByZXNzaW9uIiwiUkVHRVhQIiwiYnJhY2VzIiwiTEJSQUNFIiwiaW5uZXIiLCJsZWZ0IiwicmlnaHQiLCJSQlJBQ0UiLCJvZiIsImNvbmNhdCIsInB1c2giLCJicmFja2V0cyIsIkxCUkFDSyIsIlJCUkFDSyIsInBhcmVucyIsIkxQQVJFTiIsIlJQQVJFTiIsImFzc2lnbiIsImJvb2xlYW4iLCJUUlVFIiwiRkFMU0UiLCJ0ZW1wbGF0ZSIsIlRFTVBMQVRFIiwiaXNMaXN0Iiwic3ludGF4VGVtcGxhdGUiLCJ2YWwiLCJlb2YiLCJFT1MiLCJBTExfUEhBU0VTIiwiY29uc3RydWN0b3IiLCJvbGRzdHgiLCJiaW5kaW5ncyIsInNjb3Blc2V0cyIsImFsbCIsInBoYXNlIiwiT2JqZWN0IiwiZnJlZXplIiwiZnJvbSIsIkVycm9yIiwibmV3c3R4IiwiZnJvbU51bGwiLCJmcm9tTnVtYmVyIiwiZnJvbVN0cmluZyIsImZyb21QdW5jdHVhdG9yIiwiZnJvbUtleXdvcmQiLCJmcm9tSWRlbnRpZmllciIsImZyb21SZWd1bGFyRXhwcmVzc2lvbiIsImZyb21CcmFjZXMiLCJmcm9tQnJhY2tldHMiLCJmcm9tUGFyZW5zIiwicmVzb2x2ZSIsImFsbFNjb3BlcyIsInN0eFNjb3BlcyIsImhhcyIsInNjb3BlIiwibGFzdCIsInNjb3Blc2V0QmluZGluZ0xpc3QiLCJiaWdnZXN0QmluZGluZ1BhaXIiLCJmaWx0ZXIiLCJpc1N1YnNldCIsInNvcnQiLCJkZWJ1Z0Jhc2UiLCJtYXAiLCJzIiwidG9TdHJpbmciLCJqb2luIiwiZGVidWdBbWJpZ291c1Njb3Blc2V0cyIsImJpbmRpbmdTdHIiLCJiaW5kaW5nIiwiaXNKdXN0IiwiYWxpYXMiLCJnZXRPckVsc2UiLCJpdGVtcyIsImVsIiwidGV4dCIsImxpbmVOdW1iZXIiLCJzdGFydExvY2F0aW9uIiwibGluZSIsInNldExpbmVOdW1iZXIiLCJuZXdUb2siLCJrZXkiLCJrZXlzIiwiYWRkU2NvcGUiLCJvcHRpb25zIiwiZmxpcCIsIm1lcmdlIiwiaXQiLCJvbGRTY29wZXNldCIsIm5ld1Njb3Blc2V0IiwiaW5kZXgiLCJpbmRleE9mIiwicmVtb3ZlIiwic2V0IiwicmVtb3ZlU2NvcGUiLCJwaGFzZVNjb3Blc2V0IiwiYWxsU2NvcGVzZXQiLCJwaGFzZUluZGV4IiwiYWxsSW5kZXgiLCJSZWdFeHAiLCJ0ZXN0IiwiaXNJZGVudGlmaWVyIiwiaXNBc3NpZ24iLCJpc0Jvb2xlYW5MaXRlcmFsIiwiaXNLZXl3b3JkIiwiaXNOdWxsTGl0ZXJhbCIsImlzTnVtZXJpY0xpdGVyYWwiLCJpc1B1bmN0dWF0b3IiLCJpc1N0cmluZ0xpdGVyYWwiLCJpc1JlZ3VsYXJFeHByZXNzaW9uIiwiaXNUZW1wbGF0ZSIsImlzUGFyZW5zIiwiaXNCcmFjZXMiLCJpc0JyYWNrZXRzIiwiaXNTeW50YXhUZW1wbGF0ZSIsImlzRU9GIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7SUFBWUEsQzs7QUFFWjs7Ozs7O0FBMEJBLFNBQVNDLGFBQVQsQ0FBdUJDLEdBQXZCLEVBQXFDO0FBQ25D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QkssS0FBbEIsQ0FBUDtBQUNEOztBQUVEbUYsYUFBVztBQUNULFFBQUksS0FBS3hGLEtBQUwsQ0FBVyxXQUFYLENBQUosRUFBNkI7QUFDM0IsYUFBTyxLQUFLVixLQUFMLENBQVdnRyxHQUFYLENBQWVDLEtBQUtBLEVBQUVDLFFBQUYsRUFBcEIsRUFBa0NDLElBQWxDLENBQXVDLEdBQXZDLENBQVA7QUFDRDtBQUNELFFBQUksS0FBS3pGLEtBQUwsQ0FBVyxRQUFYLENBQUosRUFBMEI7QUFDeEIsYUFBTyxNQUFNLEtBQUtWLEtBQUwsQ0FBV3dCLEdBQXhCO0FBQ0Q7QUFDRCxRQUFJLEtBQUtkLEtBQUwsQ0FBVyxVQUFYLENBQUosRUFBNEI7QUFDMUIsYUFBTyxLQUFLaUQsR0FBTCxFQUFQO0FBQ0Q7QUFDRCxXQUFPLEtBQUszRCxLQUFMLENBQVdlLEtBQWxCO0FBQ0Q7QUFsV3lCO2tCQUFQQyxNIiwiZmlsZSI6InN5bnRheC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tIFwiaW1tdXRhYmxlXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCBCaW5kaW5nTWFwIGZyb20gXCIuL2JpbmRpbmctbWFwXCI7XG5pbXBvcnQgeyBNYXliZSB9IGZyb20gXCJyYW1kYS1mYW50YXN5XCI7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ3JhbWRhJztcblxuaW1wb3J0IHsgVG9rZW5UeXBlLCBUb2tlbkNsYXNzIH0gZnJvbSBcInNoaWZ0LXBhcnNlci9kaXN0L3Rva2VuaXplclwiO1xuXG50eXBlIFRva2VuID0ge1xuICB0eXBlOiBhbnk7XG4gIHZhbHVlOiBhbnk7XG4gIHNsaWNlOiBhbnk7XG59O1xuXG50eXBlIFRva2VuVGFnID1cbiAgJ251bGwnIHxcbiAgJ251bWJlcicgfFxuICAnc3RyaW5nJyB8XG4gICdwdW5jdHVhdG9yJyB8XG4gICdrZXl3b3JkJyB8XG4gICdpZGVudGlmaWVyJyB8XG4gICdyZWd1bGFyRXhwcmVzc2lvbicgfFxuICAnYm9vbGVhbicgfFxuICAnYnJhY2VzJyB8XG4gICdwYXJlbnMnIHxcbiAgJ2RlbGltaXRlcicgfFxuICAnZW9mJyB8XG4gICd0ZW1wbGF0ZScgfFxuICAnYXNzaWduJyB8XG4gICdzeW50YXhUZW1wbGF0ZScgfFxuICAnYnJhY2tldHMnXG5cbmZ1bmN0aW9uIGdldEZpcnN0U2xpY2Uoc3R4OiA/U3ludGF4KSB7XG4gIGlmICgoIXN0eCkgfHwgdHlwZW9mIHN0eC5pc0RlbGltaXRlciAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG51bGw7IC8vIFRPRE86IHNob3VsZCBub3QgaGF2ZSB0byBkbyB0aGlzXG4gIGlmICghc3R4LmlzRGVsaW1pdGVyKCkpIHtcbiAgICByZXR1cm4gc3R4LnRva2VuLnNsaWNlO1xuICB9XG4gIHJldHVybiBzdHgudG9rZW4uZ2V0KDApLnRva2VuLnNsaWNlO1xufVxuXG5mdW5jdGlvbiBzaXplRGVjZW5kaW5nKGEsIGIpIHtcbiAgaWYgKGEuc2NvcGVzLnNpemUgPiBiLnNjb3Blcy5zaXplKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKGIuc2NvcGVzLnNpemUgPiBhLnNjb3Blcy5zaXplKSB7XG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxudHlwZSBUeXBlc0hlbHBlciA9IHtcbiAgW2tleTogVG9rZW5UYWddOiB7XG4gICAgbWF0Y2godG9rZW46IGFueSk6IGJvb2xlYW47XG4gICAgY3JlYXRlPzogKHZhbHVlOiBhbnksIHN0eDogP1N5bnRheCkgPT4gU3ludGF4O1xuICB9XG59XG5cbmV4cG9ydCBsZXQgVHlwZXM6IFR5cGVzSGVscGVyID0ge1xuICBudWxsOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+ICFUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmIHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5OVUxMLFxuICAgIGNyZWF0ZTogKHZhbHVlLCBzdHgpID0+IG5ldyBTeW50YXgoe1xuICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTEwsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sIHN0eClcbiAgfSxcbiAgbnVtYmVyOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+ICFUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmIHRva2VuLnR5cGUua2xhc3MgPT09IFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWwsXG4gICAgY3JlYXRlOiAodmFsdWUsIHN0eCkgPT4gbmV3IFN5bnRheCh7XG4gICAgICB0eXBlOiBUb2tlblR5cGUuTlVNQkVSLFxuICAgICAgdmFsdWVcbiAgICB9LCBzdHgpXG4gIH0sXG4gIHN0cmluZzoge1xuXHRcdG1hdGNoOiB0b2tlbiA9PiAhVHlwZXMuZGVsaW1pdGVyLm1hdGNoKHRva2VuKSAmJiB0b2tlbi50eXBlLmtsYXNzID09PSBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsXG4gICAgY3JlYXRlOiAodmFsdWUsIHN0eCkgPT4gbmV3IFN5bnRheCh7XG4gICAgICB0eXBlOiBUb2tlblR5cGUuU1RSSU5HLFxuICAgICAgc3RyOiB2YWx1ZVxuICAgIH0sIHN0eClcbiAgfSxcbiAgcHVuY3R1YXRvcjoge1xuXHRcdG1hdGNoOiB0b2tlbiA9PiAhVHlwZXMuZGVsaW1pdGVyLm1hdGNoKHRva2VuKSAmJiB0b2tlbi50eXBlLmtsYXNzID09PSBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsXG4gICAgY3JlYXRlOiAodmFsdWUsIHN0eCkgPT4gbmV3IFN5bnRheCh7XG4gICAgICB0eXBlOiB7XG4gICAgICAgIGtsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsXG4gICAgICAgIG5hbWU6IHZhbHVlXG4gICAgICB9LFxuICAgICAgdmFsdWVcbiAgICB9LCBzdHgpXG4gIH0sXG4gIGtleXdvcmQ6IHtcblx0XHRtYXRjaDogdG9rZW4gPT4gIVR5cGVzLmRlbGltaXRlci5tYXRjaCh0b2tlbikgJiYgdG9rZW4udHlwZS5rbGFzcyA9PT0gVG9rZW5DbGFzcy5LZXl3b3JkLFxuICAgIGNyZWF0ZTogKHZhbHVlLCBzdHgpID0+IG5ldyBTeW50YXgoe1xuICAgICAgdHlwZToge1xuICAgICAgICBrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLFxuICAgICAgICBuYW1lOiB2YWx1ZVxuICAgICAgfSxcbiAgICAgIHZhbHVlXG4gICAgfSwgc3R4KVxuICB9LFxuICBpZGVudGlmaWVyOiB7XG5cdFx0bWF0Y2g6IHRva2VuID0+ICFUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmIHRva2VuLnR5cGUua2xhc3MgPT09IFRva2VuQ2xhc3MuSWRlbnQsXG4gICAgY3JlYXRlOiAodmFsdWUsIHN0eCkgPT4gbmV3IFN5bnRheCh7XG4gICAgICB0eXBlOiBUb2tlblR5cGUuSURFTlRJRklFUixcbiAgICAgIHZhbHVlXG4gICAgfSwgc3R4KVxuICB9LFxuICByZWd1bGFyRXhwcmVzc2lvbjoge1xuXHRcdG1hdGNoOiB0b2tlbiA9PiAhVHlwZXMuZGVsaW1pdGVyLm1hdGNoKHRva2VuKSAmJiB0b2tlbi50eXBlLmtsYXNzID09PSBUb2tlbkNsYXNzLlJlZ3VsYXJFeHByZXNzaW9uLFxuICAgIGNyZWF0ZTogKHZhbHVlLCBzdHgpID0+IG5ldyBTeW50YXgoe1xuICAgICAgdHlwZTogVG9rZW5UeXBlLlJFR0VYUCxcbiAgICAgIHZhbHVlXG4gICAgfSwgc3R4KVxuICB9LFxuICBicmFjZXM6IHtcblx0XHRtYXRjaDogdG9rZW4gPT4gVHlwZXMuZGVsaW1pdGVyLm1hdGNoKHRva2VuKSAmJlxuICAgICAgICAgICB0b2tlbi5nZXQoMCkudG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkxCUkFDRSxcbiAgICBjcmVhdGU6IChpbm5lciwgc3R4KSA9PiB7XG4gICAgICBsZXQgbGVmdCA9IG5ldyBTeW50YXgoe1xuICAgICAgICB0eXBlOiBUb2tlblR5cGUuTEJSQUNFLFxuICAgICAgICB2YWx1ZTogXCJ7XCIsXG4gICAgICAgIHNsaWNlOiBnZXRGaXJzdFNsaWNlKHN0eClcbiAgICAgIH0pO1xuICAgICAgbGV0IHJpZ2h0ID0gbmV3IFN5bnRheCh7XG4gICAgICAgIHR5cGU6IFRva2VuVHlwZS5SQlJBQ0UsXG4gICAgICAgIHZhbHVlOiBcIn1cIixcbiAgICAgICAgc2xpY2U6IGdldEZpcnN0U2xpY2Uoc3R4KVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFN5bnRheChMaXN0Lm9mKGxlZnQpLmNvbmNhdChpbm5lcikucHVzaChyaWdodCksIHN0eCk7XG4gICAgfVxuICB9LFxuICBicmFja2V0czoge1xuXHRcdG1hdGNoOiB0b2tlbiA9PiBUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmXG4gICAgICAgICAgIHRva2VuLmdldCgwKS50b2tlbi50eXBlID09PSBUb2tlblR5cGUuTEJSQUNLLFxuICAgIGNyZWF0ZTogKGlubmVyLCBzdHgpID0+IHtcbiAgICAgIGxldCBsZWZ0ID0gbmV3IFN5bnRheCh7XG4gICAgICAgIHR5cGU6IFRva2VuVHlwZS5MQlJBQ0ssXG4gICAgICAgIHZhbHVlOiBcIltcIixcbiAgICAgICAgc2xpY2U6IGdldEZpcnN0U2xpY2Uoc3R4KVxuICAgICAgfSk7XG4gICAgICBsZXQgcmlnaHQgPSBuZXcgU3ludGF4KHtcbiAgICAgICAgdHlwZTogVG9rZW5UeXBlLlJCUkFDSyxcbiAgICAgICAgdmFsdWU6IFwiXVwiLFxuICAgICAgICBzbGljZTogZ2V0Rmlyc3RTbGljZShzdHgpXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXcgU3ludGF4KExpc3Qub2YobGVmdCkuY29uY2F0KGlubmVyKS5wdXNoKHJpZ2h0KSwgc3R4KTtcbiAgICB9XG4gIH0sXG4gIHBhcmVuczoge1xuXHRcdG1hdGNoOiB0b2tlbiA9PiBUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmXG4gICAgICAgICAgIHRva2VuLmdldCgwKS50b2tlbi50eXBlID09PSBUb2tlblR5cGUuTFBBUkVOLFxuICAgIGNyZWF0ZTogKGlubmVyLCBzdHgpID0+IHtcbiAgICAgIGxldCBsZWZ0ID0gbmV3IFN5bnRheCh7XG4gICAgICAgIHR5cGU6IFRva2VuVHlwZS5MUEFSRU4sXG4gICAgICAgIHZhbHVlOiBcIihcIixcbiAgICAgICAgc2xpY2U6IGdldEZpcnN0U2xpY2Uoc3R4KVxuICAgICAgfSk7XG4gICAgICBsZXQgcmlnaHQgPSBuZXcgU3ludGF4KHtcbiAgICAgICAgdHlwZTogVG9rZW5UeXBlLlJQQVJFTixcbiAgICAgICAgdmFsdWU6IFwiKVwiLFxuICAgICAgICBzbGljZTogZ2V0Rmlyc3RTbGljZShzdHgpXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXcgU3ludGF4KExpc3Qub2YobGVmdCkuY29uY2F0KGlubmVyKS5wdXNoKHJpZ2h0KSwgc3R4KTtcbiAgICB9XG4gIH0sXG5cbiAgYXNzaWduOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+IHtcbiAgICAgIGlmIChUeXBlcy5wdW5jdHVhdG9yLm1hdGNoKHRva2VuKSkge1xuICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgY2FzZSBcIj1cIjpcbiAgICAgICAgICBjYXNlIFwifD1cIjpcbiAgICAgICAgICBjYXNlIFwiXj1cIjpcbiAgICAgICAgICBjYXNlIFwiJj1cIjpcbiAgICAgICAgICBjYXNlIFwiPDw9XCI6XG4gICAgICAgICAgY2FzZSBcIj4+PVwiOlxuICAgICAgICAgIGNhc2UgXCI+Pj49XCI6XG4gICAgICAgICAgY2FzZSBcIis9XCI6XG4gICAgICAgICAgY2FzZSBcIi09XCI6XG4gICAgICAgICAgY2FzZSBcIio9XCI6XG4gICAgICAgICAgY2FzZSBcIi89XCI6XG4gICAgICAgICAgY2FzZSBcIiU9XCI6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIGJvb2xlYW46IHtcbiAgICBtYXRjaDogdG9rZW4gPT4gIVR5cGVzLmRlbGltaXRlci5tYXRjaCh0b2tlbikgJiYgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlRSVUUgfHxcbiAgICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZBTFNFXG4gIH0sXG5cbiAgdGVtcGxhdGU6IHtcbiAgICBtYXRjaDogdG9rZW4gPT4gIVR5cGVzLmRlbGltaXRlci5tYXRjaCh0b2tlbikgJiYgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlRFTVBMQVRFXG4gIH0sXG5cbiAgZGVsaW1pdGVyOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+IExpc3QuaXNMaXN0KHRva2VuKVxuICB9LFxuXG4gIHN5bnRheFRlbXBsYXRlOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+IFR5cGVzLmRlbGltaXRlci5tYXRjaCh0b2tlbikgJiYgdG9rZW4uZ2V0KDApLnZhbCgpID09PSAnI2AnXG4gIH0sXG5cbiAgZW9mOiB7XG4gICAgbWF0Y2g6IHRva2VuID0+ICFUeXBlcy5kZWxpbWl0ZXIubWF0Y2godG9rZW4pICYmIHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5FT1NcbiAgfSxcbn07XG5leHBvcnQgY29uc3QgQUxMX1BIQVNFUyA9IHt9O1xuXG50eXBlIFNjb3Blc2V0ID0ge1xuICBhbGw6IExpc3Q8YW55PjtcbiAgcGhhc2U6IE1hcDxudW1iZXIsIGFueT47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN5bnRheCB7XG4gIC8vIHRva2VuOiBUb2tlbiB8IExpc3Q8VG9rZW4+O1xuICB0b2tlbjogYW55O1xuICBiaW5kaW5nczogQmluZGluZ01hcDtcbiAgc2NvcGVzZXRzOiBTY29wZXNldDtcblxuICBjb25zdHJ1Y3Rvcih0b2tlbjogYW55LCBvbGRzdHg6ID97IGJpbmRpbmdzOiBhbnk7IHNjb3Blc2V0czogYW55fSkge1xuICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgICB0aGlzLmJpbmRpbmdzID0gb2xkc3R4ICYmIChvbGRzdHguYmluZGluZ3MgIT0gbnVsbCkgPyBvbGRzdHguYmluZGluZ3MgOiBuZXcgQmluZGluZ01hcCgpO1xuICAgIHRoaXMuc2NvcGVzZXRzID0gb2xkc3R4ICYmIChvbGRzdHguc2NvcGVzZXRzICE9IG51bGwpID8gb2xkc3R4LnNjb3Blc2V0cyA6IHtcbiAgICAgIGFsbDogTGlzdCgpLFxuICAgICAgcGhhc2U6IE1hcCgpXG4gICAgfTtcbiAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xuICB9XG5cbiAgc3RhdGljIG9mKHRva2VuOiBUb2tlbiwgc3R4OiA/U3ludGF4KSB7XG4gICAgcmV0dXJuIG5ldyBTeW50YXgodG9rZW4sIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbSh0eXBlLCB2YWx1ZSwgc3R4OiA/U3ludGF4KSB7XG4gICAgaWYgKCFUeXBlc1t0eXBlXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHR5cGUgKyBcIiBpcyBub3QgYSB2YWxpZCB0eXBlXCIpO1xuICAgIH1cbiAgICBlbHNlIGlmICghVHlwZXNbdHlwZV0uY3JlYXRlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgY3JlYXRlIGEgc3ludGF4IGZyb20gdHlwZSBcIiArIHR5cGUpO1xuICAgIH1cbiAgICBsZXQgbmV3c3R4ID0gVHlwZXNbdHlwZV0uY3JlYXRlKHZhbHVlLCBzdHgpO1xuICAgIGxldCBzbGljZSA9IGdldEZpcnN0U2xpY2Uoc3R4KTtcbiAgICBpZiAoc2xpY2UgIT0gbnVsbCkge1xuICAgICAgbmV3c3R4LnRva2VuLnNsaWNlID0gc2xpY2U7XG4gICAgfVxuICAgIHJldHVybiBuZXdzdHg7XG4gIH1cblxuICBmcm9tKHR5cGU6IFRva2VuVGFnLCB2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIFN5bnRheC5mcm9tKHR5cGUsIHZhbHVlLCB0aGlzKTtcbiAgfVxuXG4gIGZyb21OdWxsKCkge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJudWxsXCIsIG51bGwpO1xuICB9XG5cbiAgZnJvbU51bWJlcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbSgnbnVtYmVyJywgdmFsdWUpO1xuICB9XG5cbiAgZnJvbVN0cmluZyh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShcInN0cmluZ1wiLCB2YWx1ZSk7XG4gIH1cblxuICBmcm9tUHVuY3R1YXRvcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShcInB1bmN0dWF0b3JcIiwgdmFsdWUpO1xuICB9XG5cbiAgZnJvbUtleXdvcmQodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJrZXl3b3JkXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGZyb21JZGVudGlmaWVyKHZhbHVlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKFwiaWRlbnRpZmllclwiLCB2YWx1ZSk7XG4gIH1cblxuICBmcm9tUmVndWxhckV4cHJlc3Npb24odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJyZWd1bGFyRXhwcmVzc2lvblwiLCB2YWx1ZSk7XG4gIH1cblxuICBmcm9tQnJhY2VzKGlubmVyOiBMaXN0PFN5bnRheD4pIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKFwiYnJhY2VzXCIsIGlubmVyKTtcbiAgfVxuXG4gIGZyb21CcmFja2V0cyhpbm5lcjogTGlzdDxTeW50YXg+KSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShcImJyYWNrZXRzXCIsIGlubmVyKTtcbiAgfVxuXG4gIGZyb21QYXJlbnMoaW5uZXI6IExpc3Q8U3ludGF4Pikge1xuICAgIHJldHVybiB0aGlzLmZyb20oXCJwYXJlbnNcIiwgaW5uZXIpO1xuICB9XG5cbiAgc3RhdGljIGZyb21OdWxsKHN0eDogU3ludGF4KSB7XG4gICAgcmV0dXJuIFN5bnRheC5mcm9tKFwibnVsbFwiLCBudWxsLCBzdHgpO1xuICB9XG5cbiAgc3RhdGljIGZyb21OdW1iZXIodmFsdWUsIHN0eCkge1xuICAgIHJldHVybiBTeW50YXguZnJvbShcIm51bWJlclwiLCB2YWx1ZSwgc3R4KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tU3RyaW5nKHZhbHVlLCBzdHgpIHtcbiAgICByZXR1cm4gU3ludGF4LmZyb20oXCJzdHJpbmdcIiwgdmFsdWUsIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVB1bmN0dWF0b3IodmFsdWUsIHN0eCkge1xuICAgIHJldHVybiBTeW50YXguZnJvbShcInB1bmN0dWF0b3JcIiwgdmFsdWUsIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUtleXdvcmQodmFsdWUsIHN0eCkge1xuICAgIHJldHVybiBTeW50YXguZnJvbShcImtleXdvcmRcIiwgdmFsdWUsIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUlkZW50aWZpZXIodmFsdWUsIHN0eCkge1xuICAgIHJldHVybiBTeW50YXguZnJvbShcImlkZW50aWZpZXJcIiwgdmFsdWUsIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbVJlZ3VsYXJFeHByZXNzaW9uKHZhbHVlLCBzdHgpIHtcbiAgICByZXR1cm4gU3ludGF4LmZyb20oXCJyZWd1bGFyRXhwcmVzc2lvblwiLCB2YWx1ZSwgc3R4KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnJhY2VzKGlubmVyLCBzdHgpIHtcbiAgICByZXR1cm4gU3ludGF4LmZyb20oXCJicmFjZXNcIiwgaW5uZXIsIHN0eCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUJyYWNrZXRzKGlubmVyLCBzdHgpIHtcbiAgICByZXR1cm4gU3ludGF4LmZyb20oXCJicmFja2V0c1wiLCBpbm5lciwgc3R4KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tUGFyZW5zKGlubmVyLCBzdHgpIHtcbiAgICByZXR1cm4gU3ludGF4LmZyb20oXCJwYXJlbnNcIiwgaW5uZXIsIHN0eCk7XG4gIH1cblxuICAvLyAoKSAtPiBzdHJpbmdcbiAgcmVzb2x2ZShwaGFzZTogYW55KSB7XG4gICAgYXNzZXJ0KHBoYXNlICE9IG51bGwsIFwibXVzdCBwcm92aWRlIGEgcGhhc2UgdG8gcmVzb2x2ZVwiKTtcbiAgICBsZXQgYWxsU2NvcGVzID0gdGhpcy5zY29wZXNldHMuYWxsO1xuICAgIGxldCBzdHhTY29wZXMgPSB0aGlzLnNjb3Blc2V0cy5waGFzZS5oYXMocGhhc2UpID8gdGhpcy5zY29wZXNldHMucGhhc2UuZ2V0KHBoYXNlKSA6IExpc3QoKTtcbiAgICBzdHhTY29wZXMgPSBhbGxTY29wZXMuY29uY2F0KHN0eFNjb3Blcyk7XG4gICAgaWYgKHN0eFNjb3Blcy5zaXplID09PSAwIHx8ICEodGhpcy5tYXRjaCgnaWRlbnRpZmllcicpIHx8IHRoaXMubWF0Y2goJ2tleXdvcmQnKSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnRva2VuLnZhbHVlO1xuICAgIH1cbiAgICBsZXQgc2NvcGUgPSBzdHhTY29wZXMubGFzdCgpO1xuICAgIGxldCBiaW5kaW5ncyA9IHRoaXMuYmluZGluZ3M7XG4gICAgaWYgKHNjb3BlKSB7XG4gICAgICAvLyBMaXN0PHsgc2NvcGVzOiBMaXN0PFNjb3BlPiwgYmluZGluZzogU3ltYm9sIH0+XG4gICAgICBsZXQgc2NvcGVzZXRCaW5kaW5nTGlzdCA9IGJpbmRpbmdzLmdldCh0aGlzKTtcblxuICAgICAgaWYgKHNjb3Blc2V0QmluZGluZ0xpc3QpIHtcbiAgICAgICAgLy8geyBzY29wZXM6IExpc3Q8U2NvcGU+LCBiaW5kaW5nOiBTeW1ib2wgfVxuICAgICAgICBsZXQgYmlnZ2VzdEJpbmRpbmdQYWlyID0gc2NvcGVzZXRCaW5kaW5nTGlzdC5maWx0ZXIoKHtzY29wZXN9KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHNjb3Blcy5pc1N1YnNldChzdHhTY29wZXMpO1xuICAgICAgICB9KS5zb3J0KHNpemVEZWNlbmRpbmcpO1xuXG4gICAgICAgIGlmIChiaWdnZXN0QmluZGluZ1BhaXIuc2l6ZSA+PSAyICYmXG4gICAgICAgICAgICBiaWdnZXN0QmluZGluZ1BhaXIuZ2V0KDApLnNjb3Blcy5zaXplID09PSBiaWdnZXN0QmluZGluZ1BhaXIuZ2V0KDEpLnNjb3Blcy5zaXplKSB7XG4gICAgICAgICAgbGV0IGRlYnVnQmFzZSA9ICd7JyArIHN0eFNjb3Blcy5tYXAocyA9PiBzLnRvU3RyaW5nKCkpLmpvaW4oJywgJykgKyAnfSc7XG4gICAgICAgICAgbGV0IGRlYnVnQW1iaWdvdXNTY29wZXNldHMgPSBiaWdnZXN0QmluZGluZ1BhaXIubWFwKCh7c2NvcGVzfSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICd7JyArIHNjb3Blcy5tYXAocyA9PiBzLnRvU3RyaW5nKCkpLmpvaW4oJywgJykgKyAnfSc7XG4gICAgICAgICAgfSkuam9pbignLCAnKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Njb3Blc2V0ICcgKyBkZWJ1Z0Jhc2UgKyAnIGhhcyBhbWJpZ3VvdXMgc3Vic2V0cyAnICsgZGVidWdBbWJpZ291c1Njb3Blc2V0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoYmlnZ2VzdEJpbmRpbmdQYWlyLnNpemUgIT09IDApIHtcbiAgICAgICAgICBsZXQgYmluZGluZ1N0ciA9IGJpZ2dlc3RCaW5kaW5nUGFpci5nZXQoMCkuYmluZGluZy50b1N0cmluZygpO1xuICAgICAgICAgIGlmIChNYXliZS5pc0p1c3QoYmlnZ2VzdEJpbmRpbmdQYWlyLmdldCgwKS5hbGlhcykpIHtcbiAgICAgICAgICAgIC8vIG51bGwgbmV2ZXIgaGFwcGVucyBiZWNhdXNlIHdlIGp1c3QgY2hlY2tlZCBpZiBpdCBpcyBhIEp1c3RcbiAgICAgICAgICAgIHJldHVybiBiaWdnZXN0QmluZGluZ1BhaXIuZ2V0KDApLmFsaWFzLmdldE9yRWxzZShudWxsKS5yZXNvbHZlKHBoYXNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGJpbmRpbmdTdHI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudG9rZW4udmFsdWU7XG4gIH1cblxuICB2YWwoKSB7XG4gICAgYXNzZXJ0KCF0aGlzLm1hdGNoKFwiZGVsaW1pdGVyXCIpLCBcImNhbm5vdCBnZXQgdGhlIHZhbCBvZiBhIGRlbGltaXRlclwiKTtcbiAgICBpZiAodGhpcy5tYXRjaChcInN0cmluZ1wiKSkge1xuICAgICAgcmV0dXJuIHRoaXMudG9rZW4uc3RyO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChcInRlbXBsYXRlXCIpKSB7XG4gICAgICByZXR1cm4gdGhpcy50b2tlbi5pdGVtcy5tYXAoZWwgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGVsLm1hdGNoID09PSAnZnVuY3Rpb24nICYmIGVsLm1hdGNoKFwiZGVsaW1pdGVyXCIpKSB7XG4gICAgICAgICAgcmV0dXJuICckey4uLn0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbC5zbGljZS50ZXh0O1xuICAgICAgfSkuam9pbignJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRva2VuLnZhbHVlO1xuICB9XG5cbiAgbGluZU51bWJlcigpIHtcbiAgICBpZiAoIXRoaXMubWF0Y2goXCJkZWxpbWl0ZXJcIikpIHtcbiAgICAgIHJldHVybiB0aGlzLnRva2VuLnNsaWNlLnN0YXJ0TG9jYXRpb24ubGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudG9rZW4uZ2V0KDApLmxpbmVOdW1iZXIoKTtcbiAgICB9XG4gIH1cblxuICBzZXRMaW5lTnVtYmVyKGxpbmU6IG51bWJlcikge1xuICAgIGxldCBuZXdUb2sgPSB7fTtcbiAgICBpZiAodGhpcy5pc0RlbGltaXRlcigpKSB7XG4gICAgICBuZXdUb2sgPSB0aGlzLnRva2VuLm1hcChzID0+IHMuc2V0TGluZU51bWJlcihsaW5lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnRva2VuKSkge1xuICAgICAgICBuZXdUb2tba2V5XSA9IHRoaXMudG9rZW5ba2V5XTtcbiAgICAgIH1cbiAgICAgIGFzc2VydChuZXdUb2suc2xpY2UgJiYgbmV3VG9rLnNsaWNlLnN0YXJ0TG9jYXRpb24sICdhbGwgdG9rZW5zIG11c3QgaGF2ZSBsaW5lIGluZm8nKTtcbiAgICAgIG5ld1Rvay5zbGljZS5zdGFydExvY2F0aW9uLmxpbmUgPSBsaW5lO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFN5bnRheChuZXdUb2ssIHRoaXMpO1xuICB9XG5cbiAgLy8gKCkgLT4gTGlzdDxTeW50YXg+XG4gIGlubmVyKCkge1xuICAgIGFzc2VydCh0aGlzLm1hdGNoKFwiZGVsaW1pdGVyXCIpLCBcImNhbiBvbmx5IGdldCB0aGUgaW5uZXIgb2YgYSBkZWxpbWl0ZXJcIik7XG4gICAgcmV0dXJuIHRoaXMudG9rZW4uc2xpY2UoMSwgdGhpcy50b2tlbi5zaXplIC0gMSk7XG4gIH1cblxuICBhZGRTY29wZShzY29wZTogYW55LCBiaW5kaW5nczogYW55LCBwaGFzZTogbnVtYmVyLCBvcHRpb25zOiBhbnkgPSB7IGZsaXA6IGZhbHNlIH0pIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLm1hdGNoKCdkZWxpbWl0ZXInKSA/IHRoaXMudG9rZW4ubWFwKHMgPT4gcy5hZGRTY29wZShzY29wZSwgYmluZGluZ3MsIHBoYXNlLCBvcHRpb25zKSkgOiB0aGlzLnRva2VuO1xuICAgIGlmICh0aGlzLm1hdGNoKCd0ZW1wbGF0ZScpKSB7XG4gICAgICB0b2tlbiA9IF8ubWVyZ2UodG9rZW4sIHtcbiAgICAgICAgaXRlbXM6IHRva2VuLml0ZW1zLm1hcChpdCA9PiB7XG4gICAgICAgICAgaWYgKGl0IGluc3RhbmNlb2YgU3ludGF4ICYmIGl0Lm1hdGNoKCdkZWxpbWl0ZXInKSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0LmFkZFNjb3BlKHNjb3BlLCBiaW5kaW5ncywgcGhhc2UsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXQ7XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICB9XG4gICAgbGV0IG9sZFNjb3Blc2V0O1xuICAgIGlmIChwaGFzZSA9PT0gQUxMX1BIQVNFUykge1xuICAgICAgb2xkU2NvcGVzZXQgPSB0aGlzLnNjb3Blc2V0cy5hbGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9sZFNjb3Blc2V0ID0gdGhpcy5zY29wZXNldHMucGhhc2UuaGFzKHBoYXNlKSA/IHRoaXMuc2NvcGVzZXRzLnBoYXNlLmdldChwaGFzZSkgOiBMaXN0KCk7XG4gICAgfVxuICAgIGxldCBuZXdTY29wZXNldDtcbiAgICBpZiAob3B0aW9ucy5mbGlwKSB7XG4gICAgICBsZXQgaW5kZXggPSBvbGRTY29wZXNldC5pbmRleE9mKHNjb3BlKTtcbiAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgbmV3U2NvcGVzZXQgPSBvbGRTY29wZXNldC5yZW1vdmUoaW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3U2NvcGVzZXQgPSBvbGRTY29wZXNldC5wdXNoKHNjb3BlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U2NvcGVzZXQgPSBvbGRTY29wZXNldC5wdXNoKHNjb3BlKTtcbiAgICB9XG4gICAgbGV0IG5ld3N0eCA9IHtcbiAgICAgIGJpbmRpbmdzLFxuICAgICAgc2NvcGVzZXRzOiB7XG4gICAgICAgIGFsbDogdGhpcy5zY29wZXNldHMuYWxsLFxuICAgICAgICBwaGFzZTogdGhpcy5zY29wZXNldHMucGhhc2VcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHBoYXNlID09PSBBTExfUEhBU0VTKSB7XG4gICAgICBuZXdzdHguc2NvcGVzZXRzLmFsbCA9IG5ld1Njb3Blc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdzdHguc2NvcGVzZXRzLnBoYXNlID0gbmV3c3R4LnNjb3Blc2V0cy5waGFzZS5zZXQocGhhc2UsIG5ld1Njb3Blc2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTeW50YXgodG9rZW4sIG5ld3N0eCk7XG4gIH1cblxuICByZW1vdmVTY29wZShzY29wZTogYW55LCBwaGFzZTogbnVtYmVyKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5tYXRjaCgnZGVsaW1pdGVyJykgPyB0aGlzLnRva2VuLm1hcChzID0+IHMucmVtb3ZlU2NvcGUoc2NvcGUsIHBoYXNlKSkgOiB0aGlzLnRva2VuO1xuICAgIGxldCBwaGFzZVNjb3Blc2V0ID0gdGhpcy5zY29wZXNldHMucGhhc2UuaGFzKHBoYXNlKSA/IHRoaXMuc2NvcGVzZXRzLnBoYXNlLmdldChwaGFzZSkgOiBMaXN0KCk7XG4gICAgbGV0IGFsbFNjb3Blc2V0ID0gdGhpcy5zY29wZXNldHMuYWxsO1xuICAgIGxldCBuZXdzdHggPSB7XG4gICAgICBiaW5kaW5nczogdGhpcy5iaW5kaW5ncyxcbiAgICAgIHNjb3Blc2V0czoge1xuICAgICAgICBhbGw6IHRoaXMuc2NvcGVzZXRzLmFsbCxcbiAgICAgICAgcGhhc2U6IHRoaXMuc2NvcGVzZXRzLnBoYXNlXG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBwaGFzZUluZGV4ID0gcGhhc2VTY29wZXNldC5pbmRleE9mKHNjb3BlKTtcbiAgICBsZXQgYWxsSW5kZXggPSBhbGxTY29wZXNldC5pbmRleE9mKHNjb3BlKTtcbiAgICBpZiAocGhhc2VJbmRleCAhPT0gLTEpIHtcbiAgICAgIG5ld3N0eC5zY29wZXNldHMucGhhc2UgPSB0aGlzLnNjb3Blc2V0cy5waGFzZS5zZXQocGhhc2UsIHBoYXNlU2NvcGVzZXQucmVtb3ZlKHBoYXNlSW5kZXgpKTtcbiAgICB9IGVsc2UgaWYgKGFsbEluZGV4ICE9PSAtMSkge1xuICAgICAgbmV3c3R4LnNjb3Blc2V0cy5hbGwgPSBhbGxTY29wZXNldC5yZW1vdmUoYWxsSW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFN5bnRheCh0b2tlbiwgbmV3c3R4KTtcbiAgfVxuXG4gIG1hdGNoKHR5cGU6IFRva2VuVGFnLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKCFUeXBlc1t0eXBlXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHR5cGUgKyBcIiBpcyBhbiBpbnZhbGlkIHR5cGVcIik7XG4gICAgfVxuICAgIHJldHVybiBUeXBlc1t0eXBlXS5tYXRjaCh0aGlzLnRva2VuKSAmJiAodmFsdWUgPT0gbnVsbCB8fFxuICAgICAgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwID8gdmFsdWUudGVzdCh0aGlzLnZhbCgpKSA6IHRoaXMudmFsKCkgPT0gdmFsdWUpKTtcbiAgfVxuXG4gIGlzSWRlbnRpZmllcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJpZGVudGlmaWVyXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzQXNzaWduKHZhbHVlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcImFzc2lnblwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc0Jvb2xlYW5MaXRlcmFsKHZhbHVlOiBib29sZWFuKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJib29sZWFuXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzS2V5d29yZCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJrZXl3b3JkXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzTnVsbExpdGVyYWwodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwibnVsbFwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc051bWVyaWNMaXRlcmFsKHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcIm51bWJlclwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc1B1bmN0dWF0b3IodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwicHVuY3R1YXRvclwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc1N0cmluZ0xpdGVyYWwodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwic3RyaW5nXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzUmVndWxhckV4cHJlc3Npb24odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwicmVndWxhckV4cHJlc3Npb25cIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNUZW1wbGF0ZSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJ0ZW1wbGF0ZVwiLCB2YWx1ZSk7XG4gIH1cblxuICBpc0RlbGltaXRlcih2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2goXCJkZWxpbWl0ZXJcIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNQYXJlbnModmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwicGFyZW5zXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzQnJhY2VzKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcImJyYWNlc1wiLCB2YWx1ZSk7XG4gIH1cblxuICBpc0JyYWNrZXRzKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRjaChcImJyYWNrZXRzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGlzU3ludGF4VGVtcGxhdGUodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwic3ludGF4VGVtcGxhdGVcIiwgdmFsdWUpO1xuICB9XG5cbiAgaXNFT0YodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoKFwiZW9mXCIsIHZhbHVlKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFwiZGVsaW1pdGVyXCIpKSB7XG4gICAgICByZXR1cm4gdGhpcy50b2tlbi5tYXAocyA9PiBzLnRvU3RyaW5nKCkpLmpvaW4oXCIgXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChcInN0cmluZ1wiKSkge1xuICAgICAgcmV0dXJuIFwiJ1wiICsgdGhpcy50b2tlbi5zdHI7XG4gICAgfVxuICAgIGlmICh0aGlzLm1hdGNoKFwidGVtcGxhdGVcIikpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50b2tlbi52YWx1ZTtcbiAgfVxufVxuIl19