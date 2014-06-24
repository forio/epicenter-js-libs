/**
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override whatever was provided as the API Defaults
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

var $, ConfigService, qutil, rutil, futil, urlService, httpTransport, VariableService;
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
         * For operations which require authentication, pass in token
         * @see  Auth-service for getting tokens
         * @type {String}
         */
        token: '',

        /**
         * Account to create the run in
         * @type {String}
         */
        account: '',

        /**
         * Project to create the run in
         * @type {String}
         */
        project: '',

        //TODO: Move filter here from urlconfig
        // *
        //  * Default filter for the service to filter by
        //  * T

        // filter: '',

        /** Called when the call completes successfully **/
        success: $.noop,

        /** Called when the call fails **/
        error: $.noop,

        /** Called when the call completes, regardless of success or failure **/
        complete: $.noop,

        /** Called at any significant point in the progress of the call, usually before and after server requests **/
        progress: $.noop,
    };

    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) urlConfig.accountPath = serviceOptions.account;
    if (serviceOptions.project) urlConfig.projectPath = serviceOptions.project;

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function() {
        var baseurl = urlConfig.getAPIPath('run');
        var url = baseurl + urlConfig.filter + '/';
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

    //FIXME: Moving this to a private function temporarily, because promisify breaks with functions which call others
    var doOp = function(operation, params, options) {
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

        return http.post(opParams[1], $.extend(true, {}, httpOptions, {
            url: urlConfig.getFilterURL() + 'operations/' + opParams[0] + '/'
        }));
    };

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run
         * @param {String|Object} model Model file to create the run with, or object with model and other properties
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.create({
                    model: 'model.jl'
                 })
         *
         */
        create: function(params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, {url: urlConfig.getAPIPath('run')});
            if (typeof params === 'string') params = {model: params};

            createOptions.success = _.wrap(createOptions.success, function(fn, response) {
                urlConfig.filter = response.id; //all future chained calls to operate on this id
                return fn.call(this, response);
            });

            urlConfig.filter = ';';
            return http.post(params, createOptions);
        },

        /**
         * Parameters to filter the list of runs by
         * @param {Object} qs Query
         * @param {Object} limit | page | sort @see <TBD>
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.query({
                    'saved': 'true',
                    '.price': '>1'
                }, // All Matrix parameters
                {
                    limit: 5,
                    page: 2
                }); //All Querystring params

         *
         */
        query: function (qs, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            urlConfig.filter = qutil.toMatrixFormat(qs);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Similar to query, except merges parameters instead of over-writing them
         * @param {Object} filter
         * @param {Object} limit | page | sort @see <TBD>
         * @param {object} options Overrides for configuration options

         * @example
         *     rs.query({
         *         saved: true
         *     }) //Get all saved runs
         *     .filter({
         *         '.price': '>1'
         *     }) //Get all saved runs with price > 1
         *     .filter({
         *         'user': 'john'
         *     }) //Get all saved runs with price > 1 belonging to user John
         */
        filter: function (filter, outputModifier, options) {

        },

        /**
         * Get data for a specific run
         * @param  {String} runID
         * @param  {Object} filters & op modifiers
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.get('<runid>', {include: '.score', set: 'xyz'});
         */
        load: function (runID, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            urlConfig.filter = runID;
            return http.get(filters, httpOptions);
        },


        //Saving data
        /**
         * Save attributes on the run
         * @param  {Object} attributes Run attributes to save
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.save({completed: true});
         *     rs.save({saved: true, variables: {a: 23, b: 23}});
         *     rs.save({saved: true, '.a': 23, '.b': 23}}); //equivalent to above
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.patch(attributes, httpOptions);
        },

        //##Operations
        /**
         * Call an operation on the model
         * @param  {String} operation Name of operation
         * @param  {*} params   (Optional) Any parameters the operation takes
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.do('solve');
         *     rs.do('add', [1,2]);
         *     rs.do({name:'add', arguments:[2,4]})
         */
        do: doOp,

        /**
         * Call a bunch of operations in serial
         * @param  {Array<string>} operations List of operations
         * @param  {params} params     Parameters for each operation
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.serial(['initialize', 'solve', 'reset']);
         *     rs.serial([{name: 'init', params: [1,2]}, {name: 'reset', params:[2,3]}]);
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams[0];
            var args = opParams[1];
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend({success: $.noop}, options);

            var doSingleOp = function() {
                var op = ops.shift();
                var arg = args.shift();
                doOp(op, arg, {success: function() {
                    if (ops.length) {
                        doSingleOp();
                    } else {
                        $d.resolve.apply(this, arguments);
                        postOptions.success.apply(this, arguments);
                    }
                }});
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Executes operations in parallel
         * @param  {Array|Object} operations List of operations and arguments (if object)
         * @param  {Array|Object} params arguments for operations
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.parallel({add: [1,2], subtract: [2,4]});
         *     rs.parallel([{name: 'add', params: [1,2]}, {name: 'subtract', params:[2,3]}]);
         *     rs.parallel(['solve', 'reset']);
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams[0];
            var args = opParams[1];
            var postOptions = $.extend({success: $.noop}, options);

            var queue  = [];
            for (var i=0; i< ops.length; i++) {
                queue.push(
                    doOp(ops[i], args[i])
                );
            }
            $.when.apply(this, queue).done(function() {
                $d.resolve.apply(this, arguments);
                postOptions.success.apply(this.arguments);
            });

            return $d.promise();
        }
    };

    var publicSyncAPI = {
        /**
         * Returns a variable object
         * @see  variable service to see what you can do with it
         * @param  {String} variableSet (Optional)
         * @param  {Object} filters (Optional)
         * @param {Object} outputModifier Options to include as part of the query string @see <TBD>
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.variable(["Price", "Sales"])
         *     rs.variable()
         */
        variables: function (config) {
            var vs = new VariablesService($.extend({}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    // futil.promisify(this);

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
