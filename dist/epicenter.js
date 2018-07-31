/*!
 * 
 *         Epicenter Javascript libraries
 *         v2.7.0
 *         https://github.com/forio/epicenter-js-libs
 *     
 */
var F =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 42);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ajax_http_transport__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ajax_http_transport___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__ajax_http_transport__);
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');

/* harmony default export */ __webpack_exports__["default"] = (__WEBPACK_IMPORTED_MODULE_0__ajax_http_transport___default.a);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var keyNames = __webpack_require__(14);
var StorageFactory = __webpack_require__(25);
var optionUtils = __webpack_require__(44);

var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var EPI_MANAGER_KEY = 'epicenter.token'; //can't be under key-names, or logout will clear this too

var defaults = {
    /**
     * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
     * @type {string}
     */
    store: { synchronous: true }
};

var SessionManager = function (managerOptions) {
    managerOptions = managerOptions || {};
    function getBaseOptions(overrides) {
        overrides = overrides || {};
        var libOptions = optionUtils.getOptions();
        var finalOptions = $.extend(true, {}, defaults, libOptions, managerOptions, overrides);
        return finalOptions;
    }

    function getStore(overrides) {
        var baseOptions = getBaseOptions(overrides);
        var storeOpts = baseOptions.store || {};
        var isEpicenterDomain = !baseOptions.isLocal && !baseOptions.isCustomDomain;
        if (storeOpts.root === undefined && baseOptions.account && baseOptions.project && isEpicenterDomain) {
            storeOpts.root = '/app/' + baseOptions.account + '/' + baseOptions.project;
        }
        return new StorageFactory(storeOpts);
    }

    var publicAPI = {
        saveSession: function (userInfo, options) {
            var serialized = JSON.stringify(userInfo);
            getStore(options).set(EPI_SESSION_KEY, serialized);
        },
        getSession: function (options) {
            var store = getStore(options);
            var finalOpts = store.serviceOptions;
            var serialized = store.get(EPI_SESSION_KEY) || '{}';
            var session = JSON.parse(serialized);
            // If the url contains the project and account
            // validate the account and project in the session
            // and override project, groupName, groupId and isFac
            // Otherwise (i.e. localhost) use the saved session values
            var account = finalOpts.account;
            var project = finalOpts.project;
            if (account && session.account !== account) {
                // This means that the token was not used to login to the same account
                return {};
            }
            if (session.groups && account && project) {
                var group = session.groups[project] || { groupId: '', groupName: '', isFac: false };
                $.extend(session, { project: project }, group);
            }
            return session;
        },
        removeSession: function (options) {
            var store = getStore(options);
            Object.keys(keyNames).forEach(function (cookieKey) {
                var cookieName = keyNames[cookieKey];
                store.remove(cookieName);
            });
            return true;
        },
        getStore: function (options) {
            return getStore(options);
        },

        getMergedOptions: function () {
            var args = Array.prototype.slice.call(arguments);
            var overrides = $.extend.apply($, [true, {}].concat(args));
            var baseOptions = getBaseOptions(overrides);
            var session = this.getSession(overrides);

            var token = session.auth_token;
            if (!token) {
                var factory = new StorageFactory();
                token = factory.get(EPI_MANAGER_KEY);
            }

            var sessionDefaults = {
                /**
                 * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
                 * @see [Authentication API Service](../auth-api-service/) for getting tokens.
                 * @type {String}
                 */
                token: token,

                /**
                 * The account. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                account: session.account,

                /**
                 * The project. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                project: session.project,

                /**
                 * The group name. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                group: session.groupName,
                /**
                 * Alias for group. 
                 * @type {String}
                 */
                groupName: session.groupName, //It's a little weird that it's called groupName in the cookie, but 'group' in all the service options, so normalize for both
                /**
                 * The group id. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                groupId: session.groupId,
                userId: session.userId,
                userName: session.userName
            };
            return $.extend(true, sessionDefaults, baseOptions);
        }
    };
    $.extend(this, publicAPI);
};

module.exports = SessionManager;

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_url_config_service__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_url_config_service___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_service_url_config_service__);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     const cs = require('configuration-service')({
 *          dev: { //environment
                port: 3000,
                host: 'localhost',
            },
            prod: {
                port: 8080,
                host: 'api.forio.com',
                logLevel: 'none'
            },
            logLevel: 'DEBUG' //global
 *     });
 *
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('dev');
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('prod');
 *      cs.get('logLevel'); //returns 'none'
 *
 */



var ConfigService = function () {
    function ConfigService(config) {
        _classCallCheck(this, ConfigService);

        var defaults = {
            logLevel: 'NONE'
        };
        var serviceOptions = $.extend({}, defaults, config);
        serviceOptions.server = __WEBPACK_IMPORTED_MODULE_0_service_url_config_service___default()(serviceOptions.server);

        this.serviceOptions = this.data = serviceOptions;
    }

    /**
     * Set the environment key to get configuration options from
     * @param { string} env
     */


    _createClass(ConfigService, [{
        key: 'setEnv',
        value: function setEnv(env) {}
        /**
             * Get configuration.
             * @param  { string} property optional
             * @return {*}          Value of property if specified, the entire config object otherwise
             */

    }, {
        key: 'get',
        value: function get(property) {
            return this.serviceOptions[property];
        }
        /**
             * Set configuration.
             * @param  { string|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
             * @param  {*} value  value for provided key
             */

    }, {
        key: 'set',
        value: function set(key, value) {
            this.serviceOptions[key] = value;
        }
    }]);

    return ConfigService;
}();

/* harmony default export */ __webpack_exports__["default"] = (ConfigService);

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
/* Inherit from a class (using prototype borrowing)
*/


function inherit(C, P) {
    var F = function () {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.__super = P.prototype;
    C.prototype.constructor = C;
}

/**
* Shallow copy of an object
* @param {Object} dest object to extend
* @return {Object} extended object
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j < obj.length; j++) {
        if (!(current = obj[j])) {
            //eslint-disable-line
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        for (var key in current) {
            //eslint-disable-line
            dest[key] = current[key];
        }
    }

    return dest;
};

module.exports = function (base, props, staticProps) {
    var parent = base;
    var child;

    child = props && props.hasOwnProperty('constructor') ? props.constructor : function () {
        return parent.apply(this, arguments);
    };

    // add static properties to the child constructor function
    extend(child, parent, staticProps);

    // associate prototype chain
    inherit(child, parent);

    // add instance properties
    if (props) {
        extend(child.prototype, props);
    }

    // done
    return child;
};

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["pick"] = pick;
/* harmony export (immutable) */ __webpack_exports__["omit"] = omit;
/* harmony export (immutable) */ __webpack_exports__["isEmpty"] = isEmpty;
/* harmony export (immutable) */ __webpack_exports__["ensureKeysPresent"] = ensureKeysPresent;
/**
 * Return selected keys from obj
 * 
 * @param {object} obj
 * @param {string[]} keys
 * @return {object}
 */
function pick(obj, keys) {
    var res = {};
    for (var p in obj) {
        if (keys.indexOf(p) !== -1) {
            res[p] = obj[p];
        }
    }
    return res;
}

/**
 * Omits selected keys from obj
 * 
 * @param {object} obj
 * @param {string[]} keys
 * @return {object}
 */
function omit(obj, keys) {
    keys.forEach(function (key) {
        delete obj[key];
    });
    return obj;
}

function isEmpty(value) {
    return !value || $.isPlainObject(value) && Object.keys(value).length === 0;
}

/**
 * Confirms presence of keys or throws error
 * 
 * @param {Object} obj
 * @param {string[]} keysList
 * @param {string} [context] Prefix to add to error message
 * @throws {Error}
 * @return {boolean}
 */
function ensureKeysPresent(obj, keysList, context) {
    keysList.forEach(function (key) {
        if (obj[key] === null || obj[key] === undefined) {
            throw new Error((context || '') + ' Missing required parameter \'' + key + '\'\' in ' + JSON.stringify(obj) + ' ');
        }
    });
    return true;
}

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getApiUrl;
/* harmony export (immutable) */ __webpack_exports__["b"] = getDefaultOptions;
/* harmony export (immutable) */ __webpack_exports__["d"] = getURLConfig;
/* harmony export (immutable) */ __webpack_exports__["c"] = getHTTPTransport;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__configuration_service__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_session_manager__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_session_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__store_session_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_object_assign__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_object_assign___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_object_assign__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_transport_http_transport_factory__ = __webpack_require__(0);






function getApiUrl(apiEndpoint, serviceOptions) {
    var urlConfig = new __WEBPACK_IMPORTED_MODULE_0__configuration_service__["default"](serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
    return urlConfig.getAPIPath(apiEndpoint);
}

/*
* Gets the default options for a api service.
* It will merge:
* - The Session options (Using the Session Manager)
* - The Authorization Header from the token option
* - The full url from the endpoint option
* With the supplied overrides and defaults
*
*/
function getDefaultOptions(defaults) {
    var rest = Array.prototype.slice.call(arguments, 1);
    var sessionManager = new __WEBPACK_IMPORTED_MODULE_1__store_session_manager___default.a();
    var serviceOptions = sessionManager.getMergedOptions.apply(sessionManager, [defaults].concat(rest));

    serviceOptions.transport = __WEBPACK_IMPORTED_MODULE_2_object_assign___default()({}, serviceOptions.transport, {
        url: getApiUrl(serviceOptions.apiEndpoint, serviceOptions)
    });

    if (serviceOptions.token) {
        serviceOptions.transport.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    return serviceOptions;
}

function getURLConfig(options) {
    var urlConfig = new __WEBPACK_IMPORTED_MODULE_0__configuration_service__["default"](options).get('server');
    if (options.account) {
        urlConfig.accountPath = options.account;
    }
    if (options.project) {
        urlConfig.projectPath = options.project;
    }
    return urlConfig;
}
function getHTTPTransport(transportOptions, overrides) {
    var mergedOptions = $.extend(true, {}, transportOptions, overrides);
    var http = new __WEBPACK_IMPORTED_MODULE_3_transport_http_transport_factory__["default"](mergedOptions);
    return http;
}

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["toMatrixFormat"] = toMatrixFormat;
/* harmony export (immutable) */ __webpack_exports__["toQueryFormat"] = toQueryFormat;
/* harmony export (immutable) */ __webpack_exports__["qsToObject"] = qsToObject;
/* harmony export (immutable) */ __webpack_exports__["mergeQS"] = mergeQS;
/* harmony export (immutable) */ __webpack_exports__["normalizeSlashes"] = normalizeSlashes;
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Utilities for working with query strings
*/

/**
 * Converts to matrix format
 * @param  {object} qs Object to convert to query string
 * @return {string}    Matrix-format query parameters
 */
function toMatrixFormat(qs) {
    if (qs === null || qs === undefined || qs === '') {
        return ';';
    }
    if (typeof qs === 'string') {
        return qs;
    }

    var returnArray = [];
    var OPERATORS = ['<', '>', '!'];
    $.each(qs, function (key, value) {
        if (typeof value !== 'string' || $.inArray($.trim(value).charAt(0), OPERATORS) === -1) {
            value = '=' + value;
        }
        returnArray.push(key + value);
    });

    var mtrx = ';' + returnArray.join(';');
    return mtrx;
}

/**
 * Converts strings/arrays/objects to type 'a=b&b=c'
 * @param  { string|Array|Object} qs
 * @return { string}
 */
function toQueryFormat(qs) {
    if (qs === null || qs === undefined) {
        return '';
    }
    if (typeof qs === 'string') {
        return qs;
    }

    var returnArray = [];
    $.each(qs, function (key, value) {
        if (Array.isArray(value)) {
            value = value.join(',');
        }
        if ($.isPlainObject(value)) {
            //Mostly for data api
            value = JSON.stringify(value);
        }
        returnArray.push(key + '=' + value);
    });

    var result = returnArray.join('&');
    return result;
}

/**
 * Converts strings of type 'a=b&b=c' to { a:b, b:c}
 * @param  { string} qs
 * @return {object}
 */
function qsToObject(qs) {
    if (qs === null || qs === undefined || qs === '') {
        return {};
    }

    var qsArray = qs.split('&');
    var returnObj = {};
    qsArray.forEach(function (value, index) {
        var qKey = value.split('=')[0];
        var qVal = value.split('=')[1];

        if (qVal.indexOf(',') !== -1) {
            qVal = qVal.split(',');
        }

        returnObj[qKey] = qVal;
    });

    return returnObj;
}

/**
 * Normalizes and merges strings of type 'a=b', { b:c} to { a:b, b:c}
 * @param  { string|Array|Object} qs1
 * @param  { string|Array|Object} qs2
 * @return {Object}
 */
function mergeQS(qs1, qs2) {
    var obj1 = qsToObject(toQueryFormat(qs1));
    var obj2 = qsToObject(toQueryFormat(qs2));
    return $.extend(true, {}, obj1, obj2);
}

/**
 * 
 * @param {string} url url to sanitize
 * @param {object} [options] determines if leading/trailing slashes are expected
 * @param {boolean} [options.leading]
 * @param {boolean} [options.trailing]
 * 
 * @returns {string}
 */
function normalizeSlashes(url, options) {
    if (!url) {
        if (url === '') return '';
        throw new Error('normalizeSlashes: Unknown url ' + url);
    }
    var opts = $.extend({}, {
        leading: false,
        trailing: false
    }, options);

    var protocolMatch = url.match(/^(https?:\/\/)(.*)/);

    var _ref = protocolMatch ? [protocolMatch[1], protocolMatch[2]] : ['', url],
        _ref2 = _slicedToArray(_ref, 2),
        protocol = _ref2[0],
        rest = _ref2[1];

    var cleaned = rest.replace(/\/{2,}/g, '/');
    if (opts.leading && cleaned.charAt(0) !== '/' && !protocol) {
        cleaned = '/' + cleaned;
    }
    if (opts.trailing && cleaned.charAt(cleaned.length - 1) !== '/') {
        cleaned = cleaned + '/';
    }
    return '' + protocol + cleaned;
}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var RunService = __webpack_require__(9);

module.exports = {
    mergeRunOptions: function (run, options) {
        if (run instanceof RunService) {
            run.updateConfig(options);
            return run;
        }
        return $.extend(true, {}, run, options);
    },

    injectFiltersFromSession: function (currentFilter, session, options) {
        var defaults = {
            scopeByGroup: true,
            scopeByUser: true
        };
        var opts = $.extend(true, {}, defaults, options);

        var filter = $.extend(true, {}, currentFilter);
        if (opts.scopeByGroup && session && session.groupName) {
            filter['scope.group'] = session.groupName;
        }
        if (opts.scopeByUser && session && session.userId) {
            filter['user.id'] = session.userId;
        }
        return filter;
    },

    injectScopeFromSession: function (currentParams, session) {
        var group = session && session.groupName;
        var params = $.extend(true, {}, currentParams);
        if (group) {
            $.extend(params, {
                scope: { group: group }
            });
        }
        return params;
    }
};

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["extractValidRunParams"] = extractValidRunParams;
/* harmony export (immutable) */ __webpack_exports__["normalizeOperations"] = normalizeOperations;
/* harmony export (immutable) */ __webpack_exports__["splitGetFactory"] = splitGetFactory;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__query_util__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_util_object_util__ = __webpack_require__(4);
/**
 * Utilities for working with the run service
 */




var MAX_URL_LENGTH = 2048;

function extractValidRunParams(params) {
    var validParams = ['model', 'scope', 'files', 'ephemeral', 'cinFiles'];
    return Object(__WEBPACK_IMPORTED_MODULE_1_util_object_util__["pick"])(params, validParams);
}

/**
 * normalizes different types of operation inputs
 * @param  {object|string[]|string} operations operations to perform
 * @param  {any[]} [args] arguments for operation
 * @return {{ops: string[], args: any[]}} operations of the form `{ ops: [], args: [] }`
 */
function normalizeOperations(operations, args) {
    if (!args) {
        args = [];
    }
    var returnList = {
        ops: [],
        args: []
    };

    var _concat = function (arr) {
        return arr !== null && arr !== undefined ? [].concat(arr) : [];
    };

    //{ add: [1,2], subtract: [2,4] }
    var _normalizePlainObjects = function (operations, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        $.each(operations, function (opn, arg) {
            returnList.ops.push(opn);
            returnList.args.push(_concat(arg));
        });
        return returnList;
    };
    //{ name: 'add', params: [1] }
    var _normalizeStructuredObjects = function (operation, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        returnList.ops.push(operation.name);
        returnList.args.push(_concat(operation.params));
        return returnList;
    };

    var _normalizeObject = function (operation, returnList) {
        return (operation.name ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
    };

    var _normalizeLiterals = function (operation, args, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        returnList.ops.push(operation);
        returnList.args.push(_concat(args));
        return returnList;
    };

    var _normalizeArrays = function (operations, arg, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        $.each(operations, function (index, opn) {
            if ($.isPlainObject(opn)) {
                _normalizeObject(opn, returnList);
            } else {
                _normalizeLiterals(opn, args[index], returnList);
            }
        });
        return returnList;
    };

    if ($.isPlainObject(operations)) {
        _normalizeObject(operations, returnList);
    } else if (Array.isArray(operations)) {
        _normalizeArrays(operations, args, returnList);
    } else {
        _normalizeLiterals(operations, args, returnList);
    }

    return returnList;
}

function splitGetFactory(httpOptions) {
    return function (params, options) {
        var http = this; //eslint-disable-line
        var getValue = function (name, options) {
            var value = options[name] || httpOptions[name];
            if (typeof value === 'function') {
                value = value();
            }
            return value;
        };
        var getFinalUrl = function (params) {
            var url = getValue('url', options);
            var data = params;
            // There is easy (or known) way to get the final URL jquery is going to send so
            // we're replicating it. The process might change at some point but it probably will not.
            // 1. Remove hash
            url = url.replace(/#.*$/, '');
            // 1. Append query string
            var queryParams = Object(__WEBPACK_IMPORTED_MODULE_0__query_util__["toQueryFormat"])(data);
            var questionIdx = url.indexOf('?');
            if (queryParams && questionIdx > -1) {
                return url + '&' + queryParams;
            } else if (queryParams) {
                return url + '?' + queryParams;
            }
            return url;
        };
        var url = getFinalUrl(params);
        // We must split the GET in multiple short URL's
        // The only property allowed to be split is "include"
        if (params && params.include && encodeURI(url).length > MAX_URL_LENGTH) {
            var dtd = $.Deferred();
            var paramsCopy = $.extend(true, {}, params);
            delete paramsCopy.include;
            var urlNoIncludes = getFinalUrl(paramsCopy);
            var diff = MAX_URL_LENGTH - urlNoIncludes.length;
            var oldSuccess = options.success || httpOptions.success || $.noop;
            var oldError = options.error || httpOptions.error || $.noop;
            // remove the original success and error callbacks
            options.success = $.noop;
            options.error = $.noop;

            var include = params.include;
            var currIncludes = [];
            var includeOpts = [currIncludes];
            var currLength = encodeURIComponent('?include=').length;
            var variable = include.pop();
            while (variable) {
                var varLenght = encodeURIComponent(variable).length;
                // Use a greedy approach for now, can be optimized to be solved in a more
                // efficient way
                // + 1 is the comma
                if (currLength + varLenght + 1 < diff) {
                    currIncludes.push(variable);
                    currLength += varLenght + 1;
                } else {
                    currIncludes = [variable];
                    includeOpts.push(currIncludes);
                    currLength = '?include='.length + varLenght;
                }
                variable = include.pop();
            }
            var reqs = $.map(includeOpts, function (include) {
                var reqParams = $.extend({}, params, { include: include });
                return http.get(reqParams, options);
            });
            $.when.apply($, reqs).then(function () {
                // Each argument are arrays of the arguments of each done request
                // So the first argument of the first array of arguments is the data
                var isValid = arguments[0] && arguments[0][0];
                if (!isValid) {
                    // Should never happen...
                    oldError();
                    return dtd.reject();
                }
                var firstResponse = arguments[0][0];
                var isObject = $.isPlainObject(firstResponse);
                var isRunAPI = isObject && $.isPlainObject(firstResponse.variables) || !isObject;
                if (isRunAPI) {
                    if (isObject) {
                        // aggregate the variables property only
                        var aggregateRun = arguments[0][0];
                        $.each(arguments, function (idx, args) {
                            var run = args[0];
                            $.extend(true, aggregateRun.variables, run.variables);
                        });
                        oldSuccess(aggregateRun, arguments[0][1], arguments[0][2]);
                        dtd.resolve(aggregateRun, arguments[0][1], arguments[0][2]);
                    } else {
                        // array of runs
                        // Agregate variables in each run
                        var aggregatedRuns = {};
                        $.each(arguments, function (idx, args) {
                            var runs = args[0];
                            if (!Array.isArray(runs)) {
                                return;
                            }
                            $.each(runs, function (idxRun, run) {
                                if (run.id && !aggregatedRuns[run.id]) {
                                    run.variables = run.variables || {};
                                    aggregatedRuns[run.id] = run;
                                } else if (run.id) {
                                    $.extend(true, aggregatedRuns[run.id].variables, run.variables);
                                }
                            });
                        });
                        // turn it into an array
                        aggregatedRuns = $.map(aggregatedRuns, function (run) {
                            return run;
                        });
                        oldSuccess(aggregatedRuns, arguments[0][1], arguments[0][2]);
                        dtd.resolve(aggregatedRuns, arguments[0][1], arguments[0][2]);
                    }
                } else {
                    // is variables API
                    // aggregate the response
                    var aggregatedVariables = {};
                    $.each(arguments, function (idx, args) {
                        var vars = args[0];
                        $.extend(true, aggregatedVariables, vars);
                    });
                    oldSuccess(aggregatedVariables, arguments[0][1], arguments[0][2]);
                    dtd.resolve(aggregatedVariables, arguments[0][1], arguments[0][2]);
                }
            }, function () {
                oldError.apply(http, arguments);
                dtd.reject.apply(dtd, arguments);
            });
            return dtd.promise();
        } else {
            return http.get(params, options);
        }
    };
}

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 *
 * ## Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly. This is because the Run Manager (and associated [run strategies](../strategies/)) gives you control over run creation depending on run states.
 *
 * The Run API Service is useful for building an interface where you want to show data across multiple runs (this is easy using the `filter()` and `query()` methods). For instance, you would probably use a Run Service to build a page for a facilitator. This is because a facilitator typically wants to evaluate performance from multiple end users, each of whom have been working with their own run.
 *
 * To use the Run API Service, instantiate it by passing in:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 *
 * If you know in advance that you would like to work with particular, existing run(s), you can optionally pass in:
 *
 * * `filter`: (Optional) Criteria by which to filter for existing runs. 
 * * `id`: (Optional) The run id of an existing run. This is a convenience alias for using filter, in the case where you only want to work with one run.
 *
 * For example,
 *
 *       var rs = new F.service.Run({
 *            account: 'acme-simulations',
 *            project: 'supply-chain-game',
 *      });
 *      rs.create('supply_chain_game.py').then(function(run) {
 *             rs.do('someOperation');
 *      });
 *
 *
 * Additionally, all API calls take in an `options` object as the last parameter. The options can be used to extend/override the Run API Service defaults listed below. In particular, passing `{ id: 'a-run-id' }` in this `options` object allows you to make calls to an existing run.
 *
 * Note that in addition to the `account`, `project`, and `model`, the Run Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply_chain_game.py',
 *               server: { host: 'api.forio.com' }
 *           }
 *       });
 *       rm.getRun()
 *           .then(function(run) {
 *               // the RunManager.run contains the instantiated Run Service,
 *               // so any Run Service method is valid here
 *               var rs = rm.run;
 *               rs.do('someOperation');
 *       })
 *
 */



var ConfigService = __webpack_require__(2).default;

var _require = __webpack_require__(6),
    toMatrixFormat = _require.toMatrixFormat;

var rutil = __webpack_require__(8);
var TransportFactory = __webpack_require__(0).default;
var VariablesService = __webpack_require__(23);
var IntrospectionService = __webpack_require__(24);
var SessionManager = __webpack_require__(1);

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to undefined). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter. Pass in an existing run id to interact with a particular run.
         * @type {String}
         */
        id: '',

        /**
         * Flag determines if `X-AutoRestore: true` header is sent to Epicenter, meaning runs are automatically pulled from the Epicenter backend database if not currently in memory on the Epicenter servers. Defaults to `true`.
         * @type {boolean}
         */
        autoRestore: true,

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         * @type {function}
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         * @type {function}
         */
        error: $.noop,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    function updateURLConfig(opts) {
        var urlConfig = new ConfigService(opts).get('server');
        if (opts.account) {
            urlConfig.accountPath = opts.account;
        }
        if (opts.project) {
            urlConfig.projectPath = opts.project;
        }

        urlConfig.filter = ';';
        urlConfig.getFilterURL = function (filter) {
            var url = urlConfig.getAPIPath('run');
            var filterMatrix = toMatrixFormat(filter || opts.filter);

            if (filterMatrix) {
                url += filterMatrix + '/';
            }
            return url;
        };

        urlConfig.addAutoRestoreHeader = function (options) {
            var filter = opts.filter;
            // The semicolon separated filter is used when filter is an object
            var isFilterRunId = filter && $.type(filter) === 'string';
            if (opts.autoRestore && isFilterRunId) {
                // By default autoreplay the run by sending this header to epicenter
                // https://forio.com/epicenter/docs/public/rest_apis/aggregate_run_api/#retrieving
                var autorestoreOpts = {
                    headers: {
                        'X-AutoRestore': 'true'
                    }
                };
                return $.extend(true, autorestoreOpts, options);
            }

            return options;
        };
        return urlConfig;
    }

    var http;
    var httpOptions; //FIXME: Make this side-effect-less
    function updateHTTPConfig(serviceOptions, urlConfig) {
        httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getFilterURL
        });

        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: 'Bearer ' + serviceOptions.token
            };
        }
        http = new TransportFactory(httpOptions);
        http.splitGet = rutil.splitGetFactory(httpOptions);
    }

    var urlConfig = updateURLConfig(serviceOptions); //making a function so #updateConfig can call this; change when refactored
    updateHTTPConfig(serviceOptions, urlConfig);

    function setFilterOrThrowError(options) {
        if (options.id) {
            serviceOptions.filter = serviceOptions.id = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = serviceOptions.id = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    }

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `reuse-never`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
         *
         *  **Example**
         *
         *      rs.create('hello_world.jl');
         *
         *  **Parameters**
         * @param {String|Object} params If a string, the name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project. If an object, may include `model`, `scope`, and `files`. (See the [Run Manager](../run_manager/) for more information on `scope` and `files`.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('run') });
            if (typeof params === 'string') {
                params = { model: params };
            } else {
                params = rutil.extractValidRunParams(params);
            }

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                serviceOptions.id = response.id;
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * The elements of the `qs` object are ANDed together within a single call to `.query()`.
         *
         * **Example**
         *
         *      // returns runs with saved = true and variables.price > 1,
         *      // where variables.price has been persisted (recorded)
         *      // in the model.
         *     rs.query({
         *          'saved': 'true',
         *          '.price': '>1'
         *       },
         *       {
         *          startrecord: 2,
         *          endrecord: 5
         *       });
         *
         * **Parameters**
         * @param {Object} qs Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        query: function (qs, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, { url: urlConfig.getFilterURL(qs) }, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);

            return http.splitGet(outputModifier, httpOptions).then(function (r) {
                return $.isPlainObject(r) && Object.keys(r).length === 0 ? [] : r;
            });
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`.
         *
         * **Parameters**
         * @param {Object} filter Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            } else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.splitGet(outputModifier, httpOptions).then(function (r) {
                return $.isPlainObject(r) && Object.keys(r).length === 0 ? [] : r;
            });
        },

        /**
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables or run record variables, pass them as part of the `filters` parameter.
         *
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed or saved in your model &mdash; are available.
         *
         * **Example**
         *
         *     rs.load('bb589677-d476-4971-a68e-0c58d191e450', { include: ['.price', '.sales'] });
         *
         * **Parameters**
         * @param {String} runID The run id.
         * @param {Object} filters (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        load: function (runID, filters, options) {
            if (runID) {
                serviceOptions.filter = runID; //shouldn't be able to over-ride
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.get(filters, httpOptions);
        },

        /**
         * Removes specified runid from memory
         *
         * **Example**
         *
         *     rs.removeFromMemory('bb589677-d476-4971-a68e-0c58d191e450');
         *
         * See [details on run persistence](../../../run_persistence/#runs-in-memory)
         * @param  {String} [runID]   id of run to remove
         * @param  {Object} [filters] (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param  {Object} [options] (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        removeFromMemory: function (runID, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            if (runID) {
                httpOptions.url = urlConfig.getAPIPath('run') + runID;
            }
            return http.delete({}, httpOptions);
        },

        /**
         * Save attributes (data, model variables) of the run.
         *
         * **Examples**
         *
         *     // add 'completed' field to run record
         *     rs.save({ completed: true });
         *
         *     // update 'saved' field of run record, and update values of model variables for this run
         *     rs.save({ saved: true, variables: { a: 23, b: 23 } });
         *
         *     // update 'saved' field of run record for a particular run
         *     rs.save({ saved: true }, { id: '0000015bf2a04995880df6b868d23eb3d229' });
         *
         * **Parameters**
         * @param {Object} attributes The run data and variables to save.
         * @param {Object} attributes.variables Model variables must be included in a `variables` field within the `attributes` object. (Otherwise they are treated as run data and added to the run record directly.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            return http.patch(attributes, httpOptions);
        },

        /**
         * Call an operation from the model.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *      // operation "solve" takes no arguments
         *     rs.do('solve');
         *      // operation "echo" takes one argument, a string
         *     rs.do('echo', ['hello']);
         *      // operation "echo" takes one argument, a string
         *     rs.do('echo', 'hello');
         *      // operation "sumArray" takes one argument, an array
         *     rs.do('sumArray', [[4,2,1]]);
         *      // operation "add" takes two arguments, both integers
         *     rs.do({ name:'add', params:[2,4] });
         *      // call operation "solve" on a different run 
         *     rs.do('solve', { id: '0000015bf2a04995880df6b868d23eb3d229' });
         *
         * **Parameters**
         * @param {String} operation Name of operation.
         * @param {Array} params (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else if ($.isPlainObject(params)) {
                opsArgs = null;
                postOptions = params;
            } else {
                opsArgs = params;
            }
            var result = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = result.args[0].length && result.args[0] !== null && result.args[0] !== undefined ? result.args[0] : [];
            return http.post({ arguments: prms }, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several operations from the model, sequentially.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Examples**
         *
         *      // operations "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // operations "init" and "reset" take two arguments each
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'reset', params: [2,3] }]);
         *      // operation "init" takes two arguments,
         *      // operation "runmodel" takes none
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'runmodel', params: [] }]);
         *
         * **Parameters**
         * @param {Array} operations If none of the operations take parameters, pass an array of the operation names (strings). If any of the operations do take parameters, pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var responses = [];
            var doSingleOp = function () {
                var op = ops.shift();
                var arg = args.shift();

                me.do(op, arg, {
                    success: function (result) {
                        responses.push(result);
                        if (ops.length) {
                            doSingleOp();
                        } else {
                            $d.resolve(responses);
                            postOptions.success(responses, me);
                        }
                    },
                    error: function (err) {
                        responses.push(err);
                        $d.reject(responses);
                        postOptions.error(responses, me);
                    }
                });
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Call several operations from the model, executing them in parallel.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Example**
         *
         *      // operations "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']);
         *      // operations "add" and "subtract" take two arguments each
         *     rs.parallel([ { name: 'add', params: [1,2] },
         *                   { name: 'subtract', params:[2,3] }]);
         *      // operations "add" and "subtract" take two arguments each
         *     rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * **Parameters**
         * @param {Array|Object} operations If none of the operations take parameters, pass an array of the operation names (as strings). If any of the operations do take parameters, you have two options. You can pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the operation name and a (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue = [];
            for (var i = 0; i < ops.length; i++) {
                queue.push(this.do(ops[i], args[i]));
            }

            var me = this;
            $.when.apply(this, queue).then(function () {
                var args = Array.prototype.slice.call(arguments);
                var actualResponse = args.map(function (a) {
                    return a[0];
                });
                $d.resolve(actualResponse);
                postOptions.success(actualResponse, me);
            }).fail(function () {
                var args = Array.prototype.slice.call(arguments);
                var actualResponse = args.map(function (a) {
                    return a[0];
                });
                $d.reject(actualResponse);
                postOptions.error(actualResponse, me);
            });

            return $d.promise();
        },

        /**
         * Shortcut to using the [Introspection API Service](../introspection-api-service/). Allows you to view a list of the variables and operations in a model.
         *
         * **Example**
         *
         *     rs.introspect({ runID: 'cbf85437-b539-4977-a1fc-23515cf071bb' }).then(function (data) {
         *          console.log(data.functions);
         *          console.log(data.variables);
         *     });
         *
         * **Parameters**
         * @param  {Object} options Options can either be of the form `{ runID: <runid> }` or `{ model: <modelFileName> }`. Note that the `runID` is optional if the Run Service is already associated with a particular run (because `id` was passed in when the Run Service was initialized). If provided, the `runID` overrides the `id` currently associated with the Run Service.
         * @param  {Object} introspectionConfig (Optional) Service options for Introspection Service
         * @return {Promise}
         */
        introspect: function (options, introspectionConfig) {
            var introspection = new IntrospectionService($.extend(true, {}, serviceOptions, introspectionConfig));
            if (options) {
                if (options.runID) {
                    return introspection.byRunID(options.runID);
                } else if (options.model) {
                    return introspection.byModel(options.model);
                }
            } else if (serviceOptions.id) {
                return introspection.byRunID(serviceOptions.id);
            } else {
                throw new Error('Please specify either the model or runid to introspect');
            }
        }
    };

    var publicSyncAPI = {
        getCurrentConfig: function () {
            return serviceOptions;
        },
        updateConfig: function (config) {
            if (config && config.id) {
                config.filter = config.id;
            } else if (config && config.filter) {
                config.id = config.filter;
            }
            serviceOptions = $.extend(true, {}, serviceOptions, config);
            urlConfig = updateURLConfig(serviceOptions);
            this.urlConfig = urlConfig;
            updateHTTPConfig(serviceOptions, urlConfig);
        },
        /**
          * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
          *
          * **Example**
          *
          *      var vs = rs.variables();
          *      vs.save({ sample_int: 4 });
          *
          * **Parameters**
          * @param {Object} config (Optional) Overrides for configuration options.
          * @return {Object} variablesService Instance
          */
        variables: function (config) {
            var vs = new VariablesService($.extend(true, {}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    $.extend(this, publicSyncAPI);
};

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["default"] = WorldAPIAdapter;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_consensus_api_service_consensus_service__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_presence_api_service__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_util_run_util__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_util_object_util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_service_service_utils__ = __webpack_require__(5);
/**
 * ## World API Adapter
 *
 * A [run](../../../glossary/#run) is a collection of end user interactions with a project and its model -- including setting variables, making decisions, and calling operations. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases. Only [team projects](../../../glossary/#team) can be multiplayer.
 *
 * The World API Adapter allows you to create, access, and manipulate multiplayer worlds within your Epicenter project. You can use this to add and remove end users from the world, and to create, access, and remove their runs. Because of this, typically the World Adapter is used for facilitator pages in your project. (The related [World Manager](../world-manager/) provides an easy way to access runs and worlds for particular end users, so is typically used in pages that end users will interact with.)
 *
 * As with all the other [API Adapters](../../), all methods take in an "options" object as the last parameter. The options can be used to extend/override the World API Service defaults.
 *
 * To use the World Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface), project id (**Project ID**), and group (**Group Name**).
 *
 *       var wa = new F.service.World({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1' });
 *       wa.create()
 *          .then(function(world) {
 *              // call methods, e.g. wa.addUsers()
 *          });
 */













var apiBase = 'multiplayer/';
var assignmentEndpoint = apiBase + 'assign';
var apiEndpoint = apiBase + 'world';
var projectEndpoint = apiBase + 'project';

function WorldAPIAdapter(config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The group name. Defaults to undefined.
         * @type {String}
         */
        group: undefined,

        /**
         * The model file to use to create runs in this world. Defaults to undefined.
         * @type {String}
         */
        model: undefined,

        /**
         * Criteria by which to filter world. Currently only supports world-ids as filters.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter
         * @type {String}
         */
        id: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_5_service_service_utils__["b" /* getDefaultOptions */])(defaults, config, {
        apiEndpoint: apiEndpoint
    });
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }
    var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_5_service_service_utils__["d" /* getURLConfig */])(serviceOptions);
    var http = new __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__["default"](serviceOptions.transport);

    var setIdFilterOrThrowError = function (options) {
        if (!options) options = {};
        if (options.id) {
            serviceOptions.filter = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No world id specified to apply operations against. This could happen if the user is not assigned to a world and is trying to work with runs from that world.');
        }
    };

    var validateModelOrThrowError = function (options) {
        if (!options || !options.model) {
            throw new Error('No model specified to get the current run');
        }
    };

    var publicAPI = {

        /**
        * Creates a new World.
        *
        * Using this method is rare. It is more common to create worlds automatically while you `autoAssign()` end users to worlds. (In this case, configuration data for the world, such as the roles, are read from the project-level world configuration information, for example by `getProjectSettings()`.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create({
        *           roles: ['VP Marketing', 'VP Sales', 'VP Engineering']
        *       });
        *
        *  **Parameters**
        * @param {object} params Parameters to create the world.
        * @param {string} params.group (Optional) The **Group Name** to create this world under. Only end users in this group are eligible to join the world. Optional here; required when instantiating the service (`new F.service.World()`).
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options);
            var worldApiParams = ['scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group', 'name'];
            var validParams = Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(serviceOptions, ['account', 'project', 'group']);
            // whitelist the fields that we actually can send to the api
            params = Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(params, worldApiParams);

            // account and project go in the body, not in the url
            params = $.extend({}, validParams, params);

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Updates a World, for example to replace the roles in the world.
        *
        * Typically, you complete world configuration at the project level, rather than at the world level. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both. However, this method is available if you need to update the configuration of a particular world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.update({ roles: ['VP Marketing', 'VP Sales', 'VP Engineering'] });
        *           });
        *
        *  **Parameters**
        * @param {object} params Parameters to update the world.
        * @param {string} params.name A string identifier for the linked end users, for example, "name": "Our Team".
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        update: function (params, options) {
            var whitelist = ['roles', 'optionalRoles', 'minUsers'];
            options = options || {};
            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter });

            params = Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        /**
        * Deletes an existing world.
        *
        * This function optionally takes one argument. If the argument is a string, it is the id of the world to delete. If the argument is an object, it is the override for global options.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.delete();
        *           });
        *
        *  **Parameters**
        * @param {string|Object} options (Optional) The id of the world to delete, or options object to override global options.
        * @return {Promise}
        */
        delete: function (options) {
            options = options && typeof options === 'string' ? { filter: options } : {};
            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter });

            return http.delete(null, deleteOptions);
        },

        /**
        * Updates the configuration for the current instance of the World API Adapter (including all subsequent function calls, until the configuration is updated again).
        *
        * **Example**
        *
        *      var wa = new F.service.World({...}).updateConfig({ filter: '123' }).addUser({ userId: '123' });
        *
        * **Parameters**
        * @param {object} config The configuration object to use in updating existing configuration.
        * @return {Object} reference to current instance
        */
        updateConfig: function (config) {
            $.extend(serviceOptions, config);
            return this;
        },

        /**
        * Lists all worlds for a given account, project, and group. All three are required, and if not specified as parameters, are read from the service.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // lists all worlds in group "team1"
        *               wa.list();
        *
        *               // lists all worlds in group "other-group-name"
        *               wa.list({ group: 'other-group-name' });
        *           });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        list: function (options) {
            var getOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });

            var filters = Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(getOptions, ['account', 'project', 'group']);

            return http.get(filters, getOptions);
        },

        /**
         * Load information for a specific world. All further calls to the world service will use the id provided.
         *
         * **Parameters**
         * @param {string} worldId The id of the world to load.
         * @param {Object} [options] (Optional) Options object to override global options.
         * @return {Promise}
         */
        load: function (worldId, options) {
            if (worldId) {
                serviceOptions.filter = worldId;
            }
            if (!serviceOptions.filter) {
                throw new Error('Please provide a worldid to load');
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/' });
            return http.get('', httpOptions);
        },

        /**
        * Gets all worlds that an end user belongs to for a given account (team), project, and group.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getWorldsForUser('b1c19dda-2d2e-4777-ad5d-3929f17e86d3')
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose worlds are being retrieved.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getWorldsForUser: function (userId, options) {
            var getOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });

            var filters = $.extend(Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(getOptions, ['account', 'project', 'group']), { userId: userId });

            return http.get(filters, getOptions);
        },

        /**
        * Adds an end user or list of end users to a given world. The end user must be a member of the `group` that is associated with this world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // add one user
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *               wa.addUsers(['b1c19dda-2d2e-4777-ad5d-3929f17e86d3']);
        *               wa.addUsers({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'VP Sales' });
        *
        *               // add several users
        *               wa.addUsers([
        *                   { userId: 'a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44',
        *                     role: 'VP Marketing' },
        *                   { userId: '8f2604cf-96cd-449f-82fa-e331530734ee',
        *                     role: 'VP Engineering' }
        *               ]);
        *
        *               // add one user to a specific world
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', world.id);
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', { filter: world.id });
        *           });
        *
        * ** Parameters **
        * @param {string|object|array} users User id, array of user ids, object, or array of objects of the users to add to this world.
        * @param {string} users.role The `role` the user should have in the world. It is up to the caller to ensure, if needed, that the `role` passed in is one of the `roles` or `optionalRoles` of this world.
        * @param {string} worldId The world to which the users should be added. If not specified, the filter parameter of the `options` object is used.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        addUsers: function (users, worldId, options) {
            if (!users) {
                throw new Error('Please provide a list of users to add to the world');
            }

            // normalize the list of users to an array of user objects
            users = [].concat(users).map(function (u) {
                var isObject = $.isPlainObject(u);
                if (typeof u !== 'string' && !isObject) {
                    throw new Error('Some of the users in the list are not in the valid format: ' + u);
                }
                return isObject ? u : { userId: u };
            });

            // check if options were passed as the second parameter
            if ($.isPlainObject(worldId) && !options) {
                options = worldId;
                worldId = null;
            }

            options = options || {};

            // we must have options by now
            if (typeof worldId === 'string') {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' });

            return http.post(users, updateOptions);
        },

        /**
        * Updates the role of an end user in a given world. (You can only update one end user at a time.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.create().then(function(world) {
        *           wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *           wa.updateUser({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'leader' });
        *      });
        *
        * **Parameters**
        * @param {{userId: string, role: string}} user User object with `userId` and the new `role`.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        updateUser: function (user, options) {
            if (!user || !user.userId) {
                throw new Error('You need to pass a userId to update from the world');
            }

            setIdFilterOrThrowError(options);
            var validFields = ['role'];
            var patchOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId });

            return http.patch(Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["pick"])(user, validFields), patchOptions);
        },

        /**
        * Removes an end user from a given world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.addUsers(['a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44', '8f2604cf-96cd-449f-82fa-e331530734ee']);
        *               wa.removeUser('a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44');
        *               wa.removeUser({ userId: '8f2604cf-96cd-449f-82fa-e331530734ee' });
        *           });
        *
        * ** Parameters **
        * @param {object|string} user The `userId` of the user to remove from the world, or an object containing the `userId` field.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        removeUser: function (user, options) {
            if (typeof user === 'string') {
                user = { userId: user };
            }

            if (!user.userId) {
                throw new Error('You need to pass a userId to remove from the world');
            }

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId });

            return http.delete(null, getOptions);
        },

        /**
        * Gets the run id of current run for the given world. If the world does not have a run, creates a new one and returns the run id.
        *
        * Remember that a [run](../../glossary/#run) is a collection of interactions with a project and its model. In the case of multiplayer projects, the run is shared by all end users in the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getCurrentRunId({ model: 'model.py' });
        *           });
        *
        * ** Parameters **
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        getCurrentRunId: function (options) {
            setIdFilterOrThrowError(options);

            var postParams = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' });

            validateModelOrThrowError(postParams);
            var validRunParams = Object(__WEBPACK_IMPORTED_MODULE_3_util_run_util__["extractValidRunParams"])(postParams);
            return http.post(validRunParams, postParams);
        },

        /**
        * Gets the current (most recent) world for the given end user in the given group. Brings this most recent world into memory if needed.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function(world) {
        *               // use data from world
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose current (most recent) world is being retrieved.
        * @param {string} groupName (Optional) The name of the group. If not provided, defaults to the group used to create the service.
        * @return {Promise}
        */
        getCurrentWorldForUser: function (userId, groupName) {
            var dtd = $.Deferred();
            var me = this;
            this.getWorldsForUser(userId, { group: groupName }).then(function (worlds) {
                // assume the most recent world as the 'active' world
                worlds.sort(function (a, b) {
                    return +new Date(b.lastModified) - +new Date(a.lastModified);
                });
                var currentWorld = worlds[0];

                if (currentWorld) {
                    serviceOptions.filter = currentWorld.id;
                }

                dtd.resolveWith(me, [currentWorld]);
            }).catch(dtd.reject);

            return dtd.promise();
        },

        /**
        * Deletes the current run from the world.
        *
        * (Note that the world id remains part of the run record, indicating that the run was formerly an active run for the world.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.deleteRun('sample-world-id');
        *
        *  **Parameters**
        * @param {string} worldId The `worldId` of the world from which the current run is being deleted.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        deleteRun: function (worldId, options) {
            options = options || {};
            if (worldId) {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' });

            return http.delete(null, deleteOptions);
        },

        /**
        * Creates a new run for the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function (world) {
        *                   wa.newRunForWorld(world.id);
        *           });
        *
        *  **Parameters**
        * @param {string} worldId worldId in which we create the new run.
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        newRunForWorld: function (worldId, options) {
            var currentRunOptions = $.extend(true, {}, serviceOptions, options, { filter: worldId || serviceOptions.filter });
            var me = this;

            validateModelOrThrowError(currentRunOptions);

            return this.deleteRun(worldId, options).then(function () {
                return me.getCurrentRunId(currentRunOptions);
            });
        },

        /**
        * Assigns end users to worlds, creating new worlds as appropriate, automatically. Assigns all end users in the group, and creates new worlds as needed based on the project-level world configuration (roles, optional roles, and minimum end users per world).
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.autoAssign();
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @param {number} options.maxUsers Sets the maximum number of users in a world.
        * @param {string[]} options.userIds A list of users to be assigned be assigned instead of all end users in the group.
        * @return {Promise}
        *
        */
        autoAssign: function (options) {
            var opt = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(assignmentEndpoint) });

            var params = {
                account: opt.account,
                project: opt.project,
                group: opt.group
            };

            if (opt.maxUsers) {
                params.maxUsers = opt.maxUsers;
            }

            if (opt.userIds) {
                params.userIds = opt.userIds;
            }

            return http.post(params, opt);
        },

        /**
        * Gets the project's world configuration.
        *
        * Typically, every interaction with your project uses the same configuration of each world. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both.
        *
        * (The [Multiplayer Project REST API](../../../rest_apis/multiplayer/multiplayer_project/) allows you to set these project-level world configurations. The World Adapter simply retrieves them, for example so they can be used in auto-assignment of end users to worlds.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getProjectSettings()
        *           .then(function(settings) {
        *               console.log(settings.roles);
        *               console.log(settings.optionalRoles);
        *           });
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getProjectSettings: function (options) {
            var opt = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(projectEndpoint) });

            opt.url += [opt.account, opt.project].join('/');
            return http.get(null, opt);
        },

        /**
         * Get an instance of a consensus service for current world
         * 
         * @param {string|{ consensusGroup: string, name: string}} conOpts creates a consensus with an optional group name. If not specified, created under the 'default' group
         * @param {object} options Overrides for service options
         * @returns {ConsensusService}
         */
        consensus: function (conOpts, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            var worldId = opts.filter || opts.id;
            if (!worldId) {
                throw new Error('No world id provided; use consensus(name, { id: worldid})');
            }
            if (!conOpts) {
                throw new Error('No consensus name provided; use consensus(name, { id: worldid})');
            }

            function extractNamesFromOpts(nameOpts) {
                if (typeof nameOpts === 'string') {
                    return {
                        name: nameOpts
                    };
                }
                if ($.isPlainObject(nameOpts)) {
                    return {
                        consensusGroup: nameOpts.consensusGroup,
                        name: nameOpts.name
                    };
                }
            }
            var con = new __WEBPACK_IMPORTED_MODULE_1_service_consensus_api_service_consensus_service__["default"]($.extend(true, {
                worldId: worldId
            }, opts, extractNamesFromOpts(conOpts)));
            return con;
        },

        /**
         * @param {string|{users: object} } world
         * @param {object} options
         * @returns {Promise}
         */
        getPresenceForUsers: function (world, options) {
            var _this = this;

            var opts = $.extend(true, {}, serviceOptions, options);
            var getUsersForWorld = function (world, opts) {
                if (world && world.users) {
                    return $.Deferred().resolve(world).promise();
                }
                var worldid = world || opts.filter || opts.id;
                return _this.load(worldid).then(function (w) {
                    return w;
                });
            };

            var ps = new __WEBPACK_IMPORTED_MODULE_2_service_presence_api_service__["default"](opts);
            var worldLoadPromise = getUsersForWorld(world, opts);
            return worldLoadPromise.then(function (world) {
                return ps.getStatusForUsers(world.users);
            });
        }
    };

    $.extend(this, publicAPI);
}

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Base = __webpack_require__(12);
var classFrom = __webpack_require__(3);

/**
* ## Conditional Creation Strategy
*
* This strategy will try to get the run stored in the cookie and
* evaluate if it needs to create a new run by calling the `condition` function.
*/

var Strategy = classFrom(Base, {
    constructor: function Strategy(condition) {
        if (condition == null) {
            //eslint-disable-line
            throw new Error('Conditional strategy needs a condition to create a run');
        }
        this.condition = typeof condition !== 'function' ? function () {
            return condition;
        } : condition;
    },

    /**
     * Gets a new 'correct' run, or updates the existing one (the definition of 'correct' depends on strategy implementation).
     * @param  {RunService} runService A Run Service instance for the current run, as determined by the Run Manager.
     * @param  {Object} userSession Information about the current user session. See [AuthManager#getCurrentUserSessionInfo](../auth-manager/#getcurrentusersessioninfo) for format.
     * @param  {Object} options (Optional) See [RunService#create](../run-api-service/#create) for supported options.
     * @return {Promise}             
     */
    reset: function (runService, userSession, options) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService.create(opt, options).then(function (run) {
            run.freshlyCreated = true;
            return run;
        });
    },

    /**
     * Gets the 'correct' run (the definition of 'correct' depends on strategy implementation).
     * @param  {RunService} runService A Run Service instance for the current run, as determined by the Run Manager.
     * @param  {Object} userSession Information about the current user session. See [AuthManager#getCurrentUserSessionInfo](../auth-manager/#getcurrentusersessioninfo) for format.
     * @param  {Object} runSession The Run Manager stores the 'last accessed' run in a cookie and passes it back here.
     * @param  {Object} options (Optional) See [RunService#create](../run-api-service/#create) for supported options.
     * @return {Promise}             
     */
    getRun: function (runService, userSession, runSession, options) {
        var me = this;
        if (runSession && runSession.id) {
            return this.loadAndCheck(runService, userSession, runSession, options).catch(function () {
                return me.reset(runService, userSession, options); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService, userSession, options);
        }
    },

    loadAndCheck: function (runService, userSession, runSession, options) {
        var shouldCreate = false;
        var me = this;

        return runService.load(runSession.id, null, {
            success: function (run, msg, headers) {
                shouldCreate = me.condition(run, headers, userSession, runSession);
            }
        }).then(function (run) {
            if (shouldCreate) {
                return me.reset(runService, userSession, options);
            }
            return run;
        });
    }
});

module.exports = Strategy;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../run-api-service/).
 * 
 * This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance.
 */



var classFrom = __webpack_require__(3);
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (options) {},

    reset: function () {
        // return a newly created run
        return $.Deferred().resolve().promise();
    },

    getRun: function (runService) {
        // return a usable run
        return $.Deferred().resolve(runService).promise();
    }
});

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var epiVersion = __webpack_require__(21);

//TODO: urlutils to get host, since no window on node
var defaults = {
    host: window.location.host,
    pathname: window.location.pathname
};

function getLocalHost(existingFn, host) {
    var localHostFn;
    if (existingFn !== undefined) {
        if (!$.isFunction(existingFn)) {
            localHostFn = function () {
                return existingFn;
            };
        } else {
            localHostFn = existingFn;
        }
    } else {
        localHostFn = function () {
            var isLocal = !host || //phantomjs
            host === '127.0.0.1' || host.indexOf('local.') === 0 || host.indexOf('ngrok') !== -1 || host.indexOf('localhost') === 0;
            return isLocal;
        };
    }
    return localHostFn;
}

var UrlConfigService = function (config) {
    var envConf = UrlConfigService.defaults;

    if (!config) {
        config = {};
    }
    var configOverrides = $.extend({}, defaults, config);
    var overrides = $.extend({}, envConf, config);
    var options = $.extend({}, defaults, overrides);

    overrides.isLocalhost = options.isLocalhost = getLocalHost(options.isLocalhost, configOverrides.host);

    var actingHost = config && config.host;
    if (!actingHost && options.isLocalhost()) {
        actingHost = 'forio.com';
    } else {
        actingHost = options.host;
    }

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        actingHost: actingHost,

        //TODO: this should really be called 'apihost', but can't because that would break too many things
        host: function () {
            var apiHost = HOST_API_MAPPING[actingHost] ? HOST_API_MAPPING[actingHost] : actingHost;
            return apiHost;
        }(),

        isCustomDomain: function () {
            var path = options.pathname.split('/');
            var pathHasApp = path && path[1] === 'app';
            return !options.isLocalhost() && !pathHasApp;
        }(),

        appPath: function () {
            var path = options.pathname.split('/');

            return path && path[1] || '';
        }(),

        accountPath: function () {
            var accnt = '';
            var path = options.pathname.split('/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }(),

        projectPath: function () {
            var prj = '';
            var path = options.pathname.split('/');
            if (path && path[1] === 'app') {
                prj = path[3]; //eslint-disable-line no-magic-numbers
            }
            return prj;
        }(),

        versionPath: function () {
            var version = epiVersion.version ? epiVersion.version + '/' : '';
            return version;
        }(),

        baseURL: function () {
            var baseURL = this.protocol + '://' + this.host + '/' + this.versionPath;
            return baseURL;
        },

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data', 'file', 'presence', 'project', 'multiplayer/project'];
            var apiMapping = {
                channel: 'channel/subscribe'
            };
            var apiEndpoint = apiMapping[api] || api;

            if (apiEndpoint === 'config') {
                var actualProtocol = window.location.protocol.replace(':', '');
                var configProtocol = options.isLocalhost() ? this.protocol : actualProtocol;
                return configProtocol + '://' + actingHost + '/epicenter/' + this.versionPath + 'config';
            }
            var baseURL = typeof this.baseURL === 'function' ? this.baseURL() : this.baseURL;
            var apiPath = baseURL + apiEndpoint + '/';

            if (PROJECT_APIS.indexOf(apiEndpoint) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath + '/';
            }
            return apiPath;
        }
    };

    $.extend(publicExports, overrides);
    return publicExports;
};
// This data can be set by external scripts, for loading from an env server for eg;
UrlConfigService.defaults = {};

module.exports = UrlConfigService;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
    EPI_SESSION_KEY: 'epicenterjs.session',
    STRATEGY_SESSION_KEY: 'epicenter-scenario'
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

/**
* ## Authorization Manager
*
* The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
*
* The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).
*
* #### Using the Authorization Manager
*
* To use the Authorization Manager, instantiate it. Then, make calls to any of the methods you need:
*
*       var authMgr = new F.manager.AuthManager({
*           account: 'acme-simulations',
*           userName: 'enduser1',
*           password: 'passw0rd'
*       });
*       authMgr.login().then(function () {
*           authMgr.getCurrentUserSessionInfo();
*       });
*
*
* The `options` object passed to the `F.manager.AuthManager()` call can include:
*
*   * `account`: The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
*   * `userName`: Email or username to use for logging in.
*   * `password`: Password for specified `userName`.
*   * `project`: The **Project ID** for the project to log this user into. Optional.
*   * `groupId`: Id of the group to which `userName` belongs. Required for end users if the `project` is specified.
*
* If you prefer starting from a template, the Epicenter JS Libs [Login Component](../../#components) uses the Authorization Manager as well. This sample HTML page (and associated CSS and JS files) provides a login form for team members and end users of your project. It also includes a group selector for end users that are members of multiple groups.
*/

var AuthAdapter = __webpack_require__(28);
var MemberAdapter = __webpack_require__(29);
var GroupService = __webpack_require__(30).default;
var SessionManager = __webpack_require__(1);
var _pick = __webpack_require__(4).pick;
var objectAssign = __webpack_require__(15);

var atob = window.atob || __webpack_require__(47).atob;

var defaults = {
    requiresGroup: true
};

function AuthManager(options) {
    options = $.extend(true, {}, defaults, options);
    this.sessionManager = new SessionManager(options);
    this.options = this.sessionManager.getMergedOptions();

    this.authAdapter = new AuthAdapter(this.options);
}

var _findUserInGroup = function (members, id) {
    for (var j = 0; j < members.length; j++) {
        if (members[j].userId === id) {
            return members[j];
        }
    }
    return null;
};

AuthManager.prototype = $.extend(AuthManager.prototype, {

    /**
    * Logs user in.
    *
    * **Example**
    *
    *       authMgr.login({
    *           account: 'acme-simulations',
    *           project: 'supply-chain-game',
    *           userName: 'enduser1',
    *           password: 'passw0rd'
    *       })
    *           .then(function(statusObj) {
    *               // if enduser1 belongs to exactly one group
    *               // (or if the login() call is modified to include the group id)
    *               // continue here
    *           })
    *           .fail(function(statusObj) {
    *               // if enduser1 belongs to multiple groups,
    *               // the login() call fails
    *               // and returns all groups of which the user is a member
    *               for (var i=0; i < statusObj.userGroups.length; i++) {
    *                   console.log(statusObj.userGroups[i].name, statusObj.userGroups[i].groupId);
    *               }
    *           });
    *
    * **Parameters**
    *
    * @param {Object} options (Optional) Overrides for configuration options. If not passed in when creating an instance of the manager (`F.manager.AuthManager()`), these options should include:
    * @param {string} options.account The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
    * @param {string} options.userName Email or username to use for logging in.
    * @param {string} options.password Password for specified `userName`.
    * @param {string} options.project (Optional) The **Project ID** for the project to log this user into.
    * @param {string} options.groupId The id of the group to which `userName` belongs. Required for [end users](../../../glossary/#users) if the `project` is specified and if the end users are members of multiple [groups](../../../glossary/#groups), otherwise optional.
    * @return {Promise}
    */
    login: function (options) {
        var me = this;
        var $d = $.Deferred();
        var sessionManager = this.sessionManager;
        var adapterOptions = sessionManager.getMergedOptions({ success: $.noop, error: $.noop }, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

        var decodeToken = function (token) {
            var encoded = token.split('.')[1];
            while (encoded.length % 4 !== 0) {
                //eslint-disable-line
                encoded += '=';
            }
            return JSON.parse(atob(encoded));
        };

        var handleGroupError = function (message, statusCode, data, type) {
            // logout the user since it's in an invalid state with no group selected
            me.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode, type: type });
                $d.reject(error);
            });
        };

        var handleSuccess = function (response) {
            var token = response.access_token;
            var userInfo = decodeToken(token);
            var oldGroups = sessionManager.getSession(adapterOptions).groups || {};
            var userGroupOpts = $.extend(true, {}, adapterOptions, { success: $.noop });
            var data = { auth: response, user: userInfo };
            var project = adapterOptions.project;
            var isTeamMember = userInfo.parent_account_id === null;
            var requiresGroup = adapterOptions.requiresGroup && project;

            var userName = (userInfo.user_name || '').split('/')[0]; //of form <user>/<team>
            var sessionInfo = {
                auth_token: token,
                account: adapterOptions.account,
                project: project,
                userId: userInfo.user_id,
                groups: oldGroups,
                isTeamMember: isTeamMember,
                userName: userName
            };
            // The group is not required if the user is not logging into a project
            if (!requiresGroup) {
                sessionManager.saveSession(sessionInfo);
                outSuccess.apply(this, [data]);
                $d.resolve(data);
                return;
            }

            var handleGroupList = function (groupList) {
                data.userGroups = groupList;

                var group = null;
                if (groupList.length === 0) {
                    handleGroupError('The user has no groups associated in this account', 403, data, 'NO_GROUPS');
                    return;
                } else if (groupList.length === 1) {
                    // Select the only group
                    group = groupList[0];
                } else if (groupList.length > 1) {
                    if (groupId) {
                        var filteredGroups = $.grep(groupList, function (resGroup) {
                            return resGroup.groupId === groupId;
                        });
                        group = filteredGroups.length === 1 ? filteredGroups[0] : null;
                    }
                }

                if (group) {
                    // A team member does not get the group members because is calling the Group API
                    // but it's automatically a fac user
                    var isFac = isTeamMember ? true : _findUserInGroup(group.members, userInfo.user_id).role === 'facilitator';
                    var groupData = {
                        groupId: group.groupId,
                        groupName: group.name,
                        isFac: isFac
                    };
                    var sessionInfoWithGroup = objectAssign({}, sessionInfo, groupData);
                    sessionInfo.groups[project] = groupData;
                    me.sessionManager.saveSession(sessionInfoWithGroup, adapterOptions);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This user is associated with more than one group. Please specify a group id to log into and try again', 403, data, 'MULTIPLE_GROUPS');
                }
            };

            if (!isTeamMember) {
                me.getUserGroups({ userId: userInfo.user_id, token: token }, userGroupOpts).then(handleGroupList, $d.reject);
            } else {
                var opts = objectAssign({}, userGroupOpts, { token: token });
                var groupService = new GroupService(opts);
                groupService.getGroups({ account: adapterOptions.account, project: project }).then(function (groups) {
                    // Group API returns id instead of groupId
                    groups.forEach(function (group) {
                        group.groupId = group.id;
                    });

                    if (groups.length) {
                        handleGroupList(groups);
                    } else {
                        //either it's a private project or there are no groups
                        sessionManager.saveSession(sessionInfo);
                        outSuccess.apply(this, [data]);
                        $d.resolve(data);
                        return;
                    }
                }, $d.reject);
            }
        };

        adapterOptions.success = handleSuccess;
        adapterOptions.error = function (response) {
            if (adapterOptions.account) {
                // Try to login as a system user
                adapterOptions.account = null;
                adapterOptions.error = function () {
                    outError.apply(this, arguments);
                    $d.reject(response);
                };

                me.authAdapter.login(adapterOptions);
                return;
            }

            outError.apply(this, arguments);
            $d.reject(response);
        };

        this.authAdapter.login(adapterOptions);
        return $d.promise();
    },

    /**
    * Logs user out by clearing all session information.
    *
    * **Example**
    *
    *       authMgr.logout();
    *
    * **Parameters**
    *
    * @param {Object} [options] Overrides for configuration options.
    * @return {Promise}
    */
    logout: function (options) {
        var me = this;
        var adapterOptions = this.sessionManager.getMergedOptions(options);

        var removeCookieFn = function (response) {
            me.sessionManager.removeSession();
        };

        return this.authAdapter.logout(adapterOptions).then(removeCookieFn);
    },

    /**
     * Returns the existing user access token if the user is already logged in. Otherwise, logs the user in, creating a new user access token, and returns the new token. (See [more background on access tokens](../../../project_access/)).
     *
     * **Example**
     *
     *      authMgr.getToken()
     *          .then(function (token) {
     *              console.log('My token is ', token);
     *          });
     *
     * **Parameters**
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getToken: function (options) {
        var httpOptions = this.sessionManager.getMergedOptions(options);

        var session = this.sessionManager.getSession(httpOptions);
        var $d = $.Deferred();
        if (session.auth_token) {
            $d.resolve(session.auth_token);
        } else {
            this.login(httpOptions).then($d.resolve);
        }
        return $d.promise();
    },

    /**
     * Returns an array of group records, one for each group of which the current user is a member. Each group record includes the group `name`, `account`, `project`, and `groupId`.
     *
     * If some end users in your project are members of multiple groups, this is a useful method to call on your project's login page. When the user attempts to log in, you can use this to display the groups of which the user is member, and have the user select the correct group to log in to for this session.
     *
     * **Example**
     *
     *      // get groups for current user
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *      authMgr.getUserGroups({ userId: sessionObj.userId, token: sessionObj.auth_token })
     *          .then(function (groups) {
     *              for (var i=0; i < groups.length; i++)
     *                  { console.log(groups[i].name); }
     *          });
     *
     *      // get groups for particular user
     *      authMgr.getUserGroups({userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', token: savedProjAccessToken });
     *
     * **Parameters**
     * @param {Object} params Object with a userId and token properties.
     * @param {String} params.userId The userId. If looking up groups for the currently logged in user, this is in the session information. Otherwise, pass a string.
     * @param {String} params.token The authorization credentials (access token) to use for checking the groups for this user. If looking up groups for the currently logged in user, this is in the session information. A team member's token or a project access token can access all the groups for all end users in the team or project.
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getUserGroups: function (params, options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
        var $d = $.Deferred();
        var outSuccess = adapterOptions.success;

        adapterOptions.success = function (memberInfo) {
            // The member API is at the account scope, we filter by project
            if (adapterOptions.project) {
                memberInfo = $.grep(memberInfo, function (group) {
                    return group.project === adapterOptions.project;
                });
            }

            outSuccess.apply(this, [memberInfo]);
            $d.resolve(memberInfo);
        };

        var memberAdapter = new MemberAdapter({ token: params.token, server: adapterOptions.server });
        memberAdapter.getGroupsForUser(params, adapterOptions).fail($d.reject);
        return $d.promise();
    },

    /**
     * Helper method to check if you're currently logged in
     *
     *  **Example**
     *  
     *      var amILoggedIn = authMgr.isLoggedIn();
     *
     * **Parameters**
     * @param {none} none
     * @return {Boolean} true if you're logged in
     */
    isLoggedIn: function () {
        var session = this.getCurrentUserSessionInfo();
        return !!(session && session.userId);
    },

    /**
     * Returns session information for the current user, including the `userId`, `account`, `project`, `groupId`, `groupName`, `isFac` (whether the end user is a facilitator of this group), and `auth_token` (user access token).
     *
     * *Important*: This method is synchronous. The session information is returned immediately in an object; no callbacks or promises are needed.
     *
     * Session information is stored in a cookie in the browser.
     *
     * **Example**
     *
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *
     * **Parameters**
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Object} session information
     */
    getCurrentUserSessionInfo: function (options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
        return this.sessionManager.getSession(adapterOptions);
    },

    /*
     * Adds one or more groups to the current session. 
     *
     * This method assumes that the project and group exist and the user specified in the session is part of this project and group.
     *
     * Returns the new session object.
     *
     * **Example**
     *
     *      authMgr.addGroups({ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' });
     *      authMgr.addGroups([{ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' }, { project: 'hello-world', groupName: '...' }]);
     *
     * **Parameters**
     * @param {object|array} groups (Required) The group object must contain the `project` (**Project ID**) and `groupName` properties. If passing an array of such objects, all of the objects must contain *different* `project` (**Project ID**) values: although end users may be logged in to multiple projects at once, they may only be logged in to one group per project at a time.
     * @param {string} group.isFac (optional) Defaults to `false`. Set to `true` if the user in the session should be a facilitator in this group.
     * @param {string} group.groupId (optional) Defaults to undefined. Needed mostly for the Members API.
     * @return {Object} session information
    */
    addGroups: function (groups) {
        var session = this.getCurrentUserSessionInfo();
        var isArray = Array.isArray(groups);
        groups = isArray ? groups : [groups];

        $.each(groups, function (index, group) {
            var extendedGroup = $.extend({}, { isFac: false }, group);
            var project = extendedGroup.project;
            var validProps = ['groupName', 'groupId', 'isFac'];
            if (!project || !extendedGroup.groupName) {
                throw new Error('No project or groupName specified.');
            }
            // filter object
            extendedGroup = _pick(extendedGroup, validProps);
            session.groups[project] = extendedGroup;
        });
        this.sessionManager.saveSession(session);
        return session;
    }
});

module.exports = AuthManager;

/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__channel_manager__ = __webpack_require__(48);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__channel_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__channel_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_configuration_service__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_util_inherit__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_util_inherit___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_util_inherit__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_store_session_manager__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_store_session_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_store_session_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__world_channel_subscribe_world_channel__ = __webpack_require__(49);
/**
 * ## Epicenter Channel Manager
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world).
 *
 * <a name="background"></a>
 * ### Channel Background
 *
 * Channel notifications are only available for [team projects](../../../glossary/#team). There are two main use cases for the push channel: event notifications and chat messages.
 *
 * #### Event Notifications
 *
 * Within a [multiplayer simulation or world](../../../glossary/#world), it is often useful for your project's [model](../../../writing_your_model/) to alert the [user interface (browser)](../../../creating_your_interface/) that something new has happened.
 *
 * Usually, this "something new" is an event within the project, group, or world, such as:
 *
 * * An end user comes online (logs in) or goes offline. (This is especially interesting in a multiplayer world; only available if you have [enabled authorization](../../../updating_your_settings/#general-settings) for the channel.)
 * * An end user is assigned to a world.
 * * An end user updates a variable / makes a decision.
 * * An end user creates or updates data stored in the [Data API](../data-api-service/).
 * * An operation (method) is called. (This is especially interesting if the model is advanced, for instance, the Vensim `step` operation is called.)
 *
 * When these events occur, you often want to have the user interface for one or more end users automatically update with new information.
 *
 * #### Chat Messages
 *
 * Another reason to use the push channel is to allow players (end users) to send chat messages to other players, and to have those messages appear immediately.
 *
 * #### Getting Started
 *
 * For both the event notification and chat message use cases:
 *
 * * First, enable channel notifications for your project.
 *      * Channel notifications are only available for [team projects](../../../glossary/#team). To enable notifications for your project, [update your project settings](../../../updating_your_settings/#general-settings) to turn on the **Push Channel** setting, and optionally require authorization for the channel.
 * * Then, instantiate an Epicenter Channel Manager.
 * * Next, get the channel with the scope you want (user, world, group, data).
 * * Finally, use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 * Here's an example of those last three steps (instantiate, get channel, subscribe):
 *
 *     var cm = new F.manager.ChannelManager();
 *     var gc = cm.getGroupChannel();
 *     gc.subscribe('', function(data) { console.log(data); });
 *     gc.publish('', { message: 'a new message to the group' });
 *
 * For a more detailed example, see a [complete publish and subscribe example](../../../rest_apis/multiplayer/channel/#epijs-example).
 *
 * For details on what data is published automatically to which channels, see [Automatic Publishing of Events](../../../rest_apis/multiplayer/channel/#publish-message-auto).
 *
 * #### Creating an Epicenter Channel Manager
 *
 * The Epicenter Channel Manager is a wrapper around the (more generic) [Channel Manager](../channel-manager/), to instantiate it with Epicenter-specific defaults. If you are interested in including a notification or chat feature in your project, using an Epicenter Channel Manager is the easiest way to get started.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Epicenter Channel Manager. See [Including Epicenter.js](../../#include).
 *
 * The parameters for instantiating an Epicenter Channel Manager include:
 *
 * * `options` Object with details about the Epicenter project for this Epicenter Channel Manager instance.
 * * `options.account` The Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `options.project` Epicenter project id.
 * * `options.userName` Epicenter userName used for authentication.
 * * `options.userId` Epicenter user id used for authentication. Optional; `options.userName` is preferred.
 * * `options.token` Epicenter token used for authentication. (You can retrieve this using `authManager.getToken()` from the [Authorization Manager](../auth-manager/).)
 * * `options.allowAllChannels` If not included or if set to `false`, all channel paths are validated; if your project requires [Push Channel Authorization](../../../updating_your_settings/), you should use this option. If you want to allow other channel paths, set to `true`; this is not common.
 */








var validTypes = {
    project: true,
    group: true,
    world: true,
    user: true,
    data: true,
    general: true,
    chat: true
};
var getFromSessionOrError = function (value, sessionKeyName, settings) {
    if (!value) {
        if (settings && settings[sessionKeyName]) {
            value = settings[sessionKeyName];
        } else {
            throw new Error(sessionKeyName + ' not found. Please log-in again, or specify ' + sessionKeyName + ' explicitly');
        }
    }
    return value;
};

var isPresenceData = function (payload) {
    return payload.data && payload.data.type === 'user' && payload.data.user;
};

var __super = __WEBPACK_IMPORTED_MODULE_0__channel_manager___default.a.prototype;
var EpicenterChannelManager = __WEBPACK_IMPORTED_MODULE_2_util_inherit___default()(__WEBPACK_IMPORTED_MODULE_0__channel_manager___default.a, {
    constructor: function (options) {
        this.sessionManager = new __WEBPACK_IMPORTED_MODULE_3_store_session_manager___default.a(options);
        var defaultCometOptions = this.sessionManager.getMergedOptions(options);

        var urlConfig = new __WEBPACK_IMPORTED_MODULE_1_service_configuration_service__["default"](defaultCometOptions).get('server');
        if (!defaultCometOptions.url) {
            defaultCometOptions.url = urlConfig.getAPIPath('channel');
        }

        if (defaultCometOptions.handshake === undefined) {
            var userName = defaultCometOptions.userName;
            var userId = defaultCometOptions.userId;
            var token = defaultCometOptions.token;
            if ((userName || userId) && token) {
                var userProp = userName ? 'userName' : 'userId';
                var ext = {
                    authorization: 'Bearer ' + token
                };
                ext[userProp] = userName ? userName : userId;

                defaultCometOptions.handshake = {
                    ext: ext
                };
            }
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
    },

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * This method enforces Epicenter-specific channel naming: all channels requested must be in the form `/{type}/{account id}/{project id}/{...}`, where `type` is one of `run`, `data`, `user`, `world`, or `chat`.
     *
     * **Example**
     *
     *      var cm = new F.manager.EpicenterChannelManager();
     *      var channel = cm.getChannel('/group/acme/supply-chain-game/');
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        if (options && typeof options !== 'object') {
            options = {
                base: options
            };
        }
        var channelOpts = $.extend({}, this.options, options);
        var base = channelOpts.base;
        if (!base) {
            throw new Error('No base topic was provided');
        }

        if (!channelOpts.allowAllChannels) {
            var baseParts = base.split('/');
            var channelType = baseParts[1];
            if (baseParts.length < 4) {
                //eslint-disable-line
                throw new Error('Invalid channel base name, it must be in the form /{type}/{account id}/{project id}/{...}');
            }
            if (!validTypes[channelType]) {
                throw new Error('Invalid channel type');
            }
        }
        return __super.getChannel.apply(this, arguments);
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [group](../../../glossary/#groups). The group must exist in the account (team) and project provided.
     *
     * There are no notifications from Epicenter on this channel; all messages are user-originated.
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var gc = cm.getGroupChannel();
     *     gc.subscribe('broadcasts', callback);
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} groupName (Optional) Group to broadcast to. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getGroupChannel: function (groupName) {
        var session = this.sessionManager.getMergedOptions(this.options);
        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/group', account, project, groupName].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithoutPresenceData = function (payload) {
                if (!isPresenceData(payload)) {
                    callback.call(context, payload);
                }
            };
            return oldsubs.call(channel, topic, callbackWithoutPresenceData, context, options);
        };
        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world The world object or id.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getWorldChannel: function (world, groupName) {
        var worldid = $.isPlainObject(world) && world.id ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var session = this.sessionManager.getMergedOptions(this.options);

        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/world', account, project, groupName, worldid].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        return Object(__WEBPACK_IMPORTED_MODULE_4__world_channel_subscribe_world_channel__["a" /* default */])(worldid, channel, session, {
            baseTopic: baseTopic,
            account: account,
            project: project
        });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the current [end user](../../../glossary/#users) in that user's current [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager). Note that this channel only gets notifications for worlds currently in memory. (See more background on [persistence](../../../run_persistence).)
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var userChannel = cm.getUserChannel(worldObject);
     *         userChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|{ id: string }} world World object or id.
     * @param  {String|Object} user (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getUserChannel: function (world, user, groupName) {
        var worldid = $.isPlainObject(world) && world.id ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var session = this.sessionManager.getMergedOptions(this.options);

        var userid = $.isPlainObject(user) && user.id ? user.id : user;
        userid = getFromSessionOrError(userid, 'userId', session);
        groupName = getFromSessionOrError(groupName, 'groupName', session);

        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/user', account, project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) that automatically tracks the presence of an [end user](../../../glossary/#users), that is, whether the end user is currently online in this group. Notifications are automatically sent when the end user comes online, and when the end user goes offline (not present for more than 2 minutes). Useful in multiplayer games for letting each end user know whether other users in their group are also online.
     *
     * Note that the presence channel is tracking all end users in a group. In particular, if the project additionally splits each group into [worlds](../world-manager/), this channel continues to show notifications for all end users in the group (not restricted by worlds).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var pc = cm.getPresenceChannel();
     *     pc.subscribe('', function (data) {
     *          // 'data' is the entire message object to the channel;
     *          // parse for information of interest
     *          if (data.data.subType === 'disconnect') {
     *               console.log('user ', data.data.user.userName, 'disconnected at ', data.data.date);
     *          }
     *          if (data.data.subType === 'connect') {
     *               console.log('user ', data.data.user.userName, 'connected at ', data.data.date);
     *          }
     *     });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} groupName (Optional) Group the end user is in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getPresenceChannel: function (groupName) {
        var session = this.sessionManager.getMergedOptions(this.options);
        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/group', account, project, groupName].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithOnlyPresenceData = function (payload) {
                if (isPresenceData(payload)) {
                    callback.call(context, payload);
                }
            };
            return oldsubs.call(channel, topic, callbackWithOnlyPresenceData, context, options);
        };
        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given collection. (The collection name is specified in the `root` argument when the [Data Service](../data-api-service/) is instantiated.) Must be one of the collections in this account (team) and project.
     *
     * There are automatic notifications from Epicenter on this channel when data is created, updated, or deleted in this collection. See more on [automatic messages to the data channel](../../../rest_apis/multiplayer/channel/#data-messages).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var dc = cm.getDataChannel('survey-responses');
     *     dc.subscribe('', function(data, meta) {
     *          console.log(data);
     *
     *          // meta.date is time of change,
     *          // meta.subType is the kind of change: new, update, or delete
     *          // meta.path is the full path to the changed data
     *          console.log(meta);
     *     });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} collection Name of collection whose automatic notifications you want to receive.
     * @return {Channel} Channel instance
     */
    getDataChannel: function (collection) {
        if (!collection) {
            throw new Error('Please specify a collection to listen on.');
        }

        var session = this.sessionManager.getMergedOptions(this.options);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);
        var baseTopic = ['/data', account, project, collection].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        //TODO: Fix after Epicenter bug is resolved
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithCleanData = function (payload) {
                var meta = {
                    path: payload.channel,
                    subType: payload.data.subType,
                    date: payload.data.date,
                    dataPath: payload.data.data.path
                };
                var actualData = payload.data.data;
                if (actualData.data !== undefined) {
                    //Delete notifications are one data-level behind of course
                    actualData = actualData.data;
                }

                callback.call(context, actualData, meta);
            };
            return oldsubs.call(channel, topic, callbackWithCleanData, context, options);
        };

        return channel;
    }
});

/* harmony default export */ __webpack_exports__["default"] = (EpicenterChannelManager);

/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_service_utils__ = __webpack_require__(5);
/**
 * 
 * ## Consensus Service
 *
 * The Consensus Service allows you to build common features in multiplayer games like:
 *
    - Delaying execution of an operation until all users within a world have 'submitted'
    - Enforcing timed 'rounds' within the game
    - Providing the model with default values for users who haven't submitted

    The consensus endpoint is scoped by world, and acts upon the current run in the world. 

        var wm = new F.manager.WorldManager({ model: 'mymodel.vmf' });
        wm.getCurrentWorld().then(function (world) {
            var cs = new F.service.Consensus({ 
                name: 'round-1',
                worldId: world.id
            });
            return cs;
        });
    
    You can optionally provide a `consensusGroup` parameter to group related consensus steps. For example:

        new F.service.Consensus({ 
            consensusGroup: 'round'
            name: '1',
            worldId: world.id
        });

    This allows you to use `F.service.ConsensusGroup` to list out/ delete all consensus points within that group for reporting.
 * 
 */



var API_ENDPOINT = 'multiplayer/consensus';

function normalizeActions(actions) {
    return [].concat(actions).map(function (action) {
        if (action.arguments) {
            return { execute: action };
        }
        return action;
    });
}
/* harmony default export */ __webpack_exports__["default"] = (function (config) {
    var defaults = {
        token: undefined,
        worldId: '',
        consensusGroup: '',
        name: ''
    };
    var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_1_service_service_utils__["b" /* getDefaultOptions */])(defaults, config);
    var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_1_service_service_utils__["d" /* getURLConfig */])(serviceOptions);
    var http = new __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__["default"](serviceOptions.transport);

    function getHTTPOptions(action, options) {
        var mergedOptions = $.extend(true, {}, serviceOptions, options);
        var consensusGroup = mergedOptions.consensusGroup || 'default';

        if (!mergedOptions.worldId || !mergedOptions.name) {
            throw new Error('Consensus Service: worldId and name are required');
        }
        var urlSegment = [].concat(action || [], [mergedOptions.worldId, consensusGroup, mergedOptions.name]).join('/');
        var baseURL = urlConfig.getAPIPath(API_ENDPOINT);
        var url = baseURL + urlSegment;

        var httpOptions = $.extend(true, {}, mergedOptions, { url: url });
        return httpOptions;
    }

    var publicAPI = {
        /**
         * Creates a new consensus point
         * 
         * **Example**
         *
         *      cs.create({
                    roles: ['P1', 'P2'],
                    defaultActions: {
                        P1: [{ name: 'submitPlayer1', arguments: [1] }],
                        P2: [{ name: 'submitPlayer2', arguments: [2] }],
                    },
                    ttlSeconds: 10
                }
         * 
         * @param  {object} params  creation options
         * @param  {string[]|{string: number}} params.roles
         * @param  {{string:object[]}} [params.defaultActions] Actions to take if the role specified in the key does not submit
         * @param  {number} [params.ttlSeconds] How long the consensus point lasts for - note you'll still have to explicitly call `forceClose` yourself after timer runs out
         * @param  {boolean} [params.executeActionsImmediately] Determines if actions are immediately sent to the server. If set to false, only the *last* action which completes the consensus will be passed on
         * @param  {object} [options] Overrides for service options
         * @return {Promise}
         */
        create: function (params, options) {
            var httpOptions = getHTTPOptions('', options);

            if (!params || !params.roles) {
                throw new Error('Consensus Service: no roles passed to create');
            }
            var postParams = Object.keys(params).reduce(function (accum, field) {
                var fieldVal = params[field];
                if (field === 'roles' && Array.isArray(fieldVal)) {
                    accum.roles = fieldVal.reduce(function (accum, role) {
                        accum[role] = 1;
                        return accum;
                    }, {});
                } else if (field === 'defaultActions') {
                    accum.actions = Object.keys(fieldVal).reduce(function (rolesAccum, roleName) {
                        rolesAccum[roleName] = normalizeActions(fieldVal[roleName]);
                        return rolesAccum;
                    }, {});
                } else {
                    accum[field] = fieldVal;
                }
                return accum;
            }, { roles: {} });
            return http.post(postParams, httpOptions);
        },

        /**
         * Update defaults set during create. Currently only updating defaultActions is supported.
         *
         * @param {{defaultActions: actions[]}} params Consensus defaults to override
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        updateDefaults: function (params, options) {
            if (!params || !params.defaultActions) {
                throw new Error('updateDefaults: Need to pass in parameters to update');
            }

            var httpOptions = getHTTPOptions('actions', options);
            return http.patch({
                actions: normalizeActions(params.defaultActions)
            }, httpOptions);
        },
        /**
         * Returns current consensus point
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        load: function (options) {
            var httpOptions = getHTTPOptions('', options);
            return http.get({}, httpOptions);
        },
        /**
         * Deletes current consensus point
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        delete: function (options) {
            var httpOptions = getHTTPOptions('', options);
            return http.delete({}, httpOptions);
        },
        /**
         * Marks current consensus point as complete. Default actions, if specified, will be sent for defaulting roles.
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        forceClose: function (options) {
            var httpOptions = getHTTPOptions('close', options);
            return http.post({}, httpOptions);
        },
        /**
         * Submits actions for your turn and marks you as having `submitted`. If `executeActionsImmediately` was set to `true` while creating the consensus point, the actions will be immediately sent to the model.
         * Note that you can still call operations from the RunService directly, but will bypass the consensus requirements.
         *
         * ** Example **
         *
                bp.submitActions([{ name: 'step', arguments: [] }]);
         *  
         * @param {object[]|{name: string, arguments: any[]}} actions Actions to send
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        submitActions: function (actions, options) {
            if (!actions || ![].concat(actions).length) {
                throw new Error('submitActions: No actions provided to submit');
            }
            var httpOptions = getHTTPOptions('actions', options);
            return http.post({
                actions: normalizeActions(actions)
            }, httpOptions);
        },
        /**
         * Reverts submission. Note if `executeActionsImmediately` was set to `true` while creating the consensus point the action will have already been passed on to the model.
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        undoSubmit: function (options) {
            var httpOptions = getHTTPOptions('actions', options);
            return http.delete({}, httpOptions);
        },

        /**
         * Returns current configuration
         *
         * @returns {object}
         */
        getCurrentConfig: function () {
            return serviceOptions;
        },

        getChannel: function (options) {}
    };
    return publicAPI;
});

/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ACTIONS; });
/* unused harmony export STRATEGY */
var ACTIONS = {
    CREATE: 'CREATE',
    START: 'START',
    PAUSE: 'PAUSE',
    RESUME: 'RESUME',
    COMPLETE: 'COMPLETE',
    RESET: 'RESET',
    TICK: 'TICK'
};

var STRATEGY = {
    START_BY_FIRST_USER: 'first-user',
    START_WHEN_ALL_USERS: 'all-users'
};

/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_run_strategies__ = __webpack_require__(38);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_run_strategies___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_managers_run_strategies__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__special_operations__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_run_api_service__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_run_api_service___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_service_run_api_service__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_store_session_manager__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_store_session_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_store_session_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_util_object_util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_managers_key_names__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_managers_key_names___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_managers_key_names__);
/**
* ## Run Manager
*
* The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../strategies/) for which runs end users of your project work with when they log in to your project.
*
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/) and the RESFTful [Run API](../../../rest_apis/aggregate_run_api). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified.
*
*
* ### Using the Run Manager to create and access runs
*
* To use the Run Manager, instantiate it by passing in:
*
*   * `run`: (required) Run object. Must contain:
*       * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
*       * `project`: Epicenter project id.
*       * `model`: The name of your primary model file. (See more on [Writing your Model](../../../writing_your_model/).)
*       * `scope`: (optional) Scope object for the run, for example `scope.group` with value of the name of the group.
*       * `server`: (optional) An object with one field, `host`. The value of `host` is the string `api.forio.com`, the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can optionally pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (See more on [Using External Data in Vensim](../../../model_code/vensim/vensim_example_xls/).)
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. This is *optional*; by default, the Run Manager selects `reuse-per-session`, or `reuse-last-initialized` if you also pass in an initial operation. See [below](#using-the-run-manager-to-access-and-register-strategies) for more information on strategies.
*
*   * `strategyOptions`: (optional) Additional options passed directly to the [run creation strategy](../strategies/).
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter. This can also be a function which returns a string, if you'd like to control this at runtime.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.
*
* **Example**
*
*       const rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'reuse-never',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is a run object
*               const thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*
* ### Using the Run Manager to access and register strategies
*
* The `strategy` for a Run Manager describes when to create a new run and when to reuse an end user's existing run. The Run Manager is responsible for passing a strategy everything it might need to determine the 'correct' run, that is, how to find the best existing run and how to decide when to create a new run.
*
* There are several common strategies provided as part of Epicenter.js, which you can list by accessing `F.manager.RunManager.strategies`. You can also create your own strategies, and register them to use with Run Managers. See [Run Manager Strategies](../strategies/) for details.
* 
*/



var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }










function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function (operation, params, options) {
        var reservedOps = Object.keys(__WEBPACK_IMPORTED_MODULE_1__special_operations__);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return __WEBPACK_IMPORTED_MODULE_1__special_operations__[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}

function sessionKeyFromOptions(options, runService) {
    var config = runService.getCurrentConfig();
    var sessionKey = $.isFunction(options.sessionKey) ? options.sessionKey(config) : options.sessionKey;
    return sessionKey;
}

function setRunInSession(sessionKey, run, sessionManager) {
    if (sessionKey) {
        delete run.variables;
        sessionManager.getStore().set(sessionKey, JSON.stringify(run));
    }
}

var RunManager = function () {
    function RunManager(options) {
        _classCallCheck(this, RunManager);

        var defaults = {
            sessionKey: function (config) {
                var baseKey = __WEBPACK_IMPORTED_MODULE_5_managers_key_names__["STRATEGY_SESSION_KEY"];
                var key = ['account', 'project', 'model'].reduce(function (accum, key) {
                    return config[key] ? accum + '-' + config[key] : accum;
                }, baseKey);
                return key;
            }
        };

        this.options = $.extend(true, {}, defaults, options);

        if (this.options.run instanceof __WEBPACK_IMPORTED_MODULE_2_service_run_api_service___default.a) {
            this.run = this.options.run;
        } else if (!Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["isEmpty"])(this.options.run)) {
            this.run = new __WEBPACK_IMPORTED_MODULE_2_service_run_api_service___default.a(this.options.run);
        } else {
            throw new Error('No run options passed to RunManager');
        }
        patchRunService(this.run, this);

        this.strategy = Object(__WEBPACK_IMPORTED_MODULE_0_managers_run_strategies__["getBestStrategy"])(this.options);
        this.sessionManager = new __WEBPACK_IMPORTED_MODULE_3_store_session_manager___default.a(this.options);
    }

    /**
     * Returns the run object for the 'correct' run. The correct run is defined by the strategy. 
     *
     * For example, if the strategy is `reuse-never`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `reuse-per-session`,
     * `getRun()` returns the run currently referenced in the browser cookie, and if there is none, creates a new run. 
     * See [Run Manager Strategies](../strategies/) for more on strategies.
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          const thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     *      rm.getRun(['sample_int']).then(function (run) {
     *         // an object whose fields are the name : value pairs of the variables passed to getRun()
     *         console.log(run.variables);
     *         // the value of sample_int
     *         console.log(run.variables.sample_int); 
     *      });
     *
     * @param {string[]} [variables] The run object is populated with the provided model variables, if provided. Note: `getRun()` does not throw an error if you try to get a variable which doesn't exist. Instead, the variables list is empty, and any errors are logged to the console.
     * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create) if the strategy does create a new run.
     * @return {Promise} Promise to complete the call.
     */


    _createClass(RunManager, [{
        key: 'getRun',
        value: function getRun(variables, options) {
            var me = this;
            var sessionStore = this.sessionManager.getStore();

            var sessionContents = sessionStore.get(sessionKeyFromOptions(this.options, me.run));
            var runSession = JSON.parse(sessionContents || '{}');

            if (runSession.runId) {
                //Legacy: EpiJS < 2.2 used runId as key, so maintain comptaibility. Remove at some future date (Summer `17?)
                runSession.id = runSession.runId;
            }

            var authSession = this.sessionManager.getSession();
            if (this.strategy.requiresAuth && Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["isEmpty"])(authSession)) {
                console.error('No user-session available', this.options.strategy, 'requires authentication.');
                return $.Deferred().reject({ type: 'UNAUTHORIZED', message: 'No user-session available' }).promise();
            }
            return this.strategy.getRun(this.run, authSession, runSession, options).then(function (run) {
                if (run && run.id) {
                    me.run.updateConfig({ filter: run.id });
                    var sessionKey = sessionKeyFromOptions(me.options, me.run);
                    setRunInSession(sessionKey, run, me.sessionManager);

                    if (variables && variables.length) {
                        return me.run.variables().query(variables).then(function (results) {
                            run.variables = results;
                            return run;
                        }).catch(function (err) {
                            run.variables = {};
                            console.error(err);
                            return run;
                        });
                    }
                }
                return run;
            });
        }

        /**
         * Returns the run object for a 'reset' run. The definition of a reset is defined by the strategy, but typically means forcing the creation of a new run. For example, `reset()` for the default strategies `reuse-per-session` and `reuse-last-initialized` both create new runs.
         *
         *  **Example**
         *
         *      rm.reset().then(function (run) {
         *          // use the (new) run object
         *          const thisRunId = run.id;
         *
         *          // use the Run Service object
         *          rm.run.do('runModel');
         *      });
         *
         * **Parameters**
         * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create).
         * @return {Promise}
         */

    }, {
        key: 'reset',
        value: function reset(options) {
            var me = this;
            var authSession = this.sessionManager.getSession();
            if (this.strategy.requiresAuth && Object(__WEBPACK_IMPORTED_MODULE_4_util_object_util__["isEmpty"])(authSession)) {
                console.error('No user-session available', this.options.strategy, 'requires authentication.');
                return $.Deferred().reject({ type: 'UNAUTHORIZED', message: 'No user-session available' }).promise();
            }
            return this.strategy.reset(this.run, authSession, options).then(function (run) {
                if (run && run.id) {
                    me.run.updateConfig({ filter: run.id });
                    var sessionKey = sessionKeyFromOptions(me.options, me.run);
                    setRunInSession(sessionKey, run.id, me.sessionManager);
                }
                return run;
            });
        }
    }]);

    return RunManager;
}();

