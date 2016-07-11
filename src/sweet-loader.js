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
import SweetModule from './sweet-module';
import * as _ from "ramda";
import * as T from './terms';

const phaseInModulePathRegexp = /(.*):(\d+)\s*$/;

const isCompiletimeItem = _.either(T.isCompiletimeStatement, T.isExportSyntax);

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
      return Promise.resolve(`${name}:0`);
    }
    return Promise.resolve(name);
  }

  locate({name, metadata}) {
    // takes `/abs/path/to/source.js:<phase>`
    // gives { path: '/abs/path/to/source.js', phase: <phase> }
    let match = name.match(phaseInModulePathRegexp);
    if (match && match.length >= 3) {
      return Promise.resolve({
        path: match[1],
        phase: parseInt(match[2], 10)
      });
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
      return Promise.resolve(this.compiledCache.get(address.path));
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
        if (address.phase === 0) {
          return self.newModule({});
        }
        return self.newModule({ a: 'a' });
      }
    };
  }

  // skip instantiate
  getCompiled(entryPath) {
    this.normalize(entryPath)
        .then(name => {
          return { name, addr: this.locate({ name, metadata: {} }) };
        })
        .then(({name, addr, metadata}) => {
          return { name, addr, metadata, source: this.fetch({ name, addr, metadata }) };
        })
        .then(({name, addr, source, metadata}) => {
          return this.translate({ name, addr, source, metadata });
        });
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
    l.normalize = function normalize(name) {
      if (!phaseInModulePathRegexp.test(name)) {
        return Promise.resolve(`${name}:0`);
      }
      return Promise.resolve(name);
    };
    l.fetch = function fetch({ name, address, metadata }) {
      if (debugStore.has(address.path)) {
        return Promise.resolve(debugStore.get(address.path));
      }
      throw new Error(`The module ${name} is not in the debug store`);
    };
  }
  return l;
}

export function load(entryPath, debugStore) {
  return makeLoader(debugStore).import(entryPath);
}

export default function compile(entryPath, debugStore) {
  return makeLoader(debugStore).getCompiled(entryPath);
}
