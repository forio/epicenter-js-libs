/**
 * variables-api
 *
 * To be usually used in conjunction with the Run API Service, though can also be used stand-alone if paired with the right run
 *
 * @example
 *     var rs = require('service/run-api-service')
 *     var vs = require('service/variable-api-service')({runFilter: rs.create();})
 *
 *
 */

module.exports = function (options) {

    var defaults = {
        /**
         * The runs object to apply the variable filters to
         * @type {RunService}
         */
        runFilter: null
    };

    return {

        /**
         * Get values for a variable
         * @param {String} Variable to get
         * @example
         *     vs.get('price');
         */
        get: function (variable) {

        },

        /**
         * Parameters to filter the list of runs by
         * @param {String} Query
         *
         * @example
         *     vs.query(['Price', 'Sales'])
         *     vs.query({set: 'variableSet', include:['price', 'sales']});
         *     vs.query({set: ['set1', 'set2'], include:['price', 'sales']});
         */
        query: function (query) {

        },

        /**
         * Save values to the api. Over-writes whatever is on there currently
         * @param  {Object} variables
         *
         * @example
         *     vs.save({price: 4, quantity: 5, products: [2,3,4]})
         */
        save: function (variables) {

        },

        /**
         * Save values to the api. Merges arrays, but otherwise same as save
         * @param  {Object} variables
         *
         * @example
         *     vs.merge({price: 4, quantity: 5, products: [2,3,4]})
         */
        merge: function (variables) {

        }
    };
};
