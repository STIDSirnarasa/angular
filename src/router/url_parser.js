'use strict';"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var collection_1 = require('angular2/src/facade/collection');
var lang_1 = require('angular2/src/facade/lang');
var exceptions_1 = require('angular2/src/facade/exceptions');
function convertUrlParamsToArray(urlParams) {
    var paramsArray = [];
    if (lang_1.isBlank(urlParams)) {
        return [];
    }
    collection_1.StringMapWrapper.forEach(urlParams, function (value, key) { paramsArray.push((value === true) ? key : key + '=' + value); });
    return paramsArray;
}
exports.convertUrlParamsToArray = convertUrlParamsToArray;
// Convert an object of url parameters into a string that can be used in an URL
function serializeParams(urlParams, joiner) {
    if (joiner === void 0) { joiner = '&'; }
    return convertUrlParamsToArray(urlParams).join(joiner);
}
exports.serializeParams = serializeParams;
/**
 * This class represents a parsed URL
 */
var Url = (function () {
    function Url(path, child, auxiliary, params) {
        if (child === void 0) { child = null; }
        if (auxiliary === void 0) { auxiliary = []; }
        if (params === void 0) { params = {}; }
        this.path = path;
        this.child = child;
        this.auxiliary = auxiliary;
        this.params = params;
    }
    Url.prototype.toString = function () {
        return this.path + this._matrixParamsToString() + this._auxToString() + this._childString();
    };
    Url.prototype.segmentToString = function () { return this.path + this._matrixParamsToString(); };
    /** @internal */
    Url.prototype._auxToString = function () {
        return this.auxiliary.length > 0 ?
            ('(' + this.auxiliary.map(function (sibling) { return sibling.toString(); }).join('//') + ')') :
            '';
    };
    Url.prototype._matrixParamsToString = function () {
        var paramString = serializeParams(this.params, ';');
        if (paramString.length > 0) {
            return ';' + paramString;
        }
        return '';
    };
    /** @internal */
    Url.prototype._childString = function () { return lang_1.isPresent(this.child) ? ('/' + this.child.toString()) : ''; };
    return Url;
}());
exports.Url = Url;
var RootUrl = (function (_super) {
    __extends(RootUrl, _super);
    function RootUrl(path, child, auxiliary, params) {
        if (child === void 0) { child = null; }
        if (auxiliary === void 0) { auxiliary = []; }
        if (params === void 0) { params = null; }
        _super.call(this, path, child, auxiliary, params);
    }
    RootUrl.prototype.toString = function () {
        return this.path + this._auxToString() + this._childString() + this._queryParamsToString();
    };
    RootUrl.prototype.segmentToString = function () { return this.path + this._queryParamsToString(); };
    RootUrl.prototype._queryParamsToString = function () {
        if (lang_1.isBlank(this.params)) {
            return '';
        }
        return '?' + serializeParams(this.params);
    };
    return RootUrl;
}(Url));
exports.RootUrl = RootUrl;
function pathSegmentsToUrl(pathSegments) {
    var url = new Url(pathSegments[pathSegments.length - 1]);
    for (var i = pathSegments.length - 2; i >= 0; i -= 1) {
        url = new Url(pathSegments[i], url);
    }
    return url;
}
exports.pathSegmentsToUrl = pathSegmentsToUrl;
var SEGMENT_RE = lang_1.RegExpWrapper.create('^[^\\/\\(\\)\\?;=&#]+');
function matchUrlSegment(str) {
    var match = lang_1.RegExpWrapper.firstMatch(SEGMENT_RE, str);
    return lang_1.isPresent(match) ? match[0] : '';
}
var QUERY_PARAM_VALUE_RE = lang_1.RegExpWrapper.create('^[^\\(\\)\\?;&#]+');
function matchUrlQueryParamValue(str) {
    var match = lang_1.RegExpWrapper.firstMatch(QUERY_PARAM_VALUE_RE, str);
    return lang_1.isPresent(match) ? match[0] : '';
}
var UrlParser = (function () {
    function UrlParser() {
    }
    UrlParser.prototype.peekStartsWith = function (str) { return this._remaining.startsWith(str); };
    UrlParser.prototype.capture = function (str) {
        if (!this._remaining.startsWith(str)) {
            throw new exceptions_1.BaseException("Expected \"" + str + "\".");
        }
        this._remaining = this._remaining.substring(str.length);
    };
    UrlParser.prototype.parse = function (url) {
        this._remaining = url;
        if (url == '' || url == '/') {
            return new Url('');
        }
        return this.parseRoot();
    };
    // segment + (aux segments) + (query params)
    UrlParser.prototype.parseRoot = function () {
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this._remaining);
        this.capture(path);
        var aux = [];
        if (this.peekStartsWith('(')) {
            aux = this.parseAuxiliaryRoutes();
        }
        if (this.peekStartsWith(';')) {
            // TODO: should these params just be dropped?
            this.parseMatrixParams();
        }
        var child = null;
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            child = this.parseSegment();
        }
        var queryParams = null;
        if (this.peekStartsWith('?')) {
            queryParams = this.parseQueryParams();
        }
        return new RootUrl(path, child, aux, queryParams);
    };
    // segment + (matrix params) + (aux segments)
    UrlParser.prototype.parseSegment = function () {
        if (this._remaining.length == 0) {
            return null;
        }
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this._remaining);
        this.capture(path);
        var matrixParams = null;
        if (this.peekStartsWith(';')) {
            matrixParams = this.parseMatrixParams();
        }
        var aux = [];
        if (this.peekStartsWith('(')) {
            aux = this.parseAuxiliaryRoutes();
        }
        var child = null;
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            child = this.parseSegment();
        }
        return new Url(path, child, aux, matrixParams);
    };
    UrlParser.prototype.parseQueryParams = function () {
        var params = {};
        this.capture('?');
        this.parseQueryParam(params);
        while (this._remaining.length > 0 && this.peekStartsWith('&')) {
            this.capture('&');
            this.parseQueryParam(params);
        }
        return params;
    };
    UrlParser.prototype.parseMatrixParams = function () {
        var params = {};
        while (this._remaining.length > 0 && this.peekStartsWith(';')) {
            this.capture(';');
            this.parseParam(params);
        }
        return params;
    };
    UrlParser.prototype.parseParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (lang_1.isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = true;
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlSegment(this._remaining);
            if (lang_1.isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseQueryParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (lang_1.isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = true;
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlQueryParamValue(this._remaining);
            if (lang_1.isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseAuxiliaryRoutes = function () {
        var routes = [];
        this.capture('(');
        while (!this.peekStartsWith(')') && this._remaining.length > 0) {
            routes.push(this.parseSegment());
            if (this.peekStartsWith('//')) {
                this.capture('//');
            }
        }
        this.capture(')');
        return routes;
    };
    return UrlParser;
}());
exports.UrlParser = UrlParser;
exports.parser = new UrlParser();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsX3BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtZ2M0Y3FkN3EudG1wL2FuZ3VsYXIyL3NyYy9yb3V0ZXIvdXJsX3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyQkFBK0IsZ0NBQWdDLENBQUMsQ0FBQTtBQUNoRSxxQkFBZ0QsMEJBQTBCLENBQUMsQ0FBQTtBQUMzRSwyQkFBOEMsZ0NBQWdDLENBQUMsQ0FBQTtBQUUvRSxpQ0FBd0MsU0FBK0I7SUFDckUsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLEVBQUUsQ0FBQyxDQUFDLGNBQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFDRCw2QkFBZ0IsQ0FBQyxPQUFPLENBQ3BCLFNBQVMsRUFBRSxVQUFDLEtBQUssRUFBRSxHQUFHLElBQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQVJlLCtCQUF1QiwwQkFRdEMsQ0FBQTtBQUVELCtFQUErRTtBQUMvRSx5QkFBZ0MsU0FBK0IsRUFBRSxNQUFZO0lBQVosc0JBQVksR0FBWixZQUFZO0lBQzNFLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUZlLHVCQUFlLGtCQUU5QixDQUFBO0FBRUQ7O0dBRUc7QUFDSDtJQUNFLGFBQW1CLElBQVksRUFBUyxLQUFpQixFQUN0QyxTQUF1QyxFQUN2QyxNQUFvRDtRQUZ0QyxxQkFBd0IsR0FBeEIsWUFB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QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBbkpELElBbUpDO0FBbkpZLGlCQUFTLFlBbUpyQixDQUFBO0FBRVUsY0FBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1N0cmluZ01hcFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge2lzUHJlc2VudCwgaXNCbGFuaywgUmVnRXhwV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7QmFzZUV4Y2VwdGlvbiwgV3JhcHBlZEV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRVcmxQYXJhbXNUb0FycmF5KHVybFBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0pOiBzdHJpbmdbXSB7XG4gIHZhciBwYXJhbXNBcnJheSA9IFtdO1xuICBpZiAoaXNCbGFuayh1cmxQYXJhbXMpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIFN0cmluZ01hcFdyYXBwZXIuZm9yRWFjaChcbiAgICAgIHVybFBhcmFtcywgKHZhbHVlLCBrZXkpID0+IHsgcGFyYW1zQXJyYXkucHVzaCgodmFsdWUgPT09IHRydWUpID8ga2V5IDoga2V5ICsgJz0nICsgdmFsdWUpOyB9KTtcbiAgcmV0dXJuIHBhcmFtc0FycmF5O1xufVxuXG4vLyBDb252ZXJ0IGFuIG9iamVjdCBvZiB1cmwgcGFyYW1ldGVycyBpbnRvIGEgc3RyaW5nIHRoYXQgY2FuIGJlIHVzZWQgaW4gYW4gVVJMXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUGFyYW1zKHVybFBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0sIGpvaW5lciA9ICcmJyk6IHN0cmluZyB7XG4gIHJldHVybiBjb252ZXJ0VXJsUGFyYW1zVG9BcnJheSh1cmxQYXJhbXMpLmpvaW4oam9pbmVyKTtcbn1cblxuLyoqXG4gKiBUaGlzIGNsYXNzIHJlcHJlc2VudHMgYSBwYXJzZWQgVVJMXG4gKi9cbmV4cG9ydCBjbGFzcyBVcmwge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGF0aDogc3RyaW5nLCBwdWJsaWMgY2hpbGQ6IFVybCA9IG51bGwsXG4gICAgICAgICAgICAgIHB1YmxpYyBhdXhpbGlhcnk6IFVybFtdID0gLypAdHMyZGFydF9jb25zdCovW10sXG4gICAgICAgICAgICAgIHB1YmxpYyBwYXJhbXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0gLypAdHMyZGFydF9jb25zdCovIHt9KSB7fVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucGF0aCArIHRoaXMuX21hdHJpeFBhcmFtc1RvU3RyaW5nKCkgKyB0aGlzLl9hdXhUb1N0cmluZygpICsgdGhpcy5fY2hpbGRTdHJpbmcoKTtcbiAgfVxuXG4gIHNlZ21lbnRUb1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5wYXRoICsgdGhpcy5fbWF0cml4UGFyYW1zVG9TdHJpbmcoKTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2F1eFRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuYXV4aWxpYXJ5Lmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgICAgKCcoJyArIHRoaXMuYXV4aWxpYXJ5Lm1hcChzaWJsaW5nID0+IHNpYmxpbmcudG9TdHJpbmcoKSkuam9pbignLy8nKSArICcpJykgOlxuICAgICAgICAgICAgICAgJyc7XG4gIH1cblxuICBwcml2YXRlIF9tYXRyaXhQYXJhbXNUb1N0cmluZygpOiBzdHJpbmcge1xuICAgIHZhciBwYXJhbVN0cmluZyA9IHNlcmlhbGl6ZVBhcmFtcyh0aGlzLnBhcmFtcywgJzsnKTtcbiAgICBpZiAocGFyYW1TdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuICc7JyArIHBhcmFtU3RyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9jaGlsZFN0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gaXNQcmVzZW50KHRoaXMuY2hpbGQpID8gKCcvJyArIHRoaXMuY2hpbGQudG9TdHJpbmcoKSkgOiAnJzsgfVxufVxuXG5leHBvcnQgY2xhc3MgUm9vdFVybCBleHRlbmRzIFVybCB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZywgY2hpbGQ6IFVybCA9IG51bGwsIGF1eGlsaWFyeTogVXJsW10gPSAvKkB0czJkYXJ0X2NvbnN0Ki9bXSxcbiAgICAgICAgICAgICAgcGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSA9IG51bGwpIHtcbiAgICBzdXBlcihwYXRoLCBjaGlsZCwgYXV4aWxpYXJ5LCBwYXJhbXMpO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoICsgdGhpcy5fYXV4VG9TdHJpbmcoKSArIHRoaXMuX2NoaWxkU3RyaW5nKCkgKyB0aGlzLl9xdWVyeVBhcmFtc1RvU3RyaW5nKCk7XG4gIH1cblxuICBzZWdtZW50VG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGF0aCArIHRoaXMuX3F1ZXJ5UGFyYW1zVG9TdHJpbmcoKTsgfVxuXG4gIHByaXZhdGUgX3F1ZXJ5UGFyYW1zVG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBpZiAoaXNCbGFuayh0aGlzLnBhcmFtcykpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gJz8nICsgc2VyaWFsaXplUGFyYW1zKHRoaXMucGFyYW1zKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0aFNlZ21lbnRzVG9VcmwocGF0aFNlZ21lbnRzOiBzdHJpbmdbXSk6IFVybCB7XG4gIHZhciB1cmwgPSBuZXcgVXJsKHBhdGhTZWdtZW50c1twYXRoU2VnbWVudHMubGVuZ3RoIC0gMV0pO1xuICBmb3IgKHZhciBpID0gcGF0aFNlZ21lbnRzLmxlbmd0aCAtIDI7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgdXJsID0gbmV3IFVybChwYXRoU2VnbWVudHNbaV0sIHVybCk7XG4gIH1cbiAgcmV0dXJuIHVybDtcbn1cblxudmFyIFNFR01FTlRfUkUgPSBSZWdFeHBXcmFwcGVyLmNyZWF0ZSgnXlteXFxcXC9cXFxcKFxcXFwpXFxcXD87PSYjXSsnKTtcbmZ1bmN0aW9uIG1hdGNoVXJsU2VnbWVudChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHZhciBtYXRjaCA9IFJlZ0V4cFdyYXBwZXIuZmlyc3RNYXRjaChTRUdNRU5UX1JFLCBzdHIpO1xuICByZXR1cm4gaXNQcmVzZW50KG1hdGNoKSA/IG1hdGNoWzBdIDogJyc7XG59XG52YXIgUVVFUllfUEFSQU1fVkFMVUVfUkUgPSBSZWdFeHBXcmFwcGVyLmNyZWF0ZSgnXlteXFxcXChcXFxcKVxcXFw/OyYjXSsnKTtcbmZ1bmN0aW9uIG1hdGNoVXJsUXVlcnlQYXJhbVZhbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgdmFyIG1hdGNoID0gUmVnRXhwV3JhcHBlci5maXJzdE1hdGNoKFFVRVJZX1BBUkFNX1ZBTFVFX1JFLCBzdHIpO1xuICByZXR1cm4gaXNQcmVzZW50KG1hdGNoKSA/IG1hdGNoWzBdIDogJyc7XG59XG5cbmV4cG9ydCBjbGFzcyBVcmxQYXJzZXIge1xuICBwcml2YXRlIF9yZW1haW5pbmc6IHN0cmluZztcblxuICBwZWVrU3RhcnRzV2l0aChzdHI6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fcmVtYWluaW5nLnN0YXJ0c1dpdGgoc3RyKTsgfVxuXG4gIGNhcHR1cmUoc3RyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3JlbWFpbmluZy5zdGFydHNXaXRoKHN0cikpIHtcbiAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGBFeHBlY3RlZCBcIiR7c3RyfVwiLmApO1xuICAgIH1cbiAgICB0aGlzLl9yZW1haW5pbmcgPSB0aGlzLl9yZW1haW5pbmcuc3Vic3RyaW5nKHN0ci5sZW5ndGgpO1xuICB9XG5cbiAgcGFyc2UodXJsOiBzdHJpbmcpOiBVcmwge1xuICAgIHRoaXMuX3JlbWFpbmluZyA9IHVybDtcbiAgICBpZiAodXJsID09ICcnIHx8IHVybCA9PSAnLycpIHtcbiAgICAgIHJldHVybiBuZXcgVXJsKCcnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VSb290KCk7XG4gIH1cblxuICAvLyBzZWdtZW50ICsgKGF1eCBzZWdtZW50cykgKyAocXVlcnkgcGFyYW1zKVxuICBwYXJzZVJvb3QoKTogUm9vdFVybCB7XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCcvJyk7XG4gICAgfVxuICAgIHZhciBwYXRoID0gbWF0Y2hVcmxTZWdtZW50KHRoaXMuX3JlbWFpbmluZyk7XG4gICAgdGhpcy5jYXB0dXJlKHBhdGgpO1xuXG4gICAgdmFyIGF1eDogVXJsW10gPSBbXTtcbiAgICBpZiAodGhpcy5wZWVrU3RhcnRzV2l0aCgnKCcpKSB7XG4gICAgICBhdXggPSB0aGlzLnBhcnNlQXV4aWxpYXJ5Um91dGVzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIC8vIFRPRE86IHNob3VsZCB0aGVzZSBwYXJhbXMganVzdCBiZSBkcm9wcGVkP1xuICAgICAgdGhpcy5wYXJzZU1hdHJpeFBhcmFtcygpO1xuICAgIH1cbiAgICB2YXIgY2hpbGQgPSBudWxsO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcvJykgJiYgIXRoaXMucGVla1N0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnLycpO1xuICAgICAgY2hpbGQgPSB0aGlzLnBhcnNlU2VnbWVudCgpO1xuICAgIH1cbiAgICB2YXIgcXVlcnlQYXJhbXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0gbnVsbDtcbiAgICBpZiAodGhpcy5wZWVrU3RhcnRzV2l0aCgnPycpKSB7XG4gICAgICBxdWVyeVBhcmFtcyA9IHRoaXMucGFyc2VRdWVyeVBhcmFtcygpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFJvb3RVcmwocGF0aCwgY2hpbGQsIGF1eCwgcXVlcnlQYXJhbXMpO1xuICB9XG5cbiAgLy8gc2VnbWVudCArIChtYXRyaXggcGFyYW1zKSArIChhdXggc2VnbWVudHMpXG4gIHBhcnNlU2VnbWVudCgpOiBVcmwge1xuICAgIGlmICh0aGlzLl9yZW1haW5pbmcubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5wZWVrU3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICB0aGlzLmNhcHR1cmUoJy8nKTtcbiAgICB9XG4gICAgdmFyIHBhdGggPSBtYXRjaFVybFNlZ21lbnQodGhpcy5fcmVtYWluaW5nKTtcbiAgICB0aGlzLmNhcHR1cmUocGF0aCk7XG5cbiAgICB2YXIgbWF0cml4UGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSA9IG51bGw7XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJzsnKSkge1xuICAgICAgbWF0cml4UGFyYW1zID0gdGhpcy5wYXJzZU1hdHJpeFBhcmFtcygpO1xuICAgIH1cbiAgICB2YXIgYXV4OiBVcmxbXSA9IFtdO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcoJykpIHtcbiAgICAgIGF1eCA9IHRoaXMucGFyc2VBdXhpbGlhcnlSb3V0ZXMoKTtcbiAgICB9XG4gICAgdmFyIGNoaWxkOiBVcmwgPSBudWxsO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcvJykgJiYgIXRoaXMucGVla1N0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnLycpO1xuICAgICAgY2hpbGQgPSB0aGlzLnBhcnNlU2VnbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFVybChwYXRoLCBjaGlsZCwgYXV4LCBtYXRyaXhQYXJhbXMpO1xuICB9XG5cbiAgcGFyc2VRdWVyeVBhcmFtcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgdmFyIHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB0aGlzLmNhcHR1cmUoJz8nKTtcbiAgICB0aGlzLnBhcnNlUXVlcnlQYXJhbShwYXJhbXMpO1xuICAgIHdoaWxlICh0aGlzLl9yZW1haW5pbmcubGVuZ3RoID4gMCAmJiB0aGlzLnBlZWtTdGFydHNXaXRoKCcmJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnJicpO1xuICAgICAgdGhpcy5wYXJzZVF1ZXJ5UGFyYW0ocGFyYW1zKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxuXG4gIHBhcnNlTWF0cml4UGFyYW1zKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICB2YXIgcGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIHdoaWxlICh0aGlzLl9yZW1haW5pbmcubGVuZ3RoID4gMCAmJiB0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnOycpO1xuICAgICAgdGhpcy5wYXJzZVBhcmFtKHBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICBwYXJzZVBhcmFtKHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0pOiB2b2lkIHtcbiAgICB2YXIga2V5ID0gbWF0Y2hVcmxTZWdtZW50KHRoaXMuX3JlbWFpbmluZyk7XG4gICAgaWYgKGlzQmxhbmsoa2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNhcHR1cmUoa2V5KTtcbiAgICB2YXIgdmFsdWU6IGFueSA9IHRydWU7XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJz0nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCc9Jyk7XG4gICAgICB2YXIgdmFsdWVNYXRjaCA9IG1hdGNoVXJsU2VnbWVudCh0aGlzLl9yZW1haW5pbmcpO1xuICAgICAgaWYgKGlzUHJlc2VudCh2YWx1ZU1hdGNoKSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlTWF0Y2g7XG4gICAgICAgIHRoaXMuY2FwdHVyZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlUXVlcnlQYXJhbShwYXJhbXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KTogdm9pZCB7XG4gICAgdmFyIGtleSA9IG1hdGNoVXJsU2VnbWVudCh0aGlzLl9yZW1haW5pbmcpO1xuICAgIGlmIChpc0JsYW5rKGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jYXB0dXJlKGtleSk7XG4gICAgdmFyIHZhbHVlOiBhbnkgPSB0cnVlO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc9JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnPScpO1xuICAgICAgdmFyIHZhbHVlTWF0Y2ggPSBtYXRjaFVybFF1ZXJ5UGFyYW1WYWx1ZSh0aGlzLl9yZW1haW5pbmcpO1xuICAgICAgaWYgKGlzUHJlc2VudCh2YWx1ZU1hdGNoKSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlTWF0Y2g7XG4gICAgICAgIHRoaXMuY2FwdHVyZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlQXV4aWxpYXJ5Um91dGVzKCk6IFVybFtdIHtcbiAgICB2YXIgcm91dGVzOiBVcmxbXSA9IFtdO1xuICAgIHRoaXMuY2FwdHVyZSgnKCcpO1xuXG4gICAgd2hpbGUgKCF0aGlzLnBlZWtTdGFydHNXaXRoKCcpJykgJiYgdGhpcy5fcmVtYWluaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgIHJvdXRlcy5wdXNoKHRoaXMucGFyc2VTZWdtZW50KCkpO1xuICAgICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAgICAgdGhpcy5jYXB0dXJlKCcvLycpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhcHR1cmUoJyknKTtcblxuICAgIHJldHVybiByb3V0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IHZhciBwYXJzZXIgPSBuZXcgVXJsUGFyc2VyKCk7XG4iXX0=