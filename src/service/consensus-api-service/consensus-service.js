import ConfigService from 'service/configuration-service';
import TransportFactory from 'transport/http-transport-factory';
import SessionManager from 'store/session-manager';

const API_ENDPOINT = 'multiplayer/consensus';

function makeURL(baseURL, action, serviceOptions) {
    const urlSegment = [].concat(action || [], [serviceOptions.worldId, serviceOptions.consensusGroup, serviceOptions.name]).join('/');
    return baseURL + urlSegment;
}
function normalizeActions(actions) {
    if (!actions) {
        return [];
    }
    return [].concat(actions).map(function (action) {
        if (action.arguments) {
            return { execute: action };
        }
        return action;
    });
}
export default function (config) {
    const defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        consensusGroup: '',
        name: '',
    };
    const sessionManager = new SessionManager();
    const serviceOptions = sessionManager.getMergedOptions(defaults, config);
    const urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
    const transportOptions = $.extend(true, {}, serviceOptions.transport);
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    const http = new TransportFactory(transportOptions);
    const urlSegment = [serviceOptions.worldId, serviceOptions.consensusGroup, serviceOptions.name].join('/');

 
    const publicAPI = {
        /**
         * Creates a new consensus point
         * @param  {object} params  creation options
         * @param  {string[]|{string: number}} params.roles
         * @param  {number} [params.ttlSeconds] How long the consensus point lasts for - note you'll still have to explicitly call `forceClose` yourself after timer runs out
         * @param  {boolean} [params.executeActionsImmediately] Determines if actions are immediately sent to the server. If set to false, only the *last* action which completes the consensus will be passed on
         * @param  {{string:object[]}} [params.defaultActions] Actions to take if the role specified in the key does not submit
         * @param  {object} [options] Overrides for service options
         * @return {Promise}
         */
        create: function (params, options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), '', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
            
            if (!params || !params.roles) {
                throw new Error('Consensus Service: no roles passed to create');
            }
            const postParams = Object.keys(params).reduce(function (accum, field) {
                const fieldVal = params[field];
                if (field === 'roles' && Array.isArray(fieldVal)) {
                    accum.roles = fieldVal.reduce(function (accum, role) {
                        accum[role] = 1;
                        return accum;
                    }, {});
                } else if (field === 'defaultActions') {
                    accum.actions = Object.keys(fieldVal).reduce(function (rolesAccum, roleName) {
                        rolesAccum[roleName] = normalizeActions(fieldVal[roleName]);
                        return rolesAccum;
                    }, {});
                } else {
                    accum[field] = fieldVal;
                }
                return accum;
            }, {});
            return http.post(postParams, httpOptions);
        },

        updateDefaults: function (params, options) {
            const httpOptions = $.extend(true, {}, serviceOptions, options);
            const url = transportOptions.url + ['actions', urlSegment].join('/');
            if (!params.actions) {
                throw new Error('updateDefaults: Need to pass in actions to update');
            }
            return http.patch({
                actions: normalizeActions(params.actions)
            }, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
        /**
         * Returns current consensus point
         *
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        load: function (options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), '', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
            return http.get({}, httpOptions);
        },
        /**
         * Deletes current consensus point
         *
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        delete: function (options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), '', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
            return http.delete({}, httpOptions);
        },
        /**
         * Marks current consensus point as complete. Default actions, if specified, will be sent for defaulting roles.
         *
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        forceClose: function (options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), 'close', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
            return http.post({}, httpOptions);
        },
        /**
         * Submits actions for your turn and marks you as having `submitted`. If `executeActionsImmediately` was set to `true` while creating the consensus point, the actions will be immediately sent to the model.
         *
         * @param {object[]} actions Actions to send
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        submitActions: function (actions, options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), 'actions', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });

            if (!actions || !actions.length) {
                throw new Error('submitActions: No actions provided to submit');
            }
            return http.post({
                actions: normalizeActions(actions)
            }, httpOptions);
        },
        /**
         * Reverts submission. Note if `executeActionsImmediately` was set to `true` while creating the consensus point the action will have already been passed on to the model.
         *
         * @param {object} options Overrides for service options
         * @returns {Promise}
         */
        undoSubmit: function (options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const url = makeURL(urlConfig.getAPIPath(API_ENDPOINT), 'actions', mergedOptions);
            const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
            return http.delete({}, httpOptions);
        },
    };
    return publicAPI;
}
