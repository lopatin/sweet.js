import { Loader } from 'es6-module-loader';
import { Modules } from './modules';
import Reader from "./shift-reader";
import { Scope, freshScope } from "./scope";
import Env from "./env";
import Store from "./store";
import { List } from 'immutable';
import Compiler from "./compiler";
import { ALL_PHASES } from './syntax';
import BindingMap from "./binding-map.js";
import * as _ from "ramda";
import * as T from './terms';

const phaseInModulePathRegexp = /(.*):(\d+)\s*$/;

const isCompiletimeItem = _.either(T.isCompiletimeStatement, T.isExportSyntax);

class SweetModule {
  constructor(items) {
    this.items = items;
  }

  runtimeItems() {
    return this.items.filter(_.complement(isCompiletimeItem));
  }

  compiletimeItems() {
    return this.items.filter(isCompiletimeItem);
  }

  importEntries() {
    return this.items.filter(T.isImportDeclaration);
  }

  exportEntries() {
    return this.items.filter(T.isExportDeclaration);
  }
}

export class SweetLoader extends Loader {
  constructor() {
    super();
    this.sourceCache = new Map();
    this.compiledCache = new Map();

    let bindings = new BindingMap();
    this.context = {
      bindings,
      loader: this,
      transform: c => {
        return { code: c };
      }
    };
  }

  normalize(name, refererName, refererAddress) {
    // takes `..path/to/source.js:<phase>`
    // gives `/abs/path/to/source.js:<phase>`
    // missing phases are turned into 0
    if (!phaseInModulePathRegexp.test(name)) {
      return `${name}:0`;
    }
    return name;
  }

  locate({name, metadata}) {
    // takes `/abs/path/to/source.js:<phase>`
    // gives { path: '/abs/path/to/source.js', phase: <phase> }
    let match = name.match(phaseInModulePathRegexp);
    if (match && match.length >= 3) {
      return {
        path: match[1],
        phase: parseInt(match[2], 10)
      };
    }
    throw new Error(`Module ${name} is missing phase information`);
  }

  fetch({name, address, metadata}) {
    let self = this;
    return new Promise((resolve, reject) => {
      if (self.sourceCache.has(address.path)) {
        setTimeout(() => resolve(self.sourceCache.get(address.path)), 0);
      } else {
        require('fs').readFile(address.path, 'utf8', (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          self.sourceCache.set(address.path, data);
          resolve(data);
        });
      }
    });
  }

  translate({name, address, source, metadata}) {
    let self = this;
    if (this.compiledCache.has(address.path)) {
      return this.compiledCache.get(address.path);
    }
    return this.compile(source).then(compiledModule => {
      self.compiledCache.set(address.path, compiledModule);
      return compiledModule;
    });
  }

  instantiate({name, address, source, metadata}) {
    let self = this;
    return {
      deps: [], // dependencies at needed phases
      execute() {
        return self.newModule({ a: 'a' });
      }
    };
  }


  read(source) {
    return new Reader(source).read();
  }

  compile(source) {
    let stxl = this.read(source);
    let outScope = freshScope('outsideEdge');
    let inScope = freshScope('insideEdge0');
    // the compiler starts at phase 0, with an empty environment and store
    let compiler = new Compiler(0, new Env(), new Store(),  _.merge(this.context, {
      currentScope: [outScope, inScope],
    }));
    let mod = new SweetModule(compiler.compile(stxl.map(s =>
      s.addScope(outScope, this.context.bindings, ALL_PHASES)
       .addScope(inScope, this.context.bindings, 0)
    )));

    return Promise.resolve(mod);
  }

}

function makeLoader(debugStore) {
  let l = new SweetLoader();
  if (debugStore) {
    // debugging does not go through any normalization
    l.normalize = function normalize(name) {
      if (!phaseInModulePathRegexp.test(name)) {
        return `${name}:0`;
      }
      return name;
    };
    l.fetch = function fetch({ name, address, metadata }) {
      if (debugStore.has(address.path)) {
        return debugStore.get(address.path);
      }
      throw new Error(`The module ${name} is not in the debug store`);
    };
  }
  return l;
}

export function load(entryPath, debugStore) {
  let l = makeLoader(debugStore);
  return l.import(entryPath);
}

export default function compile(entryPath, debugStore) {
  let l = makeLoader(debugStore);
  return l.load(entryPath).then(function () {
    return l.compiledSource.get(l.normalize(entryPath));
  });
}
