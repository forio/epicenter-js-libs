'use strict';

var ConfigService = require('../configuration-service');
var TransportFactory = require('../../transport/http-transport-factory');
var SessionManager = require('../../store/session-manager');
var BreakpointService = require('./breakpoint-service');

var apiEndpoint = 'multiplayer/consensus';
module.exports = function (config) {
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
    var http = new TransportFactory(transportOptions);

    var knownBreakpoints = {};

    var publicAPI = {
        delete: function () {

        },
        list: function () {

        },
        breakpoints: function (breakpointName, options) {
            var opts = $.extend({}, true, serviceOptions, options);
            var bp = new BreakpointService($.extend({}, true, opts, {
                consensusName: opts.name,
                name: breakpointName,
            }));
            return bp;
        }
    };
    return publicAPI;

};
