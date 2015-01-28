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


module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {

       token: store.get('epicenter.project.token') || '',

       project: '',

       account: '',

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
        url: urlConfig.getAPIPath('game')
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
        *   ** Example **
        *   var gm = new F.service.Game({ account: 'account', project: 'project' });
        *   gm.create({ model: 'model.py' });
        *
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('game') });
            var gameApiParams = ['model', 'scope', 'files', 'roles', 'optionalRoles', 'minUsers'];
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
                { url: urlConfig.getAPIPath('game') + serviceOptions.filter }
            );

            params = _pick(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        delete: function () {

        },

        list: function () {

        },

        getGameForUser: function () {

        },

        addUsers: function () {

        },

        removeUsers: function () {

        },

        getCurrentRun: function () {

        },

        getAllRuns: function () {

        },

        deleteRun: function () {

        }
    };

    $.extend(this, publicAPI);
};