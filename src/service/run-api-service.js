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

var $, ConfigService, qutils, urlService, httpTransport;
if  (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('utils/configuration-service');
    qutils = require('utils/query-utils');
}
else {
    $ = jQuery;
    ConfigService = F.service.Config;
    qutils = F.util.query;
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

    var baseurl = urlConfig.getAPIPath('run');

    var http = httpTransport({
        url: baseurl
    });

    var publicAPI = {
        url: baseurl,

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
            var matrixParams = qutils.toMatrixFormat(qs);
            var url =   baseurl + matrixParams + '/';

            return http.get(outputModifier, {
                url: url
            });
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
         * @param  {Object} filters
         * @param {Object} outputModifier Options to include as part of the query string @see <TBD>
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.get('<runid>', {include: '.score', set: 'xyz'});
         */
        load: function (runID, filters, outputModifier, options) {
            var url =   baseurl + runID + '/';
            return http.get(filters, {
                url:  url
            });
        },


        /**
         * Returns a variables object
         * @see  variables service to see what you can do with it
         * @param  {String} variableSet (Optional)
         * @param  {Object} filters (Optional)
         * @param {Object} outputModifier Options to include as part of the query string @see <TBD>
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.variables(["Price", "Sales"])
         *     rs.variables()
         */
        variables: function (variableSet, filters, outputModifier, options) {

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

        },

        /**
         * Call a bunch of operations in serial
         * @param  {Array<string>} operations List of operations
         * @param  {params} params     Parameters for each operation
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.serial(['initialize', 'solve', 'reset']);
         *     rs.serial([{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]});
         */
        serial: function (operations, params, options) {

        },

        /**
         * Executes operations in parallel
         * @param  {Array|Object} operations List of operations and arguments (if object)
         * @param {object} options Overrides for configuration options
          *
         * @example
         *     rs.parallel({add: [1,2], subtract: [2,4]});
         *     rs.parallel([{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]});
         *     rs.parallel(['solve', 'reset']);
         */
        parallel: function (operations, options) {

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
