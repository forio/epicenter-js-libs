import TransportFactory from 'transport/http-transport-factory';

import { getDefaultOptions } from 'service/service-utils';
import { SCOPES, getURL, getScopedName } from './data-service-scope-utils';

import ChannelManager from 'managers/epicenter-channel-manager';

const API_ENDPOINT = 'data';
const getAPIURL = getURL.bind(null, API_ENDPOINT);

class DataService {
    /**
     * @param {AccountAPIServiceOptions} config 
     * @property {string} root The name of the collection. If you have multiple collections within each of your projects, you can also pass the collection name as an option for each call.
     * @property {string} [scope] Determines who has read-write access to this data collection. See above for available scopes.
     */
    constructor(config) {
        const defaults = {
            scope: SCOPES.CUSTOM,
            root: '/',

            account: undefined,
            project: undefined,
            token: undefined,
            transport: {}
        };
        const serviceOptions = getDefaultOptions(defaults, config, { apiEndpont: API_ENDPOINT });

        this.serviceOptions = serviceOptions;
        this.http = new TransportFactory(serviceOptions.transport);
    }

    /**
     * Search for data within a collection.
     *
     * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional details.
     *
     * @example
     * // request all data associated with document 'user1'
     * ds.query('user1');
     *
     * // exact matching:
     * // request all documents in collection where 'question2' is 9
     * ds.query('', { 'question2': 9});
     *
     * // comparison operators:
     * // request all documents in collection where 'question2' is greater than 9
     * ds.query('', { 'question2': { '$gt': 9} });
     *
     * // logical operators:
     * // request all documents in collection where 'question2' is less than 10, and 'question3' is false
     * ds.query('', { '$and': [ { 'question2': { '$lt':10} }, { 'question3': false }] });
     *
     * // regular expresssions: use any Perl-compatible regular expressions
     * // request all documents in collection where 'question5' contains the string '.*day'
     * ds.query('', { 'question5': { '$regex': '.*day' } });
     *
     * 
     * @param {String} documentID The id of the document to search. Pass the empty string ('') to search the entire collection.
     * @param {Object} query The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional examples.
     * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
     * @param {Object} [options] Overrides for configuration options.
     * @return {Promise}
     */
    query(documentID, query, outputModifier, options) {
        var params = $.extend(true, { q: query }, outputModifier);
        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        mergedOptions.url = getAPIURL(mergedOptions.root, documentID, mergedOptions);
        return this.http.get(params, mergedOptions);
    }

    /**
     * Save data in an anonymous document within the collection.
     *
     * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `save` call explicitly by overriding the options (third parameter).
     *
     * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `save` method is making a `POST` request.)
     *
     * @example
     * // Create a new document, with one element, at the default root level
     * ds.save('question1', 'yes');
     *
     * // Create a new document, with two elements, at the default root level
     * ds.save({ question1:'yes', question2: 32 });
     *
     * // Create a new document, with two elements, at `/students/`
     * ds.save({ name:'John', className: 'CS101' }, { root: 'students' });
     *
     * @param {String|Object} key If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
     * @param {Object} [value] The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
     * @param {Object} [options] Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
     * @return {Promise}
     */
    save(key, value, options) {
        var attrs;
        if (typeof key === 'object') {
            attrs = key;
            options = value;
        } else {
            (attrs = {})[key] = value;
        }

        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        mergedOptions.url = getAPIURL(mergedOptions.root, '', mergedOptions);
        return this.http.post(attrs, mergedOptions);
    }
    
    /**
     * Append value to an array data structure within a document
     * 
     * @param  {string} documentPath     path to array item
     * @param  {any} val     value to append to array
     * @param  {object} [options] Overrides for configuration options
     * @return {Promise}
     */
    pushToArray(documentPath, val, options) {
        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        mergedOptions.url = getAPIURL(mergedOptions.root, documentPath, mergedOptions);
        return this.http.post(val, mergedOptions);
    }

