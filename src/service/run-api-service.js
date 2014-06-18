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

var $, ConfigService, qutil, rutil, urlService, httpTransport, VariableService;
if  (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    VariableService = require('service/variable-api-service');
    qutil = require('util/query-util');
    rutil = require('util/run-util');
}
else {
    $ = jQuery;
    ConfigService = F.service.Config;
    VariableService = F.service.Variable;
    qutil = F.util.query;
    rutil = F.util.run;
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
         * The name of the primary [model file](../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your project. Defaults to 'model.jl'.
         * @type {String}
         */
        model: 'model.jl',

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

    var options = $.extend({}, defaults, config);
    var urlConfig = ConfigService().get('url');
    if (options.account) urlConfig.accountPath = options.account;
    if (options.project) urlConfig.projectPath = options.project;
    urlConfig.filter = ';';
    urlConfig.getFilterURL = function() {
        var baseurl = urlConfig.getAPIPath('run');
        var url = baseurl + urlConfig.filter + '/';
        return url;
    };

    var http = httpTransport({
        url: urlConfig.getFilterURL
    });


    var publicAPI = {
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
         * @param {Object} `qs` The account, project, and model if you are creating a run using any project information other than your run service defaults.
         * @param {object} `options` (Optional) Overrides for configuration options.
         *
         */
        create: function(qs, options) {
            urlConfig.filter = ';';
            return http.post(qs, $.extend(options, {url: urlConfig.getAPIPath('run')}));
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
            urlConfig.filter = qutil.toMatrixFormat(qs);
            return http.get(outputModifier, options);
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
            urlConfig.filter = runID;
            return http.get(filters, options);
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
            return http.patch(attributes, options);
        },

        /**
         * Returns a variable object.
         * 
         * **Example**
         * 
         *     rs.variable(["Price", "Sales"])
         *     rs.variable()
         *
         * **Parameters**
         * @param {String} `variableSet` (Optional) The name of the variable set to include.
         * @param {Object} `filters` (Optional) Filters & op modifiers
         * @param {Object} `outputModifier` (Optional) Paging object. Can include `limit`, `page`, and `sort`.
         * @param {object} `options` (Optional) Overrides for configuration options
         * @see [Variable API Service](./variable-api-service.html) for more information.
         */
        variable: function (config) {
            console.log(this);
            var vs = new VariableService($.extend({}, config, {
                runService: this
            }));
            return vs;
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
        do: function (operation, params, options) {
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
            return http.post(opParams[1], $.extend(true, {}, postOptions, {
                url: urlConfig.getFilterURL() + 'operation/' + opParams[0] + '/'
            }));
        },

        //FIXME: Figure out which one is params and which one is options
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

            var postOptions = $.extend({success: $.noop}, options);

            var doSingleOp = function() {
                var op = ops.shift();
                var arg = args.shift();
                me.do(op, arg, {success: function() {
                    if (ops.length) {
                        doSingleOp();
                    } else {
                        postOptions.success.apply(this, arguments);
                    }
                }});
            };

            doSingleOp();
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
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams[0];
            var args = opParams[1];
            var postOptions = $.extend({success: $.noop}, options);

            var queue  = [];
            for (var i=0; i< ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }
            $.when.apply(queue, postOptions.success);
        }
    };

    var  defer = $.Deferred();
    defer.promise(publicAPI);

    return publicAPI;
};

// var me = this;
// _.each(publicAPI, function(fn, name) {
//     publicAPI[name] = _.wrap(fn, function(func) {
//         // console.log('Before', name);
//         var passedInParams = _.toArray(arguments).slice(1);
//         func.apply(me, passedInParams);
//     });
// });

// var PRunService = _.wrap(RunService, function(fn) {
//     var passedInParams = _.toArray(arguments).slice(1);
//     var  defer = $.Deferred();

//     var oldRS = fn.apply(null, passedInParams);
//     defer.promise(oldRS);
// });

if (typeof exports !== 'undefined') {
    module.exports = RunService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Run = RunService;
}

}).call(this);
