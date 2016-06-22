import { Modules } from './modules';
import Reader from './shift-reader';
import { Scope, freshScope } from './scope';
import Env from './env';
import Store from './store';
import { List } from 'immutable';
import Compiler from './compiler';
import { ALL_PHASES } from './syntax';
import BindingMap from './binding-map.js';
import SweetModule from './sweet-module';
import * as _ from 'ramda';
import * as T from './terms';

const phaseInModulePathRegexp = /(.*):(\d+)\s*$/;

const isCompiletimeItem = _.either(T.isCompiletimeStatement, T.isExportSyntax);

export class SweetLoader {
  constructor() {
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
    // console.log(match);
    if (match && match.length >= 3) {
      return {
        path: match[1],
        phase: parseInt(match[2], 10)
      };
    }
    throw new Error(`Module ${name} is missing phase information`);
  }

  fetch({name, address, metadata}) {
    if (this.sourceCache.has(address.path)) {
      return this.sourceCache.get(address.path);
    } else {
      let data = require('fs').readFileSync(address.path, 'utf8');
      this.sourceCache.set(address.path, data);
      return data;
    }
  }

  translate({name, address, source, metadata}) {
    if (this.compiledCache.has(address.path)) {
      return this.compiledCache.get(address.path);
    }
    let compiledModule = this.compileSource(source);
    this.compiledCache.set(address.path, compiledModule);
    return compiledModule;
  }

  instantiate({name, address, source, metadata}) {
    throw new Error('Not implemented yet');
  }

  load(entryPath) {
    let metadata = {};
    let name = this.normalize(entryPath);
    let address = this.locate({ name, metadata });
    let source = this.fetch({ name, address, metadata });
    source = this.translate({ name, address, source, metadata });
    return this.instantiate({ name, address, source, metadata });
  }

  // skip instantiate
  compile(entryPath) {
    let metadata = {};
    let name = this.normalize(entryPath);
    let address = this.locate({ name, metadata });
    let source = this.fetch({ name, address, metadata });
    return this.translate({ name, address, source, metadata });
  }

  read(source) {
    return new Reader(source).read();
  }

  compileSource(source) {
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

    return mod;
  }
}

function makeLoader(debugStore) {
  let l = new SweetLoader();
  if (debugStore) {
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
  return makeLoader(debugStore).load(entryPath);
}

export default function compile(entryPath, debugStore) {
  return makeLoader(debugStore).compile(entryPath);
}
