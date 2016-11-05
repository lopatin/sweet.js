"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Modules = exports.Module = undefined;

var _immutable = require("immutable");

var _env = require("./env");

var _env2 = _interopRequireDefault(_env);

var _store = require("./store");

var _store2 = _interopRequireDefault(_store);

var _shiftReader = require("./shift-reader");

var _shiftReader2 = _interopRequireDefault(_shiftReader);

var _ramda = require("ramda");

var _ = _interopRequireWildcard(_ramda);

var _symbol = require("./symbol");

var _terms = require("./terms");

var T = _interopRequireWildcard(_terms);

var _loadSyntax = require("./load-syntax");

var _compiler = require("./compiler");

var _compiler2 = _interopRequireDefault(_compiler);

var _transforms = require("./transforms");

var _scope = require("./scope");

var _errors = require("./errors");

var _hygieneUtils = require("./hygiene-utils");

var _syntax = require("./syntax");

var _utilsDirname = require("utils-dirname");

var _utilsDirname2 = _interopRequireDefault(_utilsDirname);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Module {
  constructor(moduleSpecifier, isNative, importEntries, exportEntries, pragmas, body) {
    this.moduleSpecifier = moduleSpecifier;
    this.isNative = isNative;
    this.importEntries = importEntries;
    this.exportEntries = exportEntries;
    this.pragmas = pragmas;
    this.body = body;
  }
}

exports.Module = Module;
const findBindingIdentifierName = term => {
  // TODO: handle destructuring
  (0, _errors.assert)(term.name, `not implemented yet for type ${ term.type }`);
  return term.name;
};

const convertExport = term => {
  let declaration = term.declaration;
  let bindings = [];
  if (T.isVariableDeclaration(declaration)) {
    bindings = declaration.declarators.map(decl => findBindingIdentifierName(decl.binding));
  } else if (T.isFunctionDeclaration(declaration) || T.isClassDeclaration(declaration)) {
    bindings.push(findBindingIdentifierName(declaration.name));
  }

  let namedExports = bindings.map(binding => {
    return new T.default('ExportSpecifier', {
      name: null,
      exportedName: binding
    });
  });
  return new T.default('ExportFrom', {
    moduleSpecifier: null,
    namedExports: (0, _immutable.List)(namedExports)
  });
};

const pragmaRegep = /^\s*#\w*/;

class Modules {
  constructor(context) {
    this.compiledModules = new Map();
    this.context = context;
    this.context.modules = this;
  }

  loadString(str) {
    let checkPragma = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    let hasPragma = pragmaRegep.test(str);
    if (checkPragma && !hasPragma) {
      return {
        isNative: true,
        body: (0, _immutable.List)()
      };
    }
    return {
      isNative: !hasPragma,
      body: new _shiftReader2.default(str).read()
    };
  }

  load(path) {
    // TODO resolve and we need to carry the cwd through correctly
    return this.loadString(this.context.moduleLoader(path));
  }

  compile(mod, path) {
    let stxl = mod.body;
    let outScope = (0, _scope.freshScope)('outsideEdge');
    let inScope = (0, _scope.freshScope)(`insideEdge0`);
    // the compiler starts at phase 0, with an empty environment and store
    let compiler = new _compiler2.default(0, new _env2.default(), new _store2.default(), _.merge(this.context, {
      currentScope: [outScope, inScope],
      cwd: path === '<<entrypoint>>' ? this.context.cwd : (0, _utilsDirname2.default)(path)
    }));
    let terms = compiler.compile(stxl.map(s => s.addScope(outScope, this.context.bindings, _syntax.ALL_PHASES).addScope(inScope, this.context.bindings, 0)));

    let importEntries = [];
    let exportEntries = [];
    let pragmas = [];
    let filteredTerms = terms.reduce((acc, t) => {
      return _.cond([[T.isImport, t => {
        importEntries.push(t);
        return acc;
      }], [T.isExport, t => {
        // exportEntries.push(t);
        // return acc.concat(t);
        if (t.declaration) {
          exportEntries.push(convertExport(t));
          if (T.isVariableDeclaration(t.declaration)) {
            return acc.concat(new T.default('VariableDeclarationStatement', {
              declaration: t.declaration
            }));
          }
          return acc.concat(t.declaration);
        }
        exportEntries.push(t);
        return acc;
      }], [T.isPragma, t => {
        pragmas.push(t);return acc;
      }], [_.T, t => acc.concat(t)]])(t);
    }, (0, _immutable.List)());
    return new Module(path, mod.isNative, (0, _immutable.List)(importEntries), (0, _immutable.List)(exportEntries), (0, _immutable.List)(pragmas), filteredTerms);
  }

