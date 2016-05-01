'use strict';"use strict";
var lang_1 = require('angular2/src/facade/lang');
function hasLifecycleHook(name, obj) {
    if (lang_1.isBlank(obj))
        return false;
    var type = obj.constructor;
    if (!(type instanceof lang_1.Type))
        return false;
    return name in type.prototype;
}
exports.hasLifecycleHook = hasLifecycleHook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlX3JlZmxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtZ2M0Y3FkN3EudG1wL2FuZ3VsYXIyL3NyYy9hbHRfcm91dGVyL2xpZmVjeWNsZV9yZWZsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUE0QiwwQkFBMEIsQ0FBQyxDQUFBO0FBRXZELDBCQUFpQyxJQUFZLEVBQUUsR0FBVztJQUN4RCxFQUFFLENBQUMsQ0FBQyxjQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQy9CLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUM7SUFDM0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksWUFBWSxXQUFJLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDMUMsTUFBTSxDQUFDLElBQUksSUFBUyxJQUFLLENBQUMsU0FBUyxDQUFDO0FBQ3RDLENBQUM7QUFMZSx3QkFBZ0IsbUJBSy9CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1R5cGUsIGlzQmxhbmt9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNMaWZlY3ljbGVIb29rKG5hbWU6IHN0cmluZywgb2JqOiBPYmplY3QpOiBib29sZWFuIHtcbiAgaWYgKGlzQmxhbmsob2JqKSkgcmV0dXJuIGZhbHNlO1xuICBsZXQgdHlwZSA9IG9iai5jb25zdHJ1Y3RvcjtcbiAgaWYgKCEodHlwZSBpbnN0YW5jZW9mIFR5cGUpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBuYW1lIGluKDxhbnk+dHlwZSkucHJvdG90eXBlO1xufVxuIl19