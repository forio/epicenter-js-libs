;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var F = {
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    },

};

F.util.query = require('./util/query-util');
F.util.makeSequence = require('./util/make-sequence');
F.util.run = require('./util/run-util');
F.util.classForm = require('./util/inherit');

F.factory.Transport = require('./transport/http-transport-factory');
F.transport.Ajax = require('./transport/ajax-http-transport');

F.service.URL = require('./service/url-config-service');
F.service.Config = require('./service/configuration-service');
F.service.Run = require('./service/run-api-service');
F.service.Variables = require('./service/variables-api-service');
F.service.Data = require('./service/data-api-service');
F.service.Auth = require('./service/auth-api-service');

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager');
F.manager.RunManager = require('./managers/run-manager');

F.manager.strategy['always-new'] = require('./managers/run-strategies/always-new-strategy');
F.manager.strategy['conditional-creation'] = require('./managers/run-strategies/conditional-creation-strategy');
F.manager.strategy.identity = require('./managers/run-strategies/identity-strategy');
F.manager.strategy['new-if-missing'] = require('./managers/run-strategies/new-if-missing-strategy');
F.manager.strategy['new-if-missing'] = require('./managers/run-strategies/new-if-missing-strategy');
F.manager.strategy['new-if-persisted'] = require('./managers/run-strategies/new-if-persisted-strategy');
F.manager.strategy['new-if-initialized'] = require('./managers/run-strategies/new-if-initialized-strategy');

F.version = '<%= version %>';
window.F = F;


},{"./util/query-util":2,"./util/make-sequence":3,"./util/run-util":4,"./util/inherit":5,"./transport/http-transport-factory":6,"./transport/ajax-http-transport":7,"./service/url-config-service":8,"./service/configuration-service":9,"./service/run-api-service":10,"./service/variables-api-service":11,"./service/data-api-service":12,"./service/auth-api-service":13,"./store/cookie-store":14,"./store/store-factory":15,"./managers/scenario-manager":16,"./managers/run-manager":17,"./managers/run-strategies/always-new-strategy":18,"./managers/run-strategies/conditional-creation-strategy":19,"./managers/run-strategies/identity-strategy":20,"./managers/run-strategies/new-if-missing-strategy":21,"./managers/run-strategies/new-if-persisted-strategy":22,"./managers/run-strategies/new-if-initialized-strategy":23}],2:[function(require,module,exports){
/**
 * Utilities for working with query strings
*/
'use strict';

module.exports = (function () {

    return {
        /**
         * Converts to matrix format
         * @param  {Object} qs Object to convert to query string
         * @return { string}    Matrix-format query parameters
         */
        toMatrixFormat: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return ';';
            }
            if (typeof qs === 'string' || qs instanceof String) {
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
        },

        /**
         * Converts strings/arrays/objects to type 'a=b&b=c'
         * @param  { string|Array|Object} qs
         * @return { string}
         */
        toQueryFormat: function (qs) {
            if (qs === null || qs === undefined) {
                return '';
            }
            if (typeof qs === 'string' || qs instanceof String) {
                return qs;
            }

            var returnArray = [];
            $.each(qs, function (key, value) {
                if ($.isArray(value)) {
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
        },

        /**
         * Converts strings of type 'a=b&b=c' to { a:b, b:c}
         * @param  { string} qs
         * @return {object}
         */
        qsToObject: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return {};
            }

            var qsArray = qs.split('&');
            var returnObj = {};
            $.each(qsArray, function (index, value) {
                var qKey = value.split('=')[0];
                var qVal = value.split('=')[1];

                if (qVal.indexOf(',') !== -1) {
                    qVal = qVal.split(',');
                }

                returnObj[qKey] = qVal;
            });

            return returnObj;
        },

        /**
         * Normalizes and merges strings of type 'a=b', { b:c} to { a:b, b:c}
         * @param  { string|Array|Object} qs1
         * @param  { string|Array|Object} qs2
         * @return {Object}
         */
        mergeQS: function (qs1, qs2) {
            var obj1 = this.qsToObject(this.toQueryFormat(qs1));
            var obj2 = this.qsToObject(this.toQueryFormat(qs2));
            return $.extend(true, {}, obj1, obj2);
        },

        addTrailingSlash: function (url) {
            if (!url) {
                return '';
            }
            return (url.charAt(url.length - 1) === '/') ? url : (url + '/');
        }
    };
}());




},{}],3:[function(require,module,exports){
'use strict';
/*jshint loopfunc:false */

function _w(val) {
    if (val && val.then) {
        return val;
    }
    var p = $.Deferred();
    p.resolve(val);

    return p.promise();
}

function seq() {
    var list = Array.prototype.slice.apply(arguments);

    function next(p) {
        var cur = list.splice(0,1)[0];

        if (!cur) {
            return p;
        }

        return _w(cur(p)).then(next);
    }

    return function (seed) {
        return next(seed).fail(seq.fail);
    };
}

function MakeSeq(obj) {
    var res = {
        __calls: [],

        original: obj,

        then: function (fn) {
            this.__calls.push(fn);
            return this;
        },

        start: function () {
            var _this = this;

            // clean up
            this.then(function (run) {
                _this.__calls.length = 0;
                return run;
            });

            return seq.apply(null, this.__calls)();
        },

        fail: function (fn) {
            seq.fail = fn;
            return this;
        }
    };

    var funcMaker = function (p, obj) {
        var fn = obj[p].bind(obj);
        return function () {
            var args = Array.prototype.slice.apply(arguments);
            this.__calls.push(Function.bind.apply(fn, [null].concat(args)));
            return this;
        };
    };

    for (var prop in obj) {
        if (typeof obj[prop] === 'function') {
            res[prop] = funcMaker(prop, obj);
        } else {
            res[prop] = obj[prop];
        }
    }

    return res;
}

module.exports = MakeSeq;

},{}],5:[function(require,module,exports){
/**
/* Inherit from a class (using prototype borrowing)
*/
'use strict';

function inherit(C, P) {
    var F = function () {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.__super = P.prototype;
    C.prototype.constructor = C;
}

/**
* Shallow copy of an object
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j<obj.length; j++) {
        if (!(current = obj[j])) {
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        /*jshint -W089 */
        for (var key in current) {
            dest[key] = current[key];
        }
    }

    return dest;
};

module.exports = function (base, props, staticProps) {
    var parent = base;
    var child;

    child = props && props.hasOwnProperty('constructor') ? props.constructor : function () { return parent.apply(this, arguments); };

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

},{}],4:[function(require,module,exports){
/**
 * Utilities for working with the run service
*/
'use strict';

module.exports = (function () {
    return {
        /**
         * returns operations of the form [[op1,op2], [arg1, arg2]]
         * @param  {Object|Array|String} operations operations to perform
         * @param  { array} arugments for operation
         * @return { string}    Matrix-format query parameters
         */
        normalizeOperations: function (operations, args) {
            if (!args) {
                args = [];
            }
            var returnList = {
                ops: [],
                args: []
            };

            var _concat = function (arr) {
                return (arr !== null && arr !== undefined) ? [].concat(arr) : [];
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
                return ((operation.name) ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
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
            } else if ($.isArray(operations)) {
                _normalizeArrays(operations, args, returnList);
            } else {
                _normalizeLiterals(operations, args, returnList);
            }

            return returnList;
        }
    };
}());

},{}],8:[function(require,module,exports){
'use strict';

module.exports = function (config) {
    //TODO: urlutils to get host, since no window on node

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        host: (function () {
            var host = window.location.host;
            if (!host || host.indexOf('localhost') !== -1) {
                host = 'forio.com';
            }
            return (HOST_API_MAPPING[host]) ? HOST_API_MAPPING[host] : 'api.' + host;
        }()),

        appPath: (function () {
            var path = window.location.pathname.split('\/');

            return path && path[1] || '';
        }()),

        accountPath: (function () {
            var accnt = '';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }()),

        projectPath: (function () {
            var prj = '';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                prj = path[3];
            }
            return prj;
        }()),

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data'];
            var apiPath = this.protocol + '://' + this.host + '/' + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath  + '/';
            }
            return apiPath;
        }
    };

    $.extend(publicExports, config);
    return publicExports;
};

},{}],14:[function(require,module,exports){
/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({ root: 'people' });
        people
            .save({lastName: 'smith' })

 */


'use strict';

module.exports = function (config) {
    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: '.forio.com'
    };
    var serviceOptions = $.extend({}, defaults, config);

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
            var setOptions = $.extend(true, {}, serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;

            document.cookie = encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '');

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
            var cookieReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var val = document.cookie.replace(cookieReg, '$1');
            val = decodeURIComponent(val) || null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;

            document.cookie = encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            (domain ? '; domain=' + domain : '') +
                            (path ? '; path=' + path : '');
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(cookieKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};

},{}],6:[function(require,module,exports){
'use strict';

var isNode = false;
var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
module.exports = transport;

},{"./node-http-transport":24,"./ajax-http-transport":7}],7:[function(require,module,exports){
'use strict';

var qutils = require('../util/query-util');

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
         * @type {[type] }
         */
        parameterParser: qutils.toQueryFormat,

        // To allow epicenter.token and other session cookies to be passed
        // with the requests
        xhrFields: {
            withCredentials: true
        }
    };

    var transportOptions = $.extend({}, defaults, config);

    var result = function (d) {
        return ($.isFunction(d)) ? d() : d;
    };

    var connect = function (method, params, connectOptions) {
        params = result(params);
        params = ($.isPlainObject(params) || $.isArray(params)) ? JSON.stringify(params) : params;

        var options = $.extend(true, {}, transportOptions, connectOptions, {
            type: method,
            data: params
        });
        var ALLOWED_TO_BE_FUNCTIONS = ['data', 'url'];
        $.each(options, function (key, value) {
            if ($.isFunction(value) && $.inArray(key, ALLOWED_TO_BE_FUNCTIONS) !== -1) {
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
        return $.ajax(options);
    };

    var publicAPI = {
        get:function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            return connect.call(this, 'GET', params, options);
        },
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
                var delimiter = (result(options.url).indexOf('?') === -1) ? '?' : '&';
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

},{"../util/query-util":2}],9:[function(require,module,exports){
(function(){/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     var cs = require('configuration-service')({
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

'use strict';
var urlService = require('./url-config-service');

module.exports = function (config) {
    //TODO: Environments
    var defaults = {
        logLevel: 'NONE'
    };
    var serviceOptions = $.extend({}, defaults, config);
    serviceOptions.server = urlService(serviceOptions.server);

    return {

        data: serviceOptions,

        /**
         * Set the environment key to get configuration options from
         * @param { string} env
         */
        setEnv: function (env) {

        },

        /**
         * Get configuration.
         * @param  { string} property optional
         * @return {*}          Value of property if specified, the entire config object otherwise
         */
        get: function (property) {
            return serviceOptions[property];
        },

        /**
         * Set configuration.
         * @param  { string|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
         * @param  {*} value  value for provided key
         */
        set: function (key, value) {
            serviceOptions[key] = value;
        }
    };
};


})()
},{"./url-config-service":8}],10:[function(require,module,exports){
/**
 *
 * ##Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults.
 *
 * Typically, you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager.
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *       });
 *       rm.getRun()
 *           .then(function() {
 *               // the RunManager.run contains the instantiated Run Service,
 *               // so any Run Service method is valid here
 *               var rs = rm.run;
 *               rs.do('runModel');
 *       })
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
var qutil = require('../util/query-util');
var rutil = require('../util/run-util');
var TransportFactory = require('../transport/http-transport-factory');
var VariablesService = require('./variables-api-service');

function _pick(obj, props) {
    var res = {};
    for (var p in obj) {
        if (props.indexOf(p) !== -1) {
            res[p] = obj[p];
        }
    }

    return res;
}

module.exports = function (config) {
    // config || (config = configService.get());
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type { string}
         */
        token: store.get('epicenter.project.token') || '',

        /**
         * The account id. In the Epicenter UI, this is the "Team ID" (for team projects) or "User ID" (for personal projects). Defaults to empty string.
         * @type { string}
         */
        account: '',

        /**
         * The project id. Defaults to empty string.
         * @type { string}
         */
        project: '',

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         */
        error: $.noop,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };

    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function () {
        var url = urlConfig.getAPIPath('run');
        var filter = qutil.toMatrixFormat(serviceOptions.filter);

        if (filter) {
            url += filter + '/';
        }
        return url;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getFilterURL
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var setFilterOrThrowError = function (options) {
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `always-new`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
         *
         *  **Example**
         *
         *      rs.create('hello_world.jl');
         *
         *  **Parameters**
         * @param { string} `model` The name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
         */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('run') });
            var runApiParams = ['model', 'scope', 'files'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, runApiParams);
            }

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
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
         * @param {Object} `qs` Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        query: function (qs, outputModifier, options) {
            serviceOptions.filter = qs; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`.
         *
         * **Parameters**
         * @param {Object} `filter` Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            } else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables, pass them as part of the `filters` parameter.
         *
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed in your Julia model &mdash; are available.
         *
         * **Example**
         *
         *     rs.load('bb589677-d476-4971-a68e-0c58d191e450', { include: ['.price', '.sales'] });
         *
         * **Parameters**
         * @param { string} `runID` The run id.
         * @param {Object} `filters` (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        load: function (runID, filters, options) {
            serviceOptions.filter = runID; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(filters, httpOptions);
        },


        //Saving data
        /**
         * Save attributes (data, model variables) of the run.
         *
         * **Examples**
         *
         *     rs.save({ completed: true });
         *     rs.save({ saved: true, variables: { a: 23, b: 23 } });
         *
         * **Parameters**
         * @param {Object} `attributes` The run data and variables to save. Model variables must be included in a `variables` field within the `attributes` object (otherwise they are treated as run data and added to the run record directly).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            return http.patch(attributes, httpOptions);
        },

        //##Operations
        /**
         * Call a method from the model.
         *
         * The method must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *      // method "solve" takes no arguments
         *     rs.do('solve');
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', ['hello']);
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', 'hello');
         *      // method "sumArray" takes one argument, an array
         *     rs.do('sumArray', [[4,2,1]]);
         *      // method "add" takes two arguments, both integers
         *     rs.do({ name:'add', params:[2,4] });
         *
         * **Parameters**
         * @param { string} `operation` Name of method.
         * @param { array} `params` (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else {
                if ($.isPlainObject(params)) {
                    opsArgs = null;
                    postOptions = params;
                } else {
                    opsArgs = params;
                }
            }
            var result = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            return http.post({ arguments: prms }, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several methods from the model, sequentially.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Examples**
         *
         *      // methods "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // methods "init" and "reset" take two arguments each
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'reset', params: [2,3] }]);
         *      // method "init" takes two arguments,
         *      // method "runmodel" takes none
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'runmodel', params: [] }]);
         *
         * **Parameters**
         * @param { array[String]|Array[Object] } `operations` If none of the methods take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var doSingleOp = function () {
                var op = ops.shift();
                var arg = args.shift();

                me.do(op, arg, {
                    success: function () {
                        if (ops.length) {
                            doSingleOp();
                        } else {
                            $d.resolve.apply(this, arguments);
                            postOptions.success.apply(this, arguments);
                        }
                    },
                    error: function () {
                        $d.reject.apply(this, arguments);
                        postOptions.error.apply(this, arguments);
                    }
                });
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Call several methods from the model, executing them in parallel.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Example**
         *
         *      // methods "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel([ { name: 'add', params: [1,2] },
         *                   { name: 'subtract', params:[2,3] }]);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * **Parameters**
         * @param { array|Object} `operations` If none of the methods take parameters, pass an array of the method names (as strings). If any of the methods do take parameters, you have two options. You can pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the method name and a (possibly empty) array of parameters.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue  = [];
            for (var i = 0; i< ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }
            $.when.apply(this, queue)
                .done(function () {
                    $d.resolve.apply(this, arguments);
                    postOptions.success.apply(this.arguments);
                })
                .fail(function () {
                    $d.reject.apply(this, arguments);
                    postOptions.error.apply(this.arguments);
                });

            return $d.promise();
        }
    };

    var publicSyncAPI = {
        /**
         * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
         *
         * **Example**
         *
         *      var vs = rs.variables();
         *      vs.save({ sample_int: 4});
         *
         * **Parameters**
         * @param {Object} `config` (Optional) Overrides for configuration options.
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


},{"./configuration-service":9,"../store/store-factory":15,"../util/query-util":2,"../util/run-util":4,"../transport/http-transport-factory":6,"./variables-api-service":11}],11:[function(require,module,exports){
/**
 *
 * ##Variables API Service
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


 'use strict';

 var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        /**
         * The runs object to which the variable filters apply. Defaults to null.
         * @type { runService }
         */
        runService: null
    };
    var serviceOptions = $.extend({}, defaults, config);

    var getURL = function () {
        return serviceOptions.runService.urlConfig.getFilterURL() + 'variables/';
    };

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int');
         *
         * **Parameters**
         * @param { string} `variable` Name of variable to load.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        load: function (variable, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales']);
         *      vs.query({ include:['price', 'sales'] });
         *
         * **Parameters**
         * @param {Object|Array} `query` The names of the variables requested.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {object} `options` (Optional) Overrides for configuration options.
         *
         */
        query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            if ($.isArray(query)) {
                query = { include: query };
            }
            $.extend(query, outputModifier);
            return http.get(query, httpOptions);
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
         * @param {Object|String} `variable` An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} `val` (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
        //  * @param {object} options Overrides for configuration options
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

},{"../transport/http-transport-factory":6}],13:[function(require,module,exports){
/**
 *
 * ##Authentication API Service
 *
 * The Authentication API Service provides methods for logging in and creating user access tokens.
 * User access tokens are required for each call to Epicenter. (See [Creating access tokens](../../../project_access/) for more information.)
 *
 *      var auth = new F.service.Auth();
 *      auth.login({ userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd' });
 *      auth.logout();
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        /**
         * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
         * @type { string}
         */
        store: { synchronous: true },

        /**
         * Email or username to use for logging in. Defaults to empty string.
         * @type { string}
         */
        userName: '',

        /**
         * Password for specified username. Defaults to empty string.
         * @type { string}
         */
        password: '',

        /**
         * Account to log in into. Required to log in as an end user. Defaults to picking it up from the path.
         * @type { string}
         */
        account: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('authentication')
    });
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Logs user in. If no username or password was provided in the initial configuration options, they are required here.
         *
         * **Example**
         *
         *      auth.login({ userName: 'jsmith@acmesimulations.com',
         *                  password: 'passw0rd',
         *                  account: 'acme' });
         *
         * **Parameters**
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        login: function (options) {
            var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);
            if (!httpOptions.userName || !httpOptions.password) {
                throw new Error('No username or password specified.');
            }

            var postParams = {
                userName: httpOptions.userName,
                password: httpOptions.password,
            };
            if (httpOptions.account) {
                //pass in null for account under options if you don't want it to be sent
                postParams.account = httpOptions.account;
            }

            return http.post(postParams, httpOptions);
        },

        /**
         * Logs user out from specified accounts.
         *
         * **Example**
         *
         *      auth.logout();
         *
         * **Parameters**
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        logout: function (options) {
            var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);
            if (!httpOptions.token) {
                throw new Error('No token was specified.');
            }
            var slash = httpOptions.url.slice(-1) === '/' ? '' : '/';
            httpOptions.url = httpOptions.url + slash + httpOptions.token;
            var deleteParams = {};

            return http.delete(deleteParams, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};

},{"./configuration-service":9,"../transport/http-transport-factory":6}],12:[function(require,module,exports){
/**
 * ##Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, the `root` option contains the name of the collection. If you have multiple collections within each of your projects, you can pass the collection name as an option for each call.
 *
 *      var ds = new F.service.Data({ root: 'survey-responses' });
 *      ds.saveAs('user1',
 *          { 'question1': 2, 'question2': 10,
 *           'question3': false, 'question4': 'sometimes' } );
 *      ds.saveAs('user2',
 *          { 'question1': 3, 'question2': 8,
 *           'question3': true, 'question4': 'always' } );
 *      ds.query('',{ 'question2': { '$gt': 9} });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * Name of collection. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`. Required.
         * @type { string}
         */
        root: '/',

        /**
         * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type { string}
         */
        token: store.get('epicenter.project.token') || '',

        apiKey: '',
        domain: 'forio.com',

        //Options to pass on to the underlying transport layer
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var getURL = function (key, root) {
        if (!root) {
            root = serviceOptions.root;
        }
        var url = urlConfig.getAPIPath('data') + qutil.addTrailingSlash(root);
        if (key) {
            url+= qutil.addTrailingSlash(key);
        }
        return url;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: getURL
    });
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Search for data within a collection.
         *
         * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../data_api/#searching) for additional details.
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
         *      // where 'question5' contains the string '*day'
         *      ds.query('', { 'question5': { '$regex': '*day' } });
         *
         * **Parameters**
         * @param { string} `key` The name of the document to search. Pass the empty string ('') to search the entire collection.
         * @param {Object} `query` The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../data_api/#searching) for additional examples.
         * @para m {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
         */
        query: function (key, query, outputModifier, options) {
            var params = $.extend(true, { q: query }, outputModifier);
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(params, httpOptions);
        },

        /**
         * Save data to an anonymous document within the collection.
         *
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../data_api/) for additional background.)
         *
         * **Example**
         *
         *      ds.save('question1', 'yes');
         *      ds.save({question1:'yes', question2: 32 });
         *      ds.save({ name:'John', className: 'CS101' }, { root: 'students' });
         *
         * **Parameters**
         *
         * @param { string|Object} `key` If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
         * @param {Object} `value` (Optional) The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
         * @param {object} `options` (Optional) Overrides for configuration options.
         */
        save: function (key, value, options) {
            var attrs;
            if (typeof key === 'object') {
                attrs = key;
                options = value;
            } else {
                (attrs = {})[key] = value;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL('', httpOptions.root);

            return http.post(attrs, httpOptions);
        },

        /**
         * Save data to a named document or element within the collection. The `root` of the collection must be specified separately in configuration options, either as part of the call or as part of the initialization of ds.
         *
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../data_api/) for additional background.)
         *
         * **Example**
         *
         *      ds.saveAs('user1',
         *          { 'question1': 2, 'question2': 10,
         *           'question3': false, 'question4': 'sometimes' } );
         *      ds.saveAs('student1',
         *          { firstName: 'john', lastName: 'smith' },
         *          { root: 'students' });
         *      ds.saveAs('mgmt100/groupB',
         *          { scenarioYear: '2015' },
         *          { root: 'myclasses' });
         *
         * **Parameters**
         *
         * @param { string} `key` Id of the document.
         * @param {Object} `value` (Optional) The data to save, in key:value pairs.
         * @param {object} `options` (Optional) Overrides for configuration options.
         */
        saveAs: function (key, value, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);

            return http.put(value, httpOptions);
        },

        /**
         * Get data for a specific document or field.
         *
         * **Example**
         *
         *      ds.load('user1');
         *      ds.load('user1/question3');
         *
         * **Parameters**
         * @param  { string|Object} `key` The id of the data to return. Can be the id of a document, or a path to data within that document.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` Overrides for configuration options.
         */
        load: function (key, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(outputModifier, httpOptions);
        },

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
         * @param { string} `key` The id of the document to remove from this collection.
         * @param {object} `options` (Optional) Overrides for configuration options.
         */
        remove: function (keys, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params;
            if ($.isArray(keys)) {
                params = { id: keys };
            } else {
                params = '';
                httpOptions.url = getURL(keys, httpOptions.root);
            }
            return http.delete(params, httpOptions);
        }

        // Epicenter doesn't allow nuking collections
        //     /**
        //      * Removes collection being referenced
        //      * @return null
        //      */
        //     destroy: function (options) {
        //         return this.remove('', options);
        //     }
    };

    $.extend(this, publicAPI);
};

},{"./configuration-service":9,"../store/store-factory":15,"../util/query-util":2,"../transport/http-transport-factory":6}],15:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
var isNode = false;
var store = (isNode) ? require('./session-store') : require('./cookie-store');

module.exports = store;

},{"./session-store":25,"./cookie-store":14}],16:[function(require,module,exports){
'use strict';
var RunService = require('../service/run-api-service');

var defaults = {
    validFilter: { saved: true }
};

function ScenarioManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.runService = this.options.run || new RunService(this.options);
}

ScenarioManager.prototype = {
    getRuns: function (filter) {
        this.filter = $.extend(true, {}, this.options.validFilter, filter);
        return this.runService.query(this.filter);
    },

    loadVariables: function (vars) {
        return this.runService.query(this.filter, { include: vars });
    },

    save: function (run, meta) {
        return this._getService(run).save($.extend(true, {}, { saved: true }, meta));
    },

    archive: function (run) {
        return this._getService(run).save({ saved: false });
    },

    _getService: function (run) {
        if (typeof run === 'string') {
            return new RunService($.extend(true, {},  this.options, { filter: run }));
        }

        if (typeof run === 'object' && run instanceof RunService) {
            return run;
        }

        throw new Error('Save method requires a run service or a runId');
    },

    getRun: function (runId) {
        return new RunService($.extend(true, {},  this.options, { filter: runId }));
    }
};

module.exports = ScenarioManager;


},{"../service/run-api-service":10}],17:[function(require,module,exports){
/**
* ## Run Manager
*
* The Run Manager gives you control over run creation depending on run states. Specifically, you can select run creation strategies (rules) for which runs end users of your project work with when they log in to your project.
*
* Underlying Epicenter APIs -- including the [Model Run API](../../../model_apis/run/), the [Run API](../../../aggregate_run_api), and Epicenter.js's own [F.service.Run.create()](../run-api-service/) -- all allow you to create new runs. However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new one or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control.
*
* ### Using the Run Manager to create and access runs
*
* To use the Run Manager, instantiate it by passing in:
*
*   * `run`: (required) Run object. Must contain:
*       * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
*       * `project`: Epicenter project id.
*       * `model`: The name of your primary model file. (See more on [Writing your Model](../../writing_your_model/).)
*       * `scope`: (optional) Scope object for the run, for example `scope.group` with value of the name of the group.
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../../strategy/) for details. Defaults to `new-if-initialized`.
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/).
*
* **Example**
*
*       var rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'always-new',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is an instance of Run Service
*               var thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*/

'use strict';
var strategiesMap = require('./run-strategies/strategies-map');
var specialOperations = require('./special-operations');
var RunService = require('../service/run-api-service');


function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function (operation, params, options) {
        var reservedOps = Object.keys(specialOperations);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return specialOperations[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}



var defaults = {
    /**
     * Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../../strategy/) for details. Defaults to `new-if-initialized`.
     * @type {String}
     */

    strategy: 'new-if-initialized'
};

function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else {
        this.run = new RunService(this.options.run);
    }

    patchRunService(this.run, this);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategiesMap[this.options.strategy];

    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }

    this.strategy = new StrategyCtor(this.run, this.options);
}

RunManager.prototype = {
    /**
     * Returns the run object for a 'good' run.
     *
     * A good run is defined by the strategy. For example, if the strategy is `always-new`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `new-if-persisted`,
     * `getRun()` creates a new run if the previous run is in a persisted state, otherwise
     * it returns the previous run. See [Run Manager Strategies](../../strategy/) for more on strategies.
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {None} None
     */
    getRun: function () {
        return this.strategy
                .getRun();
    },

    /**
     * Returns the run object for a new run, regardless of strategy: force creation of a new run.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the (new) run object
     *          var thisRunId = run.id;
     *          // use the Run Service object
     *          run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {object} `runServiceOptions` The options object to configure the Run Service. See [Run API Service](../run-api-service/) for more.
     */
    reset: function (runServiceOptions) {
        return this.strategy.reset(runServiceOptions);
    }
};

module.exports = RunManager;

},{"./run-strategies/strategies-map":26,"./special-operations":27,"../service/run-api-service":10}],18:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        // always create a new run!
        return true;
    }
});

