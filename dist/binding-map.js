"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _immutable = require("immutable");

var _errors = require("./errors");

var _ramdaFantasy = require("ramda-fantasy");

class BindingMap {
  constructor() {
    this._map = new Map();
  }

  // given a syntax object and a binding,
  // add the binding to the map associating the binding with the syntax object's
  // scope set
  add(stx, _ref) {
    let binding = _ref.binding,
        phase = _ref.phase;
    var _ref$skipDup = _ref.skipDup;
    let skipDup = _ref$skipDup === undefined ? false : _ref$skipDup;

    let stxName = stx.val();
    let allScopeset = stx.scopesets.all;
    let scopeset = stx.scopesets.phase.has(phase) ? stx.scopesets.phase.get(phase) : (0, _immutable.List)();
    scopeset = allScopeset.concat(scopeset);
    (0, _errors.assert)(phase != null, "must provide a phase for binding add");

    if (this._map.has(stxName)) {
      let scopesetBindingList = this._map.get(stxName);
      if (skipDup && scopesetBindingList.some(s => s.scopes.equals(scopeset))) {
        return;
      }
      this._map.set(stxName, scopesetBindingList.push({
        scopes: scopeset,
        binding: binding,
        alias: _ramdaFantasy.Maybe.Nothing()
      }));
    } else {
      this._map.set(stxName, _immutable.List.of({
        scopes: scopeset,
        binding: binding,
        alias: _ramdaFantasy.Maybe.Nothing()
      }));
    }
  }

  addForward(stx, forwardStx, binding, phase) {
    let stxName = stx.token.value;
    let allScopeset = stx.scopesets.all;
    let scopeset = stx.scopesets.phase.has(phase) ? stx.scopesets.phase.get(phase) : (0, _immutable.List)();
    scopeset = allScopeset.concat(scopeset);
    (0, _errors.assert)(phase != null, "must provide a phase for binding add");

    if (this._map.has(stxName)) {
      let scopesetBindingList = this._map.get(stxName);
      this._map.set(stxName, scopesetBindingList.push({
        scopes: scopeset,
        binding: binding,
        alias: _ramdaFantasy.Maybe.of(forwardStx)
      }));
    } else {
      this._map.set(stxName, _immutable.List.of({
        scopes: scopeset,
        binding: binding,
        alias: _ramdaFantasy.Maybe.of(forwardStx)
      }));
    }
  }

