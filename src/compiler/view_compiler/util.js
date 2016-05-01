'use strict';"use strict";
var lang_1 = require('angular2/src/facade/lang');
var exceptions_1 = require('angular2/src/facade/exceptions');
var o = require('../output/output_ast');
var identifiers_1 = require('../identifiers');
function getPropertyInView(property, callingView, definedView) {
    if (callingView === definedView) {
        return property;
    }
    else {
        var viewProp = o.THIS_EXPR;
        var currView = callingView;
        while (currView !== definedView && lang_1.isPresent(currView.declarationElement.view)) {
            currView = currView.declarationElement.view;
            viewProp = viewProp.prop('parent');
        }
        if (currView !== definedView) {
            throw new exceptions_1.BaseException("Internal error: Could not calculate a property in a parent view: " + property);
        }
        if (property instanceof o.ReadPropExpr) {
            var readPropExpr_1 = property;
            // Note: Don't cast for members of the AppView base class...
            if (definedView.fields.some(function (field) { return field.name == readPropExpr_1.name; }) ||
                definedView.getters.some(function (field) { return field.name == readPropExpr_1.name; })) {
                viewProp = viewProp.cast(definedView.classType);
            }
        }
        return o.replaceVarInExpression(o.THIS_EXPR.name, viewProp, property);
    }
}
exports.getPropertyInView = getPropertyInView;
function injectFromViewParentInjector(token, optional) {
    var args = [createDiTokenExpression(token)];
    if (optional) {
        args.push(o.NULL_EXPR);
    }
    return o.THIS_EXPR.prop('parentInjector').callMethod('get', args);
}
exports.injectFromViewParentInjector = injectFromViewParentInjector;
function getViewFactoryName(component, embeddedTemplateIndex) {
    return "viewFactory_" + component.type.name + embeddedTemplateIndex;
}
exports.getViewFactoryName = getViewFactoryName;
function createDiTokenExpression(token) {
    if (lang_1.isPresent(token.value)) {
        return o.literal(token.value);
    }
    else if (token.identifierIsInstance) {
        return o.importExpr(token.identifier)
            .instantiate([], o.importType(token.identifier, [], [o.TypeModifier.Const]));
    }
    else {
        return o.importExpr(token.identifier);
    }
}
exports.createDiTokenExpression = createDiTokenExpression;
function createFlatArray(expressions) {
    var lastNonArrayExpressions = [];
    var result = o.literalArr([]);
    for (var i = 0; i < expressions.length; i++) {
        var expr = expressions[i];
        if (expr.type instanceof o.ArrayType) {
            if (lastNonArrayExpressions.length > 0) {
                result =
                    result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
                lastNonArrayExpressions = [];
            }
            result = result.callMethod(o.BuiltinMethod.ConcatArray, [expr]);
        }
        else {
            lastNonArrayExpressions.push(expr);
        }
    }
    if (lastNonArrayExpressions.length > 0) {
        result =
            result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
    }
    return result;
}
exports.createFlatArray = createFlatArray;
function createPureProxy(fn, argCount, pureProxyProp, view) {
    view.fields.push(new o.ClassField(pureProxyProp.name, null));
    var pureProxyId = argCount < identifiers_1.Identifiers.pureProxies.length ? identifiers_1.Identifiers.pureProxies[argCount] : null;
    if (lang_1.isBlank(pureProxyId)) {
        throw new exceptions_1.BaseException("Unsupported number of argument for pure functions: " + argCount);
    }
    view.createMethod.addStmt(o.THIS_EXPR.prop(pureProxyProp.name).set(o.importExpr(pureProxyId).callFn([fn])).toStmt());
}
exports.createPureProxy = createPureProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtZ2M0Y3FkN3EudG1wL2FuZ3VsYXIyL3NyYy9jb21waWxlci92aWV3X2NvbXBpbGVyL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFpQywwQkFBMEIsQ0FBQyxDQUFBO0FBQzVELDJCQUE0QixnQ0FBZ0MsQ0FBQyxDQUFBO0FBRTdELElBQVksQ0FBQyxXQUFNLHNCQUFzQixDQUFDLENBQUE7QUFPMUMsNEJBQTBCLGdCQUFnQixDQUFDLENBQUE7QUFFM0MsMkJBQWtDLFFBQXNCLEVBQUUsV0FBd0IsRUFDaEQsV0FBd0I7SUFDeEQsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDTixJQUFJLFFBQVEsR0FBaUIsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN6QyxJQUFJLFFBQVEsR0FBZ0IsV0FBVyxDQUFDO1FBQ3hDLE9BQU8sUUFBUSxLQUFLLFdBQVcsSUFBSSxnQkFBUyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQy9FLFFBQVEsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDO1lBQzVDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLElBQUksMEJBQWEsQ0FDbkIsc0VBQW9FLFFBQVUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxRQUFRLFlBQVksQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFB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V0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUN6RixFQUFFLENBQUMsQ0FBQyxjQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sSUFBSSwwQkFBYSxDQUFDLHdEQUFzRCxRQUFVLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQ3JCLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNqRyxDQUFDO0FBVmUsdUJBQWUsa0JBVTlCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2lzUHJlc2VudCwgaXNCbGFua30gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7QmFzZUV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcblxuaW1wb3J0ICogYXMgbyBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQge1xuICBDb21waWxlVG9rZW5NZXRhZGF0YSxcbiAgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLFxuICBDb21waWxlSWRlbnRpZmllck1ldGFkYXRhXG59IGZyb20gJy4uL2NvbXBpbGVfbWV0YWRhdGEnO1xuaW1wb3J0IHtDb21waWxlVmlld30gZnJvbSAnLi9jb21waWxlX3ZpZXcnO1xuaW1wb3J0IHtJZGVudGlmaWVyc30gZnJvbSAnLi4vaWRlbnRpZmllcnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlJblZpZXcocHJvcGVydHk6IG8uRXhwcmVzc2lvbiwgY2FsbGluZ1ZpZXc6IENvbXBpbGVWaWV3LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZWRWaWV3OiBDb21waWxlVmlldyk6IG8uRXhwcmVzc2lvbiB7XG4gIGlmIChjYWxsaW5nVmlldyA9PT0gZGVmaW5lZFZpZXcpIHtcbiAgICByZXR1cm4gcHJvcGVydHk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHZpZXdQcm9wOiBvLkV4cHJlc3Npb24gPSBvLlRISVNfRVhQUjtcbiAgICB2YXIgY3VyclZpZXc6IENvbXBpbGVWaWV3ID0gY2FsbGluZ1ZpZXc7XG4gICAgd2hpbGUgKGN1cnJWaWV3ICE9PSBkZWZpbmVkVmlldyAmJiBpc1ByZXNlbnQoY3VyclZpZXcuZGVjbGFyYXRpb25FbGVtZW50LnZpZXcpKSB7XG4gICAgICBjdXJyVmlldyA9IGN1cnJWaWV3LmRlY2xhcmF0aW9uRWxlbWVudC52aWV3O1xuICAgICAgdmlld1Byb3AgPSB2aWV3UHJvcC5wcm9wKCdwYXJlbnQnKTtcbiAgICB9XG4gICAgaWYgKGN1cnJWaWV3ICE9PSBkZWZpbmVkVmlldykge1xuICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oXG4gICAgICAgICAgYEludGVybmFsIGVycm9yOiBDb3VsZCBub3QgY2FsY3VsYXRlIGEgcHJvcGVydHkgaW4gYSBwYXJlbnQgdmlldzogJHtwcm9wZXJ0eX1gKTtcbiAgICB9XG4gICAgaWYgKHByb3BlcnR5IGluc3RhbmNlb2Ygby5SZWFkUHJvcEV4cHIpIHtcbiAgICAgIGxldCByZWFkUHJvcEV4cHI6IG8uUmVhZFByb3BFeHByID0gcHJvcGVydHk7XG4gICAgICAvLyBOb3RlOiBEb24ndCBjYXN0IGZvciBtZW1iZXJzIG9mIHRoZSBBcHBWaWV3IGJhc2UgY2xhc3MuLi5cbiAgICAgIGlmIChkZWZpbmVkVmlldy5maWVsZHMuc29tZSgoZmllbGQpID0+IGZpZWxkLm5hbWUgPT0gcmVhZFByb3BFeHByLm5hbWUpIHx8XG4gICAgICAgICAgZGVmaW5lZFZpZXcuZ2V0dGVycy5zb21lKChmaWVsZCkgPT4gZmllbGQubmFtZSA9PSByZWFkUHJvcEV4cHIubmFtZSkpIHtcbiAgICAgICAgdmlld1Byb3AgPSB2aWV3UHJvcC5jYXN0KGRlZmluZWRWaWV3LmNsYXNzVHlwZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvLnJlcGxhY2VWYXJJbkV4cHJlc3Npb24oby5USElTX0VYUFIubmFtZSwgdmlld1Byb3AsIHByb3BlcnR5KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RnJvbVZpZXdQYXJlbnRJbmplY3Rvcih0b2tlbjogQ29tcGlsZVRva2VuTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogYm9vbGVhbik6IG8uRXhwcmVzc2lvbiB7XG4gIHZhciBhcmdzID0gW2NyZWF0ZURpVG9rZW5FeHByZXNzaW9uKHRva2VuKV07XG4gIGlmIChvcHRpb25hbCkge1xuICAgIGFyZ3MucHVzaChvLk5VTExfRVhQUik7XG4gIH1cbiAgcmV0dXJuIG8uVEhJU19FWFBSLnByb3AoJ3BhcmVudEluamVjdG9yJykuY2FsbE1ldGhvZCgnZ2V0JywgYXJncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWaWV3RmFjdG9yeU5hbWUoY29tcG9uZW50OiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYmVkZGVkVGVtcGxhdGVJbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGB2aWV3RmFjdG9yeV8ke2NvbXBvbmVudC50eXBlLm5hbWV9JHtlbWJlZGRlZFRlbXBsYXRlSW5kZXh9YDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlUb2tlbkV4cHJlc3Npb24odG9rZW46IENvbXBpbGVUb2tlbk1ldGFkYXRhKTogby5FeHByZXNzaW9uIHtcbiAgaWYgKGlzUHJlc2VudCh0b2tlbi52YWx1ZSkpIHtcbiAgICByZXR1cm4gby5saXRlcmFsKHRva2VuLnZhbHVlKTtcbiAgfSBlbHNlIGlmICh0b2tlbi5pZGVudGlmaWVySXNJbnN0YW5jZSkge1xuICAgIHJldHVybiBvLmltcG9ydEV4cHIodG9rZW4uaWRlbnRpZmllcilcbiAgICAgICAgLmluc3RhbnRpYXRlKFtdLCBvLmltcG9ydFR5cGUodG9rZW4uaWRlbnRpZmllciwgW10sIFtvLlR5cGVNb2RpZmllci5Db25zdF0pKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gby5pbXBvcnRFeHByKHRva2VuLmlkZW50aWZpZXIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGbGF0QXJyYXkoZXhwcmVzc2lvbnM6IG8uRXhwcmVzc2lvbltdKTogby5FeHByZXNzaW9uIHtcbiAgdmFyIGxhc3ROb25BcnJheUV4cHJlc3Npb25zID0gW107XG4gIHZhciByZXN1bHQ6IG8uRXhwcmVzc2lvbiA9IG8ubGl0ZXJhbEFycihbXSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwcmVzc2lvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZXhwciA9IGV4cHJlc3Npb25zW2ldO1xuICAgIGlmIChleHByLnR5cGUgaW5zdGFuY2VvZiBvLkFycmF5VHlwZSkge1xuICAgICAgaWYgKGxhc3ROb25BcnJheUV4cHJlc3Npb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIHJlc3VsdC5jYWxsTWV0aG9kKG8uQnVpbHRpbk1ldGhvZC5Db25jYXRBcnJheSwgW28ubGl0ZXJhbEFycihsYXN0Tm9uQXJyYXlFeHByZXNzaW9ucyldKTtcbiAgICAgICAgbGFzdE5vbkFycmF5RXhwcmVzc2lvbnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5jYWxsTWV0aG9kKG8uQnVpbHRpbk1ldGhvZC5Db25jYXRBcnJheSwgW2V4cHJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdE5vbkFycmF5RXhwcmVzc2lvbnMucHVzaChleHByKTtcbiAgICB9XG4gIH1cbiAgaWYgKGxhc3ROb25BcnJheUV4cHJlc3Npb25zLmxlbmd0aCA+IDApIHtcbiAgICByZXN1bHQgPVxuICAgICAgICByZXN1bHQuY2FsbE1ldGhvZChvLkJ1aWx0aW5NZXRob2QuQ29uY2F0QXJyYXksIFtvLmxpdGVyYWxBcnIobGFzdE5vbkFycmF5RXhwcmVzc2lvbnMpXSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1cmVQcm94eShmbjogby5FeHByZXNzaW9uLCBhcmdDb3VudDogbnVtYmVyLCBwdXJlUHJveHlQcm9wOiBvLlJlYWRQcm9wRXhwcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldzogQ29tcGlsZVZpZXcpIHtcbiAgdmlldy5maWVsZHMucHVzaChuZXcgby5DbGFzc0ZpZWxkKHB1cmVQcm94eVByb3AubmFtZSwgbnVsbCkpO1xuICB2YXIgcHVyZVByb3h5SWQgPVxuICAgICAgYXJnQ291bnQgPCBJZGVudGlmaWVycy5wdXJlUHJveGllcy5sZW5ndGggPyBJZGVudGlmaWVycy5wdXJlUHJveGllc1thcmdDb3VudF0gOiBudWxsO1xuICBpZiAoaXNCbGFuayhwdXJlUHJveHlJZCkpIHtcbiAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgVW5zdXBwb3J0ZWQgbnVtYmVyIG9mIGFyZ3VtZW50IGZvciBwdXJlIGZ1bmN0aW9uczogJHthcmdDb3VudH1gKTtcbiAgfVxuICB2aWV3LmNyZWF0ZU1ldGhvZC5hZGRTdG10KFxuICAgICAgby5USElTX0VYUFIucHJvcChwdXJlUHJveHlQcm9wLm5hbWUpLnNldChvLmltcG9ydEV4cHIocHVyZVByb3h5SWQpLmNhbGxGbihbZm5dKSkudG9TdG10KCkpO1xufVxuIl19