module.exports = Strategy;

},{"../../util/inherit":5,"./conditional-creation-strategy":19}],20:[function(require,module,exports){

var classFrom = require('../../util/inherit');
var Base = {};

module.exports = classFrom(Base, {});

},{"../../util/inherit":5}],19:[function(require,module,exports){
'use strict';

var makeSeq = require('../../util/make-sequence');
var Base = require('./identity-strategy');
var SessionStore = require('../../store/store-factory');
var classFrom = require('../../util/inherit');
var UrlService = require('../../service/url-config-service');

var sessionStore = new SessionStore({});
var urlService = new UrlService();

var defaults = {
    sessionKey: 'epicenter-scenario'
};

function setRunInSession(sessionKey, run) {
    var path = '/' + [urlService.appPath, urlService.accountPath, urlService.projectPath].join('/');

    // make sure we don't get consecuteive '/' so we have a valid path for the session
    path = path.replace(/\/{2,}/g,'/');

    // set the seesionKey for the run
    sessionStore.set(sessionKey, JSON.stringify({ runId: run.id }), { root: path });
}

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

/* jshint eqnull: true */
var Strategy = classFrom(Base, {
    constructor: function Strategy(runService, condition, options) {

        if (condition == null) {
            throw new Error('Conditional strategy needs a condition to createte a run');
        }

        this.run = makeSeq(runService);
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
        this.runOptions = this.options.run;
    },

    reset: function (runServiceOptions) {
        var _this = this;

        return this.run
                .create(this.runOptions, runServiceOptions)
            .then(function (run) {
                setRunInSession(_this.options.sessionKey, run);
                run.freshlyCreated = true;
                return run;
            })
            .start();
    },

    getRun: function () {
        var session = JSON.parse(sessionStore.get(this.options.sessionKey));

        if (session && session.runId) {
            return this._loadAndCheck(session);
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (session) {
        var shouldCreate = false;
        var _this = this;

        return this.run
            .load(session.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = _this.condition.call(_this, run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    // we need to do this, on the original runService (ie not sequencialized)
                    // so we don't get in the middle of the queue
                    return _this.run.original.create(_this.runOptions)
                    .then(function (run) {
                        setRunInSession(_this.options.sessionKey, run);
                        run.freshlyCreated = true;
                        return run;
                    });
                }

                return run;
            })
            .start();
    }
});

module.exports = Strategy;

},{"../../util/make-sequence":3,"./identity-strategy":20,"../../store/store-factory":15,"../../util/inherit":5,"../../service/url-config-service":8}],21:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

/*
*  create a new run only if nothing is stored in the cookie
*  this is useful for baseRuns.
*/
var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        // if we are here, it means that the run exists... so we don't need a new one
        return false;
    }
});

