/**
 * 
 * ##Variables API Service
 *
 * Used in conjunction with the [Run API Service](./run-api-service.html) to read, write, and search for specific model variables.
 *
 *     var rs = new F.service.Run();
 *     rs.create('supply-chain-model.jl')
 *       .then(function() {
 *          var vs = rs.variables();
 *          vs.save({sample_int: 4});
 *        });
 *
 */

(function(){
 var root = this;
 var F = root.F;

 var $, ConfigService, qutil, rutil, futil, TransportFactory;
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

     TransportFactory = F.factory.Transport;
 }


var VariablesService = function (config) {

    var defaults = {
        /**
         * The runs object to which the variable filters apply. Defaults to null.
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
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int');  
         *
         * **Parameters**
         * @param {String} `variable` Name of variable to load.
         * @param {Object} `outputModifier` (Optional) Paging object. Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        load: function (variable, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales']);
         *      vs.query({include:['price', 'sales']});
         *
         * **Parameters**
         * @param {Object|Array} `query` The names of the variables requested.
         * @param {Object} `outputModifier` (Optional) Paging object. Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {object} `options` (Optional) Overrides for configuration options.
         *
         */
        query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            if ($.isArray(query)) {
                query = {include: query};
            }
            $.extend(query, outputModifier);
            return http.get(query, httpOptions);
        },

        /**
         * Save values to model variables. Overwrites existing values. Note that you can only update model variables if the run is [in memory](../../run_persistence/#runs-in-memory). (The preferred way to update model variables is to call a method from the model and make sure that the method persists the variables. See `do`, `serial`, and `parallel` in the [Run API Service](./run-api-service.html) for calling methods from the model.)
         *
         * **Example**
         *
         *      vs.save('price', 4);
         *      vs.save({price: 4, quantity: 5, products: [2,3,4]});
         *
         * **Parameters**
         * @param {Object|String} `variable` An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} `val` (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} `options` (Optional) Overrides for configuration options.    
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