RunManager.strategies = __WEBPACK_IMPORTED_MODULE_0_managers_run_strategies___default.a;
/* harmony default export */ __webpack_exports__["default"] = (RunManager);

/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = {"version":"v2"}

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var _require = __webpack_require__(4),
    omit = _require.omit;

var _require2 = __webpack_require__(6),
    toQueryFormat = _require2.toQueryFormat;

module.exports = function (config) {

    var defaults = {
        url: '',

        contentType: 'application/json',
        headers: {},
        statusCode: {
            404: $.noop
        },

        /**
         * ONLY for strings in the url. All GET & DELETE params are run through this
         * @type {Function}
         */
        parameterParser: toQueryFormat,

        // To allow epicenter.token and other session cookies to be passed
        // with the requests
        xhrFields: {
            withCredentials: true
        }
    };

    var transportOptions = $.extend({}, defaults, config);

    var result = function (d) {
        return $.isFunction(d) ? d() : d;
    };

    var connect = function (method, params, connectOptions) {
        params = result(params);
        params = $.isPlainObject(params) || Array.isArray(params) ? JSON.stringify(params) : params;

        var options = $.extend(true, {}, transportOptions, connectOptions, {
            method: method,
            data: params
        });
        var ALLOWED_TO_BE_FUNCTIONS = ['data', 'url'];
        $.each(options, function (key, value) {
            if ($.isFunction(value) && ALLOWED_TO_BE_FUNCTIONS.indexOf(key) !== -1) {
                options[key] = value();
            }
        });

        if (options.logLevel && options.logLevel === 'DEBUG') {
            console.log(options.url);
            var oldSuccessFn = options.success || $.noop;
            options.success = function (response, ajaxStatus, ajaxReq) {
                console.log(response);
                oldSuccessFn.apply(this, arguments);
            };
        }

        var beforeSend = options.beforeSend;
        options.beforeSend = function (xhr, settings) {
            xhr.requestUrl = (connectOptions || {}).url;
            if (beforeSend) {
                beforeSend.apply(this, arguments);
            }
        };

        //These params mean affect jQuery behavior, and may be passed in inadvertently since all the different options are merged together
        //FIXME: Do not merge with service options and we won't have this problem
        var paramsToIgnore = ['password', 'username', 'isLocal', 'type'];
        var cleaned = omit(options, paramsToIgnore);

        //Legacy: jquery .then resolves with 3 different response values, which makes $.when return an array.  remove in 3.0
        return $.ajax(cleaned);
    };

    var publicAPI = {
        get: function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            return connect.call(this, 'GET', params, options);
        },
        splitGet: function () {},
        post: function () {
            return connect.apply(this, ['post'].concat([].slice.call(arguments)));
        },
        patch: function () {
            return connect.apply(this, ['patch'].concat([].slice.call(arguments)));
        },
        put: function () {
            return connect.apply(this, ['put'].concat([].slice.call(arguments)));
        },
        delete: function (params, ajaxOptions) {
            //DELETE doesn't support body params, but jQuery thinks it does.
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            if ($.trim(params)) {
                var delimiter = result(options.url).indexOf('?') === -1 ? '?' : '&';
                options.url = result(options.url) + delimiter + params;
            }
            return connect.call(this, 'DELETE', null, options);
        },
        head: function () {
            return connect.apply(this, ['head'].concat([].slice.call(arguments)));
        },
        options: function () {
            return connect.apply(this, ['options'].concat([].slice.call(arguments)));
        }
    };

    return $.extend(this, publicAPI);
};

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 *
 * ## Variables API Service
 *
 * Used in conjunction with the [Run API Service](../run-api-service/) to read, write, and search for specific model variables.
 *
 *     var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *      });
 *     rm.getRun()
 *       .then(function() {
 *          var vs = rm.run.variables();
 *          vs.save({sample_int: 4});
 *        });
 *
 */



