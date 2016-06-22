import { parse } from "../src/sweet";
import compile, { load, SweetLoader } from '../src/sweet-loader';
import expect from "expect.js";
import { zip, curry, equals, cond, identity, T, and, compose, type, mapObjIndexed, map, keys, has } from 'ramda';
import { transform } from 'babel-core';
import Reader from "../src/shift-reader";
import { Enforester } from "../src/enforester";
import { List } from "immutable";

export const stmt = x => x.items[0];
export const expr = x => stmt(x).expression;
export const items = x => x.items;

export function makeEnforester(code) {
  let reader = new Reader(code);
  let stxl = reader.read();
  return new Enforester(stxl, List(), {});
}

export function testParseFailure() {
  // TODO
}

function testParseWithOpts(code, acc, expectedAst, options) {
  let parsedAst = parse(code, options, options.includeImports);
  let isString = (x) => type(x) === 'String';
  let isObject = (x) => type(x) === 'Object';
  let isArray = (x) => type(x) === 'Array';

  function checkObjects(expected, actual) {
    let checkWithHygiene = cond([
      [and(isString, equals('<<hygiene>>')), curry((a, b) => true)],
      [isObject, curry((a, b) => checkObjects(a, b))],
      [isArray, curry((a, b) => map(([a, b]) => checkObjects(a, b), zip(a, b)))],
      [T, curry((a, b) => expect(b).to.be(a))]
    ]);

    mapObjIndexed((prop, key, ob) => {
      let checker = checkWithHygiene(prop);
      expect(actual).to.have.property(key);
      checker(actual[key]);
    }, expected);
  }
  try {
    checkObjects(expectedAst, acc(parsedAst));
  } catch (e) {
    throw new Error(e.message);
  }
}

let isString = (x) => type(x) === 'String';
let isObject = (x) => type(x) === 'Object';
let isArray = (x) => type(x) === 'Array';

function checkObjects(expected, actual) {
  let checkWithHygiene = cond([
    [and(isString, equals('<<hygiene>>')), curry((a, b) => true)],
    [isObject, curry((a, b) => checkObjects(a, b))],
    [isArray, curry((a, b) => map(([a, b]) => checkObjects(a, b), zip(a, b)))],
    [T, curry((a, b) => expect(b).to.be(a))]
  ]);

  mapObjIndexed((prop, key, ob) => {
    let checker = checkWithHygiene(prop);
    expect(actual).to.have.property(key);
    checker(actual[key]);
  }, expected);
}

export function testParse(source, acc, expectedAst) {
  let store = new Map();
  store.set('entry.js', source);

  let mod = compile('entry.js', store);
  let ast = mod.parse();
  try {
    checkObjects(expectedAst, acc(ast));
  } catch (e) {
    throw new Error(e.message);
  }
}


export function testEval(source, cb) {
  let store = new Map();
  store.set('entry.js', source);
  let mod = compile('entry.js', store);

  var output;
  var result = mod.codegen();
  try {
    eval(result);
  } catch (e) {
  throw new Error(`Syntax error: ${e.message}

${result}`);
  }
  return cb(output);
}


export function testThrow(source) {
  // expect(() => compile(source, { cwd: '.', transform})).to.throwError();
}
