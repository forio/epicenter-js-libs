/**
 * variable-api
 *
 * To be usually used in conjunction with the Run API Service, though can also be used stand-alone if paired with the right run
 *
 * @example
 *     var rs = require('service/run-api-service')
 *     var vs = require('service/variable-api-service')({runService: rs.create();})
 *
 *
 */

(function(){
 var root = this;
 var F = root.F;

 var $, ConfigService, qutil, rutil, urlService, httpTransport;
 if  (typeof require !== 'undefined') {
     $ = require('jquery');
     configService = require('utils/configuration-service');
     qutil = require('util/query-util');
     rutil = require('util/run-util');
 }
 else {
     $ = jQuery;
     ConfigService = F.service.Config;
     qutil = F.util.query;
     rutil = F.util.run;
     httpTransport = F.transport.HTTP;
 }


var VariableService = function (config) {

    var defaults = {
        /**
         * The runs object to apply the variable filters to
         * @type {RunService}
         */
        runService: null
    };

    var options = $.extend({}, defaults, config);
    var urlConfig = ConfigService().get('url');
    var baseurl = urlConfig.getAPIPath('run');

    var http = httpTransport({
        url: baseurl
    });

    return {

        /**
         * Get values for a variable
         * @param {String} Variable to get
         * @param {Object} filters filters & op modifiers
         * @param {object} options Overrides for configuration options
         * @example
         *     vs.get('price');
         */
        get: function (variable, filters, options) {

        },

        /**
         * Parameters to filter the list of runs by
         * @param {String} Query
         * @param {Object} filters filters & op modifiers
         * @param {object} options Overrides for configuration options
         *
         * @example
         *     vs.query(['Price', 'Sales'])
         *     vs.query({set: 'variableSet', include:['price', 'sales']});
         *     vs.query({set: ['set1', 'set2'], include:['price', 'sales']});
         */
        query: function (query, filters, options) {

        },

        /**
         * Save values to the api. Over-writes whatever is on there currently
         * @param  {Object} variables
         * @param {object} options Overrides for configuration options
         *
         * @example
         *     vs.save({price: 4, quantity: 5, products: [2,3,4]})
         */
        save: function (variables, options) {
            return http.post.apply(this, arguments);
        },

        /**
         * Save values to the api. Merges arrays, but otherwise same as save
         * @param  {Object} variables
         * @param {object} options Overrides for configuration options
         *
         * @example
         *     vs.merge({price: 4, quantity: 5, products: [2,3,4]})
         */
        merge: function (variables, options) {
            return http.patch.apply(this, arguments);
        }
    };
};

if (typeof exports !== 'undefined') {
    module.exports = VariableService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Variable = VariableService;
}

}).call(this);