var TransportFactory = __webpack_require__(0).default;
var rutil = __webpack_require__(8);

module.exports = function (config) {
    var defaults = {
        /**
         * The runs object to which the variable filters apply. Defaults to null.
         * @type {runService}
         */
        runService: null
    };
    var serviceOptions = $.extend({}, defaults, config);

    var getURL = function () {
        //TODO: Replace with getCurrentconfig instead?
        return serviceOptions.runService.urlConfig.getFilterURL() + 'variables/';
    };

    var addAutoRestoreHeader = function (options) {
        return serviceOptions.runService.urlConfig.addAutoRestoreHeader(options);
    };

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);
    http.splitGet = rutil.splitGetFactory(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int')
         *          .then(function(val){
         *              // val contains the value of sample_int
         *          });
         *
         * **Parameters**
         * @param {String} variable Name of variable to load.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        load: function (variable, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = addAutoRestoreHeader(httpOptions);
            return http.get(outputModifier, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales'])
         *          .then(function(val) {
         *              // val is an object with the values of the requested variables: val.price, val.sales
         *          });
         *
         *      vs.query({ include:['price', 'sales'] });
         *
         * **Parameters**
         * @param {Object|Array} query The names of the variables requested.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = addAutoRestoreHeader(httpOptions);

            if (Array.isArray(query)) {
                query = { include: query };
            }
            $.extend(query, outputModifier);
            return http.splitGet(query, httpOptions);
        },

        /**
         * Save values to model variables. Overwrites existing values. Note that you can only update model variables if the run is [in memory](../../../run_persistence/#runs-in-memory). (An alternate way to update model variables is to call a method from the model and make sure that the method persists the variables. See `do`, `serial`, and `parallel` in the [Run API Service](../run-api-service/) for calling methods from the model.)
         *
         * **Example**
         *
         *      vs.save('price', 4);
         *      vs.save({ price: 4, quantity: 5, products: [2,3,4] });
         *
         * **Parameters**
         * @param {Object|String} variable An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} val (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        save: function (variable, val, options) {
            var attrs;
            if (typeof variable === 'object') {
                attrs = variable;
                options = val;
            } else {
                (attrs = {})[variable] = val;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.patch.call(this, attrs, httpOptions);
        }

        // Not Available until underlying API supports PUT. Otherwise save would be PUT and merge would be PATCH
        // *
        //  * Save values to the api. Merges arrays, but otherwise same as save
        //  * @param {Object|String} variable Object with attributes, or string key
        //  * @param {Object} val Optional if prev parameter was a string, set value here
        //  * @param {Object} options Overrides for configuration options
        //  *
        //  * @example
        //  *     vs.merge({ price: 4, quantity: 5, products: [2,3,4] })
        //  *     vs.merge('price', 4);

        // merge: function (variable, val, options) {
        //     var attrs;
        //     if (typeof variable === 'object') {
        //       attrs = variable;
        //       options = val;
        //     } else {
        //       (attrs = {})[variable] = val;
        //     }
        //     var httpOptions = $.extend(true, {}, serviceOptions, options);

        //     return http.patch.call(this, attrs, httpOptions);
        // }
    };
    $.extend(this, publicAPI);
};

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 *
 * ## Introspection API Service
 *
 * The Introspection API Service allows you to view a list of the variables and operations in a model. Typically used in conjunction with the [Run API Service](../run-api-service/).
 *
 * The Introspection API Service is not available for Forio SimLang.
 *
 *       var intro = new F.service.Introspect({
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game'
 *       });
 *       intro.byModel('supply-chain.py').then(function(data){ ... });
 *       intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6').then(function(data){ ... });
 *
 */



var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var SessionManager = __webpack_require__(1);

var apiEndpoint = 'model/introspect';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined

    };

    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters, such as `files`.
         *
         * **Example**
         *
         *      intro.byModel('abc.vmf')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} modelFile Name of the model file to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byModel: function (modelFile, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            if (!opts.account || !opts.project) {
                throw new Error('Account and project are required when using introspect#byModel');
            }
            if (!modelFile) {
                throw new Error('modelFile is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + [opts.account, opts.project, modelFile].join('/') };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        },

        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters such as `files`.
         *
         * **Example**
         *
         *      intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} runID Id of the run to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byRunID: function (runID, options) {
            if (!runID) {
                throw new Error('runID is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + runID };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        }
    };
    $.extend(this, publicAPI);
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
    Decides type of store to provide
*/


// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');

var store = __webpack_require__(26);

module.exports = store;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({ root: 'people' });
        people
            .save({lastName: 'smith' })

 */



// Thin document.cookie wrapper to allow unit testing

var Cookie = function () {
    this.get = function () {
        return document.cookie;
    };

    this.set = function (newCookie) {
        document.cookie = newCookie;
    };
};

module.exports = function (config) {
    var host = window.location.hostname;
    var validHost = host.split('.').length > 1;
    var domain = validHost ? '.' + host : null;

    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: domain,
        cookie: new Cookie()
    };
    this.serviceOptions = $.extend({}, defaults, config);

    var publicAPI = {
        // * TBD
        //  * Query collection; uses MongoDB syntax
        //  * @see  <TBD: Data API URL>
        //  *
        //  * @param { string} qs Query Filter
        //  * @param { string} limiters @see <TBD: url for limits, paging etc>
        //  *
        //  * @example
        //  *     cs.query(
        //  *      { name: 'John', className: 'CSC101' },
        //  *      {limit: 10}
        //  *     )

        // query: function (qs, limiters) {

        // },

        /**
         * Save cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         * @param {Object} options Overrides for service options
         *
         * @return {*} The saved value
         *
         * @example
         *     cs.set('person', { firstName: 'john', lastName: 'smith' });
         *     cs.set({ name:'smith', age:'32' });
         */
        set: function (key, value, options) {
            var setOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;
            var cookie = setOptions.cookie;

            cookie.set(encodeURIComponent(key) + '=' + encodeURIComponent(value) + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : ''));

            return value;
        },

        /**
         * Load cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @return {*} The value stored
         *
         * @example
         *     cs.get('person');
         */
        get: function (key) {
            var cookie = this.serviceOptions.cookie;
            var cookieReg = new RegExp('(?:^|;)\\s*' + encodeURIComponent(key).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$');
            var res = cookieReg.exec(cookie.get());
            var val = res ? decodeURIComponent(res[1]) : null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @param {object} options (optional) overrides for service options
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;
            var cookie = remOptions.cookie;

            cookie.set(encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : ''));
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var cookie = this.serviceOptions.cookie;
            var aKeys = cookie.get().replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(cookieKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};

/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_service_utils__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__data_service_scope_utils__ = __webpack_require__(46);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_managers_epicenter_channel_manager__ = __webpack_require__(17);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ## Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, there are three required parameters when you instantiate the Data Service:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 * * `root`: The the name of the collection. If you have multiple collections within each of your projects, you can also pass the collection name as an option for each call.
 *
 *       var ds = new F.service.Data({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          root: 'survey-responses',
 *          server: { host: 'api.forio.com' }
 *       });
 *       ds.saveAs('user1',
 *          { 'question1': 2, 'question2': 10,
 *          'question3': false, 'question4': 'sometimes' } );
 *       ds.saveAs('user2',
 *          { 'question1': 3, 'question2': 8,
 *          'question3': true, 'question4': 'always' } );
 *       ds.query('',{ 'question2': { '$gt': 9} });
 *
 * Note that in addition to the `account`, `project`, and `root`, the Data Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 */








var API_ENDPOINT = 'data';
var getAPIURL = __WEBPACK_IMPORTED_MODULE_2__data_service_scope_utils__["c" /* getURL */].bind(null, API_ENDPOINT);

var DataService = function () {
    function DataService(config) {
        _classCallCheck(this, DataService);

        var defaults = {
            /**
             * Name of collection. Required. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`, but must be set to a collection name.
             * @type {String}
             */
            root: '/',
            /**
             * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            account: undefined,
            /**
             * The project id. Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            project: undefined,
            /**
             * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
             * @see [Authentication API Service](../auth-api-service/) for getting tokens.
             * @type {String}
             */
            token: undefined,

            scope: __WEBPACK_IMPORTED_MODULE_2__data_service_scope_utils__["a" /* SCOPES */].CUSTOM,

            //Options to pass on to the underlying transport layer
            transport: {}
        };
        var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_1_service_service_utils__["b" /* getDefaultOptions */])(defaults, config, { apiEndpont: API_ENDPOINT });

        this.serviceOptions = serviceOptions;
        this.http = new __WEBPACK_IMPORTED_MODULE_0_transport_http_transport_factory__["default"](serviceOptions.transport);
    }

    /**
     * Search for data within a collection.
     *
     * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional details.
     *
     * **Examples**
     *
     *      // request all data associated with document 'user1'
     *      ds.query('user1');
     *
     *      // exact matching:
     *      // request all documents in collection where 'question2' is 9
     *      ds.query('', { 'question2': 9});
     *
     *      // comparison operators:
     *      // request all documents in collection
     *      // where 'question2' is greater than 9
     *      ds.query('', { 'question2': { '$gt': 9} });
     *
     *      // logical operators:
     *      // request all documents in collection
     *      // where 'question2' is less than 10, and 'question3' is false
     *      ds.query('', { '$and': [ { 'question2': { '$lt':10} }, { 'question3': false }] });
     *
     *      // regular expresssions: use any Perl-compatible regular expressions
     *      // request all documents in collection
     *      // where 'question5' contains the string '.*day'
     *      ds.query('', { 'question5': { '$regex': '.*day' } });
     *
     * **Parameters**
     * @param {String} key The name of the document to search. Pass the empty string ('') to search the entire collection.
     * @param {Object} query The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional examples.
     * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
     * @param {Object} [options] Overrides for configuration options.
     * @return {Promise}
     */


    _createClass(DataService, [{
        key: 'query',
        value: function query(key, _query, outputModifier, options) {
            var params = $.extend(true, { q: _query }, outputModifier);
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            mergedOptions.url = getAPIURL(mergedOptions.root, key, mergedOptions);
            return this.http.get(params, mergedOptions);
        }
        /**
         * Save data in an anonymous document within the collection.
         *
         * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `save` call explicitly by overriding the options (third parameter).
         *
         * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `save` method is making a `POST` request.)
         *
         * **Example**
         *
         *      // Create a new document, with one element, at the default root level
         *      ds.save('question1', 'yes');
         *
         *      // Create a new document, with two elements, at the default root level
         *      ds.save({ question1:'yes', question2: 32 });
         *
         *      // Create a new document, with two elements, at `/students/`
         *      ds.save({ name:'John', className: 'CS101' }, { root: 'students' });
         *
         * **Parameters**
         *
         * @param {String|Object} key If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
         * @param {Object} [value] The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
         * @param {Object} [options] Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
         * @return {Promise}
         */

    }, {
        key: 'save',
        value: function save(key, value, options) {
            var attrs;
            if (typeof key === 'object') {
                attrs = key;
                options = value;
            } else {
                (attrs = {})[key] = value;
            }

            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            mergedOptions.url = getAPIURL(mergedOptions.root, '', mergedOptions);
            return this.http.post(attrs, mergedOptions);
        }

        /**
         * Append value to key
         * @param  {string} key     path to array item
         * @param  {any} val     value to append to array
         * @param  {object} [options] Overrides for configuration options
         * @return {Promise}
         */

    }, {
        key: 'pushToArray',
        value: function pushToArray(key, val, options) {
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            mergedOptions.url = getAPIURL(mergedOptions.root, key, mergedOptions);
            return this.http.post(val, mergedOptions);
        }

        /**
         * Save (create or replace) data in a named document or element within the collection.
         *
         * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `saveAs` call explicitly by overriding the options (third parameter).
         *
         * Optionally, the named document or element can include path information, so that you are saving just part of the document.
         *
         * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `saveAs` method is making a `PUT` request.)
         *
         * **Example**
         *
         *      // Create (or replace) the `user1` document at the default root level.
         *      // Note that this replaces any existing content in the `user1` document.
         *      ds.saveAs('user1',
         *          { 'question1': 2, 'question2': 10,
         *           'question3': false, 'question4': 'sometimes' } );
         *
         *      // Create (or replace) the `student1` document at the `students` root,
         *      // that is, the data at `/students/student1/`.
         *      // Note that this replaces any existing content in the `/students/student1/` document.
         *      // However, this will keep existing content in other paths of this collection.
         *      // For example, the data at `/students/student2/` is unchanged by this call.
         *      ds.saveAs('student1',
         *          { firstName: 'john', lastName: 'smith' },
         *          { root: 'students' });
         *
         *      // Create (or replace) the `mgmt100/groupB` document at the `myclasses` root,
         *      // that is, the data at `/myclasses/mgmt100/groupB/`.
         *      // Note that this replaces any existing content in the `/myclasses/mgmt100/groupB/` document.
         *      // However, this will keep existing content in other paths of this collection.
         *      // For example, the data at `/myclasses/mgmt100/groupA/` is unchanged by this call.
         *      ds.saveAs('mgmt100/groupB',
         *          { scenarioYear: '2015' },
         *          { root: 'myclasses' });
         *
         * **Parameters**
         *
         * @param {String} key Id of the document.
         * @param {Object} [value] The data to save, in key:value pairs.
         * @param {Object} [options] Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
         * @return {Promise}
         */

    }, {
        key: 'saveAs',
        value: function saveAs(key, value, options) {
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            mergedOptions.url = getAPIURL(mergedOptions.root, key, mergedOptions);
            return this.http.put(value, mergedOptions);
        }
        /**
         * Get data for a specific document or field.
         *
         * **Example**
         *
         *      ds.load('user1');
         *      ds.load('user1/question3');
         *
         * **Parameters**
         * @param  {String|Object} key The id of the data to return. Can be the id of a document, or a path to data within that document.
         * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */

    }, {
        key: 'load',
        value: function load(key, outputModifier, options) {
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            mergedOptions.url = getAPIURL(mergedOptions.root, key, mergedOptions);
            return this.http.get(outputModifier, mergedOptions);
        }
        /**
         * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
         *
         * **Example**
         *
         *     ds.remove('user1');
         *
         *
         * **Parameters**
         *
         * @param {String|Array} keys The id of the document to remove from this collection, or an array of such ids.
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */

    }, {
        key: 'remove',
        value: function remove(keys, options) {
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            var params;
            if (Array.isArray(keys)) {
                params = { id: keys };
                mergedOptions.url = getAPIURL(mergedOptions.root, '', mergedOptions);
            } else {
                params = '';
                mergedOptions.url = getAPIURL(mergedOptions.root, keys, mergedOptions);
            }
            return this.http.delete(params, mergedOptions);
        }

        /**
         * Returns the internal collection name (with scope)
         *
         * @param {object} session Group/User info to add to scope. Gets it from current session otherwise
         * @param {Object} [options] Overrides for configuration options.
         * @return {string} Scoped collection name
         */

    }, {
        key: 'getScopedName',
        value: function getScopedName(session, options) {
            var opts = $.extend(true, {}, this.serviceOptions, options);
            var collName = opts.root.split('/')[0];
            var scopedCollName = Object(__WEBPACK_IMPORTED_MODULE_2__data_service_scope_utils__["b" /* getScopedName */])(collName, opts.scope, session);
            return scopedCollName;
        }

        /**
         * Gets a channel to listen to notifications on for this collection
         * 
         * @param {Object} [options] Overrides for configuration options.
         * @return {Channnel} channel to subscribe on
         */

    }, {
        key: 'getChannel',
        value: function getChannel(options) {
            var opts = $.extend(true, {}, this.serviceOptions, options);
            var scopedCollName = this.getScopedName(opts);
            var cm = new __WEBPACK_IMPORTED_MODULE_3_managers_epicenter_channel_manager__["default"](opts);
            return cm.getDataChannel(scopedCollName);
        }
        // Epicenter doesn't allow nuking collections
        //     /**
        //      * Removes collection being referenced
        //      * @return null
        //      */
        //     destroy(options) {
        //         return this.remove('', options);
        //     }

    }]);

    return DataService;
}();

DataService.SCOPES = __WEBPACK_IMPORTED_MODULE_2__data_service_scope_utils__["a" /* SCOPES */];

/* harmony default export */ __webpack_exports__["default"] = (DataService);

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 *
 * ## Authentication API Service
 *
 * The Authentication API Service provides a method for logging in, which creates and returns a user access token.
 *
 * User access tokens are required for each call to Epicenter. (See [Project Access](../../../project_access/) for more information.)
 *
 * If you need additional functionality -- such as tracking session information, easily retrieving the user token, or getting the groups to which an end user belongs -- consider using the [Authorization Manager](../auth-manager/) instead.
 *
 *      var auth = new F.service.Auth();
 *      auth.login({ userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd' });
 */



var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;

module.exports = function (config) {
    var defaults = {
        /**
         * Email or username to use for logging in. Defaults to empty string.
         * @type {String}
         */
        userName: '',

        /**
         * Password for specified `userName`. Defaults to empty string.
         * @type {String}
         */
        password: '',

        /**
         * The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects). Required if the `userName` is for an [end user](../../../glossary/#users). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('authentication')
    });
    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
         * Logs user in, returning the user access token.
         *
         * If no `userName` or `password` were provided in the initial configuration options, they are required in the `options` here. If no `account` was provided in the initial configuration options and the `userName` is for an [end user](../../../glossary/#users), the `account` is required as well.
         *
         * **Example**
         *
         *      auth.login({
         *          userName: 'jsmith',
         *          password: 'passw0rd',
         *          account: 'acme-simulations' })
         *      .then(function (token) {
         *          console.log("user access token is: ", token.access_token);
         *      });
         *
         * **Parameters**
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        login: function (options) {
            var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);
            if (!httpOptions.userName || !httpOptions.password) {
                var resp = { status: 401, statusMessage: 'No username or password specified.' };
                if (options.error) {
                    options.error.call(this, resp);
                }

                return $.Deferred().reject(resp).promise();
            }

            var postParams = {
                userName: httpOptions.userName,
                password: httpOptions.password
            };
            if (httpOptions.account) {
                //pass in null for account under options if you don't want it to be sent
                postParams.account = httpOptions.account;
            }

            return http.post(postParams, httpOptions);
        },

        // (replace with /* */ comment block, to make visible in docs, once this is more than a noop)
        //
        // Logs user out from specified accounts.
        //
        // Epicenter logout is not implemented yet, so for now this is a dummy promise that gets automatically resolved.
        //
        // **Example**
        //
        //      auth.logout();
        //
        // **Parameters**
        // @param {Object} `options` (Optional) Overrides for configuration options.
        //
        logout: function (options) {
            var dtd = $.Deferred();
            dtd.resolve();
            return dtd.promise();
        }
    };

    $.extend(this, publicAPI);
};

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 *
 * ## Member API Adapter
 *
 * The Member API Adapter provides methods to look up information about end users for your project and how they are divided across groups. It is based on query capabilities of the underlying RESTful [Member API](../../../rest_apis/user_management/member/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). For example, if some of your end users are facilitators, or if your end users should be treated differently based on which group they are in, use the Member API to find that information.
 *
 *      var ma = new F.service.Member({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      ma.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */



var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var SessionManager = __webpack_require__(1);
var _pick = __webpack_require__(4).pick;
var apiEndpoint = 'member/local';

module.exports = function (config) {
    var defaults = {
        /**
         * Epicenter user id. Defaults to a blank string.
         * @type {string}
         */
        userId: undefined,

        /**
         * Epicenter group id. Defaults to a blank string. Note that this is the group *id*, not the group *name*.
         * @type {string}
         */
        groupId: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions, serviceOptions);

    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, serviceOptions, params);
        }
        return serviceOptions;
    };

    var patchUserActiveField = function (params, active, options) {
        var httpOptions = $.extend(true, serviceOptions, options, {
            url: urlConfig.getAPIPath(apiEndpoint) + params.groupId + '/' + params.userId
        });

        return http.patch({ active: active }, httpOptions);
    };

    var publicAPI = {

        /**
        * Retrieve details about all of the group memberships for one end user. The membership details are returned in an array, with one element (group record) for each group to which the end user belongs.
        *
        * In the membership array, each group record includes the group id, project id, account (team) id, and an array of members. However, only the user whose userId is included in the call is listed in the members array (regardless of whether there are other members in this group).
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupsForUser('42836d4b-5b61-4fe4-80eb-3136e956ee5c')
        *           .then(function(memberships){
        *               for (var i=0; i<memberships.length; i++) {
        *                   console.log(memberships[i].groupId);
        *               }
        *           });
        *
        *       ma.getGroupsForUser({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c' });
        *
        * **Parameters**
        * @param {string|object} params The user id for the end user. Alternatively, an object with field `userId` and value the user id.
        * @param {object} options (Optional) Overrides for configuration options.
        */

        getGroupsForUser: function (params, options) {
            options = options || {};
            var httpOptions = $.extend(true, serviceOptions, options);
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.userId) {
                throw new Error('No userId specified.');
            }

            var getParms = isString ? { userId: params } : _pick(objParams, 'userId');
            return http.get(getParms, httpOptions);
        },

        /**
        * Retrieve details about one group, including an array of all its members.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupDetails('80257a25-aa10-4959-968b-fd053901f72f')
        *           .then(function(group){
        *               for (var i=0; i<group.members.length; i++) {
        *                   console.log(group.members[i].userName);
        *               }
        *           });
        *
        *       ma.getGroupDetails({ groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {string|object} params The group id. Alternatively, an object with field `groupId` and value the group id.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroupDetails: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupId) {
                throw new Error('No groupId specified.');
            }

            var groupId = isString ? params : objParams.groupId;
            var httpOptions = $.extend(true, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + groupId });

            return http.get({}, httpOptions);
        },

        /**
        * Set a particular end user as `active`. Active end users can be assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserActive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make active.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become active.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserActive: function (params, options) {
            return patchUserActiveField(params, true, options);
        },

        /**
        * Set a particular end user as `inactive`. Inactive end users are not assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserInactive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make inactive.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become inactive.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserInactive: function (params, options) {
            return patchUserActiveField(params, false, options);
        }
    };

    $.extend(this, publicAPI);
};

/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_service_utils__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_object_assign__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_object_assign___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_object_assign__);
/**
 *
 * ## Group API Adapter
 *
 * The Group API Adapter provides methods to look up, create, change or remove information about groups in a project. It is based on query capabilities of the underlying RESTful [Group API](../../../rest_apis/user_management/group/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var ma = new F.service.Group({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForProject({ account: 'acme', project: 'sample' });
 */





var apiEndpoint = 'group/local';

var GroupService = function (config) {
    var defaults = {
        /**
         * Epicenter account name. Defaults to undefined.
         * @type {string}
         */
        account: undefined,

        /**
         * Epicenter project name. Defaults to undefined.
         * @type {string}
         */
        project: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_0_service_service_utils__["b" /* getDefaultOptions */])(defaults, config, { apiEndpoint: apiEndpoint });
    var transportOptions = serviceOptions.transport;
    delete serviceOptions.transport;
    var http = new __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__["default"](transportOptions, serviceOptions);
    var publicAPI = {
        /**
        * Gets information for a group or multiple groups.
        * @param {Object} params object with query parameters
        * @patam {string} params.q partial match for name, organization or event.
        * @patam {string} params.account Epicenter's Team ID
        * @patam {string} params.project Epicenter's Project ID
        * @patam {string} params.name Epicenter's Group Name
        * @param {Object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroups: function (params, options) {
            //groupID is part of the URL
            //q, account and project are part of the query string
            var finalOpts = __WEBPACK_IMPORTED_MODULE_2_object_assign___default()({}, serviceOptions, options);
            var finalParams;
            if (typeof params === 'string') {
                finalOpts.url = Object(__WEBPACK_IMPORTED_MODULE_0_service_service_utils__["a" /* getApiUrl */])(apiEndpoint + '/' + params, finalOpts);
            } else {
                finalParams = params;
            }
            return http.get(finalParams, finalOpts);
        }
    };
    __WEBPACK_IMPORTED_MODULE_2_object_assign___default()(this, publicAPI);
};

/* harmony default export */ __webpack_exports__["default"] = (GroupService);

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * ## Channel Service
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) directly. The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use.
 *
 * The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. See [Including Epicenter.js](../../#include).
 *
 * To use the Channel Service, instantiate it, then make calls to any of the methods you need.
 *
 *        var cs = new F.service.Channel();
 *        cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
 *
 * If you are working through the [Epicenter Channel Manager](../epicenter-channel-manager/), when you ask to "get" a particular channel, you are really asking for an instance of the Channel Service with a topic already set, for example to the appropriate group or world:
 *
 *      var cm = new F.manager.ChannelManager();
 *      var gc = cm.getGroupChannel();
 *      // because we used an Epicenter Channel Manager to get the group channel,
 *      // subscribe() and publish() here default to the base topic for the group
 *      gc.subscribe('', function(data) { console.log(data); });
 *      gc.publish('', { message: 'a new message to the group' });
 *
 * The parameters for instantiating a Channel Service include:
 *
 * * `options` The options object to configure the Channel Service.
 * * `options.base` The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
 * * `options.topicResolver` A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. Returns a String. By default, it just echoes the topic.
 * * `options.transport` The instance of `$.cometd` to hook onto. See http://docs.cometd.org/reference/javascript.html for additional background on cometd.
 */



var Channel = function (options) {
    var defaults = {

        /**
         * The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
         * @type {string}
         */
        base: '',

        /**
         * A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. By default, it just echoes the topic.
         *
         * **Parameters**
         *
         * * `topic` Topic to parse.
         *
         * **Return Value**
         *
         * * *String*: This function should return a string topic.
         *
         * @type {function}
         * @param {String} topic topic to resolve
         * @return {String}
         */
        topicResolver: function (topic) {
            return topic;
        },

        /**
         * The instance of `$.cometd` to hook onto.
         * @type {object}
         */
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? channelName + '/' + topic : topic).replace(/\/\//g, '/').replace(/\/$/, '');
    return newName;
};

Channel.prototype = $.extend(Channel.prototype, {

    // future functionality:
    //      // Set the context for the callback
    //      cs.subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body);
    //
    //      // Control the order of operations by setting the `priority`
    //      cs.subscribe('run', cb, this, {priority: 9});
    //
    //      // Only execute the callback, `cb`, if the value of the `price` variable is 50
    //      cs.subscribe('run/variables/price', cb, this, {priority: 30, value: 50});
    //
    //      // Only execute the callback, `cb`, if the value of the `price` variable is greater than 50
    //      subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'});
    //
    //      // Only execute the callback, `cb`, if the value of the `price` variable is even
    //      subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 === 0}});


    /**
     * Subscribe to changes on a topic.
     *
     * The topic should include the full path of the account id (**Team ID** for team projects), project id, and group name. (In most cases, it is simpler to use the [Epicenter Channel Manager](../epicenter-channel-manager/) instead, in which case this is configured for you.)
     *
     *  **Examples**
     *
     *      var cb = function(val) { console.log(val.data); };
     *
     *      // Subscribe to changes on a top-level 'run' topic
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run', cb);
     *
     *      // Subscribe to changes on children of the 'run' topic. Note this will also be triggered for changes to run.x.y.z.
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/*', cb);
     *
     *      // Subscribe to changes on both the top-level 'run' topic and its children
     *      cs.subscribe(['/acme-simulations/supply-chain-game/fall-seminar/run',
     *          '/acme-simulations/supply-chain-game/fall-seminar/run/*'], cb);
     *
     *      // Subscribe to changes on a particular variable
     *      subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/variables/price', cb);
     *
     *
     * **Return Value**
     *
     * * *String* Returns a token you can later use to unsubscribe.
     *
     * **Parameters**
     * @param  {String|Array}   topic    List of topics to listen for changes on.
     * @param  {Function} callback Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   context  Context in which the `callback` is executed.
     * @param  {Object}   options  (Optional) Overrides for configuration options.
     * @param  {Number}   options.priority  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|Number|Function}   options.value The `callback` is only triggered if this condition matches. See examples for details.
     * @return {string} Subscription ID
     */
    subscribe: function (topic, callback, context, options) {

        var topics = [].concat(topic);
        var me = this;
        var subscriptionIds = [];
        var opts = me.channelOptions;

        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                subscriptionIds.push(opts.transport.subscribe(topic, callback));
            });
        });
        return subscriptionIds[1] ? subscriptionIds : subscriptionIds[0];
    },

    /**
     * Publish data to a topic.
     *
     * **Examples**
     *
     *      // Send data to all subscribers of the 'run' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run', { completed: false });
     *
     *      // Send data to all subscribers of the 'run/variables' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
     *
     * **Parameters**
     *
     * @param  {String} topic Topic to publish to.
     * @param  {*} data  Data to publish to topic.
     * @return {Array | Object} Responses to published data
     *
     */
    publish: function (topic, data) {
        var topics = [].concat(topic);
        var me = this;
        var returnObjs = [];
        var opts = me.channelOptions;

        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                if (topic.charAt(topic.length - 1) === '*') {
                    topic = topic.replace(/\*+$/, '');
                    console.warn('You can cannot publish to channels with wildcards. Publishing to ', topic, 'instead');
                }
                returnObjs.push(opts.transport.publish(topic, data));
            });
        });
        return returnObjs[1] ? returnObjs : returnObjs[0];
    },

    /**
     * Unsubscribe from changes to a topic.
     *
     * **Example**
     *
     *      cs.unsubscribe('sampleToken');
     *
     * **Parameters**
     * @param  {String} token The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     * @return {Object} reference to current instance
     */
    unsubscribe: function (token) {
        this.channelOptions.transport.unsubscribe(token);
        return this;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }

});

