"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _immutable = require("immutable");

var _terms = require("./terms");

var _terms2 = _interopRequireDefault(_terms);

var _scope = require("./scope");

var _applyScopeInParamsReducer = require("./apply-scope-in-params-reducer");

var _applyScopeInParamsReducer2 = _interopRequireDefault(_applyScopeInParamsReducer);

var _compiler = require("./compiler");

var _compiler2 = _interopRequireDefault(_compiler);

var _syntax = require("./syntax");

var _syntax2 = _interopRequireDefault(_syntax);

var _serializer = require("./serializer");

var _enforester = require("./enforester");

var _templateProcessor = require("./template-processor.js");

var _astDispatcher = require("./ast-dispatcher");

var _astDispatcher2 = _interopRequireDefault(_astDispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TermExpander extends _astDispatcher2.default {
  constructor(context) {
    super('expand', true);
    this.context = context;
  }

  expand(term) {
    return this.dispatch(term);
  }

  expandPragma(term) {
    return term;
  }

  expandTemplateExpression(term) {
    return new _terms2.default('TemplateExpression', {
      tag: term.tag == null ? null : this.expand(term.tag),
      elements: term.elements.toArray()
    });
  }

  expandBreakStatement(term) {
    return new _terms2.default('BreakStatement', {
      label: term.label ? term.label.val() : null
    });
  }

  expandDoWhileStatement(term) {
    return new _terms2.default('DoWhileStatement', {
      body: this.expand(term.body),
      test: this.expand(term.test)
    });
  }

  expandWithStatement(term) {
    return new _terms2.default('WithStatement', {
      body: this.expand(term.body),
      object: this.expand(term.object)
    });
  }

  expandDebuggerStatement(term) {
    return term;
  }

  expandContinueStatement(term) {
    return new _terms2.default('ContinueStatement', {
      label: term.label ? term.label.val() : null
    });
  }

  expandSwitchStatementWithDefault(term) {
    return new _terms2.default('SwitchStatementWithDefault', {
      discriminant: this.expand(term.discriminant),
      preDefaultCases: term.preDefaultCases.map(c => this.expand(c)).toArray(),
      defaultCase: this.expand(term.defaultCase),
      postDefaultCases: term.postDefaultCases.map(c => this.expand(c)).toArray()
    });
  }

  expandComputedMemberExpression(term) {
    return new _terms2.default('ComputedMemberExpression', {
      object: this.expand(term.object),
      expression: this.expand(term.expression)
    });
  }

  expandSwitchStatement(term) {
    return new _terms2.default('SwitchStatement', {
      discriminant: this.expand(term.discriminant),
      cases: term.cases.map(c => this.expand(c)).toArray()
    });
  }

  expandFormalParameters(term) {
    let rest = term.rest == null ? null : this.expand(term.rest);
    return new _terms2.default('FormalParameters', {
      items: term.items.map(i => this.expand(i)),
      rest: rest
    });
  }

  expandArrowExpression(term) {
    return this.doFunctionExpansion(term, 'ArrowExpression');
  }

  expandSwitchDefault(term) {
    return new _terms2.default('SwitchDefault', {
      consequent: term.consequent.map(c => this.expand(c)).toArray()
    });
  }

  expandSwitchCase(term) {
    return new _terms2.default('SwitchCase', {
      test: this.expand(term.test),
      consequent: term.consequent.map(c => this.expand(c)).toArray()
    });
  }

  expandForInStatement(term) {
    return new _terms2.default('ForInStatement', {
      left: this.expand(term.left),
      right: this.expand(term.right),
      body: this.expand(term.body)
    });
  }

  expandTryCatchStatement(term) {
    return new _terms2.default('TryCatchStatement', {
      body: this.expand(term.body),
      catchClause: this.expand(term.catchClause)
    });
  }

  expandTryFinallyStatement(term) {
    let catchClause = term.catchClause == null ? null : this.expand(term.catchClause);
    return new _terms2.default('TryFinallyStatement', {
      body: this.expand(term.body),
      catchClause: catchClause,
      finalizer: this.expand(term.finalizer)
    });
  }

  expandCatchClause(term) {
    return new _terms2.default('CatchClause', {
      binding: this.expand(term.binding),
      body: this.expand(term.body)
    });
  }

  expandThrowStatement(term) {
    return new _terms2.default('ThrowStatement', {
      expression: this.expand(term.expression)
    });
  }

  expandForOfStatement(term) {
    return new _terms2.default('ForOfStatement', {
      left: this.expand(term.left),
      right: this.expand(term.right),
      body: this.expand(term.body)
    });
  }

  expandBindingIdentifier(term) {
    return term;
  }

  expandBindingPropertyIdentifier(term) {
    return term;
  }
  expandBindingPropertyProperty(term) {
    return new _terms2.default('BindingPropertyProperty', {
      name: this.expand(term.name),
      binding: this.expand(term.binding)
    });
  }

  expandComputedPropertyName(term) {
    return new _terms2.default('ComputedPropertyName', {
      expression: this.expand(term.expression)
    });
  }

  expandObjectBinding(term) {
    return new _terms2.default('ObjectBinding', {
      properties: term.properties.map(t => this.expand(t)).toArray()
    });
  }

  expandArrayBinding(term) {
    let restElement = term.restElement == null ? null : this.expand(term.restElement);
    return new _terms2.default('ArrayBinding', {
      elements: term.elements.map(t => t == null ? null : this.expand(t)).toArray(),
      restElement: restElement
    });
  }

  expandBindingWithDefault(term) {
    return new _terms2.default('BindingWithDefault', {
      binding: this.expand(term.binding),
      init: this.expand(term.init)
    });
  }

  expandShorthandProperty(term) {
    // because hygiene, shorthand properties must turn into DataProperties
    return new _terms2.default('DataProperty', {
      name: new _terms2.default('StaticPropertyName', {
        value: term.name
      }),
      expression: new _terms2.default('IdentifierExpression', {
        name: term.name
      })
    });
  }

  expandForStatement(term) {
    let init = term.init == null ? null : this.expand(term.init);
    let test = term.test == null ? null : this.expand(term.test);
    let update = term.update == null ? null : this.expand(term.update);
    let body = this.expand(term.body);
    return new _terms2.default('ForStatement', { init: init, test: test, update: update, body: body });
  }

  expandYieldExpression(term) {
    let expr = term.expression == null ? null : this.expand(term.expression);
    return new _terms2.default('YieldExpression', {
      expression: expr
    });
  }

  expandYieldGeneratorExpression(term) {
    let expr = term.expression == null ? null : this.expand(term.expression);
    return new _terms2.default('YieldGeneratorExpression', {
      expression: expr
    });
  }

  expandWhileStatement(term) {
    return new _terms2.default('WhileStatement', {
      test: this.expand(term.test),
      body: this.expand(term.body)
    });
  }

  expandIfStatement(term) {
    let consequent = term.consequent == null ? null : this.expand(term.consequent);
    let alternate = term.alternate == null ? null : this.expand(term.alternate);
    return new _terms2.default('IfStatement', {
      test: this.expand(term.test),
      consequent: consequent,
      alternate: alternate
    });
  }

  expandBlockStatement(term) {
    return new _terms2.default('BlockStatement', {
      block: this.expand(term.block)
    });
  }

  expandBlock(term) {
    let scope = (0, _scope.freshScope)('block');
    this.context.currentScope.push(scope);
    let compiler = new _compiler2.default(this.context.phase, this.context.env, this.context.store, this.context);

    let markedBody, bodyTerm;
    markedBody = term.statements.map(b => b.addScope(scope, this.context.bindings, _syntax.ALL_PHASES));
    bodyTerm = new _terms2.default('Block', {
      statements: compiler.compile(markedBody)
    });
    this.context.currentScope.pop();
    return bodyTerm;
  }

  expandVariableDeclarationStatement(term) {
    return new _terms2.default('VariableDeclarationStatement', {
      declaration: this.expand(term.declaration)
    });
  }
  expandReturnStatement(term) {
    if (term.expression == null) {
      return term;
    }
    return new _terms2.default("ReturnStatement", {
      expression: this.expand(term.expression)
    });
  }

  expandClassDeclaration(term) {
    return new _terms2.default('ClassDeclaration', {
      name: term.name == null ? null : this.expand(term.name),
      super: term.super == null ? null : this.expand(term.super),
      elements: term.elements.map(el => this.expand(el)).toArray()
    });
  }

  expandClassExpression(term) {
    return new _terms2.default('ClassExpression', {
      name: term.name == null ? null : this.expand(term.name),
      super: term.super == null ? null : this.expand(term.super),
      elements: term.elements.map(el => this.expand(el)).toArray()
    });
  }

  expandClassElement(term) {
    return new _terms2.default('ClassElement', {
      isStatic: term.isStatic,
      method: this.expand(term.method)
    });
  }

  expandThisExpression(term) {
    return term;
  }

  expandSyntaxTemplate(term) {
    let r = (0, _templateProcessor.processTemplate)(term.template.inner());
    let str = _syntax2.default.from("string", _serializer.serializer.write(r.template));
    let callee = new _terms2.default('IdentifierExpression', { name: _syntax2.default.from("identifier", 'syntaxTemplate') });

    let expandedInterps = r.interp.map(i => {
      let enf = new _enforester.Enforester(i, (0, _immutable.List)(), this.context);
      return this.expand(enf.enforest('expression'));
    });

    let args = _immutable.List.of(new _terms2.default('LiteralStringExpression', { value: str })).concat(expandedInterps);

    return new _terms2.default('CallExpression', {
      callee: callee, arguments: args
    });
  }

  expandSyntaxQuote(term) {
    let str = new _terms2.default("LiteralStringExpression", {
      value: _syntax2.default.from("string", _serializer.serializer.write(term.name))
    });

    return new _terms2.default("TemplateExpression", {
      tag: term.template.tag,
      elements: term.template.elements.push(str).push(new _terms2.default('TemplateElement', {
        rawValue: ''
      })).toArray()
    });
  }

  expandStaticMemberExpression(term) {
    return new _terms2.default("StaticMemberExpression", {
      object: this.expand(term.object),
      property: term.property
    });
  }

  expandArrayExpression(term) {
    return new _terms2.default("ArrayExpression", {
      elements: term.elements.map(t => t == null ? t : this.expand(t))
    });
  }

  expandImport(term) {
    return term;
  }

  expandImportNamespace(term) {
    return term;
  }

  expandExport(term) {
    return new _terms2.default('Export', {
      declaration: this.expand(term.declaration)
    });
  }

  expandExportDefault(term) {
    return new _terms2.default('ExportDefault', {
      body: this.expand(term.body)
    });
  }

  expandExportFrom(term) {
    return term;
  }

  expandExportAllFrom(term) {
    return term;
  }

  expandExportSpecifier(term) {
    return term;
  }

  expandStaticPropertyName(term) {
    return term;
  }

  expandDataProperty(term) {
    return new _terms2.default("DataProperty", {
      name: this.expand(term.name),
      expression: this.expand(term.expression)
    });
  }

  expandObjectExpression(term) {
    return new _terms2.default("ObjectExpression", {
      properties: term.properties.map(t => this.expand(t))
    });
  }

  expandVariableDeclarator(term) {
    let init = term.init == null ? null : this.expand(term.init);
    return new _terms2.default("VariableDeclarator", {
      binding: this.expand(term.binding),
      init: init
    });
  }

  expandVariableDeclaration(term) {
    if (term.kind === 'syntax' || term.kind === 'syntaxrec') {
      return term;
    }
    return new _terms2.default("VariableDeclaration", {
      kind: term.kind,
      declarators: term.declarators.map(d => this.expand(d))
    });
  }

  expandParenthesizedExpression(term) {
    if (term.inner.size === 0) {
      throw new Error("unexpected end of input");
    }
    let enf = new _enforester.Enforester(term.inner, (0, _immutable.List)(), this.context);
    let lookahead = enf.peek();
    let t = enf.enforestExpression();
    if (t == null || enf.rest.size > 0) {
      throw enf.createError(lookahead, "unexpected syntax");
    }
    return this.expand(t);
  }

  expandUnaryExpression(term) {
    return new _terms2.default('UnaryExpression', {
      operator: term.operator,
      operand: this.expand(term.operand)
    });
  }

  expandUpdateExpression(term) {
    return new _terms2.default('UpdateExpression', {
      isPrefix: term.isPrefix,
      operator: term.operator,
      operand: this.expand(term.operand)
    });
  }

  expandBinaryExpression(term) {
    let left = this.expand(term.left);
    let right = this.expand(term.right);
    return new _terms2.default("BinaryExpression", {
      left: left,
      operator: term.operator,
      right: right
    });
  }

  expandConditionalExpression(term) {
    return new _terms2.default('ConditionalExpression', {
      test: this.expand(term.test),
      consequent: this.expand(term.consequent),
      alternate: this.expand(term.alternate)
    });
  }

  expandNewTargetExpression(term) {
    return term;
  }

  expandNewExpression(term) {
    let callee = this.expand(term.callee);
    let enf = new _enforester.Enforester(term.arguments, (0, _immutable.List)(), this.context);
    let args = enf.enforestArgumentList().map(arg => this.expand(arg));
    return new _terms2.default('NewExpression', {
      callee: callee,
      arguments: args.toArray()
    });
  }

  expandSuper(term) {
    return term;
  }

  expandCallExpression(term) {
    let callee = this.expand(term.callee);
    let enf = new _enforester.Enforester(term.arguments, (0, _immutable.List)(), this.context);
    let args = enf.enforestArgumentList().map(arg => this.expand(arg));
    return new _terms2.default("CallExpression", {
      callee: callee,
      arguments: args
    });
  }

  expandSpreadElement(term) {
    return new _terms2.default('SpreadElement', {
      expression: this.expand(term.expression)
    });
  }

  expandExpressionStatement(term) {
    let child = this.expand(term.expression);
    return new _terms2.default("ExpressionStatement", {
      expression: child
    });
  }

  expandLabeledStatement(term) {
    return new _terms2.default('LabeledStatement', {
      label: term.label.val(),
      body: this.expand(term.body)
    });
  }

  doFunctionExpansion(term, type) {
    let scope = (0, _scope.freshScope)("fun");
    let red = new _applyScopeInParamsReducer2.default(scope, this.context);
    let params;
    if (type !== 'Getter' && type !== 'Setter') {
      params = red.transform(term.params);
      params = this.expand(params);
    }
    this.context.currentScope.push(scope);
    let compiler = new _compiler2.default(this.context.phase, this.context.env, this.context.store, this.context);

    let markedBody, bodyTerm;
    if (term.body instanceof _terms2.default) {
      // Arrow functions have a single term as their body
      bodyTerm = this.expand(term.body.addScope(scope, this.context.bindings, _syntax.ALL_PHASES));
    } else {
      markedBody = term.body.map(b => b.addScope(scope, this.context.bindings, _syntax.ALL_PHASES));
      bodyTerm = new _terms2.default("FunctionBody", {
        directives: (0, _immutable.List)(),
        statements: compiler.compile(markedBody)
      });
    }
    this.context.currentScope.pop();

    if (type === 'Getter') {
      return new _terms2.default(type, {
        name: this.expand(term.name),
        body: bodyTerm
      });
    } else if (type === 'Setter') {
      return new _terms2.default(type, {
        name: this.expand(term.name),
        param: term.param,
        body: bodyTerm
      });
    } else if (type === 'ArrowExpression') {
      return new _terms2.default(type, {
        params: params,
        body: bodyTerm
      });
    }
    return new _terms2.default(type, {
      name: term.name,
      isGenerator: term.isGenerator,
      params: params,
      body: bodyTerm
    });
  }

  expandMethod(term) {
    return this.doFunctionExpansion(term, 'Method');
  }

  expandSetter(term) {
    return this.doFunctionExpansion(term, 'Setter');
  }

  expandGetter(term) {
    return this.doFunctionExpansion(term, 'Getter');
  }

  expandFunctionDeclaration(term) {
    return this.doFunctionExpansion(term, "FunctionDeclaration");
  }

  expandFunctionExpression(term) {
    return this.doFunctionExpansion(term, "FunctionExpression");
  }

  expandCompoundAssignmentExpression(term) {
    return new _terms2.default("CompoundAssignmentExpression", {
      binding: this.expand(term.binding),
      operator: term.operator,
      expression: this.expand(term.expression)
    });
  }

  expandAssignmentExpression(term) {
    return new _terms2.default("AssignmentExpression", {
      binding: this.expand(term.binding),
      expression: this.expand(term.expression)
    });
  }

  expandEmptyStatement(term) {
    return term;
  }

  expandLiteralBooleanExpression(term) {
    return term;
  }

  expandLiteralNumericExpression(term) {
    return term;
  }
  expandLiteralInfinityExpression(term) {
    return term;
  }

  expandIdentifierExpression(term) {
    let trans = this.context.env.get(term.name.resolve(this.context.phase));
    if (trans) {
      return new _terms2.default("IdentifierExpression", {
        name: trans.id
      });
    }
    return term;
  }

  expandLiteralNullExpression(term) {
    return term;
  }

  expandLiteralStringExpression(term) {
    return term;
  }

  expandLiteralRegExpExpression(term) {
    return term;
  }
}
exports.default = TermExpander;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXJtLWV4cGFuZGVyLmpzIl0sIm5hbWVzIjpbIlRlcm1FeHBhbmRlciIsImNvbnN0cnVjdG9yIiwiY29udGV4dCIsImV4cGFuZCIsInRlcm0iLCJkaXNwYXRjaCIsImV4cGFuZFByYWdtYSIsImV4cGFuZFRlbXBsYXRlRXhwcmVzc2lvbiIsInRhZyIsImVsZW1lbnRzIiwidG9BcnJheSIsImV4cGFuZEJyZWFrU3RhdGVtZW50IiwibGFiZWwiLCJ2YWwiLCJleHBhbmREb1doaWxlU3RhdGVtZW50IiwiYm9keSIsInRlc3QiLCJleHBhbmRXaXRoU3RhdGVtZW50Iiwib2JqZWN0IiwiZXhwYW5kRGVidWdnZXJTdGF0ZW1lbnQiLCJleHBhbmRDb250aW51ZVN0YXRlbWVudCIsImV4cGFuZFN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0IiwiZGlzY3JpbWluYW50IiwicHJlRGVmYXVsdENhc2VzIiwibWFwIiwiYyIsImRlZmF1bHRDYXNlIiwicG9zdERlZmF1bHRDYXNlcyIsImV4cGFuZENvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbiIsImV4cHJlc3Npb24iLCJleHBhbmRTd2l0Y2hTdGF0ZW1lbnQiLCJjYXNlcyIsImV4cGFuZEZvcm1hbFBhcmFtZXRlcnMiLCJyZXN0IiwiaXRlbXMiLCJpIiwiZXhwYW5kQXJyb3dFeHByZXNzaW9uIiwiZG9GdW5jdGlvbkV4cGFuc2lvbiIsImV4cGFuZFN3aXRjaERlZmF1bHQiLCJjb25zZXF1ZW50IiwiZXhwYW5kU3dpdGNoQ2FzZSIsImV4cGFuZEZvckluU3RhdGVtZW50IiwibGVmdCIsInJpZ2h0IiwiZXhwYW5kVHJ5Q2F0Y2hTdGF0ZW1lbnQiLCJjYXRjaENsYXVzZSIsImV4cGFuZFRyeUZpbmFsbHlTdGF0ZW1lbnQiLCJmaW5hbGl6ZXIiLCJleHBhbmRDYXRjaENsYXVzZSIsImJpbmRpbmciLCJleHBhbmRUaHJvd1N0YXRlbWVudCIsImV4cGFuZEZvck9mU3RhdGVtZW50IiwiZXhwYW5kQmluZGluZ0lkZW50aWZpZXIiLCJleHBhbmRCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyIiwiZXhwYW5kQmluZGluZ1Byb3BlcnR5UHJvcGVydHkiLCJuYW1lIiwiZXhwYW5kQ29tcHV0ZWRQcm9wZXJ0eU5hbWUiLCJleHBhbmRPYmplY3RCaW5kaW5nIiwicHJvcGVydGllcyIsInQiLCJleHBhbmRBcnJheUJpbmRpbmciLCJyZXN0RWxlbWVudCIsImV4cGFuZEJpbmRpbmdXaXRoRGVmYXVsdCIsImluaXQiLCJleHBhbmRTaG9ydGhhbmRQcm9wZXJ0eSIsInZhbHVlIiwiZXhwYW5kRm9yU3RhdGVtZW50IiwidXBkYXRlIiwiZXhwYW5kWWllbGRFeHByZXNzaW9uIiwiZXhwciIsImV4cGFuZFlpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbiIsImV4cGFuZFdoaWxlU3RhdGVtZW50IiwiZXhwYW5kSWZTdGF0ZW1lbnQiLCJhbHRlcm5hdGUiLCJleHBhbmRCbG9ja1N0YXRlbWVudCIsImJsb2NrIiwiZXhwYW5kQmxvY2siLCJzY29wZSIsImN1cnJlbnRTY29wZSIsInB1c2giLCJjb21waWxlciIsInBoYXNlIiwiZW52Iiwic3RvcmUiLCJtYXJrZWRCb2R5IiwiYm9keVRlcm0iLCJzdGF0ZW1lbnRzIiwiYiIsImFkZFNjb3BlIiwiYmluZGluZ3MiLCJjb21waWxlIiwicG9wIiwiZXhwYW5kVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCIsImRlY2xhcmF0aW9uIiwiZXhwYW5kUmV0dXJuU3RhdGVtZW50IiwiZXhwYW5kQ2xhc3NEZWNsYXJhdGlvbiIsInN1cGVyIiwiZWwiLCJleHBhbmRDbGFzc0V4cHJlc3Npb24iLCJleHBhbmRDbGFzc0VsZW1lbnQiLCJpc1N0YXRpYyIsIm1ldGhvZCIsImV4cGFuZFRoaXNFeHByZXNzaW9uIiwiZXhwYW5kU3ludGF4VGVtcGxhdGUiLCJyIiwidGVtcGxhdGUiLCJpbm5lciIsInN0ciIsImZyb20iLCJ3cml0ZSIsImNhbGxlZSIsImV4cGFuZGVkSW50ZXJwcyIsImludGVycCIsImVuZiIsImVuZm9yZXN0IiwiYXJncyIsIm9mIiwiY29uY2F0IiwiYXJndW1lbnRzIiwiZXhwYW5kU3ludGF4UXVvdGUiLCJyYXdWYWx1ZSIsImV4cGFuZFN0YXRpY01lbWJlckV4cHJlc3Npb24iLCJwcm9wZXJ0eSIsImV4cGFuZEFycmF5RXhwcmVzc2lvbiIsImV4cGFuZEltcG9ydCIsImV4cGFuZEltcG9ydE5hbWVzcGFjZSIsImV4cGFuZEV4cG9ydCIsImV4cGFuZEV4cG9ydERlZmF1bHQiLCJleHBhbmRFeHBvcnRGcm9tIiwiZXhwYW5kRXhwb3J0QWxsRnJvbSIsImV4cGFuZEV4cG9ydFNwZWNpZmllciIsImV4cGFuZFN0YXRpY1Byb3BlcnR5TmFtZSIsImV4cGFuZERhdGFQcm9wZXJ0eSIsImV4cGFuZE9iamVjdEV4cHJlc3Npb24iLCJleHBhbmRWYXJpYWJsZURlY2xhcmF0b3IiLCJleHBhbmRWYXJpYWJsZURlY2xhcmF0aW9uIiwia2luZCIsImRlY2xhcmF0b3JzIiwiZCIsImV4cGFuZFBhcmVudGhlc2l6ZWRFeHByZXNzaW9uIiwic2l6ZSIsIkVycm9yIiwibG9va2FoZWFkIiwicGVlayIsImVuZm9yZXN0RXhwcmVzc2lvbiIsImNyZWF0ZUVycm9yIiwiZXhwYW5kVW5hcnlFeHByZXNzaW9uIiwib3BlcmF0b3IiLCJvcGVyYW5kIiwiZXhwYW5kVXBkYXRlRXhwcmVzc2lvbiIsImlzUHJlZml4IiwiZXhwYW5kQmluYXJ5RXhwcmVzc2lvbiIsImV4cGFuZENvbmRpdGlvbmFsRXhwcmVzc2lvbiIsImV4cGFuZE5ld1RhcmdldEV4cHJlc3Npb24iLCJleHBhbmROZXdFeHByZXNzaW9uIiwiZW5mb3Jlc3RBcmd1bWVudExpc3QiLCJhcmciLCJleHBhbmRTdXBlciIsImV4cGFuZENhbGxFeHByZXNzaW9uIiwiZXhwYW5kU3ByZWFkRWxlbWVudCIsImV4cGFuZEV4cHJlc3Npb25TdGF0ZW1lbnQiLCJjaGlsZCIsImV4cGFuZExhYmVsZWRTdGF0ZW1lbnQiLCJ0eXBlIiwicmVkIiwicGFyYW1zIiwidHJhbnNmb3JtIiwiZGlyZWN0aXZlcyIsInBhcmFtIiwiaXNHZW5lcmF0b3IiLCJleHBhbmRNZXRob2QiLCJleHBhbmRTZXR0ZXIiLCJleHBhbmRHZXR0ZXIiLCJleHBhbmRGdW5jdGlvbkRlY2xhcmF0aW9uIiwiZXhwYW5kRnVuY3Rpb25FeHByZXNzaW9uIiwiZXhwYW5kQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbiIsImV4cGFuZEFzc2lnbm1lbnRFeHByZXNzaW9uIiwiZXhwYW5kRW1wdHlTdGF0ZW1lbnQiLCJleHBhbmRMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24iLCJleHBhbmRMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24iLCJleHBhbmRMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uIiwiZXhwYW5kSWRlbnRpZmllckV4cHJlc3Npb24iLCJ0cmFucyIsImdldCIsInJlc29sdmUiLCJpZCIsImV4cGFuZExpdGVyYWxOdWxsRXhwcmVzc2lvbiIsImV4cGFuZExpdGVyYWxTdHJpbmdFeHByZXNzaW9uIiwiZXhwYW5kTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVlLE1BQU1BLFlBQU4saUNBQXlDO0FBQ3REQyxjQUFZQyxPQUFaLEVBQXFCO0FBQ25CLFVBQU0sUUFBTixFQUFnQixJQUFoQjtBQUNBLFNBQUtBLE9BQUwsR0FBZUEsT0FBZjtBQUNEOztBQUVEQyxTQUFPQyxJQUFQLEVBQWE7QUFDWCxXQUFPLEtBQUtDLFFBQUwsQ0FBY0QsSUFBZCxDQUFQO0FBQ0Q7O0FBRURFLGVBQWFGLElBQWIsRUFBbUI7QUFDakIsV0FBT0EsSUFBUDtBQUNEOztBQUVERywyQkFBeUJILElBQXpCLEVBQStCO0FBQzdCLFdBQU8sb0JBQVMsb0JBQVQsRUFBK0I7QUFDcENJLFdBQUtKLEtBQUtJLEdBQUwsSUFBWSxJQUFaLEdBQW1CLElBQW5CLEdBQTBCLEtB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QSxJQUFQO0FBQ0Q7QUExbUJxRDtrQkFBbkNKLFkiLCJmaWxlIjoidGVybS1leHBhbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExpc3QgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IFRlcm0gZnJvbSBcIi4vdGVybXNcIjtcbmltcG9ydCB7IGZyZXNoU2NvcGUgfSBmcm9tIFwiLi9zY29wZVwiO1xuaW1wb3J0IEFwcGx5U2NvcGVJblBhcmFtc1JlZHVjZXIgZnJvbSBcIi4vYXBwbHktc2NvcGUtaW4tcGFyYW1zLXJlZHVjZXJcIjtcbmltcG9ydCBDb21waWxlciBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCBTeW50YXgsIHsgQUxMX1BIQVNFUyB9IGZyb20gXCIuL3N5bnRheFwiO1xuaW1wb3J0IHsgc2VyaWFsaXplciB9IGZyb20gXCIuL3NlcmlhbGl6ZXJcIjtcbmltcG9ydCB7IEVuZm9yZXN0ZXIgfSBmcm9tIFwiLi9lbmZvcmVzdGVyXCI7XG5pbXBvcnQgeyBwcm9jZXNzVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlLXByb2Nlc3Nvci5qcyc7XG5pbXBvcnQgQVNURGlzcGF0Y2hlciBmcm9tICcuL2FzdC1kaXNwYXRjaGVyJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVybUV4cGFuZGVyIGV4dGVuZHMgQVNURGlzcGF0Y2hlciB7XG4gIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICBzdXBlcignZXhwYW5kJywgdHJ1ZSk7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIGV4cGFuZCh0ZXJtKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2godGVybSk7XG4gIH1cblxuICBleHBhbmRQcmFnbWEodGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kVGVtcGxhdGVFeHByZXNzaW9uKHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ1RlbXBsYXRlRXhwcmVzc2lvbicsIHtcbiAgICAgIHRhZzogdGVybS50YWcgPT0gbnVsbCA/IG51bGwgOiB0aGlzLmV4cGFuZCh0ZXJtLnRhZyksXG4gICAgICBlbGVtZW50czogdGVybS5lbGVtZW50cy50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZEJyZWFrU3RhdGVtZW50KHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0JyZWFrU3RhdGVtZW50Jywge1xuICAgICAgbGFiZWw6IHRlcm0ubGFiZWwgPyB0ZXJtLmxhYmVsLnZhbCgpIDogbnVsbFxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kRG9XaGlsZVN0YXRlbWVudCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdEb1doaWxlU3RhdGVtZW50Jywge1xuICAgICAgYm9keTogdGhpcy5leHBhbmQodGVybS5ib2R5KSxcbiAgICAgIHRlc3Q6IHRoaXMuZXhwYW5kKHRlcm0udGVzdClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFdpdGhTdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnV2l0aFN0YXRlbWVudCcsIHtcbiAgICAgIGJvZHk6IHRoaXMuZXhwYW5kKHRlcm0uYm9keSksXG4gICAgICBvYmplY3Q6IHRoaXMuZXhwYW5kKHRlcm0ub2JqZWN0KVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kRGVidWdnZXJTdGF0ZW1lbnQodGVybSkgeyByZXR1cm4gdGVybTt9XG5cbiAgZXhwYW5kQ29udGludWVTdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQ29udGludWVTdGF0ZW1lbnQnLCB7XG4gICAgICBsYWJlbDogdGVybS5sYWJlbCA/IHRlcm0ubGFiZWwudmFsKCkgOiBudWxsXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdCcsIHtcbiAgICAgIGRpc2NyaW1pbmFudDogdGhpcy5leHBhbmQodGVybS5kaXNjcmltaW5hbnQpLFxuICAgICAgcHJlRGVmYXVsdENhc2VzOiB0ZXJtLnByZURlZmF1bHRDYXNlcy5tYXAoYyA9PiB0aGlzLmV4cGFuZChjKSkudG9BcnJheSgpLFxuICAgICAgZGVmYXVsdENhc2U6IHRoaXMuZXhwYW5kKHRlcm0uZGVmYXVsdENhc2UpLFxuICAgICAgcG9zdERlZmF1bHRDYXNlczogdGVybS5wb3N0RGVmYXVsdENhc2VzLm1hcChjID0+IHRoaXMuZXhwYW5kKGMpKS50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZENvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdDb21wdXRlZE1lbWJlckV4cHJlc3Npb24nLCB7XG4gICAgICBvYmplY3Q6IHRoaXMuZXhwYW5kKHRlcm0ub2JqZWN0KSxcbiAgICAgIGV4cHJlc3Npb246IHRoaXMuZXhwYW5kKHRlcm0uZXhwcmVzc2lvbilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFN3aXRjaFN0YXRlbWVudCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdTd2l0Y2hTdGF0ZW1lbnQnLCB7XG4gICAgICBkaXNjcmltaW5hbnQ6IHRoaXMuZXhwYW5kKHRlcm0uZGlzY3JpbWluYW50KSxcbiAgICAgIGNhc2VzOiB0ZXJtLmNhc2VzLm1hcChjID0+IHRoaXMuZXhwYW5kKGMpKS50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZEZvcm1hbFBhcmFtZXRlcnModGVybSkge1xuICAgIGxldCByZXN0ID0gdGVybS5yZXN0ID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5yZXN0KTtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0Zvcm1hbFBhcmFtZXRlcnMnLCB7XG4gICAgICBpdGVtczogdGVybS5pdGVtcy5tYXAoaSA9PiB0aGlzLmV4cGFuZChpKSksXG4gICAgICByZXN0XG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRBcnJvd0V4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiB0aGlzLmRvRnVuY3Rpb25FeHBhbnNpb24odGVybSwgJ0Fycm93RXhwcmVzc2lvbicpO1xuICB9XG5cbiAgZXhwYW5kU3dpdGNoRGVmYXVsdCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdTd2l0Y2hEZWZhdWx0Jywge1xuICAgICAgY29uc2VxdWVudDogdGVybS5jb25zZXF1ZW50Lm1hcChjID0+IHRoaXMuZXhwYW5kKGMpKS50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFN3aXRjaENhc2UodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnU3dpdGNoQ2FzZScsIHtcbiAgICAgIHRlc3Q6IHRoaXMuZXhwYW5kKHRlcm0udGVzdCksXG4gICAgICBjb25zZXF1ZW50OiB0ZXJtLmNvbnNlcXVlbnQubWFwKGMgPT4gdGhpcy5leHBhbmQoYykpLnRvQXJyYXkoKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kRm9ySW5TdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnRm9ySW5TdGF0ZW1lbnQnLCB7XG4gICAgICBsZWZ0OiB0aGlzLmV4cGFuZCh0ZXJtLmxlZnQpLFxuICAgICAgcmlnaHQ6IHRoaXMuZXhwYW5kKHRlcm0ucmlnaHQpLFxuICAgICAgYm9keTogdGhpcy5leHBhbmQodGVybS5ib2R5KVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kVHJ5Q2F0Y2hTdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnVHJ5Q2F0Y2hTdGF0ZW1lbnQnLCB7XG4gICAgICBib2R5OiB0aGlzLmV4cGFuZCh0ZXJtLmJvZHkpLFxuICAgICAgY2F0Y2hDbGF1c2U6IHRoaXMuZXhwYW5kKHRlcm0uY2F0Y2hDbGF1c2UpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRUcnlGaW5hbGx5U3RhdGVtZW50KHRlcm0pIHtcbiAgICBsZXQgY2F0Y2hDbGF1c2UgPSB0ZXJtLmNhdGNoQ2xhdXNlID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5jYXRjaENsYXVzZSk7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdUcnlGaW5hbGx5U3RhdGVtZW50Jywge1xuICAgICAgYm9keTogdGhpcy5leHBhbmQodGVybS5ib2R5KSxcbiAgICAgIGNhdGNoQ2xhdXNlLFxuICAgICAgZmluYWxpemVyOiB0aGlzLmV4cGFuZCh0ZXJtLmZpbmFsaXplcilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZENhdGNoQ2xhdXNlKHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0NhdGNoQ2xhdXNlJywge1xuICAgICAgYmluZGluZzogdGhpcy5leHBhbmQodGVybS5iaW5kaW5nKSxcbiAgICAgIGJvZHk6IHRoaXMuZXhwYW5kKHRlcm0uYm9keSlcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFRocm93U3RhdGVtZW50KHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ1Rocm93U3RhdGVtZW50Jywge1xuICAgICAgZXhwcmVzc2lvbjogdGhpcy5leHBhbmQodGVybS5leHByZXNzaW9uKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kRm9yT2ZTdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnRm9yT2ZTdGF0ZW1lbnQnLCB7XG4gICAgICBsZWZ0OiB0aGlzLmV4cGFuZCh0ZXJtLmxlZnQpLFxuICAgICAgcmlnaHQ6IHRoaXMuZXhwYW5kKHRlcm0ucmlnaHQpLFxuICAgICAgYm9keTogdGhpcy5leHBhbmQodGVybS5ib2R5KVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kQmluZGluZ0lkZW50aWZpZXIodGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcih0ZXJtKSB7XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cbiAgZXhwYW5kQmluZGluZ1Byb3BlcnR5UHJvcGVydHkodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQmluZGluZ1Byb3BlcnR5UHJvcGVydHknLCB7XG4gICAgICBuYW1lOiB0aGlzLmV4cGFuZCh0ZXJtLm5hbWUpLFxuICAgICAgYmluZGluZzogdGhpcy5leHBhbmQodGVybS5iaW5kaW5nKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kQ29tcHV0ZWRQcm9wZXJ0eU5hbWUodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQ29tcHV0ZWRQcm9wZXJ0eU5hbWUnLCB7XG4gICAgICBleHByZXNzaW9uOiB0aGlzLmV4cGFuZCh0ZXJtLmV4cHJlc3Npb24pXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRPYmplY3RCaW5kaW5nKHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ09iamVjdEJpbmRpbmcnLCB7XG4gICAgICBwcm9wZXJ0aWVzOiB0ZXJtLnByb3BlcnRpZXMubWFwKHQgPT4gdGhpcy5leHBhbmQodCkpLnRvQXJyYXkoKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kQXJyYXlCaW5kaW5nKHRlcm0pIHtcbiAgICBsZXQgcmVzdEVsZW1lbnQgPSB0ZXJtLnJlc3RFbGVtZW50ID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5yZXN0RWxlbWVudCk7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdBcnJheUJpbmRpbmcnLCB7XG4gICAgICBlbGVtZW50czogdGVybS5lbGVtZW50cy5tYXAodCA9PiB0ID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodCkpLnRvQXJyYXkoKSxcbiAgICAgIHJlc3RFbGVtZW50XG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRCaW5kaW5nV2l0aERlZmF1bHQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQmluZGluZ1dpdGhEZWZhdWx0Jywge1xuICAgICAgYmluZGluZzogdGhpcy5leHBhbmQodGVybS5iaW5kaW5nKSxcbiAgICAgIGluaXQ6IHRoaXMuZXhwYW5kKHRlcm0uaW5pdClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFNob3J0aGFuZFByb3BlcnR5KHRlcm0pIHtcbiAgICAvLyBiZWNhdXNlIGh5Z2llbmUsIHNob3J0aGFuZCBwcm9wZXJ0aWVzIG11c3QgdHVybiBpbnRvIERhdGFQcm9wZXJ0aWVzXG4gICAgcmV0dXJuIG5ldyBUZXJtKCdEYXRhUHJvcGVydHknLCB7XG4gICAgICBuYW1lOiBuZXcgVGVybSgnU3RhdGljUHJvcGVydHlOYW1lJywge1xuICAgICAgICB2YWx1ZTogdGVybS5uYW1lXG4gICAgICB9KSxcbiAgICAgIGV4cHJlc3Npb246IG5ldyBUZXJtKCdJZGVudGlmaWVyRXhwcmVzc2lvbicsIHtcbiAgICAgICAgbmFtZTogdGVybS5uYW1lXG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cblxuICBleHBhbmRGb3JTdGF0ZW1lbnQodGVybSkge1xuICAgIGxldCBpbml0ID0gdGVybS5pbml0ID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5pbml0KTtcbiAgICBsZXQgdGVzdCA9IHRlcm0udGVzdCA9PSBudWxsID8gbnVsbCA6IHRoaXMuZXhwYW5kKHRlcm0udGVzdCk7XG4gICAgbGV0IHVwZGF0ZSA9IHRlcm0udXBkYXRlID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS51cGRhdGUpO1xuICAgIGxldCBib2R5ID0gdGhpcy5leHBhbmQodGVybS5ib2R5KTtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0ZvclN0YXRlbWVudCcsIHsgaW5pdCwgdGVzdCwgdXBkYXRlLCBib2R5IH0pO1xuICB9XG5cbiAgZXhwYW5kWWllbGRFeHByZXNzaW9uKHRlcm0pIHtcbiAgICBsZXQgZXhwciA9IHRlcm0uZXhwcmVzc2lvbiA9PSBudWxsID8gbnVsbCA6IHRoaXMuZXhwYW5kKHRlcm0uZXhwcmVzc2lvbik7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdZaWVsZEV4cHJlc3Npb24nLCB7XG4gICAgICBleHByZXNzaW9uOiBleHByXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24odGVybSkge1xuICAgIGxldCBleHByID0gdGVybS5leHByZXNzaW9uID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5leHByZXNzaW9uKTtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ1lpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbicsIHtcbiAgICAgIGV4cHJlc3Npb246IGV4cHJcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFdoaWxlU3RhdGVtZW50KHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ1doaWxlU3RhdGVtZW50Jywge1xuICAgICAgdGVzdDogdGhpcy5leHBhbmQodGVybS50ZXN0KSxcbiAgICAgIGJvZHk6IHRoaXMuZXhwYW5kKHRlcm0uYm9keSlcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZElmU3RhdGVtZW50KHRlcm0pIHtcbiAgICBsZXQgY29uc2VxdWVudCA9IHRlcm0uY29uc2VxdWVudCA9PSBudWxsID8gbnVsbCA6IHRoaXMuZXhwYW5kKHRlcm0uY29uc2VxdWVudCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IHRlcm0uYWx0ZXJuYXRlID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5hbHRlcm5hdGUpO1xuICAgIHJldHVybiBuZXcgVGVybSgnSWZTdGF0ZW1lbnQnLCB7XG4gICAgICB0ZXN0OiB0aGlzLmV4cGFuZCh0ZXJtLnRlc3QpLFxuICAgICAgY29uc2VxdWVudDogY29uc2VxdWVudCxcbiAgICAgIGFsdGVybmF0ZTogYWx0ZXJuYXRlXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRCbG9ja1N0YXRlbWVudCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdCbG9ja1N0YXRlbWVudCcsIHtcbiAgICAgIGJsb2NrOiB0aGlzLmV4cGFuZCh0ZXJtLmJsb2NrKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kQmxvY2sodGVybSkge1xuICAgIGxldCBzY29wZSA9IGZyZXNoU2NvcGUoJ2Jsb2NrJyk7XG4gICAgdGhpcy5jb250ZXh0LmN1cnJlbnRTY29wZS5wdXNoKHNjb3BlKTtcbiAgICBsZXQgY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIodGhpcy5jb250ZXh0LnBoYXNlLCB0aGlzLmNvbnRleHQuZW52LCB0aGlzLmNvbnRleHQuc3RvcmUsIHRoaXMuY29udGV4dCk7XG5cbiAgICBsZXQgbWFya2VkQm9keSwgYm9keVRlcm07XG4gICAgbWFya2VkQm9keSA9IHRlcm0uc3RhdGVtZW50cy5tYXAoYiA9PiBiLmFkZFNjb3BlKHNjb3BlLCB0aGlzLmNvbnRleHQuYmluZGluZ3MsIEFMTF9QSEFTRVMpKTtcbiAgICBib2R5VGVybSA9IG5ldyBUZXJtKCdCbG9jaycsIHtcbiAgICAgIHN0YXRlbWVudHM6IGNvbXBpbGVyLmNvbXBpbGUobWFya2VkQm9keSlcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRleHQuY3VycmVudFNjb3BlLnBvcCgpO1xuICAgIHJldHVybiBib2R5VGVybTtcbiAgfVxuXG4gIGV4cGFuZFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCcsIHtcbiAgICAgIGRlY2xhcmF0aW9uOiB0aGlzLmV4cGFuZCh0ZXJtLmRlY2xhcmF0aW9uKVxuICAgIH0pO1xuICB9XG4gIGV4cGFuZFJldHVyblN0YXRlbWVudCh0ZXJtKSB7XG4gICAgaWYgKHRlcm0uZXhwcmVzc2lvbiA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGVybTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiUmV0dXJuU3RhdGVtZW50XCIsIHtcbiAgICAgIGV4cHJlc3Npb246IHRoaXMuZXhwYW5kKHRlcm0uZXhwcmVzc2lvbilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZENsYXNzRGVjbGFyYXRpb24odGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQ2xhc3NEZWNsYXJhdGlvbicsIHtcbiAgICAgIG5hbWU6IHRlcm0ubmFtZSA9PSBudWxsID8gbnVsbCA6IHRoaXMuZXhwYW5kKHRlcm0ubmFtZSksXG4gICAgICBzdXBlcjogdGVybS5zdXBlciA9PSBudWxsID8gbnVsbCA6IHRoaXMuZXhwYW5kKHRlcm0uc3VwZXIpLFxuICAgICAgZWxlbWVudHM6IHRlcm0uZWxlbWVudHMubWFwKGVsID0+IHRoaXMuZXhwYW5kKGVsKSkudG9BcnJheSgpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRDbGFzc0V4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnQ2xhc3NFeHByZXNzaW9uJywge1xuICAgICAgbmFtZTogdGVybS5uYW1lID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5uYW1lKSxcbiAgICAgIHN1cGVyOiB0ZXJtLnN1cGVyID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5zdXBlciksXG4gICAgICBlbGVtZW50czogdGVybS5lbGVtZW50cy5tYXAoZWwgPT4gdGhpcy5leHBhbmQoZWwpKS50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZENsYXNzRWxlbWVudCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdDbGFzc0VsZW1lbnQnLCB7XG4gICAgICBpc1N0YXRpYzogdGVybS5pc1N0YXRpYyxcbiAgICAgIG1ldGhvZDogdGhpcy5leHBhbmQodGVybS5tZXRob2QpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRUaGlzRXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cblxuICBleHBhbmRTeW50YXhUZW1wbGF0ZSh0ZXJtKSB7XG4gICAgbGV0IHIgPSBwcm9jZXNzVGVtcGxhdGUodGVybS50ZW1wbGF0ZS5pbm5lcigpKTtcbiAgICBsZXQgc3RyID0gU3ludGF4LmZyb20oXCJzdHJpbmdcIiwgc2VyaWFsaXplci53cml0ZShyLnRlbXBsYXRlKSk7XG4gICAgbGV0IGNhbGxlZSA9IG5ldyBUZXJtKCdJZGVudGlmaWVyRXhwcmVzc2lvbicsIHsgbmFtZTogU3ludGF4LmZyb20oXCJpZGVudGlmaWVyXCIsICdzeW50YXhUZW1wbGF0ZScpIH0pO1xuXG4gICAgbGV0IGV4cGFuZGVkSW50ZXJwcyA9IHIuaW50ZXJwLm1hcChpID0+IHtcbiAgICAgIGxldCBlbmYgPSBuZXcgRW5mb3Jlc3RlcihpLCBMaXN0KCksIHRoaXMuY29udGV4dCk7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmQoZW5mLmVuZm9yZXN0KCdleHByZXNzaW9uJykpO1xuICAgIH0pO1xuXG4gICAgbGV0IGFyZ3MgPSBMaXN0Lm9mKG5ldyBUZXJtKCdMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbicsIHt2YWx1ZTogc3RyIH0pKVxuICAgICAgICAgICAgICAgICAgIC5jb25jYXQoZXhwYW5kZWRJbnRlcnBzKTtcblxuICAgIHJldHVybiBuZXcgVGVybSgnQ2FsbEV4cHJlc3Npb24nLCB7XG4gICAgICBjYWxsZWUsIGFyZ3VtZW50czogYXJnc1xuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kU3ludGF4UXVvdGUodGVybSkge1xuICAgIGxldCBzdHIgPSBuZXcgVGVybShcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCIsIHtcbiAgICAgIHZhbHVlOiBTeW50YXguZnJvbShcInN0cmluZ1wiLCBzZXJpYWxpemVyLndyaXRlKHRlcm0ubmFtZSkpXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFRlcm0oXCJUZW1wbGF0ZUV4cHJlc3Npb25cIiwge1xuICAgICAgdGFnOiB0ZXJtLnRlbXBsYXRlLnRhZyxcbiAgICAgIGVsZW1lbnRzOiB0ZXJtLnRlbXBsYXRlLmVsZW1lbnRzLnB1c2goc3RyKS5wdXNoKG5ldyBUZXJtKCdUZW1wbGF0ZUVsZW1lbnQnLCB7XG4gICAgICAgIHJhd1ZhbHVlOiAnJ1xuICAgICAgfSkpLnRvQXJyYXkoKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kU3RhdGljTWVtYmVyRXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLCB7XG4gICAgICBvYmplY3Q6IHRoaXMuZXhwYW5kKHRlcm0ub2JqZWN0KSxcbiAgICAgIHByb3BlcnR5OiB0ZXJtLnByb3BlcnR5XG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRBcnJheUV4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIkFycmF5RXhwcmVzc2lvblwiLCB7XG4gICAgICBlbGVtZW50czogdGVybS5lbGVtZW50cy5tYXAodCA9PiB0ID09IG51bGwgPyB0IDogdGhpcy5leHBhbmQodCkpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRJbXBvcnQodGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kSW1wb3J0TmFtZXNwYWNlKHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxuXG4gIGV4cGFuZEV4cG9ydCh0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdFeHBvcnQnLCB7XG4gICAgICBkZWNsYXJhdGlvbjogdGhpcy5leHBhbmQodGVybS5kZWNsYXJhdGlvbilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZEV4cG9ydERlZmF1bHQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnRXhwb3J0RGVmYXVsdCcsIHtcbiAgICAgIGJvZHk6IHRoaXMuZXhwYW5kKHRlcm0uYm9keSlcbiAgICB9KTtcbiAgfVxuXG5cbiAgZXhwYW5kRXhwb3J0RnJvbSh0ZXJtKSB7XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cblxuICBleHBhbmRFeHBvcnRBbGxGcm9tKHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxuXG4gIGV4cGFuZEV4cG9ydFNwZWNpZmllcih0ZXJtKSB7XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cblxuICBleHBhbmRTdGF0aWNQcm9wZXJ0eU5hbWUodGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kRGF0YVByb3BlcnR5KHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJEYXRhUHJvcGVydHlcIiwge1xuICAgICAgbmFtZTogdGhpcy5leHBhbmQodGVybS5uYW1lKSxcbiAgICAgIGV4cHJlc3Npb246IHRoaXMuZXhwYW5kKHRlcm0uZXhwcmVzc2lvbilcbiAgICB9KTtcbiAgfVxuXG5cbiAgZXhwYW5kT2JqZWN0RXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiT2JqZWN0RXhwcmVzc2lvblwiLCB7XG4gICAgICBwcm9wZXJ0aWVzOiB0ZXJtLnByb3BlcnRpZXMubWFwKHQgPT4gdGhpcy5leHBhbmQodCkpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRWYXJpYWJsZURlY2xhcmF0b3IodGVybSkge1xuICAgIGxldCBpbml0ID0gdGVybS5pbml0ID09IG51bGwgPyBudWxsIDogdGhpcy5leHBhbmQodGVybS5pbml0KTtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJWYXJpYWJsZURlY2xhcmF0b3JcIiwge1xuICAgICAgYmluZGluZzogdGhpcy5leHBhbmQodGVybS5iaW5kaW5nKSxcbiAgICAgIGluaXQ6IGluaXRcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFZhcmlhYmxlRGVjbGFyYXRpb24odGVybSkge1xuICAgIGlmICh0ZXJtLmtpbmQgPT09ICdzeW50YXgnIHx8IHRlcm0ua2luZCA9PT0gJ3N5bnRheHJlYycpIHtcbiAgICAgIHJldHVybiB0ZXJtO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRlcm0oXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIsIHtcbiAgICAgIGtpbmQ6IHRlcm0ua2luZCxcbiAgICAgIGRlY2xhcmF0b3JzOiB0ZXJtLmRlY2xhcmF0b3JzLm1hcChkID0+IHRoaXMuZXhwYW5kKGQpKVxuICAgIH0pO1xuICB9XG5cbiAgZXhwYW5kUGFyZW50aGVzaXplZEV4cHJlc3Npb24odGVybSkge1xuICAgIGlmICh0ZXJtLmlubmVyLnNpemUgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0XCIpO1xuICAgIH1cbiAgICBsZXQgZW5mID0gbmV3IEVuZm9yZXN0ZXIodGVybS5pbm5lciwgTGlzdCgpLCB0aGlzLmNvbnRleHQpO1xuICAgIGxldCBsb29rYWhlYWQgPSBlbmYucGVlaygpO1xuICAgIGxldCB0ID0gZW5mLmVuZm9yZXN0RXhwcmVzc2lvbigpO1xuICAgIGlmICh0ID09IG51bGwgfHwgZW5mLnJlc3Quc2l6ZSA+IDApIHtcbiAgICAgIHRocm93IGVuZi5jcmVhdGVFcnJvcihsb29rYWhlYWQsIFwidW5leHBlY3RlZCBzeW50YXhcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmV4cGFuZCh0KTtcbiAgfVxuXG4gIGV4cGFuZFVuYXJ5RXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdVbmFyeUV4cHJlc3Npb24nLCB7XG4gICAgICBvcGVyYXRvcjogdGVybS5vcGVyYXRvcixcbiAgICAgIG9wZXJhbmQ6IHRoaXMuZXhwYW5kKHRlcm0ub3BlcmFuZClcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZFVwZGF0ZUV4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnVXBkYXRlRXhwcmVzc2lvbicsIHtcbiAgICAgIGlzUHJlZml4OiB0ZXJtLmlzUHJlZml4LFxuICAgICAgb3BlcmF0b3I6IHRlcm0ub3BlcmF0b3IsXG4gICAgICBvcGVyYW5kOiB0aGlzLmV4cGFuZCh0ZXJtLm9wZXJhbmQpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRCaW5hcnlFeHByZXNzaW9uKHRlcm0pIHtcbiAgICBsZXQgbGVmdCA9IHRoaXMuZXhwYW5kKHRlcm0ubGVmdCk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5leHBhbmQodGVybS5yaWdodCk7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiQmluYXJ5RXhwcmVzc2lvblwiLCB7XG4gICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgb3BlcmF0b3I6IHRlcm0ub3BlcmF0b3IsXG4gICAgICByaWdodDogcmlnaHRcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZENvbmRpdGlvbmFsRXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdDb25kaXRpb25hbEV4cHJlc3Npb24nLCB7XG4gICAgICB0ZXN0OiB0aGlzLmV4cGFuZCh0ZXJtLnRlc3QpLFxuICAgICAgY29uc2VxdWVudDogdGhpcy5leHBhbmQodGVybS5jb25zZXF1ZW50KSxcbiAgICAgIGFsdGVybmF0ZTogdGhpcy5leHBhbmQodGVybS5hbHRlcm5hdGUpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmROZXdUYXJnZXRFeHByZXNzaW9uKHRlcm0pIHsgcmV0dXJuIHRlcm07IH1cblxuICBleHBhbmROZXdFeHByZXNzaW9uKHRlcm0pIHtcbiAgICBsZXQgY2FsbGVlID0gdGhpcy5leHBhbmQodGVybS5jYWxsZWUpO1xuICAgIGxldCBlbmYgPSBuZXcgRW5mb3Jlc3Rlcih0ZXJtLmFyZ3VtZW50cywgTGlzdCgpLCB0aGlzLmNvbnRleHQpO1xuICAgIGxldCBhcmdzID0gZW5mLmVuZm9yZXN0QXJndW1lbnRMaXN0KCkubWFwKGFyZyA9PiB0aGlzLmV4cGFuZChhcmcpKTtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ05ld0V4cHJlc3Npb24nLCB7XG4gICAgICBjYWxsZWUsXG4gICAgICBhcmd1bWVudHM6IGFyZ3MudG9BcnJheSgpXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRTdXBlcih0ZXJtKSB7IHJldHVybiB0ZXJtOyB9XG5cbiAgZXhwYW5kQ2FsbEV4cHJlc3Npb24odGVybSkge1xuICAgIGxldCBjYWxsZWUgPSB0aGlzLmV4cGFuZCh0ZXJtLmNhbGxlZSk7XG4gICAgbGV0IGVuZiA9IG5ldyBFbmZvcmVzdGVyKHRlcm0uYXJndW1lbnRzLCBMaXN0KCksIHRoaXMuY29udGV4dCk7XG4gICAgbGV0IGFyZ3MgPSBlbmYuZW5mb3Jlc3RBcmd1bWVudExpc3QoKS5tYXAoYXJnID0+IHRoaXMuZXhwYW5kKGFyZykpO1xuICAgIHJldHVybiBuZXcgVGVybShcIkNhbGxFeHByZXNzaW9uXCIsIHtcbiAgICAgIGNhbGxlZTogY2FsbGVlLFxuICAgICAgYXJndW1lbnRzOiBhcmdzXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRTcHJlYWRFbGVtZW50KHRlcm0pIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ1NwcmVhZEVsZW1lbnQnLCB7XG4gICAgICBleHByZXNzaW9uOiB0aGlzLmV4cGFuZCh0ZXJtLmV4cHJlc3Npb24pXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRFeHByZXNzaW9uU3RhdGVtZW50KHRlcm0pIHtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmV4cGFuZCh0ZXJtLmV4cHJlc3Npb24pO1xuICAgIHJldHVybiBuZXcgVGVybShcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiwge1xuICAgICAgZXhwcmVzc2lvbjogY2hpbGRcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZExhYmVsZWRTdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnTGFiZWxlZFN0YXRlbWVudCcsIHtcbiAgICAgIGxhYmVsOiB0ZXJtLmxhYmVsLnZhbCgpLFxuICAgICAgYm9keTogdGhpcy5leHBhbmQodGVybS5ib2R5KVxuICAgIH0pO1xuICB9XG5cbiAgZG9GdW5jdGlvbkV4cGFuc2lvbih0ZXJtLCB0eXBlKSB7XG4gICAgbGV0IHNjb3BlID0gZnJlc2hTY29wZShcImZ1blwiKTtcbiAgICBsZXQgcmVkID0gbmV3IEFwcGx5U2NvcGVJblBhcmFtc1JlZHVjZXIoc2NvcGUsIHRoaXMuY29udGV4dCk7XG4gICAgbGV0IHBhcmFtcztcbiAgICBpZiAodHlwZSAhPT0gJ0dldHRlcicgJiYgdHlwZSAhPT0gJ1NldHRlcicpIHtcbiAgICAgIHBhcmFtcyA9IHJlZC50cmFuc2Zvcm0odGVybS5wYXJhbXMpO1xuICAgICAgcGFyYW1zID0gdGhpcy5leHBhbmQocGFyYW1zKTtcbiAgICB9XG4gICAgdGhpcy5jb250ZXh0LmN1cnJlbnRTY29wZS5wdXNoKHNjb3BlKTtcbiAgICBsZXQgY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIodGhpcy5jb250ZXh0LnBoYXNlLCB0aGlzLmNvbnRleHQuZW52LCB0aGlzLmNvbnRleHQuc3RvcmUsIHRoaXMuY29udGV4dCk7XG5cbiAgICBsZXQgbWFya2VkQm9keSwgYm9keVRlcm07XG4gICAgaWYgKHRlcm0uYm9keSBpbnN0YW5jZW9mIFRlcm0pIHtcbiAgICAgIC8vIEFycm93IGZ1bmN0aW9ucyBoYXZlIGEgc2luZ2xlIHRlcm0gYXMgdGhlaXIgYm9keVxuICAgICAgYm9keVRlcm0gPSB0aGlzLmV4cGFuZCh0ZXJtLmJvZHkuYWRkU2NvcGUoc2NvcGUsIHRoaXMuY29udGV4dC5iaW5kaW5ncywgQUxMX1BIQVNFUykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXJrZWRCb2R5ID0gdGVybS5ib2R5Lm1hcChiID0+IGIuYWRkU2NvcGUoc2NvcGUsIHRoaXMuY29udGV4dC5iaW5kaW5ncywgQUxMX1BIQVNFUykpO1xuICAgICAgYm9keVRlcm0gPSBuZXcgVGVybShcIkZ1bmN0aW9uQm9keVwiLCB7XG4gICAgICAgIGRpcmVjdGl2ZXM6IExpc3QoKSxcbiAgICAgICAgc3RhdGVtZW50czogY29tcGlsZXIuY29tcGlsZShtYXJrZWRCb2R5KVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dC5jdXJyZW50U2NvcGUucG9wKCk7XG5cbiAgICBpZiAodHlwZSA9PT0gJ0dldHRlcicpIHtcbiAgICAgIHJldHVybiBuZXcgVGVybSh0eXBlLCB7XG4gICAgICAgIG5hbWU6IHRoaXMuZXhwYW5kKHRlcm0ubmFtZSksXG4gICAgICAgIGJvZHk6IGJvZHlUZXJtXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdTZXR0ZXInKSB7XG4gICAgICByZXR1cm4gbmV3IFRlcm0odHlwZSwge1xuICAgICAgICBuYW1lOiB0aGlzLmV4cGFuZCh0ZXJtLm5hbWUpLFxuICAgICAgICBwYXJhbTogdGVybS5wYXJhbSxcbiAgICAgICAgYm9keTogYm9keVRlcm1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ0Fycm93RXhwcmVzc2lvbicpIHtcbiAgICAgIHJldHVybiBuZXcgVGVybSh0eXBlLCB7XG4gICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICBib2R5OiBib2R5VGVybVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVGVybSh0eXBlLCB7XG4gICAgICBuYW1lOiB0ZXJtLm5hbWUsXG4gICAgICBpc0dlbmVyYXRvcjogdGVybS5pc0dlbmVyYXRvcixcbiAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgYm9keTogYm9keVRlcm1cbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZE1ldGhvZCh0ZXJtKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9GdW5jdGlvbkV4cGFuc2lvbih0ZXJtLCAnTWV0aG9kJyk7XG4gIH1cblxuICBleHBhbmRTZXR0ZXIodGVybSkge1xuICAgIHJldHVybiB0aGlzLmRvRnVuY3Rpb25FeHBhbnNpb24odGVybSwgJ1NldHRlcicpO1xuICB9XG5cbiAgZXhwYW5kR2V0dGVyKHRlcm0pIHtcbiAgICByZXR1cm4gdGhpcy5kb0Z1bmN0aW9uRXhwYW5zaW9uKHRlcm0sICdHZXR0ZXInKTtcbiAgfVxuXG4gIGV4cGFuZEZ1bmN0aW9uRGVjbGFyYXRpb24odGVybSkge1xuICAgIHJldHVybiB0aGlzLmRvRnVuY3Rpb25FeHBhbnNpb24odGVybSwgXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCIpO1xuICB9XG5cbiAgZXhwYW5kRnVuY3Rpb25FeHByZXNzaW9uKHRlcm0pIHtcbiAgICByZXR1cm4gdGhpcy5kb0Z1bmN0aW9uRXhwYW5zaW9uKHRlcm0sIFwiRnVuY3Rpb25FeHByZXNzaW9uXCIpO1xuICB9XG5cbiAgZXhwYW5kQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvblwiLCB7XG4gICAgICBiaW5kaW5nOiB0aGlzLmV4cGFuZCh0ZXJtLmJpbmRpbmcpLFxuICAgICAgb3BlcmF0b3I6IHRlcm0ub3BlcmF0b3IsXG4gICAgICBleHByZXNzaW9uOiB0aGlzLmV4cGFuZCh0ZXJtLmV4cHJlc3Npb24pXG4gICAgfSk7XG4gIH1cblxuICBleHBhbmRBc3NpZ25tZW50RXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiQXNzaWdubWVudEV4cHJlc3Npb25cIiwge1xuICAgICAgYmluZGluZzogdGhpcy5leHBhbmQodGVybS5iaW5kaW5nKSxcbiAgICAgIGV4cHJlc3Npb246IHRoaXMuZXhwYW5kKHRlcm0uZXhwcmVzc2lvbilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZEVtcHR5U3RhdGVtZW50KHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxuXG4gIGV4cGFuZExpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0ZXJtKSB7XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cblxuICBleHBhbmRMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG4gIGV4cGFuZExpdGVyYWxJbmZpbml0eUV4cHJlc3Npb24odGVybSkge1xuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kSWRlbnRpZmllckV4cHJlc3Npb24odGVybSkge1xuICAgIGxldCB0cmFucyA9IHRoaXMuY29udGV4dC5lbnYuZ2V0KHRlcm0ubmFtZS5yZXNvbHZlKHRoaXMuY29udGV4dC5waGFzZSkpO1xuICAgIGlmICh0cmFucykge1xuICAgICAgcmV0dXJuIG5ldyBUZXJtKFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiwge1xuICAgICAgICBuYW1lOiB0cmFucy5pZFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXJtO1xuICB9XG5cbiAgZXhwYW5kTGl0ZXJhbE51bGxFeHByZXNzaW9uKHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxuXG4gIGV4cGFuZExpdGVyYWxTdHJpbmdFeHByZXNzaW9uKHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxuXG4gIGV4cGFuZExpdGVyYWxSZWdFeHBFeHByZXNzaW9uKHRlcm0pIHtcbiAgICByZXR1cm4gdGVybTtcbiAgfVxufVxuIl19