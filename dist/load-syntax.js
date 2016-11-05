'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sanitizeReplacementValues = sanitizeReplacementValues;
exports.evalRuntimeValues = evalRuntimeValues;
exports.evalCompiletimeValue = evalCompiletimeValue;

var _ramda = require('ramda');

var _ = _interopRequireWildcard(_ramda);

var _immutable = require('immutable');

var _parseReducer = require('./parse-reducer.js');

var _parseReducer2 = _interopRequireDefault(_parseReducer);

var _shiftReducer = require('shift-reducer');

var _shiftReducer2 = _interopRequireDefault(_shiftReducer);

var _serializer = require('./serializer');

var _syntax = require('./syntax');

var _syntax2 = _interopRequireDefault(_syntax);

var _shiftCodegen = require('shift-codegen');

var _shiftCodegen2 = _interopRequireDefault(_shiftCodegen);

var _terms = require('./terms');

var _terms2 = _interopRequireDefault(_terms);

var _shiftReader = require('./shift-reader');

var _shiftReader2 = _interopRequireDefault(_shiftReader);

var _macroContext = require('./macro-context');

var _templateProcessor = require('./template-processor');

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function sanitizeReplacementValues(values) {
  if (Array.isArray(values)) {
    return sanitizeReplacementValues((0, _immutable.List)(values));
  } else if (_immutable.List.isList(values)) {
    return values.map(sanitizeReplacementValues);
  } else if (values == null) {
    throw new Error("replacement values for syntax template must not be null or undefined");
  } else if (typeof values.next === 'function') {
    return sanitizeReplacementValues((0, _immutable.List)(values));
  }
  return (0, _macroContext.unwrap)(values);
}

function evalRuntimeValues(terms, context) {
  let prepped = terms.reduce((acc, term) => {
    if ((0, _terms.isExport)(term)) {
      if ((0, _terms.isVariableDeclaration)(term.declaration)) {
        return acc.concat(new _terms2.default('VariableDeclarationStatement', {
          declaration: term.declaration
        })).concat(term.declaration.declarators.map(decl => {
          return new _terms2.default('ExpressionStatement', {
            expression: new _terms2.default('AssignmentExpression', {
              binding: new _terms2.default('StaticMemberExpression', {
                object: new _terms2.default('IdentifierExpression', {
                  name: _syntax2.default.fromIdentifier('exports')
                }),
                property: decl.binding.name
              }),
              expression: new _terms2.default('IdentifierExpression', {
                name: decl.binding.name
              })
            })
          });
        }));
      }
    } else if ((0, _terms.isImport)(term)) {
      return acc;
    }
    return acc.concat(term);
  }, (0, _immutable.List)());
  let parsed = (0, _shiftReducer2.default)(new _parseReducer2.default(context, false), new _terms2.default('Module', {
    directives: (0, _immutable.List)(),
    items: prepped
  }).gen(false));

  let gen = (0, _shiftCodegen2.default)(parsed, new _shiftCodegen.FormattedCodeGen());
  let result = context.transform(gen, {
    babelrc: true,
    filename: context.filename
  });

  let exportsObj = {};
  context.store.set('exports', exportsObj);

  _vm2.default.runInContext(result.code, context.store.getNodeContext());
  return exportsObj;
}