module.exports = Channel;

/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_service_utils__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__ = __webpack_require__(0);
/**
 *
 * ## Presence API Service
 *
 * The Presence API Service provides methods to get and set the presence of an end user in a project, that is, to indicate whether the end user is online. This happens automatically: in projects that use [channels](../epicenter-channel-manager/), the end user's presence is published automatically on a "presence" channel that is specific to each group. You can also use the Presence API Service to do this explicitly: you can make a call to indicate that a particular end user is online or offline. 
 *
 * The Presence API Service is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). It is typically used only in multiplayer projects, to facilitate end users communicating with each other. It is based on the query capabilities of the underlying RESTful [Presence API](../../../rest_apis/multiplayer/presence/).
 *
 *      var pr = new F.service.Presence();
 *      pr.markOnline('example-userId');
 *      pr.markOffline('example-userId');
 *      pr.getStatus();
 */



var apiEndpoint = 'presence';

/* harmony default export */ __webpack_exports__["default"] = (function (config) {
    var defaults = {
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        project: undefined,

        /**
         * Epicenter group name. Defaults to undefined. Note that this is the group *name*, not the group *id*. If left blank, taken from the session manager.
         * @type {string}
         */
        groupName: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_0_service_service_utils__["b" /* getDefaultOptions */])(defaults, config, {
        apiEndpoint: apiEndpoint
    });
    var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_0_service_service_utils__["d" /* getURLConfig */])(serviceOptions);
    var http = new __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__["default"](serviceOptions.transport);

    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, {}, serviceOptions, params);
        }
        return serviceOptions;
    };

    var publicAPI = {
        /**
         * Marks an end user as online.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOnline('0000015a68d806bc09cd0a7d207f44ba5f74')
         *          .then(function(presenceObj) {
         *               console.log('user ', presenceObj.userId, 
         *                    ' now online, as of ', presenceObj.lastModified);
         *          });
         *
         * **Return Value**
         *
         * Promise with presence information for user marked online.
         *
         * **Parameters**
         *
         * @param  {string} [userId] optional If not provided, taken from session cookie.
         * @param  {Object} options Additional options to change the presence service defaults.
         * @return {Promise} promise
         */
        markOnline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId });
            return http.post({ message: 'online' }, httpOptions);
        },

        /**
         * Marks an end user as offline.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOffline('0000015a68d806bc09cd0a7d207f44ba5f74');
         *
         * **Return Value**
         *
         * Promise to remove presence record for end user.
         *
         * **Parameters**
         *
         * @param  {string} [userId] If not provided, taken from session cookie.
         * @param  {Object} [options] Additional options to change the presence service defaults.
         * @return {Promise} promise
         */
        markOffline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId });
            return http.delete({}, httpOptions);
        },

        /**
         * Returns a list of all end users in this group that are currently online.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.getStatus('groupName').then(function(onlineUsers) {
         *          for (var i=0; i < onlineUsers.length; i++) {
         *               console.log('user ', onlineUsers[i].userId, 
         *                    ' is online as of ', onlineUsers[i].lastModified);
         *          }
         *     });
         *
         * **Return Value**
         *
         * Promise with response of online users
         *
         * **Parameters**
         *
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {object} [options] Additional options to change the presence service defaults.
         * @return {Promise}
         */
        getStatus: function (groupName, options) {
            options = options || {};
            var objParams = getFinalParams(groupName);
            if (!groupName && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + groupName });
            return http.get({}, httpOptions);
        },

        /**
         * Appends a boolean 'isOnline' field to provided list of users
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.getStatusForUsers([{ userId: 'a', userId: 'b'}]).then(function(onlineUsers) {
         *          console.log(onlineUsers[a].isOnline);
         *     });
         *
         * @param {{userId: string}[]} userList Users to get status for
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {object} [options] Additional options to change the presence service defaults.
         * 
         * @return {Promise}
         */
        getStatusForUsers: function (userList, groupName, options) {
            if (!userList || !Array.isArray(userList)) {
                throw new Error('getStatusForUsers: No userList provided.');
            }
            return this.getStatus(groupName, options).then(function (presenceList) {
                return userList.map(function (user) {
                    var isOnline = presenceList.find(function (status) {
                        return status.userId === user.userId;
                    });
                    user.isOnline = !!isOnline;
                    return user;
                });
            });
        },

        /**
         * End users are automatically marked online and offline in a "presence" channel that is specific to each group. Gets this channel (an instance of the [Channel Service](../channel-service/)) for the given group. (Note that this Channel Service instance is also available from the [Epicenter Channel Manager getPresenceChannel()](../epicenter-channel-manager/#getPresenceChannel).)
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     var cm = pr.getChannel('group1');
         *     cm.publish('', 'a message to presence channel');
         *
         * **Return Value**
         *
         * Channel instance for Presence channel
         *
         * **Parameters**
         *
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {Object} [options] Additional options to change the presence service defaults
         * @return {Channel} Channel instance
         */
        getChannel: function (groupName, options) {
            var ChannelManager = __webpack_require__(17).default;
            options = options || {};
            var isString = typeof groupName === 'string';
            var objParams = getFinalParams(groupName);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = isString ? groupName : objParams.groupName;
            var cm = new ChannelManager(options);
            return cm.getPresenceChannel(groupName);
        }
    };

    $.extend(this, publicAPI);
});

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * ## State API Adapter
 *
 * The State API Adapter allows you to view the history of a run, and to replay or clone runs. 
 *
 * The State API Adapter brings existing, persisted run data from the database back into memory, using the same run id (`replay`) or a new run id (`clone`). Runs must be in memory in order for you to update variables or call operations on them.
 *
 * Specifically, the State API Adapter works by "re-running" the run (user interactions) from the creation of the run up to the time it was last persisted in the database. This process uses the current version of the run's model. Therefore, if the model has changed since the original run was created, the retrieved run will use the new model — and may end up having different values or behavior as a result. Use with care!
 *
 * To use the State API Adapter, instantiate it and then call its methods:
 *
 *      var sa = new F.service.State();
 *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f'});
 *
 * The constructor takes an optional `options` parameter in which you can specify the `account` and `project` if they are not already available in the current context.
 *
 */

