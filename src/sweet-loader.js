import { Loader } from 'es6-module-loader';
import { Modules } from './modules';

class SweetAddress {
  constructor(path, phase) {
    this.path = path;
    this.phase = phase;
  }
}

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
    let compiledModule = this.compile(source);
    this.compiledSource.set(address, CodeGen.gen(compiledModule));
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
