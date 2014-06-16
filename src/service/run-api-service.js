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
         * For operations which require authentication, pass in token
         * @see  Auth-service for getting tokens
         * @type {String}
         */
        token: '',

        /**
         * Model file to create the run with
         * @type {String}
         */
        model: 'model.jl',

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

        /** Called when the call completes successfully **/
        success: $.noop,

        /** Called when the call fails **/
        error: $.noop,

        /** Called when the call completes, regardless of success or failure **/
        complete: $.noop,

        /** Called at any significant point in the progress of the call, usually before and after server requests **/
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
         * Create a new run
         * @param {Object} qs Query
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.create({
                    model: 'model.jl'
                 })
         *
         */
        create: function(qs, options) {
            urlConfig.filter = ';';
            return http.post(qs, $.extend(options, {url: urlConfig.getAPIPath('run')}));
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
            urlConfig.filter = qutil.toMatrixFormat(qs);
            return http.get(outputModifier, options);
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
            urlConfig.filter = runID;
            return http.get(filters, options);
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
            return http.patch(attributes, options);
        },

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
        variable: function (config) {
            var vs = new VariableService($.extend({}, config, {
                runService: this
            }));
            return vs;
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
            http.post(opParams[1], $.extend(true, {}, postOptions, {
                url: urlConfig.getFilterURL() + 'operation/' + opParams[0] + '/'
            }));
        },

        //FIXME: Figure out which one is params and which one is options
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
         * Executes operations in parallel
         * @param  {Array|Object} operations List of operations and arguments (if object)
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.parallel({add: [1,2], subtract: [2,4]});
         *     rs.parallel([{name: 'add', params: [1,2]}, {name: 'subtract', params:[2,3]}]);
         *     rs.parallel(['solve', 'reset']);
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

    return publicAPI;
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