// (Expression, Context) -> [function]
function evalCompiletimeValue(expr, context) {
  let deserializer = (0, _serializer.makeDeserializer)(context.bindings);
  let sandbox = {
    syntaxQuote: function syntaxQuote(strings) {
      for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
      }

      let ctx = deserializer.read(_.last(values));
      let reader = new _shiftReader2.default(strings, ctx, _.take(values.length - 1, values));
      return reader.read();
    },
    syntaxTemplate: function syntaxTemplate(str) {
      for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        values[_key2 - 1] = arguments[_key2];
      }

      return (0, _templateProcessor.replaceTemplate)(deserializer.read(str), sanitizeReplacementValues(values));
    }
  };

  let sandboxKeys = (0, _immutable.List)(Object.keys(sandbox));
  let sandboxVals = sandboxKeys.map(k => sandbox[k]).toArray();

  let parsed = (0, _shiftReducer2.default)(new _parseReducer2.default(context), new _terms2.default("Module", {
    directives: (0, _immutable.List)(),
    items: _immutable.List.of(new _terms2.default("ExpressionStatement", {
      expression: new _terms2.default("FunctionExpression", {
        isGenerator: false,
        name: null,
        params: new _terms2.default("FormalParameters", {
          items: sandboxKeys.map(param => {
            return new _terms2.default("BindingIdentifier", {
              name: _syntax2.default.from("identifier", param)
            });
          }),
          rest: null
        }),
        body: new _terms2.default("FunctionBody", {
          directives: _immutable.List.of(new _terms2.default('Directive', {
            rawValue: 'use strict'
          })),
          statements: _immutable.List.of(new _terms2.default("ReturnStatement", {
            expression: expr
          }))
        })
      })
    }))
  }));

  let gen = (0, _shiftCodegen2.default)(parsed, new _shiftCodegen.FormattedCodeGen());
  let result = context.transform(gen, {
    babelrc: true,
    filename: context.filename
  });

  let val = _vm2.default.runInContext(result.code, context.store.getNodeContext());
  return val.apply(undefined, sandboxVals);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sb2FkLXN5bnRheC5qcyJdLCJuYW1lcyI6WyJzYW5pdGl6ZVJlcGxhY2VtZW50VmFsdWVzIiwiZXZhbFJ1bnRpbWVWYWx1ZXMiLCJldmFsQ29tcGlsZXRpbWVWYWx1ZSIsIl8iLCJ2YWx1ZXMiLCJBcnJheSIsImlzQXJyYXkiLCJpc0xpc3QiLCJtYXAiLCJFcnJvciIsIm5leHQiLCJ0ZXJtcyIsImNvbnRleHQiLCJwcmVwcGVkIiwicmVkdWNlIiwiYWNjIiwidGVybSIsImRlY2xhcmF0aW9uIiwiY29uY2F0IiwiZGVjbGFyYXRvcnMiLCJkZWNsIiwiZXhwcmVzc2lvbiIsImJpbmRpbmciLCJvYmplY3QiLCJuYW1lIiwiZnJvbUlkZW50aWZpZXIiLCJwcm9wZXJ0eSIsInBhcnNlZCIsImRpcmVjdGl2ZXMiLCJpdGVtcyIsImdlbiIsInJlc3VsdCIsInRyYW5zZm9ybSIsImJhYmVscmMiLCJmaWxlbmFtZSIsImV4cG9ydHNPYmoiLCJzdG9yZSIsInNldCIsInJ1bkluQ29udGV4dCIsImNvZGUiLCJnZXROb2RlQ29udGV4dCIsImV4cHIiLCJkZXNlcmlhbGl6ZXIiLCJiaW5kaW5ncyIsInNhbmRib3giLCJzeW50YXhRdW90ZSIsInN0cmluZ3MiLCJjdHgiLCJyZWFkIiwibGFzdCIsInJlYWRlciIsInRha2UiLCJsZW5ndGgiLCJzeW50YXhUZW1wbGF0ZSIsInN0ciIsInNhbmRib3hLZXlzIiwiT2JqZWN0Iiwia2V5cyIsInNhbmRib3hWYWxzIiwiayIsInRvQXJyYXkiLCJvZiIsImlzR2VuZXJhdG9yIiwicGFyYW1zIiwicGFyYW0iLCJmcm9tIiwicmVzdCIsImJvZHkiLCJyYXdWYWx1ZSIsInN0YXRlbWVudHMiLCJ2YWwiLCJhcHBseSIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFnQmdCQSx5QixHQUFBQSx5QjtRQWFBQyxpQixHQUFBQSxpQjtRQThDQUMsb0IsR0FBQUEsb0I7O0FBM0VoQjs7SUFBWUMsQzs7QUFDWjs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFFQTs7QUFFQTs7Ozs7Ozs7QUFFTyxTQUFTSCx5QkFBVCxDQUFtQ0ksTUFBbkMsRUFBMkM7QUFDaEQsTUFBSUMsTUFBTUMsT0FBTixDQUFjRixNQUFkLENBQUosRUFBMkI7QUFDekIsV0FBT0osMEJBQTBCLHFCQUFLSSxNQUFMLENBQTFCLENBQVA7QUFDRCxHQUZELE1BRU8sSUFBSSxnQkFBS0csTUFBTCxDQUFZSCxNQUFaLENBQUosRUFBeUI7QUFDOUIsV0FBT0EsT0FBT0ksR0FBUCxDQUFXUix5QkFBWCxDQUFQO0FBQ0QsR0FGTSxNQUVBLElBQUlJLFVBQVUsSUFBZCxFQUFvQjtBQUN6QixVQUFNLElBQUlLLEtBQUosQ0FBVSxzRUFBVixDQUFOO0FBQ0QsR0FGTSxNQUVBLElBQUksT0FBT0wsT0FBT00sSUFBZCxLQUF1QixVQUEzQixFQUF1QztBQUM1QyxXQUFPViwwQkFBMEIscUJBQUtJLE1BQUwsQ0FBMUIsQ0FBUDtBQUNEO0FBQ0QsU0FBTywwQkFBT0EsTUFBUCxDQUFQO0FBQ0Q7O0FBRU0sU0FBU0gsaUJBQVQsQ0FBMkJVLEtBQTNCLEVBQWtDQyxPQUFsQyxFQUEyQztBQUNoRCxNQUFJQyxVQUFVRixNQUFNRyxNQUFOLENBQWEsQ0FBQ0MsR0FBRCxFQUFNQyxJQUFOLEtBQWU7QUFDeEMsUUFBSSxxQkFBU0EsSUFBVCxDQUFKLEVBQW9CO0FBQ2xCLFVBQUksa0NBQXNCQSxLQUFLQyxXQUEzQixDQUFKLEVBQTZDO0FBQzNDLGVBQU9GLElBQUlHLE1BQUosQ0FBVyxvQkFBUyw4QkFBVCxFQUF5QztBQUN6REQsdUJBQWFELEtBQUtDO0FBRHVDLFNBQXpDLENBQVgsRUFFSEMsTUFGRyxDQUVJRixLQUFLQyxXQUFMLENBQWlCRSxXQUFqQixDQUE2QlgsR0FBN0IsQ0FBaUNZLFFBQVE7QUFDbEQsaUJBQU8sb0JBQVMscUJBQVQsRUFBZ0M7QUFDckNDLHdCQUFZLG9CQUFTLHNCQUFULEVBQWlDO0FBQzNDQyx1QkFBUyxvQkFBUyx3QkFBVCxFQUFtQztBQUMxQ0Msd0JBQVEsb0JBQVMsc0JBQVQsRUFBaUM7QUFDdkNDLHdCQUFNLGlCQUFPQyxjQUFQLENBQXNCLFNBQXRCO0FBRGlDLGlCQUFqQyxDQURrQztBQUkxQ0MsMEJBQVVOLEtBQUtFLE9BQUwsQ0FBYUU7QUFKbUIsZUFBbkMsQ0FEa0M7QUFPM0NILDBCQUFZLG9CQUFTLHNCQUFULEVBQWlDO0FBQzNDRyxzQkFBTUosS0FBS0UsT0FBTCxDQUFhRTtBQUR3QixlQUFqQztBQVArQixhQUFqQztBQUR5QixXQUFoQyxDQUFQO0FBYUQsU0FkVSxDQUZKLENBQVA7QUFpQkQ7QUFDRixLQXBCRCxNQW9CTyxJQUFJLHFCQUFTUixJQUFULENBQUosRUFBb0I7QUFDekIsYUFBT0QsR0FBUDtBQUNEO0FBQ0QsV0FBT0EsSUFBSUcsTUFBSixDQUFXRixJQUFYLENBQVA7QUFDRCxHQXpCYSxFQXlCWCxzQkF6QlcsQ0FBZDtBQTBCQSxNQUFJVyxTQUFTLDRCQUFRLDJCQUFpQmYsT0FBakIsRUFBMEIsS0FBMUIsQ0FBUixFQUEwQyxvQkFBUyxRQUFULEVBQW1CO0FBQ3hFZ0IsZ0JBQVksc0JBRDREO0FBRXhFQyxXQUFPaEI7QUFGaUUsR0FBbkIsRUFHcERpQixHQUhvRCxDQUdoRCxLQUhnRCxDQUExQyxDQUFiOztBQUtBLE1BQUlBLE1BQU0sNEJBQVFILE1BQVIsRUFBZ0Isb0NBQWhCLENBQVY7QUFDQSxNQUFJSSxTQUFTbkIsUUFBUW9CLFNBQVIsQ0FBa0JGLEdBQWxCLEVBQXVCO0FBQ2xDRyxhQUFTLElBRHlCO0FBRWxDQyxjQUFVdEIsUUFBUXNCO0FBRmdCLEdBQXZCLENBQWI7O0FBS0EsTUFBSUMsYUFBYSxFQUFqQjtBQUNBdkIsVUFBUXdCLEtBQVIsQ0FBY0MsR0FBZCxDQUFrQixTQUFsQixFQUE2QkYsVUFBN0I7O0FBRUEsZUFBR0csWUFBSCxDQUFnQlAsT0FBT1EsSUFBdkIsRUFBNkIzQixRQUFRd0IsS0FBUixDQUFjSSxjQUFkLEVBQTdCO0FBQ0EsU0FBT0wsVUFBUDtBQUNEOztBQUVEO0FBQ08sU0FBU2pDLG9CQUFULENBQThCdUMsSUFBOUIsRUFBb0M3QixPQUFwQyxFQUE2QztBQUNsRCxNQUFJOEIsZUFBZSxrQ0FBaUI5QixRQUFRK0IsUUFBekIsQ0FBbkI7QUFDQSxNQUFJQyxVQUFVO0FBQ1pDLGlCQUFhLHFCQUFVQyxPQUFWLEVBQThCO0FBQUEsd0NBQVIxQyxNQUFRO0FBQVJBLGNBQVE7QUFBQTs7QUFDekMsVUFBSTJDLE1BQU1MLGFBQWFNLElBQWIsQ0FBa0I3QyxFQUFFOEMsSUFBRixDQUFPN0MsTUFBUCxDQUFsQixDQUFWO0FBQ0EsVUFBSThDLFNBQVMsMEJBQVdKLE9BQVgsRUFBb0JDLEdBQXBCLEVBQXlCNUMsRUFBRWdELElBQUYsQ0FBTy9DLE9BQU9nRCxNQUFQLEdBQWdCLENBQXZCLEVBQTBCaEQsTUFBMUIsQ0FBekIsQ0FBYjtBQUNBLGFBQU84QyxPQUFPRixJQUFQLEVBQVA7QUFDRCxLQUxXO0FBTVpLLG9CQUFnQix3QkFBU0MsR0FBVCxFQUF5QjtBQUFBLHlDQUFSbEQsTUFBUTtBQUFSQSxjQUFRO0FBQUE7O0FBQ3ZDLGFBQU8sd0NBQWdCc0MsYUFBYU0sSUFBYixDQUFrQk0sR0FBbEIsQ0FBaEIsRUFBd0N0RCwwQkFBMEJJLE1BQTFCLENBQXhDLENBQVA7QUFDRDtBQVJXLEdBQWQ7O0FBV0EsTUFBSW1ELGNBQWMscUJBQUtDLE9BQU9DLElBQVAsQ0FBWWIsT0FBWixDQUFMLENBQWxCO0FBQ0EsTUFBSWMsY0FBY0gsWUFBWS9DLEdBQVosQ0FBZ0JtRCxLQUFLZixRQUFRZSxDQUFSLENBQXJCLEVBQWlDQyxPQUFqQyxFQUFsQjs7QUFFQSxNQUFJakMsU0FBUyw0QkFBUSwyQkFBaUJmLE9BQWpCLENBQVIsRUFBbUMsb0JBQVMsUUFBVCxFQUFtQjtBQUNqRWdCLGdCQUFZLHNCQURxRDtBQUVqRUMsV0FBTyxnQkFBS2dDLEVBQUwsQ0FBUSxvQkFBUyxxQkFBVCxFQUFnQztBQUM3Q3hDLGtCQUFZLG9CQUFTLG9CQUFULEVBQStCO0FBQ3pDeUMscUJBQWEsS0FENEI7QUFFekN0QyxjQUFNLElBRm1DO0FBR3pDdUMsZ0JBQVEsb0JBQVMsa0JBQVQsRUFBNkI7QUFDbkNsQyxpQkFBTzBCLFlBQVkvQyxHQUFaLENBQWdCd0QsU0FBUztBQUM5QixtQkFBTyxvQkFBUyxtQkFBVCxFQUE4QjtBQUNuQ3hDLG9CQUFNLGlCQUFPeUMsSUFBUCxDQUFZLFlBQVosRUFBMEJELEtBQTFCO0FBRDZCLGFBQTlCLENBQVA7QUFHRCxXQUpNLENBRDRCO0FBTW5DRSxnQkFBTTtBQU42QixTQUE3QixDQUhpQztBQVd6Q0MsY0FBTSxvQkFBUyxjQUFULEVBQXlCO0FBQzdCdkMsc0JBQVksZ0JBQUtpQyxFQUFMLENBQVEsb0JBQVMsV0FBVCxFQUFzQjtBQUN4Q08sc0JBQVU7QUFEOEIsV0FBdEIsQ0FBUixDQURpQjtBQUk3QkMsc0JBQVksZ0JBQUtSLEVBQUwsQ0FBUSxvQkFBUyxpQkFBVCxFQUE0QjtBQUM5Q3hDLHdCQUFZb0I7QUFEa0MsV0FBNUIsQ0FBUjtBQUppQixTQUF6QjtBQVhtQyxPQUEvQjtBQURpQyxLQUFoQyxDQUFSO0FBRjBELEdBQW5CLENBQW5DLENBQWI7O0FBMEJBLE1BQUlYLE1BQU0sNEJBQVFILE1BQVIsRUFBZ0Isb0NBQWhCLENBQVY7QUFDQSxNQUFJSSxTQUFTbkIsUUFBUW9CLFNBQVIsQ0FBa0JGLEdBQWxCLEVBQXVCO0FBQ2xDRyxhQUFTLElBRHlCO0FBRWxDQyxjQUFVdEIsUUFBUXNCO0FBRmdCLEdBQXZCLENBQWI7O0FBS0EsTUFBSW9DLE1BQU0sYUFBR2hDLFlBQUgsQ0FBZ0JQLE9BQU9RLElBQXZCLEVBQTZCM0IsUUFBUXdCLEtBQVIsQ0FBY0ksY0FBZCxFQUE3QixDQUFWO0FBQ0EsU0FBTzhCLElBQUlDLEtBQUosQ0FBVUMsU0FBVixFQUFxQmQsV0FBckIsQ0FBUDtBQUNEIiwiZmlsZSI6ImxvYWQtc3ludGF4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdyYW1kYSc7XG5pbXBvcnQgeyBMaXN0IH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCBQYXJzZVJlZHVjZXIgZnJvbSAnLi9wYXJzZS1yZWR1Y2VyLmpzJztcbmltcG9ydCByZWR1Y2VyIGZyb20gXCJzaGlmdC1yZWR1Y2VyXCI7XG5pbXBvcnQgeyBtYWtlRGVzZXJpYWxpemVyIH0gZnJvbSAnLi9zZXJpYWxpemVyJztcbmltcG9ydCBTeW50YXggZnJvbSBcIi4vc3ludGF4XCI7XG5pbXBvcnQgY29kZWdlbiwgeyBGb3JtYXR0ZWRDb2RlR2VuIH0gZnJvbSAnc2hpZnQtY29kZWdlbic7XG5pbXBvcnQgVGVybSwgeyBpc1ZhcmlhYmxlRGVjbGFyYXRpb24sIGlzSW1wb3J0LCBpc0V4cG9ydCB9IGZyb20gXCIuL3Rlcm1zXCI7XG5pbXBvcnQgUmVhZGVyIGZyb20gJy4vc2hpZnQtcmVhZGVyJztcblxuaW1wb3J0IHsgdW53cmFwIH0gZnJvbSAnLi9tYWNyby1jb250ZXh0JztcblxuaW1wb3J0IHsgcmVwbGFjZVRlbXBsYXRlIH0gZnJvbSAnLi90ZW1wbGF0ZS1wcm9jZXNzb3InO1xuXG5pbXBvcnQgdm0gZnJvbSBcInZtXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVJlcGxhY2VtZW50VmFsdWVzKHZhbHVlcykge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB7XG4gICAgcmV0dXJuIHNhbml0aXplUmVwbGFjZW1lbnRWYWx1ZXMoTGlzdCh2YWx1ZXMpKTtcbiAgfSBlbHNlIGlmIChMaXN0LmlzTGlzdCh2YWx1ZXMpKSB7XG4gICAgcmV0dXJuIHZhbHVlcy5tYXAoc2FuaXRpemVSZXBsYWNlbWVudFZhbHVlcyk7XG4gIH0gZWxzZSBpZiAodmFsdWVzID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJyZXBsYWNlbWVudCB2YWx1ZXMgZm9yIHN5bnRheCB0ZW1wbGF0ZSBtdXN0IG5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZFwiKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWVzLm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gc2FuaXRpemVSZXBsYWNlbWVudFZhbHVlcyhMaXN0KHZhbHVlcykpO1xuICB9XG4gIHJldHVybiB1bndyYXAodmFsdWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2YWxSdW50aW1lVmFsdWVzKHRlcm1zLCBjb250ZXh0KSB7XG4gIGxldCBwcmVwcGVkID0gdGVybXMucmVkdWNlKChhY2MsIHRlcm0pID0+IHtcbiAgICBpZiAoaXNFeHBvcnQodGVybSkpIHtcbiAgICAgIGlmIChpc1ZhcmlhYmxlRGVjbGFyYXRpb24odGVybS5kZWNsYXJhdGlvbikpIHtcbiAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQobmV3IFRlcm0oJ1ZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQnLCB7XG4gICAgICAgICAgZGVjbGFyYXRpb246IHRlcm0uZGVjbGFyYXRpb25cbiAgICAgICAgfSkpLmNvbmNhdCh0ZXJtLmRlY2xhcmF0aW9uLmRlY2xhcmF0b3JzLm1hcChkZWNsID0+IHtcbiAgICAgICAgICByZXR1cm4gbmV3IFRlcm0oJ0V4cHJlc3Npb25TdGF0ZW1lbnQnLCB7XG4gICAgICAgICAgICBleHByZXNzaW9uOiBuZXcgVGVybSgnQXNzaWdubWVudEV4cHJlc3Npb24nLCB7XG4gICAgICAgICAgICAgIGJpbmRpbmc6IG5ldyBUZXJtKCdTdGF0aWNNZW1iZXJFeHByZXNzaW9uJywge1xuICAgICAgICAgICAgICAgIG9iamVjdDogbmV3IFRlcm0oJ0lkZW50aWZpZXJFeHByZXNzaW9uJywge1xuICAgICAgICAgICAgICAgICAgbmFtZTogU3ludGF4LmZyb21JZGVudGlmaWVyKCdleHBvcnRzJylcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogZGVjbC5iaW5kaW5nLm5hbWVcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGV4cHJlc3Npb246IG5ldyBUZXJtKCdJZGVudGlmaWVyRXhwcmVzc2lvbicsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBkZWNsLmJpbmRpbmcubmFtZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNJbXBvcnQodGVybSkpIHtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfVxuICAgIHJldHVybiBhY2MuY29uY2F0KHRlcm0pO1xuICB9LCBMaXN0KCkpO1xuICBsZXQgcGFyc2VkID0gcmVkdWNlcihuZXcgUGFyc2VSZWR1Y2VyKGNvbnRleHQsIGZhbHNlKSwgbmV3IFRlcm0oJ01vZHVsZScsIHtcbiAgICBkaXJlY3RpdmVzOiBMaXN0KCksXG4gICAgaXRlbXM6IHByZXBwZWRcbiAgfSkuZ2VuKGZhbHNlKSk7XG5cbiAgbGV0IGdlbiA9IGNvZGVnZW4ocGFyc2VkLCBuZXcgRm9ybWF0dGVkQ29kZUdlbik7XG4gIGxldCByZXN1bHQgPSBjb250ZXh0LnRyYW5zZm9ybShnZW4sIHtcbiAgICBiYWJlbHJjOiB0cnVlLFxuICAgIGZpbGVuYW1lOiBjb250ZXh0LmZpbGVuYW1lXG4gIH0pO1xuXG4gIGxldCBleHBvcnRzT2JqID0ge307XG4gIGNvbnRleHQuc3RvcmUuc2V0KCdleHBvcnRzJywgZXhwb3J0c09iaik7XG5cbiAgdm0ucnVuSW5Db250ZXh0KHJlc3VsdC5jb2RlLCBjb250ZXh0LnN0b3JlLmdldE5vZGVDb250ZXh0KCkpO1xuICByZXR1cm4gZXhwb3J0c09iajtcbn1cblxuLy8gKEV4cHJlc3Npb24sIENvbnRleHQpIC0+IFtmdW5jdGlvbl1cbmV4cG9ydCBmdW5jdGlvbiBldmFsQ29tcGlsZXRpbWVWYWx1ZShleHByLCBjb250ZXh0KSB7XG4gIGxldCBkZXNlcmlhbGl6ZXIgPSBtYWtlRGVzZXJpYWxpemVyKGNvbnRleHQuYmluZGluZ3MpO1xuICBsZXQgc2FuZGJveCA9IHtcbiAgICBzeW50YXhRdW90ZTogZnVuY3Rpb24gKHN0cmluZ3MsIC4uLnZhbHVlcykge1xuICAgICAgbGV0IGN0eCA9IGRlc2VyaWFsaXplci5yZWFkKF8ubGFzdCh2YWx1ZXMpKTtcbiAgICAgIGxldCByZWFkZXIgPSBuZXcgUmVhZGVyKHN0cmluZ3MsIGN0eCwgXy50YWtlKHZhbHVlcy5sZW5ndGggLSAxLCB2YWx1ZXMpKTtcbiAgICAgIHJldHVybiByZWFkZXIucmVhZCgpO1xuICAgIH0sXG4gICAgc3ludGF4VGVtcGxhdGU6IGZ1bmN0aW9uKHN0ciwgLi4udmFsdWVzKSB7XG4gICAgICByZXR1cm4gcmVwbGFjZVRlbXBsYXRlKGRlc2VyaWFsaXplci5yZWFkKHN0ciksIHNhbml0aXplUmVwbGFjZW1lbnRWYWx1ZXModmFsdWVzKSk7XG4gICAgfVxuICB9O1xuXG4gIGxldCBzYW5kYm94S2V5cyA9IExpc3QoT2JqZWN0LmtleXMoc2FuZGJveCkpO1xuICBsZXQgc2FuZGJveFZhbHMgPSBzYW5kYm94S2V5cy5tYXAoayA9PiBzYW5kYm94W2tdKS50b0FycmF5KCk7XG5cbiAgbGV0IHBhcnNlZCA9IHJlZHVjZXIobmV3IFBhcnNlUmVkdWNlcihjb250ZXh0KSwgbmV3IFRlcm0oXCJNb2R1bGVcIiwge1xuICAgIGRpcmVjdGl2ZXM6IExpc3QoKSxcbiAgICBpdGVtczogTGlzdC5vZihuZXcgVGVybShcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiwge1xuICAgICAgZXhwcmVzc2lvbjogbmV3IFRlcm0oXCJGdW5jdGlvbkV4cHJlc3Npb25cIiwge1xuICAgICAgICBpc0dlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgIHBhcmFtczogbmV3IFRlcm0oXCJGb3JtYWxQYXJhbWV0ZXJzXCIsIHtcbiAgICAgICAgICBpdGVtczogc2FuZGJveEtleXMubWFwKHBhcmFtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGVybShcIkJpbmRpbmdJZGVudGlmaWVyXCIsIHtcbiAgICAgICAgICAgICAgbmFtZTogU3ludGF4LmZyb20oXCJpZGVudGlmaWVyXCIsIHBhcmFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVzdDogbnVsbFxuICAgICAgICB9KSxcbiAgICAgICAgYm9keTogbmV3IFRlcm0oXCJGdW5jdGlvbkJvZHlcIiwge1xuICAgICAgICAgIGRpcmVjdGl2ZXM6IExpc3Qub2YobmV3IFRlcm0oJ0RpcmVjdGl2ZScsIHtcbiAgICAgICAgICAgIHJhd1ZhbHVlOiAndXNlIHN0cmljdCdcbiAgICAgICAgICB9KSksXG4gICAgICAgICAgc3RhdGVtZW50czogTGlzdC5vZihuZXcgVGVybShcIlJldHVyblN0YXRlbWVudFwiLCB7XG4gICAgICAgICAgICBleHByZXNzaW9uOiBleHByXG4gICAgICAgICAgfSkpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pKVxuICB9KSk7XG5cbiAgbGV0IGdlbiA9IGNvZGVnZW4ocGFyc2VkLCBuZXcgRm9ybWF0dGVkQ29kZUdlbik7XG4gIGxldCByZXN1bHQgPSBjb250ZXh0LnRyYW5zZm9ybShnZW4sIHtcbiAgICBiYWJlbHJjOiB0cnVlLFxuICAgIGZpbGVuYW1lOiBjb250ZXh0LmZpbGVuYW1lXG4gIH0pO1xuXG4gIGxldCB2YWwgPSB2bS5ydW5JbkNvbnRleHQocmVzdWx0LmNvZGUsIGNvbnRleHQuc3RvcmUuZ2V0Tm9kZUNvbnRleHQoKSk7XG4gIHJldHVybiB2YWwuYXBwbHkodW5kZWZpbmVkLCBzYW5kYm94VmFscyk7XG59XG4iXX0=