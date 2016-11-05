"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _immutable = require("immutable");

var _enforester = require("./enforester");

var _termExpander = require("./term-expander.js");

var _termExpander2 = _interopRequireDefault(_termExpander);

var _env = require("./env");

var _env2 = _interopRequireDefault(_env);

var _ramda = require("ramda");

var _ = _interopRequireWildcard(_ramda);

var _terms = require("./terms");

var T = _interopRequireWildcard(_terms);

var _symbol = require("./symbol");

var _transforms = require("./transforms");

var _errors = require("./errors");

var _loadSyntax = require("./load-syntax");

var _scope = require("./scope");

var _syntax = require("./syntax");

var _astDispatcher = require("./ast-dispatcher");

var _astDispatcher2 = _interopRequireDefault(_astDispatcher);

var _hygieneUtils = require("./hygiene-utils");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function bindImports(impTerm, exModule, context) {
  let names = [];
  let phase = impTerm.forSyntax ? context.phase + 1 : context.phase;
  impTerm.namedImports.forEach(specifier => {
    let name = specifier.binding.name;
    let exportName = findNameInExports(name, exModule.exportEntries);
    if (exportName != null) {
      let newBinding = (0, _symbol.gensym)(name.val());
      context.store.set(newBinding.toString(), new _transforms.VarBindingTransform(name));
      context.bindings.addForward(name, exportName, newBinding, phase);
      names.push(name);
    }
  });
  return (0, _immutable.List)(names);
}

function findNameInExports(name, exp) {
  let foundNames = exp.reduce((acc, e) => {
    if (T.isExportFrom(e)) {
      return acc.concat(e.namedExports.reduce((acc, specifier) => {
        if (specifier.exportedName.val() === name.val()) {
          return acc.concat(specifier.exportedName);
        }
        return acc;
      }, (0, _immutable.List)()));
    } else if (T.isExport(e)) {
      return acc.concat(e.declaration.declarators.reduce((acc, decl) => {
        if (decl.binding.name.val() === name.val()) {
          return acc.concat(decl.binding.name);
        }
        return acc;
      }, (0, _immutable.List)()));
    }
    return acc;
  }, (0, _immutable.List)());
  (0, _errors.assert)(foundNames.size <= 1, 'expecting no more than 1 matching name in exports');
  return foundNames.get(0);
}

function removeNames(impTerm, names) {
  let namedImports = impTerm.namedImports.filter(specifier => !names.contains(specifier.binding.name));
  return impTerm.extend({ namedImports: namedImports });
}

// function bindAllSyntaxExports(exModule, toSynth, context) {
//   let phase = context.phase;
//   exModule.exportEntries.forEach(ex => {
//     if (isExportSyntax(ex)) {
//       ex.declaration.declarators.forEach(decl => {
//         let name = decl.binding.name;
//         let newBinding = gensym(name.val());
//         let storeName = exModule.moduleSpecifier + ":" + name.val() + ":" + phase;
//         let synthStx = Syntax.fromIdentifier(name.val(), toSynth);
//         let storeStx = Syntax.fromIdentifier(storeName, toSynth);
//         context.bindings.addForward(synthStx, storeStx, newBinding, phase);
//       });
//     }
//   });
// }

class TokenExpander extends _astDispatcher2.default {
  constructor(context) {
    super('expand', false);
    this.context = context;
  }

  expand(stxl) {
    let result = [];
    if (stxl.size === 0) {
      return (0, _immutable.List)(result);
    }
    let prev = (0, _immutable.List)();
    let enf = new _enforester.Enforester(stxl, prev, this.context);

    while (!enf.done) {
      result.push(this.dispatch(enf.enforest()));
    }

    return (0, _immutable.List)(result);
  }

  expandVariableDeclarationStatement(term) {
    return term.extend({
      declaration: this.registerVariableDeclaration(term.declaration)
    });
  }

  expandFunctionDeclaration(term) {
    let registeredTerm = this.registerFunctionOrClass(term);
    let stx = registeredTerm.name.name;
    this.context.env.set(stx.resolve(this.context.phase), new _transforms.VarBindingTransform(stx));
    return registeredTerm;
  }

  // TODO: think about function expressions

  expandImport(term) {
    let path = term.moduleSpecifier.val();
    let mod;
    if (term.forSyntax) {
      mod = this.context.modules.getAtPhase(path, this.context.phase + 1, this.context.cwd);
      this.context.store = this.context.modules.visit(mod, this.context.phase + 1, this.context.store);
      this.context.store = this.context.modules.invoke(mod, this.context.phase + 1, this.context.store);
    } else {
      mod = this.context.modules.getAtPhase(path, this.context.phase, this.context.cwd);
      this.context.store = this.context.modules.visit(mod, this.context.phase, this.context.store);
    }
    let boundNames = bindImports(term, mod, this.context);
    return removeNames(term, boundNames);
  }

  expandExport(term) {
    if (T.isFunctionDeclaration(term.declaration) || T.isClassDeclaration(term.declaration)) {
      return term.extend({
        declaration: this.registerFunctionOrClass(term.declaration)
      });
    } else if (T.isVariableDeclaration(term.declaration)) {
      return term.extend({
        declaration: this.registerVariableDeclaration(term.declaration)
      });
    }
    return term;
  }