var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var _pick = __webpack_require__(4).pick;
var SessionManager = __webpack_require__(1);
var apiEndpoint = 'model/state';

module.exports = function (config) {

    var defaults = {};

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);
    var parseRunIdOrError = function (params) {
        if ($.isPlainObject(params) && params.runId) {
            return params.runId;
        } else {
            throw new Error('Please pass in a run id');
        }
    };

    var publicAPI = {

        /**
        * View the history of a run.
        * 
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.load('0000015a06bb58613b28b57365677ec89ec5').then(function(history) {
        *            console.log('history = ', history);
        *      });
        *
        *  **Parameters**
        * @param {string} runId The id of the run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        load: function (runId, options) {
            var httpParams = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + runId });
            return http.get('', httpParams);
        },

        /**
        * Replay a run. After this call, the run, with its original run id, is now available [in memory](../../../run_persistence/#runs-in-memory). (It continues to be persisted into the Epicenter database at regular intervals.)
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore'});
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to bring back to memory.
        * @param {string} params.stopBefore (Optional) The run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        replay: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + runId });

            params = $.extend(true, { action: 'replay' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        },

        /**
        * Clone a given run and return a new run in the same state as the given run.
        *
        * The new run id is now available [in memory](../../../run_persistence/#runs-in-memory). The new run includes a copy of all of the data from the original run, EXCEPT:
        *
        * * The `saved` field in the new run record is not copied from the original run record. It defaults to `false`.
        * * The `initialized` field in the new run record is not copied from the original run record. It defaults to `false` but may change to `true` as the new run is advanced. For example, if there has been a call to the `step` function (for Vensim models), the `initialized` field is set to `true`.
        * * The `created` field in the new run record is the date and time at which the clone was created (not the time that the original run was created.)
        *
        * The original run remains only [in the database](../../../run_persistence/#runs-in-db).
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.clone({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore', exclude: ['interimCalculation'] });
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to clone from memory.
        * @param {string} params.stopBefore (Optional) The newly cloned run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the newly cloned run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        clone: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + runId });

            params = $.extend(true, { action: 'clone' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        }
    };

    $.extend(this, publicAPI);
};

/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_configuration_service__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__ = __webpack_require__(0);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ## Time API Adapter
 *
 */



var apiEndpoint = 'time';

var TimeAPIService = function () {
    function TimeAPIService(config) {
        _classCallCheck(this, TimeAPIService);

        this.serviceOptions = $.extend(true, {}, config);

        var urlConfig = new __WEBPACK_IMPORTED_MODULE_0_service_configuration_service__["default"](this.serviceOptions).get('server');
        var transportOptions = $.extend(true, {}, this.serviceOptions.transport, {
            url: urlConfig.getAPIPath(apiEndpoint)
        });
        this.http = new __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__["default"](transportOptions);
    }

    _createClass(TimeAPIService, [{
        key: 'getTime',
        value: function getTime() {
            return this.http.get().then(function (t) {
                return new Date(t);
            }).catch(function (e) {
                //EPICENTER-3516 wrong response-type
                if (e.responseText) {
                    return new Date(e.responseText);
                }
            });
        }
    }]);

    return TimeAPIService;
}();

/* harmony default export */ __webpack_exports__["default"] = (TimeAPIService);

/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = intersection;
/**
 * 
 * @param {array} a 
 * @param {array} b 
 * @returns {array}
 */
function intersection(a, b) {
    var t;
    if (b.length > a.length) {
        t = b;
        b = a;
        a = t;
    } // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = reduceActions;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__timer_constants__ = __webpack_require__(19);


function reduceActions(actions, options) {
    var defaults = $.extend({
        condition: function () {
            return true;
        }
    }, options);

    var initialState = {
        startTime: 0,
        startedUsers: []
    };
    var reduced = actions.reduce(function (accum, action) {
        if (action.type !== __WEBPACK_IMPORTED_MODULE_0__timer_constants__["a" /* ACTIONS */].START || accum.startTime) {
            return accum;
        }
        var ts = +new Date(action.time);
        var user = action.user;
        var isUserAlreadyCounted = !!accum.startedUsers.find(function (u) {
            return u.userName === user.userName;
        });
        if (!isUserAlreadyCounted) {
            accum.startedUsers.push(user);
        }
        var areUserRequirementsMet = defaults.condition([].concat(accum.startedUsers));
        if (areUserRequirementsMet) {
            accum.startTime = ts;
        }
        return accum;
    }, initialState);

    return reduced.startTime;
}

/***/ }),
/* 37 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["default"] = ConsensusGroupService;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__consensus_service_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_service_utils_js__ = __webpack_require__(5);
/**
 * 
 * ## Consensus Group Service
 *
 * The Consensus Group Service provides a way to group different consensus points within your world. This is typically used in faculty pages to report progression throw different Consensus Points.
 * 
 *      var cg = new F.service.ConsensusGroup({
 *          worldId: world.id,
 *          name: 'rounds'
 *      });
 *      cg.consensus('round1').create(..);
 *
 * You can use the Consensus Service (`F.service.Consensus`) without using the ConsensusGroup (`F.service.ConsensusGroup`) - the Consensus Service uses a group called "default" by default.
 * 
 */






var API_ENDPOINT = 'multiplayer/consensus';

