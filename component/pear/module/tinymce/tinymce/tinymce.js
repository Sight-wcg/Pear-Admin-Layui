/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.6.2 (2020-12-08)
 */
(function () {
	'use strict';

	var typeOf = function (x) {
		if (x === null) {
			return 'null';
		}
		if (x === undefined) {
			return 'undefined';
		}
		var t = typeof x;
		if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
			return 'array';
		}
		if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
			return 'string';
		}
		return t;
	};
	var isEquatableType = function (x) {
		return [
			'undefined',
			'boolean',
			'number',
			'string',
			'function',
			'xml',
			'null'
		].indexOf(x) !== -1;
	};

	var sort = function (xs, compareFn) {
		var clone = Array.prototype.slice.call(xs);
		return clone.sort(compareFn);
	};

	var contramap = function (eqa, f) {
		return eq(function (x, y) {
			return eqa.eq(f(x), f(y));
		});
	};
	var eq = function (f) {
		return { eq: f };
	};
	var tripleEq = eq(function (x, y) {
		return x === y;
	});
	var eqString = tripleEq;
	var eqArray = function (eqa) {
		return eq(function (x, y) {
			if (x.length !== y.length) {
				return false;
			}
			var len = x.length;
			for (var i = 0; i < len; i++) {
				if (!eqa.eq(x[i], y[i])) {
					return false;
				}
			}
			return true;
		});
	};
	var eqSortedArray = function (eqa, compareFn) {
		return contramap(eqArray(eqa), function (xs) {
			return sort(xs, compareFn);
		});
	};
	var eqRecord = function (eqa) {
		return eq(function (x, y) {
			var kx = Object.keys(x);
			var ky = Object.keys(y);
			if (!eqSortedArray(eqString).eq(kx, ky)) {
				return false;
			}
			var len = kx.length;
			for (var i = 0; i < len; i++) {
				var q = kx[i];
				if (!eqa.eq(x[q], y[q])) {
					return false;
				}
			}
			return true;
		});
	};
	var eqAny = eq(function (x, y) {
		if (x === y) {
			return true;
		}
		var tx = typeOf(x);
		var ty = typeOf(y);
		if (tx !== ty) {
			return false;
		}
		if (isEquatableType(tx)) {
			return x === y;
		} else if (tx === 'array') {
			return eqArray(eqAny).eq(x, y);
		} else if (tx === 'object') {
			return eqRecord(eqAny).eq(x, y);
		}
		return false;
	});

	var noop = function () {
	};
	var compose = function (fa, fb) {
		return function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			return fa(fb.apply(null, args));
		};
	};
	var compose1 = function (fbc, fab) {
		return function (a) {
			return fbc(fab(a));
		};
	};
	var constant = function (value) {
		return function () {
			return value;
		};
	};
	var identity = function (x) {
		return x;
	};
	function curry(fn) {
		var initialArgs = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			initialArgs[_i - 1] = arguments[_i];
		}
		return function () {
			var restArgs = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				restArgs[_i] = arguments[_i];
			}
			var all = initialArgs.concat(restArgs);
			return fn.apply(null, all);
		};
	}
	var not = function (f) {
		return function (t) {
			return !f(t);
		};
	};
	var die = function (msg) {
		return function () {
			throw new Error(msg);
		};
	};
	var call = function (f) {
		f();
	};
	var never = constant(false);
	var always = constant(true);

	var none = function () {
		return NONE;
	};
	var NONE = function () {
		var eq = function (o) {
			return o.isNone();
		};
		var call = function (thunk) {
			return thunk();
		};
		var id = function (n) {
			return n;
		};
		var me = {
			fold: function (n, _s) {
				return n();
			},
			is: never,
			isSome: never,
			isNone: always,
			getOr: id,
			getOrThunk: call,
			getOrDie: function (msg) {
				throw new Error(msg || 'error: getOrDie called on none.');
			},
			getOrNull: constant(null),
			getOrUndefined: constant(undefined),
			or: id,
			orThunk: call,
			map: none,
			each: noop,
			bind: none,
			exists: never,
			forall: always,
			filter: none,
			equals: eq,
			equals_: eq,
			toArray: function () {
				return [];
			},
			toString: constant('none()')
		};
		return me;
	}();
	var some = function (a) {
		var constant_a = constant(a);
		var self = function () {
			return me;
		};
		var bind = function (f) {
			return f(a);
		};
		var me = {
			fold: function (n, s) {
				return s(a);
			},
			is: function (v) {
				return a === v;
			},
			isSome: always,
			isNone: never,
			getOr: constant_a,
			getOrThunk: constant_a,
			getOrDie: constant_a,
			getOrNull: constant_a,
			getOrUndefined: constant_a,
			or: self,
			orThunk: self,
			map: function (f) {
				return some(f(a));
			},
			each: function (f) {
				f(a);
			},
			bind: bind,
			exists: bind,
			forall: bind,
			filter: function (f) {
				return f(a) ? me : NONE;
			},
			toArray: function () {
				return [a];
			},
			toString: function () {
				return 'some(' + a + ')';
			},
			equals: function (o) {
				return o.is(a);
			},
			equals_: function (o, elementEq) {
				return o.fold(never, function (b) {
					return elementEq(a, b);
				});
			}
		};
		return me;
	};
	var from = function (value) {
		return value === null || value === undefined ? NONE : some(value);
	};
	var Optional = {
		some: some,
		none: none,
		from: from
	};

	var typeOf$1 = function (x) {
		var t = typeof x;
		if (x === null) {
			return 'null';
		} else if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
			return 'array';
		} else if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
			return 'string';
		} else {
			return t;
		}
	};
	var isType = function (type) {
		return function (value) {
			return typeOf$1(value) === type;
		};
	};
	var isSimpleType = function (type) {
		return function (value) {
			return typeof value === type;
		};
	};
	var eq$1 = function (t) {
		return function (a) {
			return t === a;
		};
	};
	var isString = isType('string');
	var isObject = isType('object');
	var isArray = isType('array');
	var isNull = eq$1(null);
	var isBoolean = isSimpleType('boolean');
	var isUndefined = eq$1(undefined);
	var isNullable = function (a) {
		return a === null || a === undefined;
	};
	var isNonNullable = function (a) {
		return !isNullable(a);
	};
	var isFunction = isSimpleType('function');
	var isNumber = isSimpleType('number');

	var nativeSlice = Array.prototype.slice;
	var nativeIndexOf = Array.prototype.indexOf;
	var nativePush = Array.prototype.push;
	var rawIndexOf = function (ts, t) {
		return nativeIndexOf.call(ts, t);
	};
	var indexOf = function (xs, x) {
		var r = rawIndexOf(xs, x);
		return r === -1 ? Optional.none() : Optional.some(r);
	};
	var contains = function (xs, x) {
		return rawIndexOf(xs, x) > -1;
	};
	var exists = function (xs, pred) {
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			if (pred(x, i)) {
				return true;
			}
		}
		return false;
	};
	var map = function (xs, f) {
		var len = xs.length;
		var r = new Array(len);
		for (var i = 0; i < len; i++) {
			var x = xs[i];
			r[i] = f(x, i);
		}
		return r;
	};
	var each = function (xs, f) {
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			f(x, i);
		}
	};
	var eachr = function (xs, f) {
		for (var i = xs.length - 1; i >= 0; i--) {
			var x = xs[i];
			f(x, i);
		}
	};
	var partition = function (xs, pred) {
		var pass = [];
		var fail = [];
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			var arr = pred(x, i) ? pass : fail;
			arr.push(x);
		}
		return {
			pass: pass,
			fail: fail
		};
	};
	var filter = function (xs, pred) {
		var r = [];
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			if (pred(x, i)) {
				r.push(x);
			}
		}
		return r;
	};
	var foldr = function (xs, f, acc) {
		eachr(xs, function (x) {
			acc = f(acc, x);
		});
		return acc;
	};
	var foldl = function (xs, f, acc) {
		each(xs, function (x) {
			acc = f(acc, x);
		});
		return acc;
	};
	var findUntil = function (xs, pred, until) {
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			if (pred(x, i)) {
				return Optional.some(x);
			} else if (until(x, i)) {
				break;
			}
		}
		return Optional.none();
	};
	var find = function (xs, pred) {
		return findUntil(xs, pred, never);
	};
	var findIndex = function (xs, pred) {
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			if (pred(x, i)) {
				return Optional.some(i);
			}
		}
		return Optional.none();
	};
	var flatten = function (xs) {
		var r = [];
		for (var i = 0, len = xs.length; i < len; ++i) {
			if (!isArray(xs[i])) {
				throw new Error('Arr.flatten item ' + i + ' was not an array, input: ' + xs);
			}
			nativePush.apply(r, xs[i]);
		}
		return r;
	};
	var bind = function (xs, f) {
		return flatten(map(xs, f));
	};
	var forall = function (xs, pred) {
		for (var i = 0, len = xs.length; i < len; ++i) {
			var x = xs[i];
			if (pred(x, i) !== true) {
				return false;
			}
		}
		return true;
	};
	var reverse = function (xs) {
		var r = nativeSlice.call(xs, 0);
		r.reverse();
		return r;
	};
	var difference = function (a1, a2) {
		return filter(a1, function (x) {
			return !contains(a2, x);
		});
	};
	var mapToObject = function (xs, f) {
		var r = {};
		for (var i = 0, len = xs.length; i < len; i++) {
			var x = xs[i];
			r[String(x)] = f(x, i);
		}
		return r;
	};
	var sort$1 = function (xs, comparator) {
		var copy = nativeSlice.call(xs, 0);
		copy.sort(comparator);
		return copy;
	};
	var get = function (xs, i) {
		return i >= 0 && i < xs.length ? Optional.some(xs[i]) : Optional.none();
	};
	var head = function (xs) {
		return get(xs, 0);
	};
	var last = function (xs) {
		return get(xs, xs.length - 1);
	};
	var from$1 = isFunction(Array.from) ? Array.from : function (x) {
		return nativeSlice.call(x);
	};
	var findMap = function (arr, f) {
		for (var i = 0; i < arr.length; i++) {
			var r = f(arr[i], i);
			if (r.isSome()) {
				return r;
			}
		}
		return Optional.none();
	};

	var keys = Object.keys;
	var hasOwnProperty = Object.hasOwnProperty;
	var each$1 = function (obj, f) {
		var props = keys(obj);
		for (var k = 0, len = props.length; k < len; k++) {
			var i = props[k];
			var x = obj[i];
			f(x, i);
		}
	};
	var map$1 = function (obj, f) {
		return tupleMap(obj, function (x, i) {
			return {
				k: i,
				v: f(x, i)
			};
		});
	};
	var tupleMap = function (obj, f) {
		var r = {};
		each$1(obj, function (x, i) {
			var tuple = f(x, i);
			r[tuple.k] = tuple.v;
		});
		return r;
	};
	var objAcc = function (r) {
		return function (x, i) {
			r[i] = x;
		};
	};
	var internalFilter = function (obj, pred, onTrue, onFalse) {
		var r = {};
		each$1(obj, function (x, i) {
			(pred(x, i) ? onTrue : onFalse)(x, i);
		});
		return r;
	};
	var bifilter = function (obj, pred) {
		var t = {};
		var f = {};
		internalFilter(obj, pred, objAcc(t), objAcc(f));
		return {
			t: t,
			f: f
		};
	};
	var filter$1 = function (obj, pred) {
		var t = {};
		internalFilter(obj, pred, objAcc(t), noop);
		return t;
	};
	var mapToArray = function (obj, f) {
		var r = [];
		each$1(obj, function (value, name) {
			r.push(f(value, name));
		});
		return r;
	};
	var values = function (obj) {
		return mapToArray(obj, function (v) {
			return v;
		});
	};
	var get$1 = function (obj, key) {
		return has(obj, key) ? Optional.from(obj[key]) : Optional.none();
	};
	var has = function (obj, key) {
		return hasOwnProperty.call(obj, key);
	};
	var hasNonNullableKey = function (obj, key) {
		return has(obj, key) && obj[key] !== undefined && obj[key] !== null;
	};
	var equal = function (a1, a2, eq) {
		if (eq === void 0) {
			eq = eqAny;
		}
		return eqRecord(eq).eq(a1, a2);
	};

	var isArray$1 = Array.isArray;
	var toArray = function (obj) {
		if (!isArray$1(obj)) {
			var array = [];
			for (var i = 0, l = obj.length; i < l; i++) {
				array[i] = obj[i];
			}
			return array;
		} else {
			return obj;
		}
	};
	var each$2 = function (o, cb, s) {
		var n, l;
		if (!o) {
			return false;
		}
		s = s || o;
		if (o.length !== undefined) {
			for (n = 0, l = o.length; n < l; n++) {
				if (cb.call(s, o[n], n, o) === false) {
					return false;
				}
			}
		} else {
			for (n in o) {
				if (o.hasOwnProperty(n)) {
					if (cb.call(s, o[n], n, o) === false) {
						return false;
					}
				}
			}
		}
		return true;
	};
	var map$2 = function (array, callback) {
		var out = [];
		each$2(array, function (item, index) {
			out.push(callback(item, index, array));
		});
		return out;
	};
	var filter$2 = function (a, f) {
		var o = [];
		each$2(a, function (v, index) {
			if (!f || f(v, index, a)) {
				o.push(v);
			}
		});
		return o;
	};
	var indexOf$1 = function (a, v) {
		if (a) {
			for (var i = 0, l = a.length; i < l; i++) {
				if (a[i] === v) {
					return i;
				}
			}
		}
		return -1;
	};
	var reduce = function (collection, iteratee, accumulator, thisArg) {
		var acc = isUndefined(accumulator) ? collection[0] : accumulator;
		for (var i = 0; i < collection.length; i++) {
			acc = iteratee.call(thisArg, acc, collection[i], i);
		}
		return acc;
	};
	var findIndex$1 = function (array, predicate, thisArg) {
		var i, l;
		for (i = 0, l = array.length; i < l; i++) {
			if (predicate.call(thisArg, array[i], i, array)) {
				return i;
			}
		}
		return -1;
	};
	var last$1 = function (collection) {
		return collection[collection.length - 1];
	};

	var __assign = function () {
		__assign = Object.assign || function __assign(t) {
			for (var s, i = 1, n = arguments.length; i < n; i++) {
				s = arguments[i];
				for (var p in s)
					if (Object.prototype.hasOwnProperty.call(s, p))
						t[p] = s[p];
			}
			return t;
		};
		return __assign.apply(this, arguments);
	};
	function __rest(s, e) {
		var t = {};
		for (var p in s)
			if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
				t[p] = s[p];
		if (s != null && typeof Object.getOwnPropertySymbols === 'function')
			for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
				if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
					t[p[i]] = s[p[i]];
			}
		return t;
	}
	function __spreadArrays() {
		for (var s = 0, i = 0, il = arguments.length; i < il; i++)
			s += arguments[i].length;
		for (var r = Array(s), k = 0, i = 0; i < il; i++)
			for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
				r[k] = a[j];
		return r;
	}

	var cached = function (f) {
		var called = false;
		var r;
		return function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			if (!called) {
				called = true;
				r = f.apply(null, args);
			}
			return r;
		};
	};

	var DeviceType = function (os, browser, userAgent, mediaMatch) {
		var isiPad = os.isiOS() && /ipad/i.test(userAgent) === true;
		var isiPhone = os.isiOS() && !isiPad;
		var isMobile = os.isiOS() || os.isAndroid();
		var isTouch = isMobile || mediaMatch('(pointer:coarse)');
		var isTablet = isiPad || !isiPhone && isMobile && mediaMatch('(min-device-width:768px)');
		var isPhone = isiPhone || isMobile && !isTablet;
		var iOSwebview = browser.isSafari() && os.isiOS() && /safari/i.test(userAgent) === false;
		var isDesktop = !isPhone && !isTablet && !iOSwebview;
		return {
			isiPad: constant(isiPad),
			isiPhone: constant(isiPhone),
			isTablet: constant(isTablet),
			isPhone: constant(isPhone),
			isTouch: constant(isTouch),
			isAndroid: os.isAndroid,
			isiOS: os.isiOS,
			isWebView: constant(iOSwebview),
			isDesktop: constant(isDesktop)
		};
	};

	var firstMatch = function (regexes, s) {
		for (var i = 0; i < regexes.length; i++) {
			var x = regexes[i];
			if (x.test(s)) {
				return x;
			}
		}
		return undefined;
	};
	var find$1 = function (regexes, agent) {
		var r = firstMatch(regexes, agent);
		if (!r) {
			return {
				major: 0,
				minor: 0
			};
		}
		var group = function (i) {
			return Number(agent.replace(r, '$' + i));
		};
		return nu(group(1), group(2));
	};
	var detect = function (versionRegexes, agent) {
		var cleanedAgent = String(agent).toLowerCase();
		if (versionRegexes.length === 0) {
			return unknown();
		}
		return find$1(versionRegexes, cleanedAgent);
	};
	var unknown = function () {
		return nu(0, 0);
	};
	var nu = function (major, minor) {
		return {
			major: major,
			minor: minor
		};
	};
	var Version = {
		nu: nu,
		detect: detect,
		unknown: unknown
	};

	var detect$1 = function (candidates, userAgent) {
		var agent = String(userAgent).toLowerCase();
		return find(candidates, function (candidate) {
			return candidate.search(agent);
		});
	};
	var detectBrowser = function (browsers, userAgent) {
		return detect$1(browsers, userAgent).map(function (browser) {
			var version = Version.detect(browser.versionRegexes, userAgent);
			return {
				current: browser.name,
				version: version
			};
		});
	};
	var detectOs = function (oses, userAgent) {
		return detect$1(oses, userAgent).map(function (os) {
			var version = Version.detect(os.versionRegexes, userAgent);
			return {
				current: os.name,
				version: version
			};
		});
	};
	var UaString = {
		detectBrowser: detectBrowser,
		detectOs: detectOs
	};

	var removeFromStart = function (str, numChars) {
		return str.substring(numChars);
	};

	var checkRange = function (str, substr, start) {
		return substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
	};
	var removeLeading = function (str, prefix) {
		return startsWith(str, prefix) ? removeFromStart(str, prefix.length) : str;
	};
	var contains$1 = function (str, substr) {
		return str.indexOf(substr) !== -1;
	};
	var startsWith = function (str, prefix) {
		return checkRange(str, prefix, 0);
	};
	var blank = function (r) {
		return function (s) {
			return s.replace(r, '');
		};
	};
	var trim = blank(/^\s+|\s+$/g);
	var lTrim = blank(/^\s+/g);
	var rTrim = blank(/\s+$/g);

	var normalVersionRegex = /.*?version\/\ ?([0-9]+)\.([0-9]+).*/;
	var checkContains = function (target) {
		return function (uastring) {
			return contains$1(uastring, target);
		};
	};
	var browsers = [
		{
			name: 'Edge',
			versionRegexes: [/.*?edge\/ ?([0-9]+)\.([0-9]+)$/],
			search: function (uastring) {
				return contains$1(uastring, 'edge/') && contains$1(uastring, 'chrome') && contains$1(uastring, 'safari') && contains$1(uastring, 'applewebkit');
			}
		},
		{
			name: 'Chrome',
			versionRegexes: [
				/.*?chrome\/([0-9]+)\.([0-9]+).*/,
				normalVersionRegex
			],
			search: function (uastring) {
				return contains$1(uastring, 'chrome') && !contains$1(uastring, 'chromeframe');
			}
		},
		{
			name: 'IE',
			versionRegexes: [
				/.*?msie\ ?([0-9]+)\.([0-9]+).*/,
				/.*?rv:([0-9]+)\.([0-9]+).*/
			],
			search: function (uastring) {
				return contains$1(uastring, 'msie') || contains$1(uastring, 'trident');
			}
		},
		{
			name: 'Opera',
			versionRegexes: [
				normalVersionRegex,
				/.*?opera\/([0-9]+)\.([0-9]+).*/
			],
			search: checkContains('opera')
		},
		{
			name: 'Firefox',
			versionRegexes: [/.*?firefox\/\ ?([0-9]+)\.([0-9]+).*/],
			search: checkContains('firefox')
		},
		{
			name: 'Safari',
			versionRegexes: [
				normalVersionRegex,
				/.*?cpu os ([0-9]+)_([0-9]+).*/
			],
			search: function (uastring) {
				return (contains$1(uastring, 'safari') || contains$1(uastring, 'mobile/')) && contains$1(uastring, 'applewebkit');
			}
		}
	];
	var oses = [
		{
			name: 'Windows',
			search: checkContains('win'),
			versionRegexes: [/.*?windows\ nt\ ?([0-9]+)\.([0-9]+).*/]
		},
		{
			name: 'iOS',
			search: function (uastring) {
				return contains$1(uastring, 'iphone') || contains$1(uastring, 'ipad');
			},
			versionRegexes: [
				/.*?version\/\ ?([0-9]+)\.([0-9]+).*/,
				/.*cpu os ([0-9]+)_([0-9]+).*/,
				/.*cpu iphone os ([0-9]+)_([0-9]+).*/
			]
		},
		{
			name: 'Android',
			search: checkContains('android'),
			versionRegexes: [/.*?android\ ?([0-9]+)\.([0-9]+).*/]
		},
		{
			name: 'OSX',
			search: checkContains('mac os x'),
			versionRegexes: [/.*?mac\ os\ x\ ?([0-9]+)_([0-9]+).*/]
		},
		{
			name: 'Linux',
			search: checkContains('linux'),
			versionRegexes: []
		},
		{
			name: 'Solaris',
			search: checkContains('sunos'),
			versionRegexes: []
		},
		{
			name: 'FreeBSD',
			search: checkContains('freebsd'),
			versionRegexes: []
		},
		{
			name: 'ChromeOS',
			search: checkContains('cros'),
			versionRegexes: [/.*?chrome\/([0-9]+)\.([0-9]+).*/]
		}
	];
	var PlatformInfo = {
		browsers: constant(browsers),
		oses: constant(oses)
	};

	var edge = 'Edge';
	var chrome = 'Chrome';
	var ie = 'IE';
	var opera = 'Opera';
	var firefox = 'Firefox';
	var safari = 'Safari';
	var unknown$1 = function () {
		return nu$1({
			current: undefined,
			version: Version.unknown()
		});
	};
	var nu$1 = function (info) {
		var current = info.current;
		var version = info.version;
		var isBrowser = function (name) {
			return function () {
				return current === name;
			};
		};
		return {
			current: current,
			version: version,
			isEdge: isBrowser(edge),
			isChrome: isBrowser(chrome),
			isIE: isBrowser(ie),
			isOpera: isBrowser(opera),
			isFirefox: isBrowser(firefox),
			isSafari: isBrowser(safari)
		};
	};
	var Browser = {
		unknown: unknown$1,
		nu: nu$1,
		edge: constant(edge),
		chrome: constant(chrome),
		ie: constant(ie),
		opera: constant(opera),
		firefox: constant(firefox),
		safari: constant(safari)
	};

	var windows = 'Windows';
	var ios = 'iOS';
	var android = 'Android';
	var linux = 'Linux';
	var osx = 'OSX';
	var solaris = 'Solaris';
	var freebsd = 'FreeBSD';
	var chromeos = 'ChromeOS';
	var unknown$2 = function () {
		return nu$2({
			current: undefined,
			version: Version.unknown()
		});
	};
	var nu$2 = function (info) {
		var current = info.current;
		var version = info.version;
		var isOS = function (name) {
			return function () {
				return current === name;
			};
		};
		return {
			current: current,
			version: version,
			isWindows: isOS(windows),
			isiOS: isOS(ios),
			isAndroid: isOS(android),
			isOSX: isOS(osx),
			isLinux: isOS(linux),
			isSolaris: isOS(solaris),
			isFreeBSD: isOS(freebsd),
			isChromeOS: isOS(chromeos)
		};
	};
	var OperatingSystem = {
		unknown: unknown$2,
		nu: nu$2,
		windows: constant(windows),
		ios: constant(ios),
		android: constant(android),
		linux: constant(linux),
		osx: constant(osx),
		solaris: constant(solaris),
		freebsd: constant(freebsd),
		chromeos: constant(chromeos)
	};

	var detect$2 = function (userAgent, mediaMatch) {
		var browsers = PlatformInfo.browsers();
		var oses = PlatformInfo.oses();
		var browser = UaString.detectBrowser(browsers, userAgent).fold(Browser.unknown, Browser.nu);
		var os = UaString.detectOs(oses, userAgent).fold(OperatingSystem.unknown, OperatingSystem.nu);
		var deviceType = DeviceType(os, browser, userAgent, mediaMatch);
		return {
			browser: browser,
			os: os,
			deviceType: deviceType
		};
	};
	var PlatformDetection = { detect: detect$2 };

	var mediaMatch = function (query) {
		return window.matchMedia(query).matches;
	};
	var platform = cached(function () {
		return PlatformDetection.detect(navigator.userAgent, mediaMatch);
	});
	var detect$3 = function () {
		return platform();
	};

	var userAgent = navigator.userAgent;
	var platform$1 = detect$3();
	var browser = platform$1.browser;
	var os = platform$1.os;
	var deviceType = platform$1.deviceType;
	var webkit = /WebKit/.test(userAgent) && !browser.isEdge();
	var fileApi = 'FormData' in window && 'FileReader' in window && 'URL' in window && !!URL.createObjectURL;
	var windowsPhone = userAgent.indexOf('Windows Phone') !== -1;
	var Env = {
		opera: browser.isOpera(),
		webkit: webkit,
		ie: browser.isIE() || browser.isEdge() ? browser.version.major : false,
		gecko: browser.isFirefox(),
		mac: os.isOSX() || os.isiOS(),
		iOS: deviceType.isiPad() || deviceType.isiPhone(),
		android: os.isAndroid(),
		contentEditable: true,
		transparentSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
		caretAfter: true,
		range: window.getSelection && 'Range' in window,
		documentMode: browser.isIE() ? document.documentMode || 7 : 10,
		fileApi: fileApi,
		ceFalse: true,
		cacheSuffix: null,
		container: null,
		experimentalShadowDom: false,
		canHaveCSP: !browser.isIE(),
		desktop: deviceType.isDesktop(),
		windowsPhone: windowsPhone,
		browser: {
			current: browser.current,
			version: browser.version,
			isChrome: browser.isChrome,
			isEdge: browser.isEdge,
			isFirefox: browser.isFirefox,
			isIE: browser.isIE,
			isOpera: browser.isOpera,
			isSafari: browser.isSafari
		},
		os: {
			current: os.current,
			version: os.version,
			isAndroid: os.isAndroid,
			isChromeOS: os.isChromeOS,
			isFreeBSD: os.isFreeBSD,
			isiOS: os.isiOS,
			isLinux: os.isLinux,
			isOSX: os.isOSX,
			isSolaris: os.isSolaris,
			isWindows: os.isWindows
		},
		deviceType: {
			isDesktop: deviceType.isDesktop,
			isiPad: deviceType.isiPad,
			isiPhone: deviceType.isiPhone,
			isPhone: deviceType.isPhone,
			isTablet: deviceType.isTablet,
			isTouch: deviceType.isTouch,
			isWebView: deviceType.isWebView
		}
	};

	var whiteSpaceRegExp = /^\s*|\s*$/g;
	var trim$1 = function (str) {
		return str === null || str === undefined ? '' : ('' + str).replace(whiteSpaceRegExp, '');
	};
	var is = function (obj, type) {
		if (!type) {
			return obj !== undefined;
		}
		if (type === 'array' && isArray$1(obj)) {
			return true;
		}
		return typeof obj === type;
	};
	var makeMap = function (items, delim, map) {
		var i;
		items = items || [];
		delim = delim || ',';
		if (typeof items === 'string') {
			items = items.split(delim);
		}
		map = map || {};
		i = items.length;
		while (i--) {
			map[items[i]] = {};
		}
		return map;
	};
	var hasOwnProperty$1 = function (obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	};
	var create = function (s, p, root) {
		var self = this;
		var sp, scn, c, de = 0;
		s = /^((static) )?([\w.]+)(:([\w.]+))?/.exec(s);
		var cn = s[3].match(/(^|\.)(\w+)$/i)[2];
		var ns = self.createNS(s[3].replace(/\.\w+$/, ''), root);
		if (ns[cn]) {
			return;
		}
		if (s[2] === 'static') {
			ns[cn] = p;
			if (this.onCreate) {
				this.onCreate(s[2], s[3], ns[cn]);
			}
			return;
		}
		if (!p[cn]) {
			p[cn] = function () {
			};
			de = 1;
		}
		ns[cn] = p[cn];
		self.extend(ns[cn].prototype, p);
		if (s[5]) {
			sp = self.resolve(s[5]).prototype;
			scn = s[5].match(/\.(\w+)$/i)[1];
			c = ns[cn];
			if (de) {
				ns[cn] = function () {
					return sp[scn].apply(this, arguments);
				};
			} else {
				ns[cn] = function () {
					this.parent = sp[scn];
					return c.apply(this, arguments);
				};
			}
			ns[cn].prototype[cn] = ns[cn];
			self.each(sp, function (f, n) {
				ns[cn].prototype[n] = sp[n];
			});
			self.each(p, function (f, n) {
				if (sp[n]) {
					ns[cn].prototype[n] = function () {
						this.parent = sp[n];
						return f.apply(this, arguments);
					};
				} else {
					if (n !== cn) {
						ns[cn].prototype[n] = f;
					}
				}
			});
		}
		self.each(p.static, function (f, n) {
			ns[cn][n] = f;
		});
	};
	var extend = function (obj) {
		var exts = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			exts[_i - 1] = arguments[_i];
		}
		for (var i = 0; i < exts.length; i++) {
			var ext = exts[i];
			for (var name_1 in ext) {
				if (ext.hasOwnProperty(name_1)) {
					var value = ext[name_1];
					if (value !== undefined) {
						obj[name_1] = value;
					}
				}
			}
		}
		return obj;
	};
	var walk = function (o, f, n, s) {
		s = s || this;
		if (o) {
			if (n) {
				o = o[n];
			}
			each$2(o, function (o, i) {
				if (f.call(s, o, i, n) === false) {
					return false;
				}
				walk(o, f, n, s);
			});
		}
	};
	var createNS = function (n, o) {
		var i, v;
		o = o || window;
		n = n.split('.');
		for (i = 0; i < n.length; i++) {
			v = n[i];
			if (!o[v]) {
				o[v] = {};
			}
			o = o[v];
		}
		return o;
	};
	var resolve = function (n, o) {
		var i, l;
		o = o || window;
		n = n.split('.');
		for (i = 0, l = n.length; i < l; i++) {
			o = o[n[i]];
			if (!o) {
				break;
			}
		}
		return o;
	};
	var explode = function (s, d) {
		if (!s || is(s, 'array')) {
			return s;
		}
		return map$2(s.split(d || ','), trim$1);
	};
	var _addCacheSuffix = function (url) {
		var cacheSuffix = Env.cacheSuffix;
		if (cacheSuffix) {
			url += (url.indexOf('?') === -1 ? '?' : '&') + cacheSuffix;
		}
		return url;
	};
	var Tools = {
		trim: trim$1,
		isArray: isArray$1,
		is: is,
		toArray: toArray,
		makeMap: makeMap,
		each: each$2,
		map: map$2,
		grep: filter$2,
		inArray: indexOf$1,
		hasOwn: hasOwnProperty$1,
		extend: extend,
		create: create,
		walk: walk,
		createNS: createNS,
		resolve: resolve,
		explode: explode,
		_addCacheSuffix: _addCacheSuffix
	};

	var fromHtml = function (html, scope) {
		var doc = scope || document;
		var div = doc.createElement('div');
		div.innerHTML = html;
		if (!div.hasChildNodes() || div.childNodes.length > 1) {
			console.error('HTML does not have a single root node', html);
			throw new Error('HTML must have a single root node');
		}
		return fromDom(div.childNodes[0]);
	};
	var fromTag = function (tag, scope) {
		var doc = scope || document;
		var node = doc.createElement(tag);
		return fromDom(node);
	};
	var fromText = function (text, scope) {
		var doc = scope || document;
		var node = doc.createTextNode(text);
		return fromDom(node);
	};
	var fromDom = function (node) {
		if (node === null || node === undefined) {
			throw new Error('Node cannot be null or undefined');
		}
		return { dom: node };
	};
	var fromPoint = function (docElm, x, y) {
		return Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom);
	};
	var SugarElement = {
		fromHtml: fromHtml,
		fromTag: fromTag,
		fromText: fromText,
		fromDom: fromDom,
		fromPoint: fromPoint
	};

	var toArray$1 = function (target, f) {
		var r = [];
		var recurse = function (e) {
			r.push(e);
			return f(e);
		};
		var cur = f(target);
		do {
			cur = cur.bind(recurse);
		} while (cur.isSome());
		return r;
	};

	var compareDocumentPosition = function (a, b, match) {
		return (a.compareDocumentPosition(b) & match) !== 0;
	};
	var documentPositionContainedBy = function (a, b) {
		return compareDocumentPosition(a, b, Node.DOCUMENT_POSITION_CONTAINED_BY);
	};

	var COMMENT = 8;
	var DOCUMENT = 9;
	var DOCUMENT_FRAGMENT = 11;
	var ELEMENT = 1;
	var TEXT = 3;

	var is$1 = function (element, selector) {
		var dom = element.dom;
		if (dom.nodeType !== ELEMENT) {
			return false;
		} else {
			var elem = dom;
			if (elem.matches !== undefined) {
				return elem.matches(selector);
			} else if (elem.msMatchesSelector !== undefined) {
				return elem.msMatchesSelector(selector);
			} else if (elem.webkitMatchesSelector !== undefined) {
				return elem.webkitMatchesSelector(selector);
			} else if (elem.mozMatchesSelector !== undefined) {
				return elem.mozMatchesSelector(selector);
			} else {
				throw new Error('Browser lacks native selectors');
			}
		}
	};
	var bypassSelector = function (dom) {
		return dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT && dom.nodeType !== DOCUMENT_FRAGMENT || dom.childElementCount === 0;
	};
	var all = function (selector, scope) {
		var base = scope === undefined ? document : scope.dom;
		return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
	};
	var one = function (selector, scope) {
		var base = scope === undefined ? document : scope.dom;
		return bypassSelector(base) ? Optional.none() : Optional.from(base.querySelector(selector)).map(SugarElement.fromDom);
	};

	var eq$2 = function (e1, e2) {
		return e1.dom === e2.dom;
	};
	var regularContains = function (e1, e2) {
		var d1 = e1.dom;
		var d2 = e2.dom;
		return d1 === d2 ? false : d1.contains(d2);
	};
	var ieContains = function (e1, e2) {
		return documentPositionContainedBy(e1.dom, e2.dom);
	};
	var contains$2 = function (e1, e2) {
		return detect$3().browser.isIE() ? ieContains(e1, e2) : regularContains(e1, e2);
	};

	var Global = typeof window !== 'undefined' ? window : Function('return this;')();

	var name = function (element) {
		var r = element.dom.nodeName;
		return r.toLowerCase();
	};
	var type = function (element) {
		return element.dom.nodeType;
	};
	var isType$1 = function (t) {
		return function (element) {
			return type(element) === t;
		};
	};
	var isComment = function (element) {
		return type(element) === COMMENT || name(element) === '#comment';
	};
	var isElement = isType$1(ELEMENT);
	var isText = isType$1(TEXT);
	var isDocument = isType$1(DOCUMENT);
	var isDocumentFragment = isType$1(DOCUMENT_FRAGMENT);

	var owner = function (element) {
		return SugarElement.fromDom(element.dom.ownerDocument);
	};
	var documentOrOwner = function (dos) {
		return isDocument(dos) ? dos : owner(dos);
	};
	var documentElement = function (element) {
		return SugarElement.fromDom(documentOrOwner(element).dom.documentElement);
	};
	var defaultView = function (element) {
		return SugarElement.fromDom(documentOrOwner(element).dom.defaultView);
	};
	var parent = function (element) {
		return Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
	};
	var parents = function (element, isRoot) {
		var stop = isFunction(isRoot) ? isRoot : never;
		var dom = element.dom;
		var ret = [];
		while (dom.parentNode !== null && dom.parentNode !== undefined) {
			var rawParent = dom.parentNode;
			var p = SugarElement.fromDom(rawParent);
			ret.push(p);
			if (stop(p) === true) {
				break;
			} else {
				dom = rawParent;
			}
		}
		return ret;
	};
	var siblings = function (element) {
		var filterSelf = function (elements) {
			return filter(elements, function (x) {
				return !eq$2(element, x);
			});
		};
		return parent(element).map(children).map(filterSelf).getOr([]);
	};
	var prevSibling = function (element) {
		return Optional.from(element.dom.previousSibling).map(SugarElement.fromDom);
	};
	var nextSibling = function (element) {
		return Optional.from(element.dom.nextSibling).map(SugarElement.fromDom);
	};
	var prevSiblings = function (element) {
		return reverse(toArray$1(element, prevSibling));
	};
	var nextSiblings = function (element) {
		return toArray$1(element, nextSibling);
	};
	var children = function (element) {
		return map(element.dom.childNodes, SugarElement.fromDom);
	};
	var child = function (element, index) {
		var cs = element.dom.childNodes;
		return Optional.from(cs[index]).map(SugarElement.fromDom);
	};
	var firstChild = function (element) {
		return child(element, 0);
	};
	var lastChild = function (element) {
		return child(element, element.dom.childNodes.length - 1);
	};
	var childNodesCount = function (element) {
		return element.dom.childNodes.length;
	};

	var getHead = function (doc) {
		var b = doc.dom.head;
		if (b === null || b === undefined) {
			throw new Error('Head is not available yet');
		}
		return SugarElement.fromDom(b);
	};

	var isShadowRoot = function (dos) {
		return isDocumentFragment(dos);
	};
	var supported = isFunction(Element.prototype.attachShadow) && isFunction(Node.prototype.getRootNode);
	var isSupported = constant(supported);
	var getRootNode = supported ? function (e) {
		return SugarElement.fromDom(e.dom.getRootNode());
	} : documentOrOwner;
	var getStyleContainer = function (dos) {
		return isShadowRoot(dos) ? dos : getHead(documentOrOwner(dos));
	};
	var getShadowRoot = function (e) {
		var r = getRootNode(e);
		return isShadowRoot(r) ? Optional.some(r) : Optional.none();
	};
	var getShadowHost = function (e) {
		return SugarElement.fromDom(e.dom.host);
	};
	var getOriginalEventTarget = function (event) {
		if (isSupported() && isNonNullable(event.target)) {
			var el = SugarElement.fromDom(event.target);
			if (isElement(el) && isOpenShadowHost(el)) {
				if (event.composed && event.composedPath) {
					var composedPath = event.composedPath();
					if (composedPath) {
						return head(composedPath);
					}
				}
			}
		}
		return Optional.from(event.target);
	};
	var isOpenShadowHost = function (element) {
		return isNonNullable(element.dom.shadowRoot);
	};

	var before = function (marker, element) {
		var parent$1 = parent(marker);
		parent$1.each(function (v) {
			v.dom.insertBefore(element.dom, marker.dom);
		});
	};
	var after = function (marker, element) {
		var sibling = nextSibling(marker);
		sibling.fold(function () {
			var parent$1 = parent(marker);
			parent$1.each(function (v) {
				append(v, element);
			});
		}, function (v) {
			before(v, element);
		});
	};
	var prepend = function (parent, element) {
		var firstChild$1 = firstChild(parent);
		firstChild$1.fold(function () {
			append(parent, element);
		}, function (v) {
			parent.dom.insertBefore(element.dom, v.dom);
		});
	};
	var append = function (parent, element) {
		parent.dom.appendChild(element.dom);
	};
	var wrap = function (element, wrapper) {
		before(element, wrapper);
		append(wrapper, element);
	};

	var before$1 = function (marker, elements) {
		each(elements, function (x) {
			before(marker, x);
		});
	};
	var append$1 = function (parent, elements) {
		each(elements, function (x) {
			append(parent, x);
		});
	};

	var empty = function (element) {
		element.dom.textContent = '';
		each(children(element), function (rogue) {
			remove(rogue);
		});
	};
	var remove = function (element) {
		var dom = element.dom;
		if (dom.parentNode !== null) {
			dom.parentNode.removeChild(dom);
		}
	};
	var unwrap = function (wrapper) {
		var children$1 = children(wrapper);
		if (children$1.length > 0) {
			before$1(wrapper, children$1);
		}
		remove(wrapper);
	};

	var inBody = function (element) {
		var dom = isText(element) ? element.dom.parentNode : element.dom;
		if (dom === undefined || dom === null || dom.ownerDocument === null) {
			return false;
		}
		var doc = dom.ownerDocument;
		return getShadowRoot(SugarElement.fromDom(dom)).fold(function () {
			return doc.body.contains(dom);
		}, compose1(inBody, getShadowHost));
	};

	var r = function (left, top) {
		var translate = function (x, y) {
			return r(left + x, top + y);
		};
		return {
			left: left,
			top: top,
			translate: translate
		};
	};
	var SugarPosition = r;

	var boxPosition = function (dom) {
		var box = dom.getBoundingClientRect();
		return SugarPosition(box.left, box.top);
	};
	var firstDefinedOrZero = function (a, b) {
		if (a !== undefined) {
			return a;
		} else {
			return b !== undefined ? b : 0;
		}
	};
	var absolute = function (element) {
		var doc = element.dom.ownerDocument;
		var body = doc.body;
		var win = doc.defaultView;
		var html = doc.documentElement;
		if (body === element.dom) {
			return SugarPosition(body.offsetLeft, body.offsetTop);
		}
		var scrollTop = firstDefinedOrZero(win === null || win === void 0 ? void 0 : win.pageYOffset, html.scrollTop);
		var scrollLeft = firstDefinedOrZero(win === null || win === void 0 ? void 0 : win.pageXOffset, html.scrollLeft);
		var clientTop = firstDefinedOrZero(html.clientTop, body.clientTop);
		var clientLeft = firstDefinedOrZero(html.clientLeft, body.clientLeft);
		return viewport(element).translate(scrollLeft - clientLeft, scrollTop - clientTop);
	};
	var viewport = function (element) {
		var dom = element.dom;
		var doc = dom.ownerDocument;
		var body = doc.body;
		if (body === dom) {
			return SugarPosition(body.offsetLeft, body.offsetTop);
		}
		if (!inBody(element)) {
			return SugarPosition(0, 0);
		}
		return boxPosition(dom);
	};

	var get$2 = function (_DOC) {
		var doc = _DOC !== undefined ? _DOC.dom : document;
		var x = doc.body.scrollLeft || doc.documentElement.scrollLeft;
		var y = doc.body.scrollTop || doc.documentElement.scrollTop;
		return SugarPosition(x, y);
	};
	var to = function (x, y, _DOC) {
		var doc = _DOC !== undefined ? _DOC.dom : document;
		var win = doc.defaultView;
		if (win) {
			win.scrollTo(x, y);
		}
	};
	var intoView = function (element, alignToTop) {
		var isSafari = detect$3().browser.isSafari();
		if (isSafari && isFunction(element.dom.scrollIntoViewIfNeeded)) {
			element.dom.scrollIntoViewIfNeeded(false);
		} else {
			element.dom.scrollIntoView(alignToTop);
		}
	};

	var get$3 = function (_win) {
		var win = _win === undefined ? window : _win;
		return Optional.from(win['visualViewport']);
	};
	var bounds = function (x, y, width, height) {
		return {
			x: x,
			y: y,
			width: width,
			height: height,
			right: x + width,
			bottom: y + height
		};
	};
	var getBounds = function (_win) {
		var win = _win === undefined ? window : _win;
		var doc = win.document;
		var scroll = get$2(SugarElement.fromDom(doc));
		return get$3(win).fold(function () {
			var html = win.document.documentElement;
			var width = html.clientWidth;
			var height = html.clientHeight;
			return bounds(scroll.left, scroll.top, width, height);
		}, function (visualViewport) {
			return bounds(Math.max(visualViewport.pageLeft, scroll.left), Math.max(visualViewport.pageTop, scroll.top), visualViewport.width, visualViewport.height);
		});
	};

	var isNodeType = function (type) {
		return function (node) {
			return !!node && node.nodeType === type;
		};
	};
	var isRestrictedNode = function (node) {
		return !!node && !Object.getPrototypeOf(node);
	};
	var isElement$1 = isNodeType(1);
	var matchNodeNames = function (names) {
		var lowercasedNames = names.map(function (s) {
			return s.toLowerCase();
		});
		return function (node) {
			if (node && node.nodeName) {
				var nodeName = node.nodeName.toLowerCase();
				return contains(lowercasedNames, nodeName);
			}
			return false;
		};
	};
	var matchStyleValues = function (name, values) {
		var items = values.toLowerCase().split(' ');
		return function (node) {
			var i, cssValue;
			if (isElement$1(node)) {
				for (i = 0; i < items.length; i++) {
					var computed = node.ownerDocument.defaultView.getComputedStyle(node, null);
					cssValue = computed ? computed.getPropertyValue(name) : null;
					if (cssValue === items[i]) {
						return true;
					}
				}
			}
			return false;
		};
	};
	var hasAttribute = function (attrName) {
		return function (node) {
			return isElement$1(node) && node.hasAttribute(attrName);
		};
	};
	var hasAttributeValue = function (attrName, attrValue) {
		return function (node) {
			return isElement$1(node) && node.getAttribute(attrName) === attrValue;
		};
	};
	var isBogus = function (node) {
		return isElement$1(node) && node.hasAttribute('data-mce-bogus');
	};
	var isBogusAll = function (node) {
		return isElement$1(node) && node.getAttribute('data-mce-bogus') === 'all';
	};
	var isTable = function (node) {
		return isElement$1(node) && node.tagName === 'TABLE';
	};
	var hasContentEditableState = function (value) {
		return function (node) {
			if (isElement$1(node)) {
				if (node.contentEditable === value) {
					return true;
				}
				if (node.getAttribute('data-mce-contenteditable') === value) {
					return true;
				}
			}
			return false;
		};
	};
	var isTextareaOrInput = matchNodeNames([
		'textarea',
		'input'
	]);
	var isText$1 = isNodeType(3);
	var isComment$1 = isNodeType(8);
	var isDocument$1 = isNodeType(9);
	var isDocumentFragment$1 = isNodeType(11);
	var isBr = matchNodeNames(['br']);
	var isImg = matchNodeNames(['img']);
	var isContentEditableTrue = hasContentEditableState('true');
	var isContentEditableFalse = hasContentEditableState('false');
	var isTableCell = matchNodeNames([
		'td',
		'th'
	]);
	var isMedia = matchNodeNames([
		'video',
		'audio',
		'object',
		'embed'
	]);

	var isSupported$1 = function (dom) {
		return dom.style !== undefined && isFunction(dom.style.getPropertyValue);
	};

	var rawSet = function (dom, key, value) {
		if (isString(value) || isBoolean(value) || isNumber(value)) {
			dom.setAttribute(key, value + '');
		} else {
			console.error('Invalid call to Attribute.set. Key ', key, ':: Value ', value, ':: Element ', dom);
			throw new Error('Attribute value was not simple');
		}
	};
	var set = function (element, key, value) {
		rawSet(element.dom, key, value);
	};
	var setAll = function (element, attrs) {
		var dom = element.dom;
		each$1(attrs, function (v, k) {
			rawSet(dom, k, v);
		});
	};
	var get$4 = function (element, key) {
		var v = element.dom.getAttribute(key);
		return v === null ? undefined : v;
	};
	var getOpt = function (element, key) {
		return Optional.from(get$4(element, key));
	};
	var has$1 = function (element, key) {
		var dom = element.dom;
		return dom && dom.hasAttribute ? dom.hasAttribute(key) : false;
	};
	var remove$1 = function (element, key) {
		element.dom.removeAttribute(key);
	};
	var clone = function (element) {
		return foldl(element.dom.attributes, function (acc, attr) {
			acc[attr.name] = attr.value;
			return acc;
		}, {});
	};

	var internalSet = function (dom, property, value) {
		if (!isString(value)) {
			console.error('Invalid call to CSS.set. Property ', property, ':: Value ', value, ':: Element ', dom);
			throw new Error('CSS value must be a string: ' + value);
		}
		if (isSupported$1(dom)) {
			dom.style.setProperty(property, value);
		}
	};
	var setAll$1 = function (element, css) {
		var dom = element.dom;
		each$1(css, function (v, k) {
			internalSet(dom, k, v);
		});
	};
	var get$5 = function (element, property) {
		var dom = element.dom;
		var styles = window.getComputedStyle(dom);
		var r = styles.getPropertyValue(property);
		return r === '' && !inBody(element) ? getUnsafeProperty(dom, property) : r;
	};
	var getUnsafeProperty = function (dom, property) {
		return isSupported$1(dom) ? dom.style.getPropertyValue(property) : '';
	};
	var getRaw = function (element, property) {
		var dom = element.dom;
		var raw = getUnsafeProperty(dom, property);
		return Optional.from(raw).filter(function (r) {
			return r.length > 0;
		});
	};
	var getAllRaw = function (element) {
		var css = {};
		var dom = element.dom;
		if (isSupported$1(dom)) {
			for (var i = 0; i < dom.style.length; i++) {
				var ruleName = dom.style.item(i);
				css[ruleName] = dom.style[ruleName];
			}
		}
		return css;
	};
	var reflow = function (e) {
		return e.dom.offsetWidth;
	};

	var browser$1 = detect$3().browser;
	var firstElement = function (nodes) {
		return find(nodes, isElement);
	};
	var getTableCaptionDeltaY = function (elm) {
		if (browser$1.isFirefox() && name(elm) === 'table') {
			return firstElement(children(elm)).filter(function (elm) {
				return name(elm) === 'caption';
			}).bind(function (caption) {
				return firstElement(nextSiblings(caption)).map(function (body) {
					var bodyTop = body.dom.offsetTop;
					var captionTop = caption.dom.offsetTop;
					var captionHeight = caption.dom.offsetHeight;
					return bodyTop <= captionTop ? -captionHeight : 0;
				});
			}).getOr(0);
		} else {
			return 0;
		}
	};
	var hasChild = function (elm, child) {
		return elm.children && contains(elm.children, child);
	};
	var getPos = function (body, elm, rootElm) {
		var x = 0, y = 0, offsetParent;
		var doc = body.ownerDocument;
		var pos;
		rootElm = rootElm ? rootElm : body;
		if (elm) {
			if (rootElm === body && elm.getBoundingClientRect && get$5(SugarElement.fromDom(body), 'position') === 'static') {
				pos = elm.getBoundingClientRect();
				x = pos.left + (doc.documentElement.scrollLeft || body.scrollLeft) - doc.documentElement.clientLeft;
				y = pos.top + (doc.documentElement.scrollTop || body.scrollTop) - doc.documentElement.clientTop;
				return {
					x: x,
					y: y
				};
			}
			offsetParent = elm;
			while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType && !hasChild(offsetParent, rootElm)) {
				x += offsetParent.offsetLeft || 0;
				y += offsetParent.offsetTop || 0;
				offsetParent = offsetParent.offsetParent;
			}
			offsetParent = elm.parentNode;
			while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType && !hasChild(offsetParent, rootElm)) {
				x -= offsetParent.scrollLeft || 0;
				y -= offsetParent.scrollTop || 0;
				offsetParent = offsetParent.parentNode;
			}
			y += getTableCaptionDeltaY(SugarElement.fromDom(elm));
		}
		return {
			x: x,
			y: y
		};
	};

	var exports$1 = {}, module$1 = { exports: exports$1 };
	(function (define, exports, module, require) {
		(function (f) {
			if (typeof exports === 'object' && typeof module !== 'undefined') {
				module.exports = f();
			} else if (typeof define === 'function' && define.amd) {
				define([], f);
			} else {
				var g;
				if (typeof window !== 'undefined') {
					g = window;
				} else if (typeof global !== 'undefined') {
					g = global;
				} else if (typeof self !== 'undefined') {
					g = self;
				} else {
					g = this;
				}
				g.EphoxContactWrapper = f();
			}
		}(function () {
			return function () {
				function r(e, n, t) {
					function o(i, f) {
						if (!n[i]) {
							if (!e[i]) {
								var c = 'function' == typeof require && require;
								if (!f && c)
									return c(i, !0);
								if (u)
									return u(i, !0);
								var a = new Error('Cannot find module \'' + i + '\'');
								throw a.code = 'MODULE_NOT_FOUND', a;
							}
							var p = n[i] = { exports: {} };
							e[i][0].call(p.exports, function (r) {
								var n = e[i][1][r];
								return o(n || r);
							}, p, p.exports, r, e, n, t);
						}
						return n[i].exports;
					}
					for (var u = 'function' == typeof require && require, i = 0; i < t.length; i++)
						o(t[i]);
					return o;
				}
				return r;
			}()({
				1: [
					function (require, module, exports) {
						var process = module.exports = {};
						var cachedSetTimeout;
						var cachedClearTimeout;
						function defaultSetTimout() {
							throw new Error('setTimeout has not been defined');
						}
						function defaultClearTimeout() {
							throw new Error('clearTimeout has not been defined');
						}
						(function () {
							try {
								if (typeof setTimeout === 'function') {
									cachedSetTimeout = setTimeout;
								} else {
									cachedSetTimeout = defaultSetTimout;
								}
							} catch (e) {
								cachedSetTimeout = defaultSetTimout;
							}
							try {
								if (typeof clearTimeout === 'function') {
									cachedClearTimeout = clearTimeout;
								} else {
									cachedClearTimeout = defaultClearTimeout;
								}
							} catch (e) {
								cachedClearTimeout = defaultClearTimeout;
							}
						}());
						function runTimeout(fun) {
							if (cachedSetTimeout === setTimeout) {
								return setTimeout(fun, 0);
							}
							if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
								cachedSetTimeout = setTimeout;
								return setTimeout(fun, 0);
							}
							try {
								return cachedSetTimeout(fun, 0);
							} catch (e) {
								try {
									return cachedSetTimeout.call(null, fun, 0);
								} catch (e) {
									return cachedSetTimeout.call(this, fun, 0);
								}
							}
						}
						function runClearTimeout(marker) {
							if (cachedClearTimeout === clearTimeout) {
								return clearTimeout(marker);
							}
							if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
								cachedClearTimeout = clearTimeout;
								return clearTimeout(marker);
							}
							try {
								return cachedClearTimeout(marker);
							} catch (e) {
								try {
									return cachedClearTimeout.call(null, marker);
								} catch (e) {
									return cachedClearTimeout.call(this, marker);
								}
							}
						}
						var queue = [];
						var draining = false;
						var currentQueue;
						var queueIndex = -1;
						function cleanUpNextTick() {
							if (!draining || !currentQueue) {
								return;
							}
							draining = false;
							if (currentQueue.length) {
								queue = currentQueue.concat(queue);
							} else {
								queueIndex = -1;
							}
							if (queue.length) {
								drainQueue();
							}
						}
						function drainQueue() {
							if (draining) {
								return;
							}
							var timeout = runTimeout(cleanUpNextTick);
							draining = true;
							var len = queue.length;
							while (len) {
								currentQueue = queue;
								queue = [];
								while (++queueIndex < len) {
									if (currentQueue) {
										currentQueue[queueIndex].run();
									}
								}
								queueIndex = -1;
								len = queue.length;
							}
							currentQueue = null;
							draining = false;
							runClearTimeout(timeout);
						}
						process.nextTick = function (fun) {
							var args = new Array(arguments.length - 1);
							if (arguments.length > 1) {
								for (var i = 1; i < arguments.length; i++) {
									args[i - 1] = arguments[i];
								}
							}
							queue.push(new Item(fun, args));
							if (queue.length === 1 && !draining) {
								runTimeout(drainQueue);
							}
						};
						function Item(fun, array) {
							this.fun = fun;
							this.array = array;
						}
						Item.prototype.run = function () {
							this.fun.apply(null, this.array);
						};
						process.title = 'browser';
						process.browser = true;
						process.env = {};
						process.argv = [];
						process.version = '';
						process.versions = {};
						function noop() {
						}
						process.on = noop;
						process.addListener = noop;
						process.once = noop;
						process.off = noop;
						process.removeListener = noop;
						process.removeAllListeners = noop;
						process.emit = noop;
						process.prependListener = noop;
						process.prependOnceListener = noop;
						process.listeners = function (name) {
							return [];
						};
						process.binding = function (name) {
							throw new Error('process.binding is not supported');
						};
						process.cwd = function () {
							return '/';
						};
						process.chdir = function (dir) {
							throw new Error('process.chdir is not supported');
						};
						process.umask = function () {
							return 0;
						};
					},
					{}
				],
				2: [
					function (require, module, exports) {
						(function (setImmediate) {
							(function (root) {
								var setTimeoutFunc = setTimeout;
								function noop() {
								}
								function bind(fn, thisArg) {
									return function () {
										fn.apply(thisArg, arguments);
									};
								}
								function Promise(fn) {
									if (typeof this !== 'object')
										throw new TypeError('Promises must be constructed via new');
									if (typeof fn !== 'function')
										throw new TypeError('not a function');
									this._state = 0;
									this._handled = false;
									this._value = undefined;
									this._deferreds = [];
									doResolve(fn, this);
								}
								function handle(self, deferred) {
									while (self._state === 3) {
										self = self._value;
									}
									if (self._state === 0) {
										self._deferreds.push(deferred);
										return;
									}
									self._handled = true;
									Promise._immediateFn(function () {
										var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
										if (cb === null) {
											(self._state === 1 ? resolve : reject)(deferred.promise, self._value);
											return;
										}
										var ret;
										try {
											ret = cb(self._value);
										} catch (e) {
											reject(deferred.promise, e);
											return;
										}
										resolve(deferred.promise, ret);
									});
								}
								function resolve(self, newValue) {
									try {
										if (newValue === self)
											throw new TypeError('A promise cannot be resolved with itself.');
										if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
											var then = newValue.then;
											if (newValue instanceof Promise) {
												self._state = 3;
												self._value = newValue;
												finale(self);
												return;
											} else if (typeof then === 'function') {
												doResolve(bind(then, newValue), self);
												return;
											}
										}
										self._state = 1;
										self._value = newValue;
										finale(self);
									} catch (e) {
										reject(self, e);
									}
								}
								function reject(self, newValue) {
									self._state = 2;
									self._value = newValue;
									finale(self);
								}
								function finale(self) {
									if (self._state === 2 && self._deferreds.length === 0) {
										Promise._immediateFn(function () {
											if (!self._handled) {
												Promise._unhandledRejectionFn(self._value);
											}
										});
									}
									for (var i = 0, len = self._deferreds.length; i < len; i++) {
										handle(self, self._deferreds[i]);
									}
									self._deferreds = null;
								}
								function Handler(onFulfilled, onRejected, promise) {
									this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
									this.onRejected = typeof onRejected === 'function' ? onRejected : null;
									this.promise = promise;
								}
								function doResolve(fn, self) {
									var done = false;
									try {
										fn(function (value) {
											if (done)
												return;
											done = true;
											resolve(self, value);
										}, function (reason) {
											if (done)
												return;
											done = true;
											reject(self, reason);
										});
									} catch (ex) {
										if (done)
											return;
										done = true;
										reject(self, ex);
									}
								}
								Promise.prototype['catch'] = function (onRejected) {
									return this.then(null, onRejected);
								};
								Promise.prototype.then = function (onFulfilled, onRejected) {
									var prom = new this.constructor(noop);
									handle(this, new Handler(onFulfilled, onRejected, prom));
									return prom;
								};
								Promise.all = function (arr) {
									var args = Array.prototype.slice.call(arr);
									return new Promise(function (resolve, reject) {
										if (args.length === 0)
											return resolve([]);
										var remaining = args.length;
										function res(i, val) {
											try {
												if (val && (typeof val === 'object' || typeof val === 'function')) {
													var then = val.then;
													if (typeof then === 'function') {
														then.call(val, function (val) {
															res(i, val);
														}, reject);
														return;
													}
												}
												args[i] = val;
												if (--remaining === 0) {
													resolve(args);
												}
											} catch (ex) {
												reject(ex);
											}
										}
										for (var i = 0; i < args.length; i++) {
											res(i, args[i]);
										}
									});
								};
								Promise.resolve = function (value) {
									if (value && typeof value === 'object' && value.constructor === Promise) {
										return value;
									}
									return new Promise(function (resolve) {
										resolve(value);
									});
								};
								Promise.reject = function (value) {
									return new Promise(function (resolve, reject) {
										reject(value);
									});
								};
								Promise.race = function (values) {
									return new Promise(function (resolve, reject) {
										for (var i = 0, len = values.length; i < len; i++) {
											values[i].then(resolve, reject);
										}
									});
								};
								Promise._immediateFn = typeof setImmediate === 'function' ? function (fn) {
									setImmediate(fn);
								} : function (fn) {
									setTimeoutFunc(fn, 0);
								};
								Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
									if (typeof console !== 'undefined' && console) {
										console.warn('Possible Unhandled Promise Rejection:', err);
									}
								};
								Promise._setImmediateFn = function _setImmediateFn(fn) {
									Promise._immediateFn = fn;
								};
								Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
									Promise._unhandledRejectionFn = fn;
								};
								if (typeof module !== 'undefined' && module.exports) {
									module.exports = Promise;
								} else if (!root.Promise) {
									root.Promise = Promise;
								}
							}(this));
						}.call(this, require('timers').setImmediate));
					},
					{ 'timers': 3 }
				],
				3: [
					function (require, module, exports) {
						(function (setImmediate, clearImmediate) {
							var nextTick = require('process/browser.js').nextTick;
							var apply = Function.prototype.apply;
							var slice = Array.prototype.slice;
							var immediateIds = {};
							var nextImmediateId = 0;
							exports.setTimeout = function () {
								return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
							};
							exports.setInterval = function () {
								return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
							};
							exports.clearTimeout = exports.clearInterval = function (timeout) {
								timeout.close();
							};
							function Timeout(id, clearFn) {
								this._id = id;
								this._clearFn = clearFn;
							}
							Timeout.prototype.unref = Timeout.prototype.ref = function () {
							};
							Timeout.prototype.close = function () {
								this._clearFn.call(window, this._id);
							};
							exports.enroll = function (item, msecs) {
								clearTimeout(item._idleTimeoutId);
								item._idleTimeout = msecs;
							};
							exports.unenroll = function (item) {
								clearTimeout(item._idleTimeoutId);
								item._idleTimeout = -1;
							};
							exports._unrefActive = exports.active = function (item) {
								clearTimeout(item._idleTimeoutId);
								var msecs = item._idleTimeout;
								if (msecs >= 0) {
									item._idleTimeoutId = setTimeout(function onTimeout() {
										if (item._onTimeout)
											item._onTimeout();
									}, msecs);
								}
							};
							exports.setImmediate = typeof setImmediate === 'function' ? setImmediate : function (fn) {
								var id = nextImmediateId++;
								var args = arguments.length < 2 ? false : slice.call(arguments, 1);
								immediateIds[id] = true;
								nextTick(function onNextTick() {
									if (immediateIds[id]) {
										if (args) {
											fn.apply(null, args);
										} else {
											fn.call(null);
										}
										exports.clearImmediate(id);
									}
								});
								return id;
							};
							exports.clearImmediate = typeof clearImmediate === 'function' ? clearImmediate : function (id) {
								delete immediateIds[id];
							};
						}.call(this, require('timers').setImmediate, require('timers').clearImmediate));
					},
					{
						'process/browser.js': 1,
						'timers': 3
					}
				],
				4: [
					function (require, module, exports) {
						var promisePolyfill = require('promise-polyfill');
						var Global = function () {
							if (typeof window !== 'undefined') {
								return window;
							} else {
								return Function('return this;')();
							}
						}();
						module.exports = { boltExport: Global.Promise || promisePolyfill };
					},
					{ 'promise-polyfill': 2 }
				]
			}, {}, [4])(4);
		}));
	}(undefined, exports$1, module$1, undefined));
	var Promise = module$1.exports.boltExport;

	var nu$3 = function (baseFn) {
		var data = Optional.none();
		var callbacks = [];
		var map = function (f) {
			return nu$3(function (nCallback) {
				get(function (data) {
					nCallback(f(data));
				});
			});
		};
		var get = function (nCallback) {
			if (isReady()) {
				call(nCallback);
			} else {
				callbacks.push(nCallback);
			}
		};
		var set = function (x) {
			if (!isReady()) {
				data = Optional.some(x);
				run(callbacks);
				callbacks = [];
			}
		};
		var isReady = function () {
			return data.isSome();
		};
		var run = function (cbs) {
			each(cbs, call);
		};
		var call = function (cb) {
			data.each(function (x) {
				setTimeout(function () {
					cb(x);
				}, 0);
			});
		};
		baseFn(set);
		return {
			get: get,
			map: map,
			isReady: isReady
		};
	};
	var pure = function (a) {
		return nu$3(function (callback) {
			callback(a);
		});
	};
	var LazyValue = {
		nu: nu$3,
		pure: pure
	};

	var errorReporter = function (err) {
		setTimeout(function () {
			throw err;
		}, 0);
	};
	var make = function (run) {
		var get = function (callback) {
			run().then(callback, errorReporter);
		};
		var map = function (fab) {
			return make(function () {
				return run().then(fab);
			});
		};
		var bind = function (aFutureB) {
			return make(function () {
				return run().then(function (v) {
					return aFutureB(v).toPromise();
				});
			});
		};
		var anonBind = function (futureB) {
			return make(function () {
				return run().then(function () {
					return futureB.toPromise();
				});
			});
		};
		var toLazy = function () {
			return LazyValue.nu(get);
		};
		var toCached = function () {
			var cache = null;
			return make(function () {
				if (cache === null) {
					cache = run();
				}
				return cache;
			});
		};
		var toPromise = run;
		return {
			map: map,
			bind: bind,
			anonBind: anonBind,
			toLazy: toLazy,
			toCached: toCached,
			toPromise: toPromise,
			get: get
		};
	};
	var nu$4 = function (baseFn) {
		return make(function () {
			return new Promise(baseFn);
		});
	};
	var pure$1 = function (a) {
		return make(function () {
			return Promise.resolve(a);
		});
	};
	var Future = {
		nu: nu$4,
		pure: pure$1
	};

	var par = function (asyncValues, nu) {
		return nu(function (callback) {
			var r = [];
			var count = 0;
			var cb = function (i) {
				return function (value) {
					r[i] = value;
					count++;
					if (count >= asyncValues.length) {
						callback(r);
					}
				};
			};
			if (asyncValues.length === 0) {
				callback([]);
			} else {
				each(asyncValues, function (asyncValue, i) {
					asyncValue.get(cb(i));
				});
			}
		});
	};

	var par$1 = function (futures) {
		return par(futures, Future.nu);
	};

	var value = function (o) {
		var is = function (v) {
			return o === v;
		};
		var or = function (_opt) {
			return value(o);
		};
		var orThunk = function (_f) {
			return value(o);
		};
		var map = function (f) {
			return value(f(o));
		};
		var mapError = function (_f) {
			return value(o);
		};
		var each = function (f) {
			f(o);
		};
		var bind = function (f) {
			return f(o);
		};
		var fold = function (_, onValue) {
			return onValue(o);
		};
		var exists = function (f) {
			return f(o);
		};
		var forall = function (f) {
			return f(o);
		};
		var toOptional = function () {
			return Optional.some(o);
		};
		return {
			is: is,
			isValue: always,
			isError: never,
			getOr: constant(o),
			getOrThunk: constant(o),
			getOrDie: constant(o),
			or: or,
			orThunk: orThunk,
			fold: fold,
			map: map,
			mapError: mapError,
			each: each,
			bind: bind,
			exists: exists,
			forall: forall,
			toOptional: toOptional
		};
	};
	var error = function (message) {
		var getOrThunk = function (f) {
			return f();
		};
		var getOrDie = function () {
			return die(String(message))();
		};
		var or = function (opt) {
			return opt;
		};
		var orThunk = function (f) {
			return f();
		};
		var map = function (_f) {
			return error(message);
		};
		var mapError = function (f) {
			return error(f(message));
		};
		var bind = function (_f) {
			return error(message);
		};
		var fold = function (onError, _) {
			return onError(message);
		};
		return {
			is: never,
			isValue: never,
			isError: always,
			getOr: identity,
			getOrThunk: getOrThunk,
			getOrDie: getOrDie,
			or: or,
			orThunk: orThunk,
			fold: fold,
			map: map,
			mapError: mapError,
			each: noop,
			bind: bind,
			exists: never,
			forall: always,
			toOptional: Optional.none
		};
	};
	var fromOption = function (opt, err) {
		return opt.fold(function () {
			return error(err);
		}, value);
	};
	var Result = {
		value: value,
		error: error,
		fromOption: fromOption
	};

	var generate = function (cases) {
		if (!isArray(cases)) {
			throw new Error('cases must be an array');
		}
		if (cases.length === 0) {
			throw new Error('there must be at least one case');
		}
		var constructors = [];
		var adt = {};
		each(cases, function (acase, count) {
			var keys$1 = keys(acase);
			if (keys$1.length !== 1) {
				throw new Error('one and only one name per case');
			}
			var key = keys$1[0];
			var value = acase[key];
			if (adt[key] !== undefined) {
				throw new Error('duplicate key detected:' + key);
			} else if (key === 'cata') {
				throw new Error('cannot have a case named cata (sorry)');
			} else if (!isArray(value)) {
				throw new Error('case arguments must be an array');
			}
			constructors.push(key);
			adt[key] = function () {
				var argLength = arguments.length;
				if (argLength !== value.length) {
					throw new Error('Wrong number of arguments to case ' + key + '. Expected ' + value.length + ' (' + value + '), got ' + argLength);
				}
				var args = new Array(argLength);
				for (var i = 0; i < args.length; i++) {
					args[i] = arguments[i];
				}
				var match = function (branches) {
					var branchKeys = keys(branches);
					if (constructors.length !== branchKeys.length) {
						throw new Error('Wrong number of arguments to match. Expected: ' + constructors.join(',') + '\nActual: ' + branchKeys.join(','));
					}
					var allReqd = forall(constructors, function (reqKey) {
						return contains(branchKeys, reqKey);
					});
					if (!allReqd) {
						throw new Error('Not all branches were specified when using match. Specified: ' + branchKeys.join(', ') + '\nRequired: ' + constructors.join(', '));
					}
					return branches[key].apply(null, args);
				};
				return {
					fold: function () {
						if (arguments.length !== cases.length) {
							throw new Error('Wrong number of arguments to fold. Expected ' + cases.length + ', got ' + arguments.length);
						}
						var target = arguments[count];
						return target.apply(null, args);
					},
					match: match,
					log: function (label) {
						console.log(label, {
							constructors: constructors,
							constructor: key,
							params: args
						});
					}
				};
			};
		});
		return adt;
	};
	var Adt = { generate: generate };

	var comparison = Adt.generate([
		{
			bothErrors: [
				'error1',
				'error2'
			]
		},
		{
			firstError: [
				'error1',
				'value2'
			]
		},
		{
			secondError: [
				'value1',
				'error2'
			]
		},
		{
			bothValues: [
				'value1',
				'value2'
			]
		}
	]);
	var unite = function (result) {
		return result.fold(identity, identity);
	};

	function ClosestOrAncestor(is, ancestor, scope, a, isRoot) {
		if (is(scope, a)) {
			return Optional.some(scope);
		} else if (isFunction(isRoot) && isRoot(scope)) {
			return Optional.none();
		} else {
			return ancestor(scope, a, isRoot);
		}
	}

	var ancestor = function (scope, predicate, isRoot) {
		var element = scope.dom;
		var stop = isFunction(isRoot) ? isRoot : never;
		while (element.parentNode) {
			element = element.parentNode;
			var el = SugarElement.fromDom(element);
			if (predicate(el)) {
				return Optional.some(el);
			} else if (stop(el)) {
				break;
			}
		}
		return Optional.none();
	};
	var closest = function (scope, predicate, isRoot) {
		var is = function (s, test) {
			return test(s);
		};
		return ClosestOrAncestor(is, ancestor, scope, predicate, isRoot);
	};
	var sibling = function (scope, predicate) {
		var element = scope.dom;
		if (!element.parentNode) {
			return Optional.none();
		}
		return child$1(SugarElement.fromDom(element.parentNode), function (x) {
			return !eq$2(scope, x) && predicate(x);
		});
	};
	var child$1 = function (scope, predicate) {
		var pred = function (node) {
			return predicate(SugarElement.fromDom(node));
		};
		var result = find(scope.dom.childNodes, pred);
		return result.map(SugarElement.fromDom);
	};

	var ancestor$1 = function (scope, selector, isRoot) {
		return ancestor(scope, function (e) {
			return is$1(e, selector);
		}, isRoot);
	};
	var descendant = function (scope, selector) {
		return one(selector, scope);
	};
	var closest$1 = function (scope, selector, isRoot) {
		var is = function (element, selector) {
			return is$1(element, selector);
		};
		return ClosestOrAncestor(is, ancestor$1, scope, selector, isRoot);
	};

	var promise = function () {
		function bind(fn, thisArg) {
			return function () {
				fn.apply(thisArg, arguments);
			};
		}
		var isArray = Array.isArray || function (value) {
			return Object.prototype.toString.call(value) === '[object Array]';
		};
		var Promise = function (fn) {
			if (typeof this !== 'object') {
				throw new TypeError('Promises must be constructed via new');
			}
			if (typeof fn !== 'function') {
				throw new TypeError('not a function');
			}
			this._state = null;
			this._value = null;
			this._deferreds = [];
			doResolve(fn, bind(resolve, this), bind(reject, this));
		};
		var asap = Promise.immediateFn || typeof setImmediate === 'function' && setImmediate || function (fn) {
			setTimeout(fn, 1);
		};
		function handle(deferred) {
			var me = this;
			if (this._state === null) {
				this._deferreds.push(deferred);
				return;
			}
			asap(function () {
				var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
				if (cb === null) {
					(me._state ? deferred.resolve : deferred.reject)(me._value);
					return;
				}
				var ret;
				try {
					ret = cb(me._value);
				} catch (e) {
					deferred.reject(e);
					return;
				}
				deferred.resolve(ret);
			});
		}
		function resolve(newValue) {
			try {
				if (newValue === this) {
					throw new TypeError('A promise cannot be resolved with itself.');
				}
				if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
					var then = newValue.then;
					if (typeof then === 'function') {
						doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
						return;
					}
				}
				this._state = true;
				this._value = newValue;
				finale.call(this);
			} catch (e) {
				reject.call(this, e);
			}
		}
		function reject(newValue) {
			this._state = false;
			this._value = newValue;
			finale.call(this);
		}
		function finale() {
			for (var i = 0, len = this._deferreds.length; i < len; i++) {
				handle.call(this, this._deferreds[i]);
			}
			this._deferreds = null;
		}
		function Handler(onFulfilled, onRejected, resolve, reject) {
			this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
			this.onRejected = typeof onRejected === 'function' ? onRejected : null;
			this.resolve = resolve;
			this.reject = reject;
		}
		function doResolve(fn, onFulfilled, onRejected) {
			var done = false;
			try {
				fn(function (value) {
					if (done) {
						return;
					}
					done = true;
					onFulfilled(value);
				}, function (reason) {
					if (done) {
						return;
					}
					done = true;
					onRejected(reason);
				});
			} catch (ex) {
				if (done) {
					return;
				}
				done = true;
				onRejected(ex);
			}
		}
		Promise.prototype.catch = function (onRejected) {
			return this.then(null, onRejected);
		};
		Promise.prototype.then = function (onFulfilled, onRejected) {
			var me = this;
			return new Promise(function (resolve, reject) {
				handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
			});
		};
		Promise.all = function () {
			var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);
			return new Promise(function (resolve, reject) {
				if (args.length === 0) {
					return resolve([]);
				}
				var remaining = args.length;
				function res(i, val) {
					try {
						if (val && (typeof val === 'object' || typeof val === 'function')) {
							var then = val.then;
							if (typeof then === 'function') {
								then.call(val, function (val) {
									res(i, val);
								}, reject);
								return;
							}
						}
						args[i] = val;
						if (--remaining === 0) {
							resolve(args);
						}
					} catch (ex) {
						reject(ex);
					}
				}
				for (var i = 0; i < args.length; i++) {
					res(i, args[i]);
				}
			});
		};
		Promise.resolve = function (value) {
			if (value && typeof value === 'object' && value.constructor === Promise) {
				return value;
			}
			return new Promise(function (resolve) {
				resolve(value);
			});
		};
		Promise.reject = function (value) {
			return new Promise(function (resolve, reject) {
				reject(value);
			});
		};
		Promise.race = function (values) {
			return new Promise(function (resolve, reject) {
				for (var i = 0, len = values.length; i < len; i++) {
					values[i].then(resolve, reject);
				}
			});
		};
		return Promise;
	};
	var promiseObj = window.Promise ? window.Promise : promise();

	var requestAnimationFramePromise;
	var requestAnimationFrame = function (callback, element) {
		var i, requestAnimationFrameFunc = window.requestAnimationFrame;
		var vendors = [
			'ms',
			'moz',
			'webkit'
		];
		var featurefill = function (callback) {
			window.setTimeout(callback, 0);
		};
		for (i = 0; i < vendors.length && !requestAnimationFrameFunc; i++) {
			requestAnimationFrameFunc = window[vendors[i] + 'RequestAnimationFrame'];
		}
		if (!requestAnimationFrameFunc) {
			requestAnimationFrameFunc = featurefill;
		}
		requestAnimationFrameFunc(callback, element);
	};
	var wrappedSetTimeout = function (callback, time) {
		if (typeof time !== 'number') {
			time = 0;
		}
		return setTimeout(callback, time);
	};
	var wrappedSetInterval = function (callback, time) {
		if (typeof time !== 'number') {
			time = 1;
		}
		return setInterval(callback, time);
	};
	var wrappedClearTimeout = function (id) {
		return clearTimeout(id);
	};
	var wrappedClearInterval = function (id) {
		return clearInterval(id);
	};
	var debounce = function (callback, time) {
		var timer;
		var func = function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			clearTimeout(timer);
			timer = wrappedSetTimeout(function () {
				callback.apply(this, args);
			}, time);
		};
		func.stop = function () {
			clearTimeout(timer);
		};
		return func;
	};
	var Delay = {
		requestAnimationFrame: function (callback, element) {
			if (requestAnimationFramePromise) {
				requestAnimationFramePromise.then(callback);
				return;
			}
			requestAnimationFramePromise = new promiseObj(function (resolve) {
				if (!element) {
					element = document.body;
				}
				requestAnimationFrame(resolve, element);
			}).then(callback);
		},
		setTimeout: wrappedSetTimeout,
		setInterval: wrappedSetInterval,
		setEditorTimeout: function (editor, callback, time) {
			return wrappedSetTimeout(function () {
				if (!editor.removed) {
					callback();
				}
			}, time);
		},
		setEditorInterval: function (editor, callback, time) {
			var timer = wrappedSetInterval(function () {
				if (!editor.removed) {
					callback();
				} else {
					clearInterval(timer);
				}
			}, time);
			return timer;
		},
		debounce: debounce,
		throttle: debounce,
		clearInterval: wrappedClearInterval,
		clearTimeout: wrappedClearTimeout
	};

	function StyleSheetLoader(documentOrShadowRoot, settings) {
		if (settings === void 0) {
			settings = {};
		}
		var idCount = 0;
		var loadedStates = {};
		var edos = SugarElement.fromDom(documentOrShadowRoot);
		var doc = documentOrOwner(edos);
		var maxLoadTime = settings.maxLoadTime || 5000;
		var _setReferrerPolicy = function (referrerPolicy) {
			settings.referrerPolicy = referrerPolicy;
		};
		var addStyle = function (element) {
			append(getStyleContainer(edos), element);
		};
		var removeStyle = function (id) {
			var styleContainer = getStyleContainer(edos);
			descendant(styleContainer, '#' + id).each(remove);
		};
		var getOrCreateState = function (url) {
			return get$1(loadedStates, url).getOrThunk(function () {
				return {
					id: 'mce-u' + idCount++,
					passed: [],
					failed: [],
					count: 0
				};
			});
		};
		var load = function (url, success, failure) {
			var link;
			var urlWithSuffix = Tools._addCacheSuffix(url);
			var state = getOrCreateState(urlWithSuffix);
			loadedStates[urlWithSuffix] = state;
			state.count++;
			var resolve = function (callbacks, status) {
				var i = callbacks.length;
				while (i--) {
					callbacks[i]();
				}
				state.status = status;
				state.passed = [];
				state.failed = [];
				if (link) {
					link.onload = null;
					link.onerror = null;
					link = null;
				}
			};
			var passed = function () {
				return resolve(state.passed, 2);
			};
			var failed = function () {
				return resolve(state.failed, 3);
			};
			var wait = function (testCallback, waitCallback) {
				if (!testCallback()) {
					if (Date.now() - startTime < maxLoadTime) {
						Delay.setTimeout(waitCallback);
					} else {
						failed();
					}
				}
			};
			var waitForWebKitLinkLoaded = function () {
				wait(function () {
					var styleSheets = documentOrShadowRoot.styleSheets;
					var i = styleSheets.length;
					while (i--) {
						var styleSheet = styleSheets[i];
						var owner = styleSheet.ownerNode;
						if (owner && owner.id === link.id) {
							passed();
							return true;
						}
					}
					return false;
				}, waitForWebKitLinkLoaded);
			};
			if (success) {
				state.passed.push(success);
			}
			if (failure) {
				state.failed.push(failure);
			}
			if (state.status === 1) {
				return;
			}
			if (state.status === 2) {
				passed();
				return;
			}
			if (state.status === 3) {
				failed();
				return;
			}
			state.status = 1;
			var linkElem = SugarElement.fromTag('link', doc.dom);
			setAll(linkElem, {
				rel: 'stylesheet',
				type: 'text/css',
				id: state.id
			});
			var startTime = Date.now();
			if (settings.contentCssCors) {
				set(linkElem, 'crossOrigin', 'anonymous');
			}
			if (settings.referrerPolicy) {
				set(linkElem, 'referrerpolicy', settings.referrerPolicy);
			}
			link = linkElem.dom;
			link.onload = waitForWebKitLinkLoaded;
			link.onerror = failed;
			addStyle(linkElem);
			set(linkElem, 'href', urlWithSuffix);
		};
		var loadF = function (url) {
			return Future.nu(function (resolve) {
				load(url, compose(resolve, constant(Result.value(url))), compose(resolve, constant(Result.error(url))));
			});
		};
		var loadAll = function (urls, success, failure) {
			par$1(map(urls, loadF)).get(function (result) {
				var parts = partition(result, function (r) {
					return r.isValue();
				});
				if (parts.fail.length > 0) {
					failure(parts.fail.map(unite));
				} else {
					success(parts.pass.map(unite));
				}
			});
		};
		var unload = function (url) {
			var urlWithSuffix = Tools._addCacheSuffix(url);
			get$1(loadedStates, urlWithSuffix).each(function (state) {
				var count = --state.count;
				if (count === 0) {
					delete loadedStates[urlWithSuffix];
					removeStyle(state.id);
				}
			});
		};
		var unloadAll = function (urls) {
			each(urls, function (url) {
				unload(url);
			});
		};
		return {
			load: load,
			loadAll: loadAll,
			unload: unload,
			unloadAll: unloadAll,
			_setReferrerPolicy: _setReferrerPolicy
		};
	}

	var create$1 = function () {
		var map = new WeakMap();
		var forElement = function (referenceElement, settings) {
			var root = getRootNode(referenceElement);
			var rootDom = root.dom;
			return Optional.from(map.get(rootDom)).getOrThunk(function () {
				var sl = StyleSheetLoader(rootDom, settings);
				map.set(rootDom, sl);
				return sl;
			});
		};
		return { forElement: forElement };
	};
	var instance = create$1();

	var DomTreeWalker = function () {
		function DomTreeWalker(startNode, rootNode) {
			this.node = startNode;
			this.rootNode = rootNode;
			this.current = this.current.bind(this);
			this.next = this.next.bind(this);
			this.prev = this.prev.bind(this);
			this.prev2 = this.prev2.bind(this);
		}
		DomTreeWalker.prototype.current = function () {
			return this.node;
		};
		DomTreeWalker.prototype.next = function (shallow) {
			this.node = this.findSibling(this.node, 'firstChild', 'nextSibling', shallow);
			return this.node;
		};
		DomTreeWalker.prototype.prev = function (shallow) {
			this.node = this.findSibling(this.node, 'lastChild', 'previousSibling', shallow);
			return this.node;
		};
		DomTreeWalker.prototype.prev2 = function (shallow) {
			this.node = this.findPreviousNode(this.node, 'lastChild', 'previousSibling', shallow);
			return this.node;
		};
		DomTreeWalker.prototype.findSibling = function (node, startName, siblingName, shallow) {
			var sibling, parent;
			if (node) {
				if (!shallow && node[startName]) {
					return node[startName];
				}
				if (node !== this.rootNode) {
					sibling = node[siblingName];
					if (sibling) {
						return sibling;
					}
					for (parent = node.parentNode; parent && parent !== this.rootNode; parent = parent.parentNode) {
						sibling = parent[siblingName];
						if (sibling) {
							return sibling;
						}
					}
				}
			}
		};
		DomTreeWalker.prototype.findPreviousNode = function (node, startName, siblingName, shallow) {
			var sibling, parent, child;
			if (node) {
				sibling = node[siblingName];
				if (this.rootNode && sibling === this.rootNode) {
					return;
				}
				if (sibling) {
					if (!shallow) {
						for (child = sibling[startName]; child; child = child[startName]) {
							if (!child[startName]) {
								return child;
							}
						}
					}
					return sibling;
				}
				parent = node.parentNode;
				if (parent && parent !== this.rootNode) {
					return parent;
				}
			}
		};
		return DomTreeWalker;
	}();

	var blocks = [
		'article',
		'aside',
		'details',
		'div',
		'dt',
		'figcaption',
		'footer',
		'form',
		'fieldset',
		'header',
		'hgroup',
		'html',
		'main',
		'nav',
		'section',
		'summary',
		'body',
		'p',
		'dl',
		'multicol',
		'dd',
		'figure',
		'address',
		'center',
		'blockquote',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'listing',
		'xmp',
		'pre',
		'plaintext',
		'menu',
		'dir',
		'ul',
		'ol',
		'li',
		'hr',
		'table',
		'tbody',
		'thead',
		'tfoot',
		'th',
		'tr',
		'td',
		'caption'
	];
	var tableCells = [
		'td',
		'th'
	];
	var tableSections = [
		'thead',
		'tbody',
		'tfoot'
	];
	var textBlocks = [
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'p',
		'div',
		'address',
		'pre',
		'form',
		'blockquote',
		'center',
		'dir',
		'fieldset',
		'header',
		'footer',
		'article',
		'section',
		'hgroup',
		'aside',
		'nav',
		'figure'
	];
	var headings = [
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6'
	];
	var listItems = [
		'li',
		'dd',
		'dt'
	];
	var lists = [
		'ul',
		'ol',
		'dl'
	];
	var wsElements = [
		'pre',
		'script',
		'textarea',
		'style'
	];
	var lazyLookup = function (items) {
		var lookup;
		return function (node) {
			lookup = lookup ? lookup : mapToObject(items, always);
			return lookup.hasOwnProperty(name(node));
		};
	};
	var isHeading = lazyLookup(headings);
	var isBlock = lazyLookup(blocks);
	var isTable$1 = function (node) {
		return name(node) === 'table';
	};
	var isInline = function (node) {
		return isElement(node) && !isBlock(node);
	};
	var isBr$1 = function (node) {
		return isElement(node) && name(node) === 'br';
	};
	var isTextBlock = lazyLookup(textBlocks);
	var isList = lazyLookup(lists);
	var isListItem = lazyLookup(listItems);
	var isTableSection = lazyLookup(tableSections);
	var isTableCell$1 = lazyLookup(tableCells);
	var isWsPreserveElement = lazyLookup(wsElements);

	var ancestor$2 = function (scope, selector, isRoot) {
		return ancestor$1(scope, selector, isRoot).isSome();
	};

	var zeroWidth = '\uFEFF';
	var nbsp = '\xA0';
	var isZwsp = function (char) {
		return char === zeroWidth;
	};
	var removeZwsp = function (s) {
		return s.replace(/\uFEFF/g, '');
	};

	var ZWSP = zeroWidth;
	var isZwsp$1 = isZwsp;
	var trim$2 = removeZwsp;

	var isElement$2 = isElement$1;
	var isText$2 = isText$1;
	var isCaretContainerBlock = function (node) {
		if (isText$2(node)) {
			node = node.parentNode;
		}
		return isElement$2(node) && node.hasAttribute('data-mce-caret');
	};
	var isCaretContainerInline = function (node) {
		return isText$2(node) && isZwsp$1(node.data);
	};
	var isCaretContainer = function (node) {
		return isCaretContainerBlock(node) || isCaretContainerInline(node);
	};
	var hasContent = function (node) {
		return node.firstChild !== node.lastChild || !isBr(node.firstChild);
	};
	var insertInline = function (node, before) {
		var sibling;
		var doc = node.ownerDocument;
		var textNode = doc.createTextNode(ZWSP);
		var parentNode = node.parentNode;
		if (!before) {
			sibling = node.nextSibling;
			if (isText$2(sibling)) {
				if (isCaretContainer(sibling)) {
					return sibling;
				}
				if (startsWithCaretContainer(sibling)) {
					sibling.splitText(1);
					return sibling;
				}
			}
			if (node.nextSibling) {
				parentNode.insertBefore(textNode, node.nextSibling);
			} else {
				parentNode.appendChild(textNode);
			}
		} else {
			sibling = node.previousSibling;
			if (isText$2(sibling)) {
				if (isCaretContainer(sibling)) {
					return sibling;
				}
				if (endsWithCaretContainer(sibling)) {
					return sibling.splitText(sibling.data.length - 1);
				}
			}
			parentNode.insertBefore(textNode, node);
		}
		return textNode;
	};
	var isBeforeInline = function (pos) {
		var container = pos.container();
		if (!isText$1(container)) {
			return false;
		}
		return container.data.charAt(pos.offset()) === ZWSP || pos.isAtStart() && isCaretContainerInline(container.previousSibling);
	};
	var isAfterInline = function (pos) {
		var container = pos.container();
		if (!isText$1(container)) {
			return false;
		}
		return container.data.charAt(pos.offset() - 1) === ZWSP || pos.isAtEnd() && isCaretContainerInline(container.nextSibling);
	};
	var createBogusBr = function () {
		var br = document.createElement('br');
		br.setAttribute('data-mce-bogus', '1');
		return br;
	};
	var insertBlock = function (blockName, node, before) {
		var doc = node.ownerDocument;
		var blockNode = doc.createElement(blockName);
		blockNode.setAttribute('data-mce-caret', before ? 'before' : 'after');
		blockNode.setAttribute('data-mce-bogus', 'all');
		blockNode.appendChild(createBogusBr());
		var parentNode = node.parentNode;
		if (!before) {
			if (node.nextSibling) {
				parentNode.insertBefore(blockNode, node.nextSibling);
			} else {
				parentNode.appendChild(blockNode);
			}
		} else {
			parentNode.insertBefore(blockNode, node);
		}
		return blockNode;
	};
	var startsWithCaretContainer = function (node) {
		return isText$2(node) && node.data[0] === ZWSP;
	};
	var endsWithCaretContainer = function (node) {
		return isText$2(node) && node.data[node.data.length - 1] === ZWSP;
	};
	var trimBogusBr = function (elm) {
		var brs = elm.getElementsByTagName('br');
		var lastBr = brs[brs.length - 1];
		if (isBogus(lastBr)) {
			lastBr.parentNode.removeChild(lastBr);
		}
	};
	var showCaretContainerBlock = function (caretContainer) {
		if (caretContainer && caretContainer.hasAttribute('data-mce-caret')) {
			trimBogusBr(caretContainer);
			caretContainer.removeAttribute('data-mce-caret');
			caretContainer.removeAttribute('data-mce-bogus');
			caretContainer.removeAttribute('style');
			caretContainer.removeAttribute('_moz_abspos');
			return caretContainer;
		}
		return null;
	};
	var isRangeInCaretContainerBlock = function (range) {
		return isCaretContainerBlock(range.startContainer);
	};

	var isContentEditableTrue$1 = isContentEditableTrue;
	var isContentEditableFalse$1 = isContentEditableFalse;
	var isBr$2 = isBr;
	var isText$3 = isText$1;
	var isInvalidTextElement = matchNodeNames([
		'script',
		'style',
		'textarea'
	]);
	var isAtomicInline = matchNodeNames([
		'img',
		'input',
		'textarea',
		'hr',
		'iframe',
		'video',
		'audio',
		'object',
		'embed'
	]);
	var isTable$2 = matchNodeNames(['table']);
	var isCaretContainer$1 = isCaretContainer;
	var isCaretCandidate = function (node) {
		if (isCaretContainer$1(node)) {
			return false;
		}
		if (isText$3(node)) {
			return !isInvalidTextElement(node.parentNode);
		}
		return isAtomicInline(node) || isBr$2(node) || isTable$2(node) || isNonUiContentEditableFalse(node);
	};
	var isUnselectable = function (node) {
		return isElement$1(node) && node.getAttribute('unselectable') === 'true';
	};
	var isNonUiContentEditableFalse = function (node) {
		return isUnselectable(node) === false && isContentEditableFalse$1(node);
	};
	var isInEditable = function (node, root) {
		for (node = node.parentNode; node && node !== root; node = node.parentNode) {
			if (isNonUiContentEditableFalse(node)) {
				return false;
			}
			if (isContentEditableTrue$1(node)) {
				return true;
			}
		}
		return true;
	};
	var isAtomicContentEditableFalse = function (node) {
		if (!isNonUiContentEditableFalse(node)) {
			return false;
		}
		return foldl(from$1(node.getElementsByTagName('*')), function (result, elm) {
			return result || isContentEditableTrue$1(elm);
		}, false) !== true;
	};
	var isAtomic = function (node) {
		return isAtomicInline(node) || isAtomicContentEditableFalse(node);
	};
	var isEditableCaretCandidate = function (node, root) {
		return isCaretCandidate(node) && isInEditable(node, root);
	};

	var whiteSpaceRegExp$1 = /^[ \t\r\n]*$/;
	var isWhitespaceText = function (text) {
		return whiteSpaceRegExp$1.test(text);
	};

	var hasWhitespacePreserveParent = function (node, rootNode) {
		var rootElement = SugarElement.fromDom(rootNode);
		var startNode = SugarElement.fromDom(node);
		return ancestor$2(startNode, 'pre,code', curry(eq$2, rootElement));
	};
	var isWhitespace = function (node, rootNode) {
		return isText$1(node) && isWhitespaceText(node.data) && hasWhitespacePreserveParent(node, rootNode) === false;
	};
	var isNamedAnchor = function (node) {
		return isElement$1(node) && node.nodeName === 'A' && !node.hasAttribute('href') && (node.hasAttribute('name') || node.hasAttribute('id'));
	};
	var isContent = function (node, rootNode) {
		return isCaretCandidate(node) && isWhitespace(node, rootNode) === false || isNamedAnchor(node) || isBookmark(node);
	};
	var isBookmark = hasAttribute('data-mce-bookmark');
	var isBogus$1 = hasAttribute('data-mce-bogus');
	var isBogusAll$1 = hasAttributeValue('data-mce-bogus', 'all');
	var isEmptyNode = function (targetNode, skipBogus) {
		var node, brCount = 0;
		if (isContent(targetNode, targetNode)) {
			return false;
		} else {
			node = targetNode.firstChild;
			if (!node) {
				return true;
			}
			var walker = new DomTreeWalker(node, targetNode);
			do {
				if (skipBogus) {
					if (isBogusAll$1(node)) {
						node = walker.next(true);
						continue;
					}
					if (isBogus$1(node)) {
						node = walker.next();
						continue;
					}
				}
				if (isBr(node)) {
					brCount++;
					node = walker.next();
					continue;
				}
				if (isContent(node, targetNode)) {
					return false;
				}
				node = walker.next();
			} while (node);
			return brCount <= 1;
		}
	};
	var isEmpty = function (elm, skipBogus) {
		if (skipBogus === void 0) {
			skipBogus = true;
		}
		return isEmptyNode(elm.dom, skipBogus);
	};

	var isSpan = function (node) {
		return node.nodeName.toLowerCase() === 'span';
	};
	var isInlineContent = function (node, root) {
		return isNonNullable(node) && (isContent(node, root) || isInline(SugarElement.fromDom(node)));
	};
	var surroundedByInlineContent = function (node, root) {
		var prev = new DomTreeWalker(node, root).prev(false);
		var next = new DomTreeWalker(node, root).next(false);
		var prevIsInline = isUndefined(prev) || isInlineContent(prev, root);
		var nextIsInline = isUndefined(next) || isInlineContent(next, root);
		return prevIsInline && nextIsInline;
	};
	var isBookmarkNode = function (node) {
		return isSpan(node) && node.getAttribute('data-mce-type') === 'bookmark';
	};
	var isKeepTextNode = function (node, root) {
		return isText$1(node) && node.data.length > 0 && surroundedByInlineContent(node, root);
	};
	var isKeepElement = function (node) {
		return isElement$1(node) ? node.childNodes.length > 0 : false;
	};
	var isDocument$2 = function (node) {
		return isDocumentFragment$1(node) || isDocument$1(node);
	};
	var trimNode = function (dom, node, root) {
		var rootNode = root || node;
		if (isElement$1(node) && isBookmarkNode(node)) {
			return node;
		}
		var children = node.childNodes;
		for (var i = children.length - 1; i >= 0; i--) {
			trimNode(dom, children[i], rootNode);
		}
		if (isElement$1(node)) {
			var currentChildren = node.childNodes;
			if (currentChildren.length === 1 && isBookmarkNode(currentChildren[0])) {
				node.parentNode.insertBefore(currentChildren[0], node);
			}
		}
		if (!isDocument$2(node) && !isContent(node, rootNode) && !isKeepElement(node) && !isKeepTextNode(node, rootNode)) {
			dom.remove(node);
		}
		return node;
	};

	var makeMap$1 = Tools.makeMap;
	var attrsCharsRegExp = /[&<>\"\u0060\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	var textCharsRegExp = /[<>&\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	var rawCharsRegExp = /[<>&\"\']/g;
	var entityRegExp = /&#([a-z0-9]+);?|&([a-z0-9]+);/gi;
	var asciiMap = {
		128: '\u20AC',
		130: '\u201A',
		131: '\u0192',
		132: '\u201E',
		133: '\u2026',
		134: '\u2020',
		135: '\u2021',
		136: '\u02c6',
		137: '\u2030',
		138: '\u0160',
		139: '\u2039',
		140: '\u0152',
		142: '\u017d',
		145: '\u2018',
		146: '\u2019',
		147: '\u201C',
		148: '\u201D',
		149: '\u2022',
		150: '\u2013',
		151: '\u2014',
		152: '\u02DC',
		153: '\u2122',
		154: '\u0161',
		155: '\u203A',
		156: '\u0153',
		158: '\u017e',
		159: '\u0178'
	};
	var baseEntities = {
		'"': '&quot;',
		'\'': '&#39;',
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
		'`': '&#96;'
	};
	var reverseEntities = {
		'&lt;': '<',
		'&gt;': '>',
		'&amp;': '&',
		'&quot;': '"',
		'&apos;': '\''
	};
	var nativeDecode = function (text) {
		var elm = SugarElement.fromTag('div').dom;
		elm.innerHTML = text;
		return elm.textContent || elm.innerText || text;
	};
	var buildEntitiesLookup = function (items, radix) {
		var i, chr, entity;
		var lookup = {};
		if (items) {
			items = items.split(',');
			radix = radix || 10;
			for (i = 0; i < items.length; i += 2) {
				chr = String.fromCharCode(parseInt(items[i], radix));
				if (!baseEntities[chr]) {
					entity = '&' + items[i + 1] + ';';
					lookup[chr] = entity;
					lookup[entity] = chr;
				}
			}
			return lookup;
		}
	};
	var namedEntities = buildEntitiesLookup('50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,' + '5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,' + '5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,' + '5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,' + '68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,' + '6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,' + '6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,' + '75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,' + '7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,' + '7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,' + 'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,' + 'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,' + 't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,' + 'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,' + 'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,' + '81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,' + '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,' + '8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,' + '8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,' + '8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,' + 'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,' + 'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,' + 'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,' + '80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,' + '811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro', 32);
	var encodeRaw = function (text, attr) {
		return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function (chr) {
			return baseEntities[chr] || chr;
		});
	};
	var encodeAllRaw = function (text) {
		return ('' + text).replace(rawCharsRegExp, function (chr) {
			return baseEntities[chr] || chr;
		});
	};
	var encodeNumeric = function (text, attr) {
		return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function (chr) {
			if (chr.length > 1) {
				return '&#' + ((chr.charCodeAt(0) - 55296) * 1024 + (chr.charCodeAt(1) - 56320) + 65536) + ';';
			}
			return baseEntities[chr] || '&#' + chr.charCodeAt(0) + ';';
		});
	};
	var encodeNamed = function (text, attr, entities) {
		entities = entities || namedEntities;
		return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function (chr) {
			return baseEntities[chr] || entities[chr] || chr;
		});
	};
	var getEncodeFunc = function (name, entities) {
		var entitiesMap = buildEntitiesLookup(entities) || namedEntities;
		var encodeNamedAndNumeric = function (text, attr) {
			return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function (chr) {
				if (baseEntities[chr] !== undefined) {
					return baseEntities[chr];
				}
				if (entitiesMap[chr] !== undefined) {
					return entitiesMap[chr];
				}
				if (chr.length > 1) {
					return '&#' + ((chr.charCodeAt(0) - 55296) * 1024 + (chr.charCodeAt(1) - 56320) + 65536) + ';';
				}
				return '&#' + chr.charCodeAt(0) + ';';
			});
		};
		var encodeCustomNamed = function (text, attr) {
			return encodeNamed(text, attr, entitiesMap);
		};
		var nameMap = makeMap$1(name.replace(/\+/g, ','));
		if (nameMap.named && nameMap.numeric) {
			return encodeNamedAndNumeric;
		}
		if (nameMap.named) {
			if (entities) {
				return encodeCustomNamed;
			}
			return encodeNamed;
		}
		if (nameMap.numeric) {
			return encodeNumeric;
		}
		return encodeRaw;
	};
	var decode = function (text) {
		return text.replace(entityRegExp, function (all, numeric) {
			if (numeric) {
				if (numeric.charAt(0).toLowerCase() === 'x') {
					numeric = parseInt(numeric.substr(1), 16);
				} else {
					numeric = parseInt(numeric, 10);
				}
				if (numeric > 65535) {
					numeric -= 65536;
					return String.fromCharCode(55296 + (numeric >> 10), 56320 + (numeric & 1023));
				}
				return asciiMap[numeric] || String.fromCharCode(numeric);
			}
			return reverseEntities[all] || namedEntities[all] || nativeDecode(all);
		});
	};
	var Entities = {
		encodeRaw: encodeRaw,
		encodeAllRaw: encodeAllRaw,
		encodeNumeric: encodeNumeric,
		encodeNamed: encodeNamed,
		getEncodeFunc: getEncodeFunc,
		decode: decode
	};

	var mapCache = {}, dummyObj = {};
	var makeMap$2 = Tools.makeMap, each$3 = Tools.each, extend$1 = Tools.extend, explode$1 = Tools.explode, inArray = Tools.inArray;
	var split = function (items, delim) {
		items = Tools.trim(items);
		return items ? items.split(delim || ' ') : [];
	};
	var compileSchema = function (type) {
		var schema = {};
		var globalAttributes, blockContent;
		var phrasingContent, flowContent, html4BlockContent, html4PhrasingContent;
		var add = function (name, attributes, children) {
			var ni, attributesOrder, element;
			var arrayToMap = function (array, obj) {
				var map = {};
				var i, l;
				for (i = 0, l = array.length; i < l; i++) {
					map[array[i]] = obj || {};
				}
				return map;
			};
			children = children || [];
			attributes = attributes || '';
			if (typeof children === 'string') {
				children = split(children);
			}
			var names = split(name);
			ni = names.length;
			while (ni--) {
				attributesOrder = split([
					globalAttributes,
					attributes
				].join(' '));
				element = {
					attributes: arrayToMap(attributesOrder),
					attributesOrder: attributesOrder,
					children: arrayToMap(children, dummyObj)
				};
				schema[names[ni]] = element;
			}
		};
		var addAttrs = function (name, attributes) {
			var ni, schemaItem, i, l;
			var names = split(name);
			ni = names.length;
			var attrs = split(attributes);
			while (ni--) {
				schemaItem = schema[names[ni]];
				for (i = 0, l = attrs.length; i < l; i++) {
					schemaItem.attributes[attrs[i]] = {};
					schemaItem.attributesOrder.push(attrs[i]);
				}
			}
		};
		if (mapCache[type]) {
			return mapCache[type];
		}
		globalAttributes = 'id accesskey class dir lang style tabindex title role';
		blockContent = 'address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul';
		phrasingContent = 'a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd ' + 'label map noscript object q s samp script select small span strong sub sup ' + 'textarea u var #text #comment';
		if (type !== 'html4') {
			globalAttributes += ' contenteditable contextmenu draggable dropzone ' + 'hidden spellcheck translate';
			blockContent += ' article aside details dialog figure main header footer hgroup section nav';
			phrasingContent += ' audio canvas command datalist mark meter output picture ' + 'progress time wbr video ruby bdi keygen';
		}
		if (type !== 'html5-strict') {
			globalAttributes += ' xml:lang';
			html4PhrasingContent = 'acronym applet basefont big font strike tt';
			phrasingContent = [
				phrasingContent,
				html4PhrasingContent
			].join(' ');
			each$3(split(html4PhrasingContent), function (name) {
				add(name, '', phrasingContent);
			});
			html4BlockContent = 'center dir isindex noframes';
			blockContent = [
				blockContent,
				html4BlockContent
			].join(' ');
			flowContent = [
				blockContent,
				phrasingContent
			].join(' ');
			each$3(split(html4BlockContent), function (name) {
				add(name, '', flowContent);
			});
		}
		flowContent = flowContent || [
			blockContent,
			phrasingContent
		].join(' ');
		add('html', 'manifest', 'head body');
		add('head', '', 'base command link meta noscript script style title');
		add('title hr noscript br');
		add('base', 'href target');
		add('link', 'href rel media hreflang type sizes hreflang');
		add('meta', 'name http-equiv content charset');
		add('style', 'media type scoped');
		add('script', 'src async defer type charset');
		add('body', 'onafterprint onbeforeprint onbeforeunload onblur onerror onfocus ' + 'onhashchange onload onmessage onoffline ononline onpagehide onpageshow ' + 'onpopstate onresize onscroll onstorage onunload', flowContent);
		add('address dt dd div caption', '', flowContent);
		add('h1 h2 h3 h4 h5 h6 pre p abbr code var samp kbd sub sup i b u bdo span legend em strong small s cite dfn', '', phrasingContent);
		add('blockquote', 'cite', flowContent);
		add('ol', 'reversed start type', 'li');
		add('ul', '', 'li');
		add('li', 'value', flowContent);
		add('dl', '', 'dt dd');
		add('a', 'href target rel media hreflang type', phrasingContent);
		add('q', 'cite', phrasingContent);
		add('ins del', 'cite datetime', flowContent);
		add('img', 'src sizes srcset alt usemap ismap width height');
		add('iframe', 'src name width height', flowContent);
		add('embed', 'src type width height');
		add('object', 'data type typemustmatch name usemap form width height', [
			flowContent,
			'param'
		].join(' '));
		add('param', 'name value');
		add('map', 'name', [
			flowContent,
			'area'
		].join(' '));
		add('area', 'alt coords shape href target rel media hreflang type');
		add('table', 'border', 'caption colgroup thead tfoot tbody tr' + (type === 'html4' ? ' col' : ''));
		add('colgroup', 'span', 'col');
		add('col', 'span');
		add('tbody thead tfoot', '', 'tr');
		add('tr', '', 'td th');
		add('td', 'colspan rowspan headers', flowContent);
		add('th', 'colspan rowspan headers scope abbr', flowContent);
		add('form', 'accept-charset action autocomplete enctype method name novalidate target', flowContent);
		add('fieldset', 'disabled form name', [
			flowContent,
			'legend'
		].join(' '));
		add('label', 'form for', phrasingContent);
		add('input', 'accept alt autocomplete checked dirname disabled form formaction formenctype formmethod formnovalidate ' + 'formtarget height list max maxlength min multiple name pattern readonly required size src step type value width');
		add('button', 'disabled form formaction formenctype formmethod formnovalidate formtarget name type value', type === 'html4' ? flowContent : phrasingContent);
		add('select', 'disabled form multiple name required size', 'option optgroup');
		add('optgroup', 'disabled label', 'option');
		add('option', 'disabled label selected value');
		add('textarea', 'cols dirname disabled form maxlength name readonly required rows wrap');
		add('menu', 'type label', [
			flowContent,
			'li'
		].join(' '));
		add('noscript', '', flowContent);
		if (type !== 'html4') {
			add('wbr');
			add('ruby', '', [
				phrasingContent,
				'rt rp'
			].join(' '));
			add('figcaption', '', flowContent);
			add('mark rt rp summary bdi', '', phrasingContent);
			add('canvas', 'width height', flowContent);
			add('video', 'src crossorigin poster preload autoplay mediagroup loop ' + 'muted controls width height buffered', [
				flowContent,
				'track source'
			].join(' '));
			add('audio', 'src crossorigin preload autoplay mediagroup loop muted controls ' + 'buffered volume', [
				flowContent,
				'track source'
			].join(' '));
			add('picture', '', 'img source');
			add('source', 'src srcset type media sizes');
			add('track', 'kind src srclang label default');
			add('datalist', '', [
				phrasingContent,
				'option'
			].join(' '));
			add('article section nav aside main header footer', '', flowContent);
			add('hgroup', '', 'h1 h2 h3 h4 h5 h6');
			add('figure', '', [
				flowContent,
				'figcaption'
			].join(' '));
			add('time', 'datetime', phrasingContent);
			add('dialog', 'open', flowContent);
			add('command', 'type label icon disabled checked radiogroup command');
			add('output', 'for form name', phrasingContent);
			add('progress', 'value max', phrasingContent);
			add('meter', 'value min max low high optimum', phrasingContent);
			add('details', 'open', [
				flowContent,
				'summary'
			].join(' '));
			add('keygen', 'autofocus challenge disabled form keytype name');
		}
		if (type !== 'html5-strict') {
			addAttrs('script', 'language xml:space');
			addAttrs('style', 'xml:space');
			addAttrs('object', 'declare classid code codebase codetype archive standby align border hspace vspace');
			addAttrs('embed', 'align name hspace vspace');
			addAttrs('param', 'valuetype type');
			addAttrs('a', 'charset name rev shape coords');
			addAttrs('br', 'clear');
			addAttrs('applet', 'codebase archive code object alt name width height align hspace vspace');
			addAttrs('img', 'name longdesc align border hspace vspace');
			addAttrs('iframe', 'longdesc frameborder marginwidth marginheight scrolling align');
			addAttrs('font basefont', 'size color face');
			addAttrs('input', 'usemap align');
			addAttrs('select');
			addAttrs('textarea');
			addAttrs('h1 h2 h3 h4 h5 h6 div p legend caption', 'align');
			addAttrs('ul', 'type compact');
			addAttrs('li', 'type');
			addAttrs('ol dl menu dir', 'compact');
			addAttrs('pre', 'width xml:space');
			addAttrs('hr', 'align noshade size width');
			addAttrs('isindex', 'prompt');
			addAttrs('table', 'summary width frame rules cellspacing cellpadding align bgcolor');
			addAttrs('col', 'width align char charoff valign');
			addAttrs('colgroup', 'width align char charoff valign');
			addAttrs('thead', 'align char charoff valign');
			addAttrs('tr', 'align char charoff valign bgcolor');
			addAttrs('th', 'axis align char charoff valign nowrap bgcolor width height');
			addAttrs('form', 'accept');
			addAttrs('td', 'abbr axis scope align char charoff valign nowrap bgcolor width height');
			addAttrs('tfoot', 'align char charoff valign');
			addAttrs('tbody', 'align char charoff valign');
			addAttrs('area', 'nohref');
			addAttrs('body', 'background bgcolor text link vlink alink');
		}
		if (type !== 'html4') {
			addAttrs('input button select textarea', 'autofocus');
			addAttrs('input textarea', 'placeholder');
			addAttrs('a', 'download');
			addAttrs('link script img', 'crossorigin');
			addAttrs('img', 'loading');
			addAttrs('iframe', 'sandbox seamless allowfullscreen loading');
		}
		each$3(split('a form meter progress dfn'), function (name) {
			if (schema[name]) {
				delete schema[name].children[name];
			}
		});
		delete schema.caption.children.table;
		delete schema.script;
		mapCache[type] = schema;
		return schema;
	};
	var compileElementMap = function (value, mode) {
		var styles;
		if (value) {
			styles = {};
			if (typeof value === 'string') {
				value = { '*': value };
			}
			each$3(value, function (value, key) {
				styles[key] = styles[key.toUpperCase()] = mode === 'map' ? makeMap$2(value, /[, ]/) : explode$1(value, /[, ]/);
			});
		}
		return styles;
	};
	function Schema(settings) {
		var elements = {};
		var children = {};
		var patternElements = [];
		var customElementsMap = {}, specialElements = {};
		var createLookupTable = function (option, defaultValue, extendWith) {
			var value = settings[option];
			if (!value) {
				value = mapCache[option];
				if (!value) {
					value = makeMap$2(defaultValue, ' ', makeMap$2(defaultValue.toUpperCase(), ' '));
					value = extend$1(value, extendWith);
					mapCache[option] = value;
				}
			} else {
				value = makeMap$2(value, /[, ]/, makeMap$2(value.toUpperCase(), /[, ]/));
			}
			return value;
		};
		settings = settings || {};
		var schemaItems = compileSchema(settings.schema);
		if (settings.verify_html === false) {
			settings.valid_elements = '*[*]';
		}
		var validStyles = compileElementMap(settings.valid_styles);
		var invalidStyles = compileElementMap(settings.invalid_styles, 'map');
		var validClasses = compileElementMap(settings.valid_classes, 'map');
		var whiteSpaceElementsMap = createLookupTable('whitespace_elements', 'pre script noscript style textarea video audio iframe object code');
		var selfClosingElementsMap = createLookupTable('self_closing_elements', 'colgroup dd dt li option p td tfoot th thead tr');
		var shortEndedElementsMap = createLookupTable('short_ended_elements', 'area base basefont br col frame hr img input isindex link ' + 'meta param embed source wbr track');
		var boolAttrMap = createLookupTable('boolean_attributes', 'checked compact declare defer disabled ismap multiple nohref noresize ' + 'noshade nowrap readonly selected autoplay loop controls');
		var nonEmptyOrMoveCaretBeforeOnEnter = 'td th iframe video audio object script code';
		var nonEmptyElementsMap = createLookupTable('non_empty_elements', nonEmptyOrMoveCaretBeforeOnEnter + ' pre', shortEndedElementsMap);
		var moveCaretBeforeOnEnterElementsMap = createLookupTable('move_caret_before_on_enter_elements', nonEmptyOrMoveCaretBeforeOnEnter + ' table', shortEndedElementsMap);
		var textBlockElementsMap = createLookupTable('text_block_elements', 'h1 h2 h3 h4 h5 h6 p div address pre form ' + 'blockquote center dir fieldset header footer article section hgroup aside main nav figure');
		var blockElementsMap = createLookupTable('block_elements', 'hr table tbody thead tfoot ' + 'th tr td li ol ul caption dl dt dd noscript menu isindex option ' + 'datalist select optgroup figcaption details summary', textBlockElementsMap);
		var textInlineElementsMap = createLookupTable('text_inline_elements', 'span strong b em i font strike u var cite ' + 'dfn code mark q sup sub samp');
		each$3((settings.special || 'script noscript iframe noframes noembed title style textarea xmp').split(' '), function (name) {
			specialElements[name] = new RegExp('</' + name + '[^>]*>', 'gi');
		});
		var patternToRegExp = function (str) {
			return new RegExp('^' + str.replace(/([?+*])/g, '.$1') + '$');
		};
		var addValidElements = function (validElements) {
			var ei, el, ai, al, matches, element, attr, attrData, elementName, attrName, attrType, attributes, attributesOrder, prefix, outputName, globalAttributes, globalAttributesOrder, value;
			var elementRuleRegExp = /^([#+\-])?([^\[!\/]+)(?:\/([^\[!]+))?(?:(!?)\[([^\]]+)])?$/, attrRuleRegExp = /^([!\-])?(\w+[\\:]:\w+|[^=:<]+)?(?:([=:<])(.*))?$/, hasPatternsRegExp = /[*?+]/;
			if (validElements) {
				var validElementsArr = split(validElements, ',');
				if (elements['@']) {
					globalAttributes = elements['@'].attributes;
					globalAttributesOrder = elements['@'].attributesOrder;
				}
				for (ei = 0, el = validElementsArr.length; ei < el; ei++) {
					matches = elementRuleRegExp.exec(validElementsArr[ei]);
					if (matches) {
						prefix = matches[1];
						elementName = matches[2];
						outputName = matches[3];
						attrData = matches[5];
						attributes = {};
						attributesOrder = [];
						element = {
							attributes: attributes,
							attributesOrder: attributesOrder
						};
						if (prefix === '#') {
							element.paddEmpty = true;
						}
						if (prefix === '-') {
							element.removeEmpty = true;
						}
						if (matches[4] === '!') {
							element.removeEmptyAttrs = true;
						}
						if (globalAttributes) {
							each$1(globalAttributes, function (value, key) {
								attributes[key] = value;
							});
							attributesOrder.push.apply(attributesOrder, globalAttributesOrder);
						}
						if (attrData) {
							attrData = split(attrData, '|');
							for (ai = 0, al = attrData.length; ai < al; ai++) {
								matches = attrRuleRegExp.exec(attrData[ai]);
								if (matches) {
									attr = {};
									attrType = matches[1];
									attrName = matches[2].replace(/[\\:]:/g, ':');
									prefix = matches[3];
									value = matches[4];
									if (attrType === '!') {
										element.attributesRequired = element.attributesRequired || [];
										element.attributesRequired.push(attrName);
										attr.required = true;
									}
									if (attrType === '-') {
										delete attributes[attrName];
										attributesOrder.splice(inArray(attributesOrder, attrName), 1);
										continue;
									}
									if (prefix) {
										if (prefix === '=') {
											element.attributesDefault = element.attributesDefault || [];
											element.attributesDefault.push({
												name: attrName,
												value: value
											});
											attr.defaultValue = value;
										}
										if (prefix === ':') {
											element.attributesForced = element.attributesForced || [];
											element.attributesForced.push({
												name: attrName,
												value: value
											});
											attr.forcedValue = value;
										}
										if (prefix === '<') {
											attr.validValues = makeMap$2(value, '?');
										}
									}
									if (hasPatternsRegExp.test(attrName)) {
										element.attributePatterns = element.attributePatterns || [];
										attr.pattern = patternToRegExp(attrName);
										element.attributePatterns.push(attr);
									} else {
										if (!attributes[attrName]) {
											attributesOrder.push(attrName);
										}
										attributes[attrName] = attr;
									}
								}
							}
						}
						if (!globalAttributes && elementName === '@') {
							globalAttributes = attributes;
							globalAttributesOrder = attributesOrder;
						}
						if (outputName) {
							element.outputName = elementName;
							elements[outputName] = element;
						}
						if (hasPatternsRegExp.test(elementName)) {
							element.pattern = patternToRegExp(elementName);
							patternElements.push(element);
						} else {
							elements[elementName] = element;
						}
					}
				}
			}
		};
		var setValidElements = function (validElements) {
			elements = {};
			patternElements = [];
			addValidElements(validElements);
			each$3(schemaItems, function (element, name) {
				children[name] = element.children;
			});
		};
		var addCustomElements = function (customElements) {
			var customElementRegExp = /^(~)?(.+)$/;
			if (customElements) {
				mapCache.text_block_elements = mapCache.block_elements = null;
				each$3(split(customElements, ','), function (rule) {
					var matches = customElementRegExp.exec(rule), inline = matches[1] === '~', cloneName = inline ? 'span' : 'div', name = matches[2];
					children[name] = children[cloneName];
					customElementsMap[name] = cloneName;
					if (!inline) {
						blockElementsMap[name.toUpperCase()] = {};
						blockElementsMap[name] = {};
					}
					if (!elements[name]) {
						var customRule = elements[cloneName];
						customRule = extend$1({}, customRule);
						delete customRule.removeEmptyAttrs;
						delete customRule.removeEmpty;
						elements[name] = customRule;
					}
					each$3(children, function (element, elmName) {
						if (element[cloneName]) {
							children[elmName] = element = extend$1({}, children[elmName]);
							element[name] = element[cloneName];
						}
					});
				});
			}
		};
		var addValidChildren = function (validChildren) {
			var childRuleRegExp = /^([+\-]?)([A-Za-z0-9_\-.\u00b7\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u037d\u037f-\u1fff\u200c-\u200d\u203f-\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]+)\[([^\]]+)]$/;
			mapCache[settings.schema] = null;
			if (validChildren) {
				each$3(split(validChildren, ','), function (rule) {
					var matches = childRuleRegExp.exec(rule);
					var parent, prefix;
					if (matches) {
						prefix = matches[1];
						if (prefix) {
							parent = children[matches[2]];
						} else {
							parent = children[matches[2]] = { '#comment': {} };
						}
						parent = children[matches[2]];
						each$3(split(matches[3], '|'), function (child) {
							if (prefix === '-') {
								delete parent[child];
							} else {
								parent[child] = {};
							}
						});
					}
				});
			}
		};
		var getElementRule = function (name) {
			var element = elements[name], i;
			if (element) {
				return element;
			}
			i = patternElements.length;
			while (i--) {
				element = patternElements[i];
				if (element.pattern.test(name)) {
					return element;
				}
			}
		};
		if (!settings.valid_elements) {
			each$3(schemaItems, function (element, name) {
				elements[name] = {
					attributes: element.attributes,
					attributesOrder: element.attributesOrder
				};
				children[name] = element.children;
			});
			if (settings.schema !== 'html5') {
				each$3(split('strong/b em/i'), function (item) {
					var items = split(item, '/');
					elements[items[1]].outputName = items[0];
				});
			}
			each$3(split('ol ul sub sup blockquote span font a table tbody strong em b i'), function (name) {
				if (elements[name]) {
					elements[name].removeEmpty = true;
				}
			});
			each$3(split('p h1 h2 h3 h4 h5 h6 th td pre div address caption li'), function (name) {
				elements[name].paddEmpty = true;
			});
			each$3(split('span'), function (name) {
				elements[name].removeEmptyAttrs = true;
			});
		} else {
			setValidElements(settings.valid_elements);
		}
		addCustomElements(settings.custom_elements);
		addValidChildren(settings.valid_children);
		addValidElements(settings.extended_valid_elements);
		addValidChildren('+ol[ul|ol],+ul[ul|ol]');
		each$3({
			dd: 'dl',
			dt: 'dl',
			li: 'ul ol',
			td: 'tr',
			th: 'tr',
			tr: 'tbody thead tfoot',
			tbody: 'table',
			thead: 'table',
			tfoot: 'table',
			legend: 'fieldset',
			area: 'map',
			param: 'video audio object'
		}, function (parents, item) {
			if (elements[item]) {
				elements[item].parentsRequired = split(parents);
			}
		});
		if (settings.invalid_elements) {
			each$3(explode$1(settings.invalid_elements), function (item) {
				if (elements[item]) {
					delete elements[item];
				}
			});
		}
		if (!getElementRule('span')) {
			addValidElements('span[!data-mce-type|*]');
		}
		var getValidStyles = function () {
			return validStyles;
		};
		var getInvalidStyles = function () {
			return invalidStyles;
		};
		var getValidClasses = function () {
			return validClasses;
		};
		var getBoolAttrs = function () {
			return boolAttrMap;
		};
		var getBlockElements = function () {
			return blockElementsMap;
		};
		var getTextBlockElements = function () {
			return textBlockElementsMap;
		};
		var getTextInlineElements = function () {
			return textInlineElementsMap;
		};
		var getShortEndedElements = function () {
			return shortEndedElementsMap;
		};
		var getSelfClosingElements = function () {
			return selfClosingElementsMap;
		};
		var getNonEmptyElements = function () {
			return nonEmptyElementsMap;
		};
		var getMoveCaretBeforeOnEnterElements = function () {
			return moveCaretBeforeOnEnterElementsMap;
		};
		var getWhiteSpaceElements = function () {
			return whiteSpaceElementsMap;
		};
		var getSpecialElements = function () {
			return specialElements;
		};
		var isValidChild = function (name, child) {
			var parent = children[name.toLowerCase()];
			return !!(parent && parent[child.toLowerCase()]);
		};
		var isValid = function (name, attr) {
			var attrPatterns, i;
			var rule = getElementRule(name);
			if (rule) {
				if (attr) {
					if (rule.attributes[attr]) {
						return true;
					}
					attrPatterns = rule.attributePatterns;
					if (attrPatterns) {
						i = attrPatterns.length;
						while (i--) {
							if (attrPatterns[i].pattern.test(name)) {
								return true;
							}
						}
					}
				} else {
					return true;
				}
			}
			return false;
		};
		var getCustomElements = function () {
			return customElementsMap;
		};
		return {
			children: children,
			elements: elements,
			getValidStyles: getValidStyles,
			getValidClasses: getValidClasses,
			getBlockElements: getBlockElements,
			getInvalidStyles: getInvalidStyles,
			getShortEndedElements: getShortEndedElements,
			getTextBlockElements: getTextBlockElements,
			getTextInlineElements: getTextInlineElements,
			getBoolAttrs: getBoolAttrs,
			getElementRule: getElementRule,
			getSelfClosingElements: getSelfClosingElements,
			getNonEmptyElements: getNonEmptyElements,
			getMoveCaretBeforeOnEnterElements: getMoveCaretBeforeOnEnterElements,
			getWhiteSpaceElements: getWhiteSpaceElements,
			getSpecialElements: getSpecialElements,
			isValidChild: isValidChild,
			isValid: isValid,
			getCustomElements: getCustomElements,
			addValidElements: addValidElements,
			setValidElements: setValidElements,
			addCustomElements: addCustomElements,
			addValidChildren: addValidChildren
		};
	}

	var toHex = function (match, r, g, b) {
		var hex = function (val) {
			val = parseInt(val, 10).toString(16);
			return val.length > 1 ? val : '0' + val;
		};
		return '#' + hex(r) + hex(g) + hex(b);
	};
	var Styles = function (settings, schema) {
		var rgbRegExp = /rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/gi;
		var urlOrStrRegExp = /(?:url(?:(?:\(\s*\"([^\"]+)\"\s*\))|(?:\(\s*\'([^\']+)\'\s*\))|(?:\(\s*([^)\s]+)\s*\))))|(?:\'([^\']+)\')|(?:\"([^\"]+)\")/gi;
		var styleRegExp = /\s*([^:]+):\s*([^;]+);?/g;
		var trimRightRegExp = /\s+$/;
		var i;
		var encodingLookup = {};
		var validStyles;
		var invalidStyles;
		var invisibleChar = zeroWidth;
		settings = settings || {};
		if (schema) {
			validStyles = schema.getValidStyles();
			invalidStyles = schema.getInvalidStyles();
		}
		var encodingItems = ('\\" \\\' \\; \\: ; : ' + invisibleChar).split(' ');
		for (i = 0; i < encodingItems.length; i++) {
			encodingLookup[encodingItems[i]] = invisibleChar + i;
			encodingLookup[invisibleChar + i] = encodingItems[i];
		}
		return {
			toHex: function (color) {
				return color.replace(rgbRegExp, toHex);
			},
			parse: function (css) {
				var styles = {};
				var matches, name, value, isEncoded;
				var urlConverter = settings.url_converter;
				var urlConverterScope = settings.url_converter_scope || this;
				var compress = function (prefix, suffix, noJoin) {
					var top = styles[prefix + '-top' + suffix];
					if (!top) {
						return;
					}
					var right = styles[prefix + '-right' + suffix];
					if (!right) {
						return;
					}
					var bottom = styles[prefix + '-bottom' + suffix];
					if (!bottom) {
						return;
					}
					var left = styles[prefix + '-left' + suffix];
					if (!left) {
						return;
					}
					var box = [
						top,
						right,
						bottom,
						left
					];
					i = box.length - 1;
					while (i--) {
						if (box[i] !== box[i + 1]) {
							break;
						}
					}
					if (i > -1 && noJoin) {
						return;
					}
					styles[prefix + suffix] = i === -1 ? box[0] : box.join(' ');
					delete styles[prefix + '-top' + suffix];
					delete styles[prefix + '-right' + suffix];
					delete styles[prefix + '-bottom' + suffix];
					delete styles[prefix + '-left' + suffix];
				};
				var canCompress = function (key) {
					var value = styles[key], i;
					if (!value) {
						return;
					}
					value = value.split(' ');
					i = value.length;
					while (i--) {
						if (value[i] !== value[0]) {
							return false;
						}
					}
					styles[key] = value[0];
					return true;
				};
				var compress2 = function (target, a, b, c) {
					if (!canCompress(a)) {
						return;
					}
					if (!canCompress(b)) {
						return;
					}
					if (!canCompress(c)) {
						return;
					}
					styles[target] = styles[a] + ' ' + styles[b] + ' ' + styles[c];
					delete styles[a];
					delete styles[b];
					delete styles[c];
				};
				var encode = function (str) {
					isEncoded = true;
					return encodingLookup[str];
				};
				var decode = function (str, keepSlashes) {
					if (isEncoded) {
						str = str.replace(/\uFEFF[0-9]/g, function (str) {
							return encodingLookup[str];
						});
					}
					if (!keepSlashes) {
						str = str.replace(/\\([\'\";:])/g, '$1');
					}
					return str;
				};
				var decodeSingleHexSequence = function (escSeq) {
					return String.fromCharCode(parseInt(escSeq.slice(1), 16));
				};
				var decodeHexSequences = function (value) {
					return value.replace(/\\[0-9a-f]+/gi, decodeSingleHexSequence);
				};
				var processUrl = function (match, url, url2, url3, str, str2) {
					str = str || str2;
					if (str) {
						str = decode(str);
						return '\'' + str.replace(/\'/g, '\\\'') + '\'';
					}
					url = decode(url || url2 || url3);
					if (!settings.allow_script_urls) {
						var scriptUrl = url.replace(/[\s\r\n]+/g, '');
						if (/(java|vb)script:/i.test(scriptUrl)) {
							return '';
						}
						if (!settings.allow_svg_data_urls && /^data:image\/svg/i.test(scriptUrl)) {
							return '';
						}
					}
					if (urlConverter) {
						url = urlConverter.call(urlConverterScope, url, 'style');
					}
					return 'url(\'' + url.replace(/\'/g, '\\\'') + '\')';
				};
				if (css) {
					css = css.replace(/[\u0000-\u001F]/g, '');
					css = css.replace(/\\[\"\';:\uFEFF]/g, encode).replace(/\"[^\"]+\"|\'[^\']+\'/g, function (str) {
						return str.replace(/[;:]/g, encode);
					});
					while (matches = styleRegExp.exec(css)) {
						styleRegExp.lastIndex = matches.index + matches[0].length;
						name = matches[1].replace(trimRightRegExp, '').toLowerCase();
						value = matches[2].replace(trimRightRegExp, '');
						if (name && value) {
							name = decodeHexSequences(name);
							value = decodeHexSequences(value);
							if (name.indexOf(invisibleChar) !== -1 || name.indexOf('"') !== -1) {
								continue;
							}
							if (!settings.allow_script_urls && (name === 'behavior' || /expression\s*\(|\/\*|\*\//.test(value))) {
								continue;
							}
							if (name === 'font-weight' && value === '700') {
								value = 'bold';
							} else if (name === 'color' || name === 'background-color') {
								value = value.toLowerCase();
							}
							value = value.replace(rgbRegExp, toHex);
							value = value.replace(urlOrStrRegExp, processUrl);
							styles[name] = isEncoded ? decode(value, true) : value;
						}
					}
					compress('border', '', true);
					compress('border', '-width');
					compress('border', '-color');
					compress('border', '-style');
					compress('padding', '');
					compress('margin', '');
					compress2('border', 'border-width', 'border-style', 'border-color');
					if (styles.border === 'medium none') {
						delete styles.border;
					}
					if (styles['border-image'] === 'none') {
						delete styles['border-image'];
					}
				}
				return styles;
			},
			serialize: function (styles, elementName) {
				var css = '';
				var serializeStyles = function (name) {
					var value;
					var styleList = validStyles[name];
					if (styleList) {
						for (var i_1 = 0, l = styleList.length; i_1 < l; i_1++) {
							name = styleList[i_1];
							value = styles[name];
							if (value) {
								css += (css.length > 0 ? ' ' : '') + name + ': ' + value + ';';
							}
						}
					}
				};
				var isValid = function (name, elementName) {
					var styleMap = invalidStyles['*'];
					if (styleMap && styleMap[name]) {
						return false;
					}
					styleMap = invalidStyles[elementName];
					return !(styleMap && styleMap[name]);
				};
				if (elementName && validStyles) {
					serializeStyles('*');
					serializeStyles(elementName);
				} else {
					each$1(styles, function (value, name) {
						if (value && (!invalidStyles || isValid(name, elementName))) {
							css += (css.length > 0 ? ' ' : '') + name + ': ' + value + ';';
						}
					});
				}
				return css;
			}
		};
	};

	var eventExpandoPrefix = 'mce-data-';
	var mouseEventRe = /^(?:mouse|contextmenu)|click/;
	var deprecated = {
		keyLocation: 1,
		layerX: 1,
		layerY: 1,
		returnValue: 1,
		webkitMovementX: 1,
		webkitMovementY: 1,
		keyIdentifier: 1,
		mozPressure: 1
	};
	var hasIsDefaultPrevented = function (event) {
		return event.isDefaultPrevented === returnTrue || event.isDefaultPrevented === returnFalse;
	};
	var returnFalse = function () {
		return false;
	};
	var returnTrue = function () {
		return true;
	};
	var addEvent = function (target, name, callback, capture) {
		if (target.addEventListener) {
			target.addEventListener(name, callback, capture || false);
		} else if (target.attachEvent) {
			target.attachEvent('on' + name, callback);
		}
	};
	var removeEvent = function (target, name, callback, capture) {
		if (target.removeEventListener) {
			target.removeEventListener(name, callback, capture || false);
		} else if (target.detachEvent) {
			target.detachEvent('on' + name, callback);
		}
	};
	var isMouseEvent = function (event) {
		return mouseEventRe.test(event.type);
	};
	var fix = function (originalEvent, data) {
		var name;
		var event = data || {};
		for (name in originalEvent) {
			if (!deprecated[name]) {
				event[name] = originalEvent[name];
			}
		}
		if (!event.target) {
			event.target = event.srcElement || document;
		}
		if (event.composedPath) {
			event.composedPath = function () {
				return originalEvent.composedPath();
			};
		}
		if (originalEvent && isMouseEvent(originalEvent) && originalEvent.pageX === undefined && originalEvent.clientX !== undefined) {
			var eventDoc = event.target.ownerDocument || document;
			var doc = eventDoc.documentElement;
			var body = eventDoc.body;
			event.pageX = originalEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
			event.pageY = originalEvent.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
		}
		event.preventDefault = function () {
			event.isDefaultPrevented = returnTrue;
			if (originalEvent) {
				if (originalEvent.preventDefault) {
					originalEvent.preventDefault();
				} else {
					originalEvent.returnValue = false;
				}
			}
		};
		event.stopPropagation = function () {
			event.isPropagationStopped = returnTrue;
			if (originalEvent) {
				if (originalEvent.stopPropagation) {
					originalEvent.stopPropagation();
				} else {
					originalEvent.cancelBubble = true;
				}
			}
		};
		event.stopImmediatePropagation = function () {
			event.isImmediatePropagationStopped = returnTrue;
			event.stopPropagation();
		};
		if (hasIsDefaultPrevented(event) === false) {
			event.isDefaultPrevented = returnFalse;
			event.isPropagationStopped = returnFalse;
			event.isImmediatePropagationStopped = returnFalse;
		}
		if (typeof event.metaKey === 'undefined') {
			event.metaKey = false;
		}
		return event;
	};
	var bindOnReady = function (win, callback, eventUtils) {
		var doc = win.document, event = { type: 'ready' };
		if (eventUtils.domLoaded) {
			callback(event);
			return;
		}
		var isDocReady = function () {
			return doc.readyState === 'complete' || doc.readyState === 'interactive' && doc.body;
		};
		var readyHandler = function () {
			removeEvent(win, 'DOMContentLoaded', readyHandler);
			removeEvent(win, 'load', readyHandler);
			if (!eventUtils.domLoaded) {
				eventUtils.domLoaded = true;
				callback(event);
			}
			win = null;
		};
		if (isDocReady()) {
			readyHandler();
		} else {
			addEvent(win, 'DOMContentLoaded', readyHandler);
		}
		if (!eventUtils.domLoaded) {
			addEvent(win, 'load', readyHandler);
		}
	};
	var EventUtils = function () {
		function EventUtils() {
			this.domLoaded = false;
			this.events = {};
			this.count = 1;
			this.expando = eventExpandoPrefix + (+new Date()).toString(32);
			this.hasMouseEnterLeave = 'onmouseenter' in document.documentElement;
			this.hasFocusIn = 'onfocusin' in document.documentElement;
			this.count = 1;
		}
		EventUtils.prototype.bind = function (target, names, callback, scope) {
			var self = this;
			var id, callbackList, i, name, fakeName, nativeHandler, capture;
			var win = window;
			var defaultNativeHandler = function (evt) {
				self.executeHandlers(fix(evt || win.event), id);
			};
			if (!target || target.nodeType === 3 || target.nodeType === 8) {
				return;
			}
			if (!target[self.expando]) {
				id = self.count++;
				target[self.expando] = id;
				self.events[id] = {};
			} else {
				id = target[self.expando];
			}
			scope = scope || target;
			var namesList = names.split(' ');
			i = namesList.length;
			while (i--) {
				name = namesList[i];
				nativeHandler = defaultNativeHandler;
				fakeName = capture = false;
				if (name === 'DOMContentLoaded') {
					name = 'ready';
				}
				if (self.domLoaded && name === 'ready' && target.readyState === 'complete') {
					callback.call(scope, fix({ type: name }));
					continue;
				}
				if (!self.hasMouseEnterLeave) {
					fakeName = self.mouseEnterLeave[name];
					if (fakeName) {
						nativeHandler = function (evt) {
							var current = evt.currentTarget;
							var related = evt.relatedTarget;
							if (related && current.contains) {
								related = current.contains(related);
							} else {
								while (related && related !== current) {
									related = related.parentNode;
								}
							}
							if (!related) {
								evt = fix(evt || win.event);
								evt.type = evt.type === 'mouseout' ? 'mouseleave' : 'mouseenter';
								evt.target = current;
								self.executeHandlers(evt, id);
							}
						};
					}
				}
				if (!self.hasFocusIn && (name === 'focusin' || name === 'focusout')) {
					capture = true;
					fakeName = name === 'focusin' ? 'focus' : 'blur';
					nativeHandler = function (evt) {
						evt = fix(evt || win.event);
						evt.type = evt.type === 'focus' ? 'focusin' : 'focusout';
						self.executeHandlers(evt, id);
					};
				}
				callbackList = self.events[id][name];
				if (!callbackList) {
					self.events[id][name] = callbackList = [{
						func: callback,
						scope: scope
					}];
					callbackList.fakeName = fakeName;
					callbackList.capture = capture;
					callbackList.nativeHandler = nativeHandler;
					if (name === 'ready') {
						bindOnReady(target, nativeHandler, self);
					} else {
						addEvent(target, fakeName || name, nativeHandler, capture);
					}
				} else {
					if (name === 'ready' && self.domLoaded) {
						callback(fix({ type: name }));
					} else {
						callbackList.push({
							func: callback,
							scope: scope
						});
					}
				}
			}
			target = callbackList = null;
			return callback;
		};
		EventUtils.prototype.unbind = function (target, names, callback) {
			var callbackList, i, ci, name, eventMap;
			if (!target || target.nodeType === 3 || target.nodeType === 8) {
				return this;
			}
			var id = target[this.expando];
			if (id) {
				eventMap = this.events[id];
				if (names) {
					var namesList = names.split(' ');
					i = namesList.length;
					while (i--) {
						name = namesList[i];
						callbackList = eventMap[name];
						if (callbackList) {
							if (callback) {
								ci = callbackList.length;
								while (ci--) {
									if (callbackList[ci].func === callback) {
										var nativeHandler = callbackList.nativeHandler;
										var fakeName = callbackList.fakeName, capture = callbackList.capture;
										callbackList = callbackList.slice(0, ci).concat(callbackList.slice(ci + 1));
										callbackList.nativeHandler = nativeHandler;
										callbackList.fakeName = fakeName;
										callbackList.capture = capture;
										eventMap[name] = callbackList;
									}
								}
							}
							if (!callback || callbackList.length === 0) {
								delete eventMap[name];
								removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
							}
						}
					}
				} else {
					each$1(eventMap, function (callbackList, name) {
						removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
					});
					eventMap = {};
				}
				for (name in eventMap) {
					if (has(eventMap, name)) {
						return this;
					}
				}
				delete this.events[id];
				try {
					delete target[this.expando];
				} catch (ex) {
					target[this.expando] = null;
				}
			}
			return this;
		};
		EventUtils.prototype.fire = function (target, name, args) {
			var id;
			if (!target || target.nodeType === 3 || target.nodeType === 8) {
				return this;
			}
			var event = fix(null, args);
			event.type = name;
			event.target = target;
			do {
				id = target[this.expando];
				if (id) {
					this.executeHandlers(event, id);
				}
				target = target.parentNode || target.ownerDocument || target.defaultView || target.parentWindow;
			} while (target && !event.isPropagationStopped());
			return this;
		};
		EventUtils.prototype.clean = function (target) {
			var i, children;
			if (!target || target.nodeType === 3 || target.nodeType === 8) {
				return this;
			}
			if (target[this.expando]) {
				this.unbind(target);
			}
			if (!target.getElementsByTagName) {
				target = target.document;
			}
			if (target && target.getElementsByTagName) {
				this.unbind(target);
				children = target.getElementsByTagName('*');
				i = children.length;
				while (i--) {
					target = children[i];
					if (target[this.expando]) {
						this.unbind(target);
					}
				}
			}
			return this;
		};
		EventUtils.prototype.destroy = function () {
			this.events = {};
		};
		EventUtils.prototype.cancel = function (e) {
			if (e) {
				e.preventDefault();
				e.stopImmediatePropagation();
			}
			return false;
		};
		EventUtils.prototype.executeHandlers = function (evt, id) {
			var container = this.events[id];
			var callbackList = container && container[evt.type];
			if (callbackList) {
				for (var i = 0, l = callbackList.length; i < l; i++) {
					var callback = callbackList[i];
					if (callback && callback.func.call(callback.scope, evt) === false) {
						evt.preventDefault();
					}
					if (evt.isImmediatePropagationStopped()) {
						return;
					}
				}
			}
		};
		EventUtils.Event = new EventUtils();
		return EventUtils;
	}();

	var support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document$1, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains$3, expando = 'sizzle' + -new Date(), preferredDoc = window.document, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), sortOrder = function (a, b) {
		if (a === b) {
			hasDuplicate = true;
		}
		return 0;
	}, strundefined = typeof undefined, MAX_NEGATIVE = 1 << 31, hasOwn = {}.hasOwnProperty, arr = [], pop = arr.pop, push_native = arr.push, push = arr.push, slice = arr.slice, indexOf$2 = arr.indexOf || function (elem) {
		var i = 0, len = this.length;
		for (; i < len; i++) {
			if (this[i] === elem) {
				return i;
			}
		}
		return -1;
	}, booleans = 'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped', whitespace = '[\\x20\\t\\r\\n\\f]', identifier = '(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+', attributes = '\\[' + whitespace + '*(' + identifier + ')(?:' + whitespace + '*([*^$|!~]?=)' + whitespace + '*(?:\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)"|(' + identifier + '))|)' + whitespace + '*\\]', pseudos = ':(' + identifier + ')(?:\\((' + '(\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)")|' + '((?:\\\\.|[^\\\\()[\\]]|' + attributes + ')*)|' + '.*' + ')\\)|)', rtrim = new RegExp('^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$', 'g'), rcomma = new RegExp('^' + whitespace + '*,' + whitespace + '*'), rcombinators = new RegExp('^' + whitespace + '*([>+~]|' + whitespace + ')' + whitespace + '*'), rattributeQuotes = new RegExp('=' + whitespace + '*([^\\]\'"]*?)' + whitespace + '*\\]', 'g'), rpseudo = new RegExp(pseudos), ridentifier = new RegExp('^' + identifier + '$'), matchExpr = {
		ID: new RegExp('^#(' + identifier + ')'),
		CLASS: new RegExp('^\\.(' + identifier + ')'),
		TAG: new RegExp('^(' + identifier + '|[*])'),
		ATTR: new RegExp('^' + attributes),
		PSEUDO: new RegExp('^' + pseudos),
		CHILD: new RegExp('^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' + whitespace + '*(even|odd|(([+-]|)(\\d*)n|)' + whitespace + '*(?:([+-]|)' + whitespace + '*(\\d+)|))' + whitespace + '*\\)|)', 'i'),
		bool: new RegExp('^(?:' + booleans + ')$', 'i'),
		needsContext: new RegExp('^' + whitespace + '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' + whitespace + '*((?:-\\d)?\\d*)' + whitespace + '*\\)|)(?=[^-]|$)', 'i')
	}, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rnative = /^[^{]+\{\s*\[native \w/, rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, rescape = /'|\\/g, runescape = new RegExp('\\\\([\\da-f]{1,6}' + whitespace + '?|(' + whitespace + ')|.)', 'ig'), funescape = function (_, escaped, escapedWhitespace) {
		var high = '0x' + escaped - 65536;
		return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
	};
	try {
		push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
		arr[preferredDoc.childNodes.length].nodeType;
	} catch (e) {
		push = {
			apply: arr.length ? function (target, els) {
				push_native.apply(target, slice.call(els));
			} : function (target, els) {
				var j = target.length, i = 0;
				while (target[j++] = els[i++]) {
				}
				target.length = j - 1;
			}
		};
	}
	var Sizzle = function (selector, context, results, seed) {
		var match, elem, m, nodeType, i, groups, old, nid, newContext, newSelector;
		if ((context ? context.ownerDocument || context : preferredDoc) !== document$1) {
			setDocument(context);
		}
		context = context || document$1;
		results = results || [];
		if (!selector || typeof selector !== 'string') {
			return results;
		}
		if ((nodeType = context.nodeType) !== 1 && nodeType !== 9) {
			return [];
		}
		if (documentIsHTML && !seed) {
			if (match = rquickExpr.exec(selector)) {
				if (m = match[1]) {
					if (nodeType === 9) {
						elem = context.getElementById(m);
						if (elem && elem.parentNode) {
							if (elem.id === m) {
								results.push(elem);
								return results;
							}
						} else {
							return results;
						}
					} else {
						if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains$3(context, elem) && elem.id === m) {
							results.push(elem);
							return results;
						}
					}
				} else if (match[2]) {
					push.apply(results, context.getElementsByTagName(selector));
					return results;
				} else if ((m = match[3]) && support.getElementsByClassName) {
					push.apply(results, context.getElementsByClassName(m));
					return results;
				}
			}
			if (support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
				nid = old = expando;
				newContext = context;
				newSelector = nodeType === 9 && selector;
				if (nodeType === 1 && context.nodeName.toLowerCase() !== 'object') {
					groups = tokenize(selector);
					if (old = context.getAttribute('id')) {
						nid = old.replace(rescape, '\\$&');
					} else {
						context.setAttribute('id', nid);
					}
					nid = '[id=\'' + nid + '\'] ';
					i = groups.length;
					while (i--) {
						groups[i] = nid + toSelector(groups[i]);
					}
					newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
					newSelector = groups.join(',');
				}
				if (newSelector) {
					try {
						push.apply(results, newContext.querySelectorAll(newSelector));
						return results;
					} catch (qsaError) {
					} finally {
						if (!old) {
							context.removeAttribute('id');
						}
					}
				}
			}
		}
		return select(selector.replace(rtrim, '$1'), context, results, seed);
	};
	function createCache() {
		var keys = [];
		function cache(key, value) {
			if (keys.push(key + ' ') > Expr.cacheLength) {
				delete cache[keys.shift()];
			}
			return cache[key + ' '] = value;
		}
		return cache;
	}
	function markFunction(fn) {
		fn[expando] = true;
		return fn;
	}
	function siblingCheck(a, b) {
		var cur = b && a, diff = cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);
		if (diff) {
			return diff;
		}
		if (cur) {
			while (cur = cur.nextSibling) {
				if (cur === b) {
					return -1;
				}
			}
		}
		return a ? 1 : -1;
	}
	function createInputPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return name === 'input' && elem.type === type;
		};
	}
	function createButtonPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return (name === 'input' || name === 'button') && elem.type === type;
		};
	}
	function createPositionalPseudo(fn) {
		return markFunction(function (argument) {
			argument = +argument;
			return markFunction(function (seed, matches) {
				var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length;
				while (i--) {
					if (seed[j = matchIndexes[i]]) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}
	function testContext(context) {
		return context && typeof context.getElementsByTagName !== strundefined && context;
	}
	support = Sizzle.support = {};
	isXML = Sizzle.isXML = function (elem) {
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== 'HTML' : false;
	};
	setDocument = Sizzle.setDocument = function (node) {
		var hasCompare, doc = node ? node.ownerDocument || node : preferredDoc, parent = doc.defaultView;
		function getTop(win) {
			try {
				return win.top;
			} catch (ex) {
			}
			return null;
		}
		if (doc === document$1 || doc.nodeType !== 9 || !doc.documentElement) {
			return document$1;
		}
		document$1 = doc;
		docElem = doc.documentElement;
		documentIsHTML = !isXML(doc);
		if (parent && parent !== getTop(parent)) {
			if (parent.addEventListener) {
				parent.addEventListener('unload', function () {
					setDocument();
				}, false);
			} else if (parent.attachEvent) {
				parent.attachEvent('onunload', function () {
					setDocument();
				});
			}
		}
		support.attributes = true;
		support.getElementsByTagName = true;
		support.getElementsByClassName = rnative.test(doc.getElementsByClassName);
		support.getById = true;
		Expr.find.ID = function (id, context) {
			if (typeof context.getElementById !== strundefined && documentIsHTML) {
				var m = context.getElementById(id);
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter.ID = function (id) {
			var attrId = id.replace(runescape, funescape);
			return function (elem) {
				return elem.getAttribute('id') === attrId;
			};
		};
		Expr.find.TAG = support.getElementsByTagName ? function (tag, context) {
			if (typeof context.getElementsByTagName !== strundefined) {
				return context.getElementsByTagName(tag);
			}
		} : function (tag, context) {
			var elem, tmp = [], i = 0, results = context.getElementsByTagName(tag);
			if (tag === '*') {
				while (elem = results[i++]) {
					if (elem.nodeType === 1) {
						tmp.push(elem);
					}
				}
				return tmp;
			}
			return results;
		};
		Expr.find.CLASS = support.getElementsByClassName && function (className, context) {
			if (documentIsHTML) {
				return context.getElementsByClassName(className);
			}
		};
		rbuggyMatches = [];
		rbuggyQSA = [];
		support.disconnectedMatch = true;
		rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join('|'));
		rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join('|'));
		hasCompare = rnative.test(docElem.compareDocumentPosition);
		contains$3 = hasCompare || rnative.test(docElem.contains) ? function (a, b) {
			var adown = a.nodeType === 9 ? a.documentElement : a, bup = b && b.parentNode;
			return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
		} : function (a, b) {
			if (b) {
				while (b = b.parentNode) {
					if (b === a) {
						return true;
					}
				}
			}
			return false;
		};
		sortOrder = hasCompare ? function (a, b) {
			if (a === b) {
				hasDuplicate = true;
				return 0;
			}
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if (compare) {
				return compare;
			}
			compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
			if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
				if (a === doc || a.ownerDocument === preferredDoc && contains$3(preferredDoc, a)) {
					return -1;
				}
				if (b === doc || b.ownerDocument === preferredDoc && contains$3(preferredDoc, b)) {
					return 1;
				}
				return sortInput ? indexOf$2.call(sortInput, a) - indexOf$2.call(sortInput, b) : 0;
			}
			return compare & 4 ? -1 : 1;
		} : function (a, b) {
			if (a === b) {
				hasDuplicate = true;
				return 0;
			}
			var cur, i = 0, aup = a.parentNode, bup = b.parentNode, ap = [a], bp = [b];
			if (!aup || !bup) {
				return a === doc ? -1 : b === doc ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf$2.call(sortInput, a) - indexOf$2.call(sortInput, b) : 0;
			} else if (aup === bup) {
				return siblingCheck(a, b);
			}
			cur = a;
			while (cur = cur.parentNode) {
				ap.unshift(cur);
			}
			cur = b;
			while (cur = cur.parentNode) {
				bp.unshift(cur);
			}
			while (ap[i] === bp[i]) {
				i++;
			}
			return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
		};
		return doc;
	};
	Sizzle.matches = function (expr, elements) {
		return Sizzle(expr, null, null, elements);
	};
	Sizzle.matchesSelector = function (elem, expr) {
		if ((elem.ownerDocument || elem) !== document$1) {
			setDocument(elem);
		}
		expr = expr.replace(rattributeQuotes, '=\'$1\']');
		if (support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
			try {
				var ret = matches.call(elem, expr);
				if (ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11) {
					return ret;
				}
			} catch (e) {
			}
		}
		return Sizzle(expr, document$1, null, [elem]).length > 0;
	};
	Sizzle.contains = function (context, elem) {
		if ((context.ownerDocument || context) !== document$1) {
			setDocument(context);
		}
		return contains$3(context, elem);
	};
	Sizzle.attr = function (elem, name) {
		if ((elem.ownerDocument || elem) !== document$1) {
			setDocument(elem);
		}
		var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
		return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
	};
	Sizzle.error = function (msg) {
		throw new Error('Syntax error, unrecognized expression: ' + msg);
	};
	Sizzle.uniqueSort = function (results) {
		var elem, duplicates = [], j = 0, i = 0;
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice(0);
		results.sort(sortOrder);
		if (hasDuplicate) {
			while (elem = results[i++]) {
				if (elem === results[i]) {
					j = duplicates.push(i);
				}
			}
			while (j--) {
				results.splice(duplicates[j], 1);
			}
		}
		sortInput = null;
		return results;
	};
	getText = Sizzle.getText = function (elem) {
		var node, ret = '', i = 0, nodeType = elem.nodeType;
		if (!nodeType) {
			while (node = elem[i++]) {
				ret += getText(node);
			}
		} else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
			if (typeof elem.textContent === 'string') {
				return elem.textContent;
			} else {
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText(elem);
				}
			}
		} else if (nodeType === 3 || nodeType === 4) {
			return elem.nodeValue;
		}
		return ret;
	};
	Expr = Sizzle.selectors = {
		cacheLength: 50,
		createPseudo: markFunction,
		match: matchExpr,
		attrHandle: {},
		find: {},
		relative: {
			'>': {
				dir: 'parentNode',
				first: true
			},
			' ': { dir: 'parentNode' },
			'+': {
				dir: 'previousSibling',
				first: true
			},
			'~': { dir: 'previousSibling' }
		},
		preFilter: {
			ATTR: function (match) {
				match[1] = match[1].replace(runescape, funescape);
				match[3] = (match[3] || match[4] || match[5] || '').replace(runescape, funescape);
				if (match[2] === '~=') {
					match[3] = ' ' + match[3] + ' ';
				}
				return match.slice(0, 4);
			},
			CHILD: function (match) {
				match[1] = match[1].toLowerCase();
				if (match[1].slice(0, 3) === 'nth') {
					if (!match[3]) {
						Sizzle.error(match[0]);
					}
					match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === 'even' || match[3] === 'odd'));
					match[5] = +(match[7] + match[8] || match[3] === 'odd');
				} else if (match[3]) {
					Sizzle.error(match[0]);
				}
				return match;
			},
			PSEUDO: function (match) {
				var excess, unquoted = !match[6] && match[2];
				if (matchExpr.CHILD.test(match[0])) {
					return null;
				}
				if (match[3]) {
					match[2] = match[4] || match[5] || '';
				} else if (unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(')', unquoted.length - excess) - unquoted.length)) {
					match[0] = match[0].slice(0, excess);
					match[2] = unquoted.slice(0, excess);
				}
				return match.slice(0, 3);
			}
		},
		filter: {
			TAG: function (nodeNameSelector) {
				var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
				return nodeNameSelector === '*' ? function () {
					return true;
				} : function (elem) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
			},
			CLASS: function (className) {
				var pattern = classCache[className + ' '];
				return pattern || (pattern = new RegExp('(^|' + whitespace + ')' + className + '(' + whitespace + '|$)')) && classCache(className, function (elem) {
					return pattern.test(typeof elem.className === 'string' && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute('class') || '');
				});
			},
			ATTR: function (name, operator, check) {
				return function (elem) {
					var result = Sizzle.attr(elem, name);
					if (result == null) {
						return operator === '!=';
					}
					if (!operator) {
						return true;
					}
					result += '';
					return operator === '=' ? result === check : operator === '!=' ? result !== check : operator === '^=' ? check && result.indexOf(check) === 0 : operator === '*=' ? check && result.indexOf(check) > -1 : operator === '$=' ? check && result.slice(-check.length) === check : operator === '~=' ? (' ' + result + ' ').indexOf(check) > -1 : operator === '|=' ? result === check || result.slice(0, check.length + 1) === check + '-' : false;
				};
			},
			CHILD: function (type, what, argument, first, last) {
				var simple = type.slice(0, 3) !== 'nth', forward = type.slice(-4) !== 'last', ofType = what === 'of-type';
				return first === 1 && last === 0 ? function (elem) {
					return !!elem.parentNode;
				} : function (elem, context, xml) {
					var cache, outerCache, node, diff, nodeIndex, start, dir = simple !== forward ? 'nextSibling' : 'previousSibling', parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType;
					if (parent) {
						if (simple) {
							while (dir) {
								node = elem;
								while (node = node[dir]) {
									if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
										return false;
									}
								}
								start = dir = type === 'only' && !start && 'nextSibling';
							}
							return true;
						}
						start = [forward ? parent.firstChild : parent.lastChild];
						if (forward && useCache) {
							outerCache = parent[expando] || (parent[expando] = {});
							cache = outerCache[type] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[nodeIndex];
							while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
								if (node.nodeType === 1 && ++diff && node === elem) {
									outerCache[type] = [
										dirruns,
										nodeIndex,
										diff
									];
									break;
								}
							}
						} else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) {
							diff = cache[1];
						} else {
							while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
								if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
									if (useCache) {
										(node[expando] || (node[expando] = {}))[type] = [
											dirruns,
											diff
										];
									}
									if (node === elem) {
										break;
									}
								}
							}
						}
						diff -= last;
						return diff === first || diff % first === 0 && diff / first >= 0;
					}
				};
			},
			PSEUDO: function (pseudo, argument) {
				var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error('unsupported pseudo: ' + pseudo);
				if (fn[expando]) {
					return fn(argument);
				}
				if (fn.length > 1) {
					args = [
						pseudo,
						pseudo,
						'',
						argument
					];
					return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function (seed, matches) {
						var idx, matched = fn(seed, argument), i = matched.length;
						while (i--) {
							idx = indexOf$2.call(seed, matched[i]);
							seed[idx] = !(matches[idx] = matched[i]);
						}
					}) : function (elem) {
						return fn(elem, 0, args);
					};
				}
				return fn;
			}
		},
		pseudos: {
			not: markFunction(function (selector) {
				var input = [], results = [], matcher = compile(selector.replace(rtrim, '$1'));
				return matcher[expando] ? markFunction(function (seed, matches, context, xml) {
					var elem, unmatched = matcher(seed, null, xml, []), i = seed.length;
					while (i--) {
						if (elem = unmatched[i]) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) : function (elem, context, xml) {
					input[0] = elem;
					matcher(input, null, xml, results);
					return !results.pop();
				};
			}),
			has: markFunction(function (selector) {
				return function (elem) {
					return Sizzle(selector, elem).length > 0;
				};
			}),
			contains: markFunction(function (text) {
				text = text.replace(runescape, funescape);
				return function (elem) {
					return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
				};
			}),
			lang: markFunction(function (lang) {
				if (!ridentifier.test(lang || '')) {
					Sizzle.error('unsupported lang: ' + lang);
				}
				lang = lang.replace(runescape, funescape).toLowerCase();
				return function (elem) {
					var elemLang;
					do {
						if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute('xml:lang') || elem.getAttribute('lang')) {
							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf(lang + '-') === 0;
						}
					} while ((elem = elem.parentNode) && elem.nodeType === 1);
					return false;
				};
			}),
			target: function (elem) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice(1) === elem.id;
			},
			root: function (elem) {
				return elem === docElem;
			},
			focus: function (elem) {
				return elem === document$1.activeElement && (!document$1.hasFocus || document$1.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},
			enabled: function (elem) {
				return elem.disabled === false;
			},
			disabled: function (elem) {
				return elem.disabled === true;
			},
			checked: function (elem) {
				var nodeName = elem.nodeName.toLowerCase();
				return nodeName === 'input' && !!elem.checked || nodeName === 'option' && !!elem.selected;
			},
			selected: function (elem) {
				if (elem.parentNode) {
					elem.parentNode.selectedIndex;
				}
				return elem.selected === true;
			},
			empty: function (elem) {
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					if (elem.nodeType < 6) {
						return false;
					}
				}
				return true;
			},
			parent: function (elem) {
				return !Expr.pseudos.empty(elem);
			},
			header: function (elem) {
				return rheader.test(elem.nodeName);
			},
			input: function (elem) {
				return rinputs.test(elem.nodeName);
			},
			button: function (elem) {
				var name = elem.nodeName.toLowerCase();
				return name === 'input' && elem.type === 'button' || name === 'button';
			},
			text: function (elem) {
				var attr;
				return elem.nodeName.toLowerCase() === 'input' && elem.type === 'text' && ((attr = elem.getAttribute('type')) == null || attr.toLowerCase() === 'text');
			},
			first: createPositionalPseudo(function () {
				return [0];
			}),
			last: createPositionalPseudo(function (matchIndexes, length) {
				return [length - 1];
			}),
			eq: createPositionalPseudo(function (matchIndexes, length, argument) {
				return [argument < 0 ? argument + length : argument];
			}),
			even: createPositionalPseudo(function (matchIndexes, length) {
				var i = 0;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			odd: createPositionalPseudo(function (matchIndexes, length) {
				var i = 1;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			lt: createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; --i >= 0;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			gt: createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; ++i < length;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			})
		}
	};
	Expr.pseudos.nth = Expr.pseudos.eq;
	each([
		'radio',
		'checkbox',
		'file',
		'password',
		'image'
	], function (i) {
		Expr.pseudos[i] = createInputPseudo(i);
	});
	each([
		'submit',
		'reset'
	], function (i) {
		Expr.pseudos[i] = createButtonPseudo(i);
	});
	function setFilters() {
	}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();
	tokenize = Sizzle.tokenize = function (selector, parseOnly) {
		var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + ' '];
		if (cached) {
			return parseOnly ? 0 : cached.slice(0);
		}
		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;
		while (soFar) {
			if (!matched || (match = rcomma.exec(soFar))) {
				if (match) {
					soFar = soFar.slice(match[0].length) || soFar;
				}
				groups.push(tokens = []);
			}
			matched = false;
			if (match = rcombinators.exec(soFar)) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: match[0].replace(rtrim, ' ')
				});
				soFar = soFar.slice(matched.length);
			}
			for (type in Expr.filter) {
				if (!Expr.filter.hasOwnProperty(type)) {
					continue;
				}
				if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice(matched.length);
				}
			}
			if (!matched) {
				break;
			}
		}
		return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
	};
	function toSelector(tokens) {
		var i = 0, len = tokens.length, selector = '';
		for (; i < len; i++) {
			selector += tokens[i].value;
		}
		return selector;
	}
	function addCombinator(matcher, combinator, base) {
		var dir = combinator.dir, checkNonElements = base && dir === 'parentNode', doneName = done++;
		return combinator.first ? function (elem, context, xml) {
			while (elem = elem[dir]) {
				if (elem.nodeType === 1 || checkNonElements) {
					return matcher(elem, context, xml);
				}
			}
		} : function (elem, context, xml) {
			var oldCache, outerCache, newCache = [
				dirruns,
				doneName
			];
			if (xml) {
				while (elem = elem[dir]) {
					if (elem.nodeType === 1 || checkNonElements) {
						if (matcher(elem, context, xml)) {
							return true;
						}
					}
				}
			} else {
				while (elem = elem[dir]) {
					if (elem.nodeType === 1 || checkNonElements) {
						outerCache = elem[expando] || (elem[expando] = {});
						if ((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
							return newCache[2] = oldCache[2];
						} else {
							outerCache[dir] = newCache;
							if (newCache[2] = matcher(elem, context, xml)) {
								return true;
							}
						}
					}
				}
			}
		};
	}
	function elementMatcher(matchers) {
		return matchers.length > 1 ? function (elem, context, xml) {
			var i = matchers.length;
			while (i--) {
				if (!matchers[i](elem, context, xml)) {
					return false;
				}
			}
			return true;
		} : matchers[0];
	}
	function multipleContexts(selector, contexts, results) {
		var i = 0, len = contexts.length;
		for (; i < len; i++) {
			Sizzle(selector, contexts[i], results);
		}
		return results;
	}
	function condense(unmatched, map, filter, context, xml) {
		var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = map != null;
		for (; i < len; i++) {
			if (elem = unmatched[i]) {
				if (!filter || filter(elem, context, xml)) {
					newUnmatched.push(elem);
					if (mapped) {
						map.push(i);
					}
				}
			}
		}
		return newUnmatched;
	}
	function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
		if (postFilter && !postFilter[expando]) {
			postFilter = setMatcher(postFilter);
		}
		if (postFinder && !postFinder[expando]) {
			postFinder = setMatcher(postFinder, postSelector);
		}
		return markFunction(function (seed, results, context, xml) {
			var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(selector || '*', context.nodeType ? [context] : context, []), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems, matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
			if (matcher) {
				matcher(matcherIn, matcherOut, context, xml);
			}
			if (postFilter) {
				temp = condense(matcherOut, postMap);
				postFilter(temp, [], context, xml);
				i = temp.length;
				while (i--) {
					if (elem = temp[i]) {
						matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
					}
				}
			}
			if (seed) {
				if (postFinder || preFilter) {
					if (postFinder) {
						temp = [];
						i = matcherOut.length;
						while (i--) {
							if (elem = matcherOut[i]) {
								temp.push(matcherIn[i] = elem);
							}
						}
						postFinder(null, matcherOut = [], temp, xml);
					}
					i = matcherOut.length;
					while (i--) {
						if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf$2.call(seed, elem) : preMap[i]) > -1) {
							seed[temp] = !(results[temp] = elem);
						}
					}
				}
			} else {
				matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
				if (postFinder) {
					postFinder(null, results, matcherOut, xml);
				} else {
					push.apply(results, matcherOut);
				}
			}
		});
	}
	function matcherFromTokens(tokens) {
		var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[' '], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function (elem) {
			return elem === checkContext;
		}, implicitRelative, true), matchAnyContext = addCombinator(function (elem) {
			return indexOf$2.call(checkContext, elem) > -1;
		}, implicitRelative, true), matchers = [function (elem, context, xml) {
			return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
		}];
		for (; i < len; i++) {
			if (matcher = Expr.relative[tokens[i].type]) {
				matchers = [addCombinator(elementMatcher(matchers), matcher)];
			} else {
				matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
				if (matcher[expando]) {
					j = ++i;
					for (; j < len; j++) {
						if (Expr.relative[tokens[j].type]) {
							break;
						}
					}
					return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({ value: tokens[i - 2].type === ' ' ? '*' : '' })).replace(rtrim, '$1'), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
				}
				matchers.push(matcher);
			}
		}
		return elementMatcher(matchers);
	}
	function matcherFromGroupMatchers(elementMatchers, setMatchers) {
		var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function (seed, context, xml, results, outermost) {
			var elem, j, matcher, matchedCount = 0, i = '0', unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG('*', outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
			if (outermost) {
				outermostContext = context !== document$1 && context;
			}
			for (; i !== len && (elem = elems[i]) != null; i++) {
				if (byElement && elem) {
					j = 0;
					while (matcher = elementMatchers[j++]) {
						if (matcher(elem, context, xml)) {
							results.push(elem);
							break;
						}
					}
					if (outermost) {
						dirruns = dirrunsUnique;
					}
				}
				if (bySet) {
					if (elem = !matcher && elem) {
						matchedCount--;
					}
					if (seed) {
						unmatched.push(elem);
					}
				}
			}
			matchedCount += i;
			if (bySet && i !== matchedCount) {
				j = 0;
				while (matcher = setMatchers[j++]) {
					matcher(unmatched, setMatched, context, xml);
				}
				if (seed) {
					if (matchedCount > 0) {
						while (i--) {
							if (!(unmatched[i] || setMatched[i])) {
								setMatched[i] = pop.call(results);
							}
						}
					}
					setMatched = condense(setMatched);
				}
				push.apply(results, setMatched);
				if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
					Sizzle.uniqueSort(results);
				}
			}
			if (outermost) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}
			return unmatched;
		};
		return bySet ? markFunction(superMatcher) : superMatcher;
	}
	compile = Sizzle.compile = function (selector, match) {
		var i, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + ' '];
		if (!cached) {
			if (!match) {
				match = tokenize(selector);
			}
			i = match.length;
			while (i--) {
				cached = matcherFromTokens(match[i]);
				if (cached[expando]) {
					setMatchers.push(cached);
				} else {
					elementMatchers.push(cached);
				}
			}
			cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
			cached.selector = selector;
		}
		return cached;
	};
	select = Sizzle.select = function (selector, context, results, seed) {
		var i, tokens, token, type, find, compiled = typeof selector === 'function' && selector, match = !seed && tokenize(selector = compiled.selector || selector);
		results = results || [];
		if (match.length === 1) {
			tokens = match[0] = match[0].slice(0);
			if (tokens.length > 2 && (token = tokens[0]).type === 'ID' && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
				context = (Expr.find.ID(token.matches[0].replace(runescape, funescape), context) || [])[0];
				if (!context) {
					return results;
				} else if (compiled) {
					context = context.parentNode;
				}
				selector = selector.slice(tokens.shift().value.length);
			}
			i = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
			while (i--) {
				token = tokens[i];
				if (Expr.relative[type = token.type]) {
					break;
				}
				if (find = Expr.find[type]) {
					if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {
						tokens.splice(i, 1);
						selector = seed.length && toSelector(tokens);
						if (!selector) {
							push.apply(results, seed);
							return results;
						}
						break;
					}
				}
			}
		}
		(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, rsibling.test(selector) && testContext(context.parentNode) || context);
		return results;
	};
	support.sortStable = expando.split('').sort(sortOrder).join('') === expando;
	support.detectDuplicates = !!hasDuplicate;
	setDocument();
	support.sortDetached = true;

	var doc = document, push$1 = Array.prototype.push, slice$1 = Array.prototype.slice;
	var rquickExpr$1 = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;
	var Event = EventUtils.Event;
	var skipUniques = Tools.makeMap('children,contents,next,prev');
	var isDefined = function (obj) {
		return typeof obj !== 'undefined';
	};
	var isString$1 = function (obj) {
		return typeof obj === 'string';
	};
	var isWindow = function (obj) {
		return obj && obj === obj.window;
	};
	var createFragment = function (html, fragDoc) {
		fragDoc = fragDoc || doc;
		var container = fragDoc.createElement('div');
		var frag = fragDoc.createDocumentFragment();
		container.innerHTML = html;
		var node;
		while (node = container.firstChild) {
			frag.appendChild(node);
		}
		return frag;
	};
	var domManipulate = function (targetNodes, sourceItem, callback, reverse) {
		var i;
		if (isString$1(sourceItem)) {
			sourceItem = createFragment(sourceItem, getElementDocument(targetNodes[0]));
		} else if (sourceItem.length && !sourceItem.nodeType) {
			sourceItem = DomQuery.makeArray(sourceItem);
			if (reverse) {
				for (i = sourceItem.length - 1; i >= 0; i--) {
					domManipulate(targetNodes, sourceItem[i], callback, reverse);
				}
			} else {
				for (i = 0; i < sourceItem.length; i++) {
					domManipulate(targetNodes, sourceItem[i], callback, reverse);
				}
			}
			return targetNodes;
		}
		if (sourceItem.nodeType) {
			i = targetNodes.length;
			while (i--) {
				callback.call(targetNodes[i], sourceItem);
			}
		}
		return targetNodes;
	};
	var hasClass = function (node, className) {
		return node && className && (' ' + node.className + ' ').indexOf(' ' + className + ' ') !== -1;
	};
	var wrap$1 = function (elements, wrapper, all) {
		var lastParent, newWrapper;
		wrapper = DomQuery(wrapper)[0];
		elements.each(function () {
			var self = this;
			if (!all || lastParent !== self.parentNode) {
				lastParent = self.parentNode;
				newWrapper = wrapper.cloneNode(false);
				self.parentNode.insertBefore(newWrapper, self);
				newWrapper.appendChild(self);
			} else {
				newWrapper.appendChild(self);
			}
		});
		return elements;
	};
	var numericCssMap = Tools.makeMap('fillOpacity fontWeight lineHeight opacity orphans widows zIndex zoom', ' ');
	var booleanMap = Tools.makeMap('checked compact declare defer disabled ismap multiple nohref noshade nowrap readonly selected', ' ');
	var propFix = {
		for: 'htmlFor',
		class: 'className',
		readonly: 'readOnly'
	};
	var cssFix = { float: 'cssFloat' };
	var attrHooks = {}, cssHooks = {};
	var DomQueryConstructor = function (selector, context) {
		return new DomQuery.fn.init(selector, context);
	};
	var inArray$1 = function (item, array) {
		var i;
		if (array.indexOf) {
			return array.indexOf(item);
		}
		i = array.length;
		while (i--) {
			if (array[i] === item) {
				return i;
			}
		}
		return -1;
	};
	var whiteSpaceRegExp$2 = /^\s*|\s*$/g;
	var trim$3 = function (str) {
		return str === null || str === undefined ? '' : ('' + str).replace(whiteSpaceRegExp$2, '');
	};
	var each$4 = function (obj, callback) {
		var length, key, i, value;
		if (obj) {
			length = obj.length;
			if (length === undefined) {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						value = obj[key];
						if (callback.call(value, key, value) === false) {
							break;
						}
					}
				}
			} else {
				for (i = 0; i < length; i++) {
					value = obj[i];
					if (callback.call(value, i, value) === false) {
						break;
					}
				}
			}
		}
		return obj;
	};
	var grep = function (array, callback) {
		var out = [];
		each$4(array, function (i, item) {
			if (callback(item, i)) {
				out.push(item);
			}
		});
		return out;
	};
	var getElementDocument = function (element) {
		if (!element) {
			return doc;
		}
		if (element.nodeType === 9) {
			return element;
		}
		return element.ownerDocument;
	};
	DomQueryConstructor.fn = DomQueryConstructor.prototype = {
		constructor: DomQueryConstructor,
		selector: '',
		context: null,
		length: 0,
		init: function (selector, context) {
			var self = this;
			var match, node;
			if (!selector) {
				return self;
			}
			if (selector.nodeType) {
				self.context = self[0] = selector;
				self.length = 1;
				return self;
			}
			if (context && context.nodeType) {
				self.context = context;
			} else {
				if (context) {
					return DomQuery(selector).attr(context);
				}
				self.context = context = document;
			}
			if (isString$1(selector)) {
				self.selector = selector;
				if (selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' && selector.length >= 3) {
					match = [
						null,
						selector,
						null
					];
				} else {
					match = rquickExpr$1.exec(selector);
				}
				if (match) {
					if (match[1]) {
						node = createFragment(selector, getElementDocument(context)).firstChild;
						while (node) {
							push$1.call(self, node);
							node = node.nextSibling;
						}
					} else {
						node = getElementDocument(context).getElementById(match[2]);
						if (!node) {
							return self;
						}
						if (node.id !== match[2]) {
							return self.find(selector);
						}
						self.length = 1;
						self[0] = node;
					}
				} else {
					return DomQuery(context).find(selector);
				}
			} else {
				this.add(selector, false);
			}
			return self;
		},
		toArray: function () {
			return Tools.toArray(this);
		},
		add: function (items, sort) {
			var self = this;
			var nodes, i;
			if (isString$1(items)) {
				return self.add(DomQuery(items));
			}
			if (sort !== false) {
				nodes = DomQuery.unique(self.toArray().concat(DomQuery.makeArray(items)));
				self.length = nodes.length;
				for (i = 0; i < nodes.length; i++) {
					self[i] = nodes[i];
				}
			} else {
				push$1.apply(self, DomQuery.makeArray(items));
			}
			return self;
		},
		attr: function (name, value) {
			var self = this;
			var hook;
			if (typeof name === 'object') {
				each$4(name, function (name, value) {
					self.attr(name, value);
				});
			} else if (isDefined(value)) {
				this.each(function () {
					var hook;
					if (this.nodeType === 1) {
						hook = attrHooks[name];
						if (hook && hook.set) {
							hook.set(this, value);
							return;
						}
						if (value === null) {
							this.removeAttribute(name, 2);
						} else {
							this.setAttribute(name, value, 2);
						}
					}
				});
			} else {
				if (self[0] && self[0].nodeType === 1) {
					hook = attrHooks[name];
					if (hook && hook.get) {
						return hook.get(self[0], name);
					}
					if (booleanMap[name]) {
						return self.prop(name) ? name : undefined;
					}
					value = self[0].getAttribute(name, 2);
					if (value === null) {
						value = undefined;
					}
				}
				return value;
			}
			return self;
		},
		removeAttr: function (name) {
			return this.attr(name, null);
		},
		prop: function (name, value) {
			var self = this;
			name = propFix[name] || name;
			if (typeof name === 'object') {
				each$4(name, function (name, value) {
					self.prop(name, value);
				});
			} else if (isDefined(value)) {
				this.each(function () {
					if (this.nodeType === 1) {
						this[name] = value;
					}
				});
			} else {
				if (self[0] && self[0].nodeType && name in self[0]) {
					return self[0][name];
				}
				return value;
			}
			return self;
		},
		css: function (name, value) {
			var self = this;
			var elm, hook;
			var camel = function (name) {
				return name.replace(/-(\D)/g, function (a, b) {
					return b.toUpperCase();
				});
			};
			var dashed = function (name) {
				return name.replace(/[A-Z]/g, function (a) {
					return '-' + a;
				});
			};
			if (typeof name === 'object') {
				each$4(name, function (name, value) {
					self.css(name, value);
				});
			} else {
				if (isDefined(value)) {
					name = camel(name);
					if (typeof value === 'number' && !numericCssMap[name]) {
						value = value.toString() + 'px';
					}
					self.each(function () {
						var style = this.style;
						hook = cssHooks[name];
						if (hook && hook.set) {
							hook.set(this, value);
							return;
						}
						try {
							this.style[cssFix[name] || name] = value;
						} catch (ex) {
						}
						if (value === null || value === '') {
							if (style.removeProperty) {
								style.removeProperty(dashed(name));
							} else {
								style.removeAttribute(name);
							}
						}
					});
				} else {
					elm = self[0];
					hook = cssHooks[name];
					if (hook && hook.get) {
						return hook.get(elm);
					}
					if (elm.ownerDocument.defaultView) {
						try {
							return elm.ownerDocument.defaultView.getComputedStyle(elm, null).getPropertyValue(dashed(name));
						} catch (ex) {
							return undefined;
						}
					} else if (elm.currentStyle) {
						return elm.currentStyle[camel(name)];
					} else {
						return '';
					}
				}
			}
			return self;
		},
		remove: function () {
			var self = this;
			var node, i = this.length;
			while (i--) {
				node = self[i];
				Event.clean(node);
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
			return this;
		},
		empty: function () {
			var self = this;
			var node, i = this.length;
			while (i--) {
				node = self[i];
				while (node.firstChild) {
					node.removeChild(node.firstChild);
				}
			}
			return this;
		},
		html: function (value) {
			var self = this;
			var i;
			if (isDefined(value)) {
				i = self.length;
				try {
					while (i--) {
						self[i].innerHTML = value;
					}
				} catch (ex) {
					DomQuery(self[i]).empty().append(value);
				}
				return self;
			}
			return self[0] ? self[0].innerHTML : '';
		},
		text: function (value) {
			var self = this;
			var i;
			if (isDefined(value)) {
				i = self.length;
				while (i--) {
					if ('innerText' in self[i]) {
						self[i].innerText = value;
					} else {
						self[0].textContent = value;
					}
				}
				return self;
			}
			return self[0] ? self[0].innerText || self[0].textContent : '';
		},
		append: function () {
			return domManipulate(this, arguments, function (node) {
				if (this.nodeType === 1 || this.host && this.host.nodeType === 1) {
					this.appendChild(node);
				}
			});
		},
		prepend: function () {
			return domManipulate(this, arguments, function (node) {
				if (this.nodeType === 1 || this.host && this.host.nodeType === 1) {
					this.insertBefore(node, this.firstChild);
				}
			}, true);
		},
		before: function () {
			var self = this;
			if (self[0] && self[0].parentNode) {
				return domManipulate(self, arguments, function (node) {
					this.parentNode.insertBefore(node, this);
				});
			}
			return self;
		},
		after: function () {
			var self = this;
			if (self[0] && self[0].parentNode) {
				return domManipulate(self, arguments, function (node) {
					this.parentNode.insertBefore(node, this.nextSibling);
				}, true);
			}
			return self;
		},
		appendTo: function (val) {
			DomQuery(val).append(this);
			return this;
		},
		prependTo: function (val) {
			DomQuery(val).prepend(this);
			return this;
		},
		replaceWith: function (content) {
			return this.before(content).remove();
		},
		wrap: function (content) {
			return wrap$1(this, content);
		},
		wrapAll: function (content) {
			return wrap$1(this, content, true);
		},
		wrapInner: function (content) {
			this.each(function () {
				DomQuery(this).contents().wrapAll(content);
			});
			return this;
		},
		unwrap: function () {
			return this.parent().each(function () {
				DomQuery(this).replaceWith(this.childNodes);
			});
		},
		clone: function () {
			var result = [];
			this.each(function () {
				result.push(this.cloneNode(true));
			});
			return DomQuery(result);
		},
		addClass: function (className) {
			return this.toggleClass(className, true);
		},
		removeClass: function (className) {
			return this.toggleClass(className, false);
		},
		toggleClass: function (className, state) {
			var self = this;
			if (typeof className !== 'string') {
				return self;
			}
			if (className.indexOf(' ') !== -1) {
				each$4(className.split(' '), function () {
					self.toggleClass(this, state);
				});
			} else {
				self.each(function (index, node) {
					var classState = hasClass(node, className);
					if (classState !== state) {
						var existingClassName = node.className;
						if (classState) {
							node.className = trim$3((' ' + existingClassName + ' ').replace(' ' + className + ' ', ' '));
						} else {
							node.className += existingClassName ? ' ' + className : className;
						}
					}
				});
			}
			return self;
		},
		hasClass: function (className) {
			return hasClass(this[0], className);
		},
		each: function (callback) {
			return each$4(this, callback);
		},
		on: function (name, callback) {
			return this.each(function () {
				Event.bind(this, name, callback);
			});
		},
		off: function (name, callback) {
			return this.each(function () {
				Event.unbind(this, name, callback);
			});
		},
		trigger: function (name) {
			return this.each(function () {
				if (typeof name === 'object') {
					Event.fire(this, name.type, name);
				} else {
					Event.fire(this, name);
				}
			});
		},
		show: function () {
			return this.css('display', '');
		},
		hide: function () {
			return this.css('display', 'none');
		},
		slice: function () {
			return new DomQuery(slice$1.apply(this, arguments));
		},
		eq: function (index) {
			return index === -1 ? this.slice(index) : this.slice(index, +index + 1);
		},
		first: function () {
			return this.eq(0);
		},
		last: function () {
			return this.eq(-1);
		},
		find: function (selector) {
			var i, l;
			var ret = [];
			for (i = 0, l = this.length; i < l; i++) {
				DomQuery.find(selector, this[i], ret);
			}
			return DomQuery(ret);
		},
		filter: function (selector) {
			if (typeof selector === 'function') {
				return DomQuery(grep(this.toArray(), function (item, i) {
					return selector(i, item);
				}));
			}
			return DomQuery(DomQuery.filter(selector, this.toArray()));
		},
		closest: function (selector) {
			var result = [];
			if (selector instanceof DomQuery) {
				selector = selector[0];
			}
			this.each(function (i, node) {
				while (node) {
					if (typeof selector === 'string' && DomQuery(node).is(selector)) {
						result.push(node);
						break;
					} else if (node === selector) {
						result.push(node);
						break;
					}
					node = node.parentNode;
				}
			});
			return DomQuery(result);
		},
		offset: function (offset) {
			var elm, doc, docElm;
			var x = 0, y = 0, pos;
			if (!offset) {
				elm = this[0];
				if (elm) {
					doc = elm.ownerDocument;
					docElm = doc.documentElement;
					if (elm.getBoundingClientRect) {
						pos = elm.getBoundingClientRect();
						x = pos.left + (docElm.scrollLeft || doc.body.scrollLeft) - docElm.clientLeft;
						y = pos.top + (docElm.scrollTop || doc.body.scrollTop) - docElm.clientTop;
					}
				}
				return {
					left: x,
					top: y
				};
			}
			return this.css(offset);
		},
		push: push$1,
		sort: Array.prototype.sort,
		splice: Array.prototype.splice
	};
	Tools.extend(DomQueryConstructor, {
		extend: Tools.extend,
		makeArray: function (object) {
			if (isWindow(object) || object.nodeType) {
				return [object];
			}
			return Tools.toArray(object);
		},
		inArray: inArray$1,
		isArray: Tools.isArray,
		each: each$4,
		trim: trim$3,
		grep: grep,
		find: Sizzle,
		expr: Sizzle.selectors,
		unique: Sizzle.uniqueSort,
		text: Sizzle.getText,
		contains: Sizzle.contains,
		filter: function (expr, elems, not) {
			var i = elems.length;
			if (not) {
				expr = ':not(' + expr + ')';
			}
			while (i--) {
				if (elems[i].nodeType !== 1) {
					elems.splice(i, 1);
				}
			}
			if (elems.length === 1) {
				elems = DomQuery.find.matchesSelector(elems[0], expr) ? [elems[0]] : [];
			} else {
				elems = DomQuery.find.matches(expr, elems);
			}
			return elems;
		}
	});
	var dir = function (el, prop, until) {
		var matched = [];
		var cur = el[prop];
		if (typeof until !== 'string' && until instanceof DomQuery) {
			until = until[0];
		}
		while (cur && cur.nodeType !== 9) {
			if (until !== undefined) {
				if (cur === until) {
					break;
				}
				if (typeof until === 'string' && DomQuery(cur).is(until)) {
					break;
				}
			}
			if (cur.nodeType === 1) {
				matched.push(cur);
			}
			cur = cur[prop];
		}
		return matched;
	};
	var sibling$1 = function (node, siblingName, nodeType, until) {
		var result = [];
		if (until instanceof DomQuery) {
			until = until[0];
		}
		for (; node; node = node[siblingName]) {
			if (nodeType && node.nodeType !== nodeType) {
				continue;
			}
			if (until !== undefined) {
				if (node === until) {
					break;
				}
				if (typeof until === 'string' && DomQuery(node).is(until)) {
					break;
				}
			}
			result.push(node);
		}
		return result;
	};
	var firstSibling = function (node, siblingName, nodeType) {
		for (node = node[siblingName]; node; node = node[siblingName]) {
			if (node.nodeType === nodeType) {
				return node;
			}
		}
		return null;
	};
	each$4({
		parent: function (node) {
			var parent = node.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function (node) {
			return dir(node, 'parentNode');
		},
		next: function (node) {
			return firstSibling(node, 'nextSibling', 1);
		},
		prev: function (node) {
			return firstSibling(node, 'previousSibling', 1);
		},
		children: function (node) {
			return sibling$1(node.firstChild, 'nextSibling', 1);
		},
		contents: function (node) {
			return Tools.toArray((node.nodeName === 'iframe' ? node.contentDocument || node.contentWindow.document : node).childNodes);
		}
	}, function (name, fn) {
		DomQueryConstructor.fn[name] = function (selector) {
			var self = this;
			var result = [];
			self.each(function () {
				var nodes = fn.call(result, this, selector, result);
				if (nodes) {
					if (DomQuery.isArray(nodes)) {
						result.push.apply(result, nodes);
					} else {
						result.push(nodes);
					}
				}
			});
			if (this.length > 1) {
				if (!skipUniques[name]) {
					result = DomQuery.unique(result);
				}
				if (name.indexOf('parents') === 0) {
					result = result.reverse();
				}
			}
			var wrappedResult = DomQuery(result);
			if (selector) {
				return wrappedResult.filter(selector);
			}
			return wrappedResult;
		};
	});
	each$4({
		parentsUntil: function (node, until) {
			return dir(node, 'parentNode', until);
		},
		nextUntil: function (node, until) {
			return sibling$1(node, 'nextSibling', 1, until).slice(1);
		},
		prevUntil: function (node, until) {
			return sibling$1(node, 'previousSibling', 1, until).slice(1);
		}
	}, function (name, fn) {
		DomQueryConstructor.fn[name] = function (selector, filter) {
			var self = this;
			var result = [];
			self.each(function () {
				var nodes = fn.call(result, this, selector, result);
				if (nodes) {
					if (DomQuery.isArray(nodes)) {
						result.push.apply(result, nodes);
					} else {
						result.push(nodes);
					}
				}
			});
			if (this.length > 1) {
				result = DomQuery.unique(result);
				if (name.indexOf('parents') === 0 || name === 'prevUntil') {
					result = result.reverse();
				}
			}
			var wrappedResult = DomQuery(result);
			if (filter) {
				return wrappedResult.filter(filter);
			}
			return wrappedResult;
		};
	});
	DomQueryConstructor.fn.is = function (selector) {
		return !!selector && this.filter(selector).length > 0;
	};
	DomQueryConstructor.fn.init.prototype = DomQueryConstructor.fn;
	DomQueryConstructor.overrideDefaults = function (callback) {
		var defaults;
		var sub = function (selector, context) {
			defaults = defaults || callback();
			if (arguments.length === 0) {
				selector = defaults.element;
			}
			if (!context) {
				context = defaults.context;
			}
			return new sub.fn.init(selector, context);
		};
		DomQuery.extend(sub, this);
		return sub;
	};
	DomQueryConstructor.attrHooks = attrHooks;
	DomQueryConstructor.cssHooks = cssHooks;
	var DomQuery = DomQueryConstructor;

	var each$5 = Tools.each;
	var grep$1 = Tools.grep;
	var isIE = Env.ie;
	var simpleSelectorRe = /^([a-z0-9],?)+$/i;
	var setupAttrHooks = function (styles, settings, getContext) {
		var keepValues = settings.keep_values;
		var keepUrlHook = {
			set: function ($elm, value, name) {
				if (settings.url_converter) {
					value = settings.url_converter.call(settings.url_converter_scope || getContext(), value, name, $elm[0]);
				}
				$elm.attr('data-mce-' + name, value).attr(name, value);
			},
			get: function ($elm, name) {
				return $elm.attr('data-mce-' + name) || $elm.attr(name);
			}
		};
		var attrHooks = {
			style: {
				set: function ($elm, value) {
					if (value !== null && typeof value === 'object') {
						$elm.css(value);
						return;
					}
					if (keepValues) {
						$elm.attr('data-mce-style', value);
					}
					if (value !== null && typeof value === 'string') {
						$elm.removeAttr('style');
						$elm.css(styles.parse(value));
					} else {
						$elm.attr('style', value);
					}
				},
				get: function ($elm) {
					var value = $elm.attr('data-mce-style') || $elm.attr('style');
					value = styles.serialize(styles.parse(value), $elm[0].nodeName);
					return value;
				}
			}
		};
		if (keepValues) {
			attrHooks.href = attrHooks.src = keepUrlHook;
		}
		return attrHooks;
	};
	var updateInternalStyleAttr = function (styles, $elm) {
		var rawValue = $elm.attr('style');
		var value = styles.serialize(styles.parse(rawValue), $elm[0].nodeName);
		if (!value) {
			value = null;
		}
		$elm.attr('data-mce-style', value);
	};
	var findNodeIndex = function (node, normalized) {
		var idx = 0, lastNodeType, nodeType;
		if (node) {
			for (lastNodeType = node.nodeType, node = node.previousSibling; node; node = node.previousSibling) {
				nodeType = node.nodeType;
				if (normalized && nodeType === 3) {
					if (nodeType === lastNodeType || !node.nodeValue.length) {
						continue;
					}
				}
				idx++;
				lastNodeType = nodeType;
			}
		}
		return idx;
	};
	function DOMUtils(doc, settings) {
		var _this = this;
		if (settings === void 0) {
			settings = {};
		}
		var addedStyles = {};
		var win = window;
		var files = {};
		var counter = 0;
		var stdMode = true;
		var boxModel = true;
		var styleSheetLoader = instance.forElement(SugarElement.fromDom(doc), {
			contentCssCors: settings.contentCssCors,
			referrerPolicy: settings.referrerPolicy
		});
		var boundEvents = [];
		var schema = settings.schema ? settings.schema : Schema({});
		var styles = Styles({
			url_converter: settings.url_converter,
			url_converter_scope: settings.url_converter_scope
		}, settings.schema);
		var events = settings.ownEvents ? new EventUtils() : EventUtils.Event;
		var blockElementsMap = schema.getBlockElements();
		var $ = DomQuery.overrideDefaults(function () {
			return {
				context: doc,
				element: self.getRoot()
			};
		});
		var isBlock = function (node) {
			if (typeof node === 'string') {
				return !!blockElementsMap[node];
			} else if (node) {
				var type = node.nodeType;
				if (type) {
					return !!(type === 1 && blockElementsMap[node.nodeName]);
				}
			}
			return false;
		};
		var get = function (elm) {
			return elm && doc && isString(elm) ? doc.getElementById(elm) : elm;
		};
		var $$ = function (elm) {
			return $(typeof elm === 'string' ? get(elm) : elm);
		};
		var getAttrib = function (elm, name, defaultVal) {
			var hook, value;
			var $elm = $$(elm);
			if ($elm.length) {
				hook = attrHooks[name];
				if (hook && hook.get) {
					value = hook.get($elm, name);
				} else {
					value = $elm.attr(name);
				}
			}
			if (typeof value === 'undefined') {
				value = defaultVal || '';
			}
			return value;
		};
		var getAttribs = function (elm) {
			var node = get(elm);
			if (!node) {
				return [];
			}
			return node.attributes;
		};
		var setAttrib = function (elm, name, value) {
			if (value === '') {
				value = null;
			}
			var $elm = $$(elm);
			var originalValue = $elm.attr(name);
			if (!$elm.length) {
				return;
			}
			var hook = attrHooks[name];
			if (hook && hook.set) {
				hook.set($elm, value, name);
			} else {
				$elm.attr(name, value);
			}
			if (originalValue !== value && settings.onSetAttrib) {
				settings.onSetAttrib({
					attrElm: $elm,
					attrName: name,
					attrValue: value
				});
			}
		};
		var clone = function (node, deep) {
			if (!isIE || node.nodeType !== 1 || deep) {
				return node.cloneNode(deep);
			} else {
				var clone_1 = doc.createElement(node.nodeName);
				each$5(getAttribs(node), function (attr) {
					setAttrib(clone_1, attr.nodeName, getAttrib(node, attr.nodeName));
				});
				return clone_1;
			}
		};
		var getRoot = function () {
			return settings.root_element || doc.body;
		};
		var getViewPort = function (argWin) {
			var vp = getBounds(argWin);
			return {
				x: vp.x,
				y: vp.y,
				w: vp.width,
				h: vp.height
			};
		};
		var getPos$1 = function (elm, rootElm) {
			return getPos(doc.body, get(elm), rootElm);
		};
		var setStyle = function (elm, name, value) {
			var $elm = isString(name) ? $$(elm).css(name, value) : $$(elm).css(name);
			if (settings.update_styles) {
				updateInternalStyleAttr(styles, $elm);
			}
		};
		var setStyles = function (elm, stylesArg) {
			var $elm = $$(elm).css(stylesArg);
			if (settings.update_styles) {
				updateInternalStyleAttr(styles, $elm);
			}
		};
		var getStyle = function (elm, name, computed) {
			var $elm = $$(elm);
			if (computed) {
				return $elm.css(name);
			}
			name = name.replace(/-(\D)/g, function (a, b) {
				return b.toUpperCase();
			});
			if (name === 'float') {
				name = Env.browser.isIE() ? 'styleFloat' : 'cssFloat';
			}
			return $elm[0] && $elm[0].style ? $elm[0].style[name] : undefined;
		};
		var getSize = function (elm) {
			var w, h;
			elm = get(elm);
			w = getStyle(elm, 'width');
			h = getStyle(elm, 'height');
			if (w.indexOf('px') === -1) {
				w = 0;
			}
			if (h.indexOf('px') === -1) {
				h = 0;
			}
			return {
				w: parseInt(w, 10) || elm.offsetWidth || elm.clientWidth,
				h: parseInt(h, 10) || elm.offsetHeight || elm.clientHeight
			};
		};
		var getRect = function (elm) {
			elm = get(elm);
			var pos = getPos$1(elm);
			var size = getSize(elm);
			return {
				x: pos.x,
				y: pos.y,
				w: size.w,
				h: size.h
			};
		};
		var is = function (elm, selector) {
			var i;
			if (!elm) {
				return false;
			}
			if (!Array.isArray(elm)) {
				if (selector === '*') {
					return elm.nodeType === 1;
				}
				if (simpleSelectorRe.test(selector)) {
					var selectors = selector.toLowerCase().split(/,/);
					var elmName = elm.nodeName.toLowerCase();
					for (i = selectors.length - 1; i >= 0; i--) {
						if (selectors[i] === elmName) {
							return true;
						}
					}
					return false;
				}
				if (elm.nodeType && elm.nodeType !== 1) {
					return false;
				}
			}
			var elms = !Array.isArray(elm) ? [elm] : elm;
			return Sizzle(selector, elms[0].ownerDocument || elms[0], null, elms).length > 0;
		};
		var getParents = function (elm, selector, root, collect) {
			var result = [];
			var selectorVal;
			var node = get(elm);
			collect = collect === undefined;
			root = root || (getRoot().nodeName !== 'BODY' ? getRoot().parentNode : null);
			if (Tools.is(selector, 'string')) {
				selectorVal = selector;
				if (selector === '*') {
					selector = function (node) {
						return node.nodeType === 1;
					};
				} else {
					selector = function (node) {
						return is(node, selectorVal);
					};
				}
			}
			while (node) {
				if (node === root || isNullable(node.nodeType) || isDocument$1(node) || isDocumentFragment$1(node)) {
					break;
				}
				if (!selector || typeof selector === 'function' && selector(node)) {
					if (collect) {
						result.push(node);
					} else {
						return [node];
					}
				}
				node = node.parentNode;
			}
			return collect ? result : null;
		};
		var getParent = function (node, selector, root) {
			var parents = getParents(node, selector, root, false);
			return parents && parents.length > 0 ? parents[0] : null;
		};
		var _findSib = function (node, selector, name) {
			var func = selector;
			if (node) {
				if (typeof selector === 'string') {
					func = function (node) {
						return is(node, selector);
					};
				}
				for (node = node[name]; node; node = node[name]) {
					if (typeof func === 'function' && func(node)) {
						return node;
					}
				}
			}
			return null;
		};
		var getNext = function (node, selector) {
			return _findSib(node, selector, 'nextSibling');
		};
		var getPrev = function (node, selector) {
			return _findSib(node, selector, 'previousSibling');
		};
		var select = function (selector, scope) {
			return Sizzle(selector, get(scope) || settings.root_element || doc, []);
		};
		var run = function (elm, func, scope) {
			var result;
			var node = typeof elm === 'string' ? get(elm) : elm;
			if (!node) {
				return false;
			}
			if (Tools.isArray(node) && (node.length || node.length === 0)) {
				result = [];
				each$5(node, function (elm, i) {
					if (elm) {
						result.push(func.call(scope, typeof elm === 'string' ? get(elm) : elm, i));
					}
				});
				return result;
			}
			var context = scope ? scope : _this;
			return func.call(context, node);
		};
		var setAttribs = function (elm, attrs) {
			$$(elm).each(function (i, node) {
				each$5(attrs, function (value, name) {
					setAttrib(node, name, value);
				});
			});
		};
		var setHTML = function (elm, html) {
			var $elm = $$(elm);
			if (isIE) {
				$elm.each(function (i, target) {
					if (target.canHaveHTML === false) {
						return;
					}
					while (target.firstChild) {
						target.removeChild(target.firstChild);
					}
					try {
						target.innerHTML = '<br>' + html;
						target.removeChild(target.firstChild);
					} catch (ex) {
						DomQuery('<div></div>').html('<br>' + html).contents().slice(1).appendTo(target);
					}
					return html;
				});
			} else {
				$elm.html(html);
			}
		};
		var add = function (parentElm, name, attrs, html, create) {
			return run(parentElm, function (parentElm) {
				var newElm = typeof name === 'string' ? doc.createElement(name) : name;
				setAttribs(newElm, attrs);
				if (html) {
					if (typeof html !== 'string' && html.nodeType) {
						newElm.appendChild(html);
					} else if (typeof html === 'string') {
						setHTML(newElm, html);
					}
				}
				return !create ? parentElm.appendChild(newElm) : newElm;
			});
		};
		var create = function (name, attrs, html) {
			return add(doc.createElement(name), name, attrs, html, true);
		};
		var decode = Entities.decode;
		var encode = Entities.encodeAllRaw;
		var createHTML = function (name, attrs, html) {
			var outHtml = '', key;
			outHtml += '<' + name;
			for (key in attrs) {
				if (attrs.hasOwnProperty(key) && attrs[key] !== null && typeof attrs[key] !== 'undefined') {
					outHtml += ' ' + key + '="' + encode(attrs[key]) + '"';
				}
			}
			if (typeof html !== 'undefined') {
				return outHtml + '>' + html + '</' + name + '>';
			}
			return outHtml + ' />';
		};
		var createFragment = function (html) {
			var node;
			var container = doc.createElement('div');
			var frag = doc.createDocumentFragment();
			frag.appendChild(container);
			if (html) {
				container.innerHTML = html;
			}
			while (node = container.firstChild) {
				frag.appendChild(node);
			}
			frag.removeChild(container);
			return frag;
		};
		var remove = function (node, keepChildren) {
			var $node = $$(node);
			if (keepChildren) {
				$node.each(function () {
					var child;
					while (child = this.firstChild) {
						if (child.nodeType === 3 && child.data.length === 0) {
							this.removeChild(child);
						} else {
							this.parentNode.insertBefore(child, this);
						}
					}
				}).remove();
			} else {
				$node.remove();
			}
			return $node.length > 1 ? $node.toArray() : $node[0];
		};
		var removeAllAttribs = function (e) {
			return run(e, function (e) {
				var i;
				var attrs = e.attributes;
				for (i = attrs.length - 1; i >= 0; i--) {
					e.removeAttributeNode(attrs.item(i));
				}
			});
		};
		var parseStyle = function (cssText) {
			return styles.parse(cssText);
		};
		var serializeStyle = function (stylesArg, name) {
			return styles.serialize(stylesArg, name);
		};
		var addStyle = function (cssText) {
			var head, styleElm;
			if (self !== DOMUtils.DOM && doc === document) {
				if (addedStyles[cssText]) {
					return;
				}
				addedStyles[cssText] = true;
			}
			styleElm = doc.getElementById('mceDefaultStyles');
			if (!styleElm) {
				styleElm = doc.createElement('style');
				styleElm.id = 'mceDefaultStyles';
				styleElm.type = 'text/css';
				head = doc.getElementsByTagName('head')[0];
				if (head.firstChild) {
					head.insertBefore(styleElm, head.firstChild);
				} else {
					head.appendChild(styleElm);
				}
			}
			if (styleElm.styleSheet) {
				styleElm.styleSheet.cssText += cssText;
			} else {
				styleElm.appendChild(doc.createTextNode(cssText));
			}
		};
		var loadCSS = function (urls) {
			if (!urls) {
				urls = '';
			}
			each(urls.split(','), function (url) {
				files[url] = true;
				styleSheetLoader.load(url, noop);
			});
		};
		var toggleClass = function (elm, cls, state) {
			$$(elm).toggleClass(cls, state).each(function () {
				if (this.className === '') {
					DomQuery(this).attr('class', null);
				}
			});
		};
		var addClass = function (elm, cls) {
			$$(elm).addClass(cls);
		};
		var removeClass = function (elm, cls) {
			toggleClass(elm, cls, false);
		};
		var hasClass = function (elm, cls) {
			return $$(elm).hasClass(cls);
		};
		var show = function (elm) {
			$$(elm).show();
		};
		var hide = function (elm) {
			$$(elm).hide();
		};
		var isHidden = function (elm) {
			return $$(elm).css('display') === 'none';
		};
		var uniqueId = function (prefix) {
			return (!prefix ? 'mce_' : prefix) + counter++;
		};
		var getOuterHTML = function (elm) {
			var node = typeof elm === 'string' ? get(elm) : elm;
			return isElement$1(node) ? node.outerHTML : DomQuery('<div></div>').append(DomQuery(node).clone()).html();
		};
		var setOuterHTML = function (elm, html) {
			$$(elm).each(function () {
				try {
					if ('outerHTML' in this) {
						this.outerHTML = html;
						return;
					}
				} catch (ex) {
				}
				remove(DomQuery(this).html(html), true);
			});
		};
		var insertAfter = function (node, reference) {
			var referenceNode = get(reference);
			return run(node, function (node) {
				var parent = referenceNode.parentNode;
				var nextSibling = referenceNode.nextSibling;
				if (nextSibling) {
					parent.insertBefore(node, nextSibling);
				} else {
					parent.appendChild(node);
				}
				return node;
			});
		};
		var replace = function (newElm, oldElm, keepChildren) {
			return run(oldElm, function (oldElm) {
				if (Tools.is(oldElm, 'array')) {
					newElm = newElm.cloneNode(true);
				}
				if (keepChildren) {
					each$5(grep$1(oldElm.childNodes), function (node) {
						newElm.appendChild(node);
					});
				}
				return oldElm.parentNode.replaceChild(newElm, oldElm);
			});
		};
		var rename = function (elm, name) {
			var newElm;
			if (elm.nodeName !== name.toUpperCase()) {
				newElm = create(name);
				each$5(getAttribs(elm), function (attrNode) {
					setAttrib(newElm, attrNode.nodeName, getAttrib(elm, attrNode.nodeName));
				});
				replace(newElm, elm, true);
			}
			return newElm || elm;
		};
		var findCommonAncestor = function (a, b) {
			var ps = a, pe;
			while (ps) {
				pe = b;
				while (pe && ps !== pe) {
					pe = pe.parentNode;
				}
				if (ps === pe) {
					break;
				}
				ps = ps.parentNode;
			}
			if (!ps && a.ownerDocument) {
				return a.ownerDocument.documentElement;
			}
			return ps;
		};
		var toHex = function (rgbVal) {
			return styles.toHex(Tools.trim(rgbVal));
		};
		var isNonEmptyElement = function (node) {
			if (isElement$1(node)) {
				var isNamedAnchor = node.nodeName.toLowerCase() === 'a' && !getAttrib(node, 'href') && getAttrib(node, 'id');
				if (getAttrib(node, 'name') || getAttrib(node, 'data-mce-bookmark') || isNamedAnchor) {
					return true;
				}
			}
			return false;
		};
		var isEmpty = function (node, elements) {
			var type, name, brCount = 0;
			if (isNonEmptyElement(node)) {
				return false;
			}
			node = node.firstChild;
			if (node) {
				var walker = new DomTreeWalker(node, node.parentNode);
				var whitespace = schema ? schema.getWhiteSpaceElements() : {};
				elements = elements || (schema ? schema.getNonEmptyElements() : null);
				do {
					type = node.nodeType;
					if (isElement$1(node)) {
						var bogusVal = node.getAttribute('data-mce-bogus');
						if (bogusVal) {
							node = walker.next(bogusVal === 'all');
							continue;
						}
						name = node.nodeName.toLowerCase();
						if (elements && elements[name]) {
							if (name === 'br') {
								brCount++;
								node = walker.next();
								continue;
							}
							return false;
						}
						if (isNonEmptyElement(node)) {
							return false;
						}
					}
					if (type === 8) {
						return false;
					}
					if (type === 3 && !isWhitespaceText(node.nodeValue)) {
						return false;
					}
					if (type === 3 && node.parentNode && whitespace[node.parentNode.nodeName] && isWhitespaceText(node.nodeValue)) {
						return false;
					}
					node = walker.next();
				} while (node);
			}
			return brCount <= 1;
		};
		var createRng = function () {
			return doc.createRange();
		};
		var split = function (parentElm, splitElm, replacementElm) {
			var range = createRng();
			var beforeFragment;
			var afterFragment;
			var parentNode;
			if (parentElm && splitElm) {
				range.setStart(parentElm.parentNode, findNodeIndex(parentElm));
				range.setEnd(splitElm.parentNode, findNodeIndex(splitElm));
				beforeFragment = range.extractContents();
				range = createRng();
				range.setStart(splitElm.parentNode, findNodeIndex(splitElm) + 1);
				range.setEnd(parentElm.parentNode, findNodeIndex(parentElm) + 1);
				afterFragment = range.extractContents();
				parentNode = parentElm.parentNode;
				parentNode.insertBefore(trimNode(self, beforeFragment), parentElm);
				if (replacementElm) {
					parentNode.insertBefore(replacementElm, parentElm);
				} else {
					parentNode.insertBefore(splitElm, parentElm);
				}
				parentNode.insertBefore(trimNode(self, afterFragment), parentElm);
				remove(parentElm);
				return replacementElm || splitElm;
			}
		};
		var bind = function (target, name, func, scope) {
			if (Tools.isArray(target)) {
				var i = target.length;
				var rv = [];
				while (i--) {
					rv[i] = bind(target[i], name, func, scope);
				}
				return rv;
			}
			if (settings.collect && (target === doc || target === win)) {
				boundEvents.push([
					target,
					name,
					func,
					scope
				]);
			}
			var output = events.bind(target, name, func, scope || self);
			return output;
		};
		var unbind = function (target, name, func) {
			if (Tools.isArray(target)) {
				var i = target.length;
				var rv = [];
				while (i--) {
					rv[i] = unbind(target[i], name, func);
				}
				return rv;
			} else {
				if (boundEvents.length > 0 && (target === doc || target === win)) {
					var i = boundEvents.length;
					while (i--) {
						var item = boundEvents[i];
						if (target === item[0] && (!name || name === item[1]) && (!func || func === item[2])) {
							events.unbind(item[0], item[1], item[2]);
						}
					}
				}
				return events.unbind(target, name, func);
			}
		};
		var fire = function (target, name, evt) {
			return events.fire(target, name, evt);
		};
		var getContentEditable = function (node) {
			if (node && isElement$1(node)) {
				var contentEditable = node.getAttribute('data-mce-contenteditable');
				if (contentEditable && contentEditable !== 'inherit') {
					return contentEditable;
				}
				return node.contentEditable !== 'inherit' ? node.contentEditable : null;
			} else {
				return null;
			}
		};
		var getContentEditableParent = function (node) {
			var root = getRoot();
			var state = null;
			for (; node && node !== root; node = node.parentNode) {
				state = getContentEditable(node);
				if (state !== null) {
					break;
				}
			}
			return state;
		};
		var destroy = function () {
			if (boundEvents.length > 0) {
				var i = boundEvents.length;
				while (i--) {
					var item = boundEvents[i];
					events.unbind(item[0], item[1], item[2]);
				}
			}
			each$1(files, function (_, url) {
				styleSheetLoader.unload(url);
				delete files[url];
			});
			if (Sizzle.setDocument) {
				Sizzle.setDocument();
			}
		};
		var isChildOf = function (node, parent) {
			while (node) {
				if (parent === node) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		};
		var dumpRng = function (r) {
			return 'startContainer: ' + r.startContainer.nodeName + ', startOffset: ' + r.startOffset + ', endContainer: ' + r.endContainer.nodeName + ', endOffset: ' + r.endOffset;
		};
		var self = {
			doc: doc,
			settings: settings,
			win: win,
			files: files,
			stdMode: stdMode,
			boxModel: boxModel,
			styleSheetLoader: styleSheetLoader,
			boundEvents: boundEvents,
			styles: styles,
			schema: schema,
			events: events,
			isBlock: isBlock,
			$: $,
			$$: $$,
			root: null,
			clone: clone,
			getRoot: getRoot,
			getViewPort: getViewPort,
			getRect: getRect,
			getSize: getSize,
			getParent: getParent,
			getParents: getParents,
			get: get,
			getNext: getNext,
			getPrev: getPrev,
			select: select,
			is: is,
			add: add,
			create: create,
			createHTML: createHTML,
			createFragment: createFragment,
			remove: remove,
			setStyle: setStyle,
			getStyle: getStyle,
			setStyles: setStyles,
			removeAllAttribs: removeAllAttribs,
			setAttrib: setAttrib,
			setAttribs: setAttribs,
			getAttrib: getAttrib,
			getPos: getPos$1,
			parseStyle: parseStyle,
			serializeStyle: serializeStyle,
			addStyle: addStyle,
			loadCSS: loadCSS,
			addClass: addClass,
			removeClass: removeClass,
			hasClass: hasClass,
			toggleClass: toggleClass,
			show: show,
			hide: hide,
			isHidden: isHidden,
			uniqueId: uniqueId,
			setHTML: setHTML,
			getOuterHTML: getOuterHTML,
			setOuterHTML: setOuterHTML,
			decode: decode,
			encode: encode,
			insertAfter: insertAfter,
			replace: replace,
			rename: rename,
			findCommonAncestor: findCommonAncestor,
			toHex: toHex,
			run: run,
			getAttribs: getAttribs,
			isEmpty: isEmpty,
			createRng: createRng,
			nodeIndex: findNodeIndex,
			split: split,
			bind: bind,
			unbind: unbind,
			fire: fire,
			getContentEditable: getContentEditable,
			getContentEditableParent: getContentEditableParent,
			destroy: destroy,
			isChildOf: isChildOf,
			dumpRng: dumpRng
		};
		var attrHooks = setupAttrHooks(styles, settings, function () {
			return self;
		});
		return self;
	}
	(function (DOMUtils) {
		DOMUtils.DOM = DOMUtils(document);
		DOMUtils.nodeIndex = findNodeIndex;
	}(DOMUtils || (DOMUtils = {})));
	var DOMUtils$1 = DOMUtils;

	var DOM = DOMUtils$1.DOM;
	var each$6 = Tools.each, grep$2 = Tools.grep;
	var QUEUED = 0;
	var LOADING = 1;
	var LOADED = 2;
	var FAILED = 3;
	var ScriptLoader = function () {
		function ScriptLoader(settings) {
			if (settings === void 0) {
				settings = {};
			}
			this.states = {};
			this.queue = [];
			this.scriptLoadedCallbacks = {};
			this.queueLoadedCallbacks = [];
			this.loading = 0;
			this.settings = settings;
		}
		ScriptLoader.prototype._setReferrerPolicy = function (referrerPolicy) {
			this.settings.referrerPolicy = referrerPolicy;
		};
		ScriptLoader.prototype.loadScript = function (url, success, failure) {
			var dom = DOM;
			var elm;
			var cleanup = function () {
				dom.remove(id);
				if (elm) {
					elm.onerror = elm.onload = elm = null;
				}
			};
			var done = function () {
				cleanup();
				success();
			};
			var error = function () {
				cleanup();
				if (isFunction(failure)) {
					failure();
				} else {
					if (typeof console !== 'undefined' && console.log) {
						console.log('Failed to load script: ' + url);
					}
				}
			};
			var id = dom.uniqueId();
			elm = document.createElement('script');
			elm.id = id;
			elm.type = 'text/javascript';
			elm.src = Tools._addCacheSuffix(url);
			if (this.settings.referrerPolicy) {
				dom.setAttrib(elm, 'referrerpolicy', this.settings.referrerPolicy);
			}
			elm.onload = done;
			elm.onerror = error;
			(document.getElementsByTagName('head')[0] || document.body).appendChild(elm);
		};
		ScriptLoader.prototype.isDone = function (url) {
			return this.states[url] === LOADED;
		};
		ScriptLoader.prototype.markDone = function (url) {
			this.states[url] = LOADED;
		};
		ScriptLoader.prototype.add = function (url, success, scope, failure) {
			var state = this.states[url];
			this.queue.push(url);
			if (state === undefined) {
				this.states[url] = QUEUED;
			}
			if (success) {
				if (!this.scriptLoadedCallbacks[url]) {
					this.scriptLoadedCallbacks[url] = [];
				}
				this.scriptLoadedCallbacks[url].push({
					success: success,
					failure: failure,
					scope: scope || this
				});
			}
		};
		ScriptLoader.prototype.load = function (url, success, scope, failure) {
			return this.add(url, success, scope, failure);
		};
		ScriptLoader.prototype.remove = function (url) {
			delete this.states[url];
			delete this.scriptLoadedCallbacks[url];
		};
		ScriptLoader.prototype.loadQueue = function (success, scope, failure) {
			this.loadScripts(this.queue, success, scope, failure);
		};
		ScriptLoader.prototype.loadScripts = function (scripts, success, scope, failure) {
			var self = this;
			var failures = [];
			var execCallbacks = function (name, url) {
				each$6(self.scriptLoadedCallbacks[url], function (callback) {
					if (isFunction(callback[name])) {
						callback[name].call(callback.scope);
					}
				});
				self.scriptLoadedCallbacks[url] = undefined;
			};
			self.queueLoadedCallbacks.push({
				success: success,
				failure: failure,
				scope: scope || this
			});
			var loadScripts = function () {
				var loadingScripts = grep$2(scripts);
				scripts.length = 0;
				each$6(loadingScripts, function (url) {
					if (self.states[url] === LOADED) {
						execCallbacks('success', url);
						return;
					}
					if (self.states[url] === FAILED) {
						execCallbacks('failure', url);
						return;
					}
					if (self.states[url] !== LOADING) {
						self.states[url] = LOADING;
						self.loading++;
						self.loadScript(url, function () {
							self.states[url] = LOADED;
							self.loading--;
							execCallbacks('success', url);
							loadScripts();
						}, function () {
							self.states[url] = FAILED;
							self.loading--;
							failures.push(url);
							execCallbacks('failure', url);
							loadScripts();
						});
					}
				});
				if (!self.loading) {
					var notifyCallbacks = self.queueLoadedCallbacks.slice(0);
					self.queueLoadedCallbacks.length = 0;
					each$6(notifyCallbacks, function (callback) {
						if (failures.length === 0) {
							if (isFunction(callback.success)) {
								callback.success.call(callback.scope);
							}
						} else {
							if (isFunction(callback.failure)) {
								callback.failure.call(callback.scope, failures);
							}
						}
					});
				}
			};
			loadScripts();
		};
		ScriptLoader.ScriptLoader = new ScriptLoader();
		return ScriptLoader;
	}();

	var Cell = function (initial) {
		var value = initial;
		var get = function () {
			return value;
		};
		var set = function (v) {
			value = v;
		};
		return {
			get: get,
			set: set
		};
	};

	var isRaw = function (str) {
		return isObject(str) && has(str, 'raw');
	};
	var isTokenised = function (str) {
		return isArray(str) && str.length > 1;
	};
	var data = {};
	var currentCode = Cell('en');
	var getLanguageData = function () {
		return get$1(data, currentCode.get());
	};
	var getData = function () {
		return map$1(data, function (value) {
			return __assign({}, value);
		});
	};
	var setCode = function (newCode) {
		if (newCode) {
			currentCode.set(newCode);
		}
	};
	var getCode = function () {
		return currentCode.get();
	};
	var add = function (code, items) {
		var langData = data[code];
		if (!langData) {
			data[code] = langData = {};
		}
		each$1(items, function (translation, name) {
			langData[name.toLowerCase()] = translation;
		});
	};
	var translate = function (text) {
		var langData = getLanguageData().getOr({});
		var toString = function (obj) {
			if (isFunction(obj)) {
				return Object.prototype.toString.call(obj);
			}
			return !isEmpty(obj) ? '' + obj : '';
		};
		var isEmpty = function (text) {
			return text === '' || text === null || text === undefined;
		};
		var getLangData = function (text) {
			var textstr = toString(text);
			return get$1(langData, textstr.toLowerCase()).map(toString).getOr(textstr);
		};
		var removeContext = function (str) {
			return str.replace(/{context:\w+}$/, '');
		};
		if (isEmpty(text)) {
			return '';
		}
		if (isRaw(text)) {
			return toString(text.raw);
		}
		if (isTokenised(text)) {
			var values_1 = text.slice(1);
			var substitued = getLangData(text[0]).replace(/\{([0-9]+)\}/g, function ($1, $2) {
				return has(values_1, $2) ? toString(values_1[$2]) : $1;
			});
			return removeContext(substitued);
		}
		return removeContext(getLangData(text));
	};
	var isRtl = function () {
		return getLanguageData().bind(function (items) {
			return get$1(items, '_dir');
		}).exists(function (dir) {
			return dir === 'rtl';
		});
	};
	var hasCode = function (code) {
		return has(data, code);
	};
	var I18n = {
		getData: getData,
		setCode: setCode,
		getCode: getCode,
		add: add,
		translate: translate,
		isRtl: isRtl,
		hasCode: hasCode
	};

	function AddOnManager() {
		var _this = this;
		var items = [];
		var urls = {};
		var lookup = {};
		var _listeners = [];
		var runListeners = function (name, state) {
			var matchedListeners = filter(_listeners, function (listener) {
				return listener.name === name && listener.state === state;
			});
			each(matchedListeners, function (listener) {
				return listener.callback();
			});
		};
		var get = function (name) {
			if (lookup[name]) {
				return lookup[name].instance;
			}
			return undefined;
		};
		var dependencies = function (name) {
			var result;
			if (lookup[name]) {
				result = lookup[name].dependencies;
			}
			return result || [];
		};
		var requireLangPack = function (name, languages) {
			if (AddOnManager.languageLoad !== false) {
				waitFor(name, function () {
					var language = I18n.getCode();
					var wrappedLanguages = ',' + (languages || '') + ',';
					if (!language || languages && wrappedLanguages.indexOf(',' + language + ',') === -1) {
						return;
					}
					ScriptLoader.ScriptLoader.add(urls[name] + '/langs/' + language + '.js');
				}, 'loaded');
			}
		};
		var add = function (id, addOn, dependencies) {
			var addOnConstructor = addOn;
			items.push(addOnConstructor);
			lookup[id] = {
				instance: addOnConstructor,
				dependencies: dependencies
			};
			runListeners(id, 'added');
			return addOnConstructor;
		};
		var remove = function (name) {
			delete urls[name];
			delete lookup[name];
		};
		var createUrl = function (baseUrl, dep) {
			if (typeof dep === 'object') {
				return dep;
			}
			return typeof baseUrl === 'string' ? {
				prefix: '',
				resource: dep,
				suffix: ''
			} : {
				prefix: baseUrl.prefix,
				resource: dep,
				suffix: baseUrl.suffix
			};
		};
		var addComponents = function (pluginName, scripts) {
			var pluginUrl = _this.urls[pluginName];
			each(scripts, function (script) {
				ScriptLoader.ScriptLoader.add(pluginUrl + '/' + script);
			});
		};
		var loadDependencies = function (name, addOnUrl, success, scope) {
			var deps = dependencies(name);
			each(deps, function (dep) {
				var newUrl = createUrl(addOnUrl, dep);
				load(newUrl.resource, newUrl, undefined, undefined);
			});
			if (success) {
				if (scope) {
					success.call(scope);
				} else {
					success.call(ScriptLoader);
				}
			}
		};
		var load = function (name, addOnUrl, success, scope, failure) {
			if (urls[name]) {
				return;
			}
			var urlString = typeof addOnUrl === 'string' ? addOnUrl : addOnUrl.prefix + addOnUrl.resource + addOnUrl.suffix;
			if (urlString.indexOf('/') !== 0 && urlString.indexOf('://') === -1) {
				urlString = AddOnManager.baseURL + '/' + urlString;
			}
			urls[name] = urlString.substring(0, urlString.lastIndexOf('/'));
			var done = function () {
				runListeners(name, 'loaded');
				loadDependencies(name, addOnUrl, success, scope);
			};
			if (lookup[name]) {
				done();
			} else {
				ScriptLoader.ScriptLoader.add(urlString, done, scope, failure);
			}
		};
		var waitFor = function (name, callback, state) {
			if (state === void 0) {
				state = 'added';
			}
			if (has(lookup, name) && state === 'added') {
				callback();
			} else if (has(urls, name) && state === 'loaded') {
				callback();
			} else {
				_listeners.push({
					name: name,
					state: state,
					callback: callback
				});
			}
		};
		return {
			items: items,
			urls: urls,
			lookup: lookup,
			_listeners: _listeners,
			get: get,
			dependencies: dependencies,
			requireLangPack: requireLangPack,
			add: add,
			remove: remove,
			createUrl: createUrl,
			addComponents: addComponents,
			load: load,
			waitFor: waitFor
		};
	}
	(function (AddOnManager) {
		AddOnManager.PluginManager = AddOnManager();
		AddOnManager.ThemeManager = AddOnManager();
	}(AddOnManager || (AddOnManager = {})));
	var AddOnManager$1 = AddOnManager;

	var first = function (fn, rate) {
		var timer = null;
		var cancel = function () {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
		};
		var throttle = function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			if (timer === null) {
				timer = setTimeout(function () {
					fn.apply(null, args);
					timer = null;
				}, rate);
			}
		};
		return {
			cancel: cancel,
			throttle: throttle
		};
	};
	var last$2 = function (fn, rate) {
		var timer = null;
		var cancel = function () {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
		};
		var throttle = function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			if (timer !== null) {
				clearTimeout(timer);
			}
			timer = setTimeout(function () {
				fn.apply(null, args);
				timer = null;
			}, rate);
		};
		return {
			cancel: cancel,
			throttle: throttle
		};
	};

	var read = function (element, attr) {
		var value = get$4(element, attr);
		return value === undefined || value === '' ? [] : value.split(' ');
	};
	var add$1 = function (element, attr, id) {
		var old = read(element, attr);
		var nu = old.concat([id]);
		set(element, attr, nu.join(' '));
		return true;
	};
	var remove$2 = function (element, attr, id) {
		var nu = filter(read(element, attr), function (v) {
			return v !== id;
		});
		if (nu.length > 0) {
			set(element, attr, nu.join(' '));
		} else {
			remove$1(element, attr);
		}
		return false;
	};

	var supports = function (element) {
		return element.dom.classList !== undefined;
	};
	var get$6 = function (element) {
		return read(element, 'class');
	};
	var add$2 = function (element, clazz) {
		return add$1(element, 'class', clazz);
	};
	var remove$3 = function (element, clazz) {
		return remove$2(element, 'class', clazz);
	};

	var add$3 = function (element, clazz) {
		if (supports(element)) {
			element.dom.classList.add(clazz);
		} else {
			add$2(element, clazz);
		}
	};
	var cleanClass = function (element) {
		var classList = supports(element) ? element.dom.classList : get$6(element);
		if (classList.length === 0) {
			remove$1(element, 'class');
		}
	};
	var remove$4 = function (element, clazz) {
		if (supports(element)) {
			var classList = element.dom.classList;
			classList.remove(clazz);
		} else {
			remove$3(element, clazz);
		}
		cleanClass(element);
	};
	var has$2 = function (element, clazz) {
		return supports(element) && element.dom.classList.contains(clazz);
	};

	var descendants = function (scope, predicate) {
		var result = [];
		each(children(scope), function (x) {
			if (predicate(x)) {
				result = result.concat([x]);
			}
			result = result.concat(descendants(x, predicate));
		});
		return result;
	};

	var descendants$1 = function (scope, selector) {
		return all(selector, scope);
	};

	var annotation = constant('mce-annotation');
	var dataAnnotation = constant('data-mce-annotation');
	var dataAnnotationId = constant('data-mce-annotation-uid');

	var identify = function (editor, annotationName) {
		var rng = editor.selection.getRng();
		var start = SugarElement.fromDom(rng.startContainer);
		var root = SugarElement.fromDom(editor.getBody());
		var selector = annotationName.fold(function () {
			return '.' + annotation();
		}, function (an) {
			return '[' + dataAnnotation() + '="' + an + '"]';
		});
		var newStart = child(start, rng.startOffset).getOr(start);
		var closest = closest$1(newStart, selector, function (n) {
			return eq$2(n, root);
		});
		var getAttr = function (c, property) {
			if (has$1(c, property)) {
				return Optional.some(get$4(c, property));
			} else {
				return Optional.none();
			}
		};
		return closest.bind(function (c) {
			return getAttr(c, '' + dataAnnotationId()).bind(function (uid) {
				return getAttr(c, '' + dataAnnotation()).map(function (name) {
					var elements = findMarkers(editor, uid);
					return {
						uid: uid,
						name: name,
						elements: elements
					};
				});
			});
		});
	};
	var isAnnotation = function (elem) {
		return isElement(elem) && has$2(elem, annotation());
	};
	var findMarkers = function (editor, uid) {
		var body = SugarElement.fromDom(editor.getBody());
		return descendants$1(body, '[' + dataAnnotationId() + '="' + uid + '"]');
	};
	var findAll = function (editor, name) {
		var body = SugarElement.fromDom(editor.getBody());
		var markers = descendants$1(body, '[' + dataAnnotation() + '="' + name + '"]');
		var directory = {};
		each(markers, function (m) {
			var uid = get$4(m, dataAnnotationId());
			var nodesAlready = directory.hasOwnProperty(uid) ? directory[uid] : [];
			directory[uid] = nodesAlready.concat([m]);
		});
		return directory;
	};

	var setup = function (editor, _registry) {
		var changeCallbacks = Cell({});
		var initData = function () {
			return {
				listeners: [],
				previous: Cell(Optional.none())
			};
		};
		var withCallbacks = function (name, f) {
			updateCallbacks(name, function (data) {
				f(data);
				return data;
			});
		};
		var updateCallbacks = function (name, f) {
			var callbackMap = changeCallbacks.get();
			var data = callbackMap.hasOwnProperty(name) ? callbackMap[name] : initData();
			var outputData = f(data);
			callbackMap[name] = outputData;
			changeCallbacks.set(callbackMap);
		};
		var fireCallbacks = function (name, uid, elements) {
			withCallbacks(name, function (data) {
				each(data.listeners, function (f) {
					return f(true, name, {
						uid: uid,
						nodes: map(elements, function (elem) {
							return elem.dom;
						})
					});
				});
			});
		};
		var fireNoAnnotation = function (name) {
			withCallbacks(name, function (data) {
				each(data.listeners, function (f) {
					return f(false, name);
				});
			});
		};
		var onNodeChange = last$2(function () {
			var callbackMap = changeCallbacks.get();
			var annotations = sort$1(keys(callbackMap));
			each(annotations, function (name) {
				updateCallbacks(name, function (data) {
					var prev = data.previous.get();
					identify(editor, Optional.some(name)).fold(function () {
						if (prev.isSome()) {
							fireNoAnnotation(name);
							data.previous.set(Optional.none());
						}
					}, function (_a) {
						var uid = _a.uid, name = _a.name, elements = _a.elements;
						if (!prev.is(uid)) {
							fireCallbacks(name, uid, elements);
							data.previous.set(Optional.some(uid));
						}
					});
					return {
						previous: data.previous,
						listeners: data.listeners
					};
				});
			});
		}, 30);
		editor.on('remove', function () {
			onNodeChange.cancel();
		});
		editor.on('NodeChange', function () {
			onNodeChange.throttle();
		});
		var addListener = function (name, f) {
			updateCallbacks(name, function (data) {
				return {
					previous: data.previous,
					listeners: data.listeners.concat([f])
				};
			});
		};
		return { addListener: addListener };
	};

	var setup$1 = function (editor, registry) {
		var identifyParserNode = function (span) {
			return Optional.from(span.attr(dataAnnotation())).bind(registry.lookup);
		};
		editor.on('init', function () {
			editor.serializer.addNodeFilter('span', function (spans) {
				each(spans, function (span) {
					identifyParserNode(span).each(function (settings) {
						if (settings.persistent === false) {
							span.unwrap();
						}
					});
				});
			});
		});
	};

	var create$2 = function () {
		var annotations = {};
		var register = function (name, settings) {
			annotations[name] = {
				name: name,
				settings: settings
			};
		};
		var lookup = function (name) {
			return annotations.hasOwnProperty(name) ? Optional.from(annotations[name]).map(function (a) {
				return a.settings;
			}) : Optional.none();
		};
		return {
			register: register,
			lookup: lookup
		};
	};

	var unique = 0;
	var generate$1 = function (prefix) {
		var date = new Date();
		var time = date.getTime();
		var random = Math.floor(Math.random() * 1000000000);
		unique++;
		return prefix + '_' + random + unique + String(time);
	};

	var add$4 = function (element, classes) {
		each(classes, function (x) {
			add$3(element, x);
		});
	};

	var fromHtml$1 = function (html, scope) {
		var doc = scope || document;
		var div = doc.createElement('div');
		div.innerHTML = html;
		return children(SugarElement.fromDom(div));
	};

	var get$7 = function (element) {
		return element.dom.innerHTML;
	};
	var set$1 = function (element, content) {
		var owner$1 = owner(element);
		var docDom = owner$1.dom;
		var fragment = SugarElement.fromDom(docDom.createDocumentFragment());
		var contentElements = fromHtml$1(content, docDom);
		append$1(fragment, contentElements);
		empty(element);
		append(element, fragment);
	};

	var clone$1 = function (original, isDeep) {
		return SugarElement.fromDom(original.dom.cloneNode(isDeep));
	};
	var shallow = function (original) {
		return clone$1(original, false);
	};
	var deep = function (original) {
		return clone$1(original, true);
	};

	var TextWalker = function (startNode, rootNode, isBoundary) {
		if (isBoundary === void 0) {
			isBoundary = never;
		}
		var walker = new DomTreeWalker(startNode, rootNode);
		var walk = function (direction) {
			var next;
			do {
				next = walker[direction]();
			} while (next && !isText$1(next) && !isBoundary(next));
			return Optional.from(next).filter(isText$1);
		};
		return {
			current: function () {
				return Optional.from(walker.current()).filter(isText$1);
			},
			next: function () {
				return walk('next');
			},
			prev: function () {
				return walk('prev');
			},
			prev2: function () {
				return walk('prev2');
			}
		};
	};

	var TextSeeker = function (dom, isBoundary) {
		var isBlockBoundary = isBoundary ? isBoundary : function (node) {
			return dom.isBlock(node) || isBr(node) || isContentEditableFalse(node);
		};
		var walk = function (node, offset, walker, process) {
			if (isText$1(node)) {
				var newOffset = process(node, offset, node.data);
				if (newOffset !== -1) {
					return Optional.some({
						container: node,
						offset: newOffset
					});
				}
			}
			return walker().bind(function (next) {
				return walk(next.container, next.offset, walker, process);
			});
		};
		var backwards = function (node, offset, process, root) {
			var walker = TextWalker(node, root, isBlockBoundary);
			return walk(node, offset, function () {
				return walker.prev().map(function (prev) {
					return {
						container: prev,
						offset: prev.length
					};
				});
			}, process).getOrNull();
		};
		var forwards = function (node, offset, process, root) {
			var walker = TextWalker(node, root, isBlockBoundary);
			return walk(node, offset, function () {
				return walker.next().map(function (next) {
					return {
						container: next,
						offset: 0
					};
				});
			}, process).getOrNull();
		};
		return {
			backwards: backwards,
			forwards: forwards
		};
	};

	var cat = function (arr) {
		var r = [];
		var push = function (x) {
			r.push(x);
		};
		for (var i = 0; i < arr.length; i++) {
			arr[i].each(push);
		}
		return r;
	};
	var lift2 = function (oa, ob, f) {
		return oa.isSome() && ob.isSome() ? Optional.some(f(oa.getOrDie(), ob.getOrDie())) : Optional.none();
	};
	var lift3 = function (oa, ob, oc, f) {
		return oa.isSome() && ob.isSome() && oc.isSome() ? Optional.some(f(oa.getOrDie(), ob.getOrDie(), oc.getOrDie())) : Optional.none();
	};
	var someIf = function (b, a) {
		return b ? Optional.some(a) : Optional.none();
	};

	var round = Math.round;
	var clone$2 = function (rect) {
		if (!rect) {
			return {
				left: 0,
				top: 0,
				bottom: 0,
				right: 0,
				width: 0,
				height: 0
			};
		}
		return {
			left: round(rect.left),
			top: round(rect.top),
			bottom: round(rect.bottom),
			right: round(rect.right),
			width: round(rect.width),
			height: round(rect.height)
		};
	};
	var collapse = function (rect, toStart) {
		rect = clone$2(rect);
		if (toStart) {
			rect.right = rect.left;
		} else {
			rect.left = rect.left + rect.width;
			rect.right = rect.left;
		}
		rect.width = 0;
		return rect;
	};
	var isEqual = function (rect1, rect2) {
		return rect1.left === rect2.left && rect1.top === rect2.top && rect1.bottom === rect2.bottom && rect1.right === rect2.right;
	};
	var isValidOverflow = function (overflowY, rect1, rect2) {
		return overflowY >= 0 && overflowY <= Math.min(rect1.height, rect2.height) / 2;
	};
	var isAbove = function (rect1, rect2) {
		var halfHeight = Math.min(rect2.height / 2, rect1.height / 2);
		if (rect1.bottom - halfHeight < rect2.top) {
			return true;
		}
		if (rect1.top > rect2.bottom) {
			return false;
		}
		return isValidOverflow(rect2.top - rect1.bottom, rect1, rect2);
	};
	var isBelow = function (rect1, rect2) {
		if (rect1.top > rect2.bottom) {
			return true;
		}
		if (rect1.bottom < rect2.top) {
			return false;
		}
		return isValidOverflow(rect2.bottom - rect1.top, rect1, rect2);
	};
	var containsXY = function (rect, clientX, clientY) {
		return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
	};

	var getSelectedNode = function (range) {
		var startContainer = range.startContainer, startOffset = range.startOffset;
		if (startContainer.hasChildNodes() && range.endOffset === startOffset + 1) {
			return startContainer.childNodes[startOffset];
		}
		return null;
	};
	var getNode = function (container, offset) {
		if (container.nodeType === 1 && container.hasChildNodes()) {
			if (offset >= container.childNodes.length) {
				offset = container.childNodes.length - 1;
			}
			container = container.childNodes[offset];
		}
		return container;
	};

	var extendingChars = new RegExp('[\u0300-\u036f\u0483-\u0487\u0488-\u0489\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u0610-\u061a' + '\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0' + '\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e3-\u0902\u093a\u093c' + '\u0941-\u0948\u094d\u0951-\u0957\u0962-\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2-\u09e3' + '\u0a01-\u0a02\u0a3c\u0a41-\u0a42\u0a47-\u0a48\u0a4b-\u0a4d\u0a51\u0a70-\u0a71\u0a75\u0a81-\u0a82\u0abc' + '\u0ac1-\u0ac5\u0ac7-\u0ac8\u0acd\u0ae2-\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57' + '\u0b62-\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c00\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55-\u0c56' + '\u0c62-\u0c63\u0c81\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc-\u0ccd\u0cd5-\u0cd6\u0ce2-\u0ce3\u0d01\u0d3e\u0d41-\u0d44' + '\u0d4d\u0d57\u0d62-\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9' + '\u0ebb-\u0ebc\u0ec8-\u0ecd\u0f18-\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86-\u0f87\u0f8d-\u0f97' + '\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039-\u103a\u103d-\u103e\u1058-\u1059\u105e-\u1060\u1071-\u1074' + '\u1082\u1085-\u1086\u108d\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17b4-\u17b5' + '\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927-\u1928\u1932\u1939-\u193b\u1a17-\u1a18' + '\u1a1b\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1ab0-\u1abd\u1ABE\u1b00-\u1b03\u1b34' + '\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80-\u1b81\u1ba2-\u1ba5\u1ba8-\u1ba9\u1bab-\u1bad\u1be6\u1be8-\u1be9' + '\u1bed\u1bef-\u1bf1\u1c2c-\u1c33\u1c36-\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1cf4\u1cf8-\u1cf9' + '\u1dc0-\u1df5\u1dfc-\u1dff\u200c-\u200d\u20d0-\u20dc\u20DD-\u20E0\u20e1\u20E2-\u20E4\u20e5-\u20f0\u2cef-\u2cf1' + '\u2d7f\u2de0-\u2dff\u302a-\u302d\u302e-\u302f\u3099-\u309a\ua66f\uA670-\uA672\ua674-\ua67d\ua69e-\ua69f\ua6f0-\ua6f1' + '\ua802\ua806\ua80b\ua825-\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc' + '\ua9e5\uaa29-\uaa2e\uaa31-\uaa32\uaa35-\uaa36\uaa43\uaa4c\uaa7c\uaab0\uaab2-\uaab4\uaab7-\uaab8\uaabe-\uaabf\uaac1' + '\uaaec-\uaaed\uaaf6\uabe5\uabe8\uabed\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\uff9e-\uff9f]');
	var isExtendingChar = function (ch) {
		return typeof ch === 'string' && ch.charCodeAt(0) >= 768 && extendingChars.test(ch);
	};

	var or = function () {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) {
			args[_i] = arguments[_i];
		}
		return function (x) {
			for (var i = 0; i < args.length; i++) {
				if (args[i](x)) {
					return true;
				}
			}
			return false;
		};
	};
	var and = function () {
		var args = [];
		for (var _i = 0; _i < arguments.length; _i++) {
			args[_i] = arguments[_i];
		}
		return function (x) {
			for (var i = 0; i < args.length; i++) {
				if (!args[i](x)) {
					return false;
				}
			}
			return true;
		};
	};

	var isElement$3 = isElement$1;
	var isCaretCandidate$1 = isCaretCandidate;
	var isBlock$1 = matchStyleValues('display', 'block table');
	var isFloated = matchStyleValues('float', 'left right');
	var isValidElementCaretCandidate = and(isElement$3, isCaretCandidate$1, not(isFloated));
	var isNotPre = not(matchStyleValues('white-space', 'pre pre-line pre-wrap'));
	var isText$4 = isText$1;
	var isBr$3 = isBr;
	var nodeIndex = DOMUtils$1.nodeIndex;
	var resolveIndex = getNode;
	var createRange = function (doc) {
		return 'createRange' in doc ? doc.createRange() : DOMUtils$1.DOM.createRng();
	};
	var isWhiteSpace = function (chr) {
		return chr && /[\r\n\t ]/.test(chr);
	};
	var isRange = function (rng) {
		return !!rng.setStart && !!rng.setEnd;
	};
	var isHiddenWhiteSpaceRange = function (range) {
		var container = range.startContainer;
		var offset = range.startOffset;
		var text;
		if (isWhiteSpace(range.toString()) && isNotPre(container.parentNode) && isText$1(container)) {
			text = container.data;
			if (isWhiteSpace(text[offset - 1]) || isWhiteSpace(text[offset + 1])) {
				return true;
			}
		}
		return false;
	};
	var getBrClientRect = function (brNode) {
		var doc = brNode.ownerDocument;
		var rng = createRange(doc);
		var nbsp$1 = doc.createTextNode(nbsp);
		var parentNode = brNode.parentNode;
		parentNode.insertBefore(nbsp$1, brNode);
		rng.setStart(nbsp$1, 0);
		rng.setEnd(nbsp$1, 1);
		var clientRect = clone$2(rng.getBoundingClientRect());
		parentNode.removeChild(nbsp$1);
		return clientRect;
	};
	var getBoundingClientRectWebKitText = function (rng) {
		var sc = rng.startContainer;
		var ec = rng.endContainer;
		var so = rng.startOffset;
		var eo = rng.endOffset;
		if (sc === ec && isText$1(ec) && so === 0 && eo === 1) {
			var newRng = rng.cloneRange();
			newRng.setEndAfter(ec);
			return getBoundingClientRect(newRng);
		} else {
			return null;
		}
	};
	var isZeroRect = function (r) {
		return r.left === 0 && r.right === 0 && r.top === 0 && r.bottom === 0;
	};
	var getBoundingClientRect = function (item) {
		var clientRect;
		var clientRects = item.getClientRects();
		if (clientRects.length > 0) {
			clientRect = clone$2(clientRects[0]);
		} else {
			clientRect = clone$2(item.getBoundingClientRect());
		}
		if (!isRange(item) && isBr$3(item) && isZeroRect(clientRect)) {
			return getBrClientRect(item);
		}
		if (isZeroRect(clientRect) && isRange(item)) {
			return getBoundingClientRectWebKitText(item);
		}
		return clientRect;
	};
	var collapseAndInflateWidth = function (clientRect, toStart) {
		var newClientRect = collapse(clientRect, toStart);
		newClientRect.width = 1;
		newClientRect.right = newClientRect.left + 1;
		return newClientRect;
	};
	var getCaretPositionClientRects = function (caretPosition) {
		var clientRects = [];
		var beforeNode, node;
		var addUniqueAndValidRect = function (clientRect) {
			if (clientRect.height === 0) {
				return;
			}
			if (clientRects.length > 0) {
				if (isEqual(clientRect, clientRects[clientRects.length - 1])) {
					return;
				}
			}
			clientRects.push(clientRect);
		};
		var addCharacterOffset = function (container, offset) {
			var range = createRange(container.ownerDocument);
			if (offset < container.data.length) {
				if (isExtendingChar(container.data[offset])) {
					return clientRects;
				}
				if (isExtendingChar(container.data[offset - 1])) {
					range.setStart(container, offset);
					range.setEnd(container, offset + 1);
					if (!isHiddenWhiteSpaceRange(range)) {
						addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(range), false));
						return clientRects;
					}
				}
			}
			if (offset > 0) {
				range.setStart(container, offset - 1);
				range.setEnd(container, offset);
				if (!isHiddenWhiteSpaceRange(range)) {
					addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(range), false));
				}
			}
			if (offset < container.data.length) {
				range.setStart(container, offset);
				range.setEnd(container, offset + 1);
				if (!isHiddenWhiteSpaceRange(range)) {
					addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(range), true));
				}
			}
		};
		if (isText$4(caretPosition.container())) {
			addCharacterOffset(caretPosition.container(), caretPosition.offset());
			return clientRects;
		}
		if (isElement$3(caretPosition.container())) {
			if (caretPosition.isAtEnd()) {
				node = resolveIndex(caretPosition.container(), caretPosition.offset());
				if (isText$4(node)) {
					addCharacterOffset(node, node.data.length);
				}
				if (isValidElementCaretCandidate(node) && !isBr$3(node)) {
					addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(node), false));
				}
			} else {
				node = resolveIndex(caretPosition.container(), caretPosition.offset());
				if (isText$4(node)) {
					addCharacterOffset(node, 0);
				}
				if (isValidElementCaretCandidate(node) && caretPosition.isAtEnd()) {
					addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(node), false));
					return clientRects;
				}
				beforeNode = resolveIndex(caretPosition.container(), caretPosition.offset() - 1);
				if (isValidElementCaretCandidate(beforeNode) && !isBr$3(beforeNode)) {
					if (isBlock$1(beforeNode) || isBlock$1(node) || !isValidElementCaretCandidate(node)) {
						addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(beforeNode), false));
					}
				}
				if (isValidElementCaretCandidate(node)) {
					addUniqueAndValidRect(collapseAndInflateWidth(getBoundingClientRect(node), true));
				}
			}
		}
		return clientRects;
	};
	function CaretPosition(container, offset, clientRects) {
		var isAtStart = function () {
			if (isText$4(container)) {
				return offset === 0;
			}
			return offset === 0;
		};
		var isAtEnd = function () {
			if (isText$4(container)) {
				return offset >= container.data.length;
			}
			return offset >= container.childNodes.length;
		};
		var toRange = function () {
			var range = createRange(container.ownerDocument);
			range.setStart(container, offset);
			range.setEnd(container, offset);
			return range;
		};
		var getClientRects = function () {
			if (!clientRects) {
				clientRects = getCaretPositionClientRects(CaretPosition(container, offset));
			}
			return clientRects;
		};
		var isVisible = function () {
			return getClientRects().length > 0;
		};
		var isEqual = function (caretPosition) {
			return caretPosition && container === caretPosition.container() && offset === caretPosition.offset();
		};
		var getNode = function (before) {
			return resolveIndex(container, before ? offset - 1 : offset);
		};
		return {
			container: constant(container),
			offset: constant(offset),
			toRange: toRange,
			getClientRects: getClientRects,
			isVisible: isVisible,
			isAtStart: isAtStart,
			isAtEnd: isAtEnd,
			isEqual: isEqual,
			getNode: getNode
		};
	}
	(function (CaretPosition) {
		CaretPosition.fromRangeStart = function (range) {
			return CaretPosition(range.startContainer, range.startOffset);
		};
		CaretPosition.fromRangeEnd = function (range) {
			return CaretPosition(range.endContainer, range.endOffset);
		};
		CaretPosition.after = function (node) {
			return CaretPosition(node.parentNode, nodeIndex(node) + 1);
		};
		CaretPosition.before = function (node) {
			return CaretPosition(node.parentNode, nodeIndex(node));
		};
		CaretPosition.isAbove = function (pos1, pos2) {
			return lift2(head(pos2.getClientRects()), last(pos1.getClientRects()), isAbove).getOr(false);
		};
		CaretPosition.isBelow = function (pos1, pos2) {
			return lift2(last(pos2.getClientRects()), head(pos1.getClientRects()), isBelow).getOr(false);
		};
		CaretPosition.isAtStart = function (pos) {
			return pos ? pos.isAtStart() : false;
		};
		CaretPosition.isAtEnd = function (pos) {
			return pos ? pos.isAtEnd() : false;
		};
		CaretPosition.isTextPosition = function (pos) {
			return pos ? isText$1(pos.container()) : false;
		};
		CaretPosition.isElementPosition = function (pos) {
			return CaretPosition.isTextPosition(pos) === false;
		};
	}(CaretPosition || (CaretPosition = {})));
	var CaretPosition$1 = CaretPosition;

	var trimEmptyTextNode = function (dom, node) {
		if (isText$1(node) && node.data.length === 0) {
			dom.remove(node);
		}
	};
	var insertNode = function (dom, rng, node) {
		rng.insertNode(node);
		trimEmptyTextNode(dom, node.previousSibling);
		trimEmptyTextNode(dom, node.nextSibling);
	};
	var insertFragment = function (dom, rng, frag) {
		var firstChild = Optional.from(frag.firstChild);
		var lastChild = Optional.from(frag.lastChild);
		rng.insertNode(frag);
		firstChild.each(function (child) {
			return trimEmptyTextNode(dom, child.previousSibling);
		});
		lastChild.each(function (child) {
			return trimEmptyTextNode(dom, child.nextSibling);
		});
	};
	var rangeInsertNode = function (dom, rng, node) {
		if (isDocumentFragment$1(node)) {
			insertFragment(dom, rng, node);
		} else {
			insertNode(dom, rng, node);
		}
	};

	var isText$5 = isText$1;
	var isBogus$2 = isBogus;
	var nodeIndex$1 = DOMUtils$1.nodeIndex;
	var normalizedParent = function (node) {
		var parentNode = node.parentNode;
		if (isBogus$2(parentNode)) {
			return normalizedParent(parentNode);
		}
		return parentNode;
	};
	var getChildNodes = function (node) {
		if (!node) {
			return [];
		}
		return reduce(node.childNodes, function (result, node) {
			if (isBogus$2(node) && node.nodeName !== 'BR') {
				result = result.concat(getChildNodes(node));
			} else {
				result.push(node);
			}
			return result;
		}, []);
	};
	var normalizedTextOffset = function (node, offset) {
		while (node = node.previousSibling) {
			if (!isText$5(node)) {
				break;
			}
			offset += node.data.length;
		}
		return offset;
	};
	var equal$1 = function (a) {
		return function (b) {
			return a === b;
		};
	};
	var normalizedNodeIndex = function (node) {
		var nodes, index;
		nodes = getChildNodes(normalizedParent(node));
		index = findIndex$1(nodes, equal$1(node), node);
		nodes = nodes.slice(0, index + 1);
		var numTextFragments = reduce(nodes, function (result, node, i) {
			if (isText$5(node) && isText$5(nodes[i - 1])) {
				result++;
			}
			return result;
		}, 0);
		nodes = filter$2(nodes, matchNodeNames([node.nodeName]));
		index = findIndex$1(nodes, equal$1(node), node);
		return index - numTextFragments;
	};
	var createPathItem = function (node) {
		var name;
		if (isText$5(node)) {
			name = 'text()';
		} else {
			name = node.nodeName.toLowerCase();
		}
		return name + '[' + normalizedNodeIndex(node) + ']';
	};
	var parentsUntil = function (root, node, predicate) {
		var parents = [];
		for (node = node.parentNode; node !== root; node = node.parentNode) {
			if (predicate && predicate(node)) {
				break;
			}
			parents.push(node);
		}
		return parents;
	};
	var create$3 = function (root, caretPosition) {
		var container, offset, path = [], outputOffset, childNodes, parents;
		container = caretPosition.container();
		offset = caretPosition.offset();
		if (isText$5(container)) {
			outputOffset = normalizedTextOffset(container, offset);
		} else {
			childNodes = container.childNodes;
			if (offset >= childNodes.length) {
				outputOffset = 'after';
				offset = childNodes.length - 1;
			} else {
				outputOffset = 'before';
			}
			container = childNodes[offset];
		}
		path.push(createPathItem(container));
		parents = parentsUntil(root, container);
		parents = filter$2(parents, not(isBogus));
		path = path.concat(map$2(parents, function (node) {
			return createPathItem(node);
		}));
		return path.reverse().join('/') + ',' + outputOffset;
	};
	var resolvePathItem = function (node, name, index) {
		var nodes = getChildNodes(node);
		nodes = filter$2(nodes, function (node, index) {
			return !isText$5(node) || !isText$5(nodes[index - 1]);
		});
		nodes = filter$2(nodes, matchNodeNames([name]));
		return nodes[index];
	};
	var findTextPosition = function (container, offset) {
		var node = container, targetOffset = 0, dataLen;
		while (isText$5(node)) {
			dataLen = node.data.length;
			if (offset >= targetOffset && offset <= targetOffset + dataLen) {
				container = node;
				offset = offset - targetOffset;
				break;
			}
			if (!isText$5(node.nextSibling)) {
				container = node;
				offset = dataLen;
				break;
			}
			targetOffset += dataLen;
			node = node.nextSibling;
		}
		if (isText$5(container) && offset > container.data.length) {
			offset = container.data.length;
		}
		return CaretPosition$1(container, offset);
	};
	var resolve$1 = function (root, path) {
		var offset;
		if (!path) {
			return null;
		}
		var parts = path.split(',');
		var paths = parts[0].split('/');
		offset = parts.length > 1 ? parts[1] : 'before';
		var container = reduce(paths, function (result, value) {
			var match = /([\w\-\(\)]+)\[([0-9]+)\]/.exec(value);
			if (!match) {
				return null;
			}
			if (match[1] === 'text()') {
				match[1] = '#text';
			}
			return resolvePathItem(result, match[1], parseInt(match[2], 10));
		}, root);
		if (!container) {
			return null;
		}
		if (!isText$5(container)) {
			if (offset === 'after') {
				offset = nodeIndex$1(container) + 1;
			} else {
				offset = nodeIndex$1(container);
			}
			return CaretPosition$1(container.parentNode, offset);
		}
		return findTextPosition(container, parseInt(offset, 10));
	};

	var isContentEditableFalse$2 = isContentEditableFalse;
	var getNormalizedTextOffset = function (trim, container, offset) {
		var node, trimmedOffset;
		trimmedOffset = trim(container.data.slice(0, offset)).length;
		for (node = container.previousSibling; node && isText$1(node); node = node.previousSibling) {
			trimmedOffset += trim(node.data).length;
		}
		return trimmedOffset;
	};
	var getPoint = function (dom, trim, normalized, rng, start) {
		var container = rng[start ? 'startContainer' : 'endContainer'];
		var offset = rng[start ? 'startOffset' : 'endOffset'];
		var point = [];
		var childNodes, after = 0;
		var root = dom.getRoot();
		if (isText$1(container)) {
			point.push(normalized ? getNormalizedTextOffset(trim, container, offset) : offset);
		} else {
			childNodes = container.childNodes;
			if (offset >= childNodes.length && childNodes.length) {
				after = 1;
				offset = Math.max(0, childNodes.length - 1);
			}
			point.push(dom.nodeIndex(childNodes[offset], normalized) + after);
		}
		for (; container && container !== root; container = container.parentNode) {
			point.push(dom.nodeIndex(container, normalized));
		}
		return point;
	};
	var getLocation = function (trim, selection, normalized, rng) {
		var dom = selection.dom, bookmark = {};
		bookmark.start = getPoint(dom, trim, normalized, rng, true);
		if (!selection.isCollapsed()) {
			bookmark.end = getPoint(dom, trim, normalized, rng, false);
		}
		return bookmark;
	};
	var findIndex$2 = function (dom, name, element) {
		var count = 0;
		Tools.each(dom.select(name), function (node) {
			if (node.getAttribute('data-mce-bogus') === 'all') {
				return;
			}
			if (node === element) {
				return false;
			}
			count++;
		});
		return count;
	};
	var moveEndPoint = function (rng, start) {
		var container, offset, childNodes;
		var prefix = start ? 'start' : 'end';
		container = rng[prefix + 'Container'];
		offset = rng[prefix + 'Offset'];
		if (isElement$1(container) && container.nodeName === 'TR') {
			childNodes = container.childNodes;
			container = childNodes[Math.min(start ? offset : offset - 1, childNodes.length - 1)];
			if (container) {
				offset = start ? 0 : container.childNodes.length;
				rng['set' + (start ? 'Start' : 'End')](container, offset);
			}
		}
	};
	var normalizeTableCellSelection = function (rng) {
		moveEndPoint(rng, true);
		moveEndPoint(rng, false);
		return rng;
	};
	var findSibling = function (node, offset) {
		var sibling;
		if (isElement$1(node)) {
			node = getNode(node, offset);
			if (isContentEditableFalse$2(node)) {
				return node;
			}
		}
		if (isCaretContainer(node)) {
			if (isText$1(node) && isCaretContainerBlock(node)) {
				node = node.parentNode;
			}
			sibling = node.previousSibling;
			if (isContentEditableFalse$2(sibling)) {
				return sibling;
			}
			sibling = node.nextSibling;
			if (isContentEditableFalse$2(sibling)) {
				return sibling;
			}
		}
	};
	var findAdjacentContentEditableFalseElm = function (rng) {
		return findSibling(rng.startContainer, rng.startOffset) || findSibling(rng.endContainer, rng.endOffset);
	};
	var getOffsetBookmark = function (trim, normalized, selection) {
		var element = selection.getNode();
		var name = element ? element.nodeName : null;
		var rng = selection.getRng();
		if (isContentEditableFalse$2(element) || name === 'IMG') {
			return {
				name: name,
				index: findIndex$2(selection.dom, name, element)
			};
		}
		var sibling = findAdjacentContentEditableFalseElm(rng);
		if (sibling) {
			name = sibling.tagName;
			return {
				name: name,
				index: findIndex$2(selection.dom, name, sibling)
			};
		}
		return getLocation(trim, selection, normalized, rng);
	};
	var getCaretBookmark = function (selection) {
		var rng = selection.getRng();
		return {
			start: create$3(selection.dom.getRoot(), CaretPosition$1.fromRangeStart(rng)),
			end: create$3(selection.dom.getRoot(), CaretPosition$1.fromRangeEnd(rng))
		};
	};
	var getRangeBookmark = function (selection) {
		return { rng: selection.getRng() };
	};
	var createBookmarkSpan = function (dom, id, filled) {
		var args = {
			'data-mce-type': 'bookmark',
			id: id,
			'style': 'overflow:hidden;line-height:0px'
		};
		return filled ? dom.create('span', args, '&#xFEFF;') : dom.create('span', args);
	};
	var getPersistentBookmark = function (selection, filled) {
		var dom = selection.dom;
		var rng = selection.getRng();
		var id = dom.uniqueId();
		var collapsed = selection.isCollapsed();
		var element = selection.getNode();
		var name = element.nodeName;
		if (name === 'IMG') {
			return {
				name: name,
				index: findIndex$2(dom, name, element)
			};
		}
		var rng2 = normalizeTableCellSelection(rng.cloneRange());
		if (!collapsed) {
			rng2.collapse(false);
			var endBookmarkNode = createBookmarkSpan(dom, id + '_end', filled);
			rangeInsertNode(dom, rng2, endBookmarkNode);
		}
		rng = normalizeTableCellSelection(rng);
		rng.collapse(true);
		var startBookmarkNode = createBookmarkSpan(dom, id + '_start', filled);
		rangeInsertNode(dom, rng, startBookmarkNode);
		selection.moveToBookmark({
			id: id,
			keep: true
		});
		return { id: id };
	};
	var getBookmark = function (selection, type, normalized) {
		if (type === 2) {
			return getOffsetBookmark(trim$2, normalized, selection);
		} else if (type === 3) {
			return getCaretBookmark(selection);
		} else if (type) {
			return getRangeBookmark(selection);
		} else {
			return getPersistentBookmark(selection, false);
		}
	};
	var getUndoBookmark = curry(getOffsetBookmark, identity, true);

	var DOM$1 = DOMUtils$1.DOM;
	var defaultPreviewStyles = 'font-family font-size font-weight font-style text-decoration text-transform color background-color border border-radius outline text-shadow';
	var getBodySetting = function (editor, name, defaultValue) {
		var value = editor.getParam(name, defaultValue);
		if (value.indexOf('=') !== -1) {
			var bodyObj = editor.getParam(name, '', 'hash');
			return bodyObj.hasOwnProperty(editor.id) ? bodyObj[editor.id] : defaultValue;
		} else {
			return value;
		}
	};
	var getIframeAttrs = function (editor) {
		return editor.getParam('iframe_attrs', {});
	};
	var getDocType = function (editor) {
		return editor.getParam('doctype', '<!DOCTYPE html>');
	};
	var getDocumentBaseUrl = function (editor) {
		return editor.getParam('document_base_url', '');
	};
	var getBodyId = function (editor) {
		return getBodySetting(editor, 'body_id', 'tinymce');
	};
	var getBodyClass = function (editor) {
		return getBodySetting(editor, 'body_class', '');
	};
	var getContentSecurityPolicy = function (editor) {
		return editor.getParam('content_security_policy', '');
	};
	var shouldPutBrInPre = function (editor) {
		return editor.getParam('br_in_pre', true);
	};
	var getForcedRootBlock = function (editor) {
		if (editor.getParam('force_p_newlines', false)) {
			return 'p';
		}
		var block = editor.getParam('forced_root_block', 'p');
		if (block === false) {
			return '';
		} else if (block === true) {
			return 'p';
		} else {
			return block;
		}
	};
	var getForcedRootBlockAttrs = function (editor) {
		return editor.getParam('forced_root_block_attrs', {});
	};
	var getBrNewLineSelector = function (editor) {
		return editor.getParam('br_newline_selector', '.mce-toc h2,figcaption,caption');
	};
	var getNoNewLineSelector = function (editor) {
		return editor.getParam('no_newline_selector', '');
	};
	var shouldKeepStyles = function (editor) {
		return editor.getParam('keep_styles', true);
	};
	var shouldEndContainerOnEmptyBlock = function (editor) {
		return editor.getParam('end_container_on_empty_block', false);
	};
	var getFontStyleValues = function (editor) {
		return Tools.explode(editor.getParam('font_size_style_values', 'xx-small,x-small,small,medium,large,x-large,xx-large'));
	};
	var getFontSizeClasses = function (editor) {
		return Tools.explode(editor.getParam('font_size_classes', ''));
	};
	var getImagesDataImgFilter = function (editor) {
		return editor.getParam('images_dataimg_filter', always, 'function');
	};
	var isAutomaticUploadsEnabled = function (editor) {
		return editor.getParam('automatic_uploads', true, 'boolean');
	};
	var shouldReuseFileName = function (editor) {
		return editor.getParam('images_reuse_filename', false, 'boolean');
	};
	var shouldReplaceBlobUris = function (editor) {
		return editor.getParam('images_replace_blob_uris', true, 'boolean');
	};
	var getIconPackName = function (editor) {
		return editor.getParam('icons', '', 'string');
	};
	var getIconsUrl = function (editor) {
		return editor.getParam('icons_url', '', 'string');
	};
	var getImageUploadUrl = function (editor) {
		return editor.getParam('images_upload_url', '', 'string');
	};
	var getImageUploadBasePath = function (editor) {
		return editor.getParam('images_upload_base_path', '', 'string');
	};
	var getImagesUploadCredentials = function (editor) {
		return editor.getParam('images_upload_credentials', false, 'boolean');
	};
	var getImagesUploadHandler = function (editor) {
		return editor.getParam('images_upload_handler', null, 'function');
	};
	var shouldUseContentCssCors = function (editor) {
		return editor.getParam('content_css_cors', false, 'boolean');
	};
	var getReferrerPolicy = function (editor) {
		return editor.getParam('referrer_policy', '', 'string');
	};
	var getLanguageCode = function (editor) {
		return editor.getParam('language', 'en', 'string');
	};
	var getLanguageUrl = function (editor) {
		return editor.getParam('language_url', '', 'string');
	};
	var shouldIndentUseMargin = function (editor) {
		return editor.getParam('indent_use_margin', false);
	};
	var getIndentation = function (editor) {
		return editor.getParam('indentation', '40px', 'string');
	};
	var getContentCss = function (editor) {
		var contentCss = editor.getParam('content_css');
		if (isString(contentCss)) {
			return map(contentCss.split(','), trim);
		} else if (isArray(contentCss)) {
			return contentCss;
		} else if (contentCss === false || editor.inline) {
			return [];
		} else {
			return ['default'];
		}
	};
	var getDirectionality = function (editor) {
		return editor.getParam('directionality', I18n.isRtl() ? 'rtl' : undefined);
	};
	var getInlineBoundarySelector = function (editor) {
		return editor.getParam('inline_boundaries_selector', 'a[href],code,.mce-annotation', 'string');
	};
	var getObjectResizing = function (editor) {
		var selector = editor.getParam('object_resizing');
		if (selector === false || Env.iOS) {
			return false;
		} else {
			return isString(selector) ? selector : 'table,img,figure.image,div';
		}
	};
	var getResizeImgProportional = function (editor) {
		return editor.getParam('resize_img_proportional', true, 'boolean');
	};
	var getPlaceholder = function (editor) {
		return editor.getParam('placeholder', DOM$1.getAttrib(editor.getElement(), 'placeholder'), 'string');
	};
	var getEventRoot = function (editor) {
		return editor.getParam('event_root');
	};
	var getServiceMessage = function (editor) {
		return editor.getParam('service_message');
	};
	var getTheme = function (editor) {
		return editor.getParam('theme');
	};
	var shouldValidate = function (editor) {
		return editor.getParam('validate');
	};
	var isInlineBoundariesEnabled = function (editor) {
		return editor.getParam('inline_boundaries') !== false;
	};
	var getFormats = function (editor) {
		return editor.getParam('formats');
	};
	var getPreviewStyles = function (editor) {
		var style = editor.getParam('preview_styles', defaultPreviewStyles);
		if (isString(style)) {
			return style;
		} else {
			return '';
		}
	};
	var canFormatEmptyLines = function (editor) {
		return editor.getParam('format_empty_lines', false, 'boolean');
	};
	var getCustomUiSelector = function (editor) {
		return editor.getParam('custom_ui_selector', '', 'string');
	};
	var getThemeUrl = function (editor) {
		return editor.getParam('theme_url');
	};
	var isInline$1 = function (editor) {
		return editor.getParam('inline');
	};
	var hasHiddenInput = function (editor) {
		return editor.getParam('hidden_input');
	};
	var shouldPatchSubmit = function (editor) {
		return editor.getParam('submit_patch');
	};
	var isEncodingXml = function (editor) {
		return editor.getParam('encoding') === 'xml';
	};
	var shouldAddFormSubmitTrigger = function (editor) {
		return editor.getParam('add_form_submit_trigger');
	};
	var shouldAddUnloadTrigger = function (editor) {
		return editor.getParam('add_unload_trigger');
	};
	var hasForcedRootBlock = function (editor) {
		return getForcedRootBlock(editor) !== '';
	};
	var getCustomUndoRedoLevels = function (editor) {
		return editor.getParam('custom_undo_redo_levels', 0, 'number');
	};
	var shouldDisableNodeChange = function (editor) {
		return editor.getParam('disable_nodechange');
	};
	var isReadOnly = function (editor) {
		return editor.getParam('readonly');
	};
	var hasContentCssCors = function (editor) {
		return editor.getParam('content_css_cors');
	};
	var getPlugins = function (editor) {
		return editor.getParam('plugins', '', 'string');
	};
	var getExternalPlugins = function (editor) {
		return editor.getParam('external_plugins');
	};
	var shouldBlockUnsupportedDrop = function (editor) {
		return editor.getParam('block_unsupported_drop', true, 'boolean');
	};
	var isVisualAidsEnabled = function (editor) {
		return editor.getParam('visual', true, 'boolean');
	};
	var getVisualAidsTableClass = function (editor) {
		return editor.getParam('visual_table_class', 'mce-item-table', 'string');
	};
	var getVisualAidsAnchorClass = function (editor) {
		return editor.getParam('visual_anchor_class', 'mce-item-anchor', 'string');
	};

	var isElement$4 = isElement$1;
	var isText$6 = isText$1;
	var removeNode = function (node) {
		var parentNode = node.parentNode;
		if (parentNode) {
			parentNode.removeChild(node);
		}
	};
	var trimCount = function (text) {
		var trimmedText = trim$2(text);
		return {
			count: text.length - trimmedText.length,
			text: trimmedText
		};
	};
	var deleteZwspChars = function (caretContainer) {
		var idx;
		while ((idx = caretContainer.data.lastIndexOf(ZWSP)) !== -1) {
			caretContainer.deleteData(idx, 1);
		}
	};
	var removeUnchanged = function (caretContainer, pos) {
		remove$5(caretContainer);
		return pos;
	};
	var removeTextAndReposition = function (caretContainer, pos) {
		var before = trimCount(caretContainer.data.substr(0, pos.offset()));
		var after = trimCount(caretContainer.data.substr(pos.offset()));
		var text = before.text + after.text;
		if (text.length > 0) {
			deleteZwspChars(caretContainer);
			return CaretPosition$1(caretContainer, pos.offset() - before.count);
		} else {
			return pos;
		}
	};
	var removeElementAndReposition = function (caretContainer, pos) {
		var parentNode = pos.container();
		var newPosition = indexOf(from$1(parentNode.childNodes), caretContainer).map(function (index) {
			return index < pos.offset() ? CaretPosition$1(parentNode, pos.offset() - 1) : pos;
		}).getOr(pos);
		remove$5(caretContainer);
		return newPosition;
	};
	var removeTextCaretContainer = function (caretContainer, pos) {
		return isText$6(caretContainer) && pos.container() === caretContainer ? removeTextAndReposition(caretContainer, pos) : removeUnchanged(caretContainer, pos);
	};
	var removeElementCaretContainer = function (caretContainer, pos) {
		return pos.container() === caretContainer.parentNode ? removeElementAndReposition(caretContainer, pos) : removeUnchanged(caretContainer, pos);
	};
	var removeAndReposition = function (container, pos) {
		return CaretPosition$1.isTextPosition(pos) ? removeTextCaretContainer(container, pos) : removeElementCaretContainer(container, pos);
	};
	var remove$5 = function (caretContainerNode) {
		if (isElement$4(caretContainerNode) && isCaretContainer(caretContainerNode)) {
			if (hasContent(caretContainerNode)) {
				caretContainerNode.removeAttribute('data-mce-caret');
			} else {
				removeNode(caretContainerNode);
			}
		}
		if (isText$6(caretContainerNode)) {
			deleteZwspChars(caretContainerNode);
			if (caretContainerNode.data.length === 0) {
				removeNode(caretContainerNode);
			}
		}
	};

	var browser$2 = detect$3().browser;
	var isContentEditableFalse$3 = isContentEditableFalse;
	var isMedia$1 = isMedia;
	var isTableCell$2 = isTableCell;
	var inlineFakeCaretSelector = '*[contentEditable=false],video,audio,embed,object';
	var getAbsoluteClientRect = function (root, element, before) {
		var clientRect = collapse(element.getBoundingClientRect(), before);
		var docElm, scrollX, scrollY, margin, rootRect;
		if (root.tagName === 'BODY') {
			docElm = root.ownerDocument.documentElement;
			scrollX = root.scrollLeft || docElm.scrollLeft;
			scrollY = root.scrollTop || docElm.scrollTop;
		} else {
			rootRect = root.getBoundingClientRect();
			scrollX = root.scrollLeft - rootRect.left;
			scrollY = root.scrollTop - rootRect.top;
		}
		clientRect.left += scrollX;
		clientRect.right += scrollX;
		clientRect.top += scrollY;
		clientRect.bottom += scrollY;
		clientRect.width = 1;
		margin = element.offsetWidth - element.clientWidth;
		if (margin > 0) {
			if (before) {
				margin *= -1;
			}
			clientRect.left += margin;
			clientRect.right += margin;
		}
		return clientRect;
	};
	var trimInlineCaretContainers = function (root) {
		var fakeCaretTargetNodes = descendants$1(SugarElement.fromDom(root), inlineFakeCaretSelector);
		for (var i = 0; i < fakeCaretTargetNodes.length; i++) {
			var node = fakeCaretTargetNodes[i].dom;
			var sibling = node.previousSibling;
			if (endsWithCaretContainer(sibling)) {
				var data = sibling.data;
				if (data.length === 1) {
					sibling.parentNode.removeChild(sibling);
				} else {
					sibling.deleteData(data.length - 1, 1);
				}
			}
			sibling = node.nextSibling;
			if (startsWithCaretContainer(sibling)) {
				var data = sibling.data;
				if (data.length === 1) {
					sibling.parentNode.removeChild(sibling);
				} else {
					sibling.deleteData(0, 1);
				}
			}
		}
	};
	var FakeCaret = function (editor, root, isBlock, hasFocus) {
		var lastVisualCaret = Cell(Optional.none());
		var cursorInterval, caretContainerNode;
		var rootBlock = getForcedRootBlock(editor);
		var caretBlock = rootBlock.length > 0 ? rootBlock : 'p';
		var show = function (before, element) {
			var clientRect, rng;
			hide();
			if (isTableCell$2(element)) {
				return null;
			}
			if (isBlock(element)) {
				caretContainerNode = insertBlock(caretBlock, element, before);
				clientRect = getAbsoluteClientRect(root, element, before);
				DomQuery(caretContainerNode).css('top', clientRect.top);
				var caret = DomQuery('<div class="mce-visual-caret" data-mce-bogus="all"></div>').css(clientRect).appendTo(root)[0];
				lastVisualCaret.set(Optional.some({
					caret: caret,
					element: element,
					before: before
				}));
				lastVisualCaret.get().each(function (caretState) {
					if (before) {
						DomQuery(caretState.caret).addClass('mce-visual-caret-before');
					}
				});
				startBlink();
				rng = element.ownerDocument.createRange();
				rng.setStart(caretContainerNode, 0);
				rng.setEnd(caretContainerNode, 0);
			} else {
				caretContainerNode = insertInline(element, before);
				rng = element.ownerDocument.createRange();
				if (isInlineFakeCaretTarget(caretContainerNode.nextSibling)) {
					rng.setStart(caretContainerNode, 0);
					rng.setEnd(caretContainerNode, 0);
				} else {
					rng.setStart(caretContainerNode, 1);
					rng.setEnd(caretContainerNode, 1);
				}
				return rng;
			}
			return rng;
		};
		var hide = function () {
			trimInlineCaretContainers(root);
			if (caretContainerNode) {
				remove$5(caretContainerNode);
				caretContainerNode = null;
			}
			lastVisualCaret.get().each(function (caretState) {
				DomQuery(caretState.caret).remove();
				lastVisualCaret.set(Optional.none());
			});
			if (cursorInterval) {
				Delay.clearInterval(cursorInterval);
				cursorInterval = null;
			}
		};
		var startBlink = function () {
			cursorInterval = Delay.setInterval(function () {
				if (hasFocus()) {
					DomQuery('div.mce-visual-caret', root).toggleClass('mce-visual-caret-hidden');
				} else {
					DomQuery('div.mce-visual-caret', root).addClass('mce-visual-caret-hidden');
				}
			}, 500);
		};
		var reposition = function () {
			lastVisualCaret.get().each(function (caretState) {
				var clientRect = getAbsoluteClientRect(root, caretState.element, caretState.before);
				DomQuery(caretState.caret).css(__assign({}, clientRect));
			});
		};
		var destroy = function () {
			return Delay.clearInterval(cursorInterval);
		};
		var getCss = function () {
			return '.mce-visual-caret {' + 'position: absolute;' + 'background-color: black;' + 'background-color: currentcolor;' + '}' + '.mce-visual-caret-hidden {' + 'display: none;' + '}' + '*[data-mce-caret] {' + 'position: absolute;' + 'left: -1000px;' + 'right: auto;' + 'top: 0;' + 'margin: 0;' + 'padding: 0;' + '}';
		};
		return {
			show: show,
			hide: hide,
			getCss: getCss,
			reposition: reposition,
			destroy: destroy
		};
	};
	var isFakeCaretTableBrowser = function () {
		return browser$2.isIE() || browser$2.isEdge() || browser$2.isFirefox();
	};
	var isInlineFakeCaretTarget = function (node) {
		return isContentEditableFalse$3(node) || isMedia$1(node);
	};
	var isFakeCaretTarget = function (node) {
		return isInlineFakeCaretTarget(node) || isTable(node) && isFakeCaretTableBrowser();
	};

	var isContentEditableFalse$4 = isContentEditableFalse;
	var isMedia$2 = isMedia;
	var isBlockLike = matchStyleValues('display', 'block table table-cell table-caption list-item');
	var isCaretContainer$2 = isCaretContainer;
	var isCaretContainerBlock$1 = isCaretContainerBlock;
	var isElement$5 = isElement$1;
	var isCaretCandidate$2 = isCaretCandidate;
	var isForwards = function (direction) {
		return direction > 0;
	};
	var isBackwards = function (direction) {
		return direction < 0;
	};
	var skipCaretContainers = function (walk, shallow) {
		var node;
		while (node = walk(shallow)) {
			if (!isCaretContainerBlock$1(node)) {
				return node;
			}
		}
		return null;
	};
	var findNode = function (node, direction, predicateFn, rootNode, shallow) {
		var walker = new DomTreeWalker(node, rootNode);
		var isCefOrCaretContainer = isContentEditableFalse$4(node) || isCaretContainerBlock$1(node);
		if (isBackwards(direction)) {
			if (isCefOrCaretContainer) {
				node = skipCaretContainers(walker.prev, true);
				if (predicateFn(node)) {
					return node;
				}
			}
			while (node = skipCaretContainers(walker.prev, shallow)) {
				if (predicateFn(node)) {
					return node;
				}
			}
		}
		if (isForwards(direction)) {
			if (isCefOrCaretContainer) {
				node = skipCaretContainers(walker.next, true);
				if (predicateFn(node)) {
					return node;
				}
			}
			while (node = skipCaretContainers(walker.next, shallow)) {
				if (predicateFn(node)) {
					return node;
				}
			}
		}
		return null;
	};
	var getParentBlock = function (node, rootNode) {
		while (node && node !== rootNode) {
			if (isBlockLike(node)) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	};
	var isInSameBlock = function (caretPosition1, caretPosition2, rootNode) {
		return getParentBlock(caretPosition1.container(), rootNode) === getParentBlock(caretPosition2.container(), rootNode);
	};
	var getChildNodeAtRelativeOffset = function (relativeOffset, caretPosition) {
		if (!caretPosition) {
			return null;
		}
		var container = caretPosition.container();
		var offset = caretPosition.offset();
		if (!isElement$5(container)) {
			return null;
		}
		return container.childNodes[offset + relativeOffset];
	};
	var beforeAfter = function (before, node) {
		var range = node.ownerDocument.createRange();
		if (before) {
			range.setStartBefore(node);
			range.setEndBefore(node);
		} else {
			range.setStartAfter(node);
			range.setEndAfter(node);
		}
		return range;
	};
	var isNodesInSameBlock = function (root, node1, node2) {
		return getParentBlock(node1, root) === getParentBlock(node2, root);
	};
	var lean = function (left, root, node) {
		var sibling, siblingName;
		if (left) {
			siblingName = 'previousSibling';
		} else {
			siblingName = 'nextSibling';
		}
		while (node && node !== root) {
			sibling = node[siblingName];
			if (isCaretContainer$2(sibling)) {
				sibling = sibling[siblingName];
			}
			if (isContentEditableFalse$4(sibling) || isMedia$2(sibling)) {
				if (isNodesInSameBlock(root, sibling, node)) {
					return sibling;
				}
				break;
			}
			if (isCaretCandidate$2(sibling)) {
				break;
			}
			node = node.parentNode;
		}
		return null;
	};
	var before$2 = curry(beforeAfter, true);
	var after$1 = curry(beforeAfter, false);
	var normalizeRange = function (direction, root, range) {
		var node, container, location;
		var leanLeft = curry(lean, true, root);
		var leanRight = curry(lean, false, root);
		container = range.startContainer;
		var offset = range.startOffset;
		if (isCaretContainerBlock(container)) {
			if (!isElement$5(container)) {
				container = container.parentNode;
			}
			location = container.getAttribute('data-mce-caret');
			if (location === 'before') {
				node = container.nextSibling;
				if (isFakeCaretTarget(node)) {
					return before$2(node);
				}
			}
			if (location === 'after') {
				node = container.previousSibling;
				if (isFakeCaretTarget(node)) {
					return after$1(node);
				}
			}
		}
		if (!range.collapsed) {
			return range;
		}
		if (isText$1(container)) {
			if (isCaretContainer$2(container)) {
				if (direction === 1) {
					node = leanRight(container);
					if (node) {
						return before$2(node);
					}
					node = leanLeft(container);
					if (node) {
						return after$1(node);
					}
				}
				if (direction === -1) {
					node = leanLeft(container);
					if (node) {
						return after$1(node);
					}
					node = leanRight(container);
					if (node) {
						return before$2(node);
					}
				}
				return range;
			}
			if (endsWithCaretContainer(container) && offset >= container.data.length - 1) {
				if (direction === 1) {
					node = leanRight(container);
					if (node) {
						return before$2(node);
					}
				}
				return range;
			}
			if (startsWithCaretContainer(container) && offset <= 1) {
				if (direction === -1) {
					node = leanLeft(container);
					if (node) {
						return after$1(node);
					}
				}
				return range;
			}
			if (offset === container.data.length) {
				node = leanRight(container);
				if (node) {
					return before$2(node);
				}
				return range;
			}
			if (offset === 0) {
				node = leanLeft(container);
				if (node) {
					return after$1(node);
				}
				return range;
			}
		}
		return range;
	};
	var getRelativeCefElm = function (forward, caretPosition) {
		return Optional.from(getChildNodeAtRelativeOffset(forward ? 0 : -1, caretPosition)).filter(isContentEditableFalse$4);
	};
	var getNormalizedRangeEndPoint = function (direction, root, range) {
		var normalizedRange = normalizeRange(direction, root, range);
		if (direction === -1) {
			return CaretPosition.fromRangeStart(normalizedRange);
		}
		return CaretPosition.fromRangeEnd(normalizedRange);
	};
	var getElementFromPosition = function (pos) {
		return Optional.from(pos.getNode()).map(SugarElement.fromDom);
	};
	var getElementFromPrevPosition = function (pos) {
		return Optional.from(pos.getNode(true)).map(SugarElement.fromDom);
	};
	var getVisualCaretPosition = function (walkFn, caretPosition) {
		while (caretPosition = walkFn(caretPosition)) {
			if (caretPosition.isVisible()) {
				return caretPosition;
			}
		}
		return caretPosition;
	};
	var isMoveInsideSameBlock = function (from, to) {
		var inSameBlock = isInSameBlock(from, to);
		if (!inSameBlock && isBr(from.getNode())) {
			return true;
		}
		return inSameBlock;
	};

	var HDirection;
	(function (HDirection) {
		HDirection[HDirection['Backwards'] = -1] = 'Backwards';
		HDirection[HDirection['Forwards'] = 1] = 'Forwards';
	}(HDirection || (HDirection = {})));
	var isContentEditableFalse$5 = isContentEditableFalse;
	var isText$7 = isText$1;
	var isElement$6 = isElement$1;
	var isBr$4 = isBr;
	var isCaretCandidate$3 = isCaretCandidate;
	var isAtomic$1 = isAtomic;
	var isEditableCaretCandidate$1 = isEditableCaretCandidate;
	var getParents = function (node, root) {
		var parents = [];
		while (node && node !== root) {
			parents.push(node);
			node = node.parentNode;
		}
		return parents;
	};
	var nodeAtIndex = function (container, offset) {
		if (container.hasChildNodes() && offset < container.childNodes.length) {
			return container.childNodes[offset];
		}
		return null;
	};
	var getCaretCandidatePosition = function (direction, node) {
		if (isForwards(direction)) {
			if (isCaretCandidate$3(node.previousSibling) && !isText$7(node.previousSibling)) {
				return CaretPosition$1.before(node);
			}
			if (isText$7(node)) {
				return CaretPosition$1(node, 0);
			}
		}
		if (isBackwards(direction)) {
			if (isCaretCandidate$3(node.nextSibling) && !isText$7(node.nextSibling)) {
				return CaretPosition$1.after(node);
			}
			if (isText$7(node)) {
				return CaretPosition$1(node, node.data.length);
			}
		}
		if (isBackwards(direction)) {
			if (isBr$4(node)) {
				return CaretPosition$1.before(node);
			}
			return CaretPosition$1.after(node);
		}
		return CaretPosition$1.before(node);
	};
	var moveForwardFromBr = function (root, nextNode) {
		var nextSibling = nextNode.nextSibling;
		if (nextSibling && isCaretCandidate$3(nextSibling)) {
			if (isText$7(nextSibling)) {
				return CaretPosition$1(nextSibling, 0);
			} else {
				return CaretPosition$1.before(nextSibling);
			}
		} else {
			return findCaretPosition(HDirection.Forwards, CaretPosition$1.after(nextNode), root);
		}
	};
	var findCaretPosition = function (direction, startPos, root) {
		var node, nextNode, innerNode;
		var caretPosition;
		if (!isElement$6(root) || !startPos) {
			return null;
		}
		if (startPos.isEqual(CaretPosition$1.after(root)) && root.lastChild) {
			caretPosition = CaretPosition$1.after(root.lastChild);
			if (isBackwards(direction) && isCaretCandidate$3(root.lastChild) && isElement$6(root.lastChild)) {
				return isBr$4(root.lastChild) ? CaretPosition$1.before(root.lastChild) : caretPosition;
			}
		} else {
			caretPosition = startPos;
		}
		var container = caretPosition.container();
		var offset = caretPosition.offset();
		if (isText$7(container)) {
			if (isBackwards(direction) && offset > 0) {
				return CaretPosition$1(container, --offset);
			}
			if (isForwards(direction) && offset < container.length) {
				return CaretPosition$1(container, ++offset);
			}
			node = container;
		} else {
			if (isBackwards(direction) && offset > 0) {
				nextNode = nodeAtIndex(container, offset - 1);
				if (isCaretCandidate$3(nextNode)) {
					if (!isAtomic$1(nextNode)) {
						innerNode = findNode(nextNode, direction, isEditableCaretCandidate$1, nextNode);
						if (innerNode) {
							if (isText$7(innerNode)) {
								return CaretPosition$1(innerNode, innerNode.data.length);
							}
							return CaretPosition$1.after(innerNode);
						}
					}
					if (isText$7(nextNode)) {
						return CaretPosition$1(nextNode, nextNode.data.length);
					}
					return CaretPosition$1.before(nextNode);
				}
			}
			if (isForwards(direction) && offset < container.childNodes.length) {
				nextNode = nodeAtIndex(container, offset);
				if (isCaretCandidate$3(nextNode)) {
					if (isBr$4(nextNode)) {
						return moveForwardFromBr(root, nextNode);
					}
					if (!isAtomic$1(nextNode)) {
						innerNode = findNode(nextNode, direction, isEditableCaretCandidate$1, nextNode);
						if (innerNode) {
							if (isText$7(innerNode)) {
								return CaretPosition$1(innerNode, 0);
							}
							return CaretPosition$1.before(innerNode);
						}
					}
					if (isText$7(nextNode)) {
						return CaretPosition$1(nextNode, 0);
					}
					return CaretPosition$1.after(nextNode);
				}
			}
			node = nextNode ? nextNode : caretPosition.getNode();
		}
		if (isForwards(direction) && caretPosition.isAtEnd() || isBackwards(direction) && caretPosition.isAtStart()) {
			node = findNode(node, direction, always, root, true);
			if (isEditableCaretCandidate$1(node, root)) {
				return getCaretCandidatePosition(direction, node);
			}
		}
		nextNode = findNode(node, direction, isEditableCaretCandidate$1, root);
		var rootContentEditableFalseElm = last$1(filter(getParents(container, root), isContentEditableFalse$5));
		if (rootContentEditableFalseElm && (!nextNode || !rootContentEditableFalseElm.contains(nextNode))) {
			if (isForwards(direction)) {
				caretPosition = CaretPosition$1.after(rootContentEditableFalseElm);
			} else {
				caretPosition = CaretPosition$1.before(rootContentEditableFalseElm);
			}
			return caretPosition;
		}
		if (nextNode) {
			return getCaretCandidatePosition(direction, nextNode);
		}
		return null;
	};
	var CaretWalker = function (root) {
		return {
			next: function (caretPosition) {
				return findCaretPosition(HDirection.Forwards, caretPosition, root);
			},
			prev: function (caretPosition) {
				return findCaretPosition(HDirection.Backwards, caretPosition, root);
			}
		};
	};

	var walkToPositionIn = function (forward, root, start) {
		var position = forward ? CaretPosition$1.before(start) : CaretPosition$1.after(start);
		return fromPosition(forward, root, position);
	};
	var afterElement = function (node) {
		return isBr(node) ? CaretPosition$1.before(node) : CaretPosition$1.after(node);
	};
	var isBeforeOrStart = function (position) {
		if (CaretPosition$1.isTextPosition(position)) {
			return position.offset() === 0;
		} else {
			return isCaretCandidate(position.getNode());
		}
	};
	var isAfterOrEnd = function (position) {
		if (CaretPosition$1.isTextPosition(position)) {
			var container = position.container();
			return position.offset() === container.data.length;
		} else {
			return isCaretCandidate(position.getNode(true));
		}
	};
	var isBeforeAfterSameElement = function (from, to) {
		return !CaretPosition$1.isTextPosition(from) && !CaretPosition$1.isTextPosition(to) && from.getNode() === to.getNode(true);
	};
	var isAtBr = function (position) {
		return !CaretPosition$1.isTextPosition(position) && isBr(position.getNode());
	};
	var shouldSkipPosition = function (forward, from, to) {
		if (forward) {
			return !isBeforeAfterSameElement(from, to) && !isAtBr(from) && isAfterOrEnd(from) && isBeforeOrStart(to);
		} else {
			return !isBeforeAfterSameElement(to, from) && isBeforeOrStart(from) && isAfterOrEnd(to);
		}
	};
	var fromPosition = function (forward, root, pos) {
		var walker = CaretWalker(root);
		return Optional.from(forward ? walker.next(pos) : walker.prev(pos));
	};
	var navigate = function (forward, root, from) {
		return fromPosition(forward, root, from).bind(function (to) {
			if (isInSameBlock(from, to, root) && shouldSkipPosition(forward, from, to)) {
				return fromPosition(forward, root, to);
			} else {
				return Optional.some(to);
			}
		});
	};
	var navigateIgnore = function (forward, root, from, ignoreFilter) {
		return navigate(forward, root, from).bind(function (pos) {
			return ignoreFilter(pos) ? navigateIgnore(forward, root, pos, ignoreFilter) : Optional.some(pos);
		});
	};
	var positionIn = function (forward, element) {
		var startNode = forward ? element.firstChild : element.lastChild;
		if (isText$1(startNode)) {
			return Optional.some(CaretPosition$1(startNode, forward ? 0 : startNode.data.length));
		} else if (startNode) {
			if (isCaretCandidate(startNode)) {
				return Optional.some(forward ? CaretPosition$1.before(startNode) : afterElement(startNode));
			} else {
				return walkToPositionIn(forward, element, startNode);
			}
		} else {
			return Optional.none();
		}
	};
	var nextPosition = curry(fromPosition, true);
	var prevPosition = curry(fromPosition, false);
	var firstPositionIn = curry(positionIn, true);
	var lastPositionIn = curry(positionIn, false);

	var CARET_ID = '_mce_caret';
	var isCaretNode = function (node) {
		return isElement$1(node) && node.id === CARET_ID;
	};
	var getParentCaretContainer = function (body, node) {
		while (node && node !== body) {
			if (node.id === CARET_ID) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	};

	var isStringPathBookmark = function (bookmark) {
		return typeof bookmark.start === 'string';
	};
	var isRangeBookmark = function (bookmark) {
		return bookmark.hasOwnProperty('rng');
	};
	var isIdBookmark = function (bookmark) {
		return bookmark.hasOwnProperty('id');
	};
	var isIndexBookmark = function (bookmark) {
		return bookmark.hasOwnProperty('name');
	};
	var isPathBookmark = function (bookmark) {
		return Tools.isArray(bookmark.start);
	};

	var addBogus = function (dom, node) {
		if (isElement$1(node) && dom.isBlock(node) && !node.innerHTML && !Env.ie) {
			node.innerHTML = '<br data-mce-bogus="1" />';
		}
		return node;
	};
	var resolveCaretPositionBookmark = function (dom, bookmark) {
		var pos;
		var rng = dom.createRng();
		pos = resolve$1(dom.getRoot(), bookmark.start);
		rng.setStart(pos.container(), pos.offset());
		pos = resolve$1(dom.getRoot(), bookmark.end);
		rng.setEnd(pos.container(), pos.offset());
		return rng;
	};
	var insertZwsp = function (node, rng) {
		var textNode = node.ownerDocument.createTextNode(ZWSP);
		node.appendChild(textNode);
		rng.setStart(textNode, 0);
		rng.setEnd(textNode, 0);
	};
	var isEmpty$1 = function (node) {
		return node.hasChildNodes() === false;
	};
	var tryFindRangePosition = function (node, rng) {
		return lastPositionIn(node).fold(function () {
			return false;
		}, function (pos) {
			rng.setStart(pos.container(), pos.offset());
			rng.setEnd(pos.container(), pos.offset());
			return true;
		});
	};
	var padEmptyCaretContainer = function (root, node, rng) {
		if (isEmpty$1(node) && getParentCaretContainer(root, node)) {
			insertZwsp(node, rng);
			return true;
		} else {
			return false;
		}
	};
	var setEndPoint = function (dom, start, bookmark, rng) {
		var point = bookmark[start ? 'start' : 'end'];
		var i, node, offset, children;
		var root = dom.getRoot();
		if (point) {
			offset = point[0];
			for (node = root, i = point.length - 1; i >= 1; i--) {
				children = node.childNodes;
				if (padEmptyCaretContainer(root, node, rng)) {
					return true;
				}
				if (point[i] > children.length - 1) {
					if (padEmptyCaretContainer(root, node, rng)) {
						return true;
					}
					return tryFindRangePosition(node, rng);
				}
				node = children[point[i]];
			}
			if (node.nodeType === 3) {
				offset = Math.min(point[0], node.nodeValue.length);
			}
			if (node.nodeType === 1) {
				offset = Math.min(point[0], node.childNodes.length);
			}
			if (start) {
				rng.setStart(node, offset);
			} else {
				rng.setEnd(node, offset);
			}
		}
		return true;
	};
	var isValidTextNode = function (node) {
		return isText$1(node) && node.data.length > 0;
	};
	var restoreEndPoint = function (dom, suffix, bookmark) {
		var marker = dom.get(bookmark.id + '_' + suffix), node, idx, next, prev;
		var keep = bookmark.keep;
		var container, offset;
		if (marker) {
			node = marker.parentNode;
			if (suffix === 'start') {
				if (!keep) {
					idx = dom.nodeIndex(marker);
				} else {
					if (marker.hasChildNodes()) {
						node = marker.firstChild;
						idx = 1;
					} else if (isValidTextNode(marker.nextSibling)) {
						node = marker.nextSibling;
						idx = 0;
					} else if (isValidTextNode(marker.previousSibling)) {
						node = marker.previousSibling;
						idx = marker.previousSibling.data.length;
					} else {
						node = marker.parentNode;
						idx = dom.nodeIndex(marker) + 1;
					}
				}
				container = node;
				offset = idx;
			} else {
				if (!keep) {
					idx = dom.nodeIndex(marker);
				} else {
					if (marker.hasChildNodes()) {
						node = marker.firstChild;
						idx = 1;
					} else if (isValidTextNode(marker.previousSibling)) {
						node = marker.previousSibling;
						idx = marker.previousSibling.data.length;
					} else {
						node = marker.parentNode;
						idx = dom.nodeIndex(marker);
					}
				}
				container = node;
				offset = idx;
			}
			if (!keep) {
				prev = marker.previousSibling;
				next = marker.nextSibling;
				Tools.each(Tools.grep(marker.childNodes), function (node) {
					if (isText$1(node)) {
						node.nodeValue = node.nodeValue.replace(/\uFEFF/g, '');
					}
				});
				while (marker = dom.get(bookmark.id + '_' + suffix)) {
					dom.remove(marker, true);
				}
				if (prev && next && prev.nodeType === next.nodeType && isText$1(prev) && !Env.opera) {
					idx = prev.nodeValue.length;
					prev.appendData(next.nodeValue);
					dom.remove(next);
					container = prev;
					offset = idx;
				}
			}
			return Optional.some(CaretPosition$1(container, offset));
		} else {
			return Optional.none();
		}
	};
	var resolvePaths = function (dom, bookmark) {
		var rng = dom.createRng();
		if (setEndPoint(dom, true, bookmark, rng) && setEndPoint(dom, false, bookmark, rng)) {
			return Optional.some(rng);
		} else {
			return Optional.none();
		}
	};
	var resolveId = function (dom, bookmark) {
		var startPos = restoreEndPoint(dom, 'start', bookmark);
		var endPos = restoreEndPoint(dom, 'end', bookmark);
		return lift2(startPos, endPos.or(startPos), function (spos, epos) {
			var rng = dom.createRng();
			rng.setStart(addBogus(dom, spos.container()), spos.offset());
			rng.setEnd(addBogus(dom, epos.container()), epos.offset());
			return rng;
		});
	};
	var resolveIndex$1 = function (dom, bookmark) {
		return Optional.from(dom.select(bookmark.name)[bookmark.index]).map(function (elm) {
			var rng = dom.createRng();
			rng.selectNode(elm);
			return rng;
		});
	};
	var resolve$2 = function (selection, bookmark) {
		var dom = selection.dom;
		if (bookmark) {
			if (isPathBookmark(bookmark)) {
				return resolvePaths(dom, bookmark);
			} else if (isStringPathBookmark(bookmark)) {
				return Optional.some(resolveCaretPositionBookmark(dom, bookmark));
			} else if (isIdBookmark(bookmark)) {
				return resolveId(dom, bookmark);
			} else if (isIndexBookmark(bookmark)) {
				return resolveIndex$1(dom, bookmark);
			} else if (isRangeBookmark(bookmark)) {
				return Optional.some(bookmark.rng);
			}
		}
		return Optional.none();
	};

	var getBookmark$1 = function (selection, type, normalized) {
		return getBookmark(selection, type, normalized);
	};
	var moveToBookmark = function (selection, bookmark) {
		resolve$2(selection, bookmark).each(function (rng) {
			selection.setRng(rng);
		});
	};
	var isBookmarkNode$1 = function (node) {
		return isElement$1(node) && node.tagName === 'SPAN' && node.getAttribute('data-mce-type') === 'bookmark';
	};

	var is$2 = function (expected) {
		return function (actual) {
			return expected === actual;
		};
	};
	var isNbsp = is$2(nbsp);
	var isWhiteSpace$1 = function (chr) {
		return chr !== '' && ' \f\n\r\t\x0B'.indexOf(chr) !== -1;
	};
	var isContent$1 = function (chr) {
		return !isWhiteSpace$1(chr) && !isNbsp(chr);
	};

	var isNode = function (node) {
		return !!node.nodeType;
	};
	var isInlineBlock = function (node) {
		return node && /^(IMG)$/.test(node.nodeName);
	};
	var moveStart = function (dom, selection, rng) {
		var offset = rng.startOffset;
		var container = rng.startContainer, walker, node, nodes;
		if (rng.startContainer === rng.endContainer) {
			if (isInlineBlock(rng.startContainer.childNodes[rng.startOffset])) {
				return;
			}
		}
		if (container.nodeType === 1) {
			nodes = container.childNodes;
			if (offset < nodes.length) {
				container = nodes[offset];
				walker = new DomTreeWalker(container, dom.getParent(container, dom.isBlock));
			} else {
				container = nodes[nodes.length - 1];
				walker = new DomTreeWalker(container, dom.getParent(container, dom.isBlock));
				walker.next(true);
			}
			for (node = walker.current(); node; node = walker.next()) {
				if (node.nodeType === 3 && !isWhiteSpaceNode(node)) {
					rng.setStart(node, 0);
					selection.setRng(rng);
					return;
				}
			}
		}
	};
	var getNonWhiteSpaceSibling = function (node, next, inc) {
		if (node) {
			var nextName = next ? 'nextSibling' : 'previousSibling';
			for (node = inc ? node : node[nextName]; node; node = node[nextName]) {
				if (node.nodeType === 1 || !isWhiteSpaceNode(node)) {
					return node;
				}
			}
		}
	};
	var isTextBlock$1 = function (editor, name) {
		if (isNode(name)) {
			name = name.nodeName;
		}
		return !!editor.schema.getTextBlockElements()[name.toLowerCase()];
	};
	var isValid = function (ed, parent, child) {
		return ed.schema.isValidChild(parent, child);
	};
	var isWhiteSpaceNode = function (node, allowSpaces) {
		if (allowSpaces === void 0) {
			allowSpaces = false;
		}
		if (isNonNullable(node) && isText$1(node)) {
			var data = allowSpaces ? node.data.replace(/ /g, '\xA0') : node.data;
			return isWhitespaceText(data);
		} else {
			return false;
		}
	};
	var isEmptyTextNode = function (node) {
		return isNonNullable(node) && isText$1(node) && node.length === 0;
	};
	var replaceVars = function (value, vars) {
		if (typeof value !== 'string') {
			value = value(vars);
		} else if (vars) {
			value = value.replace(/%(\w+)/g, function (str, name) {
				return vars[name] || str;
			});
		}
		return value;
	};
	var isEq = function (str1, str2) {
		str1 = str1 || '';
		str2 = str2 || '';
		str1 = '' + (str1.nodeName || str1);
		str2 = '' + (str2.nodeName || str2);
		return str1.toLowerCase() === str2.toLowerCase();
	};
	var normalizeStyleValue = function (dom, value, name) {
		if (name === 'color' || name === 'backgroundColor') {
			value = dom.toHex(value);
		}
		if (name === 'fontWeight' && value === 700) {
			value = 'bold';
		}
		if (name === 'fontFamily') {
			value = value.replace(/[\'\"]/g, '').replace(/,\s+/g, ',');
		}
		return '' + value;
	};
	var getStyle = function (dom, node, name) {
		return normalizeStyleValue(dom, dom.getStyle(node, name), name);
	};
	var getTextDecoration = function (dom, node) {
		var decoration;
		dom.getParent(node, function (n) {
			decoration = dom.getStyle(n, 'text-decoration');
			return decoration && decoration !== 'none';
		});
		return decoration;
	};
	var getParents$1 = function (dom, node, selector) {
		return dom.getParents(node, selector, dom.getRoot());
	};
	var isVariableFormatName = function (editor, formatName) {
		var hasVariableValues = function (format) {
			var isVariableValue = function (val) {
				return val.length > 1 && val.charAt(0) === '%';
			};
			return exists([
				'styles',
				'attributes'
			], function (key) {
				return get$1(format, key).exists(function (field) {
					var fieldValues = isArray(field) ? field : values(field);
					return exists(fieldValues, isVariableValue);
				});
			});
		};
		return exists(editor.formatter.get(formatName), hasVariableValues);
	};
	var areSimilarFormats = function (editor, formatName, otherFormatName) {
		var validKeys = [
			'inline',
			'block',
			'selector',
			'attributes',
			'styles',
			'classes'
		];
		var filterObj = function (format) {
			return filter$1(format, function (_, key) {
				return exists(validKeys, function (validKey) {
					return validKey === key;
				});
			});
		};
		return exists(editor.formatter.get(formatName), function (fmt1) {
			var filteredFmt1 = filterObj(fmt1);
			return exists(editor.formatter.get(otherFormatName), function (fmt2) {
				var filteredFmt2 = filterObj(fmt2);
				return equal(filteredFmt1, filteredFmt2);
			});
		});
	};
	var isBlockFormat = function (format) {
		return hasNonNullableKey(format, 'block');
	};
	var isSelectorFormat = function (format) {
		return hasNonNullableKey(format, 'selector');
	};
	var isInlineFormat = function (format) {
		return hasNonNullableKey(format, 'inline');
	};

	var isBookmarkNode$2 = isBookmarkNode$1;
	var getParents$2 = getParents$1;
	var isWhiteSpaceNode$1 = isWhiteSpaceNode;
	var isTextBlock$2 = isTextBlock$1;
	var isBogusBr = function (node) {
		return isBr(node) && node.getAttribute('data-mce-bogus') && !node.nextSibling;
	};
	var findParentContentEditable = function (dom, node) {
		var parent = node;
		while (parent) {
			if (isElement$1(parent) && dom.getContentEditable(parent)) {
				return dom.getContentEditable(parent) === 'false' ? parent : node;
			}
			parent = parent.parentNode;
		}
		return node;
	};
	var walkText = function (start, node, offset, predicate) {
		var str = node.data;
		for (var i = offset; start ? i >= 0 : i < str.length; start ? i-- : i++) {
			if (predicate(str.charAt(i))) {
				return start ? i + 1 : i;
			}
		}
		return -1;
	};
	var findSpace = function (start, node, offset) {
		return walkText(start, node, offset, function (c) {
			return isNbsp(c) || isWhiteSpace$1(c);
		});
	};
	var findContent = function (start, node, offset) {
		return walkText(start, node, offset, isContent$1);
	};
	var findWordEndPoint = function (dom, body, container, offset, start, includeTrailingSpaces) {
		var lastTextNode;
		var rootNode = dom.getParent(container, dom.isBlock) || body;
		var walk = function (container, offset, pred) {
			var textSeeker = TextSeeker(dom);
			var walker = start ? textSeeker.backwards : textSeeker.forwards;
			return Optional.from(walker(container, offset, function (text, textOffset) {
				if (isBookmarkNode$2(text.parentNode)) {
					return -1;
				} else {
					lastTextNode = text;
					return pred(start, text, textOffset);
				}
			}, rootNode));
		};
		var spaceResult = walk(container, offset, findSpace);
		return spaceResult.bind(function (result) {
			return includeTrailingSpaces ? walk(result.container, result.offset + (start ? -1 : 0), findContent) : Optional.some(result);
		}).orThunk(function () {
			return lastTextNode ? Optional.some({
				container: lastTextNode,
				offset: start ? 0 : lastTextNode.length
			}) : Optional.none();
		});
	};
	var findSelectorEndPoint = function (dom, format, rng, container, siblingName) {
		if (isText$1(container) && container.nodeValue.length === 0 && container[siblingName]) {
			container = container[siblingName];
		}
		var parents = getParents$2(dom, container);
		for (var i = 0; i < parents.length; i++) {
			for (var y = 0; y < format.length; y++) {
				var curFormat = format[y];
				if ('collapsed' in curFormat && curFormat.collapsed !== rng.collapsed) {
					continue;
				}
				if (dom.is(parents[i], curFormat.selector)) {
					return parents[i];
				}
			}
		}
		return container;
	};
	var findBlockEndPoint = function (editor, format, container, siblingName) {
		var node;
		var dom = editor.dom;
		var root = dom.getRoot();
		if (!format[0].wrapper) {
			node = dom.getParent(container, format[0].block, root);
		}
		if (!node) {
			var scopeRoot = dom.getParent(container, 'LI,TD,TH');
			node = dom.getParent(isText$1(container) ? container.parentNode : container, function (node) {
				return node !== root && isTextBlock$2(editor, node);
			}, scopeRoot);
		}
		if (node && format[0].wrapper) {
			node = getParents$2(dom, node, 'ul,ol').reverse()[0] || node;
		}
		if (!node) {
			node = container;
			while (node[siblingName] && !dom.isBlock(node[siblingName])) {
				node = node[siblingName];
				if (isEq(node, 'br')) {
					break;
				}
			}
		}
		return node || container;
	};
	var isAtBlockBoundary = function (dom, root, container, siblingName) {
		var parent = container.parentNode;
		if (isNonNullable(container[siblingName])) {
			return false;
		} else if (parent === root || isNullable(parent) || dom.isBlock(parent)) {
			return true;
		} else {
			return isAtBlockBoundary(dom, root, parent, siblingName);
		}
	};
	var findParentContainer = function (dom, format, container, offset, start) {
		var parent = container;
		var sibling;
		var siblingName = start ? 'previousSibling' : 'nextSibling';
		var root = dom.getRoot();
		if (isText$1(container) && !isWhiteSpaceNode$1(container)) {
			if (start ? offset > 0 : offset < container.data.length) {
				return container;
			}
		}
		while (true) {
			if (!format[0].block_expand && dom.isBlock(parent)) {
				return parent;
			}
			for (sibling = parent[siblingName]; sibling; sibling = sibling[siblingName]) {
				var allowSpaces = isText$1(sibling) && !isAtBlockBoundary(dom, root, sibling, siblingName);
				if (!isBookmarkNode$2(sibling) && !isBogusBr(sibling) && !isWhiteSpaceNode$1(sibling, allowSpaces)) {
					return parent;
				}
			}
			if (parent === root || parent.parentNode === root) {
				container = parent;
				break;
			}
			parent = parent.parentNode;
		}
		return container;
	};
	var isSelfOrParentBookmark = function (container) {
		return isBookmarkNode$2(container.parentNode) || isBookmarkNode$2(container);
	};
	var expandRng = function (editor, rng, format, includeTrailingSpace) {
		if (includeTrailingSpace === void 0) {
			includeTrailingSpace = false;
		}
		var startContainer = rng.startContainer, startOffset = rng.startOffset, endContainer = rng.endContainer, endOffset = rng.endOffset;
		var dom = editor.dom;
		if (isElement$1(startContainer) && startContainer.hasChildNodes()) {
			startContainer = getNode(startContainer, startOffset);
			if (isText$1(startContainer)) {
				startOffset = 0;
			}
		}
		if (isElement$1(endContainer) && endContainer.hasChildNodes()) {
			endContainer = getNode(endContainer, rng.collapsed ? endOffset : endOffset - 1);
			if (isText$1(endContainer)) {
				endOffset = endContainer.nodeValue.length;
			}
		}
		startContainer = findParentContentEditable(dom, startContainer);
		endContainer = findParentContentEditable(dom, endContainer);
		if (isSelfOrParentBookmark(startContainer)) {
			startContainer = isBookmarkNode$2(startContainer) ? startContainer : startContainer.parentNode;
			if (rng.collapsed) {
				startContainer = startContainer.previousSibling || startContainer;
			} else {
				startContainer = startContainer.nextSibling || startContainer;
			}
			if (isText$1(startContainer)) {
				startOffset = rng.collapsed ? startContainer.length : 0;
			}
		}
		if (isSelfOrParentBookmark(endContainer)) {
			endContainer = isBookmarkNode$2(endContainer) ? endContainer : endContainer.parentNode;
			if (rng.collapsed) {
				endContainer = endContainer.nextSibling || endContainer;
			} else {
				endContainer = endContainer.previousSibling || endContainer;
			}
			if (isText$1(endContainer)) {
				endOffset = rng.collapsed ? 0 : endContainer.length;
			}
		}
		if (rng.collapsed) {
			var startPoint = findWordEndPoint(dom, editor.getBody(), startContainer, startOffset, true, includeTrailingSpace);
			startPoint.each(function (_a) {
				var container = _a.container, offset = _a.offset;
				startContainer = container;
				startOffset = offset;
			});
			var endPoint = findWordEndPoint(dom, editor.getBody(), endContainer, endOffset, false, includeTrailingSpace);
			endPoint.each(function (_a) {
				var container = _a.container, offset = _a.offset;
				endContainer = container;
				endOffset = offset;
			});
		}
		if (format[0].inline || format[0].block_expand) {
			if (!format[0].inline || (!isText$1(startContainer) || startOffset === 0)) {
				startContainer = findParentContainer(dom, format, startContainer, startOffset, true);
			}
			if (!format[0].inline || (!isText$1(endContainer) || endOffset === endContainer.nodeValue.length)) {
				endContainer = findParentContainer(dom, format, endContainer, endOffset, false);
			}
		}
		if (format[0].selector && format[0].expand !== false && !format[0].inline) {
			startContainer = findSelectorEndPoint(dom, format, rng, startContainer, 'previousSibling');
			endContainer = findSelectorEndPoint(dom, format, rng, endContainer, 'nextSibling');
		}
		if (format[0].block || format[0].selector) {
			startContainer = findBlockEndPoint(editor, format, startContainer, 'previousSibling');
			endContainer = findBlockEndPoint(editor, format, endContainer, 'nextSibling');
			if (format[0].block) {
				if (!dom.isBlock(startContainer)) {
					startContainer = findParentContainer(dom, format, startContainer, startOffset, true);
				}
				if (!dom.isBlock(endContainer)) {
					endContainer = findParentContainer(dom, format, endContainer, endOffset, false);
				}
			}
		}
		if (isElement$1(startContainer)) {
			startOffset = dom.nodeIndex(startContainer);
			startContainer = startContainer.parentNode;
		}
		if (isElement$1(endContainer)) {
			endOffset = dom.nodeIndex(endContainer) + 1;
			endContainer = endContainer.parentNode;
		}
		return {
			startContainer: startContainer,
			startOffset: startOffset,
			endContainer: endContainer,
			endOffset: endOffset
		};
	};

	var clampToExistingChildren = function (container, index) {
		var childNodes = container.childNodes;
		if (index >= childNodes.length) {
			index = childNodes.length - 1;
		} else if (index < 0) {
			index = 0;
		}
		return childNodes[index] || container;
	};
	var getEndChild = function (container, index) {
		return clampToExistingChildren(container, index - 1);
	};
	var walk$1 = function (dom, rng, callback) {
		var startContainer = rng.startContainer;
		var startOffset = rng.startOffset;
		var endContainer = rng.endContainer;
		var endOffset = rng.endOffset;
		var exclude = function (nodes) {
			var node;
			node = nodes[0];
			if (node.nodeType === 3 && node === startContainer && startOffset >= node.nodeValue.length) {
				nodes.splice(0, 1);
			}
			node = nodes[nodes.length - 1];
			if (endOffset === 0 && nodes.length > 0 && node === endContainer && node.nodeType === 3) {
				nodes.splice(nodes.length - 1, 1);
			}
			return nodes;
		};
		var collectSiblings = function (node, name, endNode) {
			var siblings = [];
			for (; node && node !== endNode; node = node[name]) {
				siblings.push(node);
			}
			return siblings;
		};
		var findEndPoint = function (node, root) {
			do {
				if (node.parentNode === root) {
					return node;
				}
				node = node.parentNode;
			} while (node);
		};
		var walkBoundary = function (startNode, endNode, next) {
			var siblingName = next ? 'nextSibling' : 'previousSibling';
			for (var node = startNode, parent_1 = node.parentNode; node && node !== endNode; node = parent_1) {
				parent_1 = node.parentNode;
				var siblings_1 = collectSiblings(node === startNode ? node : node[siblingName], siblingName);
				if (siblings_1.length) {
					if (!next) {
						siblings_1.reverse();
					}
					callback(exclude(siblings_1));
				}
			}
		};
		if (startContainer.nodeType === 1 && startContainer.hasChildNodes()) {
			startContainer = clampToExistingChildren(startContainer, startOffset);
		}
		if (endContainer.nodeType === 1 && endContainer.hasChildNodes()) {
			endContainer = getEndChild(endContainer, endOffset);
		}
		if (startContainer === endContainer) {
			return callback(exclude([startContainer]));
		}
		var ancestor = dom.findCommonAncestor(startContainer, endContainer);
		for (var node = startContainer; node; node = node.parentNode) {
			if (node === endContainer) {
				return walkBoundary(startContainer, ancestor, true);
			}
			if (node === ancestor) {
				break;
			}
		}
		for (var node = endContainer; node; node = node.parentNode) {
			if (node === startContainer) {
				return walkBoundary(endContainer, ancestor);
			}
			if (node === ancestor) {
				break;
			}
		}
		var startPoint = findEndPoint(startContainer, ancestor) || startContainer;
		var endPoint = findEndPoint(endContainer, ancestor) || endContainer;
		walkBoundary(startContainer, startPoint, true);
		var siblings = collectSiblings(startPoint === startContainer ? startPoint : startPoint.nextSibling, 'nextSibling', endPoint === endContainer ? endPoint.nextSibling : endPoint);
		if (siblings.length) {
			callback(exclude(siblings));
		}
		walkBoundary(endContainer, endPoint);
	};

	var getRanges = function (selection) {
		var ranges = [];
		if (selection) {
			for (var i = 0; i < selection.rangeCount; i++) {
				ranges.push(selection.getRangeAt(i));
			}
		}
		return ranges;
	};
	var getSelectedNodes = function (ranges) {
		return bind(ranges, function (range) {
			var node = getSelectedNode(range);
			return node ? [SugarElement.fromDom(node)] : [];
		});
	};
	var hasMultipleRanges = function (selection) {
		return getRanges(selection).length > 1;
	};

	var getCellsFromRanges = function (ranges) {
		return filter(getSelectedNodes(ranges), isTableCell$1);
	};
	var getCellsFromElement = function (elm) {
		return descendants$1(elm, 'td[data-mce-selected],th[data-mce-selected]');
	};
	var getCellsFromElementOrRanges = function (ranges, element) {
		var selectedCells = getCellsFromElement(element);
		return selectedCells.length > 0 ? selectedCells : getCellsFromRanges(ranges);
	};
	var getCellsFromEditor = function (editor) {
		return getCellsFromElementOrRanges(getRanges(editor.selection.getSel()), SugarElement.fromDom(editor.getBody()));
	};

	var getStartNode = function (rng) {
		var sc = rng.startContainer, so = rng.startOffset;
		if (isText$1(sc)) {
			return so === 0 ? Optional.some(SugarElement.fromDom(sc)) : Optional.none();
		} else {
			return Optional.from(sc.childNodes[so]).map(SugarElement.fromDom);
		}
	};
	var getEndNode = function (rng) {
		var ec = rng.endContainer, eo = rng.endOffset;
		if (isText$1(ec)) {
			return eo === ec.data.length ? Optional.some(SugarElement.fromDom(ec)) : Optional.none();
		} else {
			return Optional.from(ec.childNodes[eo - 1]).map(SugarElement.fromDom);
		}
	};
	var getFirstChildren = function (node) {
		return firstChild(node).fold(constant([node]), function (child) {
			return [node].concat(getFirstChildren(child));
		});
	};
	var getLastChildren = function (node) {
		return lastChild(node).fold(constant([node]), function (child) {
			if (name(child) === 'br') {
				return prevSibling(child).map(function (sibling) {
					return [node].concat(getLastChildren(sibling));
				}).getOr([]);
			} else {
				return [node].concat(getLastChildren(child));
			}
		});
	};
	var hasAllContentsSelected = function (elm, rng) {
		return lift2(getStartNode(rng), getEndNode(rng), function (startNode, endNode) {
			var start = find(getFirstChildren(elm), curry(eq$2, startNode));
			var end = find(getLastChildren(elm), curry(eq$2, endNode));
			return start.isSome() && end.isSome();
		}).getOr(false);
	};
	var moveEndPoint$1 = function (dom, rng, node, start) {
		var root = node, walker = new DomTreeWalker(node, root);
		var moveCaretBeforeOnEnterElementsMap = filter$1(dom.schema.getMoveCaretBeforeOnEnterElements(), function (_, name) {
			return !contains([
				'td',
				'th',
				'table'
			], name.toLowerCase());
		});
		do {
			if (isText$1(node) && Tools.trim(node.nodeValue).length !== 0) {
				if (start) {
					rng.setStart(node, 0);
				} else {
					rng.setEnd(node, node.nodeValue.length);
				}
				return;
			}
			if (moveCaretBeforeOnEnterElementsMap[node.nodeName]) {
				if (start) {
					rng.setStartBefore(node);
				} else {
					if (node.nodeName === 'BR') {
						rng.setEndBefore(node);
					} else {
						rng.setEndAfter(node);
					}
				}
				return;
			}
		} while (node = start ? walker.next() : walker.prev());
		if (root.nodeName === 'BODY') {
			if (start) {
				rng.setStart(root, 0);
			} else {
				rng.setEnd(root, root.childNodes.length);
			}
		}
	};
	var hasAnyRanges = function (editor) {
		var sel = editor.selection.getSel();
		return sel && sel.rangeCount > 0;
	};
	var runOnRanges = function (editor, executor) {
		var fakeSelectionNodes = getCellsFromEditor(editor);
		if (fakeSelectionNodes.length > 0) {
			each(fakeSelectionNodes, function (elem) {
				var node = elem.dom;
				var fakeNodeRng = editor.dom.createRng();
				fakeNodeRng.setStartBefore(node);
				fakeNodeRng.setEndAfter(node);
				executor(fakeNodeRng, true);
			});
		} else {
			executor(editor.selection.getRng(), false);
		}
	};
	var preserve = function (selection, fillBookmark, executor) {
		var bookmark = getPersistentBookmark(selection, fillBookmark);
		executor(bookmark);
		selection.moveToBookmark(bookmark);
	};

	function NodeValue(is, name) {
		var get = function (element) {
			if (!is(element)) {
				throw new Error('Can only get ' + name + ' value of a ' + name + ' node');
			}
			return getOption(element).getOr('');
		};
		var getOption = function (element) {
			return is(element) ? Optional.from(element.dom.nodeValue) : Optional.none();
		};
		var set = function (element, value) {
			if (!is(element)) {
				throw new Error('Can only set raw ' + name + ' value of a ' + name + ' node');
			}
			element.dom.nodeValue = value;
		};
		return {
			get: get,
			getOption: getOption,
			set: set
		};
	}

	var api = NodeValue(isText, 'text');
	var get$8 = function (element) {
		return api.get(element);
	};

	var isZeroWidth = function (elem) {
		return isText(elem) && get$8(elem) === ZWSP;
	};
	var context = function (editor, elem, wrapName, nodeName) {
		return parent(elem).fold(function () {
			return 'skipping';
		}, function (parent) {
			if (nodeName === 'br' || isZeroWidth(elem)) {
				return 'valid';
			} else if (isAnnotation(elem)) {
				return 'existing';
			} else if (isCaretNode(elem.dom)) {
				return 'caret';
			} else if (!isValid(editor, wrapName, nodeName) || !isValid(editor, name(parent), wrapName)) {
				return 'invalid-child';
			} else {
				return 'valid';
			}
		});
	};

	var applyWordGrab = function (editor, rng) {
		var r = expandRng(editor, rng, [{ inline: true }]);
		rng.setStart(r.startContainer, r.startOffset);
		rng.setEnd(r.endContainer, r.endOffset);
		editor.selection.setRng(rng);
	};
	var makeAnnotation = function (eDoc, _a, annotationName, decorate) {
		var _b = _a.uid, uid = _b === void 0 ? generate$1('mce-annotation') : _b, data = __rest(_a, ['uid']);
		var master = SugarElement.fromTag('span', eDoc);
		add$3(master, annotation());
		set(master, '' + dataAnnotationId(), uid);
		set(master, '' + dataAnnotation(), annotationName);
		var _c = decorate(uid, data), _d = _c.attributes, attributes = _d === void 0 ? {} : _d, _e = _c.classes, classes = _e === void 0 ? [] : _e;
		setAll(master, attributes);
		add$4(master, classes);
		return master;
	};
	var annotate = function (editor, rng, annotationName, decorate, data) {
		var newWrappers = [];
		var master = makeAnnotation(editor.getDoc(), data, annotationName, decorate);
		var wrapper = Cell(Optional.none());
		var finishWrapper = function () {
			wrapper.set(Optional.none());
		};
		var getOrOpenWrapper = function () {
			return wrapper.get().getOrThunk(function () {
				var nu = shallow(master);
				newWrappers.push(nu);
				wrapper.set(Optional.some(nu));
				return nu;
			});
		};
		var processElements = function (elems) {
			each(elems, processElement);
		};
		var processElement = function (elem) {
			var ctx = context(editor, elem, 'span', name(elem));
			switch (ctx) {
				case 'invalid-child': {
					finishWrapper();
					var children$1 = children(elem);
					processElements(children$1);
					finishWrapper();
					break;
				}
				case 'valid': {
					var w = getOrOpenWrapper();
					wrap(elem, w);
					break;
				}
			}
		};
		var processNodes = function (nodes) {
			var elems = map(nodes, SugarElement.fromDom);
			processElements(elems);
		};
		walk$1(editor.dom, rng, function (nodes) {
			finishWrapper();
			processNodes(nodes);
		});
		return newWrappers;
	};
	var annotateWithBookmark = function (editor, name, settings, data) {
		editor.undoManager.transact(function () {
			var selection = editor.selection;
			var initialRng = selection.getRng();
			var hasFakeSelection = getCellsFromEditor(editor).length > 0;
			if (initialRng.collapsed && !hasFakeSelection) {
				applyWordGrab(editor, initialRng);
			}
			if (selection.getRng().collapsed && !hasFakeSelection) {
				var wrapper = makeAnnotation(editor.getDoc(), data, name, settings.decorate);
				set$1(wrapper, nbsp);
				selection.getRng().insertNode(wrapper.dom);
				selection.select(wrapper.dom);
			} else {
				preserve(selection, false, function () {
					runOnRanges(editor, function (selectionRng) {
						annotate(editor, selectionRng, name, settings.decorate, data);
					});
				});
			}
		});
	};

	var Annotator = function (editor) {
		var registry = create$2();
		setup$1(editor, registry);
		var changes = setup(editor);
		return {
			register: function (name, settings) {
				registry.register(name, settings);
			},
			annotate: function (name, data) {
				registry.lookup(name).each(function (settings) {
					annotateWithBookmark(editor, name, settings, data);
				});
			},
			annotationChanged: function (name, callback) {
				changes.addListener(name, callback);
			},
			remove: function (name) {
				identify(editor, Optional.some(name)).each(function (_a) {
					var elements = _a.elements;
					each(elements, unwrap);
				});
			},
			getAll: function (name) {
				var directory = findAll(editor, name);
				return map$1(directory, function (elems) {
					return map(elems, function (elem) {
						return elem.dom;
					});
				});
			}
		};
	};

	function BookmarkManager(selection) {
		return {
			getBookmark: curry(getBookmark$1, selection),
			moveToBookmark: curry(moveToBookmark, selection)
		};
	}
	(function (BookmarkManager) {
		BookmarkManager.isBookmarkNode = isBookmarkNode$1;
	}(BookmarkManager || (BookmarkManager = {})));
	var BookmarkManager$1 = BookmarkManager;

	var getContentEditableRoot = function (root, node) {
		while (node && node !== root) {
			if (isContentEditableTrue(node) || isContentEditableFalse(node)) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	};

	var isXYWithinRange = function (clientX, clientY, range) {
		if (range.collapsed) {
			return false;
		}
		if (Env.browser.isIE() && range.startOffset === range.endOffset - 1 && range.startContainer === range.endContainer) {
			var elm = range.startContainer.childNodes[range.startOffset];
			if (isElement$1(elm)) {
				return exists(elm.getClientRects(), function (rect) {
					return containsXY(rect, clientX, clientY);
				});
			}
		}
		return exists(range.getClientRects(), function (rect) {
			return containsXY(rect, clientX, clientY);
		});
	};

	var firePreProcess = function (editor, args) {
		return editor.fire('PreProcess', args);
	};
	var firePostProcess = function (editor, args) {
		return editor.fire('PostProcess', args);
	};
	var fireRemove = function (editor) {
		return editor.fire('remove');
	};
	var fireDetach = function (editor) {
		return editor.fire('detach');
	};
	var fireSwitchMode = function (editor, mode) {
		return editor.fire('SwitchMode', { mode: mode });
	};
	var fireObjectResizeStart = function (editor, target, width, height, origin) {
		editor.fire('ObjectResizeStart', {
			target: target,
			width: width,
			height: height,
			origin: origin
		});
	};
	var fireObjectResized = function (editor, target, width, height, origin) {
		editor.fire('ObjectResized', {
			target: target,
			width: width,
			height: height,
			origin: origin
		});
	};
	var firePreInit = function (editor) {
		return editor.fire('PreInit');
	};
	var firePostRender = function (editor) {
		return editor.fire('PostRender');
	};
	var fireInit = function (editor) {
		return editor.fire('Init');
	};
	var firePlaceholderToggle = function (editor, state) {
		return editor.fire('PlaceholderToggle', { state: state });
	};
	var fireError = function (editor, errorType, error) {
		return editor.fire(errorType, error);
	};

	var VK = {
		BACKSPACE: 8,
		DELETE: 46,
		DOWN: 40,
		ENTER: 13,
		LEFT: 37,
		RIGHT: 39,
		SPACEBAR: 32,
		TAB: 9,
		UP: 38,
		END: 35,
		HOME: 36,
		modifierPressed: function (e) {
			return e.shiftKey || e.ctrlKey || e.altKey || this.metaKeyPressed(e);
		},
		metaKeyPressed: function (e) {
			return Env.mac ? e.metaKey : e.ctrlKey && !e.altKey;
		}
	};

	var isContentEditableFalse$6 = isContentEditableFalse;
	var ControlSelection = function (selection, editor) {
		var dom = editor.dom, each = Tools.each;
		var selectedElm, selectedElmGhost, resizeHelper, selectedHandle;
		var startX, startY, selectedElmX, selectedElmY, startW, startH, ratio, resizeStarted;
		var width, height;
		var editableDoc = editor.getDoc(), rootDocument = document;
		var abs = Math.abs, round = Math.round, rootElement = editor.getBody();
		var startScrollWidth, startScrollHeight;
		var resizeHandles = {
			nw: [
				0,
				0,
				-1,
				-1
			],
			ne: [
				1,
				0,
				1,
				-1
			],
			se: [
				1,
				1,
				1,
				1
			],
			sw: [
				0,
				1,
				-1,
				1
			]
		};
		var isImage = function (elm) {
			return elm && (elm.nodeName === 'IMG' || editor.dom.is(elm, 'figure.image'));
		};
		var isEventOnImageOutsideRange = function (evt, range) {
			if (evt.type === 'longpress' || evt.type.indexOf('touch') === 0) {
				var touch = evt.touches[0];
				return isImage(evt.target) && !isXYWithinRange(touch.clientX, touch.clientY, range);
			} else {
				return isImage(evt.target) && !isXYWithinRange(evt.clientX, evt.clientY, range);
			}
		};
		var contextMenuSelectImage = function (evt) {
			var target = evt.target;
			if (isEventOnImageOutsideRange(evt, editor.selection.getRng()) && !evt.isDefaultPrevented()) {
				editor.selection.select(target);
			}
		};
		var getResizeTarget = function (elm) {
			return editor.dom.is(elm, 'figure.image') ? elm.querySelector('img') : elm;
		};
		var isResizable = function (elm) {
			var selector = getObjectResizing(editor);
			if (!selector) {
				return false;
			}
			if (elm.getAttribute('data-mce-resize') === 'false') {
				return false;
			}
			if (elm === editor.getBody()) {
				return false;
			}
			return is$1(SugarElement.fromDom(elm), selector);
		};
		var setGhostElmSize = function (ghostElm, width, height) {
			dom.setStyles(getResizeTarget(ghostElm), {
				width: width,
				height: height
			});
		};
		var resizeGhostElement = function (e) {
			var deltaX, deltaY, proportional;
			var resizeHelperX, resizeHelperY;
			deltaX = e.screenX - startX;
			deltaY = e.screenY - startY;
			width = deltaX * selectedHandle[2] + startW;
			height = deltaY * selectedHandle[3] + startH;
			width = width < 5 ? 5 : width;
			height = height < 5 ? 5 : height;
			if (isImage(selectedElm) && getResizeImgProportional(editor) !== false) {
				proportional = !VK.modifierPressed(e);
			} else {
				proportional = VK.modifierPressed(e);
			}
			if (proportional) {
				if (abs(deltaX) > abs(deltaY)) {
					height = round(width * ratio);
					width = round(height / ratio);
				} else {
					width = round(height / ratio);
					height = round(width * ratio);
				}
			}
			setGhostElmSize(selectedElmGhost, width, height);
			resizeHelperX = selectedHandle.startPos.x + deltaX;
			resizeHelperY = selectedHandle.startPos.y + deltaY;
			resizeHelperX = resizeHelperX > 0 ? resizeHelperX : 0;
			resizeHelperY = resizeHelperY > 0 ? resizeHelperY : 0;
			dom.setStyles(resizeHelper, {
				left: resizeHelperX,
				top: resizeHelperY,
				display: 'block'
			});
			resizeHelper.innerHTML = width + ' &times; ' + height;
			if (selectedHandle[2] < 0 && selectedElmGhost.clientWidth <= width) {
				dom.setStyle(selectedElmGhost, 'left', selectedElmX + (startW - width));
			}
			if (selectedHandle[3] < 0 && selectedElmGhost.clientHeight <= height) {
				dom.setStyle(selectedElmGhost, 'top', selectedElmY + (startH - height));
			}
			deltaX = rootElement.scrollWidth - startScrollWidth;
			deltaY = rootElement.scrollHeight - startScrollHeight;
			if (deltaX + deltaY !== 0) {
				dom.setStyles(resizeHelper, {
					left: resizeHelperX - deltaX,
					top: resizeHelperY - deltaY
				});
			}
			if (!resizeStarted) {
				fireObjectResizeStart(editor, selectedElm, startW, startH, 'corner-' + selectedHandle.name);
				resizeStarted = true;
			}
		};
		var endGhostResize = function () {
			var wasResizeStarted = resizeStarted;
			resizeStarted = false;
			var setSizeProp = function (name, value) {
				if (value) {
					if (selectedElm.style[name] || !editor.schema.isValid(selectedElm.nodeName.toLowerCase(), name)) {
						dom.setStyle(getResizeTarget(selectedElm), name, value);
					} else {
						dom.setAttrib(getResizeTarget(selectedElm), name, '' + value);
					}
				}
			};
			if (wasResizeStarted) {
				setSizeProp('width', width);
				setSizeProp('height', height);
			}
			dom.unbind(editableDoc, 'mousemove', resizeGhostElement);
			dom.unbind(editableDoc, 'mouseup', endGhostResize);
			if (rootDocument !== editableDoc) {
				dom.unbind(rootDocument, 'mousemove', resizeGhostElement);
				dom.unbind(rootDocument, 'mouseup', endGhostResize);
			}
			dom.remove(selectedElmGhost);
			dom.remove(resizeHelper);
			showResizeRect(selectedElm);
			if (wasResizeStarted) {
				fireObjectResized(editor, selectedElm, width, height, 'corner-' + selectedHandle.name);
				dom.setAttrib(selectedElm, 'style', dom.getAttrib(selectedElm, 'style'));
			}
			editor.nodeChanged();
		};
		var showResizeRect = function (targetElm) {
			hideResizeRect();
			unbindResizeHandleEvents();
			var position = dom.getPos(targetElm, rootElement);
			var selectedElmX = position.x;
			var selectedElmY = position.y;
			var rect = targetElm.getBoundingClientRect();
			var targetWidth = rect.width || rect.right - rect.left;
			var targetHeight = rect.height || rect.bottom - rect.top;
			if (selectedElm !== targetElm) {
				selectedElm = targetElm;
				width = height = 0;
			}
			var e = editor.fire('ObjectSelected', { target: targetElm });
			if (isResizable(targetElm) && !e.isDefaultPrevented()) {
				each(resizeHandles, function (handle, name) {
					var handleElm;
					var startDrag = function (e) {
						startX = e.screenX;
						startY = e.screenY;
						startW = getResizeTarget(selectedElm).clientWidth;
						startH = getResizeTarget(selectedElm).clientHeight;
						ratio = startH / startW;
						selectedHandle = handle;
						selectedHandle.name = name;
						selectedHandle.startPos = {
							x: targetWidth * handle[0] + selectedElmX,
							y: targetHeight * handle[1] + selectedElmY
						};
						startScrollWidth = rootElement.scrollWidth;
						startScrollHeight = rootElement.scrollHeight;
						selectedElmGhost = selectedElm.cloneNode(true);
						dom.addClass(selectedElmGhost, 'mce-clonedresizable');
						dom.setAttrib(selectedElmGhost, 'data-mce-bogus', 'all');
						selectedElmGhost.contentEditable = false;
						selectedElmGhost.unSelectabe = true;
						dom.setStyles(selectedElmGhost, {
							left: selectedElmX,
							top: selectedElmY,
							margin: 0
						});
						setGhostElmSize(selectedElmGhost, targetWidth, targetHeight);
						selectedElmGhost.removeAttribute('data-mce-selected');
						rootElement.appendChild(selectedElmGhost);
						dom.bind(editableDoc, 'mousemove', resizeGhostElement);
						dom.bind(editableDoc, 'mouseup', endGhostResize);
						if (rootDocument !== editableDoc) {
							dom.bind(rootDocument, 'mousemove', resizeGhostElement);
							dom.bind(rootDocument, 'mouseup', endGhostResize);
						}
						resizeHelper = dom.add(rootElement, 'div', {
							'class': 'mce-resize-helper',
							'data-mce-bogus': 'all'
						}, startW + ' &times; ' + startH);
					};
					handleElm = dom.get('mceResizeHandle' + name);
					if (handleElm) {
						dom.remove(handleElm);
					}
					handleElm = dom.add(rootElement, 'div', {
						'id': 'mceResizeHandle' + name,
						'data-mce-bogus': 'all',
						'class': 'mce-resizehandle',
						'unselectable': true,
						'style': 'cursor:' + name + '-resize; margin:0; padding:0'
					});
					if (Env.ie === 11) {
						handleElm.contentEditable = false;
					}
					dom.bind(handleElm, 'mousedown', function (e) {
						e.stopImmediatePropagation();
						e.preventDefault();
						startDrag(e);
					});
					handle.elm = handleElm;
					dom.setStyles(handleElm, {
						left: targetWidth * handle[0] + selectedElmX - handleElm.offsetWidth / 2,
						top: targetHeight * handle[1] + selectedElmY - handleElm.offsetHeight / 2
					});
				});
			} else {
				hideResizeRect();
			}
			selectedElm.setAttribute('data-mce-selected', '1');
		};
		var hideResizeRect = function () {
			unbindResizeHandleEvents();
			if (selectedElm) {
				selectedElm.removeAttribute('data-mce-selected');
			}
			each$1(resizeHandles, function (value, name) {
				var handleElm = dom.get('mceResizeHandle' + name);
				if (handleElm) {
					dom.unbind(handleElm);
					dom.remove(handleElm);
				}
			});
		};
		var updateResizeRect = function (e) {
			var startElm, controlElm;
			var isChildOrEqual = function (node, parent) {
				if (node) {
					do {
						if (node === parent) {
							return true;
						}
					} while (node = node.parentNode);
				}
			};
			if (resizeStarted || editor.removed) {
				return;
			}
			each(dom.select('img[data-mce-selected],hr[data-mce-selected]'), function (img) {
				img.removeAttribute('data-mce-selected');
			});
			controlElm = e.type === 'mousedown' ? e.target : selection.getNode();
			controlElm = dom.$(controlElm).closest('table,img,figure.image,hr')[0];
			if (isChildOrEqual(controlElm, rootElement)) {
				disableGeckoResize();
				startElm = selection.getStart(true);
				if (isChildOrEqual(startElm, controlElm) && isChildOrEqual(selection.getEnd(true), controlElm)) {
					showResizeRect(controlElm);
					return;
				}
			}
			hideResizeRect();
		};
		var isWithinContentEditableFalse = function (elm) {
			return isContentEditableFalse$6(getContentEditableRoot(editor.getBody(), elm));
		};
		var unbindResizeHandleEvents = function () {
			each$1(resizeHandles, function (handle) {
				if (handle.elm) {
					dom.unbind(handle.elm);
					delete handle.elm;
				}
			});
		};
		var disableGeckoResize = function () {
			try {
				editor.getDoc().execCommand('enableObjectResizing', false, 'false');
			} catch (ex) {
			}
		};
		editor.on('init', function () {
			disableGeckoResize();
			if (Env.browser.isIE() || Env.browser.isEdge()) {
				editor.on('mousedown click', function (e) {
					var target = e.target, nodeName = target.nodeName;
					if (!resizeStarted && /^(TABLE|IMG|HR)$/.test(nodeName) && !isWithinContentEditableFalse(target)) {
						if (e.button !== 2) {
							editor.selection.select(target, nodeName === 'TABLE');
						}
						if (e.type === 'mousedown') {
							editor.nodeChanged();
						}
					}
				});
				var handleMSControlSelect_1 = function (e) {
					var delayedSelect = function (node) {
						Delay.setEditorTimeout(editor, function () {
							return editor.selection.select(node);
						});
					};
					if (isWithinContentEditableFalse(e.target) || isMedia(e.target)) {
						e.preventDefault();
						delayedSelect(e.target);
						return;
					}
					if (/^(TABLE|IMG|HR)$/.test(e.target.nodeName)) {
						e.preventDefault();
						if (e.target.tagName === 'IMG') {
							delayedSelect(e.target);
						}
					}
				};
				dom.bind(rootElement, 'mscontrolselect', handleMSControlSelect_1);
				editor.on('remove', function () {
					return dom.unbind(rootElement, 'mscontrolselect', handleMSControlSelect_1);
				});
			}
			var throttledUpdateResizeRect = Delay.throttle(function (e) {
				if (!editor.composing) {
					updateResizeRect(e);
				}
			});
			editor.on('nodechange ResizeEditor ResizeWindow ResizeContent drop FullscreenStateChanged', throttledUpdateResizeRect);
			editor.on('keyup compositionend', function (e) {
				if (selectedElm && selectedElm.nodeName === 'TABLE') {
					throttledUpdateResizeRect(e);
				}
			});
			editor.on('hide blur', hideResizeRect);
			editor.on('contextmenu longpress', contextMenuSelectImage, true);
		});
		editor.on('remove', unbindResizeHandleEvents);
		var destroy = function () {
			selectedElm = selectedElmGhost = null;
		};
		return {
			isResizable: isResizable,
			showResizeRect: showResizeRect,
			hideResizeRect: hideResizeRect,
			updateResizeRect: updateResizeRect,
			destroy: destroy
		};
	};

	var hasCeProperty = function (node) {
		return isContentEditableTrue(node) || isContentEditableFalse(node);
	};
	var findParent = function (node, rootNode, predicate) {
		while (node && node !== rootNode) {
			if (predicate(node)) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	};
	var findClosestIeRange = function (clientX, clientY, doc) {
		var rects;
		var element = doc.elementFromPoint(clientX, clientY);
		var rng = doc.body.createTextRange();
		if (!element || element.tagName === 'HTML') {
			element = doc.body;
		}
		rng.moveToElementText(element);
		rects = Tools.toArray(rng.getClientRects());
		rects = rects.sort(function (a, b) {
			a = Math.abs(Math.max(a.top - clientY, a.bottom - clientY));
			b = Math.abs(Math.max(b.top - clientY, b.bottom - clientY));
			return a - b;
		});
		if (rects.length > 0) {
			clientY = (rects[0].bottom + rects[0].top) / 2;
			try {
				rng.moveToPoint(clientX, clientY);
				rng.collapse(true);
				return rng;
			} catch (ex) {
			}
		}
		return null;
	};
	var moveOutOfContentEditableFalse = function (rng, rootNode) {
		var parentElement = rng && rng.parentElement ? rng.parentElement() : null;
		return isContentEditableFalse(findParent(parentElement, rootNode, hasCeProperty)) ? null : rng;
	};
	var fromPoint$1 = function (clientX, clientY, doc) {
		var rng, point;
		var pointDoc = doc;
		if (pointDoc.caretPositionFromPoint) {
			point = pointDoc.caretPositionFromPoint(clientX, clientY);
			if (point) {
				rng = doc.createRange();
				rng.setStart(point.offsetNode, point.offset);
				rng.collapse(true);
			}
		} else if (doc.caretRangeFromPoint) {
			rng = doc.caretRangeFromPoint(clientX, clientY);
		} else if (pointDoc.body.createTextRange) {
			rng = pointDoc.body.createTextRange();
			try {
				rng.moveToPoint(clientX, clientY);
				rng.collapse(true);
			} catch (ex) {
				rng = findClosestIeRange(clientX, clientY, doc);
			}
			return moveOutOfContentEditableFalse(rng, doc.body);
		}
		return rng;
	};

	var isEq$1 = function (rng1, rng2) {
		return rng1 && rng2 && (rng1.startContainer === rng2.startContainer && rng1.startOffset === rng2.startOffset) && (rng1.endContainer === rng2.endContainer && rng1.endOffset === rng2.endOffset);
	};

	var findParent$1 = function (node, rootNode, predicate) {
		while (node && node !== rootNode) {
			if (predicate(node)) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	};
	var hasParent = function (node, rootNode, predicate) {
		return findParent$1(node, rootNode, predicate) !== null;
	};
	var hasParentWithName = function (node, rootNode, name) {
		return hasParent(node, rootNode, function (node) {
			return node.nodeName === name;
		});
	};
	var isTable$3 = function (node) {
		return node && node.nodeName === 'TABLE';
	};
	var isTableCell$3 = function (node) {
		return node && /^(TD|TH|CAPTION)$/.test(node.nodeName);
	};
	var isCeFalseCaretContainer = function (node, rootNode) {
		return isCaretContainer(node) && hasParent(node, rootNode, isCaretNode) === false;
	};
	var hasBrBeforeAfter = function (dom, node, left) {
		var walker = new DomTreeWalker(node, dom.getParent(node.parentNode, dom.isBlock) || dom.getRoot());
		while (node = walker[left ? 'prev' : 'next']()) {
			if (isBr(node)) {
				return true;
			}
		}
	};
	var isPrevNode = function (node, name) {
		return node.previousSibling && node.previousSibling.nodeName === name;
	};
	var hasContentEditableFalseParent = function (body, node) {
		while (node && node !== body) {
			if (isContentEditableFalse(node)) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	};
	var findTextNodeRelative = function (dom, isAfterNode, collapsed, left, startNode) {
		var lastInlineElement;
		var body = dom.getRoot();
		var node;
		var nonEmptyElementsMap = dom.schema.getNonEmptyElements();
		var parentBlockContainer = dom.getParent(startNode.parentNode, dom.isBlock) || body;
		if (left && isBr(startNode) && isAfterNode && dom.isEmpty(parentBlockContainer)) {
			return Optional.some(CaretPosition(startNode.parentNode, dom.nodeIndex(startNode)));
		}
		var walker = new DomTreeWalker(startNode, parentBlockContainer);
		while (node = walker[left ? 'prev' : 'next']()) {
			if (dom.getContentEditableParent(node) === 'false' || isCeFalseCaretContainer(node, body)) {
				return Optional.none();
			}
			if (isText$1(node) && node.nodeValue.length > 0) {
				if (hasParentWithName(node, body, 'A') === false) {
					return Optional.some(CaretPosition(node, left ? node.nodeValue.length : 0));
				}
				return Optional.none();
			}
			if (dom.isBlock(node) || nonEmptyElementsMap[node.nodeName.toLowerCase()]) {
				return Optional.none();
			}
			lastInlineElement = node;
		}
		if (collapsed && lastInlineElement) {
			return Optional.some(CaretPosition(lastInlineElement, 0));
		}
		return Optional.none();
	};
	var normalizeEndPoint = function (dom, collapsed, start, rng) {
		var container, offset;
		var body = dom.getRoot();
		var node;
		var directionLeft, normalized = false;
		container = rng[(start ? 'start' : 'end') + 'Container'];
		offset = rng[(start ? 'start' : 'end') + 'Offset'];
		var isAfterNode = isElement$1(container) && offset === container.childNodes.length;
		var nonEmptyElementsMap = dom.schema.getNonEmptyElements();
		directionLeft = start;
		if (isCaretContainer(container)) {
			return Optional.none();
		}
		if (isElement$1(container) && offset > container.childNodes.length - 1) {
			directionLeft = false;
		}
		if (isDocument$1(container)) {
			container = body;
			offset = 0;
		}
		if (container === body) {
			if (directionLeft) {
				node = container.childNodes[offset > 0 ? offset - 1 : 0];
				if (node) {
					if (isCaretContainer(node)) {
						return Optional.none();
					}
					if (nonEmptyElementsMap[node.nodeName] || isTable$3(node)) {
						return Optional.none();
					}
				}
			}
			if (container.hasChildNodes()) {
				offset = Math.min(!directionLeft && offset > 0 ? offset - 1 : offset, container.childNodes.length - 1);
				container = container.childNodes[offset];
				offset = isText$1(container) && isAfterNode ? container.data.length : 0;
				if (!collapsed && container === body.lastChild && isTable$3(container)) {
					return Optional.none();
				}
				if (hasContentEditableFalseParent(body, container) || isCaretContainer(container)) {
					return Optional.none();
				}
				if (container.hasChildNodes() && isTable$3(container) === false) {
					node = container;
					var walker = new DomTreeWalker(container, body);
					do {
						if (isContentEditableFalse(node) || isCaretContainer(node)) {
							normalized = false;
							break;
						}
						if (isText$1(node) && node.nodeValue.length > 0) {
							offset = directionLeft ? 0 : node.nodeValue.length;
							container = node;
							normalized = true;
							break;
						}
						if (nonEmptyElementsMap[node.nodeName.toLowerCase()] && !isTableCell$3(node)) {
							offset = dom.nodeIndex(node);
							container = node.parentNode;
							if (!directionLeft) {
								offset++;
							}
							normalized = true;
							break;
						}
					} while (node = directionLeft ? walker.next() : walker.prev());
				}
			}
		}
		if (collapsed) {
			if (isText$1(container) && offset === 0) {
				findTextNodeRelative(dom, isAfterNode, collapsed, true, container).each(function (pos) {
					container = pos.container();
					offset = pos.offset();
					normalized = true;
				});
			}
			if (isElement$1(container)) {
				node = container.childNodes[offset];
				if (!node) {
					node = container.childNodes[offset - 1];
				}
				if (node && isBr(node) && !isPrevNode(node, 'A') && !hasBrBeforeAfter(dom, node, false) && !hasBrBeforeAfter(dom, node, true)) {
					findTextNodeRelative(dom, isAfterNode, collapsed, true, node).each(function (pos) {
						container = pos.container();
						offset = pos.offset();
						normalized = true;
					});
				}
			}
		}
		if (directionLeft && !collapsed && isText$1(container) && offset === container.nodeValue.length) {
			findTextNodeRelative(dom, isAfterNode, collapsed, false, container).each(function (pos) {
				container = pos.container();
				offset = pos.offset();
				normalized = true;
			});
		}
		return normalized ? Optional.some(CaretPosition(container, offset)) : Optional.none();
	};
	var normalize = function (dom, rng) {
		var collapsed = rng.collapsed, normRng = rng.cloneRange();
		var startPos = CaretPosition.fromRangeStart(rng);
		normalizeEndPoint(dom, collapsed, true, normRng).each(function (pos) {
			if (!collapsed || !CaretPosition.isAbove(startPos, pos)) {
				normRng.setStart(pos.container(), pos.offset());
			}
		});
		if (!collapsed) {
			normalizeEndPoint(dom, collapsed, false, normRng).each(function (pos) {
				normRng.setEnd(pos.container(), pos.offset());
			});
		}
		if (collapsed) {
			normRng.collapse(true);
		}
		return isEq$1(rng, normRng) ? Optional.none() : Optional.some(normRng);
	};

	var splitText = function (node, offset) {
		return node.splitText(offset);
	};
	var split$1 = function (rng) {
		var startContainer = rng.startContainer, startOffset = rng.startOffset, endContainer = rng.endContainer, endOffset = rng.endOffset;
		if (startContainer === endContainer && isText$1(startContainer)) {
			if (startOffset > 0 && startOffset < startContainer.nodeValue.length) {
				endContainer = splitText(startContainer, startOffset);
				startContainer = endContainer.previousSibling;
				if (endOffset > startOffset) {
					endOffset = endOffset - startOffset;
					startContainer = endContainer = splitText(endContainer, endOffset).previousSibling;
					endOffset = endContainer.nodeValue.length;
					startOffset = 0;
				} else {
					endOffset = 0;
				}
			}
		} else {
			if (isText$1(startContainer) && startOffset > 0 && startOffset < startContainer.nodeValue.length) {
				startContainer = splitText(startContainer, startOffset);
				startOffset = 0;
			}
			if (isText$1(endContainer) && endOffset > 0 && endOffset < endContainer.nodeValue.length) {
				endContainer = splitText(endContainer, endOffset).previousSibling;
				endOffset = endContainer.nodeValue.length;
			}
		}
		return {
			startContainer: startContainer,
			startOffset: startOffset,
			endContainer: endContainer,
			endOffset: endOffset
		};
	};

	function RangeUtils(dom) {
		var walk = function (rng, callback) {
			return walk$1(dom, rng, callback);
		};
		var split = split$1;
		var normalize$1 = function (rng) {
			return normalize(dom, rng).fold(never, function (normalizedRng) {
				rng.setStart(normalizedRng.startContainer, normalizedRng.startOffset);
				rng.setEnd(normalizedRng.endContainer, normalizedRng.endOffset);
				return true;
			});
		};
		return {
			walk: walk,
			split: split,
			normalize: normalize$1
		};
	}
	(function (RangeUtils) {
		RangeUtils.compareRanges = isEq$1;
		RangeUtils.getCaretRangeFromPoint = fromPoint$1;
		RangeUtils.getSelectedNode = getSelectedNode;
		RangeUtils.getNode = getNode;
	}(RangeUtils || (RangeUtils = {})));
	var RangeUtils$1 = RangeUtils;

	function Dimension(name, getOffset) {
		var set = function (element, h) {
			if (!isNumber(h) && !h.match(/^[0-9]+$/)) {
				throw new Error(name + '.set accepts only positive integer values. Value was ' + h);
			}
			var dom = element.dom;
			if (isSupported$1(dom)) {
				dom.style[name] = h + 'px';
			}
		};
		var get = function (element) {
			var r = getOffset(element);
			if (r <= 0 || r === null) {
				var css = get$5(element, name);
				return parseFloat(css) || 0;
			}
			return r;
		};
		var getOuter = get;
		var aggregate = function (element, properties) {
			return foldl(properties, function (acc, property) {
				var val = get$5(element, property);
				var value = val === undefined ? 0 : parseInt(val, 10);
				return isNaN(value) ? acc : acc + value;
			}, 0);
		};
		var max = function (element, value, properties) {
			var cumulativeInclusions = aggregate(element, properties);
			var absoluteMax = value > cumulativeInclusions ? value - cumulativeInclusions : 0;
			return absoluteMax;
		};
		return {
			set: set,
			get: get,
			getOuter: getOuter,
			aggregate: aggregate,
			max: max
		};
	}

	var api$1 = Dimension('height', function (element) {
		var dom = element.dom;
		return inBody(element) ? dom.getBoundingClientRect().height : dom.offsetHeight;
	});
	var get$9 = function (element) {
		return api$1.get(element);
	};

	var walkUp = function (navigation, doc) {
		var frame = navigation.view(doc);
		return frame.fold(constant([]), function (f) {
			var parent = navigation.owner(f);
			var rest = walkUp(navigation, parent);
			return [f].concat(rest);
		});
	};
	var pathTo = function (element, navigation) {
		var d = navigation.owner(element);
		return walkUp(navigation, d);
	};

	var view = function (doc) {
		var _a;
		var element = doc.dom === document ? Optional.none() : Optional.from((_a = doc.dom.defaultView) === null || _a === void 0 ? void 0 : _a.frameElement);
		return element.map(SugarElement.fromDom);
	};
	var owner$1 = function (element) {
		return documentOrOwner(element);
	};

	var Navigation = /*#__PURE__*/Object.freeze({
		__proto__: null,
		view: view,
		owner: owner$1
	});

	var find$2 = function (element) {
		var doc = SugarElement.fromDom(document);
		var scroll = get$2(doc);
		var frames = pathTo(element, Navigation);
		var offset = viewport(element);
		var r = foldr(frames, function (b, a) {
			var loc = viewport(a);
			return {
				left: b.left + loc.left,
				top: b.top + loc.top
			};
		}, {
			left: 0,
			top: 0
		});
		return SugarPosition(r.left + offset.left + scroll.left, r.top + offset.top + scroll.top);
	};

	var excludeFromDescend = function (element) {
		return name(element) === 'textarea';
	};
	var fireScrollIntoViewEvent = function (editor, data) {
		var scrollEvent = editor.fire('ScrollIntoView', data);
		return scrollEvent.isDefaultPrevented();
	};
	var fireAfterScrollIntoViewEvent = function (editor, data) {
		editor.fire('AfterScrollIntoView', data);
	};
	var descend = function (element, offset) {
		var children$1 = children(element);
		if (children$1.length === 0 || excludeFromDescend(element)) {
			return {
				element: element,
				offset: offset
			};
		} else if (offset < children$1.length && !excludeFromDescend(children$1[offset])) {
			return {
				element: children$1[offset],
				offset: 0
			};
		} else {
			var last = children$1[children$1.length - 1];
			if (excludeFromDescend(last)) {
				return {
					element: element,
					offset: offset
				};
			} else {
				if (name(last) === 'img') {
					return {
						element: last,
						offset: 1
					};
				} else if (isText(last)) {
					return {
						element: last,
						offset: get$8(last).length
					};
				} else {
					return {
						element: last,
						offset: children(last).length
					};
				}
			}
		}
	};
	var markerInfo = function (element, cleanupFun) {
		var pos = absolute(element);
		var height = get$9(element);
		return {
			element: element,
			bottom: pos.top + height,
			height: height,
			pos: pos,
			cleanup: cleanupFun
		};
	};
	var createMarker = function (element, offset) {
		var startPoint = descend(element, offset);
		var span = SugarElement.fromHtml('<span data-mce-bogus="all">' + ZWSP + '</span>');
		before(startPoint.element, span);
		return markerInfo(span, function () {
			return remove(span);
		});
	};
	var elementMarker = function (element) {
		return markerInfo(SugarElement.fromDom(element), noop);
	};
	var withMarker = function (editor, f, rng, alignToTop) {
		preserveWith(editor, function (_s, _e) {
			return applyWithMarker(editor, f, rng, alignToTop);
		}, rng);
	};
	var withScrollEvents = function (editor, doc, f, marker, alignToTop) {
		var data = {
			elm: marker.element.dom,
			alignToTop: alignToTop
		};
		if (fireScrollIntoViewEvent(editor, data)) {
			return;
		}
		var scrollTop = get$2(doc).top;
		f(doc, scrollTop, marker, alignToTop);
		fireAfterScrollIntoViewEvent(editor, data);
	};
	var applyWithMarker = function (editor, f, rng, alignToTop) {
		var body = SugarElement.fromDom(editor.getBody());
		var doc = SugarElement.fromDom(editor.getDoc());
		reflow(body);
		var marker = createMarker(SugarElement.fromDom(rng.startContainer), rng.startOffset);
		withScrollEvents(editor, doc, f, marker, alignToTop);
		marker.cleanup();
	};
	var withElement = function (editor, element, f, alignToTop) {
		var doc = SugarElement.fromDom(editor.getDoc());
		withScrollEvents(editor, doc, f, elementMarker(element), alignToTop);
	};
	var preserveWith = function (editor, f, rng) {
		var startElement = rng.startContainer;
		var startOffset = rng.startOffset;
		var endElement = rng.endContainer;
		var endOffset = rng.endOffset;
		f(SugarElement.fromDom(startElement), SugarElement.fromDom(endElement));
		var newRng = editor.dom.createRng();
		newRng.setStart(startElement, startOffset);
		newRng.setEnd(endElement, endOffset);
		editor.selection.setRng(rng);
	};
	var scrollToMarker = function (marker, viewHeight, alignToTop, doc) {
		var pos = marker.pos;
		if (alignToTop) {
			to(pos.left, pos.top, doc);
		} else {
			var y = pos.top - viewHeight + marker.height;
			to(pos.left, y, doc);
		}
	};
	var intoWindowIfNeeded = function (doc, scrollTop, viewHeight, marker, alignToTop) {
		var viewportBottom = viewHeight + scrollTop;
		var markerTop = marker.pos.top;
		var markerBottom = marker.bottom;
		var largerThanViewport = markerBottom - markerTop >= viewHeight;
		if (markerTop < scrollTop) {
			scrollToMarker(marker, viewHeight, alignToTop !== false, doc);
		} else if (markerTop > viewportBottom) {
			var align = largerThanViewport ? alignToTop !== false : alignToTop === true;
			scrollToMarker(marker, viewHeight, align, doc);
		} else if (markerBottom > viewportBottom && !largerThanViewport) {
			scrollToMarker(marker, viewHeight, alignToTop === true, doc);
		}
	};
	var intoWindow = function (doc, scrollTop, marker, alignToTop) {
		var viewHeight = doc.dom.defaultView.innerHeight;
		intoWindowIfNeeded(doc, scrollTop, viewHeight, marker, alignToTop);
	};
	var intoFrame = function (doc, scrollTop, marker, alignToTop) {
		var frameViewHeight = doc.dom.defaultView.innerHeight;
		intoWindowIfNeeded(doc, scrollTop, frameViewHeight, marker, alignToTop);
		var op = find$2(marker.element);
		var viewportBounds = getBounds(window);
		if (op.top < viewportBounds.y) {
			intoView(marker.element, alignToTop !== false);
		} else if (op.top > viewportBounds.bottom) {
			intoView(marker.element, alignToTop === true);
		}
	};
	var rangeIntoWindow = function (editor, rng, alignToTop) {
		return withMarker(editor, intoWindow, rng, alignToTop);
	};
	var elementIntoWindow = function (editor, element, alignToTop) {
		return withElement(editor, element, intoWindow, alignToTop);
	};
	var rangeIntoFrame = function (editor, rng, alignToTop) {
		return withMarker(editor, intoFrame, rng, alignToTop);
	};
	var elementIntoFrame = function (editor, element, alignToTop) {
		return withElement(editor, element, intoFrame, alignToTop);
	};
	var scrollElementIntoView = function (editor, element, alignToTop) {
		var scroller = editor.inline ? elementIntoWindow : elementIntoFrame;
		scroller(editor, element, alignToTop);
	};
	var scrollRangeIntoView = function (editor, rng, alignToTop) {
		var scroller = editor.inline ? rangeIntoWindow : rangeIntoFrame;
		scroller(editor, rng, alignToTop);
	};

	var getDocument = function () {
		return SugarElement.fromDom(document);
	};

	var focus = function (element) {
		return element.dom.focus();
	};
	var hasFocus = function (element) {
		var root = getRootNode(element).dom;
		return element.dom === root.activeElement;
	};
	var active = function (root) {
		if (root === void 0) {
			root = getDocument();
		}
		return Optional.from(root.dom.activeElement).map(SugarElement.fromDom);
	};
	var search = function (element) {
		return active(getRootNode(element)).filter(function (e) {
			return element.dom.contains(e.dom);
		});
	};

	var create$4 = function (start, soffset, finish, foffset) {
		return {
			start: start,
			soffset: soffset,
			finish: finish,
			foffset: foffset
		};
	};
	var SimRange = { create: create$4 };

	var adt = Adt.generate([
		{ before: ['element'] },
		{
			on: [
				'element',
				'offset'
			]
		},
		{ after: ['element'] }
	]);
	var cata = function (subject, onBefore, onOn, onAfter) {
		return subject.fold(onBefore, onOn, onAfter);
	};
	var getStart = function (situ) {
		return situ.fold(identity, identity, identity);
	};
	var before$3 = adt.before;
	var on = adt.on;
	var after$2 = adt.after;
	var Situ = {
		before: before$3,
		on: on,
		after: after$2,
		cata: cata,
		getStart: getStart
	};

	var adt$1 = Adt.generate([
		{ domRange: ['rng'] },
		{
			relative: [
				'startSitu',
				'finishSitu'
			]
		},
		{
			exact: [
				'start',
				'soffset',
				'finish',
				'foffset'
			]
		}
	]);
	var exactFromRange = function (simRange) {
		return adt$1.exact(simRange.start, simRange.soffset, simRange.finish, simRange.foffset);
	};
	var getStart$1 = function (selection) {
		return selection.match({
			domRange: function (rng) {
				return SugarElement.fromDom(rng.startContainer);
			},
			relative: function (startSitu, _finishSitu) {
				return Situ.getStart(startSitu);
			},
			exact: function (start, _soffset, _finish, _foffset) {
				return start;
			}
		});
	};
	var domRange = adt$1.domRange;
	var relative = adt$1.relative;
	var exact = adt$1.exact;
	var getWin = function (selection) {
		var start = getStart$1(selection);
		return defaultView(start);
	};
	var range = SimRange.create;
	var SimSelection = {
		domRange: domRange,
		relative: relative,
		exact: exact,
		exactFromRange: exactFromRange,
		getWin: getWin,
		range: range
	};

	var browser$3 = detect$3().browser;
	var clamp = function (offset, element) {
		var max = isText(element) ? get$8(element).length : children(element).length + 1;
		if (offset > max) {
			return max;
		} else if (offset < 0) {
			return 0;
		}
		return offset;
	};
	var normalizeRng = function (rng) {
		return SimSelection.range(rng.start, clamp(rng.soffset, rng.start), rng.finish, clamp(rng.foffset, rng.finish));
	};
	var isOrContains = function (root, elm) {
		return !isRestrictedNode(elm.dom) && (contains$2(root, elm) || eq$2(root, elm));
	};
	var isRngInRoot = function (root) {
		return function (rng) {
			return isOrContains(root, rng.start) && isOrContains(root, rng.finish);
		};
	};
	var shouldStore = function (editor) {
		return editor.inline === true || browser$3.isIE();
	};
	var nativeRangeToSelectionRange = function (r) {
		return SimSelection.range(SugarElement.fromDom(r.startContainer), r.startOffset, SugarElement.fromDom(r.endContainer), r.endOffset);
	};
	var readRange = function (win) {
		var selection = win.getSelection();
		var rng = !selection || selection.rangeCount === 0 ? Optional.none() : Optional.from(selection.getRangeAt(0));
		return rng.map(nativeRangeToSelectionRange);
	};
	var getBookmark$2 = function (root) {
		var win = defaultView(root);
		return readRange(win.dom).filter(isRngInRoot(root));
	};
	var validate = function (root, bookmark) {
		return Optional.from(bookmark).filter(isRngInRoot(root)).map(normalizeRng);
	};
	var bookmarkToNativeRng = function (bookmark) {
		var rng = document.createRange();
		try {
			rng.setStart(bookmark.start.dom, bookmark.soffset);
			rng.setEnd(bookmark.finish.dom, bookmark.foffset);
			return Optional.some(rng);
		} catch (_) {
			return Optional.none();
		}
	};
	var store = function (editor) {
		var newBookmark = shouldStore(editor) ? getBookmark$2(SugarElement.fromDom(editor.getBody())) : Optional.none();
		editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
	};
	var storeNative = function (editor, rng) {
		var root = SugarElement.fromDom(editor.getBody());
		var range = shouldStore(editor) ? Optional.from(rng) : Optional.none();
		var newBookmark = range.map(nativeRangeToSelectionRange).filter(isRngInRoot(root));
		editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
	};
	var getRng = function (editor) {
		var bookmark = editor.bookmark ? editor.bookmark : Optional.none();
		return bookmark.bind(function (x) {
			return validate(SugarElement.fromDom(editor.getBody()), x);
		}).bind(bookmarkToNativeRng);
	};
	var restore = function (editor) {
		getRng(editor).each(function (rng) {
			return editor.selection.setRng(rng);
		});
	};

	var isEditorUIElement = function (elm) {
		var className = elm.className.toString();
		return className.indexOf('tox-') !== -1 || className.indexOf('mce-') !== -1;
	};
	var FocusManager = { isEditorUIElement: isEditorUIElement };

	var isManualNodeChange = function (e) {
		return e.type === 'nodechange' && e.selectionChange;
	};
	var registerPageMouseUp = function (editor, throttledStore) {
		var mouseUpPage = function () {
			throttledStore.throttle();
		};
		DOMUtils$1.DOM.bind(document, 'mouseup', mouseUpPage);
		editor.on('remove', function () {
			DOMUtils$1.DOM.unbind(document, 'mouseup', mouseUpPage);
		});
	};
	var registerFocusOut = function (editor) {
		editor.on('focusout', function () {
			store(editor);
		});
	};
	var registerMouseUp = function (editor, throttledStore) {
		editor.on('mouseup touchend', function (_e) {
			throttledStore.throttle();
		});
	};
	var registerEditorEvents = function (editor, throttledStore) {
		var browser = detect$3().browser;
		if (browser.isIE()) {
			registerFocusOut(editor);
		} else {
			registerMouseUp(editor, throttledStore);
		}
		editor.on('keyup NodeChange', function (e) {
			if (!isManualNodeChange(e)) {
				store(editor);
			}
		});
	};
	var register = function (editor) {
		var throttledStore = first(function () {
			store(editor);
		}, 0);
		editor.on('init', function () {
			if (editor.inline) {
				registerPageMouseUp(editor, throttledStore);
			}
			registerEditorEvents(editor, throttledStore);
		});
		editor.on('remove', function () {
			throttledStore.cancel();
		});
	};

	var documentFocusInHandler;
	var DOM$2 = DOMUtils$1.DOM;
	var isEditorUIElement$1 = function (elm) {
		return FocusManager.isEditorUIElement(elm);
	};
	var isEditorContentAreaElement = function (elm) {
		var classList = elm.classList;
		if (classList !== undefined) {
			return classList.contains('tox-edit-area') || classList.contains('tox-edit-area__iframe') || classList.contains('mce-content-body');
		} else {
			return false;
		}
	};
	var isUIElement = function (editor, elm) {
		var customSelector = getCustomUiSelector(editor);
		var parent = DOM$2.getParent(elm, function (elm) {
			return isEditorUIElement$1(elm) || (customSelector ? editor.dom.is(elm, customSelector) : false);
		});
		return parent !== null;
	};
	var getActiveElement = function (editor) {
		try {
			var root = getRootNode(SugarElement.fromDom(editor.getElement()));
			return active(root).fold(function () {
				return document.body;
			}, function (x) {
				return x.dom;
			});
		} catch (ex) {
			return document.body;
		}
	};
	var registerEvents = function (editorManager, e) {
		var editor = e.editor;
		register(editor);
		editor.on('focusin', function () {
			var self = this;
			var focusedEditor = editorManager.focusedEditor;
			if (focusedEditor !== self) {
				if (focusedEditor) {
					focusedEditor.fire('blur', { focusedEditor: self });
				}
				editorManager.setActive(self);
				editorManager.focusedEditor = self;
				self.fire('focus', { blurredEditor: focusedEditor });
				self.focus(true);
			}
		});
		editor.on('focusout', function () {
			var self = this;
			Delay.setEditorTimeout(self, function () {
				var focusedEditor = editorManager.focusedEditor;
				if (!isUIElement(self, getActiveElement(self)) && focusedEditor === self) {
					self.fire('blur', { focusedEditor: null });
					editorManager.focusedEditor = null;
				}
			});
		});
		if (!documentFocusInHandler) {
			documentFocusInHandler = function (e) {
				var activeEditor = editorManager.activeEditor;
				if (activeEditor) {
					getOriginalEventTarget(e).each(function (target) {
						if (target.ownerDocument === document) {
							if (target !== document.body && !isUIElement(activeEditor, target) && editorManager.focusedEditor === activeEditor) {
								activeEditor.fire('blur', { focusedEditor: null });
								editorManager.focusedEditor = null;
							}
						}
					});
				}
			};
			DOM$2.bind(document, 'focusin', documentFocusInHandler);
		}
	};
	var unregisterDocumentEvents = function (editorManager, e) {
		if (editorManager.focusedEditor === e.editor) {
			editorManager.focusedEditor = null;
		}
		if (!editorManager.activeEditor) {
			DOM$2.unbind(document, 'focusin', documentFocusInHandler);
			documentFocusInHandler = null;
		}
	};
	var setup$2 = function (editorManager) {
		editorManager.on('AddEditor', curry(registerEvents, editorManager));
		editorManager.on('RemoveEditor', curry(unregisterDocumentEvents, editorManager));
	};

	var getContentEditableHost = function (editor, node) {
		return editor.dom.getParent(node, function (node) {
			return editor.dom.getContentEditable(node) === 'true';
		});
	};
	var getCollapsedNode = function (rng) {
		return rng.collapsed ? Optional.from(getNode(rng.startContainer, rng.startOffset)).map(SugarElement.fromDom) : Optional.none();
	};
	var getFocusInElement = function (root, rng) {
		return getCollapsedNode(rng).bind(function (node) {
			if (isTableSection(node)) {
				return Optional.some(node);
			} else if (contains$2(root, node) === false) {
				return Optional.some(root);
			} else {
				return Optional.none();
			}
		});
	};
	var normalizeSelection = function (editor, rng) {
		getFocusInElement(SugarElement.fromDom(editor.getBody()), rng).bind(function (elm) {
			return firstPositionIn(elm.dom);
		}).fold(function () {
			editor.selection.normalize();
			return;
		}, function (caretPos) {
			return editor.selection.setRng(caretPos.toRange());
		});
	};
	var focusBody = function (body) {
		if (body.setActive) {
			try {
				body.setActive();
			} catch (ex) {
				body.focus();
			}
		} else {
			body.focus();
		}
	};
	var hasElementFocus = function (elm) {
		return hasFocus(elm) || search(elm).isSome();
	};
	var hasIframeFocus = function (editor) {
		return editor.iframeElement && hasFocus(SugarElement.fromDom(editor.iframeElement));
	};
	var hasInlineFocus = function (editor) {
		var rawBody = editor.getBody();
		return rawBody && hasElementFocus(SugarElement.fromDom(rawBody));
	};
	var hasUiFocus = function (editor) {
		return active().filter(function (elem) {
			return !isEditorContentAreaElement(elem.dom) && isUIElement(editor, elem.dom);
		}).isSome();
	};
	var hasFocus$1 = function (editor) {
		return editor.inline ? hasInlineFocus(editor) : hasIframeFocus(editor);
	};
	var hasEditorOrUiFocus = function (editor) {
		return hasFocus$1(editor) || hasUiFocus(editor);
	};
	var focusEditor = function (editor) {
		var selection = editor.selection;
		var body = editor.getBody();
		var rng = selection.getRng();
		editor.quirks.refreshContentEditable();
		if (editor.bookmark !== undefined && hasFocus$1(editor) === false) {
			getRng(editor).each(function (bookmarkRng) {
				editor.selection.setRng(bookmarkRng);
				rng = bookmarkRng;
			});
		}
		var contentEditableHost = getContentEditableHost(editor, selection.getNode());
		if (editor.$.contains(body, contentEditableHost)) {
			focusBody(contentEditableHost);
			normalizeSelection(editor, rng);
			activateEditor(editor);
			return;
		}
		if (!editor.inline) {
			if (!Env.opera) {
				focusBody(body);
			}
			editor.getWin().focus();
		}
		if (Env.gecko || editor.inline) {
			focusBody(body);
			normalizeSelection(editor, rng);
		}
		activateEditor(editor);
	};
	var activateEditor = function (editor) {
		return editor.editorManager.setActive(editor);
	};
	var focus$1 = function (editor, skipFocus) {
		if (editor.removed) {
			return;
		}
		skipFocus ? activateEditor(editor) : focusEditor(editor);
	};

	var getEndpointElement = function (root, rng, start, real, resolve) {
		var container = start ? rng.startContainer : rng.endContainer;
		var offset = start ? rng.startOffset : rng.endOffset;
		return Optional.from(container).map(SugarElement.fromDom).map(function (elm) {
			return !real || !rng.collapsed ? child(elm, resolve(elm, offset)).getOr(elm) : elm;
		}).bind(function (elm) {
			return isElement(elm) ? Optional.some(elm) : parent(elm).filter(isElement);
		}).map(function (elm) {
			return elm.dom;
		}).getOr(root);
	};
	var getStart$2 = function (root, rng, real) {
		return getEndpointElement(root, rng, true, real, function (elm, offset) {
			return Math.min(childNodesCount(elm), offset);
		});
	};
	var getEnd = function (root, rng, real) {
		return getEndpointElement(root, rng, false, real, function (elm, offset) {
			return offset > 0 ? offset - 1 : offset;
		});
	};
	var skipEmptyTextNodes = function (node, forwards) {
		var orig = node;
		while (node && isText$1(node) && node.length === 0) {
			node = forwards ? node.nextSibling : node.previousSibling;
		}
		return node || orig;
	};
	var getNode$1 = function (root, rng) {
		var elm, startContainer, endContainer;
		if (!rng) {
			return root;
		}
		startContainer = rng.startContainer;
		endContainer = rng.endContainer;
		var startOffset = rng.startOffset;
		var endOffset = rng.endOffset;
		elm = rng.commonAncestorContainer;
		if (!rng.collapsed) {
			if (startContainer === endContainer) {
				if (endOffset - startOffset < 2) {
					if (startContainer.hasChildNodes()) {
						elm = startContainer.childNodes[startOffset];
					}
				}
			}
			if (startContainer.nodeType === 3 && endContainer.nodeType === 3) {
				if (startContainer.length === startOffset) {
					startContainer = skipEmptyTextNodes(startContainer.nextSibling, true);
				} else {
					startContainer = startContainer.parentNode;
				}
				if (endOffset === 0) {
					endContainer = skipEmptyTextNodes(endContainer.previousSibling, false);
				} else {
					endContainer = endContainer.parentNode;
				}
				if (startContainer && startContainer === endContainer) {
					return startContainer;
				}
			}
		}
		if (elm && elm.nodeType === 3) {
			return elm.parentNode;
		}
		return elm;
	};
	var getSelectedBlocks = function (dom, rng, startElm, endElm) {
		var node;
		var selectedBlocks = [];
		var root = dom.getRoot();
		startElm = dom.getParent(startElm || getStart$2(root, rng, rng.collapsed), dom.isBlock);
		endElm = dom.getParent(endElm || getEnd(root, rng, rng.collapsed), dom.isBlock);
		if (startElm && startElm !== root) {
			selectedBlocks.push(startElm);
		}
		if (startElm && endElm && startElm !== endElm) {
			node = startElm;
			var walker = new DomTreeWalker(startElm, root);
			while ((node = walker.next()) && node !== endElm) {
				if (dom.isBlock(node)) {
					selectedBlocks.push(node);
				}
			}
		}
		if (endElm && startElm !== endElm && endElm !== root) {
			selectedBlocks.push(endElm);
		}
		return selectedBlocks;
	};
	var select$1 = function (dom, node, content) {
		return Optional.from(node).map(function (node) {
			var idx = dom.nodeIndex(node);
			var rng = dom.createRng();
			rng.setStart(node.parentNode, idx);
			rng.setEnd(node.parentNode, idx + 1);
			if (content) {
				moveEndPoint$1(dom, rng, node, true);
				moveEndPoint$1(dom, rng, node, false);
			}
			return rng;
		});
	};

	var processRanges = function (editor, ranges) {
		return map(ranges, function (range) {
			var evt = editor.fire('GetSelectionRange', { range: range });
			return evt.range !== range ? evt.range : range;
		});
	};

	var ensureIsRoot = function (isRoot) {
		return isFunction(isRoot) ? isRoot : never;
	};
	var ancestor$3 = function (scope, transform, isRoot) {
		var element = scope.dom;
		var stop = ensureIsRoot(isRoot);
		while (element.parentNode) {
			element = element.parentNode;
			var el = SugarElement.fromDom(element);
			var transformed = transform(el);
			if (transformed.isSome()) {
				return transformed;
			} else if (stop(el)) {
				break;
			}
		}
		return Optional.none();
	};
	var closest$2 = function (scope, transform, isRoot) {
		var current = transform(scope);
		var stop = ensureIsRoot(isRoot);
		return current.orThunk(function () {
			return stop(scope) ? Optional.none() : ancestor$3(scope, transform, stop);
		});
	};

	var isEq$2 = isEq;
	var matchesUnInheritedFormatSelector = function (ed, node, name) {
		var formatList = ed.formatter.get(name);
		if (formatList) {
			for (var i = 0; i < formatList.length; i++) {
				if (formatList[i].inherit === false && ed.dom.is(node, formatList[i].selector)) {
					return true;
				}
			}
		}
		return false;
	};
	var matchParents = function (editor, node, name, vars) {
		var root = editor.dom.getRoot();
		if (node === root) {
			return false;
		}
		node = editor.dom.getParent(node, function (node) {
			if (matchesUnInheritedFormatSelector(editor, node, name)) {
				return true;
			}
			return node.parentNode === root || !!matchNode(editor, node, name, vars, true);
		});
		return matchNode(editor, node, name, vars);
	};
	var matchName = function (dom, node, format) {
		if (isEq$2(node, format.inline)) {
			return true;
		}
		if (isEq$2(node, format.block)) {
			return true;
		}
		if (format.selector) {
			return node.nodeType === 1 && dom.is(node, format.selector);
		}
	};
	var matchItems = function (dom, node, format, itemName, similar, vars) {
		var key, value;
		var items = format[itemName];
		var i;
		if (format.onmatch) {
			return format.onmatch(node, format, itemName);
		}
		if (items) {
			if (typeof items.length === 'undefined') {
				for (key in items) {
					if (items.hasOwnProperty(key)) {
						if (itemName === 'attributes') {
							value = dom.getAttrib(node, key);
						} else {
							value = getStyle(dom, node, key);
						}
						if (similar && !value && !format.exact) {
							return;
						}
						if ((!similar || format.exact) && !isEq$2(value, normalizeStyleValue(dom, replaceVars(items[key], vars), key))) {
							return;
						}
					}
				}
			} else {
				for (i = 0; i < items.length; i++) {
					if (itemName === 'attributes' ? dom.getAttrib(node, items[i]) : getStyle(dom, node, items[i])) {
						return format;
					}
				}
			}
		}
		return format;
	};
	var matchNode = function (ed, node, name, vars, similar) {
		var formatList = ed.formatter.get(name);
		var format, i, x, classes;
		var dom = ed.dom;
		if (formatList && node) {
			for (i = 0; i < formatList.length; i++) {
				format = formatList[i];
				if (matchName(ed.dom, node, format) && matchItems(dom, node, format, 'attributes', similar, vars) && matchItems(dom, node, format, 'styles', similar, vars)) {
					if (classes = format.classes) {
						for (x = 0; x < classes.length; x++) {
							if (!ed.dom.hasClass(node, classes[x])) {
								return;
							}
						}
					}
					return format;
				}
			}
		}
	};
	var match = function (editor, name, vars, node) {
		if (node) {
			return matchParents(editor, node, name, vars);
		}
		node = editor.selection.getNode();
		if (matchParents(editor, node, name, vars)) {
			return true;
		}
		var startNode = editor.selection.getStart();
		if (startNode !== node) {
			if (matchParents(editor, startNode, name, vars)) {
				return true;
			}
		}
		return false;
	};
	var matchAll = function (editor, names, vars) {
		var matchedFormatNames = [];
		var checkedMap = {};
		var startElement = editor.selection.getStart();
		editor.dom.getParent(startElement, function (node) {
			for (var i = 0; i < names.length; i++) {
				var name_1 = names[i];
				if (!checkedMap[name_1] && matchNode(editor, node, name_1, vars)) {
					checkedMap[name_1] = true;
					matchedFormatNames.push(name_1);
				}
			}
		}, editor.dom.getRoot());
		return matchedFormatNames;
	};
	var closest$3 = function (editor, names) {
		var isRoot = function (elm) {
			return eq$2(elm, SugarElement.fromDom(editor.getBody()));
		};
		var match = function (elm, name) {
			return matchNode(editor, elm.dom, name) ? Optional.some(name) : Optional.none();
		};
		return Optional.from(editor.selection.getStart(true)).bind(function (rawElm) {
			return closest$2(SugarElement.fromDom(rawElm), function (elm) {
				return findMap(names, function (name) {
					return match(elm, name);
				});
			}, isRoot);
		}).getOrNull();
	};
	var canApply = function (editor, name) {
		var formatList = editor.formatter.get(name);
		var startNode, parents, i, x, selector;
		var dom = editor.dom;
		if (formatList) {
			startNode = editor.selection.getStart();
			parents = getParents$1(dom, startNode);
			for (x = formatList.length - 1; x >= 0; x--) {
				selector = formatList[x].selector;
				if (!selector || formatList[x].defaultBlock) {
					return true;
				}
				for (i = parents.length - 1; i >= 0; i--) {
					if (dom.is(parents[i], selector)) {
						return true;
					}
				}
			}
		}
		return false;
	};
	var matchAllOnNode = function (editor, node, formatNames) {
		return foldl(formatNames, function (acc, name) {
			var matchSimilar = isVariableFormatName(editor, name);
			if (editor.formatter.matchNode(node, name, {}, matchSimilar)) {
				return acc.concat([name]);
			} else {
				return acc;
			}
		}, []);
	};

	var typeLookup = {
		'#text': 3,
		'#comment': 8,
		'#cdata': 4,
		'#pi': 7,
		'#doctype': 10,
		'#document-fragment': 11
	};
	var walk$2 = function (node, root, prev) {
		var startName = prev ? 'lastChild' : 'firstChild';
		var siblingName = prev ? 'prev' : 'next';
		if (node[startName]) {
			return node[startName];
		}
		if (node !== root) {
			var sibling = node[siblingName];
			if (sibling) {
				return sibling;
			}
			for (var parent_1 = node.parent; parent_1 && parent_1 !== root; parent_1 = parent_1.parent) {
				sibling = parent_1[siblingName];
				if (sibling) {
					return sibling;
				}
			}
		}
	};
	var isEmptyTextNode$1 = function (node) {
		if (!isWhitespaceText(node.value)) {
			return false;
		}
		var parentNode = node.parent;
		if (parentNode && (parentNode.name !== 'span' || parentNode.attr('style')) && /^[ ]+$/.test(node.value)) {
			return false;
		}
		return true;
	};
	var isNonEmptyElement = function (node) {
		var isNamedAnchor = node.name === 'a' && !node.attr('href') && node.attr('id');
		return node.attr('name') || node.attr('id') && !node.firstChild || node.attr('data-mce-bookmark') || isNamedAnchor;
	};
	var AstNode = function () {
		function AstNode(name, type) {
			this.name = name;
			this.type = type;
			if (type === 1) {
				this.attributes = [];
				this.attributes.map = {};
			}
		}
		AstNode.create = function (name, attrs) {
			var node = new AstNode(name, typeLookup[name] || 1);
			if (attrs) {
				each$1(attrs, function (value, attrName) {
					node.attr(attrName, value);
				});
			}
			return node;
		};
		AstNode.prototype.replace = function (node) {
			var self = this;
			if (node.parent) {
				node.remove();
			}
			self.insert(node, self);
			self.remove();
			return self;
		};
		AstNode.prototype.attr = function (name, value) {
			var self = this;
			var attrs;
			if (typeof name !== 'string') {
				if (name !== undefined && name !== null) {
					each$1(name, function (value, key) {
						self.attr(key, value);
					});
				}
				return self;
			}
			if (attrs = self.attributes) {
				if (value !== undefined) {
					if (value === null) {
						if (name in attrs.map) {
							delete attrs.map[name];
							var i = attrs.length;
							while (i--) {
								if (attrs[i].name === name) {
									attrs.splice(i, 1);
									return self;
								}
							}
						}
						return self;
					}
					if (name in attrs.map) {
						var i = attrs.length;
						while (i--) {
							if (attrs[i].name === name) {
								attrs[i].value = value;
								break;
							}
						}
					} else {
						attrs.push({
							name: name,
							value: value
						});
					}
					attrs.map[name] = value;
					return self;
				}
				return attrs.map[name];
			}
		};
		AstNode.prototype.clone = function () {
			var self = this;
			var clone = new AstNode(self.name, self.type);
			var selfAttrs;
			if (selfAttrs = self.attributes) {
				var cloneAttrs = [];
				cloneAttrs.map = {};
				for (var i = 0, l = selfAttrs.length; i < l; i++) {
					var selfAttr = selfAttrs[i];
					if (selfAttr.name !== 'id') {
						cloneAttrs[cloneAttrs.length] = {
							name: selfAttr.name,
							value: selfAttr.value
						};
						cloneAttrs.map[selfAttr.name] = selfAttr.value;
					}
				}
				clone.attributes = cloneAttrs;
			}
			clone.value = self.value;
			clone.shortEnded = self.shortEnded;
			return clone;
		};
		AstNode.prototype.wrap = function (wrapper) {
			var self = this;
			self.parent.insert(wrapper, self);
			wrapper.append(self);
			return self;
		};
		AstNode.prototype.unwrap = function () {
			var self = this;
			for (var node = self.firstChild; node;) {
				var next = node.next;
				self.insert(node, self, true);
				node = next;
			}
			self.remove();
		};
		AstNode.prototype.remove = function () {
			var self = this, parent = self.parent, next = self.next, prev = self.prev;
			if (parent) {
				if (parent.firstChild === self) {
					parent.firstChild = next;
					if (next) {
						next.prev = null;
					}
				} else {
					prev.next = next;
				}
				if (parent.lastChild === self) {
					parent.lastChild = prev;
					if (prev) {
						prev.next = null;
					}
				} else {
					next.prev = prev;
				}
				self.parent = self.next = self.prev = null;
			}
			return self;
		};
		AstNode.prototype.append = function (node) {
			var self = this;
			if (node.parent) {
				node.remove();
			}
			var last = self.lastChild;
			if (last) {
				last.next = node;
				node.prev = last;
				self.lastChild = node;
			} else {
				self.lastChild = self.firstChild = node;
			}
			node.parent = self;
			return node;
		};
		AstNode.prototype.insert = function (node, refNode, before) {
			if (node.parent) {
				node.remove();
			}
			var parent = refNode.parent || this;
			if (before) {
				if (refNode === parent.firstChild) {
					parent.firstChild = node;
				} else {
					refNode.prev.next = node;
				}
				node.prev = refNode.prev;
				node.next = refNode;
				refNode.prev = node;
			} else {
				if (refNode === parent.lastChild) {
					parent.lastChild = node;
				} else {
					refNode.next.prev = node;
				}
				node.next = refNode.next;
				node.prev = refNode;
				refNode.next = node;
			}
			node.parent = parent;
			return node;
		};
		AstNode.prototype.getAll = function (name) {
			var self = this;
			var collection = [];
			for (var node = self.firstChild; node; node = walk$2(node, self)) {
				if (node.name === name) {
					collection.push(node);
				}
			}
			return collection;
		};
		AstNode.prototype.empty = function () {
			var self = this;
			if (self.firstChild) {
				var nodes = [];
				for (var node = self.firstChild; node; node = walk$2(node, self)) {
					nodes.push(node);
				}
				var i = nodes.length;
				while (i--) {
					var node = nodes[i];
					node.parent = node.firstChild = node.lastChild = node.next = node.prev = null;
				}
			}
			self.firstChild = self.lastChild = null;
			return self;
		};
		AstNode.prototype.isEmpty = function (elements, whitespace, predicate) {
			if (whitespace === void 0) {
				whitespace = {};
			}
			var self = this;
			var node = self.firstChild;
			if (isNonEmptyElement(self)) {
				return false;
			}
			if (node) {
				do {
					if (node.type === 1) {
						if (node.attr('data-mce-bogus')) {
							continue;
						}
						if (elements[node.name]) {
							return false;
						}
						if (isNonEmptyElement(node)) {
							return false;
						}
					}
					if (node.type === 8) {
						return false;
					}
					if (node.type === 3 && !isEmptyTextNode$1(node)) {
						return false;
					}
					if (node.type === 3 && node.parent && whitespace[node.parent.name] && isWhitespaceText(node.value)) {
						return false;
					}
					if (predicate && predicate(node)) {
						return false;
					}
				} while (node = walk$2(node, self));
			}
			return true;
		};
		AstNode.prototype.walk = function (prev) {
			return walk$2(this, null, prev);
		};
		return AstNode;
	}();

	var makeMap$3 = Tools.makeMap;
	var Writer = function (settings) {
		var html = [];
		settings = settings || {};
		var indent = settings.indent;
		var indentBefore = makeMap$3(settings.indent_before || '');
		var indentAfter = makeMap$3(settings.indent_after || '');
		var encode = Entities.getEncodeFunc(settings.entity_encoding || 'raw', settings.entities);
		var htmlOutput = settings.element_format === 'html';
		return {
			start: function (name, attrs, empty) {
				var i, l, attr, value;
				if (indent && indentBefore[name] && html.length > 0) {
					value = html[html.length - 1];
					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}
				html.push('<', name);
				if (attrs) {
					for (i = 0, l = attrs.length; i < l; i++) {
						attr = attrs[i];
						html.push(' ', attr.name, '="', encode(attr.value, true), '"');
					}
				}
				if (!empty || htmlOutput) {
					html[html.length] = '>';
				} else {
					html[html.length] = ' />';
				}
				if (empty && indent && indentAfter[name] && html.length > 0) {
					value = html[html.length - 1];
					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}
			},
			end: function (name) {
				var value;
				html.push('</', name, '>');
				if (indent && indentAfter[name] && html.length > 0) {
					value = html[html.length - 1];
					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}
			},
			text: function (text, raw) {
				if (text.length > 0) {
					html[html.length] = raw ? text : encode(text);
				}
			},
			cdata: function (text) {
				html.push('<![CDATA[', text, ']]>');
			},
			comment: function (text) {
				html.push('<!--', text, '-->');
			},
			pi: function (name, text) {
				if (text) {
					html.push('<?', name, ' ', encode(text), '?>');
				} else {
					html.push('<?', name, '?>');
				}
				if (indent) {
					html.push('\n');
				}
			},
			doctype: function (text) {
				html.push('<!DOCTYPE', text, '>', indent ? '\n' : '');
			},
			reset: function () {
				html.length = 0;
			},
			getContent: function () {
				return html.join('').replace(/\n$/, '');
			}
		};
	};

	var HtmlSerializer = function (settings, schema) {
		if (schema === void 0) {
			schema = Schema();
		}
		var writer = Writer(settings);
		settings = settings || {};
		settings.validate = 'validate' in settings ? settings.validate : true;
		var serialize = function (node) {
			var validate = settings.validate;
			var handlers = {
				3: function (node) {
					writer.text(node.value, node.raw);
				},
				8: function (node) {
					writer.comment(node.value);
				},
				7: function (node) {
					writer.pi(node.name, node.value);
				},
				10: function (node) {
					writer.doctype(node.value);
				},
				4: function (node) {
					writer.cdata(node.value);
				},
				11: function (node) {
					if (node = node.firstChild) {
						do {
							walk(node);
						} while (node = node.next);
					}
				}
			};
			writer.reset();
			var walk = function (node) {
				var handler = handlers[node.type];
				var name, isEmpty, attrs, attrName, attrValue, sortedAttrs, i, l, elementRule;
				if (!handler) {
					name = node.name;
					isEmpty = node.shortEnded;
					attrs = node.attributes;
					if (validate && attrs && attrs.length > 1) {
						sortedAttrs = [];
						sortedAttrs.map = {};
						elementRule = schema.getElementRule(node.name);
						if (elementRule) {
							for (i = 0, l = elementRule.attributesOrder.length; i < l; i++) {
								attrName = elementRule.attributesOrder[i];
								if (attrName in attrs.map) {
									attrValue = attrs.map[attrName];
									sortedAttrs.map[attrName] = attrValue;
									sortedAttrs.push({
										name: attrName,
										value: attrValue
									});
								}
							}
							for (i = 0, l = attrs.length; i < l; i++) {
								attrName = attrs[i].name;
								if (!(attrName in sortedAttrs.map)) {
									attrValue = attrs.map[attrName];
									sortedAttrs.map[attrName] = attrValue;
									sortedAttrs.push({
										name: attrName,
										value: attrValue
									});
								}
							}
							attrs = sortedAttrs;
						}
					}
					writer.start(node.name, attrs, isEmpty);
					if (!isEmpty) {
						if (node = node.firstChild) {
							do {
								walk(node);
							} while (node = node.next);
						}
						writer.end(name);
					}
				} else {
					handler(node);
				}
			};
			if (node.type === 1 && !settings.inner) {
				walk(node);
			} else {
				handlers[11](node);
			}
			return writer.getContent();
		};
		return { serialize: serialize };
	};

	var extractBase64DataUris = function (html) {
		var dataImageUri = /data:[^;]+;base64,([a-z0-9\+\/=]+)/gi;
		var chunks = [];
		var uris = {};
		var prefix = generate$1('img');
		var matches;
		var index = 0;
		var count = 0;
		while (matches = dataImageUri.exec(html)) {
			var uri = matches[0];
			var imageId = prefix + '_' + count++;
			uris[imageId] = uri;
			if (index < matches.index) {
				chunks.push(html.substr(index, matches.index - index));
			}
			chunks.push(imageId);
			index = matches.index + uri.length;
		}
		if (index === 0) {
			return {
				prefix: prefix,
				uris: uris,
				html: html
			};
		} else {
			if (index < html.length) {
				chunks.push(html.substr(index));
			}
			return {
				prefix: prefix,
				uris: uris,
				html: chunks.join('')
			};
		}
	};
	var restoreDataUris = function (html, result) {
		return html.replace(new RegExp(result.prefix + '_[0-9]+', 'g'), function (imageId) {
			return get$1(result.uris, imageId).getOr(imageId);
		});
	};
	var parseDataUri = function (uri) {
		var matches = /data:([^;]+);base64,([a-z0-9\+\/=]+)/i.exec(uri);
		if (matches) {
			return Optional.some({
				type: matches[1],
				data: decodeURIComponent(matches[2])
			});
		} else {
			return Optional.none();
		}
	};

	var safeSvgDataUrlElements = [
		'img',
		'video'
	];
	var isValidPrefixAttrName = function (name) {
		return name.indexOf('data-') === 0 || name.indexOf('aria-') === 0;
	};
	var blockSvgDataUris = function (allowSvgDataUrls, tagName) {
		var allowed = isNullable(allowSvgDataUrls) ? contains(safeSvgDataUrlElements, tagName) : allowSvgDataUrls;
		return !allowed;
	};
	var isInvalidUri = function (settings, uri, tagName) {
		if (settings.allow_html_data_urls) {
			return false;
		} else if (/^data:image\//i.test(uri)) {
			return blockSvgDataUris(settings.allow_svg_data_urls, tagName) && /^data:image\/svg\+xml/i.test(uri);
		} else {
			return /^data:/i.test(uri);
		}
	};
	var findEndTagIndex = function (schema, html, startIndex) {
		var count = 1, index, matches;
		var shortEndedElements = schema.getShortEndedElements();
		var tokenRegExp = /<([!?\/])?([A-Za-z0-9\-_\:\.]+)((?:\s+[^"\'>]+(?:(?:"[^"]*")|(?:\'[^\']*\')|[^>]*))*|\/|\s+)>/g;
		tokenRegExp.lastIndex = index = startIndex;
		while (matches = tokenRegExp.exec(html)) {
			index = tokenRegExp.lastIndex;
			if (matches[1] === '/') {
				count--;
			} else if (!matches[1]) {
				if (matches[2] in shortEndedElements) {
					continue;
				}
				count++;
			}
			if (count === 0) {
				break;
			}
		}
		return index;
	};
	var isConditionalComment = function (html, startIndex) {
		return /^\s*\[if [\w\W]+\]>.*<!\[endif\](--!?)?>/.test(html.substr(startIndex));
	};
	var findCommentEndIndex = function (html, isBogus, startIndex) {
		if (startIndex === void 0) {
			startIndex = 0;
		}
		var lcHtml = html.toLowerCase();
		if (lcHtml.indexOf('[if ', startIndex) !== -1 && isConditionalComment(lcHtml, startIndex)) {
			var endIfIndex = lcHtml.indexOf('[endif]', startIndex);
			return lcHtml.indexOf('>', endIfIndex);
		} else {
			if (isBogus) {
				var endIndex = lcHtml.indexOf('>', startIndex);
				return endIndex !== -1 ? endIndex : lcHtml.length;
			} else {
				var endCommentRegexp = /--!?>/;
				endCommentRegexp.lastIndex = startIndex;
				var match = endCommentRegexp.exec(html);
				return match ? match.index + match[0].length : lcHtml.length;
			}
		}
	};
	var checkBogusAttribute = function (regExp, attrString) {
		var matches = regExp.exec(attrString);
		if (matches) {
			var name_1 = matches[1];
			var value = matches[2];
			return typeof name_1 === 'string' && name_1.toLowerCase() === 'data-mce-bogus' ? value : null;
		} else {
			return null;
		}
	};
	function SaxParser(settings, schema) {
		if (schema === void 0) {
			schema = Schema();
		}
		var noop = function () {
		};
		settings = settings || {};
		if (settings.fix_self_closing !== false) {
			settings.fix_self_closing = true;
		}
		var comment = settings.comment ? settings.comment : noop;
		var cdata = settings.cdata ? settings.cdata : noop;
		var text = settings.text ? settings.text : noop;
		var start = settings.start ? settings.start : noop;
		var end = settings.end ? settings.end : noop;
		var pi = settings.pi ? settings.pi : noop;
		var doctype = settings.doctype ? settings.doctype : noop;
		var parseInternal = function (base64Extract, format) {
			if (format === void 0) {
				format = 'html';
			}
			var html = base64Extract.html;
			var matches, index = 0, value, endRegExp;
			var stack = [];
			var attrList, i, textData, name;
			var isInternalElement, isShortEnded;
			var elementRule, isValidElement, attr, attribsValue, validAttributesMap, validAttributePatterns;
			var attributesRequired, attributesDefault, attributesForced;
			var anyAttributesRequired, attrValue, idCount = 0;
			var decode = Entities.decode;
			var filteredUrlAttrs = Tools.makeMap('src,href,data,background,formaction,poster,xlink:href');
			var scriptUriRegExp = /((java|vb)script|mhtml):/i;
			var parsingMode = format === 'html' ? 0 : 1;
			var processEndTag = function (name) {
				var pos, i;
				pos = stack.length;
				while (pos--) {
					if (stack[pos].name === name) {
						break;
					}
				}
				if (pos >= 0) {
					for (i = stack.length - 1; i >= pos; i--) {
						name = stack[i];
						if (name.valid) {
							end(name.name);
						}
					}
					stack.length = pos;
				}
			};
			var processText = function (value, raw) {
				return text(restoreDataUris(value, base64Extract), raw);
			};
			var processComment = function (value) {
				if (value === '') {
					return;
				}
				if (value.charAt(0) === '>') {
					value = ' ' + value;
				}
				if (!settings.allow_conditional_comments && value.substr(0, 3).toLowerCase() === '[if') {
					value = ' ' + value;
				}
				comment(restoreDataUris(value, base64Extract));
			};
			var processAttr = function (value) {
				return get$1(base64Extract.uris, value).getOr(value);
			};
			var processMalformedComment = function (value, startIndex) {
				var startTag = value || '';
				var isBogus = !startsWith(startTag, '--');
				var endIndex = findCommentEndIndex(html, isBogus, startIndex);
				value = html.substr(startIndex, endIndex - startIndex);
				processComment(isBogus ? startTag + value : value);
				return endIndex + 1;
			};
			var parseAttribute = function (tagName, name, value, val2, val3) {
				var attrRule, i;
				var trimRegExp = /[\s\u0000-\u001F]+/g;
				name = name.toLowerCase();
				value = processAttr(name in fillAttrsMap ? name : decode(value || val2 || val3 || ''));
				if (validate && !isInternalElement && isValidPrefixAttrName(name) === false) {
					attrRule = validAttributesMap[name];
					if (!attrRule && validAttributePatterns) {
						i = validAttributePatterns.length;
						while (i--) {
							attrRule = validAttributePatterns[i];
							if (attrRule.pattern.test(name)) {
								break;
							}
						}
						if (i === -1) {
							attrRule = null;
						}
					}
					if (!attrRule) {
						return;
					}
					if (attrRule.validValues && !(value in attrRule.validValues)) {
						return;
					}
				}
				if (filteredUrlAttrs[name] && !settings.allow_script_urls) {
					var uri = value.replace(trimRegExp, '');
					try {
						uri = decodeURIComponent(uri);
					} catch (ex) {
						uri = unescape(uri);
					}
					if (scriptUriRegExp.test(uri)) {
						return;
					}
					if (isInvalidUri(settings, uri, tagName)) {
						return;
					}
				}
				if (isInternalElement && (name in filteredUrlAttrs || name.indexOf('on') === 0)) {
					return;
				}
				attrList.map[name] = value;
				attrList.push({
					name: name,
					value: value
				});
			};
			var tokenRegExp = new RegExp('<(?:' + '(?:!--([\\w\\W]*?)--!?>)|' + '(?:!\\[CDATA\\[([\\w\\W]*?)\\]\\]>)|' + '(?:![Dd][Oo][Cc][Tt][Yy][Pp][Ee]([\\w\\W]*?)>)|' + '(?:!(--)?)|' + '(?:\\?([^\\s\\/<>]+) ?([\\w\\W]*?)[?/]>)|' + '(?:\\/([A-Za-z][A-Za-z0-9\\-_\\:\\.]*)>)|' + '(?:([A-Za-z][A-Za-z0-9\\-_\\:\\.]*)((?:\\s+[^"\'>]+(?:(?:"[^"]*")|(?:\'[^\']*\')|[^>]*))*|\\/|\\s+)>)' + ')', 'g');
			var attrRegExp = /([\w:\-]+)(?:\s*=\s*(?:(?:\"((?:[^\"])*)\")|(?:\'((?:[^\'])*)\')|([^>\s]+)))?/g;
			var shortEndedElements = schema.getShortEndedElements();
			var selfClosing = settings.self_closing_elements || schema.getSelfClosingElements();
			var fillAttrsMap = schema.getBoolAttrs();
			var validate = settings.validate;
			var removeInternalElements = settings.remove_internals;
			var fixSelfClosing = settings.fix_self_closing;
			var specialElements = schema.getSpecialElements();
			var processHtml = html + '>';
			while (matches = tokenRegExp.exec(processHtml)) {
				var matchText = matches[0];
				if (index < matches.index) {
					processText(decode(html.substr(index, matches.index - index)));
				}
				if (value = matches[7]) {
					value = value.toLowerCase();
					if (value.charAt(0) === ':') {
						value = value.substr(1);
					}
					processEndTag(value);
				} else if (value = matches[8]) {
					if (matches.index + matchText.length > html.length) {
						processText(decode(html.substr(matches.index)));
						index = matches.index + matchText.length;
						continue;
					}
					value = value.toLowerCase();
					if (value.charAt(0) === ':') {
						value = value.substr(1);
					}
					isShortEnded = value in shortEndedElements;
					if (fixSelfClosing && selfClosing[value] && stack.length > 0 && stack[stack.length - 1].name === value) {
						processEndTag(value);
					}
					var bogusValue = checkBogusAttribute(attrRegExp, matches[9]);
					if (bogusValue !== null) {
						if (bogusValue === 'all') {
							index = findEndTagIndex(schema, html, tokenRegExp.lastIndex);
							tokenRegExp.lastIndex = index;
							continue;
						}
						isValidElement = false;
					}
					if (!validate || (elementRule = schema.getElementRule(value))) {
						isValidElement = true;
						if (validate) {
							validAttributesMap = elementRule.attributes;
							validAttributePatterns = elementRule.attributePatterns;
						}
						if (attribsValue = matches[9]) {
							isInternalElement = attribsValue.indexOf('data-mce-type') !== -1;
							if (isInternalElement && removeInternalElements) {
								isValidElement = false;
							}
							attrList = [];
							attrList.map = {};
							attribsValue.replace(attrRegExp, function (match, name, val, val2, val3) {
								parseAttribute(value, name, val, val2, val3);
								return '';
							});
						} else {
							attrList = [];
							attrList.map = {};
						}
						if (validate && !isInternalElement) {
							attributesRequired = elementRule.attributesRequired;
							attributesDefault = elementRule.attributesDefault;
							attributesForced = elementRule.attributesForced;
							anyAttributesRequired = elementRule.removeEmptyAttrs;
							if (anyAttributesRequired && !attrList.length) {
								isValidElement = false;
							}
							if (attributesForced) {
								i = attributesForced.length;
								while (i--) {
									attr = attributesForced[i];
									name = attr.name;
									attrValue = attr.value;
									if (attrValue === '{$uid}') {
										attrValue = 'mce_' + idCount++;
									}
									attrList.map[name] = attrValue;
									attrList.push({
										name: name,
										value: attrValue
									});
								}
							}
							if (attributesDefault) {
								i = attributesDefault.length;
								while (i--) {
									attr = attributesDefault[i];
									name = attr.name;
									if (!(name in attrList.map)) {
										attrValue = attr.value;
										if (attrValue === '{$uid}') {
											attrValue = 'mce_' + idCount++;
										}
										attrList.map[name] = attrValue;
										attrList.push({
											name: name,
											value: attrValue
										});
									}
								}
							}
							if (attributesRequired) {
								i = attributesRequired.length;
								while (i--) {
									if (attributesRequired[i] in attrList.map) {
										break;
									}
								}
								if (i === -1) {
									isValidElement = false;
								}
							}
							if (attr = attrList.map['data-mce-bogus']) {
								if (attr === 'all') {
									index = findEndTagIndex(schema, html, tokenRegExp.lastIndex);
									tokenRegExp.lastIndex = index;
									continue;
								}
								isValidElement = false;
							}
						}
						if (isValidElement) {
							start(value, attrList, isShortEnded);
						}
					} else {
						isValidElement = false;
					}
					if (endRegExp = specialElements[value]) {
						endRegExp.lastIndex = index = matches.index + matchText.length;
						if (matches = endRegExp.exec(html)) {
							if (isValidElement) {
								textData = html.substr(index, matches.index - index);
							}
							index = matches.index + matches[0].length;
						} else {
							textData = html.substr(index);
							index = html.length;
						}
						if (isValidElement) {
							if (textData.length > 0) {
								processText(textData, true);
							}
							end(value);
						}
						tokenRegExp.lastIndex = index;
						continue;
					}
					if (!isShortEnded) {
						if (!attribsValue || attribsValue.indexOf('/') !== attribsValue.length - 1) {
							stack.push({
								name: value,
								valid: isValidElement
							});
						} else if (isValidElement) {
							end(value);
						}
					}
				} else if (value = matches[1]) {
					processComment(value);
				} else if (value = matches[2]) {
					var isValidCdataSection = parsingMode === 1 || settings.preserve_cdata || stack.length > 0 && schema.isValidChild(stack[stack.length - 1].name, '#cdata');
					if (isValidCdataSection) {
						cdata(value);
					} else {
						index = processMalformedComment('', matches.index + 2);
						tokenRegExp.lastIndex = index;
						continue;
					}
				} else if (value = matches[3]) {
					doctype(value);
				} else if ((value = matches[4]) || matchText === '<!') {
					index = processMalformedComment(value, matches.index + matchText.length);
					tokenRegExp.lastIndex = index;
					continue;
				} else if (value = matches[5]) {
					if (parsingMode === 1) {
						pi(value, matches[6]);
					} else {
						index = processMalformedComment('?', matches.index + 2);
						tokenRegExp.lastIndex = index;
						continue;
					}
				}
				index = matches.index + matchText.length;
			}
			if (index < html.length) {
				processText(decode(html.substr(index)));
			}
			for (i = stack.length - 1; i >= 0; i--) {
				value = stack[i];
				if (value.valid) {
					end(value.name);
				}
			}
		};
		var parse = function (html, format) {
			if (format === void 0) {
				format = 'html';
			}
			parseInternal(extractBase64DataUris(html), format);
		};
		return { parse: parse };
	}
	(function (SaxParser) {
		SaxParser.findEndTag = findEndTagIndex;
	}(SaxParser || (SaxParser = {})));
	var SaxParser$1 = SaxParser;

	var trimHtml = function (tempAttrs, html) {
		var trimContentRegExp = new RegExp(['\\s?(' + tempAttrs.join('|') + ')="[^"]+"'].join('|'), 'gi');
		return html.replace(trimContentRegExp, '');
	};
	var trimInternal = function (serializer, html) {
		var content = html;
		var bogusAllRegExp = /<(\w+) [^>]*data-mce-bogus="all"[^>]*>/g;
		var endTagIndex, index, matchLength, matches;
		var schema = serializer.schema;
		content = trimHtml(serializer.getTempAttrs(), content);
		var shortEndedElements = schema.getShortEndedElements();
		while (matches = bogusAllRegExp.exec(content)) {
			index = bogusAllRegExp.lastIndex;
			matchLength = matches[0].length;
			if (shortEndedElements[matches[1]]) {
				endTagIndex = index;
			} else {
				endTagIndex = SaxParser$1.findEndTag(schema, content, index);
			}
			content = content.substring(0, index - matchLength) + content.substring(endTagIndex);
			bogusAllRegExp.lastIndex = index - matchLength;
		}
		return trim$2(content);
	};
	var trimExternal = trimInternal;

	var trimEmptyContents = function (editor, html) {
		var blockName = getForcedRootBlock(editor);
		var emptyRegExp = new RegExp('^(<' + blockName + '[^>]*>(&nbsp;|&#160;|\\s|\xA0|<br \\/>|)<\\/' + blockName + '>[\r\n]*|<br \\/>[\r\n]*)$');
		return html.replace(emptyRegExp, '');
	};
	var getContentFromBody = function (editor, args, format, body) {
		var content;
		args.format = format;
		args.get = true;
		args.getInner = true;
		if (!args.no_events) {
			editor.fire('BeforeGetContent', args);
		}
		if (args.format === 'raw') {
			content = Tools.trim(trimExternal(editor.serializer, body.innerHTML));
		} else if (args.format === 'text') {
			content = editor.dom.isEmpty(body) ? '' : trim$2(body.innerText || body.textContent);
		} else if (args.format === 'tree') {
			content = editor.serializer.serialize(body, args);
		} else {
			content = trimEmptyContents(editor, editor.serializer.serialize(body, args));
		}
		if (!contains([
			'text',
			'tree'
		], args.format) && !isWsPreserveElement(SugarElement.fromDom(body))) {
			args.content = Tools.trim(content);
		} else {
			args.content = content;
		}
		if (!args.no_events) {
			editor.fire('GetContent', args);
		}
		return args.content;
	};
	var getContentInternal = function (editor, args, format) {
		return Optional.from(editor.getBody()).fold(constant(args.format === 'tree' ? new AstNode('body', 11) : ''), function (body) {
			return getContentFromBody(editor, args, format, body);
		});
	};

	var each$7 = Tools.each;
	var ElementUtils = function (dom) {
		this.compare = function (node1, node2) {
			if (node1.nodeName !== node2.nodeName) {
				return false;
			}
			var getAttribs = function (node) {
				var attribs = {};
				each$7(dom.getAttribs(node), function (attr) {
					var name = attr.nodeName.toLowerCase();
					if (name.indexOf('_') !== 0 && name !== 'style' && name.indexOf('data-') !== 0) {
						attribs[name] = dom.getAttrib(node, name);
					}
				});
				return attribs;
			};
			var compareObjects = function (obj1, obj2) {
				var value, name;
				for (name in obj1) {
					if (obj1.hasOwnProperty(name)) {
						value = obj2[name];
						if (typeof value === 'undefined') {
							return false;
						}
						if (obj1[name] !== value) {
							return false;
						}
						delete obj2[name];
					}
				}
				for (name in obj2) {
					if (obj2.hasOwnProperty(name)) {
						return false;
					}
				}
				return true;
			};
			if (!compareObjects(getAttribs(node1), getAttribs(node2))) {
				return false;
			}
			if (!compareObjects(dom.parseStyle(dom.getAttrib(node1, 'style')), dom.parseStyle(dom.getAttrib(node2, 'style')))) {
				return false;
			}
			return !isBookmarkNode$1(node1) && !isBookmarkNode$1(node2);
		};
	};

	var isChar = function (forward, predicate, pos) {
		return Optional.from(pos.container()).filter(isText$1).exists(function (text) {
			var delta = forward ? 0 : -1;
			return predicate(text.data.charAt(pos.offset() + delta));
		});
	};
	var isBeforeSpace = curry(isChar, true, isWhiteSpace$1);
	var isAfterSpace = curry(isChar, false, isWhiteSpace$1);
	var isEmptyText = function (pos) {
		var container = pos.container();
		return isText$1(container) && (container.data.length === 0 || isZwsp$1(container.data) && BookmarkManager$1.isBookmarkNode(container.parentNode));
	};
	var matchesElementPosition = function (before, predicate) {
		return function (pos) {
			return Optional.from(getChildNodeAtRelativeOffset(before ? 0 : -1, pos)).filter(predicate).isSome();
		};
	};
	var isImageBlock = function (node) {
		return isImg(node) && get$5(SugarElement.fromDom(node), 'display') === 'block';
	};
	var isCefNode = function (node) {
		return isContentEditableFalse(node) && !isBogusAll(node);
	};
	var isBeforeImageBlock = matchesElementPosition(true, isImageBlock);
	var isAfterImageBlock = matchesElementPosition(false, isImageBlock);
	var isBeforeMedia = matchesElementPosition(true, isMedia);
	var isAfterMedia = matchesElementPosition(false, isMedia);
	var isBeforeTable = matchesElementPosition(true, isTable);
	var isAfterTable = matchesElementPosition(false, isTable);
	var isBeforeContentEditableFalse = matchesElementPosition(true, isCefNode);
	var isAfterContentEditableFalse = matchesElementPosition(false, isCefNode);

	var getLastChildren$1 = function (elm) {
		var children = [];
		var rawNode = elm.dom;
		while (rawNode) {
			children.push(SugarElement.fromDom(rawNode));
			rawNode = rawNode.lastChild;
		}
		return children;
	};
	var removeTrailingBr = function (elm) {
		var allBrs = descendants$1(elm, 'br');
		var brs = filter(getLastChildren$1(elm).slice(-1), isBr$1);
		if (allBrs.length === brs.length) {
			each(brs, remove);
		}
	};
	var fillWithPaddingBr = function (elm) {
		empty(elm);
		append(elm, SugarElement.fromHtml('<br data-mce-bogus="1">'));
	};
	var trimBlockTrailingBr = function (elm) {
		lastChild(elm).each(function (lastChild) {
			prevSibling(lastChild).each(function (lastChildPrevSibling) {
				if (isBlock(elm) && isBr$1(lastChild) && isBlock(lastChildPrevSibling)) {
					remove(lastChild);
				}
			});
		});
	};

	var dropLast = function (xs) {
		return xs.slice(0, -1);
	};
	var parentsUntil$1 = function (start, root, predicate) {
		if (contains$2(root, start)) {
			return dropLast(parents(start, function (elm) {
				return predicate(elm) || eq$2(elm, root);
			}));
		} else {
			return [];
		}
	};
	var parents$1 = function (start, root) {
		return parentsUntil$1(start, root, never);
	};
	var parentsAndSelf = function (start, root) {
		return [start].concat(parents$1(start, root));
	};

	var navigateIgnoreEmptyTextNodes = function (forward, root, from) {
		return navigateIgnore(forward, root, from, isEmptyText);
	};
	var getClosestBlock = function (root, pos) {
		return find(parentsAndSelf(SugarElement.fromDom(pos.container()), root), isBlock);
	};
	var isAtBeforeAfterBlockBoundary = function (forward, root, pos) {
		return navigateIgnoreEmptyTextNodes(forward, root.dom, pos).forall(function (newPos) {
			return getClosestBlock(root, pos).fold(function () {
				return isInSameBlock(newPos, pos, root.dom) === false;
			}, function (fromBlock) {
				return isInSameBlock(newPos, pos, root.dom) === false && contains$2(fromBlock, SugarElement.fromDom(newPos.container()));
			});
		});
	};
	var isAtBlockBoundary$1 = function (forward, root, pos) {
		return getClosestBlock(root, pos).fold(function () {
			return navigateIgnoreEmptyTextNodes(forward, root.dom, pos).forall(function (newPos) {
				return isInSameBlock(newPos, pos, root.dom) === false;
			});
		}, function (parent) {
			return navigateIgnoreEmptyTextNodes(forward, parent.dom, pos).isNone();
		});
	};
	var isAtStartOfBlock = curry(isAtBlockBoundary$1, false);
	var isAtEndOfBlock = curry(isAtBlockBoundary$1, true);
	var isBeforeBlock = curry(isAtBeforeAfterBlockBoundary, false);
	var isAfterBlock = curry(isAtBeforeAfterBlockBoundary, true);

	var isBr$5 = function (pos) {
		return getElementFromPosition(pos).exists(isBr$1);
	};
	var findBr = function (forward, root, pos) {
		var parentBlocks = filter(parentsAndSelf(SugarElement.fromDom(pos.container()), root), isBlock);
		var scope = head(parentBlocks).getOr(root);
		return fromPosition(forward, scope.dom, pos).filter(isBr$5);
	};
	var isBeforeBr = function (root, pos) {
		return getElementFromPosition(pos).exists(isBr$1) || findBr(true, root, pos).isSome();
	};
	var isAfterBr = function (root, pos) {
		return getElementFromPrevPosition(pos).exists(isBr$1) || findBr(false, root, pos).isSome();
	};
	var findPreviousBr = curry(findBr, false);
	var findNextBr = curry(findBr, true);

	var isInMiddleOfText = function (pos) {
		return CaretPosition.isTextPosition(pos) && !pos.isAtStart() && !pos.isAtEnd();
	};
	var getClosestBlock$1 = function (root, pos) {
		var parentBlocks = filter(parentsAndSelf(SugarElement.fromDom(pos.container()), root), isBlock);
		return head(parentBlocks).getOr(root);
	};
	var hasSpaceBefore = function (root, pos) {
		if (isInMiddleOfText(pos)) {
			return isAfterSpace(pos);
		} else {
			return isAfterSpace(pos) || prevPosition(getClosestBlock$1(root, pos).dom, pos).exists(isAfterSpace);
		}
	};
	var hasSpaceAfter = function (root, pos) {
		if (isInMiddleOfText(pos)) {
			return isBeforeSpace(pos);
		} else {
			return isBeforeSpace(pos) || nextPosition(getClosestBlock$1(root, pos).dom, pos).exists(isBeforeSpace);
		}
	};
	var isPreValue = function (value) {
		return contains([
			'pre',
			'pre-wrap'
		], value);
	};
	var isInPre = function (pos) {
		return getElementFromPosition(pos).bind(function (elm) {
			return closest(elm, isElement);
		}).exists(function (elm) {
			return isPreValue(get$5(elm, 'white-space'));
		});
	};
	var isAtBeginningOfBody = function (root, pos) {
		return prevPosition(root.dom, pos).isNone();
	};
	var isAtEndOfBody = function (root, pos) {
		return nextPosition(root.dom, pos).isNone();
	};
	var isAtLineBoundary = function (root, pos) {
		return isAtBeginningOfBody(root, pos) || isAtEndOfBody(root, pos) || isAtStartOfBlock(root, pos) || isAtEndOfBlock(root, pos) || isAfterBr(root, pos) || isBeforeBr(root, pos);
	};
	var needsToHaveNbsp = function (root, pos) {
		if (isInPre(pos)) {
			return false;
		} else {
			return isAtLineBoundary(root, pos) || hasSpaceBefore(root, pos) || hasSpaceAfter(root, pos);
		}
	};
	var needsToBeNbspLeft = function (root, pos) {
		if (isInPre(pos)) {
			return false;
		} else {
			return isAtStartOfBlock(root, pos) || isBeforeBlock(root, pos) || isAfterBr(root, pos) || hasSpaceBefore(root, pos);
		}
	};
	var leanRight = function (pos) {
		var container = pos.container();
		var offset = pos.offset();
		if (isText$1(container) && offset < container.data.length) {
			return CaretPosition(container, offset + 1);
		} else {
			return pos;
		}
	};
	var needsToBeNbspRight = function (root, pos) {
		if (isInPre(pos)) {
			return false;
		} else {
			return isAtEndOfBlock(root, pos) || isAfterBlock(root, pos) || isBeforeBr(root, pos) || hasSpaceAfter(root, pos);
		}
	};
	var needsToBeNbsp = function (root, pos) {
		return needsToBeNbspLeft(root, pos) || needsToBeNbspRight(root, leanRight(pos));
	};
	var isNbspAt = function (text, offset) {
		return isNbsp(text.charAt(offset));
	};
	var hasNbsp = function (pos) {
		var container = pos.container();
		return isText$1(container) && contains$1(container.data, nbsp);
	};
	var normalizeNbspMiddle = function (text) {
		var chars = text.split('');
		return map(chars, function (chr, i) {
			if (isNbsp(chr) && i > 0 && i < chars.length - 1 && isContent$1(chars[i - 1]) && isContent$1(chars[i + 1])) {
				return ' ';
			} else {
				return chr;
			}
		}).join('');
	};
	var normalizeNbspAtStart = function (root, node) {
		var text = node.data;
		var firstPos = CaretPosition(node, 0);
		if (isNbspAt(text, 0) && !needsToBeNbsp(root, firstPos)) {
			node.data = ' ' + text.slice(1);
			return true;
		} else {
			return false;
		}
	};
	var normalizeNbspInMiddleOfTextNode = function (node) {
		var text = node.data;
		var newText = normalizeNbspMiddle(text);
		if (newText !== text) {
			node.data = newText;
			return true;
		} else {
			return false;
		}
	};
	var normalizeNbspAtEnd = function (root, node) {
		var text = node.data;
		var lastPos = CaretPosition(node, text.length - 1);
		if (isNbspAt(text, text.length - 1) && !needsToBeNbsp(root, lastPos)) {
			node.data = text.slice(0, -1) + ' ';
			return true;
		} else {
			return false;
		}
	};
	var normalizeNbsps = function (root, pos) {
		return Optional.some(pos).filter(hasNbsp).bind(function (pos) {
			var container = pos.container();
			var normalized = normalizeNbspAtStart(root, container) || normalizeNbspInMiddleOfTextNode(container) || normalizeNbspAtEnd(root, container);
			return normalized ? Optional.some(pos) : Optional.none();
		});
	};
	var normalizeNbspsInEditor = function (editor) {
		var root = SugarElement.fromDom(editor.getBody());
		if (editor.selection.isCollapsed()) {
			normalizeNbsps(root, CaretPosition.fromRangeStart(editor.selection.getRng())).each(function (pos) {
				editor.selection.setRng(pos.toRange());
			});
		}
	};

	var normalizeContent = function (content, isStartOfContent, isEndOfContent) {
		var result = foldl(content, function (acc, c) {
			if (isWhiteSpace$1(c) || isNbsp(c)) {
				if (acc.previousCharIsSpace || acc.str === '' && isStartOfContent || acc.str.length === content.length - 1 && isEndOfContent) {
					return {
						previousCharIsSpace: false,
						str: acc.str + nbsp
					};
				} else {
					return {
						previousCharIsSpace: true,
						str: acc.str + ' '
					};
				}
			} else {
				return {
					previousCharIsSpace: false,
					str: acc.str + c
				};
			}
		}, {
			previousCharIsSpace: false,
			str: ''
		});
		return result.str;
	};
	var normalize$1 = function (node, offset, count) {
		if (count === 0) {
			return;
		}
		var elm = SugarElement.fromDom(node);
		var root = ancestor(elm, isBlock).getOr(elm);
		var whitespace = node.data.slice(offset, offset + count);
		var isEndOfContent = offset + count >= node.data.length && needsToBeNbspRight(root, CaretPosition$1(node, node.data.length));
		var isStartOfContent = offset === 0 && needsToBeNbspLeft(root, CaretPosition$1(node, 0));
		node.replaceData(offset, count, normalizeContent(whitespace, isStartOfContent, isEndOfContent));
	};
	var normalizeWhitespaceAfter = function (node, offset) {
		var content = node.data.slice(offset);
		var whitespaceCount = content.length - lTrim(content).length;
		return normalize$1(node, offset, whitespaceCount);
	};
	var normalizeWhitespaceBefore = function (node, offset) {
		var content = node.data.slice(0, offset);
		var whitespaceCount = content.length - rTrim(content).length;
		return normalize$1(node, offset - whitespaceCount, whitespaceCount);
	};
	var mergeTextNodes = function (prevNode, nextNode, normalizeWhitespace, mergeToPrev) {
		if (mergeToPrev === void 0) {
			mergeToPrev = true;
		}
		var whitespaceOffset = rTrim(prevNode.data).length;
		var newNode = mergeToPrev ? prevNode : nextNode;
		var removeNode = mergeToPrev ? nextNode : prevNode;
		if (mergeToPrev) {
			newNode.appendData(removeNode.data);
		} else {
			newNode.insertData(0, removeNode.data);
		}
		remove(SugarElement.fromDom(removeNode));
		if (normalizeWhitespace) {
			normalizeWhitespaceAfter(newNode, whitespaceOffset);
		}
		return newNode;
	};

	var needsReposition = function (pos, elm) {
		var container = pos.container();
		var offset = pos.offset();
		return CaretPosition$1.isTextPosition(pos) === false && container === elm.parentNode && offset > CaretPosition$1.before(elm).offset();
	};
	var reposition = function (elm, pos) {
		return needsReposition(pos, elm) ? CaretPosition$1(pos.container(), pos.offset() - 1) : pos;
	};
	var beforeOrStartOf = function (node) {
		return isText$1(node) ? CaretPosition$1(node, 0) : CaretPosition$1.before(node);
	};
	var afterOrEndOf = function (node) {
		return isText$1(node) ? CaretPosition$1(node, node.data.length) : CaretPosition$1.after(node);
	};
	var getPreviousSiblingCaretPosition = function (elm) {
		if (isCaretCandidate(elm.previousSibling)) {
			return Optional.some(afterOrEndOf(elm.previousSibling));
		} else {
			return elm.previousSibling ? lastPositionIn(elm.previousSibling) : Optional.none();
		}
	};
	var getNextSiblingCaretPosition = function (elm) {
		if (isCaretCandidate(elm.nextSibling)) {
			return Optional.some(beforeOrStartOf(elm.nextSibling));
		} else {
			return elm.nextSibling ? firstPositionIn(elm.nextSibling) : Optional.none();
		}
	};
	var findCaretPositionBackwardsFromElm = function (rootElement, elm) {
		var startPosition = CaretPosition$1.before(elm.previousSibling ? elm.previousSibling : elm.parentNode);
		return prevPosition(rootElement, startPosition).fold(function () {
			return nextPosition(rootElement, CaretPosition$1.after(elm));
		}, Optional.some);
	};
	var findCaretPositionForwardsFromElm = function (rootElement, elm) {
		return nextPosition(rootElement, CaretPosition$1.after(elm)).fold(function () {
			return prevPosition(rootElement, CaretPosition$1.before(elm));
		}, Optional.some);
	};
	var findCaretPositionBackwards = function (rootElement, elm) {
		return getPreviousSiblingCaretPosition(elm).orThunk(function () {
			return getNextSiblingCaretPosition(elm);
		}).orThunk(function () {
			return findCaretPositionBackwardsFromElm(rootElement, elm);
		});
	};
	var findCaretPositionForward = function (rootElement, elm) {
		return getNextSiblingCaretPosition(elm).orThunk(function () {
			return getPreviousSiblingCaretPosition(elm);
		}).orThunk(function () {
			return findCaretPositionForwardsFromElm(rootElement, elm);
		});
	};
	var findCaretPosition$1 = function (forward, rootElement, elm) {
		return forward ? findCaretPositionForward(rootElement, elm) : findCaretPositionBackwards(rootElement, elm);
	};
	var findCaretPosOutsideElmAfterDelete = function (forward, rootElement, elm) {
		return findCaretPosition$1(forward, rootElement, elm).map(curry(reposition, elm));
	};
	var setSelection = function (editor, forward, pos) {
		pos.fold(function () {
			editor.focus();
		}, function (pos) {
			editor.selection.setRng(pos.toRange(), forward);
		});
	};
	var eqRawNode = function (rawNode) {
		return function (elm) {
			return elm.dom === rawNode;
		};
	};
	var isBlock$2 = function (editor, elm) {
		return elm && has(editor.schema.getBlockElements(), name(elm));
	};
	var paddEmptyBlock = function (elm) {
		if (isEmpty(elm)) {
			var br = SugarElement.fromHtml('<br data-mce-bogus="1">');
			empty(elm);
			append(elm, br);
			return Optional.some(CaretPosition$1.before(br.dom));
		} else {
			return Optional.none();
		}
	};
	var deleteNormalized = function (elm, afterDeletePosOpt, normalizeWhitespace) {
		var prevTextOpt = prevSibling(elm).filter(isText);
		var nextTextOpt = nextSibling(elm).filter(isText);
		remove(elm);
		return lift3(prevTextOpt, nextTextOpt, afterDeletePosOpt, function (prev, next, pos) {
			var prevNode = prev.dom, nextNode = next.dom;
			var offset = prevNode.data.length;
			mergeTextNodes(prevNode, nextNode, normalizeWhitespace);
			return pos.container() === nextNode ? CaretPosition$1(prevNode, offset) : pos;
		}).orThunk(function () {
			if (normalizeWhitespace) {
				prevTextOpt.each(function (elm) {
					return normalizeWhitespaceBefore(elm.dom, elm.dom.length);
				});
				nextTextOpt.each(function (elm) {
					return normalizeWhitespaceAfter(elm.dom, 0);
				});
			}
			return afterDeletePosOpt;
		});
	};
	var isInlineElement = function (editor, element) {
		return has(editor.schema.getTextInlineElements(), name(element));
	};
	var deleteElement = function (editor, forward, elm, moveCaret) {
		if (moveCaret === void 0) {
			moveCaret = true;
		}
		var afterDeletePos = findCaretPosOutsideElmAfterDelete(forward, editor.getBody(), elm.dom);
		var parentBlock = ancestor(elm, curry(isBlock$2, editor), eqRawNode(editor.getBody()));
		var normalizedAfterDeletePos = deleteNormalized(elm, afterDeletePos, isInlineElement(editor, elm));
		if (editor.dom.isEmpty(editor.getBody())) {
			editor.setContent('');
			editor.selection.setCursorLocation();
		} else {
			parentBlock.bind(paddEmptyBlock).fold(function () {
				if (moveCaret) {
					setSelection(editor, forward, normalizedAfterDeletePos);
				}
			}, function (paddPos) {
				if (moveCaret) {
					setSelection(editor, forward, Optional.some(paddPos));
				}
			});
		}
	};

	var tableCellRng = function (start, end) {
		return {
			start: start,
			end: end
		};
	};
	var tableSelection = function (rng, table, cells) {
		return {
			rng: rng,
			table: table,
			cells: cells
		};
	};
	var deleteAction = Adt.generate([
		{ removeTable: ['element'] },
		{ emptyCells: ['cells'] },
		{
			deleteCellSelection: [
				'rng',
				'cell'
			]
		}
	]);
	var isRootFromElement = function (root) {
		return function (cur) {
			return eq$2(root, cur);
		};
	};
	var getClosestCell = function (container, isRoot) {
		return closest$1(SugarElement.fromDom(container), 'td,th', isRoot);
	};
	var getClosestTable = function (cell, isRoot) {
		return ancestor$1(cell, 'table', isRoot);
	};
	var isExpandedCellRng = function (cellRng) {
		return !eq$2(cellRng.start, cellRng.end);
	};
	var getTableFromCellRng = function (cellRng, isRoot) {
		return getClosestTable(cellRng.start, isRoot).bind(function (startParentTable) {
			return getClosestTable(cellRng.end, isRoot).bind(function (endParentTable) {
				return someIf(eq$2(startParentTable, endParentTable), startParentTable);
			});
		});
	};
	var isSingleCellTable = function (cellRng, isRoot) {
		return !isExpandedCellRng(cellRng) && getTableFromCellRng(cellRng, isRoot).exists(function (table) {
			var rows = table.dom.rows;
			return rows.length === 1 && rows[0].cells.length === 1;
		});
	};
	var getTableCells = function (table) {
		return descendants$1(table, 'td,th');
	};
	var getCellRng = function (rng, isRoot) {
		var startCell = getClosestCell(rng.startContainer, isRoot);
		var endCell = getClosestCell(rng.endContainer, isRoot);
		return lift2(startCell, endCell, tableCellRng);
	};
	var getCellRangeFromStartTable = function (cellRng, isRoot) {
		return getClosestTable(cellRng.start, isRoot).bind(function (table) {
			return last(getTableCells(table)).map(function (endCell) {
				return tableCellRng(cellRng.start, endCell);
			});
		});
	};
	var partialSelection = function (isRoot, rng) {
		var startCell = getClosestCell(rng.startContainer, isRoot);
		var endCell = getClosestCell(rng.endContainer, isRoot);
		return rng.collapsed ? Optional.none() : lift2(startCell, endCell, tableCellRng).fold(function () {
			return startCell.fold(function () {
				return endCell.bind(function (endCell) {
					return getClosestTable(endCell, isRoot).bind(function (table) {
						return head(getTableCells(table)).map(function (startCell) {
							return tableCellRng(startCell, endCell);
						});
					});
				});
			}, function (startCell) {
				return getClosestTable(startCell, isRoot).bind(function (table) {
					return last(getTableCells(table)).map(function (endCell) {
						return tableCellRng(startCell, endCell);
					});
				});
			});
		}, function (cellRng) {
			return isWithinSameTable(isRoot, cellRng) ? Optional.none() : getCellRangeFromStartTable(cellRng, isRoot);
		});
	};
	var isWithinSameTable = function (isRoot, cellRng) {
		return getTableFromCellRng(cellRng, isRoot).isSome();
	};
	var getTableSelectionFromCellRng = function (cellRng, isRoot) {
		return getTableFromCellRng(cellRng, isRoot).map(function (table) {
			return tableSelection(cellRng, table, getTableCells(table));
		});
	};
	var getTableSelection = function (optCellRng, rng, isRoot) {
		return optCellRng.filter(function (cellRng) {
			return isExpandedCellRng(cellRng) && isWithinSameTable(isRoot, cellRng);
		}).orThunk(function () {
			return partialSelection(isRoot, rng);
		}).bind(function (cRng) {
			return getTableSelectionFromCellRng(cRng, isRoot);
		});
	};
	var getCellIndex = function (cells, cell) {
		return findIndex(cells, function (x) {
			return eq$2(x, cell);
		});
	};
	var getSelectedCells = function (tableSelection) {
		return lift2(getCellIndex(tableSelection.cells, tableSelection.rng.start), getCellIndex(tableSelection.cells, tableSelection.rng.end), function (startIndex, endIndex) {
			return tableSelection.cells.slice(startIndex, endIndex + 1);
		});
	};
	var isSingleCellTableContentSelected = function (optCellRng, rng, isRoot) {
		return optCellRng.filter(function (cellRng) {
			return isSingleCellTable(cellRng, isRoot) && hasAllContentsSelected(cellRng.start, rng);
		}).map(function (cellRng) {
			return cellRng.start;
		});
	};
	var getAction = function (tableSelection) {
		return getSelectedCells(tableSelection).map(function (selected) {
			var cells = tableSelection.cells;
			return selected.length === cells.length ? deleteAction.removeTable(tableSelection.table) : deleteAction.emptyCells(selected);
		});
	};
	var getActionFromRange = function (root, rng) {
		var isRoot = isRootFromElement(root);
		var optCellRng = getCellRng(rng, isRoot);
		return isSingleCellTableContentSelected(optCellRng, rng, isRoot).map(function (cell) {
			return deleteAction.deleteCellSelection(rng, cell);
		}).orThunk(function () {
			return getTableSelection(optCellRng, rng, isRoot).bind(getAction);
		});
	};

	var freefallRtl = function (root) {
		var child = isComment(root) ? prevSibling(root) : lastChild(root);
		return child.bind(freefallRtl).orThunk(function () {
			return Optional.some(root);
		});
	};
	var emptyCells = function (editor, cells) {
		each(cells, fillWithPaddingBr);
		editor.selection.setCursorLocation(cells[0].dom, 0);
		return true;
	};
	var deleteCellContents = function (editor, rng, cell) {
		rng.deleteContents();
		var lastNode = freefallRtl(cell).getOr(cell);
		var lastBlock = SugarElement.fromDom(editor.dom.getParent(lastNode.dom, editor.dom.isBlock));
		if (isEmpty(lastBlock)) {
			fillWithPaddingBr(lastBlock);
			editor.selection.setCursorLocation(lastBlock.dom, 0);
		}
		if (!eq$2(cell, lastBlock)) {
			var additionalCleanupNodes = parent(lastBlock).is(cell) ? [] : siblings(lastBlock);
			each(additionalCleanupNodes.concat(children(cell)), function (node) {
				if (!eq$2(node, lastBlock) && !contains$2(node, lastBlock)) {
					remove(node);
				}
			});
		}
		return true;
	};
	var deleteTableElement = function (editor, table) {
		deleteElement(editor, false, table);
		return true;
	};
	var deleteCellRange = function (editor, rootElm, rng) {
		return getActionFromRange(rootElm, rng).map(function (action) {
			return action.fold(curry(deleteTableElement, editor), curry(emptyCells, editor), curry(deleteCellContents, editor));
		});
	};
	var deleteCaptionRange = function (editor, caption) {
		return emptyElement(editor, caption);
	};
	var deleteTableRange = function (editor, rootElm, rng, startElm) {
		return getParentCaption(rootElm, startElm).fold(function () {
			return deleteCellRange(editor, rootElm, rng);
		}, function (caption) {
			return deleteCaptionRange(editor, caption);
		}).getOr(false);
	};
	var deleteRange = function (editor, startElm) {
		var rootNode = SugarElement.fromDom(editor.getBody());
		var rng = editor.selection.getRng();
		var selectedCells = getCellsFromEditor(editor);
		return selectedCells.length !== 0 ? emptyCells(editor, selectedCells) : deleteTableRange(editor, rootNode, rng, startElm);
	};
	var getParentCell = function (rootElm, elm) {
		return find(parentsAndSelf(elm, rootElm), isTableCell$1);
	};
	var getParentCaption = function (rootElm, elm) {
		return find(parentsAndSelf(elm, rootElm), function (elm) {
			return name(elm) === 'caption';
		});
	};
	var deleteBetweenCells = function (editor, rootElm, forward, fromCell, from) {
		return navigate(forward, editor.getBody(), from).bind(function (to) {
			return getParentCell(rootElm, SugarElement.fromDom(to.getNode())).map(function (toCell) {
				return eq$2(toCell, fromCell) === false;
			});
		});
	};
	var emptyElement = function (editor, elm) {
		fillWithPaddingBr(elm);
		editor.selection.setCursorLocation(elm.dom, 0);
		return Optional.some(true);
	};
	var isDeleteOfLastCharPos = function (fromCaption, forward, from, to) {
		return firstPositionIn(fromCaption.dom).bind(function (first) {
			return lastPositionIn(fromCaption.dom).map(function (last) {
				return forward ? from.isEqual(first) && to.isEqual(last) : from.isEqual(last) && to.isEqual(first);
			});
		}).getOr(true);
	};
	var emptyCaretCaption = function (editor, elm) {
		return emptyElement(editor, elm);
	};
	var validateCaretCaption = function (rootElm, fromCaption, to) {
		return getParentCaption(rootElm, SugarElement.fromDom(to.getNode())).map(function (toCaption) {
			return eq$2(toCaption, fromCaption) === false;
		});
	};
	var deleteCaretInsideCaption = function (editor, rootElm, forward, fromCaption, from) {
		return navigate(forward, editor.getBody(), from).bind(function (to) {
			return isDeleteOfLastCharPos(fromCaption, forward, from, to) ? emptyCaretCaption(editor, fromCaption) : validateCaretCaption(rootElm, fromCaption, to);
		}).or(Optional.some(true));
	};
	var deleteCaretCells = function (editor, forward, rootElm, startElm) {
		var from = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		return getParentCell(rootElm, startElm).bind(function (fromCell) {
			return isEmpty(fromCell) ? emptyElement(editor, fromCell) : deleteBetweenCells(editor, rootElm, forward, fromCell, from);
		}).getOr(false);
	};
	var deleteCaretCaption = function (editor, forward, rootElm, fromCaption) {
		var from = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		return isEmpty(fromCaption) ? emptyElement(editor, fromCaption) : deleteCaretInsideCaption(editor, rootElm, forward, fromCaption, from);
	};
	var isNearTable = function (forward, pos) {
		return forward ? isBeforeTable(pos) : isAfterTable(pos);
	};
	var isBeforeOrAfterTable = function (editor, forward) {
		var fromPos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		return isNearTable(forward, fromPos) || fromPosition(forward, editor.getBody(), fromPos).exists(function (pos) {
			return isNearTable(forward, pos);
		});
	};
	var deleteCaret = function (editor, forward, startElm) {
		var rootElm = SugarElement.fromDom(editor.getBody());
		return getParentCaption(rootElm, startElm).fold(function () {
			return deleteCaretCells(editor, forward, rootElm, startElm) || isBeforeOrAfterTable(editor, forward);
		}, function (fromCaption) {
			return deleteCaretCaption(editor, forward, rootElm, fromCaption).getOr(false);
		});
	};
	var backspaceDelete = function (editor, forward) {
		var startElm = SugarElement.fromDom(editor.selection.getStart(true));
		var cells = getCellsFromEditor(editor);
		return editor.selection.isCollapsed() && cells.length === 0 ? deleteCaret(editor, forward, startElm) : deleteRange(editor, startElm);
	};

	var createRange$1 = function (sc, so, ec, eo) {
		var rng = document.createRange();
		rng.setStart(sc, so);
		rng.setEnd(ec, eo);
		return rng;
	};
	var normalizeBlockSelectionRange = function (rng) {
		var startPos = CaretPosition$1.fromRangeStart(rng);
		var endPos = CaretPosition$1.fromRangeEnd(rng);
		var rootNode = rng.commonAncestorContainer;
		return fromPosition(false, rootNode, endPos).map(function (newEndPos) {
			if (!isInSameBlock(startPos, endPos, rootNode) && isInSameBlock(startPos, newEndPos, rootNode)) {
				return createRange$1(startPos.container(), startPos.offset(), newEndPos.container(), newEndPos.offset());
			} else {
				return rng;
			}
		}).getOr(rng);
	};
	var normalize$2 = function (rng) {
		return rng.collapsed ? rng : normalizeBlockSelectionRange(rng);
	};

	var hasOnlyOneChild = function (node) {
		return node.firstChild && node.firstChild === node.lastChild;
	};
	var isPaddingNode = function (node) {
		return node.name === 'br' || node.value === nbsp;
	};
	var isPaddedEmptyBlock = function (schema, node) {
		var blockElements = schema.getBlockElements();
		return blockElements[node.name] && hasOnlyOneChild(node) && isPaddingNode(node.firstChild);
	};
	var isEmptyFragmentElement = function (schema, node) {
		var nonEmptyElements = schema.getNonEmptyElements();
		return node && (node.isEmpty(nonEmptyElements) || isPaddedEmptyBlock(schema, node));
	};
	var isListFragment = function (schema, fragment) {
		var firstChild = fragment.firstChild;
		var lastChild = fragment.lastChild;
		if (firstChild && firstChild.name === 'meta') {
			firstChild = firstChild.next;
		}
		if (lastChild && lastChild.attr('id') === 'mce_marker') {
			lastChild = lastChild.prev;
		}
		if (isEmptyFragmentElement(schema, lastChild)) {
			lastChild = lastChild.prev;
		}
		if (!firstChild || firstChild !== lastChild) {
			return false;
		}
		return firstChild.name === 'ul' || firstChild.name === 'ol';
	};
	var cleanupDomFragment = function (domFragment) {
		var firstChild = domFragment.firstChild;
		var lastChild = domFragment.lastChild;
		if (firstChild && firstChild.nodeName === 'META') {
			firstChild.parentNode.removeChild(firstChild);
		}
		if (lastChild && lastChild.id === 'mce_marker') {
			lastChild.parentNode.removeChild(lastChild);
		}
		return domFragment;
	};
	var toDomFragment = function (dom, serializer, fragment) {
		var html = serializer.serialize(fragment);
		var domFragment = dom.createFragment(html);
		return cleanupDomFragment(domFragment);
	};
	var listItems$1 = function (elm) {
		return Tools.grep(elm.childNodes, function (child) {
			return child.nodeName === 'LI';
		});
	};
	var isPadding = function (node) {
		return node.data === nbsp || isBr(node);
	};
	var isListItemPadded = function (node) {
		return node && node.firstChild && node.firstChild === node.lastChild && isPadding(node.firstChild);
	};
	var isEmptyOrPadded = function (elm) {
		return !elm.firstChild || isListItemPadded(elm);
	};
	var trimListItems = function (elms) {
		return elms.length > 0 && isEmptyOrPadded(elms[elms.length - 1]) ? elms.slice(0, -1) : elms;
	};
	var getParentLi = function (dom, node) {
		var parentBlock = dom.getParent(node, dom.isBlock);
		return parentBlock && parentBlock.nodeName === 'LI' ? parentBlock : null;
	};
	var isParentBlockLi = function (dom, node) {
		return !!getParentLi(dom, node);
	};
	var getSplit = function (parentNode, rng) {
		var beforeRng = rng.cloneRange();
		var afterRng = rng.cloneRange();
		beforeRng.setStartBefore(parentNode);
		afterRng.setEndAfter(parentNode);
		return [
			beforeRng.cloneContents(),
			afterRng.cloneContents()
		];
	};
	var findFirstIn = function (node, rootNode) {
		var caretPos = CaretPosition$1.before(node);
		var caretWalker = CaretWalker(rootNode);
		var newCaretPos = caretWalker.next(caretPos);
		return newCaretPos ? newCaretPos.toRange() : null;
	};
	var findLastOf = function (node, rootNode) {
		var caretPos = CaretPosition$1.after(node);
		var caretWalker = CaretWalker(rootNode);
		var newCaretPos = caretWalker.prev(caretPos);
		return newCaretPos ? newCaretPos.toRange() : null;
	};
	var insertMiddle = function (target, elms, rootNode, rng) {
		var parts = getSplit(target, rng);
		var parentElm = target.parentNode;
		parentElm.insertBefore(parts[0], target);
		Tools.each(elms, function (li) {
			parentElm.insertBefore(li, target);
		});
		parentElm.insertBefore(parts[1], target);
		parentElm.removeChild(target);
		return findLastOf(elms[elms.length - 1], rootNode);
	};
	var insertBefore = function (target, elms, rootNode) {
		var parentElm = target.parentNode;
		Tools.each(elms, function (elm) {
			parentElm.insertBefore(elm, target);
		});
		return findFirstIn(target, rootNode);
	};
	var insertAfter = function (target, elms, rootNode, dom) {
		dom.insertAfter(elms.reverse(), target);
		return findLastOf(elms[0], rootNode);
	};
	var insertAtCaret = function (serializer, dom, rng, fragment) {
		var domFragment = toDomFragment(dom, serializer, fragment);
		var liTarget = getParentLi(dom, rng.startContainer);
		var liElms = trimListItems(listItems$1(domFragment.firstChild));
		var BEGINNING = 1, END = 2;
		var rootNode = dom.getRoot();
		var isAt = function (location) {
			var caretPos = CaretPosition$1.fromRangeStart(rng);
			var caretWalker = CaretWalker(dom.getRoot());
			var newPos = location === BEGINNING ? caretWalker.prev(caretPos) : caretWalker.next(caretPos);
			return newPos ? getParentLi(dom, newPos.getNode()) !== liTarget : true;
		};
		if (isAt(BEGINNING)) {
			return insertBefore(liTarget, liElms, rootNode);
		} else if (isAt(END)) {
			return insertAfter(liTarget, liElms, rootNode, dom);
		}
		return insertMiddle(liTarget, liElms, rootNode, rng);
	};

	var trimOrPadLeftRight = function (dom, rng, html) {
		var root = SugarElement.fromDom(dom.getRoot());
		if (needsToBeNbspLeft(root, CaretPosition$1.fromRangeStart(rng))) {
			html = html.replace(/^ /, '&nbsp;');
		} else {
			html = html.replace(/^&nbsp;/, ' ');
		}
		if (needsToBeNbspRight(root, CaretPosition$1.fromRangeEnd(rng))) {
			html = html.replace(/(&nbsp;| )(<br( \/)>)?$/, '&nbsp;');
		} else {
			html = html.replace(/&nbsp;(<br( \/)?>)?$/, ' ');
		}
		return html;
	};

	var isTableCell$4 = isTableCell;
	var isTableCellContentSelected = function (dom, rng, cell) {
		if (cell !== null) {
			var endCell = dom.getParent(rng.endContainer, isTableCell$4);
			return cell === endCell && hasAllContentsSelected(SugarElement.fromDom(cell), rng);
		} else {
			return false;
		}
	};
	var validInsertion = function (editor, value, parentNode) {
		if (parentNode.getAttribute('data-mce-bogus') === 'all') {
			parentNode.parentNode.insertBefore(editor.dom.createFragment(value), parentNode);
		} else {
			var node = parentNode.firstChild;
			var node2 = parentNode.lastChild;
			if (!node || node === node2 && node.nodeName === 'BR') {
				editor.dom.setHTML(parentNode, value);
			} else {
				editor.selection.setContent(value);
			}
		}
	};
	var trimBrsFromTableCell = function (dom, elm) {
		Optional.from(dom.getParent(elm, 'td,th')).map(SugarElement.fromDom).each(trimBlockTrailingBr);
	};
	var reduceInlineTextElements = function (editor, merge) {
		var textInlineElements = editor.schema.getTextInlineElements();
		var dom = editor.dom;
		if (merge) {
			var root_1 = editor.getBody(), elementUtils_1 = new ElementUtils(dom);
			Tools.each(dom.select('*[data-mce-fragment]'), function (node) {
				for (var testNode = node.parentNode; testNode && testNode !== root_1; testNode = testNode.parentNode) {
					if (textInlineElements[node.nodeName.toLowerCase()] && elementUtils_1.compare(testNode, node)) {
						dom.remove(node, true);
					}
				}
			});
		}
	};
	var markFragmentElements = function (fragment) {
		var node = fragment;
		while (node = node.walk()) {
			if (node.type === 1) {
				node.attr('data-mce-fragment', '1');
			}
		}
	};
	var unmarkFragmentElements = function (elm) {
		Tools.each(elm.getElementsByTagName('*'), function (elm) {
			elm.removeAttribute('data-mce-fragment');
		});
	};
	var isPartOfFragment = function (node) {
		return !!node.getAttribute('data-mce-fragment');
	};
	var canHaveChildren = function (editor, node) {
		return node && !editor.schema.getShortEndedElements()[node.nodeName];
	};
	var moveSelectionToMarker = function (editor, marker) {
		var nextRng;
		var dom = editor.dom, selection = editor.selection;
		var node2;
		var getContentEditableFalseParent = function (node) {
			var root = editor.getBody();
			for (; node && node !== root; node = node.parentNode) {
				if (dom.getContentEditable(node) === 'false') {
					return node;
				}
			}
			return null;
		};
		if (!marker) {
			return;
		}
		selection.scrollIntoView(marker);
		var parentEditableFalseElm = getContentEditableFalseParent(marker);
		if (parentEditableFalseElm) {
			dom.remove(marker);
			selection.select(parentEditableFalseElm);
			return;
		}
		var rng = dom.createRng();
		var node = marker.previousSibling;
		if (node && node.nodeType === 3) {
			rng.setStart(node, node.nodeValue.length);
			if (!Env.ie) {
				node2 = marker.nextSibling;
				if (node2 && node2.nodeType === 3) {
					node.appendData(node2.data);
					node2.parentNode.removeChild(node2);
				}
			}
		} else {
			rng.setStartBefore(marker);
			rng.setEndBefore(marker);
		}
		var findNextCaretRng = function (rng) {
			var caretPos = CaretPosition$1.fromRangeStart(rng);
			var caretWalker = CaretWalker(editor.getBody());
			caretPos = caretWalker.next(caretPos);
			if (caretPos) {
				return caretPos.toRange();
			}
		};
		var parentBlock = dom.getParent(marker, dom.isBlock);
		dom.remove(marker);
		if (parentBlock && dom.isEmpty(parentBlock)) {
			editor.$(parentBlock).empty();
			rng.setStart(parentBlock, 0);
			rng.setEnd(parentBlock, 0);
			if (!isTableCell$4(parentBlock) && !isPartOfFragment(parentBlock) && (nextRng = findNextCaretRng(rng))) {
				rng = nextRng;
				dom.remove(parentBlock);
			} else {
				dom.add(parentBlock, dom.create('br', { 'data-mce-bogus': '1' }));
			}
		}
		selection.setRng(rng);
	};
	var deleteSelectedContent = function (editor) {
		var dom = editor.dom;
		var rng = normalize$2(editor.selection.getRng());
		editor.selection.setRng(rng);
		var startCell = dom.getParent(rng.startContainer, isTableCell$4);
		if (isTableCellContentSelected(dom, rng, startCell)) {
			deleteCellContents(editor, rng, SugarElement.fromDom(startCell));
		} else {
			editor.getDoc().execCommand('Delete', false, null);
		}
	};
	var insertHtmlAtCaret = function (editor, value, details) {
		var parentNode, rootNode, args;
		var marker, rng, node;
		var selection = editor.selection, dom = editor.dom;
		if (/^ | $/.test(value)) {
			value = trimOrPadLeftRight(dom, selection.getRng(), value);
		}
		var parser = editor.parser;
		var merge = details.merge;
		var serializer = HtmlSerializer({ validate: shouldValidate(editor) }, editor.schema);
		var bookmarkHtml = '<span id="mce_marker" data-mce-type="bookmark">&#xFEFF;</span>';
		args = {
			content: value,
			format: 'html',
			selection: true,
			paste: details.paste
		};
		args = editor.fire('BeforeSetContent', args);
		if (args.isDefaultPrevented()) {
			editor.fire('SetContent', {
				content: args.content,
				format: 'html',
				selection: true,
				paste: details.paste
			});
			return;
		}
		value = args.content;
		if (value.indexOf('{$caret}') === -1) {
			value += '{$caret}';
		}
		value = value.replace(/\{\$caret\}/, bookmarkHtml);
		rng = selection.getRng();
		var caretElement = rng.startContainer || (rng.parentElement ? rng.parentElement() : null);
		var body = editor.getBody();
		if (caretElement === body && selection.isCollapsed()) {
			if (dom.isBlock(body.firstChild) && canHaveChildren(editor, body.firstChild) && dom.isEmpty(body.firstChild)) {
				rng = dom.createRng();
				rng.setStart(body.firstChild, 0);
				rng.setEnd(body.firstChild, 0);
				selection.setRng(rng);
			}
		}
		if (!selection.isCollapsed()) {
			deleteSelectedContent(editor);
		}
		parentNode = selection.getNode();
		var parserArgs = {
			context: parentNode.nodeName.toLowerCase(),
			data: details.data,
			insert: true
		};
		var fragment = parser.parse(value, parserArgs);
		if (details.paste === true && isListFragment(editor.schema, fragment) && isParentBlockLi(dom, parentNode)) {
			rng = insertAtCaret(serializer, dom, selection.getRng(), fragment);
			selection.setRng(rng);
			editor.fire('SetContent', args);
			return;
		}
		markFragmentElements(fragment);
		node = fragment.lastChild;
		if (node.attr('id') === 'mce_marker') {
			marker = node;
			for (node = node.prev; node; node = node.walk(true)) {
				if (node.type === 3 || !dom.isBlock(node.name)) {
					if (editor.schema.isValidChild(node.parent.name, 'span')) {
						node.parent.insert(marker, node, node.name === 'br');
					}
					break;
				}
			}
		}
		editor._selectionOverrides.showBlockCaretContainer(parentNode);
		if (!parserArgs.invalid) {
			value = serializer.serialize(fragment);
			validInsertion(editor, value, parentNode);
		} else {
			editor.selection.setContent(bookmarkHtml);
			parentNode = selection.getNode();
			rootNode = editor.getBody();
			if (parentNode.nodeType === 9) {
				parentNode = node = rootNode;
			} else {
				node = parentNode;
			}
			while (node !== rootNode) {
				parentNode = node;
				node = node.parentNode;
			}
			value = parentNode === rootNode ? rootNode.innerHTML : dom.getOuterHTML(parentNode);
			value = serializer.serialize(parser.parse(value.replace(/<span (id="mce_marker"|id=mce_marker).+?<\/span>/i, function () {
				return serializer.serialize(fragment);
			})));
			if (parentNode === rootNode) {
				dom.setHTML(rootNode, value);
			} else {
				dom.setOuterHTML(parentNode, value);
			}
		}
		reduceInlineTextElements(editor, merge);
		moveSelectionToMarker(editor, dom.get('mce_marker'));
		unmarkFragmentElements(editor.getBody());
		trimBrsFromTableCell(dom, selection.getStart());
		editor.fire('SetContent', args);
		editor.addVisual();
	};

	var traverse = function (node, fn) {
		fn(node);
		if (node.firstChild) {
			traverse(node.firstChild, fn);
		}
		if (node.next) {
			traverse(node.next, fn);
		}
	};
	var findMatchingNodes = function (nodeFilters, attributeFilters, node) {
		var nodeMatches = {};
		var attrMatches = {};
		var matches = [];
		if (node.firstChild) {
			traverse(node.firstChild, function (node) {
				each(nodeFilters, function (filter) {
					if (filter.name === node.name) {
						if (nodeMatches[filter.name]) {
							nodeMatches[filter.name].nodes.push(node);
						} else {
							nodeMatches[filter.name] = {
								filter: filter,
								nodes: [node]
							};
						}
					}
				});
				each(attributeFilters, function (filter) {
					if (typeof node.attr(filter.name) === 'string') {
						if (attrMatches[filter.name]) {
							attrMatches[filter.name].nodes.push(node);
						} else {
							attrMatches[filter.name] = {
								filter: filter,
								nodes: [node]
							};
						}
					}
				});
			});
		}
		for (var name_1 in nodeMatches) {
			if (nodeMatches.hasOwnProperty(name_1)) {
				matches.push(nodeMatches[name_1]);
			}
		}
		for (var name_2 in attrMatches) {
			if (attrMatches.hasOwnProperty(name_2)) {
				matches.push(attrMatches[name_2]);
			}
		}
		return matches;
	};
	var filter$3 = function (nodeFilters, attributeFilters, node) {
		var matches = findMatchingNodes(nodeFilters, attributeFilters, node);
		each(matches, function (match) {
			each(match.filter.callbacks, function (callback) {
				callback(match.nodes, match.filter.name, {});
			});
		});
	};

	var defaultFormat = 'html';
	var isTreeNode = function (content) {
		return content instanceof AstNode;
	};
	var moveSelection = function (editor) {
		if (hasFocus$1(editor)) {
			firstPositionIn(editor.getBody()).each(function (pos) {
				var node = pos.getNode();
				var caretPos = isTable(node) ? firstPositionIn(node).getOr(pos) : pos;
				editor.selection.setRng(caretPos.toRange());
			});
		}
	};
	var setEditorHtml = function (editor, html) {
		editor.dom.setHTML(editor.getBody(), html);
		moveSelection(editor);
	};
	var setContentString = function (editor, body, content, args) {
		var forcedRootBlockName, padd;
		if (content.length === 0 || /^\s+$/.test(content)) {
			padd = '<br data-mce-bogus="1">';
			if (body.nodeName === 'TABLE') {
				content = '<tr><td>' + padd + '</td></tr>';
			} else if (/^(UL|OL)$/.test(body.nodeName)) {
				content = '<li>' + padd + '</li>';
			}
			forcedRootBlockName = getForcedRootBlock(editor);
			if (forcedRootBlockName && editor.schema.isValidChild(body.nodeName.toLowerCase(), forcedRootBlockName.toLowerCase())) {
				content = padd;
				content = editor.dom.createHTML(forcedRootBlockName, getForcedRootBlockAttrs(editor), content);
			} else if (!content) {
				content = '<br data-mce-bogus="1">';
			}
			setEditorHtml(editor, content);
			editor.fire('SetContent', args);
		} else {
			if (args.format !== 'raw') {
				content = HtmlSerializer({ validate: editor.validate }, editor.schema).serialize(editor.parser.parse(content, {
					isRootContent: true,
					insert: true
				}));
			}
			args.content = isWsPreserveElement(SugarElement.fromDom(body)) ? content : Tools.trim(content);
			setEditorHtml(editor, args.content);
			if (!args.no_events) {
				editor.fire('SetContent', args);
			}
		}
		return args.content;
	};
	var setContentTree = function (editor, body, content, args) {
		filter$3(editor.parser.getNodeFilters(), editor.parser.getAttributeFilters(), content);
		var html = HtmlSerializer({ validate: editor.validate }, editor.schema).serialize(content);
		args.content = isWsPreserveElement(SugarElement.fromDom(body)) ? html : Tools.trim(html);
		setEditorHtml(editor, args.content);
		if (!args.no_events) {
			editor.fire('SetContent', args);
		}
		return content;
	};
	var setContentInternal = function (editor, content, args) {
		args.format = args.format ? args.format : defaultFormat;
		args.set = true;
		args.content = isTreeNode(content) ? '' : content;
		if (!args.no_events) {
			editor.fire('BeforeSetContent', args);
		}
		if (!isTreeNode(content)) {
			content = args.content;
		}
		return Optional.from(editor.getBody()).fold(constant(content), function (body) {
			return isTreeNode(content) ? setContentTree(editor, body, content, args) : setContentString(editor, body, content, args);
		});
	};

	var addVisualInternal = function (editor, elm) {
		var dom = editor.dom;
		var scope = isNonNullable(elm) ? elm : editor.getBody();
		if (isUndefined(editor.hasVisual)) {
			editor.hasVisual = isVisualAidsEnabled(editor);
		}
		each(dom.select('table,a', scope), function (matchedElm) {
			switch (matchedElm.nodeName) {
				case 'TABLE':
					var cls = getVisualAidsTableClass(editor);
					var value = dom.getAttrib(matchedElm, 'border');
					if ((!value || value === '0') && editor.hasVisual) {
						dom.addClass(matchedElm, cls);
					} else {
						dom.removeClass(matchedElm, cls);
					}
					break;
				case 'A':
					if (!dom.getAttrib(matchedElm, 'href')) {
						var value_1 = dom.getAttrib(matchedElm, 'name') || matchedElm.id;
						var cls_1 = getVisualAidsAnchorClass(editor);
						if (value_1 && editor.hasVisual) {
							dom.addClass(matchedElm, cls_1);
						} else {
							dom.removeClass(matchedElm, cls_1);
						}
					}
					break;
			}
		});
		editor.fire('VisualAid', {
			element: elm,
			hasVisual: editor.hasVisual
		});
	};

	var sibling$2 = function (scope, predicate) {
		return sibling(scope, predicate).isSome();
	};

	var ZWSP$1 = ZWSP, CARET_ID$1 = '_mce_caret';
	var importNode = function (ownerDocument, node) {
		return ownerDocument.importNode(node, true);
	};
	var getEmptyCaretContainers = function (node) {
		var nodes = [];
		while (node) {
			if (node.nodeType === 3 && node.nodeValue !== ZWSP$1 || node.childNodes.length > 1) {
				return [];
			}
			if (node.nodeType === 1) {
				nodes.push(node);
			}
			node = node.firstChild;
		}
		return nodes;
	};
	var isCaretContainerEmpty = function (node) {
		return getEmptyCaretContainers(node).length > 0;
	};
	var findFirstTextNode = function (node) {
		if (node) {
			var walker = new DomTreeWalker(node, node);
			for (node = walker.current(); node; node = walker.next()) {
				if (isText$1(node)) {
					return node;
				}
			}
		}
		return null;
	};
	var createCaretContainer = function (fill) {
		var caretContainer = SugarElement.fromTag('span');
		setAll(caretContainer, {
			'id': CARET_ID$1,
			'data-mce-bogus': '1',
			'data-mce-type': 'format-caret'
		});
		if (fill) {
			append(caretContainer, SugarElement.fromText(ZWSP$1));
		}
		return caretContainer;
	};
	var trimZwspFromCaretContainer = function (caretContainerNode) {
		var textNode = findFirstTextNode(caretContainerNode);
		if (textNode && textNode.nodeValue.charAt(0) === ZWSP$1) {
			textNode.deleteData(0, 1);
		}
		return textNode;
	};
	var removeCaretContainerNode = function (editor, node, moveCaret) {
		if (moveCaret === void 0) {
			moveCaret = true;
		}
		var dom = editor.dom, selection = editor.selection;
		if (isCaretContainerEmpty(node)) {
			deleteElement(editor, false, SugarElement.fromDom(node), moveCaret);
		} else {
			var rng = selection.getRng();
			var block = dom.getParent(node, dom.isBlock);
			var startContainer = rng.startContainer;
			var startOffset = rng.startOffset;
			var endContainer = rng.endContainer;
			var endOffset = rng.endOffset;
			var textNode = trimZwspFromCaretContainer(node);
			dom.remove(node, true);
			if (startContainer === textNode && startOffset > 0) {
				rng.setStart(textNode, startOffset - 1);
			}
			if (endContainer === textNode && endOffset > 0) {
				rng.setEnd(textNode, endOffset - 1);
			}
			if (block && dom.isEmpty(block)) {
				fillWithPaddingBr(SugarElement.fromDom(block));
			}
			selection.setRng(rng);
		}
	};
	var removeCaretContainer = function (editor, node, moveCaret) {
		if (moveCaret === void 0) {
			moveCaret = true;
		}
		var dom = editor.dom, selection = editor.selection;
		if (!node) {
			node = getParentCaretContainer(editor.getBody(), selection.getStart());
			if (!node) {
				while (node = dom.get(CARET_ID$1)) {
					removeCaretContainerNode(editor, node, false);
				}
			}
		} else {
			removeCaretContainerNode(editor, node, moveCaret);
		}
	};
	var insertCaretContainerNode = function (editor, caretContainer, formatNode) {
		var dom = editor.dom, block = dom.getParent(formatNode, curry(isTextBlock$1, editor));
		if (block && dom.isEmpty(block)) {
			formatNode.parentNode.replaceChild(caretContainer, formatNode);
		} else {
			removeTrailingBr(SugarElement.fromDom(formatNode));
			if (dom.isEmpty(formatNode)) {
				formatNode.parentNode.replaceChild(caretContainer, formatNode);
			} else {
				dom.insertAfter(caretContainer, formatNode);
			}
		}
	};
	var appendNode = function (parentNode, node) {
		parentNode.appendChild(node);
		return node;
	};
	var insertFormatNodesIntoCaretContainer = function (formatNodes, caretContainer) {
		var innerMostFormatNode = foldr(formatNodes, function (parentNode, formatNode) {
			return appendNode(parentNode, formatNode.cloneNode(false));
		}, caretContainer);
		return appendNode(innerMostFormatNode, innerMostFormatNode.ownerDocument.createTextNode(ZWSP$1));
	};
	var cleanFormatNode = function (editor, caretContainer, formatNode, name, vars, similar) {
		var formatter = editor.formatter;
		var dom = editor.dom;
		var validFormats = filter(keys(formatter.get()), function (formatName) {
			return formatName !== name && !contains$1(formatName, 'removeformat');
		});
		var matchedFormats = matchAllOnNode(editor, formatNode, validFormats);
		var uniqueFormats = filter(matchedFormats, function (fmtName) {
			return !areSimilarFormats(editor, fmtName, name);
		});
		if (uniqueFormats.length > 0) {
			var clonedFormatNode = formatNode.cloneNode(false);
			dom.add(caretContainer, clonedFormatNode);
			formatter.remove(name, vars, clonedFormatNode, similar);
			dom.remove(clonedFormatNode);
			return Optional.some(clonedFormatNode);
		} else {
			return Optional.none();
		}
	};
	var applyCaretFormat = function (editor, name, vars) {
		var caretContainer, textNode;
		var selection = editor.selection;
		var selectionRng = selection.getRng();
		var offset = selectionRng.startOffset;
		var container = selectionRng.startContainer;
		var text = container.nodeValue;
		caretContainer = getParentCaretContainer(editor.getBody(), selection.getStart());
		if (caretContainer) {
			textNode = findFirstTextNode(caretContainer);
		}
		var wordcharRegex = /[^\s\u00a0\u00ad\u200b\ufeff]/;
		if (text && offset > 0 && offset < text.length && wordcharRegex.test(text.charAt(offset)) && wordcharRegex.test(text.charAt(offset - 1))) {
			var bookmark = selection.getBookmark();
			selectionRng.collapse(true);
			var rng = expandRng(editor, selectionRng, editor.formatter.get(name));
			rng = split$1(rng);
			editor.formatter.apply(name, vars, rng);
			selection.moveToBookmark(bookmark);
		} else {
			if (!caretContainer || textNode.nodeValue !== ZWSP$1) {
				caretContainer = importNode(editor.getDoc(), createCaretContainer(true).dom);
				textNode = caretContainer.firstChild;
				selectionRng.insertNode(caretContainer);
				offset = 1;
				editor.formatter.apply(name, vars, caretContainer);
			} else {
				editor.formatter.apply(name, vars, caretContainer);
			}
			selection.setCursorLocation(textNode, offset);
		}
	};
	var removeCaretFormat = function (editor, name, vars, similar) {
		var dom = editor.dom;
		var selection = editor.selection;
		var hasContentAfter, node, formatNode;
		var parents = [];
		var rng = selection.getRng();
		var container = rng.startContainer;
		var offset = rng.startOffset;
		node = container;
		if (container.nodeType === 3) {
			if (offset !== container.nodeValue.length) {
				hasContentAfter = true;
			}
			node = node.parentNode;
		}
		while (node) {
			if (matchNode(editor, node, name, vars, similar)) {
				formatNode = node;
				break;
			}
			if (node.nextSibling) {
				hasContentAfter = true;
			}
			parents.push(node);
			node = node.parentNode;
		}
		if (!formatNode) {
			return;
		}
		if (hasContentAfter) {
			var bookmark = selection.getBookmark();
			rng.collapse(true);
			var expandedRng = expandRng(editor, rng, editor.formatter.get(name), true);
			expandedRng = split$1(expandedRng);
			editor.formatter.remove(name, vars, expandedRng, similar);
			selection.moveToBookmark(bookmark);
		} else {
			var caretContainer = getParentCaretContainer(editor.getBody(), formatNode);
			var newCaretContainer = createCaretContainer(false).dom;
			insertCaretContainerNode(editor, newCaretContainer, caretContainer !== null ? caretContainer : formatNode);
			var cleanedFormatNode = cleanFormatNode(editor, newCaretContainer, formatNode, name, vars, similar);
			var caretTextNode = insertFormatNodesIntoCaretContainer(parents.concat(cleanedFormatNode.toArray()), newCaretContainer);
			removeCaretContainerNode(editor, caretContainer, false);
			selection.setCursorLocation(caretTextNode, 1);
			if (dom.isEmpty(formatNode)) {
				dom.remove(formatNode);
			}
		}
	};
	var disableCaretContainer = function (editor, keyCode) {
		var selection = editor.selection, body = editor.getBody();
		removeCaretContainer(editor, null, false);
		if ((keyCode === 8 || keyCode === 46) && selection.isCollapsed() && selection.getStart().innerHTML === ZWSP$1) {
			removeCaretContainer(editor, getParentCaretContainer(body, selection.getStart()));
		}
		if (keyCode === 37 || keyCode === 39) {
			removeCaretContainer(editor, getParentCaretContainer(body, selection.getStart()));
		}
	};
	var setup$3 = function (editor) {
		editor.on('mouseup keydown', function (e) {
			disableCaretContainer(editor, e.keyCode);
		});
	};
	var replaceWithCaretFormat = function (targetNode, formatNodes) {
		var caretContainer = createCaretContainer(false);
		var innerMost = insertFormatNodesIntoCaretContainer(formatNodes, caretContainer.dom);
		before(SugarElement.fromDom(targetNode), caretContainer);
		remove(SugarElement.fromDom(targetNode));
		return CaretPosition$1(innerMost, 0);
	};
	var isFormatElement = function (editor, element) {
		var inlineElements = editor.schema.getTextInlineElements();
		return inlineElements.hasOwnProperty(name(element)) && !isCaretNode(element.dom) && !isBogus(element.dom);
	};
	var isEmptyCaretFormatElement = function (element) {
		return isCaretNode(element.dom) && isCaretContainerEmpty(element.dom);
	};

	var postProcessHooks = {};
	var filter$4 = filter$2;
	var each$8 = each$2;
	var addPostProcessHook = function (name, hook) {
		var hooks = postProcessHooks[name];
		if (!hooks) {
			postProcessHooks[name] = [];
		}
		postProcessHooks[name].push(hook);
	};
	var postProcess = function (name, editor) {
		each$8(postProcessHooks[name], function (hook) {
			hook(editor);
		});
	};
	addPostProcessHook('pre', function (editor) {
		var rng = editor.selection.getRng();
		var blocks;
		var hasPreSibling = function (pre) {
			return isPre(pre.previousSibling) && indexOf$1(blocks, pre.previousSibling) !== -1;
		};
		var joinPre = function (pre1, pre2) {
			DomQuery(pre2).remove();
			DomQuery(pre1).append('<br><br>').append(pre2.childNodes);
		};
		var isPre = matchNodeNames(['pre']);
		if (!rng.collapsed) {
			blocks = editor.selection.getSelectedBlocks();
			each$8(filter$4(filter$4(blocks, isPre), hasPreSibling), function (pre) {
				joinPre(pre.previousSibling, pre);
			});
		}
	});

	var each$9 = Tools.each;
	var isElementNode = function (node) {
		return isElement$1(node) && !isBookmarkNode$1(node) && !isCaretNode(node) && !isBogus(node);
	};
	var findElementSibling = function (node, siblingName) {
		var sibling;
		for (sibling = node; sibling; sibling = sibling[siblingName]) {
			if (isText$1(sibling) && sibling.nodeValue.length !== 0) {
				return node;
			}
			if (isElement$1(sibling) && !isBookmarkNode$1(sibling)) {
				return sibling;
			}
		}
		return node;
	};
	var mergeSiblingsNodes = function (dom, prev, next) {
		var sibling, tmpSibling;
		var elementUtils = new ElementUtils(dom);
		if (prev && next) {
			prev = findElementSibling(prev, 'previousSibling');
			next = findElementSibling(next, 'nextSibling');
			if (elementUtils.compare(prev, next)) {
				for (sibling = prev.nextSibling; sibling && sibling !== next;) {
					tmpSibling = sibling;
					sibling = sibling.nextSibling;
					prev.appendChild(tmpSibling);
				}
				dom.remove(next);
				Tools.each(Tools.grep(next.childNodes), function (node) {
					prev.appendChild(node);
				});
				return prev;
			}
		}
		return next;
	};
	var mergeSiblings = function (dom, format, vars, node) {
		if (node && format.merge_siblings !== false) {
			var newNode = mergeSiblingsNodes(dom, getNonWhiteSpaceSibling(node), node);
			mergeSiblingsNodes(dom, newNode, getNonWhiteSpaceSibling(newNode, true));
		}
	};
	var clearChildStyles = function (dom, format, node) {
		if (format.clear_child_styles) {
			var selector = format.links ? '*:not(a)' : '*';
			each$9(dom.select(selector, node), function (node) {
				if (isElementNode(node)) {
					each$9(format.styles, function (value, name) {
						dom.setStyle(node, name, '');
					});
				}
			});
		}
	};
	var processChildElements = function (node, filter, process) {
		each$9(node.childNodes, function (node) {
			if (isElementNode(node)) {
				if (filter(node)) {
					process(node);
				}
				if (node.hasChildNodes()) {
					processChildElements(node, filter, process);
				}
			}
		});
	};
	var unwrapEmptySpan = function (dom, node) {
		if (node.nodeName === 'SPAN' && dom.getAttribs(node).length === 0) {
			dom.remove(node, true);
		}
	};
	var hasStyle = function (dom, name) {
		return function (node) {
			return !!(node && getStyle(dom, node, name));
		};
	};
	var applyStyle = function (dom, name, value) {
		return function (node) {
			dom.setStyle(node, name, value);
			if (node.getAttribute('style') === '') {
				node.removeAttribute('style');
			}
			unwrapEmptySpan(dom, node);
		};
	};

	var removeResult = Adt.generate([
		{ keep: [] },
		{ rename: ['name'] },
		{ removed: [] }
	]);
	var MCE_ATTR_RE = /^(src|href|style)$/;
	var each$a = Tools.each;
	var isEq$3 = isEq;
	var isTableCellOrRow = function (node) {
		return /^(TR|TH|TD)$/.test(node.nodeName);
	};
	var isChildOfInlineParent = function (dom, node, parent) {
		return dom.isChildOf(node, parent) && node !== parent && !dom.isBlock(parent);
	};
	var getContainer = function (ed, rng, start) {
		var container, offset;
		container = rng[start ? 'startContainer' : 'endContainer'];
		offset = rng[start ? 'startOffset' : 'endOffset'];
		if (isElement$1(container)) {
			var lastIdx = container.childNodes.length - 1;
			if (!start && offset) {
				offset--;
			}
			container = container.childNodes[offset > lastIdx ? lastIdx : offset];
		}
		if (isText$1(container) && start && offset >= container.nodeValue.length) {
			container = new DomTreeWalker(container, ed.getBody()).next() || container;
		}
		if (isText$1(container) && !start && offset === 0) {
			container = new DomTreeWalker(container, ed.getBody()).prev() || container;
		}
		return container;
	};
	var normalizeTableSelection = function (node, start) {
		var prop = start ? 'firstChild' : 'lastChild';
		if (isTableCellOrRow(node) && node[prop]) {
			var childNode = node[prop];
			if (node.nodeName === 'TR') {
				return childNode[prop] || childNode;
			} else {
				return childNode;
			}
		}
		return node;
	};
	var wrap$2 = function (dom, node, name, attrs) {
		var wrapper = dom.create(name, attrs);
		node.parentNode.insertBefore(wrapper, node);
		wrapper.appendChild(node);
		return wrapper;
	};
	var wrapWithSiblings = function (dom, node, next, name, attrs) {
		var start = SugarElement.fromDom(node);
		var wrapper = SugarElement.fromDom(dom.create(name, attrs));
		var siblings = next ? nextSiblings(start) : prevSiblings(start);
		append$1(wrapper, siblings);
		if (next) {
			before(start, wrapper);
			prepend(wrapper, start);
		} else {
			after(start, wrapper);
			append(wrapper, start);
		}
		return wrapper.dom;
	};
	var matchName$1 = function (dom, node, format) {
		if (isEq$3(node, format.inline)) {
			return true;
		}
		if (isEq$3(node, format.block)) {
			return true;
		}
		if (format.selector) {
			return isElement$1(node) && dom.is(node, format.selector);
		}
	};
	var isColorFormatAndAnchor = function (node, format) {
		return format.links && node.nodeName === 'A';
	};
	var find$3 = function (dom, node, next, inc) {
		node = getNonWhiteSpaceSibling(node, next, inc);
		return !node || (node.nodeName === 'BR' || dom.isBlock(node));
	};
	var removeNode$1 = function (ed, node, format) {
		var parentNode = node.parentNode;
		var rootBlockElm;
		var dom = ed.dom, forcedRootBlock = getForcedRootBlock(ed);
		if (format.block) {
			if (!forcedRootBlock) {
				if (dom.isBlock(node) && !dom.isBlock(parentNode)) {
					if (!find$3(dom, node, false) && !find$3(dom, node.firstChild, true, true)) {
						node.insertBefore(dom.create('br'), node.firstChild);
					}
					if (!find$3(dom, node, true) && !find$3(dom, node.lastChild, false, true)) {
						node.appendChild(dom.create('br'));
					}
				}
			} else {
				if (parentNode === dom.getRoot()) {
					if (!format.list_block || !isEq$3(node, format.list_block)) {
						each(from$1(node.childNodes), function (node) {
							if (isValid(ed, forcedRootBlock, node.nodeName.toLowerCase())) {
								if (!rootBlockElm) {
									rootBlockElm = wrap$2(dom, node, forcedRootBlock);
									dom.setAttribs(rootBlockElm, ed.settings.forced_root_block_attrs);
								} else {
									rootBlockElm.appendChild(node);
								}
							} else {
								rootBlockElm = 0;
							}
						});
					}
				}
			}
		}
		if (format.selector && format.inline && !isEq$3(format.inline, node)) {
			return;
		}
		dom.remove(node, true);
	};
	var removeFormatInternal = function (ed, format, vars, node, compareNode) {
		var stylesModified;
		var dom = ed.dom;
		if (!matchName$1(dom, node, format) && !isColorFormatAndAnchor(node, format)) {
			return removeResult.keep();
		}
		var elm = node;
		if (format.inline && format.remove === 'all' && isArray(format.preserve_attributes)) {
			var attrsToPreserve = filter(dom.getAttribs(elm), function (attr) {
				return contains(format.preserve_attributes, attr.name.toLowerCase());
			});
			dom.removeAllAttribs(elm);
			each(attrsToPreserve, function (attr) {
				return dom.setAttrib(elm, attr.name, attr.value);
			});
			if (attrsToPreserve.length > 0) {
				return removeResult.rename('span');
			}
		}
		if (format.remove !== 'all') {
			each$a(format.styles, function (value, name) {
				value = normalizeStyleValue(dom, replaceVars(value, vars), name + '');
				if (isNumber(name)) {
					name = value;
					compareNode = null;
				}
				if (format.remove_similar || (!compareNode || isEq$3(getStyle(dom, compareNode, name), value))) {
					dom.setStyle(elm, name, '');
				}
				stylesModified = true;
			});
			if (stylesModified && dom.getAttrib(elm, 'style') === '') {
				elm.removeAttribute('style');
				elm.removeAttribute('data-mce-style');
			}
			each$a(format.attributes, function (value, name) {
				var valueOut;
				value = replaceVars(value, vars);
				if (isNumber(name)) {
					name = value;
					compareNode = null;
				}
				if (format.remove_similar || (!compareNode || isEq$3(dom.getAttrib(compareNode, name), value))) {
					if (name === 'class') {
						value = dom.getAttrib(elm, name);
						if (value) {
							valueOut = '';
							each(value.split(/\s+/), function (cls) {
								if (/mce\-\w+/.test(cls)) {
									valueOut += (valueOut ? ' ' : '') + cls;
								}
							});
							if (valueOut) {
								dom.setAttrib(elm, name, valueOut);
								return;
							}
						}
					}
					if (name === 'class') {
						elm.removeAttribute('className');
					}
					if (MCE_ATTR_RE.test(name)) {
						elm.removeAttribute('data-mce-' + name);
					}
					elm.removeAttribute(name);
				}
			});
			each$a(format.classes, function (value) {
				value = replaceVars(value, vars);
				if (!compareNode || dom.hasClass(compareNode, value)) {
					dom.removeClass(elm, value);
				}
			});
			var attrs = dom.getAttribs(elm);
			for (var i = 0; i < attrs.length; i++) {
				var attrName = attrs[i].nodeName;
				if (attrName.indexOf('_') !== 0 && attrName.indexOf('data-') !== 0) {
					return removeResult.keep();
				}
			}
		}
		if (format.remove !== 'none') {
			removeNode$1(ed, elm, format);
			return removeResult.removed();
		}
		return removeResult.keep();
	};
	var removeFormat = function (ed, format, vars, node, compareNode) {
		return removeFormatInternal(ed, format, vars, node, compareNode).fold(never, function (newName) {
			ed.dom.rename(node, newName);
			return true;
		}, always);
	};
	var findFormatRoot = function (editor, container, name, vars, similar) {
		var formatRoot;
		each(getParents$1(editor.dom, container.parentNode).reverse(), function (parent) {
			if (!formatRoot && parent.id !== '_start' && parent.id !== '_end') {
				var format = matchNode(editor, parent, name, vars, similar);
				if (format && format.split !== false) {
					formatRoot = parent;
				}
			}
		});
		return formatRoot;
	};
	var removeFormatFromClone = function (editor, format, vars, clone) {
		return removeFormatInternal(editor, format, vars, clone, clone).fold(constant(clone), function (newName) {
			var fragment = editor.dom.createFragment();
			fragment.appendChild(clone);
			return editor.dom.rename(clone, newName);
		}, constant(null));
	};
	var wrapAndSplit = function (editor, formatList, formatRoot, container, target, split, format, vars) {
		var clone, lastClone, firstClone;
		var dom = editor.dom;
		if (formatRoot) {
			var formatRootParent = formatRoot.parentNode;
			for (var parent_1 = container.parentNode; parent_1 && parent_1 !== formatRootParent; parent_1 = parent_1.parentNode) {
				clone = dom.clone(parent_1, false);
				for (var i = 0; i < formatList.length; i++) {
					clone = removeFormatFromClone(editor, formatList[i], vars, clone);
					if (clone === null) {
						break;
					}
				}
				if (clone) {
					if (lastClone) {
						clone.appendChild(lastClone);
					}
					if (!firstClone) {
						firstClone = clone;
					}
					lastClone = clone;
				}
			}
			if (split && (!format.mixed || !dom.isBlock(formatRoot))) {
				container = dom.split(formatRoot, container);
			}
			if (lastClone) {
				target.parentNode.insertBefore(lastClone, target);
				firstClone.appendChild(target);
				if (format.inline) {
					mergeSiblings(dom, format, vars, lastClone);
				}
			}
		}
		return container;
	};
	var remove$6 = function (ed, name, vars, node, similar) {
		var formatList = ed.formatter.get(name);
		var format = formatList[0];
		var contentEditable = true;
		var dom = ed.dom;
		var selection = ed.selection;
		var splitToFormatRoot = function (container) {
			var formatRoot = findFormatRoot(ed, container, name, vars, similar);
			return wrapAndSplit(ed, formatList, formatRoot, container, container, true, format, vars);
		};
		var isRemoveBookmarkNode = function (node) {
			return isBookmarkNode$1(node) && isElement$1(node) && (node.id === '_start' || node.id === '_end');
		};
		var process = function (node) {
			var lastContentEditable, hasContentEditableState;
			if (isElement$1(node) && dom.getContentEditable(node)) {
				lastContentEditable = contentEditable;
				contentEditable = dom.getContentEditable(node) === 'true';
				hasContentEditableState = true;
			}
			var children = from$1(node.childNodes);
			if (contentEditable && !hasContentEditableState) {
				for (var i = 0; i < formatList.length; i++) {
					if (removeFormat(ed, formatList[i], vars, node, node)) {
						break;
					}
				}
			}
			if (format.deep) {
				if (children.length) {
					for (var i = 0; i < children.length; i++) {
						process(children[i]);
					}
					if (hasContentEditableState) {
						contentEditable = lastContentEditable;
					}
				}
			}
		};
		var unwrap = function (start) {
			var node = dom.get(start ? '_start' : '_end');
			var out = node[start ? 'firstChild' : 'lastChild'];
			if (isRemoveBookmarkNode(out)) {
				out = out[start ? 'firstChild' : 'lastChild'];
			}
			if (isText$1(out) && out.data.length === 0) {
				out = start ? node.previousSibling || node.nextSibling : node.nextSibling || node.previousSibling;
			}
			dom.remove(node, true);
			return out;
		};
		var removeRngStyle = function (rng) {
			var startContainer, endContainer;
			var expandedRng = expandRng(ed, rng, formatList, rng.collapsed);
			if (format.split) {
				expandedRng = split$1(expandedRng);
				startContainer = getContainer(ed, expandedRng, true);
				endContainer = getContainer(ed, expandedRng);
				if (startContainer !== endContainer) {
					startContainer = normalizeTableSelection(startContainer, true);
					endContainer = normalizeTableSelection(endContainer, false);
					if (isChildOfInlineParent(dom, startContainer, endContainer)) {
						var marker = Optional.from(startContainer.firstChild).getOr(startContainer);
						splitToFormatRoot(wrapWithSiblings(dom, marker, true, 'span', {
							'id': '_start',
							'data-mce-type': 'bookmark'
						}));
						unwrap(true);
						return;
					}
					if (isChildOfInlineParent(dom, endContainer, startContainer)) {
						var marker = Optional.from(endContainer.lastChild).getOr(endContainer);
						splitToFormatRoot(wrapWithSiblings(dom, marker, false, 'span', {
							'id': '_end',
							'data-mce-type': 'bookmark'
						}));
						unwrap(false);
						return;
					}
					startContainer = wrap$2(dom, startContainer, 'span', {
						'id': '_start',
						'data-mce-type': 'bookmark'
					});
					endContainer = wrap$2(dom, endContainer, 'span', {
						'id': '_end',
						'data-mce-type': 'bookmark'
					});
					var newRng = dom.createRng();
					newRng.setStartAfter(startContainer);
					newRng.setEndBefore(endContainer);
					walk$1(dom, newRng, function (nodes) {
						each(nodes, function (n) {
							if (!isBookmarkNode$1(n) && !isBookmarkNode$1(n.parentNode)) {
								splitToFormatRoot(n);
							}
						});
					});
					splitToFormatRoot(startContainer);
					splitToFormatRoot(endContainer);
					startContainer = unwrap(true);
					endContainer = unwrap();
				} else {
					startContainer = endContainer = splitToFormatRoot(startContainer);
				}
				expandedRng.startContainer = startContainer.parentNode ? startContainer.parentNode : startContainer;
				expandedRng.startOffset = dom.nodeIndex(startContainer);
				expandedRng.endContainer = endContainer.parentNode ? endContainer.parentNode : endContainer;
				expandedRng.endOffset = dom.nodeIndex(endContainer) + 1;
			}
			walk$1(dom, expandedRng, function (nodes) {
				each(nodes, function (node) {
					process(node);
					var textDecorations = [
						'underline',
						'line-through',
						'overline'
					];
					each(textDecorations, function (decoration) {
						if (isElement$1(node) && ed.dom.getStyle(node, 'text-decoration') === decoration && node.parentNode && getTextDecoration(dom, node.parentNode) === decoration) {
							removeFormat(ed, {
								deep: false,
								exact: true,
								inline: 'span',
								styles: { textDecoration: decoration }
							}, null, node);
						}
					});
				});
			});
		};
		if (node) {
			if (isNode(node)) {
				var rng = dom.createRng();
				rng.setStartBefore(node);
				rng.setEndAfter(node);
				removeRngStyle(rng);
			} else {
				removeRngStyle(node);
			}
			return;
		}
		if (dom.getContentEditable(selection.getNode()) === 'false') {
			node = selection.getNode();
			for (var i = 0; i < formatList.length; i++) {
				if (formatList[i].ceFalseOverride) {
					if (removeFormat(ed, formatList[i], vars, node, node)) {
						break;
					}
				}
			}
			return;
		}
		if (!selection.isCollapsed() || !format.inline || getCellsFromEditor(ed).length) {
			preserve(selection, true, function () {
				runOnRanges(ed, removeRngStyle);
			});
			if (format.inline && match(ed, name, vars, selection.getStart())) {
				moveStart(dom, selection, selection.getRng());
			}
			ed.nodeChanged();
		} else {
			removeCaretFormat(ed, name, vars, similar);
		}
	};

	var each$b = Tools.each;
	var mergeTextDecorationsAndColor = function (dom, format, vars, node) {
		var processTextDecorationsAndColor = function (n) {
			if (n.nodeType === 1 && n.parentNode && n.parentNode.nodeType === 1) {
				var textDecoration = getTextDecoration(dom, n.parentNode);
				if (dom.getStyle(n, 'color') && textDecoration) {
					dom.setStyle(n, 'text-decoration', textDecoration);
				} else if (dom.getStyle(n, 'text-decoration') === textDecoration) {
					dom.setStyle(n, 'text-decoration', null);
				}
			}
		};
		if (format.styles && (format.styles.color || format.styles.textDecoration)) {
			Tools.walk(node, processTextDecorationsAndColor, 'childNodes');
			processTextDecorationsAndColor(node);
		}
	};
	var mergeBackgroundColorAndFontSize = function (dom, format, vars, node) {
		if (format.styles && format.styles.backgroundColor) {
			processChildElements(node, hasStyle(dom, 'fontSize'), applyStyle(dom, 'backgroundColor', replaceVars(format.styles.backgroundColor, vars)));
		}
	};
	var mergeSubSup = function (dom, format, vars, node) {
		if (format.inline === 'sub' || format.inline === 'sup') {
			processChildElements(node, hasStyle(dom, 'fontSize'), applyStyle(dom, 'fontSize', ''));
			dom.remove(dom.select(format.inline === 'sup' ? 'sub' : 'sup', node), true);
		}
	};
	var mergeWithChildren = function (editor, formatList, vars, node) {
		each$b(formatList, function (format) {
			each$b(editor.dom.select(format.inline, node), function (child) {
				if (!isElementNode(child)) {
					return;
				}
				removeFormat(editor, format, vars, child, format.exact ? child : null);
			});
			clearChildStyles(editor.dom, format, node);
		});
	};
	var mergeWithParents = function (editor, format, name, vars, node) {
		if (matchNode(editor, node.parentNode, name, vars)) {
			if (removeFormat(editor, format, vars, node)) {
				return;
			}
		}
		if (format.merge_with_parents) {
			editor.dom.getParent(node.parentNode, function (parent) {
				if (matchNode(editor, parent, name, vars)) {
					removeFormat(editor, format, vars, node);
					return true;
				}
			});
		}
	};

	var each$c = Tools.each;
	var hasFormatProperty = function (format, prop) {
		return hasNonNullableKey(format, prop);
	};
	var isElementNode$1 = function (node) {
		return node && node.nodeType === 1 && !isBookmarkNode$1(node) && !isCaretNode(node) && !isBogus(node);
	};
	var canFormatBR = function (editor, format, node, parentName) {
		if (canFormatEmptyLines(editor) && isInlineFormat(format)) {
			var validBRParentElements = __assign(__assign({}, editor.schema.getTextBlockElements()), {
				td: {},
				th: {},
				li: {},
				dt: {},
				dd: {},
				figcaption: {},
				caption: {},
				details: {},
				summary: {}
			});
			var hasCaretNodeSibling = sibling$2(SugarElement.fromDom(node), function (sibling) {
				return isCaretNode(sibling.dom);
			});
			return hasNonNullableKey(validBRParentElements, parentName) && isEmpty(SugarElement.fromDom(node.parentNode), false) && !hasCaretNodeSibling;
		} else {
			return false;
		}
	};
	var applyFormat = function (ed, name, vars, node) {
		var formatList = ed.formatter.get(name);
		var format = formatList[0];
		var isCollapsed = !node && ed.selection.isCollapsed();
		var dom = ed.dom;
		var selection = ed.selection;
		var setElementFormat = function (elm, fmt) {
			fmt = fmt || format;
			if (elm) {
				if (fmt.onformat) {
					fmt.onformat(elm, fmt, vars, node);
				}
				each$c(fmt.styles, function (value, name) {
					dom.setStyle(elm, name, replaceVars(value, vars));
				});
				if (fmt.styles) {
					var styleVal = dom.getAttrib(elm, 'style');
					if (styleVal) {
						dom.setAttrib(elm, 'data-mce-style', styleVal);
					}
				}
				each$c(fmt.attributes, function (value, name) {
					dom.setAttrib(elm, name, replaceVars(value, vars));
				});
				each$c(fmt.classes, function (value) {
					value = replaceVars(value, vars);
					if (!dom.hasClass(elm, value)) {
						dom.addClass(elm, value);
					}
				});
			}
		};
		var applyNodeStyle = function (formatList, node) {
			var found = false;
			if (!isSelectorFormat(format)) {
				return false;
			}
			each$c(formatList, function (format) {
				if ('collapsed' in format && format.collapsed !== isCollapsed) {
					return;
				}
				if (dom.is(node, format.selector) && !isCaretNode(node)) {
					setElementFormat(node, format);
					found = true;
					return false;
				}
			});
			return found;
		};
		var applyRngStyle = function (dom, rng, bookmark, nodeSpecific) {
			var newWrappers = [];
			var contentEditable = true;
			var wrapName = format.inline || format.block;
			var wrapElm = dom.create(wrapName);
			setElementFormat(wrapElm);
			walk$1(dom, rng, function (nodes) {
				var currentWrapElm;
				var process = function (node) {
					var hasContentEditableState = false;
					var lastContentEditable = contentEditable;
					var nodeName = node.nodeName.toLowerCase();
					var parentName = node.parentNode.nodeName.toLowerCase();
					if (isElement$1(node) && dom.getContentEditable(node)) {
						lastContentEditable = contentEditable;
						contentEditable = dom.getContentEditable(node) === 'true';
						hasContentEditableState = true;
					}
					if (isBr(node) && !canFormatBR(ed, format, node, parentName)) {
						currentWrapElm = null;
						if (isBlockFormat(format)) {
							dom.remove(node);
						}
						return;
					}
					if (format.wrapper && matchNode(ed, node, name, vars)) {
						currentWrapElm = null;
						return;
					}
					if (contentEditable && !hasContentEditableState && isBlockFormat(format) && !format.wrapper && isTextBlock$1(ed, nodeName) && isValid(ed, parentName, wrapName)) {
						var elm = dom.rename(node, wrapName);
						setElementFormat(elm);
						newWrappers.push(elm);
						currentWrapElm = null;
						return;
					}
					if (isSelectorFormat(format)) {
						var found = applyNodeStyle(formatList, node);
						if (!hasFormatProperty(format, 'inline') || found) {
							currentWrapElm = null;
							return;
						}
					}
					if (contentEditable && !hasContentEditableState && isValid(ed, wrapName, nodeName) && isValid(ed, parentName, wrapName) && !(!nodeSpecific && node.nodeType === 3 && node.nodeValue.length === 1 && node.nodeValue.charCodeAt(0) === 65279) && !isCaretNode(node) && (!hasFormatProperty(format, 'inline') || !dom.isBlock(node))) {
						if (!currentWrapElm) {
							currentWrapElm = dom.clone(wrapElm, false);
							node.parentNode.insertBefore(currentWrapElm, node);
							newWrappers.push(currentWrapElm);
						}
						currentWrapElm.appendChild(node);
					} else {
						currentWrapElm = null;
						each$c(Tools.grep(node.childNodes), process);
						if (hasContentEditableState) {
							contentEditable = lastContentEditable;
						}
						currentWrapElm = null;
					}
				};
				each$c(nodes, process);
			});
			if (format.links === true) {
				each$c(newWrappers, function (node) {
					var process = function (node) {
						if (node.nodeName === 'A') {
							setElementFormat(node, format);
						}
						each$c(Tools.grep(node.childNodes), process);
					};
					process(node);
				});
			}
			each$c(newWrappers, function (node) {
				var getChildCount = function (node) {
					var count = 0;
					each$c(node.childNodes, function (node) {
						if (!isEmptyTextNode(node) && !isBookmarkNode$1(node)) {
							count++;
						}
					});
					return count;
				};
				var getChildElementNode = function (root) {
					var child = false;
					each$c(root.childNodes, function (node) {
						if (isElementNode$1(node)) {
							child = node;
							return false;
						}
					});
					return child;
				};
				var mergeStyles = function (node) {
					var clone;
					var child = getChildElementNode(node);
					if (child && !isBookmarkNode$1(child) && matchName(dom, child, format)) {
						clone = dom.clone(child, false);
						setElementFormat(clone);
						dom.replace(clone, node, true);
						dom.remove(child, true);
					}
					return clone || node;
				};
				var childCount = getChildCount(node);
				if ((newWrappers.length > 1 || !dom.isBlock(node)) && childCount === 0) {
					dom.remove(node, true);
					return;
				}
				if (isInlineFormat(format) || format.wrapper) {
					if (!format.exact && childCount === 1) {
						node = mergeStyles(node);
					}
					mergeWithChildren(ed, formatList, vars, node);
					mergeWithParents(ed, format, name, vars, node);
					mergeBackgroundColorAndFontSize(dom, format, vars, node);
					mergeTextDecorationsAndColor(dom, format, vars, node);
					mergeSubSup(dom, format, vars, node);
					mergeSiblings(dom, format, vars, node);
				}
			});
		};
		if (dom.getContentEditable(selection.getNode()) === 'false') {
			node = selection.getNode();
			for (var i = 0, l = formatList.length; i < l; i++) {
				var formatItem = formatList[i];
				if (formatItem.ceFalseOverride && isSelectorFormat(formatItem) && dom.is(node, formatItem.selector)) {
					setElementFormat(node, formatItem);
					return;
				}
			}
			return;
		}
		if (format) {
			if (node) {
				if (isNode(node)) {
					if (!applyNodeStyle(formatList, node)) {
						var rng = dom.createRng();
						rng.setStartBefore(node);
						rng.setEndAfter(node);
						applyRngStyle(dom, expandRng(ed, rng, formatList), null, true);
					}
				} else {
					applyRngStyle(dom, node, null, true);
				}
			} else {
				if (!isCollapsed || !isInlineFormat(format) || getCellsFromEditor(ed).length) {
					var curSelNode = selection.getNode();
					var firstFormat = formatList[0];
					if (!ed.settings.forced_root_block && firstFormat.defaultBlock && !dom.getParent(curSelNode, dom.isBlock)) {
						applyFormat(ed, firstFormat.defaultBlock);
					}
					selection.setRng(normalize$2(selection.getRng()));
					preserve(selection, true, function (bookmark) {
						runOnRanges(ed, function (selectionRng, fake) {
							var expandedRng = fake ? selectionRng : expandRng(ed, selectionRng, formatList);
							applyRngStyle(dom, expandedRng);
						});
					});
					moveStart(dom, selection, selection.getRng());
					ed.nodeChanged();
				} else {
					applyCaretFormat(ed, name, vars);
				}
			}
			postProcess(name, ed);
		}
	};

	var setup$4 = function (registeredFormatListeners, editor) {
		var currentFormats = Cell({});
		registeredFormatListeners.set({});
		editor.on('NodeChange', function (e) {
			updateAndFireChangeCallbacks(editor, e.element, currentFormats, registeredFormatListeners.get());
		});
	};
	var updateAndFireChangeCallbacks = function (editor, elm, currentFormats, formatChangeData) {
		var formatsList = keys(currentFormats.get());
		var newFormats = {};
		var matchedFormats = {};
		var parents = filter(getParents$1(editor.dom, elm), function (node) {
			return node.nodeType === 1 && !node.getAttribute('data-mce-bogus');
		});
		each$1(formatChangeData, function (data, format) {
			Tools.each(parents, function (node) {
				if (editor.formatter.matchNode(node, format, {}, data.similar)) {
					if (formatsList.indexOf(format) === -1) {
						each(data.callbacks, function (callback) {
							callback(true, {
								node: node,
								format: format,
								parents: parents
							});
						});
						newFormats[format] = data.callbacks;
					}
					matchedFormats[format] = data.callbacks;
					return false;
				}
				if (matchesUnInheritedFormatSelector(editor, node, format)) {
					return false;
				}
			});
		});
		var remainingFormats = filterRemainingFormats(currentFormats.get(), matchedFormats, elm, parents);
		currentFormats.set(__assign(__assign({}, newFormats), remainingFormats));
	};
	var filterRemainingFormats = function (currentFormats, matchedFormats, elm, parents) {
		return bifilter(currentFormats, function (callbacks, format) {
			if (!has(matchedFormats, format)) {
				each(callbacks, function (callback) {
					callback(false, {
						node: elm,
						format: format,
						parents: parents
					});
				});
				return false;
			} else {
				return true;
			}
		}).t;
	};
	var addListeners = function (registeredFormatListeners, formats, callback, similar) {
		var formatChangeItems = registeredFormatListeners.get();
		each(formats.split(','), function (format) {
			if (!formatChangeItems[format]) {
				formatChangeItems[format] = {
					similar: similar,
					callbacks: []
				};
			}
			formatChangeItems[format].callbacks.push(callback);
		});
		registeredFormatListeners.set(formatChangeItems);
	};
	var removeListeners = function (registeredFormatListeners, formats, callback) {
		var formatChangeItems = registeredFormatListeners.get();
		each(formats.split(','), function (format) {
			formatChangeItems[format].callbacks = filter(formatChangeItems[format].callbacks, function (c) {
				return c !== callback;
			});
			if (formatChangeItems[format].callbacks.length === 0) {
				delete formatChangeItems[format];
			}
		});
		registeredFormatListeners.set(formatChangeItems);
	};
	var formatChangedInternal = function (editor, registeredFormatListeners, formats, callback, similar) {
		if (registeredFormatListeners.get() === null) {
			setup$4(registeredFormatListeners, editor);
		}
		addListeners(registeredFormatListeners, formats, callback, similar);
		return {
			unbind: function () {
				return removeListeners(registeredFormatListeners, formats, callback);
			}
		};
	};

	var toggle = function (editor, name, vars, node) {
		var fmt = editor.formatter.get(name);
		if (match(editor, name, vars, node) && (!('toggle' in fmt[0]) || fmt[0].toggle)) {
			remove$6(editor, name, vars, node);
		} else {
			applyFormat(editor, name, vars, node);
		}
	};

	var fromElements = function (elements, scope) {
		var doc = scope || document;
		var fragment = doc.createDocumentFragment();
		each(elements, function (element) {
			fragment.appendChild(element.dom);
		});
		return SugarElement.fromDom(fragment);
	};

	var tableModel = function (element, width, rows) {
		return {
			element: element,
			width: width,
			rows: rows
		};
	};
	var tableRow = function (element, cells) {
		return {
			element: element,
			cells: cells
		};
	};
	var cellPosition = function (x, y) {
		return {
			x: x,
			y: y
		};
	};
	var getSpan = function (td, key) {
		var value = parseInt(get$4(td, key), 10);
		return isNaN(value) ? 1 : value;
	};
	var fillout = function (table, x, y, tr, td) {
		var rowspan = getSpan(td, 'rowspan');
		var colspan = getSpan(td, 'colspan');
		var rows = table.rows;
		for (var y2 = y; y2 < y + rowspan; y2++) {
			if (!rows[y2]) {
				rows[y2] = tableRow(deep(tr), []);
			}
			for (var x2 = x; x2 < x + colspan; x2++) {
				var cells = rows[y2].cells;
				cells[x2] = y2 === y && x2 === x ? td : shallow(td);
			}
		}
	};
	var cellExists = function (table, x, y) {
		var rows = table.rows;
		var cells = rows[y] ? rows[y].cells : [];
		return !!cells[x];
	};
	var skipCellsX = function (table, x, y) {
		while (cellExists(table, x, y)) {
			x++;
		}
		return x;
	};
	var getWidth = function (rows) {
		return foldl(rows, function (acc, row) {
			return row.cells.length > acc ? row.cells.length : acc;
		}, 0);
	};
	var findElementPos = function (table, element) {
		var rows = table.rows;
		for (var y = 0; y < rows.length; y++) {
			var cells = rows[y].cells;
			for (var x = 0; x < cells.length; x++) {
				if (eq$2(cells[x], element)) {
					return Optional.some(cellPosition(x, y));
				}
			}
		}
		return Optional.none();
	};
	var extractRows = function (table, sx, sy, ex, ey) {
		var newRows = [];
		var rows = table.rows;
		for (var y = sy; y <= ey; y++) {
			var cells = rows[y].cells;
			var slice = sx < ex ? cells.slice(sx, ex + 1) : cells.slice(ex, sx + 1);
			newRows.push(tableRow(rows[y].element, slice));
		}
		return newRows;
	};
	var subTable = function (table, startPos, endPos) {
		var sx = startPos.x, sy = startPos.y;
		var ex = endPos.x, ey = endPos.y;
		var newRows = sy < ey ? extractRows(table, sx, sy, ex, ey) : extractRows(table, sx, ey, ex, sy);
		return tableModel(table.element, getWidth(newRows), newRows);
	};
	var createDomTable = function (table, rows) {
		var tableElement = shallow(table.element);
		var tableBody = SugarElement.fromTag('tbody');
		append$1(tableBody, rows);
		append(tableElement, tableBody);
		return tableElement;
	};
	var modelRowsToDomRows = function (table) {
		return map(table.rows, function (row) {
			var cells = map(row.cells, function (cell) {
				var td = deep(cell);
				remove$1(td, 'colspan');
				remove$1(td, 'rowspan');
				return td;
			});
			var tr = shallow(row.element);
			append$1(tr, cells);
			return tr;
		});
	};
	var fromDom$1 = function (tableElm) {
		var table = tableModel(shallow(tableElm), 0, []);
		each(descendants$1(tableElm, 'tr'), function (tr, y) {
			each(descendants$1(tr, 'td,th'), function (td, x) {
				fillout(table, skipCellsX(table, x, y), y, tr, td);
			});
		});
		return tableModel(table.element, getWidth(table.rows), table.rows);
	};
	var toDom = function (table) {
		return createDomTable(table, modelRowsToDomRows(table));
	};
	var subsection = function (table, startElement, endElement) {
		return findElementPos(table, startElement).bind(function (startPos) {
			return findElementPos(table, endElement).map(function (endPos) {
				return subTable(table, startPos, endPos);
			});
		});
	};

	var findParentListContainer = function (parents) {
		return find(parents, function (elm) {
			return name(elm) === 'ul' || name(elm) === 'ol';
		});
	};
	var getFullySelectedListWrappers = function (parents, rng) {
		return find(parents, function (elm) {
			return name(elm) === 'li' && hasAllContentsSelected(elm, rng);
		}).fold(constant([]), function (_li) {
			return findParentListContainer(parents).map(function (listCont) {
				var listElm = SugarElement.fromTag(name(listCont));
				var listStyles = filter$1(getAllRaw(listCont), function (_style, name) {
					return startsWith(name, 'list-style');
				});
				setAll$1(listElm, listStyles);
				return [
					SugarElement.fromTag('li'),
					listElm
				];
			}).getOr([]);
		});
	};
	var wrap$3 = function (innerElm, elms) {
		var wrapped = foldl(elms, function (acc, elm) {
			append(elm, acc);
			return elm;
		}, innerElm);
		return elms.length > 0 ? fromElements([wrapped]) : wrapped;
	};
	var directListWrappers = function (commonAnchorContainer) {
		if (isListItem(commonAnchorContainer)) {
			return parent(commonAnchorContainer).filter(isList).fold(constant([]), function (listElm) {
				return [
					commonAnchorContainer,
					listElm
				];
			});
		} else {
			return isList(commonAnchorContainer) ? [commonAnchorContainer] : [];
		}
	};
	var getWrapElements = function (rootNode, rng) {
		var commonAnchorContainer = SugarElement.fromDom(rng.commonAncestorContainer);
		var parents = parentsAndSelf(commonAnchorContainer, rootNode);
		var wrapElements = filter(parents, function (elm) {
			return isInline(elm) || isHeading(elm);
		});
		var listWrappers = getFullySelectedListWrappers(parents, rng);
		var allWrappers = wrapElements.concat(listWrappers.length ? listWrappers : directListWrappers(commonAnchorContainer));
		return map(allWrappers, shallow);
	};
	var emptyFragment = function () {
		return fromElements([]);
	};
	var getFragmentFromRange = function (rootNode, rng) {
		return wrap$3(SugarElement.fromDom(rng.cloneContents()), getWrapElements(rootNode, rng));
	};
	var getParentTable = function (rootElm, cell) {
		return ancestor$1(cell, 'table', curry(eq$2, rootElm));
	};
	var getTableFragment = function (rootNode, selectedTableCells) {
		return getParentTable(rootNode, selectedTableCells[0]).bind(function (tableElm) {
			var firstCell = selectedTableCells[0];
			var lastCell = selectedTableCells[selectedTableCells.length - 1];
			var fullTableModel = fromDom$1(tableElm);
			return subsection(fullTableModel, firstCell, lastCell).map(function (sectionedTableModel) {
				return fromElements([toDom(sectionedTableModel)]);
			});
		}).getOrThunk(emptyFragment);
	};
	var getSelectionFragment = function (rootNode, ranges) {
		return ranges.length > 0 && ranges[0].collapsed ? emptyFragment() : getFragmentFromRange(rootNode, ranges[0]);
	};
	var read$1 = function (rootNode, ranges) {
		var selectedCells = getCellsFromElementOrRanges(ranges, rootNode);
		return selectedCells.length > 0 ? getTableFragment(rootNode, selectedCells) : getSelectionFragment(rootNode, ranges);
	};

	var trimLeadingCollapsibleText = function (text) {
		return text.replace(/^[ \f\n\r\t\v]+/, '');
	};
	var isCollapsibleWhitespace = function (text, index) {
		return index >= 0 && index < text.length && isWhiteSpace$1(text.charAt(index));
	};
	var getInnerText = function (bin, shouldTrim) {
		var text = trim$2(bin.innerText);
		return shouldTrim ? trimLeadingCollapsibleText(text) : text;
	};
	var getContextNodeName = function (parentBlockOpt) {
		return parentBlockOpt.map(function (block) {
			return block.nodeName;
		}).getOr('div').toLowerCase();
	};
	var getTextContent = function (editor) {
		return Optional.from(editor.selection.getRng()).map(function (rng) {
			var parentBlockOpt = Optional.from(editor.dom.getParent(rng.commonAncestorContainer, editor.dom.isBlock));
			var body = editor.getBody();
			var contextNodeName = getContextNodeName(parentBlockOpt);
			var shouldTrimSpaces = Env.browser.isIE() && contextNodeName !== 'pre';
			var bin = editor.dom.add(body, contextNodeName, {
				'data-mce-bogus': 'all',
				'style': 'overflow: hidden; opacity: 0;'
			}, rng.cloneContents());
			var text = getInnerText(bin, shouldTrimSpaces);
			var nonRenderedText = trim$2(bin.textContent);
			editor.dom.remove(bin);
			if (isCollapsibleWhitespace(nonRenderedText, 0) || isCollapsibleWhitespace(nonRenderedText, nonRenderedText.length - 1)) {
				var parentBlock = parentBlockOpt.getOr(body);
				var parentBlockText = getInnerText(parentBlock, shouldTrimSpaces);
				var textIndex = parentBlockText.indexOf(text);
				if (textIndex === -1) {
					return text;
				} else {
					var hasProceedingSpace = isCollapsibleWhitespace(parentBlockText, textIndex - 1);
					var hasTrailingSpace = isCollapsibleWhitespace(parentBlockText, textIndex + text.length);
					return (hasProceedingSpace ? ' ' : '') + text + (hasTrailingSpace ? ' ' : '');
				}
			} else {
				return text;
			}
		}).getOr('');
	};
	var getSerializedContent = function (editor, args) {
		var rng = editor.selection.getRng(), tmpElm = editor.dom.create('body');
		var sel = editor.selection.getSel();
		var ranges = processRanges(editor, getRanges(sel));
		var fragment = args.contextual ? read$1(SugarElement.fromDom(editor.getBody()), ranges).dom : rng.cloneContents();
		if (fragment) {
			tmpElm.appendChild(fragment);
		}
		return editor.selection.serializer.serialize(tmpElm, args);
	};
	var getSelectedContentInternal = function (editor, format, args) {
		if (args === void 0) {
			args = {};
		}
		args.get = true;
		args.format = format;
		args.selection = true;
		args = editor.fire('BeforeGetContent', args);
		if (args.isDefaultPrevented()) {
			editor.fire('GetContent', args);
			return args.content;
		}
		if (args.format === 'text') {
			return getTextContent(editor);
		} else {
			args.getInner = true;
			var content = getSerializedContent(editor, args);
			if (args.format === 'tree') {
				return content;
			} else {
				args.content = editor.selection.isCollapsed() ? '' : content;
				editor.fire('GetContent', args);
				return args.content;
			}
		}
	};

	var KEEP = 0, INSERT = 1, DELETE = 2;
	var diff = function (left, right) {
		var size = left.length + right.length + 2;
		var vDown = new Array(size);
		var vUp = new Array(size);
		var snake = function (start, end, diag) {
			return {
				start: start,
				end: end,
				diag: diag
			};
		};
		var buildScript = function (start1, end1, start2, end2, script) {
			var middle = getMiddleSnake(start1, end1, start2, end2);
			if (middle === null || middle.start === end1 && middle.diag === end1 - end2 || middle.end === start1 && middle.diag === start1 - start2) {
				var i = start1;
				var j = start2;
				while (i < end1 || j < end2) {
					if (i < end1 && j < end2 && left[i] === right[j]) {
						script.push([
							KEEP,
							left[i]
						]);
						++i;
						++j;
					} else {
						if (end1 - start1 > end2 - start2) {
							script.push([
								DELETE,
								left[i]
							]);
							++i;
						} else {
							script.push([
								INSERT,
								right[j]
							]);
							++j;
						}
					}
				}
			} else {
				buildScript(start1, middle.start, start2, middle.start - middle.diag, script);
				for (var i2 = middle.start; i2 < middle.end; ++i2) {
					script.push([
						KEEP,
						left[i2]
					]);
				}
				buildScript(middle.end, end1, middle.end - middle.diag, end2, script);
			}
		};
		var buildSnake = function (start, diag, end1, end2) {
			var end = start;
			while (end - diag < end2 && end < end1 && left[end] === right[end - diag]) {
				++end;
			}
			return snake(start, end, diag);
		};
		var getMiddleSnake = function (start1, end1, start2, end2) {
			var m = end1 - start1;
			var n = end2 - start2;
			if (m === 0 || n === 0) {
				return null;
			}
			var delta = m - n;
			var sum = n + m;
			var offset = (sum % 2 === 0 ? sum : sum + 1) / 2;
			vDown[1 + offset] = start1;
			vUp[1 + offset] = end1 + 1;
			var d, k, i, x, y;
			for (d = 0; d <= offset; ++d) {
				for (k = -d; k <= d; k += 2) {
					i = k + offset;
					if (k === -d || k !== d && vDown[i - 1] < vDown[i + 1]) {
						vDown[i] = vDown[i + 1];
					} else {
						vDown[i] = vDown[i - 1] + 1;
					}
					x = vDown[i];
					y = x - start1 + start2 - k;
					while (x < end1 && y < end2 && left[x] === right[y]) {
						vDown[i] = ++x;
						++y;
					}
					if (delta % 2 !== 0 && delta - d <= k && k <= delta + d) {
						if (vUp[i - delta] <= vDown[i]) {
							return buildSnake(vUp[i - delta], k + start1 - start2, end1, end2);
						}
					}
				}
				for (k = delta - d; k <= delta + d; k += 2) {
					i = k + offset - delta;
					if (k === delta - d || k !== delta + d && vUp[i + 1] <= vUp[i - 1]) {
						vUp[i] = vUp[i + 1] - 1;
					} else {
						vUp[i] = vUp[i - 1];
					}
					x = vUp[i] - 1;
					y = x - start1 + start2 - k;
					while (x >= start1 && y >= start2 && left[x] === right[y]) {
						vUp[i] = x--;
						y--;
					}
					if (delta % 2 === 0 && -d <= k && k <= d) {
						if (vUp[i] <= vDown[i + delta]) {
							return buildSnake(vUp[i], k + start1 - start2, end1, end2);
						}
					}
				}
			}
		};
		var script = [];
		buildScript(0, left.length, 0, right.length, script);
		return script;
	};

	var getOuterHtml = function (elm) {
		if (isElement$1(elm)) {
			return elm.outerHTML;
		} else if (isText$1(elm)) {
			return Entities.encodeRaw(elm.data, false);
		} else if (isComment$1(elm)) {
			return '<!--' + elm.data + '-->';
		}
		return '';
	};
	var createFragment$1 = function (html) {
		var node;
		var container = document.createElement('div');
		var frag = document.createDocumentFragment();
		if (html) {
			container.innerHTML = html;
		}
		while (node = container.firstChild) {
			frag.appendChild(node);
		}
		return frag;
	};
	var insertAt = function (elm, html, index) {
		var fragment = createFragment$1(html);
		if (elm.hasChildNodes() && index < elm.childNodes.length) {
			var target = elm.childNodes[index];
			target.parentNode.insertBefore(fragment, target);
		} else {
			elm.appendChild(fragment);
		}
	};
	var removeAt = function (elm, index) {
		if (elm.hasChildNodes() && index < elm.childNodes.length) {
			var target = elm.childNodes[index];
			target.parentNode.removeChild(target);
		}
	};
	var applyDiff = function (diff, elm) {
		var index = 0;
		each(diff, function (action) {
			if (action[0] === KEEP) {
				index++;
			} else if (action[0] === INSERT) {
				insertAt(elm, action[1], index);
				index++;
			} else if (action[0] === DELETE) {
				removeAt(elm, index);
			}
		});
	};
	var read$2 = function (elm) {
		return filter(map(from$1(elm.childNodes), getOuterHtml), function (item) {
			return item.length > 0;
		});
	};
	var write = function (fragments, elm) {
		var currentFragments = map(from$1(elm.childNodes), getOuterHtml);
		applyDiff(diff(currentFragments, fragments), elm);
		return elm;
	};

	var undoLevelDocument = Cell(Optional.none());
	var lazyTempDocument = function () {
		return undoLevelDocument.get().getOrThunk(function () {
			var doc = document.implementation.createHTMLDocument('undo');
			undoLevelDocument.set(Optional.some(doc));
			return doc;
		});
	};
	var hasIframes = function (html) {
		return html.indexOf('</iframe>') !== -1;
	};
	var createFragmentedLevel = function (fragments) {
		return {
			type: 'fragmented',
			fragments: fragments,
			content: '',
			bookmark: null,
			beforeBookmark: null
		};
	};
	var createCompleteLevel = function (content) {
		return {
			type: 'complete',
			fragments: null,
			content: content,
			bookmark: null,
			beforeBookmark: null
		};
	};
	var createFromEditor = function (editor) {
		var fragments = read$2(editor.getBody());
		var trimmedFragments = bind(fragments, function (html) {
			var trimmed = trimInternal(editor.serializer, html);
			return trimmed.length > 0 ? [trimmed] : [];
		});
		var content = trimmedFragments.join('');
		return hasIframes(content) ? createFragmentedLevel(trimmedFragments) : createCompleteLevel(content);
	};
	var applyToEditor = function (editor, level, before) {
		if (level.type === 'fragmented') {
			write(level.fragments, editor.getBody());
		} else {
			editor.setContent(level.content, { format: 'raw' });
		}
		editor.selection.moveToBookmark(before ? level.beforeBookmark : level.bookmark);
	};
	var getLevelContent = function (level) {
		return level.type === 'fragmented' ? level.fragments.join('') : level.content;
	};
	var getCleanLevelContent = function (level) {
		var elm = SugarElement.fromTag('body', lazyTempDocument());
		set$1(elm, getLevelContent(level));
		each(descendants$1(elm, '*[data-mce-bogus]'), unwrap);
		return get$7(elm);
	};
	var hasEqualContent = function (level1, level2) {
		return getLevelContent(level1) === getLevelContent(level2);
	};
	var hasEqualCleanedContent = function (level1, level2) {
		return getCleanLevelContent(level1) === getCleanLevelContent(level2);
	};
	var isEq$4 = function (level1, level2) {
		if (!level1 || !level2) {
			return false;
		} else if (hasEqualContent(level1, level2)) {
			return true;
		} else {
			return hasEqualCleanedContent(level1, level2);
		}
	};

	var isUnlocked = function (locks) {
		return locks.get() === 0;
	};

	var setTyping = function (undoManager, typing, locks) {
		if (isUnlocked(locks)) {
			undoManager.typing = typing;
		}
	};
	var endTyping = function (undoManager, locks) {
		if (undoManager.typing) {
			setTyping(undoManager, false, locks);
			undoManager.add();
		}
	};
	var endTypingLevelIgnoreLocks = function (undoManager) {
		if (undoManager.typing) {
			undoManager.typing = false;
			undoManager.add();
		}
	};

	var beforeChange = function (editor, locks, beforeBookmark) {
		if (isUnlocked(locks)) {
			beforeBookmark.set(Optional.some(getUndoBookmark(editor.selection)));
		}
	};
	var addUndoLevel = function (editor, undoManager, index, locks, beforeBookmark, level, event) {
		var currentLevel = createFromEditor(editor);
		level = level || {};
		level = Tools.extend(level, currentLevel);
		if (isUnlocked(locks) === false || editor.removed) {
			return null;
		}
		var lastLevel = undoManager.data[index.get()];
		if (editor.fire('BeforeAddUndo', {
			level: level,
			lastLevel: lastLevel,
			originalEvent: event
		}).isDefaultPrevented()) {
			return null;
		}
		if (lastLevel && isEq$4(lastLevel, level)) {
			return null;
		}
		if (undoManager.data[index.get()]) {
			beforeBookmark.get().each(function (bm) {
				undoManager.data[index.get()].beforeBookmark = bm;
			});
		}
		var customUndoRedoLevels = getCustomUndoRedoLevels(editor);
		if (customUndoRedoLevels) {
			if (undoManager.data.length > customUndoRedoLevels) {
				for (var i = 0; i < undoManager.data.length - 1; i++) {
					undoManager.data[i] = undoManager.data[i + 1];
				}
				undoManager.data.length--;
				index.set(undoManager.data.length);
			}
		}
		level.bookmark = getUndoBookmark(editor.selection);
		if (index.get() < undoManager.data.length - 1) {
			undoManager.data.length = index.get() + 1;
		}
		undoManager.data.push(level);
		index.set(undoManager.data.length - 1);
		var args = {
			level: level,
			lastLevel: lastLevel,
			originalEvent: event
		};
		if (index.get() > 0) {
			editor.setDirty(true);
			editor.fire('AddUndo', args);
			editor.fire('change', args);
		} else {
			editor.fire('AddUndo', args);
		}
		return level;
	};
	var clear = function (editor, undoManager, index) {
		undoManager.data = [];
		index.set(0);
		undoManager.typing = false;
		editor.fire('ClearUndos');
	};
	var extra = function (editor, undoManager, index, callback1, callback2) {
		if (undoManager.transact(callback1)) {
			var bookmark = undoManager.data[index.get()].bookmark;
			var lastLevel = undoManager.data[index.get() - 1];
			applyToEditor(editor, lastLevel, true);
			if (undoManager.transact(callback2)) {
				undoManager.data[index.get() - 1].beforeBookmark = bookmark;
			}
		}
	};
	var redo = function (editor, index, data) {
		var level;
		if (index.get() < data.length - 1) {
			index.set(index.get() + 1);
			level = data[index.get()];
			applyToEditor(editor, level, false);
			editor.setDirty(true);
			editor.fire('Redo', { level: level });
		}
		return level;
	};
	var undo = function (editor, undoManager, locks, index) {
		var level;
		if (undoManager.typing) {
			undoManager.add();
			undoManager.typing = false;
			setTyping(undoManager, false, locks);
		}
		if (index.get() > 0) {
			index.set(index.get() - 1);
			level = undoManager.data[index.get()];
			applyToEditor(editor, level, true);
			editor.setDirty(true);
			editor.fire('Undo', { level: level });
		}
		return level;
	};
	var reset = function (undoManager) {
		undoManager.clear();
		undoManager.add();
	};
	var hasUndo = function (editor, undoManager, index) {
		return index.get() > 0 || undoManager.typing && undoManager.data[0] && !isEq$4(createFromEditor(editor), undoManager.data[0]);
	};
	var hasRedo = function (undoManager, index) {
		return index.get() < undoManager.data.length - 1 && !undoManager.typing;
	};
	var transact = function (undoManager, locks, callback) {
		endTyping(undoManager, locks);
		undoManager.beforeChange();
		undoManager.ignore(callback);
		return undoManager.add();
	};
	var ignore = function (locks, callback) {
		try {
			locks.set(locks.get() + 1);
			callback();
		} finally {
			locks.set(locks.get() - 1);
		}
	};

	var isTreeNode$1 = function (content) {
		return content instanceof AstNode;
	};
	var runSerializerFiltersOnFragment = function (editor, fragment) {
		filter$3(editor.serializer.getNodeFilters(), editor.serializer.getAttributeFilters(), fragment);
	};
	var getInsertContext = function (editor) {
		return Optional.from(editor.selection.getStart(true)).map(function (elm) {
			return elm.nodeName.toLowerCase();
		});
	};
	var createDummyUndoLevel = function () {
		return {
			type: 'complete',
			fragments: [],
			content: '',
			bookmark: null,
			beforeBookmark: null
		};
	};
	var makePlainAdaptor = function (editor) {
		return {
			undoManager: {
				beforeChange: function (locks, beforeBookmark) {
					return beforeChange(editor, locks, beforeBookmark);
				},
				addUndoLevel: function (undoManager, index, locks, beforeBookmark, level, event) {
					return addUndoLevel(editor, undoManager, index, locks, beforeBookmark, level, event);
				},
				undo: function (undoManager, locks, index) {
					return undo(editor, undoManager, locks, index);
				},
				redo: function (index, data) {
					return redo(editor, index, data);
				},
				clear: function (undoManager, index) {
					return clear(editor, undoManager, index);
				},
				reset: function (undoManager) {
					return reset(undoManager);
				},
				hasUndo: function (undoManager, index) {
					return hasUndo(editor, undoManager, index);
				},
				hasRedo: function (undoManager, index) {
					return hasRedo(undoManager, index);
				},
				transact: function (undoManager, locks, callback) {
					return transact(undoManager, locks, callback);
				},
				ignore: function (locks, callback) {
					return ignore(locks, callback);
				},
				extra: function (undoManager, index, callback1, callback2) {
					return extra(editor, undoManager, index, callback1, callback2);
				}
			},
			formatter: {
				match: function (name, vars, node) {
					return match(editor, name, vars, node);
				},
				matchAll: function (names, vars) {
					return matchAll(editor, names, vars);
				},
				matchNode: function (node, name, vars, similar) {
					return matchNode(editor, node, name, vars, similar);
				},
				canApply: function (name) {
					return canApply(editor, name);
				},
				closest: function (names) {
					return closest$3(editor, names);
				},
				apply: function (name, vars, node) {
					return applyFormat(editor, name, vars, node);
				},
				remove: function (name, vars, node, similar) {
					return remove$6(editor, name, vars, node, similar);
				},
				toggle: function (name, vars, node) {
					return toggle(editor, name, vars, node);
				},
				formatChanged: function (registeredFormatListeners, formats, callback, similar) {
					return formatChangedInternal(editor, registeredFormatListeners, formats, callback, similar);
				}
			},
			editor: {
				getContent: function (args, format) {
					return getContentInternal(editor, args, format);
				},
				setContent: function (content, args) {
					return setContentInternal(editor, content, args);
				},
				insertContent: function (value, details) {
					return insertHtmlAtCaret(editor, value, details);
				},
				addVisual: function (elm) {
					return addVisualInternal(editor, elm);
				}
			},
			selection: {
				getContent: function (format, args) {
					return getSelectedContentInternal(editor, format, args);
				}
			},
			raw: {
				getModel: function () {
					return Optional.none();
				}
			}
		};
	};
	var makeRtcAdaptor = function (tinymceEditor, rtcEditor) {
		var defaultVars = function (vars) {
			return isObject(vars) ? vars : {};
		};
		var unsupported = die('Unimplemented feature for rtc');
		var ignore = noop;
		return {
			undoManager: {
				beforeChange: ignore,
				addUndoLevel: unsupported,
				undo: function () {
					rtcEditor.undo();
					return createDummyUndoLevel();
				},
				redo: function () {
					rtcEditor.redo();
					return createDummyUndoLevel();
				},
				clear: unsupported,
				reset: unsupported,
				hasUndo: function () {
					return rtcEditor.hasUndo();
				},
				hasRedo: function () {
					return rtcEditor.hasRedo();
				},
				transact: function (_undoManager, _locks, fn) {
					rtcEditor.transact(fn);
					return createDummyUndoLevel();
				},
				ignore: unsupported,
				extra: unsupported
			},
			formatter: {
				match: function (name, vars, _node) {
					return rtcEditor.matchFormat(name, defaultVars(vars));
				},
				matchAll: unsupported,
				matchNode: unsupported,
				canApply: function (name) {
					return rtcEditor.canApplyFormat(name);
				},
				closest: function (names) {
					return rtcEditor.closestFormat(names);
				},
				apply: function (name, vars, _node) {
					return rtcEditor.applyFormat(name, defaultVars(vars));
				},
				remove: function (name, vars, _node, _similar) {
					return rtcEditor.removeFormat(name, defaultVars(vars));
				},
				toggle: function (name, vars, _node) {
					return rtcEditor.toggleFormat(name, defaultVars(vars));
				},
				formatChanged: function (_rfl, formats, callback, similar) {
					return rtcEditor.formatChanged(formats, callback, similar);
				}
			},
			editor: {
				getContent: function (args, format) {
					if (format === 'html' || format === 'tree') {
						var fragment = rtcEditor.getContent();
						var serializer = HtmlSerializer({ inner: true });
						runSerializerFiltersOnFragment(tinymceEditor, fragment);
						return format === 'tree' ? fragment : serializer.serialize(fragment);
					} else {
						return makePlainAdaptor(tinymceEditor).editor.getContent(args, format);
					}
				},
				setContent: function (content, _args) {
					var fragment = isTreeNode$1(content) ? content : tinymceEditor.parser.parse(content, {
						isRootContent: true,
						insert: true
					});
					rtcEditor.setContent(fragment);
					return content;
				},
				insertContent: function (value, _details) {
					var contextArgs = getInsertContext(tinymceEditor).fold(function () {
						return {};
					}, function (context) {
						return { context: context };
					});
					var fragment = isTreeNode$1(value) ? value : tinymceEditor.parser.parse(value, __assign(__assign({}, contextArgs), { insert: true }));
					rtcEditor.insertContent(fragment);
				},
				addVisual: function (_elm) {
				}
			},
			selection: {
				getContent: function (format, args) {
					if (format === 'html' || format === 'tree') {
						var fragment = rtcEditor.getSelectedContent();
						var serializer = HtmlSerializer({});
						runSerializerFiltersOnFragment(tinymceEditor, fragment);
						return format === 'tree' ? fragment : serializer.serialize(fragment);
					} else {
						return makePlainAdaptor(tinymceEditor).selection.getContent(format, args);
					}
				}
			},
			raw: {
				getModel: function () {
					return Optional.some(rtcEditor.getRawModel());
				}
			}
		};
	};
	var isRtc = function (editor) {
		return has(editor.plugins, 'rtc');
	};
	var setup$5 = function (editor) {
		var editorCast = editor;
		return get$1(editor.plugins, 'rtc').fold(function () {
			editorCast.rtcInstance = makePlainAdaptor(editor);
			return Optional.none();
		}, function (rtc) {
			return Optional.some(rtc.setup().then(function (rtcEditor) {
				editorCast.rtcInstance = makeRtcAdaptor(editor, rtcEditor);
				return rtcEditor.isRemote;
			}));
		});
	};
	var getRtcInstanceWithFallback = function (editor) {
		return editor.rtcInstance ? editor.rtcInstance : makePlainAdaptor(editor);
	};
	var getRtcInstanceWithError = function (editor) {
		var rtcInstance = editor.rtcInstance;
		if (!rtcInstance) {
			throw new Error('Failed to get RTC instance not yet initialized.');
		} else {
			return rtcInstance;
		}
	};
	var beforeChange$1 = function (editor, locks, beforeBookmark) {
		getRtcInstanceWithError(editor).undoManager.beforeChange(locks, beforeBookmark);
	};
	var addUndoLevel$1 = function (editor, undoManager, index, locks, beforeBookmark, level, event) {
		return getRtcInstanceWithError(editor).undoManager.addUndoLevel(undoManager, index, locks, beforeBookmark, level, event);
	};
	var undo$1 = function (editor, undoManager, locks, index) {
		return getRtcInstanceWithError(editor).undoManager.undo(undoManager, locks, index);
	};
	var redo$1 = function (editor, index, data) {
		return getRtcInstanceWithError(editor).undoManager.redo(index, data);
	};
	var clear$1 = function (editor, undoManager, index) {
		getRtcInstanceWithError(editor).undoManager.clear(undoManager, index);
	};
	var reset$1 = function (editor, undoManager) {
		getRtcInstanceWithError(editor).undoManager.reset(undoManager);
	};
	var hasUndo$1 = function (editor, undoManager, index) {
		return getRtcInstanceWithError(editor).undoManager.hasUndo(undoManager, index);
	};
	var hasRedo$1 = function (editor, undoManager, index) {
		return getRtcInstanceWithError(editor).undoManager.hasRedo(undoManager, index);
	};
	var transact$1 = function (editor, undoManager, locks, callback) {
		return getRtcInstanceWithError(editor).undoManager.transact(undoManager, locks, callback);
	};
	var ignore$1 = function (editor, locks, callback) {
		getRtcInstanceWithError(editor).undoManager.ignore(locks, callback);
	};
	var extra$1 = function (editor, undoManager, index, callback1, callback2) {
		getRtcInstanceWithError(editor).undoManager.extra(undoManager, index, callback1, callback2);
	};
	var matchFormat = function (editor, name, vars, node) {
		return getRtcInstanceWithError(editor).formatter.match(name, vars, node);
	};
	var matchAllFormats = function (editor, names, vars) {
		return getRtcInstanceWithError(editor).formatter.matchAll(names, vars);
	};
	var matchNodeFormat = function (editor, node, name, vars, similar) {
		return getRtcInstanceWithError(editor).formatter.matchNode(node, name, vars, similar);
	};
	var canApplyFormat = function (editor, name) {
		return getRtcInstanceWithError(editor).formatter.canApply(name);
	};
	var closestFormat = function (editor, names) {
		return getRtcInstanceWithError(editor).formatter.closest(names);
	};
	var applyFormat$1 = function (editor, name, vars, node) {
		getRtcInstanceWithError(editor).formatter.apply(name, vars, node);
	};
	var removeFormat$1 = function (editor, name, vars, node, similar) {
		getRtcInstanceWithError(editor).formatter.remove(name, vars, node, similar);
	};
	var toggleFormat = function (editor, name, vars, node) {
		getRtcInstanceWithError(editor).formatter.toggle(name, vars, node);
	};
	var formatChanged = function (editor, registeredFormatListeners, formats, callback, similar) {
		if (similar === void 0) {
			similar = false;
		}
		return getRtcInstanceWithError(editor).formatter.formatChanged(registeredFormatListeners, formats, callback, similar);
	};
	var getContent = function (editor, args, format) {
		return getRtcInstanceWithFallback(editor).editor.getContent(args, format);
	};
	var setContent = function (editor, content, args) {
		return getRtcInstanceWithFallback(editor).editor.setContent(content, args);
	};
	var insertContent = function (editor, value, details) {
		return getRtcInstanceWithFallback(editor).editor.insertContent(value, details);
	};
	var getSelectedContent = function (editor, format, args) {
		return getRtcInstanceWithError(editor).selection.getContent(format, args);
	};
	var addVisual = function (editor, elm) {
		return getRtcInstanceWithError(editor).editor.addVisual(elm);
	};

	var getContent$1 = function (editor, args) {
		if (args === void 0) {
			args = {};
		}
		var format = args.format ? args.format : 'html';
		return getSelectedContent(editor, format, args);
	};

	var removeEmpty = function (text) {
		if (text.dom.length === 0) {
			remove(text);
			return Optional.none();
		} else {
			return Optional.some(text);
		}
	};
	var walkPastBookmark = function (node, start) {
		return node.filter(function (elm) {
			return BookmarkManager$1.isBookmarkNode(elm.dom);
		}).bind(start ? nextSibling : prevSibling);
	};
	var merge = function (outer, inner, rng, start) {
		var outerElm = outer.dom;
		var innerElm = inner.dom;
		var oldLength = start ? outerElm.length : innerElm.length;
		if (start) {
			mergeTextNodes(outerElm, innerElm, false, !start);
			rng.setStart(innerElm, oldLength);
		} else {
			mergeTextNodes(innerElm, outerElm, false, !start);
			rng.setEnd(innerElm, oldLength);
		}
	};
	var normalizeTextIfRequired = function (inner, start) {
		parent(inner).each(function (root) {
			var text = inner.dom;
			if (start && needsToBeNbspLeft(root, CaretPosition$1(text, 0))) {
				normalizeWhitespaceAfter(text, 0);
			} else if (!start && needsToBeNbspRight(root, CaretPosition$1(text, text.length))) {
				normalizeWhitespaceBefore(text, text.length);
			}
		});
	};
	var mergeAndNormalizeText = function (outerNode, innerNode, rng, start) {
		outerNode.bind(function (outer) {
			var normalizer = start ? normalizeWhitespaceBefore : normalizeWhitespaceAfter;
			normalizer(outer.dom, start ? outer.dom.length : 0);
			return innerNode.filter(isText).map(function (inner) {
				return merge(outer, inner, rng, start);
			});
		}).orThunk(function () {
			var innerTextNode = walkPastBookmark(innerNode, start).or(innerNode).filter(isText);
			return innerTextNode.map(function (inner) {
				return normalizeTextIfRequired(inner, start);
			});
		});
	};
	var rngSetContent = function (rng, fragment) {
		var firstChild = Optional.from(fragment.firstChild).map(SugarElement.fromDom);
		var lastChild = Optional.from(fragment.lastChild).map(SugarElement.fromDom);
		rng.deleteContents();
		rng.insertNode(fragment);
		var prevText = firstChild.bind(prevSibling).filter(isText).bind(removeEmpty);
		var nextText = lastChild.bind(nextSibling).filter(isText).bind(removeEmpty);
		mergeAndNormalizeText(prevText, firstChild, rng, true);
		mergeAndNormalizeText(nextText, lastChild, rng, false);
		rng.collapse(false);
	};
	var setupArgs = function (args, content) {
		return __assign(__assign({ format: 'html' }, args), {
			set: true,
			selection: true,
			content: content
		});
	};
	var cleanContent = function (editor, args) {
		if (args.format !== 'raw') {
			var rng = editor.selection.getRng();
			var contextBlock = editor.dom.getParent(rng.commonAncestorContainer, editor.dom.isBlock);
			var contextArgs = contextBlock ? { context: contextBlock.nodeName.toLowerCase() } : {};
			var node = editor.parser.parse(args.content, __assign(__assign({
				isRootContent: true,
				forced_root_block: false
			}, contextArgs), args));
			return HtmlSerializer({ validate: editor.validate }, editor.schema).serialize(node);
		} else {
			return args.content;
		}
	};
	var setContent$1 = function (editor, content, args) {
		if (args === void 0) {
			args = {};
		}
		var contentArgs = setupArgs(args, content);
		if (!contentArgs.no_events) {
			contentArgs = editor.fire('BeforeSetContent', contentArgs);
			if (contentArgs.isDefaultPrevented()) {
				editor.fire('SetContent', contentArgs);
				return;
			}
		}
		args.content = cleanContent(editor, contentArgs);
		var rng = editor.selection.getRng();
		rngSetContent(rng, rng.createContextualFragment(args.content));
		editor.selection.setRng(rng);
		scrollRangeIntoView(editor, rng);
		if (!contentArgs.no_events) {
			editor.fire('SetContent', contentArgs);
		}
	};

	var deleteFromCallbackMap = function (callbackMap, selector, callback) {
		if (callbackMap && callbackMap.hasOwnProperty(selector)) {
			var newCallbacks = filter(callbackMap[selector], function (cb) {
				return cb !== callback;
			});
			if (newCallbacks.length === 0) {
				delete callbackMap[selector];
			} else {
				callbackMap[selector] = newCallbacks;
			}
		}
	};
	function SelectorChanged(dom, editor) {
		var selectorChangedData;
		var currentSelectors;
		return {
			selectorChangedWithUnbind: function (selector, callback) {
				if (!selectorChangedData) {
					selectorChangedData = {};
					currentSelectors = {};
					editor.on('NodeChange', function (e) {
						var node = e.element, parents = dom.getParents(node, null, dom.getRoot()), matchedSelectors = {};
						Tools.each(selectorChangedData, function (callbacks, selector) {
							Tools.each(parents, function (node) {
								if (dom.is(node, selector)) {
									if (!currentSelectors[selector]) {
										Tools.each(callbacks, function (callback) {
											callback(true, {
												node: node,
												selector: selector,
												parents: parents
											});
										});
										currentSelectors[selector] = callbacks;
									}
									matchedSelectors[selector] = callbacks;
									return false;
								}
							});
						});
						Tools.each(currentSelectors, function (callbacks, selector) {
							if (!matchedSelectors[selector]) {
								delete currentSelectors[selector];
								Tools.each(callbacks, function (callback) {
									callback(false, {
										node: node,
										selector: selector,
										parents: parents
									});
								});
							}
						});
					});
				}
				if (!selectorChangedData[selector]) {
					selectorChangedData[selector] = [];
				}
				selectorChangedData[selector].push(callback);
				return {
					unbind: function () {
						deleteFromCallbackMap(selectorChangedData, selector, callback);
						deleteFromCallbackMap(currentSelectors, selector, callback);
					}
				};
			}
		};
	}

	var isNativeIeSelection = function (rng) {
		return !!rng.select;
	};
	var isAttachedToDom = function (node) {
		return !!(node && node.ownerDocument) && contains$2(SugarElement.fromDom(node.ownerDocument), SugarElement.fromDom(node));
	};
	var isValidRange = function (rng) {
		if (!rng) {
			return false;
		} else if (isNativeIeSelection(rng)) {
			return true;
		} else {
			return isAttachedToDom(rng.startContainer) && isAttachedToDom(rng.endContainer);
		}
	};
	var EditorSelection = function (dom, win, serializer, editor) {
		var selectedRange;
		var explicitRange;
		var selectorChangedWithUnbind = SelectorChanged(dom, editor).selectorChangedWithUnbind;
		var setCursorLocation = function (node, offset) {
			var rng = dom.createRng();
			if (!node) {
				moveEndPoint$1(dom, rng, editor.getBody(), true);
				setRng(rng);
			} else {
				rng.setStart(node, offset);
				rng.setEnd(node, offset);
				setRng(rng);
				collapse(false);
			}
		};
		var getContent = function (args) {
			return getContent$1(editor, args);
		};
		var setContent = function (content, args) {
			return setContent$1(editor, content, args);
		};
		var getStart = function (real) {
			return getStart$2(editor.getBody(), getRng$1(), real);
		};
		var getEnd$1 = function (real) {
			return getEnd(editor.getBody(), getRng$1(), real);
		};
		var getBookmark = function (type, normalized) {
			return bookmarkManager.getBookmark(type, normalized);
		};
		var moveToBookmark = function (bookmark) {
			return bookmarkManager.moveToBookmark(bookmark);
		};
		var select = function (node, content) {
			select$1(dom, node, content).each(setRng);
			return node;
		};
		var isCollapsed = function () {
			var rng = getRng$1(), sel = getSel();
			if (!rng || rng.item) {
				return false;
			}
			if (rng.compareEndPoints) {
				return rng.compareEndPoints('StartToEnd', rng) === 0;
			}
			return !sel || rng.collapsed;
		};
		var collapse = function (toStart) {
			var rng = getRng$1();
			rng.collapse(!!toStart);
			setRng(rng);
		};
		var getSel = function () {
			return win.getSelection ? win.getSelection() : win.document.selection;
		};
		var getRng$1 = function () {
			var selection, rng, elm;
			var tryCompareBoundaryPoints = function (how, sourceRange, destinationRange) {
				try {
					return sourceRange.compareBoundaryPoints(how, destinationRange);
				} catch (ex) {
					return -1;
				}
			};
			if (!win) {
				return null;
			}
			var doc = win.document;
			if (typeof doc === 'undefined' || doc === null) {
				return null;
			}
			if (editor.bookmark !== undefined && hasFocus$1(editor) === false) {
				var bookmark = getRng(editor);
				if (bookmark.isSome()) {
					return bookmark.map(function (r) {
						return processRanges(editor, [r])[0];
					}).getOr(doc.createRange());
				}
			}
			try {
				if ((selection = getSel()) && !isRestrictedNode(selection.anchorNode)) {
					if (selection.rangeCount > 0) {
						rng = selection.getRangeAt(0);
					} else {
						rng = selection.createRange ? selection.createRange() : doc.createRange();
					}
					rng = processRanges(editor, [rng])[0];
				}
			} catch (ex) {
			}
			if (!rng) {
				rng = doc.createRange ? doc.createRange() : doc.body.createTextRange();
			}
			if (rng.setStart && rng.startContainer.nodeType === 9 && rng.collapsed) {
				elm = dom.getRoot();
				rng.setStart(elm, 0);
				rng.setEnd(elm, 0);
			}
			if (selectedRange && explicitRange) {
				if (tryCompareBoundaryPoints(rng.START_TO_START, rng, selectedRange) === 0 && tryCompareBoundaryPoints(rng.END_TO_END, rng, selectedRange) === 0) {
					rng = explicitRange;
				} else {
					selectedRange = null;
					explicitRange = null;
				}
			}
			return rng;
		};
		var setRng = function (rng, forward) {
			var node;
			if (!isValidRange(rng)) {
				return;
			}
			var ieRange = isNativeIeSelection(rng) ? rng : null;
			if (ieRange) {
				explicitRange = null;
				try {
					ieRange.select();
				} catch (ex) {
				}
				return;
			}
			var sel = getSel();
			var evt = editor.fire('SetSelectionRange', {
				range: rng,
				forward: forward
			});
			rng = evt.range;
			if (sel) {
				explicitRange = rng;
				try {
					sel.removeAllRanges();
					sel.addRange(rng);
				} catch (ex) {
				}
				if (forward === false && sel.extend) {
					sel.collapse(rng.endContainer, rng.endOffset);
					sel.extend(rng.startContainer, rng.startOffset);
				}
				selectedRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
			}
			if (!rng.collapsed && rng.startContainer === rng.endContainer && sel.setBaseAndExtent && !Env.ie) {
				if (rng.endOffset - rng.startOffset < 2) {
					if (rng.startContainer.hasChildNodes()) {
						node = rng.startContainer.childNodes[rng.startOffset];
						if (node && node.tagName === 'IMG') {
							sel.setBaseAndExtent(rng.startContainer, rng.startOffset, rng.endContainer, rng.endOffset);
							if (sel.anchorNode !== rng.startContainer || sel.focusNode !== rng.endContainer) {
								sel.setBaseAndExtent(node, 0, node, 1);
							}
						}
					}
				}
			}
			editor.fire('AfterSetSelectionRange', {
				range: rng,
				forward: forward
			});
		};
		var setNode = function (elm) {
			setContent(dom.getOuterHTML(elm));
			return elm;
		};
		var getNode = function () {
			return getNode$1(editor.getBody(), getRng$1());
		};
		var getSelectedBlocks$1 = function (startElm, endElm) {
			return getSelectedBlocks(dom, getRng$1(), startElm, endElm);
		};
		var isForward = function () {
			var sel = getSel();
			var anchorNode = sel === null || sel === void 0 ? void 0 : sel.anchorNode;
			var focusNode = sel === null || sel === void 0 ? void 0 : sel.focusNode;
			if (!sel || !anchorNode || !focusNode || isRestrictedNode(anchorNode) || isRestrictedNode(focusNode)) {
				return true;
			}
			var anchorRange = dom.createRng();
			anchorRange.setStart(anchorNode, sel.anchorOffset);
			anchorRange.collapse(true);
			var focusRange = dom.createRng();
			focusRange.setStart(focusNode, sel.focusOffset);
			focusRange.collapse(true);
			return anchorRange.compareBoundaryPoints(anchorRange.START_TO_START, focusRange) <= 0;
		};
		var normalize$1 = function () {
			var rng = getRng$1();
			var sel = getSel();
			if (!hasMultipleRanges(sel) && hasAnyRanges(editor)) {
				var normRng = normalize(dom, rng);
				normRng.each(function (normRng) {
					setRng(normRng, isForward());
				});
				return normRng.getOr(rng);
			}
			return rng;
		};
		var selectorChanged = function (selector, callback) {
			selectorChangedWithUnbind(selector, callback);
			return exports;
		};
		var getScrollContainer = function () {
			var scrollContainer;
			var node = dom.getRoot();
			while (node && node.nodeName !== 'BODY') {
				if (node.scrollHeight > node.clientHeight) {
					scrollContainer = node;
					break;
				}
				node = node.parentNode;
			}
			return scrollContainer;
		};
		var scrollIntoView = function (elm, alignToTop) {
			return scrollElementIntoView(editor, elm, alignToTop);
		};
		var placeCaretAt = function (clientX, clientY) {
			return setRng(fromPoint$1(clientX, clientY, editor.getDoc()));
		};
		var getBoundingClientRect = function () {
			var rng = getRng$1();
			return rng.collapsed ? CaretPosition$1.fromRangeStart(rng).getClientRects()[0] : rng.getBoundingClientRect();
		};
		var destroy = function () {
			win = selectedRange = explicitRange = null;
			controlSelection.destroy();
		};
		var exports = {
			bookmarkManager: null,
			controlSelection: null,
			dom: dom,
			win: win,
			serializer: serializer,
			editor: editor,
			collapse: collapse,
			setCursorLocation: setCursorLocation,
			getContent: getContent,
			setContent: setContent,
			getBookmark: getBookmark,
			moveToBookmark: moveToBookmark,
			select: select,
			isCollapsed: isCollapsed,
			isForward: isForward,
			setNode: setNode,
			getNode: getNode,
			getSel: getSel,
			setRng: setRng,
			getRng: getRng$1,
			getStart: getStart,
			getEnd: getEnd$1,
			getSelectedBlocks: getSelectedBlocks$1,
			normalize: normalize$1,
			selectorChanged: selectorChanged,
			selectorChangedWithUnbind: selectorChangedWithUnbind,
			getScrollContainer: getScrollContainer,
			scrollIntoView: scrollIntoView,
			placeCaretAt: placeCaretAt,
			getBoundingClientRect: getBoundingClientRect,
			destroy: destroy
		};
		var bookmarkManager = BookmarkManager$1(exports);
		var controlSelection = ControlSelection(exports, editor);
		exports.bookmarkManager = bookmarkManager;
		exports.controlSelection = controlSelection;
		return exports;
	};

	var removeAttrs = function (node, names) {
		each(names, function (name) {
			node.attr(name, null);
		});
	};
	var addFontToSpansFilter = function (domParser, styles, fontSizes) {
		domParser.addNodeFilter('font', function (nodes) {
			each(nodes, function (node) {
				var props = styles.parse(node.attr('style'));
				var color = node.attr('color');
				var face = node.attr('face');
				var size = node.attr('size');
				if (color) {
					props.color = color;
				}
				if (face) {
					props['font-family'] = face;
				}
				if (size) {
					props['font-size'] = fontSizes[parseInt(node.attr('size'), 10) - 1];
				}
				node.name = 'span';
				node.attr('style', styles.serialize(props));
				removeAttrs(node, [
					'color',
					'face',
					'size'
				]);
			});
		});
	};
	var addStrikeToSpanFilter = function (domParser, styles) {
		domParser.addNodeFilter('strike', function (nodes) {
			each(nodes, function (node) {
				var props = styles.parse(node.attr('style'));
				props['text-decoration'] = 'line-through';
				node.name = 'span';
				node.attr('style', styles.serialize(props));
			});
		});
	};
	var addFilters = function (domParser, settings) {
		var styles = Styles();
		if (settings.convert_fonts_to_spans) {
			addFontToSpansFilter(domParser, styles, Tools.explode(settings.font_size_legacy_values));
		}
		addStrikeToSpanFilter(domParser, styles);
	};
	var register$1 = function (domParser, settings) {
		if (settings.inline_styles) {
			addFilters(domParser, settings);
		}
	};

	var blobUriToBlob = function (url) {
		return new promiseObj(function (resolve, reject) {
			var rejectWithError = function () {
				reject('Cannot convert ' + url + ' to Blob. Resource might not exist or is inaccessible.');
			};
			try {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.responseType = 'blob';
				xhr.onload = function () {
					if (this.status === 200) {
						resolve(this.response);
					} else {
						rejectWithError();
					}
				};
				xhr.onerror = rejectWithError;
				xhr.send();
			} catch (ex) {
				rejectWithError();
			}
		});
	};
	var parseDataUri$1 = function (uri) {
		var type;
		var uriParts = decodeURIComponent(uri).split(',');
		var matches = /data:([^;]+)/.exec(uriParts[0]);
		if (matches) {
			type = matches[1];
		}
		return {
			type: type,
			data: uriParts[1]
		};
	};
	var buildBlob = function (type, data) {
		var str;
		try {
			str = atob(data);
		} catch (e) {
			return Optional.none();
		}
		var arr = new Uint8Array(str.length);
		for (var i = 0; i < arr.length; i++) {
			arr[i] = str.charCodeAt(i);
		}
		return Optional.some(new Blob([arr], { type: type }));
	};
	var dataUriToBlob = function (uri) {
		return new promiseObj(function (resolve) {
			var _a = parseDataUri$1(uri), type = _a.type, data = _a.data;
			buildBlob(type, data).fold(function () {
				return resolve(new Blob([]));
			}, resolve);
		});
	};
	var uriToBlob = function (url) {
		if (url.indexOf('blob:') === 0) {
			return blobUriToBlob(url);
		}
		if (url.indexOf('data:') === 0) {
			return dataUriToBlob(url);
		}
		return null;
	};
	var blobToDataUri = function (blob) {
		return new promiseObj(function (resolve) {
			var reader = new FileReader();
			reader.onloadend = function () {
				resolve(reader.result);
			};
			reader.readAsDataURL(blob);
		});
	};

	var count = 0;
	var uniqueId = function (prefix) {
		return (prefix || 'blobid') + count++;
	};
	var imageToBlobInfo = function (blobCache, img, resolve, reject) {
		var base64, blobInfo;
		if (img.src.indexOf('blob:') === 0) {
			blobInfo = blobCache.getByUri(img.src);
			if (blobInfo) {
				resolve({
					image: img,
					blobInfo: blobInfo
				});
			} else {
				uriToBlob(img.src).then(function (blob) {
					blobToDataUri(blob).then(function (dataUri) {
						base64 = parseDataUri$1(dataUri).data;
						blobInfo = blobCache.create(uniqueId(), blob, base64);
						blobCache.add(blobInfo);
						resolve({
							image: img,
							blobInfo: blobInfo
						});
					});
				}, function (err) {
					reject(err);
				});
			}
			return;
		}
		var _a = parseDataUri$1(img.src), data = _a.data, type = _a.type;
		base64 = data;
		blobInfo = blobCache.getByData(base64, type);
		if (blobInfo) {
			resolve({
				image: img,
				blobInfo: blobInfo
			});
		} else {
			uriToBlob(img.src).then(function (blob) {
				blobInfo = blobCache.create(uniqueId(), blob, base64);
				blobCache.add(blobInfo);
				resolve({
					image: img,
					blobInfo: blobInfo
				});
			}, function (err) {
				reject(err);
			});
		}
	};
	var getAllImages = function (elm) {
		return elm ? from$1(elm.getElementsByTagName('img')) : [];
	};
	function ImageScanner(uploadStatus, blobCache) {
		var cachedPromises = {};
		var findAll = function (elm, predicate) {
			if (!predicate) {
				predicate = always;
			}
			var images = filter(getAllImages(elm), function (img) {
				var src = img.src;
				if (!Env.fileApi) {
					return false;
				}
				if (img.hasAttribute('data-mce-bogus')) {
					return false;
				}
				if (img.hasAttribute('data-mce-placeholder')) {
					return false;
				}
				if (!src || src === Env.transparentSrc) {
					return false;
				}
				if (src.indexOf('blob:') === 0) {
					return !uploadStatus.isUploaded(src) && predicate(img);
				}
				if (src.indexOf('data:') === 0) {
					return predicate(img);
				}
				return false;
			});
			var promises = map(images, function (img) {
				if (cachedPromises[img.src] !== undefined) {
					return new promiseObj(function (resolve) {
						cachedPromises[img.src].then(function (imageInfo) {
							if (typeof imageInfo === 'string') {
								return imageInfo;
							}
							resolve({
								image: img,
								blobInfo: imageInfo.blobInfo
							});
						});
					});
				}
				var newPromise = new promiseObj(function (resolve, reject) {
					imageToBlobInfo(blobCache, img, resolve, reject);
				}).then(function (result) {
					delete cachedPromises[result.image.src];
					return result;
				}).catch(function (error) {
					delete cachedPromises[img.src];
					return error;
				});
				cachedPromises[img.src] = newPromise;
				return newPromise;
			});
			return promiseObj.all(promises);
		};
		return { findAll: findAll };
	}

	var paddEmptyNode = function (settings, args, blockElements, node) {
		var brPreferred = settings.padd_empty_with_br || args.insert;
		if (brPreferred && blockElements[node.name]) {
			node.empty().append(new AstNode('br', 1)).shortEnded = true;
		} else {
			node.empty().append(new AstNode('#text', 3)).value = nbsp;
		}
	};
	var isPaddedWithNbsp = function (node) {
		return hasOnlyChild(node, '#text') && node.firstChild.value === nbsp;
	};
	var hasOnlyChild = function (node, name) {
		return node && node.firstChild && node.firstChild === node.lastChild && node.firstChild.name === name;
	};
	var isPadded = function (schema, node) {
		var rule = schema.getElementRule(node.name);
		return rule && rule.paddEmpty;
	};
	var isEmpty$2 = function (schema, nonEmptyElements, whitespaceElements, node) {
		return node.isEmpty(nonEmptyElements, whitespaceElements, function (node) {
			return isPadded(schema, node);
		});
	};
	var isLineBreakNode = function (node, blockElements) {
		return node && (blockElements[node.name] || node.name === 'br');
	};

	var isBogusImage = function (img) {
		return img.attr('data-mce-bogus');
	};
	var isInternalImageSource = function (img) {
		return img.attr('src') === Env.transparentSrc || img.attr('data-mce-placeholder');
	};
	var isValidDataImg = function (img, settings) {
		if (settings.images_dataimg_filter) {
			var imgElem_1 = new Image();
			imgElem_1.src = img.attr('src');
			each$1(img.attributes.map, function (value, key) {
				imgElem_1.setAttribute(key, value);
			});
			return settings.images_dataimg_filter(imgElem_1);
		} else {
			return true;
		}
	};
	var registerBase64ImageFilter = function (parser, settings) {
		var blobCache = settings.blob_cache;
		var processImage = function (img) {
			var inputSrc = img.attr('src');
			if (isInternalImageSource(img) || isBogusImage(img)) {
				return;
			}
			parseDataUri(inputSrc).filter(function () {
				return isValidDataImg(img, settings);
			}).bind(function (_a) {
				var type = _a.type, data = _a.data;
				return Optional.from(blobCache.getByData(data, type)).orThunk(function () {
					return buildBlob(type, data).map(function (blob) {
						var blobInfo = blobCache.create(uniqueId(), blob, data);
						blobCache.add(blobInfo);
						return blobInfo;
					});
				});
			}).each(function (blobInfo) {
				img.attr('src', blobInfo.blobUri());
			});
		};
		if (blobCache) {
			parser.addAttributeFilter('src', function (nodes) {
				return each(nodes, processImage);
			});
		}
	};
	var register$2 = function (parser, settings) {
		var schema = parser.schema;
		if (settings.remove_trailing_brs) {
			parser.addNodeFilter('br', function (nodes, _, args) {
				var i;
				var l = nodes.length;
				var node;
				var blockElements = Tools.extend({}, schema.getBlockElements());
				var nonEmptyElements = schema.getNonEmptyElements();
				var parent, lastParent, prev, prevName;
				var whiteSpaceElements = schema.getWhiteSpaceElements();
				var elementRule, textNode;
				blockElements.body = 1;
				for (i = 0; i < l; i++) {
					node = nodes[i];
					parent = node.parent;
					if (blockElements[node.parent.name] && node === parent.lastChild) {
						prev = node.prev;
						while (prev) {
							prevName = prev.name;
							if (prevName !== 'span' || prev.attr('data-mce-type') !== 'bookmark') {
								if (prevName === 'br') {
									node = null;
								}
								break;
							}
							prev = prev.prev;
						}
						if (node) {
							node.remove();
							if (isEmpty$2(schema, nonEmptyElements, whiteSpaceElements, parent)) {
								elementRule = schema.getElementRule(parent.name);
								if (elementRule) {
									if (elementRule.removeEmpty) {
										parent.remove();
									} else if (elementRule.paddEmpty) {
										paddEmptyNode(settings, args, blockElements, parent);
									}
								}
							}
						}
					} else {
						lastParent = node;
						while (parent && parent.firstChild === lastParent && parent.lastChild === lastParent) {
							lastParent = parent;
							if (blockElements[parent.name]) {
								break;
							}
							parent = parent.parent;
						}
						if (lastParent === parent && settings.padd_empty_with_br !== true) {
							textNode = new AstNode('#text', 3);
							textNode.value = nbsp;
							node.replace(textNode);
						}
					}
				}
			});
		}
		parser.addAttributeFilter('href', function (nodes) {
			var i = nodes.length;
			var appendRel = function (rel) {
				var parts = rel.split(' ').filter(function (p) {
					return p.length > 0;
				});
				return parts.concat(['noopener']).sort().join(' ');
			};
			var addNoOpener = function (rel) {
				var newRel = rel ? Tools.trim(rel) : '';
				if (!/\b(noopener)\b/g.test(newRel)) {
					return appendRel(newRel);
				} else {
					return newRel;
				}
			};
			if (!settings.allow_unsafe_link_target) {
				while (i--) {
					var node = nodes[i];
					if (node.name === 'a' && node.attr('target') === '_blank') {
						node.attr('rel', addNoOpener(node.attr('rel')));
					}
				}
			}
		});
		if (!settings.allow_html_in_named_anchor) {
			parser.addAttributeFilter('id,name', function (nodes) {
				var i = nodes.length, sibling, prevSibling, parent, node;
				while (i--) {
					node = nodes[i];
					if (node.name === 'a' && node.firstChild && !node.attr('href')) {
						parent = node.parent;
						sibling = node.lastChild;
						do {
							prevSibling = sibling.prev;
							parent.insert(sibling, node);
							sibling = prevSibling;
						} while (sibling);
					}
				}
			});
		}
		if (settings.fix_list_elements) {
			parser.addNodeFilter('ul,ol', function (nodes) {
				var i = nodes.length, node, parentNode;
				while (i--) {
					node = nodes[i];
					parentNode = node.parent;
					if (parentNode.name === 'ul' || parentNode.name === 'ol') {
						if (node.prev && node.prev.name === 'li') {
							node.prev.append(node);
						} else {
							var li = new AstNode('li', 1);
							li.attr('style', 'list-style-type: none');
							node.wrap(li);
						}
					}
				}
			});
		}
		if (settings.validate && schema.getValidClasses()) {
			parser.addAttributeFilter('class', function (nodes) {
				var i = nodes.length, node, classList, ci, className, classValue;
				var validClasses = schema.getValidClasses();
				var validClassesMap, valid;
				while (i--) {
					node = nodes[i];
					classList = node.attr('class').split(' ');
					classValue = '';
					for (ci = 0; ci < classList.length; ci++) {
						className = classList[ci];
						valid = false;
						validClassesMap = validClasses['*'];
						if (validClassesMap && validClassesMap[className]) {
							valid = true;
						}
						validClassesMap = validClasses[node.name];
						if (!valid && validClassesMap && validClassesMap[className]) {
							valid = true;
						}
						if (valid) {
							if (classValue) {
								classValue += ' ';
							}
							classValue += className;
						}
					}
					if (!classValue.length) {
						classValue = null;
					}
					node.attr('class', classValue);
				}
			});
		}
		registerBase64ImageFilter(parser, settings);
	};

	var makeMap$4 = Tools.makeMap, each$d = Tools.each, explode$2 = Tools.explode, extend$2 = Tools.extend;
	var DomParser = function (settings, schema) {
		if (schema === void 0) {
			schema = Schema();
		}
		var nodeFilters = {};
		var attributeFilters = [];
		var matchedNodes = {};
		var matchedAttributes = {};
		settings = settings || {};
		settings.validate = 'validate' in settings ? settings.validate : true;
		settings.root_name = settings.root_name || 'body';
		var fixInvalidChildren = function (nodes) {
			var ni, node, parent, parents, newParent, currentNode, tempNode, childNode, i;
			var sibling, nextNode;
			var nonSplitableElements = makeMap$4('tr,td,th,tbody,thead,tfoot,table');
			var nonEmptyElements = schema.getNonEmptyElements();
			var whitespaceElements = schema.getWhiteSpaceElements();
			var textBlockElements = schema.getTextBlockElements();
			var specialElements = schema.getSpecialElements();
			for (ni = 0; ni < nodes.length; ni++) {
				node = nodes[ni];
				if (!node.parent || node.fixed) {
					continue;
				}
				if (textBlockElements[node.name] && node.parent.name === 'li') {
					sibling = node.next;
					while (sibling) {
						if (textBlockElements[sibling.name]) {
							sibling.name = 'li';
							sibling.fixed = true;
							node.parent.insert(sibling, node.parent);
						} else {
							break;
						}
						sibling = sibling.next;
					}
					node.unwrap(node);
					continue;
				}
				parents = [node];
				for (parent = node.parent; parent && !schema.isValidChild(parent.name, node.name) && !nonSplitableElements[parent.name]; parent = parent.parent) {
					parents.push(parent);
				}
				if (parent && parents.length > 1) {
					parents.reverse();
					newParent = currentNode = filterNode(parents[0].clone());
					for (i = 0; i < parents.length - 1; i++) {
						if (schema.isValidChild(currentNode.name, parents[i].name)) {
							tempNode = filterNode(parents[i].clone());
							currentNode.append(tempNode);
						} else {
							tempNode = currentNode;
						}
						for (childNode = parents[i].firstChild; childNode && childNode !== parents[i + 1];) {
							nextNode = childNode.next;
							tempNode.append(childNode);
							childNode = nextNode;
						}
						currentNode = tempNode;
					}
					if (!isEmpty$2(schema, nonEmptyElements, whitespaceElements, newParent)) {
						parent.insert(newParent, parents[0], true);
						parent.insert(node, newParent);
					} else {
						parent.insert(node, parents[0], true);
					}
					parent = parents[0];
					if (isEmpty$2(schema, nonEmptyElements, whitespaceElements, parent) || hasOnlyChild(parent, 'br')) {
						parent.empty().remove();
					}
				} else if (node.parent) {
					if (node.name === 'li') {
						sibling = node.prev;
						if (sibling && (sibling.name === 'ul' || sibling.name === 'ol')) {
							sibling.append(node);
							continue;
						}
						sibling = node.next;
						if (sibling && (sibling.name === 'ul' || sibling.name === 'ol')) {
							sibling.insert(node, sibling.firstChild, true);
							continue;
						}
						node.wrap(filterNode(new AstNode('ul', 1)));
						continue;
					}
					if (schema.isValidChild(node.parent.name, 'div') && schema.isValidChild('div', node.name)) {
						node.wrap(filterNode(new AstNode('div', 1)));
					} else {
						if (specialElements[node.name]) {
							node.empty().remove();
						} else {
							node.unwrap();
						}
					}
				}
			}
		};
		var filterNode = function (node) {
			var i, name, list;
			name = node.name;
			if (name in nodeFilters) {
				list = matchedNodes[name];
				if (list) {
					list.push(node);
				} else {
					matchedNodes[name] = [node];
				}
			}
			i = attributeFilters.length;
			while (i--) {
				name = attributeFilters[i].name;
				if (name in node.attributes.map) {
					list = matchedAttributes[name];
					if (list) {
						list.push(node);
					} else {
						matchedAttributes[name] = [node];
					}
				}
			}
			return node;
		};
		var addNodeFilter = function (name, callback) {
			each$d(explode$2(name), function (name) {
				var list = nodeFilters[name];
				if (!list) {
					nodeFilters[name] = list = [];
				}
				list.push(callback);
			});
		};
		var getNodeFilters = function () {
			var out = [];
			for (var name_1 in nodeFilters) {
				if (nodeFilters.hasOwnProperty(name_1)) {
					out.push({
						name: name_1,
						callbacks: nodeFilters[name_1]
					});
				}
			}
			return out;
		};
		var addAttributeFilter = function (name, callback) {
			each$d(explode$2(name), function (name) {
				var i;
				for (i = 0; i < attributeFilters.length; i++) {
					if (attributeFilters[i].name === name) {
						attributeFilters[i].callbacks.push(callback);
						return;
					}
				}
				attributeFilters.push({
					name: name,
					callbacks: [callback]
				});
			});
		};
		var getAttributeFilters = function () {
			return [].concat(attributeFilters);
		};
		var parse = function (html, args) {
			var nodes, i, l, fi, fl, list, name;
			var invalidChildren = [];
			var isInWhiteSpacePreservedElement;
			var node;
			var getRootBlockName = function (name) {
				if (name === false) {
					return '';
				} else if (name === true) {
					return 'p';
				} else {
					return name;
				}
			};
			args = args || {};
			matchedNodes = {};
			matchedAttributes = {};
			var blockElements = extend$2(makeMap$4('script,style,head,html,body,title,meta,param'), schema.getBlockElements());
			var nonEmptyElements = schema.getNonEmptyElements();
			var children = schema.children;
			var validate = settings.validate;
			var forcedRootBlockName = 'forced_root_block' in args ? args.forced_root_block : settings.forced_root_block;
			var rootBlockName = getRootBlockName(forcedRootBlockName);
			var whiteSpaceElements = schema.getWhiteSpaceElements();
			var startWhiteSpaceRegExp = /^[ \t\r\n]+/;
			var endWhiteSpaceRegExp = /[ \t\r\n]+$/;
			var allWhiteSpaceRegExp = /[ \t\r\n]+/g;
			var isAllWhiteSpaceRegExp = /^[ \t\r\n]+$/;
			isInWhiteSpacePreservedElement = whiteSpaceElements.hasOwnProperty(args.context) || whiteSpaceElements.hasOwnProperty(settings.root_name);
			var addRootBlocks = function () {
				var node = rootNode.firstChild, next, rootBlockNode;
				var trim = function (rootBlockNode) {
					if (rootBlockNode) {
						node = rootBlockNode.firstChild;
						if (node && node.type === 3) {
							node.value = node.value.replace(startWhiteSpaceRegExp, '');
						}
						node = rootBlockNode.lastChild;
						if (node && node.type === 3) {
							node.value = node.value.replace(endWhiteSpaceRegExp, '');
						}
					}
				};
				if (!schema.isValidChild(rootNode.name, rootBlockName.toLowerCase())) {
					return;
				}
				while (node) {
					next = node.next;
					if (node.type === 3 || node.type === 1 && node.name !== 'p' && !blockElements[node.name] && !node.attr('data-mce-type')) {
						if (!rootBlockNode) {
							rootBlockNode = createNode(rootBlockName, 1);
							rootBlockNode.attr(settings.forced_root_block_attrs);
							rootNode.insert(rootBlockNode, node);
							rootBlockNode.append(node);
						} else {
							rootBlockNode.append(node);
						}
					} else {
						trim(rootBlockNode);
						rootBlockNode = null;
					}
					node = next;
				}
				trim(rootBlockNode);
			};
			var createNode = function (name, type) {
				var node = new AstNode(name, type);
				var list;
				if (name in nodeFilters) {
					list = matchedNodes[name];
					if (list) {
						list.push(node);
					} else {
						matchedNodes[name] = [node];
					}
				}
				return node;
			};
			var removeWhitespaceBefore = function (node) {
				var textNode, textNodeNext, textVal, sibling;
				var blockElements = schema.getBlockElements();
				for (textNode = node.prev; textNode && textNode.type === 3;) {
					textVal = textNode.value.replace(endWhiteSpaceRegExp, '');
					if (textVal.length > 0) {
						textNode.value = textVal;
						return;
					}
					textNodeNext = textNode.next;
					if (textNodeNext) {
						if (textNodeNext.type === 3 && textNodeNext.value.length) {
							textNode = textNode.prev;
							continue;
						}
						if (!blockElements[textNodeNext.name] && textNodeNext.name !== 'script' && textNodeNext.name !== 'style') {
							textNode = textNode.prev;
							continue;
						}
					}
					sibling = textNode.prev;
					textNode.remove();
					textNode = sibling;
				}
			};
			var cloneAndExcludeBlocks = function (input) {
				var name;
				var output = {};
				for (name in input) {
					if (name !== 'li' && name !== 'p') {
						output[name] = input[name];
					}
				}
				return output;
			};
			var parser = SaxParser$1({
				validate: validate,
				allow_html_data_urls: settings.allow_html_data_urls,
				allow_svg_data_urls: settings.allow_svg_data_urls,
				allow_script_urls: settings.allow_script_urls,
				allow_conditional_comments: settings.allow_conditional_comments,
				preserve_cdata: settings.preserve_cdata,
				self_closing_elements: cloneAndExcludeBlocks(schema.getSelfClosingElements()),
				cdata: function (text) {
					node.append(createNode('#cdata', 4)).value = text;
				},
				text: function (text, raw) {
					var textNode;
					if (!isInWhiteSpacePreservedElement) {
						text = text.replace(allWhiteSpaceRegExp, ' ');
						if (isLineBreakNode(node.lastChild, blockElements)) {
							text = text.replace(startWhiteSpaceRegExp, '');
						}
					}
					if (text.length !== 0) {
						textNode = createNode('#text', 3);
						textNode.raw = !!raw;
						node.append(textNode).value = text;
					}
				},
				comment: function (text) {
					node.append(createNode('#comment', 8)).value = text;
				},
				pi: function (name, text) {
					node.append(createNode(name, 7)).value = text;
					removeWhitespaceBefore(node);
				},
				doctype: function (text) {
					var newNode = node.append(createNode('#doctype', 10));
					newNode.value = text;
					removeWhitespaceBefore(node);
				},
				start: function (name, attrs, empty) {
					var newNode, attrFiltersLen, attrName, parent;
					var elementRule = validate ? schema.getElementRule(name) : {};
					if (elementRule) {
						newNode = createNode(elementRule.outputName || name, 1);
						newNode.attributes = attrs;
						newNode.shortEnded = empty;
						node.append(newNode);
						parent = children[node.name];
						if (parent && children[newNode.name] && !parent[newNode.name]) {
							invalidChildren.push(newNode);
						}
						attrFiltersLen = attributeFilters.length;
						while (attrFiltersLen--) {
							attrName = attributeFilters[attrFiltersLen].name;
							if (attrName in attrs.map) {
								list = matchedAttributes[attrName];
								if (list) {
									list.push(newNode);
								} else {
									matchedAttributes[attrName] = [newNode];
								}
							}
						}
						if (blockElements[name]) {
							removeWhitespaceBefore(newNode);
						}
						if (!empty) {
							node = newNode;
						}
						if (!isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
							isInWhiteSpacePreservedElement = true;
						}
					}
				},
				end: function (name) {
					var textNode, text, sibling, tempNode;
					var elementRule = validate ? schema.getElementRule(name) : {};
					if (elementRule) {
						if (blockElements[name]) {
							if (!isInWhiteSpacePreservedElement) {
								textNode = node.firstChild;
								if (textNode && textNode.type === 3) {
									text = textNode.value.replace(startWhiteSpaceRegExp, '');
									if (text.length > 0) {
										textNode.value = text;
										textNode = textNode.next;
									} else {
										sibling = textNode.next;
										textNode.remove();
										textNode = sibling;
										while (textNode && textNode.type === 3) {
											text = textNode.value;
											sibling = textNode.next;
											if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
												textNode.remove();
												textNode = sibling;
											}
											textNode = sibling;
										}
									}
								}
								textNode = node.lastChild;
								if (textNode && textNode.type === 3) {
									text = textNode.value.replace(endWhiteSpaceRegExp, '');
									if (text.length > 0) {
										textNode.value = text;
										textNode = textNode.prev;
									} else {
										sibling = textNode.prev;
										textNode.remove();
										textNode = sibling;
										while (textNode && textNode.type === 3) {
											text = textNode.value;
											sibling = textNode.prev;
											if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
												textNode.remove();
												textNode = sibling;
											}
											textNode = sibling;
										}
									}
								}
							}
						}
						if (isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
							isInWhiteSpacePreservedElement = false;
						}
						if (elementRule.removeEmpty && isEmpty$2(schema, nonEmptyElements, whiteSpaceElements, node)) {
							tempNode = node.parent;
							if (blockElements[node.name]) {
								node.empty().remove();
							} else {
								node.unwrap();
							}
							node = tempNode;
							return;
						}
						if (elementRule.paddEmpty && (isPaddedWithNbsp(node) || isEmpty$2(schema, nonEmptyElements, whiteSpaceElements, node))) {
							paddEmptyNode(settings, args, blockElements, node);
						}
						node = node.parent;
					}
				}
			}, schema);
			var rootNode = node = new AstNode(args.context || settings.root_name, 11);
			parser.parse(html, args.format);
			if (validate && invalidChildren.length) {
				if (!args.context) {
					fixInvalidChildren(invalidChildren);
				} else {
					args.invalid = true;
				}
			}
			if (rootBlockName && (rootNode.name === 'body' || args.isRootContent)) {
				addRootBlocks();
			}
			if (!args.invalid) {
				for (name in matchedNodes) {
					if (!matchedNodes.hasOwnProperty(name)) {
						continue;
					}
					list = nodeFilters[name];
					nodes = matchedNodes[name];
					fi = nodes.length;
					while (fi--) {
						if (!nodes[fi].parent) {
							nodes.splice(fi, 1);
						}
					}
					for (i = 0, l = list.length; i < l; i++) {
						list[i](nodes, name, args);
					}
				}
				for (i = 0, l = attributeFilters.length; i < l; i++) {
					list = attributeFilters[i];
					if (list.name in matchedAttributes) {
						nodes = matchedAttributes[list.name];
						fi = nodes.length;
						while (fi--) {
							if (!nodes[fi].parent) {
								nodes.splice(fi, 1);
							}
						}
						for (fi = 0, fl = list.callbacks.length; fi < fl; fi++) {
							list.callbacks[fi](nodes, list.name, args);
						}
					}
				}
			}
			return rootNode;
		};
		var exports = {
			schema: schema,
			addAttributeFilter: addAttributeFilter,
			getAttributeFilters: getAttributeFilters,
			addNodeFilter: addNodeFilter,
			getNodeFilters: getNodeFilters,
			filterNode: filterNode,
			parse: parse
		};
		register$2(exports, settings);
		register$1(exports, settings);
		return exports;
	};

	var register$3 = function (htmlParser, settings, dom) {
		htmlParser.addAttributeFilter('data-mce-tabindex', function (nodes, name) {
			var i = nodes.length, node;
			while (i--) {
				node = nodes[i];
				node.attr('tabindex', node.attr('data-mce-tabindex'));
				node.attr(name, null);
			}
		});
		htmlParser.addAttributeFilter('src,href,style', function (nodes, name) {
			var i = nodes.length, node, value;
			var internalName = 'data-mce-' + name;
			var urlConverter = settings.url_converter;
			var urlConverterScope = settings.url_converter_scope;
			while (i--) {
				node = nodes[i];
				value = node.attr(internalName);
				if (value !== undefined) {
					node.attr(name, value.length > 0 ? value : null);
					node.attr(internalName, null);
				} else {
					value = node.attr(name);
					if (name === 'style') {
						value = dom.serializeStyle(dom.parseStyle(value), node.name);
					} else if (urlConverter) {
						value = urlConverter.call(urlConverterScope, value, name, node.name);
					}
					node.attr(name, value.length > 0 ? value : null);
				}
			}
		});
		htmlParser.addAttributeFilter('class', function (nodes) {
			var i = nodes.length, node, value;
			while (i--) {
				node = nodes[i];
				value = node.attr('class');
				if (value) {
					value = node.attr('class').replace(/(?:^|\s)mce-item-\w+(?!\S)/g, '');
					node.attr('class', value.length > 0 ? value : null);
				}
			}
		});
		htmlParser.addAttributeFilter('data-mce-type', function (nodes, name, args) {
			var i = nodes.length, node;
			while (i--) {
				node = nodes[i];
				if (node.attr('data-mce-type') === 'bookmark' && !args.cleanup) {
					var hasChildren = Optional.from(node.firstChild).exists(function (firstChild) {
						return !isZwsp$1(firstChild.value);
					});
					if (hasChildren) {
						node.unwrap();
					} else {
						node.remove();
					}
				}
			}
		});
		htmlParser.addNodeFilter('noscript', function (nodes) {
			var i = nodes.length, node;
			while (i--) {
				node = nodes[i].firstChild;
				if (node) {
					node.value = Entities.decode(node.value);
				}
			}
		});
		htmlParser.addNodeFilter('script,style', function (nodes, name) {
			var i = nodes.length, node, value, type;
			var trim = function (value) {
				return value.replace(/(<!--\[CDATA\[|\]\]-->)/g, '\n').replace(/^[\r\n]*|[\r\n]*$/g, '').replace(/^\s*((<!--)?(\s*\/\/)?\s*<!\[CDATA\[|(<!--\s*)?\/\*\s*<!\[CDATA\[\s*\*\/|(\/\/)?\s*<!--|\/\*\s*<!--\s*\*\/)\s*[\r\n]*/gi, '').replace(/\s*(\/\*\s*\]\]>\s*\*\/(-->)?|\s*\/\/\s*\]\]>(-->)?|\/\/\s*(-->)?|\]\]>|\/\*\s*-->\s*\*\/|\s*-->\s*)\s*$/g, '');
			};
			while (i--) {
				node = nodes[i];
				value = node.firstChild ? node.firstChild.value : '';
				if (name === 'script') {
					type = node.attr('type');
					if (type) {
						node.attr('type', type === 'mce-no/type' ? null : type.replace(/^mce\-/, ''));
					}
					if (settings.element_format === 'xhtml' && value.length > 0) {
						node.firstChild.value = '// <![CDATA[\n' + trim(value) + '\n// ]]>';
					}
				} else {
					if (settings.element_format === 'xhtml' && value.length > 0) {
						node.firstChild.value = '<!--\n' + trim(value) + '\n-->';
					}
				}
			}
		});
		htmlParser.addNodeFilter('#comment', function (nodes) {
			var i = nodes.length, node;
			while (i--) {
				node = nodes[i];
				if (settings.preserve_cdata && node.value.indexOf('[CDATA[') === 0) {
					node.name = '#cdata';
					node.type = 4;
					node.value = dom.decode(node.value.replace(/^\[CDATA\[|\]\]$/g, ''));
				} else if (node.value.indexOf('mce:protected ') === 0) {
					node.name = '#text';
					node.type = 3;
					node.raw = true;
					node.value = unescape(node.value).substr(14);
				}
			}
		});
		htmlParser.addNodeFilter('xml:namespace,input', function (nodes, name) {
			var i = nodes.length, node;
			while (i--) {
				node = nodes[i];
				if (node.type === 7) {
					node.remove();
				} else if (node.type === 1) {
					if (name === 'input' && !node.attr('type')) {
						node.attr('type', 'text');
					}
				}
			}
		});
		htmlParser.addAttributeFilter('data-mce-type', function (nodes) {
			each(nodes, function (node) {
				if (node.attr('data-mce-type') === 'format-caret') {
					if (node.isEmpty(htmlParser.schema.getNonEmptyElements())) {
						node.remove();
					} else {
						node.unwrap();
					}
				}
			});
		});
		htmlParser.addAttributeFilter('data-mce-src,data-mce-href,data-mce-style,' + 'data-mce-selected,data-mce-expando,' + 'data-mce-type,data-mce-resize,data-mce-placeholder', function (nodes, name) {
			var i = nodes.length;
			while (i--) {
				nodes[i].attr(name, null);
			}
		});
	};
	var trimTrailingBr = function (rootNode) {
		var isBr = function (node) {
			return node && node.name === 'br';
		};
		var brNode1 = rootNode.lastChild;
		if (isBr(brNode1)) {
			var brNode2 = brNode1.prev;
			if (isBr(brNode2)) {
				brNode1.remove();
				brNode2.remove();
			}
		}
	};

	var preProcess = function (editor, node, args) {
		var doc, oldDoc;
		var dom = editor.dom;
		node = node.cloneNode(true);
		var impl = document.implementation;
		if (impl.createHTMLDocument) {
			doc = impl.createHTMLDocument('');
			Tools.each(node.nodeName === 'BODY' ? node.childNodes : [node], function (node) {
				doc.body.appendChild(doc.importNode(node, true));
			});
			if (node.nodeName !== 'BODY') {
				node = doc.body.firstChild;
			} else {
				node = doc.body;
			}
			oldDoc = dom.doc;
			dom.doc = doc;
		}
		firePreProcess(editor, __assign(__assign({}, args), { node: node }));
		if (oldDoc) {
			dom.doc = oldDoc;
		}
		return node;
	};
	var shouldFireEvent = function (editor, args) {
		return editor && editor.hasEventListeners('PreProcess') && !args.no_events;
	};
	var process = function (editor, node, args) {
		return shouldFireEvent(editor, args) ? preProcess(editor, node, args) : node;
	};

	var addTempAttr = function (htmlParser, tempAttrs, name) {
		if (Tools.inArray(tempAttrs, name) === -1) {
			htmlParser.addAttributeFilter(name, function (nodes, name) {
				var i = nodes.length;
				while (i--) {
					nodes[i].attr(name, null);
				}
			});
			tempAttrs.push(name);
		}
	};
	var postProcess$1 = function (editor, args, content) {
		if (!args.no_events && editor) {
			var outArgs = firePostProcess(editor, __assign(__assign({}, args), { content: content }));
			return outArgs.content;
		} else {
			return content;
		}
	};
	var getHtmlFromNode = function (dom, node, args) {
		var html = trim$2(args.getInner ? node.innerHTML : dom.getOuterHTML(node));
		return args.selection || isWsPreserveElement(SugarElement.fromDom(node)) ? html : Tools.trim(html);
	};
	var parseHtml = function (htmlParser, html, args) {
		var parserArgs = args.selection ? __assign({ forced_root_block: false }, args) : args;
		var rootNode = htmlParser.parse(html, parserArgs);
		trimTrailingBr(rootNode);
		return rootNode;
	};
	var serializeNode = function (settings, schema, node) {
		var htmlSerializer = HtmlSerializer(settings, schema);
		return htmlSerializer.serialize(node);
	};
	var toHtml = function (editor, settings, schema, rootNode, args) {
		var content = serializeNode(settings, schema, rootNode);
		return postProcess$1(editor, args, content);
	};
	var DomSerializerImpl = function (settings, editor) {
		var tempAttrs = ['data-mce-selected'];
		var dom = editor && editor.dom ? editor.dom : DOMUtils$1.DOM;
		var schema = editor && editor.schema ? editor.schema : Schema(settings);
		settings.entity_encoding = settings.entity_encoding || 'named';
		settings.remove_trailing_brs = 'remove_trailing_brs' in settings ? settings.remove_trailing_brs : true;
		var htmlParser = DomParser(settings, schema);
		register$3(htmlParser, settings, dom);
		var serialize = function (node, parserArgs) {
			if (parserArgs === void 0) {
				parserArgs = {};
			}
			var args = __assign({ format: 'html' }, parserArgs);
			var targetNode = process(editor, node, args);
			var html = getHtmlFromNode(dom, targetNode, args);
			var rootNode = parseHtml(htmlParser, html, args);
			return args.format === 'tree' ? rootNode : toHtml(editor, settings, schema, rootNode, args);
		};
		return {
			schema: schema,
			addNodeFilter: htmlParser.addNodeFilter,
			addAttributeFilter: htmlParser.addAttributeFilter,
			serialize: serialize,
			addRules: function (rules) {
				schema.addValidElements(rules);
			},
			setRules: function (rules) {
				schema.setValidElements(rules);
			},
			addTempAttr: curry(addTempAttr, htmlParser, tempAttrs),
			getTempAttrs: function () {
				return tempAttrs;
			},
			getNodeFilters: htmlParser.getNodeFilters,
			getAttributeFilters: htmlParser.getAttributeFilters
		};
	};

	var DomSerializer = function (settings, editor) {
		var domSerializer = DomSerializerImpl(settings, editor);
		return {
			schema: domSerializer.schema,
			addNodeFilter: domSerializer.addNodeFilter,
			addAttributeFilter: domSerializer.addAttributeFilter,
			serialize: domSerializer.serialize,
			addRules: domSerializer.addRules,
			setRules: domSerializer.setRules,
			addTempAttr: domSerializer.addTempAttr,
			getTempAttrs: domSerializer.getTempAttrs,
			getNodeFilters: domSerializer.getNodeFilters,
			getAttributeFilters: domSerializer.getAttributeFilters
		};
	};

	var defaultFormat$1 = 'html';
	var getContent$2 = function (editor, args) {
		if (args === void 0) {
			args = {};
		}
		var format = args.format ? args.format : defaultFormat$1;
		return getContent(editor, args, format);
	};

	var setContent$2 = function (editor, content, args) {
		if (args === void 0) {
			args = {};
		}
		return setContent(editor, content, args);
	};

	var DOM$3 = DOMUtils$1.DOM;
	var restoreOriginalStyles = function (editor) {
		DOM$3.setStyle(editor.id, 'display', editor.orgDisplay);
	};
	var safeDestroy = function (x) {
		return Optional.from(x).each(function (x) {
			return x.destroy();
		});
	};
	var clearDomReferences = function (editor) {
		editor.contentAreaContainer = editor.formElement = editor.container = editor.editorContainer = null;
		editor.bodyElement = editor.contentDocument = editor.contentWindow = null;
		editor.iframeElement = editor.targetElm = null;
		if (editor.selection) {
			editor.selection = editor.selection.win = editor.selection.dom = editor.selection.dom.doc = null;
		}
	};
	var restoreForm = function (editor) {
		var form = editor.formElement;
		if (form) {
			if (form._mceOldSubmit) {
				form.submit = form._mceOldSubmit;
				form._mceOldSubmit = null;
			}
			DOM$3.unbind(form, 'submit reset', editor.formEventDelegate);
		}
	};
	var remove$7 = function (editor) {
		if (!editor.removed) {
			var _selectionOverrides = editor._selectionOverrides, editorUpload = editor.editorUpload;
			var body = editor.getBody();
			var element = editor.getElement();
			if (body) {
				editor.save({ is_removing: true });
			}
			editor.removed = true;
			editor.unbindAllNativeEvents();
			if (editor.hasHiddenInput && element) {
				DOM$3.remove(element.nextSibling);
			}
			fireRemove(editor);
			editor.editorManager.remove(editor);
			if (!editor.inline && body) {
				restoreOriginalStyles(editor);
			}
			fireDetach(editor);
			DOM$3.remove(editor.getContainer());
			safeDestroy(_selectionOverrides);
			safeDestroy(editorUpload);
			editor.destroy();
		}
	};
	var destroy = function (editor, automatic) {
		var selection = editor.selection, dom = editor.dom;
		if (editor.destroyed) {
			return;
		}
		if (!automatic && !editor.removed) {
			editor.remove();
			return;
		}
		if (!automatic) {
			editor.editorManager.off('beforeunload', editor._beforeUnload);
			if (editor.theme && editor.theme.destroy) {
				editor.theme.destroy();
			}
			safeDestroy(selection);
			safeDestroy(dom);
		}
		restoreForm(editor);
		clearDomReferences(editor);
		editor.destroyed = true;
	};

	var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
	var deep$1 = function (old, nu) {
		var bothObjects = isObject(old) && isObject(nu);
		return bothObjects ? deepMerge(old, nu) : nu;
	};
	var baseMerge = function (merger) {
		return function () {
			var objects = new Array(arguments.length);
			for (var i = 0; i < objects.length; i++) {
				objects[i] = arguments[i];
			}
			if (objects.length === 0) {
				throw new Error('Can\'t merge zero objects');
			}
			var ret = {};
			for (var j = 0; j < objects.length; j++) {
				var curObject = objects[j];
				for (var key in curObject) {
					if (hasOwnProperty$2.call(curObject, key)) {
						ret[key] = merger(ret[key], curObject[key]);
					}
				}
			}
			return ret;
		};
	};
	var deepMerge = baseMerge(deep$1);

	var sectionResult = function (sections, settings) {
		return {
			sections: constant(sections),
			settings: constant(settings)
		};
	};
	var deviceDetection = detect$3().deviceType;
	var isTouch = deviceDetection.isTouch();
	var isPhone = deviceDetection.isPhone();
	var isTablet = deviceDetection.isTablet();
	var legacyMobilePlugins = [
		'lists',
		'autolink',
		'autosave'
	];
	var defaultTouchSettings = {
		table_grid: false,
		object_resizing: false,
		resize: false
	};
	var normalizePlugins = function (plugins) {
		var pluginNames = isArray(plugins) ? plugins.join(' ') : plugins;
		var trimmedPlugins = map(isString(pluginNames) ? pluginNames.split(' ') : [], trim);
		return filter(trimmedPlugins, function (item) {
			return item.length > 0;
		});
	};
	var filterLegacyMobilePlugins = function (plugins) {
		return filter(plugins, curry(contains, legacyMobilePlugins));
	};
	var extractSections = function (keys, settings) {
		var result = bifilter(settings, function (value, key) {
			return contains(keys, key);
		});
		return sectionResult(result.t, result.f);
	};
	var getSection = function (sectionResult, name, defaults) {
		if (defaults === void 0) {
			defaults = {};
		}
		var sections = sectionResult.sections();
		var sectionSettings = sections.hasOwnProperty(name) ? sections[name] : {};
		return Tools.extend({}, defaults, sectionSettings);
	};
	var hasSection = function (sectionResult, name) {
		return sectionResult.sections().hasOwnProperty(name);
	};
	var isSectionTheme = function (sectionResult, name, theme) {
		var section = sectionResult.sections();
		return hasSection(sectionResult, name) && section[name].theme === theme;
	};
	var getSectionConfig = function (sectionResult, name) {
		return hasSection(sectionResult, name) ? sectionResult.sections()[name] : {};
	};
	var getToolbarMode = function (settings, defaultVal) {
		return get$1(settings, 'toolbar_mode').orThunk(function () {
			return get$1(settings, 'toolbar_drawer').map(function (val) {
				return val === false ? 'wrap' : val;
			});
		}).getOr(defaultVal);
	};
	var getDefaultSettings = function (settings, id, documentBaseUrl, isTouch, editor) {
		var baseDefaults = {
			id: id,
			theme: 'silver',
			toolbar_mode: getToolbarMode(settings, 'floating'),
			plugins: '',
			document_base_url: documentBaseUrl,
			add_form_submit_trigger: true,
			submit_patch: true,
			add_unload_trigger: true,
			convert_urls: true,
			relative_urls: true,
			remove_script_host: true,
			object_resizing: true,
			doctype: '<!DOCTYPE html>',
			visual: true,
			font_size_legacy_values: 'xx-small,small,medium,large,x-large,xx-large,300%',
			forced_root_block: 'p',
			hidden_input: true,
			inline_styles: true,
			convert_fonts_to_spans: true,
			indent: true,
			indent_before: 'p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,th,ul,ol,li,dl,dt,dd,area,table,thead,' + 'tfoot,tbody,tr,section,summary,article,hgroup,aside,figure,figcaption,option,optgroup,datalist',
			indent_after: 'p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,th,ul,ol,li,dl,dt,dd,area,table,thead,' + 'tfoot,tbody,tr,section,summary,article,hgroup,aside,figure,figcaption,option,optgroup,datalist',
			entity_encoding: 'named',
			url_converter: editor.convertURL,
			url_converter_scope: editor
		};
		return __assign(__assign({}, baseDefaults), isTouch ? defaultTouchSettings : {});
	};
	var getDefaultMobileSettings = function (mobileSettings, isPhone) {
		var defaultMobileSettings = {
			resize: false,
			toolbar_mode: getToolbarMode(mobileSettings, 'scrolling'),
			toolbar_sticky: false
		};
		var defaultPhoneSettings = { menubar: false };
		return __assign(__assign(__assign({}, defaultTouchSettings), defaultMobileSettings), isPhone ? defaultPhoneSettings : {});
	};
	var getExternalPlugins$1 = function (overrideSettings, settings) {
		var userDefinedExternalPlugins = settings.external_plugins ? settings.external_plugins : {};
		if (overrideSettings && overrideSettings.external_plugins) {
			return Tools.extend({}, overrideSettings.external_plugins, userDefinedExternalPlugins);
		} else {
			return userDefinedExternalPlugins;
		}
	};
	var combinePlugins = function (forcedPlugins, plugins) {
		return [].concat(normalizePlugins(forcedPlugins)).concat(normalizePlugins(plugins));
	};
	var getPlatformPlugins = function (isMobileDevice, sectionResult, desktopPlugins, mobilePlugins) {
		if (isMobileDevice && isSectionTheme(sectionResult, 'mobile', 'mobile')) {
			return filterLegacyMobilePlugins(mobilePlugins);
		} else if (isMobileDevice && hasSection(sectionResult, 'mobile')) {
			return mobilePlugins;
		} else {
			return desktopPlugins;
		}
	};
	var processPlugins = function (isMobileDevice, sectionResult, defaultOverrideSettings, settings) {
		var forcedPlugins = normalizePlugins(defaultOverrideSettings.forced_plugins);
		var desktopPlugins = normalizePlugins(settings.plugins);
		var mobileConfig = getSectionConfig(sectionResult, 'mobile');
		var mobilePlugins = mobileConfig.plugins ? normalizePlugins(mobileConfig.plugins) : desktopPlugins;
		var platformPlugins = getPlatformPlugins(isMobileDevice, sectionResult, desktopPlugins, mobilePlugins);
		var combinedPlugins = combinePlugins(forcedPlugins, platformPlugins);
		if (Env.browser.isIE() && contains(combinedPlugins, 'rtc')) {
			throw new Error('RTC plugin is not supported on IE 11.');
		}
		return Tools.extend(settings, { plugins: combinedPlugins.join(' ') });
	};
	var isOnMobile = function (isMobileDevice, sectionResult) {
		return isMobileDevice && hasSection(sectionResult, 'mobile');
	};
	var combineSettings = function (isMobileDevice, isPhone, defaultSettings, defaultOverrideSettings, settings) {
		var defaultDeviceSettings = isMobileDevice ? { mobile: getDefaultMobileSettings(settings.mobile || {}, isPhone) } : {};
		var sectionResult = extractSections(['mobile'], deepMerge(defaultDeviceSettings, settings));
		var extendedSettings = Tools.extend(defaultSettings, defaultOverrideSettings, sectionResult.settings(), isOnMobile(isMobileDevice, sectionResult) ? getSection(sectionResult, 'mobile') : {}, {
			validate: true,
			external_plugins: getExternalPlugins$1(defaultOverrideSettings, sectionResult.settings())
		});
		return processPlugins(isMobileDevice, sectionResult, defaultOverrideSettings, extendedSettings);
	};
	var getEditorSettings = function (editor, id, documentBaseUrl, defaultOverrideSettings, settings) {
		var defaultSettings = getDefaultSettings(settings, id, documentBaseUrl, isTouch, editor);
		return combineSettings(isPhone || isTablet, isPhone, defaultSettings, defaultOverrideSettings, settings);
	};
	var getFiltered = function (predicate, editor, name) {
		return Optional.from(editor.settings[name]).filter(predicate);
	};
	var getParamObject = function (value) {
		var output = {};
		if (typeof value === 'string') {
			each(value.indexOf('=') > 0 ? value.split(/[;,](?![^=;,]*(?:[;,]|$))/) : value.split(','), function (val) {
				var arr = val.split('=');
				if (arr.length > 1) {
					output[Tools.trim(arr[0])] = Tools.trim(arr[1]);
				} else {
					output[Tools.trim(arr[0])] = Tools.trim(arr[0]);
				}
			});
		} else {
			output = value;
		}
		return output;
	};
	var isArrayOf = function (p) {
		return function (a) {
			return isArray(a) && forall(a, p);
		};
	};
	var getParam = function (editor, name, defaultVal, type) {
		var value = name in editor.settings ? editor.settings[name] : defaultVal;
		if (type === 'hash') {
			return getParamObject(value);
		} else if (type === 'string') {
			return getFiltered(isString, editor, name).getOr(defaultVal);
		} else if (type === 'number') {
			return getFiltered(isNumber, editor, name).getOr(defaultVal);
		} else if (type === 'boolean') {
			return getFiltered(isBoolean, editor, name).getOr(defaultVal);
		} else if (type === 'object') {
			return getFiltered(isObject, editor, name).getOr(defaultVal);
		} else if (type === 'array') {
			return getFiltered(isArray, editor, name).getOr(defaultVal);
		} else if (type === 'string[]') {
			return getFiltered(isArrayOf(isString), editor, name).getOr(defaultVal);
		} else if (type === 'function') {
			return getFiltered(isFunction, editor, name).getOr(defaultVal);
		} else {
			return value;
		}
	};

	var CreateIconManager = function () {
		var lookup = {};
		var add = function (id, iconPack) {
			lookup[id] = iconPack;
		};
		var get = function (id) {
			if (lookup[id]) {
				return lookup[id];
			}
			return { icons: {} };
		};
		var has$1 = function (id) {
			return has(lookup, id);
		};
		return {
			add: add,
			get: get,
			has: has$1
		};
	};
	var IconManager = CreateIconManager();

	var getProp = function (propName, elm) {
		var rawElm = elm.dom;
		return rawElm[propName];
	};
	var getComputedSizeProp = function (propName, elm) {
		return parseInt(get$5(elm, propName), 10);
	};
	var getClientWidth = curry(getProp, 'clientWidth');
	var getClientHeight = curry(getProp, 'clientHeight');
	var getMarginTop = curry(getComputedSizeProp, 'margin-top');
	var getMarginLeft = curry(getComputedSizeProp, 'margin-left');
	var getBoundingClientRect$1 = function (elm) {
		return elm.dom.getBoundingClientRect();
	};
	var isInsideElementContentArea = function (bodyElm, clientX, clientY) {
		var clientWidth = getClientWidth(bodyElm);
		var clientHeight = getClientHeight(bodyElm);
		return clientX >= 0 && clientY >= 0 && clientX <= clientWidth && clientY <= clientHeight;
	};
	var transpose = function (inline, elm, clientX, clientY) {
		var clientRect = getBoundingClientRect$1(elm);
		var deltaX = inline ? clientRect.left + elm.dom.clientLeft + getMarginLeft(elm) : 0;
		var deltaY = inline ? clientRect.top + elm.dom.clientTop + getMarginTop(elm) : 0;
		var x = clientX - deltaX;
		var y = clientY - deltaY;
		return {
			x: x,
			y: y
		};
	};
	var isXYInContentArea = function (editor, clientX, clientY) {
		var bodyElm = SugarElement.fromDom(editor.getBody());
		var targetElm = editor.inline ? bodyElm : documentElement(bodyElm);
		var transposedPoint = transpose(editor.inline, targetElm, clientX, clientY);
		return isInsideElementContentArea(targetElm, transposedPoint.x, transposedPoint.y);
	};
	var fromDomSafe = function (node) {
		return Optional.from(node).map(SugarElement.fromDom);
	};
	var isEditorAttachedToDom = function (editor) {
		var rawContainer = editor.inline ? editor.getBody() : editor.getContentAreaContainer();
		return fromDomSafe(rawContainer).map(inBody).getOr(false);
	};

	function NotificationManagerImpl() {
		var unimplemented = function () {
			throw new Error('Theme did not provide a NotificationManager implementation.');
		};
		return {
			open: unimplemented,
			close: unimplemented,
			reposition: unimplemented,
			getArgs: unimplemented
		};
	}

	function NotificationManager(editor) {
		var notifications = [];
		var getImplementation = function () {
			var theme = editor.theme;
			return theme && theme.getNotificationManagerImpl ? theme.getNotificationManagerImpl() : NotificationManagerImpl();
		};
		var getTopNotification = function () {
			return Optional.from(notifications[0]);
		};
		var isEqual = function (a, b) {
			return a.type === b.type && a.text === b.text && !a.progressBar && !a.timeout && !b.progressBar && !b.timeout;
		};
		var reposition = function () {
			if (notifications.length > 0) {
				getImplementation().reposition(notifications);
			}
		};
		var addNotification = function (notification) {
			notifications.push(notification);
		};
		var closeNotification = function (notification) {
			findIndex(notifications, function (otherNotification) {
				return otherNotification === notification;
			}).each(function (index) {
				notifications.splice(index, 1);
			});
		};
		var open = function (spec, fireEvent) {
			if (fireEvent === void 0) {
				fireEvent = true;
			}
			if (editor.removed || !isEditorAttachedToDom(editor)) {
				return;
			}
			if (fireEvent) {
				editor.fire('BeforeOpenNotification', { notification: spec });
			}
			return find(notifications, function (notification) {
				return isEqual(getImplementation().getArgs(notification), spec);
			}).getOrThunk(function () {
				editor.editorManager.setActive(editor);
				var notification = getImplementation().open(spec, function () {
					closeNotification(notification);
					reposition();
					getTopNotification().fold(function () {
						return editor.focus();
					}, function (top) {
						return focus(SugarElement.fromDom(top.getEl()));
					});
				});
				addNotification(notification);
				reposition();
				editor.fire('OpenNotification', __assign({}, notification));
				return notification;
			});
		};
		var close = function () {
			getTopNotification().each(function (notification) {
				getImplementation().close(notification);
				closeNotification(notification);
				reposition();
			});
		};
		var getNotifications = function () {
			return notifications;
		};
		var registerEvents = function (editor) {
			editor.on('SkinLoaded', function () {
				var serviceMessage = getServiceMessage(editor);
				if (serviceMessage) {
					open({
						text: serviceMessage,
						type: 'warning',
						timeout: 0
					}, false);
				}
			});
			editor.on('ResizeEditor ResizeWindow NodeChange', function () {
				Delay.requestAnimationFrame(reposition);
			});
			editor.on('remove', function () {
				each(notifications.slice(), function (notification) {
					getImplementation().close(notification);
				});
			});
		};
		registerEvents(editor);
		return {
			open: open,
			close: close,
			getNotifications: getNotifications
		};
	}

	var PluginManager = AddOnManager$1.PluginManager;

	var ThemeManager = AddOnManager$1.ThemeManager;

	function WindowManagerImpl() {
		var unimplemented = function () {
			throw new Error('Theme did not provide a WindowManager implementation.');
		};
		return {
			open: unimplemented,
			openUrl: unimplemented,
			alert: unimplemented,
			confirm: unimplemented,
			close: unimplemented,
			getParams: unimplemented,
			setParams: unimplemented
		};
	}

	var WindowManager = function (editor) {
		var dialogs = [];
		var getImplementation = function () {
			var theme = editor.theme;
			return theme && theme.getWindowManagerImpl ? theme.getWindowManagerImpl() : WindowManagerImpl();
		};
		var funcBind = function (scope, f) {
			return function () {
				return f ? f.apply(scope, arguments) : undefined;
			};
		};
		var fireOpenEvent = function (dialog) {
			editor.fire('OpenWindow', { dialog: dialog });
		};
		var fireCloseEvent = function (dialog) {
			editor.fire('CloseWindow', { dialog: dialog });
		};
		var addDialog = function (dialog) {
			dialogs.push(dialog);
			fireOpenEvent(dialog);
		};
		var closeDialog = function (dialog) {
			fireCloseEvent(dialog);
			dialogs = filter(dialogs, function (otherDialog) {
				return otherDialog !== dialog;
			});
			if (dialogs.length === 0) {
				editor.focus();
			}
		};
		var getTopDialog = function () {
			return Optional.from(dialogs[dialogs.length - 1]);
		};
		var storeSelectionAndOpenDialog = function (openDialog) {
			editor.editorManager.setActive(editor);
			store(editor);
			var dialog = openDialog();
			addDialog(dialog);
			return dialog;
		};
		var open = function (args, params) {
			return storeSelectionAndOpenDialog(function () {
				return getImplementation().open(args, params, closeDialog);
			});
		};
		var openUrl = function (args) {
			return storeSelectionAndOpenDialog(function () {
				return getImplementation().openUrl(args, closeDialog);
			});
		};
		var alert = function (message, callback, scope) {
			getImplementation().alert(message, funcBind(scope ? scope : this, callback));
		};
		var confirm = function (message, callback, scope) {
			getImplementation().confirm(message, funcBind(scope ? scope : this, callback));
		};
		var close = function () {
			getTopDialog().each(function (dialog) {
				getImplementation().close(dialog);
				closeDialog(dialog);
			});
		};
		editor.on('remove', function () {
			each(dialogs, function (dialog) {
				getImplementation().close(dialog);
			});
		});
		return {
			open: open,
			openUrl: openUrl,
			alert: alert,
			confirm: confirm,
			close: close
		};
	};

	var displayNotification = function (editor, message) {
		editor.notificationManager.open({
			type: 'error',
			text: message
		});
	};
	var displayError = function (editor, message) {
		if (editor._skinLoaded) {
			displayNotification(editor, message);
		} else {
			editor.on('SkinLoaded', function () {
				displayNotification(editor, message);
			});
		}
	};
	var uploadError = function (editor, message) {
		displayError(editor, I18n.translate([
			'Failed to upload image: {0}',
			message
		]));
	};
	var logError = function (editor, errorType, msg) {
		fireError(editor, errorType, { message: msg });
		console.error(msg);
	};
	var createLoadError = function (type, url, name) {
		return name ? 'Failed to load ' + type + ': ' + name + ' from url ' + url : 'Failed to load ' + type + ' url: ' + url;
	};
	var pluginLoadError = function (editor, url, name) {
		logError(editor, 'PluginLoadError', createLoadError('plugin', url, name));
	};
	var iconsLoadError = function (editor, url, name) {
		logError(editor, 'IconsLoadError', createLoadError('icons', url, name));
	};
	var languageLoadError = function (editor, url, name) {
		logError(editor, 'LanguageLoadError', createLoadError('language', url, name));
	};
	var pluginInitError = function (editor, name, err) {
		var message = I18n.translate([
			'Failed to initialize plugin: {0}',
			name
		]);
		initError(message, err);
		displayError(editor, message);
	};
	var initError = function (message) {
		var x = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			x[_i - 1] = arguments[_i];
		}
		var console = window.console;
		if (console) {
			if (console.error) {
				console.error.apply(console, __spreadArrays([message], x));
			} else {
				console.log.apply(console, __spreadArrays([message], x));
			}
		}
	};

	var isContentCssSkinName = function (url) {
		return /^[a-z0-9\-]+$/i.test(url);
	};
	var getContentCssUrls = function (editor) {
		var contentCss = getContentCss(editor);
		var skinUrl = editor.editorManager.baseURL + '/skins/content';
		var suffix = editor.editorManager.suffix;
		var contentCssFile = 'content' + suffix + '.css';
		var inline = editor.inline === true;
		return map(contentCss, function (url) {
			if (isContentCssSkinName(url) && !inline) {
				return skinUrl + '/' + url + '/' + contentCssFile;
			} else {
				return editor.documentBaseURI.toAbsolute(url);
			}
		});
	};
	var appendContentCssFromSettings = function (editor) {
		editor.contentCSS = editor.contentCSS.concat(getContentCssUrls(editor));
	};

	function Uploader(uploadStatus, settings) {
		var pendingPromises = {};
		var pathJoin = function (path1, path2) {
			if (path1) {
				return path1.replace(/\/$/, '') + '/' + path2.replace(/^\//, '');
			}
			return path2;
		};
		var defaultHandler = function (blobInfo, success, failure, progress) {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', settings.url);
			xhr.withCredentials = settings.credentials;
			xhr.upload.onprogress = function (e) {
				progress(e.loaded / e.total * 100);
			};
			xhr.onerror = function () {
				failure('Image upload failed due to a XHR Transport error. Code: ' + xhr.status);
			};
			xhr.onload = function () {
				if (xhr.status < 200 || xhr.status >= 300) {
					failure('HTTP Error: ' + xhr.status);
					return;
				}
				var json = JSON.parse(xhr.responseText);
				if (!json || typeof json.location !== 'string') {
					failure('Invalid JSON: ' + xhr.responseText);
					return;
				}
				success(pathJoin(settings.basePath, json.location));
			};
			var formData = new FormData();
			formData.append('file', blobInfo.blob(), blobInfo.filename());
			xhr.send(formData);
		};
		var noUpload = function () {
			return new promiseObj(function (resolve) {
				resolve([]);
			});
		};
		var handlerSuccess = function (blobInfo, url) {
			return {
				url: url,
				blobInfo: blobInfo,
				status: true
			};
		};
		var handlerFailure = function (blobInfo, message, options) {
			return {
				url: '',
				blobInfo: blobInfo,
				status: false,
				error: {
					message: message,
					options: options
				}
			};
		};
		var resolvePending = function (blobUri, result) {
			Tools.each(pendingPromises[blobUri], function (resolve) {
				resolve(result);
			});
			delete pendingPromises[blobUri];
		};
		var uploadBlobInfo = function (blobInfo, handler, openNotification) {
			uploadStatus.markPending(blobInfo.blobUri());
			return new promiseObj(function (resolve) {
				var notification, progress;
				var noop = function () {
				};
				try {
					var closeNotification_1 = function () {
						if (notification) {
							notification.close();
							progress = noop;
						}
					};
					var success = function (url) {
						closeNotification_1();
						uploadStatus.markUploaded(blobInfo.blobUri(), url);
						resolvePending(blobInfo.blobUri(), handlerSuccess(blobInfo, url));
						resolve(handlerSuccess(blobInfo, url));
					};
					var failure = function (error, options) {
						var failureOptions = options ? options : {};
						closeNotification_1();
						uploadStatus.removeFailed(blobInfo.blobUri());
						resolvePending(blobInfo.blobUri(), handlerFailure(blobInfo, error, failureOptions));
						resolve(handlerFailure(blobInfo, error, failureOptions));
					};
					progress = function (percent) {
						if (percent < 0 || percent > 100) {
							return;
						}
						if (!notification) {
							notification = openNotification();
						}
						notification.progressBar.value(percent);
					};
					handler(blobInfo, success, failure, progress);
				} catch (ex) {
					resolve(handlerFailure(blobInfo, ex.message, {}));
				}
			});
		};
		var isDefaultHandler = function (handler) {
			return handler === defaultHandler;
		};
		var pendingUploadBlobInfo = function (blobInfo) {
			var blobUri = blobInfo.blobUri();
			return new promiseObj(function (resolve) {
				pendingPromises[blobUri] = pendingPromises[blobUri] || [];
				pendingPromises[blobUri].push(resolve);
			});
		};
		var uploadBlobs = function (blobInfos, openNotification) {
			blobInfos = Tools.grep(blobInfos, function (blobInfo) {
				return !uploadStatus.isUploaded(blobInfo.blobUri());
			});
			return promiseObj.all(Tools.map(blobInfos, function (blobInfo) {
				return uploadStatus.isPending(blobInfo.blobUri()) ? pendingUploadBlobInfo(blobInfo) : uploadBlobInfo(blobInfo, settings.handler, openNotification);
			}));
		};
		var upload = function (blobInfos, openNotification) {
			return !settings.url && isDefaultHandler(settings.handler) ? noUpload() : uploadBlobs(blobInfos, openNotification);
		};
		if (isFunction(settings.handler) === false) {
			settings.handler = defaultHandler;
		}
		return { upload: upload };
	}

	function UploadStatus() {
		var PENDING = 1, UPLOADED = 2;
		var blobUriStatuses = {};
		var createStatus = function (status, resultUri) {
			return {
				status: status,
				resultUri: resultUri
			};
		};
		var hasBlobUri = function (blobUri) {
			return blobUri in blobUriStatuses;
		};
		var getResultUri = function (blobUri) {
			var result = blobUriStatuses[blobUri];
			return result ? result.resultUri : null;
		};
		var isPending = function (blobUri) {
			return hasBlobUri(blobUri) ? blobUriStatuses[blobUri].status === PENDING : false;
		};
		var isUploaded = function (blobUri) {
			return hasBlobUri(blobUri) ? blobUriStatuses[blobUri].status === UPLOADED : false;
		};
		var markPending = function (blobUri) {
			blobUriStatuses[blobUri] = createStatus(PENDING, null);
		};
		var markUploaded = function (blobUri, resultUri) {
			blobUriStatuses[blobUri] = createStatus(UPLOADED, resultUri);
		};
		var removeFailed = function (blobUri) {
			delete blobUriStatuses[blobUri];
		};
		var destroy = function () {
			blobUriStatuses = {};
		};
		return {
			hasBlobUri: hasBlobUri,
			getResultUri: getResultUri,
			isPending: isPending,
			isUploaded: isUploaded,
			markPending: markPending,
			markUploaded: markUploaded,
			removeFailed: removeFailed,
			destroy: destroy
		};
	}

	var count$1 = 0;
	var seed = function () {
		var rnd = function () {
			return Math.round(Math.random() * 4294967295).toString(36);
		};
		var now = new Date().getTime();
		return 's' + now.toString(36) + rnd() + rnd() + rnd();
	};
	var uuid = function (prefix) {
		return prefix + count$1++ + seed();
	};

	var BlobCache = function () {
		var cache = [];
		var mimeToExt = function (mime) {
			var mimes = {
				'image/jpeg': 'jpg',
				'image/jpg': 'jpg',
				'image/gif': 'gif',
				'image/png': 'png',
				'image/apng': 'apng',
				'image/avif': 'avif',
				'image/svg+xml': 'svg',
				'image/webp': 'webp',
				'image/bmp': 'bmp',
				'image/tiff': 'tiff'
			};
			return mimes[mime.toLowerCase()] || 'dat';
		};
		var create = function (o, blob, base64, name, filename) {
			if (isString(o)) {
				var id = o;
				return toBlobInfo({
					id: id,
					name: name,
					filename: filename,
					blob: blob,
					base64: base64
				});
			} else if (isObject(o)) {
				return toBlobInfo(o);
			} else {
				throw new Error('Unknown input type');
			}
		};
		var toBlobInfo = function (o) {
			if (!o.blob || !o.base64) {
				throw new Error('blob and base64 representations of the image are required for BlobInfo to be created');
			}
			var id = o.id || uuid('blobid');
			var name = o.name || id;
			var blob = o.blob;
			return {
				id: constant(id),
				name: constant(name),
				filename: constant(o.filename || name + '.' + mimeToExt(blob.type)),
				blob: constant(blob),
				base64: constant(o.base64),
				blobUri: constant(o.blobUri || URL.createObjectURL(blob)),
				uri: constant(o.uri)
			};
		};
		var add = function (blobInfo) {
			if (!get(blobInfo.id())) {
				cache.push(blobInfo);
			}
		};
		var findFirst = function (predicate) {
			return find(cache, predicate).getOrUndefined();
		};
		var get = function (id) {
			return findFirst(function (cachedBlobInfo) {
				return cachedBlobInfo.id() === id;
			});
		};
		var getByUri = function (blobUri) {
			return findFirst(function (blobInfo) {
				return blobInfo.blobUri() === blobUri;
			});
		};
		var getByData = function (base64, type) {
			return findFirst(function (blobInfo) {
				return blobInfo.base64() === base64 && blobInfo.blob().type === type;
			});
		};
		var removeByUri = function (blobUri) {
			cache = filter(cache, function (blobInfo) {
				if (blobInfo.blobUri() === blobUri) {
					URL.revokeObjectURL(blobInfo.blobUri());
					return false;
				}
				return true;
			});
		};
		var destroy = function () {
			each(cache, function (cachedBlobInfo) {
				URL.revokeObjectURL(cachedBlobInfo.blobUri());
			});
			cache = [];
		};
		return {
			create: create,
			add: add,
			get: get,
			getByUri: getByUri,
			getByData: getByData,
			findFirst: findFirst,
			removeByUri: removeByUri,
			destroy: destroy
		};
	};

	var UploadChangeHandler = function (editor) {
		var lastChangedLevel = Cell(null);
		editor.on('change AddUndo', function (e) {
			lastChangedLevel.set(__assign({}, e.level));
		});
		var fireIfChanged = function () {
			var data = editor.undoManager.data;
			last(data).filter(function (level) {
				return !isEq$4(lastChangedLevel.get(), level);
			}).each(function (level) {
				editor.setDirty(true);
				editor.fire('change', {
					level: level,
					lastLevel: get(data, data.length - 2).getOrNull()
				});
			});
		};
		return { fireIfChanged: fireIfChanged };
	};
	var EditorUpload = function (editor) {
		var blobCache = BlobCache();
		var uploader, imageScanner;
		var uploadStatus = UploadStatus();
		var urlFilters = [];
		var changeHandler = UploadChangeHandler(editor);
		var aliveGuard = function (callback) {
			return function (result) {
				if (editor.selection) {
					return callback(result);
				}
				return [];
			};
		};
		var cacheInvalidator = function (url) {
			return url + (url.indexOf('?') === -1 ? '?' : '&') + new Date().getTime();
		};
		var replaceString = function (content, search, replace) {
			var index = 0;
			do {
				index = content.indexOf(search, index);
				if (index !== -1) {
					content = content.substring(0, index) + replace + content.substr(index + search.length);
					index += replace.length - search.length + 1;
				}
			} while (index !== -1);
			return content;
		};
		var replaceImageUrl = function (content, targetUrl, replacementUrl) {
			var replacementString = 'src="' + replacementUrl + '"' + (replacementUrl === Env.transparentSrc ? ' data-mce-placeholder="1"' : '');
			content = replaceString(content, 'src="' + targetUrl + '"', replacementString);
			content = replaceString(content, 'data-mce-src="' + targetUrl + '"', 'data-mce-src="' + replacementUrl + '"');
			return content;
		};
		var replaceUrlInUndoStack = function (targetUrl, replacementUrl) {
			each(editor.undoManager.data, function (level) {
				if (level.type === 'fragmented') {
					level.fragments = map(level.fragments, function (fragment) {
						return replaceImageUrl(fragment, targetUrl, replacementUrl);
					});
				} else {
					level.content = replaceImageUrl(level.content, targetUrl, replacementUrl);
				}
			});
		};
		var openNotification = function () {
			return editor.notificationManager.open({
				text: editor.translate('Image uploading...'),
				type: 'info',
				timeout: -1,
				progressBar: true
			});
		};
		var replaceImageUriInView = function (image, resultUri) {
			var src = editor.convertURL(resultUri, 'src');
			replaceUrlInUndoStack(image.src, resultUri);
			editor.$(image).attr({
				'src': shouldReuseFileName(editor) ? cacheInvalidator(resultUri) : resultUri,
				'data-mce-src': src
			});
		};
		var uploadImages = function (callback) {
			if (!uploader) {
				uploader = Uploader(uploadStatus, {
					url: getImageUploadUrl(editor),
					basePath: getImageUploadBasePath(editor),
					credentials: getImagesUploadCredentials(editor),
					handler: getImagesUploadHandler(editor)
				});
			}
			return scanForImages().then(aliveGuard(function (imageInfos) {
				var blobInfos = map(imageInfos, function (imageInfo) {
					return imageInfo.blobInfo;
				});
				return uploader.upload(blobInfos, openNotification).then(aliveGuard(function (result) {
					var imagesToRemove = [];
					var filteredResult = map(result, function (uploadInfo, index) {
						var blobInfo = imageInfos[index].blobInfo;
						var image = imageInfos[index].image;
						if (uploadInfo.status && shouldReplaceBlobUris(editor)) {
							blobCache.removeByUri(image.src);
							replaceImageUriInView(image, uploadInfo.url);
						} else if (uploadInfo.error) {
							if (uploadInfo.error.options.remove) {
								replaceUrlInUndoStack(image.getAttribute('src'), Env.transparentSrc);
								imagesToRemove.push(image);
							}
							uploadError(editor, uploadInfo.error.message);
						}
						return {
							element: image,
							status: uploadInfo.status,
							uploadUri: uploadInfo.url,
							blobInfo: blobInfo
						};
					});
					if (filteredResult.length > 0) {
						changeHandler.fireIfChanged();
					}
					if (imagesToRemove.length > 0) {
						if (isRtc(editor)) {
							console.error('Removing images on failed uploads is currently unsupported for RTC');
						} else {
							editor.undoManager.transact(function () {
								each(imagesToRemove, function (element) {
									editor.dom.remove(element);
									blobCache.removeByUri(element.src);
								});
							});
						}
					}
					if (callback) {
						callback(filteredResult);
					}
					return filteredResult;
				}));
			}));
		};
		var uploadImagesAuto = function (callback) {
			if (isAutomaticUploadsEnabled(editor)) {
				return uploadImages(callback);
			}
		};
		var isValidDataUriImage = function (imgElm) {
			if (forall(urlFilters, function (filter) {
				return filter(imgElm);
			}) === false) {
				return false;
			}
			if (imgElm.getAttribute('src').indexOf('data:') === 0) {
				var dataImgFilter = getImagesDataImgFilter(editor);
				return dataImgFilter(imgElm);
			}
			return true;
		};
		var addFilter = function (filter) {
			urlFilters.push(filter);
		};
		var scanForImages = function () {
			if (!imageScanner) {
				imageScanner = ImageScanner(uploadStatus, blobCache);
			}
			return imageScanner.findAll(editor.getBody(), isValidDataUriImage).then(aliveGuard(function (result) {
				result = filter(result, function (resultItem) {
					if (typeof resultItem === 'string') {
						displayError(editor, resultItem);
						return false;
					}
					return true;
				});
				each(result, function (resultItem) {
					replaceUrlInUndoStack(resultItem.image.src, resultItem.blobInfo.blobUri());
					resultItem.image.src = resultItem.blobInfo.blobUri();
					resultItem.image.removeAttribute('data-mce-src');
				});
				return result;
			}));
		};
		var destroy = function () {
			blobCache.destroy();
			uploadStatus.destroy();
			imageScanner = uploader = null;
		};
		var replaceBlobUris = function (content) {
			return content.replace(/src="(blob:[^"]+)"/g, function (match, blobUri) {
				var resultUri = uploadStatus.getResultUri(blobUri);
				if (resultUri) {
					return 'src="' + resultUri + '"';
				}
				var blobInfo = blobCache.getByUri(blobUri);
				if (!blobInfo) {
					blobInfo = foldl(editor.editorManager.get(), function (result, editor) {
						return result || editor.editorUpload && editor.editorUpload.blobCache.getByUri(blobUri);
					}, null);
				}
				if (blobInfo) {
					var blob = blobInfo.blob();
					return 'src="data:' + blob.type + ';base64,' + blobInfo.base64() + '"';
				}
				return match;
			});
		};
		editor.on('SetContent', function () {
			if (isAutomaticUploadsEnabled(editor)) {
				uploadImagesAuto();
			} else {
				scanForImages();
			}
		});
		editor.on('RawSaveContent', function (e) {
			e.content = replaceBlobUris(e.content);
		});
		editor.on('GetContent', function (e) {
			if (e.source_view || e.format === 'raw' || e.format === 'tree') {
				return;
			}
			e.content = replaceBlobUris(e.content);
		});
		editor.on('PostRender', function () {
			editor.parser.addNodeFilter('img', function (images) {
				each(images, function (img) {
					var src = img.attr('src');
					if (blobCache.getByUri(src)) {
						return;
					}
					var resultUri = uploadStatus.getResultUri(src);
					if (resultUri) {
						img.attr('src', resultUri);
					}
				});
			});
		});
		return {
			blobCache: blobCache,
			addFilter: addFilter,
			uploadImages: uploadImages,
			uploadImagesAuto: uploadImagesAuto,
			scanForImages: scanForImages,
			destroy: destroy
		};
	};

	var get$a = function (dom) {
		var formats = {
			valigntop: [{
				selector: 'td,th',
				styles: { verticalAlign: 'top' }
			}],
			valignmiddle: [{
				selector: 'td,th',
				styles: { verticalAlign: 'middle' }
			}],
			valignbottom: [{
				selector: 'td,th',
				styles: { verticalAlign: 'bottom' }
			}],
			alignleft: [
				{
					selector: 'figure.image',
					collapsed: false,
					classes: 'align-left',
					ceFalseOverride: true,
					preview: 'font-family font-size'
				},
				{
					selector: 'figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li',
					styles: { textAlign: 'left' },
					inherit: false,
					preview: false,
					defaultBlock: 'div'
				},
				{
					selector: 'img,table',
					collapsed: false,
					styles: { float: 'left' },
					preview: 'font-family font-size'
				}
			],
			aligncenter: [
				{
					selector: 'figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li',
					styles: { textAlign: 'center' },
					inherit: false,
					preview: 'font-family font-size',
					defaultBlock: 'div'
				},
				{
					selector: 'figure.image',
					collapsed: false,
					classes: 'align-center',
					ceFalseOverride: true,
					preview: 'font-family font-size'
				},
				{
					selector: 'img',
					collapsed: false,
					styles: {
						display: 'block',
						marginLeft: 'auto',
						marginRight: 'auto'
					},
					preview: false
				},
				{
					selector: 'table',
					collapsed: false,
					styles: {
						marginLeft: 'auto',
						marginRight: 'auto'
					},
					preview: 'font-family font-size'
				}
			],
			alignright: [
				{
					selector: 'figure.image',
					collapsed: false,
					classes: 'align-right',
					ceFalseOverride: true,
					preview: 'font-family font-size'
				},
				{
					selector: 'figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li',
					styles: { textAlign: 'right' },
					inherit: false,
					preview: 'font-family font-size',
					defaultBlock: 'div'
				},
				{
					selector: 'img,table',
					collapsed: false,
					styles: { float: 'right' },
					preview: 'font-family font-size'
				}
			],
			alignjustify: [{
				selector: 'figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li',
				styles: { textAlign: 'justify' },
				inherit: false,
				defaultBlock: 'div',
				preview: 'font-family font-size'
			}],
			bold: [
				{
					inline: 'strong',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				},
				{
					inline: 'span',
					styles: { fontWeight: 'bold' }
				},
				{
					inline: 'b',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				}
			],
			italic: [
				{
					inline: 'em',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				},
				{
					inline: 'span',
					styles: { fontStyle: 'italic' }
				},
				{
					inline: 'i',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				}
			],
			underline: [
				{
					inline: 'span',
					styles: { textDecoration: 'underline' },
					exact: true
				},
				{
					inline: 'u',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				}
			],
			strikethrough: [
				{
					inline: 'span',
					styles: { textDecoration: 'line-through' },
					exact: true
				},
				{
					inline: 'strike',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				},
				{
					inline: 's',
					remove: 'all',
					preserve_attributes: [
						'class',
						'style'
					]
				}
			],
			forecolor: {
				inline: 'span',
				styles: { color: '%value' },
				links: true,
				remove_similar: true,
				clear_child_styles: true
			},
			hilitecolor: {
				inline: 'span',
				styles: { backgroundColor: '%value' },
				links: true,
				remove_similar: true,
				clear_child_styles: true
			},
			fontname: {
				inline: 'span',
				toggle: false,
				styles: { fontFamily: '%value' },
				clear_child_styles: true
			},
			fontsize: {
				inline: 'span',
				toggle: false,
				styles: { fontSize: '%value' },
				clear_child_styles: true
			},
			lineheight: {
				selector: 'h1,h2,h3,h4,h5,h6,p,li,td,th,div',
				defaultBlock: 'p',
				styles: { lineHeight: '%value' }
			},
			fontsize_class: {
				inline: 'span',
				attributes: { class: '%value' }
			},
			blockquote: {
				block: 'blockquote',
				wrapper: true,
				remove: 'all'
			},
			subscript: { inline: 'sub' },
			superscript: { inline: 'sup' },
			code: { inline: 'code' },
			link: {
				inline: 'a',
				selector: 'a',
				remove: 'all',
				split: true,
				deep: true,
				onmatch: function (node, _fmt, _itemName) {
					return isElement$1(node) && node.hasAttribute('href');
				},
				onformat: function (elm, _fmt, vars) {
					Tools.each(vars, function (value, key) {
						dom.setAttrib(elm, key, value);
					});
				}
			},
			removeformat: [
				{
					selector: 'b,strong,em,i,font,u,strike,s,sub,sup,dfn,code,samp,kbd,var,cite,mark,q,del,ins',
					remove: 'all',
					split: true,
					expand: false,
					block_expand: true,
					deep: true
				},
				{
					selector: 'span',
					attributes: [
						'style',
						'class'
					],
					remove: 'empty',
					split: true,
					expand: false,
					deep: true
				},
				{
					selector: '*',
					attributes: [
						'style',
						'class'
					],
					split: false,
					expand: false,
					deep: true
				}
			]
		};
		Tools.each('p h1 h2 h3 h4 h5 h6 div address pre div dt dd samp'.split(/\s/), function (name) {
			formats[name] = {
				block: name,
				remove: 'all'
			};
		});
		return formats;
	};

	function FormatRegistry(editor) {
		var formats = {};
		var get = function (name) {
			return name ? formats[name] : formats;
		};
		var has$1 = function (name) {
			return has(formats, name);
		};
		var register = function (name, format) {
			if (name) {
				if (typeof name !== 'string') {
					Tools.each(name, function (format, name) {
						register(name, format);
					});
				} else {
					if (!isArray(format)) {
						format = [format];
					}
					Tools.each(format, function (format) {
						if (typeof format.deep === 'undefined') {
							format.deep = !format.selector;
						}
						if (typeof format.split === 'undefined') {
							format.split = !format.selector || format.inline;
						}
						if (typeof format.remove === 'undefined' && format.selector && !format.inline) {
							format.remove = 'none';
						}
						if (format.selector && format.inline) {
							format.mixed = true;
							format.block_expand = true;
						}
						if (typeof format.classes === 'string') {
							format.classes = format.classes.split(/\s+/);
						}
					});
					formats[name] = format;
				}
			}
		};
		var unregister = function (name) {
			if (name && formats[name]) {
				delete formats[name];
			}
			return formats;
		};
		register(get$a(editor.dom));
		register(getFormats(editor));
		return {
			get: get,
			has: has$1,
			register: register,
			unregister: unregister
		};
	}

	var each$e = Tools.each;
	var dom = DOMUtils$1.DOM;
	var parsedSelectorToHtml = function (ancestry, editor) {
		var elm, item, fragment;
		var schema = editor && editor.schema || Schema({});
		var decorate = function (elm, item) {
			if (item.classes.length) {
				dom.addClass(elm, item.classes.join(' '));
			}
			dom.setAttribs(elm, item.attrs);
		};
		var createElement = function (sItem) {
			item = typeof sItem === 'string' ? {
				name: sItem,
				classes: [],
				attrs: {}
			} : sItem;
			var elm = dom.create(item.name);
			decorate(elm, item);
			return elm;
		};
		var getRequiredParent = function (elm, candidate) {
			var name = typeof elm !== 'string' ? elm.nodeName.toLowerCase() : elm;
			var elmRule = schema.getElementRule(name);
			var parentsRequired = elmRule && elmRule.parentsRequired;
			if (parentsRequired && parentsRequired.length) {
				return candidate && Tools.inArray(parentsRequired, candidate) !== -1 ? candidate : parentsRequired[0];
			} else {
				return false;
			}
		};
		var wrapInHtml = function (elm, ancestry, siblings) {
			var parent, parentCandidate;
			var ancestor = ancestry.length > 0 && ancestry[0];
			var ancestorName = ancestor && ancestor.name;
			var parentRequired = getRequiredParent(elm, ancestorName);
			if (parentRequired) {
				if (ancestorName === parentRequired) {
					parentCandidate = ancestry[0];
					ancestry = ancestry.slice(1);
				} else {
					parentCandidate = parentRequired;
				}
			} else if (ancestor) {
				parentCandidate = ancestry[0];
				ancestry = ancestry.slice(1);
			} else if (!siblings) {
				return elm;
			}
			if (parentCandidate) {
				parent = createElement(parentCandidate);
				parent.appendChild(elm);
			}
			if (siblings) {
				if (!parent) {
					parent = dom.create('div');
					parent.appendChild(elm);
				}
				Tools.each(siblings, function (sibling) {
					var siblingElm = createElement(sibling);
					parent.insertBefore(siblingElm, elm);
				});
			}
			return wrapInHtml(parent, ancestry, parentCandidate && parentCandidate.siblings);
		};
		if (ancestry && ancestry.length) {
			item = ancestry[0];
			elm = createElement(item);
			fragment = dom.create('div');
			fragment.appendChild(wrapInHtml(elm, ancestry.slice(1), item.siblings));
			return fragment;
		} else {
			return '';
		}
	};
	var parseSelectorItem = function (item) {
		var tagName;
		var obj = {
			classes: [],
			attrs: {}
		};
		item = obj.selector = Tools.trim(item);
		if (item !== '*') {
			tagName = item.replace(/(?:([#\.]|::?)([\w\-]+)|(\[)([^\]]+)\]?)/g, function ($0, $1, $2, $3, $4) {
				switch ($1) {
					case '#':
						obj.attrs.id = $2;
						break;
					case '.':
						obj.classes.push($2);
						break;
					case ':':
						if (Tools.inArray('checked disabled enabled read-only required'.split(' '), $2) !== -1) {
							obj.attrs[$2] = $2;
						}
						break;
				}
				if ($3 === '[') {
					var m = $4.match(/([\w\-]+)(?:\=\"([^\"]+))?/);
					if (m) {
						obj.attrs[m[1]] = m[2];
					}
				}
				return '';
			});
		}
		obj.name = tagName || 'div';
		return obj;
	};
	var parseSelector = function (selector) {
		if (!selector || typeof selector !== 'string') {
			return [];
		}
		selector = selector.split(/\s*,\s*/)[0];
		selector = selector.replace(/\s*(~\+|~|\+|>)\s*/g, '$1');
		return Tools.map(selector.split(/(?:>|\s+(?![^\[\]]+\]))/), function (item) {
			var siblings = Tools.map(item.split(/(?:~\+|~|\+)/), parseSelectorItem);
			var obj = siblings.pop();
			if (siblings.length) {
				obj.siblings = siblings;
			}
			return obj;
		}).reverse();
	};
	var getCssText = function (editor, format) {
		var name, previewFrag;
		var previewCss = '', parentFontSize;
		var previewStyles = getPreviewStyles(editor);
		if (previewStyles === '') {
			return '';
		}
		var removeVars = function (val) {
			return val.replace(/%(\w+)/g, '');
		};
		if (typeof format === 'string') {
			format = editor.formatter.get(format);
			if (!format) {
				return;
			}
			format = format[0];
		}
		if ('preview' in format) {
			var previewOpt = get$1(format, 'preview');
			if (previewOpt.is(false)) {
				return '';
			} else {
				previewStyles = previewOpt.getOr(previewStyles);
			}
		}
		name = format.block || format.inline || 'span';
		var items = parseSelector(format.selector);
		if (items.length) {
			if (!items[0].name) {
				items[0].name = name;
			}
			name = format.selector;
			previewFrag = parsedSelectorToHtml(items, editor);
		} else {
			previewFrag = parsedSelectorToHtml([name], editor);
		}
		var previewElm = dom.select(name, previewFrag)[0] || previewFrag.firstChild;
		each$e(format.styles, function (value, name) {
			var newValue = removeVars(value);
			if (newValue) {
				dom.setStyle(previewElm, name, newValue);
			}
		});
		each$e(format.attributes, function (value, name) {
			var newValue = removeVars(value);
			if (newValue) {
				dom.setAttrib(previewElm, name, newValue);
			}
		});
		each$e(format.classes, function (value) {
			var newValue = removeVars(value);
			if (!dom.hasClass(previewElm, newValue)) {
				dom.addClass(previewElm, newValue);
			}
		});
		editor.fire('PreviewFormats');
		dom.setStyles(previewFrag, {
			position: 'absolute',
			left: -65535
		});
		editor.getBody().appendChild(previewFrag);
		parentFontSize = dom.getStyle(editor.getBody(), 'fontSize', true);
		parentFontSize = /px$/.test(parentFontSize) ? parseInt(parentFontSize, 10) : 0;
		each$e(previewStyles.split(' '), function (name) {
			var value = dom.getStyle(previewElm, name, true);
			if (name === 'background-color' && /transparent|rgba\s*\([^)]+,\s*0\)/.test(value)) {
				value = dom.getStyle(editor.getBody(), name, true);
				if (dom.toHex(value).toLowerCase() === '#ffffff') {
					return;
				}
			}
			if (name === 'color') {
				if (dom.toHex(value).toLowerCase() === '#000000') {
					return;
				}
			}
			if (name === 'font-size') {
				if (/em|%$/.test(value)) {
					if (parentFontSize === 0) {
						return;
					}
					var numValue = parseFloat(value) / (/%$/.test(value) ? 100 : 1);
					value = numValue * parentFontSize + 'px';
				}
			}
			if (name === 'border' && value) {
				previewCss += 'padding:0 2px;';
			}
			previewCss += name + ':' + value + ';';
		});
		editor.fire('AfterPreviewFormats');
		dom.remove(previewFrag);
		return previewCss;
	};

	var setup$6 = function (editor) {
		editor.addShortcut('meta+b', '', 'Bold');
		editor.addShortcut('meta+i', '', 'Italic');
		editor.addShortcut('meta+u', '', 'Underline');
		for (var i = 1; i <= 6; i++) {
			editor.addShortcut('access+' + i, '', [
				'FormatBlock',
				false,
				'h' + i
			]);
		}
		editor.addShortcut('access+7', '', [
			'FormatBlock',
			false,
			'p'
		]);
		editor.addShortcut('access+8', '', [
			'FormatBlock',
			false,
			'div'
		]);
		editor.addShortcut('access+9', '', [
			'FormatBlock',
			false,
			'address'
		]);
	};

	var Formatter = function (editor) {
		var formats = FormatRegistry(editor);
		var formatChangeState = Cell(null);
		setup$6(editor);
		setup$3(editor);
		return {
			get: formats.get,
			has: formats.has,
			register: formats.register,
			unregister: formats.unregister,
			apply: function (name, vars, node) {
				applyFormat$1(editor, name, vars, node);
			},
			remove: function (name, vars, node, similar) {
				removeFormat$1(editor, name, vars, node, similar);
			},
			toggle: function (name, vars, node) {
				toggleFormat(editor, name, vars, node);
			},
			match: function (name, vars, node) {
				return matchFormat(editor, name, vars, node);
			},
			closest: function (names) {
				return closestFormat(editor, names);
			},
			matchAll: function (names, vars) {
				return matchAllFormats(editor, names, vars);
			},
			matchNode: function (node, names, vars, similar) {
				return matchNodeFormat(editor, node, names, vars, similar);
			},
			canApply: function (name) {
				return canApplyFormat(editor, name);
			},
			formatChanged: function (formats, callback, similar) {
				return formatChanged(editor, formatChangeState, formats, callback, similar);
			},
			getCssText: curry(getCssText, editor)
		};
	};

	var registerEvents$1 = function (editor, undoManager, locks) {
		var isFirstTypedCharacter = Cell(false);
		var addNonTypingUndoLevel = function (e) {
			setTyping(undoManager, false, locks);
			undoManager.add({}, e);
		};
		editor.on('init', function () {
			undoManager.add();
		});
		editor.on('BeforeExecCommand', function (e) {
			var cmd = e.command.toLowerCase();
			if (cmd !== 'undo' && cmd !== 'redo' && cmd !== 'mcerepaint') {
				endTyping(undoManager, locks);
				undoManager.beforeChange();
			}
		});
		editor.on('ExecCommand', function (e) {
			var cmd = e.command.toLowerCase();
			if (cmd !== 'undo' && cmd !== 'redo' && cmd !== 'mcerepaint') {
				addNonTypingUndoLevel(e);
			}
		});
		editor.on('ObjectResizeStart cut', function () {
			undoManager.beforeChange();
		});
		editor.on('SaveContent ObjectResized blur', addNonTypingUndoLevel);
		editor.on('dragend', addNonTypingUndoLevel);
		editor.on('keyup', function (e) {
			var keyCode = e.keyCode;
			if (e.isDefaultPrevented()) {
				return;
			}
			if (keyCode >= 33 && keyCode <= 36 || keyCode >= 37 && keyCode <= 40 || keyCode === 45 || e.ctrlKey) {
				addNonTypingUndoLevel();
				editor.nodeChanged();
			}
			if (keyCode === 46 || keyCode === 8) {
				editor.nodeChanged();
			}
			if (isFirstTypedCharacter.get() && undoManager.typing && isEq$4(createFromEditor(editor), undoManager.data[0]) === false) {
				if (editor.isDirty() === false) {
					editor.setDirty(true);
					editor.fire('change', {
						level: undoManager.data[0],
						lastLevel: null
					});
				}
				editor.fire('TypingUndo');
				isFirstTypedCharacter.set(false);
				editor.nodeChanged();
			}
		});
		editor.on('keydown', function (e) {
			var keyCode = e.keyCode;
			if (e.isDefaultPrevented()) {
				return;
			}
			if (keyCode >= 33 && keyCode <= 36 || keyCode >= 37 && keyCode <= 40 || keyCode === 45) {
				if (undoManager.typing) {
					addNonTypingUndoLevel(e);
				}
				return;
			}
			var modKey = e.ctrlKey && !e.altKey || e.metaKey;
			if ((keyCode < 16 || keyCode > 20) && keyCode !== 224 && keyCode !== 91 && !undoManager.typing && !modKey) {
				undoManager.beforeChange();
				setTyping(undoManager, true, locks);
				undoManager.add({}, e);
				isFirstTypedCharacter.set(true);
			}
		});
		editor.on('mousedown', function (e) {
			if (undoManager.typing) {
				addNonTypingUndoLevel(e);
			}
		});
		var isInsertReplacementText = function (event) {
			return event.inputType === 'insertReplacementText';
		};
		var isInsertTextDataNull = function (event) {
			return event.inputType === 'insertText' && event.data === null;
		};
		var isInsertFromPasteOrDrop = function (event) {
			return event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop';
		};
		editor.on('input', function (e) {
			if (e.inputType && (isInsertReplacementText(e) || isInsertTextDataNull(e) || isInsertFromPasteOrDrop(e))) {
				addNonTypingUndoLevel(e);
			}
		});
		editor.on('AddUndo Undo Redo ClearUndos', function (e) {
			if (!e.isDefaultPrevented()) {
				editor.nodeChanged();
			}
		});
	};
	var addKeyboardShortcuts = function (editor) {
		editor.addShortcut('meta+z', '', 'Undo');
		editor.addShortcut('meta+y,meta+shift+z', '', 'Redo');
	};

	var UndoManager = function (editor) {
		var beforeBookmark = Cell(Optional.none());
		var locks = Cell(0);
		var index = Cell(0);
		var undoManager = {
			data: [],
			typing: false,
			beforeChange: function () {
				beforeChange$1(editor, locks, beforeBookmark);
			},
			add: function (level, event) {
				return addUndoLevel$1(editor, undoManager, index, locks, beforeBookmark, level, event);
			},
			undo: function () {
				return undo$1(editor, undoManager, locks, index);
			},
			redo: function () {
				return redo$1(editor, index, undoManager.data);
			},
			clear: function () {
				clear$1(editor, undoManager, index);
			},
			reset: function () {
				reset$1(editor, undoManager);
			},
			hasUndo: function () {
				return hasUndo$1(editor, undoManager, index);
			},
			hasRedo: function () {
				return hasRedo$1(editor, undoManager, index);
			},
			transact: function (callback) {
				return transact$1(editor, undoManager, locks, callback);
			},
			ignore: function (callback) {
				ignore$1(editor, locks, callback);
			},
			extra: function (callback1, callback2) {
				extra$1(editor, undoManager, index, callback1, callback2);
			}
		};
		if (!isRtc(editor)) {
			registerEvents$1(editor, undoManager, locks);
		}
		addKeyboardShortcuts(editor);
		return undoManager;
	};

	var nonTypingKeycodes = [
		9,
		27,
		VK.HOME,
		VK.END,
		19,
		20,
		44,
		144,
		145,
		33,
		34,
		45,
		16,
		17,
		18,
		91,
		92,
		93,
		VK.DOWN,
		VK.UP,
		VK.LEFT,
		VK.RIGHT
	].concat(Env.browser.isFirefox() ? [224] : []);
	var placeholderAttr = 'data-mce-placeholder';
	var isKeyboardEvent = function (e) {
		return e.type === 'keydown' || e.type === 'keyup';
	};
	var isDeleteEvent = function (e) {
		var keyCode = e.keyCode;
		return keyCode === VK.BACKSPACE || keyCode === VK.DELETE;
	};
	var isNonTypingKeyboardEvent = function (e) {
		if (isKeyboardEvent(e)) {
			var keyCode = e.keyCode;
			return !isDeleteEvent(e) && (VK.metaKeyPressed(e) || e.altKey || keyCode >= 112 && keyCode <= 123 || contains(nonTypingKeycodes, keyCode));
		} else {
			return false;
		}
	};
	var isTypingKeyboardEvent = function (e) {
		return isKeyboardEvent(e) && !(isDeleteEvent(e) || e.type === 'keyup' && e.keyCode === 229);
	};
	var isVisuallyEmpty = function (dom, rootElm, forcedRootBlock) {
		if (isEmpty(SugarElement.fromDom(rootElm), false)) {
			var isForcedRootBlockFalse = forcedRootBlock === '';
			var firstElement = rootElm.firstElementChild;
			if (!firstElement) {
				return true;
			} else if (dom.getStyle(rootElm.firstElementChild, 'padding-left') || dom.getStyle(rootElm.firstElementChild, 'padding-right')) {
				return false;
			} else {
				return isForcedRootBlockFalse ? !dom.isBlock(firstElement) : forcedRootBlock === firstElement.nodeName.toLowerCase();
			}
		} else {
			return false;
		}
	};
	var setup$7 = function (editor) {
		var dom = editor.dom;
		var rootBlock = getForcedRootBlock(editor);
		var placeholder = getPlaceholder(editor);
		var updatePlaceholder = function (e, initial) {
			if (isNonTypingKeyboardEvent(e)) {
				return;
			}
			var body = editor.getBody();
			var showPlaceholder = isTypingKeyboardEvent(e) ? false : isVisuallyEmpty(dom, body, rootBlock);
			var isPlaceholderShown = dom.getAttrib(body, placeholderAttr) !== '';
			if (isPlaceholderShown !== showPlaceholder || initial) {
				dom.setAttrib(body, placeholderAttr, showPlaceholder ? placeholder : null);
				dom.setAttrib(body, 'aria-placeholder', showPlaceholder ? placeholder : null);
				firePlaceholderToggle(editor, showPlaceholder);
				editor.on(showPlaceholder ? 'keydown' : 'keyup', updatePlaceholder);
				editor.off(showPlaceholder ? 'keyup' : 'keydown', updatePlaceholder);
			}
		};
		if (placeholder) {
			editor.on('init', function (e) {
				updatePlaceholder(e, true);
				editor.on('change SetContent ExecCommand', updatePlaceholder);
				editor.on('paste', function (e) {
					return Delay.setEditorTimeout(editor, function () {
						return updatePlaceholder(e);
					});
				});
			});
		}
	};

	var strongRtl = /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;
	var hasStrongRtl = function (text) {
		return strongRtl.test(text);
	};

	var isInlineTarget = function (editor, elm) {
		return is$1(SugarElement.fromDom(elm), getInlineBoundarySelector(editor));
	};
	var isRtl$1 = function (element) {
		return DOMUtils$1.DOM.getStyle(element, 'direction', true) === 'rtl' || hasStrongRtl(element.textContent);
	};
	var findInlineParents = function (isInlineTarget, rootNode, pos) {
		return filter(DOMUtils$1.DOM.getParents(pos.container(), '*', rootNode), isInlineTarget);
	};
	var findRootInline = function (isInlineTarget, rootNode, pos) {
		var parents = findInlineParents(isInlineTarget, rootNode, pos);
		return Optional.from(parents[parents.length - 1]);
	};
	var hasSameParentBlock = function (rootNode, node1, node2) {
		var block1 = getParentBlock(node1, rootNode);
		var block2 = getParentBlock(node2, rootNode);
		return block1 && block1 === block2;
	};
	var isAtZwsp = function (pos) {
		return isBeforeInline(pos) || isAfterInline(pos);
	};
	var normalizePosition = function (forward, pos) {
		if (!pos) {
			return pos;
		}
		var container = pos.container(), offset = pos.offset();
		if (forward) {
			if (isCaretContainerInline(container)) {
				if (isText$1(container.nextSibling)) {
					return CaretPosition$1(container.nextSibling, 0);
				} else {
					return CaretPosition$1.after(container);
				}
			} else {
				return isBeforeInline(pos) ? CaretPosition$1(container, offset + 1) : pos;
			}
		} else {
			if (isCaretContainerInline(container)) {
				if (isText$1(container.previousSibling)) {
					return CaretPosition$1(container.previousSibling, container.previousSibling.data.length);
				} else {
					return CaretPosition$1.before(container);
				}
			} else {
				return isAfterInline(pos) ? CaretPosition$1(container, offset - 1) : pos;
			}
		}
	};
	var normalizeForwards = curry(normalizePosition, true);
	var normalizeBackwards = curry(normalizePosition, false);

	var isBeforeRoot = function (rootNode) {
		return function (elm) {
			return eq$2(rootNode, SugarElement.fromDom(elm.dom.parentNode));
		};
	};
	var getParentBlock$1 = function (rootNode, elm) {
		return contains$2(rootNode, elm) ? closest(elm, function (element) {
			return isTextBlock(element) || isListItem(element);
		}, isBeforeRoot(rootNode)) : Optional.none();
	};
	var placeCaretInEmptyBody = function (editor) {
		var body = editor.getBody();
		var node = body.firstChild && editor.dom.isBlock(body.firstChild) ? body.firstChild : body;
		editor.selection.setCursorLocation(node, 0);
	};
	var paddEmptyBody = function (editor) {
		if (editor.dom.isEmpty(editor.getBody())) {
			editor.setContent('');
			placeCaretInEmptyBody(editor);
		}
	};
	var willDeleteLastPositionInElement = function (forward, fromPos, elm) {
		return lift2(firstPositionIn(elm), lastPositionIn(elm), function (firstPos, lastPos) {
			var normalizedFirstPos = normalizePosition(true, firstPos);
			var normalizedLastPos = normalizePosition(false, lastPos);
			var normalizedFromPos = normalizePosition(false, fromPos);
			if (forward) {
				return nextPosition(elm, normalizedFromPos).exists(function (nextPos) {
					return nextPos.isEqual(normalizedLastPos) && fromPos.isEqual(normalizedFirstPos);
				});
			} else {
				return prevPosition(elm, normalizedFromPos).exists(function (prevPos) {
					return prevPos.isEqual(normalizedFirstPos) && fromPos.isEqual(normalizedLastPos);
				});
			}
		}).getOr(true);
	};

	var blockPosition = function (block, position) {
		return {
			block: block,
			position: position
		};
	};
	var blockBoundary = function (from, to) {
		return {
			from: from,
			to: to
		};
	};
	var getBlockPosition = function (rootNode, pos) {
		var rootElm = SugarElement.fromDom(rootNode);
		var containerElm = SugarElement.fromDom(pos.container());
		return getParentBlock$1(rootElm, containerElm).map(function (block) {
			return blockPosition(block, pos);
		});
	};
	var isDifferentBlocks = function (blockBoundary) {
		return eq$2(blockBoundary.from.block, blockBoundary.to.block) === false;
	};
	var hasSameParent = function (blockBoundary) {
		return parent(blockBoundary.from.block).bind(function (parent1) {
			return parent(blockBoundary.to.block).filter(function (parent2) {
				return eq$2(parent1, parent2);
			});
		}).isSome();
	};
	var isEditable = function (blockBoundary) {
		return isContentEditableFalse(blockBoundary.from.block.dom) === false && isContentEditableFalse(blockBoundary.to.block.dom) === false;
	};
	var skipLastBr = function (rootNode, forward, blockPosition) {
		if (isBr(blockPosition.position.getNode()) && isEmpty(blockPosition.block) === false) {
			return positionIn(false, blockPosition.block.dom).bind(function (lastPositionInBlock) {
				if (lastPositionInBlock.isEqual(blockPosition.position)) {
					return fromPosition(forward, rootNode, lastPositionInBlock).bind(function (to) {
						return getBlockPosition(rootNode, to);
					});
				} else {
					return Optional.some(blockPosition);
				}
			}).getOr(blockPosition);
		} else {
			return blockPosition;
		}
	};
	var readFromRange = function (rootNode, forward, rng) {
		var fromBlockPos = getBlockPosition(rootNode, CaretPosition$1.fromRangeStart(rng));
		var toBlockPos = fromBlockPos.bind(function (blockPos) {
			return fromPosition(forward, rootNode, blockPos.position).bind(function (to) {
				return getBlockPosition(rootNode, to).map(function (blockPos) {
					return skipLastBr(rootNode, forward, blockPos);
				});
			});
		});
		return lift2(fromBlockPos, toBlockPos, blockBoundary).filter(function (blockBoundary) {
			return isDifferentBlocks(blockBoundary) && hasSameParent(blockBoundary) && isEditable(blockBoundary);
		});
	};
	var read$3 = function (rootNode, forward, rng) {
		return rng.collapsed ? readFromRange(rootNode, forward, rng) : Optional.none();
	};

	var getChildrenUntilBlockBoundary = function (block) {
		var children$1 = children(block);
		return findIndex(children$1, isBlock).fold(function () {
			return children$1;
		}, function (index) {
			return children$1.slice(0, index);
		});
	};
	var extractChildren = function (block) {
		var children = getChildrenUntilBlockBoundary(block);
		each(children, remove);
		return children;
	};
	var removeEmptyRoot = function (rootNode, block) {
		var parents = parentsAndSelf(block, rootNode);
		return find(parents.reverse(), function (element) {
			return isEmpty(element);
		}).each(remove);
	};
	var isEmptyBefore = function (el) {
		return filter(prevSiblings(el), function (el) {
			return !isEmpty(el);
		}).length === 0;
	};
	var nestedBlockMerge = function (rootNode, fromBlock, toBlock, insertionPoint) {
		if (isEmpty(toBlock)) {
			fillWithPaddingBr(toBlock);
			return firstPositionIn(toBlock.dom);
		}
		if (isEmptyBefore(insertionPoint) && isEmpty(fromBlock)) {
			before(insertionPoint, SugarElement.fromTag('br'));
		}
		var position = prevPosition(toBlock.dom, CaretPosition$1.before(insertionPoint.dom));
		each(extractChildren(fromBlock), function (child) {
			before(insertionPoint, child);
		});
		removeEmptyRoot(rootNode, fromBlock);
		return position;
	};
	var sidelongBlockMerge = function (rootNode, fromBlock, toBlock) {
		if (isEmpty(toBlock)) {
			remove(toBlock);
			if (isEmpty(fromBlock)) {
				fillWithPaddingBr(fromBlock);
			}
			return firstPositionIn(fromBlock.dom);
		}
		var position = lastPositionIn(toBlock.dom);
		each(extractChildren(fromBlock), function (child) {
			append(toBlock, child);
		});
		removeEmptyRoot(rootNode, fromBlock);
		return position;
	};
	var findInsertionPoint = function (toBlock, block) {
		var parentsAndSelf$1 = parentsAndSelf(block, toBlock);
		return Optional.from(parentsAndSelf$1[parentsAndSelf$1.length - 1]);
	};
	var getInsertionPoint = function (fromBlock, toBlock) {
		return contains$2(toBlock, fromBlock) ? findInsertionPoint(toBlock, fromBlock) : Optional.none();
	};
	var trimBr = function (first, block) {
		positionIn(first, block.dom).map(function (position) {
			return position.getNode();
		}).map(SugarElement.fromDom).filter(isBr$1).each(remove);
	};
	var mergeBlockInto = function (rootNode, fromBlock, toBlock) {
		trimBr(true, fromBlock);
		trimBr(false, toBlock);
		return getInsertionPoint(fromBlock, toBlock).fold(curry(sidelongBlockMerge, rootNode, fromBlock, toBlock), curry(nestedBlockMerge, rootNode, fromBlock, toBlock));
	};
	var mergeBlocks = function (rootNode, forward, block1, block2) {
		return forward ? mergeBlockInto(rootNode, block2, block1) : mergeBlockInto(rootNode, block1, block2);
	};

	var backspaceDelete$1 = function (editor, forward) {
		var rootNode = SugarElement.fromDom(editor.getBody());
		var position = read$3(rootNode.dom, forward, editor.selection.getRng()).bind(function (blockBoundary) {
			return mergeBlocks(rootNode, forward, blockBoundary.from.block, blockBoundary.to.block);
		});
		position.each(function (pos) {
			editor.selection.setRng(pos.toRange());
		});
		return position.isSome();
	};

	var deleteRangeMergeBlocks = function (rootNode, selection) {
		var rng = selection.getRng();
		return lift2(getParentBlock$1(rootNode, SugarElement.fromDom(rng.startContainer)), getParentBlock$1(rootNode, SugarElement.fromDom(rng.endContainer)), function (block1, block2) {
			if (eq$2(block1, block2) === false) {
				rng.deleteContents();
				mergeBlocks(rootNode, true, block1, block2).each(function (pos) {
					selection.setRng(pos.toRange());
				});
				return true;
			} else {
				return false;
			}
		}).getOr(false);
	};
	var isRawNodeInTable = function (root, rawNode) {
		var node = SugarElement.fromDom(rawNode);
		var isRoot = curry(eq$2, root);
		return ancestor(node, isTableCell$1, isRoot).isSome();
	};
	var isSelectionInTable = function (root, rng) {
		return isRawNodeInTable(root, rng.startContainer) || isRawNodeInTable(root, rng.endContainer);
	};
	var isEverythingSelected = function (root, rng) {
		var noPrevious = prevPosition(root.dom, CaretPosition$1.fromRangeStart(rng)).isNone();
		var noNext = nextPosition(root.dom, CaretPosition$1.fromRangeEnd(rng)).isNone();
		return !isSelectionInTable(root, rng) && noPrevious && noNext;
	};
	var emptyEditor = function (editor) {
		editor.setContent('');
		editor.selection.setCursorLocation();
		return true;
	};
	var deleteRange$1 = function (editor) {
		var rootNode = SugarElement.fromDom(editor.getBody());
		var rng = editor.selection.getRng();
		return isEverythingSelected(rootNode, rng) ? emptyEditor(editor) : deleteRangeMergeBlocks(rootNode, editor.selection);
	};
	var backspaceDelete$2 = function (editor, _forward) {
		return editor.selection.isCollapsed() ? false : deleteRange$1(editor);
	};

	var isContentEditableTrue$2 = isContentEditableTrue;
	var isContentEditableFalse$7 = isContentEditableFalse;
	var showCaret = function (direction, editor, node, before, scrollIntoView) {
		return Optional.from(editor._selectionOverrides.showCaret(direction, node, before, scrollIntoView));
	};
	var getNodeRange = function (node) {
		var rng = node.ownerDocument.createRange();
		rng.selectNode(node);
		return rng;
	};
	var selectNode = function (editor, node) {
		var e = editor.fire('BeforeObjectSelected', { target: node });
		if (e.isDefaultPrevented()) {
			return Optional.none();
		}
		return Optional.some(getNodeRange(node));
	};
	var renderCaretAtRange = function (editor, range, scrollIntoView) {
		var normalizedRange = normalizeRange(1, editor.getBody(), range);
		var caretPosition = CaretPosition$1.fromRangeStart(normalizedRange);
		var caretPositionNode = caretPosition.getNode();
		if (isInlineFakeCaretTarget(caretPositionNode)) {
			return showCaret(1, editor, caretPositionNode, !caretPosition.isAtEnd(), false);
		}
		var caretPositionBeforeNode = caretPosition.getNode(true);
		if (isInlineFakeCaretTarget(caretPositionBeforeNode)) {
			return showCaret(1, editor, caretPositionBeforeNode, false, false);
		}
		var ceRoot = editor.dom.getParent(caretPosition.getNode(), function (node) {
			return isContentEditableFalse$7(node) || isContentEditableTrue$2(node);
		});
		if (isInlineFakeCaretTarget(ceRoot)) {
			return showCaret(1, editor, ceRoot, false, scrollIntoView);
		}
		return Optional.none();
	};
	var renderRangeCaret = function (editor, range, scrollIntoView) {
		return range.collapsed ? renderCaretAtRange(editor, range, scrollIntoView).getOr(range) : range;
	};

	var isBeforeBoundary = function (pos) {
		return isBeforeContentEditableFalse(pos) || isBeforeMedia(pos);
	};
	var isAfterBoundary = function (pos) {
		return isAfterContentEditableFalse(pos) || isAfterMedia(pos);
	};
	var trimEmptyTextNode$1 = function (dom, node) {
		if (isText$1(node) && node.data.length === 0) {
			dom.remove(node);
		}
	};
	var deleteContentAndShowCaret = function (editor, range, node, direction, forward, peekCaretPosition) {
		showCaret(direction, editor, peekCaretPosition.getNode(!forward), forward, true).each(function (caretRange) {
			if (range.collapsed) {
				var deleteRange = range.cloneRange();
				if (forward) {
					deleteRange.setEnd(caretRange.startContainer, caretRange.startOffset);
				} else {
					deleteRange.setStart(caretRange.endContainer, caretRange.endOffset);
				}
				deleteRange.deleteContents();
			} else {
				range.deleteContents();
			}
			editor.selection.setRng(caretRange);
		});
		trimEmptyTextNode$1(editor.dom, node);
		return true;
	};
	var deleteBoundaryText = function (editor, forward) {
		var range = editor.selection.getRng();
		if (!isText$1(range.commonAncestorContainer)) {
			return false;
		}
		var direction = forward ? HDirection.Forwards : HDirection.Backwards;
		var caretWalker = CaretWalker(editor.getBody());
		var getNextPosFn = curry(getVisualCaretPosition, forward ? caretWalker.next : caretWalker.prev);
		var isBeforeFn = forward ? isBeforeBoundary : isAfterBoundary;
		var caretPosition = getNormalizedRangeEndPoint(direction, editor.getBody(), range);
		var nextCaretPosition = normalizePosition(forward, getNextPosFn(caretPosition));
		if (!nextCaretPosition || !isMoveInsideSameBlock(caretPosition, nextCaretPosition)) {
			return false;
		} else if (isBeforeFn(nextCaretPosition)) {
			return deleteContentAndShowCaret(editor, range, caretPosition.getNode(), direction, forward, nextCaretPosition);
		}
		var peekCaretPosition = getNextPosFn(nextCaretPosition);
		if (peekCaretPosition && isBeforeFn(peekCaretPosition)) {
			if (isMoveInsideSameBlock(nextCaretPosition, peekCaretPosition)) {
				return deleteContentAndShowCaret(editor, range, caretPosition.getNode(), direction, forward, peekCaretPosition);
			}
		}
		return false;
	};
	var backspaceDelete$3 = function (editor, forward) {
		return deleteBoundaryText(editor, forward);
	};

	var isCompoundElement = function (node) {
		return isTableCell$1(SugarElement.fromDom(node)) || isListItem(SugarElement.fromDom(node));
	};
	var DeleteAction = Adt.generate([
		{ remove: ['element'] },
		{ moveToElement: ['element'] },
		{ moveToPosition: ['position'] }
	]);
	var isAtContentEditableBlockCaret = function (forward, from) {
		var elm = from.getNode(forward === false);
		var caretLocation = forward ? 'after' : 'before';
		return isElement$1(elm) && elm.getAttribute('data-mce-caret') === caretLocation;
	};
	var isDeleteFromCefDifferentBlocks = function (root, forward, from, to) {
		var inSameBlock = function (elm) {
			return isInline(SugarElement.fromDom(elm)) && !isInSameBlock(from, to, root);
		};
		return getRelativeCefElm(!forward, from).fold(function () {
			return getRelativeCefElm(forward, to).fold(never, inSameBlock);
		}, inSameBlock);
	};
	var deleteEmptyBlockOrMoveToCef = function (root, forward, from, to) {
		var toCefElm = to.getNode(forward === false);
		return getParentBlock$1(SugarElement.fromDom(root), SugarElement.fromDom(from.getNode())).map(function (blockElm) {
			return isEmpty(blockElm) ? DeleteAction.remove(blockElm.dom) : DeleteAction.moveToElement(toCefElm);
		}).orThunk(function () {
			return Optional.some(DeleteAction.moveToElement(toCefElm));
		});
	};
	var findCefPosition = function (root, forward, from) {
		return fromPosition(forward, root, from).bind(function (to) {
			if (isCompoundElement(to.getNode())) {
				return Optional.none();
			} else if (isDeleteFromCefDifferentBlocks(root, forward, from, to)) {
				return Optional.none();
			} else if (forward && isContentEditableFalse(to.getNode())) {
				return deleteEmptyBlockOrMoveToCef(root, forward, from, to);
			} else if (forward === false && isContentEditableFalse(to.getNode(true))) {
				return deleteEmptyBlockOrMoveToCef(root, forward, from, to);
			} else if (forward && isAfterContentEditableFalse(from)) {
				return Optional.some(DeleteAction.moveToPosition(to));
			} else if (forward === false && isBeforeContentEditableFalse(from)) {
				return Optional.some(DeleteAction.moveToPosition(to));
			} else {
				return Optional.none();
			}
		});
	};
	var getContentEditableBlockAction = function (forward, elm) {
		if (forward && isContentEditableFalse(elm.nextSibling)) {
			return Optional.some(DeleteAction.moveToElement(elm.nextSibling));
		} else if (forward === false && isContentEditableFalse(elm.previousSibling)) {
			return Optional.some(DeleteAction.moveToElement(elm.previousSibling));
		} else {
			return Optional.none();
		}
	};
	var skipMoveToActionFromInlineCefToContent = function (root, from, deleteAction) {
		return deleteAction.fold(function (elm) {
			return Optional.some(DeleteAction.remove(elm));
		}, function (elm) {
			return Optional.some(DeleteAction.moveToElement(elm));
		}, function (to) {
			if (isInSameBlock(from, to, root)) {
				return Optional.none();
			} else {
				return Optional.some(DeleteAction.moveToPosition(to));
			}
		});
	};
	var getContentEditableAction = function (root, forward, from) {
		if (isAtContentEditableBlockCaret(forward, from)) {
			return getContentEditableBlockAction(forward, from.getNode(forward === false)).fold(function () {
				return findCefPosition(root, forward, from);
			}, Optional.some);
		} else {
			return findCefPosition(root, forward, from).bind(function (deleteAction) {
				return skipMoveToActionFromInlineCefToContent(root, from, deleteAction);
			});
		}
	};
	var read$4 = function (root, forward, rng) {
		var normalizedRange = normalizeRange(forward ? 1 : -1, root, rng);
		var from = CaretPosition$1.fromRangeStart(normalizedRange);
		var rootElement = SugarElement.fromDom(root);
		if (forward === false && isAfterContentEditableFalse(from)) {
			return Optional.some(DeleteAction.remove(from.getNode(true)));
		} else if (forward && isBeforeContentEditableFalse(from)) {
			return Optional.some(DeleteAction.remove(from.getNode()));
		} else if (forward === false && isBeforeContentEditableFalse(from) && isAfterBr(rootElement, from)) {
			return findPreviousBr(rootElement, from).map(function (br) {
				return DeleteAction.remove(br.getNode());
			});
		} else if (forward && isAfterContentEditableFalse(from) && isBeforeBr(rootElement, from)) {
			return findNextBr(rootElement, from).map(function (br) {
				return DeleteAction.remove(br.getNode());
			});
		} else {
			return getContentEditableAction(root, forward, from);
		}
	};

	var deleteElement$1 = function (editor, forward) {
		return function (element) {
			editor._selectionOverrides.hideFakeCaret();
			deleteElement(editor, forward, SugarElement.fromDom(element));
			return true;
		};
	};
	var moveToElement = function (editor, forward) {
		return function (element) {
			var pos = forward ? CaretPosition$1.before(element) : CaretPosition$1.after(element);
			editor.selection.setRng(pos.toRange());
			return true;
		};
	};
	var moveToPosition = function (editor) {
		return function (pos) {
			editor.selection.setRng(pos.toRange());
			return true;
		};
	};
	var getAncestorCe = function (editor, node) {
		return Optional.from(getContentEditableRoot(editor.getBody(), node));
	};
	var backspaceDeleteCaret = function (editor, forward) {
		var selectedNode = editor.selection.getNode();
		return getAncestorCe(editor, selectedNode).filter(isContentEditableFalse).fold(function () {
			return read$4(editor.getBody(), forward, editor.selection.getRng()).exists(function (deleteAction) {
				return deleteAction.fold(deleteElement$1(editor, forward), moveToElement(editor, forward), moveToPosition(editor));
			});
		}, always);
	};
	var deleteOffscreenSelection = function (rootElement) {
		each(descendants$1(rootElement, '.mce-offscreen-selection'), remove);
	};
	var backspaceDeleteRange = function (editor, forward) {
		var selectedNode = editor.selection.getNode();
		if (isContentEditableFalse(selectedNode)) {
			var hasCefAncestor = getAncestorCe(editor, selectedNode.parentNode).filter(isContentEditableFalse);
			return hasCefAncestor.fold(function () {
				deleteOffscreenSelection(SugarElement.fromDom(editor.getBody()));
				deleteElement(editor, forward, SugarElement.fromDom(editor.selection.getNode()));
				paddEmptyBody(editor);
				return true;
			}, function () {
				return true;
			});
		}
		return false;
	};
	var paddEmptyElement = function (editor) {
		var dom = editor.dom, selection = editor.selection;
		var ceRoot = getContentEditableRoot(editor.getBody(), selection.getNode());
		if (isContentEditableTrue(ceRoot) && dom.isBlock(ceRoot) && dom.isEmpty(ceRoot)) {
			var br = dom.create('br', { 'data-mce-bogus': '1' });
			dom.setHTML(ceRoot, '');
			ceRoot.appendChild(br);
			selection.setRng(CaretPosition$1.before(br).toRange());
		}
		return true;
	};
	var backspaceDelete$4 = function (editor, forward) {
		if (editor.selection.isCollapsed()) {
			return backspaceDeleteCaret(editor, forward);
		} else {
			return backspaceDeleteRange(editor, forward);
		}
	};

	var deleteCaret$1 = function (editor, forward) {
		var fromPos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		return fromPosition(forward, editor.getBody(), fromPos).filter(function (pos) {
			return forward ? isBeforeImageBlock(pos) : isAfterImageBlock(pos);
		}).bind(function (pos) {
			return Optional.from(getChildNodeAtRelativeOffset(forward ? 0 : -1, pos));
		}).exists(function (elm) {
			editor.selection.select(elm);
			return true;
		});
	};
	var backspaceDelete$5 = function (editor, forward) {
		return editor.selection.isCollapsed() ? deleteCaret$1(editor, forward) : false;
	};

	var isText$8 = isText$1;
	var startsWithCaretContainer$1 = function (node) {
		return isText$8(node) && node.data[0] === ZWSP;
	};
	var endsWithCaretContainer$1 = function (node) {
		return isText$8(node) && node.data[node.data.length - 1] === ZWSP;
	};
	var createZwsp = function (node) {
		return node.ownerDocument.createTextNode(ZWSP);
	};
	var insertBefore$1 = function (node) {
		if (isText$8(node.previousSibling)) {
			if (endsWithCaretContainer$1(node.previousSibling)) {
				return node.previousSibling;
			} else {
				node.previousSibling.appendData(ZWSP);
				return node.previousSibling;
			}
		} else if (isText$8(node)) {
			if (startsWithCaretContainer$1(node)) {
				return node;
			} else {
				node.insertData(0, ZWSP);
				return node;
			}
		} else {
			var newNode = createZwsp(node);
			node.parentNode.insertBefore(newNode, node);
			return newNode;
		}
	};
	var insertAfter$1 = function (node) {
		if (isText$8(node.nextSibling)) {
			if (startsWithCaretContainer$1(node.nextSibling)) {
				return node.nextSibling;
			} else {
				node.nextSibling.insertData(0, ZWSP);
				return node.nextSibling;
			}
		} else if (isText$8(node)) {
			if (endsWithCaretContainer$1(node)) {
				return node;
			} else {
				node.appendData(ZWSP);
				return node;
			}
		} else {
			var newNode = createZwsp(node);
			if (node.nextSibling) {
				node.parentNode.insertBefore(newNode, node.nextSibling);
			} else {
				node.parentNode.appendChild(newNode);
			}
			return newNode;
		}
	};
	var insertInline$1 = function (before, node) {
		return before ? insertBefore$1(node) : insertAfter$1(node);
	};
	var insertInlineBefore = curry(insertInline$1, true);
	var insertInlineAfter = curry(insertInline$1, false);

	var insertInlinePos = function (pos, before) {
		if (isText$1(pos.container())) {
			return insertInline$1(before, pos.container());
		} else {
			return insertInline$1(before, pos.getNode());
		}
	};
	var isPosCaretContainer = function (pos, caret) {
		var caretNode = caret.get();
		return caretNode && pos.container() === caretNode && isCaretContainerInline(caretNode);
	};
	var renderCaret = function (caret, location) {
		return location.fold(function (element) {
			remove$5(caret.get());
			var text = insertInlineBefore(element);
			caret.set(text);
			return Optional.some(CaretPosition$1(text, text.length - 1));
		}, function (element) {
			return firstPositionIn(element).map(function (pos) {
				if (!isPosCaretContainer(pos, caret)) {
					remove$5(caret.get());
					var text = insertInlinePos(pos, true);
					caret.set(text);
					return CaretPosition$1(text, 1);
				} else {
					return CaretPosition$1(caret.get(), 1);
				}
			});
		}, function (element) {
			return lastPositionIn(element).map(function (pos) {
				if (!isPosCaretContainer(pos, caret)) {
					remove$5(caret.get());
					var text = insertInlinePos(pos, false);
					caret.set(text);
					return CaretPosition$1(text, text.length - 1);
				} else {
					return CaretPosition$1(caret.get(), caret.get().length - 1);
				}
			});
		}, function (element) {
			remove$5(caret.get());
			var text = insertInlineAfter(element);
			caret.set(text);
			return Optional.some(CaretPosition$1(text, 1));
		});
	};

	var evaluateUntil = function (fns, args) {
		for (var i = 0; i < fns.length; i++) {
			var result = fns[i].apply(null, args);
			if (result.isSome()) {
				return result;
			}
		}
		return Optional.none();
	};

	var Location = Adt.generate([
		{ before: ['element'] },
		{ start: ['element'] },
		{ end: ['element'] },
		{ after: ['element'] }
	]);
	var rescope = function (rootNode, node) {
		var parentBlock = getParentBlock(node, rootNode);
		return parentBlock ? parentBlock : rootNode;
	};
	var before$4 = function (isInlineTarget, rootNode, pos) {
		var nPos = normalizeForwards(pos);
		var scope = rescope(rootNode, nPos.container());
		return findRootInline(isInlineTarget, scope, nPos).fold(function () {
			return nextPosition(scope, nPos).bind(curry(findRootInline, isInlineTarget, scope)).map(function (inline) {
				return Location.before(inline);
			});
		}, Optional.none);
	};
	var isNotInsideFormatCaretContainer = function (rootNode, elm) {
		return getParentCaretContainer(rootNode, elm) === null;
	};
	var findInsideRootInline = function (isInlineTarget, rootNode, pos) {
		return findRootInline(isInlineTarget, rootNode, pos).filter(curry(isNotInsideFormatCaretContainer, rootNode));
	};
	var start = function (isInlineTarget, rootNode, pos) {
		var nPos = normalizeBackwards(pos);
		return findInsideRootInline(isInlineTarget, rootNode, nPos).bind(function (inline) {
			var prevPos = prevPosition(inline, nPos);
			return prevPos.isNone() ? Optional.some(Location.start(inline)) : Optional.none();
		});
	};
	var end = function (isInlineTarget, rootNode, pos) {
		var nPos = normalizeForwards(pos);
		return findInsideRootInline(isInlineTarget, rootNode, nPos).bind(function (inline) {
			var nextPos = nextPosition(inline, nPos);
			return nextPos.isNone() ? Optional.some(Location.end(inline)) : Optional.none();
		});
	};
	var after$3 = function (isInlineTarget, rootNode, pos) {
		var nPos = normalizeBackwards(pos);
		var scope = rescope(rootNode, nPos.container());
		return findRootInline(isInlineTarget, scope, nPos).fold(function () {
			return prevPosition(scope, nPos).bind(curry(findRootInline, isInlineTarget, scope)).map(function (inline) {
				return Location.after(inline);
			});
		}, Optional.none);
	};
	var isValidLocation = function (location) {
		return isRtl$1(getElement(location)) === false;
	};
	var readLocation = function (isInlineTarget, rootNode, pos) {
		var location = evaluateUntil([
			before$4,
			start,
			end,
			after$3
		], [
			isInlineTarget,
			rootNode,
			pos
		]);
		return location.filter(isValidLocation);
	};
	var getElement = function (location) {
		return location.fold(identity, identity, identity, identity);
	};
	var getName = function (location) {
		return location.fold(constant('before'), constant('start'), constant('end'), constant('after'));
	};
	var outside = function (location) {
		return location.fold(Location.before, Location.before, Location.after, Location.after);
	};
	var inside = function (location) {
		return location.fold(Location.start, Location.start, Location.end, Location.end);
	};
	var isEq$5 = function (location1, location2) {
		return getName(location1) === getName(location2) && getElement(location1) === getElement(location2);
	};
	var betweenInlines = function (forward, isInlineTarget, rootNode, from, to, location) {
		return lift2(findRootInline(isInlineTarget, rootNode, from), findRootInline(isInlineTarget, rootNode, to), function (fromInline, toInline) {
			if (fromInline !== toInline && hasSameParentBlock(rootNode, fromInline, toInline)) {
				return Location.after(forward ? fromInline : toInline);
			} else {
				return location;
			}
		}).getOr(location);
	};
	var skipNoMovement = function (fromLocation, toLocation) {
		return fromLocation.fold(always, function (fromLocation) {
			return !isEq$5(fromLocation, toLocation);
		});
	};
	var findLocationTraverse = function (forward, isInlineTarget, rootNode, fromLocation, pos) {
		var from = normalizePosition(forward, pos);
		var to = fromPosition(forward, rootNode, from).map(curry(normalizePosition, forward));
		var location = to.fold(function () {
			return fromLocation.map(outside);
		}, function (to) {
			return readLocation(isInlineTarget, rootNode, to).map(curry(betweenInlines, forward, isInlineTarget, rootNode, from, to)).filter(curry(skipNoMovement, fromLocation));
		});
		return location.filter(isValidLocation);
	};
	var findLocationSimple = function (forward, location) {
		if (forward) {
			return location.fold(compose(Optional.some, Location.start), Optional.none, compose(Optional.some, Location.after), Optional.none);
		} else {
			return location.fold(Optional.none, compose(Optional.some, Location.before), Optional.none, compose(Optional.some, Location.end));
		}
	};
	var findLocation = function (forward, isInlineTarget, rootNode, pos) {
		var from = normalizePosition(forward, pos);
		var fromLocation = readLocation(isInlineTarget, rootNode, from);
		return readLocation(isInlineTarget, rootNode, from).bind(curry(findLocationSimple, forward)).orThunk(function () {
			return findLocationTraverse(forward, isInlineTarget, rootNode, fromLocation, pos);
		});
	};
	var prevLocation = curry(findLocation, false);
	var nextLocation = curry(findLocation, true);

	var hasSelectionModifyApi = function (editor) {
		return isFunction(editor.selection.getSel().modify);
	};
	var moveRel = function (forward, selection, pos) {
		var delta = forward ? 1 : -1;
		selection.setRng(CaretPosition$1(pos.container(), pos.offset() + delta).toRange());
		selection.getSel().modify('move', forward ? 'forward' : 'backward', 'word');
		return true;
	};
	var moveByWord = function (forward, editor) {
		var rng = editor.selection.getRng();
		var pos = forward ? CaretPosition$1.fromRangeEnd(rng) : CaretPosition$1.fromRangeStart(rng);
		if (!hasSelectionModifyApi(editor)) {
			return false;
		} else if (forward && isBeforeInline(pos)) {
			return moveRel(true, editor.selection, pos);
		} else if (!forward && isAfterInline(pos)) {
			return moveRel(false, editor.selection, pos);
		} else {
			return false;
		}
	};

	var setCaretPosition = function (editor, pos) {
		var rng = editor.dom.createRng();
		rng.setStart(pos.container(), pos.offset());
		rng.setEnd(pos.container(), pos.offset());
		editor.selection.setRng(rng);
	};
	var setSelected = function (state, elm) {
		if (state) {
			elm.setAttribute('data-mce-selected', 'inline-boundary');
		} else {
			elm.removeAttribute('data-mce-selected');
		}
	};
	var renderCaretLocation = function (editor, caret, location) {
		return renderCaret(caret, location).map(function (pos) {
			setCaretPosition(editor, pos);
			return location;
		});
	};
	var findLocation$1 = function (editor, caret, forward) {
		var rootNode = editor.getBody();
		var from = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		var isInlineTarget$1 = curry(isInlineTarget, editor);
		var location = findLocation(forward, isInlineTarget$1, rootNode, from);
		return location.bind(function (location) {
			return renderCaretLocation(editor, caret, location);
		});
	};
	var toggleInlines = function (isInlineTarget, dom, elms) {
		var inlineBoundaries = map(descendants$1(SugarElement.fromDom(dom.getRoot()), '*[data-mce-selected="inline-boundary"]'), function (e) {
			return e.dom;
		});
		var selectedInlines = filter(inlineBoundaries, isInlineTarget);
		var targetInlines = filter(elms, isInlineTarget);
		each(difference(selectedInlines, targetInlines), curry(setSelected, false));
		each(difference(targetInlines, selectedInlines), curry(setSelected, true));
	};
	var safeRemoveCaretContainer = function (editor, caret) {
		if (editor.selection.isCollapsed() && editor.composing !== true && caret.get()) {
			var pos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
			if (CaretPosition$1.isTextPosition(pos) && isAtZwsp(pos) === false) {
				setCaretPosition(editor, removeAndReposition(caret.get(), pos));
				caret.set(null);
			}
		}
	};
	var renderInsideInlineCaret = function (isInlineTarget, editor, caret, elms) {
		if (editor.selection.isCollapsed()) {
			var inlines = filter(elms, isInlineTarget);
			each(inlines, function (_inline) {
				var pos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
				readLocation(isInlineTarget, editor.getBody(), pos).bind(function (location) {
					return renderCaretLocation(editor, caret, location);
				});
			});
		}
	};
	var move = function (editor, caret, forward) {
		return isInlineBoundariesEnabled(editor) ? findLocation$1(editor, caret, forward).isSome() : false;
	};
	var moveWord = function (forward, editor, _caret) {
		return isInlineBoundariesEnabled(editor) ? moveByWord(forward, editor) : false;
	};
	var setupSelectedState = function (editor) {
		var caret = Cell(null);
		var isInlineTarget$1 = curry(isInlineTarget, editor);
		editor.on('NodeChange', function (e) {
			if (isInlineBoundariesEnabled(editor) && !(Env.browser.isIE() && e.initial)) {
				toggleInlines(isInlineTarget$1, editor.dom, e.parents);
				safeRemoveCaretContainer(editor, caret);
				renderInsideInlineCaret(isInlineTarget$1, editor, caret, e.parents);
			}
		});
		return caret;
	};
	var moveNextWord = curry(moveWord, true);
	var movePrevWord = curry(moveWord, false);

	var rangeFromPositions = function (from, to) {
		var range = document.createRange();
		range.setStart(from.container(), from.offset());
		range.setEnd(to.container(), to.offset());
		return range;
	};
	var hasOnlyTwoOrLessPositionsLeft = function (elm) {
		return lift2(firstPositionIn(elm), lastPositionIn(elm), function (firstPos, lastPos) {
			var normalizedFirstPos = normalizePosition(true, firstPos);
			var normalizedLastPos = normalizePosition(false, lastPos);
			return nextPosition(elm, normalizedFirstPos).forall(function (pos) {
				return pos.isEqual(normalizedLastPos);
			});
		}).getOr(true);
	};
	var setCaretLocation = function (editor, caret) {
		return function (location) {
			return renderCaret(caret, location).exists(function (pos) {
				setCaretPosition(editor, pos);
				return true;
			});
		};
	};
	var deleteFromTo = function (editor, caret, from, to) {
		var rootNode = editor.getBody();
		var isInlineTarget$1 = curry(isInlineTarget, editor);
		editor.undoManager.ignore(function () {
			editor.selection.setRng(rangeFromPositions(from, to));
			editor.execCommand('Delete');
			readLocation(isInlineTarget$1, rootNode, CaretPosition$1.fromRangeStart(editor.selection.getRng())).map(inside).map(setCaretLocation(editor, caret));
		});
		editor.nodeChanged();
	};
	var rescope$1 = function (rootNode, node) {
		var parentBlock = getParentBlock(node, rootNode);
		return parentBlock ? parentBlock : rootNode;
	};
	var backspaceDeleteCollapsed = function (editor, caret, forward, from) {
		var rootNode = rescope$1(editor.getBody(), from.container());
		var isInlineTarget$1 = curry(isInlineTarget, editor);
		var fromLocation = readLocation(isInlineTarget$1, rootNode, from);
		return fromLocation.bind(function (location) {
			if (forward) {
				return location.fold(constant(Optional.some(inside(location))), Optional.none, constant(Optional.some(outside(location))), Optional.none);
			} else {
				return location.fold(Optional.none, constant(Optional.some(outside(location))), Optional.none, constant(Optional.some(inside(location))));
			}
		}).map(setCaretLocation(editor, caret)).getOrThunk(function () {
			var toPosition = navigate(forward, rootNode, from);
			var toLocation = toPosition.bind(function (pos) {
				return readLocation(isInlineTarget$1, rootNode, pos);
			});
			return lift2(fromLocation, toLocation, function () {
				return findRootInline(isInlineTarget$1, rootNode, from).exists(function (elm) {
					if (hasOnlyTwoOrLessPositionsLeft(elm)) {
						deleteElement(editor, forward, SugarElement.fromDom(elm));
						return true;
					} else {
						return false;
					}
				});
			}).orThunk(function () {
				return toLocation.bind(function (_) {
					return toPosition.map(function (to) {
						if (forward) {
							deleteFromTo(editor, caret, from, to);
						} else {
							deleteFromTo(editor, caret, to, from);
						}
						return true;
					});
				});
			}).getOr(false);
		});
	};
	var backspaceDelete$6 = function (editor, caret, forward) {
		if (editor.selection.isCollapsed() && isInlineBoundariesEnabled(editor)) {
			var from = CaretPosition$1.fromRangeStart(editor.selection.getRng());
			return backspaceDeleteCollapsed(editor, caret, forward, from);
		}
		return false;
	};

	var getParentInlines = function (rootElm, startElm) {
		var parents = parentsAndSelf(startElm, rootElm);
		return findIndex(parents, isBlock).fold(constant(parents), function (index) {
			return parents.slice(0, index);
		});
	};
	var hasOnlyOneChild$1 = function (elm) {
		return children(elm).length === 1;
	};
	var deleteLastPosition = function (forward, editor, target, parentInlines) {
		var isFormatElement$1 = curry(isFormatElement, editor);
		var formatNodes = map(filter(parentInlines, isFormatElement$1), function (elm) {
			return elm.dom;
		});
		if (formatNodes.length === 0) {
			deleteElement(editor, forward, target);
		} else {
			var pos = replaceWithCaretFormat(target.dom, formatNodes);
			editor.selection.setRng(pos.toRange());
		}
	};
	var deleteCaret$2 = function (editor, forward) {
		var rootElm = SugarElement.fromDom(editor.getBody());
		var startElm = SugarElement.fromDom(editor.selection.getStart());
		var parentInlines = filter(getParentInlines(rootElm, startElm), hasOnlyOneChild$1);
		return last(parentInlines).exists(function (target) {
			var fromPos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
			if (willDeleteLastPositionInElement(forward, fromPos, target.dom) && !isEmptyCaretFormatElement(target)) {
				deleteLastPosition(forward, editor, target, parentInlines);
				return true;
			} else {
				return false;
			}
		});
	};
	var backspaceDelete$7 = function (editor, forward) {
		return editor.selection.isCollapsed() ? deleteCaret$2(editor, forward) : false;
	};

	var deleteElement$2 = function (editor, forward, element) {
		editor._selectionOverrides.hideFakeCaret();
		deleteElement(editor, forward, SugarElement.fromDom(element));
		return true;
	};
	var deleteCaret$3 = function (editor, forward) {
		var isNearMedia = forward ? isBeforeMedia : isAfterMedia;
		var direction = forward ? HDirection.Forwards : HDirection.Backwards;
		var fromPos = getNormalizedRangeEndPoint(direction, editor.getBody(), editor.selection.getRng());
		if (isNearMedia(fromPos)) {
			return deleteElement$2(editor, forward, fromPos.getNode(!forward));
		} else {
			return Optional.from(normalizePosition(forward, fromPos)).filter(function (pos) {
				return isNearMedia(pos) && isMoveInsideSameBlock(fromPos, pos);
			}).exists(function (pos) {
				return deleteElement$2(editor, forward, pos.getNode(!forward));
			});
		}
	};
	var deleteRange$2 = function (editor, forward) {
		var selectedNode = editor.selection.getNode();
		return isMedia(selectedNode) ? deleteElement$2(editor, forward, selectedNode) : false;
	};
	var backspaceDelete$8 = function (editor, forward) {
		return editor.selection.isCollapsed() ? deleteCaret$3(editor, forward) : deleteRange$2(editor, forward);
	};

	var isEditable$1 = function (target) {
		return closest(target, function (elm) {
			return isContentEditableTrue(elm.dom) || isContentEditableFalse(elm.dom);
		}).exists(function (elm) {
			return isContentEditableTrue(elm.dom);
		});
	};
	var parseIndentValue = function (value) {
		var number = parseInt(value, 10);
		return isNaN(number) ? 0 : number;
	};
	var getIndentStyleName = function (useMargin, element) {
		var indentStyleName = useMargin || isTable$1(element) ? 'margin' : 'padding';
		var suffix = get$5(element, 'direction') === 'rtl' ? '-right' : '-left';
		return indentStyleName + suffix;
	};
	var indentElement = function (dom, command, useMargin, value, unit, element) {
		var indentStyleName = getIndentStyleName(useMargin, SugarElement.fromDom(element));
		if (command === 'outdent') {
			var styleValue = Math.max(0, parseIndentValue(element.style[indentStyleName]) - value);
			dom.setStyle(element, indentStyleName, styleValue ? styleValue + unit : '');
		} else {
			var styleValue = parseIndentValue(element.style[indentStyleName]) + value + unit;
			dom.setStyle(element, indentStyleName, styleValue);
		}
	};
	var validateBlocks = function (editor, blocks) {
		return forall(blocks, function (block) {
			var indentStyleName = getIndentStyleName(shouldIndentUseMargin(editor), block);
			var intentValue = getRaw(block, indentStyleName).map(parseIndentValue).getOr(0);
			var contentEditable = editor.dom.getContentEditable(block.dom);
			return contentEditable !== 'false' && intentValue > 0;
		});
	};
	var canOutdent = function (editor) {
		var blocks = getBlocksToIndent(editor);
		return !editor.mode.isReadOnly() && (blocks.length > 1 || validateBlocks(editor, blocks));
	};
	var isListComponent = function (el) {
		return isList(el) || isListItem(el);
	};
	var parentIsListComponent = function (el) {
		return parent(el).map(isListComponent).getOr(false);
	};
	var getBlocksToIndent = function (editor) {
		return filter(map(editor.selection.getSelectedBlocks(), SugarElement.fromDom), function (el) {
			return !isListComponent(el) && !parentIsListComponent(el) && isEditable$1(el);
		});
	};
	var handle = function (editor, command) {
		var dom = editor.dom, selection = editor.selection, formatter = editor.formatter;
		var indentation = getIndentation(editor);
		var indentUnit = /[a-z%]+$/i.exec(indentation)[0];
		var indentValue = parseInt(indentation, 10);
		var useMargin = shouldIndentUseMargin(editor);
		var forcedRootBlock = getForcedRootBlock(editor);
		if (!editor.queryCommandState('InsertUnorderedList') && !editor.queryCommandState('InsertOrderedList')) {
			if (forcedRootBlock === '' && !dom.getParent(selection.getNode(), dom.isBlock)) {
				formatter.apply('div');
			}
		}
		each(getBlocksToIndent(editor), function (block) {
			indentElement(dom, command, useMargin, indentValue, indentUnit, block.dom);
		});
	};

	var backspaceDelete$9 = function (editor, _forward) {
		if (editor.selection.isCollapsed() && canOutdent(editor)) {
			var dom = editor.dom;
			var rng = editor.selection.getRng();
			var pos = CaretPosition$1.fromRangeStart(rng);
			var block = dom.getParent(rng.startContainer, dom.isBlock);
			if (block !== null && isAtStartOfBlock(SugarElement.fromDom(block), pos)) {
				handle(editor, 'outdent');
				return true;
			}
		}
		return false;
	};

	var nativeCommand = function (editor, command) {
		editor.getDoc().execCommand(command, false, null);
	};
	var deleteCommand = function (editor, caret) {
		if (backspaceDelete$9(editor)) {
			return;
		} else if (backspaceDelete$4(editor, false)) {
			return;
		} else if (backspaceDelete$3(editor, false)) {
			return;
		} else if (backspaceDelete$6(editor, caret, false)) {
			return;
		} else if (backspaceDelete$1(editor, false)) {
			return;
		} else if (backspaceDelete(editor)) {
			return;
		} else if (backspaceDelete$5(editor, false)) {
			return;
		} else if (backspaceDelete$8(editor, false)) {
			return;
		} else if (backspaceDelete$2(editor)) {
			return;
		} else if (backspaceDelete$7(editor, false)) {
			return;
		} else {
			nativeCommand(editor, 'Delete');
			paddEmptyBody(editor);
		}
	};
	var forwardDeleteCommand = function (editor, caret) {
		if (backspaceDelete$4(editor, true)) {
			return;
		} else if (backspaceDelete$3(editor, true)) {
			return;
		} else if (backspaceDelete$6(editor, caret, true)) {
			return;
		} else if (backspaceDelete$1(editor, true)) {
			return;
		} else if (backspaceDelete(editor)) {
			return;
		} else if (backspaceDelete$5(editor, true)) {
			return;
		} else if (backspaceDelete$8(editor, true)) {
			return;
		} else if (backspaceDelete$2(editor)) {
			return;
		} else if (backspaceDelete$7(editor, true)) {
			return;
		} else {
			nativeCommand(editor, 'ForwardDelete');
		}
	};
	var setup$8 = function (editor, caret) {
		editor.addCommand('delete', function () {
			deleteCommand(editor, caret);
		});
		editor.addCommand('forwardDelete', function () {
			forwardDeleteCommand(editor, caret);
		});
	};

	var SIGNIFICANT_MOVE = 5;
	var LONGPRESS_DELAY = 400;
	var getTouch = function (event) {
		if (event.touches === undefined || event.touches.length !== 1) {
			return Optional.none();
		}
		return Optional.some(event.touches[0]);
	};
	var isFarEnough = function (touch, data) {
		var distX = Math.abs(touch.clientX - data.x);
		var distY = Math.abs(touch.clientY - data.y);
		return distX > SIGNIFICANT_MOVE || distY > SIGNIFICANT_MOVE;
	};
	var setup$9 = function (editor) {
		var startData = Cell(Optional.none());
		var longpressFired = Cell(false);
		var debounceLongpress = last$2(function (e) {
			editor.fire('longpress', __assign(__assign({}, e), { type: 'longpress' }));
			longpressFired.set(true);
		}, LONGPRESS_DELAY);
		editor.on('touchstart', function (e) {
			getTouch(e).each(function (touch) {
				debounceLongpress.cancel();
				var data = {
					x: touch.clientX,
					y: touch.clientY,
					target: e.target
				};
				debounceLongpress.throttle(e);
				longpressFired.set(false);
				startData.set(Optional.some(data));
			});
		}, true);
		editor.on('touchmove', function (e) {
			debounceLongpress.cancel();
			getTouch(e).each(function (touch) {
				startData.get().each(function (data) {
					if (isFarEnough(touch, data)) {
						startData.set(Optional.none());
						longpressFired.set(false);
						editor.fire('longpresscancel');
					}
				});
			});
		}, true);
		editor.on('touchend touchcancel', function (e) {
			debounceLongpress.cancel();
			if (e.type === 'touchcancel') {
				return;
			}
			startData.get().filter(function (data) {
				return data.target.isEqualNode(e.target);
			}).each(function () {
				if (longpressFired.get()) {
					e.preventDefault();
				} else {
					editor.fire('tap', __assign(__assign({}, e), { type: 'tap' }));
				}
			});
		}, true);
	};

	var isBlockElement = function (blockElements, node) {
		return blockElements.hasOwnProperty(node.nodeName);
	};
	var isValidTarget = function (blockElements, node) {
		if (isText$1(node)) {
			return true;
		} else if (isElement$1(node)) {
			return !isBlockElement(blockElements, node) && !isBookmarkNode$1(node);
		} else {
			return false;
		}
	};
	var hasBlockParent = function (blockElements, root, node) {
		return exists(parents$1(SugarElement.fromDom(node), SugarElement.fromDom(root)), function (elm) {
			return isBlockElement(blockElements, elm.dom);
		});
	};
	var shouldRemoveTextNode = function (blockElements, node) {
		if (isText$1(node)) {
			if (node.nodeValue.length === 0) {
				return true;
			} else if (/^\s+$/.test(node.nodeValue) && (!node.nextSibling || isBlockElement(blockElements, node.nextSibling))) {
				return true;
			}
		}
		return false;
	};
	var addRootBlocks = function (editor) {
		var dom = editor.dom, selection = editor.selection;
		var schema = editor.schema, blockElements = schema.getBlockElements();
		var node = selection.getStart();
		var rootNode = editor.getBody();
		var rootBlockNode, tempNode, wrapped;
		var forcedRootBlock = getForcedRootBlock(editor);
		if (!node || !isElement$1(node) || !forcedRootBlock) {
			return;
		}
		var rootNodeName = rootNode.nodeName.toLowerCase();
		if (!schema.isValidChild(rootNodeName, forcedRootBlock.toLowerCase()) || hasBlockParent(blockElements, rootNode, node)) {
			return;
		}
		var rng = selection.getRng();
		var startContainer = rng.startContainer;
		var startOffset = rng.startOffset;
		var endContainer = rng.endContainer;
		var endOffset = rng.endOffset;
		var restoreSelection = hasFocus$1(editor);
		node = rootNode.firstChild;
		while (node) {
			if (isValidTarget(blockElements, node)) {
				if (shouldRemoveTextNode(blockElements, node)) {
					tempNode = node;
					node = node.nextSibling;
					dom.remove(tempNode);
					continue;
				}
				if (!rootBlockNode) {
					rootBlockNode = dom.create(forcedRootBlock, getForcedRootBlockAttrs(editor));
					node.parentNode.insertBefore(rootBlockNode, node);
					wrapped = true;
				}
				tempNode = node;
				node = node.nextSibling;
				rootBlockNode.appendChild(tempNode);
			} else {
				rootBlockNode = null;
				node = node.nextSibling;
			}
		}
		if (wrapped && restoreSelection) {
			rng.setStart(startContainer, startOffset);
			rng.setEnd(endContainer, endOffset);
			selection.setRng(rng);
			editor.nodeChanged();
		}
	};
	var setup$a = function (editor) {
		if (getForcedRootBlock(editor)) {
			editor.on('NodeChange', curry(addRootBlocks, editor));
		}
	};

	var findBlockCaretContainer = function (editor) {
		return descendant(SugarElement.fromDom(editor.getBody()), '*[data-mce-caret]').fold(constant(null), function (elm) {
			return elm.dom;
		});
	};
	var removeIeControlRect = function (editor) {
		editor.selection.setRng(editor.selection.getRng());
	};
	var showBlockCaretContainer = function (editor, blockCaretContainer) {
		if (blockCaretContainer.hasAttribute('data-mce-caret')) {
			showCaretContainerBlock(blockCaretContainer);
			removeIeControlRect(editor);
			editor.selection.scrollIntoView(blockCaretContainer);
		}
	};
	var handleBlockContainer = function (editor, e) {
		var blockCaretContainer = findBlockCaretContainer(editor);
		if (!blockCaretContainer) {
			return;
		}
		if (e.type === 'compositionstart') {
			e.preventDefault();
			e.stopPropagation();
			showBlockCaretContainer(editor, blockCaretContainer);
			return;
		}
		if (hasContent(blockCaretContainer)) {
			showBlockCaretContainer(editor, blockCaretContainer);
			editor.undoManager.add();
		}
	};
	var setup$b = function (editor) {
		editor.on('keyup compositionstart', curry(handleBlockContainer, editor));
	};

	var BreakType;
	(function (BreakType) {
		BreakType[BreakType['Br'] = 0] = 'Br';
		BreakType[BreakType['Block'] = 1] = 'Block';
		BreakType[BreakType['Wrap'] = 2] = 'Wrap';
		BreakType[BreakType['Eol'] = 3] = 'Eol';
	}(BreakType || (BreakType = {})));
	var flip = function (direction, positions) {
		return direction === HDirection.Backwards ? reverse(positions) : positions;
	};
	var walk$3 = function (direction, caretWalker, pos) {
		return direction === HDirection.Forwards ? caretWalker.next(pos) : caretWalker.prev(pos);
	};
	var getBreakType = function (scope, direction, currentPos, nextPos) {
		if (isBr(nextPos.getNode(direction === HDirection.Forwards))) {
			return BreakType.Br;
		} else if (isInSameBlock(currentPos, nextPos) === false) {
			return BreakType.Block;
		} else {
			return BreakType.Wrap;
		}
	};
	var getPositionsUntil = function (predicate, direction, scope, start) {
		var caretWalker = CaretWalker(scope);
		var currentPos = start, nextPos;
		var positions = [];
		while (currentPos) {
			nextPos = walk$3(direction, caretWalker, currentPos);
			if (!nextPos) {
				break;
			}
			if (isBr(nextPos.getNode(false))) {
				if (direction === HDirection.Forwards) {
					return {
						positions: flip(direction, positions).concat([nextPos]),
						breakType: BreakType.Br,
						breakAt: Optional.some(nextPos)
					};
				} else {
					return {
						positions: flip(direction, positions),
						breakType: BreakType.Br,
						breakAt: Optional.some(nextPos)
					};
				}
			}
			if (!nextPos.isVisible()) {
				currentPos = nextPos;
				continue;
			}
			if (predicate(currentPos, nextPos)) {
				var breakType = getBreakType(scope, direction, currentPos, nextPos);
				return {
					positions: flip(direction, positions),
					breakType: breakType,
					breakAt: Optional.some(nextPos)
				};
			}
			positions.push(nextPos);
			currentPos = nextPos;
		}
		return {
			positions: flip(direction, positions),
			breakType: BreakType.Eol,
			breakAt: Optional.none()
		};
	};
	var getAdjacentLinePositions = function (direction, getPositionsUntilBreak, scope, start) {
		return getPositionsUntilBreak(scope, start).breakAt.map(function (pos) {
			var positions = getPositionsUntilBreak(scope, pos).positions;
			return direction === HDirection.Backwards ? positions.concat(pos) : [pos].concat(positions);
		}).getOr([]);
	};
	var findClosestHorizontalPositionFromPoint = function (positions, x) {
		return foldl(positions, function (acc, newPos) {
			return acc.fold(function () {
				return Optional.some(newPos);
			}, function (lastPos) {
				return lift2(head(lastPos.getClientRects()), head(newPos.getClientRects()), function (lastRect, newRect) {
					var lastDist = Math.abs(x - lastRect.left);
					var newDist = Math.abs(x - newRect.left);
					return newDist <= lastDist ? newPos : lastPos;
				}).or(acc);
			});
		}, Optional.none());
	};
	var findClosestHorizontalPosition = function (positions, pos) {
		return head(pos.getClientRects()).bind(function (targetRect) {
			return findClosestHorizontalPositionFromPoint(positions, targetRect.left);
		});
	};
	var getPositionsUntilPreviousLine = curry(getPositionsUntil, CaretPosition.isAbove, -1);
	var getPositionsUntilNextLine = curry(getPositionsUntil, CaretPosition.isBelow, 1);
	var isAtFirstLine = function (scope, pos) {
		return getPositionsUntilPreviousLine(scope, pos).breakAt.isNone();
	};
	var isAtLastLine = function (scope, pos) {
		return getPositionsUntilNextLine(scope, pos).breakAt.isNone();
	};
	var getPositionsAbove = curry(getAdjacentLinePositions, -1, getPositionsUntilPreviousLine);
	var getPositionsBelow = curry(getAdjacentLinePositions, 1, getPositionsUntilNextLine);
	var getFirstLinePositions = function (scope) {
		return firstPositionIn(scope).map(function (pos) {
			return [pos].concat(getPositionsUntilNextLine(scope, pos).positions);
		}).getOr([]);
	};
	var getLastLinePositions = function (scope) {
		return lastPositionIn(scope).map(function (pos) {
			return getPositionsUntilPreviousLine(scope, pos).positions.concat(pos);
		}).getOr([]);
	};

	var getNodeClientRects = function (node) {
		var toArrayWithNode = function (clientRects) {
			return map(clientRects, function (clientRect) {
				clientRect = clone$2(clientRect);
				clientRect.node = node;
				return clientRect;
			});
		};
		if (isElement$1(node)) {
			return toArrayWithNode(node.getClientRects());
		}
		if (isText$1(node)) {
			var rng = node.ownerDocument.createRange();
			rng.setStart(node, 0);
			rng.setEnd(node, node.data.length);
			return toArrayWithNode(rng.getClientRects());
		}
	};
	var getClientRects = function (nodes) {
		return bind(nodes, getNodeClientRects);
	};

	var VDirection;
	(function (VDirection) {
		VDirection[VDirection['Up'] = -1] = 'Up';
		VDirection[VDirection['Down'] = 1] = 'Down';
	}(VDirection || (VDirection = {})));
	var findUntil$1 = function (direction, root, predicateFn, node) {
		while (node = findNode(node, direction, isEditableCaretCandidate, root)) {
			if (predicateFn(node)) {
				return;
			}
		}
	};
	var walkUntil = function (direction, isAboveFn, isBeflowFn, root, predicateFn, caretPosition) {
		var line = 0;
		var result = [];
		var add = function (node) {
			var i, clientRect, clientRects;
			clientRects = getClientRects([node]);
			if (direction === -1) {
				clientRects = clientRects.reverse();
			}
			for (i = 0; i < clientRects.length; i++) {
				clientRect = clientRects[i];
				if (isBeflowFn(clientRect, targetClientRect)) {
					continue;
				}
				if (result.length > 0 && isAboveFn(clientRect, last$1(result))) {
					line++;
				}
				clientRect.line = line;
				if (predicateFn(clientRect)) {
					return true;
				}
				result.push(clientRect);
			}
		};
		var targetClientRect = last$1(caretPosition.getClientRects());
		if (!targetClientRect) {
			return result;
		}
		var node = caretPosition.getNode();
		add(node);
		findUntil$1(direction, root, add, node);
		return result;
	};
	var aboveLineNumber = function (lineNumber, clientRect) {
		return clientRect.line > lineNumber;
	};
	var isLineNumber = function (lineNumber, clientRect) {
		return clientRect.line === lineNumber;
	};
	var upUntil = curry(walkUntil, VDirection.Up, isAbove, isBelow);
	var downUntil = curry(walkUntil, VDirection.Down, isBelow, isAbove);
	var positionsUntil = function (direction, root, predicateFn, node) {
		var caretWalker = CaretWalker(root);
		var walkFn, isBelowFn, isAboveFn, caretPosition;
		var result = [];
		var line = 0, clientRect;
		var getClientRect = function (caretPosition) {
			if (direction === 1) {
				return last$1(caretPosition.getClientRects());
			}
			return last$1(caretPosition.getClientRects());
		};
		if (direction === 1) {
			walkFn = caretWalker.next;
			isBelowFn = isBelow;
			isAboveFn = isAbove;
			caretPosition = CaretPosition$1.after(node);
		} else {
			walkFn = caretWalker.prev;
			isBelowFn = isAbove;
			isAboveFn = isBelow;
			caretPosition = CaretPosition$1.before(node);
		}
		var targetClientRect = getClientRect(caretPosition);
		do {
			if (!caretPosition.isVisible()) {
				continue;
			}
			clientRect = getClientRect(caretPosition);
			if (isAboveFn(clientRect, targetClientRect)) {
				continue;
			}
			if (result.length > 0 && isBelowFn(clientRect, last$1(result))) {
				line++;
			}
			clientRect = clone$2(clientRect);
			clientRect.position = caretPosition;
			clientRect.line = line;
			if (predicateFn(clientRect)) {
				return result;
			}
			result.push(clientRect);
		} while (caretPosition = walkFn(caretPosition));
		return result;
	};
	var isAboveLine = function (lineNumber) {
		return function (clientRect) {
			return aboveLineNumber(lineNumber, clientRect);
		};
	};
	var isLine = function (lineNumber) {
		return function (clientRect) {
			return isLineNumber(lineNumber, clientRect);
		};
	};

	var isContentEditableFalse$8 = isContentEditableFalse;
	var findNode$1 = findNode;
	var distanceToRectLeft = function (clientRect, clientX) {
		return Math.abs(clientRect.left - clientX);
	};
	var distanceToRectRight = function (clientRect, clientX) {
		return Math.abs(clientRect.right - clientX);
	};
	var isInsideX = function (clientX, clientRect) {
		return clientX >= clientRect.left && clientX <= clientRect.right;
	};
	var isInsideY = function (clientY, clientRect) {
		return clientY >= clientRect.top && clientY <= clientRect.bottom;
	};
	var findClosestClientRect = function (clientRects, clientX) {
		return reduce(clientRects, function (oldClientRect, clientRect) {
			var oldDistance = Math.min(distanceToRectLeft(oldClientRect, clientX), distanceToRectRight(oldClientRect, clientX));
			var newDistance = Math.min(distanceToRectLeft(clientRect, clientX), distanceToRectRight(clientRect, clientX));
			if (isInsideX(clientX, clientRect)) {
				return clientRect;
			}
			if (isInsideX(clientX, oldClientRect)) {
				return oldClientRect;
			}
			if (newDistance === oldDistance && isContentEditableFalse$8(clientRect.node)) {
				return clientRect;
			}
			if (newDistance < oldDistance) {
				return clientRect;
			}
			return oldClientRect;
		});
	};
	var walkUntil$1 = function (direction, root, predicateFn, startNode, includeChildren) {
		var node = findNode$1(startNode, direction, isEditableCaretCandidate, root, !includeChildren);
		do {
			if (!node || predicateFn(node)) {
				return;
			}
		} while (node = findNode$1(node, direction, isEditableCaretCandidate, root));
	};
	var findLineNodeRects = function (root, targetNodeRect, includeChildren) {
		if (includeChildren === void 0) {
			includeChildren = true;
		}
		var clientRects = [];
		var collect = function (checkPosFn, node) {
			var lineRects = filter(getClientRects([node]), function (clientRect) {
				return !checkPosFn(clientRect, targetNodeRect);
			});
			clientRects = clientRects.concat(lineRects);
			return lineRects.length === 0;
		};
		clientRects.push(targetNodeRect);
		walkUntil$1(VDirection.Up, root, curry(collect, isAbove), targetNodeRect.node, includeChildren);
		walkUntil$1(VDirection.Down, root, curry(collect, isBelow), targetNodeRect.node, includeChildren);
		return clientRects;
	};
	var getFakeCaretTargets = function (root) {
		return filter(from$1(root.getElementsByTagName('*')), isFakeCaretTarget);
	};
	var caretInfo = function (clientRect, clientX) {
		return {
			node: clientRect.node,
			before: distanceToRectLeft(clientRect, clientX) < distanceToRectRight(clientRect, clientX)
		};
	};
	var closestFakeCaret = function (root, clientX, clientY) {
		var fakeTargetNodeRects = getClientRects(getFakeCaretTargets(root));
		var targetNodeRects = filter(fakeTargetNodeRects, curry(isInsideY, clientY));
		var closestNodeRect = findClosestClientRect(targetNodeRects, clientX);
		if (closestNodeRect) {
			var includeChildren = !isTable(closestNodeRect.node) && !isMedia(closestNodeRect.node);
			closestNodeRect = findClosestClientRect(findLineNodeRects(root, closestNodeRect, includeChildren), clientX);
			if (closestNodeRect && isFakeCaretTarget(closestNodeRect.node)) {
				return caretInfo(closestNodeRect, clientX);
			}
		}
		return null;
	};

	var moveToRange = function (editor, rng) {
		editor.selection.setRng(rng);
		scrollRangeIntoView(editor, editor.selection.getRng());
	};
	var renderRangeCaretOpt = function (editor, range, scrollIntoView) {
		return Optional.some(renderRangeCaret(editor, range, scrollIntoView));
	};
	var moveHorizontally = function (editor, direction, range, isBefore, isAfter, isElement) {
		var forwards = direction === HDirection.Forwards;
		var caretWalker = CaretWalker(editor.getBody());
		var getNextPosFn = curry(getVisualCaretPosition, forwards ? caretWalker.next : caretWalker.prev);
		var isBeforeFn = forwards ? isBefore : isAfter;
		if (!range.collapsed) {
			var node = getSelectedNode(range);
			if (isElement(node)) {
				return showCaret(direction, editor, node, direction === HDirection.Backwards, false);
			}
		}
		var caretPosition = getNormalizedRangeEndPoint(direction, editor.getBody(), range);
		if (isBeforeFn(caretPosition)) {
			return selectNode(editor, caretPosition.getNode(!forwards));
		}
		var nextCaretPosition = normalizePosition(forwards, getNextPosFn(caretPosition));
		var rangeIsInContainerBlock = isRangeInCaretContainerBlock(range);
		if (!nextCaretPosition) {
			return rangeIsInContainerBlock ? Optional.some(range) : Optional.none();
		}
		if (isBeforeFn(nextCaretPosition)) {
			return showCaret(direction, editor, nextCaretPosition.getNode(!forwards), forwards, false);
		}
		var peekCaretPosition = getNextPosFn(nextCaretPosition);
		if (peekCaretPosition && isBeforeFn(peekCaretPosition)) {
			if (isMoveInsideSameBlock(nextCaretPosition, peekCaretPosition)) {
				return showCaret(direction, editor, peekCaretPosition.getNode(!forwards), forwards, false);
			}
		}
		if (rangeIsInContainerBlock) {
			return renderRangeCaretOpt(editor, nextCaretPosition.toRange(), false);
		}
		return Optional.none();
	};
	var moveVertically = function (editor, direction, range, isBefore, isAfter, isElement) {
		var caretPosition = getNormalizedRangeEndPoint(direction, editor.getBody(), range);
		var caretClientRect = last$1(caretPosition.getClientRects());
		var forwards = direction === VDirection.Down;
		if (!caretClientRect) {
			return Optional.none();
		}
		var walkerFn = forwards ? downUntil : upUntil;
		var linePositions = walkerFn(editor.getBody(), isAboveLine(1), caretPosition);
		var nextLinePositions = filter(linePositions, isLine(1));
		var clientX = caretClientRect.left;
		var nextLineRect = findClosestClientRect(nextLinePositions, clientX);
		if (nextLineRect && isElement(nextLineRect.node)) {
			var dist1 = Math.abs(clientX - nextLineRect.left);
			var dist2 = Math.abs(clientX - nextLineRect.right);
			return showCaret(direction, editor, nextLineRect.node, dist1 < dist2, false);
		}
		var currentNode;
		if (isBefore(caretPosition)) {
			currentNode = caretPosition.getNode();
		} else if (isAfter(caretPosition)) {
			currentNode = caretPosition.getNode(true);
		} else {
			currentNode = getSelectedNode(range);
		}
		if (currentNode) {
			var caretPositions = positionsUntil(direction, editor.getBody(), isAboveLine(1), currentNode);
			var closestNextLineRect = findClosestClientRect(filter(caretPositions, isLine(1)), clientX);
			if (closestNextLineRect) {
				return renderRangeCaretOpt(editor, closestNextLineRect.position.toRange(), false);
			}
			closestNextLineRect = last$1(filter(caretPositions, isLine(0)));
			if (closestNextLineRect) {
				return renderRangeCaretOpt(editor, closestNextLineRect.position.toRange(), false);
			}
		}
		if (nextLinePositions.length === 0) {
			return getLineEndPoint(editor, forwards).filter(forwards ? isAfter : isBefore).map(function (pos) {
				return renderRangeCaret(editor, pos.toRange(), false);
			});
		}
		return Optional.none();
	};
	var getLineEndPoint = function (editor, forward) {
		var rng = editor.selection.getRng();
		var body = editor.getBody();
		if (forward) {
			var from = CaretPosition$1.fromRangeEnd(rng);
			var result = getPositionsUntilNextLine(body, from);
			return last(result.positions);
		} else {
			var from = CaretPosition$1.fromRangeStart(rng);
			var result = getPositionsUntilPreviousLine(body, from);
			return head(result.positions);
		}
	};
	var moveToLineEndPoint = function (editor, forward, isElementPosition) {
		return getLineEndPoint(editor, forward).filter(isElementPosition).exists(function (pos) {
			editor.selection.setRng(pos.toRange());
			return true;
		});
	};

	var isContentEditableFalse$9 = isContentEditableFalse;
	var moveToCeFalseHorizontally = function (direction, editor, range) {
		return moveHorizontally(editor, direction, range, isBeforeContentEditableFalse, isAfterContentEditableFalse, isContentEditableFalse$9);
	};
	var moveToCeFalseVertically = function (direction, editor, range) {
		var isBefore = function (caretPosition) {
			return isBeforeContentEditableFalse(caretPosition) || isBeforeTable(caretPosition);
		};
		var isAfter = function (caretPosition) {
			return isAfterContentEditableFalse(caretPosition) || isAfterTable(caretPosition);
		};
		return moveVertically(editor, direction, range, isBefore, isAfter, isContentEditableFalse$9);
	};
	var createTextBlock = function (editor) {
		var textBlock = editor.dom.create(getForcedRootBlock(editor));
		if (!Env.ie || Env.ie >= 11) {
			textBlock.innerHTML = '<br data-mce-bogus="1">';
		}
		return textBlock;
	};
	var exitPreBlock = function (editor, direction, range) {
		var caretWalker = CaretWalker(editor.getBody());
		var getVisualCaretPosition$1 = curry(getVisualCaretPosition, direction === 1 ? caretWalker.next : caretWalker.prev);
		if (range.collapsed && hasForcedRootBlock(editor)) {
			var pre = editor.dom.getParent(range.startContainer, 'PRE');
			if (!pre) {
				return;
			}
			var caretPos = getVisualCaretPosition$1(CaretPosition$1.fromRangeStart(range));
			if (!caretPos) {
				var newBlock = createTextBlock(editor);
				if (direction === 1) {
					editor.$(pre).after(newBlock);
				} else {
					editor.$(pre).before(newBlock);
				}
				editor.selection.select(newBlock, true);
				editor.selection.collapse();
			}
		}
	};
	var getHorizontalRange = function (editor, forward) {
		var direction = forward ? HDirection.Forwards : HDirection.Backwards;
		var range = editor.selection.getRng();
		return moveToCeFalseHorizontally(direction, editor, range).orThunk(function () {
			exitPreBlock(editor, direction, range);
			return Optional.none();
		});
	};
	var getVerticalRange = function (editor, down) {
		var direction = down ? 1 : -1;
		var range = editor.selection.getRng();
		return moveToCeFalseVertically(direction, editor, range).orThunk(function () {
			exitPreBlock(editor, direction, range);
			return Optional.none();
		});
	};
	var moveH = function (editor, forward) {
		return getHorizontalRange(editor, forward).exists(function (newRange) {
			moveToRange(editor, newRange);
			return true;
		});
	};
	var moveV = function (editor, down) {
		return getVerticalRange(editor, down).exists(function (newRange) {
			moveToRange(editor, newRange);
			return true;
		});
	};
	var moveToLineEndPoint$1 = function (editor, forward) {
		var isCefPosition = forward ? isAfterContentEditableFalse : isBeforeContentEditableFalse;
		return moveToLineEndPoint(editor, forward, isCefPosition);
	};

	var isTarget = function (node) {
		return contains(['figcaption'], name(node));
	};
	var rangeBefore = function (target) {
		var rng = document.createRange();
		rng.setStartBefore(target.dom);
		rng.setEndBefore(target.dom);
		return rng;
	};
	var insertElement = function (root, elm, forward) {
		if (forward) {
			append(root, elm);
		} else {
			prepend(root, elm);
		}
	};
	var insertBr = function (root, forward) {
		var br = SugarElement.fromTag('br');
		insertElement(root, br, forward);
		return rangeBefore(br);
	};
	var insertBlock$1 = function (root, forward, blockName, attrs) {
		var block = SugarElement.fromTag(blockName);
		var br = SugarElement.fromTag('br');
		setAll(block, attrs);
		append(block, br);
		insertElement(root, block, forward);
		return rangeBefore(br);
	};
	var insertEmptyLine = function (root, rootBlockName, attrs, forward) {
		if (rootBlockName === '') {
			return insertBr(root, forward);
		} else {
			return insertBlock$1(root, forward, rootBlockName, attrs);
		}
	};
	var getClosestTargetBlock = function (pos, root) {
		var isRoot = curry(eq$2, root);
		return closest(SugarElement.fromDom(pos.container()), isBlock, isRoot).filter(isTarget);
	};
	var isAtFirstOrLastLine = function (root, forward, pos) {
		return forward ? isAtLastLine(root.dom, pos) : isAtFirstLine(root.dom, pos);
	};
	var moveCaretToNewEmptyLine = function (editor, forward) {
		var root = SugarElement.fromDom(editor.getBody());
		var pos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		var rootBlock = getForcedRootBlock(editor);
		var rootBlockAttrs = getForcedRootBlockAttrs(editor);
		return getClosestTargetBlock(pos, root).exists(function () {
			if (isAtFirstOrLastLine(root, forward, pos)) {
				var rng = insertEmptyLine(root, rootBlock, rootBlockAttrs, forward);
				editor.selection.setRng(rng);
				return true;
			} else {
				return false;
			}
		});
	};
	var moveV$1 = function (editor, forward) {
		if (editor.selection.isCollapsed()) {
			return moveCaretToNewEmptyLine(editor, forward);
		} else {
			return false;
		}
	};

	var defaultPatterns = function (patterns) {
		return map(patterns, function (pattern) {
			return __assign({
				shiftKey: false,
				altKey: false,
				ctrlKey: false,
				metaKey: false,
				keyCode: 0,
				action: noop
			}, pattern);
		});
	};
	var matchesEvent = function (pattern, evt) {
		return evt.keyCode === pattern.keyCode && evt.shiftKey === pattern.shiftKey && evt.altKey === pattern.altKey && evt.ctrlKey === pattern.ctrlKey && evt.metaKey === pattern.metaKey;
	};
	var match$1 = function (patterns, evt) {
		return bind(defaultPatterns(patterns), function (pattern) {
			return matchesEvent(pattern, evt) ? [pattern] : [];
		});
	};
	var action = function (f) {
		var x = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			x[_i - 1] = arguments[_i];
		}
		return function () {
			return f.apply(null, x);
		};
	};
	var execute = function (patterns, evt) {
		return find(match$1(patterns, evt), function (pattern) {
			return pattern.action();
		});
	};

	var moveH$1 = function (editor, forward) {
		var direction = forward ? HDirection.Forwards : HDirection.Backwards;
		var range = editor.selection.getRng();
		return moveHorizontally(editor, direction, range, isBeforeMedia, isAfterMedia, isMedia).exists(function (newRange) {
			moveToRange(editor, newRange);
			return true;
		});
	};
	var moveV$2 = function (editor, down) {
		var direction = down ? 1 : -1;
		var range = editor.selection.getRng();
		return moveVertically(editor, direction, range, isBeforeMedia, isAfterMedia, isMedia).exists(function (newRange) {
			moveToRange(editor, newRange);
			return true;
		});
	};
	var moveToLineEndPoint$2 = function (editor, forward) {
		var isNearMedia = forward ? isAfterMedia : isBeforeMedia;
		return moveToLineEndPoint(editor, forward, isNearMedia);
	};

	var deflate = function (rect, delta) {
		return {
			left: rect.left - delta,
			top: rect.top - delta,
			right: rect.right + delta * 2,
			bottom: rect.bottom + delta * 2,
			width: rect.width + delta,
			height: rect.height + delta
		};
	};
	var getCorners = function (getYAxisValue, tds) {
		return bind(tds, function (td) {
			var rect = deflate(clone$2(td.getBoundingClientRect()), -1);
			return [
				{
					x: rect.left,
					y: getYAxisValue(rect),
					cell: td
				},
				{
					x: rect.right,
					y: getYAxisValue(rect),
					cell: td
				}
			];
		});
	};
	var findClosestCorner = function (corners, x, y) {
		return foldl(corners, function (acc, newCorner) {
			return acc.fold(function () {
				return Optional.some(newCorner);
			}, function (oldCorner) {
				var oldDist = Math.sqrt(Math.abs(oldCorner.x - x) + Math.abs(oldCorner.y - y));
				var newDist = Math.sqrt(Math.abs(newCorner.x - x) + Math.abs(newCorner.y - y));
				return Optional.some(newDist < oldDist ? newCorner : oldCorner);
			});
		}, Optional.none());
	};
	var getClosestCell$1 = function (getYAxisValue, isTargetCorner, table, x, y) {
		var cells = descendants$1(SugarElement.fromDom(table), 'td,th,caption').map(function (e) {
			return e.dom;
		});
		var corners = filter(getCorners(getYAxisValue, cells), function (corner) {
			return isTargetCorner(corner, y);
		});
		return findClosestCorner(corners, x, y).map(function (corner) {
			return corner.cell;
		});
	};
	var getBottomValue = function (rect) {
		return rect.bottom;
	};
	var getTopValue = function (rect) {
		return rect.top;
	};
	var isAbove$1 = function (corner, y) {
		return corner.y < y;
	};
	var isBelow$1 = function (corner, y) {
		return corner.y > y;
	};
	var getClosestCellAbove = curry(getClosestCell$1, getBottomValue, isAbove$1);
	var getClosestCellBelow = curry(getClosestCell$1, getTopValue, isBelow$1);
	var findClosestPositionInAboveCell = function (table, pos) {
		return head(pos.getClientRects()).bind(function (rect) {
			return getClosestCellAbove(table, rect.left, rect.top);
		}).bind(function (cell) {
			return findClosestHorizontalPosition(getLastLinePositions(cell), pos);
		});
	};
	var findClosestPositionInBelowCell = function (table, pos) {
		return last(pos.getClientRects()).bind(function (rect) {
			return getClosestCellBelow(table, rect.left, rect.top);
		}).bind(function (cell) {
			return findClosestHorizontalPosition(getFirstLinePositions(cell), pos);
		});
	};

	var hasNextBreak = function (getPositionsUntil, scope, lineInfo) {
		return lineInfo.breakAt.exists(function (breakPos) {
			return getPositionsUntil(scope, breakPos).breakAt.isSome();
		});
	};
	var startsWithWrapBreak = function (lineInfo) {
		return lineInfo.breakType === BreakType.Wrap && lineInfo.positions.length === 0;
	};
	var startsWithBrBreak = function (lineInfo) {
		return lineInfo.breakType === BreakType.Br && lineInfo.positions.length === 1;
	};
	var isAtTableCellLine = function (getPositionsUntil, scope, pos) {
		var lineInfo = getPositionsUntil(scope, pos);
		if (startsWithWrapBreak(lineInfo) || !isBr(pos.getNode()) && startsWithBrBreak(lineInfo)) {
			return !hasNextBreak(getPositionsUntil, scope, lineInfo);
		} else {
			return lineInfo.breakAt.isNone();
		}
	};
	var isAtFirstTableCellLine = curry(isAtTableCellLine, getPositionsUntilPreviousLine);
	var isAtLastTableCellLine = curry(isAtTableCellLine, getPositionsUntilNextLine);
	var isCaretAtStartOrEndOfTable = function (forward, rng, table) {
		var caretPos = CaretPosition$1.fromRangeStart(rng);
		return positionIn(!forward, table).exists(function (pos) {
			return pos.isEqual(caretPos);
		});
	};
	var navigateHorizontally = function (editor, forward, table, _td) {
		var rng = editor.selection.getRng();
		var direction = forward ? 1 : -1;
		if (isFakeCaretTableBrowser() && isCaretAtStartOrEndOfTable(forward, rng, table)) {
			showCaret(direction, editor, table, !forward, false).each(function (newRng) {
				moveToRange(editor, newRng);
			});
			return true;
		}
		return false;
	};
	var getClosestAbovePosition = function (root, table, start) {
		return findClosestPositionInAboveCell(table, start).orThunk(function () {
			return head(start.getClientRects()).bind(function (rect) {
				return findClosestHorizontalPositionFromPoint(getPositionsAbove(root, CaretPosition$1.before(table)), rect.left);
			});
		}).getOr(CaretPosition$1.before(table));
	};
	var getClosestBelowPosition = function (root, table, start) {
		return findClosestPositionInBelowCell(table, start).orThunk(function () {
			return head(start.getClientRects()).bind(function (rect) {
				return findClosestHorizontalPositionFromPoint(getPositionsBelow(root, CaretPosition$1.after(table)), rect.left);
			});
		}).getOr(CaretPosition$1.after(table));
	};
	var getTable = function (previous, pos) {
		var node = pos.getNode(previous);
		return isElement$1(node) && node.nodeName === 'TABLE' ? Optional.some(node) : Optional.none();
	};
	var renderBlock = function (down, editor, table, pos) {
		var forcedRootBlock = getForcedRootBlock(editor);
		if (forcedRootBlock) {
			editor.undoManager.transact(function () {
				var element = SugarElement.fromTag(forcedRootBlock);
				setAll(element, getForcedRootBlockAttrs(editor));
				append(element, SugarElement.fromTag('br'));
				if (down) {
					after(SugarElement.fromDom(table), element);
				} else {
					before(SugarElement.fromDom(table), element);
				}
				var rng = editor.dom.createRng();
				rng.setStart(element.dom, 0);
				rng.setEnd(element.dom, 0);
				moveToRange(editor, rng);
			});
		} else {
			moveToRange(editor, pos.toRange());
		}
	};
	var moveCaret = function (editor, down, pos) {
		var table = down ? getTable(true, pos) : getTable(false, pos);
		var last = down === false;
		table.fold(function () {
			return moveToRange(editor, pos.toRange());
		}, function (table) {
			return positionIn(last, editor.getBody()).filter(function (lastPos) {
				return lastPos.isEqual(pos);
			}).fold(function () {
				return moveToRange(editor, pos.toRange());
			}, function (_) {
				return renderBlock(down, editor, table, pos);
			});
		});
	};
	var navigateVertically = function (editor, down, table, td) {
		var rng = editor.selection.getRng();
		var pos = CaretPosition$1.fromRangeStart(rng);
		var root = editor.getBody();
		if (!down && isAtFirstTableCellLine(td, pos)) {
			var newPos = getClosestAbovePosition(root, table, pos);
			moveCaret(editor, down, newPos);
			return true;
		} else if (down && isAtLastTableCellLine(td, pos)) {
			var newPos = getClosestBelowPosition(root, table, pos);
			moveCaret(editor, down, newPos);
			return true;
		} else {
			return false;
		}
	};
	var move$1 = function (editor, forward, mover) {
		return Optional.from(editor.dom.getParent(editor.selection.getNode(), 'td,th')).bind(function (td) {
			return Optional.from(editor.dom.getParent(td, 'table')).map(function (table) {
				return mover(editor, forward, table, td);
			});
		}).getOr(false);
	};
	var moveH$2 = function (editor, forward) {
		return move$1(editor, forward, navigateHorizontally);
	};
	var moveV$3 = function (editor, forward) {
		return move$1(editor, forward, navigateVertically);
	};

	var executeKeydownOverride = function (editor, caret, evt) {
		var os = detect$3().os;
		execute([
			{
				keyCode: VK.RIGHT,
				action: action(moveH, editor, true)
			},
			{
				keyCode: VK.LEFT,
				action: action(moveH, editor, false)
			},
			{
				keyCode: VK.UP,
				action: action(moveV, editor, false)
			},
			{
				keyCode: VK.DOWN,
				action: action(moveV, editor, true)
			},
			{
				keyCode: VK.RIGHT,
				action: action(moveH$2, editor, true)
			},
			{
				keyCode: VK.LEFT,
				action: action(moveH$2, editor, false)
			},
			{
				keyCode: VK.UP,
				action: action(moveV$3, editor, false)
			},
			{
				keyCode: VK.DOWN,
				action: action(moveV$3, editor, true)
			},
			{
				keyCode: VK.RIGHT,
				action: action(moveH$1, editor, true)
			},
			{
				keyCode: VK.LEFT,
				action: action(moveH$1, editor, false)
			},
			{
				keyCode: VK.UP,
				action: action(moveV$2, editor, false)
			},
			{
				keyCode: VK.DOWN,
				action: action(moveV$2, editor, true)
			},
			{
				keyCode: VK.RIGHT,
				action: action(move, editor, caret, true)
			},
			{
				keyCode: VK.LEFT,
				action: action(move, editor, caret, false)
			},
			{
				keyCode: VK.RIGHT,
				ctrlKey: !os.isOSX(),
				altKey: os.isOSX(),
				action: action(moveNextWord, editor, caret)
			},
			{
				keyCode: VK.LEFT,
				ctrlKey: !os.isOSX(),
				altKey: os.isOSX(),
				action: action(movePrevWord, editor, caret)
			},
			{
				keyCode: VK.UP,
				action: action(moveV$1, editor, false)
			},
			{
				keyCode: VK.DOWN,
				action: action(moveV$1, editor, true)
			}
		], evt).each(function (_) {
			evt.preventDefault();
		});
	};
	var setup$c = function (editor, caret) {
		editor.on('keydown', function (evt) {
			if (evt.isDefaultPrevented() === false) {
				executeKeydownOverride(editor, caret, evt);
			}
		});
	};

	var executeKeydownOverride$1 = function (editor, caret, evt) {
		execute([
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$9, editor, false)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$4, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$4, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$3, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$3, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$6, editor, caret, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$6, editor, caret, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$5, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$5, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$8, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$8, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$2, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$2, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$1, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$1, editor, true)
			},
			{
				keyCode: VK.BACKSPACE,
				action: action(backspaceDelete$7, editor, false)
			},
			{
				keyCode: VK.DELETE,
				action: action(backspaceDelete$7, editor, true)
			}
		], evt).each(function (_) {
			evt.preventDefault();
		});
	};
	var executeKeyupOverride = function (editor, evt) {
		execute([
			{
				keyCode: VK.BACKSPACE,
				action: action(paddEmptyElement, editor)
			},
			{
				keyCode: VK.DELETE,
				action: action(paddEmptyElement, editor)
			}
		], evt);
	};
	var setup$d = function (editor, caret) {
		editor.on('keydown', function (evt) {
			if (evt.isDefaultPrevented() === false) {
				executeKeydownOverride$1(editor, caret, evt);
			}
		});
		editor.on('keyup', function (evt) {
			if (evt.isDefaultPrevented() === false) {
				executeKeyupOverride(editor, evt);
			}
		});
	};

	var firstNonWhiteSpaceNodeSibling = function (node) {
		while (node) {
			if (node.nodeType === 1 || node.nodeType === 3 && node.data && /[\r\n\s]/.test(node.data)) {
				return node;
			}
			node = node.nextSibling;
		}
	};
	var moveToCaretPosition = function (editor, root) {
		var node, lastNode = root;
		var dom = editor.dom;
		var moveCaretBeforeOnEnterElementsMap = editor.schema.getMoveCaretBeforeOnEnterElements();
		if (!root) {
			return;
		}
		if (/^(LI|DT|DD)$/.test(root.nodeName)) {
			var firstChild = firstNonWhiteSpaceNodeSibling(root.firstChild);
			if (firstChild && /^(UL|OL|DL)$/.test(firstChild.nodeName)) {
				root.insertBefore(dom.doc.createTextNode(nbsp), root.firstChild);
			}
		}
		var rng = dom.createRng();
		root.normalize();
		if (root.hasChildNodes()) {
			var walker = new DomTreeWalker(root, root);
			while (node = walker.current()) {
				if (isText$1(node)) {
					rng.setStart(node, 0);
					rng.setEnd(node, 0);
					break;
				}
				if (moveCaretBeforeOnEnterElementsMap[node.nodeName.toLowerCase()]) {
					rng.setStartBefore(node);
					rng.setEndBefore(node);
					break;
				}
				lastNode = node;
				node = walker.next();
			}
			if (!node) {
				rng.setStart(lastNode, 0);
				rng.setEnd(lastNode, 0);
			}
		} else {
			if (isBr(root)) {
				if (root.nextSibling && dom.isBlock(root.nextSibling)) {
					rng.setStartBefore(root);
					rng.setEndBefore(root);
				} else {
					rng.setStartAfter(root);
					rng.setEndAfter(root);
				}
			} else {
				rng.setStart(root, 0);
				rng.setEnd(root, 0);
			}
		}
		editor.selection.setRng(rng);
		scrollRangeIntoView(editor, rng);
	};
	var getEditableRoot = function (dom, node) {
		var root = dom.getRoot();
		var parent, editableRoot;
		parent = node;
		while (parent !== root && dom.getContentEditable(parent) !== 'false') {
			if (dom.getContentEditable(parent) === 'true') {
				editableRoot = parent;
			}
			parent = parent.parentNode;
		}
		return parent !== root ? editableRoot : root;
	};
	var getParentBlock$2 = function (editor) {
		return Optional.from(editor.dom.getParent(editor.selection.getStart(true), editor.dom.isBlock));
	};
	var getParentBlockName = function (editor) {
		return getParentBlock$2(editor).fold(constant(''), function (parentBlock) {
			return parentBlock.nodeName.toUpperCase();
		});
	};
	var isListItemParentBlock = function (editor) {
		return getParentBlock$2(editor).filter(function (elm) {
			return isListItem(SugarElement.fromDom(elm));
		}).isSome();
	};

	var hasFirstChild = function (elm, name) {
		return elm.firstChild && elm.firstChild.nodeName === name;
	};
	var hasParent$1 = function (elm, parentName) {
		return elm && elm.parentNode && elm.parentNode.nodeName === parentName;
	};
	var isListBlock = function (elm) {
		return elm && /^(OL|UL|LI)$/.test(elm.nodeName);
	};
	var isNestedList = function (elm) {
		return isListBlock(elm) && isListBlock(elm.parentNode);
	};
	var getContainerBlock = function (containerBlock) {
		var containerBlockParent = containerBlock.parentNode;
		if (/^(LI|DT|DD)$/.test(containerBlockParent.nodeName)) {
			return containerBlockParent;
		}
		return containerBlock;
	};
	var isFirstOrLastLi = function (containerBlock, parentBlock, first) {
		var node = containerBlock[first ? 'firstChild' : 'lastChild'];
		while (node) {
			if (isElement$1(node)) {
				break;
			}
			node = node[first ? 'nextSibling' : 'previousSibling'];
		}
		return node === parentBlock;
	};
	var insert = function (editor, createNewBlock, containerBlock, parentBlock, newBlockName) {
		var dom = editor.dom;
		var rng = editor.selection.getRng();
		if (containerBlock === editor.getBody()) {
			return;
		}
		if (isNestedList(containerBlock)) {
			newBlockName = 'LI';
		}
		var newBlock = newBlockName ? createNewBlock(newBlockName) : dom.create('BR');
		if (isFirstOrLastLi(containerBlock, parentBlock, true) && isFirstOrLastLi(containerBlock, parentBlock, false)) {
			if (hasParent$1(containerBlock, 'LI')) {
				dom.insertAfter(newBlock, getContainerBlock(containerBlock));
			} else {
				dom.replace(newBlock, containerBlock);
			}
		} else if (isFirstOrLastLi(containerBlock, parentBlock, true)) {
			if (hasParent$1(containerBlock, 'LI')) {
				dom.insertAfter(newBlock, getContainerBlock(containerBlock));
				newBlock.appendChild(dom.doc.createTextNode(' '));
				newBlock.appendChild(containerBlock);
			} else {
				containerBlock.parentNode.insertBefore(newBlock, containerBlock);
			}
		} else if (isFirstOrLastLi(containerBlock, parentBlock, false)) {
			dom.insertAfter(newBlock, getContainerBlock(containerBlock));
		} else {
			containerBlock = getContainerBlock(containerBlock);
			var tmpRng = rng.cloneRange();
			tmpRng.setStartAfter(parentBlock);
			tmpRng.setEndAfter(containerBlock);
			var fragment = tmpRng.extractContents();
			if (newBlockName === 'LI' && hasFirstChild(fragment, 'LI')) {
				newBlock = fragment.firstChild;
				dom.insertAfter(fragment, containerBlock);
			} else {
				dom.insertAfter(fragment, containerBlock);
				dom.insertAfter(newBlock, containerBlock);
			}
		}
		dom.remove(parentBlock);
		moveToCaretPosition(editor, newBlock);
	};

	var trimZwsp = function (fragment) {
		each(descendants(SugarElement.fromDom(fragment), isText), function (text) {
			var rawNode = text.dom;
			rawNode.nodeValue = trim$2(rawNode.nodeValue);
		});
	};
	var isEmptyAnchor = function (dom, elm) {
		return elm && elm.nodeName === 'A' && dom.isEmpty(elm);
	};
	var isTableCell$5 = function (node) {
		return node && /^(TD|TH|CAPTION)$/.test(node.nodeName);
	};
	var emptyBlock = function (elm) {
		elm.innerHTML = '<br data-mce-bogus="1">';
	};
	var containerAndSiblingName = function (container, nodeName) {
		return container.nodeName === nodeName || container.previousSibling && container.previousSibling.nodeName === nodeName;
	};
	var canSplitBlock = function (dom, node) {
		return node && dom.isBlock(node) && !/^(TD|TH|CAPTION|FORM)$/.test(node.nodeName) && !/^(fixed|absolute)/i.test(node.style.position) && dom.getContentEditable(node) !== 'true';
	};
	var trimInlineElementsOnLeftSideOfBlock = function (dom, nonEmptyElementsMap, block) {
		var node = block;
		var firstChilds = [];
		var i;
		if (!node) {
			return;
		}
		while (node = node.firstChild) {
			if (dom.isBlock(node)) {
				return;
			}
			if (isElement$1(node) && !nonEmptyElementsMap[node.nodeName.toLowerCase()]) {
				firstChilds.push(node);
			}
		}
		i = firstChilds.length;
		while (i--) {
			node = firstChilds[i];
			if (!node.hasChildNodes() || node.firstChild === node.lastChild && node.firstChild.nodeValue === '') {
				dom.remove(node);
			} else {
				if (isEmptyAnchor(dom, node)) {
					dom.remove(node);
				}
			}
		}
	};
	var normalizeZwspOffset = function (start, container, offset) {
		if (isText$1(container) === false) {
			return offset;
		} else if (start) {
			return offset === 1 && container.data.charAt(offset - 1) === ZWSP ? 0 : offset;
		} else {
			return offset === container.data.length - 1 && container.data.charAt(offset) === ZWSP ? container.data.length : offset;
		}
	};
	var includeZwspInRange = function (rng) {
		var newRng = rng.cloneRange();
		newRng.setStart(rng.startContainer, normalizeZwspOffset(true, rng.startContainer, rng.startOffset));
		newRng.setEnd(rng.endContainer, normalizeZwspOffset(false, rng.endContainer, rng.endOffset));
		return newRng;
	};
	var trimLeadingLineBreaks = function (node) {
		do {
			if (isText$1(node)) {
				node.nodeValue = node.nodeValue.replace(/^[\r\n]+/, '');
			}
			node = node.firstChild;
		} while (node);
	};
	var getEditableRoot$1 = function (dom, node) {
		var root = dom.getRoot();
		var parent, editableRoot;
		parent = node;
		while (parent !== root && dom.getContentEditable(parent) !== 'false') {
			if (dom.getContentEditable(parent) === 'true') {
				editableRoot = parent;
			}
			parent = parent.parentNode;
		}
		return parent !== root ? editableRoot : root;
	};
	var applyAttributes = function (editor, node, forcedRootBlockAttrs) {
		var dom = editor.dom;
		Optional.from(forcedRootBlockAttrs.style).map(dom.parseStyle).each(function (attrStyles) {
			var currentStyles = getAllRaw(SugarElement.fromDom(node));
			var newStyles = __assign(__assign({}, currentStyles), attrStyles);
			dom.setStyles(node, newStyles);
		});
		var attrClassesOpt = Optional.from(forcedRootBlockAttrs.class).map(function (attrClasses) {
			return attrClasses.split(/\s+/);
		});
		var currentClassesOpt = Optional.from(node.className).map(function (currentClasses) {
			return filter(currentClasses.split(/\s+/), function (clazz) {
				return clazz !== '';
			});
		});
		lift2(attrClassesOpt, currentClassesOpt, function (attrClasses, currentClasses) {
			var filteredClasses = filter(currentClasses, function (clazz) {
				return !contains(attrClasses, clazz);
			});
			var newClasses = __spreadArrays(attrClasses, filteredClasses);
			dom.setAttrib(node, 'class', newClasses.join(' '));
		});
		var appliedAttrs = [
			'style',
			'class'
		];
		var remainingAttrs = filter$1(forcedRootBlockAttrs, function (_, attrs) {
			return !contains(appliedAttrs, attrs);
		});
		dom.setAttribs(node, remainingAttrs);
	};
	var setForcedBlockAttrs = function (editor, node) {
		var forcedRootBlockName = getForcedRootBlock(editor);
		if (forcedRootBlockName && forcedRootBlockName.toLowerCase() === node.tagName.toLowerCase()) {
			var forcedRootBlockAttrs = getForcedRootBlockAttrs(editor);
			applyAttributes(editor, node, forcedRootBlockAttrs);
		}
	};
	var wrapSelfAndSiblingsInDefaultBlock = function (editor, newBlockName, rng, container, offset) {
		var newBlock, parentBlock, startNode, node, next, rootBlockName;
		var blockName = newBlockName || 'P';
		var dom = editor.dom, editableRoot = getEditableRoot$1(dom, container);
		parentBlock = dom.getParent(container, dom.isBlock);
		if (!parentBlock || !canSplitBlock(dom, parentBlock)) {
			parentBlock = parentBlock || editableRoot;
			if (parentBlock === editor.getBody() || isTableCell$5(parentBlock)) {
				rootBlockName = parentBlock.nodeName.toLowerCase();
			} else {
				rootBlockName = parentBlock.parentNode.nodeName.toLowerCase();
			}
			if (!parentBlock.hasChildNodes()) {
				newBlock = dom.create(blockName);
				setForcedBlockAttrs(editor, newBlock);
				parentBlock.appendChild(newBlock);
				rng.setStart(newBlock, 0);
				rng.setEnd(newBlock, 0);
				return newBlock;
			}
			node = container;
			while (node.parentNode !== parentBlock) {
				node = node.parentNode;
			}
			while (node && !dom.isBlock(node)) {
				startNode = node;
				node = node.previousSibling;
			}
			if (startNode && editor.schema.isValidChild(rootBlockName, blockName.toLowerCase())) {
				newBlock = dom.create(blockName);
				setForcedBlockAttrs(editor, newBlock);
				startNode.parentNode.insertBefore(newBlock, startNode);
				node = startNode;
				while (node && !dom.isBlock(node)) {
					next = node.nextSibling;
					newBlock.appendChild(node);
					node = next;
				}
				rng.setStart(container, offset);
				rng.setEnd(container, offset);
			}
		}
		return container;
	};
	var addBrToBlockIfNeeded = function (dom, block) {
		block.normalize();
		var lastChild = block.lastChild;
		if (!lastChild || /^(left|right)$/gi.test(dom.getStyle(lastChild, 'float', true))) {
			dom.add(block, 'br');
		}
	};
	var insert$1 = function (editor, evt) {
		var tmpRng, container, offset, parentBlock;
		var newBlock, fragment, containerBlock, parentBlockName, newBlockName, isAfterLastNodeInContainer;
		var dom = editor.dom;
		var schema = editor.schema, nonEmptyElementsMap = schema.getNonEmptyElements();
		var rng = editor.selection.getRng();
		var createNewBlock = function (name) {
			var node = container, block, clonedNode, caretNode;
			var textInlineElements = schema.getTextInlineElements();
			if (name || parentBlockName === 'TABLE' || parentBlockName === 'HR') {
				block = dom.create(name || newBlockName);
			} else {
				block = parentBlock.cloneNode(false);
			}
			caretNode = block;
			if (shouldKeepStyles(editor) === false) {
				dom.setAttrib(block, 'style', null);
				dom.setAttrib(block, 'class', null);
			} else {
				do {
					if (textInlineElements[node.nodeName]) {
						if (isCaretNode(node) || isBookmarkNode$1(node)) {
							continue;
						}
						clonedNode = node.cloneNode(false);
						dom.setAttrib(clonedNode, 'id', '');
						if (block.hasChildNodes()) {
							clonedNode.appendChild(block.firstChild);
							block.appendChild(clonedNode);
						} else {
							caretNode = clonedNode;
							block.appendChild(clonedNode);
						}
					}
				} while ((node = node.parentNode) && node !== editableRoot);
			}
			setForcedBlockAttrs(editor, block);
			emptyBlock(caretNode);
			return block;
		};
		var isCaretAtStartOrEndOfBlock = function (start) {
			var node, name;
			var normalizedOffset = normalizeZwspOffset(start, container, offset);
			if (isText$1(container) && (start ? normalizedOffset > 0 : normalizedOffset < container.nodeValue.length)) {
				return false;
			}
			if (container.parentNode === parentBlock && isAfterLastNodeInContainer && !start) {
				return true;
			}
			if (start && isElement$1(container) && container === parentBlock.firstChild) {
				return true;
			}
			if (containerAndSiblingName(container, 'TABLE') || containerAndSiblingName(container, 'HR')) {
				return isAfterLastNodeInContainer && !start || !isAfterLastNodeInContainer && start;
			}
			var walker = new DomTreeWalker(container, parentBlock);
			if (isText$1(container)) {
				if (start && normalizedOffset === 0) {
					walker.prev();
				} else if (!start && normalizedOffset === container.nodeValue.length) {
					walker.next();
				}
			}
			while (node = walker.current()) {
				if (isElement$1(node)) {
					if (!node.getAttribute('data-mce-bogus')) {
						name = node.nodeName.toLowerCase();
						if (nonEmptyElementsMap[name] && name !== 'br') {
							return false;
						}
					}
				} else if (isText$1(node) && !isWhitespaceText(node.nodeValue)) {
					return false;
				}
				if (start) {
					walker.prev();
				} else {
					walker.next();
				}
			}
			return true;
		};
		var insertNewBlockAfter = function () {
			if (/^(H[1-6]|PRE|FIGURE)$/.test(parentBlockName) && containerBlockName !== 'HGROUP') {
				newBlock = createNewBlock(newBlockName);
			} else {
				newBlock = createNewBlock();
			}
			if (shouldEndContainerOnEmptyBlock(editor) && canSplitBlock(dom, containerBlock) && dom.isEmpty(parentBlock)) {
				newBlock = dom.split(containerBlock, parentBlock);
			} else {
				dom.insertAfter(newBlock, parentBlock);
			}
			moveToCaretPosition(editor, newBlock);
		};
		normalize(dom, rng).each(function (normRng) {
			rng.setStart(normRng.startContainer, normRng.startOffset);
			rng.setEnd(normRng.endContainer, normRng.endOffset);
		});
		container = rng.startContainer;
		offset = rng.startOffset;
		newBlockName = getForcedRootBlock(editor);
		var shiftKey = !!(evt && evt.shiftKey);
		var ctrlKey = !!(evt && evt.ctrlKey);
		if (isElement$1(container) && container.hasChildNodes()) {
			isAfterLastNodeInContainer = offset > container.childNodes.length - 1;
			container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
			if (isAfterLastNodeInContainer && isText$1(container)) {
				offset = container.nodeValue.length;
			} else {
				offset = 0;
			}
		}
		var editableRoot = getEditableRoot$1(dom, container);
		if (!editableRoot) {
			return;
		}
		if (newBlockName && !shiftKey || !newBlockName && shiftKey) {
			container = wrapSelfAndSiblingsInDefaultBlock(editor, newBlockName, rng, container, offset);
		}
		parentBlock = dom.getParent(container, dom.isBlock);
		containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;
		parentBlockName = parentBlock ? parentBlock.nodeName.toUpperCase() : '';
		var containerBlockName = containerBlock ? containerBlock.nodeName.toUpperCase() : '';
		if (containerBlockName === 'LI' && !ctrlKey) {
			parentBlock = containerBlock;
			containerBlock = containerBlock.parentNode;
			parentBlockName = containerBlockName;
		}
		if (/^(LI|DT|DD)$/.test(parentBlockName)) {
			if (dom.isEmpty(parentBlock)) {
				insert(editor, createNewBlock, containerBlock, parentBlock, newBlockName);
				return;
			}
		}
		if (newBlockName && parentBlock === editor.getBody()) {
			return;
		}
		newBlockName = newBlockName || 'P';
		if (isCaretContainerBlock(parentBlock)) {
			newBlock = showCaretContainerBlock(parentBlock);
			if (dom.isEmpty(parentBlock)) {
				emptyBlock(parentBlock);
			}
			setForcedBlockAttrs(editor, newBlock);
			moveToCaretPosition(editor, newBlock);
		} else if (isCaretAtStartOrEndOfBlock()) {
			insertNewBlockAfter();
		} else if (isCaretAtStartOrEndOfBlock(true)) {
			newBlock = parentBlock.parentNode.insertBefore(createNewBlock(), parentBlock);
			moveToCaretPosition(editor, containerAndSiblingName(parentBlock, 'HR') ? newBlock : parentBlock);
		} else {
			tmpRng = includeZwspInRange(rng).cloneRange();
			tmpRng.setEndAfter(parentBlock);
			fragment = tmpRng.extractContents();
			trimZwsp(fragment);
			trimLeadingLineBreaks(fragment);
			newBlock = fragment.firstChild;
			dom.insertAfter(fragment, parentBlock);
			trimInlineElementsOnLeftSideOfBlock(dom, nonEmptyElementsMap, newBlock);
			addBrToBlockIfNeeded(dom, parentBlock);
			if (dom.isEmpty(parentBlock)) {
				emptyBlock(parentBlock);
			}
			newBlock.normalize();
			if (dom.isEmpty(newBlock)) {
				dom.remove(newBlock);
				insertNewBlockAfter();
			} else {
				setForcedBlockAttrs(editor, newBlock);
				moveToCaretPosition(editor, newBlock);
			}
		}
		dom.setAttrib(newBlock, 'id', '');
		editor.fire('NewBlock', { newBlock: newBlock });
	};

	var hasRightSideContent = function (schema, container, parentBlock) {
		var walker = new DomTreeWalker(container, parentBlock);
		var node;
		var nonEmptyElementsMap = schema.getNonEmptyElements();
		while (node = walker.next()) {
			if (nonEmptyElementsMap[node.nodeName.toLowerCase()] || node.length > 0) {
				return true;
			}
		}
	};
	var scrollToBr = function (dom, selection, brElm) {
		var marker = dom.create('span', {}, '&nbsp;');
		brElm.parentNode.insertBefore(marker, brElm);
		selection.scrollIntoView(marker);
		dom.remove(marker);
	};
	var moveSelectionToBr = function (dom, selection, brElm, extraBr) {
		var rng = dom.createRng();
		if (!extraBr) {
			rng.setStartAfter(brElm);
			rng.setEndAfter(brElm);
		} else {
			rng.setStartBefore(brElm);
			rng.setEndBefore(brElm);
		}
		selection.setRng(rng);
	};
	var insertBrAtCaret = function (editor, evt) {
		var selection = editor.selection;
		var dom = editor.dom;
		var rng = selection.getRng();
		var brElm;
		var extraBr;
		normalize(dom, rng).each(function (normRng) {
			rng.setStart(normRng.startContainer, normRng.startOffset);
			rng.setEnd(normRng.endContainer, normRng.endOffset);
		});
		var offset = rng.startOffset;
		var container = rng.startContainer;
		if (container.nodeType === 1 && container.hasChildNodes()) {
			var isAfterLastNodeInContainer = offset > container.childNodes.length - 1;
			container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
			if (isAfterLastNodeInContainer && container.nodeType === 3) {
				offset = container.nodeValue.length;
			} else {
				offset = 0;
			}
		}
		var parentBlock = dom.getParent(container, dom.isBlock);
		var containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;
		var containerBlockName = containerBlock ? containerBlock.nodeName.toUpperCase() : '';
		var isControlKey = !!(evt && evt.ctrlKey);
		if (containerBlockName === 'LI' && !isControlKey) {
			parentBlock = containerBlock;
		}
		if (container && container.nodeType === 3 && offset >= container.nodeValue.length) {
			if (!hasRightSideContent(editor.schema, container, parentBlock)) {
				brElm = dom.create('br');
				rng.insertNode(brElm);
				rng.setStartAfter(brElm);
				rng.setEndAfter(brElm);
				extraBr = true;
			}
		}
		brElm = dom.create('br');
		rangeInsertNode(dom, rng, brElm);
		scrollToBr(dom, selection, brElm);
		moveSelectionToBr(dom, selection, brElm, extraBr);
		editor.undoManager.add();
	};
	var insertBrBefore = function (editor, inline) {
		var br = SugarElement.fromTag('br');
		before(SugarElement.fromDom(inline), br);
		editor.undoManager.add();
	};
	var insertBrAfter = function (editor, inline) {
		if (!hasBrAfter(editor.getBody(), inline)) {
			after(SugarElement.fromDom(inline), SugarElement.fromTag('br'));
		}
		var br = SugarElement.fromTag('br');
		after(SugarElement.fromDom(inline), br);
		scrollToBr(editor.dom, editor.selection, br.dom);
		moveSelectionToBr(editor.dom, editor.selection, br.dom, false);
		editor.undoManager.add();
	};
	var isBeforeBr$1 = function (pos) {
		return isBr(pos.getNode());
	};
	var hasBrAfter = function (rootNode, startNode) {
		if (isBeforeBr$1(CaretPosition$1.after(startNode))) {
			return true;
		} else {
			return nextPosition(rootNode, CaretPosition$1.after(startNode)).map(function (pos) {
				return isBr(pos.getNode());
			}).getOr(false);
		}
	};
	var isAnchorLink = function (elm) {
		return elm && elm.nodeName === 'A' && 'href' in elm;
	};
	var isInsideAnchor = function (location) {
		return location.fold(never, isAnchorLink, isAnchorLink, never);
	};
	var readInlineAnchorLocation = function (editor) {
		var isInlineTarget$1 = curry(isInlineTarget, editor);
		var position = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		return readLocation(isInlineTarget$1, editor.getBody(), position).filter(isInsideAnchor);
	};
	var insertBrOutsideAnchor = function (editor, location) {
		location.fold(noop, curry(insertBrBefore, editor), curry(insertBrAfter, editor), noop);
	};
	var insert$2 = function (editor, evt) {
		var anchorLocation = readInlineAnchorLocation(editor);
		if (anchorLocation.isSome()) {
			anchorLocation.each(curry(insertBrOutsideAnchor, editor));
		} else {
			insertBrAtCaret(editor, evt);
		}
	};

	var matchesSelector = function (editor, selector) {
		return getParentBlock$2(editor).filter(function (parentBlock) {
			return selector.length > 0 && is$1(SugarElement.fromDom(parentBlock), selector);
		}).isSome();
	};
	var shouldInsertBr = function (editor) {
		return matchesSelector(editor, getBrNewLineSelector(editor));
	};
	var shouldBlockNewLine = function (editor) {
		return matchesSelector(editor, getNoNewLineSelector(editor));
	};

	var newLineAction = Adt.generate([
		{ br: [] },
		{ block: [] },
		{ none: [] }
	]);
	var shouldBlockNewLine$1 = function (editor, _shiftKey) {
		return shouldBlockNewLine(editor);
	};
	var isBrMode = function (requiredState) {
		return function (editor, _shiftKey) {
			var brMode = getForcedRootBlock(editor) === '';
			return brMode === requiredState;
		};
	};
	var inListBlock = function (requiredState) {
		return function (editor, _shiftKey) {
			return isListItemParentBlock(editor) === requiredState;
		};
	};
	var inBlock = function (blockName, requiredState) {
		return function (editor, _shiftKey) {
			var state = getParentBlockName(editor) === blockName.toUpperCase();
			return state === requiredState;
		};
	};
	var inPreBlock = function (requiredState) {
		return inBlock('pre', requiredState);
	};
	var inSummaryBlock = function () {
		return inBlock('summary', true);
	};
	var shouldPutBrInPre$1 = function (requiredState) {
		return function (editor, _shiftKey) {
			return shouldPutBrInPre(editor) === requiredState;
		};
	};
	var inBrContext = function (editor, _shiftKey) {
		return shouldInsertBr(editor);
	};
	var hasShiftKey = function (_editor, shiftKey) {
		return shiftKey;
	};
	var canInsertIntoEditableRoot = function (editor) {
		var forcedRootBlock = getForcedRootBlock(editor);
		var rootEditable = getEditableRoot(editor.dom, editor.selection.getStart());
		return rootEditable && editor.schema.isValidChild(rootEditable.nodeName, forcedRootBlock ? forcedRootBlock : 'P');
	};
	var match$2 = function (predicates, action) {
		return function (editor, shiftKey) {
			var isMatch = foldl(predicates, function (res, p) {
				return res && p(editor, shiftKey);
			}, true);
			return isMatch ? Optional.some(action) : Optional.none();
		};
	};
	var getAction$1 = function (editor, evt) {
		return evaluateUntil([
			match$2([shouldBlockNewLine$1], newLineAction.none()),
			match$2([inSummaryBlock()], newLineAction.br()),
			match$2([
				inPreBlock(true),
				shouldPutBrInPre$1(false),
				hasShiftKey
			], newLineAction.br()),
			match$2([
				inPreBlock(true),
				shouldPutBrInPre$1(false)
			], newLineAction.block()),
			match$2([
				inPreBlock(true),
				shouldPutBrInPre$1(true),
				hasShiftKey
			], newLineAction.block()),
			match$2([
				inPreBlock(true),
				shouldPutBrInPre$1(true)
			], newLineAction.br()),
			match$2([
				inListBlock(true),
				hasShiftKey
			], newLineAction.br()),
			match$2([inListBlock(true)], newLineAction.block()),
			match$2([
				isBrMode(true),
				hasShiftKey,
				canInsertIntoEditableRoot
			], newLineAction.block()),
			match$2([isBrMode(true)], newLineAction.br()),
			match$2([inBrContext], newLineAction.br()),
			match$2([
				isBrMode(false),
				hasShiftKey
			], newLineAction.br()),
			match$2([canInsertIntoEditableRoot], newLineAction.block())
		], [
			editor,
			!!(evt && evt.shiftKey)
		]).getOr(newLineAction.none());
	};

	var insert$3 = function (editor, evt) {
		getAction$1(editor, evt).fold(function () {
			insert$2(editor, evt);
		}, function () {
			insert$1(editor, evt);
		}, noop);
	};

	var handleEnterKeyEvent = function (editor, event) {
		if (event.isDefaultPrevented()) {
			return;
		}
		event.preventDefault();
		endTypingLevelIgnoreLocks(editor.undoManager);
		editor.undoManager.transact(function () {
			if (editor.selection.isCollapsed() === false) {
				editor.execCommand('Delete');
			}
			insert$3(editor, event);
		});
	};
	var setup$e = function (editor) {
		editor.on('keydown', function (event) {
			if (event.keyCode === VK.ENTER) {
				handleEnterKeyEvent(editor, event);
			}
		});
	};

	var executeKeydownOverride$2 = function (editor, evt) {
		execute([
			{
				keyCode: VK.END,
				action: action(moveToLineEndPoint$1, editor, true)
			},
			{
				keyCode: VK.HOME,
				action: action(moveToLineEndPoint$1, editor, false)
			},
			{
				keyCode: VK.END,
				action: action(moveToLineEndPoint$2, editor, true)
			},
			{
				keyCode: VK.HOME,
				action: action(moveToLineEndPoint$2, editor, false)
			}
		], evt).each(function (_) {
			evt.preventDefault();
		});
	};
	var setup$f = function (editor) {
		editor.on('keydown', function (evt) {
			if (evt.isDefaultPrevented() === false) {
				executeKeydownOverride$2(editor, evt);
			}
		});
	};

	var browser$4 = detect$3().browser;
	var setupIeInput = function (editor) {
		var keypressThrotter = first(function () {
			if (!editor.composing) {
				normalizeNbspsInEditor(editor);
			}
		}, 0);
		if (browser$4.isIE()) {
			editor.on('keypress', function (_e) {
				keypressThrotter.throttle();
			});
			editor.on('remove', function (_e) {
				keypressThrotter.cancel();
			});
		}
	};
	var setup$g = function (editor) {
		setupIeInput(editor);
		editor.on('input', function (e) {
			if (e.isComposing === false) {
				normalizeNbspsInEditor(editor);
			}
		});
	};

	var insertTextAtPosition = function (text, pos) {
		var container = pos.container();
		var offset = pos.offset();
		if (isText$1(container)) {
			container.insertData(offset, text);
			return Optional.some(CaretPosition(container, offset + text.length));
		} else {
			return getElementFromPosition(pos).map(function (elm) {
				var textNode = SugarElement.fromText(text);
				if (pos.isAtEnd()) {
					after(elm, textNode);
				} else {
					before(elm, textNode);
				}
				return CaretPosition(textNode.dom, text.length);
			});
		}
	};
	var insertNbspAtPosition = curry(insertTextAtPosition, nbsp);
	var insertSpaceAtPosition = curry(insertTextAtPosition, ' ');

	var locationToCaretPosition = function (root) {
		return function (location) {
			return location.fold(function (element) {
				return prevPosition(root.dom, CaretPosition$1.before(element));
			}, function (element) {
				return firstPositionIn(element);
			}, function (element) {
				return lastPositionIn(element);
			}, function (element) {
				return nextPosition(root.dom, CaretPosition$1.after(element));
			});
		};
	};
	var insertInlineBoundarySpaceOrNbsp = function (root, pos) {
		return function (checkPos) {
			return needsToHaveNbsp(root, checkPos) ? insertNbspAtPosition(pos) : insertSpaceAtPosition(pos);
		};
	};
	var setSelection$1 = function (editor) {
		return function (pos) {
			editor.selection.setRng(pos.toRange());
			editor.nodeChanged();
			return true;
		};
	};
	var insertSpaceOrNbspAtSelection = function (editor) {
		var pos = CaretPosition$1.fromRangeStart(editor.selection.getRng());
		var root = SugarElement.fromDom(editor.getBody());
		if (editor.selection.isCollapsed()) {
			var isInlineTarget$1 = curry(isInlineTarget, editor);
			var caretPosition = CaretPosition$1.fromRangeStart(editor.selection.getRng());
			return readLocation(isInlineTarget$1, editor.getBody(), caretPosition).bind(locationToCaretPosition(root)).bind(insertInlineBoundarySpaceOrNbsp(root, pos)).exists(setSelection$1(editor));
		} else {
			return false;
		}
	};

	var executeKeydownOverride$3 = function (editor, evt) {
		execute([{
			keyCode: VK.SPACEBAR,
			action: action(insertSpaceOrNbspAtSelection, editor)
		}], evt).each(function (_) {
			evt.preventDefault();
		});
	};
	var setup$h = function (editor) {
		editor.on('keydown', function (evt) {
			if (evt.isDefaultPrevented() === false) {
				executeKeydownOverride$3(editor, evt);
			}
		});
	};

	var registerKeyboardOverrides = function (editor) {
		var caret = setupSelectedState(editor);
		setup$b(editor);
		setup$c(editor, caret);
		setup$d(editor, caret);
		setup$e(editor);
		setup$h(editor);
		setup$g(editor);
		setup$f(editor);
		return caret;
	};
	var setup$i = function (editor) {
		if (!isRtc(editor)) {
			return registerKeyboardOverrides(editor);
		} else {
			return Cell(null);
		}
	};

	var NodeChange = function () {
		function NodeChange(editor) {
			this.lastPath = [];
			this.editor = editor;
			var lastRng;
			var self = this;
			if (!('onselectionchange' in editor.getDoc())) {
				editor.on('NodeChange click mouseup keyup focus', function (e) {
					var nativeRng = editor.selection.getRng();
					var fakeRng = {
						startContainer: nativeRng.startContainer,
						startOffset: nativeRng.startOffset,
						endContainer: nativeRng.endContainer,
						endOffset: nativeRng.endOffset
					};
					if (e.type === 'nodechange' || !isEq$1(fakeRng, lastRng)) {
						editor.fire('SelectionChange');
					}
					lastRng = fakeRng;
				});
			}
			editor.on('contextmenu', function () {
				editor.fire('SelectionChange');
			});
			editor.on('SelectionChange', function () {
				var startElm = editor.selection.getStart(true);
				if (!startElm || !Env.range && editor.selection.isCollapsed()) {
					return;
				}
				if (hasAnyRanges(editor) && !self.isSameElementPath(startElm) && editor.dom.isChildOf(startElm, editor.getBody())) {
					editor.nodeChanged({ selectionChange: true });
				}
			});
			editor.on('mouseup', function (e) {
				if (!e.isDefaultPrevented() && hasAnyRanges(editor)) {
					if (editor.selection.getNode().nodeName === 'IMG') {
						Delay.setEditorTimeout(editor, function () {
							editor.nodeChanged();
						});
					} else {
						editor.nodeChanged();
					}
				}
			});
		}
		NodeChange.prototype.nodeChanged = function (args) {
			var selection = this.editor.selection;
			var node, parents, root;
			if (this.editor.initialized && selection && !shouldDisableNodeChange(this.editor) && !this.editor.mode.isReadOnly()) {
				root = this.editor.getBody();
				node = selection.getStart(true) || root;
				if (node.ownerDocument !== this.editor.getDoc() || !this.editor.dom.isChildOf(node, root)) {
					node = root;
				}
				parents = [];
				this.editor.dom.getParent(node, function (node) {
					if (node === root) {
						return true;
					}
					parents.push(node);
				});
				args = args || {};
				args.element = node;
				args.parents = parents;
				this.editor.fire('NodeChange', args);
			}
		};
		NodeChange.prototype.isSameElementPath = function (startElm) {
			var i;
			var currentPath = this.editor.$(startElm).parentsUntil(this.editor.getBody()).add(startElm);
			if (currentPath.length === this.lastPath.length) {
				for (i = currentPath.length; i >= 0; i--) {
					if (currentPath[i] !== this.lastPath[i]) {
						break;
					}
				}
				if (i === -1) {
					this.lastPath = currentPath;
					return true;
				}
			}
			this.lastPath = currentPath;
			return false;
		};
		return NodeChange;
	}();

	var preventSummaryToggle = function (editor) {
		editor.on('click', function (e) {
			if (editor.dom.getParent(e.target, 'details')) {
				e.preventDefault();
			}
		});
	};
	var filterDetails = function (editor) {
		editor.parser.addNodeFilter('details', function (elms) {
			each(elms, function (details) {
				details.attr('data-mce-open', details.attr('open'));
				details.attr('open', 'open');
			});
		});
		editor.serializer.addNodeFilter('details', function (elms) {
			each(elms, function (details) {
				var open = details.attr('data-mce-open');
				details.attr('open', isString(open) ? open : null);
				details.attr('data-mce-open', null);
			});
		});
	};
	var setup$j = function (editor) {
		preventSummaryToggle(editor);
		filterDetails(editor);
	};

	var isTextBlockNode = function (node) {
		return isElement$1(node) && isTextBlock(SugarElement.fromDom(node));
	};
	var normalizeSelection$1 = function (editor) {
		var rng = editor.selection.getRng();
		var startPos = CaretPosition.fromRangeStart(rng);
		var endPos = CaretPosition.fromRangeEnd(rng);
		if (CaretPosition.isElementPosition(startPos)) {
			var container = startPos.container();
			if (isTextBlockNode(container)) {
				firstPositionIn(container).each(function (pos) {
					return rng.setStart(pos.container(), pos.offset());
				});
			}
		}
		if (CaretPosition.isElementPosition(endPos)) {
			var container = startPos.container();
			if (isTextBlockNode(container)) {
				lastPositionIn(container).each(function (pos) {
					return rng.setEnd(pos.container(), pos.offset());
				});
			}
		}
		editor.selection.setRng(normalize$2(rng));
	};
	var setup$k = function (editor) {
		editor.on('click', function (e) {
			if (e.detail >= 3) {
				normalizeSelection$1(editor);
			}
		});
	};

	var value$1 = function () {
		var subject = Cell(Optional.none());
		var clear = function () {
			return subject.set(Optional.none());
		};
		var set = function (s) {
			return subject.set(Optional.some(s));
		};
		var isSet = function () {
			return subject.get().isSome();
		};
		var on = function (f) {
			return subject.get().each(f);
		};
		return {
			clear: clear,
			set: set,
			isSet: isSet,
			on: on
		};
	};

	var getAbsolutePosition = function (elm) {
		var clientRect = elm.getBoundingClientRect();
		var doc = elm.ownerDocument;
		var docElem = doc.documentElement;
		var win = doc.defaultView;
		return {
			top: clientRect.top + win.pageYOffset - docElem.clientTop,
			left: clientRect.left + win.pageXOffset - docElem.clientLeft
		};
	};
	var getBodyPosition = function (editor) {
		return editor.inline ? getAbsolutePosition(editor.getBody()) : {
			left: 0,
			top: 0
		};
	};
	var getScrollPosition = function (editor) {
		var body = editor.getBody();
		return editor.inline ? {
			left: body.scrollLeft,
			top: body.scrollTop
		} : {
			left: 0,
			top: 0
		};
	};
	var getBodyScroll = function (editor) {
		var body = editor.getBody(), docElm = editor.getDoc().documentElement;
		var inlineScroll = {
			left: body.scrollLeft,
			top: body.scrollTop
		};
		var iframeScroll = {
			left: body.scrollLeft || docElm.scrollLeft,
			top: body.scrollTop || docElm.scrollTop
		};
		return editor.inline ? inlineScroll : iframeScroll;
	};
	var getMousePosition = function (editor, event) {
		if (event.target.ownerDocument !== editor.getDoc()) {
			var iframePosition = getAbsolutePosition(editor.getContentAreaContainer());
			var scrollPosition = getBodyScroll(editor);
			return {
				left: event.pageX - iframePosition.left + scrollPosition.left,
				top: event.pageY - iframePosition.top + scrollPosition.top
			};
		}
		return {
			left: event.pageX,
			top: event.pageY
		};
	};
	var calculatePosition = function (bodyPosition, scrollPosition, mousePosition) {
		return {
			pageX: mousePosition.left - bodyPosition.left + scrollPosition.left,
			pageY: mousePosition.top - bodyPosition.top + scrollPosition.top
		};
	};
	var calc = function (editor, event) {
		return calculatePosition(getBodyPosition(editor), getScrollPosition(editor), getMousePosition(editor, event));
	};

	var isContentEditableFalse$a = isContentEditableFalse, isContentEditableTrue$3 = isContentEditableTrue;
	var isDraggable = function (rootElm, elm) {
		return isContentEditableFalse$a(elm) && elm !== rootElm;
	};
	var isValidDropTarget = function (editor, targetElement, dragElement) {
		if (targetElement === dragElement || editor.dom.isChildOf(targetElement, dragElement)) {
			return false;
		}
		return !isContentEditableFalse$a(targetElement);
	};
	var cloneElement = function (elm) {
		var cloneElm = elm.cloneNode(true);
		cloneElm.removeAttribute('data-mce-selected');
		return cloneElm;
	};
	var createGhost = function (editor, elm, width, height) {
		var dom = editor.dom;
		var clonedElm = elm.cloneNode(true);
		dom.setStyles(clonedElm, {
			width: width,
			height: height
		});
		dom.setAttrib(clonedElm, 'data-mce-selected', null);
		var ghostElm = dom.create('div', {
			'class': 'mce-drag-container',
			'data-mce-bogus': 'all',
			'unselectable': 'on',
			'contenteditable': 'false'
		});
		dom.setStyles(ghostElm, {
			position: 'absolute',
			opacity: 0.5,
			overflow: 'hidden',
			border: 0,
			padding: 0,
			margin: 0,
			width: width,
			height: height
		});
		dom.setStyles(clonedElm, {
			margin: 0,
			boxSizing: 'border-box'
		});
		ghostElm.appendChild(clonedElm);
		return ghostElm;
	};
	var appendGhostToBody = function (ghostElm, bodyElm) {
		if (ghostElm.parentNode !== bodyElm) {
			bodyElm.appendChild(ghostElm);
		}
	};
	var moveGhost = function (ghostElm, position, width, height, maxX, maxY) {
		var overflowX = 0, overflowY = 0;
		ghostElm.style.left = position.pageX + 'px';
		ghostElm.style.top = position.pageY + 'px';
		if (position.pageX + width > maxX) {
			overflowX = position.pageX + width - maxX;
		}
		if (position.pageY + height > maxY) {
			overflowY = position.pageY + height - maxY;
		}
		ghostElm.style.width = width - overflowX + 'px';
		ghostElm.style.height = height - overflowY + 'px';
	};
	var removeElement = function (elm) {
		if (elm && elm.parentNode) {
			elm.parentNode.removeChild(elm);
		}
	};
	var isLeftMouseButtonPressed = function (e) {
		return e.button === 0;
	};
	var applyRelPos = function (state, position) {
		return {
			pageX: position.pageX - state.relX,
			pageY: position.pageY + 5
		};
	};
	var start$1 = function (state, editor) {
		return function (e) {
			if (isLeftMouseButtonPressed(e)) {
				var ceElm = find(editor.dom.getParents(e.target), or(isContentEditableFalse$a, isContentEditableTrue$3)).getOr(null);
				if (isDraggable(editor.getBody(), ceElm)) {
					var elmPos = editor.dom.getPos(ceElm);
					var bodyElm = editor.getBody();
					var docElm = editor.getDoc().documentElement;
					state.set({
						element: ceElm,
						dragging: false,
						screenX: e.screenX,
						screenY: e.screenY,
						maxX: (editor.inline ? bodyElm.scrollWidth : docElm.offsetWidth) - 2,
						maxY: (editor.inline ? bodyElm.scrollHeight : docElm.offsetHeight) - 2,
						relX: e.pageX - elmPos.x,
						relY: e.pageY - elmPos.y,
						width: ceElm.offsetWidth,
						height: ceElm.offsetHeight,
						ghost: createGhost(editor, ceElm, ceElm.offsetWidth, ceElm.offsetHeight)
					});
				}
			}
		};
	};
	var move$2 = function (state, editor) {
		var throttledPlaceCaretAt = Delay.throttle(function (clientX, clientY) {
			editor._selectionOverrides.hideFakeCaret();
			editor.selection.placeCaretAt(clientX, clientY);
		}, 0);
		editor.on('remove', throttledPlaceCaretAt.stop);
		return function (e) {
			return state.on(function (state) {
				var movement = Math.max(Math.abs(e.screenX - state.screenX), Math.abs(e.screenY - state.screenY));
				if (!state.dragging && movement > 10) {
					var args = editor.fire('dragstart', { target: state.element });
					if (args.isDefaultPrevented()) {
						return;
					}
					state.dragging = true;
					editor.focus();
				}
				if (state.dragging) {
					var targetPos = applyRelPos(state, calc(editor, e));
					appendGhostToBody(state.ghost, editor.getBody());
					moveGhost(state.ghost, targetPos, state.width, state.height, state.maxX, state.maxY);
					throttledPlaceCaretAt(e.clientX, e.clientY);
				}
			});
		};
	};
	var getRawTarget = function (selection) {
		var rng = selection.getSel().getRangeAt(0);
		var startContainer = rng.startContainer;
		return startContainer.nodeType === 3 ? startContainer.parentNode : startContainer;
	};
	var drop = function (state, editor) {
		return function (e) {
			state.on(function (state) {
				if (state.dragging) {
					if (isValidDropTarget(editor, getRawTarget(editor.selection), state.element)) {
						var targetClone_1 = cloneElement(state.element);
						var args = editor.fire('drop', {
							clientX: e.clientX,
							clientY: e.clientY
						});
						if (!args.isDefaultPrevented()) {
							editor.undoManager.transact(function () {
								removeElement(state.element);
								editor.insertContent(editor.dom.getOuterHTML(targetClone_1));
								editor._selectionOverrides.hideFakeCaret();
							});
						}
					}
				}
			});
			removeDragState(state);
		};
	};
	var stop = function (state, editor) {
		return function () {
			state.on(function (state) {
				if (state.dragging) {
					editor.fire('dragend');
				}
			});
			removeDragState(state);
		};
	};
	var removeDragState = function (state) {
		state.on(function (state) {
			removeElement(state.ghost);
		});
		state.clear();
	};
	var bindFakeDragEvents = function (editor) {
		var state = value$1();
		var pageDom = DOMUtils$1.DOM;
		var rootDocument = document;
		var dragStartHandler = start$1(state, editor);
		var dragHandler = move$2(state, editor);
		var dropHandler = drop(state, editor);
		var dragEndHandler = stop(state, editor);
		editor.on('mousedown', dragStartHandler);
		editor.on('mousemove', dragHandler);
		editor.on('mouseup', dropHandler);
		pageDom.bind(rootDocument, 'mousemove', dragHandler);
		pageDom.bind(rootDocument, 'mouseup', dragEndHandler);
		editor.on('remove', function () {
			pageDom.unbind(rootDocument, 'mousemove', dragHandler);
			pageDom.unbind(rootDocument, 'mouseup', dragEndHandler);
		});
	};
	var blockIeDrop = function (editor) {
		editor.on('drop', function (e) {
			var realTarget = typeof e.clientX !== 'undefined' ? editor.getDoc().elementFromPoint(e.clientX, e.clientY) : null;
			if (isContentEditableFalse$a(realTarget) || editor.dom.getContentEditableParent(realTarget) === 'false') {
				e.preventDefault();
			}
		});
	};
	var blockUnsupportedFileDrop = function (editor) {
		var preventFileDrop = function (e) {
			if (!e.defaultPrevented) {
				var dataTransfer = e.dataTransfer;
				if (dataTransfer && (contains(dataTransfer.types, 'Files') || dataTransfer.files.length > 0)) {
					e.preventDefault();
					if (e.type === 'drop') {
						displayError(editor, 'Dropped file type is not supported');
					}
				}
			}
		};
		var preventFileDropIfUIElement = function (e) {
			if (isUIElement(editor, e.target)) {
				preventFileDrop(e);
			}
		};
		var setup = function () {
			var pageDom = DOMUtils$1.DOM;
			var dom = editor.dom;
			var doc = document;
			var editorRoot = editor.inline ? editor.getBody() : editor.getDoc();
			var eventNames = [
				'drop',
				'dragover'
			];
			each(eventNames, function (name) {
				pageDom.bind(doc, name, preventFileDropIfUIElement);
				dom.bind(editorRoot, name, preventFileDrop);
			});
			editor.on('remove', function () {
				each(eventNames, function (name) {
					pageDom.unbind(doc, name, preventFileDropIfUIElement);
					dom.unbind(editorRoot, name, preventFileDrop);
				});
			});
		};
		editor.on('init', function () {
			Delay.setEditorTimeout(editor, setup, 0);
		});
	};
	var init = function (editor) {
		bindFakeDragEvents(editor);
		blockIeDrop(editor);
		if (shouldBlockUnsupportedDrop(editor)) {
			blockUnsupportedFileDrop(editor);
		}
	};

	var setup$l = function (editor) {
		var renderFocusCaret = first(function () {
			if (!editor.removed && editor.getBody().contains(document.activeElement)) {
				var rng = editor.selection.getRng();
				if (rng.collapsed) {
					var caretRange = renderRangeCaret(editor, rng, false);
					editor.selection.setRng(caretRange);
				}
			}
		}, 0);
		editor.on('focus', function () {
			renderFocusCaret.throttle();
		});
		editor.on('blur', function () {
			renderFocusCaret.cancel();
		});
	};

	var setup$m = function (editor) {
		editor.on('init', function () {
			editor.on('focusin', function (e) {
				var target = e.target;
				if (isMedia(target)) {
					var ceRoot = getContentEditableRoot(editor.getBody(), target);
					var node = isContentEditableFalse(ceRoot) ? ceRoot : target;
					if (editor.selection.getNode() !== node) {
						selectNode(editor, node).each(function (rng) {
							return editor.selection.setRng(rng);
						});
					}
				}
			});
		});
	};

	var isContentEditableTrue$4 = isContentEditableTrue;
	var isContentEditableFalse$b = isContentEditableFalse;
	var getContentEditableRoot$1 = function (editor, node) {
		return getContentEditableRoot(editor.getBody(), node);
	};
	var SelectionOverrides = function (editor) {
		var selection = editor.selection, dom = editor.dom;
		var isBlock = dom.isBlock;
		var rootNode = editor.getBody();
		var fakeCaret = FakeCaret(editor, rootNode, isBlock, function () {
			return hasFocus$1(editor);
		});
		var realSelectionId = 'sel-' + dom.uniqueId();
		var elementSelectionAttr = 'data-mce-selected';
		var selectedElement;
		var isFakeSelectionElement = function (node) {
			return dom.hasClass(node, 'mce-offscreen-selection');
		};
		var isFakeSelectionTargetElement = function (node) {
			return node !== rootNode && (isContentEditableFalse$b(node) || isMedia(node)) && dom.isChildOf(node, rootNode);
		};
		var isNearFakeSelectionElement = function (pos) {
			return isBeforeContentEditableFalse(pos) || isAfterContentEditableFalse(pos) || isBeforeMedia(pos) || isAfterMedia(pos);
		};
		var getRealSelectionElement = function () {
			var container = dom.get(realSelectionId);
			return container ? container.getElementsByTagName('*')[0] : container;
		};
		var setRange = function (range) {
			if (range) {
				selection.setRng(range);
			}
		};
		var getRange = selection.getRng;
		var showCaret = function (direction, node, before, scrollIntoView) {
			if (scrollIntoView === void 0) {
				scrollIntoView = true;
			}
			var e = editor.fire('ShowCaret', {
				target: node,
				direction: direction,
				before: before
			});
			if (e.isDefaultPrevented()) {
				return null;
			}
			if (scrollIntoView) {
				selection.scrollIntoView(node, direction === -1);
			}
			return fakeCaret.show(before, node);
		};
		var showBlockCaretContainer = function (blockCaretContainer) {
			if (blockCaretContainer.hasAttribute('data-mce-caret')) {
				showCaretContainerBlock(blockCaretContainer);
				setRange(getRange());
				selection.scrollIntoView(blockCaretContainer);
			}
		};
		var registerEvents = function () {
			editor.on('mouseup', function (e) {
				var range = getRange();
				if (range.collapsed && isXYInContentArea(editor, e.clientX, e.clientY)) {
					renderCaretAtRange(editor, range, false).each(setRange);
				}
			});
			editor.on('click', function (e) {
				var contentEditableRoot = getContentEditableRoot$1(editor, e.target);
				if (contentEditableRoot) {
					if (isContentEditableFalse$b(contentEditableRoot)) {
						e.preventDefault();
						editor.focus();
					}
					if (isContentEditableTrue$4(contentEditableRoot)) {
						if (dom.isChildOf(contentEditableRoot, selection.getNode())) {
							removeElementSelection();
						}
					}
				}
			});
			editor.on('blur NewBlock', removeElementSelection);
			editor.on('ResizeWindow FullscreenStateChanged', fakeCaret.reposition);
			var hasNormalCaretPosition = function (elm) {
				var caretWalker = CaretWalker(elm);
				if (!elm.firstChild) {
					return false;
				}
				var startPos = CaretPosition$1.before(elm.firstChild);
				var newPos = caretWalker.next(startPos);
				return newPos && !isNearFakeSelectionElement(newPos);
			};
			var isInSameBlock = function (node1, node2) {
				var block1 = dom.getParent(node1, isBlock);
				var block2 = dom.getParent(node2, isBlock);
				return block1 === block2;
			};
			var hasBetterMouseTarget = function (targetNode, caretNode) {
				var targetBlock = dom.getParent(targetNode, isBlock);
				var caretBlock = dom.getParent(caretNode, isBlock);
				if (targetBlock && targetNode !== caretBlock && dom.isChildOf(targetBlock, caretBlock) && isContentEditableFalse$b(getContentEditableRoot$1(editor, targetBlock)) === false) {
					return true;
				}
				return targetBlock && !isInSameBlock(targetBlock, caretBlock) && hasNormalCaretPosition(targetBlock);
			};
			editor.on('tap', function (e) {
				var targetElm = e.target;
				var contentEditableRoot = getContentEditableRoot$1(editor, targetElm);
				if (isContentEditableFalse$b(contentEditableRoot)) {
					e.preventDefault();
					selectNode(editor, contentEditableRoot).each(setElementSelection);
				} else if (isFakeSelectionTargetElement(targetElm)) {
					selectNode(editor, targetElm).each(setElementSelection);
				}
			}, true);
			editor.on('mousedown', function (e) {
				var targetElm = e.target;
				if (targetElm !== rootNode && targetElm.nodeName !== 'HTML' && !dom.isChildOf(targetElm, rootNode)) {
					return;
				}
				if (isXYInContentArea(editor, e.clientX, e.clientY) === false) {
					return;
				}
				var contentEditableRoot = getContentEditableRoot$1(editor, targetElm);
				if (contentEditableRoot) {
					if (isContentEditableFalse$b(contentEditableRoot)) {
						e.preventDefault();
						selectNode(editor, contentEditableRoot).each(setElementSelection);
					} else {
						removeElementSelection();
						if (!(isContentEditableTrue$4(contentEditableRoot) && e.shiftKey) && !isXYWithinRange(e.clientX, e.clientY, selection.getRng())) {
							hideFakeCaret();
							selection.placeCaretAt(e.clientX, e.clientY);
						}
					}
				} else if (isFakeSelectionTargetElement(targetElm)) {
					selectNode(editor, targetElm).each(setElementSelection);
				} else if (isFakeCaretTarget(targetElm) === false) {
					removeElementSelection();
					hideFakeCaret();
					var fakeCaretInfo = closestFakeCaret(rootNode, e.clientX, e.clientY);
					if (fakeCaretInfo) {
						if (!hasBetterMouseTarget(targetElm, fakeCaretInfo.node)) {
							e.preventDefault();
							var range = showCaret(1, fakeCaretInfo.node, fakeCaretInfo.before, false);
							editor.getBody().focus();
							setRange(range);
						}
					}
				}
			});
			editor.on('keypress', function (e) {
				if (VK.modifierPressed(e)) {
					return;
				}
				if (isContentEditableFalse$b(selection.getNode())) {
					e.preventDefault();
				}
			});
			editor.on('GetSelectionRange', function (e) {
				var rng = e.range;
				if (selectedElement) {
					if (!selectedElement.parentNode) {
						selectedElement = null;
						return;
					}
					rng = rng.cloneRange();
					rng.selectNode(selectedElement);
					e.range = rng;
				}
			});
			editor.on('SetSelectionRange', function (e) {
				e.range = normalizeShortEndedElementSelection(e.range);
				var rng = setElementSelection(e.range, e.forward);
				if (rng) {
					e.range = rng;
				}
			});
			var isPasteBin = function (node) {
				return node.id === 'mcepastebin';
			};
			editor.on('AfterSetSelectionRange', function (e) {
				var rng = e.range;
				var parentNode = rng.startContainer.parentNode;
				if (!isRangeInCaretContainer(rng) && !isPasteBin(parentNode)) {
					hideFakeCaret();
				}
				if (!isFakeSelectionElement(parentNode)) {
					removeElementSelection();
				}
			});
			editor.on('copy', function (e) {
				var clipboardData = e.clipboardData;
				if (!e.isDefaultPrevented() && e.clipboardData && !Env.ie) {
					var realSelectionElement = getRealSelectionElement();
					if (realSelectionElement) {
						e.preventDefault();
						clipboardData.clearData();
						clipboardData.setData('text/html', realSelectionElement.outerHTML);
						clipboardData.setData('text/plain', realSelectionElement.outerText || realSelectionElement.innerText);
					}
				}
			});
			init(editor);
			setup$l(editor);
			setup$m(editor);
		};
		var isWithinCaretContainer = function (node) {
			return isCaretContainer(node) || startsWithCaretContainer(node) || endsWithCaretContainer(node);
		};
		var isRangeInCaretContainer = function (rng) {
			return isWithinCaretContainer(rng.startContainer) || isWithinCaretContainer(rng.endContainer);
		};
		var normalizeShortEndedElementSelection = function (rng) {
			var shortEndedElements = editor.schema.getShortEndedElements();
			var newRng = dom.createRng();
			var startContainer = rng.startContainer;
			var startOffset = rng.startOffset;
			var endContainer = rng.endContainer;
			var endOffset = rng.endOffset;
			if (has(shortEndedElements, startContainer.nodeName.toLowerCase())) {
				if (startOffset === 0) {
					newRng.setStartBefore(startContainer);
				} else {
					newRng.setStartAfter(startContainer);
				}
			} else {
				newRng.setStart(startContainer, startOffset);
			}
			if (has(shortEndedElements, endContainer.nodeName.toLowerCase())) {
				if (endOffset === 0) {
					newRng.setEndBefore(endContainer);
				} else {
					newRng.setEndAfter(endContainer);
				}
			} else {
				newRng.setEnd(endContainer, endOffset);
			}
			return newRng;
		};
		var setupOffscreenSelection = function (node, targetClone, origTargetClone) {
			var $ = editor.$;
			var $realSelectionContainer = descendant(SugarElement.fromDom(editor.getBody()), '#' + realSelectionId).fold(function () {
				return $([]);
			}, function (elm) {
				return $([elm.dom]);
			});
			if ($realSelectionContainer.length === 0) {
				$realSelectionContainer = $('<div data-mce-bogus="all" class="mce-offscreen-selection"></div>').attr('id', realSelectionId);
				$realSelectionContainer.appendTo(editor.getBody());
			}
			var newRange = dom.createRng();
			if (targetClone === origTargetClone && Env.ie) {
				$realSelectionContainer.empty().append('<p style="font-size: 0" data-mce-bogus="all">\xA0</p>').append(targetClone);
				newRange.setStartAfter($realSelectionContainer[0].firstChild.firstChild);
				newRange.setEndAfter(targetClone);
			} else {
				$realSelectionContainer.empty().append(nbsp).append(targetClone).append(nbsp);
				newRange.setStart($realSelectionContainer[0].firstChild, 1);
				newRange.setEnd($realSelectionContainer[0].lastChild, 0);
			}
			$realSelectionContainer.css({ top: dom.getPos(node, editor.getBody()).y });
			$realSelectionContainer[0].focus();
			var sel = selection.getSel();
			sel.removeAllRanges();
			sel.addRange(newRange);
			return newRange;
		};
		var selectElement = function (elm) {
			var targetClone = elm.cloneNode(true);
			var e = editor.fire('ObjectSelected', {
				target: elm,
				targetClone: targetClone
			});
			if (e.isDefaultPrevented()) {
				return null;
			}
			var range = setupOffscreenSelection(elm, e.targetClone, targetClone);
			var nodeElm = SugarElement.fromDom(elm);
			each(descendants$1(SugarElement.fromDom(editor.getBody()), '*[data-mce-selected]'), function (elm) {
				if (!eq$2(nodeElm, elm)) {
					remove$1(elm, elementSelectionAttr);
				}
			});
			if (!dom.getAttrib(elm, elementSelectionAttr)) {
				elm.setAttribute(elementSelectionAttr, '1');
			}
			selectedElement = elm;
			hideFakeCaret();
			return range;
		};
		var setElementSelection = function (range, forward) {
			if (!range) {
				return null;
			}
			if (range.collapsed) {
				if (!isRangeInCaretContainer(range)) {
					var dir = forward ? 1 : -1;
					var caretPosition = getNormalizedRangeEndPoint(dir, rootNode, range);
					var beforeNode = caretPosition.getNode(!forward);
					if (isFakeCaretTarget(beforeNode)) {
						return showCaret(dir, beforeNode, forward ? !caretPosition.isAtEnd() : false, false);
					}
					var afterNode = caretPosition.getNode(forward);
					if (isFakeCaretTarget(afterNode)) {
						return showCaret(dir, afterNode, forward ? false : !caretPosition.isAtEnd(), false);
					}
				}
				return null;
			}
			var startContainer = range.startContainer;
			var startOffset = range.startOffset;
			var endOffset = range.endOffset;
			if (startContainer.nodeType === 3 && startOffset === 0 && isContentEditableFalse$b(startContainer.parentNode)) {
				startContainer = startContainer.parentNode;
				startOffset = dom.nodeIndex(startContainer);
				startContainer = startContainer.parentNode;
			}
			if (startContainer.nodeType !== 1) {
				return null;
			}
			if (endOffset === startOffset + 1 && startContainer === range.endContainer) {
				var node = startContainer.childNodes[startOffset];
				if (isFakeSelectionTargetElement(node)) {
					return selectElement(node);
				}
			}
			return null;
		};
		var removeElementSelection = function () {
			if (selectedElement) {
				selectedElement.removeAttribute(elementSelectionAttr);
			}
			descendant(SugarElement.fromDom(editor.getBody()), '#' + realSelectionId).each(remove);
			selectedElement = null;
		};
		var destroy = function () {
			fakeCaret.destroy();
			selectedElement = null;
		};
		var hideFakeCaret = function () {
			fakeCaret.hide();
		};
		if (Env.ceFalse) {
			registerEvents();
		}
		return {
			showCaret: showCaret,
			showBlockCaretContainer: showBlockCaretContainer,
			hideFakeCaret: hideFakeCaret,
			destroy: destroy
		};
	};

	var Quirks = function (editor) {
		var each = Tools.each;
		var BACKSPACE = VK.BACKSPACE, DELETE = VK.DELETE, dom = editor.dom, selection = editor.selection, parser = editor.parser;
		var isGecko = Env.gecko, isIE = Env.ie, isWebKit = Env.webkit;
		var mceInternalUrlPrefix = 'data:text/mce-internal,';
		var mceInternalDataType = isIE ? 'Text' : 'URL';
		var setEditorCommandState = function (cmd, state) {
			try {
				editor.getDoc().execCommand(cmd, false, state);
			} catch (ex) {
			}
		};
		var isDefaultPrevented = function (e) {
			return e.isDefaultPrevented();
		};
		var setMceInternalContent = function (e) {
			var selectionHtml, internalContent;
			if (e.dataTransfer) {
				if (editor.selection.isCollapsed() && e.target.tagName === 'IMG') {
					selection.select(e.target);
				}
				selectionHtml = editor.selection.getContent();
				if (selectionHtml.length > 0) {
					internalContent = mceInternalUrlPrefix + escape(editor.id) + ',' + escape(selectionHtml);
					e.dataTransfer.setData(mceInternalDataType, internalContent);
				}
			}
		};
		var getMceInternalContent = function (e) {
			var internalContent;
			if (e.dataTransfer) {
				internalContent = e.dataTransfer.getData(mceInternalDataType);
				if (internalContent && internalContent.indexOf(mceInternalUrlPrefix) >= 0) {
					internalContent = internalContent.substr(mceInternalUrlPrefix.length).split(',');
					return {
						id: unescape(internalContent[0]),
						html: unescape(internalContent[1])
					};
				}
			}
			return null;
		};
		var insertClipboardContents = function (content, internal) {
			if (editor.queryCommandSupported('mceInsertClipboardContent')) {
				editor.execCommand('mceInsertClipboardContent', false, {
					content: content,
					internal: internal
				});
			} else {
				editor.execCommand('mceInsertContent', false, content);
			}
		};
		var emptyEditorWhenDeleting = function () {
			var serializeRng = function (rng) {
				var body = dom.create('body');
				var contents = rng.cloneContents();
				body.appendChild(contents);
				return selection.serializer.serialize(body, { format: 'html' });
			};
			var allContentsSelected = function (rng) {
				var selection = serializeRng(rng);
				var allRng = dom.createRng();
				allRng.selectNode(editor.getBody());
				var allSelection = serializeRng(allRng);
				return selection === allSelection;
			};
			editor.on('keydown', function (e) {
				var keyCode = e.keyCode;
				var isCollapsed, body;
				if (!isDefaultPrevented(e) && (keyCode === DELETE || keyCode === BACKSPACE)) {
					isCollapsed = editor.selection.isCollapsed();
					body = editor.getBody();
					if (isCollapsed && !dom.isEmpty(body)) {
						return;
					}
					if (!isCollapsed && !allContentsSelected(editor.selection.getRng())) {
						return;
					}
					e.preventDefault();
					editor.setContent('');
					if (body.firstChild && dom.isBlock(body.firstChild)) {
						editor.selection.setCursorLocation(body.firstChild, 0);
					} else {
						editor.selection.setCursorLocation(body, 0);
					}
					editor.nodeChanged();
				}
			});
		};
		var selectAll = function () {
			editor.shortcuts.add('meta+a', null, 'SelectAll');
		};
		var inputMethodFocus = function () {
			if (!editor.inline) {
				dom.bind(editor.getDoc(), 'mousedown mouseup', function (e) {
					var rng;
					if (e.target === editor.getDoc().documentElement) {
						rng = selection.getRng();
						editor.getBody().focus();
						if (e.type === 'mousedown') {
							if (isCaretContainer(rng.startContainer)) {
								return;
							}
							selection.placeCaretAt(e.clientX, e.clientY);
						} else {
							selection.setRng(rng);
						}
					}
				});
			}
		};
		var removeHrOnBackspace = function () {
			editor.on('keydown', function (e) {
				if (!isDefaultPrevented(e) && e.keyCode === BACKSPACE) {
					if (!editor.getBody().getElementsByTagName('hr').length) {
						return;
					}
					if (selection.isCollapsed() && selection.getRng().startOffset === 0) {
						var node = selection.getNode();
						var previousSibling = node.previousSibling;
						if (node.nodeName === 'HR') {
							dom.remove(node);
							e.preventDefault();
							return;
						}
						if (previousSibling && previousSibling.nodeName && previousSibling.nodeName.toLowerCase() === 'hr') {
							dom.remove(previousSibling);
							e.preventDefault();
						}
					}
				}
			});
		};
		var focusBody = function () {
			if (!Range.prototype.getClientRects) {
				editor.on('mousedown', function (e) {
					if (!isDefaultPrevented(e) && e.target.nodeName === 'HTML') {
						var body_1 = editor.getBody();
						body_1.blur();
						Delay.setEditorTimeout(editor, function () {
							body_1.focus();
						});
					}
				});
			}
		};
		var selectControlElements = function () {
			editor.on('click', function (e) {
				var target = e.target;
				if (/^(IMG|HR)$/.test(target.nodeName) && dom.getContentEditableParent(target) !== 'false') {
					e.preventDefault();
					editor.selection.select(target);
					editor.nodeChanged();
				}
				if (target.nodeName === 'A' && dom.hasClass(target, 'mce-item-anchor')) {
					e.preventDefault();
					selection.select(target);
				}
			});
		};
		var removeStylesWhenDeletingAcrossBlockElements = function () {
			var getAttributeApplyFunction = function () {
				var template = dom.getAttribs(selection.getStart().cloneNode(false));
				return function () {
					var target = selection.getStart();
					if (target !== editor.getBody()) {
						dom.setAttrib(target, 'style', null);
						each(template, function (attr) {
							target.setAttributeNode(attr.cloneNode(true));
						});
					}
				};
			};
			var isSelectionAcrossElements = function () {
				return !selection.isCollapsed() && dom.getParent(selection.getStart(), dom.isBlock) !== dom.getParent(selection.getEnd(), dom.isBlock);
			};
			editor.on('keypress', function (e) {
				var applyAttributes;
				if (!isDefaultPrevented(e) && (e.keyCode === 8 || e.keyCode === 46) && isSelectionAcrossElements()) {
					applyAttributes = getAttributeApplyFunction();
					editor.getDoc().execCommand('delete', false, null);
					applyAttributes();
					e.preventDefault();
					return false;
				}
			});
			dom.bind(editor.getDoc(), 'cut', function (e) {
				var applyAttributes;
				if (!isDefaultPrevented(e) && isSelectionAcrossElements()) {
					applyAttributes = getAttributeApplyFunction();
					Delay.setEditorTimeout(editor, function () {
						applyAttributes();
					});
				}
			});
		};
		var disableBackspaceIntoATable = function () {
			editor.on('keydown', function (e) {
				if (!isDefaultPrevented(e) && e.keyCode === BACKSPACE) {
					if (selection.isCollapsed() && selection.getRng().startOffset === 0) {
						var previousSibling = selection.getNode().previousSibling;
						if (previousSibling && previousSibling.nodeName && previousSibling.nodeName.toLowerCase() === 'table') {
							e.preventDefault();
							return false;
						}
					}
				}
			});
		};
		var removeBlockQuoteOnBackSpace = function () {
			editor.on('keydown', function (e) {
				var rng, parent;
				if (isDefaultPrevented(e) || e.keyCode !== VK.BACKSPACE) {
					return;
				}
				rng = selection.getRng();
				var container = rng.startContainer;
				var offset = rng.startOffset;
				var root = dom.getRoot();
				parent = container;
				if (!rng.collapsed || offset !== 0) {
					return;
				}
				while (parent && parent.parentNode && parent.parentNode.firstChild === parent && parent.parentNode !== root) {
					parent = parent.parentNode;
				}
				if (parent.tagName === 'BLOCKQUOTE') {
					editor.formatter.toggle('blockquote', null, parent);
					rng = dom.createRng();
					rng.setStart(container, 0);
					rng.setEnd(container, 0);
					selection.setRng(rng);
				}
			});
		};
		var setGeckoEditingOptions = function () {
			var setOpts = function () {
				setEditorCommandState('StyleWithCSS', false);
				setEditorCommandState('enableInlineTableEditing', false);
				if (!getObjectResizing(editor)) {
					setEditorCommandState('enableObjectResizing', false);
				}
			};
			if (!isReadOnly(editor)) {
				editor.on('BeforeExecCommand mousedown', setOpts);
			}
		};
		var addBrAfterLastLinks = function () {
			var fixLinks = function () {
				each(dom.select('a'), function (node) {
					var parentNode = node.parentNode;
					var root = dom.getRoot();
					if (parentNode.lastChild === node) {
						while (parentNode && !dom.isBlock(parentNode)) {
							if (parentNode.parentNode.lastChild !== parentNode || parentNode === root) {
								return;
							}
							parentNode = parentNode.parentNode;
						}
						dom.add(parentNode, 'br', { 'data-mce-bogus': 1 });
					}
				});
			};
			editor.on('SetContent ExecCommand', function (e) {
				if (e.type === 'setcontent' || e.command === 'mceInsertLink') {
					fixLinks();
				}
			});
		};
		var setDefaultBlockType = function () {
			if (getForcedRootBlock(editor)) {
				editor.on('init', function () {
					setEditorCommandState('DefaultParagraphSeparator', getForcedRootBlock(editor));
				});
			}
		};
		var normalizeSelection = function () {
			editor.on('keyup focusin mouseup', function (e) {
				if (!VK.modifierPressed(e)) {
					selection.normalize();
				}
			}, true);
		};
		var showBrokenImageIcon = function () {
			editor.contentStyles.push('img:-moz-broken {' + '-moz-force-broken-image-icon:1;' + 'min-width:24px;' + 'min-height:24px' + '}');
		};
		var restoreFocusOnKeyDown = function () {
			if (!editor.inline) {
				editor.on('keydown', function () {
					if (document.activeElement === document.body) {
						editor.getWin().focus();
					}
				});
			}
		};
		var bodyHeight = function () {
			if (!editor.inline) {
				editor.contentStyles.push('body {min-height: 150px}');
				editor.on('click', function (e) {
					var rng;
					if (e.target.nodeName === 'HTML') {
						if (Env.ie > 11) {
							editor.getBody().focus();
							return;
						}
						rng = editor.selection.getRng();
						editor.getBody().focus();
						editor.selection.setRng(rng);
						editor.selection.normalize();
						editor.nodeChanged();
					}
				});
			}
		};
		var blockCmdArrowNavigation = function () {
			if (Env.mac) {
				editor.on('keydown', function (e) {
					if (VK.metaKeyPressed(e) && !e.shiftKey && (e.keyCode === 37 || e.keyCode === 39)) {
						e.preventDefault();
						var selection_1 = editor.selection.getSel();
						selection_1.modify('move', e.keyCode === 37 ? 'backward' : 'forward', 'lineboundary');
					}
				});
			}
		};
		var disableAutoUrlDetect = function () {
			setEditorCommandState('AutoUrlDetect', false);
		};
		var tapLinksAndImages = function () {
			editor.on('click', function (e) {
				var elm = e.target;
				do {
					if (elm.tagName === 'A') {
						e.preventDefault();
						return;
					}
				} while (elm = elm.parentNode);
			});
			editor.contentStyles.push('.mce-content-body {-webkit-touch-callout: none}');
		};
		var blockFormSubmitInsideEditor = function () {
			editor.on('init', function () {
				editor.dom.bind(editor.getBody(), 'submit', function (e) {
					e.preventDefault();
				});
			});
		};
		var removeAppleInterchangeBrs = function () {
			parser.addNodeFilter('br', function (nodes) {
				var i = nodes.length;
				while (i--) {
					if (nodes[i].attr('class') === 'Apple-interchange-newline') {
						nodes[i].remove();
					}
				}
			});
		};
		var ieInternalDragAndDrop = function () {
			editor.on('dragstart', function (e) {
				setMceInternalContent(e);
			});
			editor.on('drop', function (e) {
				if (!isDefaultPrevented(e)) {
					var internalContent = getMceInternalContent(e);
					if (internalContent && internalContent.id !== editor.id) {
						e.preventDefault();
						var rng = fromPoint$1(e.x, e.y, editor.getDoc());
						selection.setRng(rng);
						insertClipboardContents(internalContent.html, true);
					}
				}
			});
		};
		var refreshContentEditable = function () {
		};
		var isHidden = function () {
			if (!isGecko || editor.removed) {
				return false;
			}
			var sel = editor.selection.getSel();
			return !sel || !sel.rangeCount || sel.rangeCount === 0;
		};
		removeBlockQuoteOnBackSpace();
		emptyEditorWhenDeleting();
		if (!Env.windowsPhone) {
			normalizeSelection();
		}
		if (isWebKit) {
			inputMethodFocus();
			selectControlElements();
			setDefaultBlockType();
			blockFormSubmitInsideEditor();
			disableBackspaceIntoATable();
			removeAppleInterchangeBrs();
			if (Env.iOS) {
				restoreFocusOnKeyDown();
				bodyHeight();
				tapLinksAndImages();
			} else {
				selectAll();
			}
		}
		if (Env.ie >= 11) {
			bodyHeight();
			disableBackspaceIntoATable();
		}
		if (Env.ie) {
			selectAll();
			disableAutoUrlDetect();
			ieInternalDragAndDrop();
		}
		if (isGecko) {
			removeHrOnBackspace();
			focusBody();
			removeStylesWhenDeletingAcrossBlockElements();
			setGeckoEditingOptions();
			addBrAfterLastLinks();
			showBrokenImageIcon();
			blockCmdArrowNavigation();
			disableBackspaceIntoATable();
		}
		return {
			refreshContentEditable: refreshContentEditable,
			isHidden: isHidden
		};
	};

	var DOM$4 = DOMUtils$1.DOM;
	var appendStyle = function (editor, text) {
		var body = SugarElement.fromDom(editor.getBody());
		var container = getStyleContainer(getRootNode(body));
		var style = SugarElement.fromTag('style');
		set(style, 'type', 'text/css');
		append(style, SugarElement.fromText(text));
		append(container, style);
		editor.on('remove', function () {
			remove(style);
		});
	};
	var getRootName = function (editor) {
		return editor.inline ? editor.getElement().nodeName.toLowerCase() : undefined;
	};
	var removeUndefined = function (obj) {
		return filter$1(obj, function (v) {
			return isUndefined(v) === false;
		});
	};
	var mkParserSettings = function (editor) {
		var settings = editor.settings;
		var blobCache = editor.editorUpload.blobCache;
		return removeUndefined({
			allow_conditional_comments: settings.allow_conditional_comments,
			allow_html_data_urls: settings.allow_html_data_urls,
			allow_svg_data_urls: settings.allow_svg_data_urls,
			allow_html_in_named_anchor: settings.allow_html_in_named_anchor,
			allow_script_urls: settings.allow_script_urls,
			allow_unsafe_link_target: settings.allow_unsafe_link_target,
			convert_fonts_to_spans: settings.convert_fonts_to_spans,
			fix_list_elements: settings.fix_list_elements,
			font_size_legacy_values: settings.font_size_legacy_values,
			forced_root_block: settings.forced_root_block,
			forced_root_block_attrs: settings.forced_root_block_attrs,
			padd_empty_with_br: settings.padd_empty_with_br,
			preserve_cdata: settings.preserve_cdata,
			remove_trailing_brs: settings.remove_trailing_brs,
			inline_styles: settings.inline_styles,
			root_name: getRootName(editor),
			validate: true,
			blob_cache: blobCache,
			images_dataimg_filter: settings.images_dataimg_filter
		});
	};
	var mkSerializerSettings = function (editor) {
		var settings = editor.settings;
		return __assign(__assign({}, mkParserSettings(editor)), removeUndefined({
			url_converter: settings.url_converter,
			url_converter_scope: settings.url_converter_scope,
			element_format: settings.element_format,
			entities: settings.entities,
			entity_encoding: settings.entity_encoding,
			indent: settings.indent,
			indent_after: settings.indent_after,
			indent_before: settings.indent_before,
			block_elements: settings.block_elements,
			boolean_attributes: settings.boolean_attributes,
			custom_elements: settings.custom_elements,
			extended_valid_elements: settings.extended_valid_elements,
			invalid_elements: settings.invalid_elements,
			invalid_styles: settings.invalid_styles,
			move_caret_before_on_enter_elements: settings.move_caret_before_on_enter_elements,
			non_empty_elements: settings.non_empty_elements,
			schema: settings.schema,
			self_closing_elements: settings.self_closing_elements,
			short_ended_elements: settings.short_ended_elements,
			special: settings.special,
			text_block_elements: settings.text_block_elements,
			text_inline_elements: settings.text_inline_elements,
			valid_children: settings.valid_children,
			valid_classes: settings.valid_classes,
			valid_elements: settings.valid_elements,
			valid_styles: settings.valid_styles,
			verify_html: settings.verify_html,
			whitespace_elements: settings.whitespace_elements
		}));
	};
	var createParser = function (editor) {
		var parser = DomParser(mkParserSettings(editor), editor.schema);
		parser.addAttributeFilter('src,href,style,tabindex', function (nodes, name) {
			var i = nodes.length, node, value;
			var dom = editor.dom;
			var internalName = 'data-mce-' + name;
			while (i--) {
				node = nodes[i];
				value = node.attr(name);
				if (value && !node.attr(internalName)) {
					if (value.indexOf('data:') === 0 || value.indexOf('blob:') === 0) {
						continue;
					}
					if (name === 'style') {
						value = dom.serializeStyle(dom.parseStyle(value), node.name);
						if (!value.length) {
							value = null;
						}
						node.attr(internalName, value);
						node.attr(name, value);
					} else if (name === 'tabindex') {
						node.attr(internalName, value);
						node.attr(name, null);
					} else {
						node.attr(internalName, editor.convertURL(value, name, node.name));
					}
				}
			}
		});
		parser.addNodeFilter('script', function (nodes) {
			var i = nodes.length;
			while (i--) {
				var node = nodes[i];
				var type = node.attr('type') || 'no/type';
				if (type.indexOf('mce-') !== 0) {
					node.attr('type', 'mce-' + type);
				}
			}
		});
		if (editor.settings.preserve_cdata) {
			parser.addNodeFilter('#cdata', function (nodes) {
				var i = nodes.length;
				while (i--) {
					var node = nodes[i];
					node.type = 8;
					node.name = '#comment';
					node.value = '[CDATA[' + editor.dom.encode(node.value) + ']]';
				}
			});
		}
		parser.addNodeFilter('p,h1,h2,h3,h4,h5,h6,div', function (nodes) {
			var i = nodes.length;
			var nonEmptyElements = editor.schema.getNonEmptyElements();
			while (i--) {
				var node = nodes[i];
				if (node.isEmpty(nonEmptyElements) && node.getAll('br').length === 0) {
					node.append(new AstNode('br', 1)).shortEnded = true;
				}
			}
		});
		return parser;
	};
	var autoFocus = function (editor) {
		if (editor.settings.auto_focus) {
			Delay.setEditorTimeout(editor, function () {
				var focusEditor;
				if (editor.settings.auto_focus === true) {
					focusEditor = editor;
				} else {
					focusEditor = editor.editorManager.get(editor.settings.auto_focus);
				}
				if (!focusEditor.destroyed) {
					focusEditor.focus();
				}
			}, 100);
		}
	};
	var moveSelectionToFirstCaretPosition = function (editor) {
		var root = editor.dom.getRoot();
		if (!editor.inline && (!hasAnyRanges(editor) || editor.selection.getStart(true) === root)) {
			firstPositionIn(root).each(function (pos) {
				var node = pos.getNode();
				var caretPos = isTable(node) ? firstPositionIn(node).getOr(pos) : pos;
				if (Env.browser.isIE()) {
					storeNative(editor, caretPos.toRange());
				} else {
					editor.selection.setRng(caretPos.toRange());
				}
			});
		}
	};
	var initEditor = function (editor) {
		editor.bindPendingEventDelegates();
		editor.initialized = true;
		fireInit(editor);
		editor.focus(true);
		moveSelectionToFirstCaretPosition(editor);
		editor.nodeChanged({ initial: true });
		editor.execCallback('init_instance_callback', editor);
		autoFocus(editor);
	};
	var getStyleSheetLoader = function (editor) {
		return editor.inline ? editor.ui.styleSheetLoader : editor.dom.styleSheetLoader;
	};
	var loadContentCss = function (editor, css) {
		var styleSheetLoader = getStyleSheetLoader(editor);
		var loaded = function () {
			editor.on('remove', function () {
				return styleSheetLoader.unloadAll(css);
			});
			initEditor(editor);
		};
		styleSheetLoader.loadAll(css, loaded, loaded);
	};
	var preInit = function (editor, rtcMode) {
		var settings = editor.settings, doc = editor.getDoc(), body = editor.getBody();
		if (!settings.browser_spellcheck && !settings.gecko_spellcheck) {
			doc.body.spellcheck = false;
			DOM$4.setAttrib(body, 'spellcheck', 'false');
		}
		editor.quirks = Quirks(editor);
		firePostRender(editor);
		var directionality = getDirectionality(editor);
		if (directionality !== undefined) {
			body.dir = directionality;
		}
		if (settings.protect) {
			editor.on('BeforeSetContent', function (e) {
				Tools.each(settings.protect, function (pattern) {
					e.content = e.content.replace(pattern, function (str) {
						return '<!--mce:protected ' + escape(str) + '-->';
					});
				});
			});
		}
		editor.on('SetContent', function () {
			editor.addVisual(editor.getBody());
		});
		if (rtcMode === false) {
			editor.load({
				initial: true,
				format: 'html'
			});
		}
		editor.startContent = editor.getContent({ format: 'raw' });
		editor.on('compositionstart compositionend', function (e) {
			editor.composing = e.type === 'compositionstart';
		});
		if (editor.contentStyles.length > 0) {
			var contentCssText_1 = '';
			Tools.each(editor.contentStyles, function (style) {
				contentCssText_1 += style + '\r\n';
			});
			editor.dom.addStyle(contentCssText_1);
		}
		loadContentCss(editor, editor.contentCSS);
		if (settings.content_style) {
			appendStyle(editor, settings.content_style);
		}
	};
	var initContentBody = function (editor, skipWrite) {
		var settings = editor.settings;
		var targetElm = editor.getElement();
		var doc = editor.getDoc();
		if (!settings.inline) {
			editor.getElement().style.visibility = editor.orgVisibility;
		}
		if (!skipWrite && !editor.inline) {
			doc.open();
			doc.write(editor.iframeHTML);
			doc.close();
		}
		if (editor.inline) {
			DOM$4.addClass(targetElm, 'mce-content-body');
			editor.contentDocument = doc = document;
			editor.contentWindow = window;
			editor.bodyElement = targetElm;
			editor.contentAreaContainer = targetElm;
		}
		var body = editor.getBody();
		body.disabled = true;
		editor.readonly = !!settings.readonly;
		if (!editor.readonly) {
			if (editor.inline && DOM$4.getStyle(body, 'position', true) === 'static') {
				body.style.position = 'relative';
			}
			body.contentEditable = editor.getParam('content_editable_state', true);
		}
		body.disabled = false;
		editor.editorUpload = EditorUpload(editor);
		editor.schema = Schema(settings);
		editor.dom = DOMUtils$1(doc, {
			keep_values: true,
			url_converter: editor.convertURL,
			url_converter_scope: editor,
			hex_colors: settings.force_hex_style_colors,
			update_styles: true,
			root_element: editor.inline ? editor.getBody() : null,
			collect: function () {
				return editor.inline;
			},
			schema: editor.schema,
			contentCssCors: shouldUseContentCssCors(editor),
			referrerPolicy: getReferrerPolicy(editor),
			onSetAttrib: function (e) {
				editor.fire('SetAttrib', e);
			}
		});
		editor.parser = createParser(editor);
		editor.serializer = DomSerializer(mkSerializerSettings(editor), editor);
		editor.selection = EditorSelection(editor.dom, editor.getWin(), editor.serializer, editor);
		editor.annotator = Annotator(editor);
		editor.formatter = Formatter(editor);
		editor.undoManager = UndoManager(editor);
		editor._nodeChangeDispatcher = new NodeChange(editor);
		editor._selectionOverrides = SelectionOverrides(editor);
		setup$9(editor);
		setup$j(editor);
		if (!isRtc(editor)) {
			setup$k(editor);
		}
		var caret = setup$i(editor);
		setup$8(editor, caret);
		setup$a(editor);
		setup$7(editor);
		firePreInit(editor);
		setup$5(editor).fold(function () {
			preInit(editor, false);
		}, function (loadingRtc) {
			editor.setProgressState(true);
			loadingRtc.then(function (rtcMode) {
				editor.setProgressState(false);
				preInit(editor, rtcMode);
			});
		});
	};

	var DOM$5 = DOMUtils$1.DOM;
	var relaxDomain = function (editor, ifr) {
		if (document.domain !== window.location.hostname && Env.browser.isIE()) {
			var bodyUuid = uuid('mce');
			editor[bodyUuid] = function () {
				initContentBody(editor);
			};
			var domainRelaxUrl = 'javascript:(function(){' + 'document.open();document.domain="' + document.domain + '";' + 'var ed = window.parent.tinymce.get("' + editor.id + '");document.write(ed.iframeHTML);' + 'document.close();ed.' + bodyUuid + '(true);})()';
			DOM$5.setAttrib(ifr, 'src', domainRelaxUrl);
			return true;
		}
		return false;
	};
	var createIframeElement = function (id, title, height, customAttrs) {
		var iframe = SugarElement.fromTag('iframe');
		setAll(iframe, customAttrs);
		setAll(iframe, {
			id: id + '_ifr',
			frameBorder: '0',
			allowTransparency: 'true',
			title: title
		});
		add$3(iframe, 'tox-edit-area__iframe');
		return iframe;
	};
	var getIframeHtml = function (editor) {
		var iframeHTML = getDocType(editor) + '<html><head>';
		if (getDocumentBaseUrl(editor) !== editor.documentBaseUrl) {
			iframeHTML += '<base href="' + editor.documentBaseURI.getURI() + '" />';
		}
		iframeHTML += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
		var bodyId = getBodyId(editor);
		var bodyClass = getBodyClass(editor);
		if (getContentSecurityPolicy(editor)) {
			iframeHTML += '<meta http-equiv="Content-Security-Policy" content="' + getContentSecurityPolicy(editor) + '" />';
		}
		iframeHTML += '</head><body id="' + bodyId + '" class="mce-content-body ' + bodyClass + '" data-id="' + editor.id + '"><br></body></html>';
		return iframeHTML;
	};
	var createIframe = function (editor, o) {
		var title = editor.editorManager.translate('Rich Text Area. Press ALT-0 for help.');
		var ifr = createIframeElement(editor.id, title, o.height, getIframeAttrs(editor)).dom;
		ifr.onload = function () {
			ifr.onload = null;
			editor.fire('load');
		};
		var isDomainRelaxed = relaxDomain(editor, ifr);
		editor.contentAreaContainer = o.iframeContainer;
		editor.iframeElement = ifr;
		editor.iframeHTML = getIframeHtml(editor);
		DOM$5.add(o.iframeContainer, ifr);
		return isDomainRelaxed;
	};
	var init$1 = function (editor, boxInfo) {
		var isDomainRelaxed = createIframe(editor, boxInfo);
		if (boxInfo.editorContainer) {
			DOM$5.get(boxInfo.editorContainer).style.display = editor.orgDisplay;
			editor.hidden = DOM$5.isHidden(boxInfo.editorContainer);
		}
		editor.getElement().style.display = 'none';
		DOM$5.setAttrib(editor.id, 'aria-hidden', 'true');
		if (!isDomainRelaxed) {
			initContentBody(editor);
		}
	};

	var DOM$6 = DOMUtils$1.DOM;
	var initPlugin = function (editor, initializedPlugins, plugin) {
		var Plugin = PluginManager.get(plugin);
		var pluginUrl = PluginManager.urls[plugin] || editor.documentBaseUrl.replace(/\/$/, '');
		plugin = Tools.trim(plugin);
		if (Plugin && Tools.inArray(initializedPlugins, plugin) === -1) {
			Tools.each(PluginManager.dependencies(plugin), function (dep) {
				initPlugin(editor, initializedPlugins, dep);
			});
			if (editor.plugins[plugin]) {
				return;
			}
			try {
				var pluginInstance = new Plugin(editor, pluginUrl, editor.$);
				editor.plugins[plugin] = pluginInstance;
				if (pluginInstance.init) {
					pluginInstance.init(editor, pluginUrl);
					initializedPlugins.push(plugin);
				}
			} catch (e) {
				pluginInitError(editor, plugin, e);
			}
		}
	};
	var trimLegacyPrefix = function (name) {
		return name.replace(/^\-/, '');
	};
	var initPlugins = function (editor) {
		var initializedPlugins = [];
		Tools.each(getPlugins(editor).split(/[ ,]/), function (name) {
			initPlugin(editor, initializedPlugins, trimLegacyPrefix(name));
		});
	};
	var initIcons = function (editor) {
		var iconPackName = Tools.trim(getIconPackName(editor));
		var currentIcons = editor.ui.registry.getAll().icons;
		var loadIcons = __assign(__assign({}, IconManager.get('default').icons), IconManager.get(iconPackName).icons);
		each$1(loadIcons, function (svgData, icon) {
			if (!has(currentIcons, icon)) {
				editor.ui.registry.addIcon(icon, svgData);
			}
		});
	};
	var initTheme = function (editor) {
		var theme = getTheme(editor);
		if (isString(theme)) {
			editor.settings.theme = trimLegacyPrefix(theme);
			var Theme = ThemeManager.get(theme);
			editor.theme = new Theme(editor, ThemeManager.urls[theme]);
			if (editor.theme.init) {
				editor.theme.init(editor, ThemeManager.urls[theme] || editor.documentBaseUrl.replace(/\/$/, ''), editor.$);
			}
		} else {
			editor.theme = {};
		}
	};
	var renderFromLoadedTheme = function (editor) {
		return editor.theme.renderUI();
	};
	var renderFromThemeFunc = function (editor) {
		var elm = editor.getElement();
		var theme = getTheme(editor);
		var info = theme(editor, elm);
		if (info.editorContainer.nodeType) {
			info.editorContainer.id = info.editorContainer.id || editor.id + '_parent';
		}
		if (info.iframeContainer && info.iframeContainer.nodeType) {
			info.iframeContainer.id = info.iframeContainer.id || editor.id + '_iframecontainer';
		}
		info.height = info.iframeHeight ? info.iframeHeight : elm.offsetHeight;
		return info;
	};
	var createThemeFalseResult = function (element) {
		return {
			editorContainer: element,
			iframeContainer: element,
			api: {}
		};
	};
	var renderThemeFalseIframe = function (targetElement) {
		var iframeContainer = DOM$6.create('div');
		DOM$6.insertAfter(iframeContainer, targetElement);
		return createThemeFalseResult(iframeContainer);
	};
	var renderThemeFalse = function (editor) {
		var targetElement = editor.getElement();
		return editor.inline ? createThemeFalseResult(null) : renderThemeFalseIframe(targetElement);
	};
	var renderThemeUi = function (editor) {
		var elm = editor.getElement();
		editor.orgDisplay = elm.style.display;
		if (isString(getTheme(editor))) {
			return renderFromLoadedTheme(editor);
		} else if (isFunction(getTheme(editor))) {
			return renderFromThemeFunc(editor);
		} else {
			return renderThemeFalse(editor);
		}
	};
	var augmentEditorUiApi = function (editor, api) {
		var uiApiFacade = {
			show: Optional.from(api.show).getOr(noop),
			hide: Optional.from(api.hide).getOr(noop),
			disable: Optional.from(api.disable).getOr(noop),
			isDisabled: Optional.from(api.isDisabled).getOr(never),
			enable: function () {
				if (!editor.mode.isReadOnly()) {
					Optional.from(api.enable).map(call);
				}
			}
		};
		editor.ui = __assign(__assign({}, editor.ui), uiApiFacade);
	};
	var init$2 = function (editor) {
		editor.fire('ScriptsLoaded');
		initIcons(editor);
		initTheme(editor);
		initPlugins(editor);
		var renderInfo = renderThemeUi(editor);
		augmentEditorUiApi(editor, Optional.from(renderInfo.api).getOr({}));
		var boxInfo = {
			editorContainer: renderInfo.editorContainer,
			iframeContainer: renderInfo.iframeContainer
		};
		editor.editorContainer = boxInfo.editorContainer ? boxInfo.editorContainer : null;
		appendContentCssFromSettings(editor);
		if (editor.inline) {
			return initContentBody(editor);
		} else {
			return init$1(editor, boxInfo);
		}
	};

	var DOM$7 = DOMUtils$1.DOM;
	var hasSkipLoadPrefix = function (name) {
		return name.charAt(0) === '-';
	};
	var loadLanguage = function (scriptLoader, editor) {
		var languageCode = getLanguageCode(editor);
		var languageUrl = getLanguageUrl(editor);
		if (I18n.hasCode(languageCode) === false && languageCode !== 'en') {
			var url_1 = languageUrl !== '' ? languageUrl : editor.editorManager.baseURL + '/langs/' + languageCode + '.js';
			scriptLoader.add(url_1, noop, undefined, function () {
				languageLoadError(editor, url_1, languageCode);
			});
		}
	};
	var loadTheme = function (scriptLoader, editor, suffix, callback) {
		var theme = getTheme(editor);
		if (isString(theme)) {
			if (!hasSkipLoadPrefix(theme) && !ThemeManager.urls.hasOwnProperty(theme)) {
				var themeUrl = getThemeUrl(editor);
				if (themeUrl) {
					ThemeManager.load(theme, editor.documentBaseURI.toAbsolute(themeUrl));
				} else {
					ThemeManager.load(theme, 'themes/' + theme + '/theme' + suffix + '.js');
				}
			}
			scriptLoader.loadQueue(function () {
				ThemeManager.waitFor(theme, callback);
			});
		} else {
			callback();
		}
	};
	var getIconsUrlMetaFromUrl = function (editor) {
		return Optional.from(getIconsUrl(editor)).filter(function (url) {
			return url.length > 0;
		}).map(function (url) {
			return {
				url: url,
				name: Optional.none()
			};
		});
	};
	var getIconsUrlMetaFromName = function (editor, name, suffix) {
		return Optional.from(name).filter(function (name) {
			return name.length > 0 && !IconManager.has(name);
		}).map(function (name) {
			return {
				url: editor.editorManager.baseURL + '/icons/' + name + '/icons' + suffix + '.js',
				name: Optional.some(name)
			};
		});
	};
	var loadIcons = function (scriptLoader, editor, suffix) {
		var defaultIconsUrl = getIconsUrlMetaFromName(editor, 'default', suffix);
		var customIconsUrl = getIconsUrlMetaFromUrl(editor).orThunk(function () {
			return getIconsUrlMetaFromName(editor, getIconPackName(editor), '');
		});
		each(cat([
			defaultIconsUrl,
			customIconsUrl
		]), function (urlMeta) {
			scriptLoader.add(urlMeta.url, noop, undefined, function () {
				iconsLoadError(editor, urlMeta.url, urlMeta.name.getOrUndefined());
			});
		});
	};
	var loadPlugins = function (editor, suffix) {
		Tools.each(getExternalPlugins(editor), function (url, name) {
			PluginManager.load(name, url, noop, undefined, function () {
				pluginLoadError(editor, url, name);
			});
			editor.settings.plugins += ' ' + name;
		});
		Tools.each(getPlugins(editor).split(/[ ,]/), function (plugin) {
			plugin = Tools.trim(plugin);
			if (plugin && !PluginManager.urls[plugin]) {
				if (hasSkipLoadPrefix(plugin)) {
					plugin = plugin.substr(1, plugin.length);
					var dependencies = PluginManager.dependencies(plugin);
					Tools.each(dependencies, function (depPlugin) {
						var defaultSettings = {
							prefix: 'plugins/',
							resource: depPlugin,
							suffix: '/plugin' + suffix + '.js'
						};
						var dep = PluginManager.createUrl(defaultSettings, depPlugin);
						PluginManager.load(dep.resource, dep, noop, undefined, function () {
							pluginLoadError(editor, dep.prefix + dep.resource + dep.suffix, dep.resource);
						});
					});
				} else {
					var url_2 = {
						prefix: 'plugins/',
						resource: plugin,
						suffix: '/plugin' + suffix + '.js'
					};
					PluginManager.load(plugin, url_2, noop, undefined, function () {
						pluginLoadError(editor, url_2.prefix + url_2.resource + url_2.suffix, plugin);
					});
				}
			}
		});
	};
	var loadScripts = function (editor, suffix) {
		var scriptLoader = ScriptLoader.ScriptLoader;
		loadTheme(scriptLoader, editor, suffix, function () {
			loadLanguage(scriptLoader, editor);
			loadIcons(scriptLoader, editor, suffix);
			loadPlugins(editor, suffix);
			scriptLoader.loadQueue(function () {
				if (!editor.removed) {
					init$2(editor);
				}
			}, editor, function () {
				if (!editor.removed) {
					init$2(editor);
				}
			});
		});
	};
	var getStyleSheetLoader$1 = function (element, editor) {
		return instance.forElement(element, {
			contentCssCors: hasContentCssCors(editor),
			referrerPolicy: getReferrerPolicy(editor)
		});
	};
	var render = function (editor) {
		var id = editor.id;
		I18n.setCode(getLanguageCode(editor));
		var readyHandler = function () {
			DOM$7.unbind(window, 'ready', readyHandler);
			editor.render();
		};
		if (!EventUtils.Event.domLoaded) {
			DOM$7.bind(window, 'ready', readyHandler);
			return;
		}
		if (!editor.getElement()) {
			return;
		}
		if (!Env.contentEditable) {
			return;
		}
		var element = SugarElement.fromDom(editor.getElement());
		var snapshot = clone(element);
		editor.on('remove', function () {
			eachr(element.dom.attributes, function (attr) {
				return remove$1(element, attr.name);
			});
			setAll(element, snapshot);
		});
		editor.ui.styleSheetLoader = getStyleSheetLoader$1(element, editor);
		if (!isInline$1(editor)) {
			editor.orgVisibility = editor.getElement().style.visibility;
			editor.getElement().style.visibility = 'hidden';
		} else {
			editor.inline = true;
		}
		var form = editor.getElement().form || DOM$7.getParent(id, 'form');
		if (form) {
			editor.formElement = form;
			if (hasHiddenInput(editor) && !isTextareaOrInput(editor.getElement())) {
				DOM$7.insertAfter(DOM$7.create('input', {
					type: 'hidden',
					name: id
				}), id);
				editor.hasHiddenInput = true;
			}
			editor.formEventDelegate = function (e) {
				editor.fire(e.type, e);
			};
			DOM$7.bind(form, 'submit reset', editor.formEventDelegate);
			editor.on('reset', function () {
				editor.resetContent();
			});
			if (shouldPatchSubmit(editor) && !form.submit.nodeType && !form.submit.length && !form._mceOldSubmit) {
				form._mceOldSubmit = form.submit;
				form.submit = function () {
					editor.editorManager.triggerSave();
					editor.setDirty(false);
					return form._mceOldSubmit(form);
				};
			}
		}
		editor.windowManager = WindowManager(editor);
		editor.notificationManager = NotificationManager(editor);
		if (isEncodingXml(editor)) {
			editor.on('GetContent', function (e) {
				if (e.save) {
					e.content = DOM$7.encode(e.content);
				}
			});
		}
		if (shouldAddFormSubmitTrigger(editor)) {
			editor.on('submit', function () {
				if (editor.initialized) {
					editor.save();
				}
			});
		}
		if (shouldAddUnloadTrigger(editor)) {
			editor._beforeUnload = function () {
				if (editor.initialized && !editor.destroyed && !editor.isHidden()) {
					editor.save({
						format: 'raw',
						no_events: true,
						set_dirty: false
					});
				}
			};
			editor.editorManager.on('BeforeUnload', editor._beforeUnload);
		}
		editor.editorManager.add(editor);
		loadScripts(editor, editor.suffix);
	};

	var addVisual$1 = function (editor, elm) {
		return addVisual(editor, elm);
	};

	var legacyPropNames = {
		'font-size': 'size',
		'font-family': 'face'
	};
	var getSpecifiedFontProp = function (propName, rootElm, elm) {
		var getProperty = function (elm) {
			return getRaw(elm, propName).orThunk(function () {
				if (name(elm) === 'font') {
					return get$1(legacyPropNames, propName).bind(function (legacyPropName) {
						return getOpt(elm, legacyPropName);
					});
				} else {
					return Optional.none();
				}
			});
		};
		var isRoot = function (elm) {
			return eq$2(SugarElement.fromDom(rootElm), elm);
		};
		return closest$2(SugarElement.fromDom(elm), function (elm) {
			return getProperty(elm);
		}, isRoot);
	};
	var normalizeFontFamily = function (fontFamily) {
		return fontFamily.replace(/[\'\"\\]/g, '').replace(/,\s+/g, ',');
	};
	var getComputedFontProp = function (propName, elm) {
		return Optional.from(DOMUtils$1.DOM.getStyle(elm, propName, true));
	};
	var getFontProp = function (propName) {
		return function (rootElm, elm) {
			return Optional.from(elm).map(SugarElement.fromDom).filter(isElement).bind(function (element) {
				return getSpecifiedFontProp(propName, rootElm, element.dom).or(getComputedFontProp(propName, element.dom));
			}).getOr('');
		};
	};
	var getFontSize = getFontProp('font-size');
	var getFontFamily = compose(normalizeFontFamily, getFontProp('font-family'));

	var findFirstCaretElement = function (editor) {
		return firstPositionIn(editor.getBody()).map(function (caret) {
			var container = caret.container();
			return isText$1(container) ? container.parentNode : container;
		});
	};
	var getCaretElement = function (editor) {
		return Optional.from(editor.selection.getRng()).bind(function (rng) {
			var root = editor.getBody();
			var atStartOfNode = rng.startContainer === root && rng.startOffset === 0;
			return atStartOfNode ? Optional.none() : Optional.from(editor.selection.getStart(true));
		});
	};
	var mapRange = function (editor, mapper) {
		return getCaretElement(editor).orThunk(curry(findFirstCaretElement, editor)).map(SugarElement.fromDom).filter(isElement).map(mapper);
	};

	var fromFontSizeNumber = function (editor, value) {
		if (/^[0-9.]+$/.test(value)) {
			var fontSizeNumber = parseInt(value, 10);
			if (fontSizeNumber >= 1 && fontSizeNumber <= 7) {
				var fontSizes = getFontStyleValues(editor);
				var fontClasses = getFontSizeClasses(editor);
				if (fontClasses) {
					return fontClasses[fontSizeNumber - 1] || value;
				} else {
					return fontSizes[fontSizeNumber - 1] || value;
				}
			} else {
				return value;
			}
		} else {
			return value;
		}
	};
	var normalizeFontNames = function (font) {
		var fonts = font.split(/\s*,\s*/);
		return map(fonts, function (font) {
			if (font.indexOf(' ') !== -1 && !(startsWith(font, '"') || startsWith(font, '\''))) {
				return '\'' + font + '\'';
			} else {
				return font;
			}
		}).join(',');
	};
	var fontNameAction = function (editor, value) {
		var font = fromFontSizeNumber(editor, value);
		editor.formatter.toggle('fontname', { value: normalizeFontNames(font) });
		editor.nodeChanged();
	};
	var fontNameQuery = function (editor) {
		return mapRange(editor, function (elm) {
			return getFontFamily(editor.getBody(), elm.dom);
		}).getOr('');
	};
	var fontSizeAction = function (editor, value) {
		editor.formatter.toggle('fontsize', { value: fromFontSizeNumber(editor, value) });
		editor.nodeChanged();
	};
	var fontSizeQuery = function (editor) {
		return mapRange(editor, function (elm) {
			return getFontSize(editor.getBody(), elm.dom);
		}).getOr('');
	};

	var lineHeightQuery = function (editor) {
		return mapRange(editor, function (elm) {
			var root = SugarElement.fromDom(editor.getBody());
			var specifiedStyle = closest$2(elm, function (elm) {
				return getRaw(elm, 'line-height');
			}, curry(eq$2, root));
			var computedStyle = function () {
				var lineHeight = parseFloat(get$5(elm, 'line-height'));
				var fontSize = parseFloat(get$5(elm, 'font-size'));
				return String(lineHeight / fontSize);
			};
			return specifiedStyle.getOrThunk(computedStyle);
		}).getOr('');
	};
	var lineHeightAction = function (editor, lineHeight) {
		editor.undoManager.transact(function () {
			editor.formatter.toggle('lineheight', { value: String(lineHeight) });
			editor.nodeChanged();
		});
	};

	var processValue = function (value) {
		var details;
		if (typeof value !== 'string') {
			details = Tools.extend({
				paste: value.paste,
				data: { paste: value.paste }
			}, value);
			return {
				content: value.content,
				details: details
			};
		}
		return {
			content: value,
			details: {}
		};
	};
	var insertAtCaret$1 = function (editor, value) {
		var result = processValue(value);
		insertContent(editor, result.content, result.details);
	};

	var each$f = Tools.each;
	var map$3 = Tools.map, inArray$2 = Tools.inArray;
	var EditorCommands = function () {
		function EditorCommands(editor) {
			this.commands = {
				state: {},
				exec: {},
				value: {}
			};
			this.editor = editor;
			this.setupCommands(editor);
		}
		EditorCommands.prototype.execCommand = function (command, ui, value, args) {
			var func, state = false;
			var self = this;
			if (self.editor.removed) {
				return;
			}
			if (!/^(mceAddUndoLevel|mceEndUndoLevel|mceBeginUndoLevel|mceRepaint)$/.test(command) && (!args || !args.skip_focus)) {
				self.editor.focus();
			} else {
				restore(self.editor);
			}
			args = self.editor.fire('BeforeExecCommand', {
				command: command,
				ui: ui,
				value: value
			});
			if (args.isDefaultPrevented()) {
				return false;
			}
			var customCommand = command.toLowerCase();
			if (func = self.commands.exec[customCommand]) {
				func(customCommand, ui, value);
				self.editor.fire('ExecCommand', {
					command: command,
					ui: ui,
					value: value
				});
				return true;
			}
			each$f(this.editor.plugins, function (p) {
				if (p.execCommand && p.execCommand(command, ui, value)) {
					self.editor.fire('ExecCommand', {
						command: command,
						ui: ui,
						value: value
					});
					state = true;
					return false;
				}
			});
			if (state) {
				return state;
			}
			if (self.editor.theme && self.editor.theme.execCommand && self.editor.theme.execCommand(command, ui, value)) {
				self.editor.fire('ExecCommand', {
					command: command,
					ui: ui,
					value: value
				});
				return true;
			}
			try {
				state = self.editor.getDoc().execCommand(command, ui, value);
			} catch (ex) {
			}
			if (state) {
				self.editor.fire('ExecCommand', {
					command: command,
					ui: ui,
					value: value
				});
				return true;
			}
			return false;
		};
		EditorCommands.prototype.queryCommandState = function (command) {
			var func;
			if (this.editor.quirks.isHidden() || this.editor.removed) {
				return;
			}
			command = command.toLowerCase();
			if (func = this.commands.state[command]) {
				return func(command);
			}
			try {
				return this.editor.getDoc().queryCommandState(command);
			} catch (ex) {
			}
			return false;
		};
		EditorCommands.prototype.queryCommandValue = function (command) {
			var func;
			if (this.editor.quirks.isHidden() || this.editor.removed) {
				return;
			}
			command = command.toLowerCase();
			if (func = this.commands.value[command]) {
				return func(command);
			}
			try {
				return this.editor.getDoc().queryCommandValue(command);
			} catch (ex) {
			}
		};
		EditorCommands.prototype.addCommands = function (commandList, type) {
			if (type === void 0) {
				type = 'exec';
			}
			var self = this;
			each$f(commandList, function (callback, command) {
				each$f(command.toLowerCase().split(','), function (command) {
					self.commands[type][command] = callback;
				});
			});
		};
		EditorCommands.prototype.addCommand = function (command, callback, scope) {
			var _this = this;
			command = command.toLowerCase();
			this.commands.exec[command] = function (command, ui, value, args) {
				return callback.call(scope || _this.editor, ui, value, args);
			};
		};
		EditorCommands.prototype.queryCommandSupported = function (command) {
			command = command.toLowerCase();
			if (this.commands.exec[command]) {
				return true;
			}
			try {
				return this.editor.getDoc().queryCommandSupported(command);
			} catch (ex) {
			}
			return false;
		};
		EditorCommands.prototype.addQueryStateHandler = function (command, callback, scope) {
			var _this = this;
			command = command.toLowerCase();
			this.commands.state[command] = function () {
				return callback.call(scope || _this.editor);
			};
		};
		EditorCommands.prototype.addQueryValueHandler = function (command, callback, scope) {
			var _this = this;
			command = command.toLowerCase();
			this.commands.value[command] = function () {
				return callback.call(scope || _this.editor);
			};
		};
		EditorCommands.prototype.hasCustomCommand = function (command) {
			command = command.toLowerCase();
			return !!this.commands.exec[command];
		};
		EditorCommands.prototype.execNativeCommand = function (command, ui, value) {
			if (ui === undefined) {
				ui = false;
			}
			if (value === undefined) {
				value = null;
			}
			return this.editor.getDoc().execCommand(command, ui, value);
		};
		EditorCommands.prototype.isFormatMatch = function (name) {
			return this.editor.formatter.match(name);
		};
		EditorCommands.prototype.toggleFormat = function (name, value) {
			this.editor.formatter.toggle(name, value ? { value: value } : undefined);
			this.editor.nodeChanged();
		};
		EditorCommands.prototype.storeSelection = function (type) {
			this.selectionBookmark = this.editor.selection.getBookmark(type);
		};
		EditorCommands.prototype.restoreSelection = function () {
			this.editor.selection.moveToBookmark(this.selectionBookmark);
		};
		EditorCommands.prototype.setupCommands = function (editor) {
			var self = this;
			this.addCommands({
				'mceResetDesignMode,mceBeginUndoLevel': function () {
				},
				'mceEndUndoLevel,mceAddUndoLevel': function () {
					editor.undoManager.add();
				},
				'Cut,Copy,Paste': function (command) {
					var doc = editor.getDoc();
					var failed;
					try {
						self.execNativeCommand(command);
					} catch (ex) {
						failed = true;
					}
					if (command === 'paste' && !doc.queryCommandEnabled(command)) {
						failed = true;
					}
					if (failed || !doc.queryCommandSupported(command)) {
						var msg = editor.translate('Your browser doesn\'t support direct access to the clipboard. ' + 'Please use the Ctrl+X/C/V keyboard shortcuts instead.');
						if (Env.mac) {
							msg = msg.replace(/Ctrl\+/g, '\u2318+');
						}
						editor.notificationManager.open({
							text: msg,
							type: 'error'
						});
					}
				},
				'unlink': function () {
					if (editor.selection.isCollapsed()) {
						var elm = editor.dom.getParent(editor.selection.getStart(), 'a');
						if (elm) {
							editor.dom.remove(elm, true);
						}
						return;
					}
					editor.formatter.remove('link');
				},
				'JustifyLeft,JustifyCenter,JustifyRight,JustifyFull,JustifyNone': function (command) {
					var align = command.substring(7);
					if (align === 'full') {
						align = 'justify';
					}
					each$f('left,center,right,justify'.split(','), function (name) {
						if (align !== name) {
							editor.formatter.remove('align' + name);
						}
					});
					if (align !== 'none') {
						self.toggleFormat('align' + align);
					}
				},
				'InsertUnorderedList,InsertOrderedList': function (command) {
					var listParent;
					self.execNativeCommand(command);
					var listElm = editor.dom.getParent(editor.selection.getNode(), 'ol,ul');
					if (listElm) {
						listParent = listElm.parentNode;
						if (/^(H[1-6]|P|ADDRESS|PRE)$/.test(listParent.nodeName)) {
							self.storeSelection();
							editor.dom.split(listParent, listElm);
							self.restoreSelection();
						}
					}
				},
				'Bold,Italic,Underline,Strikethrough,Superscript,Subscript': function (command) {
					self.toggleFormat(command);
				},
				'ForeColor,HiliteColor': function (command, ui, value) {
					self.toggleFormat(command, value);
				},
				'FontName': function (command, ui, value) {
					fontNameAction(editor, value);
				},
				'FontSize': function (command, ui, value) {
					fontSizeAction(editor, value);
				},
				'LineHeight': function (command, ui, value) {
					lineHeightAction(editor, value);
				},
				'RemoveFormat': function (command) {
					editor.formatter.remove(command);
				},
				'mceBlockQuote': function () {
					self.toggleFormat('blockquote');
				},
				'FormatBlock': function (command, ui, value) {
					return self.toggleFormat(value || 'p');
				},
				'mceCleanup': function () {
					var bookmark = editor.selection.getBookmark();
					editor.setContent(editor.getContent());
					editor.selection.moveToBookmark(bookmark);
				},
				'mceRemoveNode': function (command, ui, value) {
					var node = value || editor.selection.getNode();
					if (node !== editor.getBody()) {
						self.storeSelection();
						editor.dom.remove(node, true);
						self.restoreSelection();
					}
				},
				'mceSelectNodeDepth': function (command, ui, value) {
					var counter = 0;
					editor.dom.getParent(editor.selection.getNode(), function (node) {
						if (node.nodeType === 1 && counter++ === value) {
							editor.selection.select(node);
							return false;
						}
					}, editor.getBody());
				},
				'mceSelectNode': function (command, ui, value) {
					editor.selection.select(value);
				},
				'mceInsertContent': function (command, ui, value) {
					insertAtCaret$1(editor, value);
				},
				'mceInsertRawHTML': function (command, ui, value) {
					editor.selection.setContent('tiny_mce_marker');
					var content = editor.getContent();
					editor.setContent(content.replace(/tiny_mce_marker/g, function () {
						return value;
					}));
				},
				'mceInsertNewLine': function (command, ui, value) {
					insert$3(editor, value);
				},
				'mceToggleFormat': function (command, ui, value) {
					self.toggleFormat(value);
				},
				'mceSetContent': function (command, ui, value) {
					editor.setContent(value);
				},
				'Indent,Outdent': function (command) {
					handle(editor, command);
				},
				'mceRepaint': function () {
				},
				'InsertHorizontalRule': function () {
					editor.execCommand('mceInsertContent', false, '<hr />');
				},
				'mceToggleVisualAid': function () {
					editor.hasVisual = !editor.hasVisual;
					editor.addVisual();
				},
				'mceReplaceContent': function (command, ui, value) {
					editor.execCommand('mceInsertContent', false, value.replace(/\{\$selection\}/g, editor.selection.getContent({ format: 'text' })));
				},
				'mceInsertLink': function (command, ui, value) {
					if (typeof value === 'string') {
						value = { href: value };
					}
					var anchor = editor.dom.getParent(editor.selection.getNode(), 'a');
					value.href = value.href.replace(/ /g, '%20');
					if (!anchor || !value.href) {
						editor.formatter.remove('link');
					}
					if (value.href) {
						editor.formatter.apply('link', value, anchor);
					}
				},
				'selectAll': function () {
					var editingHost = editor.dom.getParent(editor.selection.getStart(), isContentEditableTrue);
					if (editingHost) {
						var rng = editor.dom.createRng();
						rng.selectNodeContents(editingHost);
						editor.selection.setRng(rng);
					}
				},
				'mceNewDocument': function () {
					editor.setContent('');
				},
				'InsertLineBreak': function (command, ui, value) {
					insert$2(editor, value);
					return true;
				}
			});
			var alignStates = function (name) {
				return function () {
					var selection = editor.selection;
					var nodes = selection.isCollapsed() ? [editor.dom.getParent(selection.getNode(), editor.dom.isBlock)] : selection.getSelectedBlocks();
					var matches = map$3(nodes, function (node) {
						return !!editor.formatter.matchNode(node, name);
					});
					return inArray$2(matches, true) !== -1;
				};
			};
			self.addCommands({
				'JustifyLeft': alignStates('alignleft'),
				'JustifyCenter': alignStates('aligncenter'),
				'JustifyRight': alignStates('alignright'),
				'JustifyFull': alignStates('alignjustify'),
				'Bold,Italic,Underline,Strikethrough,Superscript,Subscript': function (command) {
					return self.isFormatMatch(command);
				},
				'mceBlockQuote': function () {
					return self.isFormatMatch('blockquote');
				},
				'Outdent': function () {
					return canOutdent(editor);
				},
				'InsertUnorderedList,InsertOrderedList': function (command) {
					var list = editor.dom.getParent(editor.selection.getNode(), 'ul,ol');
					return list && (command === 'insertunorderedlist' && list.tagName === 'UL' || command === 'insertorderedlist' && list.tagName === 'OL');
				}
			}, 'state');
			self.addCommands({
				Undo: function () {
					editor.undoManager.undo();
				},
				Redo: function () {
					editor.undoManager.redo();
				}
			});
			self.addQueryValueHandler('FontName', function () {
				return fontNameQuery(editor);
			}, this);
			self.addQueryValueHandler('FontSize', function () {
				return fontSizeQuery(editor);
			}, this);
			self.addQueryValueHandler('LineHeight', function () {
				return lineHeightQuery(editor);
			}, this);
		};
		return EditorCommands;
	}();

	var internalContentEditableAttr = 'data-mce-contenteditable';
	var toggleClass = function (elm, cls, state) {
		if (has$2(elm, cls) && state === false) {
			remove$4(elm, cls);
		} else if (state) {
			add$3(elm, cls);
		}
	};
	var setEditorCommandState = function (editor, cmd, state) {
		try {
			editor.getDoc().execCommand(cmd, false, String(state));
		} catch (ex) {
		}
	};
	var setContentEditable = function (elm, state) {
		elm.dom.contentEditable = state ? 'true' : 'false';
	};
	var switchOffContentEditableTrue = function (elm) {
		each(descendants$1(elm, '*[contenteditable="true"]'), function (elm) {
			set(elm, internalContentEditableAttr, 'true');
			setContentEditable(elm, false);
		});
	};
	var switchOnContentEditableTrue = function (elm) {
		each(descendants$1(elm, '*[' + internalContentEditableAttr + '="true"]'), function (elm) {
			remove$1(elm, internalContentEditableAttr);
			setContentEditable(elm, true);
		});
	};
	var removeFakeSelection = function (editor) {
		Optional.from(editor.selection.getNode()).each(function (elm) {
			elm.removeAttribute('data-mce-selected');
		});
	};
	var restoreFakeSelection = function (editor) {
		editor.selection.setRng(editor.selection.getRng());
	};
	var toggleReadOnly = function (editor, state) {
		var body = SugarElement.fromDom(editor.getBody());
		toggleClass(body, 'mce-content-readonly', state);
		if (state) {
			editor.selection.controlSelection.hideResizeRect();
			editor._selectionOverrides.hideFakeCaret();
			removeFakeSelection(editor);
			editor.readonly = true;
			setContentEditable(body, false);
			switchOffContentEditableTrue(body);
		} else {
			editor.readonly = false;
			setContentEditable(body, true);
			switchOnContentEditableTrue(body);
			setEditorCommandState(editor, 'StyleWithCSS', false);
			setEditorCommandState(editor, 'enableInlineTableEditing', false);
			setEditorCommandState(editor, 'enableObjectResizing', false);
			if (hasEditorOrUiFocus(editor)) {
				editor.focus();
			}
			restoreFakeSelection(editor);
			editor.nodeChanged();
		}
	};
	var isReadOnly$1 = function (editor) {
		return editor.readonly;
	};
	var registerFilters = function (editor) {
		editor.parser.addAttributeFilter('contenteditable', function (nodes) {
			if (isReadOnly$1(editor)) {
				each(nodes, function (node) {
					node.attr(internalContentEditableAttr, node.attr('contenteditable'));
					node.attr('contenteditable', 'false');
				});
			}
		});
		editor.serializer.addAttributeFilter(internalContentEditableAttr, function (nodes) {
			if (isReadOnly$1(editor)) {
				each(nodes, function (node) {
					node.attr('contenteditable', node.attr(internalContentEditableAttr));
				});
			}
		});
		editor.serializer.addTempAttr(internalContentEditableAttr);
	};
	var registerReadOnlyContentFilters = function (editor) {
		if (editor.serializer) {
			registerFilters(editor);
		} else {
			editor.on('PreInit', function () {
				registerFilters(editor);
			});
		}
	};
	var isClickEvent = function (e) {
		return e.type === 'click';
	};
	var getAnchorHrefOpt = function (editor, elm) {
		var isRoot = function (elm) {
			return eq$2(elm, SugarElement.fromDom(editor.getBody()));
		};
		return closest$1(elm, 'a', isRoot).bind(function (a) {
			return getOpt(a, 'href');
		});
	};
	var processReadonlyEvents = function (editor, e) {
		if (isClickEvent(e) && !VK.metaKeyPressed(e)) {
			var elm = SugarElement.fromDom(e.target);
			getAnchorHrefOpt(editor, elm).each(function (href) {
				e.preventDefault();
				if (/^#/.test(href)) {
					var targetEl = editor.dom.select(href + ',[name="' + removeLeading(href, '#') + '"]');
					if (targetEl.length) {
						editor.selection.scrollIntoView(targetEl[0], true);
					}
				} else {
					window.open(href, '_blank', 'rel=noopener noreferrer,menubar=yes,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes');
				}
			});
		}
	};
	var registerReadOnlySelectionBlockers = function (editor) {
		editor.on('ShowCaret', function (e) {
			if (isReadOnly$1(editor)) {
				e.preventDefault();
			}
		});
		editor.on('ObjectSelected', function (e) {
			if (isReadOnly$1(editor)) {
				e.preventDefault();
			}
		});
	};

	var nativeEvents = Tools.makeMap('focus blur focusin focusout click dblclick mousedown mouseup mousemove mouseover beforepaste paste cut copy selectionchange ' + 'mouseout mouseenter mouseleave wheel keydown keypress keyup input beforeinput contextmenu dragstart dragend dragover ' + 'draggesture dragdrop drop drag submit ' + 'compositionstart compositionend compositionupdate touchstart touchmove touchend touchcancel', ' ');
	var EventDispatcher = function () {
		function EventDispatcher(settings) {
			this.bindings = {};
			this.settings = settings || {};
			this.scope = this.settings.scope || this;
			this.toggleEvent = this.settings.toggleEvent || never;
		}
		EventDispatcher.isNative = function (name) {
			return !!nativeEvents[name.toLowerCase()];
		};
		EventDispatcher.prototype.fire = function (nameIn, argsIn) {
			var name = nameIn.toLowerCase();
			var args = argsIn || {};
			args.type = name;
			if (!args.target) {
				args.target = this.scope;
			}
			if (!args.preventDefault) {
				args.preventDefault = function () {
					args.isDefaultPrevented = always;
				};
				args.stopPropagation = function () {
					args.isPropagationStopped = always;
				};
				args.stopImmediatePropagation = function () {
					args.isImmediatePropagationStopped = always;
				};
				args.isDefaultPrevented = never;
				args.isPropagationStopped = never;
				args.isImmediatePropagationStopped = never;
			}
			if (this.settings.beforeFire) {
				this.settings.beforeFire(args);
			}
			var handlers = this.bindings[name];
			if (handlers) {
				for (var i = 0, l = handlers.length; i < l; i++) {
					var callback = handlers[i];
					if (callback.once) {
						this.off(name, callback.func);
					}
					if (args.isImmediatePropagationStopped()) {
						args.stopPropagation();
						return args;
					}
					if (callback.func.call(this.scope, args) === false) {
						args.preventDefault();
						return args;
					}
				}
			}
			return args;
		};
		EventDispatcher.prototype.on = function (name, callback, prepend, extra) {
			if (callback === false) {
				callback = never;
			}
			if (callback) {
				var wrappedCallback = { func: callback };
				if (extra) {
					Tools.extend(wrappedCallback, extra);
				}
				var names = name.toLowerCase().split(' ');
				var i = names.length;
				while (i--) {
					var currentName = names[i];
					var handlers = this.bindings[currentName];
					if (!handlers) {
						handlers = this.bindings[currentName] = [];
						this.toggleEvent(currentName, true);
					}
					if (prepend) {
						handlers.unshift(wrappedCallback);
					} else {
						handlers.push(wrappedCallback);
					}
				}
			}
			return this;
		};
		EventDispatcher.prototype.off = function (name, callback) {
			var _this = this;
			if (name) {
				var names = name.toLowerCase().split(' ');
				var i = names.length;
				while (i--) {
					var currentName = names[i];
					var handlers = this.bindings[currentName];
					if (!currentName) {
						each$1(this.bindings, function (_value, bindingName) {
							_this.toggleEvent(bindingName, false);
							delete _this.bindings[bindingName];
						});
						return this;
					}
					if (handlers) {
						if (!callback) {
							handlers.length = 0;
						} else {
							var hi = handlers.length;
							while (hi--) {
								if (handlers[hi].func === callback) {
									handlers = handlers.slice(0, hi).concat(handlers.slice(hi + 1));
									this.bindings[currentName] = handlers;
								}
							}
						}
						if (!handlers.length) {
							this.toggleEvent(name, false);
							delete this.bindings[currentName];
						}
					}
				}
			} else {
				each$1(this.bindings, function (_value, name) {
					_this.toggleEvent(name, false);
				});
				this.bindings = {};
			}
			return this;
		};
		EventDispatcher.prototype.once = function (name, callback, prepend) {
			return this.on(name, callback, prepend, { once: true });
		};
		EventDispatcher.prototype.has = function (name) {
			name = name.toLowerCase();
			return !(!this.bindings[name] || this.bindings[name].length === 0);
		};
		return EventDispatcher;
	}();

	var getEventDispatcher = function (obj) {
		if (!obj._eventDispatcher) {
			obj._eventDispatcher = new EventDispatcher({
				scope: obj,
				toggleEvent: function (name, state) {
					if (EventDispatcher.isNative(name) && obj.toggleNativeEvent) {
						obj.toggleNativeEvent(name, state);
					}
				}
			});
		}
		return obj._eventDispatcher;
	};
	var Observable = {
		fire: function (name, args, bubble) {
			var self = this;
			if (self.removed && name !== 'remove' && name !== 'detach') {
				return args;
			}
			var dispatcherArgs = getEventDispatcher(self).fire(name, args);
			if (bubble !== false && self.parent) {
				var parent_1 = self.parent();
				while (parent_1 && !dispatcherArgs.isPropagationStopped()) {
					parent_1.fire(name, dispatcherArgs, false);
					parent_1 = parent_1.parent();
				}
			}
			return dispatcherArgs;
		},
		on: function (name, callback, prepend) {
			return getEventDispatcher(this).on(name, callback, prepend);
		},
		off: function (name, callback) {
			return getEventDispatcher(this).off(name, callback);
		},
		once: function (name, callback) {
			return getEventDispatcher(this).once(name, callback);
		},
		hasEventListeners: function (name) {
			return getEventDispatcher(this).has(name);
		}
	};

	var DOM$8 = DOMUtils$1.DOM;
	var customEventRootDelegates;
	var getEventTarget = function (editor, eventName) {
		if (eventName === 'selectionchange') {
			return editor.getDoc();
		}
		if (!editor.inline && /^mouse|touch|click|contextmenu|drop|dragover|dragend/.test(eventName)) {
			return editor.getDoc().documentElement;
		}
		var eventRoot = getEventRoot(editor);
		if (eventRoot) {
			if (!editor.eventRoot) {
				editor.eventRoot = DOM$8.select(eventRoot)[0];
			}
			return editor.eventRoot;
		}
		return editor.getBody();
	};
	var isListening = function (editor) {
		return !editor.hidden && !isReadOnly$1(editor);
	};
	var fireEvent = function (editor, eventName, e) {
		if (isListening(editor)) {
			editor.fire(eventName, e);
		} else if (isReadOnly$1(editor)) {
			processReadonlyEvents(editor, e);
		}
	};
	var bindEventDelegate = function (editor, eventName) {
		var delegate;
		if (!editor.delegates) {
			editor.delegates = {};
		}
		if (editor.delegates[eventName] || editor.removed) {
			return;
		}
		var eventRootElm = getEventTarget(editor, eventName);
		if (getEventRoot(editor)) {
			if (!customEventRootDelegates) {
				customEventRootDelegates = {};
				editor.editorManager.on('removeEditor', function () {
					if (!editor.editorManager.activeEditor) {
						if (customEventRootDelegates) {
							each$1(customEventRootDelegates, function (_value, name) {
								editor.dom.unbind(getEventTarget(editor, name));
							});
							customEventRootDelegates = null;
						}
					}
				});
			}
			if (customEventRootDelegates[eventName]) {
				return;
			}
			delegate = function (e) {
				var target = e.target;
				var editors = editor.editorManager.get();
				var i = editors.length;
				while (i--) {
					var body = editors[i].getBody();
					if (body === target || DOM$8.isChildOf(target, body)) {
						fireEvent(editors[i], eventName, e);
					}
				}
			};
			customEventRootDelegates[eventName] = delegate;
			DOM$8.bind(eventRootElm, eventName, delegate);
		} else {
			delegate = function (e) {
				fireEvent(editor, eventName, e);
			};
			DOM$8.bind(eventRootElm, eventName, delegate);
			editor.delegates[eventName] = delegate;
		}
	};
	var EditorObservable = __assign(__assign({}, Observable), {
		bindPendingEventDelegates: function () {
			var self = this;
			Tools.each(self._pendingNativeEvents, function (name) {
				bindEventDelegate(self, name);
			});
		},
		toggleNativeEvent: function (name, state) {
			var self = this;
			if (name === 'focus' || name === 'blur') {
				return;
			}
			if (state) {
				if (self.initialized) {
					bindEventDelegate(self, name);
				} else {
					if (!self._pendingNativeEvents) {
						self._pendingNativeEvents = [name];
					} else {
						self._pendingNativeEvents.push(name);
					}
				}
			} else if (self.initialized) {
				self.dom.unbind(getEventTarget(self, name), name, self.delegates[name]);
				delete self.delegates[name];
			}
		},
		unbindAllNativeEvents: function () {
			var self = this;
			var body = self.getBody();
			var dom = self.dom;
			if (self.delegates) {
				each$1(self.delegates, function (value, name) {
					self.dom.unbind(getEventTarget(self, name), name, value);
				});
				delete self.delegates;
			}
			if (!self.inline && body && dom) {
				body.onload = null;
				dom.unbind(self.getWin());
				dom.unbind(self.getDoc());
			}
			if (dom) {
				dom.unbind(body);
				dom.unbind(self.getContainer());
			}
		}
	});

	var defaultModes = [
		'design',
		'readonly'
	];
	var switchToMode = function (editor, activeMode, availableModes, mode) {
		var oldMode = availableModes[activeMode.get()];
		var newMode = availableModes[mode];
		try {
			newMode.activate();
		} catch (e) {
			console.error('problem while activating editor mode ' + mode + ':', e);
			return;
		}
		oldMode.deactivate();
		if (oldMode.editorReadOnly !== newMode.editorReadOnly) {
			toggleReadOnly(editor, newMode.editorReadOnly);
		}
		activeMode.set(mode);
		fireSwitchMode(editor, mode);
	};
	var setMode = function (editor, availableModes, activeMode, mode) {
		if (mode === activeMode.get()) {
			return;
		} else if (!has(availableModes, mode)) {
			throw new Error('Editor mode \'' + mode + '\' is invalid');
		}
		if (editor.initialized) {
			switchToMode(editor, activeMode, availableModes, mode);
		} else {
			editor.on('init', function () {
				return switchToMode(editor, activeMode, availableModes, mode);
			});
		}
	};
	var registerMode = function (availableModes, mode, api) {
		var _a;
		if (contains(defaultModes, mode)) {
			throw new Error('Cannot override default mode ' + mode);
		}
		return __assign(__assign({}, availableModes), (_a = {}, _a[mode] = __assign(__assign({}, api), {
			deactivate: function () {
				try {
					api.deactivate();
				} catch (e) {
					console.error('problem while deactivating editor mode ' + mode + ':', e);
				}
			}
		}), _a));
	};

	var create$5 = function (editor) {
		var activeMode = Cell('design');
		var availableModes = Cell({
			design: {
				activate: noop,
				deactivate: noop,
				editorReadOnly: false
			},
			readonly: {
				activate: noop,
				deactivate: noop,
				editorReadOnly: true
			}
		});
		registerReadOnlyContentFilters(editor);
		registerReadOnlySelectionBlockers(editor);
		return {
			isReadOnly: function () {
				return isReadOnly$1(editor);
			},
			set: function (mode) {
				return setMode(editor, availableModes.get(), activeMode, mode);
			},
			get: function () {
				return activeMode.get();
			},
			register: function (mode, api) {
				availableModes.set(registerMode(availableModes.get(), mode, api));
			}
		};
	};

	var each$g = Tools.each, explode$3 = Tools.explode;
	var keyCodeLookup = {
		f1: 112,
		f2: 113,
		f3: 114,
		f4: 115,
		f5: 116,
		f6: 117,
		f7: 118,
		f8: 119,
		f9: 120,
		f10: 121,
		f11: 122,
		f12: 123
	};
	var modifierNames = Tools.makeMap('alt,ctrl,shift,meta,access');
	var Shortcuts = function () {
		function Shortcuts(editor) {
			this.shortcuts = {};
			this.pendingPatterns = [];
			this.editor = editor;
			var self = this;
			editor.on('keyup keypress keydown', function (e) {
				if ((self.hasModifier(e) || self.isFunctionKey(e)) && !e.isDefaultPrevented()) {
					each$g(self.shortcuts, function (shortcut) {
						if (self.matchShortcut(e, shortcut)) {
							self.pendingPatterns = shortcut.subpatterns.slice(0);
							if (e.type === 'keydown') {
								self.executeShortcutAction(shortcut);
							}
							return true;
						}
					});
					if (self.matchShortcut(e, self.pendingPatterns[0])) {
						if (self.pendingPatterns.length === 1) {
							if (e.type === 'keydown') {
								self.executeShortcutAction(self.pendingPatterns[0]);
							}
						}
						self.pendingPatterns.shift();
					}
				}
			});
		}
		Shortcuts.prototype.add = function (pattern, desc, cmdFunc, scope) {
			var self = this;
			var func = self.normalizeCommandFunc(cmdFunc);
			each$g(explode$3(Tools.trim(pattern)), function (pattern) {
				var shortcut = self.createShortcut(pattern, desc, func, scope);
				self.shortcuts[shortcut.id] = shortcut;
			});
			return true;
		};
		Shortcuts.prototype.remove = function (pattern) {
			var shortcut = this.createShortcut(pattern);
			if (this.shortcuts[shortcut.id]) {
				delete this.shortcuts[shortcut.id];
				return true;
			}
			return false;
		};
		Shortcuts.prototype.normalizeCommandFunc = function (cmdFunc) {
			var self = this;
			var cmd = cmdFunc;
			if (typeof cmd === 'string') {
				return function () {
					self.editor.execCommand(cmd, false, null);
				};
			} else if (Tools.isArray(cmd)) {
				return function () {
					self.editor.execCommand(cmd[0], cmd[1], cmd[2]);
				};
			} else {
				return cmd;
			}
		};
		Shortcuts.prototype.parseShortcut = function (pattern) {
			var key;
			var shortcut = {};
			each$g(explode$3(pattern.toLowerCase(), '+'), function (value) {
				if (value in modifierNames) {
					shortcut[value] = true;
				} else {
					if (/^[0-9]{2,}$/.test(value)) {
						shortcut.keyCode = parseInt(value, 10);
					} else {
						shortcut.charCode = value.charCodeAt(0);
						shortcut.keyCode = keyCodeLookup[value] || value.toUpperCase().charCodeAt(0);
					}
				}
			});
			var id = [shortcut.keyCode];
			for (key in modifierNames) {
				if (shortcut[key]) {
					id.push(key);
				} else {
					shortcut[key] = false;
				}
			}
			shortcut.id = id.join(',');
			if (shortcut.access) {
				shortcut.alt = true;
				if (Env.mac) {
					shortcut.ctrl = true;
				} else {
					shortcut.shift = true;
				}
			}
			if (shortcut.meta) {
				if (Env.mac) {
					shortcut.meta = true;
				} else {
					shortcut.ctrl = true;
					shortcut.meta = false;
				}
			}
			return shortcut;
		};
		Shortcuts.prototype.createShortcut = function (pattern, desc, cmdFunc, scope) {
			var shortcuts = Tools.map(explode$3(pattern, '>'), this.parseShortcut);
			shortcuts[shortcuts.length - 1] = Tools.extend(shortcuts[shortcuts.length - 1], {
				func: cmdFunc,
				scope: scope || this.editor
			});
			return Tools.extend(shortcuts[0], {
				desc: this.editor.translate(desc),
				subpatterns: shortcuts.slice(1)
			});
		};
		Shortcuts.prototype.hasModifier = function (e) {
			return e.altKey || e.ctrlKey || e.metaKey;
		};
		Shortcuts.prototype.isFunctionKey = function (e) {
			return e.type === 'keydown' && e.keyCode >= 112 && e.keyCode <= 123;
		};
		Shortcuts.prototype.matchShortcut = function (e, shortcut) {
			if (!shortcut) {
				return false;
			}
			if (shortcut.ctrl !== e.ctrlKey || shortcut.meta !== e.metaKey) {
				return false;
			}
			if (shortcut.alt !== e.altKey || shortcut.shift !== e.shiftKey) {
				return false;
			}
			if (e.keyCode === shortcut.keyCode || e.charCode && e.charCode === shortcut.charCode) {
				e.preventDefault();
				return true;
			}
			return false;
		};
		Shortcuts.prototype.executeShortcutAction = function (shortcut) {
			return shortcut.func ? shortcut.func.call(shortcut.scope) : null;
		};
		return Shortcuts;
	}();

	var create$6 = function () {
		var buttons = {};
		var menuItems = {};
		var popups = {};
		var icons = {};
		var contextMenus = {};
		var contextToolbars = {};
		var sidebars = {};
		var add = function (collection, type) {
			return function (name, spec) {
				return collection[name.toLowerCase()] = __assign(__assign({}, spec), { type: type });
			};
		};
		var addIcon = function (name, svgData) {
			return icons[name.toLowerCase()] = svgData;
		};
		return {
			addButton: add(buttons, 'button'),
			addGroupToolbarButton: add(buttons, 'grouptoolbarbutton'),
			addToggleButton: add(buttons, 'togglebutton'),
			addMenuButton: add(buttons, 'menubutton'),
			addSplitButton: add(buttons, 'splitbutton'),
			addMenuItem: add(menuItems, 'menuitem'),
			addNestedMenuItem: add(menuItems, 'nestedmenuitem'),
			addToggleMenuItem: add(menuItems, 'togglemenuitem'),
			addAutocompleter: add(popups, 'autocompleter'),
			addContextMenu: add(contextMenus, 'contextmenu'),
			addContextToolbar: add(contextToolbars, 'contexttoolbar'),
			addContextForm: add(contextToolbars, 'contextform'),
			addSidebar: add(sidebars, 'sidebar'),
			addIcon: addIcon,
			getAll: function () {
				return {
					buttons: buttons,
					menuItems: menuItems,
					icons: icons,
					popups: popups,
					contextMenus: contextMenus,
					contextToolbars: contextToolbars,
					sidebars: sidebars
				};
			}
		};
	};

	var registry = function () {
		var bridge = create$6();
		return {
			addAutocompleter: bridge.addAutocompleter,
			addButton: bridge.addButton,
			addContextForm: bridge.addContextForm,
			addContextMenu: bridge.addContextMenu,
			addContextToolbar: bridge.addContextToolbar,
			addIcon: bridge.addIcon,
			addMenuButton: bridge.addMenuButton,
			addMenuItem: bridge.addMenuItem,
			addNestedMenuItem: bridge.addNestedMenuItem,
			addSidebar: bridge.addSidebar,
			addSplitButton: bridge.addSplitButton,
			addToggleButton: bridge.addToggleButton,
			addGroupToolbarButton: bridge.addGroupToolbarButton,
			addToggleMenuItem: bridge.addToggleMenuItem,
			getAll: bridge.getAll
		};
	};

	var each$h = Tools.each, trim$4 = Tools.trim;
	var queryParts = 'source protocol authority userInfo user password host port relative path directory file query anchor'.split(' ');
	var DEFAULT_PORTS = {
		ftp: 21,
		http: 80,
		https: 443,
		mailto: 25
	};
	var URI = function () {
		function URI(url, settings) {
			url = trim$4(url);
			this.settings = settings || {};
			var baseUri = this.settings.base_uri;
			var self = this;
			if (/^([\w\-]+):([^\/]{2})/i.test(url) || /^\s*#/.test(url)) {
				self.source = url;
				return;
			}
			var isProtocolRelative = url.indexOf('//') === 0;
			if (url.indexOf('/') === 0 && !isProtocolRelative) {
				url = (baseUri ? baseUri.protocol || 'http' : 'http') + '://mce_host' + url;
			}
			if (!/^[\w\-]*:?\/\//.test(url)) {
				var baseUrl = this.settings.base_uri ? this.settings.base_uri.path : new URI(document.location.href).directory;
				if (this.settings.base_uri && this.settings.base_uri.protocol == '') {
					url = '//mce_host' + self.toAbsPath(baseUrl, url);
				} else {
					var match = /([^#?]*)([#?]?.*)/.exec(url);
					url = (baseUri && baseUri.protocol || 'http') + '://mce_host' + self.toAbsPath(baseUrl, match[1]) + match[2];
				}
			}
			url = url.replace(/@@/g, '(mce_at)');
			var urlMatch = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(url);
			each$h(queryParts, function (v, i) {
				var part = urlMatch[i];
				if (part) {
					part = part.replace(/\(mce_at\)/g, '@@');
				}
				self[v] = part;
			});
			if (baseUri) {
				if (!self.protocol) {
					self.protocol = baseUri.protocol;
				}
				if (!self.userInfo) {
					self.userInfo = baseUri.userInfo;
				}
				if (!self.port && self.host === 'mce_host') {
					self.port = baseUri.port;
				}
				if (!self.host || self.host === 'mce_host') {
					self.host = baseUri.host;
				}
				self.source = '';
			}
			if (isProtocolRelative) {
				self.protocol = '';
			}
		}
		URI.parseDataUri = function (uri) {
			var type;
			var uriComponents = decodeURIComponent(uri).split(',');
			var matches = /data:([^;]+)/.exec(uriComponents[0]);
			if (matches) {
				type = matches[1];
			}
			return {
				type: type,
				data: uriComponents[1]
			};
		};
		URI.getDocumentBaseUrl = function (loc) {
			var baseUrl;
			if (loc.protocol.indexOf('http') !== 0 && loc.protocol !== 'file:') {
				baseUrl = loc.href;
			} else {
				baseUrl = loc.protocol + '//' + loc.host + loc.pathname;
			}
			if (/^[^:]+:\/\/\/?[^\/]+\//.test(baseUrl)) {
				baseUrl = baseUrl.replace(/[\?#].*$/, '').replace(/[\/\\][^\/]+$/, '');
				if (!/[\/\\]$/.test(baseUrl)) {
					baseUrl += '/';
				}
			}
			return baseUrl;
		};
		URI.prototype.setPath = function (path) {
			var pathMatch = /^(.*?)\/?(\w+)?$/.exec(path);
			this.path = pathMatch[0];
			this.directory = pathMatch[1];
			this.file = pathMatch[2];
			this.source = '';
			this.getURI();
		};
		URI.prototype.toRelative = function (uri) {
			var output;
			if (uri === './') {
				return uri;
			}
			var relativeUri = new URI(uri, { base_uri: this });
			if (relativeUri.host !== 'mce_host' && this.host !== relativeUri.host && relativeUri.host || this.port !== relativeUri.port || this.protocol !== relativeUri.protocol && relativeUri.protocol !== '') {
				return relativeUri.getURI();
			}
			var tu = this.getURI(), uu = relativeUri.getURI();
			if (tu === uu || tu.charAt(tu.length - 1) === '/' && tu.substr(0, tu.length - 1) === uu) {
				return tu;
			}
			output = this.toRelPath(this.path, relativeUri.path);
			if (relativeUri.query) {
				output += '?' + relativeUri.query;
			}
			if (relativeUri.anchor) {
				output += '#' + relativeUri.anchor;
			}
			return output;
		};
		URI.prototype.toAbsolute = function (uri, noHost) {
			var absoluteUri = new URI(uri, { base_uri: this });
			return absoluteUri.getURI(noHost && this.isSameOrigin(absoluteUri));
		};
		URI.prototype.isSameOrigin = function (uri) {
			if (this.host == uri.host && this.protocol == uri.protocol) {
				if (this.port == uri.port) {
					return true;
				}
				var defaultPort = DEFAULT_PORTS[this.protocol];
				if (defaultPort && (this.port || defaultPort) == (uri.port || defaultPort)) {
					return true;
				}
			}
			return false;
		};
		URI.prototype.toRelPath = function (base, path) {
			var breakPoint = 0, out = '', i, l;
			var normalizedBase = base.substring(0, base.lastIndexOf('/')).split('/');
			var items = path.split('/');
			if (normalizedBase.length >= items.length) {
				for (i = 0, l = normalizedBase.length; i < l; i++) {
					if (i >= items.length || normalizedBase[i] !== items[i]) {
						breakPoint = i + 1;
						break;
					}
				}
			}
			if (normalizedBase.length < items.length) {
				for (i = 0, l = items.length; i < l; i++) {
					if (i >= normalizedBase.length || normalizedBase[i] !== items[i]) {
						breakPoint = i + 1;
						break;
					}
				}
			}
			if (breakPoint === 1) {
				return path;
			}
			for (i = 0, l = normalizedBase.length - (breakPoint - 1); i < l; i++) {
				out += '../';
			}
			for (i = breakPoint - 1, l = items.length; i < l; i++) {
				if (i !== breakPoint - 1) {
					out += '/' + items[i];
				} else {
					out += items[i];
				}
			}
			return out;
		};
		URI.prototype.toAbsPath = function (base, path) {
			var i, nb = 0, o = [], outPath;
			var tr = /\/$/.test(path) ? '/' : '';
			var normalizedBase = base.split('/');
			var normalizedPath = path.split('/');
			each$h(normalizedBase, function (k) {
				if (k) {
					o.push(k);
				}
			});
			normalizedBase = o;
			for (i = normalizedPath.length - 1, o = []; i >= 0; i--) {
				if (normalizedPath[i].length === 0 || normalizedPath[i] === '.') {
					continue;
				}
				if (normalizedPath[i] === '..') {
					nb++;
					continue;
				}
				if (nb > 0) {
					nb--;
					continue;
				}
				o.push(normalizedPath[i]);
			}
			i = normalizedBase.length - nb;
			if (i <= 0) {
				outPath = reverse(o).join('/');
			} else {
				outPath = normalizedBase.slice(0, i).join('/') + '/' + reverse(o).join('/');
			}
			if (outPath.indexOf('/') !== 0) {
				outPath = '/' + outPath;
			}
			if (tr && outPath.lastIndexOf('/') !== outPath.length - 1) {
				outPath += tr;
			}
			return outPath;
		};
		URI.prototype.getURI = function (noProtoHost) {
			if (noProtoHost === void 0) {
				noProtoHost = false;
			}
			var s;
			if (!this.source || noProtoHost) {
				s = '';
				if (!noProtoHost) {
					if (this.protocol) {
						s += this.protocol + '://';
					} else {
						s += '//';
					}
					if (this.userInfo) {
						s += this.userInfo + '@';
					}
					if (this.host) {
						s += this.host;
					}
					if (this.port) {
						s += ':' + this.port;
					}
				}
				if (this.path) {
					s += this.path;
				}
				if (this.query) {
					s += '?' + this.query;
				}
				if (this.anchor) {
					s += '#' + this.anchor;
				}
				this.source = s;
			}
			return this.source;
		};
		return URI;
	}();

	var DOM$9 = DOMUtils$1.DOM;
	var extend$3 = Tools.extend, each$i = Tools.each;
	var resolve$3 = Tools.resolve;
	var ie$1 = Env.ie;
	var Editor = function () {
		function Editor(id, settings, editorManager) {
			var _this = this;
			this.plugins = {};
			this.contentCSS = [];
			this.contentStyles = [];
			this.loadedCSS = {};
			this.isNotDirty = false;
			this.editorManager = editorManager;
			this.documentBaseUrl = editorManager.documentBaseURL;
			extend$3(this, EditorObservable);
			this.settings = getEditorSettings(this, id, this.documentBaseUrl, editorManager.defaultSettings, settings);
			if (this.settings.suffix) {
				editorManager.suffix = this.settings.suffix;
			}
			this.suffix = editorManager.suffix;
			if (this.settings.base_url) {
				editorManager._setBaseUrl(this.settings.base_url);
			}
			this.baseUri = editorManager.baseURI;
			if (this.settings.referrer_policy) {
				ScriptLoader.ScriptLoader._setReferrerPolicy(this.settings.referrer_policy);
				DOMUtils$1.DOM.styleSheetLoader._setReferrerPolicy(this.settings.referrer_policy);
			}
			AddOnManager$1.languageLoad = this.settings.language_load;
			AddOnManager$1.baseURL = editorManager.baseURL;
			this.id = id;
			this.setDirty(false);
			this.documentBaseURI = new URI(this.settings.document_base_url, { base_uri: this.baseUri });
			this.baseURI = this.baseUri;
			this.inline = !!this.settings.inline;
			this.shortcuts = new Shortcuts(this);
			this.editorCommands = new EditorCommands(this);
			if (this.settings.cache_suffix) {
				Env.cacheSuffix = this.settings.cache_suffix.replace(/^[\?\&]+/, '');
			}
			this.ui = {
				registry: registry(),
				styleSheetLoader: undefined,
				show: noop,
				hide: noop,
				enable: noop,
				disable: noop,
				isDisabled: never
			};
			var self = this;
			var modeInstance = create$5(self);
			this.mode = modeInstance;
			this.setMode = modeInstance.set;
			editorManager.fire('SetupEditor', { editor: this });
			this.execCallback('setup', this);
			this.$ = DomQuery.overrideDefaults(function () {
				return {
					context: _this.inline ? _this.getBody() : _this.getDoc(),
					element: _this.getBody()
				};
			});
		}
		Editor.prototype.render = function () {
			render(this);
		};
		Editor.prototype.focus = function (skipFocus) {
			focus$1(this, skipFocus);
		};
		Editor.prototype.hasFocus = function () {
			return hasFocus$1(this);
		};
		Editor.prototype.execCallback = function (name) {
			var x = [];
			for (var _i = 1; _i < arguments.length; _i++) {
				x[_i - 1] = arguments[_i];
			}
			var self = this;
			var callback = self.settings[name], scope;
			if (!callback) {
				return;
			}
			if (self.callbackLookup && (scope = self.callbackLookup[name])) {
				callback = scope.func;
				scope = scope.scope;
			}
			if (typeof callback === 'string') {
				scope = callback.replace(/\.\w+$/, '');
				scope = scope ? resolve$3(scope) : 0;
				callback = resolve$3(callback);
				self.callbackLookup = self.callbackLookup || {};
				self.callbackLookup[name] = {
					func: callback,
					scope: scope
				};
			}
			return callback.apply(scope || self, x);
		};
		Editor.prototype.translate = function (text) {
			return I18n.translate(text);
		};
		Editor.prototype.getParam = function (name, defaultVal, type) {
			return getParam(this, name, defaultVal, type);
		};
		Editor.prototype.hasPlugin = function (name, loaded) {
			var hasPlugin = contains(getPlugins(this).split(/[ ,]/), name);
			if (hasPlugin) {
				return loaded ? PluginManager.get(name) !== undefined : true;
			} else {
				return false;
			}
		};
		Editor.prototype.nodeChanged = function (args) {
			this._nodeChangeDispatcher.nodeChanged(args);
		};
		Editor.prototype.addCommand = function (name, callback, scope) {
			this.editorCommands.addCommand(name, callback, scope);
		};
		Editor.prototype.addQueryStateHandler = function (name, callback, scope) {
			this.editorCommands.addQueryStateHandler(name, callback, scope);
		};
		Editor.prototype.addQueryValueHandler = function (name, callback, scope) {
			this.editorCommands.addQueryValueHandler(name, callback, scope);
		};
		Editor.prototype.addShortcut = function (pattern, desc, cmdFunc, scope) {
			this.shortcuts.add(pattern, desc, cmdFunc, scope);
		};
		Editor.prototype.execCommand = function (cmd, ui, value, args) {
			return this.editorCommands.execCommand(cmd, ui, value, args);
		};
		Editor.prototype.queryCommandState = function (cmd) {
			return this.editorCommands.queryCommandState(cmd);
		};
		Editor.prototype.queryCommandValue = function (cmd) {
			return this.editorCommands.queryCommandValue(cmd);
		};
		Editor.prototype.queryCommandSupported = function (cmd) {
			return this.editorCommands.queryCommandSupported(cmd);
		};
		Editor.prototype.show = function () {
			var self = this;
			if (self.hidden) {
				self.hidden = false;
				if (self.inline) {
					self.getBody().contentEditable = 'true';
				} else {
					DOM$9.show(self.getContainer());
					DOM$9.hide(self.id);
				}
				self.load();
				self.fire('show');
			}
		};
		Editor.prototype.hide = function () {
			var self = this, doc = self.getDoc();
			if (!self.hidden) {
				if (ie$1 && doc && !self.inline) {
					doc.execCommand('SelectAll');
				}
				self.save();
				if (self.inline) {
					self.getBody().contentEditable = 'false';
					if (self === self.editorManager.focusedEditor) {
						self.editorManager.focusedEditor = null;
					}
				} else {
					DOM$9.hide(self.getContainer());
					DOM$9.setStyle(self.id, 'display', self.orgDisplay);
				}
				self.hidden = true;
				self.fire('hide');
			}
		};
		Editor.prototype.isHidden = function () {
			return !!this.hidden;
		};
		Editor.prototype.setProgressState = function (state, time) {
			this.fire('ProgressState', {
				state: state,
				time: time
			});
		};
		Editor.prototype.load = function (args) {
			var self = this;
			var elm = self.getElement(), html;
			if (self.removed) {
				return '';
			}
			if (elm) {
				args = args || {};
				args.load = true;
				var value = isTextareaOrInput(elm) ? elm.value : elm.innerHTML;
				html = self.setContent(value, args);
				args.element = elm;
				if (!args.no_events) {
					self.fire('LoadContent', args);
				}
				args.element = elm = null;
				return html;
			}
		};
		Editor.prototype.save = function (args) {
			var self = this;
			var elm = self.getElement(), html, form;
			if (!elm || !self.initialized || self.removed) {
				return;
			}
			args = args || {};
			args.save = true;
			args.element = elm;
			html = args.content = self.getContent(args);
			if (!args.no_events) {
				self.fire('SaveContent', args);
			}
			if (args.format === 'raw') {
				self.fire('RawSaveContent', args);
			}
			html = args.content;
			if (!isTextareaOrInput(elm)) {
				if (args.is_removing || !self.inline) {
					elm.innerHTML = html;
				}
				if (form = DOM$9.getParent(self.id, 'form')) {
					each$i(form.elements, function (elm) {
						if (elm.name === self.id) {
							elm.value = html;
							return false;
						}
					});
				}
			} else {
				elm.value = html;
			}
			args.element = elm = null;
			if (args.set_dirty !== false) {
				self.setDirty(false);
			}
			return html;
		};
		Editor.prototype.setContent = function (content, args) {
			return setContent$2(this, content, args);
		};
		Editor.prototype.getContent = function (args) {
			return getContent$2(this, args);
		};
		Editor.prototype.insertContent = function (content, args) {
			if (args) {
				content = extend$3({ content: content }, args);
			}
			this.execCommand('mceInsertContent', false, content);
		};
		Editor.prototype.resetContent = function (initialContent) {
			if (initialContent === undefined) {
				setContent$2(this, this.startContent, { format: 'raw' });
			} else {
				setContent$2(this, initialContent);
			}
			this.undoManager.reset();
			this.setDirty(false);
			this.nodeChanged();
		};
		Editor.prototype.isDirty = function () {
			return !this.isNotDirty;
		};
		Editor.prototype.setDirty = function (state) {
			var oldState = !this.isNotDirty;
			this.isNotDirty = !state;
			if (state && state !== oldState) {
				this.fire('dirty');
			}
		};
		Editor.prototype.getContainer = function () {
			var self = this;
			if (!self.container) {
				self.container = DOM$9.get(self.editorContainer || self.id + '_parent');
			}
			return self.container;
		};
		Editor.prototype.getContentAreaContainer = function () {
			return this.contentAreaContainer;
		};
		Editor.prototype.getElement = function () {
			if (!this.targetElm) {
				this.targetElm = DOM$9.get(this.id);
			}
			return this.targetElm;
		};
		Editor.prototype.getWin = function () {
			var self = this;
			var elm;
			if (!self.contentWindow) {
				elm = self.iframeElement;
				if (elm) {
					self.contentWindow = elm.contentWindow;
				}
			}
			return self.contentWindow;
		};
		Editor.prototype.getDoc = function () {
			var self = this;
			var win;
			if (!self.contentDocument) {
				win = self.getWin();
				if (win) {
					self.contentDocument = win.document;
				}
			}
			return self.contentDocument;
		};
		Editor.prototype.getBody = function () {
			var doc = this.getDoc();
			return this.bodyElement || (doc ? doc.body : null);
		};
		Editor.prototype.convertURL = function (url, name, elm) {
			var self = this, settings = self.settings;
			if (settings.urlconverter_callback) {
				return self.execCallback('urlconverter_callback', url, elm, true, name);
			}
			if (!settings.convert_urls || elm && elm.nodeName === 'LINK' || url.indexOf('file:') === 0 || url.length === 0) {
				return url;
			}
			if (settings.relative_urls) {
				return self.documentBaseURI.toRelative(url);
			}
			url = self.documentBaseURI.toAbsolute(url, settings.remove_script_host);
			return url;
		};
		Editor.prototype.addVisual = function (elm) {
			addVisual$1(this, elm);
		};
		Editor.prototype.remove = function () {
			remove$7(this);
		};
		Editor.prototype.destroy = function (automatic) {
			destroy(this, automatic);
		};
		Editor.prototype.uploadImages = function (callback) {
			return this.editorUpload.uploadImages(callback);
		};
		Editor.prototype._scanForImages = function () {
			return this.editorUpload.scanForImages();
		};
		Editor.prototype.addButton = function () {
			throw new Error('editor.addButton has been removed in tinymce 5x, use editor.ui.registry.addButton or editor.ui.registry.addToggleButton or editor.ui.registry.addSplitButton instead');
		};
		Editor.prototype.addSidebar = function () {
			throw new Error('editor.addSidebar has been removed in tinymce 5x, use editor.ui.registry.addSidebar instead');
		};
		Editor.prototype.addMenuItem = function () {
			throw new Error('editor.addMenuItem has been removed in tinymce 5x, use editor.ui.registry.addMenuItem instead');
		};
		Editor.prototype.addContextToolbar = function () {
			throw new Error('editor.addContextToolbar has been removed in tinymce 5x, use editor.ui.registry.addContextToolbar instead');
		};
		return Editor;
	}();

	var DOM$a = DOMUtils$1.DOM;
	var explode$4 = Tools.explode, each$j = Tools.each, extend$4 = Tools.extend;
	var instanceCounter = 0, boundGlobalEvents = false;
	var beforeUnloadDelegate;
	var legacyEditors = [];
	var editors = [];
	var isValidLegacyKey = function (id) {
		return id !== 'length';
	};
	var globalEventDelegate = function (e) {
		var type = e.type;
		each$j(EditorManager.get(), function (editor) {
			switch (type) {
				case 'scroll':
					editor.fire('ScrollWindow', e);
					break;
				case 'resize':
					editor.fire('ResizeWindow', e);
					break;
			}
		});
	};
	var toggleGlobalEvents = function (state) {
		if (state !== boundGlobalEvents) {
			if (state) {
				DomQuery(window).on('resize scroll', globalEventDelegate);
			} else {
				DomQuery(window).off('resize scroll', globalEventDelegate);
			}
			boundGlobalEvents = state;
		}
	};
	var removeEditorFromList = function (targetEditor) {
		var oldEditors = editors;
		delete legacyEditors[targetEditor.id];
		for (var i = 0; i < legacyEditors.length; i++) {
			if (legacyEditors[i] === targetEditor) {
				legacyEditors.splice(i, 1);
				break;
			}
		}
		editors = filter(editors, function (editor) {
			return targetEditor !== editor;
		});
		if (EditorManager.activeEditor === targetEditor) {
			EditorManager.activeEditor = editors.length > 0 ? editors[0] : null;
		}
		if (EditorManager.focusedEditor === targetEditor) {
			EditorManager.focusedEditor = null;
		}
		return oldEditors.length !== editors.length;
	};
	var purgeDestroyedEditor = function (editor) {
		if (editor && editor.initialized && !(editor.getContainer() || editor.getBody()).parentNode) {
			removeEditorFromList(editor);
			editor.unbindAllNativeEvents();
			editor.destroy(true);
			editor.removed = true;
			editor = null;
		}
		return editor;
	};
	var isQuirksMode = document.compatMode !== 'CSS1Compat';
	var EditorManager = __assign(__assign({}, Observable), {
		baseURI: null,
		baseURL: null,
		defaultSettings: {},
		documentBaseURL: null,
		suffix: null,
		$: DomQuery,
		majorVersion: '5',
		minorVersion: '6.2',
		releaseDate: '2020-12-08',
		editors: legacyEditors,
		i18n: I18n,
		activeEditor: null,
		focusedEditor: null,
		settings: {},
		setup: function () {
			var self = this;
			var baseURL, documentBaseURL, suffix = '';
			documentBaseURL = URI.getDocumentBaseUrl(document.location);
			if (/^[^:]+:\/\/\/?[^\/]+\//.test(documentBaseURL)) {
				documentBaseURL = documentBaseURL.replace(/[\?#].*$/, '').replace(/[\/\\][^\/]+$/, '');
				if (!/[\/\\]$/.test(documentBaseURL)) {
					documentBaseURL += '/';
				}
			}
			var preInit = window.tinymce || window.tinyMCEPreInit;
			if (preInit) {
				baseURL = preInit.base || preInit.baseURL;
				suffix = preInit.suffix;
			} else {
				var scripts = document.getElementsByTagName('script');
				for (var i = 0; i < scripts.length; i++) {
					var src = scripts[i].src || '';
					if (src === '') {
						continue;
					}
					var srcScript = src.substring(src.lastIndexOf('/'));
					if (/tinymce(\.full|\.jquery|)(\.min|\.dev|)\.js/.test(src)) {
						if (srcScript.indexOf('.min') !== -1) {
							suffix = '.min';
						}
						baseURL = src.substring(0, src.lastIndexOf('/'));
						break;
					}
				}
				if (!baseURL && document.currentScript) {
					var src = document.currentScript.src;
					if (src.indexOf('.min') !== -1) {
						suffix = '.min';
					}
					baseURL = src.substring(0, src.lastIndexOf('/'));
				}
			}
			self.baseURL = new URI(documentBaseURL).toAbsolute(baseURL);
			self.documentBaseURL = documentBaseURL;
			self.baseURI = new URI(self.baseURL);
			self.suffix = suffix;
			setup$2(self);
		},
		overrideDefaults: function (defaultSettings) {
			var baseUrl = defaultSettings.base_url;
			if (baseUrl) {
				this._setBaseUrl(baseUrl);
			}
			var suffix = defaultSettings.suffix;
			if (defaultSettings.suffix) {
				this.suffix = suffix;
			}
			this.defaultSettings = defaultSettings;
			var pluginBaseUrls = defaultSettings.plugin_base_urls;
			if (pluginBaseUrls !== undefined) {
				each$1(pluginBaseUrls, function (pluginBaseUrl, pluginName) {
					AddOnManager$1.PluginManager.urls[pluginName] = pluginBaseUrl;
				});
			}
		},
		init: function (settings) {
			var self = this;
			var result;
			var invalidInlineTargets = Tools.makeMap('area base basefont br col frame hr img input isindex link meta param embed source wbr track ' + 'colgroup option table tbody tfoot thead tr th td script noscript style textarea video audio iframe object menu', ' ');
			var isInvalidInlineTarget = function (settings, elm) {
				return settings.inline && elm.tagName.toLowerCase() in invalidInlineTargets;
			};
			var createId = function (elm) {
				var id = elm.id;
				if (!id) {
					id = get$1(elm, 'name').filter(function (name) {
						return !DOM$a.get(name);
					}).getOrThunk(DOM$a.uniqueId);
					elm.setAttribute('id', id);
				}
				return id;
			};
			var execCallback = function (name) {
				var callback = settings[name];
				if (!callback) {
					return;
				}
				return callback.apply(self, Array.prototype.slice.call(arguments, 2));
			};
			var hasClass = function (elm, className) {
				return className.constructor === RegExp ? className.test(elm.className) : DOM$a.hasClass(elm, className);
			};
			var findTargets = function (settings) {
				var targets = [];
				if (Env.browser.isIE() && Env.browser.version.major < 11) {
					initError('TinyMCE does not support the browser you are using. For a list of supported' + ' browsers please see: https://www.tinymce.com/docs/get-started/system-requirements/');
					return [];
				} else if (isQuirksMode) {
					initError('Failed to initialize the editor as the document is not in standards mode. ' + 'TinyMCE requires standards mode.');
					return [];
				}
				if (settings.types) {
					each$j(settings.types, function (type) {
						targets = targets.concat(DOM$a.select(type.selector));
					});
					return targets;
				} else if (settings.selector) {
					return DOM$a.select(settings.selector);
				} else if (settings.target) {
					return [settings.target];
				}
				switch (settings.mode) {
					case 'exact':
						var l = settings.elements || '';
						if (l.length > 0) {
							each$j(explode$4(l), function (id) {
								var elm = DOM$a.get(id);
								if (elm) {
									targets.push(elm);
								} else {
									each$j(document.forms, function (f) {
										each$j(f.elements, function (e) {
											if (e.name === id) {
												id = 'mce_editor_' + instanceCounter++;
												DOM$a.setAttrib(e, 'id', id);
												targets.push(e);
											}
										});
									});
								}
							});
						}
						break;
					case 'textareas':
					case 'specific_textareas':
						each$j(DOM$a.select('textarea'), function (elm) {
							if (settings.editor_deselector && hasClass(elm, settings.editor_deselector)) {
								return;
							}
							if (!settings.editor_selector || hasClass(elm, settings.editor_selector)) {
								targets.push(elm);
							}
						});
						break;
				}
				return targets;
			};
			var provideResults = function (editors) {
				result = editors;
			};
			var initEditors = function () {
				var initCount = 0;
				var editors = [];
				var targets;
				var createEditor = function (id, settings, targetElm) {
					var editor = new Editor(id, settings, self);
					editors.push(editor);
					editor.on('init', function () {
						if (++initCount === targets.length) {
							provideResults(editors);
						}
					});
					editor.targetElm = editor.targetElm || targetElm;
					editor.render();
				};
				DOM$a.unbind(window, 'ready', initEditors);
				execCallback('onpageload');
				targets = DomQuery.unique(findTargets(settings));
				if (settings.types) {
					each$j(settings.types, function (type) {
						Tools.each(targets, function (elm) {
							if (DOM$a.is(elm, type.selector)) {
								createEditor(createId(elm), extend$4({}, settings, type), elm);
								return false;
							}
							return true;
						});
					});
					return;
				}
				Tools.each(targets, function (elm) {
					purgeDestroyedEditor(self.get(elm.id));
				});
				targets = Tools.grep(targets, function (elm) {
					return !self.get(elm.id);
				});
				if (targets.length === 0) {
					provideResults([]);
				} else {
					each$j(targets, function (elm) {
						if (isInvalidInlineTarget(settings, elm)) {
							initError('Could not initialize inline editor on invalid inline target element', elm);
						} else {
							createEditor(createId(elm), settings, elm);
						}
					});
				}
			};
			self.settings = settings;
			DOM$a.bind(window, 'ready', initEditors);
			return new promiseObj(function (resolve) {
				if (result) {
					resolve(result);
				} else {
					provideResults = function (editors) {
						resolve(editors);
					};
				}
			});
		},
		get: function (id) {
			if (arguments.length === 0) {
				return editors.slice(0);
			} else if (isString(id)) {
				return find(editors, function (editor) {
					return editor.id === id;
				}).getOr(null);
			} else if (isNumber(id)) {
				return editors[id] ? editors[id] : null;
			} else {
				return null;
			}
		},
		add: function (editor) {
			var self = this;
			var existingEditor = legacyEditors[editor.id];
			if (existingEditor === editor) {
				return editor;
			}
			if (self.get(editor.id) === null) {
				if (isValidLegacyKey(editor.id)) {
					legacyEditors[editor.id] = editor;
				}
				legacyEditors.push(editor);
				editors.push(editor);
			}
			toggleGlobalEvents(true);
			self.activeEditor = editor;
			self.fire('AddEditor', { editor: editor });
			if (!beforeUnloadDelegate) {
				beforeUnloadDelegate = function (e) {
					var event = self.fire('BeforeUnload');
					if (event.returnValue) {
						e.preventDefault();
						e.returnValue = event.returnValue;
						return event.returnValue;
					}
				};
				window.addEventListener('beforeunload', beforeUnloadDelegate);
			}
			return editor;
		},
		createEditor: function (id, settings) {
			return this.add(new Editor(id, settings, this));
		},
		remove: function (selector) {
			var self = this;
			var i, editor;
			if (!selector) {
				for (i = editors.length - 1; i >= 0; i--) {
					self.remove(editors[i]);
				}
				return;
			}
			if (isString(selector)) {
				each$j(DOM$a.select(selector), function (elm) {
					editor = self.get(elm.id);
					if (editor) {
						self.remove(editor);
					}
				});
				return;
			}
			editor = selector;
			if (isNull(self.get(editor.id))) {
				return null;
			}
			if (removeEditorFromList(editor)) {
				self.fire('RemoveEditor', { editor: editor });
			}
			if (editors.length === 0) {
				window.removeEventListener('beforeunload', beforeUnloadDelegate);
			}
			editor.remove();
			toggleGlobalEvents(editors.length > 0);
			return editor;
		},
		execCommand: function (cmd, ui, value) {
			var self = this, editor = self.get(value);
			switch (cmd) {
				case 'mceAddEditor':
					if (!self.get(value)) {
						new Editor(value, self.settings, self).render();
					}
					return true;
				case 'mceRemoveEditor':
					if (editor) {
						editor.remove();
					}
					return true;
				case 'mceToggleEditor':
					if (!editor) {
						self.execCommand('mceAddEditor', 0, value);
						return true;
					}
					if (editor.isHidden()) {
						editor.show();
					} else {
						editor.hide();
					}
					return true;
			}
			if (self.activeEditor) {
				return self.activeEditor.execCommand(cmd, ui, value);
			}
			return false;
		},
		triggerSave: function () {
			each$j(editors, function (editor) {
				editor.save();
			});
		},
		addI18n: function (code, items) {
			I18n.add(code, items);
		},
		translate: function (text) {
			return I18n.translate(text);
		},
		setActive: function (editor) {
			var activeEditor = this.activeEditor;
			if (this.activeEditor !== editor) {
				if (activeEditor) {
					activeEditor.fire('deactivate', { relatedTarget: editor });
				}
				editor.fire('activate', { relatedTarget: activeEditor });
			}
			this.activeEditor = editor;
		},
		_setBaseUrl: function (baseUrl) {
			this.baseURL = new URI(this.documentBaseURL).toAbsolute(baseUrl.replace(/\/+$/, ''));
			this.baseURI = new URI(this.baseURL);
		}
	});
	EditorManager.setup();

	var min = Math.min, max = Math.max, round$1 = Math.round;
	var relativePosition = function (rect, targetRect, rel) {
		var x = targetRect.x;
		var y = targetRect.y;
		var w = rect.w;
		var h = rect.h;
		var targetW = targetRect.w;
		var targetH = targetRect.h;
		var relChars = (rel || '').split('');
		if (relChars[0] === 'b') {
			y += targetH;
		}
		if (relChars[1] === 'r') {
			x += targetW;
		}
		if (relChars[0] === 'c') {
			y += round$1(targetH / 2);
		}
		if (relChars[1] === 'c') {
			x += round$1(targetW / 2);
		}
		if (relChars[3] === 'b') {
			y -= h;
		}
		if (relChars[4] === 'r') {
			x -= w;
		}
		if (relChars[3] === 'c') {
			y -= round$1(h / 2);
		}
		if (relChars[4] === 'c') {
			x -= round$1(w / 2);
		}
		return create$7(x, y, w, h);
	};
	var findBestRelativePosition = function (rect, targetRect, constrainRect, rels) {
		var pos, i;
		for (i = 0; i < rels.length; i++) {
			pos = relativePosition(rect, targetRect, rels[i]);
			if (pos.x >= constrainRect.x && pos.x + pos.w <= constrainRect.w + constrainRect.x && pos.y >= constrainRect.y && pos.y + pos.h <= constrainRect.h + constrainRect.y) {
				return rels[i];
			}
		}
		return null;
	};
	var inflate = function (rect, w, h) {
		return create$7(rect.x - w, rect.y - h, rect.w + w * 2, rect.h + h * 2);
	};
	var intersect = function (rect, cropRect) {
		var x1 = max(rect.x, cropRect.x);
		var y1 = max(rect.y, cropRect.y);
		var x2 = min(rect.x + rect.w, cropRect.x + cropRect.w);
		var y2 = min(rect.y + rect.h, cropRect.y + cropRect.h);
		if (x2 - x1 < 0 || y2 - y1 < 0) {
			return null;
		}
		return create$7(x1, y1, x2 - x1, y2 - y1);
	};
	var clamp$1 = function (rect, clampRect, fixedSize) {
		var x1 = rect.x;
		var y1 = rect.y;
		var x2 = rect.x + rect.w;
		var y2 = rect.y + rect.h;
		var cx2 = clampRect.x + clampRect.w;
		var cy2 = clampRect.y + clampRect.h;
		var underflowX1 = max(0, clampRect.x - x1);
		var underflowY1 = max(0, clampRect.y - y1);
		var overflowX2 = max(0, x2 - cx2);
		var overflowY2 = max(0, y2 - cy2);
		x1 += underflowX1;
		y1 += underflowY1;
		if (fixedSize) {
			x2 += underflowX1;
			y2 += underflowY1;
			x1 -= overflowX2;
			y1 -= overflowY2;
		}
		x2 -= overflowX2;
		y2 -= overflowY2;
		return create$7(x1, y1, x2 - x1, y2 - y1);
	};
	var create$7 = function (x, y, w, h) {
		return {
			x: x,
			y: y,
			w: w,
			h: h
		};
	};
	var fromClientRect = function (clientRect) {
		return create$7(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
	};
	var Rect = {
		inflate: inflate,
		relativePosition: relativePosition,
		findBestRelativePosition: findBestRelativePosition,
		intersect: intersect,
		clamp: clamp$1,
		create: create$7,
		fromClientRect: fromClientRect
	};

	var awaiter = function (resolveCb, rejectCb, timeout) {
		if (timeout === void 0) {
			timeout = 1000;
		}
		var done = false;
		var timer = null;
		var complete = function (completer) {
			return function () {
				var args = [];
				for (var _i = 0; _i < arguments.length; _i++) {
					args[_i] = arguments[_i];
				}
				if (!done) {
					done = true;
					if (timer !== null) {
						clearTimeout(timer);
						timer = null;
					}
					completer.apply(null, args);
				}
			};
		};
		var resolve = complete(resolveCb);
		var reject = complete(rejectCb);
		var start = function () {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) {
				args[_i] = arguments[_i];
			}
			if (!done && timer === null) {
				timer = setTimeout(function () {
					return reject.apply(null, args);
				}, timeout);
			}
		};
		return {
			start: start,
			resolve: resolve,
			reject: reject
		};
	};
	var create$8 = function () {
		var tasks = {};
		var resultFns = {};
		var load = function (id, url) {
			var loadErrMsg = 'Script at URL "' + url + '" failed to load';
			var runErrMsg = 'Script at URL "' + url + '" did not call `tinymce.Resource.add(\'' + id + '\', data)` within 1 second';
			if (tasks[id] !== undefined) {
				return tasks[id];
			} else {
				var task = new promiseObj(function (resolve, reject) {
					var waiter = awaiter(resolve, reject);
					resultFns[id] = waiter.resolve;
					ScriptLoader.ScriptLoader.loadScript(url, function () {
						return waiter.start(runErrMsg);
					}, function () {
						return waiter.reject(loadErrMsg);
					});
				});
				tasks[id] = task;
				return task;
			}
		};
		var add = function (id, data) {
			if (resultFns[id] !== undefined) {
				resultFns[id](data);
				delete resultFns[id];
			}
			tasks[id] = promiseObj.resolve(data);
		};
		return {
			load: load,
			add: add
		};
	};
	var Resource = create$8();

	var each$k = Tools.each, extend$5 = Tools.extend;
	var extendClass, initializing;
	var Class = function () {
	};
	Class.extend = extendClass = function (props) {
		var self = this;
		var _super = self.prototype;
		var Class = function () {
			var i, mixins, mixin;
			var self = this;
			if (!initializing) {
				if (self.init) {
					self.init.apply(self, arguments);
				}
				mixins = self.Mixins;
				if (mixins) {
					i = mixins.length;
					while (i--) {
						mixin = mixins[i];
						if (mixin.init) {
							mixin.init.apply(self, arguments);
						}
					}
				}
			}
		};
		var dummy = function () {
			return this;
		};
		var createMethod = function (name, fn) {
			return function () {
				var self = this;
				var tmp = self._super;
				self._super = _super[name];
				var ret = fn.apply(self, arguments);
				self._super = tmp;
				return ret;
			};
		};
		initializing = true;
		var prototype = new self();
		initializing = false;
		if (props.Mixins) {
			each$k(props.Mixins, function (mixin) {
				for (var name_1 in mixin) {
					if (name_1 !== 'init') {
						props[name_1] = mixin[name_1];
					}
				}
			});
			if (_super.Mixins) {
				props.Mixins = _super.Mixins.concat(props.Mixins);
			}
		}
		if (props.Methods) {
			each$k(props.Methods.split(','), function (name) {
				props[name] = dummy;
			});
		}
		if (props.Properties) {
			each$k(props.Properties.split(','), function (name) {
				var fieldName = '_' + name;
				props[name] = function (value) {
					var self = this;
					if (value !== undefined) {
						self[fieldName] = value;
						return self;
					}
					return self[fieldName];
				};
			});
		}
		if (props.Statics) {
			each$k(props.Statics, function (func, name) {
				Class[name] = func;
			});
		}
		if (props.Defaults && _super.Defaults) {
			props.Defaults = extend$5({}, _super.Defaults, props.Defaults);
		}
		each$1(props, function (member, name) {
			if (typeof member === 'function' && _super[name]) {
				prototype[name] = createMethod(name, member);
			} else {
				prototype[name] = member;
			}
		});
		Class.prototype = prototype;
		Class.constructor = Class;
		Class.extend = extendClass;
		return Class;
	};

	var min$1 = Math.min, max$1 = Math.max, round$2 = Math.round;
	var Color = function (value) {
		var self = {};
		var r = 0, g = 0, b = 0;
		var rgb2hsv = function (r, g, b) {
			var h, s, v;
			h = 0;
			s = 0;
			v = 0;
			r = r / 255;
			g = g / 255;
			b = b / 255;
			var minRGB = min$1(r, min$1(g, b));
			var maxRGB = max$1(r, max$1(g, b));
			if (minRGB === maxRGB) {
				v = minRGB;
				return {
					h: 0,
					s: 0,
					v: v * 100
				};
			}
			var d = r === minRGB ? g - b : b === minRGB ? r - g : b - r;
			h = r === minRGB ? 3 : b === minRGB ? 1 : 5;
			h = 60 * (h - d / (maxRGB - minRGB));
			s = (maxRGB - minRGB) / maxRGB;
			v = maxRGB;
			return {
				h: round$2(h),
				s: round$2(s * 100),
				v: round$2(v * 100)
			};
		};
		var hsvToRgb = function (hue, saturation, brightness) {
			hue = (parseInt(hue, 10) || 0) % 360;
			saturation = parseInt(saturation, 10) / 100;
			brightness = parseInt(brightness, 10) / 100;
			saturation = max$1(0, min$1(saturation, 1));
			brightness = max$1(0, min$1(brightness, 1));
			if (saturation === 0) {
				r = g = b = round$2(255 * brightness);
				return;
			}
			var side = hue / 60;
			var chroma = brightness * saturation;
			var x = chroma * (1 - Math.abs(side % 2 - 1));
			var match = brightness - chroma;
			switch (Math.floor(side)) {
				case 0:
					r = chroma;
					g = x;
					b = 0;
					break;
				case 1:
					r = x;
					g = chroma;
					b = 0;
					break;
				case 2:
					r = 0;
					g = chroma;
					b = x;
					break;
				case 3:
					r = 0;
					g = x;
					b = chroma;
					break;
				case 4:
					r = x;
					g = 0;
					b = chroma;
					break;
				case 5:
					r = chroma;
					g = 0;
					b = x;
					break;
				default:
					r = g = b = 0;
			}
			r = round$2(255 * (r + match));
			g = round$2(255 * (g + match));
			b = round$2(255 * (b + match));
		};
		var toHex = function () {
			var hex = function (val) {
				val = parseInt(val, 10).toString(16);
				return val.length > 1 ? val : '0' + val;
			};
			return '#' + hex(r) + hex(g) + hex(b);
		};
		var toRgb = function () {
			return {
				r: r,
				g: g,
				b: b
			};
		};
		var toHsv = function () {
			return rgb2hsv(r, g, b);
		};
		var parse = function (value) {
			var matches;
			if (typeof value === 'object') {
				if ('r' in value) {
					r = value.r;
					g = value.g;
					b = value.b;
				} else if ('v' in value) {
					hsvToRgb(value.h, value.s, value.v);
				}
			} else {
				if (matches = /rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)[^\)]*\)/gi.exec(value)) {
					r = parseInt(matches[1], 10);
					g = parseInt(matches[2], 10);
					b = parseInt(matches[3], 10);
				} else if (matches = /#([0-F]{2})([0-F]{2})([0-F]{2})/gi.exec(value)) {
					r = parseInt(matches[1], 16);
					g = parseInt(matches[2], 16);
					b = parseInt(matches[3], 16);
				} else if (matches = /#([0-F])([0-F])([0-F])/gi.exec(value)) {
					r = parseInt(matches[1] + matches[1], 16);
					g = parseInt(matches[2] + matches[2], 16);
					b = parseInt(matches[3] + matches[3], 16);
				}
			}
			r = r < 0 ? 0 : r > 255 ? 255 : r;
			g = g < 0 ? 0 : g > 255 ? 255 : g;
			b = b < 0 ? 0 : b > 255 ? 255 : b;
			return self;
		};
		if (value) {
			parse(value);
		}
		self.toRgb = toRgb;
		self.toHsv = toHsv;
		self.toHex = toHex;
		self.parse = parse;
		return self;
	};

	var serialize = function (obj) {
		var data = JSON.stringify(obj);
		if (!isString(data)) {
			return data;
		}
		return data.replace(/[\u0080-\uFFFF]/g, function (match) {
			var hexCode = match.charCodeAt(0).toString(16);
			return '\\u' + '0000'.substring(hexCode.length) + hexCode;
		});
	};
	var JSONUtils = {
		serialize: serialize,
		parse: function (text) {
			try {
				return JSON.parse(text);
			} catch (ex) {
			}
		}
	};

	var JSONP = {
		callbacks: {},
		count: 0,
		send: function (settings) {
			var self = this, dom = DOMUtils$1.DOM, count = settings.count !== undefined ? settings.count : self.count;
			var id = 'tinymce_jsonp_' + count;
			self.callbacks[count] = function (json) {
				dom.remove(id);
				delete self.callbacks[count];
				settings.callback(json);
			};
			dom.add(dom.doc.body, 'script', {
				id: id,
				src: settings.url,
				type: 'text/javascript'
			});
			self.count++;
		}
	};

	var XHR = __assign(__assign({}, Observable), {
		send: function (settings) {
			var xhr, count = 0;
			var ready = function () {
				if (!settings.async || xhr.readyState === 4 || count++ > 10000) {
					if (settings.success && count < 10000 && xhr.status === 200) {
						settings.success.call(settings.success_scope, '' + xhr.responseText, xhr, settings);
					} else if (settings.error) {
						settings.error.call(settings.error_scope, count > 10000 ? 'TIMED_OUT' : 'GENERAL', xhr, settings);
					}
					xhr = null;
				} else {
					Delay.setTimeout(ready, 10);
				}
			};
			settings.scope = settings.scope || this;
			settings.success_scope = settings.success_scope || settings.scope;
			settings.error_scope = settings.error_scope || settings.scope;
			settings.async = settings.async !== false;
			settings.data = settings.data || '';
			XHR.fire('beforeInitialize', { settings: settings });
			xhr = new XMLHttpRequest();
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType(settings.content_type);
			}
			xhr.open(settings.type || (settings.data ? 'POST' : 'GET'), settings.url, settings.async);
			if (settings.crossDomain) {
				xhr.withCredentials = true;
			}
			if (settings.content_type) {
				xhr.setRequestHeader('Content-Type', settings.content_type);
			}
			if (settings.requestheaders) {
				Tools.each(settings.requestheaders, function (header) {
					xhr.setRequestHeader(header.key, header.value);
				});
			}
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr = XHR.fire('beforeSend', {
				xhr: xhr,
				settings: settings
			}).xhr;
			xhr.send(settings.data);
			if (!settings.async) {
				return ready();
			}
			Delay.setTimeout(ready, 10);
		}
	});

	var extend$6 = Tools.extend;
	var JSONRequest = function () {
		function JSONRequest(settings) {
			this.settings = extend$6({}, settings);
			this.count = 0;
		}
		JSONRequest.sendRPC = function (o) {
			return new JSONRequest().send(o);
		};
		JSONRequest.prototype.send = function (args) {
			var ecb = args.error, scb = args.success;
			var xhrArgs = extend$6(this.settings, args);
			xhrArgs.success = function (c, x) {
				c = JSONUtils.parse(c);
				if (typeof c === 'undefined') {
					c = { error: 'JSON Parse error.' };
				}
				if (c.error) {
					ecb.call(xhrArgs.error_scope || xhrArgs.scope, c.error, x);
				} else {
					scb.call(xhrArgs.success_scope || xhrArgs.scope, c.result);
				}
			};
			xhrArgs.error = function (ty, x) {
				if (ecb) {
					ecb.call(xhrArgs.error_scope || xhrArgs.scope, ty, x);
				}
			};
			xhrArgs.data = JSONUtils.serialize({
				id: args.id || 'c' + this.count++,
				method: args.method,
				params: args.params
			});
			xhrArgs.content_type = 'application/json';
			XHR.send(xhrArgs);
		};
		return JSONRequest;
	}();

	var create$9 = function () {
		return function () {
			var data = {};
			var keys = [];
			var storage = {
				getItem: function (key) {
					var item = data[key];
					return item ? item : null;
				},
				setItem: function (key, value) {
					keys.push(key);
					data[key] = String(value);
				},
				key: function (index) {
					return keys[index];
				},
				removeItem: function (key) {
					keys = keys.filter(function (k) {
						return k === key;
					});
					delete data[key];
				},
				clear: function () {
					keys = [];
					data = {};
				},
				length: 0
			};
			Object.defineProperty(storage, 'length', {
				get: function () {
					return keys.length;
				},
				configurable: false,
				enumerable: false
			});
			return storage;
		}();
	};

	var localStorage;
	try {
		var test = '__storage_test__';
		localStorage = window.localStorage;
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
	} catch (e) {
		localStorage = create$9();
	}
	var LocalStorage = localStorage;

	var publicApi = {
		geom: { Rect: Rect },
		util: {
			Promise: promiseObj,
			Delay: Delay,
			Tools: Tools,
			VK: VK,
			URI: URI,
			Class: Class,
			EventDispatcher: EventDispatcher,
			Observable: Observable,
			I18n: I18n,
			XHR: XHR,
			JSON: JSONUtils,
			JSONRequest: JSONRequest,
			JSONP: JSONP,
			LocalStorage: LocalStorage,
			Color: Color
		},
		dom: {
			EventUtils: EventUtils,
			Sizzle: Sizzle,
			DomQuery: DomQuery,
			TreeWalker: DomTreeWalker,
			TextSeeker: TextSeeker,
			DOMUtils: DOMUtils$1,
			ScriptLoader: ScriptLoader,
			RangeUtils: RangeUtils$1,
			Serializer: DomSerializer,
			StyleSheetLoader: StyleSheetLoader,
			ControlSelection: ControlSelection,
			BookmarkManager: BookmarkManager$1,
			Selection: EditorSelection,
			Event: EventUtils.Event
		},
		html: {
			Styles: Styles,
			Entities: Entities,
			Node: AstNode,
			Schema: Schema,
			SaxParser: SaxParser$1,
			DomParser: DomParser,
			Writer: Writer,
			Serializer: HtmlSerializer
		},
		Env: Env,
		AddOnManager: AddOnManager$1,
		Annotator: Annotator,
		Formatter: Formatter,
		UndoManager: UndoManager,
		EditorCommands: EditorCommands,
		WindowManager: WindowManager,
		NotificationManager: NotificationManager,
		EditorObservable: EditorObservable,
		Shortcuts: Shortcuts,
		Editor: Editor,
		FocusManager: FocusManager,
		EditorManager: EditorManager,
		DOM: DOMUtils$1.DOM,
		ScriptLoader: ScriptLoader.ScriptLoader,
		PluginManager: PluginManager,
		ThemeManager: ThemeManager,
		IconManager: IconManager,
		Resource: Resource,
		trim: Tools.trim,
		isArray: Tools.isArray,
		is: Tools.is,
		toArray: Tools.toArray,
		makeMap: Tools.makeMap,
		each: Tools.each,
		map: Tools.map,
		grep: Tools.grep,
		inArray: Tools.inArray,
		extend: Tools.extend,
		create: Tools.create,
		walk: Tools.walk,
		createNS: Tools.createNS,
		resolve: Tools.resolve,
		explode: Tools.explode,
		_addCacheSuffix: Tools._addCacheSuffix,
		isOpera: Env.opera,
		isWebKit: Env.webkit,
		isIE: Env.ie,
		isGecko: Env.gecko,
		isMac: Env.mac
	};
	var tinymce = Tools.extend(EditorManager, publicApi);

	var exportToModuleLoaders = function (tinymce) {
		if (typeof module === 'object') {
			try {
				module.exports = tinymce;
			} catch (_) {
			}
		}
	};
	var exportToWindowGlobal = function (tinymce) {
		window.tinymce = tinymce;
		window.tinyMCE = tinymce;
	};
	exportToWindowGlobal(tinymce);
	exportToModuleLoaders(tinymce);

}());