  compileEntrypoint(source, filename) {
    let enforcePragma = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    let stxl = this.loadString(source, false);
    if (enforcePragma && stxl.isNative) {
      throw new Error(`Entrypoint ${ filename } must begin with #lang pragma`);
    }
    return this.getAtPhase('<<entrypoint>>', 0, this.context.cwd, stxl);
  }

  // Modules have a unique scope per-phase. We compile each module once at
  // phase 0 and store the compiled module in a map. Then, as we ask for
  // the module in a particular phase, we add that new phase-specific scope
  // to the compiled module and update the map with the module at that specific
  // phase.
  getAtPhase(rawPath, phase, cwd) {
    let rawStxl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    let path = rawPath === '<<entrypoint>>' ? rawPath : this.context.moduleResolver(rawPath, cwd);
    let mapKey = `${ path }:${ phase }`;
    if (!this.compiledModules.has(mapKey)) {
      if (phase === 0) {
        let stxl = rawStxl != null ? rawStxl : this.load(path);
        this.compiledModules.set(mapKey, this.compile(stxl, path));
      } else {
        let rawMod = this.getAtPhase(rawPath, 0, cwd, rawStxl);
        let scope = (0, _scope.freshScope)(`insideEdge${ phase }`);
        this.compiledModules.set(mapKey, new Module(rawMod.moduleSpecifier, false, rawMod.importEntries.map(term => term.addScope(scope, this.context.bindings, phase)), rawMod.exportEntries.map(term => term.addScope(scope, this.context.bindings, phase)), rawMod.pragmas, rawMod.body.map(term => term.addScope(scope, this.context.bindings, phase))));
      }
    }
    return this.compiledModules.get(mapKey);
  }

  has(rawPath) {
    let phase = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    let path = rawPath === '<<entrypoint>>' ? rawPath : this.context.moduleResolver(rawPath, this.context.cwd);
    let key = `${ path }:${ phase }`;
    return this.compiledModules.has(key) && !this.compiledModules.get(key).isNative;
  }

  registerSyntaxDeclaration(term, phase, store) {
    term.declarators.forEach(decl => {
      let val = (0, _loadSyntax.evalCompiletimeValue)(decl.init.gen(), _.merge(this.context, {
        phase: phase + 1, store: store
      }));
      (0, _hygieneUtils.collectBindings)(decl.binding).forEach(stx => {
        if (phase !== 0) {
          // phase 0 bindings extend the binding map during compilation
          let newBinding = (0, _symbol.gensym)(stx.val());
          this.context.bindings.add(stx, {
            binding: newBinding,
            phase: phase,
            skipDup: false
          });
        }
        let resolvedName = stx.resolve(phase);
        store.set(resolvedName, new _transforms.CompiletimeTransform(val));
      });
    });
  }

  registerVariableDeclaration(term, phase, store) {
    term.declarators.forEach(decl => {
      (0, _hygieneUtils.collectBindings)(decl.binding).forEach(stx => {
        if (phase !== 0) {
          // phase 0 bindings extend the binding map during compilation
          let newBinding = (0, _symbol.gensym)(stx.val());
          this.context.bindings.add(stx, {
            binding: newBinding,
            phase: phase,
            skipDup: term.kind === 'var'
          });
        }
        let resolvedName = stx.resolve(phase);
        store.set(resolvedName, new _transforms.VarBindingTransform(stx));
      });
    });
  }

  registerFunctionOrClass(term, phase, store) {
    (0, _hygieneUtils.collectBindings)(term.name).forEach(stx => {
      if (phase !== 0) {
        let newBinding = (0, _symbol.gensym)(stx.val());
        this.context.bindings.add(stx, {
          binding: newBinding,
          phase: phase,
          skipDup: false
        });
      }
      let resolvedName = stx.resolve(phase);
      store.set(resolvedName, new _transforms.VarBindingTransform(stx));
    });
  }

  visit(mod, phase, store) {
    // TODO: recursively visit imports
    mod.body.forEach(term => {
      if (T.isSyntaxDeclarationStatement(term)) {
        this.registerSyntaxDeclaration(term.declaration, phase, store);
      }
    });
    return store;
  }