function ConsensusGroupService(config) {
    var defaults = {
        token: undefined,
        worldId: '',
        name: 'default'
    };

    var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_2_service_service_utils_js__["b" /* getDefaultOptions */])(defaults, config);
    var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_2_service_service_utils_js__["d" /* getURLConfig */])(serviceOptions);

    var http = new __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__["default"](serviceOptions.transport);

    function getHTTPOptions(options) {
        var mergedOptions = $.extend(true, {}, serviceOptions, options);
        if (!mergedOptions.worldId) {
            throw new Error('ConsensusGroup Service: worldId is required');
        }
        var baseURL = urlConfig.getAPIPath(API_ENDPOINT);
        var url = baseURL + [mergedOptions.worldId, mergedOptions.name].join('/');

        var httpOptions = $.extend(true, {}, mergedOptions, { url: url });
        return httpOptions;
    }
    var publicAPI = {
        /**
         * List all consensus points within this group
         * 
         * @param {object} outputModifier Currently unused, may be used for paging etc later
         * @param {object} [options] Overrides for serviceoptions
         * @returns {Promise}
         */
        list: function (outputModifier, options) {
            var httpOptions = getHTTPOptions(options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Deletes all consensus points within this group
         * 
         * @param {object} [options] Overrides for serviceoptions
         * @returns {Promise}
         */
        delete: function (options) {
            var httpOptions = getHTTPOptions(options);
            return http.delete({}, httpOptions);
        },

        /**
         * Helper to return a Consensus instance 
         * 
         * @param {string} [name] Returns a new instance of a consensus service. Note it is not created until you call `create` on the returned service.
         * @param {object} [options] Overrides for serviceoptions
         * @returns {ConsensusService}
         */
        consensus: function (name, options) {
            var opts = $.extend({}, true, serviceOptions, options);
            var cs = new __WEBPACK_IMPORTED_MODULE_0__consensus_service_js__["default"]($.extend(true, opts, {
                consensusGroup: opts.name,
                name: name
            }));
            return cs;
        }
    };
    return publicAPI;
}

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * ### Working with Run Strategies
 *
 * You can access a list of available strategies using `F.manager.RunManager.strategies.list`. You can also ask for a particular strategy by name.
 *
 * If you decide to [create your own run strategy](#create-your-own), you can register your strategy. Registering your strategy means that:
 *
 * * You can pass the strategy by name to a Run Manager (as opposed to passing the strategy function): `new F.manager.RunManager({ strategy: 'mynewname'})`.
 * * You can pass configuration options to your strategy.
 * * You can specify whether or not your strategy requires authorization (a valid user session) to work.
 */

var list = {
    'conditional-creation': __webpack_require__(11),
    'new-if-initialized': __webpack_require__(62), //deprecated
    'new-if-persisted': __webpack_require__(63), //deprecated

    none: __webpack_require__(12),

    multiplayer: __webpack_require__(64),
    'reuse-never': __webpack_require__(65),
    'reuse-per-session': __webpack_require__(66),
    'reuse-across-sessions': __webpack_require__(67),
    'reuse-last-initialized': __webpack_require__(39)
};

//Add back older aliases
list['always-new'] = list['reuse-never'];
list['new-if-missing'] = list['reuse-per-session'];
list['persistent-single-player'] = list['reuse-across-sessions'];

var strategyManager = {
    /**
     * List of available strategies. Within this object, each key is the strategy name and the associated value is the strategy constructor.
     * @type {Object} 
     */
    list: list,

    /**
     * Gets strategy by name.
     *
     * **Example**
     *
     *      var reuseStrat = F.manager.RunManager.strategies.byName('reuse-across-sessions');
     *      // shows strategy function
     *      console.log('reuseStrat = ', reuseStrat);
     *      // create a new run manager using this strategy
     *      var rm = new F.manager.RunManager({strategy: reuseStrat, run: { model: 'model.vmf'} });
     *
     * **Parameters**
     * @param  {String} strategyName Name of strategy to get.
     * @return {Function} Strategy function.
     */
    byName: function (strategyName) {
        return list[strategyName];
    },

    getBestStrategy: function (options) {
        var strategy = options.strategy;
        if (!strategy) {
            if (options.strategyOptions && options.strategyOptions.initOperation) {
                strategy = 'reuse-last-initialized';
            } else {
                strategy = 'reuse-per-session';
            }
        }

        if (strategy.getRun) {
            return strategy;
        }
        var StrategyCtor = typeof strategy === 'function' ? strategy : strategyManager.byName(strategy);
        if (!StrategyCtor) {
            throw new Error('Specified run creation strategy was invalid:' + strategy);
        }

        var strategyInstance = new StrategyCtor(options);
        if (!strategyInstance.getRun || !strategyInstance.reset) {
            throw new Error('All strategies should implement a `getRun` and `reset` interface' + options.strategy);
        }
        strategyInstance.requiresAuth = StrategyCtor.requiresAuth;

        return strategyInstance;
    },

    /**
     * Adds a new strategy.
     *
     * **Example**
     *
     *      // this "favorite run" strategy always returns the same run, no matter what
     *      // (not a useful strategy, except as an example)
     *      F.manager.RunManager.strategies.register(
     *          'favRun', 
     *          function() { 
     *              return { getRun: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; },
     *                      reset: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; } 
     *              } 
     *          }, 
     *          { requiresAuth: true }
     *      );
     *      
     *      var rm = new F.manager.RunManager({strategy: 'favRun', run: { model: 'model.vmf'} });
     *
     * **Parameters**
     * @param  {String} name Name for strategy. This string can then be passed to a Run Manager as `new F.manager.RunManager({ strategy: 'mynewname'})`.
     * @param  {Function} strategy The strategy constructor. Will be called with `new` on Run Manager initialization.
     * @param  {Object} options  Options for strategy.
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires a valid user session to work.
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};

module.exports = strategyManager;

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `reuse-last-initialized` strategy looks for the most recent run that matches particular criteria; if it cannot find one, it creates a new run and immediately executes a set of "initialization" operations. 
 *
 * This strategy is useful if you have a time-based model and always want the run you're operating on to start at a particular step. For example:
 *
 *      var rm = new F.manager.RunManager({
 *          strategy: 'reuse-last-initialized',
 *          strategyOptions: {
 *              initOperation: [{ step: 10 }]
 *          }
 *      });
 * 
 * This strategy is also useful if you have a custom initialization function in your model, and want to make sure it's always executed for new runs.
 *
 * Specifically, the strategy is:
 *
 * * Look for the most recent run that matches the (optional) `flag` criteria
 * * If there are no runs that match the `flag` criteria, create a new run. Immediately "initialize" this new run by:
 *     *  Calling the model operation(s) specified in the `initOperation` array.
 *     *  Optionally, setting a `flag` in the run.
 *
 */



var classFrom = __webpack_require__(3);

var _require = __webpack_require__(7),
    injectFiltersFromSession = _require.injectFiltersFromSession,
    injectScopeFromSession = _require.injectScopeFromSession;

var Base = {};

var defaults = {
    /**
     * Operations to execute in the model for initialization to be considered complete.
     * @type {Array} Can be in any of the formats [Run Service's `serial()`](../run-api-service/#serial) supports.
     */
    initOperation: [],

    /**
     * (Optional) Flag to set in run after initialization operations are run. You typically would not override this unless you needed to set additional properties as well.
     * @type {Object}
     */
    flag: null
};
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
        if (!this.options.initOperation || !this.options.initOperation.length) {
            throw new Error('Specifying an init function is required for this strategy');
        }
        if (!this.options.flag) {
            this.options.flag = {
                isInitComplete: true
            };
        }
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        var me = this;
        return runService.create(opt, options).then(function (createResponse) {
            return runService.serial([].concat(me.options.initOperation)).then(function () {
                return createResponse;
            });
        }).then(function (createResponse) {
            return runService.save(me.options.flag).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession, runSession, options) {
        var sessionFilter = injectFiltersFromSession(this.options.flag, userSession);
        var runopts = runService.getCurrentConfig();
        var filter = $.extend(true, { trashed: false }, sessionFilter, { model: runopts.model });
        var me = this;
        return runService.query(filter, {
            startrecord: 0,
            endrecord: 0,
            sort: 'created',
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * ## Saved Runs Manager
 *
 * The Saved Runs Manager is a specific type of [Run Manager](../../run-manager/) which provides access to a list of runs (rather than just one run). It also provides utility functions for dealing with multiple runs (e.g. saving, deleting, listing).
 *
 * An instance of a Saved Runs Manager is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.savedRuns`. See [more information](../#properties) on using `.savedRuns` within the Scenario Manager.
 *
 */


var RunService = __webpack_require__(9);
var SessionManager = __webpack_require__(1);

var injectFiltersFromSession = __webpack_require__(7).injectFiltersFromSession;

var SavedRunsManager = function (config) {
    var defaults = {
        /**
         * If set, will only pull runs from current group. Defaults to `true`.
         * @type {Boolean}
         */
        scopeByGroup: true,

        /**
         * If set, will only pull runs from current user. Defaults to `true`.
         *
         * For multiplayer run comparison projects, set this to false so that all end users in a group can view the shared set of saved runs.
         * @type {Boolean}
         */
        scopeByUser: true
    };

    this.sessionManager = new SessionManager();

    var options = $.extend(true, {}, defaults, config);
    if (options.run) {
        if (options.run instanceof RunService) {
            this.runService = options.run;
        } else {
            this.runService = new RunService(options.run);
        }
        this.options = options;
    } else {
        throw new Error('No run options passed to SavedRunsManager');
    }
};

SavedRunsManager.prototype = {
    /**
     * Marks a run as saved. 
     *
     * Note that while any run can be saved, only runs which also match the configuration options `scopeByGroup` and `scopeByUser` are returned by the `getRuns()` method.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.save('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService} run Run to save. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} otherFields (Optional) Any other meta-data to save with the run.
     * @return {Promise}
     */
    save: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    },
    /**
     * Marks a run as removed; the inverse of marking as saved.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.remove('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService} run Run to remove. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} otherFields (Optional) any other meta-data to save with the run.
     * @return {Promise}
     */
    remove: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    },

    /**
     * Sets additional fields on a run. This is a convenience method for [RunService#save](../../run-api-service/#save).
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.mark('0000015a4cd1700209cd0a7d207f44bac289', 
     *          { 'myRunName': 'sample policy decisions' });
     *
     * @param  {String|string[]|RunService} run  Run to operate on. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} toMark Fields to set, as name : value pairs.
     * @return {Promise}
     */
    mark: function (run, toMark) {
        var rs;
        var existingOptions = this.runService.getCurrentConfig();
        if (run instanceof RunService) {
            rs = run;
        } else if (run && typeof run === 'string') {
            rs = new RunService($.extend(true, {}, existingOptions, { id: run, autoRestore: false }));
        } else if (Array.isArray(run)) {
            var me = this;
            var proms = run.map(function (r) {
                return me.mark(r, toMark);
            });
            return $.when.apply(null, proms);
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    },

    /**
     * Returns a list of saved runs.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.getRuns().then(function (runs) {
     *          for (var i=0; i<runs.length; i++) {
     *              console.log('run id of saved run: ', runs[i].id);
     *          }
     *      });
     *
     * @param  {Array} variables (Optional) If provided, in the returned list of runs, each run will have a `.variables` property with these set.
     * @param  {Object} filter    (Optional) Any filters to apply while fetching the run. See [RunService#filter](../../run-api-service/#filter) for details.
     * @param  {Object} modifiers (Optional) Use for paging/sorting etc. See [RunService#filter](../../run-api-service/#filter) for details.
     * @return {Promise}
     */
    getRuns: function (variables, filter, modifiers) {
        var session = this.sessionManager.getSession(this.runService.getCurrentConfig());

        var runopts = this.runService.getCurrentConfig();
        var scopedFilter = injectFiltersFromSession($.extend(true, {}, {
            saved: true,
            trashed: false,
            model: runopts.model
        }, filter), session, this.options);

        var opModifiers = $.extend(true, {}, {
            sort: 'created',
            direction: 'asc'
        }, modifiers);
        if (variables) {
            opModifiers.include = [].concat(variables);
        }
        return this.runService.query(scopedFilter, opModifiers);
    }
};
module.exports = SavedRunsManager;

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
* ## World Manager
*
* As discussed under the [World API Adapter](../world-api-adapter/), a [run](../../../glossary/#run) is a collection of end user interactions with a project and its model. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.
*
* The World Manager provides an easy way to track and access the current world and run for particular end users. It is typically used in pages that end users will interact with. (The related [World API Adapter](../world-api-adapter/) handles creating multiplayer worlds, and adding and removing end users and runs from a world. Because of this, typically the World Adapter is used for facilitator pages in your project.)
*
* ### Using the World Manager
*
* To use the World Manager, instantiate it. Then, make calls to any of the methods you need.
*
* When you instantiate a World Manager, the world's account id, project id, and group are automatically taken from the session (thanks to the [Authentication Service](../auth-api-service)).
*
* Note that the World Manager does *not* create worlds automatically. (This is different than the [Run Manager](../run-manager).) However, you can pass in specific options to any runs created by the manager, using a `run` object.
*
* The parameters for creating a World Manager are:
*
*   * `account`: The **Team ID** in the Epicenter user interface for this project.
*   * `project`: The **Project ID** for this project.
*   * `group`: The **Group Name** for this world.
*   * `run`: Options to use when creating new runs with the manager, e.g. `run: { files: ['data.xls'] }`.
*   * `run.model`: The name of the primary model file for this project. Required if you have not already passed it in as part of the `options` parameter for an enclosing call.
*
* For example:
*
*       var wMgr = new F.manager.WorldManager({
*          account: 'acme-simulations',
*          project: 'supply-chain-game',
*          run: { model: 'supply-chain.py' },
*          group: 'team1'
*       });
*
*       wMgr.getCurrentRun();
*/



var WorldApi = __webpack_require__(10).default;
var RunManager = __webpack_require__(20).default;
var AuthManager = __webpack_require__(16);
var worldApi;

function buildStrategy(worldId) {

    return function Ctor(options) {
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implementd. Need api changes');
            },

            getRun: function (runService) {
                // Model is required in the options
                var model = this.options.run.model || this.options.model;
                return worldApi.getCurrentRunId({ model: model, filter: worldId }).then(function (runId) {
                    return runService.load(runId);
                });
            }
        });
    };
}

module.exports = function (options) {
    this.options = options || { run: {}, world: {} };

    $.extend(true, this.options, this.options.run);
    $.extend(true, this.options, this.options.world);

    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var me = this;

    var api = {

        /**
        * Returns the current world (object) and an instance of the [World API Adapter](../world-api-adapter/).
        *
        * **Example**
        *
        *       wMgr.getCurrentWorld()
        *           .then(function(world, worldAdapter) {
        *               console.log(world.id);
        *               worldAdapter.getCurrentRunId();
        *           });
        *
        * **Parameters**
        * @param {string} userId (Optional) The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} groupName (Optional) The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
        * @return {Promise}
        */
        getCurrentWorld: function (userId, groupName) {
            var session = this._auth.getCurrentUserSessionInfo();
            if (!userId) {
                userId = session.userId;
            }
            if (!groupName) {
                groupName = session.groupName;
            }
            return worldApi.getCurrentWorldForUser(userId, groupName);
        },

        /**
        * Returns the current run (object) and an instance of the [Run API Service](../run-api-service/).
        *
        * **Example**
        *
        *       wMgr.getCurrentRun('myModel.py')
        *           .then(function(run, runService) {
        *               console.log(run.id);
        *               runService.do('startGame');
        *           });
        *
        * **Parameters**
        * @param {string} model (Optional) The name of the model file. Required if not already passed in as `run.model` when the World Manager is created.
        * @return {Promise}
        */
        getCurrentRun: function (model) {
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            return this.getCurrentWorld(curUserId, curGroupName).then(function getAndRestoreLatestRun(world) {
                if (!world) {
                    return $.Deferred().reject({ error: 'The user is not part of any world!' }).promise();
                }
                var runOpts = $.extend(true, me.options, { model: model });
                var strategy = buildStrategy(world.id);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: runOpts
                });
                var rm = new RunManager(opt);
                return rm.getRun().then(function (run) {
                    run.world = world;
                    return run;
                });
            });
        }
    };

    $.extend(this, api);
};

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var F = {
    _private: {}, //need this hook now because tests expect everything to be global. Delete once tests are browserified
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    }
};

F.load = __webpack_require__(43);

if (!window.SKIP_ENV_LOAD) {
    F.load();
}

F.util.query = __webpack_require__(6);
F.util.run = __webpack_require__(8);
F.util.classFrom = __webpack_require__(3);

F.factory.Transport = __webpack_require__(0).default;
F.transport.Ajax = __webpack_require__(22);

F.service.URL = __webpack_require__(13);
F.service.Config = __webpack_require__(2).default;
F.service.Run = __webpack_require__(9);
F.service.File = __webpack_require__(45);
F.service.Variables = __webpack_require__(23);
F.service.Data = __webpack_require__(27).default;
F.service.Auth = __webpack_require__(28);
F.service.World = __webpack_require__(10).default;
F.service.State = __webpack_require__(33);
F.service.User = __webpack_require__(51);
F.service.Member = __webpack_require__(29);
F.service.Asset = __webpack_require__(52);
F.service.Group = __webpack_require__(30).default;
F.service.Introspect = __webpack_require__(24);
F.service.Presence = __webpack_require__(32).default;
F.service.Time = __webpack_require__(34).default;
F.service.Timer = __webpack_require__(53).default;
F.service.Password = __webpack_require__(59).default;

F.service.Consensus = __webpack_require__(18).default;
F.service.ConsensusGroup = __webpack_require__(37).default;

F.service.Project = __webpack_require__(60).default;

F.store.Cookie = __webpack_require__(26);
F.factory.Store = __webpack_require__(25);

F.manager.ScenarioManager = __webpack_require__(61);
F.manager.RunManager = __webpack_require__(20).default;
F.manager.AuthManager = __webpack_require__(16);
F.manager.WorldManager = __webpack_require__(41);
F.manager.SavedRunsManager = __webpack_require__(40);

var strategies = __webpack_require__(38);
F.manager.strategy = strategies.list; //TODO: this is not really a manager so namespace this better

F.manager.ChannelManager = __webpack_require__(17).default;
F.service.Channel = __webpack_require__(31);

F.manager.ConsensusManager = __webpack_require__(71).default;

if (true) F.version = "2.7.0"; //eslint-disable-line no-undef
F.api = __webpack_require__(21);

F.constants = __webpack_require__(14);

module.exports = F;

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {


var URLConfigService = __webpack_require__(13);

var envLoad = function (callback) {
    var urlService = new URLConfigService();
    var infoUrl = urlService.getAPIPath('config');
    var envPromise = $.ajax({ url: infoUrl, async: false });
    envPromise = envPromise.then(function (res) {
        var overrides = res.api;
        URLConfigService.defaults = $.extend(URLConfigService.defaults, overrides);
    });
    return envPromise.then(callback).fail(callback);
};

module.exports = envLoad;

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ConfigService = __webpack_require__(2).default;

var urlConfig = new ConfigService().get('server');
var customDefaults = {};
var libDefaults = {
  /**
   * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
   * @type {String}
   */
  account: urlConfig.accountPath || undefined,
  /**
   * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
   * @type {String}
   */
  project: urlConfig.projectPath || undefined,
  isLocal: urlConfig.isLocalhost(),
  isCustomDomain: urlConfig.isCustomDomain,
  store: {}
};

var optionUtils = {
  /**
   * Gets the final options by overriding the global options set with
   * optionUtils#setDefaults() and the lib defaults.
   * @param {object} options The final options object.
   * @return {object} Extended object
   */
  getOptions: function (options) {
    return $.extend(true, {}, libDefaults, customDefaults, options);
  },
  /**
   * Sets the global defaults for the optionUtils#getOptions() method.
   * @param {object} defaults The defaults object.
   */
  setDefaults: function (defaults) {
    customDefaults = defaults;
  }
};
module.exports = optionUtils;

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * ## File API Service
 *
 * The File API Service allows you to upload and download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. It is based on the Epicenter File API.
 *
 *       var fa = new F.service.File({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *       });
 *       fa.create('test.txt', 'these are my filecontents');
 *
 *       // alternatively, create a new file using a file uploaded through a file input
 *       // <input id="fileupload" type="file">
 *       //
 *       $('#fileupload').on('change', function (e) {
 *          var file = e.target.files[0];
 *          var data = new FormData();
 *          data.append('file', file, file.name);
 *          fa.create(file.name, data);
 *       });
 */

var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var SessionManager = __webpack_require__(1);

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined.
         * @type {String}
         */
        project: undefined,

        /**
         * The folder type.  One of `model` | `static` | `node`.
         * @type {String}
         */
        folderType: 'static',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('file')
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    function uploadBody(fileName, contents) {
        var boundary = '---------------------------7da24f2e50046';

        return {
            body: '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="file";' + 'filename="' + fileName + '"\r\n' + 'Content-type: text/html\r\n\r\n' + contents + '\r\n' + '--' + boundary + '--',
            boundary: boundary
        };
    }

    function uploadFileOptions(filePath, contents, options) {
        filePath = filePath.split('/');
        var fileName = filePath.pop();
        filePath = filePath.join('/');
        var path = serviceOptions.folderType + '/' + filePath;

        var extraParams = {};
        if (contents instanceof FormData) {
            extraParams = {
                data: contents,
                processData: false,
                contentType: false
            };
        } else {
            var upload = uploadBody(fileName, contents);
            extraParams = {
                data: upload.body,
                contentType: 'multipart/form-data; boundary=' + upload.boundary
            };
        }

        return $.extend(true, {}, serviceOptions, options, {
            url: urlConfig.getAPIPath('file') + path
        }, extraParams);
    }

    var publicAsyncAPI = {
        /**
         * Get a directory listing, or contents of a file.
         * @param {String} filePath  Path to the file
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        getContents: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        },

        /**
         * Replaces the file at the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String | FormData } contents Contents to write to file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        replace: function (filePath, contents, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);
            return http.put(httpOptions.data, httpOptions);
        },

        /**
         * Creates a file in the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String | FormData } contents Contents to write to file
         * @param  {Boolean} replaceExisting Replace file if it already exists; defaults to false
         * @param  {Object} options (Optional) Overrides for configuration options
         * @return {Promise}
         */
        create: function (filePath, contents, replaceExisting, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);
            var prom = http.post(httpOptions.data, httpOptions);
            var me = this;
            if (replaceExisting === true) {
                prom = prom.then(null, function (xhr) {
                    var conflictStatus = 409;
                    if (xhr.status === conflictStatus) {
                        return me.replace(filePath, contents, options);
                    }
                });
            }
            return prom;
        },

        /**
         * Removes the file.
         * @param  {String} filePath Path to the file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        remove: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.delete(null, httpOptions);
        },

        /**
         * Renames the file.
         * @param  {String} filePath Path to the file
         * @param  {String} newName  New name of file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        rename: function (filePath, newName, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.patch({ name: newName }, httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};

/***/ }),
/* 46 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SCOPES; });
/* unused harmony export addScopeToCollection */
/* harmony export (immutable) */ __webpack_exports__["b"] = getScopedName;
/* harmony export (immutable) */ __webpack_exports__["c"] = getURL;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_auth_manager__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_auth_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_managers_auth_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_util_query_util__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_service_utils__ = __webpack_require__(5);




var SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER',
    PROJECT: 'PROJECT',
    FACILITATOR: 'FACILITATOR',
    CUSTOM: 'CUSTOM'
};

/**
 * 
 * @param {string} key to prefix
 * @param {string} scope 
 * @param {object} session 
 * 
 * @returns {string} scoped name
 */
function addScopeToCollection(key, scope, session) {
    var publicAccessScopes = [SCOPES.CUSTOM];
    var allowPublicAccess = publicAccessScopes.indexOf(scope) !== -1;
    if (!Object.keys(session || {}).length && !allowPublicAccess) {
        throw new Error('DataService Authorization error: ' + scope + ' for ' + key + ' requires an authenticated user');
    }
    scope = scope.toUpperCase();
    var delimiter = '_';
    if (scope === SCOPES.GROUP) {
        return [key, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.USER) {
        return [key, 'user', session.userId, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.FACILITATOR) {
        var isFac = session.isTeamMember || session.isFac;
        if (!isFac) {
            throw new Error('DataService Authorization error: ' + scope + ' for ' + key + ' requires a Facilitator user');
        }
        return [key, 'fac', 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.PROJECT) {
        return [key, 'project', 'scope'].join(delimiter);
    } else if (scope === SCOPES.CUSTOM) {
        return key;
    }
    throw new Error('Unknown scope ' + scope);
}

/**
 * Takes name for form collection/doc/.. and adds scope to just collection name
 * 
 * @param {string} name 
 * @param {string} scope 
 * @param {object} [session] 
 * @returns {string}
 */
function getScopedName(name, scope, session) {
    if (!session) {
        var am = new __WEBPACK_IMPORTED_MODULE_0_managers_auth_manager___default.a();
        session = am.getCurrentUserSessionInfo();
    }
    var split = name.split('/');
    var collection = split[0];

    split[0] = addScopeToCollection(collection, scope, session);

    var newURL = split.join('/');
    return newURL;
}

function getURL(API_ENDPOINT, collection, doc, options) {
    var scopedCollection = getScopedName(collection || options.root, options.scope);

    var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_2_service_service_utils__["d" /* getURLConfig */])(options);
    var baseURL = urlConfig.getAPIPath(API_ENDPOINT);

    var fullURL = baseURL + '/' + scopedCollection + '/' + (doc || '');
    return Object(__WEBPACK_IMPORTED_MODULE_1_util_query_util__["normalizeSlashes"])(fullURL, { leading: true, trailing: true });
}

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

;(function () {

  var object =
     true ? exports :
    typeof self != 'undefined' ? self : // #8: web workers
    $.global; // #31: ExtendScript

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    var str = String(input);
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next str index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      str.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    var str = String(input).replace(/[=]+$/, ''); // #31: ExtendScript bad parse of /=
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = str.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * ## Channel Manager
 *
 * There are two main use cases for the channel: event notifications and chat messages.
 *
 * If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) rather than this more generic Channel Manager. (The Epicenter Channel Manager is a wrapper that instantiates a Channel Manager with Epicenter-specific defaults.) The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use. 
 *
 * However, you can work directly with the Channel Manager if you like. (This might be useful if you are working through Node.js, for example, `require('manager/channel-manager')`.)
 *
 * The Channel Manager is a wrapper around the default [cometd JavaScript library](http://docs.cometd.org/2/reference/javascript.html), `$.cometd`. It provides a few nice features that `$.cometd` doesn't, including:
 *
 * * Automatic re-subscription to channels if you lose your connection
 * * Online / Offline notifications
 * * 'Events' for cometd notifications (instead of having to listen on specific meta channels)
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Manager. (See [Including Epicenter.js](../../#include).)
 *
 * To use the Channel Manager in client-side JavaScript, instantiate the [Epicenter Channel Manager](../epicenter-channel-manager/), get a particular channel -- that is, an instance of a [Channel Service](../channel-service/) -- then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *      var cm = new F.manager.ChannelManager();
 *      var gc = cm.getGroupChannel();
 *      // because we used an Epicenter Channel Manager to get the group channel,
 *      // subscribe() and publish() here default to the base topic for the group;
 *      gc.subscribe('', function(data) { console.log(data); });
 *      gc.publish('', { message: 'a new message to the group' });
 *
 * The parameters for instantiating a Channel Manager include:
 *
 * * `options` The options object to configure the Channel Manager. Besides the common options listed here, see http://docs.cometd.org/reference/javascript.html for other supported options.
 * * `options.url` The Cometd endpoint URL.
 * * `options.websocketEnabled` Whether websocket support is active (boolean).
 * * `options.channel` Other defaults to pass on to instances of the underlying Channel Service. See [Channel Service](../channel-service/) for details.
 *
 */

var Channel = __webpack_require__(31);
var SessionManager = __webpack_require__(1);

var ChannelManager = function (options) {
    if (!$.cometd) {
        console.error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var defaults = {
        /**
         * The Cometd endpoint URL.
         * @type {string}
         */
        url: '',

        /**
         * The log level for the channel (logs to console).
         * @type {string}
         */
        logLevel: 'info',

        /**
         * Whether websocket support is active. Defaults to `true`.
         * @type {boolean}
         */
        websocketEnabled: true,

        /**
         * Whether the ACK extension is enabled. Defaults to `true`. See [https://docs.cometd.org/current/reference/#_extensions_acknowledge](https://docs.cometd.org/current/reference/#_extensions_acknowledge) for more info.
         * @type {boolean}
         */
        ackEnabled: true,

        /**
         * If false each instance of Channel will have a separate cometd connection to server, which could be noisy. Set to true (default) to re-use the same connection across instances.
         * @type {boolean}
         */
        shareConnection: true,

        /**
         * Other defaults to pass on to instances of the underlying [Channel Service](../channel-service/), which are created through `getChannel()`.
         * @type {object}
         */
        channel: {},

        /**
         * Options to pass to the channel handshake.
         *
         * For example, the [Epicenter Channel Manager](../epicenter-channel-manager/) passes `ext` and authorization information. More information on possible options is in the details of the underlying [Push Channel API](../../../rest_apis/multiplayer/channel/).
         *
         * @type {object}
         */
        handshake: undefined
    };
    this.sessionManager = new SessionManager();
    var defaultCometOptions = this.sessionManager.getMergedOptions(defaults, options);
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

    if (defaultCometOptions.shareConnection && ChannelManager.prototype._cometd) {
        this.cometd = ChannelManager.prototype._cometd;
        return this;
    }
    var cometd = new $.CometD();
    ChannelManager.prototype._cometd = cometd;

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;
    cometd.ackEnabled = defaultCometOptions.ackEnabled;

    this.isConnected = false;
    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };
    var me = this;

    cometd.configure(defaultCometOptions);

    cometd.addListener('/meta/connect', function (message) {
        var wasConnected = this.isConnected;
        this.isConnected = message.successful === true;
        if (!wasConnected && this.isConnected) {
            //Connecting for the first time
            connectionSucceeded.call(this, message);
        } else if (wasConnected && !this.isConnected) {
            //Only throw disconnected message fro the first disconnect, not once per try
            connectionBroken.call(this, message);
        }
    }.bind(this));

    cometd.addListener('/meta/disconnect', connectionBroken);

    cometd.addListener('/meta/handshake', function (message) {
        if (message.successful) {
            //http://docs.cometd.org/reference/javascript_subscribe.html#javascript_subscribe_meta_channels
            // ^ "dynamic subscriptions are cleared (like any other subscription) and the application needs to figure out which dynamic subscription must be performed again"
            cometd.batch(function () {
                $(me.currentSubscriptions).each(function (index, subs) {
                    cometd.resubscribe(subs);
                });
            });
        }
    });

    //Other interesting events for reference
    cometd.addListener('/meta/subscribe', function (message) {
        $(me).trigger('subscribe', message);
    });
    cometd.addListener('/meta/unsubscribe', function (message) {
        $(me).trigger('unsubscribe', message);
    });
    cometd.addListener('/meta/publish', function (message) {
        $(me).trigger('publish', message);
    });
    cometd.addListener('/meta/unsuccessful', function (message) {
        $(me).trigger('error', message);
    });

    cometd.handshake(defaultCometOptions.handshake);

    this.cometd = cometd;
};

ChannelManager.prototype = $.extend(ChannelManager.prototype, {

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * **Example**
     *
     *      var cm = new F.manager.ChannelManager();
     *      var channel = cm.getChannel();
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        //If you just want to pass in a string
        if (options && !$.isPlainObject(options)) {
            options = {
                base: options
            };
        }
        var defaults = {
            transport: this.cometd
        };
        var channel = new Channel($.extend(true, {}, this.options.channel, defaults, options));

        //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
        var subs = channel.subscribe;
        channel.subscribe = function () {
            var subid = subs.apply(channel, arguments);
            this.currentSubscriptions = this.currentSubscriptions.concat(subid);
            return subid;
        }.bind(this);

        var unsubs = channel.unsubscribe;
        channel.unsubscribe = function () {
            var removed = unsubs.apply(channel, arguments);
            for (var i = 0; i < this.currentSubscriptions.length; i++) {
                if (this.currentSubscriptions[i].id === removed.id) {
                    this.currentSubscriptions.splice(i, 1);
                }
            }
            return removed;
        }.bind(this);

        return channel;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }
});

module.exports = ChannelManager;

/***/ }),
/* 49 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = subscribeToWorldChannel;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_world_api_adapter__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__ = __webpack_require__(50);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_util_object_util__ = __webpack_require__(4);
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();





function subscribeToWorldChannel(worldid, channel, session, channelOptions) {
    var account = channelOptions.account,
        project = channelOptions.project,
        baseTopic = channelOptions.baseTopic;


    channel.TOPICS = __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */];
    var oldsubs = channel.subscribe;
    channel.subscribe = function (fullTopic, callback, context, subscribeOptions) {
        if (!fullTopic) {
            return oldsubs.call(channel, fullTopic, callback, context, subscribeOptions);
        }

        var _fullTopic$split = fullTopic.split('/'),
            _fullTopic$split2 = _slicedToArray(_fullTopic$split, 3),
            subscribedTopic = _fullTopic$split2[0],
            subscribedSubTopic = _fullTopic$split2[1],
            subTopicFilter = _fullTopic$split2[2];

        var defaults = {
            includeMine: true
        };

        var opts = $.extend({}, defaults, subscribeOptions);
        if (subscribedTopic === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].PRESENCE) {
            //fake-send initial online status
            var wm = new __WEBPACK_IMPORTED_MODULE_0_service_world_api_adapter__["default"]({
                account: account,
                project: project,
                filter: worldid
            });
            wm.getPresenceForUsers(worldid).then(function (users) {
                users.filter(function (u) {
                    return u.isOnline;
                }).forEach(function (user) {
                    var fakeMeta = {
                        date: Date.now(),
                        channel: baseTopic,
                        type: __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].PRESENCE,
                        subType: __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].ONLINE,
                        source: 'presenceAPI'
                    };
                    var normalizedUser = Object(__WEBPACK_IMPORTED_MODULE_2_util_object_util__["pick"])(user, ['userName', 'lastName', 'isOnline', 'account']);
                    normalizedUser.id = user.userId; //regular presence notification has id, not userid
                    callback(normalizedUser, fakeMeta); //eslint-disable-line callback-return
                });
            });
        }
        /* eslint-disable complexity */
        var filterByType = function (res) {
            var _res$data = res.data,
                type = _res$data.type,
                subType = _res$data.subType;


            var isTopicMatch = subscribedTopic === type;
            var isSubTopicMatch = !subscribedSubTopic || subscribedSubTopic === subType;

            var notificationFrom = res.data.user || {};
            var payload = res.data.data;
            if (type === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].RUN && subType === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].RESET) {
                notificationFrom = payload.run.user; //reset doesn't give back user info otherwise
            } else if (type === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].ROLES && !notificationFrom.id) {
                notificationFrom.id = session.userid; //unassign doesn't provide an user
            }

            var isMine = session.userId === notificationFrom.id;
            var isInitiatorMatch = isMine && opts.includeMine || !isMine;

            var shouldPassOn = isTopicMatch && isSubTopicMatch && isInitiatorMatch;
            if (!shouldPassOn) {
                return;
            }

            var meta = {
                user: notificationFrom,
                date: res.data.date,
                channel: res.channel,
                type: subscribedTopic,
                subType: subscribedSubTopic || subType
            };

            switch (subscribedTopic) {
                case __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].RUN:
                    {
                        if (subscribedSubTopic === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].VARIABLES || subscribedSubTopic === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].OPERATIONS) {
                            return callback(payload[subType], meta);
                        } else if (subscribedSubTopic === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].RESET) {
                            return callback(payload.run, meta);
                        }
                        return callback(payload, meta);
                    }
                case __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].ROLES:
                    {
                        if (subType === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].UNASSIGN) {
                            payload.users = payload.users.map(function (u) {
                                u.oldRole = u.role;
                                u.role = null;
                                return u;
                            });
                        }
                        return callback(payload.users, meta);
                    }
                case __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].PRESENCE:
                    {
                        var user = res.data.user;
                        user.isOnline = subType === __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["b" /* TOPIC_SUBTYPES */].ONLINE;
                        return callback(user, meta);
                    }
                case __WEBPACK_IMPORTED_MODULE_1__world_channel_constants__["a" /* TOPICS */].CONSENSUS:
                    {
                        // const { name, stage } = payload;
                        return callback(payload, meta);
                    }
                default:
                    callback.call(context, res);
                    break;
            }
        };
        return oldsubs.call(channel, '', filterByType, context, subscribeOptions);
    };
    return channel;
}

/***/ }),
/* 50 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return TOPIC_SUBTYPES; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TOPICS; });
var TOPIC_SUBTYPES = {
    VARIABLES: 'variables',
    OPERATIONS: 'operation',
    RESET: 'new',
    ONLINE: 'connect',
    OFFLINE: 'disconnect',
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
    CREATE: 'create',
    UPDATE: 'update'
};

var TOPICS = {
    ALL: '',

    RUN: 'run',
    RUN_VARIABLES: 'run/' + TOPIC_SUBTYPES.VARIABLES,
    RUN_OPERATIONS: 'run/' + TOPIC_SUBTYPES.OPERATIONS,
    RUN_RESET: 'run/' + TOPIC_SUBTYPES.RESET,

    PRESENCE: 'user',
    PRESENCE_ONLINE: 'user/' + TOPIC_SUBTYPES.ONLINE,
    PRESENCE_OFFLINE: 'user/' + TOPIC_SUBTYPES.OFFLINE,

    ROLES: 'world',
    ROLES_ASSIGN: 'world/' + TOPIC_SUBTYPES.ASSIGN,
    ROLES_UNASSIGN: 'world/' + TOPIC_SUBTYPES.UNASSIGN,

    CONSENSUS: 'consensus',
    CONSENSUS_CREATE: 'consensus/' + TOPIC_SUBTYPES.CREATE,
    CONSENSUS_UPDATE: 'consensus/' + TOPIC_SUBTYPES.UPDATE
};

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
* ## User API Adapter
*
* The User API Adapter allows you to retrieve details about end users in your team (account). It is based on the querying capabilities of the underlying RESTful [User API](../../../rest_apis/user_management/user/).
*
* To use the User API Adapter, instantiate it and then call its methods.
*
*       var ua = new F.service.User({
*           account: 'acme-simulations',
*           token: 'user-or-project-access-token'
*       });
*       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
*       ua.get({ userName: 'jsmith' });
*       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
*                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
*
* The constructor takes an optional `options` parameter in which you can specify the `account` and `token` if they are not already available in the current context.
*/

var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var SessionManager = __webpack_require__(1);

var _require = __webpack_require__(6),
    toQueryFormat = _require.toQueryFormat;

module.exports = function (config) {
    var defaults = {

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: undefined,

        /**
         * The access token to use when searching for end users. (See [more background on access tokens](../../../project_access/)).
         * @type {String}
         */
        token: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('user')
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
        * Retrieve details about particular end users in your team, based on user name or user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.get({ userName: 'jsmith' });
        *       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
        *
        * **Parameters**
        * @param {object} filter Object with field `userName` and value of the username. Alternatively, object with field `id` and value of an array of user ids.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        get: function (filter, options) {
            options = options || {};
            filter = filter || {};

            var getOptions = $.extend(true, {}, serviceOptions, options);

            var toQFilter = function (filter) {
                var res = {};

                // API only supports filtering by username for now
                if (filter.userName) {
                    res.q = filter.userName;
                }

                return res;
            };

            var toIdFilters = function (id) {
                if (!id) {
                    return '';
                }

                id = Array.isArray(id) ? id : [id];
                return 'id=' + id.join('&id=');
            };

            var getFilters = ['account=' + getOptions.account, toIdFilters(filter.id), toQueryFormat(toQFilter(filter))].join('&');

            // special case for queries with large number of ids
            // make it as a post with GET semantics
            var threshold = 30;
            if (filter.id && Array.isArray(filter.id) && filter.id.length >= threshold) {
                getOptions.url = urlConfig.getAPIPath('user') + '?_method=GET';
                return http.post({ id: filter.id }, getOptions);
            } else {
                return http.get(getFilters, getOptions);
            }
        },

        /**
        * Retrieve details about a single end user in your team, based on user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
        *
        * **Parameters**
        * @param {string} userId The user id for the end user in your team.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        }
    };

    $.extend(this, publicAPI);
};

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * ## Asset API Adapter
 *
 * The Asset API Adapter allows you to store assets -- resources or files of any kind -- used by a project with a scope that is specific to project, group, or end user.
 *
 * Assets are used with [team projects](../../../project_admin/#team). One common use case is having end users in a [group](../../../glossary/#groups) or in a [multiplayer world](../../../glossary/#world) upload data -- videos created during game play, profile pictures for customizing their experience, etc. -- as part of playing through the project.
 *
 * Resources created using the Asset Adapter are scoped:
 *
 *  * Project assets are writable only by [team members](../../../glossary/#team), that is, Epicenter authors.
 *  * Group assets are writable by anyone with access to the project that is part of that particular [group](../../../glossary/#groups). This includes all [team members](../../../glossary/#team) (Epicenter authors) and any [end users](../../../glossary/#users) who are members of the group -- both facilitators and standard end users.
 *  * User assets are writable by the specific end user, and by the facilitator of the group.
 *  * All assets are readable by anyone with the exact URI.
 *
 * To use the Asset Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface) and project id (**Project ID**). The group name is required for assets with a group scope, and the group name and userId are required for assets with a user scope. If not included, they are taken from the logged in user's session information if needed.
 *
 * When creating an asset, you can pass in text (encoded data) to the `create()` call. Alternatively, you can make the `create()` call as part of an HTML form and pass in a file uploaded via the form.
 *
 *       // instantiate the Asset Adapter
 *       var aa = new F.service.Asset({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1',
 *          userId: '12345'
 *       });
 *
 *       // create a new asset using encoded text
 *       aa.create('test.txt', {
 *           encoding: 'BASE_64',
 *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
 *           contentType: 'text/plain'
 *       }, { scope: 'user' });
 *
 *       // alternatively, create a new asset using a file uploaded through a form
 *       // this sample code goes with an html form that looks like this:
 *       //
 *       // <form id="upload-file">
 *       //   <input id="file" type="file">
 *       //   <input id="filename" type="text" value="myFile.txt">
 *       //   <button type="submit">Upload myFile</button>
 *       // </form>
 *       //
 *       $('#upload-file').on('submit', function (e) {
 *          e.preventDefault();
 *          var filename = $('#filename').val();
 *          var data = new FormData();
 *          var inputControl = $('#file')[0];
 *          data.append('file', inputControl.files[0], filename);
 *
 *          aa.create(filename, data, { scope: 'user' });
 *       });
 *
 */



var ConfigService = __webpack_require__(2).default;
var TransportFactory = __webpack_require__(0).default;
var _pick = __webpack_require__(4).pick;
var SessionManager = __webpack_require__(1);

var apiEndpoint = 'asset';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,
        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,
        /**
         * The group name. Defaults to session's `groupName`.
         * @type {String}
         */
        group: undefined,
        /**
         * The user id. Defaults to session's `userId`.
         * @type {String}
         */
        userId: undefined,
        /**
         * The scope for the asset. Valid values are: `user`, `group`, and `project`. See above for the required permissions to write to each scope. Defaults to `user`, meaning the current end user or a facilitator in the end user's group can edit the asset.
         * @type {String}
         */
        scope: 'user',
        /**
         * Determines if a request to list the assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`). Defaults to `true`.
         * @type {boolean}
         */
        fullUrl: true,
        /**
         * The transport object contains the options passed to the XHR request.
         * @type {object}
         */
        transport: {
            processData: false
        }
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    if (!serviceOptions.project) {
        serviceOptions.project = urlConfig.projectPath;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var assetApiParams = ['encoding', 'data', 'contentType'];
    var scopeConfig = {
        user: ['scope', 'account', 'project', 'group', 'userId'],
        group: ['scope', 'account', 'project', 'group'],
        project: ['scope', 'account', 'project']
    };

    var validateFilename = function (filename) {
        if (!filename) {
            throw new Error('filename is needed.');
        }
    };

    var validateUrlParams = function (options) {
        var partKeys = scopeConfig[options.scope];
        if (!partKeys) {
            throw new Error('scope parameter is needed.');
        }

        $.each(partKeys, function () {
            if (!options[this]) {
                throw new Error(this + ' parameter is needed.');
            }
        });
    };

    var buildUrl = function (filename, options) {
        validateUrlParams(options);
        var partKeys = scopeConfig[options.scope];
        var parts = $.map(partKeys, function (key) {
            return options[key];
        });
        if (filename) {
            // This prevents adding a trailing / in the URL as the Asset API
            // does not work correctly with it
            filename = '/' + filename;
        }
        return urlConfig.getAPIPath(apiEndpoint) + parts.join('/') + filename;
    };

    // Private function, all requests follow a more or less same approach to
    // use the Asset API and the difference is the HTTP verb
    //
    // @param {string} method` (Required) HTTP verb
    // @param {string} filename` (Required) Name of the file to delete/replace/create
    // @param {object} params` (Optional) Body parameters to send to the Asset API
    // @param {object} options` (Optional) Options object to override global options.
    var upload = function (method, filename, params, options) {
        validateFilename(filename);
        // make sure the parameter is clean
        method = method.toLowerCase();
        var contentType = params instanceof FormData === true ? false : 'application/json';
        if (contentType === 'application/json') {
            // whitelist the fields that we actually can send to the api
            params = _pick(params, assetApiParams);
        } else {
            // else we're sending form data which goes directly in request body
            // For multipart/form-data uploads the filename is not set in the URL,
            // it's getting picked by the FormData field filename.
            filename = method === 'post' || method === 'put' ? '' : filename;
        }
        var urlOptions = $.extend({}, serviceOptions, options);
        var url = buildUrl(filename, urlOptions);
        var createOptions = $.extend(true, {}, urlOptions, { url: url, contentType: contentType });

        return http[method](params, createOptions);
    };

    var publicAPI = {
        /**
        * Creates a file in the Asset API. The server returns an error (status code `409`, conflict) if the file already exists, so
        * check first with a `list()` or a `get()`.
        *
        *  **Example**
        *
        *       var aa = new F.service.Asset({
        *          account: 'acme-simulations',
        *          project: 'supply-chain-game',
        *          group: 'team1',
        *          userId: ''
        *       });
        *
        *       // create a new asset using encoded text
        *       aa.create('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, create a new asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="upload-file">
        *       //   <input id="file" type="file">
        *       //   <input id="filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Upload myFile</button>
        *       // </form>
        *       //
        *       $('#upload-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.create(filename, data, { scope: 'user' });
        *       });
        *
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to create.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (filename, params, options) {
            return upload('post', filename, params, options);
        },

        /**
        * Gets a file from the Asset API, fetching the asset content. (To get a list
        * of the assets in a scope, use `list()`.)
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to retrieve.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        get: function (filename, options) {
            var getServiceOptions = _pick(serviceOptions, ['scope', 'account', 'project', 'group', 'userId']);
            var urlOptions = $.extend({}, getServiceOptions, options);
            var url = buildUrl(filename, urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });

            return http.get({}, getOptions);
        },

        /**
        * Gets the list of the assets in a scope.
        *
        * **Example**
        *
        *       aa.list({ fullUrl: true }).then(function(fileList){
        *           console.log('array of files = ', fileList);
        *       });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @param {string} options.scope (Optional) The scope (`user`, `group`, `project`).
        * @param {boolean} options.fullUrl (Optional) Determines if the list of assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`).
        * @return {Promise}
        */
        list: function (options) {
            var dtd = $.Deferred();
            var me = this;
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl('', urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });
            var fullUrl = getOptions.fullUrl;

            if (!fullUrl) {
                return http.get({}, getOptions);
            }

            http.get({}, getOptions).then(function (files) {
                var fullPathFiles = $.map(files, function (file) {
                    return buildUrl(file, urlOptions);
                });
                dtd.resolveWith(me, [fullPathFiles]);
            }).fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Replaces an existing file in the Asset API.
        *
        * **Example**
        *
        *       // replace an asset using encoded text
        *       aa.replace('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHNlY29uZCB0ZXN0IGZpbGUu',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, replace an asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="replace-file">
        *       //   <input id="file" type="file">
        *       //   <input id="replace-filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Replace myFile</button>
        *       // </form>
        *       //
        *       $('#replace-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#replace-filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.replace(filename, data, { scope: 'user' });
        *       });
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file being replaced.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        replace: function (filename, params, options) {
            return upload('put', filename, params, options);
        },

        /**
        * Deletes a file from the Asset API.
        *
        * **Example**
        *
        *       aa.delete(sampleFileName);
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to delete.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        delete: function (filename, options) {
            return upload('delete', filename, {}, options);
        },

        assetUrl: function (filename, options) {
            var urlOptions = $.extend({}, serviceOptions, options);
            return buildUrl(filename, urlOptions);
        }
    };
    $.extend(this, publicAPI);
};

/***/ }),
/* 53 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_data_api_service__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_time_api_service__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_store_session_manager__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_store_session_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_store_session_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_util_pubsub__ = __webpack_require__(54);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__start_time_strategies__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__timer_actions_reducer__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__timer_constants__ = __webpack_require__(19);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }











function getStore(options) {
    var ds = new __WEBPACK_IMPORTED_MODULE_0_service_data_api_service__["default"]($.extend(true, {}, options, {
        root: 'timer',
        scope: options.scope
    }));
    return ds;
}

function getStateFromActions(actions, currentTime, options) {
    var getStartTime = Object(__WEBPACK_IMPORTED_MODULE_4__start_time_strategies__["b" /* default */])(options.strategy);
    var startTime = getStartTime(actions, options.strategyOptions);
    var state = Object(__WEBPACK_IMPORTED_MODULE_5__timer_actions_reducer__["a" /* default */])(actions, startTime, currentTime);
    return state;
}

/**
 * @typedef {object} TimerOptions
 * @name TimerOptions
 * @property {string} [account] The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
 * @property {string} [project] The project id. Defaults to empty string. If left undefined, taken from the URL.
 * @property {string} [token] For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
 * @property {object} [transport] Options to pass on to the underlying transport layer
 * @property {string} [name] Key to associate with this specific timer, use to disassociate multiple timers with the same scope
 * @property {string} [scope] Determines the specificity of the timer, see DataService for available scopes
 * @property {string|function} [strategy] strategy to use to resolve start time. Available strategies are 'first-user' (default) or 'last-user'. Can also take in a function to return a custom start time.
 */

var TimerService = function () {
    /**
     * @param {TimerOptions} options 
     */
    function TimerService(options) {
        _classCallCheck(this, TimerService);

        var defaults = {
            account: undefined,
            project: undefined,
            token: undefined,
            transport: {},
            name: 'timer',
            strategy: __WEBPACK_IMPORTED_MODULE_4__start_time_strategies__["a" /* STRATEGIES */].START_BY_FIRST_USER,
            strategyOptions: {}
        };

        this.ACTIONS = __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */];

        /** @type {TimerOptions} */
        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new __WEBPACK_IMPORTED_MODULE_2_store_session_manager___default.a(this.options);
        this.channel = new __WEBPACK_IMPORTED_MODULE_3_util_pubsub__["a" /* default */]();

        this.interval = null;
        this.dataChannelSubid = null;
    }

    /**
     * Creates a new Timer. Call `start` to start ticking.
     * 
     * @param {object} createOptions
     * @param {number} createOptions.timeLimit Limit for the timer, in milliseconds
     * @param {boolean} createOptions.startImmediately Determines if the timer should start ticking immediately. If set to false (default) call timer.start to start ticking.
     * 
     * @returns {Promise}
     */


    _createClass(TimerService, [{
        key: 'create',
        value: function create(createOptions) {
            var _this = this;

            var options = this.sessionManager.getMergedOptions(this.options, createOptions);
            if (!options || isNaN(+options.timeLimit)) {
                throw new Error('Timer: expected integer timeLimit, received ' + options.timeLimit);
            }
            var ds = getStore(options);
            var createAction = {
                type: __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].CREATE,
                timeLimit: options.timeLimit,
                user: options.user
            };

            var prom = options.startImmediately ? this.makeAction(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].START) : $.Deferred().resolve([]).promise();

            return prom.then(function (actions) {
                return ds.saveAs(options.name, {
                    actions: [].concat(createAction, actions)
                });
            }).then(function (doc) {
                var actions = doc.actions;
                var lastAction = actions[actions.length - 1];
                var currentTime = lastAction.time; //Created won't have a time but that's okay, reduceActions handles it
                var state = getStateFromActions(actions, currentTime, _this.options);
                return state;
            });
        }

        /**
         * Get the current timer, or create a new one and immediately start it
         * 
         * @param {object} options
         * @param {number} options.timeLimit Limit for the timer, in milliseconds
         * 
         * @returns {Promise}
         */

    }, {
        key: 'autoStart',
        value: function autoStart(options) {
            var _this2 = this;

            return this.getState().catch(function () {
                var createOpts = $.extend(true, {}, options, { startImmediately: true });
                return _this2.create(createOpts);
            });
        }

        /**
         * Cancels current timer. Need to call `create` again to restart.
         * 
         * @returns {Promise}
         */

    }, {
        key: 'cancel',
        value: function cancel() {
            var merged = this.sessionManager.getMergedOptions(this.options);
            var ds = getStore(merged);

            clearInterval(this.interval);
            this.interval = null;
            if (this.dataChannelSubid) {
                var channel = ds.getChannel();
                channel.unsubscribe(this.dataChannelSubid);
            }
            return ds.remove(merged.name);
        }
    }, {
        key: 'makeAction',
        value: function makeAction(action) {
            var merged = this.sessionManager.getMergedOptions(this.options);
            return this.getCurrentTime().then(function (t) {
                return {
                    type: action,
                    time: t.toISOString(),
                    user: merged.user
                };
            });
        }

        /**
         * Adds a custom action to the timer state. Only relevant if you're implementing a custom strategy.
         * 
         * @param {string} action
         * @returns {Promise}
         */

    }, {
        key: 'addTimerAction',
        value: function addTimerAction(action) {
            var _this3 = this;

            var merged = this.sessionManager.getMergedOptions(this.options);
            var ds = getStore(merged);

            return this.makeAction(action).then(function (action) {
                return ds.pushToArray(merged.name + '/actions', action).then(function (actions) {
                    var state = getStateFromActions(actions, action.time, _this3.options);
                    return state;
                }, function (res) {
                    if (res.status === 404) {
                        var errorMsg = 'Timer not found. Did you create it yet?';
                        console.error(errorMsg);
                        throw new Error(errorMsg);
                    }
                    throw res;
                });
            });
        }

        /**
         * Start the timer
         * 
         * @returns {Promise}
         */

    }, {
        key: 'start',
        value: function start() {
            return this.addTimerAction(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].START);
        }

        /**
         * Pause the timer
         * 
         * @returns {Promise}
         */

    }, {
        key: 'pause',
        value: function pause() {
            return this.addTimerAction(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].PAUSE);
        }

        /**
         * Resumes a paused timer
         * 
         * @returns {Promise}
         */

    }, {
        key: 'resume',
        value: function resume() {
            return this.addTimerAction(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].RESUME);
        }

        /**
         * Helper method to return current server time
         * 
         * @returns {Promise<Date>}
         */

    }, {
        key: 'getCurrentTime',
        value: function getCurrentTime() {
            var merged = this.sessionManager.getMergedOptions(this.options);
            var ts = new __WEBPACK_IMPORTED_MODULE_1_service_time_api_service__["default"](merged);
            return ts.getTime();
        }

        /**
         * Resumes current state of the timer, including time elapsed and remaining
         * 
         * @returns {Promise}
         */

    }, {
        key: 'getState',
        value: function getState() {
            var _this4 = this;

            var merged = this.sessionManager.getMergedOptions(this.options);
            var ds = getStore(merged);
            return ds.load(merged.name).then(function (doc) {
                return _this4.getCurrentTime().then(function (currentTime) {
                    var actions = doc.actions;
                    var state = getStateFromActions(actions, currentTime, _this4.options);
                    return $.extend(true, {}, doc, state);
                });
            }, function () {
                throw new Error('Timer has not been created yet');
            });
        }

        /**
         * Resumes a channel to hook into for timer notifications.
         * 
         * @returns {object}
         */

    }, {
        key: 'getChannel',
        value: function getChannel() {
            var merged = this.sessionManager.getMergedOptions(this.options);
            var ds = getStore(merged);
            var dataChannel = ds.getChannel();
            var me = this;

            function cancelTimer() {
                clearInterval(me.interval);
                me.interval = null;
            }
            function createTimer(actions, currentTime) {
                if (me.interval || !merged.tickInterval) {
                    return;
                }
                me.interval = setInterval(function () {
                    currentTime = currentTime + merged.tickInterval;
                    var state = getStateFromActions(actions, currentTime, me.options);
                    if (state.remaining.time === 0) {
                        me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].COMPLETE, state);

                        dataChannel.unsubscribe(me.dataChannelSubid);
                        cancelTimer();
                    }
                    me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].TICK, state);
                }, merged.tickInterval);

                var state = getStateFromActions(actions, currentTime, me.options);
                me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].TICK, state);
            }

            me.dataChannelSubid = dataChannel.subscribe('', function (res, meta) {
                if (meta.dataPath.indexOf('/actions') === -1) {
                    //create
                    if (meta.subType === 'delete') {
                        me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].RESET);
                        cancelTimer();
                    } else {
                        var createAction = res.actions[0];
                        me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].CREATE, createAction);
                    }
                } else {
                    var actions = res; //you only get the array back
                    var lastAction = actions[actions.length - 1];

                    me.channel.publish(lastAction.type, lastAction);

                    if (lastAction.type === __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].START || lastAction.type === __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].RESUME) {
                        return me.getCurrentTime().then(function (currentTime) {
                            createTimer(actions, +currentTime);
                        });
                    } else if (lastAction.type === __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].PAUSE) {
                        cancelTimer();
                    }
                }
            });

            //TODO: Don't do the ajax request till someone calls subscribe
            me.getState().then(function (state) {
                //failure means timer hasn't been created, in which case the datachannel subscription should handle 
                if (state.isStarted) {
                    if (state.isPaused || state.remaining.time <= 0) {
                        me.channel.publish(__WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */].TICK, state);
                    } else {
                        createTimer(state.actions, state.currentTime);
                    }
                }
            });

            return this.channel;
        }
    }]);

    return TimerService;
}();

