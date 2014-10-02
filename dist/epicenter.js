(function() {
    "use strict";
    var root = this;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jQuery");
    } else {
        $ = root.jQuery;
    }
    var query = function() {
        return {
            toMatrixFormat: function(qs) {
                if (qs === null || qs === undefined || qs === "") {
                    return ";";
                }
                if (typeof qs === "string" || qs instanceof String) {
                    return qs;
                }
                var returnArray = [];
                var OPERATORS = [ "<", ">", "!" ];
                $.each(qs, function(key, value) {
                    if (typeof value !== "string" || $.inArray($.trim(value).charAt(0), OPERATORS) === -1) {
                        value = "=" + value;
                    }
                    returnArray.push(key + value);
                });
                var mtrx = ";" + returnArray.join(";");
                return mtrx;
            },
            toQueryFormat: function(qs) {
                if (qs === null || qs === undefined) {
                    return "";
                }
                if (typeof qs === "string" || qs instanceof String) {
                    return qs;
                }
                var returnArray = [];
                $.each(qs, function(key, value) {
                    if ($.isArray(value)) {
                        value = value.join(",");
                    }
                    if ($.isPlainObject(value)) {
                        value = JSON.stringify(value);
                    }
                    returnArray.push(key + "=" + value);
                });
                var result = returnArray.join("&");
                return result;
            },
            qsToObject: function(qs) {
                if (qs === null || qs === undefined || qs === "") {
                    return {};
                }
                var qsArray = qs.split("&");
                var returnObj = {};
                $.each(qsArray, function(index, value) {
                    var qKey = value.split("=")[0];
                    var qVal = value.split("=")[1];
                    if (qVal.indexOf(",") !== -1) {
                        qVal = qVal.split(",");
                    }
                    returnObj[qKey] = qVal;
                });
                return returnObj;
            },
            mergeQS: function(qs1, qs2) {
                var obj1 = this.qsToObject(this.toQueryFormat(qs1));
                var obj2 = this.qsToObject(this.toQueryFormat(qs2));
                return $.extend(true, {}, obj1, obj2);
            },
            addTrailingSlash: function(url) {
                if (!url) {
                    return "";
                }
                return url.charAt(url.length - 1) === "/" ? url : url + "/";
            }
        };
    }();
    if (typeof exports !== "undefined") {
        module.exports = query;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.util) {
            root.F.util = {};
        }
        root.F.util.query = query;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jQuery");
    } else {
        $ = root.jQuery;
    }
    var run = function() {
        return {
            normalizeOperations: function(operations, args) {
                if (!args) {
                    args = [];
                }
                var returnList = {
                    ops: [],
                    args: []
                };
                var _concat = function(arr) {
                    return arr !== null && arr !== undefined ? [].concat(arr) : [];
                };
                var _normalizePlainObjects = function(operations, returnList) {
                    if (!returnList) {
                        returnList = {
                            ops: [],
                            args: []
                        };
                    }
                    $.each(operations, function(opn, arg) {
                        returnList.ops.push(opn);
                        returnList.args.push(_concat(arg));
                    });
                    return returnList;
                };
                var _normalizeStructuredObjects = function(operation, returnList) {
                    if (!returnList) {
                        returnList = {
                            ops: [],
                            args: []
                        };
                    }
                    returnList.ops.push(operation.name);
                    returnList.args.push(_concat(operation.params));
                    return returnList;
                };
                var _normalizeObject = function(operation, returnList) {
                    return (operation.name ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
                };
                var _normalizeLiterals = function(operation, args, returnList) {
                    if (!returnList) {
                        returnList = {
                            ops: [],
                            args: []
                        };
                    }
                    returnList.ops.push(operation);
                    returnList.args.push(_concat(args));
                    return returnList;
                };
                var _normalizeArrays = function(operations, arg, returnList) {
                    if (!returnList) {
                        returnList = {
                            ops: [],
                            args: []
                        };
                    }
                    $.each(operations, function(index, opn) {
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
    }();
    if (typeof exports !== "undefined") {
        module.exports = run;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.util) {
            root.F.util = {};
        }
        root.F.util.run = run;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    function inherit(C, P) {
        var F = function() {};
        F.prototype = P.prototype;
        C.prototype = new F();
        C.__super = P.prototype;
        C.prototype.constructor = C;
    }
    var extend = function(dest) {
        var obj = Array.prototype.slice.call(arguments, 1);
        var current;
        for (var j = 0; j < obj.length; j++) {
            if (!(current = obj[j])) {
                continue;
            }
            for (var key in current) {
                dest[key] = current[key];
            }
        }
        return dest;
    };
    function classFrom(base, props, staticProps) {
        var parent = base;
        var child;
        child = props && props.hasOwnProperty("constructor") ? props.constructor : function() {
            return parent.apply(this, arguments);
        };
        extend(child, parent, staticProps);
        inherit(child, parent);
        if (props) {
            extend(child.prototype, props);
        }
        return child;
    }
    if (typeof require !== "undefined") {
        module.exports = classFrom;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.util) {
            root.F.util = {};
        }
        root.F.util.classFrom = classFrom;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jquery");
    } else {
        $ = root.jQuery;
    }
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
            var cur = list.splice(0, 1)[0];
            if (!cur) {
                return p;
            }
            return _w(cur(p)).then(next);
        }
        return function(seed) {
            return next(seed).fail(seq.fail);
        };
    }
    function MakeSeq(obj) {
        var res = {
            __calls: [],
            original: obj,
            then: function(fn) {
                this.__calls.push(fn);
                return this;
            },
            start: function() {
                var _this = this;
                this.then(function(run) {
                    _this.__calls.length = 0;
                    return run;
                });
                return seq.apply(null, this.__calls)();
            },
            fail: function(fn) {
                seq.fail = fn;
                return this;
            }
        };
        var funcMaker = function(p, obj) {
            var fn = obj[p].bind(obj);
            return function() {
                var args = Array.prototype.slice.apply(arguments);
                this.__calls.push(Function.bind.apply(fn, [ null ].concat(args)));
                return this;
            };
        };
        for (var prop in obj) {
            if (typeof obj[prop] === "function") {
                res[prop] = funcMaker(prop, obj);
            } else {
                res[prop] = obj[prop];
            }
        }
        return res;
    }
    if (typeof require !== "undefined") {
        module.exports = MakeSeq;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.util) {
            root.F.util = {};
        }
        root.F.util.makeSequence = MakeSeq;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jquery");
    } else {
        $ = root.jQuery;
    }
    var URLService = function(config) {
        var API_PROTOCOL = "https";
        var HOST_API_MAPPING = {
            "forio.com": "api.forio.com",
            "foriodev.com": "api.epicenter.foriodev.com"
        };
        var publicExports = {
            protocol: API_PROTOCOL,
            api: "",
            host: function() {
                var host = window.location.host;
                if (!host || host.indexOf("localhost") !== -1) {
                    host = "forio.com";
                }
                return HOST_API_MAPPING[host] ? HOST_API_MAPPING[host] : "api." + host;
            }(),
            accountPath: function() {
                var accnt = "";
                var path = window.location.pathname.split("/");
                if (path && path[1] === "app") {
                    accnt = path[2];
                }
                return accnt;
            }(),
            projectPath: function() {
                var prj = "";
                var path = window.location.pathname.split("/");
                if (path && path[1] === "app") {
                    prj = path[3];
                }
                return prj;
            }(),
            getAPIPath: function(api) {
                var PROJECT_APIS = [ "run", "data" ];
                var apiPath = this.protocol + "://" + this.host + "/" + api + "/";
                if ($.inArray(api, PROJECT_APIS) !== -1) {
                    apiPath += this.accountPath + "/" + this.projectPath + "/";
                }
                return apiPath;
            }
        };
        $.extend(publicExports, config);
        return publicExports;
    };
    if (typeof exports !== "undefined") {
        module.exports = URLService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.URL = URLService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jquery");
    } else {
        $ = root.jQuery;
    }
    var urlService;
    if (typeof require !== "undefined") {
        urlService = require("service/urlService");
    } else {
        urlService = F.service.URL;
    }
    var ConfigurationService = function(config) {
        var defaults = {
            logLevel: "NONE"
        };
        var serviceOptions = $.extend({}, defaults, config);
        serviceOptions.server = urlService(serviceOptions.server);
        return {
            data: serviceOptions,
            setEnv: function(env) {},
            get: function(property) {
                return serviceOptions[property];
            },
            set: function(key, value) {
                serviceOptions[key] = value;
            }
        };
    };
    if (typeof exports !== "undefined") {
        module.exports = ConfigurationService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.Config = ConfigurationService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $ = root.jQuery;
    var qutils = F.util.query;
    var AjaxHTTP = function(config) {
        var defaults = {
            url: "",
            contentType: "application/json",
            headers: {},
            statusCode: {
                404: $.noop
            },
            parameterParser: qutils.toQueryFormat,
            xhrFields: {
                withCredentials: true
            }
        };
        var transportOptions = $.extend({}, defaults, config);
        var result = function(d) {
            return $.isFunction(d) ? d() : d;
        };
        var connect = function(method, params, connectOptions) {
            params = result(params);
            params = $.isPlainObject(params) || $.isArray(params) ? JSON.stringify(params) : params;
            var options = $.extend(true, {}, transportOptions, connectOptions, {
                type: method,
                data: params
            });
            var ALLOWED_TO_BE_FUNCTIONS = [ "data", "url" ];
            $.each(options, function(key, value) {
                if ($.isFunction(value) && $.inArray(key, ALLOWED_TO_BE_FUNCTIONS) !== -1) {
                    options[key] = value();
                }
            });
            if (options.logLevel && options.logLevel === "DEBUG") {
                console.log(options.url);
                var oldSuccessFn = options.success || $.noop;
                options.success = function(response, ajaxStatus, ajaxReq) {
                    console.log(response);
                    oldSuccessFn.apply(this, arguments);
                };
            }
            return $.ajax(options);
        };
        var publicAPI = {
            get: function(params, ajaxOptions) {
                var options = $.extend({}, transportOptions, ajaxOptions);
                params = options.parameterParser(result(params));
                return connect.call(this, "GET", params, options);
            },
            post: function() {
                return connect.apply(this, [ "post" ].concat([].slice.call(arguments)));
            },
            patch: function() {
                return connect.apply(this, [ "patch" ].concat([].slice.call(arguments)));
            },
            put: function() {
                return connect.apply(this, [ "put" ].concat([].slice.call(arguments)));
            },
            "delete": function(params, ajaxOptions) {
                var options = $.extend({}, transportOptions, ajaxOptions);
                params = options.parameterParser(result(params));
                if ($.trim(params)) {
                    var delimiter = result(options.url).indexOf("?") === -1 ? "?" : "&";
                    options.url = result(options.url) + delimiter + params;
                }
                return connect.call(this, "DELETE", null, options);
            },
            head: function() {
                return connect.apply(this, [ "head" ].concat([].slice.call(arguments)));
            },
            options: function() {
                return connect.apply(this, [ "options" ].concat([].slice.call(arguments)));
            }
        };
        return $.extend(this, publicAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = AjaxHTTP;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.transport) {
            root.F.transport = {};
        }
        root.F.transport.Ajax = AjaxHTTP;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var transport;
    var isNode = false;
    if (typeof require !== "undefined") {
        transport = isNode ? require("transport/node-http-transport") : require("transport/ajax-http-transport");
    } else {
        transport = F.transport.Ajax;
    }
    if (typeof exports !== "undefined") {
        module.exports = transport;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.factory) {
            root.F.factory = {};
        }
        root.F.factory.Transport = transport;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, ConfigService;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        ConfigService = require("util/configuration-service");
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
    }
    var CookieStore = function(config) {
        var defaults = {
            root: "/",
            domain: ".forio.com"
        };
        var serviceOptions = $.extend({}, defaults, config);
        var publicAPI = {
            set: function(key, value, options) {
                var setOptions = $.extend(true, {}, serviceOptions, options);
                var domain = setOptions.domain;
                var path = setOptions.root;
                document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + (domain ? "; domain=" + domain : "") + (path ? "; path=" + path : "");
                return value;
            },
            get: function(key) {
                var cookieReg = new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$");
                var val = document.cookie.replace(cookieReg, "$1");
                val = decodeURIComponent(val) || null;
                return val;
            },
            remove: function(key, options) {
                var remOptions = $.extend(true, {}, serviceOptions, options);
                var domain = remOptions.domain;
                var path = remOptions.root;
                document.cookie = encodeURIComponent(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (domain ? "; domain=" + domain : "") + (path ? "; path=" + path : "");
                return key;
            },
            destroy: function() {
                var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
                for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                    var cookieKey = decodeURIComponent(aKeys[nIdx]);
                    this.remove(cookieKey);
                }
                return aKeys;
            }
        };
        $.extend(this, publicAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = CookieStore;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.store) {
            root.F.store = {};
        }
        root.F.store.Cookie = CookieStore;
    }
}).call(this);

(function(storeType) {
    "use strict";
    var root = this;
    var F = root.F;
    var dataStore;
    var isNode = false;
    if (typeof require !== "undefined") {
        dataStore = isNode ? require("./session-store.js") : require("./cookie-store.js");
    } else {
        dataStore = F.store.Cookie;
    }
    if (typeof exports !== "undefined") {
        module.exports = dataStore;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.factory) {
            root.F.factory = {};
        }
        root.F.factory.Store = dataStore;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, ConfigService, qutil, TransportFactory, StorageFactory;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        ConfigService = require("util/configuration-service");
        qutil = require("util/query-util");
        StorageFactory = require("store/store-factory");
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        qutil = F.util.query;
        TransportFactory = F.factory.Transport;
        StorageFactory = F.factory.Store;
    }
    var DataService = function(config) {
        var store = new StorageFactory({
            synchronous: true
        });
        var defaults = {
            root: "/",
            token: store.get("epicenter.project.token") || "",
            apiKey: "",
            domain: "forio.com",
            transport: {}
        };
        var serviceOptions = $.extend({}, defaults, config);
        var urlConfig = new ConfigService(serviceOptions).get("server");
        if (serviceOptions.account) {
            urlConfig.accountPath = serviceOptions.account;
        }
        if (serviceOptions.project) {
            urlConfig.projectPath = serviceOptions.project;
        }
        var getURL = function(key, root) {
            if (!root) {
                root = serviceOptions.root;
            }
            var url = urlConfig.getAPIPath("data") + qutil.addTrailingSlash(root);
            if (key) {
                url += qutil.addTrailingSlash(key);
            }
            return url;
        };
        var httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: getURL
        });
        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: "Bearer " + serviceOptions.token
            };
        }
        var http = new TransportFactory(httpOptions);
        var publicAPI = {
            query: function(key, query, outputModifier, options) {
                var params = $.extend(true, {
                    q: query
                }, outputModifier);
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                httpOptions.url = getURL(key, httpOptions.root);
                return http.get(params, httpOptions);
            },
            save: function(key, value, options) {
                var attrs;
                if (typeof key === "object") {
                    attrs = key;
                    options = value;
                } else {
                    (attrs = {})[key] = value;
                }
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                httpOptions.url = getURL("", httpOptions.root);
                return http.post(attrs, httpOptions);
            },
            saveAs: function(key, value, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                httpOptions.url = getURL(key, httpOptions.root);
                return http.put(value, httpOptions);
            },
            load: function(key, outputModifier, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                httpOptions.url = getURL(key, httpOptions.root);
                return http.get(outputModifier, httpOptions);
            },
            remove: function(keys, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                var params;
                if ($.isArray(keys)) {
                    params = {
                        id: keys
                    };
                } else {
                    params = "";
                    httpOptions.url = getURL(keys, httpOptions.root);
                }
                return http.delete(params, httpOptions);
            }
        };
        $.extend(this, publicAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = DataService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.Data = DataService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, ConfigService, qutil, TransportFactory, StorageFactory;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        ConfigService = require("util/configuration-service");
        qutil = require("util/query-util");
        StorageFactory = require("store/store-factory");
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        qutil = F.util.query;
        TransportFactory = F.factory.Transport;
        StorageFactory = F.factory.Store;
    }
    var AuthService = function(config) {
        var defaults = {
            store: {
                synchronous: true
            },
            userName: "",
            password: "",
            account: "",
            transport: {}
        };
        var serviceOptions = $.extend({}, defaults, config);
        var urlConfig = new ConfigService(serviceOptions).get("server");
        if (!serviceOptions.account) {
            serviceOptions.account = urlConfig.accountPath;
        }
        var httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getAPIPath("authentication")
        });
        var http = new TransportFactory(httpOptions);
        var EPI_COOKIE_KEY = "epicenter.project.token";
        var store = new StorageFactory(serviceOptions.store);
        var token = store.get(EPI_COOKIE_KEY) || "";
        var publicAPI = {
            store: store,
            login: function(options) {
                var httpOptions = $.extend(true, {
                    success: $.noop
                }, serviceOptions, options);
                if (!httpOptions.userName || !httpOptions.password) {
                    throw new Error("No username or password specified.");
                }
                var postParams = {
                    userName: httpOptions.userName,
                    password: httpOptions.password
                };
                if (httpOptions.account) {
                    postParams.account = httpOptions.account;
                }
                var oldSuccessFn = httpOptions.success;
                httpOptions.success = function(response) {
                    serviceOptions.password = httpOptions.password;
                    serviceOptions.userName = httpOptions.userName;
                    token = response.access_token;
                    store.set(EPI_COOKIE_KEY, token);
                    oldSuccessFn.apply(this, arguments);
                };
                return http.post(postParams, httpOptions);
            },
            logout: function(options) {
                return store.remove(EPI_COOKIE_KEY, options);
            },
            getToken: function(options) {
                var httpOptions = $.extend(true, {
                    success: $.noop
                }, serviceOptions, options);
                var $d = $.Deferred();
                if (token) {
                    $d.resolve(token);
                } else {
                    this.login(httpOptions).then($d.resolve);
                }
                return $d.promise();
            }
        };
        $.extend(this, publicAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = AuthService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.Auth = AuthService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, ConfigService, qutil, rutil, futil, TransportFactory;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        ConfigService = require("utils/configuration-service");
        qutil = require("util/query-util");
        rutil = require("util/run-util");
        futil = require("util/promisify-util");
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        qutil = F.util.query;
        rutil = F.util.run;
        futil = F.util;
        TransportFactory = F.factory.Transport;
    }
    var VariablesService = function(config) {
        var defaults = {
            runService: null
        };
        var serviceOptions = $.extend({}, defaults, config);
        var getURL = function() {
            return serviceOptions.runService.urlConfig.getFilterURL() + "variables/";
        };
        var httpOptions = {
            url: getURL
        };
        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: "Bearer " + serviceOptions.token
            };
        }
        var http = new TransportFactory(httpOptions);
        var publicAPI = {
            load: function(variable, outputModifier, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                return http.get(outputModifier, $.extend({}, httpOptions, {
                    url: getURL() + variable + "/"
                }));
            },
            query: function(query, outputModifier, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                if ($.isArray(query)) {
                    query = {
                        include: query
                    };
                }
                $.extend(query, outputModifier);
                return http.get(query, httpOptions);
            },
            save: function(variable, val, options) {
                var attrs;
                if (typeof variable === "object") {
                    attrs = variable;
                    options = val;
                } else {
                    (attrs = {})[variable] = val;
                }
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                return http.patch.call(this, attrs, httpOptions);
            }
        };
        $.extend(this, publicAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = VariablesService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.Variables = VariablesService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, ConfigService, qutil, rutil, futil, TransportFactory, VariablesService, StorageFactory;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        ConfigService = require("util/configuration-service");
        VariablesService = require("service/variables-api-service");
        qutil = require("util/query-util");
        rutil = require("util/run-util");
        futil = require("util/promisify-util");
        StorageFactory = require("store/store-factory");
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        VariablesService = F.service.Variables;
        qutil = F.util.query;
        rutil = F.util.run;
        futil = F.util;
        TransportFactory = F.factory.Transport;
        StorageFactory = F.factory.Store;
    }
    var RunService = function(config) {
        var store = new StorageFactory({
            synchronous: true
        });
        var defaults = {
            token: store.get("epicenter.project.token") || "",
            account: "",
            project: "",
            filter: "",
            success: $.noop,
            error: $.noop,
            transport: {}
        };
        var serviceOptions = $.extend({}, defaults, config);
        var urlConfig = new ConfigService(serviceOptions).get("server");
        if (serviceOptions.account) {
            urlConfig.accountPath = serviceOptions.account;
        }
        if (serviceOptions.project) {
            urlConfig.projectPath = serviceOptions.project;
        }
        urlConfig.filter = ";";
        urlConfig.getFilterURL = function() {
            var url = urlConfig.getAPIPath("run");
            var filter = qutil.toMatrixFormat(serviceOptions.filter);
            if (filter) {
                url += filter + "/";
            }
            return url;
        };
        var httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getFilterURL
        });
        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: "Bearer " + serviceOptions.token
            };
        }
        var http = new TransportFactory(httpOptions);
        var setFilterOrThrowError = function(options) {
            if (options.filter) {
                serviceOptions.filter = options.filter;
            }
            if (!serviceOptions.filter) {
                throw new Error("No filter specified to apply operations against");
            }
        };
        var publicAsyncAPI = {
            urlConfig: urlConfig,
            create: function(params, options) {
                var createOptions = $.extend(true, {}, serviceOptions, options, {
                    url: urlConfig.getAPIPath("run")
                });
                if (typeof params === "string") {
                    params = {
                        model: params
                    };
                }
                var oldSuccess = createOptions.success;
                createOptions.success = function(response) {
                    serviceOptions.filter = response.id;
                    return oldSuccess.apply(this, arguments);
                };
                return http.post(params, createOptions);
            },
            query: function(qs, outputModifier, options) {
                serviceOptions.filter = qs;
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                return http.get(outputModifier, httpOptions);
            },
            filter: function(filter, outputModifier, options) {
                if ($.isPlainObject(serviceOptions.filter)) {
                    $.extend(serviceOptions.filter, filter);
                } else {
                    serviceOptions.filter = filter;
                }
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                return http.get(outputModifier, httpOptions);
            },
            load: function(runID, filters, options) {
                serviceOptions.filter = runID;
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                return http.get(filters, httpOptions);
            },
            save: function(attributes, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options);
                setFilterOrThrowError(httpOptions);
                return http.patch(attributes, httpOptions);
            },
            "do": function(operation, params, options) {
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
                var prms = result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined) ? result.args[0] : [];
                return http.post({
                    arguments: prms
                }, $.extend(true, {}, httpOptions, {
                    url: urlConfig.getFilterURL() + "operations/" + result.ops[0] + "/"
                }));
            },
            serial: function(operations, params, options) {
                var opParams = rutil.normalizeOperations(operations, params);
                var ops = opParams.ops;
                var args = opParams.args;
                var me = this;
                var $d = $.Deferred();
                var postOptions = $.extend(true, {}, serviceOptions, options);
                var doSingleOp = function() {
                    var op = ops.shift();
                    var arg = args.shift();
                    me.do(op, arg, {
                        success: function() {
                            if (ops.length) {
                                doSingleOp();
                            } else {
                                $d.resolve.apply(this, arguments);
                                postOptions.success.apply(this, arguments);
                            }
                        },
                        error: function() {
                            $d.reject.apply(this, arguments);
                            postOptions.error.apply(this, arguments);
                        }
                    });
                };
                doSingleOp();
                return $d.promise();
            },
            parallel: function(operations, params, options) {
                var $d = $.Deferred();
                var opParams = rutil.normalizeOperations(operations, params);
                var ops = opParams.ops;
                var args = opParams.args;
                var postOptions = $.extend(true, {}, serviceOptions, options);
                var queue = [];
                for (var i = 0; i < ops.length; i++) {
                    queue.push(this.do(ops[i], args[i]));
                }
                $.when.apply(this, queue).done(function() {
                    $d.resolve.apply(this, arguments);
                    postOptions.success.apply(this.arguments);
                }).fail(function() {
                    $d.reject.apply(this, arguments);
                    postOptions.error.apply(this.arguments);
                });
                return $d.promise();
            }
        };
        var publicSyncAPI = {
            variables: function(config) {
                var vs = new VariablesService($.extend(true, {}, serviceOptions, config, {
                    runService: this
                }));
                return vs;
            }
        };
        $.extend(this, publicAsyncAPI);
        $.extend(this, publicSyncAPI);
    };
    if (typeof exports !== "undefined") {
        module.exports = RunService;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.service) {
            root.F.service = {};
        }
        root.F.service.Run = RunService;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var classFrom;
    var Base;
    if (typeof require !== "undefined") {
        classFrom = require("../../util/inherit");
        Base = {};
        module.exports = classFrom(Base, {});
    } else {
        classFrom = F.util.classFrom;
        Base = {};
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.strategy.identity = classFrom(Base, {});
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var cookies;
    var makeSeq;
    var classFrom;
    var $;
    var Base;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        cookies = new require("../../store/cookie-store")({
            domain: null
        });
        makeSeq = require("../../util/make-sequence");
        classFrom = require("../util/inherit");
        Base = require("./identity-strategy");
    } else {
        $ = root.jQuery;
        cookies = new F.store.Cookie({
            domain: null
        });
        makeSeq = F.util.makeSequence;
        classFrom = F.util.classFrom;
        Base = F.manager.strategy.identity;
    }
    var defaults = {
        cookieName: "epicenter-scenario"
    };
    function setRunCookie(cookieName, run) {
        var path = "/";
        if (window) {
            if (/\.html/.test(window.location.pathname.split("/"))) {
                var parts = window.location.pathname.split("/");
                parts.pop();
                path = parts.join("/");
            } else {
                path = window.location.pathname;
            }
        }
        cookies.set(cookieName, JSON.stringify({
            runId: run.id
        }), {
            root: path
        });
    }
    var Strategy = classFrom(Base, {
        constructor: function Strategy(runService, condition, options) {
            if (condition == null) {
                throw new Error("Conditional strategy needs a condition to createte a run");
            }
            this.run = makeSeq(runService);
            this.condition = typeof condition !== "function" ? function() {
                return condition;
            } : condition;
            this.options = $.extend(true, {}, defaults, options);
        },
        reset: function() {
            var _this = this;
            return this.run.create({
                model: this.options.model
            }).then(function(run) {
                setRunCookie(_this.options.cookieName, run);
                run.freshlyCreated = true;
                return run;
            }).start();
        },
        getRun: function(model) {
            var session = JSON.parse(cookies.get(this.options.cookieName));
            if (session && session.runId) {
                return this._loadAndCheck(session, model);
            } else {
                return this.reset();
            }
        },
        _loadAndCheck: function(session, model) {
            var shouldCreate = false;
            var _this = this;
            return this.run.load(session.runId, null, {
                success: function(run, msg, headers) {
                    shouldCreate = _this.condition.call(_this, run, headers);
                }
            }).then(function(run) {
                if (shouldCreate) {
                    return _this.run.original.create(model).then(function(run) {
                        setRunCookie(_this.options.cookieName, run);
                        run.freshlyCreated = true;
                        return run;
                    });
                }
                return run;
            }).start();
        }
    });
    if (typeof require !== "undefined") {
        module.exports = Strategy;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.strategy["conditional-creation"] = Strategy;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var classFrom, ConditionalStrategy;
    if (typeof require !== "undefined") {
        classFrom = require("../../utils/inherit");
        ConditionalStrategy = require("./conditional-creation-strategy");
    } else {
        classFrom = F.util.classFrom;
        ConditionalStrategy = F.manager.strategy["conditional-creation"];
    }
    var __super = ConditionalStrategy.prototype;
    var Strategy = classFrom(ConditionalStrategy, {
        constructor: function(runService, options) {
            __super.constructor.call(this, runService, this.createIf, options);
        },
        createIf: function(run, headers) {
            return true;
        }
    });
    if (typeof require !== "undefined") {
        module.exports = Strategy;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        root.F.manager.strategy["always-new"] = Strategy;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var classFrom, ConditionalStrategy;
    if (typeof require !== "undefined") {
        classFrom = require("../../util/inherit");
        ConditionalStrategy = require("./conditional-creation-strategy");
    } else {
        classFrom = F.util.classFrom;
        ConditionalStrategy = F.manager.strategy["conditional-creation"];
    }
    var __super = ConditionalStrategy.prototype;
    var Strategy = classFrom(ConditionalStrategy, {
        constructor: function(runService, options) {
            __super.constructor.call(this, runService, this.createIf, options);
        },
        createIf: function(run, headers) {
            return false;
        }
    });
    if (typeof require !== "undefined") {
        module.exports = Strategy;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.strategy["new-if-missing"] = Strategy;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var classFrom, ConditionalStrategy;
    if (typeof require !== "undefined") {
        classFrom = require("../../util/inherit");
        ConditionalStrategy = require("./conditional-creation-strategy");
    } else {
        classFrom = F.util.classFrom;
        ConditionalStrategy = F.manager.strategy["conditional-creation"];
    }
    var __super = ConditionalStrategy.prototype;
    var Strategy = classFrom(ConditionalStrategy, {
        constructor: function(runService, options) {
            __super.constructor.call(this, runService, this.createIf, options);
        },
        createIf: function(run, headers) {
            return headers.getResponseHeader("pragma") === "persistent";
        }
    });
    if (typeof require !== "undefined") {
        module.exports = Strategy;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.strategy["new-if-persisted"] = Strategy;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var classFrom, ConditionalStrategy;
    if (typeof require !== "undefined") {
        classFrom = require("../../util/inherit");
        ConditionalStrategy = require("./conditional-creation-strategy");
    } else {
        classFrom = F.util.classFrom;
        ConditionalStrategy = F.manager.strategy["conditional-creation"];
    }
    var __super = ConditionalStrategy.prototype;
    var Strategy = classFrom(ConditionalStrategy, {
        constructor: function(runService, options) {
            __super.constructor.call(this, runService, this.createIf, options);
        },
        createIf: function(run, headers) {
            return headers.getResponseHeader("pragma") === "persistent" || run.initialized;
        }
    });
    if (typeof require !== "undefined") {
        module.exports = Strategy;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.strategy["new-if-simulated"] = Strategy;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    if (typeof require !== "undefined") {
        module.exports = {
            "new-if-simulated": require("./run-strategies/new-if-simulated-strategy"),
            "new-if-persisted": require("./run-strategies/new-if-persisted-strategy"),
            "new-if-missing": require("./run-strategies/new-if-missing-strategy"),
            "always-new": require("./run-strategies/always-new-strategy")
        };
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        root.F.manager.strategy.map = {
            "new-if-simulated": F.manager.strategy["new-if-simulated"],
            "new-if-persisted": F.manager.strategy["new-if-persisted"],
            "new-if-missing": F.manager.strategy["new-if-missing"],
            "always-new": F.manager.strategy["always-new"]
        };
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $, strategiesMap;
    if (typeof require !== "undefined") {
        $ = require("jquery");
        strategiesMap = require("./strategies/strategies-map");
    } else {
        $ = root.jQuery;
        strategiesMap = F.manager.strategy.map;
    }
    var defaults = {
        strategy: "new-if-simulated"
    };
    function RunManager(options) {
        this.options = $.extend(true, {}, defaults, options);
        this.run = this.options.run || new F.service.Run(this.options);
        var StrategyCtor = typeof this.options.strategy === "function" ? this.options.strategy : strategiesMap[this.options.strategy];
        if (!StrategyCtor) {
            throw new Error("Specified run creation strategy was invalid:", this.options.strategy);
        }
        this.strategy = new StrategyCtor(this.run, this.options);
    }
    RunManager.prototype = {
        getRun: function() {
            return this.strategy.getRun(this.options.model);
        },
        reset: function() {
            return this.strategy.reset();
        }
    };
    if (typeof exports !== "undefined") {
        module.exports = RunManager;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        root.F.manager.RunManager = RunManager;
    }
}).call(this);

(function() {
    "use strict";
    var root = this;
    var F = root.F;
    var $;
    if (typeof require !== "undefined") {
        $ = require("jquery");
    } else {
        $ = root.jQuery;
    }
    var defaults = {
        validFilter: {
            saved: true
        }
    };
    function ScenarioManager(options) {
        this.options = $.extend(true, {}, defaults, options);
        this.runService = this.options.run || new F.service.Run(this.options);
    }
    ScenarioManager.prototype = {
        getRuns: function(filter) {
            this.filter = $.extend(true, {}, this.options.validFilter, filter);
            return this.runService.query(this.filter);
        },
        loadVariables: function(vars) {
            return this.runService.query(this.filter, {
                include: vars
            });
        },
        save: function(run, meta) {
            return this._getService(run).save($.extend(true, {}, {
                saved: true
            }, meta));
        },
        archive: function(run) {
            return this._getService(run).save({
                saved: false
            });
        },
        _getService: function(run) {
            if (typeof run === "string") {
                return new F.service.Run($.extend(true, {}, this.options, {
                    filter: run
                }));
            }
            if (typeof run === "object" && run instanceof F.service.Run) {
                return run;
            }
            throw new Error("Save method requires a run service or a runId");
        },
        getRun: function(runId) {
            return new F.service.Run($.extend(true, {}, this.options, {
                filter: runId
            }));
        }
    };
    if (typeof require !== "undefined") {
        module.exports = ScenarioManager;
    } else {
        if (!root.F) {
            root.F = {};
        }
        if (!root.F.manager) {
            root.F.manager = {};
        }
        if (!root.F.manager.strategy) {
            root.F.manager.strategy = {};
        }
        root.F.manager.ScenarioManager = ScenarioManager;
    }
}).call(this);