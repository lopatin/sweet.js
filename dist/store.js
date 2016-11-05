'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Store {
  constructor() {
    this.map = new Map();
    this.nodeContext = _vm2.default.createContext();
  }

  has(key) {
    return this.map.has(key);
  }

  get(key) {
    return this.map.get(key);
  }

  set(key, val) {
    this.nodeContext[key] = val;
    return this.map.set(key, val);
  }

  getNodeContext() {
    return this.nodeContext;
  }
}
exports.default = Store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZS5qcyJdLCJuYW1lcyI6WyJTdG9yZSIsImNvbnN0cnVjdG9yIiwibWFwIiwiTWFwIiwibm9kZUNvbnRleHQiLCJjcmVhdGVDb250ZXh0IiwiaGFzIiwia2V5IiwiZ2V0Iiwic2V0IiwidmFsIiwiZ2V0Tm9kZUNvbnRleHQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7Ozs7QUFFZSxNQUFNQSxLQUFOLENBQVk7QUFDekJDLGdCQUFjO0FBQ1osU0FBS0MsR0FBTCxHQUFXLElBQUlDLEdBQUosRUFBWDtBQUNBLFNBQUtDLFdBQUwsR0FBbUIsYUFBR0MsYUFBSCxFQUFuQjtBQUNEOztBQUVEQyxNQUFJQyxHQUFKLEVBQVM7QUFDUCxXQUFPLEtBQUtMLEdBQUwsQ0FBU0ksR0FBVCxDQUFhQyxHQUFiLENBQVA7QUFDRDs7QUFFREMsTUFBSUQsR0FBSixFQUFTO0FBQ1AsV0FBTyxLQUFLTCxHQUFMLENBQVNNLEdBQVQsQ0FBYUQsR0FBYixDQUFQO0FBQ0Q7O0FBRURFLE1BQUlGLEdBQUosRUFBU0csR0FBVCxFQUFjO0FBQ1osU0FBS04sV0FBTCxDQUFpQkcsR0FBakIsSUFBd0JHLEdBQXhCO0FBQ0EsV0FBTyxLQUFLUixHQUFMLENBQVNPLEdBQVQsQ0FBYUYsR0FBYixFQUFrQkcsR0FBbEIsQ0FBUDtBQUNEOztBQUVEQyxtQkFBaUI7QUFDZixXQUFPLEtBQUtQLFdBQVo7QUFDRDtBQXJCd0I7a0JBQU5KLEsiLCJmaWxlIjoic3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdm0gZnJvbSAndm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdG9yZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubWFwID0gbmV3IE1hcCgpO1xuICAgIHRoaXMubm9kZUNvbnRleHQgPSB2bS5jcmVhdGVDb250ZXh0KCk7XG4gIH1cblxuICBoYXMoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhcyhrZXkpO1xuICB9XG5cbiAgZ2V0KGtleSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5nZXQoa2V5KTtcbiAgfVxuXG4gIHNldChrZXksIHZhbCkge1xuICAgIHRoaXMubm9kZUNvbnRleHRba2V5XSA9IHZhbDtcbiAgICByZXR1cm4gdGhpcy5tYXAuc2V0KGtleSwgdmFsKTtcbiAgfVxuXG4gIGdldE5vZGVDb250ZXh0KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGVDb250ZXh0O1xuICB9XG59XG4iXX0=