import { Loader } from 'es6-module-loader';
import { Modules } from './modules';

class SweetLoader extends Loader {
  constructor(debugRegistry) {
    super();
    this.debugRegistry = debugRegistry;
    this.compiledSource = new Map();
  }

  // override
  normalize(name) {
    return name;
  }

  // override
  locate({name, metadata}) {
    return name;
  }

  // override
  fetch({name, address, metadata}) {
    return this.debugRegistry[address];
  }

  // override
  translate({name, address, source, metadata}) {
    this.compile(source);
    this.compiledSource.set(name, source);
    return source;
  }

  // override
  instantiate({name, address, source, metadata}) {
    let self = this;
    return {
      deps: [],
      execute() {
        return self.newModule({ a: 'a' });
      }
    };
  }



  compile(mod, path) {
    let stxl = mod.body;
    let outScope = freshScope('outsideEdge');
    let inScope = freshScope(`insideEdge0`);
    // the compiler starts at phase 0, with an empty environment and store
    let compiler = new Compiler(0, new Env(), new Store(), _.merge(this.context, {
      currentScope: [outScope, inScope],
      cwd: path === '<<entrypoint>>' ? this.context.cwd : dirname(path)
    }));
    let terms = compiler.compile(stxl.map(s =>
      s.addScope(outScope, this.context.bindings, ALL_PHASES)
       .addScope(inScope, this.context.bindings, 0)
    ));

    let importEntries = [];
    let exportEntries = [];
    let pragmas = [];
    let filteredTerms = terms.reduce((acc, t) => {
      return _.cond([
        [isImport, t => {
          importEntries.push(t);
          return acc;
        }],
        [isExport, t => {
          // exportEntries.push(t);
          // return acc.concat(t);
          if (t.declaration) {
            exportEntries.push(convertExport(t));
            if (isVariableDeclaration(t.declaration)) {
              return acc.concat(new Term('VariableDeclarationStatement', {
                declaration: t.declaration
              }));
            }
            return acc.concat(t.declaration);
          }
          exportEntries.push(t);
          return acc;
        }],
        [isPragma, t => { pragmas.push(t); return acc; } ],
        [_.T, t => acc.concat(t) ]
      ])(t);
    }, List());
    return new Module(
      path,
      mod.isNative,
      List(importEntries),
      List(exportEntries),
      List(pragmas),
      filteredTerms
    );
  }

}

// type Path = string

// (Path, SweetOptions) -> Promise<Module>
export function load(entryPath, registry) {
  let l = new SweetLoader(registry);
  return l.import(entryPath);
}

// (Path, SweetOptions) -> Promise<string>
export default function compile(entryPath, registry) {
  let l = new SweetLoader(registry);
  return l.import(entryPath).then(function (mod) {
    return l.compiledSource.get(l.normalize(entryPath));
  });
}