TimerService.ACTIONS = __WEBPACK_IMPORTED_MODULE_6__timer_constants__["a" /* ACTIONS */];
TimerService.SCOPES = __WEBPACK_IMPORTED_MODULE_0_service_data_api_service__["default"].SCOPES;
TimerService.STRATEGY = __WEBPACK_IMPORTED_MODULE_4__start_time_strategies__["a" /* STRATEGIES */];

/* harmony default export */ __webpack_exports__["default"] = (TimerService);

/***/ }),
/* 54 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export objectToPublishable */
/* unused harmony export publishableToObject */
/* unused harmony export normalizeParamOptions */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_util_array_utils__ = __webpack_require__(35);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


/**
 * @typedef Publishable
 * @property {string} name
 * @property {*} value
 */

/**
  * @typedef Subscription
  * @prop {string} id
  * @prop {Function} callback
  * @prop {string[]} topics
  */

/**
 * @param {object} obj
 * @return {Publishable[]}
 */
function objectToPublishable(obj) {
    var mapped = Object.keys(obj || {}).map(function (t) {
        return { name: t, value: obj[t] };
    });
    return mapped;
}

/**
 * Converts arrays of the form [{ name: '', value: ''}] to {[name]: value}
 * @param {Publishable[]} arr
 * @param {object} [mergeWith]
 * @returns {object}
 */
function publishableToObject(arr, mergeWith) {
    var result = (arr || []).reduce(function (accum, topic) {
        accum[topic.name] = topic.value;
        return accum;
    }, $.extend(true, {}, mergeWith));
    return result;
}

/**
 * @typedef NormalizedParam
 * @property {Publishable[]} params
 * @property {Object} options
 */

/**
 *
 * @param {String|Object|array} topic 
 * @param {*} publishValue 
 * @param {Object} [options]
 * @return {NormalizedParam}
 */
function normalizeParamOptions(topic, publishValue, options) {
    if (!topic) {
        return { params: [], options: {} };
    }
    if ($.isPlainObject(topic)) {
        return { params: objectToPublishable(topic), options: publishValue };
    }
    if (Array.isArray(topic)) {
        return { params: topic, options: publishValue };
    }
    return { params: [{ name: topic, value: publishValue }], options: options };
}

var i = 0;
function uniqueId(prefix) {
    i++;
    return '' + (prefix || '') + i;
}

/**
 * 
 * @param {String[]|String} topics 
 * @param {Function} callback 
 * @param {Object} options
 * @return {Subscription}
 */
function makeSubs(topics, callback, options) {
    var id = uniqueId('subs-');
    var defaults = {
        batch: false
    };
    var opts = $.extend({}, defaults, options);
    if (!callback) {
        throw new Error('subscribe callback should be a function');
    }
    return $.extend(true, {
        id: id,
        topics: [].concat(topics).map(function (t) {
            return t.toLowerCase();
        }),
        callback: callback
    }, opts);
}

/**
* @param {Publishable[]} topics
* @param {Subscription} subscription 
*/
function checkAndNotifyBatch(topics, subscription) {
    var merged = $.extend(true, {}, publishableToObject(topics));
    var keys = Object.keys(merged).map(function (k) {
        return k.toLowerCase();
    });
    var matchingTopics = Object(__WEBPACK_IMPORTED_MODULE_0_util_array_utils__["a" /* intersection */])(keys, subscription.topics);
    if (matchingTopics.length > 0) {
        var toSend = subscription.topics.reduce(function (accum, topic) {
            accum[topic] = merged[topic];
            return accum;
        }, {});

        if (matchingTopics.length === subscription.topics.length) {
            subscription.callback(toSend);
        }
    }
}

/**
 * @param {Publishable[]} topics
 * @param {Subscription} subscription 
 */
function checkAndNotify(topics, subscription) {
    topics.forEach(function (topic) {
        if (subscription.topics.indexOf(topic.name.toLowerCase()) !== -1 || subscription.topics.indexOf('*') !== -1) {
            subscription.callback(topic.value);
        }
    });
}

var PubSub = function () {
    function PubSub(options) {
        _classCallCheck(this, PubSub);

        this.subscriptions = [];
    }

    /**
     * @param {String | Publishable } topic
     * @param {any} [value] item to publish
     * @param {Object} [options]
     * @return {Promise}
     */


    _createClass(PubSub, [{
        key: 'publish',
        value: function publish(topic, value, options) {
            var normalized = normalizeParamOptions(topic, value, options);
            // console.log('notify', normalized.params);
            return this.subscriptions.forEach(function (subs) {
                var fn = subs.batch ? checkAndNotifyBatch : checkAndNotify;
                fn(normalized.params, subs);
            });
        }

        /**
         * @param {String[] | String} topics
         * @param {Function} cb
         * @param {Object} [options]
         * @return {String}
         */

    }, {
        key: 'subscribe',
        value: function subscribe(topics, cb, options) {
            var subs = makeSubs(topics, cb, options);
            this.subscriptions = this.subscriptions.concat(subs);
            return subs.id;
        }

        /**
         * @param {String} token
         */

    }, {
        key: 'unsubscribe',
        value: function unsubscribe(token) {
            var olderLength = this.subscriptions.length;
            if (!olderLength) {
                throw new Error('No subscriptions found to unsubscribe from');
            }

            var remaining = this.subscriptions.filter(function (subs) {
                return subs.id !== token;
            });
            if (remaining.length === olderLength) {
                throw new Error('No subscription found for token ' + token);
            }
            this.subscriptions = remaining;
        }
    }, {
        key: 'unsubscribeAll',
        value: function unsubscribeAll() {
            this.subscriptions = [];
        }
    }]);

    return PubSub;
}();

/* harmony default export */ __webpack_exports__["a"] = (PubSub);

/***/ }),
/* 55 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return STRATEGIES; });
/* harmony export (immutable) */ __webpack_exports__["b"] = getStrategy;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__start_on_first_user__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__start_when_all_users__ = __webpack_require__(57);
var _list;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var STRATEGIES = {
    START_BY_FIRST_USER: 'first-user',
    START_WHEN_ALL_USERS: 'all-users'
};

var list = (_list = {}, _defineProperty(_list, STRATEGIES.START_BY_FIRST_USER, __WEBPACK_IMPORTED_MODULE_0__start_on_first_user__["a" /* default */]), _defineProperty(_list, STRATEGIES.START_WHEN_ALL_USERS, __WEBPACK_IMPORTED_MODULE_1__start_when_all_users__["a" /* default */]), _list);

function getStrategy(strategy) {
    if (typeof strategy === 'function') {
        return strategy;
    } else if (list[strategy]) {
        return list[strategy];
    }
    throw new Error('Invalid timer strategy ' + strategy);
}

/***/ }),
/* 56 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = reduceActions;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__start_when_user_condition__ = __webpack_require__(36);


function reduceActions(actions) {
    return Object(__WEBPACK_IMPORTED_MODULE_0__start_when_user_condition__["a" /* default */])(actions, {
        condition: function (users) {
            return users.length > 0;
        }
    });
}

/***/ }),
/* 57 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = reduceActions;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__start_when_user_condition__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_util_array_utils__ = __webpack_require__(35);



function reduceActions(actions, options) {
    var opts = $.extend({
        requiredUsernames: []
    }, options);

    if (!opts.requiredUsernames.length) {
        throw new Error('This strategy requires passing in requiredUsernames under strategyOptions');
    }
    return Object(__WEBPACK_IMPORTED_MODULE_0__start_when_user_condition__["a" /* default */])(actions, {
        condition: function (joinedUsers) {
            var joinedNames = joinedUsers.map(function (u) {
                return u.userName;
            });
            var requiredUsersJoined = Object(__WEBPACK_IMPORTED_MODULE_1_util_array_utils__["a" /* intersection */])(opts.requiredUsernames, joinedNames);
            return requiredUsersJoined.length >= opts.requiredUsernames.length;
        }
    });
}

/***/ }),
/* 58 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = reduceActions;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__timer_constants__ = __webpack_require__(19);


function toDetailedTime(ts) {
    var time = Math.max(0, ts);

    var secs = Math.floor(time / 1000);
    var minutesRemaining = Math.floor(secs / 60);
    var secondsRemaining = Math.floor(secs % 60);
    return {
        time: ts,
        minutes: minutesRemaining,
        seconds: secondsRemaining
    };
}

/**
 * @param {object[]} actions 
 * @param {number} startTime
 * @param {number} [currentTime] 
 * @returns {object}
 */
