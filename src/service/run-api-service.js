/**
 *
 * ##Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults.
 * @example
 *      var rs = new F.service.Run({account: 'acme-simulations', project: 'supply-chain-game'});
 *      rs.create('supply-chain-model.jl');
 *          .then(function() {rs.do('runmodel')});
 *
 */

(function(){
var root = this;
var F = root.F;

var $, ConfigService, qutil, rutil, futil, TransportFactory, VariablesService, StorageFactory;
if  (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    VariablesService = require('service/variables-api-service');
    qutil = require('util/query-util');
    rutil = require('util/run-util');
    futil = require('util/promisify-util');
    StorageFactory= require('store/store-factory');
}
else {
    $ = jQuery;
    ConfigService = F.service.Config;
    VariablesService = F.service.Variables;
    qutil = F.util.query;
    rutil = F.util.run;
    futil = F.util;
    TransportFactory = F.factory.Transport;
    StorageFactory = F.factory.Store;
}

var RunService = function (config) {
    // config || (config = configService.get());
    var store = new StorageFactory({synchronous: true});

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../project_access/)).
         * @see [Authentication API Service](./auth-api-service.html) for getting tokens.
         * @type {String}
         */
        token: store.get('epicenter.token') || '',

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
         * Criteria by which to to filter runs. Defaults to empty string.
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
    var http = new TransportFactory(httpOptions);

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
         *      rs.create({ 'hello_world.jl' })
         *
         *  **Parameters**
         * @param {String} `model` The name of the primary [model file](../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
         */
        create: function(params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, {url: urlConfig.getAPIPath('run')});
            if (typeof params === 'string') params = {model: params};

            var oldSuccess = createOptions.success;
            createOptions.success = function(response) {
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
         *      // where variables.price has been persisted (recorded) by the model.
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
         * @param {Object} `qs` Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.` or the shorthand `.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../aggregate_run_api/#filters) allowed in the underlying Run API.) Note that querying for variables only applies to variables that are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Paging object. Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`). 
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
         * @param {Object} `filter` Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.` or the shorthand `.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../aggregate_run_api/#filters) allowed in the underlying Run API.) Note that filtering for variables only applies to variables that are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Paging object. Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables, pass them as part of the `filters` parameter. 
         *
         * Note that if the run is [in memory](../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed in your Julia model &mdash; are available.
         *
         * **Example**
         *
         *     rs.load('bb589677-d476-4971-a68e-0c58d191e450', {include: '.price,.sales'});
         *
         * **Parameters**
         * @param {String} `runID` The run id.
         * @param {Object} `filters` (Optional) Filters & op modifiers. Use key `include` to list model variables that you want to include in the response.
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
         *     rs.save({completed: true});
         *     rs.save({saved: true, variables: {a: 23, b: 23}});
         *     rs.save({saved: true, '.a': 23, '.b': 23}}); //equivalent to above
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
         * The method must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *     rs.do('solve'); //method "solve" takes no arguments
         *     rs.do('echo', ['hello']); //method "echo" takes one argument, a string
         *     rs.do('echo', 'hello'); //method "echo" takes one argument, a string
         *     rs.do('sumArray', [[4,2,1]]); //method "sumArray" takes one argument, an array
         *     rs.do({name:'add', params:[2,4]}); //method "add" takes two arguments, both integers
         *
         * **Parameters**
         * @param {String} `operation` Name of method.
         * @param {Array} `params` (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
            var result = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = (result.args[0].length) ? {arguments: result.args[0]} : undefined;
            return http.post(prms, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several methods from the model, sequentially.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Examples**
         *
         *      // methods "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // methods "init" and "reset" take two arguments each
         *     rs.serial([  {name: 'init', params: [1,2]},
         *                  {name: 'reset', params: [2,3]} ]); 
         *      // method "init" takes two arguments, method "runmodel" takes none
         *     rs.serial([  {name: 'init', params: [1,2]},
         *                  {name: 'runmodel', params: []} ]); 
         *
         * **Parameters**
         * @param {Array[String]|Array[Object]} `operations` If all of the methods do not take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        serial: function (operations, params, options) {
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

        /**
         * Call several methods from the model, executing them in parallel.
         *
         * The methods must be exposed (e.g. `export` for a Julia model, see [Writing your Model](../../writing_your_model/)) in the model file in order to be called through the API.
         *
         * **Example**
         *
         *      // methods "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']); 
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel([ {name: 'add', params: [1,2]},
         *                   {name: 'subtract', params:[2,3]} ]); 
         *      // methods "add" and "subtract" take two arguments each (both integers)
         *     rs.parallel({add: [1,2], subtract: [2,4]}); 
         *
         * **Parameters**
         * @param {Array|Object} `operations` If all of the methods do not take parameters, pass an array of the method names (as strings). If any the methods do take parameters, you have two options. You can pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters. Alternatively, you could pass a single object with the method name and a (possibly empty) array of parameters.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
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
         * Returns a variable object. Use the variables object to read, write, and search for specific model variables.
         *
         * **Example**
         *
         *      var vs = rs.variables();
         *      vs.save({sample_int: 4});  
         *
         * **Parameters**
         * @param {Object} `config` (Optional) Overrides for configuration options.
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
