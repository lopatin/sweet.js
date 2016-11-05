"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _terms = require("./terms");

var _terms2 = _interopRequireDefault(_terms);

var _shiftReducer = require("shift-reducer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ParseReducer extends _shiftReducer.CloneReducer {
  constructor(context) {
    super();
    this.context = context;
  }
  reduceModule(node, state) {
    return new _terms2.default("Module", {
      directives: state.directives.toArray(),
      items: state.items.toArray()
    });
  }

  reduceImport(node, state) {
    let moduleSpecifier = state.moduleSpecifier ? state.moduleSpecifier.val() : null;
    return new _terms2.default('Import', {
      defaultBinding: state.defaultBinding,
      namedImports: state.namedImports.toArray(),
      moduleSpecifier: moduleSpecifier,
      forSyntax: node.forSyntax
    });
  }

  reduceImportNamespace(node, state) {
    let moduleSpecifier = state.moduleSpecifier ? state.moduleSpecifier.val() : null;
    return new _terms2.default('ImportNamespace', {
      defaultBinding: state.defaultBinding,
      namespaceBinding: state.namespaceBinding,
      moduleSpecifier: moduleSpecifier,
      forSyntax: node.forSyntax
    });
  }

  reduceExport(node, state) {
    return new _terms2.default('Export', {
      declaration: state.declaration
    });
  }

  reduceExportAllFrom(node, state) {
    let moduleSpecifier = state.moduleSpecifier ? state.moduleSpecifier.val() : null;
    return new _terms2.default('ExportAllFrom', { moduleSpecifier: moduleSpecifier });
  }

  reduceExportFrom(node, state) {
    let moduleSpecifier = state.moduleSpecifier ? state.moduleSpecifier.val() : null;
    return new _terms2.default('ExportFrom', {
      moduleSpecifier: moduleSpecifier,
      namedExports: state.namedExports.toArray()
    });
  }

  reduceExportSpecifier(node, state) {
    let name = state.name,
        exportedName = state.exportedName;
    if (name == null) {
      name = exportedName.resolve(this.context.phase);
      exportedName = exportedName.val();
    } else {
      name = name.resolve(this.context.phase);
      exportedName = exportedName.val();
    }
    return new _terms2.default('ExportSpecifier', {
      name: name, exportedName: exportedName
    });
  }

  reduceImportSpecifier(node, state) {
    let name = state.name ? state.name.resolve(this.context.phase) : null;
    return new _terms2.default('ImportSpecifier', {
      name: name,
      binding: state.binding
    });
  }

  reduceIdentifierExpression(node) {
    return new _terms2.default("IdentifierExpression", {
      name: node.name.resolve(this.context.phase)
    });
  }

  reduceLiteralNumericExpression(node) {
    return new _terms2.default("LiteralNumericExpression", {
      value: node.value.val()
    });
  }

  reduceLiteralBooleanExpression(node) {
    return new _terms2.default("LiteralBooleanExpression", {
      value: node.value.val() === 'true'
    });
  }

  reduceLiteralStringExpression(node) {
    return new _terms2.default("LiteralStringExpression", {
      value: node.value.token.str
    });
  }

  reduceCallExpression(node, state) {
    return new _terms2.default("CallExpression", {
      callee: state.callee,
      arguments: state.arguments.toArray()
    });
  }

  reduceFunctionBody(node, state) {
    return new _terms2.default("FunctionBody", {
      directives: state.directives.toArray(),
      statements: state.statements.toArray()
    });
  }

  reduceFormalParameters(node, state) {
    return new _terms2.default("FormalParameters", {
      items: state.items.toArray(),
      rest: state.rest
    });
  }

  reduceBindingIdentifier(node) {
    return new _terms2.default("BindingIdentifier", {
      name: node.name.resolve(this.context.phase)
    });
  }

  reduceBinaryExpression(node, state) {
    return new _terms2.default("BinaryExpression", {
      left: state.left,
      operator: node.operator.val(),
      right: state.right
    });
  }

  reduceObjectExpression(node, state) {
    return new _terms2.default("ObjectExpression", {
      properties: state.properties.toArray()
    });
  }

  reduceVariableDeclaration(node, state) {
    return new _terms2.default("VariableDeclaration", {
      kind: state.kind,
      declarators: state.declarators.toArray()
    });
  }

  reduceStaticPropertyName(node) {
    return new _terms2.default("StaticPropertyName", {
      value: node.value.val().toString()
    });
  }

  reduceArrayExpression(node, state) {
    return new _terms2.default("ArrayExpression", {
      elements: state.elements.toArray()
    });
  }

  reduceStaticMemberExpression(node, state) {
    return new _terms2.default("StaticMemberExpression", {
      object: state.object,
      property: state.property.val()
    });
  }

}
exports.default = ParseReducer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzZS1yZWR1Y2VyLmpzIl0sIm5hbWVzIjpbIlBhcnNlUmVkdWNlciIsImNvbnN0cnVjdG9yIiwiY29udGV4dCIsInJlZHVjZU1vZHVsZSIsIm5vZGUiLCJzdGF0ZSIsImRpcmVjdGl2ZXMiLCJ0b0FycmF5IiwiaXRlbXMiLCJyZWR1Y2VJbXBvcnQiLCJtb2R1bGVTcGVjaWZpZXIiLCJ2YWwiLCJkZWZhdWx0QmluZGluZyIsIm5hbWVkSW1wb3J0cyIsImZvclN5bnRheCIsInJlZHVjZUltcG9ydE5hbWVzcGFjZSIsIm5hbWVzcGFjZUJpbmRpbmciLCJyZWR1Y2VFeHBvcnQiLCJkZWNsYXJhdGlvbiIsInJlZHVjZUV4cG9ydEFsbEZyb20iLCJyZWR1Y2VFeHBvcnRGcm9tIiwibmFtZWRFeHBvcnRzIiwicmVkdWNlRXhwb3J0U3BlY2lmaWVyIiwibmFtZSIsImV4cG9ydGVkTmFtZSIsInJlc29sdmUiLCJwaGFzZSIsInJlZHVjZUltcG9ydFNwZWNpZmllciIsImJpbmRpbmciLCJyZWR1Y2VJZGVudGlmaWVyRXhwcmVzc2lvbiIsInJlZHVjZUxpdGVyYWxOdW1lcmljRXhwcmVzc2lvbiIsInZhbHVlIiwicmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uIiwicmVkdWNlTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24iLCJ0b2tlbiIsInN0ciIsInJlZHVjZUNhbGxFeHByZXNzaW9uIiwiY2FsbGVlIiwiYXJndW1lbnRzIiwicmVkdWNlRnVuY3Rpb25Cb2R5Iiwic3RhdGVtZW50cyIsInJlZHVjZUZvcm1hbFBhcmFtZXRlcnMiLCJyZXN0IiwicmVkdWNlQmluZGluZ0lkZW50aWZpZXIiLCJyZWR1Y2VCaW5hcnlFeHByZXNzaW9uIiwibGVmdCIsIm9wZXJhdG9yIiwicmlnaHQiLCJyZWR1Y2VPYmplY3RFeHByZXNzaW9uIiwicHJvcGVydGllcyIsInJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24iLCJraW5kIiwiZGVjbGFyYXRvcnMiLCJyZWR1Y2VTdGF0aWNQcm9wZXJ0eU5hbWUiLCJ0b1N0cmluZyIsInJlZHVjZUFycmF5RXhwcmVzc2lvbiIsImVsZW1lbnRzIiwicmVkdWNlU3RhdGljTWVtYmVyRXhwcmVzc2lvbiIsIm9iamVjdCIsInByb3BlcnR5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBRWUsTUFBTUEsWUFBTixvQ0FBd0M7QUFDckRDLGNBQVlDLE9BQVosRUFBcUI7QUFDbkI7QUFDQSxTQUFLQSxPQUFMLEdBQWVBLE9BQWY7QUFDRDtBQUNEQyxlQUFhQyxJQUFiLEVBQW1CQyxLQUFuQixFQUEwQjtBQUN4QixXQUFPLG9CQUFTLFFBQVQsRUFBbUI7QUFDeEJDLGtCQUFZRCxNQUFNQyxVQUFOLENBQWlCQyxPQUFqQixFQURZO0FBRXhCQyxhQUFPSCxNQUFNRyxLQUFOLENBQVlELE9BQVo7QUFGaUIsS0FBbkIsQ0FBUDtBQUlEOztBQUVERSxlQUFhTCxJQUFiLEVBQW1CQyxLQUFuQixFQUEwQjtBQUN4QixRQUFJSyxrQkFBa0JMLE1BQU1LLGVBQU4sR0FBd0JMLE1BQU1LLGVBQU4sQ0FBc0JDLEdBQXRCLEVBQXhCLEdBQXNELElBQTVFO0FBQ0EsV0FBTyxvQkFBUyxRQUFULEVBQW1CO0FBQ3hCQyxzQkFBZ0JQLE1BQU1PLGNBREU7QUFFeEJDLG9CQUFjUixNQUFNUSxZQUFOLENBQW1CTixPQUFuQixFQUZVO0FBR3hCRyxzQ0FId0I7QUFJeEJJLGlCQUFXVixLQUFLVTtBQUpRLEtBQW5CLENBQVA7QUFNRDs7QUFFREMsd0JBQXNCWCxJQUF0QixFQUE0QkMsS0FBNUIsRUFBbUM7QUFDakMsUUFBSUssa0JBQWtCTCxNQUFNSyxlQUFOLEdBQXdCTCxNQUFNSyxlQUFOLENBQXNCQyxHQUF0QixFQUF4QixHQUFzRCxJQUE1RTtBQUNBLFdBQU8sb0JBQVMsaUJBQVQsRUFBNEI7QUFDakNDLHNCQUFnQlAsTUFBTU8sY0FEVztBQUVqQ0ksd0JBQWtCWCxNQUFNVyxnQkFGUztBQUdqQ04sc0NBSGlDO0FBSWpDSSxpQkFBV1Ys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LG9CQUFTLHFCQUFULEVBQWdDO0FBQ3JDOEMsWUFBTTlDLE1BQU04QyxJQUR5QjtBQUVyQ0MsbUJBQWEvQyxNQUFNK0MsV0FBTixDQUFrQjdDLE9BQWxCO0FBRndCLEtBQWhDLENBQVA7QUFJRDs7QUFFRDhDLDJCQUF5QmpELElBQXpCLEVBQStCO0FBQzdCLFdBQU8sb0JBQVMsb0JBQVQsRUFBK0I7QUFDcEMyQixhQUFPM0IsS0FBSzJCLEtBQUwsQ0FBV3BCLEdBQVgsR0FBaUIyQyxRQUFqQjtBQUQ2QixLQUEvQixDQUFQO0FBR0Q7O0FBRURDLHdCQUFzQm5ELElBQXRCLEVBQTRCQyxLQUE1QixFQUFtQztBQUNqQyxXQUFPLG9CQUFTLGlCQUFULEVBQTRCO0FBQ2pDbUQsZ0JBQVVuRCxNQUFNbUQsUUFBTixDQUFlakQsT0FBZjtBQUR1QixLQUE1QixDQUFQO0FBR0Q7O0FBRURrRCwrQkFBNkJyRCxJQUE3QixFQUFtQ0MsS0FBbkMsRUFBMEM7QUFDeEMsV0FBTyxvQkFBUyx3QkFBVCxFQUFtQztBQUN4Q3FELGNBQVFyRCxNQUFNcUQsTUFEMEI7QUFFeENDLGdCQUFVdEQsTUFBTXNELFFBQU4sQ0FBZWhELEdBQWY7QUFGOEIsS0FBbkMsQ0FBUDtBQUlEOztBQWxLb0Q7a0JBQWxDWCxZIiwiZmlsZSI6InBhcnNlLXJlZHVjZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVGVybSBmcm9tIFwiLi90ZXJtc1wiO1xuaW1wb3J0IHsgQ2xvbmVSZWR1Y2VyIH0gZnJvbSBcInNoaWZ0LXJlZHVjZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFyc2VSZWR1Y2VyIGV4dGVuZHMgQ2xvbmVSZWR1Y2VyIHtcbiAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuICByZWR1Y2VNb2R1bGUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJNb2R1bGVcIiwge1xuICAgICAgZGlyZWN0aXZlczogc3RhdGUuZGlyZWN0aXZlcy50b0FycmF5KCksXG4gICAgICBpdGVtczogc3RhdGUuaXRlbXMudG9BcnJheSgpXG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnQobm9kZSwgc3RhdGUpIHtcbiAgICBsZXQgbW9kdWxlU3BlY2lmaWVyID0gc3RhdGUubW9kdWxlU3BlY2lmaWVyID8gc3RhdGUubW9kdWxlU3BlY2lmaWVyLnZhbCgpIDogbnVsbDtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0ltcG9ydCcsIHtcbiAgICAgIGRlZmF1bHRCaW5kaW5nOiBzdGF0ZS5kZWZhdWx0QmluZGluZyxcbiAgICAgIG5hbWVkSW1wb3J0czogc3RhdGUubmFtZWRJbXBvcnRzLnRvQXJyYXkoKSxcbiAgICAgIG1vZHVsZVNwZWNpZmllcixcbiAgICAgIGZvclN5bnRheDogbm9kZS5mb3JTeW50YXhcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUltcG9ydE5hbWVzcGFjZShub2RlLCBzdGF0ZSkge1xuICAgIGxldCBtb2R1bGVTcGVjaWZpZXIgPSBzdGF0ZS5tb2R1bGVTcGVjaWZpZXIgPyBzdGF0ZS5tb2R1bGVTcGVjaWZpZXIudmFsKCkgOiBudWxsO1xuICAgIHJldHVybiBuZXcgVGVybSgnSW1wb3J0TmFtZXNwYWNlJywge1xuICAgICAgZGVmYXVsdEJpbmRpbmc6IHN0YXRlLmRlZmF1bHRCaW5kaW5nLFxuICAgICAgbmFtZXNwYWNlQmluZGluZzogc3RhdGUubmFtZXNwYWNlQmluZGluZyxcbiAgICAgIG1vZHVsZVNwZWNpZmllcixcbiAgICAgIGZvclN5bnRheDogbm9kZS5mb3JTeW50YXhcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUV4cG9ydChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgVGVybSgnRXhwb3J0Jywge1xuICAgICAgZGVjbGFyYXRpb246IHN0YXRlLmRlY2xhcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRBbGxGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgbGV0IG1vZHVsZVNwZWNpZmllciA9IHN0YXRlLm1vZHVsZVNwZWNpZmllciA/IHN0YXRlLm1vZHVsZVNwZWNpZmllci52YWwoKSA6IG51bGw7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdFeHBvcnRBbGxGcm9tJywgeyBtb2R1bGVTcGVjaWZpZXIgfSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgbGV0IG1vZHVsZVNwZWNpZmllciA9IHN0YXRlLm1vZHVsZVNwZWNpZmllciA/IHN0YXRlLm1vZHVsZVNwZWNpZmllci52YWwoKSA6IG51bGw7XG4gICAgcmV0dXJuIG5ldyBUZXJtKCdFeHBvcnRGcm9tJywge1xuICAgICAgbW9kdWxlU3BlY2lmaWVyLFxuICAgICAgbmFtZWRFeHBvcnRzOiBzdGF0ZS5uYW1lZEV4cG9ydHMudG9BcnJheSgpXG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRTcGVjaWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICBsZXQgbmFtZSA9IHN0YXRlLm5hbWUsIGV4cG9ydGVkTmFtZSA9IHN0YXRlLmV4cG9ydGVkTmFtZTtcbiAgICBpZiAobmFtZSA9PSBudWxsKSB7XG4gICAgICBuYW1lID0gZXhwb3J0ZWROYW1lLnJlc29sdmUodGhpcy5jb250ZXh0LnBoYXNlKTtcbiAgICAgIGV4cG9ydGVkTmFtZSA9IGV4cG9ydGVkTmFtZS52YWwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVzb2x2ZSh0aGlzLmNvbnRleHQucGhhc2UpO1xuICAgICAgZXhwb3J0ZWROYW1lID0gZXhwb3J0ZWROYW1lLnZhbCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRlcm0oJ0V4cG9ydFNwZWNpZmllcicsIHtcbiAgICAgIG5hbWUsIGV4cG9ydGVkTmFtZVxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlSW1wb3J0U3BlY2lmaWVyKG5vZGUsIHN0YXRlKSB7XG4gICAgbGV0IG5hbWUgPSBzdGF0ZS5uYW1lID8gc3RhdGUubmFtZS5yZXNvbHZlKHRoaXMuY29udGV4dC5waGFzZSkgOiBudWxsO1xuICAgIHJldHVybiBuZXcgVGVybSgnSW1wb3J0U3BlY2lmaWVyJywge1xuICAgICAgbmFtZSxcbiAgICAgIGJpbmRpbmc6IHN0YXRlLmJpbmRpbmdcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiLCB7XG4gICAgICBuYW1lOiBub2RlLm5hbWUucmVzb2x2ZSh0aGlzLmNvbnRleHQucGhhc2UpXG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiLCB7XG4gICAgICB2YWx1ZTogbm9kZS52YWx1ZS52YWwoKVxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIiwge1xuICAgICAgdmFsdWU6IG5vZGUudmFsdWUudmFsKCkgPT09ICd0cnVlJ1xuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCIsIHtcbiAgICAgIHZhbHVlOiBub2RlLnZhbHVlLnRva2VuLnN0clxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlQ2FsbEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJDYWxsRXhwcmVzc2lvblwiLCB7XG4gICAgICBjYWxsZWU6IHN0YXRlLmNhbGxlZSxcbiAgICAgIGFyZ3VtZW50czogc3RhdGUuYXJndW1lbnRzLnRvQXJyYXkoKVxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25Cb2R5KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiRnVuY3Rpb25Cb2R5XCIsIHtcbiAgICAgIGRpcmVjdGl2ZXM6IHN0YXRlLmRpcmVjdGl2ZXMudG9BcnJheSgpLFxuICAgICAgc3RhdGVtZW50czogc3RhdGUuc3RhdGVtZW50cy50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUZvcm1hbFBhcmFtZXRlcnMobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gbmV3IFRlcm0oXCJGb3JtYWxQYXJhbWV0ZXJzXCIsIHtcbiAgICAgIGl0ZW1zOiBzdGF0ZS5pdGVtcy50b0FycmF5KCksXG4gICAgICByZXN0OiBzdGF0ZS5yZXN0XG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nSWRlbnRpZmllcihub2RlKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiQmluZGluZ0lkZW50aWZpZXJcIiwge1xuICAgICAgbmFtZTogbm9kZS5uYW1lLnJlc29sdmUodGhpcy5jb250ZXh0LnBoYXNlKVxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlQmluYXJ5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIkJpbmFyeUV4cHJlc3Npb25cIiwge1xuICAgICAgbGVmdDogc3RhdGUubGVmdCxcbiAgICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLnZhbCgpLFxuICAgICAgcmlnaHQ6IHN0YXRlLnJpZ2h0XG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiT2JqZWN0RXhwcmVzc2lvblwiLCB7XG4gICAgICBwcm9wZXJ0aWVzOiBzdGF0ZS5wcm9wZXJ0aWVzLnRvQXJyYXkoKVxuICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdGlvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIlZhcmlhYmxlRGVjbGFyYXRpb25cIiwge1xuICAgICAga2luZDogc3RhdGUua2luZCxcbiAgICAgIGRlY2xhcmF0b3JzOiBzdGF0ZS5kZWNsYXJhdG9ycy50b0FycmF5KClcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY1Byb3BlcnR5TmFtZShub2RlKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiU3RhdGljUHJvcGVydHlOYW1lXCIsIHtcbiAgICAgIHZhbHVlOiBub2RlLnZhbHVlLnZhbCgpLnRvU3RyaW5nKClcbiAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUFycmF5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgVGVybShcIkFycmF5RXhwcmVzc2lvblwiLCB7XG4gICAgICBlbGVtZW50czogc3RhdGUuZWxlbWVudHMudG9BcnJheSgpXG4gICAgfSk7XG4gIH1cblxuICByZWR1Y2VTdGF0aWNNZW1iZXJFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBUZXJtKFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLCB7XG4gICAgICBvYmplY3Q6IHN0YXRlLm9iamVjdCxcbiAgICAgIHByb3BlcnR5OiBzdGF0ZS5wcm9wZXJ0eS52YWwoKVxuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==