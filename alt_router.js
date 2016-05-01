'use strict';/**
 * @module
 * @description
 * Alternative implementation of the router. Experimental.
 */
"use strict";
var router_1 = require('./src/alt_router/router');
exports.Router = router_1.Router;
exports.RouterOutletMap = router_1.RouterOutletMap;
var segments_1 = require('./src/alt_router/segments');
exports.RouteSegment = segments_1.RouteSegment;
exports.UrlSegment = segments_1.UrlSegment;
exports.Tree = segments_1.Tree;
exports.UrlTree = segments_1.UrlTree;
exports.RouteTree = segments_1.RouteTree;
var decorators_1 = require('./src/alt_router/metadata/decorators');
exports.Routes = decorators_1.Routes;
var metadata_1 = require('./src/alt_router/metadata/metadata');
exports.Route = metadata_1.Route;
var router_url_serializer_1 = require('./src/alt_router/router_url_serializer');
exports.RouterUrlSerializer = router_url_serializer_1.RouterUrlSerializer;
exports.DefaultRouterUrlSerializer = router_url_serializer_1.DefaultRouterUrlSerializer;
var router_providers_1 = require('./src/alt_router/router_providers');
exports.ROUTER_PROVIDERS = router_providers_1.ROUTER_PROVIDERS;
var router_outlet_1 = require('./src/alt_router/directives/router_outlet');
var router_link_1 = require('./src/alt_router/directives/router_link');
exports.ROUTER_DIRECTIVES = [router_outlet_1.RouterOutlet, router_link_1.RouterLink];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWx0X3JvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtZ2M0Y3FkN3EudG1wL2FuZ3VsYXIyL2FsdF9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRzs7QUFFSCx1QkFBc0MseUJBQXlCLENBQUM7QUFBeEQsaUNBQU07QUFBRSxtREFBZ0Q7QUFDaEUseUJBQWlFLDJCQUEyQixDQUFDO0FBQXJGLCtDQUFZO0FBQUUsMkNBQVU7QUFBRSwrQkFBSTtBQUFFLHFDQUFPO0FBQUUseUNBQTRDO0FBQzdGLDJCQUFxQixzQ0FBc0MsQ0FBQztBQUFwRCxxQ0FBb0Q7QUFDNUQseUJBQW9CLG9DQUFvQyxDQUFDO0FBQWpELGlDQUFpRDtBQUN6RCxzQ0FHTyx3Q0FBd0MsQ0FBQztBQUY5QywwRUFBbUI7QUFDbkIsd0ZBQzhDO0FBRWhELGlDQUErQixtQ0FBbUMsQ0FBQztBQUEzRCwrREFBMkQ7QUFFbkUsOEJBQTJCLDJDQUEyQyxDQUFDLENBQUE7QUFDdkUsNEJBQXlCLHlDQUF5QyxDQUFDLENBQUE7QUFFdEQseUJBQWlCLEdBQTRCLENBQUMsNEJBQVksRUFBRSx3QkFBVSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBtb2R1bGVcbiAqIEBkZXNjcmlwdGlvblxuICogQWx0ZXJuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgdGhlIHJvdXRlci4gRXhwZXJpbWVudGFsLlxuICovXG5cbmV4cG9ydCB7Um91dGVyLCBSb3V0ZXJPdXRsZXRNYXB9IGZyb20gJy4vc3JjL2FsdF9yb3V0ZXIvcm91dGVyJztcbmV4cG9ydCB7Um91dGVTZWdtZW50LCBVcmxTZWdtZW50LCBUcmVlLCBVcmxUcmVlLCBSb3V0ZVRyZWV9IGZyb20gJy4vc3JjL2FsdF9yb3V0ZXIvc2VnbWVudHMnO1xuZXhwb3J0IHtSb3V0ZXN9IGZyb20gJy4vc3JjL2FsdF9yb3V0ZXIvbWV0YWRhdGEvZGVjb3JhdG9ycyc7XG5leHBvcnQge1JvdXRlfSBmcm9tICcuL3NyYy9hbHRfcm91dGVyL21ldGFkYXRhL21ldGFkYXRhJztcbmV4cG9ydCB7XG4gIFJvdXRlclVybFNlcmlhbGl6ZXIsXG4gIERlZmF1bHRSb3V0ZXJVcmxTZXJpYWxpemVyXG59IGZyb20gJy4vc3JjL2FsdF9yb3V0ZXIvcm91dGVyX3VybF9zZXJpYWxpemVyJztcbmV4cG9ydCB7T25BY3RpdmF0ZSwgQ2FuRGVhY3RpdmF0ZX0gZnJvbSAnLi9zcmMvYWx0X3JvdXRlci9pbnRlcmZhY2VzJztcbmV4cG9ydCB7Uk9VVEVSX1BST1ZJREVSU30gZnJvbSAnLi9zcmMvYWx0X3JvdXRlci9yb3V0ZXJfcHJvdmlkZXJzJztcblxuaW1wb3J0IHtSb3V0ZXJPdXRsZXR9IGZyb20gJy4vc3JjL2FsdF9yb3V0ZXIvZGlyZWN0aXZlcy9yb3V0ZXJfb3V0bGV0JztcbmltcG9ydCB7Um91dGVyTGlua30gZnJvbSAnLi9zcmMvYWx0X3JvdXRlci9kaXJlY3RpdmVzL3JvdXRlcl9saW5rJztcblxuZXhwb3J0IGNvbnN0IFJPVVRFUl9ESVJFQ1RJVkVTOiBhbnlbXSA9IC8qQHRzMmRhcnRfY29uc3QqL1tSb3V0ZXJPdXRsZXQsIFJvdXRlckxpbmtdO1xuIl19