/**
 * 
 * ##Variable API Service 
 *
 * The Variable API Service is used in conjunction with the Run API Service. You should not need to call it independently. <!-- though can also be used stand-alone if paired with the right run -->
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults.
 *
 * @example
 *     var rs = require('service/run-api-service')
 *     var vs = require('service/variable-api-service')({runService: rs.create();})
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
         * The run object to which the variable filters should be applied. Defaults to null.
         * @type {RunService}
         */
        runService: null
    };
    var options = $.extend({}, defaults, config);
    var urlConfig = ConfigService().get('url');

    var getURL = function() {
        return options.runService.urlConfig.getFilterURL() + 'variable/';
    };
    var http = httpTransport({
        url: getURL
    });

    return {

        /**
         * Read the value of a variable.
         * 
         * **Example**
         *
         *      vs.load('price');
         *
         * **Parameters**
         * @param {String} `variable` The variable to load
         * @param {Object} `filters` (Optional) Filters & op modifiers
         * @param {Object} `options` (Optional) Overrides for configuration options   
         */
        load: function (variable, filters, options) {
            return http.get(filters, $.extend({}, options, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Read the value of multiple variables or variable sets.
         *
         *  **Example**
         * 
         *     vs.query(['Price', 'Sales']);
         *     vs.query({set: 'variableSet', include:['price', 'sales']});
         *     vs.query({set: ['set1', 'set2'], include:['price', 'sales']});
         * 
         *  **Parameters**
         * @param {Object|Array} `query` The names of variables or variable sets to return. This can be an array of variable names, or an object including the name(s) of variable sets and an array of variable names. 
         * @param {Object} `filters` (Optional) Filters & op modifiers.
         * @param {Object} `options` (Optional) Overrides for configuration options
         *
         */
        query: function (query, filters, options) {
            //Query and filters are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            if ($.isArray(query)) {
                query = {include: query};
            }
            $.extend(query, filters);
            return http.get(query, options);
        },

        /**
         * Update (overwrite) the variable with the value.
         *
         *  **Example**
         *
         *     vs.save('price', 4);
         *     vs.save({price: 4, quantity: 5, products: [2,3,4]});
         *          // assuming products was previously [1,2], 
         *          // it is now [2,3,4]
         *
         * **Parameters**         
         * @param {Object|String} `variable` Object with variable name and values, or string key.
         * @param {Object} `val` (Optional) If the `variable` parameter a string key, set value here. (Otherwise, values are set in the `variable` object.)
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        save: function (variable, val, options) {
            var attrs;
            if (typeof variable === 'object') {
              attrs = variable;
              options = val;
            } else {
              (attrs = {})[variable] = val;
            }
            return http.post.call(this, attrs, options);
        },

        /**
         * Merges arrays, but otherwise updates (overwrites) the variables with the values, same as `save()`.
         *
         *  **Example**
         *
         *     vs.merge('price', 4);
         *     vs.merge({price: 4, quantity: 5, products: [2,3,4]});
         *          // assuming products was previously [1,2], 
         *          // it is now [1,2,2,3,4]         
         *
         * **Parameters**
         * @param {Object|String} `variable` Object with variable name and values, or string key.
         * @param {Object} `val` (Optional) If the `variable` parameter a string key, set value here. (Otherwise, values are set in the `variable` object.)
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        merge: function (variable, val, options) {
            var attrs;
            if (typeof variable === 'object') {
              attrs = variable;
              options = val;
            } else {
              (attrs = {})[variable] = val;
            }
            return http.patch.call(this, attrs, options);
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
