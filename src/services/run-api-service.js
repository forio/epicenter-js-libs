/**

 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override whatever was provided as the API Defaults
 * @example
 *     var rs = require('run-service')({
 *
 *     });
 *
 *
 */

var configService = require('configService');
var qutils = require('query-utils');
var urlService = require('url-service');
var http = require('http-transport');

module.exports = function (config) {

    config || config = configService.get();

    var defaults = {
        /**
         * For operations which require authentication, pass in token
         * @see  Auth-service for getting tokens
         * @type {String}
         */
        token: '',
        apiKey: '',

        model: 'model.jl',
        account: '',
        project: '',

        /** Called when the call completes successfully **/
        onSuccess: $.noop,

        /** Called when the call fails **/
        onError: $.noop,

        /** Called when the call completes, regardless of success or failure **/
        onComplete: $.noop,

        /** Called at any significant point in the progress of the call, usually before and after server requests **/
        onProgress: $.noop,
    };

    var options = $.extend({}, defaults, config);

    http.basePath = urlService.get('run');

    var $basePromise;

    var pfy = function (fn) {
        fn.done();
    };

    return {

        /**
         * Parameters to filter the list of runs by
         * @param {Object} qs Query
         * @param {Object} limit | page | sort @see <TBD>
         *
         * @example
         *     rs.query({
                    'saved': 'true',
                    '.price': '>1'
                }, // All Matrix parameters
                {
                    limit:5,
                    page:2
                }); //All Querystring params

         *
         */
        query: function (qs, outputModifier, options) {
            var matrixParams = qservice.toMatrix(qs);
            var urlParams = qutils.toURL(outputModifier);

            var url =   matrixParams + '/?' + urlParams;

            return http.get(url);
        },

        /**
         * Similar to query, except merges parameters instead of over-writing them
         * @param {Object} filter
         * @param {Object} limit | page | sort @see <TBD>

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
         *
         * @example
         *     rs.get('<runid>', {include: '.score', set: 'xyz'});
         */
        load: function (runID, filters, options) {

        },


        /**
         * Returns a variables object
         * @see  variables service to see what you can do with it
         * @param  {String} variableSet (Optional)
         * @param  {Object} filters (Optional)
         *
         * @example
         *     rs.variables(["Price", "Sales"])
         *     rs.variables()
         */
        variables: function (variableSet, filters, options) {

        },

        //Saving data
        /**
         * Save attributes on the run
         * @param  {Object} attributes Run attributes to save
         *
         * @example
         *     rs.save({completed: true});
         *     rs.save({saved:true, variables: {a:23,b:23}});
         *     rs.save({saved:true, '.a':23, '.b':23}}); //equivalent to above
         */
        save: function (attributes, options) {

        },

        //##Operations
        /**
         * Call an operation on the model
         * @param  {String} operation Name of operation
         * @param  {*} params   (Optional) Any parameters the operation takes
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
         *
         * @example
         *     rs.serial(['initialize', 'solve', 'reset']);
         *     rs.serial([{name: add, params: [1,2]]}, {name:'subtract', params:[2,3]});
         */
        serial: function (operations, params, options) {

        },

        /**
         * Executes operations in parallel
         * @param  {Array|Object} operations List of operations and arguments (if object)
         *
         * @example
         *     rs.parallel({add: [1,2], subtract: [2,4]});
         *     rs.parallel([{name: add, params: [1,2]]}, {name:'subtract', params:[2,3]});
         *     rs.parallel(['solve', 'reset']);
         */
        parallel: function (operations, options) {

        }

    };
};

utils.namespace('RunService', RunService);
