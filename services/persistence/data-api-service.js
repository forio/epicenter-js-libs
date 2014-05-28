module.exports = function (options) {

    var config = {
        /**
         * Name of collection
         * @type {String}
         */
        root: '/',

        /**
         * For operations which require authentication, pass in token
         * @see  Auth-service for getting tokens
         * @type {String}
         */
        token: '',
        apiKey: ''

    };

    return {

        /**
         * Query collection; uses MongoDB syntax
         * @see  <TBD: Data API URL>
         *
         * @param {String} qs Query Filter
         * @param {String} limiters @see <TBD: url for limits, paging etc>
         *
         * @example
         *     ds.query(
         *      {name: 'John', className: 'CSC101'},
         *      {limit: 10}
         *     )
         */
        query: function (qs, limiters) {

        },

        /**
         * Save values to the server
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         *
         * @example
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});
         */
        save: function (key, value) {

        }

        /**
         * Removes key from collection
         * @param {String} key key to remove
         *
         * @example
         *     ds.remove('person');
         */
        remove: function (key) {

        },

        /**
         * Removes collection being referenced
         * @return null
         */
        destroy: function () {

        }

    }
}
