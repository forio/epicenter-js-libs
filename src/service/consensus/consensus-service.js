'use strict';

var ConfigService = require('../configuration-service');
var TransportFactory = require('../../transport/http-transport-factory');
var SessionManager = require('../../store/session-manager');

var API_ENDPOINT = 'multiplayer/consensus';

module.exports = function (config) {
    var defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        consensusGroup: '',
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
        url: urlConfig.getAPIPath(API_ENDPOINT)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var urlSegment = [serviceOptions.worldId, serviceOptions.consensusGroup, serviceOptions.name].join('/');

    function normalizeActions(actions) {
        if (!actions) {
            return [];
        }
        return [].concat(actions).map(function (action) {
            if (action.arguments) {
                return { proc: action };
            }
            return action;
        });
    }

    var publicAPI = {
        /**
         * Creates a new consensus point
         * @param  {object} params  creation options
         * @param  {string[]|{string: number}} params.roles
         * @param  {number} params.ttlSeconds How long the consensus point lasts for - note you'll still have to explicitly call `forceClose` yourself after timer runs out
         * @param  {boolean} params.executeActionsImmediately Determines if actions are immediately sent to the server. If set to false, only the *last* action which completes the consensus will be passed on
         * @param  {{string:object[]}} params.defaultActions Actions to take if the role specified in the key does not submit
         * @param  {object} options Overrides for service options
         * @return {Promise}
         */
        create: function (params, options) {
            var opts = $.extend(true, {}, params); 
            var url = transportOptions.url + urlSegment;
            var httpOptions = $.extend(true, {}, serviceOptions, { url: url }, options);

            var postParams = Object.keys(opts).reduce(function (accum, field) {
                var fieldVal = opts[field];
                if (field === 'roles') {
                    if (Array.isArray(fieldVal)) {
                        accum.roles = fieldVal.reduce(function (accum, role) {
                            accum[role] = 1;
                            return accum;
                        }, {});
                    } else {
                        accum.roles = fieldVal;
                    }
                } else if (field === 'ttlSeconds') { //FIXME: rename in epicenter
                    accum.actuationSeconds = fieldVal;
                } else if (field === 'executeActionsImmediately') { //FIXME: rename in epicenter
                    accum.transparent = fieldVal;
                } else if (field === 'defaultActions') { //FIXME: rename in epicenter
                    accum.actions = Object.keys(fieldVal).reduce(function (rolesAccum, roleName) {
                        rolesAccum[roleName] = normalizeActions(fieldVal[roleName]);
                        return rolesAccum;
                    }, {});
                } else {
                    accum[field] = fieldVal;
                }
                return accum;
            }, {});

            return http.post(postParams, httpOptions).then(function (res) {
                if (opts.ttlSeconds) {
                    var timeSpent = +(new Date(res.now)) - +(new Date(res.created));
                    var timeSpentSeconds = Math.ceil(timeSpent / 1000);
                    res.timeLeft = Math.max(opts.ttlSeconds - timeSpentSeconds, 0);
                }
                return res;
            });
        },

        /**
         * Deletes current consensus point
         * 
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        delete: function (options) {
            var url = transportOptions.url + [urlSegment].join('/');
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.delete({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },

        /**
         * Marks current consensus point as complete. Default actions, if specified, will be sent for defaulting roles.
         * 
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        forceClose: function (options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var url = transportOptions.url + ['close', urlSegment].join('/');
            return http.post({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },

        /**
         * Submits actions for your turn and marks you as having `submitted`. If `executeActionsImmediately` was set to `true` while creating the consensus point, the actions will be immediately sent to the model.
         * 
         * @param {object[]} actions Actions to send
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        submitActions: function (actions, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var url = transportOptions.url + ['actions', urlSegment].join('/');

            return http.post({
                actions: normalizeActions(actions)
            }, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },

         /**
         * Reverts submission. Note if `executeActionsImmediately` was set to `true` while creating the consensus point the action will have already been passed on to the model.
         * 
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        undoSubmit: function (options) {
            var url = transportOptions.url + ['actions', urlSegment].join('/');
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.delete({}, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
    };
    return publicAPI;
};