    /**
     * Save (create or replace) data in a named document or element within the collection.
     *
     * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `saveAs` call explicitly by overriding the options (third parameter).
     *
     * Optionally, the named document or element can include path information, so that you are saving just part of the document.
     *
     * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `saveAs` method is making a `PUT` request.)
     *
     * @example
     * // Create (or replace) the `user1` document at the default root level.
     * // Note that this replaces any existing content in the `user1` document.
     * ds.saveAs('user1',
     *     { 'question1': 2, 'question2': 10,
     *      'question3': false, 'question4': 'sometimes' } );
     *
     * // Create (or replace) the `student1` document at the `students` root,
     * // that is, the data at `/students/student1/`.
     * // Note that this replaces any existing content in the `/students/student1/` document.
     * // However, this will keep existing content in other paths of this collection.
     * // For example, the data at `/students/student2/` is unchanged by this call.
     * ds.saveAs('student1',
     *     { firstName: 'john', lastName: 'smith' },
     *     { root: 'students' });
     *
     * // Create (or replace) the `mgmt100/groupB` document at the `myclasses` root,
     * // that is, the data at `/myclasses/mgmt100/groupB/`.
     * // Note that this replaces any existing content in the `/myclasses/mgmt100/groupB/` document.
     * // However, this will keep existing content in other paths of this collection.
     * // For example, the data at `/myclasses/mgmt100/groupA/` is unchanged by this call.
     * ds.saveAs('mgmt100/groupB',
     *     { scenarioYear: '2015' },
     *     { root: 'myclasses' });
     *
     * @param {String} documentPath Can be the id of a document, or a path to data within that document.
     * @param {Object} [value] The data to save, in key:value pairs.
     * @param {Object} [options] Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
     * @return {Promise}
     */
    saveAs(documentPath, value, options) {
        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        mergedOptions.url = getAPIURL(mergedOptions.root, documentPath, mergedOptions);
        return this.http.put(value, mergedOptions);
    }

    /**
     * Get data for a specific document or field.
     *
     * @example
     * ds.load('user1');
     * ds.load('user1/question3');
     * 
     * @param  {String|Object} [documentPath] The id of the data to return. Can be the id of a document, or a path to data within that document. If blank, returns whole collection
     * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
     * @param {Object} [options] Overrides for configuration options.
     * @return {Promise}
     */
    load(documentPath, outputModifier, options) {
        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        mergedOptions.url = getAPIURL(mergedOptions.root, documentPath, mergedOptions);
        return this.http.get(outputModifier, mergedOptions);
    }
    /**
     * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
     *
     * @example
     * ds.remove('user1');
     *
     * @param {String|Array} keys The id of the document to remove from this collection, or an array of such ids.
     * @param {Object} [options] Overrides for configuration options.
     * @return {Promise}
     */
    remove(keys, options) {
        var mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        var params;
        if (Array.isArray(keys)) {
            params = { id: keys };
            mergedOptions.url = getAPIURL(mergedOptions.root, '', mergedOptions);
        } else {
            params = '';
            mergedOptions.url = getAPIURL(mergedOptions.root, keys, mergedOptions);
        }
        return this.http.delete(params, mergedOptions);
    }

    /**
     * Returns the internal collection name (with scope)
     *
     * @param {object} session Group/User info to add to scope. Gets it from current session otherwise
     * @param {Object} [options] Overrides for configuration options.
     * @param {string} options.scope Scope to set to.
     * @return {string} Scoped collection name.
     */
    getScopedName(session, options) {
        const opts = $.extend(true, {}, this.serviceOptions, options);
        const collName = opts.root.split('/')[0];
        const scopedCollName = getScopedName(collName, opts.scope, session);
        return scopedCollName;
    }

    /**
     * Gets a channel to listen to notifications on for this collection
     * 
     * @param {Object} [options] Overrides for configuration options.
     * @return {Channnel} channel instance to subscribe with.
     */
    getChannel(options) {
        const opts = $.extend(true, {}, this.serviceOptions, options);
        const scopedCollName = this.getScopedName(opts);
        const cm = new ChannelManager(opts);
        return cm.getDataChannel(scopedCollName);
    }
    // Epicenter doesn't allow nuking collections
    //     /**
    //      * Removes collection being referenced
    //      * @return null
    //      */
    //     destroy(options) {
    //         return this.remove('', options);
    //     }
}

DataService.SCOPES = SCOPES;

export default DataService;