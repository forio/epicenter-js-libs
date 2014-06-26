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

 var $, ConfigService, qutil, rutil, futil, httpTransport;
 if  (typeof require !== 'undefined') {
     $ = require('jquery');
     configService = require('utils/configuration-service');
     qutil = require('util/query-util');
     rutil = require('util/run-util');
     futil = require('util/promisify-util');

 }
 else {
     $ = jQuery;
     ConfigService = F.service.Config;
     qutil = F.util.query;
     rutil = F.util.run;
     futil = F.util;

     httpTransport = F.transport.HTTP;
 }


var VariablesService = function (config) {

    var defaults = {
        /**
         * The runs object to apply the variable filters to
         * @type {RunService}
         */
        runService: null
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = ConfigService(serviceOptions).get('url');

    var getURL = function() {
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
    var http = httpTransport(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable
         * @param {String} Variable to load
         * @param {Object} filters filters & op modifiers
         * @param {object} options Overrides for configuration options
         * @example
         *     vs.load('price');
         */
        load: function (variable, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(filters, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Parameters to filter the list of runs by
         * @param {Object | Array} Query
         * @param {Object} filters filters & op modifiers
         * @param {object} options Overrides for configuration options
         *
         * @example
         *     vs.query(['Price', 'Sales'])
         *     vs.query({set: 'variableSet', include:['price', 'sales']});
         *     vs.query({set: ['set1', 'set2'], include:['price', 'sales']});
         */
        query: function (query, filters, options) {
            //Query and filters are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            if ($.isArray(query)) {
                query = {include: query};
            }
            $.extend(query, filters);
            return http.get(query, httpOptions);
        },

        /**
         * Save values to the api. Over-writes whatever is on there currently
         * @param {Object|String} variable Object with attributes, or string key
         * @param {Object} val Optional if prev parameter was a string, set value here
         * @param {object} options Overrides for configuration options
         *
         * @example
         *     vs.save({price: 4, quantity: 5, products: [2,3,4]})
         *     vs.save('price', 4);
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
        },

        // Not Available until underlying API supports PUT. Otherwise save would be PUT and merge would be PATCH
        // *
        //  * Save values to the api. Merges arrays, but otherwise same as save
        //  * @param {Object|String} variable Object with attributes, or string key
        //  * @param {Object} val Optional if prev parameter was a string, set value here
        //  * @param {object} options Overrides for configuration options
        //  *
        //  * @example
        //  *     vs.merge({price: 4, quantity: 5, products: [2,3,4]})
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

if (typeof exports !== 'undefined') {
    module.exports = VariablesService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Variables = VariablesService;
}

}).call(this);
