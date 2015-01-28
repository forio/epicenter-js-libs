/**
 * ##Game API Adapter
 *
 * The Game API Adapter allows you to create, access, and manipulate multiplayer games its users and runs
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Game API Service defaults.
 *
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;

var apiEndpoint = 'multiplayer/game'

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {

       token: store.get('epicenter.project.token') || '',

       project: '',

       account: '',

       group: '',

//        apiKey: '',

//        domain: 'forio.com',

        //Options to pass on to the underlying transport layer
        transport: {},

        success: $.noop,

        error: $.noop
    };

    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var setFilterOrThrowError = function (options) {
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAPI = {

        /**
        * Create a new Game
        *
        * ** Example **
        *   var gm = new F.service.Game({ account: 'account', project: 'project' });
        *   gm.create({ model: 'model.py', group: 'group-name' });
        *
        * ** Parameters **
        * @param {object} `params` Parameters to create the game
        * @param {string} `params.model` The model file to use to create runs in this game
        * @param {string} `params.group` the group _name_ to create this game under
        * @param {string} `params.roles` (Optional) The list of roles for this game
        * @param {string} `params.opionalRoles` (Optional) The list of optional roles for this game
        * @param {string} `params.minUsers` (Optional) The minimum number of users for the game
        * @param {object} `options` Options object to override global options
        *
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var gameApiParams = ['model', 'scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, gameApiParams);
            }

            // account and project go in the body, not in the url
            $.extend(params, _pick(serviceOptions, ['account', 'project']));

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Update a Game object, for example to add the roles to the game
        *
        */
        update: function (params, options) {
            var whitelist = ['roles', 'optionalRoles', 'minUsers'];
            options = options || {};
            setFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            params = _pick(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        /**
        * Delete an existing game
        *
        */
        delete: function (options) {
            options = options || {};
            setFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * List all games for a given account/project/group
        *
        *
        */
        list: function (options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = _pick(getOptions, ['account', 'project', 'group']);

            return http.get(filters, getOptions);
        },

        /**
        * Get all games that a user belongs to for the given account/project/group
        *
        * ** Parameters **
        * @param {object} `params` - the parameters object for the api call
        * @param {string} `params.userId` - userId of the user you need the game for
        * @param {object} `options` (optional) - overrides to the global options object
        */
        getGamesForUser: function (params, options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = $.extend(
                _pick(getOptions, ['account', 'project', 'group']),
                _pick(params, ['userId'])
            );

            return http.get(filters, getOptions);
        },

        /**
        * Add a user or list of users to a given game
        *
        */
        addUsers: function (params, options) {
            options = options || {};

            setFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' }
            );

            return http.post(params, updateOptions);
        },

        /**
        * Update the role for a user in a given game
        *
        */
        updateUser: function (params, options) {
            throw new Error('not implemented');
        },

        /**
        * Remove a user from a given game
        *
        */
        removeUser: function (params, options) {
            options = options || {};

            setFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + params.userId }
            );

            return http.delete(null, getOptions);
        },

        /**
        * Get's (or creates) the current run for the given game
        *
        */
        getCurrentRun: function (options) {
            options = options || {};

            setFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            return http.post(null, getOptions);
        },

        /**
        * Delete's the current run from the game
        *
        */
        deleteRun: function () {
            throw new Error('not implemented');
        }
    };

    $.extend(this, publicAPI);
};