function reduceActions(actions, startTime, currentTime) {
    if (!actions || !actions.length) {
        return {};
    }
    var initialState = {
        lastPausedTime: 0,
        totalPauseTime: 0,
        elapsedTime: 0,
        timeLimit: 0,
        isPaused: false,
        isStarted: !!startTime
    };
    var reduced = actions.reduce(function (accum, action) {
        var ts = +new Date(action.time);
        if (action.type === __WEBPACK_IMPORTED_MODULE_0__timer_constants__["a" /* ACTIONS */].CREATE) {
            accum.timeLimit = action.timeLimit;
        } else if (action.type === __WEBPACK_IMPORTED_MODULE_0__timer_constants__["a" /* ACTIONS */].PAUSE && !accum.lastPausedTime) {
            accum.lastPausedTime = ts;
            accum.elapsedTime = ts - startTime;
            accum.isPaused = true;
        } else if (action.type === __WEBPACK_IMPORTED_MODULE_0__timer_constants__["a" /* ACTIONS */].RESUME && accum.lastPausedTime) {
            var pausedTime = ts - accum.lastPausedTime;
            accum.totalPauseTime += pausedTime;
            accum.lastPausedTime = 0;
            accum.elapsedTime = 0;
            accum.isPaused = false;
        }
        return accum;
    }, initialState);

    var elapsed = 0;

    var base = {};

    if (currentTime) {
        var current = +new Date(currentTime);
        base.currentTime = current;

        if (reduced.isPaused) {
            elapsed = reduced.elapsedTime;
        } else if (reduced.isStarted) {
            elapsed = current - startTime - reduced.totalPauseTime;
        }
    }

    var remaining = Math.max(0, reduced.timeLimit - elapsed);

    return $.extend(true, {}, base, {
        isPaused: reduced.isPaused,
        isStarted: reduced.isStarted,
        elapsed: toDetailedTime(elapsed),
        remaining: toDetailedTime(remaining)
    });
}

/***/ }),
/* 59 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_store_session_manager__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_store_session_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_store_session_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_util_object_util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_service_utils__ = __webpack_require__(5);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 
 * ## Password Service
 *
 * The primary use-case for the Password Service is to allow end-users to reset their passwords. 
 * 
 */





var API_ENDPOINT = 'password';

var PasswordService = function () {
    function PasswordService(config) {
        _classCallCheck(this, PasswordService);

        var defaults = {
            /**
             * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
             * @type {string}
             */
            account: undefined,
            /**
             * The project id. Defaults to empty string. If left undefined, taken from the URL.
             * @type {string}
             */
            project: undefined,

            //Options to pass on to the underlying transport layer
            transport: {}
        };
        this.sessionManager = new __WEBPACK_IMPORTED_MODULE_0_store_session_manager___default.a();
        var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
        this.serviceOptions = serviceOptions;
    }

    /**
     * Send a password reset email for the provided userName.
     * 
     * **Example**
            var ps = new F.service.Password();
            ps.resetPassword('myuserName@gmail.com', {
                redirectUrl: 'login.html',
                subject: 'Please reset your password',
                projectFullName: 'My Awesome Project'
            });
      * This will send the following email
     * 
     * Subject: Please reset your password
     * To: myuserName@gmail.com
     * From: support@forio.com
     * Body:
     * You have requested a password reset for the user endUser@acmesimulations.com in My Awesome Project. 
     * 
     * If you did not initiate this request, please ignore this email.
     * 
     * To reset your password, please click the following link: https://forio.com/epicenter/recover/<password recovery token>
      * @param {string} userName user to reset password for 
     * @param {object} [resetParams] 
     * @param {string} [resetParams.redirectUrl] URL to redirect to after password is reset. Defaults to project root. If relative, it's treated as being relative to project
     * @param {string} [resetParams.subject] Subject for reset password email
     * @param {string} [resetParams.projectFullName] Text to use within body. Text will be of the form `You have requested a password reset for the user {userName} in {projectFullName}.
     * @param {object} [options] overrides for service options
     * @returns {Promise}
     */


    _createClass(PasswordService, [{
        key: 'resetPassword',
        value: function resetPassword(userName, resetParams, options) {
            var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
            var urlConfig = Object(__WEBPACK_IMPORTED_MODULE_2_service_service_utils__["d" /* getURLConfig */])(mergedOptions);
            var http = Object(__WEBPACK_IMPORTED_MODULE_2_service_service_utils__["c" /* getHTTPTransport */])(mergedOptions.transport, {
                url: urlConfig.getAPIPath(API_ENDPOINT + '/recovery')
            });

            if (!userName) {
                throw new Error('resetPassword: missing userName');
            }

            var defaults = Object(__WEBPACK_IMPORTED_MODULE_1_util_object_util__["pick"])(resetParams, ['projectFullName', 'subject', 'redirectUrl']);
            var postParams = $.extend({}, {
                userName: userName,
                redirectUrl: '',
                account: urlConfig.accountPath
            }, defaults);

            var isRelativeURL = postParams.redirectUrl.indexOf('http') !== 0;
            if (isRelativeURL) {
                var protocol = urlConfig.protocol,
                    actingHost = urlConfig.actingHost,
                    accountPath = urlConfig.accountPath,
                    projectPath = urlConfig.projectPath;

                var absURL = [actingHost, accountPath, projectPath, postParams.redirectUrl.replace(/^\//, '')].join('/');
                postParams.redirectUrl = protocol + '://' + absURL;
            }
            return http.post(postParams);
        }
    }]);

    return PasswordService;
}();

/* harmony default export */ __webpack_exports__["default"] = (PasswordService);

/***/ }),
/* 60 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["default"] = ProjectAPIService;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_service_service_utils__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__ = __webpack_require__(0);
/**
 *
 * ## Project API Adapter
 *
 * The Project API allows reading/writing project settings. An author/admin project token is required for most operations.
 *
 *      var ps = new F.service.Project({  account: 'acme', project: 'sample', token: 'author-or-project-access-token' });
 *      ps.getProjectSettings();
 */




var API_ENDPOINT = 'project';
var MULTIPLAYER_ENDPOINT = 'multiplayer/project';

function ProjectAPIService(config) {
    var defaults = {
        /**
         * Epicenter account name. Defaults to undefined.
         * @type {string}
         */
        account: undefined,

        /**
         * Epicenter project name. Defaults to undefined.
         * @type {string}
         */
        project: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };

    function getHTTP(overrides) {
        var serviceOptions = Object(__WEBPACK_IMPORTED_MODULE_0_service_service_utils__["b" /* getDefaultOptions */])(defaults, config, {
            apiEndpoint: API_ENDPOINT
        }, overrides);
        var http = new __WEBPACK_IMPORTED_MODULE_1_transport_http_transport_factory__["default"](serviceOptions.transport);
        return http;
    }

    var publicAPI = {
        /**
         * Get current settings for project
         * 
         * @param {object} [options] 
         * @returns {Promise}
         */
        getProjectSettings: function (options) {
            var http = getHTTP(options);
            return http.get();
        },
        /**
         * Update settings for project
         * 
         * @param {object} settings New settings to apply 
         * @param {object} [options] 
         * @returns {Promise}
         */
        updateProjectSettings: function (settings, options) {
            var http = getHTTP(options);
            return http.patch(settings);
        },

        /**
         * Get current multiplayer settings for project
         * 
         * @param {object} [options] 
         * @returns {Promise}
         */
        getMultiplayerSettings: function (options) {
            var overrides = $.extend({}, options, {
                apiEndpoint: MULTIPLAYER_ENDPOINT
            });
            var http = getHTTP(overrides);
            return http.get();
        },

        /**
         * Update multiplayer settings for project - usually used to add roles on the fly
         * 
         * @param {object} settings 
         * @param {{ autoCreate: boolean}} [options] 
         * @param {object} [serviceOverrides] 
         * @returns {Promise}
         */
        updateMultiplayerSettings: function (settings, options, serviceOverrides) {
            var overrides = $.extend({}, serviceOverrides, {
                apiEndpoint: MULTIPLAYER_ENDPOINT
            });
            var http = getHTTP(overrides);
            if (options && options.autoCreate) {
                return http.put(settings);
            } else {
                return http.patch(settings);
            }
        }
    };
    return publicAPI;
}

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
* ## Scenario Manager
*
* In some projects, often called "turn-by-turn" projects, end users advance through the project's model step-by-step, working either individually or together to make decisions at each step. 
*
* In other projects, often called "run comparison" or "scenario comparison" projects, end users set some initial decisions, then simulate the model to its end. Typically end users will do this several times, creating several runs, and compare the results. 
*
* The Scenario Manager makes it easy to create these "run comparison" projects. Each Scenario Manager allows you to compare the results of several runs. This is mostly useful for time-based models; by default, you can use the Scenario Manager with [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). (You can use the Scenario Manager with other languages as well, by using the Scenario Manager's [configuration options](#configuration-options) to change the `advanceOperation`.)
*
* The Scenario Manager can be thought of as a collection of [Run Managers](../run-manager/) with pre-configured [strategies](../strategies/). Just as the Run Manager provides use case -based abstractions and utilities for managing the [Run Service](../run-api-service/), the Scenario Manager does the same for the Run Manager.
*
* There are typically three components to building a run comparison:
*
* * A `current` run in which to make decisions; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run maintains state across different sessions.
* * A list of `saved` runs, that is, all runs that you want to use for comparisons.
* * A `baseline` run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. Comparing against a baseline run is optional; you can [configure](#configuration-options) the Scenario Manager to not include one.
*
* To satisfy these needs a Scenario Manager instance has three Run Managers: [baseline](./baseline/), [current](./current/), and [savedRuns](./saved/).
*
* ### Using the Scenario Manager to create a run comparison project
*
* To use the Scenario Manager, instantiate it, then access its Run Managers as needed to create your project's user interface:
*
* **Example**
*
*       var sm = new F.manager.ScenarioManager({
*           run: {
*               model: 'mymodel.vmf'
*           }
*       });
*
*       // The current is an instance of a Run Manager,
*       // with a strategy which picks up the most recent unsaved run.
*       // It is typically used to store the decisions being made by the end user. 
*       var currentRM = sm.current;
*
*       // The Run Manager operation, which retrieves the current run.
*       sm.current.getRun();
*       // The Run Manager operation, which resets the decisions made on the current run.
*       sm.current.reset();
*       // A special method on the current run,
*       // which clones the current run, then advances and saves this clone
*       // (it becomes part of the saved runs list).
*       // The current run is unchanged and can continue to be used
*       // to store decisions being made by the end user.
*       sm.current.saveAndAdvance();
*
*       // The savedRuns is an instance of a Saved Runs Manager 
*       // (itself a variant of a Run Manager).
*       // It is typically displayed in the project's UI as part of a run comparison table or chart.
*       var savedRM = sm.savedRuns;
*       // Mark a run as saved, adding it to the set of saved runs.
*       sm.savedRuns.save(run);
*       // Mark a run as removed, removing it from the set of saved runs.
*       sm.savedRuns.remove(run);
*       // List the saved runs, optionally including some specific model variables for each.
*       sm.savedRuns.getRuns();
*
*       // The baseline is an instance of a Run Manager,
*       // with a strategy which locates the most recent baseline run
*       // (that is, flagged as `saved` and not `trashed`), or creates a new one.
*       // It is typically displayed in the project's UI as part of a run comparison table or chart.
*       var baselineRM = sm.baseline;
*
*       // The Run Manager operation, which retrieves the baseline run.
*       sm.baseline.getRun();
*       // The Run Manager operation, which resets the baseline run.
*       // Useful if the model has changed since the baseline run was created.
*       sm.baseline.reset(); 
*/



// See integration-test-scenario-manager for usage examples

var RunManager = __webpack_require__(20).default;
var SavedRunsManager = __webpack_require__(40);

var strategyUtils = __webpack_require__(7);
var rutil = __webpack_require__(8);

var NoneStrategy = __webpack_require__(12);

var StateService = __webpack_require__(33);
var RunService = __webpack_require__(9);

var BaselineStrategy = __webpack_require__(69);
var LastUnsavedStrategy = __webpack_require__(70);

var defaults = {
    /**
     * Operations to perform on each run to indicate that the run is complete. Operations are executed [serially](../run-api-service/#serial). Defaults to calling the model operation `stepTo('end')`, which advances Vensim, Powersim, and SimLang models to the end. 
     * @type {Array}
     */
    advanceOperation: [{ name: 'stepTo', params: ['end'] }],

    /**
     * Additional options to pass through to run creation (for e.g., `files`, etc.). Defaults to empty object.
     * @type {Object}
     */
    run: {},

    /**
     * Whether or not to include a baseline run in this Scenario Manager. Defaults to `true`.
     * @type {Boolean}
     */
    includeBaseLine: true,

    /**
     * Additional configuration for the `baseline` run. 
     *
     * * `baseline.runName`: Name of the baseline run. Defaults to 'Baseline'. 
     * * `baseline.run`: Additional options to pass through to run creation, specifically for the baseline run. These will override any options provided under `run`. Defaults to empty object. 
     * @type {Object}
     */
    baseline: {
        runName: 'Baseline',
        run: {}
    },

    /**
     * Additional configuration for the `current` run. 
     *
     * * `current.run`: Additional options to pass through to run creation, specifically for the current run. These will override any options provided under `run`. Defaults to empty object.
     * @type {Object}
     */
    current: {
        run: {}
    },

    /**
     * Options to pass through to the `savedRuns` list. See the [Saved Runs Manager](./saved/) for complete description of available options. Defaults to empty object.
     * @type {Object}
     */
    savedRuns: {}
};

function cookieNameFromOptions(prefix, config) {
    var key = ['account', 'project', 'model'].reduce(function (accum, key) {
        return config[key] ? accum + '-' + config[key] : accum;
    }, prefix);
    return key;
}

function ScenarioManager(config) {
    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }

    var BaselineStrategyToUse = opts.includeBaseLine ? BaselineStrategy : NoneStrategy;
    /**
     * A [Run Manager](../run-manager/) instance containing a 'baseline' run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. By default the "advance" operation is assumed to be `stepTo: end`, which works for time-based models in [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). If you're using a different language, or need to change this, just pass in a different `advanceOperation` option while creating the Scenario Manager. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {RunManager}
     */
    this.baseline = new RunManager({
        strategy: BaselineStrategyToUse,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-baseline-run'),
        run: strategyUtils.mergeRunOptions(opts.run, opts.baseline.run),
        strategyOptions: {
            baselineName: opts.baseline.runName,
            initOperation: opts.advanceOperation
        }
    });

    /**
     * A [SavedRunsManager](../saved-runs-manager/) instance containing a list of saved runs, that is, all runs that you want to use for comparisons. The saved runs are typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {SavedRunsManager}
     */
    this.savedRuns = new SavedRunsManager($.extend(true, {}, {
        run: opts.run
    }, opts.savedRuns));

    var origGetRuns = this.savedRuns.getRuns;
    var me = this;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        return me.baseline.getRun().then(function () {
            return origGetRuns.apply(me.savedRuns, args);
        });
    };

    /**
     * A [Run Manager](../run-manager/) instance containing a 'current' run; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run is typically used to store the decisions being made by the end user.
     * @return {RunManager}
     */
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-current-run'),
        run: strategyUtils.mergeRunOptions(opts.run, opts.current.run)
    });

    /**
     * Clones the current run, advances this clone by calling the `advanceOperation`, and saves the cloned run (it becomes part of the `savedRuns` list). Additionally, adds any provided metadata to the cloned run; typically used for naming the run. The current run is unchanged and can continue to be used to store decisions being made by the end user.
     *
     * Available only for the Scenario Manager's `current` property (Run Manager). 
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.current.saveAndAdvance({'myRunName': 'sample policy decisions'});
     *
     * **Parameters**
     * @param  {Object} metadata   Metadata to save, for example, the run name.
     * @return {Promise}
     */
    this.current.saveAndAdvance = function (metadata) {
        function clone(run) {
            var sa = new StateService();
            var advanceOpns = rutil.normalizeOperations(opts.advanceOperation);
            //run i'm cloning shouldn't have the advance operations there by default, but just in case
            return sa.clone({ runId: run.id, exclude: advanceOpns.ops }).then(function (response) {
                var rs = new RunService(me.current.run.getCurrentConfig());
                return rs.load(response.run);
            });
        }
        function markSaved(run) {
            return me.savedRuns.save(run.id, metadata).then(function (savedResponse) {
                return $.extend(true, {}, run, savedResponse);
            });
        }
        function advance(run) {
            var rs = new RunService(run);
            return rs.serial(opts.advanceOperation).then(function () {
                return run;
            });
        }
        return me.current.getRun().then(clone).then(advance).then(markSaved);
    };
}

module.exports = ScenarioManager;

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `new-if-initialized` strategy creates a new run if the current one is in memory or has its `initialized` field set to `true`. The `initialized` field in the run record is automatically set to `true` at run creation, but can be changed.
 * 
 * This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model is stepped to the end). It is similar to the `new-if-missing` strategy, except that it checks a field of the run record.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie. 
 *  * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options.
 *  * If the cookie exists, check whether the run is in memory or only persisted in the database. Additionally, check whether the run's `initialized` field is `true`. 
 *      * If the run is in memory, create a new run.
 *      * If the run's `initialized` field is `true`, create a new run.
 *      * Otherwise, use the existing run.
 *  * If the cookie does not exist, create a new run for this end user.
 *  
 *  @deprecated Consider using `reuse-last-initialized` instead
 */



var classFrom = __webpack_require__(3);
var ConditionalStrategy = __webpack_require__(11);

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
        console.warn('This strategy is deprecated; all runs now default to being initialized by default making this redundant. Consider using `reuse-last-initialized` instead.');
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent' || run.initialized;
    }
});

module.exports = Strategy;

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `new-if-persisted` strategy creates a new run when the current one becomes persisted (end user is idle for a set period), but otherwise uses the current one. 
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. 
 * 
 * However, if they are idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../../updating_your_settings/)), then their run is persisted; the next time they interact with the project, they will get a new run. (See more background on [Run Persistence](../../../run_persistence/).)
 * 
 * This strategy is useful for multi-page projects where end users play through a simulation in one sitting, stepping through the model sequentially (for example, a Vensim model that uses the `step` operation) or calling specific functions until the model is "complete." However, you will need to guarantee that your end users will remain engaged with the project from beginning to end &mdash; or at least, that if they are idle for longer than the **Model Session Timeout**, it is okay for them to start the project from scratch (with an uninitialized model). 
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *   * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options.
 *   * If the cookie exists, check whether the run is in memory or only persisted in the database. 
 *      * If the run is in memory, use the run.
 *      * If the run is only persisted (and not still in memory), create a new run for this end user.
 *      * If the cookie does not exist, create a new run for this end user.
 *
 * @deprecated The run-service now sets a header to automatically bring back runs into memory
 */



var classFrom = __webpack_require__(3);
var ConditionalStrategy = __webpack_require__(11);

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
        console.warn('This strategy is deprecated; the run-service now sets a header to automatically bring back runs into memory');
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `multiplayer` strategy is for use with [multiplayer worlds](../../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../world-api-adapter/). If you use the [World Manager](../world-manager/), you are automatically using this strategy.
 * 
 * Using this strategy means that end users in projects with multiplayer worlds always see the most current world and run. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.
 */


var classFrom = __webpack_require__(3);

var IdentityStrategy = __webpack_require__(12);
var WorldApiAdapter = __webpack_require__(10).default;

var defaults = {};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function (options) {
        this.options = $.extend(true, {}, defaults, options);
        this.worldApi = new WorldApiAdapter(this.options.run);
    },

    reset: function (runService, session, options) {
        var curUserId = session.userId;
        var curGroupName = session.groupName;

        var optionsToPassOn = $.extend(true, {}, options, {
            success: $.noop
        });
        return this.worldApi.getCurrentWorldForUser(curUserId, curGroupName).then(function (world) {
            return this.worldApi.newRunForWorld(world.id, optionsToPassOn).then(function (runid) {
                var toReturn = {
                    id: runid
                };
                if (options && options.success) options.success(toReturn);
                return toReturn;
            });
        }.bind(this));
    },

    getRun: function (runService, session) {
        var curUserId = session.userId;
        var curGroupName = session.groupName;
        var worldApi = this.worldApi;
        var model = this.options.model;
        var me = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 401, type: 'UNAUTHORIZED', message: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, type: 'NO_WORLD_FOR_USER', message: 'The user is not in any world.' }, { options: me.options, session: session });
            }
            return worldApi.getCurrentRunId({ model: model, filter: world.id }).then(function (id) {
                return runService.load(id);
            }).then(function (run) {
                run.world = world;
                return run;
            }).then(dtd.resolve).catch(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            return dtd.reject(error, session, me.options);
        };

        this.worldApi.getCurrentWorldForUser(curUserId, curGroupName).then(loadRunFromWorld).fail(serverError);

        return dtd.promise();
    }

});

module.exports = Strategy;

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `reuse-never` strategy always creates a new run for this end user irrespective of current state. This is equivalent to calling `F.service.Run.create()` from the [Run Service](../run-api-service/) every time. 
 * 
 * This strategy means that every time your end users refresh their browsers, they get a new run. 
 * 
 * This strategy can be useful for basic, single-page projects. This strategy is also useful for prototyping or project development: it creates a new run each time you refresh the page, and you can easily check the outputs of the model. However, typically you will use one of the other strategies for a production project.
 *
 * @name always-new
 */



var classFrom = __webpack_require__(3);
var ConditionalStrategy = __webpack_require__(11);

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
    },

    createIf: function (run, headers) {
        // always create a new run!
        return true;
    }
});

module.exports = Strategy;

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `reuse-per-session` strategy creates a new run when the current one is not in the browser cookie.
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. However, if end users log out and return to the project at a later date, a new run is created.
 *
 * This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model that is stepped to the end as soon as it is created). In contrast, if end users play with your project for an extended period of time, executing the model step by step, the `reuse-across-sessions` strategy is probably a better choice (it allows end users to pick up where they left off, rather than starting from scratch each browser session).
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *     * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options. 
 *     * If the cookie exists, use the run id stored there. 
 *     * If the cookie does not exist, create a new run for this end user.
 *
 * @name new-if-missing
 */



var classFrom = __webpack_require__(3);
var ConditionalStrategy = __webpack_require__(11);

var __super = ConditionalStrategy.prototype;

/*
*  create a new run only if nothing is stored in the cookie
*  this is useful for baseRuns.
*/
var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
    },

    createIf: function (run, headers) {
        // if we are here, it means that the run exists... so we don't need a new one
        return false;
    }
});

module.exports = Strategy;

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * The `reuse-across-sessions` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.
 *
 * This strategy is useful if end users are using your project for an extended period of time, possibly over several sessions. This is most common in cases where a user of your project executes the model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end).
 *
 * Specifically, the strategy is:
 * 
 * * Check if there are any runs for this end user.
 *     * If there are no runs (either in memory or in the database), create a new one.
 *     * If there are runs, take the latest (most recent) one.
 *
 * @name persistent-single-player
 */



var classFrom = __webpack_require__(3);
var IdentityStrategy = __webpack_require__(12);

var _require = __webpack_require__(7),
    injectFiltersFromSession = _require.injectFiltersFromSession,
    injectScopeFromSession = _require.injectScopeFromSession;

var defaults = {
    /**
     * (Optional) Additional criteria to use while selecting the last run
     * @type {Object}
     */
    filter: {}
};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt, options).then(function (run) {
            run.freshlyCreated = true;
            return run;
        });
    },

    getRun: function (runService, userSession, runSession, options) {
        var filter = injectFiltersFromSession(this.options.filter, userSession);
        var me = this;
        return runService.query(filter, {
            startrecord: 0,
            endrecord: 0,
            sort: 'created',
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});

module.exports = Strategy;

/***/ }),
/* 68 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["reset"] = reset;
function reset(params, options, manager) {
    return manager.reset(options);
}

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * ## Baseline
 *
 * An instance of a [Run Manager](../../run-manager/) with a baseline strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.baseline`.
 *
 * A baseline is defined as a run "advanced to the end" using just the model defaults. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
 *
 * The `baseline` strategy looks for the most recent run named as 'Baseline' (or named as specified in the `baseline.runName` [configuration option of the Scenario Manager](../#configuration-options)) that is flagged as `saved` and not `trashed`. If the strategy cannot find such a run, it creates a new run and immediately executes a set of initialization operations. 
 *
 * Comparing against a baseline run is optional in a Scenario Manager; you can [configure](../#configuration-options) your Scenario Manager to not include one. See [more information](../#properties) on using `.baseline` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 *
 */



var ReuseinitStrategy = __webpack_require__(39);

module.exports = function (options) {
    var defaults = {
        baselineName: 'Baseline',
        initOperation: [{ stepTo: 'end' }]
    };
    var strategyOptions = options ? options.strategyOptions : {};
    var opts = $.extend({}, defaults, strategyOptions);
    return new ReuseinitStrategy({
        strategyOptions: {
            initOperation: opts.initOperation,
            flag: {
                saved: true,
                trashed: false,
                name: opts.baselineName
            }
        }
    });
};

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * ## Current (reuse-last-unsaved)
 *
 * An instance of a [Run Manager](../../run-manager/) with this strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.current`.
 *
 * The `reuse-last-unsaved` strategy returns the most recent run that is not flagged as `trashed` and also not flagged as `saved`.
 * 
 * Using this strategy means that end users continue working with the most recent run that has not been explicitly flagged by the project. However, if there are no runs for this end user, a new run is created.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `saved` and `trashed` fields of the run to determine if the run has been explicitly saved or explicitly flagged as no longer useful.
 *     * Return the most recent run that is not `trashed` and also not `saved`.
 *     * If there are no runs, create a new run for this end user. 
 *
 * See [more information](../#properties) on using `.current` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 */



var classFrom = __webpack_require__(3);
var injectFiltersFromSession = __webpack_require__(7).injectFiltersFromSession;
var injectScopeFromSession = __webpack_require__(7).injectScopeFromSession;

var Base = {};

//TODO: Make a more generic version of this called 'reuse-by-matching-filter';
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt, options).then(function (createResponse) {
            return $.extend(true, {}, createResponse, { freshlyCreated: true });
        });
    },

    getRun: function (runService, userSession, opts) {
        var runopts = runService.getCurrentConfig();
        var filter = injectFiltersFromSession({
            saved: false,
            trashed: false,
            model: runopts.model
        }, userSession);
        var me = this;
        var outputModifiers = {
            startrecord: 0,
            endrecord: 0,
            sort: 'created',
            direction: 'desc'
        };
        return runService.query(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            return runs[0];
        });
    }
}, { requiresAuth: false });

/***/ }),
/* 71 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_world_manager__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_managers_world_manager___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_managers_world_manager__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_service_world_api_adapter__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_service_consensus_api_service_consensus_group_service__ = __webpack_require__(37);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__strategies_mandatory_consensus_strategy__ = __webpack_require__(72);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }







function getCurrentWorldIdAndRoles(opts) {
    if (opts.id && opts.roles) {
        return $.Deferred().resolve({
            id: opts.id,
            roles: opts.roles
        }).promise();
    } else if (opts.worldId) {
        var ws = new __WEBPACK_IMPORTED_MODULE_1_service_world_api_adapter__["default"]();
        return ws.load(opts.worldId);
    } else {
        var wm = new __WEBPACK_IMPORTED_MODULE_0_managers_world_manager___default.a(opts);
        return wm.getCurrentWorld();
    }
}

var ConsensusManager = function () {
    function ConsensusManager(config) {
        _classCallCheck(this, ConsensusManager);

        var opts = {
            name: 'default',
            strategy: '',
            strategyOptions: {}
        };

        this.serviceOptions = $.extend(true, {}, opts, config);
    }

    _createClass(ConsensusManager, [{
        key: 'getCurrent',
        value: function getCurrent() {
            var _this = this;

            return getCurrentWorldIdAndRoles(this.serviceOptions).then(function (world) {
                var cg = new __WEBPACK_IMPORTED_MODULE_2_service_consensus_api_service_consensus_group_service__["default"]($.extend({}, _this.serviceOptions, {
                    worldId: world.id
                }));
                return Object(__WEBPACK_IMPORTED_MODULE_3__strategies_mandatory_consensus_strategy__["a" /* default */])(cg, {
                    roles: world.roles
                });
            });
        }
    }]);

    return ConsensusManager;
}();

/* harmony default export */ __webpack_exports__["default"] = (ConsensusManager);

/***/ }),
/* 72 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = mandatoryConsensusStrategy;

/**
 * 
 */

function mandatoryConsensusStrategy(consensusGroup, strategyOptions) {
    var options = $.extend({}, {
        maxRounds: 8,
        name: function (list) {
            return 'round-' + (list.length + 1);
        }
    }, strategyOptions);
    return consensusGroup.list().then(function (consensusList) {
        var lastConsensus = consensusList[consensusList.length - 1];
        var isLastPending = lastConsensus && !lastConsensus.closed;
        if (isLastPending) {
            return lastConsensus;
        }

        var allowCreateNew = options.maxRounds >= consensusList.length;
        if (!allowCreateNew) {
            throw new Error('CONSENSUS_LIMIT_REACHED');
        }
        var name = options.name(consensusList);
        var newConsensusPromise = consensusGroup.consensus(name).create({
            roles: options.roles,
            executeActionsImmediately: false
        });
        return newConsensusPromise;
    });
}

/***/ })
/******/ ]);
//# sourceMappingURL=epicenter.js.map