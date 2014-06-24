/**
 *
 * ##Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults.
 * @example
 *     var rs = require('run-service')({
 *
 *     });
 *
 *
 */

(function(){
var root = this;
var F = root.F;

var $, ConfigService, qutil, rutil, futil, httpTransport, VariablesService;
if  (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    VariablesService = require('service/variables-api-service');
    qutil = require('util/query-util');
    rutil = require('util/run-util');
    futil = require('util/promisify-util');
}
else {
    $ = jQuery;
    ConfigService = F.service.Config;
    VariablesService = F.service.Variables;
    qutil = F.util.query;
    rutil = F.util.run;
    futil = F.util;
    httpTransport = F.transport.HTTP;
}

var RunService = function (config) {
    // config || (config = configService.get());

    var defaults = {
        /**
         * For functions that require authentication, pass in the user access token. Defaults to empty string.
         * @see [Authentication API Service](./auth-api-service.html) for getting tokens.
         * @type {String}
         */
        token: '',

        /**
         * The account id. In the Epicenter UI, this is the "Team ID" (for team projects) or "User ID" (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * The project id. Defaults to empty string.
         * @type {String}
         */
        project: '',

        /**
         * Criteria to filter runs by
         * @type {String}
         */
        filter: '',

        /** Called when the call completes successfully **/
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         */
        error: $.noop,

        /**
         * Called when the call completes, regardless of success or failure. Defaults to `$.noop`.
         */
        complete: $.noop,

        /**
         * Called at any significant point in the progress of the call, usually before and after server requests. Defaults to `$.noop`.
         */
        progress: $.noop,
    };

    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) urlConfig.accountPath = serviceOptions.account;
    if (serviceOptions.project) urlConfig.projectPath = serviceOptions.project;

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function() {
        var url = urlConfig.getAPIPath('run');
        var filter = qutil.toMatrixFormat(serviceOptions.filter);

        if (filter) url += filter + '/';
        return url;
    };

    var httpOptions = {
        url: urlConfig.getFilterURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = httpTransport(httpOptions);

    var setFilterOrThrowError = function(options) {
        if (options.filter) serviceOptions.filter = options.filter;
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         *  **Example**
         *
         *      rs.create({
         *          model: 'hello_world.jl'
         *      })
         *
         *  **Parameters**
         * @param {Object} `model` The name of the primary [model file](../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your project.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
         */
        create: function(params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, {url: urlConfig.getAPIPath('run')});
            if (typeof params === 'string') params = {model: params};

            createOptions.success = _.wrap(createOptions.success, function(fn, response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return fn.call(this, response);
            });

            return http.post(params, createOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * The elements of the `qs` object are ANDed together within a single call to `.query()`, but are ORed across multiple chained calls to `.query()`. See the examples.
         *
         * **Examples**
         *
         *      // returns runs with saved = true and price > 1.
         *     rs.query({
         *          'saved': 'true',
         *          'price': '>1'
         *       },
         *       {
         *          limit: 5,
         *          page: 2
         *       });
         *
         *      // returns runs with saved = true and price > 1;
         *      // also returns runs with sales < 50.
         *     rs.query({
         *          'saved': true,
         *          'price': '>1'
         *       });
         *      .query({
         *          'sales': '<50'
         *       });
         *
         * **Parameters**
         * @param {Object} `qs` Query object. Each key can be a property of the run or the name of variable that has been saved in the run. (See [more on run persistence](../../run_persistence).) Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../aggregate_run_api/#filters) allowed in the underlying Run API.)
         * @param {Object} `outputModifier` (Optional) Paging object. Can include `limit`, `page`, and `sort`.
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        query: function (qs, outputModifier, options) {
            serviceOptions.filter = qs; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`, except merges parameters instead of overwriting them when calls are chained.
         *
         * **Example**
         *
         *     rs.query({
         *         'saved': true
         *     })   // Get all saved runs
         *     .filter({
         *         '.price': '>1'
         *     })   // Get all saved runs with price > 1
         *     .filter({
         *         'user.firstName': 'John'
         *     });  // Get all saved runs with price > 1,
         *          // and belonging to users with first name John
         *
         * **Parameters**
         * @param {Object} `filter` Filter object. Each key can be a property of the run or the name of variable that has been saved in the run. (See [more on run persistence](../../run_persistence).) Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../aggregate_run_api/#filters) allowed in the underlying Run API.)
         * @param {Object} `outputModifier` (Optional) Paging object. Can include `limit`, `page`, and `sort`.
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            }
            else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Get data for a specific run. This includes standard data such as the account, model, project, and created and last modified dates, as well as variables from the default variable set. To request additional variables or variable sets, pass them as part of the `filters` object.
         *
         * **Example**
         *
         *     rs.load('<runid>', {include: '.score', set: 'xyz'});
         *
         * **Parameters**
         * @param {String} `runID` The run id
         * @param {Object} `filters` (Optional) Filters & op modifiers
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        load: function (runID, filters, options) {
            serviceOptions.filter = runID; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(filters, httpOptions);
        },


        //Saving data
        /**
         * Save attributes (data, variables) of the run.
         *
         * **Example**
         *
         *     rs.save({completed: true});
         *     rs.save({saved: true, variables: {a: 23, b: 23}});
         *     rs.save({saved: true, '.a': 23, '.b': 23}}); //equivalent to above
         *
         * **Parameters**
         * @param {Object} `attributes` The run data and variables to save. Preface model variables with `.` or include them in a `variables` field within the `attributes` object.
         * @param {object} `options` (Optional) Overrides for configuration options
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
         * The method must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the third example.
         *
         * **Example**
         *
         *     rs.do('solve');
         *     rs.do('add', [1,2]);
         *     rs.do({name:'add', arguments:[2,4]});
         *
         * **Parameters**
         * @param {String} `operation` Name of method.
         * @param {Array} `params` (Optional) Any parameters the operation takes, passed as an array.
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        do: function(operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            }
            else {
                if ($.isPlainObject(params)) {
                    opsArgs = null;
                    postOptions = params;
                }
                else {
                    opsArgs = params;
                }
            }
            var opParams = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            return http.post({arguments: opParams[1]}, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + opParams[0] + '/'
            }));
        },

        /**
         * Call several methods from the model, sequentially.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Example**
         *
         *     rs.serial(['initialize', 'solve', 'reset']);
         *     rs.serial([  {name: 'init', params: [1,2]},
         *                  {name: 'reset', params: [2,3]} ]);
         *
         * **Parameters**
         * @param {Array[string]|Array[object]} `operations` If the methods do not take parameters, pass an array of the method names. If the methods do take parameters, pass an array of objects, each of which contains a method name and its own array of arguments.
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams[0];
            var args = opParams[1];
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

        /**
         * Call several methods from the model, executing them in parallel.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Example**
         *
         *     rs.parallel(['solve', 'reset']);
         *     rs.parallel({add: [1,2], subtract: [2,4]});
         *     rs.parallel([ {name: 'add', params: [1,2]},
         *                   {name: 'subtract', params:[2,3]} ]);
         *
         * **Parameters**
         * @param {Array|Object} `operations` If the methods do not take parameters, pass an array of the method names. If the methods do take parameters, pass an array of objects, each of which contains a method name and its own array of arguments. The `name` and `params` can be explicit or implied.
         * @param {object} `options` (Optional) Overrides for configuration options
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams[0];
            var args = opParams[1];
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue  = [];
            for (var i=0; i< ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }
            $.when.apply(this, queue)
                .done(function() {
                    $d.resolve.apply(this, arguments);
                    postOptions.success.apply(this.arguments);
                })
                .fail(function() {
                    $d.reject.apply(this, arguments);
                    postOptions.error.apply(this.arguments);
                });

            return $d.promise();
        }
    };

    var publicSyncAPI = {
        /**
         * Returns a variable object.
         *
         * **Parameters**
         * @param {object} `config` (Optional) Overrides for configuration options
         * @see [Variable API Service](./variable-api-service.html) for more information.
         */

        variables: function (config) {
            var vs = new VariablesService($.extend({}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    $.extend(this, publicSyncAPI);
};

if (typeof exports !== 'undefined') {
    module.exports = RunService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Run = RunService;
}

}).call(this);
