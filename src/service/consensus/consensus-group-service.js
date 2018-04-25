'use strict';

var ConfigService = require('../configuration-service').default;
var SessionManager = require('../../store/session-manager');
var ConsensusService = require('./consensus-service.js');

var apiEndpoint = 'multiplayer/consensus';
module.exports = function ConsensusGroupService(config) {
    var defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        name: '',
    };

    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var publicAPI = {
        delete: function () {

        },
        list: function () {

        },
        consensus: function (name, options) {
            var opts = $.extend({}, true, serviceOptions, options);
            var bp = new ConsensusService($.extend({}, true, opts, {
                consensusGroup: opts.name,
                name: name,
            }));
            return bp;
        }
    };
    return publicAPI;

};