  // [isPragma, term => {
  //   let pathStx = term.items.get(0);
  //   if (pathStx.val() === 'base') {
  //     return term;
  //   }
  //   let mod = this.context.modules.loadAndCompile(pathStx.val());
  //   store = this.context.modules.visit(mod, phase, store);
  //   bindAllSyntaxExports(mod, pathStx, this.context);
  //   return term;
  // }],


  registerFunctionOrClass(term) {
    let name = term.name.removeScope(this.context.useScope, this.context.phase);
    (0, _hygieneUtils.collectBindings)(term.name).forEach(stx => {
      let newBinding = (0, _symbol.gensym)(stx.val());
      this.context.bindings.add(stx, {
        binding: newBinding,
        phase: this.context.phase,
        skipDup: false
      });
      // the meaning of a function declaration name is a runtime var binding
      this.context.env.set(newBinding.toString(), new _transforms.VarBindingTransform(stx));
    });
    return term.extend({ name: name });
  }

  registerVariableDeclaration(term) {
    if (T.isSyntaxDeclaration(term) || T.isSyntaxrecDeclaration(term)) {
      return this.registerSyntaxDeclaration(term);
    }
    return term.extend({
      declarators: term.declarators.map(decl => {
        let binding = decl.binding.removeScope(this.context.useScope, this.context.phase);
        (0, _hygieneUtils.collectBindings)(binding).forEach(stx => {
          let newBinding = (0, _symbol.gensym)(stx.val());
          this.context.bindings.add(stx, {
            binding: newBinding,
            phase: this.context.phase,
            skipDup: term.kind === 'var'
          });
          // the meaning of a var/let/const declaration is a var binding
          this.context.env.set(newBinding.toString(), new _transforms.VarBindingTransform(stx));
        });
        return decl.extend({ binding: binding });
      })
    });
  }

