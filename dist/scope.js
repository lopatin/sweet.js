"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.freshScope = freshScope;
exports.Scope = Scope;

var _symbol = require("./symbol");

let scopeIndex = 0;

function freshScope() {
  let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "scope";

  scopeIndex++;
  return (0, _symbol.Symbol)(name + "_" + scopeIndex);
}

function Scope(name) {
  return (0, _symbol.Symbol)(name);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY29wZS5qcyJdLCJuYW1lcyI6WyJmcmVzaFNjb3BlIiwiU2NvcGUiLCJzY29wZUluZGV4IiwibmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFJZ0JBLFUsR0FBQUEsVTtRQUtBQyxLLEdBQUFBLEs7O0FBVGhCOztBQUVBLElBQUlDLGFBQWEsQ0FBakI7O0FBRU8sU0FBU0YsVUFBVCxHQUFvQztBQUFBLE1BQWhCRyxJQUFnQix1RUFBVCxPQUFTOztBQUN6Q0Q7QUFDQSxTQUFPLG9CQUFPQyxPQUFPLEdBQVAsR0FBYUQsVUFBcEIsQ0FBUDtBQUNEOztBQUVNLFNBQVNELEtBQVQsQ0FBZUUsSUFBZixFQUFxQjtBQUMxQixTQUFPLG9CQUFPQSxJQUFQLENBQVA7QUFDRCIsImZpbGUiOiJzY29wZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN5bWJvbCB9IGZyb20gXCIuL3N5bWJvbFwiO1xuXG5sZXQgc2NvcGVJbmRleCA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmVzaFNjb3BlKG5hbWUgPSBcInNjb3BlXCIpIHtcbiAgc2NvcGVJbmRleCsrO1xuICByZXR1cm4gU3ltYm9sKG5hbWUgKyBcIl9cIiArIHNjb3BlSW5kZXgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2NvcGUobmFtZSkge1xuICByZXR1cm4gU3ltYm9sKG5hbWUpO1xufVxuIl19