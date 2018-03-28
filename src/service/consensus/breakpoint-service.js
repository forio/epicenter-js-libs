'use strict';

var ConfigService = require('../configuration-service');
var TransportFactory = require('../../transport/http-transport-factory');
var SessionManager = require('../../store/session-manager');
var rutil = require('../../util/run-util');

var apiEndpoint = 'multiplayer/consensus';

module.exports = function (config) {
    var defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        consensusName: '',
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

    var breakpointURLSegment = [serviceOptions.worldId, serviceOptions.consensusName, serviceOptions.name].join('/');

    var publicAPI = {
        create: function (params, options) {
            var opts = $.extend(true, {}, params); 
            var url = transportOptions.url + breakpointURLSegment;
            var httpOptions = $.extend(true, {}, serviceOptions, { url: url }, options);
            if (opts.roles && Array.isArray(opts.roles)) {
                opts.roles = opts.roles.reduce(function (accum, role) {
                    accum[role] = 1;
                    return accum;
                }, {});
            }
            return http.post(opts, httpOptions);
        },
        delete: function (options) {
            var url = transportOptions.url + [breakpointURLSegment].join('/');
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.delete({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },

        forceClose: function (options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var url = transportOptions.url + ['close', breakpointURLSegment].join('/');
            return http.post({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
        submitActions: function (operation, args, options) {
            var result = rutil.normalizeOperations(operation, args);
            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            var url = transportOptions.url + ['actions', breakpointURLSegment].join('/');

            // "actions": {"<role>": [<action>,...]}}
            // {"proc": {"name": "<func name>", "arguments": [<list of args>]}}

            return http.post({
                actions: [{
                    proc: { name: result.ops[0], arguments: prms }
                }],
            }
            , $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
        undoSubmit: function (options) {
            var url = transportOptions.url + ['actions', breakpointURLSegment].join('/');
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.delete({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
    };
    return publicAPI;
};