  registerSyntaxDeclaration(term) {
    // syntax id^{a, b} = <init>^{a, b}
    // ->
    // syntaxrec id^{a,b,c} = function() { return <<id^{a}>> }
    // syntaxrec id^{a,b} = <init>^{a,b,c}
    if (T.isSyntaxDeclaration(term)) {
      let scope = (0, _scope.freshScope)('nonrec');
      term = term.extend({
        declarators: term.declarators.map(decl => {
          let name = decl.binding.name;
          let nameAdded = name.addScope(scope, this.context.bindings, _syntax.ALL_PHASES);
          let nameRemoved = name.removeScope(this.context.currentScope[this.context.currentScope.length - 1], this.context.phase);
          let newBinding = (0, _symbol.gensym)(name.val());
          this.context.bindings.addForward(nameAdded, nameRemoved, newBinding, this.context.phase);
          return decl.extend({
            init: decl.init.addScope(scope, this.context.bindings, _syntax.ALL_PHASES)
          });
        })
      });
    }

    // for syntax declarations we need to load the compiletime value
    // into the environment
    return term.extend({
      declarators: term.declarators.map(decl => {
        let binding = decl.binding.removeScope(this.context.useScope, this.context.phase);
        // each compiletime value needs to be expanded with a fresh
        // environment and in the next higher phase
        let syntaxExpander = new _termExpander2.default(_.merge(this.context, {
          phase: this.context.phase + 1,
          env: new _env2.default(),
          store: this.context.store
        }));
        let init = syntaxExpander.expand(decl.init);
        let val = (0, _loadSyntax.evalCompiletimeValue)(init.gen(), _.merge(this.context, {
          phase: this.context.phase + 1
        }));
        (0, _hygieneUtils.collectBindings)(binding).forEach(stx => {
          let newBinding = (0, _symbol.gensym)(stx.val());
          this.context.bindings.add(stx, {
            binding: newBinding,
            phase: this.context.phase,
            skipDup: false
          });
          let resolvedName = stx.resolve(this.context.phase);
          this.context.env.set(resolvedName, new _transforms.CompiletimeTransform(val));
        });
        return decl.extend({ binding: binding, init: init });
      })
    });
  }
}
exports.default = TokenExpander;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b2tlbi1leHBhbmRlci5qcyJdLCJuYW1lcyI6WyJfIiwiVCIsImJpbmRJbXBvcnRzIiwiaW1wVGVybSIsImV4TW9kdWxlIiwiY29udGV4dCIsIm5hbWVzIiwicGhhc2UiLCJmb3JTeW50YXgiLCJuYW1lZEltcG9ydHMiLCJmb3JFYWNoIiwic3BlY2lmaWVyIiwibmFtZSIsImJpbmRpbmciLCJleHBvcnROYW1lIiwiZmluZE5hbWVJbkV4cG9ydHMiLCJleHBvcnRFbnRyaWVzIiwibmV3QmluZGluZyIsInZhbCIsInN0b3JlIiwic2V0IiwidG9TdHJpbmciLCJiaW5kaW5ncyIsImFkZEZvcndhcmQiLCJwdXNoIiwiZXhwIiwiZm91bmROYW1lcyIsInJlZHVjZSIsImFjYyIsImUiLCJpc0V4cG9ydEZyb20iLCJjb25jYXQiLCJuYW1lZEV4cG9ydHMiLCJleHBvcnRlZE5hbWUiLCJpc0V4cG9ydCIsImRlY2xhcmF0aW9uIiwiZGVjbGFyYXRvcnMiLCJkZWNsIiwic2l6ZSIsImdldCIsInJlbW92ZU5hbWVzIiwiZmlsdGVyIiwiY29udGFpbnMiLCJleHRlbmQiLCJUb2tlbkV4cGFuZGVyIiwiY29uc3RydWN0b3IiLCJleHBhbmQiLCJzdHhsIiwicmVzdWx0IiwicHJldiIsImVuZiIsImRvbmUiLCJkaXNwYXRjaCIsImVuZm9yZXN0IiwiZXhwYW5kVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCIsInRlcm0iLCJyZWdpc3RlclZhcmlhYmxlRGVjbGFyYXRpb24iLCJleHBhbmRGdW5jdGlvbkRlY2xhcmF0aW9uIiwicmVnaXN0ZXJlZFRlcm0iLCJyZWdpc3RlckZ1bmN0aW9uT3JDbGFzcyIsInN0eCIsImVudiIsInJlc29sdmUiLCJleHBhbmRJbXBvcnQiLCJwYXRoIiwibW9kdWxlU3BlY2lmaWVyIiwibW9kIiwibW9kdWxlcyIsImdldEF0UGhhc2UiLCJjd2QiLCJ2aXNpdCIsImludm9rZSIsImJvdW5kTmFtZXMiLCJleHBhbmRFeHBvcnQiLCJpc0Z1bmN0aW9uRGVjbGFyYXRpb24iLCJpc0NsYXNzRGVjbGFyYXRpb24iLCJpc1ZhcmlhYmxlRGVjbGFyYXRpb24iLCJyZW1vdmVTY29wZSIsInVzZVNjb3BlIiwiYWRkIiwic2tpcER1cCIsImlzU3ludGF4RGVjbGFyYXRpb24iLCJpc1N5bnRheHJlY0RlY2xhcmF0aW9uIiwicmVnaXN0ZXJTeW50YXhEZWNsYXJhdGlvbiIsIm1hcCIsImtpbmQiLCJzY29wZSIsIm5hbWVBZGRlZCIsImFkZFNjb3BlIiwibmFtZVJlbW92ZWQiLCJjdXJyZW50U2NvcGUiLCJsZW5ndGgiLCJpbml0Iiwic3ludGF4RXhwYW5kZXIiLCJtZXJnZSIsImdlbiIsInJlc29sdmVkTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZQSxDOztBQUNaOztJQUFZQyxDOztBQUNaOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVNDLFdBQVQsQ0FBcUJDLE9BQXJCLEVBQThCQyxRQUE5QixFQUF3Q0MsT0FBeEMsRUFBaUQ7QUFDL0MsTUFBSUMsUUFBUSxFQUFaO0FBQ0EsTUFBSUMsUUFBUUosUUFBUUssU0FBUixHQUFvQkgsUUFBUUUsS0FBUixHQUFnQixDQUFwQyxHQUF3Q0YsUUFBUUUsS0FBNUQ7QUFDQUosVUFBUU0sWUFBUixDQUFxQkMsT0FBckIsQ0FBNkJDLGFBQWE7QUFDeEMsUUFBSUMsT0FBT0QsVUFBVUUsT0FBVixDQUFrQkQsSUFBN0I7QUFDQSxRQUFJRSxhQUFhQyxrQkFBa0JILElBQWxCLEVBQXdCUixTQUFTWSxhQUFqQyxDQUFqQjtBQUNBLFFBQUlGLGNBQWMsSUFBbEIsRUFBd0I7QUFDdEIsVUFBSUcsYUFBYSxvQkFBT0wsS0FBS00sR0FBTCxFQUFQLENBQWpCO0FBQ0FiLGNBQVFjLEtBQVIsQ0FBY0MsR0FBZCxDQUFrQkgsV0FBV0ksUUFBWCxFQUFsQixFQUF5QyxvQ0FBd0JULElBQXhCLENB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LEVBQUU4RixLQUFGLENBQVEsS0FBS3pGLE9BQWIsRUFBc0I7QUFDL0RFLGlCQUFPLEtBQUtGLE9BQUwsQ0FBYUUsS0FBYixHQUFxQjtBQURtQyxTQUF0QixDQUFqQyxDQUFWO0FBR0EsMkNBQWdCTSxPQUFoQixFQUF5QkgsT0FBekIsQ0FBaUNrRCxPQUFPO0FBQ3RDLGNBQUkzQyxhQUFhLG9CQUFPMkMsSUFBSTFDLEdBQUosRUFBUCxDQUFqQjtBQUNBLGVBQUtiLE9BQUwsQ0FBYWlCLFFBQWIsQ0FBc0J5RCxHQUF0QixDQUEwQm5CLEdBQTFCLEVBQStCO0FBQzdCL0MscUJBQVNJLFVBRG9CO0FBRTdCVixtQkFBTyxLQUFLRixPQUFMLENBQWFFLEtBRlM7QUFHN0J5RSxxQkFBUztBQUhvQixXQUEvQjtBQUtBLGNBQUlnQixlQUFlcEMsSUFBSUUsT0FBSixDQUFZLEtBQUt6RCxPQUFMLENBQWFFLEtBQXpCLENBQW5CO0FBQ0EsZUFBS0YsT0FBTCxDQUFhd0QsR0FBYixDQUFpQnpDLEdBQWpCLENBQXFCNEUsWUFBckIsRUFBbUMscUNBQXlCOUUsR0FBekIsQ0FBbkM7QUFDRCxTQVREO0FBVUEsZUFBT21CLEtBQUtNLE1BQUwsQ0FBWSxFQUFFOUIsZ0JBQUYsRUFBVytFLFVBQVgsRUFBWixDQUFQO0FBQ0QsT0F4Qlk7QUFESSxLQUFaLENBQVA7QUEyQkQ7QUFwS3NEO2tCQUFwQ2hELGEiLCJmaWxlIjoidG9rZW4tZXhwYW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMaXN0IH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCB7ICBFbmZvcmVzdGVyIH0gZnJvbSBcIi4vZW5mb3Jlc3RlclwiO1xuaW1wb3J0IFRlcm1FeHBhbmRlciBmcm9tIFwiLi90ZXJtLWV4cGFuZGVyLmpzXCI7XG5pbXBvcnQgRW52IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0ICogYXMgXyBmcm9tIFwicmFtZGFcIjtcbmltcG9ydCAqIGFzIFQgZnJvbSBcIi4vdGVybXNcIjtcbmltcG9ydCB7IGdlbnN5bSB9IGZyb20gJy4vc3ltYm9sJztcbmltcG9ydCB7IFZhckJpbmRpbmdUcmFuc2Zvcm0sIENvbXBpbGV0aW1lVHJhbnNmb3JtIH0gZnJvbSAnLi90cmFuc2Zvcm1zJztcbmltcG9ydCB7ICBhc3NlcnQgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IGV2YWxDb21waWxldGltZVZhbHVlIH0gZnJvbSAnLi9sb2FkLXN5bnRheCc7XG5pbXBvcnQgeyAgZnJlc2hTY29wZSB9IGZyb20gXCIuL3Njb3BlXCI7XG5pbXBvcnQgeyBBTExfUEhBU0VTIH0gZnJvbSAnLi9zeW50YXgnO1xuaW1wb3J0IEFTVERpc3BhdGNoZXIgZnJvbSAnLi9hc3QtZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBjb2xsZWN0QmluZGluZ3MgfSBmcm9tICcuL2h5Z2llbmUtdXRpbHMnO1xuXG5mdW5jdGlvbiBiaW5kSW1wb3J0cyhpbXBUZXJtLCBleE1vZHVsZSwgY29udGV4dCkge1xuICBsZXQgbmFtZXMgPSBbXTtcbiAgbGV0IHBoYXNlID0gaW1wVGVybS5mb3JTeW50YXggPyBjb250ZXh0LnBoYXNlICsgMSA6IGNvbnRleHQucGhhc2U7XG4gIGltcFRlcm0ubmFtZWRJbXBvcnRzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICBsZXQgbmFtZSA9IHNwZWNpZmllci5iaW5kaW5nLm5hbWU7XG4gICAgbGV0IGV4cG9ydE5hbWUgPSBmaW5kTmFtZUluRXhwb3J0cyhuYW1lLCBleE1vZHVsZS5leHBvcnRFbnRyaWVzKTtcbiAgICBpZiAoZXhwb3J0TmFtZSAhPSBudWxsKSB7XG4gICAgICBsZXQgbmV3QmluZGluZyA9IGdlbnN5bShuYW1lLnZhbCgpKTtcbiAgICAgIGNvbnRleHQuc3RvcmUuc2V0KG5ld0JpbmRpbmcudG9TdHJpbmcoKSwgbmV3IFZhckJpbmRpbmdUcmFuc2Zvcm0obmFtZSkpO1xuICAgICAgY29udGV4dC5iaW5kaW5ncy5hZGRGb3J3YXJkKG5hbWUsIGV4cG9ydE5hbWUsIG5ld0JpbmRpbmcsIHBoYXNlKTtcbiAgICAgIG5hbWVzLnB1c2gobmFtZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIExpc3QobmFtZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZpbmROYW1lSW5FeHBvcnRzKG5hbWUsIGV4cCkge1xuICBsZXQgZm91bmROYW1lcyA9IGV4cC5yZWR1Y2UoKGFjYywgZSkgPT4ge1xuICAgIGlmIChULmlzRXhwb3J0RnJvbShlKSkge1xuICAgICAgcmV0dXJuIGFjYy5jb25jYXQoZS5uYW1lZEV4cG9ydHMucmVkdWNlKChhY2MsIHNwZWNpZmllcikgPT4ge1xuICAgICAgICBpZiAoc3BlY2lmaWVyLmV4cG9ydGVkTmFtZS52YWwoKSA9PT0gbmFtZS52YWwoKSkge1xuICAgICAgICAgIHJldHVybiBhY2MuY29uY2F0KHNwZWNpZmllci5leHBvcnRlZE5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LCBMaXN0KCkpKTtcbiAgICB9IGVsc2UgaWYgKFQuaXNFeHBvcnQoZSkpIHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KGUuZGVjbGFyYXRpb24uZGVjbGFyYXRvcnMucmVkdWNlKChhY2MsIGRlY2wpID0+IHtcbiAgICAgICAgaWYgKGRlY2wuYmluZGluZy5uYW1lLnZhbCgpID09PSBuYW1lLnZhbCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQoZGVjbC5iaW5kaW5nLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LCBMaXN0KCkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbiAgfSwgTGlzdCgpKTtcbiAgYXNzZXJ0KGZvdW5kTmFtZXMuc2l6ZSA8PSAxLCAnZXhwZWN0aW5nIG5vIG1vcmUgdGhhbiAxIG1hdGNoaW5nIG5hbWUgaW4gZXhwb3J0cycpO1xuICByZXR1cm4gZm91bmROYW1lcy5nZXQoMCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5hbWVzKGltcFRlcm0sIG5hbWVzKSB7XG4gIGxldCBuYW1lZEltcG9ydHMgPSBpbXBUZXJtLm5hbWVkSW1wb3J0cy5maWx0ZXIoc3BlY2lmaWVyID0+ICFuYW1lcy5jb250YWlucyhzcGVjaWZpZXIuYmluZGluZy5uYW1lKSk7XG4gIHJldHVybiBpbXBUZXJtLmV4dGVuZCh7IG5hbWVkSW1wb3J0cyB9KTtcbn1cblxuLy8gZnVuY3Rpb24gYmluZEFsbFN5bnRheEV4cG9ydHMoZXhNb2R1bGUsIHRvU3ludGgsIGNvbnRleHQpIHtcbi8vICAgbGV0IHBoYXNlID0gY29udGV4dC5waGFzZTtcbi8vICAgZXhNb2R1bGUuZXhwb3J0RW50cmllcy5mb3JFYWNoKGV4ID0+IHtcbi8vICAgICBpZiAoaXNFeHBvcnRTeW50YXgoZXgpKSB7XG4vLyAgICAgICBleC5kZWNsYXJhdGlvbi5kZWNsYXJhdG9ycy5mb3JFYWNoKGRlY2wgPT4ge1xuLy8gICAgICAgICBsZXQgbmFtZSA9IGRlY2wuYmluZGluZy5uYW1lO1xuLy8gICAgICAgICBsZXQgbmV3QmluZGluZyA9IGdlbnN5bShuYW1lLnZhbCgpKTtcbi8vICAgICAgICAgbGV0IHN0b3JlTmFtZSA9IGV4TW9kdWxlLm1vZHVsZVNwZWNpZmllciArIFwiOlwiICsgbmFtZS52YWwoKSArIFwiOlwiICsgcGhhc2U7XG4vLyAgICAgICAgIGxldCBzeW50aFN0eCA9IFN5bnRheC5mcm9tSWRlbnRpZmllcihuYW1lLnZhbCgpLCB0b1N5bnRoKTtcbi8vICAgICAgICAgbGV0IHN0b3JlU3R4ID0gU3ludGF4LmZyb21JZGVudGlmaWVyKHN0b3JlTmFtZSwgdG9TeW50aCk7XG4vLyAgICAgICAgIGNvbnRleHQuYmluZGluZ3MuYWRkRm9yd2FyZChzeW50aFN0eCwgc3RvcmVTdHgsIG5ld0JpbmRpbmcsIHBoYXNlKTtcbi8vICAgICAgIH0pO1xuLy8gICAgIH1cbi8vICAgfSk7XG4vLyB9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRva2VuRXhwYW5kZXIgZXh0ZW5kcyBBU1REaXNwYXRjaGVyIHtcbiAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgIHN1cGVyKCdleHBhbmQnLCBmYWxzZSk7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIGV4cGFuZChzdHhsKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGlmIChzdHhsLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiBMaXN0KHJlc3VsdCk7XG4gICAgfVxuICAgIGxldCBwcmV2ID0gTGlzdCgpO1xuICAgIGxldCBlbmYgPSBuZXcgRW5mb3Jlc3RlcihzdHhsLCBwcmV2LCB0aGlzLmNvbnRleHQpO1xuXG4gICAgd2hpbGUoIWVuZi5kb25lKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLmRpc3BhdGNoKGVuZi5lbmZvcmVzdCgpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIExpc3QocmVzdWx0KTtcbiAgfVxuXG4gIGV4cGFuZFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQodGVybSkge1xuICAgIHJldHVybiB0ZXJtLmV4dGVuZCh7XG4gICAgICBkZWNsYXJhdGlvbjogdGhpcy5yZWdpc3RlclZhcmlhYmxlRGVjbGFyYXRpb24odGVybS5kZWNsYXJhdGlvbilcbiAgICB9KTtcbiAgfVxuXG4gIGV4cGFuZEZ1bmN0aW9uRGVjbGFyYXRpb24odGVybSkge1xuICAgIGxldCByZWdpc3RlcmVkVGVybSA9IHRoaXMucmVnaXN0ZXJGdW5jdGlvbk9yQ2xhc3ModGVybSk7XG4gICAgbGV0IHN0eCA9IHJlZ2lzdGVyZWRUZXJtLm5hbWUubmFtZTtcbiAgICB0aGlzLmNvbnRleHQuZW52LnNldChzdHgucmVzb2x2ZSh0aGlzLmNvbnRleHQucGhhc2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBWYXJCaW5kaW5nVHJhbnNmb3JtKHN0eCkpO1xuICAgIHJldHVybiByZWdpc3RlcmVkVGVybTtcbiAgfVxuXG4gIC8vIFRPRE86IHRoaW5rIGFib3V0IGZ1bmN0aW9uIGV4cHJlc3Npb25zXG5cbiAgZXhwYW5kSW1wb3J0KHRlcm0pIHtcbiAgICBsZXQgcGF0aCA9IHRlcm0ubW9kdWxlU3BlY2lmaWVyLnZhbCgpO1xuICAgIGxldCBtb2Q7XG4gICAgaWYgKHRlcm0uZm9yU3ludGF4KSB7XG4gICAgICBtb2QgPSB0aGlzLmNvbnRleHQubW9kdWxlcy5nZXRBdFBoYXNlKHBhdGgsIHRoaXMuY29udGV4dC5waGFzZSArIDEsIHRoaXMuY29udGV4dC5jd2QpO1xuICAgICAgdGhpcy5jb250ZXh0LnN0b3JlID0gdGhpcy5jb250ZXh0Lm1vZHVsZXMudmlzaXQobW9kLCB0aGlzLmNvbnRleHQucGhhc2UgKyAxLCB0aGlzLmNvbnRleHQuc3RvcmUpO1xuICAgICAgdGhpcy5jb250ZXh0LnN0b3JlID0gdGhpcy5jb250ZXh0Lm1vZHVsZXMuaW52b2tlKG1vZCwgdGhpcy5jb250ZXh0LnBoYXNlICsgMSwgdGhpcy5jb250ZXh0LnN0b3JlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kID0gdGhpcy5jb250ZXh0Lm1vZHVsZXMuZ2V0QXRQaGFzZShwYXRoLCB0aGlzLmNvbnRleHQucGhhc2UsIHRoaXMuY29udGV4dC5jd2QpO1xuICAgICAgdGhpcy5jb250ZXh0LnN0b3JlID0gdGhpcy5jb250ZXh0Lm1vZHVsZXMudmlzaXQobW9kLCB0aGlzLmNvbnRleHQucGhhc2UsIHRoaXMuY29udGV4dC5zdG9yZSk7XG4gICAgfVxuICAgIGxldCBib3VuZE5hbWVzID0gYmluZEltcG9ydHModGVybSwgbW9kLCB0aGlzLmNvbnRleHQpO1xuICAgIHJldHVybiByZW1vdmVOYW1lcyh0ZXJtLCBib3VuZE5hbWVzKTtcbiAgfVxuXG4gIGV4cGFuZEV4cG9ydCh0ZXJtKSB7XG4gICAgaWYgKFQuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKHRlcm0uZGVjbGFyYXRpb24pIHx8IFQuaXNDbGFzc0RlY2xhcmF0aW9uKHRlcm0uZGVjbGFyYXRpb24pKSB7XG4gICAgICByZXR1cm4gdGVybS5leHRlbmQoe1xuICAgICAgICBkZWNsYXJhdGlvbjogdGhpcy5yZWdpc3RlckZ1bmN0aW9uT3JDbGFzcyh0ZXJtLmRlY2xhcmF0aW9uKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChULmlzVmFyaWFibGVEZWNsYXJhdGlvbih0ZXJtLmRlY2xhcmF0aW9uKSkge1xuICAgICAgcmV0dXJuIHRlcm0uZXh0ZW5kKHtcbiAgICAgICAgZGVjbGFyYXRpb246IHRoaXMucmVnaXN0ZXJWYXJpYWJsZURlY2xhcmF0aW9uKHRlcm0uZGVjbGFyYXRpb24pXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRlcm07XG4gIH1cblxuICAvLyBbaXNQcmFnbWEsIHRlcm0gPT4ge1xuICAvLyAgIGxldCBwYXRoU3R4ID0gdGVybS5pdGVtcy5nZXQoMCk7XG4gIC8vICAgaWYgKHBhdGhTdHgudmFsKCkgPT09ICdiYXNlJykge1xuICAvLyAgICAgcmV0dXJuIHRlcm07XG4gIC8vICAgfVxuICAvLyAgIGxldCBtb2QgPSB0aGlzLmNvbnRleHQubW9kdWxlcy5sb2FkQW5kQ29tcGlsZShwYXRoU3R4LnZhbCgpKTtcbiAgLy8gICBzdG9yZSA9IHRoaXMuY29udGV4dC5tb2R1bGVzLnZpc2l0KG1vZCwgcGhhc2UsIHN0b3JlKTtcbiAgLy8gICBiaW5kQWxsU3ludGF4RXhwb3J0cyhtb2QsIHBhdGhTdHgsIHRoaXMuY29udGV4dCk7XG4gIC8vICAgcmV0dXJuIHRlcm07XG4gIC8vIH1dLFxuXG5cbiAgcmVnaXN0ZXJGdW5jdGlvbk9yQ2xhc3ModGVybSkge1xuICAgIGxldCBuYW1lID0gdGVybS5uYW1lLnJlbW92ZVNjb3BlKHRoaXMuY29udGV4dC51c2VTY29wZSwgdGhpcy5jb250ZXh0LnBoYXNlKTtcbiAgICBjb2xsZWN0QmluZGluZ3ModGVybS5uYW1lKS5mb3JFYWNoKHN0eCA9PiB7XG4gICAgICBsZXQgbmV3QmluZGluZyA9IGdlbnN5bShzdHgudmFsKCkpO1xuICAgICAgdGhpcy5jb250ZXh0LmJpbmRpbmdzLmFkZChzdHgsIHtcbiAgICAgICAgYmluZGluZzogbmV3QmluZGluZyxcbiAgICAgICAgcGhhc2U6IHRoaXMuY29udGV4dC5waGFzZSxcbiAgICAgICAgc2tpcER1cDogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgLy8gdGhlIG1lYW5pbmcgb2YgYSBmdW5jdGlvbiBkZWNsYXJhdGlvbiBuYW1lIGlzIGEgcnVudGltZSB2YXIgYmluZGluZ1xuICAgICAgdGhpcy5jb250ZXh0LmVudi5zZXQobmV3QmluZGluZy50b1N0cmluZygpLCBuZXcgVmFyQmluZGluZ1RyYW5zZm9ybShzdHgpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGVybS5leHRlbmQoeyBuYW1lIH0pO1xuICB9XG5cbiAgcmVnaXN0ZXJWYXJpYWJsZURlY2xhcmF0aW9uKHRlcm0pIHtcbiAgICBpZiAoVC5pc1N5bnRheERlY2xhcmF0aW9uKHRlcm0pIHx8IFQuaXNTeW50YXhyZWNEZWNsYXJhdGlvbih0ZXJtKSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeW50YXhEZWNsYXJhdGlvbih0ZXJtKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlcm0uZXh0ZW5kKHtcbiAgICAgIGRlY2xhcmF0b3JzOiB0ZXJtLmRlY2xhcmF0b3JzLm1hcChkZWNsID0+IHtcbiAgICAgICAgbGV0IGJpbmRpbmcgPSBkZWNsLmJpbmRpbmcucmVtb3ZlU2NvcGUodGhpcy5jb250ZXh0LnVzZVNjb3BlLCB0aGlzLmNvbnRleHQucGhhc2UpO1xuICAgICAgICBjb2xsZWN0QmluZGluZ3MoYmluZGluZykuZm9yRWFjaChzdHggPT4ge1xuICAgICAgICAgIGxldCBuZXdCaW5kaW5nID0gZ2Vuc3ltKHN0eC52YWwoKSk7XG4gICAgICAgICAgdGhpcy5jb250ZXh0LmJpbmRpbmdzLmFkZChzdHgsIHtcbiAgICAgICAgICAgIGJpbmRpbmc6IG5ld0JpbmRpbmcsXG4gICAgICAgICAgICBwaGFzZTogdGhpcy5jb250ZXh0LnBoYXNlLFxuICAgICAgICAgICAgc2tpcER1cDogdGVybS5raW5kID09PSAndmFyJ1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIHRoZSBtZWFuaW5nIG9mIGEgdmFyL2xldC9jb25zdCBkZWNsYXJhdGlvbiBpcyBhIHZhciBiaW5kaW5nXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmVudi5zZXQobmV3QmluZGluZy50b1N0cmluZygpLCBuZXcgVmFyQmluZGluZ1RyYW5zZm9ybShzdHgpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWNsLmV4dGVuZCh7IGJpbmRpbmcgfSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgcmVnaXN0ZXJTeW50YXhEZWNsYXJhdGlvbih0ZXJtKSB7XG4gICAgLy8gc3ludGF4IGlkXnthLCBifSA9IDxpbml0Pl57YSwgYn1cbiAgICAvLyAtPlxuICAgIC8vIHN5bnRheHJlYyBpZF57YSxiLGN9ID0gZnVuY3Rpb24oKSB7IHJldHVybiA8PGlkXnthfT4+IH1cbiAgICAvLyBzeW50YXhyZWMgaWRee2EsYn0gPSA8aW5pdD5ee2EsYixjfVxuICAgIGlmIChULmlzU3ludGF4RGVjbGFyYXRpb24odGVybSkpIHtcbiAgICAgIGxldCBzY29wZSA9IGZyZXNoU2NvcGUoJ25vbnJlYycpO1xuICAgICAgdGVybSA9IHRlcm0uZXh0ZW5kKHtcbiAgICAgICAgZGVjbGFyYXRvcnM6IHRlcm0uZGVjbGFyYXRvcnMubWFwKGRlY2wgPT4ge1xuICAgICAgICAgIGxldCBuYW1lID0gZGVjbC5iaW5kaW5nLm5hbWU7XG4gICAgICAgICAgbGV0IG5hbWVBZGRlZCA9IG5hbWUuYWRkU2NvcGUoc2NvcGUsIHRoaXMuY29udGV4dC5iaW5kaW5ncywgQUxMX1BIQVNFUyk7XG4gICAgICAgICAgbGV0IG5hbWVSZW1vdmVkID0gbmFtZS5yZW1vdmVTY29wZSh0aGlzLmNvbnRleHQuY3VycmVudFNjb3BlW3RoaXMuY29udGV4dC5jdXJyZW50U2NvcGUubGVuZ3RoIC0gMV0sIHRoaXMuY29udGV4dC5waGFzZSk7XG4gICAgICAgICAgbGV0IG5ld0JpbmRpbmcgPSBnZW5zeW0obmFtZS52YWwoKSk7XG4gICAgICAgICAgdGhpcy5jb250ZXh0LmJpbmRpbmdzLmFkZEZvcndhcmQobmFtZUFkZGVkLCBuYW1lUmVtb3ZlZCwgbmV3QmluZGluZywgdGhpcy5jb250ZXh0LnBoYXNlKTtcbiAgICAgICAgICByZXR1cm4gZGVjbC5leHRlbmQoe1xuICAgICAgICAgICAgaW5pdDogZGVjbC5pbml0LmFkZFNjb3BlKHNjb3BlLCB0aGlzLmNvbnRleHQuYmluZGluZ3MsIEFMTF9QSEFTRVMpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBmb3Igc3ludGF4IGRlY2xhcmF0aW9ucyB3ZSBuZWVkIHRvIGxvYWQgdGhlIGNvbXBpbGV0aW1lIHZhbHVlXG4gICAgLy8gaW50byB0aGUgZW52aXJvbm1lbnRcbiAgICByZXR1cm4gdGVybS5leHRlbmQoe1xuICAgICAgZGVjbGFyYXRvcnM6IHRlcm0uZGVjbGFyYXRvcnMubWFwKGRlY2wgPT4ge1xuICAgICAgICBsZXQgYmluZGluZyA9IGRlY2wuYmluZGluZy5yZW1vdmVTY29wZSh0aGlzLmNvbnRleHQudXNlU2NvcGUsIHRoaXMuY29udGV4dC5waGFzZSk7XG4gICAgICAgIC8vIGVhY2ggY29tcGlsZXRpbWUgdmFsdWUgbmVlZHMgdG8gYmUgZXhwYW5kZWQgd2l0aCBhIGZyZXNoXG4gICAgICAgIC8vIGVudmlyb25tZW50IGFuZCBpbiB0aGUgbmV4dCBoaWdoZXIgcGhhc2VcbiAgICAgICAgbGV0IHN5bnRheEV4cGFuZGVyID0gbmV3IFRlcm1FeHBhbmRlcihfLm1lcmdlKHRoaXMuY29udGV4dCwge1xuICAgICAgICAgIHBoYXNlOiB0aGlzLmNvbnRleHQucGhhc2UgKyAxLFxuICAgICAgICAgIGVudjogbmV3IEVudigpLFxuICAgICAgICAgIHN0b3JlOiB0aGlzLmNvbnRleHQuc3RvcmVcbiAgICAgICAgfSkpO1xuICAgICAgICBsZXQgaW5pdCA9IHN5bnRheEV4cGFuZGVyLmV4cGFuZChkZWNsLmluaXQpO1xuICAgICAgICBsZXQgdmFsID0gZXZhbENvbXBpbGV0aW1lVmFsdWUoaW5pdC5nZW4oKSwgXy5tZXJnZSh0aGlzLmNvbnRleHQsIHtcbiAgICAgICAgICBwaGFzZTogdGhpcy5jb250ZXh0LnBoYXNlICsgMVxuICAgICAgICB9KSk7XG4gICAgICAgIGNvbGxlY3RCaW5kaW5ncyhiaW5kaW5nKS5mb3JFYWNoKHN0eCA9PiB7XG4gICAgICAgICAgbGV0IG5ld0JpbmRpbmcgPSBnZW5zeW0oc3R4LnZhbCgpKTtcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYmluZGluZ3MuYWRkKHN0eCwge1xuICAgICAgICAgICAgYmluZGluZzogbmV3QmluZGluZyxcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLmNvbnRleHQucGhhc2UsXG4gICAgICAgICAgICBza2lwRHVwOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGxldCByZXNvbHZlZE5hbWUgPSBzdHgucmVzb2x2ZSh0aGlzLmNvbnRleHQucGhhc2UpO1xuICAgICAgICAgIHRoaXMuY29udGV4dC5lbnYuc2V0KHJlc29sdmVkTmFtZSwgbmV3IENvbXBpbGV0aW1lVHJhbnNmb3JtKHZhbCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlY2wuZXh0ZW5kKHsgYmluZGluZywgaW5pdCB9KTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==