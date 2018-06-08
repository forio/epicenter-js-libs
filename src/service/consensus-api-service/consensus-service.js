/**
 * 
 * ## Consensus Service
 *
 * The Consensus Service allows you to build common features in multiplayer games like:
 *
    - Delaying execution of an operation until all users within a world have 'submitted'
    - Enforcing timed 'rounds' within the game
    - Providing the model with default values for users who haven't submitted

    The consensus endpoint is scoped by world, and acts upon the current run in the world. 

        var wm = new F.manager.WorldManager({ model: 'mymodel.vmf' });
        wm.getCurrentWorld().then(function (world) {
            var cs = new F.service.Consensus({ 
                name: 'round-1',
                worldId: world.id
            });
            return cs;
        });
    
    You can optionally provide a `consensusGroup` parameter to group related consensus steps. For example:

        new F.service.Consensus({ 
            consensusGroup: 'round'
            name: '1',
            worldId: world.id
        });

    This allows you to use `F.service.ConsensusGroup` to list out/ delete all consensus points within that group for reporting.
 * 
 */

import TransportFactory from 'transport/http-transport-factory';
import { getDefaultOptions, getURLConfig } from 'service/service-utils';

const API_ENDPOINT = 'multiplayer/consensus';

function normalizeActions(actions) {
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
    const serviceOptions = getDefaultOptions(defaults, config);
    const urlConfig = getURLConfig(serviceOptions);

    const http = new TransportFactory(serviceOptions.transport);

    function getHTTPOptions(action, options) {
        const mergedOptions = $.extend(true, {}, serviceOptions, options);
        const consensusGroup = mergedOptions.consensusGroup || 'default';
        
        if (!mergedOptions.worldId || !mergedOptions.name) {
            throw new Error('Consensus Service: worldId and name are required');
        }
        const urlSegment = [].concat(action || [], [mergedOptions.worldId, consensusGroup, mergedOptions.name]).join('/');
        const baseURL = urlConfig.getAPIPath(API_ENDPOINT);
        const url = baseURL + urlSegment;

        const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
        return httpOptions;
    }

    const publicAPI = {
        /**
         * Creates a new consensus point
         * 
         * **Example**
         *
         *      cs.create({
                    roles: ['P1', 'P2'],
                    defaultActions: {
                        P1: [{ name: 'submitPlayer1', arguments: [1] }],
                        P2: [{ name: 'submitPlayer2', arguments: [2] }],
                    },
                    ttlSeconds: 10
                }
         * 
         * @param  {object} params  creation options
         * @param  {string[]|{string: number}} params.roles
         * @param  {{string:object[]}} [params.defaultActions] Actions to take if the role specified in the key does not submit
         * @param  {number} [params.ttlSeconds] How long the consensus point lasts for - note you'll still have to explicitly call `forceClose` yourself after timer runs out
         * @param  {boolean} [params.executeActionsImmediately] Determines if actions are immediately sent to the server. If set to false, only the *last* action which completes the consensus will be passed on
         * @param  {object} [options] Overrides for service options
         * @return {Promise}
         */
        create: function (params, options) {
            const httpOptions = getHTTPOptions('', options);
            
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
            }, { roles: {} });
            return http.post(postParams, httpOptions);
        },

        /**
         * Update defaults set during create. Currently only updating defaultActions is supported.
         *
         * @param {{defaultActions: actions[]}} params Consensus defaults to override
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        updateDefaults: function (params, options) {
            if (!params || !params.defaultActions) {
                throw new Error('updateDefaults: Need to pass in parameters to update');
            }
            
            const httpOptions = getHTTPOptions('actions', options);
            return http.patch({
                actions: normalizeActions(params.defaultActions)
            }, httpOptions);
        },
        /**
         * Returns current consensus point
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        load: function (options) {
            const httpOptions = getHTTPOptions('', options);
            return http.get({}, httpOptions);
        },
        /**
         * Deletes current consensus point
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        delete: function (options) {
            const httpOptions = getHTTPOptions('', options);
            return http.delete({}, httpOptions);
        },
        /**
         * Marks current consensus point as complete. Default actions, if specified, will be sent for defaulting roles.
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        forceClose: function (options) {
            const httpOptions = getHTTPOptions('close', options);
            return http.post({}, httpOptions);
        },
        /**
         * Submits actions for your turn and marks you as having `submitted`. If `executeActionsImmediately` was set to `true` while creating the consensus point, the actions will be immediately sent to the model.
         * Note that you can still call operations from the RunService directly, but will bypass the consensus requirements.
         *
         * ** Example **
         *
                bp.submitActions([{ name: 'step', arguments: [] }]);
         *  
         * @param {object[]|{name: string, arguments: any[]}} actions Actions to send
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        submitActions: function (actions, options) {
            if (!actions || !([].concat(actions)).length) {
                throw new Error('submitActions: No actions provided to submit');
            }
            const httpOptions = getHTTPOptions('actions', options);
            return http.post({
                actions: normalizeActions(actions)
            }, httpOptions);
        },
        /**
         * Reverts submission. Note if `executeActionsImmediately` was set to `true` while creating the consensus point the action will have already been passed on to the model.
         *
         * @param {object} [options] Overrides for service options
         * @returns {Promise}
         */
        undoSubmit: function (options) {
            const httpOptions = getHTTPOptions('actions', options);
            return http.delete({}, httpOptions);
        },

        /**
         * Returns current configuration
         *
         * @returns {object}
         */
        getCurrentConfig: function () {
            return serviceOptions;
        },
    };
    return publicAPI;
}