  invoke(mod, phase, store) {
    // TODO: recursively visit imports
    let body = mod.body.filter(_.complement(T.isCompiletimeStatement)).map(term => {
      term = term.gen(); // TODO: can we remove the need for gen? have to deeply remove compiletime code
      if (T.isVariableDeclarationStatement(term)) {
        this.registerVariableDeclaration(term.declaration, phase, store);
      } else if (T.isFunctionDeclaration(term)) {
        this.registerFunctionOrClass(term, phase, store);
      }
      return term;
    });
    (0, _loadSyntax.evalRuntimeValues)(body, _.merge(this.context, {
      store: store, phase: phase
    }));
    return store;
  }
}
exports.Modules = Modules;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2R1bGVzLmpzIl0sIm5hbWVzIjpbIl8iLCJUIiwiTW9kdWxlIiwiY29uc3RydWN0b3IiLCJtb2R1bGVTcGVjaWZpZXIiLCJpc05hdGl2ZSIsImltcG9ydEVudHJpZXMiLCJleHBvcnRFbnRyaWVzIiwicHJhZ21hcyIsImJvZHkiLCJmaW5kQmluZGluZ0lkZW50aWZpZXJOYW1lIiwidGVybSIsIm5hbWUiLCJ0eXBlIiwiY29udmVydEV4cG9ydCIsImRlY2xhcmF0aW9uIiwiYmluZGluZ3MiLCJpc1ZhcmlhYmxlRGVjbGFyYXRpb24iLCJkZWNsYXJhdG9ycyIsIm1hcCIsImRlY2wiLCJiaW5kaW5nIiwiaXNGdW5jdGlvbkRlY2xhcmF0aW9uIiwiaXNDbGFzc0RlY2xhcmF0aW9uIiwicHVzaCIsIm5hbWVkRXhwb3J0cyIsImV4cG9ydGVkTmFtZSIsInByYWdtYVJlZ2VwIiwiTW9kdWxlcyIsImNvbnRleHQiLCJjb21waWxlZE1vZHVsZXMiLCJNYXAiLCJtb2R1bGVzIiwibG9hZFN0cmluZyIsInN0ciIsImNoZWNrUHJhZ21hIiwiaGFzUHJhZ21hIiwidGVzdCIsInJlYWQiLCJsb2FkIiwicGF0aCIsIm1vZHVsZUxvYWRlciIsImNvbXBpbGUiLCJtb2QiLCJzdHhsIiwib3V0U2NvcGUiLCJpblNjb3BlIiwiY29tcGlsZXIiLCJtZXJnZSIsImN1cnJlbnRTY29wZSIsImN3ZCIsInRlcm1zIiwicyIsImFkZFNjb3BlIiwiZmlsdGVyZWRUZXJtcyIsInJlZHVjZSIsImFjYyIsInQiLCJjb25kIiwiaXNJbXBvcnQiLCJpc0V4cG9ydCIsImNvbmNhdCIsImlzUHJhZ21hIiwiY29tcGlsZUVudHJ5cG9pbnQiLCJzb3VyY2UiLCJmaWxlbmFtZSIsImVuZm9yY2VQcmFnbWEiLCJFcnJvciIsImdldEF0UGhhc2UiLCJyYXdQYXRoIiwicGhhc2UiLCJyYXdTdHhsIiwibW9kdWxlUmVzb2x2ZXIiLCJtYXBLZXkiLCJoYXMiLCJzZXQiLCJyYXdNb2QiLCJzY29wZSIsImdldCIsImtleSIsInJlZ2lzdGVyU3ludGF4RGVjbGFyYXRpb24iLCJzdG9yZSIsImZvckVhY2giLCJ2YWwiLCJpbml0IiwiZ2VuIiwic3R4IiwibmV3QmluZGluZyIsImFkZCIsInNraXBEdXAiLCJyZXNvbHZlZE5hbWUiLCJyZXNvbHZlIiwicmVnaXN0ZXJWYXJpYWJsZURlY2xhcmF0aW9uIiwia2luZCIsInJlZ2lzdGVyRnVuY3Rpb25PckNsYXNzIiwidmlzaXQiLCJpc1N5bnRheERlY2xhcmF0aW9uU3RhdGVtZW50IiwiaW52b2tlIiwiZmlsdGVyIiwiY29tcGxlbWVudCIsImlzQ29tcGlsZXRpbWVTdGF0ZW1lbnQiLCJpc1ZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7SUFBWUEsQzs7QUFDWjs7QUFDQTs7SUFBa0JDLEM7O0FBQ2xCOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7Ozs7Ozs7O0FBR08sTUFBTUMsTUFBTixDQUFhO0FBQ2xCQyxjQUFZQyxlQUFaLEVBQTZCQyxRQUE3QixFQUF1Q0MsYUFBdkMsRUFBc0RDLGFBQXRELEVBQXFFQyxPQUFyRSxFQUE4RUMsSUFBOUUsRUFBb0Y7QUFDbEYsU0FBS0wsZUFBTCxHQUF1QkEsZUFBdkI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCQSxRQUFoQjtBQUNBLFNBQUtDLGFBQUwsR0FBcUJBLGFBQXJCO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQkEsYUFBckI7QUFDQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDRDtBQVJpQjs7UUFBUFAsTSxHQUFBQSxNO0FBV2IsTUFBTVEsNEJBQTRCQyxRQUFRO0FBQ3hDO0FBQ0Esc0JBQU9BLEtBQUtDLElBQVosRUFBbUIsaUNBQStCRCxLQUFLRSxJQUFLLEdBQTVEO0FBQ0EsU0FBT0YsS0FBS0MsSUFBWjtBQUNELENB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OlsiaW1wb3J0IHsgTGlzdCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgRW52IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0IFN0b3JlIGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQgUmVhZGVyIGZyb20gXCIuL3NoaWZ0LXJlYWRlclwiO1xuaW1wb3J0ICogYXMgXyBmcm9tIFwicmFtZGFcIjtcbmltcG9ydCB7IGdlbnN5bSB9IGZyb20gJy4vc3ltYm9sJztcbmltcG9ydCBUZXJtLCAqIGFzIFQgZnJvbSBcIi4vdGVybXNcIjtcbmltcG9ydCB7IGV2YWxDb21waWxldGltZVZhbHVlLCBldmFsUnVudGltZVZhbHVlcyB9IGZyb20gJy4vbG9hZC1zeW50YXgnO1xuaW1wb3J0IENvbXBpbGVyIGZyb20gXCIuL2NvbXBpbGVyXCI7XG5pbXBvcnQgeyBWYXJCaW5kaW5nVHJhbnNmb3JtLCBDb21waWxldGltZVRyYW5zZm9ybSB9IGZyb20gJy4vdHJhbnNmb3Jtcyc7XG5pbXBvcnQgeyBmcmVzaFNjb3BlIH0gZnJvbSBcIi4vc2NvcGVcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IGNvbGxlY3RCaW5kaW5ncyB9IGZyb20gJy4vaHlnaWVuZS11dGlscyc7XG5cbmltcG9ydCB7IEFMTF9QSEFTRVMgfSBmcm9tICcuL3N5bnRheCc7XG5cbmltcG9ydCBkaXJuYW1lIGZyb20gJ3V0aWxzLWRpcm5hbWUnO1xuXG5cbmV4cG9ydCBjbGFzcyBNb2R1bGUge1xuICBjb25zdHJ1Y3Rvcihtb2R1bGVTcGVjaWZpZXIsIGlzTmF0aXZlLCBpbXBvcnRFbnRyaWVzLCBleHBvcnRFbnRyaWVzLCBwcmFnbWFzLCBib2R5KSB7XG4gICAgdGhpcy5tb2R1bGVTcGVjaWZpZXIgPSBtb2R1bGVTcGVjaWZpZXI7XG4gICAgdGhpcy5pc05hdGl2ZSA9IGlzTmF0aXZlO1xuICAgIHRoaXMuaW1wb3J0RW50cmllcyA9IGltcG9ydEVudHJpZXM7XG4gICAgdGhpcy5leHBvcnRFbnRyaWVzID0gZXhwb3J0RW50cmllcztcbiAgICB0aGlzLnByYWdtYXMgPSBwcmFnbWFzO1xuICAgIHRoaXMuYm9keSA9IGJvZHk7XG4gIH1cbn1cblxuY29uc3QgZmluZEJpbmRpbmdJZGVudGlmaWVyTmFtZSA9IHRlcm0gPT4ge1xuICAvLyBUT0RPOiBoYW5kbGUgZGVzdHJ1Y3R1cmluZ1xuICBhc3NlcnQodGVybS5uYW1lLCBgbm90IGltcGxlbWVudGVkIHlldCBmb3IgdHlwZSAke3Rlcm0udHlwZX1gKTtcbiAgcmV0dXJuIHRlcm0ubmFtZTtcbn07XG5cbmNvbnN0IGNvbnZlcnRFeHBvcnQgPSB0ZXJtID0+IHtcbiAgbGV0IGRlY2xhcmF0aW9uID0gdGVybS5kZWNsYXJhdGlvbjtcbiAgbGV0IGJpbmRpbmdzID0gW107XG4gIGlmIChULmlzVmFyaWFibGVEZWNsYXJhdGlvbihkZWNsYXJhdGlvbikpIHtcbiAgICBiaW5kaW5ncyA9IGRlY2xhcmF0aW9uLmRlY2xhcmF0b3JzLm1hcChkZWNsID0+ICBmaW5kQmluZGluZ0lkZW50aWZpZXJOYW1lKGRlY2wuYmluZGluZykpO1xuICB9IGVsc2UgaWYgKFQuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKGRlY2xhcmF0aW9uKSB8fCBULmlzQ2xhc3NEZWNsYXJhdGlvbihkZWNsYXJhdGlvbikpIHtcbiAgICBiaW5kaW5ncy5wdXNoKGZpbmRCaW5kaW5nSWRlbnRpZmllck5hbWUoZGVjbGFyYXRpb24ubmFtZSkpO1xuICB9XG5cbiAgbGV0IG5hbWVkRXhwb3J0cyA9IGJpbmRpbmdzLm1hcChiaW5kaW5nID0+IHtcbiAgICByZXR1cm4gbmV3IFRlcm0oJ0V4cG9ydFNwZWNpZmllcicsIHtcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICBleHBvcnRlZE5hbWU6IGJpbmRpbmdcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBuZXcgVGVybSgnRXhwb3J0RnJvbScsIHtcbiAgICBtb2R1bGVTcGVjaWZpZXI6IG51bGwsXG4gICAgbmFtZWRFeHBvcnRzOiBMaXN0KG5hbWVkRXhwb3J0cylcbiAgfSk7XG59O1xuXG5jb25zdCBwcmFnbWFSZWdlcCA9IC9eXFxzKiNcXHcqLztcblxuZXhwb3J0IGNsYXNzIE1vZHVsZXMge1xuICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgdGhpcy5jb21waWxlZE1vZHVsZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB0aGlzLmNvbnRleHQubW9kdWxlcyA9IHRoaXM7XG4gIH1cblxuICBsb2FkU3RyaW5nKHN0ciwgY2hlY2tQcmFnbWEgPSB0cnVlKSB7XG4gICAgbGV0IGhhc1ByYWdtYSA9IHByYWdtYVJlZ2VwLnRlc3Qoc3RyKTtcbiAgICBpZiAoY2hlY2tQcmFnbWEgJiYgIWhhc1ByYWdtYSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaXNOYXRpdmU6IHRydWUsXG4gICAgICAgIGJvZHk6IExpc3QoKVxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzTmF0aXZlOiAhaGFzUHJhZ21hLFxuICAgICAgYm9keTogbmV3IFJlYWRlcihzdHIpLnJlYWQoKVxuICAgIH07XG4gIH1cblxuICBsb2FkKHBhdGgpIHtcbiAgICAvLyBUT0RPIHJlc29sdmUgYW5kIHdlIG5lZWQgdG8gY2FycnkgdGhlIGN3ZCB0aHJvdWdoIGNvcnJlY3RseVxuICAgIHJldHVybiB0aGlzLmxvYWRTdHJpbmcodGhpcy5jb250ZXh0Lm1vZHVsZUxvYWRlcihwYXRoKSk7XG4gIH1cblxuICBjb21waWxlKG1vZCwgcGF0aCkge1xuICAgIGxldCBzdHhsID0gbW9kLmJvZHk7XG4gICAgbGV0IG91dFNjb3BlID0gZnJlc2hTY29wZSgnb3V0c2lkZUVkZ2UnKTtcbiAgICBsZXQgaW5TY29wZSA9IGZyZXNoU2NvcGUoYGluc2lkZUVkZ2UwYCk7XG4gICAgLy8gdGhlIGNvbXBpbGVyIHN0YXJ0cyBhdCBwaGFzZSAwLCB3aXRoIGFuIGVtcHR5IGVudmlyb25tZW50IGFuZCBzdG9yZVxuICAgIGxldCBjb21waWxlciA9IG5ldyBDb21waWxlcigwLCBuZXcgRW52KCksIG5ldyBTdG9yZSgpLCBfLm1lcmdlKHRoaXMuY29udGV4dCwge1xuICAgICAgY3VycmVudFNjb3BlOiBbb3V0U2NvcGUsIGluU2NvcGVdLFxuICAgICAgY3dkOiBwYXRoID09PSAnPDxlbnRyeXBvaW50Pj4nID8gdGhpcy5jb250ZXh0LmN3ZCA6IGRpcm5hbWUocGF0aClcbiAgICB9KSk7XG4gICAgbGV0IHRlcm1zID0gY29tcGlsZXIuY29tcGlsZShzdHhsLm1hcChzID0+XG4gICAgICBzLmFkZFNjb3BlKG91dFNjb3BlLCB0aGlzLmNvbnRleHQuYmluZGluZ3MsIEFMTF9QSEFTRVMpXG4gICAgICAgLmFkZFNjb3BlKGluU2NvcGUsIHRoaXMuY29udGV4dC5iaW5kaW5ncywgMClcbiAgICApKTtcblxuICAgIGxldCBpbXBvcnRFbnRyaWVzID0gW107XG4gICAgbGV0IGV4cG9ydEVudHJpZXMgPSBbXTtcbiAgICBsZXQgcHJhZ21hcyA9IFtdO1xuICAgIGxldCBmaWx0ZXJlZFRlcm1zID0gdGVybXMucmVkdWNlKChhY2MsIHQpID0+IHtcbiAgICAgIHJldHVybiBfLmNvbmQoW1xuICAgICAgICBbVC5pc0ltcG9ydCwgdCA9PiB7XG4gICAgICAgICAgaW1wb3J0RW50cmllcy5wdXNoKHQpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1dLFxuICAgICAgICBbVC5pc0V4cG9ydCwgdCA9PiB7XG4gICAgICAgICAgLy8gZXhwb3J0RW50cmllcy5wdXNoKHQpO1xuICAgICAgICAgIC8vIHJldHVybiBhY2MuY29uY2F0KHQpO1xuICAgICAgICAgIGlmICh0LmRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICBleHBvcnRFbnRyaWVzLnB1c2goY29udmVydEV4cG9ydCh0KSk7XG4gICAgICAgICAgICBpZiAoVC5pc1ZhcmlhYmxlRGVjbGFyYXRpb24odC5kZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQobmV3IFRlcm0oJ1ZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQnLCB7XG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb246IHQuZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQodC5kZWNsYXJhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4cG9ydEVudHJpZXMucHVzaCh0KTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XSxcbiAgICAgICAgW1QuaXNQcmFnbWEsIHQgPT4geyBwcmFnbWFzLnB1c2godCk7IHJldHVybiBhY2M7IH0gXSxcbiAgICAgICAgW18uVCwgdCA9PiBhY2MuY29uY2F0KHQpIF1cbiAgICAgIF0pKHQpO1xuICAgIH0sIExpc3QoKSk7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGUoXG4gICAgICBwYXRoLFxuICAgICAgbW9kLmlzTmF0aXZlLFxuICAgICAgTGlzdChpbXBvcnRFbnRyaWVzKSxcbiAgICAgIExpc3QoZXhwb3J0RW50cmllcyksXG4gICAgICBMaXN0KHByYWdtYXMpLFxuICAgICAgZmlsdGVyZWRUZXJtc1xuICAgICk7XG4gIH1cblxuICBjb21waWxlRW50cnlwb2ludChzb3VyY2UsIGZpbGVuYW1lLCBlbmZvcmNlUHJhZ21hID0gZmFsc2UpIHtcbiAgICBsZXQgc3R4bCA9IHRoaXMubG9hZFN0cmluZyhzb3VyY2UsIGZhbHNlKTtcbiAgICBpZiAoZW5mb3JjZVByYWdtYSAmJiBzdHhsLmlzTmF0aXZlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVudHJ5cG9pbnQgJHtmaWxlbmFtZX0gbXVzdCBiZWdpbiB3aXRoICNsYW5nIHByYWdtYWApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRBdFBoYXNlKCc8PGVudHJ5cG9pbnQ+PicsIDAsIHRoaXMuY29udGV4dC5jd2QsIHN0eGwpO1xuICB9XG5cbiAgLy8gTW9kdWxlcyBoYXZlIGEgdW5pcXVlIHNjb3BlIHBlci1waGFzZS4gV2UgY29tcGlsZSBlYWNoIG1vZHVsZSBvbmNlIGF0XG4gIC8vIHBoYXNlIDAgYW5kIHN0b3JlIHRoZSBjb21waWxlZCBtb2R1bGUgaW4gYSBtYXAuIFRoZW4sIGFzIHdlIGFzayBmb3JcbiAgLy8gdGhlIG1vZHVsZSBpbiBhIHBhcnRpY3VsYXIgcGhhc2UsIHdlIGFkZCB0aGF0IG5ldyBwaGFzZS1zcGVjaWZpYyBzY29wZVxuICAvLyB0byB0aGUgY29tcGlsZWQgbW9kdWxlIGFuZCB1cGRhdGUgdGhlIG1hcCB3aXRoIHRoZSBtb2R1bGUgYXQgdGhhdCBzcGVjaWZpY1xuICAvLyBwaGFzZS5cbiAgZ2V0QXRQaGFzZShyYXdQYXRoLCBwaGFzZSwgY3dkLCByYXdTdHhsID0gbnVsbCkge1xuICAgIGxldCBwYXRoID0gcmF3UGF0aCA9PT0gJzw8ZW50cnlwb2ludD4+JyA/IHJhd1BhdGggOiB0aGlzLmNvbnRleHQubW9kdWxlUmVzb2x2ZXIocmF3UGF0aCwgY3dkKTtcbiAgICBsZXQgbWFwS2V5ID0gYCR7cGF0aH06JHtwaGFzZX1gO1xuICAgIGlmICghdGhpcy5jb21waWxlZE1vZHVsZXMuaGFzKG1hcEtleSkpIHtcbiAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICBsZXQgc3R4bCA9IHJhd1N0eGwgIT0gbnVsbCA/IHJhd1N0eGwgOiB0aGlzLmxvYWQocGF0aCk7XG4gICAgICAgIHRoaXMuY29tcGlsZWRNb2R1bGVzLnNldChtYXBLZXksIHRoaXMuY29tcGlsZShzdHhsLCBwYXRoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcmF3TW9kID0gdGhpcy5nZXRBdFBoYXNlKHJhd1BhdGgsIDAsIGN3ZCwgcmF3U3R4bCk7XG4gICAgICAgIGxldCBzY29wZSA9IGZyZXNoU2NvcGUoYGluc2lkZUVkZ2Uke3BoYXNlfWApO1xuICAgICAgICB0aGlzLmNvbXBpbGVkTW9kdWxlcy5zZXQobWFwS2V5LCBuZXcgTW9kdWxlKFxuICAgICAgICAgIHJhd01vZC5tb2R1bGVTcGVjaWZpZXIsXG4gICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgcmF3TW9kLmltcG9ydEVudHJpZXMubWFwKHRlcm0gPT4gdGVybS5hZGRTY29wZShzY29wZSwgdGhpcy5jb250ZXh0LmJpbmRpbmdzLCBwaGFzZSkpLFxuICAgICAgICAgIHJhd01vZC5leHBvcnRFbnRyaWVzLm1hcCh0ZXJtID0+IHRlcm0uYWRkU2NvcGUoc2NvcGUsIHRoaXMuY29udGV4dC5iaW5kaW5ncywgcGhhc2UpKSxcbiAgICAgICAgICByYXdNb2QucHJhZ21hcyxcbiAgICAgICAgICByYXdNb2QuYm9keS5tYXAodGVybSA9PiB0ZXJtLmFkZFNjb3BlKHNjb3BlLCB0aGlzLmNvbnRleHQuYmluZGluZ3MsIHBoYXNlKSlcbiAgICAgICAgKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbXBpbGVkTW9kdWxlcy5nZXQobWFwS2V5KTtcbiAgfVxuXG4gIGhhcyhyYXdQYXRoLCBwaGFzZSA9IDApIHtcbiAgICBsZXQgcGF0aCA9IHJhd1BhdGggPT09ICc8PGVudHJ5cG9pbnQ+PicgPyByYXdQYXRoIDogdGhpcy5jb250ZXh0Lm1vZHVsZVJlc29sdmVyKHJhd1BhdGgsIHRoaXMuY29udGV4dC5jd2QpO1xuICAgIGxldCBrZXkgPSBgJHtwYXRofToke3BoYXNlfWA7XG4gICAgcmV0dXJuIHRoaXMuY29tcGlsZWRNb2R1bGVzLmhhcyhrZXkpICYmICF0aGlzLmNvbXBpbGVkTW9kdWxlcy5nZXQoa2V5KS5pc05hdGl2ZTtcbiAgfVxuXG4gIHJlZ2lzdGVyU3ludGF4RGVjbGFyYXRpb24odGVybSwgcGhhc2UsIHN0b3JlKSB7XG4gICAgdGVybS5kZWNsYXJhdG9ycy5mb3JFYWNoKGRlY2wgPT4ge1xuICAgICAgbGV0IHZhbCA9IGV2YWxDb21waWxldGltZVZhbHVlKGRlY2wuaW5pdC5nZW4oKSwgXy5tZXJnZSh0aGlzLmNvbnRleHQsIHtcbiAgICAgICAgcGhhc2U6IHBoYXNlICsgMSwgc3RvcmVcbiAgICAgIH0pKTtcbiAgICAgIGNvbGxlY3RCaW5kaW5ncyhkZWNsLmJpbmRpbmcpLmZvckVhY2goc3R4ID0+IHtcbiAgICAgICAgaWYgKHBoYXNlICE9PSAwKSB7IC8vIHBoYXNlIDAgYmluZGluZ3MgZXh0ZW5kIHRoZSBiaW5kaW5nIG1hcCBkdXJpbmcgY29tcGlsYXRpb25cbiAgICAgICAgICBsZXQgbmV3QmluZGluZyA9IGdlbnN5bShzdHgudmFsKCkpO1xuICAgICAgICAgIHRoaXMuY29udGV4dC5iaW5kaW5ncy5hZGQoc3R4LCB7XG4gICAgICAgICAgICBiaW5kaW5nOiBuZXdCaW5kaW5nLFxuICAgICAgICAgICAgcGhhc2U6IHBoYXNlLFxuICAgICAgICAgICAgc2tpcER1cDogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzb2x2ZWROYW1lID0gc3R4LnJlc29sdmUocGhhc2UpO1xuICAgICAgICBzdG9yZS5zZXQocmVzb2x2ZWROYW1lLCBuZXcgQ29tcGlsZXRpbWVUcmFuc2Zvcm0odmFsKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyVmFyaWFibGVEZWNsYXJhdGlvbih0ZXJtLCBwaGFzZSwgc3RvcmUpIHtcbiAgICB0ZXJtLmRlY2xhcmF0b3JzLmZvckVhY2goZGVjbCA9PiB7XG4gICAgICBjb2xsZWN0QmluZGluZ3MoZGVjbC5iaW5kaW5nKS5mb3JFYWNoKHN0eCA9PiB7XG4gICAgICAgIGlmIChwaGFzZSAhPT0gMCkgeyAvLyBwaGFzZSAwIGJpbmRpbmdzIGV4dGVuZCB0aGUgYmluZGluZyBtYXAgZHVyaW5nIGNvbXBpbGF0aW9uXG4gICAgICAgICAgbGV0IG5ld0JpbmRpbmcgPSBnZW5zeW0oc3R4LnZhbCgpKTtcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYmluZGluZ3MuYWRkKHN0eCwge1xuICAgICAgICAgICAgYmluZGluZzogbmV3QmluZGluZyxcbiAgICAgICAgICAgIHBoYXNlOiBwaGFzZSxcbiAgICAgICAgICAgIHNraXBEdXA6IHRlcm0ua2luZCA9PT0gJ3ZhcidcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzb2x2ZWROYW1lID0gc3R4LnJlc29sdmUocGhhc2UpO1xuICAgICAgICBzdG9yZS5zZXQocmVzb2x2ZWROYW1lLCBuZXcgVmFyQmluZGluZ1RyYW5zZm9ybShzdHgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmVnaXN0ZXJGdW5jdGlvbk9yQ2xhc3ModGVybSwgcGhhc2UsIHN0b3JlKSB7XG4gICAgY29sbGVjdEJpbmRpbmdzKHRlcm0ubmFtZSkuZm9yRWFjaChzdHggPT4ge1xuICAgICAgaWYgKHBoYXNlICE9PSAwKSB7XG4gICAgICAgIGxldCBuZXdCaW5kaW5nID0gZ2Vuc3ltKHN0eC52YWwoKSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5iaW5kaW5ncy5hZGQoc3R4LCB7XG4gICAgICAgICAgYmluZGluZzogbmV3QmluZGluZyxcbiAgICAgICAgICBwaGFzZTogcGhhc2UsXG4gICAgICAgICAgc2tpcER1cDogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBsZXQgcmVzb2x2ZWROYW1lID0gc3R4LnJlc29sdmUocGhhc2UpO1xuICAgICAgc3RvcmUuc2V0KHJlc29sdmVkTmFtZSwgbmV3IFZhckJpbmRpbmdUcmFuc2Zvcm0oc3R4KSk7XG4gICAgfSk7XG4gIH1cblxuICB2aXNpdChtb2QsIHBoYXNlLCBzdG9yZSkge1xuICAgIC8vIFRPRE86IHJlY3Vyc2l2ZWx5IHZpc2l0IGltcG9ydHNcbiAgICBtb2QuYm9keS5mb3JFYWNoKHRlcm0gPT4ge1xuICAgICAgaWYgKFQuaXNTeW50YXhEZWNsYXJhdGlvblN0YXRlbWVudCh0ZXJtKSkge1xuICAgICAgICB0aGlzLnJlZ2lzdGVyU3ludGF4RGVjbGFyYXRpb24odGVybS5kZWNsYXJhdGlvbiwgcGhhc2UsIHN0b3JlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RvcmU7XG4gIH1cblxuICBpbnZva2UobW9kLCBwaGFzZSwgc3RvcmUpIHtcbiAgICAvLyBUT0RPOiByZWN1cnNpdmVseSB2aXNpdCBpbXBvcnRzXG4gICAgbGV0IGJvZHkgPSBtb2QuYm9keS5maWx0ZXIoXy5jb21wbGVtZW50KFQuaXNDb21waWxldGltZVN0YXRlbWVudCkpLm1hcCh0ZXJtID0+IHtcbiAgICAgIHRlcm0gPSB0ZXJtLmdlbigpOyAvLyBUT0RPOiBjYW4gd2UgcmVtb3ZlIHRoZSBuZWVkIGZvciBnZW4/IGhhdmUgdG8gZGVlcGx5IHJlbW92ZSBjb21waWxldGltZSBjb2RlXG4gICAgICBpZiAoVC5pc1ZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQodGVybSkpIHtcbiAgICAgICAgdGhpcy5yZWdpc3RlclZhcmlhYmxlRGVjbGFyYXRpb24odGVybS5kZWNsYXJhdGlvbiwgcGhhc2UsIHN0b3JlKTtcbiAgICAgIH0gZWxzZSBpZiAoVC5pc0Z1bmN0aW9uRGVjbGFyYXRpb24odGVybSkpIHtcbiAgICAgICAgdGhpcy5yZWdpc3RlckZ1bmN0aW9uT3JDbGFzcyh0ZXJtLCBwaGFzZSwgc3RvcmUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRlcm07XG4gICAgfSk7XG4gICAgZXZhbFJ1bnRpbWVWYWx1ZXMoYm9keSwgXy5tZXJnZSh0aGlzLmNvbnRleHQsIHtcbiAgICAgIHN0b3JlLCBwaGFzZVxuICAgIH0pKTtcbiAgICByZXR1cm4gc3RvcmU7XG4gIH1cbn1cbiJdfQ==