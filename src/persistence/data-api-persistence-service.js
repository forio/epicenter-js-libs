/**
 * 
 * ##Data API Service
 * 
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../data_api/).)
 * 
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, the `root` option contains the name of the collection. If you have multiple collections within each of your projects, you can pass the collection name as an option for each call.
 *
 * @example
 *      var people = require('data-service')({root: 'people'});
 *       people
 *          .query({firstName: 'john'})
 *          .save({lastName: 'smith'})
 *          .done(function(data) {
 *             console.log('Queried and saved!')
 *           });
 *
 */

module.exports = function (options) {

    var config = {
        /**
         * Name of collection. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`.
         * @type {String}
         */
        root: '/',

        /**
         * For operations which require authentication, pass in the user access token. Defaults to empty string.
         * @see [Authentication API Service](./auth-api-service.html) for getting tokens.
         * @type {String}
         */
        token: '',
        apiKey: ''

    };

    return {

        /**
         * Query collection; uses MongoDB syntax
         * @see the underlying [Data API](../../data_api/#get-reading-data) for additional details.
         *
         * @param {String} qs Query Filter
         * @param {String} limiters 
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
         * Save data to the collection.  
         *
         * **Example**
         *
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});         
         *
         * **Parameters**
         *
         * @param {String|Object} `key` If `key` is a string, it is the id of the element to create or update in this collection. Document ids must be unique within this account (team or personal account) and project. If `key` is an object, the object is the data to save in a new document (top-level element) in this collection, and the id for the element is generated automatically.
         * @param {Object} `value` (Optional) If `key` is a string, this object is the data to save.  
         * @param {object} `options` (Optional) Overrides for configuration options.
         */
        save: function (key, value) {

        }

        /**
         * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
         *
         * **Example**
         *
         *     ds.remove('person');         
         * 
         * **Parameters** 
         *
         * @param {String} `key` The id of the document to remove from this collection.
         * @param {object} `options` (Optional) Overrides for configuration options. 
         */
        remove: function (key) {

        }

    }
}