  // Syntax -> ?List<{ scopes: ScopeSet, binding: Binding }>
  get(stx) {
    return this._map.get(stx.token.value);
  }

}
exports.default = BindingMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5kaW5nLW1hcC5qcyJdLCJuYW1lcyI6WyJCaW5kaW5nTWFwIiwiY29uc3RydWN0b3IiLCJfbWFwIiwiTWFwIiwiYWRkIiwic3R4IiwiYmluZGluZyIsInBoYXNlIiwic2tpcER1cCIsInN0eE5hbWUiLCJ2YWwiLCJhbGxTY29wZXNldCIsInNjb3Blc2V0cyIsImFsbCIsInNjb3Blc2V0IiwiaGFzIiwiZ2V0IiwiY29uY2F0Iiwic2NvcGVzZXRCaW5kaW5nTGlzdCIsInNvbWUiLCJzIiwic2NvcGVzIiwiZXF1YWxzIiwic2V0IiwicHVzaCIsImFsaWFzIiwiTm90aGluZyIsIm9mIiwiYWRkRm9yd2FyZCIsImZvcndhcmRTdHgiLCJ0b2tlbiIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFZSxNQUFNQSxVQUFOLENBQWlCO0FBQzlCQyxnQkFBYztBQUNaLFNBQUtDLElBQUwsR0FBWSxJQUFJQyxHQUFKLEVBQVo7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQUMsTUFBSUMsR0FBSixRQUE4QztBQUFBLFFBQW5DQyxPQUFtQyxRQUFuQ0EsT0FBbUM7QUFBQSxRQUExQkMsS0FBMEIsUUFBMUJBLEtBQTBCO0FBQUEsNEJBQW5CQyxPQUFtQjtBQUFBLFFBQW5CQSxPQUFtQixnQ0FBVCxLQUFTOztBQUM1QyxRQUFJQyxVQUFVSixJQUFJSyxHQUFKLEVBQWQ7QUFDQSxRQUFJQyxjQUFjTixJQUFJTyxTQUFKLENBQWNDLEdBQWhDO0FBQ0EsUUFBSUMsV0FBV1QsSUFBSU8sU0FBSixDQUFjTCxLQUFkLENBQW9CUSxHQUFwQixDQUF3QlIsS0FBeEIsSUFBaUNGLElBQUlPLFNBQUosQ0FBY0wsS0FBZCxDQUFvQlMsR0FBcEIsQ0FBd0JULEtBQXhCLENBQWpDLEdBQWtFLHNCQUFqRjtBQUNBTyxlQUFXSCxZQUFZTSxNQUFaLENBQW1CSCxRQUFuQixDQUFYO0FBQ0Esd0JBQU9QLFNBQVMsSUFBaEIsRUFBc0Isc0NBQXRCOztBQUVBLFFBQUksS0FBS0wsSUFBTCxDQUFVYSxHQUFWLENBQWNOLE9BQWQsQ0FBSixFQUE0QjtBQUMxQixVQUFJUyxzQkFBc0IsS0FBS2hCLElBQUwsQ0FBVWMsR0FBVixDQUFjUCxPQUFkLENBQTFCO0FBQ0EsVUFBSUQsV0FBV1Usb0JBQW9CQyxJQUFwQixDQUF5QkMsS0FBS0EsRUFBRUMsTUFBRixDQUFTQyxNQUFULENBQWdCUixRQUFoQixDQUE5QixDQUFmLEVBQXlFO0FBQ3ZFO0FBQ0Q7QUFDRCxXQUFLWixJQUFMLENBQVVxQixHQUFWLENBQWNkLE9BQWQsRUFBdUJTLG9CQUFvQk0sSUFBcEIsQ0FBeUI7QUFDOUNILGdCQUFRUCxRQURzQztBQUU5Q1IsaUJBQVNBLE9BRnFDO0FBRzlDbUIsZUFBTyxvQkFBTUMsT0FBTjtBQUh1QyxPQUF6QixDQUF2QjtBQUtELEtBVkQsTUFVTztBQUNMLFdBQUt4QixJQUFMLENBQVVxQixHQUFWLENBQWNkLE9BQWQsRUFBdUIsZ0JBQUtrQixFQUFMLENBQVE7QUFDN0JOLGdCQUFRUCxRQURxQjtBQUU3QlIsaUJBQVNBLE9BRm9CO0FBRzdCbUIsZUFBTyxvQkFBTUMsT0FBTjtBQUhzQixPQUFSLENBQXZCO0FBS0Q7QUFDRjs7QUFFREUsYUFBV3ZCLEdBQVgsRUFBZ0J3QixVQUFoQixFQUE0QnZCLE9BQTVCLEVBQXFDQyxLQUFyQyxFQUE0QztBQUMxQyxRQUFJRSxVQUFVSixJQUFJeUIsS0FBSixDQUFVQyxLQUF4QjtBQUNBLFFBQUlwQixjQUFjTixJQUFJTyxTQUFKLENBQWNDLEdBQWhDO0FBQ0EsUUFBSUMsV0FBV1QsSUFBSU8sU0FBSixDQUFjTCxLQUFkLENBQW9CUSxHQUFwQixDQUF3QlIsS0FBeEIsSUFBaUNGLElBQUlPLFNBQUosQ0FBY0wsS0FBZCxDQUFvQlMsR0FBcEIsQ0FBd0JULEtBQXhCLENBQWpDLEdBQWtFLHNCQUFqRjtBQUNBTyxlQUFXSCxZQUFZTSxNQUFaLENBQW1CSCxRQUFuQixDQUFYO0FBQ0Esd0JBQU9QLFNBQVMsSUFBaEIsRUFBc0Isc0NBQXRCOztBQUVBLFFBQUksS0FBS0wsSUFBTCxDQUFVYSxHQUFWLENBQWNOLE9BQWQsQ0FBSixFQUE0QjtBQUMxQixVQUFJUyxzQkFBc0IsS0FBS2hCLElBQUwsQ0FBVWMsR0FBVixDQUFjUCxPQUFkLENBQTFCO0FBQ0EsV0FBS1AsSUFBTCxDQUFVcUIsR0FBVixDQUFjZCxPQUFkLEVBQXVCUyxvQkFBb0JNLElBQXBCLENBQXlCO0FBQzlDSCxnQkFBUVAsUUFEc0M7QUFFOUNSLGlCQUFTQSxPQUZxQztBQUc5Q21CLGVBQU8sb0JBQU1FLEVBQU4sQ0FBU0UsVUFBVDtBQUh1QyxPQUF6QixDQUF2QjtBQUtELEtBUEQsTUFPTztBQUNMLFdBQUszQixJQUFMLENBQVVxQixHQUFWLENBQWNkLE9BQWQsRUFBdUIsZ0JBQUtrQixFQUFMLENBQVE7QUFDN0JOLGdCQUFRUCxRQURxQjtBQUU3QlIsaUJBQVNBLE9BRm9CO0FBRzdCbUIsZUFBTyxvQkFBTUUsRUFBTixDQUFTRSxVQUFUO0FBSHNCLE9BQVIsQ0FBdkI7QUFLRDtBQUVGOztBQUVEO0FBQ0FiLE1BQUlYLEdBQUosRUFBUztBQUNQLFdBQU8sS0FBS0gsSUFBTCxDQUFVYyxHQUFWLENBQWNYLElBQUl5QixLQUFKLENBQVVDLEtBQXhCLENBQVA7QUFDRDs7QUE3RDZCO2tCQUFYL0IsVSIsImZpbGUiOiJiaW5kaW5nLW1hcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExpc3QgfSBmcm9tIFwiaW1tdXRhYmxlXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7IE1heWJlIH0gZnJvbSAncmFtZGEtZmFudGFzeSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJpbmRpbmdNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9tYXAgPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvLyBnaXZlbiBhIHN5bnRheCBvYmplY3QgYW5kIGEgYmluZGluZyxcbiAgLy8gYWRkIHRoZSBiaW5kaW5nIHRvIHRoZSBtYXAgYXNzb2NpYXRpbmcgdGhlIGJpbmRpbmcgd2l0aCB0aGUgc3ludGF4IG9iamVjdCdzXG4gIC8vIHNjb3BlIHNldFxuICBhZGQoc3R4LCB7IGJpbmRpbmcsIHBoYXNlLCBza2lwRHVwID0gZmFsc2UgfSkge1xuICAgIGxldCBzdHhOYW1lID0gc3R4LnZhbCgpO1xuICAgIGxldCBhbGxTY29wZXNldCA9IHN0eC5zY29wZXNldHMuYWxsO1xuICAgIGxldCBzY29wZXNldCA9IHN0eC5zY29wZXNldHMucGhhc2UuaGFzKHBoYXNlKSA/IHN0eC5zY29wZXNldHMucGhhc2UuZ2V0KHBoYXNlKSA6IExpc3QoKTtcbiAgICBzY29wZXNldCA9IGFsbFNjb3Blc2V0LmNvbmNhdChzY29wZXNldCk7XG4gICAgYXNzZXJ0KHBoYXNlICE9IG51bGwsIFwibXVzdCBwcm92aWRlIGEgcGhhc2UgZm9yIGJpbmRpbmcgYWRkXCIpO1xuXG4gICAgaWYgKHRoaXMuX21hcC5oYXMoc3R4TmFtZSkpIHtcbiAgICAgIGxldCBzY29wZXNldEJpbmRpbmdMaXN0ID0gdGhpcy5fbWFwLmdldChzdHhOYW1lKTtcbiAgICAgIGlmIChza2lwRHVwICYmIHNjb3Blc2V0QmluZGluZ0xpc3Quc29tZShzID0+IHMuc2NvcGVzLmVxdWFscyhzY29wZXNldCkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21hcC5zZXQoc3R4TmFtZSwgc2NvcGVzZXRCaW5kaW5nTGlzdC5wdXNoKHtcbiAgICAgICAgc2NvcGVzOiBzY29wZXNldCxcbiAgICAgICAgYmluZGluZzogYmluZGluZyxcbiAgICAgICAgYWxpYXM6IE1heWJlLk5vdGhpbmcoKVxuICAgICAgfSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tYXAuc2V0KHN0eE5hbWUsIExpc3Qub2Yoe1xuICAgICAgICBzY29wZXM6IHNjb3Blc2V0LFxuICAgICAgICBiaW5kaW5nOiBiaW5kaW5nLFxuICAgICAgICBhbGlhczogTWF5YmUuTm90aGluZygpXG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgYWRkRm9yd2FyZChzdHgsIGZvcndhcmRTdHgsIGJpbmRpbmcsIHBoYXNlKSB7XG4gICAgbGV0IHN0eE5hbWUgPSBzdHgudG9rZW4udmFsdWU7XG4gICAgbGV0IGFsbFNjb3Blc2V0ID0gc3R4LnNjb3Blc2V0cy5hbGw7XG4gICAgbGV0IHNjb3Blc2V0ID0gc3R4LnNjb3Blc2V0cy5waGFzZS5oYXMocGhhc2UpID8gc3R4LnNjb3Blc2V0cy5waGFzZS5nZXQocGhhc2UpIDogTGlzdCgpO1xuICAgIHNjb3Blc2V0ID0gYWxsU2NvcGVzZXQuY29uY2F0KHNjb3Blc2V0KTtcbiAgICBhc3NlcnQocGhhc2UgIT0gbnVsbCwgXCJtdXN0IHByb3ZpZGUgYSBwaGFzZSBmb3IgYmluZGluZyBhZGRcIik7XG5cbiAgICBpZiAodGhpcy5fbWFwLmhhcyhzdHhOYW1lKSkge1xuICAgICAgbGV0IHNjb3Blc2V0QmluZGluZ0xpc3QgPSB0aGlzLl9tYXAuZ2V0KHN0eE5hbWUpO1xuICAgICAgdGhpcy5fbWFwLnNldChzdHhOYW1lLCBzY29wZXNldEJpbmRpbmdMaXN0LnB1c2goe1xuICAgICAgICBzY29wZXM6IHNjb3Blc2V0LFxuICAgICAgICBiaW5kaW5nOiBiaW5kaW5nLFxuICAgICAgICBhbGlhczogTWF5YmUub2YoZm9yd2FyZFN0eClcbiAgICAgIH0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbWFwLnNldChzdHhOYW1lLCBMaXN0Lm9mKHtcbiAgICAgICAgc2NvcGVzOiBzY29wZXNldCxcbiAgICAgICAgYmluZGluZzogYmluZGluZyxcbiAgICAgICAgYWxpYXM6IE1heWJlLm9mKGZvcndhcmRTdHgpXG4gICAgICB9KSk7XG4gICAgfVxuXG4gIH1cblxuICAvLyBTeW50YXggLT4gP0xpc3Q8eyBzY29wZXM6IFNjb3BlU2V0LCBiaW5kaW5nOiBCaW5kaW5nIH0+XG4gIGdldChzdHgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLmdldChzdHgudG9rZW4udmFsdWUpO1xuICB9XG5cbn1cbiJdfQ==