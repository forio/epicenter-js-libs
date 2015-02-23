/**
 * ##World API Adapter
 *
 * Epicenter includes support for multiplayer games. These are projects where multiple end users share a run and work together in the same "world." Only [team projects](../glossary/#teams) can be multiplayer.
 *
 * The World API Adapter allows you to create, access, and manipulate multiplayer worlds, including end users and runs playing within the world.
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the World API Service defaults.
 *
 * Typically, you instantiate a World Adapter and then access the methods provided. Instantiating requires the account (**Team ID**), project (**Project ID**), and group (**Group Name**).
 * 
 *       var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' }); 
 *       gm1.create({ model: 'model.py' })
 *          .then(function(world) {
 *              // call services, e.g. gm.addUsers(), gm.newRunForWorld()    
 *          }); 
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;

var apiEndpoint = 'multiplayer/game';

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
       token: store.get('epicenter.project.token') || '',

        /**
         * The project id. Defaults to empty string.
         * @type {String}
         */
       project: '',

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). Defaults to empty string.
         * @type {String}
         */
       account: '',

        /**
         * The group name. Defaults to empty string.
         * @type {String}
         */
       group: '',

//        apiKey: '',

//        domain: 'forio.com',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {},

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         */
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

    var setIdFilterOrThrowError = function (options) {
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAPI = {

        /**
        * Create a new World.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py', roles: ['VP Marketing', 'VP Sales', 'VP Engineering'] });
        *
        *  **Parameters**
        * @param {object} `params` Parameters to create the world.
        * @param {string} `params.model` The model file to use to create runs in this world.
        * @param {string} `params.group` (Optional) The **Group Name** to create this world under. Only end users in this group are eligible to join the world. Optional here; required when instantiating the service (new F.service.World()).
        * @param {object} `params.roles` (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} `params.optionalRoles` (Optional) The list of optional roles (strings) for this world. Some games have specific roles that **may** be filled by end users. Listing the optional roles as part of the game object allows you to autoassign users to games and ensure that all roles are filled in each game.
        * @param {integer} `params.minUsers` (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var worldApiParams = ['model', 'scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, worldApiParams);
            }

            // account and project go in the body, not in the url
            $.extend(params, _pick(serviceOptions, ['account', 'project', 'group']));

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Update a World, for example to add the roles to the world.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.update({ roles: ['VP Marketing', 'VP Sales', 'VP Engineering'] });
        *           });
        *
        *  **Parameters**
        * @param {object} `params` Parameters to update the world.
        * @param {string} `params.name` A string identifier for the linked end users, for example, "name": "Our Team".
        * @param {object} `params.roles` (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} `params.optionalRoles` (Optional) The list of optional roles (strings) for this world. Some games have specific roles that **may** be filled by end users. Listing the optional roles as part of the game object allows you to autoassign users to games and ensure that all roles are filled in each game.
        * @param {integer} `params.minUsers` (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        update: function (params, options) {
            var whitelist = ['roles', 'optionalRoles', 'minUsers'];
            options = options || {};
            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            params = _pick(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        /**
        * Delete an existing world.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.delete();
        *           });
        *
        *  **Parameters**
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        delete: function (options) {
            options = options || {};
            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * List all worlds for a given account, project, and group. All three are required, and if not specified as parameters, are read from the service.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               // lists all worlds in acme-simulations/supply-chain-game/team1
        *               gm.list();
        *
        *               // lists all worlds in acme-simulations/supply-chain-game/other-group-name
        *               gm.list({ group: 'other-group-name' });
        *           });
        *
        *  **Parameters**
        * @param {object} `options` (Optional) Options object to override global options.
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
        * Get all worlds that an end user belongs to for a given account, project, and group. 
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.getWorldsForUser('b1c19dda-2d2e-4777-ad5d-3929f17e86d3')
        *           });
        *
        * ** Parameters **
        * @param {string} `userId` The `userId` of the user whose worlds are being retrieved.
        * @param {object} `options` (Optional) Options object to override global options.
        */
        getWorldsForUser: function (userId, options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = $.extend(
                _pick(getOptions, ['account', 'project', 'group']),
                { userId: userId }
            );

            return http.get(filters, getOptions);
        },

        /**
        * Add an end user or list of end users to a given world. The end user must be a member of the `group` that is associated with this world.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               // add one user
        *               gm.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *
        *               // add several users
        *               gm.addUsers([
        *                   { userId: 'a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44', role: 'VP Marketing' }, 
        *                   { userId: '8f2604cf-96cd-449f-82fa-e331530734ee', role: 'VP Engineering' }
        *               ]);
        *           });
        *
        * ** Parameters **
        * @param {object} `users` Object or array of objects of the users to add to this world.
        * @param {string} `users.userId` The `userId` of the user being added to this world.
        * @param {string} `users.role` The `role` the user should have in the world. It is up to the caller to ensure, if needed, that the `role` passed in is one of the `roles` or `optionalRoles` of this world.
        * @param {object} `options` (Optional) Options object to override global options.
        */
        addUsers: function (users, options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' }
            );

            return http.post(users, updateOptions);
        },

        /**
        * Remove an end user from a given world.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.addUsers({ userId: 'a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44' }, { userId: '8f2604cf-96cd-449f-82fa-e331530734ee' });
        *               gm.removeUser('8f2604cf-96cd-449f-82fa-e331530734ee');
        *           });
        *
        * ** Parameters **
        * @param {string} `userId` The `userId` of the user to remove from the world.
        * @param {object} `options` (Optional) Options object to override global options.
        */
        removeUser: function (userId, options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + userId }
            );

            return http.delete(null, getOptions);
        },

        /**
        * Gets (or creates) the current run for the given world.
        *
        * Remember that a [run](../../glossary/#run) is a collection of interactions with a project and its model. In the case of multiplayer projects, the run is shared by all end users in the world.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.getCurrentRunId();
        *           });
        *
        * ** Parameters **
        * @param {object} `options` (Optional) Options object to override global options.
        */
        getCurrentRunId: function (options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            return http.post(null, getOptions);
        },

        /**
        * Gets the current (most recent) world for the given end user in the given group.
        *
        *  **Example**
        *
        *      var gm = new F.service.World({ account: 'acme-simulations', project: 'supply-chain-game', group: 'team1' });
        *      gm.create({ model: 'model.py' });
        *           .then(function(world) {
        *               gm.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee');
        *           });
        *
        * ** Parameters **
        * @param {string} `userId` The `userId` of the user to remove from the world.
        * @param {string} `groupName` (Optional) The name of the group. If not provided, defaults to the group used to create the service.
        */
        getCurrentWorldForUser: function (userId, groupName) {
            var dtd = $.Deferred();
            var me = this;
            this.getWorldsForUser(userId, { group: groupName })
                .then(function (worlds) {
                    // assume the most recent world as the 'active' world
                    worlds.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
                    var currentWorld = worlds[0];
                    dtd.resolve(currentWorld, me);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Deletes the current run from the world.
        *
        *  **Example**: This method is not yet implemented.
        *
        *  ** Parameters **
        * @param {string} `worldId`
        * @param {object} `options` (Optional) Options object to override global options.
        */
        deleteRun: function (worldId, options) {
            throw new Error('not implemented');
        },

        /**
        * Creates a new run for the world.
        *
        *  **Example**: This method is not yet implemented.
        *
        *  ** Parameters **
        * @param {string} `worldId`
        * @param {object} `options` (Optional) Options object to override global options.
        */
        newRunForWorld: function (worldId, options) {
            return this.deleteRun(worldId)
                .then(function () {
                    return this.getCurrentRunId({ filter: worldId });
                });
        }
    };

    $.extend(this, publicAPI);
};