module.exports = Strategy;

},{"../../util/inherit":5,"./conditional-creation-strategy":19}],22:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;

},{"../../util/inherit":5,"./conditional-creation-strategy":19}],23:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent' || run.initialized;
    }
});

module.exports = Strategy;

},{"../../util/inherit":5,"./conditional-creation-strategy":19}],24:[function(require,module,exports){

},{}],25:[function(require,module,exports){
/**
 * @class session Storage Service
 *
 *  Cookie equivalent for nodejs
 */

'use strict';

module.exports = function (config) {
    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: '.forio.com'
    };
    var serviceOptions = $.extend({}, defaults, config);

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
         * Save session value
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
            var setOptions = $.extend(true, {}, serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;

            document.session = encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '');

            return value;
        },

        /**
         * Load session value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @return {*} The value stored
         *
         * @example
         *     cs.get('person');
         */
        get: function (key) {
            var sessionReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var val = document.session.replace(sessionReg, '$1');
            val = decodeURIComponent(val) || null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;

            document.session = encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            (domain ? '; domain=' + domain : '') +
                            (path ? '; path=' + path : '');
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var aKeys = document.session.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var sessionKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(sessionKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};


},{}],27:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],26:[function(require,module,exports){
module.exports = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy')
};

},{"./new-if-initialized-strategy":23,"./new-if-persisted-strategy":22,"./always-new-strategy":18,"./new-if-missing-strategy":21}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvYXBwLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy91dGlsL3F1ZXJ5LXV0aWwuanMiLCIvVXNlcnMvcnZpbGxhcnJlYWwvcHJvamVjdHMvZXBpY2VudGVyLWpzLWxpYnMvc3JjL3V0aWwvbWFrZS1zZXF1ZW5jZS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvdXRpbC9pbmhlcml0LmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy91dGlsL3J1bi11dGlsLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvc3RvcmUvY29va2llLXN0b3JlLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvdHJhbnNwb3J0L2FqYXgtaHR0cC10cmFuc3BvcnQuanMiLCIvVXNlcnMvcnZpbGxhcnJlYWwvcHJvamVjdHMvZXBpY2VudGVyLWpzLWxpYnMvc3JjL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9zZXJ2aWNlL3J1bi1hcGktc2VydmljZS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UuanMiLCIvVXNlcnMvcnZpbGxhcnJlYWwvcHJvamVjdHMvZXBpY2VudGVyLWpzLWxpYnMvc3JjL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvc2VydmljZS9kYXRhLWFwaS1zZXJ2aWNlLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9tYW5hZ2Vycy9zY2VuYXJpby1tYW5hZ2VyLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9tYW5hZ2Vycy9ydW4tbWFuYWdlci5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvYWx3YXlzLW5ldy1zdHJhdGVneS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvaWRlbnRpdHktc3RyYXRlZ3kuanMiLCIvVXNlcnMvcnZpbGxhcnJlYWwvcHJvamVjdHMvZXBpY2VudGVyLWpzLWxpYnMvc3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5LmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtbWlzc2luZy1zdHJhdGVneS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5LmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy90cmFuc3BvcnQvbm9kZS1odHRwLXRyYW5zcG9ydC5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvc3RvcmUvc2Vzc2lvbi1zdG9yZS5qcyIsIi9Vc2Vycy9ydmlsbGFycmVhbC9wcm9qZWN0cy9lcGljZW50ZXItanMtbGlicy9zcmMvbWFuYWdlcnMvc3BlY2lhbC1vcGVyYXRpb25zLmpzIiwiL1VzZXJzL3J2aWxsYXJyZWFsL3Byb2plY3RzL2VwaWNlbnRlci1qcy1saWJzL3NyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9zdHJhdGVnaWVzLW1hcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBGID0ge1xuICAgIHV0aWw6IHt9LFxuICAgIGZhY3Rvcnk6IHt9LFxuICAgIHRyYW5zcG9ydDoge30sXG4gICAgc3RvcmU6IHt9LFxuICAgIHNlcnZpY2U6IHt9LFxuICAgIG1hbmFnZXI6IHtcbiAgICAgICAgc3RyYXRlZ3k6IHt9XG4gICAgfSxcblxufTtcblxuRi51dGlsLnF1ZXJ5ID0gcmVxdWlyZSgnLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbkYudXRpbC5tYWtlU2VxdWVuY2UgPSByZXF1aXJlKCcuL3V0aWwvbWFrZS1zZXF1ZW5jZScpO1xuRi51dGlsLnJ1biA9IHJlcXVpcmUoJy4vdXRpbC9ydW4tdXRpbCcpO1xuRi51dGlsLmNsYXNzRm9ybSA9IHJlcXVpcmUoJy4vdXRpbC9pbmhlcml0Jyk7XG5cbkYuZmFjdG9yeS5UcmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG5GLnRyYW5zcG9ydC5BamF4ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQvYWpheC1odHRwLXRyYW5zcG9ydCcpO1xuXG5GLnNlcnZpY2UuVVJMID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuRi5zZXJ2aWNlLkNvbmZpZyA9IHJlcXVpcmUoJy4vc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbkYuc2VydmljZS5SdW4gPSByZXF1aXJlKCcuL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuVmFyaWFibGVzID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkRhdGEgPSByZXF1aXJlKCcuL3NlcnZpY2UvZGF0YS1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkF1dGggPSByZXF1aXJlKCcuL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZScpO1xuXG5GLnN0b3JlLkNvb2tpZSA9IHJlcXVpcmUoJy4vc3RvcmUvY29va2llLXN0b3JlJyk7XG5GLmZhY3RvcnkuU3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcblxuRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc2NlbmFyaW8tbWFuYWdlcicpO1xuRi5tYW5hZ2VyLlJ1bk1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1tYW5hZ2VyJyk7XG5cbkYubWFuYWdlci5zdHJhdGVneVsnYWx3YXlzLW5ldyddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9hbHdheXMtbmV3LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ2NvbmRpdGlvbmFsLWNyZWF0aW9uJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3kuaWRlbnRpdHkgPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1wZXJzaXN0ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpO1xuRi5tYW5hZ2VyLnN0cmF0ZWd5WyduZXctaWYtaW5pdGlhbGl6ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5Jyk7XG5cbkYudmVyc2lvbiA9ICc8JT0gdmVyc2lvbiAlPic7XG53aW5kb3cuRiA9IEY7XG5cbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggcXVlcnkgc3RyaW5nc1xuKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHRvIG1hdHJpeCBmb3JtYXRcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBxcyBPYmplY3QgdG8gY29udmVydCB0byBxdWVyeSBzdHJpbmdcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICB0b01hdHJpeEZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCB8fCBxcyA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzsnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgdmFyIE9QRVJBVE9SUyA9IFsnPCcsICc+JywgJyEnXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAkLmluQXJyYXkoJC50cmltKHZhbHVlKS5jaGFyQXQoMCksIE9QRVJBVE9SUykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJz0nICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBtdHJ4ID0gJzsnICsgcmV0dXJuQXJyYXkuam9pbignOycpO1xuICAgICAgICAgICAgcmV0dXJuIG10cng7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHN0cmluZ3MvYXJyYXlzL29iamVjdHMgdG8gdHlwZSAnYT1iJmI9YydcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b1F1ZXJ5Rm9ybWF0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHFzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAvL01vc3RseSBmb3IgZGF0YSBhcGlcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgJz0nICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXR1cm5BcnJheS5qb2luKCcmJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzIG9mIHR5cGUgJ2E9YiZiPWMnIHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd9IHFzXG4gICAgICAgICAqIEByZXR1cm4ge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHFzVG9PYmplY3Q6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcXNBcnJheSA9IHFzLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0ge307XG4gICAgICAgICAgICAkLmVhY2gocXNBcnJheSwgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBxS2V5ID0gdmFsdWUuc3BsaXQoJz0nKVswXTtcbiAgICAgICAgICAgICAgICB2YXIgcVZhbCA9IHZhbHVlLnNwbGl0KCc9JylbMV07XG5cbiAgICAgICAgICAgICAgICBpZiAocVZhbC5pbmRleE9mKCcsJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHFWYWwgPSBxVmFsLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuT2JqW3FLZXldID0gcVZhbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb3JtYWxpemVzIGFuZCBtZXJnZXMgc3RyaW5ncyBvZiB0eXBlICdhPWInLCB7IGI6Y30gdG8geyBhOmIsIGI6Y31cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXMyXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIG1lcmdlUVM6IGZ1bmN0aW9uIChxczEsIHFzMikge1xuICAgICAgICAgICAgdmFyIG9iajEgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMSkpO1xuICAgICAgICAgICAgdmFyIG9iajIgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMikpO1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmoxLCBvYmoyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAodXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgPT09ICcvJykgPyB1cmwgOiAodXJsICsgJy8nKTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuXG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuLypqc2hpbnQgbG9vcGZ1bmM6ZmFsc2UgKi9cblxuZnVuY3Rpb24gX3codmFsKSB7XG4gICAgaWYgKHZhbCAmJiB2YWwudGhlbikge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICB2YXIgcCA9ICQuRGVmZXJyZWQoKTtcbiAgICBwLnJlc29sdmUodmFsKTtcblxuICAgIHJldHVybiBwLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gc2VxKCkge1xuICAgIHZhciBsaXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XG5cbiAgICBmdW5jdGlvbiBuZXh0KHApIHtcbiAgICAgICAgdmFyIGN1ciA9IGxpc3Quc3BsaWNlKDAsMSlbMF07XG5cbiAgICAgICAgaWYgKCFjdXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF93KGN1cihwKSkudGhlbihuZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHNlZWQpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoc2VlZCkuZmFpbChzZXEuZmFpbCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gTWFrZVNlcShvYmopIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBfX2NhbGxzOiBbXSxcblxuICAgICAgICBvcmlnaW5hbDogb2JqLFxuXG4gICAgICAgIHRoZW46IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goZm4pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwXG4gICAgICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9fY2FsbHMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXEuYXBwbHkobnVsbCwgdGhpcy5fX2NhbGxzKSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgc2VxLmZhaWwgPSBmbjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBmdW5jTWFrZXIgPSBmdW5jdGlvbiAocCwgb2JqKSB7XG4gICAgICAgIHZhciBmbiA9IG9ialtwXS5iaW5kKG9iaik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goRnVuY3Rpb24uYmluZC5hcHBseShmbiwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXNbcHJvcF0gPSBmdW5jTWFrZXIocHJvcCwgb2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFrZVNlcTtcbiIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgajxvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIC8qanNoaW50IC1XMDg5ICovXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7XG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggdGhlIHJ1biBzZXJ2aWNlXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgb3BlcmF0aW9ucyBvZiB0aGUgZm9ybSBbW29wMSxvcDJdLCBbYXJnMSwgYXJnMl1dXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdHxBcnJheXxTdHJpbmd9IG9wZXJhdGlvbnMgb3BlcmF0aW9ucyB0byBwZXJmb3JtXG4gICAgICAgICAqIEBwYXJhbSAgeyBhcnJheX0gYXJ1Z21lbnRzIGZvciBvcGVyYXRpb25cbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICBub3JtYWxpemVPcGVyYXRpb25zOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJncykge1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJldHVybkxpc3QgPSB7XG4gICAgICAgICAgICAgICAgb3BzOiBbXSxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9jb25jYXQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhcnIgIT09IG51bGwgJiYgYXJyICE9PSB1bmRlZmluZWQpID8gW10uY29uY2F0KGFycikgOiBbXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8veyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVQbGFpbk9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKG9wbiwgYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmcpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL3sgbmFtZTogJ2FkZCcsIHBhcmFtczogWzFdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQob3BlcmF0aW9uLnBhcmFtcykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVPYmplY3QgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgob3BlcmF0aW9uLm5hbWUpID8gX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzIDogX25vcm1hbGl6ZVBsYWluT2JqZWN0cykob3BlcmF0aW9uLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplTGl0ZXJhbHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCBhcmdzLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVBcnJheXMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJnLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAoaW5kZXgsIG9wbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BuLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcG4sIGFyZ3NbaW5kZXhdLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BlcmF0aW9ucywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuaXNBcnJheShvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVBcnJheXMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgaWYgKCFob3N0IHx8IGhvc3QuaW5kZXhPZignbG9jYWxob3N0JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaG9zdCA9ICdmb3Jpby5jb20nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIChIT1NUX0FQSV9NQVBQSU5HW2hvc3RdKSA/IEhPU1RfQVBJX01BUFBJTkdbaG9zdF0gOiAnYXBpLicgKyBob3N0O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGFwcFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwYXRoICYmIHBhdGhbMV0gfHwgJyc7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYWNjb3VudFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWNjbnQgPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgYWNjbnQgPSBwYXRoWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY250O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHByb2plY3RQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByaiA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgaWYgKHBhdGggJiYgcGF0aFsxXSA9PT0gJ2FwcCcpIHtcbiAgICAgICAgICAgICAgICBwcmogPSBwYXRoWzNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByajtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBnZXRBUElQYXRoOiBmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICB2YXIgUFJPSkVDVF9BUElTID0gWydydW4nLCAnZGF0YSddO1xuICAgICAgICAgICAgdmFyIGFwaVBhdGggPSB0aGlzLnByb3RvY29sICsgJzovLycgKyB0aGlzLmhvc3QgKyAnLycgKyBhcGkgKyAnLyc7XG5cbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkoYXBpLCBQUk9KRUNUX0FQSVMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGFwaVBhdGggKz0gdGhpcy5hY2NvdW50UGF0aCArICcvJyArIHRoaXMucHJvamVjdFBhdGggICsgJy8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFwaVBhdGg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQocHVibGljRXhwb3J0cywgY29uZmlnKTtcbiAgICByZXR1cm4gcHVibGljRXhwb3J0cztcbn07XG4iLCIvKipcbiAqIEBjbGFzcyBDb29raWUgU3RvcmFnZSBTZXJ2aWNlXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAgdmFyIHBlb3BsZSA9IHJlcXVpcmUoJ2Nvb2tpZS1zdG9yZScpKHsgcm9vdDogJ3Blb3BsZScgfSk7XG4gICAgICAgIHBlb3BsZVxuICAgICAgICAgICAgLnNhdmUoe2xhc3ROYW1lOiAnc21pdGgnIH0pXG5cbiAqL1xuXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogJy5mb3Jpby5jb20nXG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvLyAqIFRCRFxuICAgICAgICAvLyAgKiBRdWVyeSBjb2xsZWN0aW9uOyB1c2VzIE1vbmdvREIgc3ludGF4XG4gICAgICAgIC8vICAqIEBzZWUgIDxUQkQ6IERhdGEgQVBJIFVSTD5cbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBxcyBRdWVyeSBGaWx0ZXJcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBsaW1pdGVycyBAc2VlIDxUQkQ6IHVybCBmb3IgbGltaXRzLCBwYWdpbmcgZXRjPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgY3MucXVlcnkoXG4gICAgICAgIC8vICAqICAgICAgeyBuYW1lOiAnSm9obicsIGNsYXNzTmFtZTogJ0NTQzEwMScgfSxcbiAgICAgICAgLy8gICogICAgICB7bGltaXQ6IDEwfVxuICAgICAgICAvLyAgKiAgICAgKVxuXG4gICAgICAgIC8vIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIGxpbWl0ZXJzKSB7XG5cbiAgICAgICAgLy8gfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBjb29raWUgdmFsdWVcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSAgIElmIGdpdmVuIGEga2V5IHNhdmUgdmFsdWVzIHVuZGVyIGl0LCBpZiBnaXZlbiBhbiBvYmplY3QgZGlyZWN0bHksIHNhdmUgdG8gdG9wLWxldmVsIGFwaVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHZhbHVlIChPcHRpb25hbClcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHNhdmVkIHZhbHVlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5zZXQoJ3BlcnNvbicsIHsgZmlyc3ROYW1lOiAnam9obicsIGxhc3ROYW1lOiAnc21pdGgnIH0pO1xuICAgICAgICAgKiAgICAgY3Muc2V0KHsgbmFtZTonc21pdGgnLCBhZ2U6JzMyJyB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHNldE9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXRPcHRpb25zLnJvb3Q7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBjb29raWVSZWcgPSBuZXcgUmVnRXhwKCcoPzooPzpefC4qOylcXFxccyonICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkucmVwbGFjZSgvW1xcLVxcLlxcK1xcKl0vZywgJ1xcXFwkJicpICsgJ1xcXFxzKlxcXFw9XFxcXHMqKFteO10qKS4qJCl8Xi4qJCcpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IGRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKGNvb2tpZVJlZywgJyQxJyk7XG4gICAgICAgICAgICB2YWwgPSBkZWNvZGVVUklDb21wb25lbnQodmFsKSB8fCBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBrZXkgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30ga2V5IGtleSB0byByZW1vdmVcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9tYWluID0gcmVtT3B0aW9ucy5kb21haW47XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHJlbU9wdGlvbnMucm9vdDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc9OyBleHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aCA/ICc7IHBhdGg9JyArIHBhdGggOiAnJyk7XG4gICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAgKiBAcmV0dXJuIHsgYXJyYXl9IGtleXMgQWxsIHRoZSBrZXlzIHJlbW92ZWRcbiAgICAgICAgICovXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhS2V5cyA9IGRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKC8oKD86XnxcXHMqOylbXlxcPV0rKSg/PTt8JCl8Xlxccyp8XFxzKig/OlxcPVteO10qKT8oPzpcXDF8JCkvZywgJycpLnNwbGl0KC9cXHMqKD86XFw9W147XSopPztcXHMqLyk7XG4gICAgICAgICAgICBmb3IgKHZhciBuSWR4ID0gMDsgbklkeCA8IGFLZXlzLmxlbmd0aDsgbklkeCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb2tpZUtleSA9IGRlY29kZVVSSUNvbXBvbmVudChhS2V5c1tuSWR4XSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoY29va2llS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhS2V5cztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzTm9kZSA9IGZhbHNlO1xudmFyIHRyYW5zcG9ydCA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9ub2RlLWh0dHAtdHJhbnNwb3J0JykgOiByZXF1aXJlKCcuL2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcbm1vZHVsZS5leHBvcnRzID0gdHJhbnNwb3J0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcXV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6ICcnLFxuXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgICBzdGF0dXNDb2RlOiB7XG4gICAgICAgICAgICA0MDQ6ICQubm9vcFxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPTkxZIGZvciBzdHJpbmdzIGluIHRoZSB1cmwuIEFsbCBHRVQgJiBERUxFVEUgcGFyYW1zIGFyZSBydW4gdGhyb3VnaCB0aGlzXG4gICAgICAgICAqIEB0eXBlIHtbdHlwZV0gfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1ldGVyUGFyc2VyOiBxdXRpbHMudG9RdWVyeUZvcm1hdCxcblxuICAgICAgICAvLyBUbyBhbGxvdyBlcGljZW50ZXIudG9rZW4gYW5kIG90aGVyIHNlc3Npb24gY29va2llcyB0byBiZSBwYXNzZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgcmVxdWVzdHNcbiAgICAgICAgeGhyRmllbGRzOiB7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciByZXN1bHQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gKCQuaXNGdW5jdGlvbihkKSkgPyBkKCkgOiBkO1xuICAgIH07XG5cbiAgICB2YXIgY29ubmVjdCA9IGZ1bmN0aW9uIChtZXRob2QsIHBhcmFtcywgY29ubmVjdE9wdGlvbnMpIHtcbiAgICAgICAgcGFyYW1zID0gcmVzdWx0KHBhcmFtcyk7XG4gICAgICAgIHBhcmFtcyA9ICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSB8fCAkLmlzQXJyYXkocGFyYW1zKSkgPyBKU09OLnN0cmluZ2lmeShwYXJhbXMpIDogcGFyYW1zO1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHRyYW5zcG9ydE9wdGlvbnMsIGNvbm5lY3RPcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiBtZXRob2QsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUyA9IFsnZGF0YScsICd1cmwnXTtcbiAgICAgICAgJC5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHZhbHVlKSAmJiAkLmluQXJyYXkoa2V5LCBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubG9nTGV2ZWwgJiYgb3B0aW9ucy5sb2dMZXZlbCA9PT0gJ0RFQlVHJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cob3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3NGbiA9IG9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIGFqYXhTdGF0dXMsIGFqYXhSZXEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgb2xkU3VjY2Vzc0ZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIGdldDpmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnR0VUJywgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwb3N0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwYXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwYXRjaCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3B1dCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgLy9ERUxFVEUgZG9lc24ndCBzdXBwb3J0IGJvZHkgcGFyYW1zLCBidXQgalF1ZXJ5IHRoaW5rcyBpdCBkb2VzLlxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgaWYgKCQudHJpbShwYXJhbXMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlciA9IChyZXN1bHQob3B0aW9ucy51cmwpLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXJsID0gcmVzdWx0KG9wdGlvbnMudXJsKSArIGRlbGltaXRlciArIHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmNhbGwodGhpcywgJ0RFTEVURScsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICBoZWFkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ2hlYWQnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnb3B0aW9ucyddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIoZnVuY3Rpb24oKXsvKipcbiAqIEBjbGFzcyBDb25maWd1cmF0aW9uU2VydmljZVxuICpcbiAqIEFsbCBzZXJ2aWNlcyB0YWtlIGluIGEgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBvYmplY3QgdG8gY29uZmlndXJlIHRoZW1zZWx2ZXMuIEEgSlMgaGFzaCB7fSBpcyBhIHZhbGlkIGNvbmZpZ3VyYXRpb24gb2JqZWN0LCBidXQgb3B0aW9uYWxseSB5b3UgY2FuIHVzZSB0aGUgY29uZmlndXJhdGlvbiBzZXJ2aWNlIHRvIHRvZ2dsZSBjb25maWdzIGJhc2VkIG9uIHRoZSBlbnZpcm9ubWVudFxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgdmFyIGNzID0gcmVxdWlyZSgnY29uZmlndXJhdGlvbi1zZXJ2aWNlJykoe1xuICogICAgICAgICAgZGV2OiB7IC8vZW52aXJvbm1lbnRcbiAgICAgICAgICAgICAgICBwb3J0OiAzMDAwLFxuICAgICAgICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Q6IHtcbiAgICAgICAgICAgICAgICBwb3J0OiA4MDgwLFxuICAgICAgICAgICAgICAgIGhvc3Q6ICdhcGkuZm9yaW8uY29tJyxcbiAgICAgICAgICAgICAgICBsb2dMZXZlbDogJ25vbmUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9nTGV2ZWw6ICdERUJVRycgLy9nbG9iYWxcbiAqICAgICB9KTtcbiAqXG4gKiAgICAgIGNzLmdldCgnbG9nTGV2ZWwnKTsgLy9yZXR1cm5zICdERUJVRydcbiAqXG4gKiAgICAgIGNzLnNldEVudignZGV2Jyk7XG4gKiAgICAgIGNzLmdldCgnbG9nTGV2ZWwnKTsgLy9yZXR1cm5zICdERUJVRydcbiAqXG4gKiAgICAgIGNzLnNldEVudigncHJvZCcpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnbm9uZSdcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIHVybFNlcnZpY2UgPSByZXF1aXJlKCcuL3VybC1jb25maWctc2VydmljZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvL1RPRE86IEVudmlyb25tZW50c1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgbG9nTGV2ZWw6ICdOT05FJ1xuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHNlcnZpY2VPcHRpb25zLnNlcnZlciA9IHVybFNlcnZpY2Uoc2VydmljZU9wdGlvbnMuc2VydmVyKTtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgZGF0YTogc2VydmljZU9wdGlvbnMsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgZW52aXJvbm1lbnQga2V5IHRvIGdldCBjb25maWd1cmF0aW9uIG9wdGlvbnMgZnJvbVxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGVudlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0RW52OiBmdW5jdGlvbiAoZW52KSB7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd9IHByb3BlcnR5IG9wdGlvbmFsXG4gICAgICAgICAqIEByZXR1cm4geyp9ICAgICAgICAgIFZhbHVlIG9mIHByb3BlcnR5IGlmIHNwZWNpZmllZCwgdGhlIGVudGlyZSBjb25maWcgb2JqZWN0IG90aGVyd2lzZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9uc1twcm9wZXJ0eV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5IGlmIGEga2V5IGlzIHByb3ZpZGVkLCBzZXQgYSBrZXkgdG8gdGhhdCB2YWx1ZS4gT3RoZXJ3aXNlIG1lcmdlIG9iamVjdCB3aXRoIGN1cnJlbnQgY29uZmlnXG4gICAgICAgICAqIEBwYXJhbSAgeyp9IHZhbHVlICB2YWx1ZSBmb3IgcHJvdmlkZWQga2V5XG4gICAgICAgICAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9uc1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuXG59KSgpIiwiLyoqXG4gKlxuICogIyNSdW4gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gcGVyZm9ybSBjb21tb24gdGFza3MgYXJvdW5kIGNyZWF0aW5nIGFuZCB1cGRhdGluZyBydW5zLCB2YXJpYWJsZXMsIGFuZCBkYXRhLlxuICpcbiAqIEFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIFJ1biBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKiBUeXBpY2FsbHksIHlvdSBmaXJzdCBpbnN0YW50aWF0ZSBhIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgdGhlbiBhY2Nlc3MgdGhlIFJ1biBTZXJ2aWNlIHRoYXQgaXMgYXV0b21hdGljYWxseSBwYXJ0IG9mIHRoZSBtYW5hZ2VyLlxuICpcbiAqICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnXG4gKiAgICAgICAgICAgfVxuICogICAgICAgfSk7XG4gKiAgICAgICBybS5nZXRSdW4oKVxuICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICogICAgICAgICAgICAgICAvLyB0aGUgUnVuTWFuYWdlci5ydW4gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiAqICAgICAgICAgICAgICAgLy8gc28gYW55IFJ1biBTZXJ2aWNlIG1ldGhvZCBpcyB2YWxpZCBoZXJlXG4gKiAgICAgICAgICAgICAgIHZhciBycyA9IHJtLnJ1bjtcbiAqICAgICAgICAgICAgICAgcnMuZG8oJ3J1bk1vZGVsJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuXG5mdW5jdGlvbiBfcGljayhvYmosIHByb3BzKSB7XG4gICAgdmFyIHJlcyA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gb2JqKSB7XG4gICAgICAgIGlmIChwcm9wcy5pbmRleE9mKHApICE9PSAtMSkge1xuICAgICAgICAgICAgcmVzW3BdID0gb2JqW3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy8gY29uZmlnIHx8IChjb25maWcgPSBjb25maWdTZXJ2aWNlLmdldCgpKTtcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkoeyBzeW5jaHJvbm91czogdHJ1ZSB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogc3RvcmUuZ2V0KCdlcGljZW50ZXIucHJvamVjdC50b2tlbicpIHx8ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgXCJUZWFtIElEXCIgKGZvciB0ZWFtIHByb2plY3RzKSBvciBcIlVzZXIgSURcIiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7IHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7IHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcml0ZXJpYSBieSB3aGljaCB0byBmaWx0ZXIgcnVucy4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZmlsdGVyOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgY29tcGxldGVzIHN1Y2Nlc3NmdWxseS4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqL1xuICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGZhaWxzLiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB1cmxDb25maWcuZmlsdGVyID0gJzsnO1xuICAgIHVybENvbmZpZy5nZXRGaWx0ZXJVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgncnVuJyk7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBxdXRpbC50b01hdHJpeEZvcm1hdChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpO1xuXG4gICAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgICAgIHVybCArPSBmaWx0ZXIgKyAnLyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9O1xuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkxcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcblxuICAgIHZhciBzZXRGaWx0ZXJPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGZpbHRlciBzcGVjaWZpZWQgdG8gYXBwbHkgb3BlcmF0aW9ucyBhZ2FpbnN0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FzeW5jQVBJID0ge1xuICAgICAgICB1cmxDb25maWc6IHVybENvbmZpZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogTk9URTogVHlwaWNhbGx5IHRoaXMgaXMgbm90IHVzZWQhIFVzZSBgUnVuTWFuYWdlci5nZXRSdW4oKWAgd2l0aCBhIGBzdHJhdGVneWAgb2YgYGFsd2F5cy1uZXdgLCBvciB1c2UgYFJ1bk1hbmFnZXIucmVzZXQoKWAuIFNlZSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgcnMuY3JlYXRlKCdoZWxsb193b3JsZC5qbCcpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBgbW9kZWxgIFRoZSBuYW1lIG9mIHRoZSBwcmltYXJ5IFttb2RlbCBmaWxlXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4gVGhpcyBpcyB0aGUgb25lIGZpbGUgaW4gdGhlIHByb2plY3QgdGhhdCBleHBsaWNpdGx5IGV4cG9zZXMgdmFyaWFibGVzIGFuZCBtZXRob2RzLCBhbmQgaXQgbXVzdCBiZSBzdG9yZWQgaW4gdGhlIE1vZGVsIGZvbGRlciBvZiB5b3VyIEVwaWNlbnRlciBwcm9qZWN0LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3J1bicpIH0pO1xuICAgICAgICAgICAgdmFyIHJ1bkFwaVBhcmFtcyA9IFsnbW9kZWwnLCAnc2NvcGUnLCAnZmlsZXMnXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMganVzdCB0aGUgbW9kZWwgbmFtZVxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHsgbW9kZWw6IHBhcmFtcyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB3aGl0ZWxpc3QgdGhlIGZpZWxkcyB0aGF0IHdlIGFjdHVhbGx5IGNhbiBzZW5kIHRvIHRoZSBhcGlcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIHJ1bkFwaVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gY3JlYXRlT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICAgICAgY3JlYXRlT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcmVzcG9uc2UuaWQ7IC8vYWxsIGZ1dHVyZSBjaGFpbmVkIGNhbGxzIHRvIG9wZXJhdGUgb24gdGhpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciBydW5zLCBiYXNlZCBvbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgYHFzYCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBlbGVtZW50cyBvZiB0aGUgYHFzYCBvYmplY3QgYXJlIEFORGVkIHRvZ2V0aGVyIHdpdGhpbiBhIHNpbmdsZSBjYWxsIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJucyBydW5zIHdpdGggc2F2ZWQgPSB0cnVlIGFuZCB2YXJpYWJsZXMucHJpY2UgPiAxLFxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlIHZhcmlhYmxlcy5wcmljZSBoYXMgYmVlbiBwZXJzaXN0ZWQgKHJlY29yZGVkKVxuICAgICAgICAgKiAgICAgIC8vIGluIHRoZSBtb2RlbC5cbiAgICAgICAgICogICAgIHJzLnF1ZXJ5KHtcbiAgICAgICAgICogICAgICAgICAgJ3NhdmVkJzogJ3RydWUnLFxuICAgICAgICAgKiAgICAgICAgICAnLnByaWNlJzogJz4xJ1xuICAgICAgICAgKiAgICAgICB9LFxuICAgICAgICAgKiAgICAgICB7XG4gICAgICAgICAqICAgICAgICAgIHN0YXJ0cmVjb3JkOiAyLFxuICAgICAgICAgKiAgICAgICAgICBlbmRyZWNvcmQ6IDVcbiAgICAgICAgICogICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgcXNgIFF1ZXJ5IG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNmaWx0ZXJzKSBhbGxvd2VkIGluIHRoZSB1bmRlcmx5aW5nIFJ1biBBUEkuKSBRdWVyeWluZyBmb3IgdmFyaWFibGVzIGlzIGF2YWlsYWJsZSBmb3IgcnVucyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBhbmQgZm9yIHJ1bnMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgaWYgdGhlIHZhcmlhYmxlcyBhcmUgcGVyc2lzdGVkIChlLmcuIHRoYXQgaGF2ZSBiZWVuIGByZWNvcmRgZWQgaW4geW91ciBKdWxpYSBtb2RlbCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBxczsgLy9zaG91bGRuJ3QgYmUgYWJsZSB0byBvdmVyLXJpZGVcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHJ1bnMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXNgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogU2ltaWxhciB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYGZpbHRlcmAgRmlsdGVyIG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNmaWx0ZXJzKSBhbGxvd2VkIGluIHRoZSB1bmRlcmx5aW5nIFJ1biBBUEkuKSBGaWx0ZXJpbmcgZm9yIHZhcmlhYmxlcyBpcyBhdmFpbGFibGUgZm9yIHJ1bnMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgYW5kIGZvciBydW5zIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGlmIHRoZSB2YXJpYWJsZXMgYXJlIHBlcnNpc3RlZCAoZS5nLiB0aGF0IGhhdmUgYmVlbiBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHNlcnZpY2VPcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIsIGZpbHRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgcnVuLiBUaGlzIGluY2x1ZGVzIHN0YW5kYXJkIHJ1biBkYXRhIHN1Y2ggYXMgdGhlIGFjY291bnQsIG1vZGVsLCBwcm9qZWN0LCBhbmQgY3JlYXRlZCBhbmQgbGFzdCBtb2RpZmllZCBkYXRlcy4gVG8gcmVxdWVzdCBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMsIHBhc3MgdGhlbSBhcyBwYXJ0IG9mIHRoZSBgZmlsdGVyc2AgcGFyYW1ldGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgaWYgdGhlIHJ1biBpcyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSwgYW55IG1vZGVsIHZhcmlhYmxlcyBhcmUgYXZhaWxhYmxlOyBpZiB0aGUgcnVuIGlzIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1kYiksIG9ubHkgbW9kZWwgdmFyaWFibGVzIHRoYXQgaGF2ZSBiZWVuIHBlcnNpc3RlZCAmbWRhc2g7IHRoYXQgaXMsIGByZWNvcmRgZWQgaW4geW91ciBKdWxpYSBtb2RlbCAmbWRhc2g7IGFyZSBhdmFpbGFibGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5sb2FkKCdiYjU4OTY3Ny1kNDc2LTQ5NzEtYTY4ZS0wYzU4ZDE5MWU0NTAnLCB7IGluY2x1ZGU6IFsnLnByaWNlJywgJy5zYWxlcyddIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGBydW5JRGAgVGhlIHJ1biBpZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBmaWx0ZXJzYCAoT3B0aW9uYWwpIE9iamVjdCBjb250YWluaW5nIGZpbHRlcnMgYW5kIG9wZXJhdGlvbiBtb2RpZmllcnMuIFVzZSBrZXkgYGluY2x1ZGVgIHRvIGxpc3QgbW9kZWwgdmFyaWFibGVzIHRoYXQgeW91IHdhbnQgdG8gaW5jbHVkZSBpbiB0aGUgcmVzcG9uc2UuIE90aGVyIGF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocnVuSUQsIGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJ1bklEOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvL1NhdmluZyBkYXRhXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGF0dHJpYnV0ZXMgKGRhdGEsIG1vZGVsIHZhcmlhYmxlcykgb2YgdGhlIHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgY29tcGxldGVkOiB0cnVlIH0pO1xuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IHNhdmVkOiB0cnVlLCB2YXJpYWJsZXM6IHsgYTogMjMsIGI6IDIzIH0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgYXR0cmlidXRlc2AgVGhlIHJ1biBkYXRhIGFuZCB2YXJpYWJsZXMgdG8gc2F2ZS4gTW9kZWwgdmFyaWFibGVzIG11c3QgYmUgaW5jbHVkZWQgaW4gYSBgdmFyaWFibGVzYCBmaWVsZCB3aXRoaW4gdGhlIGBhdHRyaWJ1dGVzYCBvYmplY3QgKG90aGVyd2lzZSB0aGV5IGFyZSB0cmVhdGVkIGFzIHJ1biBkYXRhIGFuZCBhZGRlZCB0byB0aGUgcnVuIHJlY29yZCBkaXJlY3RseSkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKGF0dHJpYnV0ZXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyMjT3BlcmF0aW9uc1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBhIG1ldGhvZCBmcm9tIHRoZSBtb2RlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIG1ldGhvZCBtdXN0IGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwsIHNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGBwYXJhbXNgIGFyZ3VtZW50IGlzIG5vcm1hbGx5IGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byB0aGUgYG9wZXJhdGlvbmAuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCB5b3UgY2FuIGNvbWJpbmUgdGhlIGBvcGVyYXRpb25gIGFuZCBgcGFyYW1zYCBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBvYmplY3QgaWYgeW91IHByZWZlciwgYXMgaW4gdGhlIGxhc3QgZXhhbXBsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic29sdmVcIiB0YWtlcyBubyBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLmRvKCdzb2x2ZScpO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsIFsnaGVsbG8nXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgJ2hlbGxvJyk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic3VtQXJyYXlcIiB0YWtlcyBvbmUgYXJndW1lbnQsIGFuIGFycmF5XG4gICAgICAgICAqICAgICBycy5kbygnc3VtQXJyYXknLCBbWzQsMiwxXV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImFkZFwiIHRha2VzIHR3byBhcmd1bWVudHMsIGJvdGggaW50ZWdlcnNcbiAgICAgICAgICogICAgIHJzLmRvKHsgbmFtZTonYWRkJywgcGFyYW1zOlsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGBvcGVyYXRpb25gIE5hbWUgb2YgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0geyBhcnJheX0gYHBhcmFtc2AgKE9wdGlvbmFsKSBBbnkgcGFyYW1ldGVycyB0aGUgb3BlcmF0aW9uIHRha2VzLCBwYXNzZWQgYXMgYW4gYXJyYXkuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXksIGFuZCBjYW4ganVzdCBwYXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBkbzogZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZG8nLCBvcGVyYXRpb24sIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzQXJncztcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucztcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHNBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb24sIG9wc0FyZ3MpO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBwb3N0T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHNldEZpbHRlck9yVGhyb3dFcnJvcihodHRwT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwcm1zID0gKHJlc3VsdC5hcmdzWzBdLmxlbmd0aCAmJiAocmVzdWx0LmFyZ3NbMF0gIT09IG51bGwgJiYgcmVzdWx0LmFyZ3NbMF0gIT09IHVuZGVmaW5lZCkpID8gcmVzdWx0LmFyZ3NbMF0gOiBbXTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBhcmd1bWVudHM6IHBybXMgfSwgJC5leHRlbmQodHJ1ZSwge30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMKCkgKyAnb3BlcmF0aW9ucy8nICsgcmVzdWx0Lm9wc1swXSArICcvJ1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIHNldmVyYWwgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbCwgc2VxdWVudGlhbGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbWV0aG9kcyBtdXN0IGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwsIHNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImluaXRpYWxpemVcIiBhbmQgXCJzb2x2ZVwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbJ2luaXRpYWxpemUnLCAnc29sdmUnXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImluaXRcIiBhbmQgXCJyZXNldFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWyAgeyBuYW1lOiAnaW5pdCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZXNldCcsIHBhcmFtczogWzIsM10gfV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImluaXRcIiB0YWtlcyB0d28gYXJndW1lbnRzLFxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcInJ1bm1vZGVsXCIgdGFrZXMgbm9uZVxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncnVubW9kZWwnLCBwYXJhbXM6IFtdIH1dKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHsgYXJyYXlbU3RyaW5nXXxBcnJheVtPYmplY3RdIH0gYG9wZXJhdGlvbnNgIElmIG5vbmUgb2YgdGhlIG1ldGhvZHMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBtZXRob2QgbmFtZXMgKHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG1ldGhvZHMgZG8gdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYSBtZXRob2QgbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNlcmlhbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wUGFyYW1zID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb25zLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wcyA9IG9wUGFyYW1zLm9wcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gb3BQYXJhbXMuYXJncztcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb1NpbmdsZU9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcCA9IG9wcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBtZS5kbyhvcCwgYXJnLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9TaW5nbGVPcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgc2V2ZXJhbCBtZXRob2RzIGZyb20gdGhlIG1vZGVsLCBleGVjdXRpbmcgdGhlbSBpbiBwYXJhbGxlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIG1ldGhvZHMgbXVzdCBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsLCBzZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcInNvbHZlXCIgYW5kIFwicmVzZXRcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbChbJ3NvbHZlJywgJ3Jlc2V0J10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJhZGRcIiBhbmQgXCJzdWJ0cmFjdFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbChbIHsgbmFtZTogJ2FkZCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnc3VidHJhY3QnLCBwYXJhbXM6WzIsM10gfV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJhZGRcIiBhbmQgXCJzdWJ0cmFjdFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbCh7IGFkZDogWzEsMl0sIHN1YnRyYWN0OiBbMiw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHsgYXJyYXl8T2JqZWN0fSBgb3BlcmF0aW9uc2AgSWYgbm9uZSBvZiB0aGUgbWV0aG9kcyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG1ldGhvZCBuYW1lcyAoYXMgc3RyaW5ncykuIElmIGFueSBvZiB0aGUgbWV0aG9kcyBkbyB0YWtlIHBhcmFtZXRlcnMsIHlvdSBoYXZlIHR3byBvcHRpb25zLiBZb3UgY2FuIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhIG1ldGhvZCBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy4gQWx0ZXJuYXRpdmVseSwgeW91IGNhbiBwYXNzIGEgc2luZ2xlIG9iamVjdCB3aXRoIHRoZSBtZXRob2QgbmFtZSBhbmQgYSAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFsbGVsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcXVldWUgID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaTwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcXVldWUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kbyhvcHNbaV0sIGFyZ3NbaV0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQud2hlbi5hcHBseSh0aGlzLCBxdWV1ZSlcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuc3VjY2Vzcy5hcHBseSh0aGlzLmFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlamVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5lcnJvci5hcHBseSh0aGlzLmFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY1N5bmNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGEgVmFyaWFibGVzIFNlcnZpY2UgaW5zdGFuY2UuIFVzZSB0aGUgdmFyaWFibGVzIGluc3RhbmNlIHRvIGxvYWQsIHNhdmUsIGFuZCBxdWVyeSBmb3Igc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzLiBTZWUgdGhlIFtWYXJpYWJsZSBBUEkgU2VydmljZV0oLi4vdmFyaWFibGVzLWFwaS1zZXJ2aWNlLykgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdmFyIHZzID0gcnMudmFyaWFibGVzKCk7XG4gICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHNhbXBsZV9pbnQ6IDR9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBjb25maWdgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuXG4gICAgICAgIHZhcmlhYmxlczogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHZzID0gbmV3IFZhcmlhYmxlc1NlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBjb25maWcsIHtcbiAgICAgICAgICAgICAgICBydW5TZXJ2aWNlOiB0aGlzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gdnM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY1N5bmNBUEkpO1xufTtcblxuIiwiLyoqXG4gKlxuICogIyNWYXJpYWJsZXMgQVBJIFNlcnZpY2VcbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIHRvIHJlYWQsIHdyaXRlLCBhbmQgc2VhcmNoIGZvciBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMuXG4gKlxuICogICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnXG4gKiAgICAgICAgICAgfVxuICogICAgICB9KTtcbiAqICAgICBybS5nZXRSdW4oKVxuICogICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gKiAgICAgICAgICB2YXIgdnMgPSBybS5ydW4udmFyaWFibGVzKCk7XG4gKiAgICAgICAgICB2cy5zYXZlKHtzYW1wbGVfaW50OiA0fSk7XG4gKiAgICAgICAgfSk7XG4gKlxuICovXG5cblxuICd1c2Ugc3RyaWN0JztcblxuIHZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHJ1bnMgb2JqZWN0IHRvIHdoaWNoIHRoZSB2YXJpYWJsZSBmaWx0ZXJzIGFwcGx5LiBEZWZhdWx0cyB0byBudWxsLlxuICAgICAgICAgKiBAdHlwZSB7IHJ1blNlcnZpY2UgfVxuICAgICAgICAgKi9cbiAgICAgICAgcnVuU2VydmljZTogbnVsbFxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmdldEZpbHRlclVSTCgpICsgJ3ZhcmlhYmxlcy8nO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdmFsdWVzIGZvciBhIHZhcmlhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLmxvYWQoJ3NhbXBsZV9pbnQnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBgdmFyaWFibGVgIE5hbWUgb2YgdmFyaWFibGUgdG8gbG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHZhcmlhYmxlLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgJC5leHRlbmQoe30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciB2YXJpYWJsZXMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXVlcnlgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5xdWVyeShbJ3ByaWNlJywgJ3NhbGVzJ10pO1xuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KHsgaW5jbHVkZTpbJ3ByaWNlJywgJ3NhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBgcXVlcnlgIFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkocXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSB7IGluY2x1ZGU6IHF1ZXJ5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkLmV4dGVuZChxdWVyeSwgb3V0cHV0TW9kaWZpZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHF1ZXJ5LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgdmFsdWVzIHRvIG1vZGVsIHZhcmlhYmxlcy4gT3ZlcndyaXRlcyBleGlzdGluZyB2YWx1ZXMuIE5vdGUgdGhhdCB5b3UgY2FuIG9ubHkgdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoQW4gYWx0ZXJuYXRlIHdheSB0byB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlzIHRvIGNhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwgYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZSBtZXRob2QgcGVyc2lzdHMgdGhlIHZhcmlhYmxlcy4gU2VlIGBkb2AsIGBzZXJpYWxgLCBhbmQgYHBhcmFsbGVsYCBpbiB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIGNhbGxpbmcgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMuc2F2ZSgncHJpY2UnLCA0KTtcbiAgICAgICAgICogICAgICB2cy5zYXZlKHsgcHJpY2U6IDQsIHF1YW50aXR5OiA1LCBwcm9kdWN0czogWzIsMyw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBgdmFyaWFibGVgIEFuIG9iamVjdCBjb21wb3NlZCBvZiB0aGUgbW9kZWwgdmFyaWFibGVzIGFuZCB0aGUgdmFsdWVzIHRvIHNhdmUuIEFsdGVybmF0aXZlbHksIGEgc3RyaW5nIHdpdGggdGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHZhbGAgKE9wdGlvbmFsKSBJZiBwYXNzaW5nIGEgc3RyaW5nIGZvciBgdmFyaWFibGVgLCB1c2UgdGhpcyBhcmd1bWVudCBmb3IgdGhlIHZhbHVlIHRvIHNhdmUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uICh2YXJpYWJsZSwgdmFsLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhcmlhYmxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGF0dHJzID0gdmFyaWFibGU7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKGF0dHJzID0ge30pW3ZhcmlhYmxlXSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoLmNhbGwodGhpcywgYXR0cnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdCBBdmFpbGFibGUgdW50aWwgdW5kZXJseWluZyBBUEkgc3VwcG9ydHMgUFVULiBPdGhlcndpc2Ugc2F2ZSB3b3VsZCBiZSBQVVQgYW5kIG1lcmdlIHdvdWxkIGJlIFBBVENIXG4gICAgICAgIC8vICpcbiAgICAgICAgLy8gICogU2F2ZSB2YWx1ZXMgdG8gdGhlIGFwaS4gTWVyZ2VzIGFycmF5cywgYnV0IG90aGVyd2lzZSBzYW1lIGFzIHNhdmVcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YXJpYWJsZSBPYmplY3Qgd2l0aCBhdHRyaWJ1dGVzLCBvciBzdHJpbmcga2V5XG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgT3B0aW9uYWwgaWYgcHJldiBwYXJhbWV0ZXIgd2FzIGEgc3RyaW5nLCBzZXQgdmFsdWUgaGVyZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgdnMubWVyZ2UoeyBwcmljZTogNCwgcXVhbnRpdHk6IDUsIHByb2R1Y3RzOiBbMiwzLDRdIH0pXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSgncHJpY2UnLCA0KTtcblxuICAgICAgICAvLyBtZXJnZTogZnVuY3Rpb24gKHZhcmlhYmxlLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gICAgIHZhciBhdHRycztcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2YgdmFyaWFibGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vICAgICAgIGF0dHJzID0gdmFyaWFibGU7XG4gICAgICAgIC8vICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAoYXR0cnMgPSB7fSlbdmFyaWFibGVdID0gdmFsO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyAgICAgcmV0dXJuIGh0dHAucGF0Y2guY2FsbCh0aGlzLCBhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICAvLyB9XG4gICAgfTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2UgcHJvdmlkZXMgbWV0aG9kcyBmb3IgbG9nZ2luZyBpbiBhbmQgY3JlYXRpbmcgdXNlciBhY2Nlc3MgdG9rZW5zLlxuICogVXNlciBhY2Nlc3MgdG9rZW5zIGFyZSByZXF1aXJlZCBmb3IgZWFjaCBjYWxsIHRvIEVwaWNlbnRlci4gKFNlZSBbQ3JlYXRpbmcgYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4pXG4gKlxuICogICAgICB2YXIgYXV0aCA9IG5ldyBGLnNlcnZpY2UuQXV0aCgpO1xuICogICAgICBhdXRoLmxvZ2luKHsgdXNlck5hbWU6ICdqc21pdGhAYWNtZXNpbXVsYXRpb25zLmNvbScsXG4gKiAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnIH0pO1xuICogICAgICBhdXRoLmxvZ291dCgpO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVyZSB0byBzdG9yZSB1c2VyIGFjY2VzcyB0b2tlbnMgZm9yIHRlbXBvcmFyeSBhY2Nlc3MuIERlZmF1bHRzIHRvIHN0b3JpbmcgaW4gYSBjb29raWUgaW4gdGhlIGJyb3dzZXIuXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgc3RvcmU6IHsgc3luY2hyb25vdXM6IHRydWUgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlck5hbWU6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIHVzZXJuYW1lLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFzc3dvcmQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY2NvdW50IHRvIGxvZyBpbiBpbnRvLiBSZXF1aXJlZCB0byBsb2cgaW4gYXMgYW4gZW5kIHVzZXIuIERlZmF1bHRzIHRvIHBpY2tpbmcgaXQgdXAgZnJvbSB0aGUgcGF0aC5cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmFjY291bnQgPSB1cmxDb25maWcuYWNjb3VudFBhdGg7XG4gICAgfVxuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdhdXRoZW50aWNhdGlvbicpXG4gICAgfSk7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgaW4uIElmIG5vIHVzZXJuYW1lIG9yIHBhc3N3b3JkIHdhcyBwcm92aWRlZCBpbiB0aGUgaW5pdGlhbCBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHRoZXkgYXJlIHJlcXVpcmVkIGhlcmUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dpbih7IHVzZXJOYW1lOiAnanNtaXRoQGFjbWVzaW11bGF0aW9ucy5jb20nLFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnLFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AgfSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VyTmFtZSB8fCAhaHR0cE9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHVzZXJuYW1lIG9yIHBhc3N3b3JkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBvc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGh0dHBPcHRpb25zLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBodHRwT3B0aW9ucy5wYXNzd29yZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaHR0cE9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICAgICAgICAgIC8vcGFzcyBpbiBudWxsIGZvciBhY2NvdW50IHVuZGVyIG9wdGlvbnMgaWYgeW91IGRvbid0IHdhbnQgaXQgdG8gYmUgc2VudFxuICAgICAgICAgICAgICAgIHBvc3RQYXJhbXMuYWNjb3VudCA9IGh0dHBPcHRpb25zLmFjY291bnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocG9zdFBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgb3V0IGZyb20gc3BlY2lmaWVkIGFjY291bnRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGF1dGgubG9nb3V0KCk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHsgc3VjY2VzczogJC5ub29wIH0sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaHR0cE9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHRva2VuIHdhcyBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2xhc2ggPSBodHRwT3B0aW9ucy51cmwuc2xpY2UoLTEpID09PSAnLycgPyAnJyA6ICcvJztcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGh0dHBPcHRpb25zLnVybCArIHNsYXNoICsgaHR0cE9wdGlvbnMudG9rZW47XG4gICAgICAgICAgICB2YXIgZGVsZXRlUGFyYW1zID0ge307XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShkZWxldGVQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICogIyNEYXRhIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIERhdGEgQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgZGF0YSByZWxhdGVkIHRvIGFueSBvZiB5b3VyIHByb2plY3RzLiBEYXRhIGFyZSBvcmdhbml6ZWQgaW4gY29sbGVjdGlvbnMuIEVhY2ggY29sbGVjdGlvbiBjb250YWlucyBhIGRvY3VtZW50OyBlYWNoIGVsZW1lbnQgb2YgdGhpcyB0b3AtbGV2ZWwgZG9jdW1lbnQgaXMgYSBKU09OIG9iamVjdC4gKFNlZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vZGF0YV9hcGkvKS4pXG4gKlxuICogQWxsIEFQSSBjYWxscyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgRGF0YSBBUEkgU2VydmljZSBkZWZhdWx0cy4gSW4gcGFydGljdWxhciwgdGhlIGByb290YCBvcHRpb24gY29udGFpbnMgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24uIElmIHlvdSBoYXZlIG11bHRpcGxlIGNvbGxlY3Rpb25zIHdpdGhpbiBlYWNoIG9mIHlvdXIgcHJvamVjdHMsIHlvdSBjYW4gcGFzcyB0aGUgY29sbGVjdGlvbiBuYW1lIGFzIGFuIG9wdGlvbiBmb3IgZWFjaCBjYWxsLlxuICpcbiAqICAgICAgdmFyIGRzID0gbmV3IEYuc2VydmljZS5EYXRhKHsgcm9vdDogJ3N1cnZleS1yZXNwb25zZXMnIH0pO1xuICogICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAqICAgICAgICAgICAncXVlc3Rpb24zJzogZmFsc2UsICdxdWVzdGlvbjQnOiAnc29tZXRpbWVzJyB9ICk7XG4gKiAgICAgIGRzLnNhdmVBcygndXNlcjInLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMywgJ3F1ZXN0aW9uMic6IDgsXG4gKiAgICAgICAgICAgJ3F1ZXN0aW9uMyc6IHRydWUsICdxdWVzdGlvbjQnOiAnYWx3YXlzJyB9ICk7XG4gKiAgICAgIGRzLnF1ZXJ5KCcnLHsgJ3F1ZXN0aW9uMic6IHsgJyRndCc6IDl9IH0pO1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkoeyBzeW5jaHJvbm91czogdHJ1ZSB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5hbWUgb2YgY29sbGVjdGlvbi4gRGVmYXVsdHMgdG8gYC9gLCB0aGF0IGlzLCB0aGUgcm9vdCBsZXZlbCBvZiB5b3VyIHByb2plY3QgYXQgYGZvcmlvLmNvbS9hcHAveW91ci1hY2NvdW50LWlkL3lvdXItcHJvamVjdC1pZC9gLiBSZXF1aXJlZC5cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBvcGVyYXRpb25zIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7IHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiBzdG9yZS5nZXQoJ2VwaWNlbnRlci5wcm9qZWN0LnRva2VuJykgfHwgJycsXG5cbiAgICAgICAgYXBpS2V5OiAnJyxcbiAgICAgICAgZG9tYWluOiAnZm9yaW8uY29tJyxcblxuICAgICAgICAvL09wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXJcbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uIChrZXksIHJvb3QpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByb290ID0gc2VydmljZU9wdGlvbnMucm9vdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2RhdGEnKSArIHF1dGlsLmFkZFRyYWlsaW5nU2xhc2gocm9vdCk7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHVybCs9IHF1dGlsLmFkZFRyYWlsaW5nU2xhc2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfSk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VhcmNoIGZvciBkYXRhIHdpdGhpbiBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFNlYXJjaGluZyB1c2luZyBjb21wYXJpc29uIG9yIGxvZ2ljYWwgb3BlcmF0b3JzIChhcyBvcHBvc2VkIHRvIGV4YWN0IG1hdGNoZXMpIHJlcXVpcmVzIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9kYXRhX2FwaS8jc2VhcmNoaW5nKSBmb3IgYWRkaXRpb25hbCBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBkb2N1bWVudCAndXNlcjEnXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJ3VzZXIxJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gZXhhY3QgbWF0Y2hpbmc6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb24gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiA5fSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gY29tcGFyaXNvbiBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBncmVhdGVyIHRoYW4gOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiB7ICckZ3QnOiA5fSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBsb2dpY2FsIG9wZXJhdG9yczpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkb2N1bWVudHMgaW4gY29sbGVjdGlvblxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlICdxdWVzdGlvbjInIGlzIGxlc3MgdGhhbiAxMCwgYW5kICdxdWVzdGlvbjMnIGlzIGZhbHNlXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJyRhbmQnOiBbIHsgJ3F1ZXN0aW9uMic6IHsgJyRsdCc6MTB9IH0sIHsgJ3F1ZXN0aW9uMyc6IGZhbHNlIH1dIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJlZ3VsYXIgZXhwcmVzc3Npb25zOiB1c2UgYW55IFBlcmwtY29tcGF0aWJsZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb241JyBjb250YWlucyB0aGUgc3RyaW5nICcqZGF5J1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjUnOiB7ICckcmVnZXgnOiAnKmRheScgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBga2V5YCBUaGUgbmFtZSBvZiB0aGUgZG9jdW1lbnQgdG8gc2VhcmNoLiBQYXNzIHRoZSBlbXB0eSBzdHJpbmcgKCcnKSB0byBzZWFyY2ggdGhlIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHF1ZXJ5YCBUaGUgcXVlcnkgb2JqZWN0LiBGb3IgZXhhY3QgbWF0Y2hpbmcsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCBmaWVsZCB2YWx1ZSB0byBtYXRjaC4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGNvbXBhcmlzb24sIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCB0aGUgY29tcGFyaXNvbiBleHByZXNzaW9uLiBGb3IgbWF0Y2hpbmcgYmFzZWQgb24gbG9naWNhbCBvcGVyYXRvcnMsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIGFuIGV4cHJlc3Npb24gdXNpbmcgTW9uZ29EQiBzeW50YXguIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL2RhdGFfYXBpLyNzZWFyY2hpbmcpIGZvciBhZGRpdGlvbmFsIGV4YW1wbGVzLlxuICAgICAgICAgKiBAcGFyYSBtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChrZXksIHF1ZXJ5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHsgcTogcXVlcnkgfSwgb3V0cHV0TW9kaWZpZXIpO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGRhdGEgdG8gYW4gYW5vbnltb3VzIGRvY3VtZW50IHdpdGhpbiB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogKERvY3VtZW50cyBhcmUgdG9wLWxldmVsIGVsZW1lbnRzIHdpdGhpbiBhIGNvbGxlY3Rpb24uIENvbGxlY3Rpb25zIG11c3QgYmUgdW5pcXVlIHdpdGhpbiB0aGlzIGFjY291bnQgKHRlYW0gb3IgcGVyc29uYWwgYWNjb3VudCkgYW5kIHByb2plY3QgYW5kIGFyZSBzZXQgd2l0aCB0aGUgYHJvb3RgIGZpZWxkIGluIHRoZSBgb3B0aW9uYCBwYXJhbWV0ZXIuIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL2RhdGFfYXBpLykgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMuc2F2ZSgncXVlc3Rpb24xJywgJ3llcycpO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmUoe3F1ZXN0aW9uMToneWVzJywgcXVlc3Rpb24yOiAzMiB9KTtcbiAgICAgICAgICogICAgICBkcy5zYXZlKHsgbmFtZTonSm9obicsIGNsYXNzTmFtZTogJ0NTMTAxJyB9LCB7IHJvb3Q6ICdzdHVkZW50cycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ3xPYmplY3R9IGBrZXlgIElmIGBrZXlgIGlzIGEgc3RyaW5nLCBpdCBpcyB0aGUgaWQgb2YgdGhlIGVsZW1lbnQgdG8gc2F2ZSAoY3JlYXRlKSBpbiB0aGlzIGRvY3VtZW50LiBJZiBga2V5YCBpcyBhbiBvYmplY3QsIHRoZSBvYmplY3QgaXMgdGhlIGRhdGEgdG8gc2F2ZSAoY3JlYXRlKSBpbiB0aGlzIGRvY3VtZW50LiBJbiBib3RoIGNhc2VzLCB0aGUgaWQgZm9yIHRoZSBkb2N1bWVudCBpcyBnZW5lcmF0ZWQgYXV0b21hdGljYWxseS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGB2YWx1ZWAgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLiBJZiBga2V5YCBpcyBhIHN0cmluZywgdGhpcyBpcyB0aGUgdmFsdWUgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgdmFsdWUocykgdG8gc2F2ZSBhcmUgYWxyZWFkeSBwYXJ0IG9mIGBrZXlgIGFuZCB0aGlzIGFyZ3VtZW50IGlzIG5vdCByZXF1aXJlZC5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoJycsIGh0dHBPcHRpb25zLnJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgZGF0YSB0byBhIG5hbWVkIGRvY3VtZW50IG9yIGVsZW1lbnQgd2l0aGluIHRoZSBjb2xsZWN0aW9uLiBUaGUgYHJvb3RgIG9mIHRoZSBjb2xsZWN0aW9uIG11c3QgYmUgc3BlY2lmaWVkIHNlcGFyYXRlbHkgaW4gY29uZmlndXJhdGlvbiBvcHRpb25zLCBlaXRoZXIgYXMgcGFydCBvZiB0aGUgY2FsbCBvciBhcyBwYXJ0IG9mIHRoZSBpbml0aWFsaXphdGlvbiBvZiBkcy5cbiAgICAgICAgICpcbiAgICAgICAgICogKERvY3VtZW50cyBhcmUgdG9wLWxldmVsIGVsZW1lbnRzIHdpdGhpbiBhIGNvbGxlY3Rpb24uIENvbGxlY3Rpb25zIG11c3QgYmUgdW5pcXVlIHdpdGhpbiB0aGlzIGFjY291bnQgKHRlYW0gb3IgcGVyc29uYWwgYWNjb3VudCkgYW5kIHByb2plY3QgYW5kIGFyZSBzZXQgd2l0aCB0aGUgYHJvb3RgIGZpZWxkIGluIHRoZSBgb3B0aW9uYCBwYXJhbWV0ZXIuIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL2RhdGFfYXBpLykgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gICAgICAgICAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAgICAgICAgICogICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3N0dWRlbnQxJyxcbiAgICAgICAgICogICAgICAgICAgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnbWdtdDEwMC9ncm91cEInLFxuICAgICAgICAgKiAgICAgICAgICB7IHNjZW5hcmlvWWVhcjogJzIwMTUnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ215Y2xhc3NlcycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30gYGtleWAgSWQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHZhbHVlYCAoT3B0aW9uYWwpIFRoZSBkYXRhIHRvIHNhdmUsIGluIGtleTp2YWx1ZSBwYWlycy5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZUFzOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wdXQodmFsdWUsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgZG9jdW1lbnQgb3IgZmllbGQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMubG9hZCgndXNlcjEnKTtcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMS9xdWVzdGlvbjMnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGBrZXlgIFRoZSBpZCBvZiB0aGUgZGF0YSB0byByZXR1cm4uIENhbiBiZSB0aGUgaWQgb2YgYSBkb2N1bWVudCwgb3IgYSBwYXRoIHRvIGRhdGEgd2l0aGluIHRoYXQgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoa2V5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgZGF0YSBmcm9tIGNvbGxlY3Rpb24uIE9ubHkgZG9jdW1lbnRzICh0b3AtbGV2ZWwgZWxlbWVudHMgaW4gZWFjaCBjb2xsZWN0aW9uKSBjYW4gYmUgZGVsZXRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGRzLnJlbW92ZSgndXNlcjEnKTtcbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBga2V5YCBUaGUgaWQgb2YgdGhlIGRvY3VtZW50IHRvIHJlbW92ZSBmcm9tIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5cywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBwYXJhbXM7XG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KGtleXMpKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBpZDoga2V5cyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5cywgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUocGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFcGljZW50ZXIgZG9lc24ndCBhbGxvdyBudWtpbmcgY29sbGVjdGlvbnNcbiAgICAgICAgLy8gICAgIC8qKlxuICAgICAgICAvLyAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgLy8gICAgICAqIEByZXR1cm4gbnVsbFxuICAgICAgICAvLyAgICAgICovXG4gICAgICAgIC8vICAgICBkZXN0cm95OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSgnJywgb3B0aW9ucyk7XG4gICAgICAgIC8vICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gICAgRGVjaWRlcyB0eXBlIG9mIHN0b3JlIHRvIHByb3ZpZGVcbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBpc05vZGUgPSBmYWxzZTtcbnZhciBzdG9yZSA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9zZXNzaW9uLXN0b3JlJykgOiByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdmFsaWRGaWx0ZXI6IHsgc2F2ZWQ6IHRydWUgfVxufTtcblxuZnVuY3Rpb24gU2NlbmFyaW9NYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMucnVuU2VydmljZSA9IHRoaXMub3B0aW9ucy5ydW4gfHwgbmV3IFJ1blNlcnZpY2UodGhpcy5vcHRpb25zKTtcbn1cblxuU2NlbmFyaW9NYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICBnZXRSdW5zOiBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyID0gJC5leHRlbmQodHJ1ZSwge30sIHRoaXMub3B0aW9ucy52YWxpZEZpbHRlciwgZmlsdGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU2VydmljZS5xdWVyeSh0aGlzLmZpbHRlcik7XG4gICAgfSxcblxuICAgIGxvYWRWYXJpYWJsZXM6IGZ1bmN0aW9uICh2YXJzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UucXVlcnkodGhpcy5maWx0ZXIsIHsgaW5jbHVkZTogdmFycyB9KTtcbiAgICB9LFxuXG4gICAgc2F2ZTogZnVuY3Rpb24gKHJ1biwgbWV0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U2VydmljZShydW4pLnNhdmUoJC5leHRlbmQodHJ1ZSwge30sIHsgc2F2ZWQ6IHRydWUgfSwgbWV0YSkpO1xuICAgIH0sXG5cbiAgICBhcmNoaXZlOiBmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTZXJ2aWNlKHJ1bikuc2F2ZSh7IHNhdmVkOiBmYWxzZSB9KTtcbiAgICB9LFxuXG4gICAgX2dldFNlcnZpY2U6IGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBydW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJ1blNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sICB0aGlzLm9wdGlvbnMsIHsgZmlsdGVyOiBydW4gfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBydW4gPT09ICdvYmplY3QnICYmIHJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NhdmUgbWV0aG9kIHJlcXVpcmVzIGEgcnVuIHNlcnZpY2Ugb3IgYSBydW5JZCcpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICByZXR1cm4gbmV3IFJ1blNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sICB0aGlzLm9wdGlvbnMsIHsgZmlsdGVyOiBydW5JZCB9KSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuYXJpb01hbmFnZXI7XG5cbiIsIi8qKlxuKiAjIyBSdW4gTWFuYWdlclxuKlxuKiBUaGUgUnVuIE1hbmFnZXIgZ2l2ZXMgeW91IGNvbnRyb2wgb3ZlciBydW4gY3JlYXRpb24gZGVwZW5kaW5nIG9uIHJ1biBzdGF0ZXMuIFNwZWNpZmljYWxseSwgeW91IGNhbiBzZWxlY3QgcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKSBmb3Igd2hpY2ggcnVucyBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0IHdvcmsgd2l0aCB3aGVuIHRoZXkgbG9nIGluIHRvIHlvdXIgcHJvamVjdC5cbipcbiogVW5kZXJseWluZyBFcGljZW50ZXIgQVBJcyAtLSBpbmNsdWRpbmcgdGhlIFtNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9tb2RlbF9hcGlzL3J1bi8pLCB0aGUgW1J1biBBUEldKC4uLy4uLy4uL2FnZ3JlZ2F0ZV9ydW5fYXBpKSwgYW5kIEVwaWNlbnRlci5qcydzIG93biBbRi5zZXJ2aWNlLlJ1bi5jcmVhdGUoKV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgLS0gYWxsIGFsbG93IHlvdSB0byBjcmVhdGUgbmV3IHJ1bnMuIEhvd2V2ZXIsIGZvciBzb21lIHByb2plY3RzIGl0IG1ha2VzIG1vcmUgc2Vuc2UgdG8gcGljayB1cCB3aGVyZSB0aGUgdXNlciBsZWZ0IG9mZiwgdXNpbmcgYW4gZXhpc3RpbmcgcnVuLiBBbmQgaW4gc29tZSBwcm9qZWN0cywgd2hldGhlciB0byBjcmVhdGUgYSBuZXcgb25lIG9yIHVzZSBhbiBleGlzdGluZyBvbmUgaXMgY29uZGl0aW9uYWwsIGZvciBleGFtcGxlIGJhc2VkIG9uIGNoYXJhY3RlcmlzdGljcyBvZiB0aGUgZXhpc3RpbmcgcnVuIG9yIHlvdXIgb3duIGtub3dsZWRnZSBhYm91dCB0aGUgbW9kZWwuIFRoZSBSdW4gTWFuYWdlciBwcm92aWRlcyB0aGlzIGxldmVsIG9mIGNvbnRyb2wuXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gY3JlYXRlIGFuZCBhY2Nlc3MgcnVuc1xuKlxuKiBUbyB1c2UgdGhlIFJ1biBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCBieSBwYXNzaW5nIGluOlxuKlxuKiAgICogYHJ1bmA6IChyZXF1aXJlZCkgUnVuIG9iamVjdC4gTXVzdCBjb250YWluOlxuKiAgICAgICAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICAgICAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4qICAgICAgICogYG1vZGVsYDogVGhlIG5hbWUgb2YgeW91ciBwcmltYXJ5IG1vZGVsIGZpbGUuIChTZWUgbW9yZSBvbiBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4pXG4qICAgICAgICogYHNjb3BlYDogKG9wdGlvbmFsKSBTY29wZSBvYmplY3QgZm9yIHRoZSBydW4sIGZvciBleGFtcGxlIGBzY29wZS5ncm91cGAgd2l0aCB2YWx1ZSBvZiB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAuXG4qICAgICAgICogYGZpbGVzYDogKG9wdGlvbmFsKSBJZiBhbmQgb25seSBpZiB5b3UgYXJlIHVzaW5nIGEgVmVuc2ltIG1vZGVsIGFuZCB5b3UgaGF2ZSBhZGRpdGlvbmFsIGRhdGEgdG8gcGFzcyBpbiB0byB5b3VyIG1vZGVsLCB5b3UgY2FuIHBhc3MgYSBgZmlsZXNgIG9iamVjdCB3aXRoIHRoZSBuYW1lcyBvZiB0aGUgZmlsZXMsIGZvciBleGFtcGxlOiBgXCJmaWxlc1wiOiB7XCJkYXRhXCI6IFwibXlFeHRyYURhdGEueGxzXCJ9YC4gKE5vdGUgdGhhdCB5b3UnbGwgYWxzbyBuZWVkIHRvIGFkZCB0aGlzIHNhbWUgZmlsZXMgb2JqZWN0IHRvIHlvdXIgVmVuc2ltIFtjb25maWd1cmF0aW9uIGZpbGVdKC4uLy4uLy4uL21vZGVsX2NvZGUvdmVuc2ltLykuKSBTZWUgdGhlIFt1bmRlcmx5aW5nIE1vZGVsIFJ1biBBUEldKC4uLy4uLy4uL21vZGVsX2FwaXMvcnVuLyNwb3N0LWNyZWF0aW5nLWEtbmV3LXJ1bi1mb3ItdGhpcy1wcm9qZWN0KSBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbipcbiogICAqIGBzdHJhdGVneWA6IChvcHRpb25hbCkgUnVuIGNyZWF0aW9uIHN0cmF0ZWd5IGZvciB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4gYW5kIHdoZW4gdG8gcmV1c2UgYW4gZW5kIHVzZXIncyBleGlzdGluZyBydW4uIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vLi4vc3RyYXRlZ3kvKSBmb3IgZGV0YWlscy4gRGVmYXVsdHMgdG8gYG5ldy1pZi1pbml0aWFsaXplZGAuXG4qXG4qICAgKiBgc2Vzc2lvbktleWA6IChvcHRpb25hbCkgTmFtZSBvZiBicm93c2VyIGNvb2tpZSBpbiB3aGljaCB0byBzdG9yZSBydW4gaW5mb3JtYXRpb24sIGluY2x1ZGluZyBydW4gaWQuIE1hbnkgY29uZGl0aW9uYWwgc3RyYXRlZ2llcywgaW5jbHVkaW5nIHRoZSBwcm92aWRlZCBzdHJhdGVnaWVzLCByZWx5IG9uIHRoaXMgYnJvd3NlciBjb29raWUgdG8gc3RvcmUgdGhlIHJ1biBpZCBhbmQgaGVscCBtYWtlIHRoZSBkZWNpc2lvbiBvZiB3aGV0aGVyIHRvIGNyZWF0ZSBhIG5ldyBydW4gb3IgdXNlIGFuIGV4aXN0aW5nIG9uZS4gVGhlIG5hbWUgb2YgdGhpcyBjb29raWUgZGVmYXVsdHMgdG8gYGVwaWNlbnRlci1zY2VuYXJpb2AgYW5kIGNhbiBiZSBzZXQgd2l0aCB0aGUgYHNlc3Npb25LZXlgIHBhcmFtZXRlci5cbipcbipcbiogQWZ0ZXIgaW5zdGFudGlhdGluZyBhIFJ1biBNYW5hZ2VyLCBtYWtlIGEgY2FsbCB0byBgZ2V0UnVuKClgIHdoZW5ldmVyIHlvdSBuZWVkIHRvIGFjY2VzcyBhIHJ1biBmb3IgdGhpcyBlbmQgdXNlci4gVGhlIGBSdW5NYW5hZ2VyLnJ1bmAgY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBbUnVuIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLlxuKlxuKiAqKkV4YW1wbGUqKlxuKlxuKiAgICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuKiAgICAgICAgICAgcnVuOiB7XG4qICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4qICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnLFxuKiAgICAgICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuKiAgICAgICAgICAgfSxcbiogICAgICAgICAgIHN0cmF0ZWd5OiAnYWx3YXlzLW5ldycsXG4qICAgICAgICAgICBzZXNzaW9uS2V5OiAnZXBpY2VudGVyLXNlc3Npb24nXG4qICAgICAgIH0pO1xuKiAgICAgICBybS5nZXRSdW4oKVxuKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4qICAgICAgICAgICAgICAgLy8gdGhlIHJldHVybiB2YWx1ZSBvZiBnZXRSdW4oKSBpcyBhbiBpbnN0YW5jZSBvZiBSdW4gU2VydmljZVxuKiAgICAgICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4qICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGFsc28gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiogICAgICAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4qICAgICAgIH0pXG4qXG4qL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgc3RyYXRlZ2llc01hcCA9IHJlcXVpcmUoJy4vcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAnKTtcbnZhciBzcGVjaWFsT3BlcmF0aW9ucyA9IHJlcXVpcmUoJy4vc3BlY2lhbC1vcGVyYXRpb25zJyk7XG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG5cbiAgICBzdHJhdGVneTogJ25ldy1pZi1pbml0aWFsaXplZCdcbn07XG5cbmZ1bmN0aW9uIFJ1bk1hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5ydW4gPSB0aGlzLm9wdGlvbnMucnVuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucnVuID0gbmV3IFJ1blNlcnZpY2UodGhpcy5vcHRpb25zLnJ1bik7XG4gICAgfVxuXG4gICAgcGF0Y2hSdW5TZXJ2aWNlKHRoaXMucnVuLCB0aGlzKTtcblxuICAgIHZhciBTdHJhdGVneUN0b3IgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnN0cmF0ZWd5ID09PSAnZnVuY3Rpb24nID8gdGhpcy5vcHRpb25zLnN0cmF0ZWd5IDogc3RyYXRlZ2llc01hcFt0aGlzLm9wdGlvbnMuc3RyYXRlZ3ldO1xuXG4gICAgaWYgKCFTdHJhdGVneUN0b3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTcGVjaWZpZWQgcnVuIGNyZWF0aW9uIHN0cmF0ZWd5IHdhcyBpbnZhbGlkOicsIHRoaXMub3B0aW9ucy5zdHJhdGVneSk7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJhdGVneSA9IG5ldyBTdHJhdGVneUN0b3IodGhpcy5ydW4sIHRoaXMub3B0aW9ucyk7XG59XG5cblJ1bk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIGEgJ2dvb2QnIHJ1bi5cbiAgICAgKlxuICAgICAqIEEgZ29vZCBydW4gaXMgZGVmaW5lZCBieSB0aGUgc3RyYXRlZ3kuIEZvciBleGFtcGxlLCBpZiB0aGUgc3RyYXRlZ3kgaXMgYGFsd2F5cy1uZXdgLCB0aGUgY2FsbFxuICAgICAqIHRvIGBnZXRSdW4oKWAgYWx3YXlzIHJldHVybnMgYSBuZXdseSBjcmVhdGVkIHJ1bjsgaWYgdGhlIHN0cmF0ZWd5IGlzIGBuZXctaWYtcGVyc2lzdGVkYCxcbiAgICAgKiBgZ2V0UnVuKClgIGNyZWF0ZXMgYSBuZXcgcnVuIGlmIHRoZSBwcmV2aW91cyBydW4gaXMgaW4gYSBwZXJzaXN0ZWQgc3RhdGUsIG90aGVyd2lzZVxuICAgICAqIGl0IHJldHVybnMgdGhlIHByZXZpb3VzIHJ1bi4gU2VlIFtSdW4gTWFuYWdlciBTdHJhdGVnaWVzXSguLi8uLi9zdHJhdGVneS8pIGZvciBtb3JlIG9uIHN0cmF0ZWdpZXMuXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0uZ2V0UnVuKCkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBydW4gb2JqZWN0XG4gICAgICogICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgUnVuIFNlcnZpY2Ugb2JqZWN0XG4gICAgICogICAgICAgICAgcnVuLmRvKCdydW5Nb2RlbCcpO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7Tm9uZX0gTm9uZVxuICAgICAqL1xuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJhdGVneVxuICAgICAgICAgICAgICAgIC5nZXRSdW4oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcnVuIG9iamVjdCBmb3IgYSBuZXcgcnVuLCByZWdhcmRsZXNzIG9mIHN0cmF0ZWd5OiBmb3JjZSBjcmVhdGlvbiBvZiBhIG5ldyBydW4uXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0ucmVzZXQoKS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIChuZXcpIHJ1biBvYmplY3RcbiAgICAgKiAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgUnVuIFNlcnZpY2Ugb2JqZWN0XG4gICAgICogICAgICAgICAgcnVuLmRvKCdydW5Nb2RlbCcpO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcnVuU2VydmljZU9wdGlvbnNgIFRoZSBvcHRpb25zIG9iamVjdCB0byBjb25maWd1cmUgdGhlIFJ1biBTZXJ2aWNlLiBTZWUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIG1vcmUuXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJhdGVneS5yZXNldChydW5TZXJ2aWNlT3B0aW9ucyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSdW5NYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBhbHdheXMgY3JlYXRlIGEgbmV3IHJ1biFcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCJcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHt9KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1ha2VTZXEgPSByZXF1aXJlKCcuLi8uLi91dGlsL21ha2Utc2VxdWVuY2UnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9pZGVudGl0eS1zdHJhdGVneScpO1xudmFyIFNlc3Npb25TdG9yZSA9IHJlcXVpcmUoJy4uLy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBVcmxTZXJ2aWNlID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxudmFyIHNlc3Npb25TdG9yZSA9IG5ldyBTZXNzaW9uU3RvcmUoe30pO1xudmFyIHVybFNlcnZpY2UgPSBuZXcgVXJsU2VydmljZSgpO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgc2Vzc2lvbktleTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07XG5cbmZ1bmN0aW9uIHNldFJ1bkluU2Vzc2lvbihzZXNzaW9uS2V5LCBydW4pIHtcbiAgICB2YXIgcGF0aCA9ICcvJyArIFt1cmxTZXJ2aWNlLmFwcFBhdGgsIHVybFNlcnZpY2UuYWNjb3VudFBhdGgsIHVybFNlcnZpY2UucHJvamVjdFBhdGhdLmpvaW4oJy8nKTtcblxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBnZXQgY29uc2VjdXRlaXZlICcvJyBzbyB3ZSBoYXZlIGEgdmFsaWQgcGF0aCBmb3IgdGhlIHNlc3Npb25cbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC97Mix9L2csJy8nKTtcblxuICAgIC8vIHNldCB0aGUgc2Vlc2lvbktleSBmb3IgdGhlIHJ1blxuICAgIHNlc3Npb25TdG9yZS5zZXQoc2Vzc2lvbktleSwgSlNPTi5zdHJpbmdpZnkoeyBydW5JZDogcnVuLmlkIH0pLCB7IHJvb3Q6IHBhdGggfSk7XG59XG5cbi8qKlxuKiBDb25kaXRpb25hbCBDcmVhdGlvbiBTdHJhdGVneVxuKiBUaGlzIHN0cmF0ZWd5IHdpbGwgdHJ5IHRvIGdldCB0aGUgcnVuIHN0b3JlZCBpbiB0aGUgY29va2llIGFuZFxuKiBldmFsdWF0ZSBpZiBuZWVkcyB0byBjcmVhdGUgYSBuZXcgcnVuIGJ5IGNhbGxpbmcgdGhlICdjb25kaXRpb24nIGZ1bmN0aW9uXG4qL1xuXG4vKiBqc2hpbnQgZXFudWxsOiB0cnVlICovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTdHJhdGVneShydW5TZXJ2aWNlLCBjb25kaXRpb24sIG9wdGlvbnMpIHtcblxuICAgICAgICBpZiAoY29uZGl0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZGl0aW9uYWwgc3RyYXRlZ3kgbmVlZHMgYSBjb25kaXRpb24gdG8gY3JlYXRldGUgYSBydW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucnVuID0gbWFrZVNlcShydW5TZXJ2aWNlKTtcbiAgICAgICAgdGhpcy5jb25kaXRpb24gPSB0eXBlb2YgY29uZGl0aW9uICE9PSAnZnVuY3Rpb24nID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZGl0aW9uOyB9IDogY29uZGl0aW9uO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnJ1bk9wdGlvbnMgPSB0aGlzLm9wdGlvbnMucnVuO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuXG4gICAgICAgICAgICAgICAgLmNyZWF0ZSh0aGlzLnJ1bk9wdGlvbnMsIHJ1blNlcnZpY2VPcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHNldFJ1bkluU2Vzc2lvbihfdGhpcy5vcHRpb25zLnNlc3Npb25LZXksIHJ1bik7XG4gICAgICAgICAgICAgICAgcnVuLmZyZXNobHlDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb25TdG9yZS5nZXQodGhpcy5vcHRpb25zLnNlc3Npb25LZXkpKTtcblxuICAgICAgICBpZiAoc2Vzc2lvbiAmJiBzZXNzaW9uLnJ1bklkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9hZEFuZENoZWNrKHNlc3Npb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfbG9hZEFuZENoZWNrOiBmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgICAgICB2YXIgc2hvdWxkQ3JlYXRlID0gZmFsc2U7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuXG4gICAgICAgICAgICAubG9hZChzZXNzaW9uLnJ1bklkLCBudWxsLCB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJ1biwgbXNnLCBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3VsZENyZWF0ZSA9IF90aGlzLmNvbmRpdGlvbi5jYWxsKF90aGlzLCBydW4sIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZENyZWF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGRvIHRoaXMsIG9uIHRoZSBvcmlnaW5hbCBydW5TZXJ2aWNlIChpZSBub3Qgc2VxdWVuY2lhbGl6ZWQpXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IGdldCBpbiB0aGUgbWlkZGxlIG9mIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMucnVuLm9yaWdpbmFsLmNyZWF0ZShfdGhpcy5ydW5PcHRpb25zKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSdW5JblNlc3Npb24oX3RoaXMub3B0aW9ucy5zZXNzaW9uS2V5LCBydW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVuLmZyZXNobHlDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG4vKlxuKiAgY3JlYXRlIGEgbmV3IHJ1biBvbmx5IGlmIG5vdGhpbmcgaXMgc3RvcmVkIGluIHRoZSBjb29raWVcbiogIHRoaXMgaXMgdXNlZnVsIGZvciBiYXNlUnVucy5cbiovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGlmIHdlIGFyZSBoZXJlLCBpdCBtZWFucyB0aGF0IHRoZSBydW4gZXhpc3RzLi4uIHNvIHdlIGRvbid0IG5lZWQgYSBuZXcgb25lXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCcgfHwgcnVuLmluaXRpYWxpemVkO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIixudWxsLCIvKipcbiAqIEBjbGFzcyBzZXNzaW9uIFN0b3JhZ2UgU2VydmljZVxuICpcbiAqICBDb29raWUgZXF1aXZhbGVudCBmb3Igbm9kZWpzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgZG9tYWluOiAnLmZvcmlvLmNvbSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8vICogVEJEXG4gICAgICAgIC8vICAqIFF1ZXJ5IGNvbGxlY3Rpb247IHVzZXMgTW9uZ29EQiBzeW50YXhcbiAgICAgICAgLy8gICogQHNlZSAgPFRCRDogRGF0YSBBUEkgVVJMPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IHFzIFF1ZXJ5IEZpbHRlclxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IGxpbWl0ZXJzIEBzZWUgPFRCRDogdXJsIGZvciBsaW1pdHMsIHBhZ2luZyBldGM+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICBjcy5xdWVyeShcbiAgICAgICAgLy8gICogICAgICB7IG5hbWU6ICdKb2huJywgY2xhc3NOYW1lOiAnQ1NDMTAxJyB9LFxuICAgICAgICAvLyAgKiAgICAgIHtsaW1pdDogMTB9XG4gICAgICAgIC8vICAqICAgICApXG5cbiAgICAgICAgLy8gcXVlcnk6IGZ1bmN0aW9uIChxcywgbGltaXRlcnMpIHtcblxuICAgICAgICAvLyB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIHNlc3Npb24gdmFsdWVcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSAgIElmIGdpdmVuIGEga2V5IHNhdmUgdmFsdWVzIHVuZGVyIGl0LCBpZiBnaXZlbiBhbiBvYmplY3QgZGlyZWN0bHksIHNhdmUgdG8gdG9wLWxldmVsIGFwaVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHZhbHVlIChPcHRpb25hbClcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHNhdmVkIHZhbHVlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5zZXQoJ3BlcnNvbicsIHsgZmlyc3ROYW1lOiAnam9obicsIGxhc3ROYW1lOiAnc21pdGgnIH0pO1xuICAgICAgICAgKiAgICAgY3Muc2V0KHsgbmFtZTonc21pdGgnLCBhZ2U6JzMyJyB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHNldE9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXRPcHRpb25zLnJvb3Q7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnNlc3Npb24gPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZG9tYWluID8gJzsgZG9tYWluPScgKyBkb21haW4gOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aCA/ICc7IHBhdGg9JyArIHBhdGggOiAnJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9hZCBzZXNzaW9uIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIHN0b3JlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MuZ2V0KCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIHNlc3Npb25SZWcgPSBuZXcgUmVnRXhwKCcoPzooPzpefC4qOylcXFxccyonICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkucmVwbGFjZSgvW1xcLVxcLlxcK1xcKl0vZywgJ1xcXFwkJicpICsgJ1xcXFxzKlxcXFw9XFxcXHMqKFteO10qKS4qJCl8Xi4qJCcpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IGRvY3VtZW50LnNlc3Npb24ucmVwbGFjZShzZXNzaW9uUmVnLCAnJDEnKTtcbiAgICAgICAgICAgIHZhbCA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpIHx8IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGtleSBmcm9tIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBrZXkga2V5IHRvIHJlbW92ZVxuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSBrZXkgVGhlIGtleSByZW1vdmVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5yZW1vdmUoJ3BlcnNvbicpO1xuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVtT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSByZW1PcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcmVtT3B0aW9ucy5yb290O1xuXG4gICAgICAgICAgICBkb2N1bWVudC5zZXNzaW9uID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc9OyBleHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aCA/ICc7IHBhdGg9JyArIHBhdGggOiAnJyk7XG4gICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAgKiBAcmV0dXJuIHsgYXJyYXl9IGtleXMgQWxsIHRoZSBrZXlzIHJlbW92ZWRcbiAgICAgICAgICovXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhS2V5cyA9IGRvY3VtZW50LnNlc3Npb24ucmVwbGFjZSgvKCg/Ol58XFxzKjspW15cXD1dKykoPz07fCQpfF5cXHMqfFxccyooPzpcXD1bXjtdKik/KD86XFwxfCQpL2csICcnKS5zcGxpdCgvXFxzKig/OlxcPVteO10qKT87XFxzKi8pO1xuICAgICAgICAgICAgZm9yICh2YXIgbklkeCA9IDA7IG5JZHggPCBhS2V5cy5sZW5ndGg7IG5JZHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uS2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGFLZXlzW25JZHhdKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShzZXNzaW9uS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhS2V5cztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zLCBtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLnJlc2V0KG9wdGlvbnMpO1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnbmV3LWlmLWluaXRpYWxpemVkJzogcmVxdWlyZSgnLi9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLXBlcnNpc3RlZCc6IHJlcXVpcmUoJy4vbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpLFxuICAgICduZXctaWYtbWlzc2luZyc6IHJlcXVpcmUoJy4vbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKSxcbiAgICAnYWx3YXlzLW5ldyc6IHJlcXVpcmUoJy4vYWx3YXlzLW5ldy1zdHJhdGVneScpXG59O1xuIl19
;