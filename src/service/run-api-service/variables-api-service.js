import TransportFactory from 'transport/http-transport-factory';
import { splitGetFactory } from 'util/run-util';

/**
 * @description
 * ## Variables API Service
 *
 * Used in conjunction with the [Run API Service](../run-api-service/) to read, write, and search for specific model variables.
 * ```js
 * var rm = new F.manager.RunManager({
 *       run: {
 *           account: 'acme-simulations',
 *           project: 'supply-chain-game',
 *           model: 'supply-chain-model.jl'
 *       }
 *  });
 * rm.getRun()
 *   .then(function() {
 *      var vs = rm.run.variables();
 *      vs.save({sample_int: 4});
 *    });
 * ```
 * @param {object} config
 * @property {RunService} runService The run service instance to which the variable filters apply.
 */
export default function VariablesService(config) {
    var defaults = {
        runService: null
    };
    var serviceOptions = $.extend({}, defaults, config);

    var getURL = function () {
        //TODO: Replace with getCurrentconfig instead?
        return serviceOptions.runService.urlConfig.getFilterURL() + 'variables/';
    };

    var addAutoRestoreHeader = function (options) {
        return serviceOptions.runService.urlConfig.addAutoRestoreHeader(options);
    };

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);
    http.splitGet = splitGetFactory(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable.
         *
         * @example
         * vs.load('sample_int')
         *     .then(function(val){
         *         // val contains the value of sample_int
         *     });
         *
         * 
         * @param {string} variable Name of variable to load.
         * @param {{startRecord:?number, endRecord:?number, sort:?string, direction:?string}} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        load: function (variable, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = addAutoRestoreHeader(httpOptions);
            return http.get(outputModifier, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * @example
         * vs.query(['price', 'sales'])
         *     .then(function(val) {
         *         // val is an object with the values of the requested variables: val.price, val.sales
         *     });
         *
         * vs.query({ include:['price', 'sales'] });
         * 
         * @param {Object|Array} query The names of the variables requested.
         * @param {{startRecord:?number, endRecord:?number, sort:?string, direction:?string}} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = addAutoRestoreHeader(httpOptions);

            if (Array.isArray(query)) {
                query = { include: query };
            }
            $.extend(query, outputModifier);
            return http.splitGet(query, httpOptions);
        },

        /**
         * Save values to model variables. Overwrites existing values. Note that you can only update model variables if the run is [in memory](../../../run_persistence/#runs-in-memory). (An alternate way to update model variables is to call a method from the model and make sure that the method persists the variables. See `do`, `serial`, and `parallel` in the [Run API Service](../run-api-service/) for calling methods from the model.)
         *
         * @example
         * vs.save('price', 4);
         * vs.save({ price: 4, quantity: 5, products: [2,3,4] });
         * 
         * @param {Object|String} variable An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {object} [val] If passing a string for `variable`, use this argument for the value to save.
         * @param {object} [options] Overrides for configuration options.
         * @return {Promise}
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
        }

        // Not Available until underlying API supports PUT. Otherwise save would be PUT and merge would be PATCH
        // *
        //  * Save values to the api. Merges arrays, but otherwise same as save
        //  * @param {Object|String} variable Object with attributes, or string key
        //  * @param {object} val Optional if prev parameter was a string, set value here
        //  * @param {object} options Overrides for configuration options
        //  *
        //  * @example
        //  *     vs.merge({ price: 4, quantity: 5, products: [2,3,4] })
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
