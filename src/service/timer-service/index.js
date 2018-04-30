import Dataservice from 'service/data-api-service';
import TimeService from 'service/time-api-service';
import SessionManager from 'store/session-manager';
import Channel from 'util/channel';

import reduceActions from './timer-actions-reducer';
import { SCOPES, ACTIONS } from './timer-constants';

function getAPIKeyName(options) {
    const scope = options.scope.toUpperCase();
    const prefix = 'timer';
    if (scope === SCOPES.GROUP) {
        return [prefix, options.groupName].join('-');
    } else if (scope === SCOPES.USER) {
        return [prefix, options.groupName, options.userName].join('-');
    } else if (scope === SCOPES.RUN) {
        if (!options.scopeOptions || !options.scopeOptions.runid) {
            throw new Error('Run Scope requires passing in run options with scope: { runid: <id> }' + scope);
        }
        return [prefix, options.groupName, options.scopeOptions.runid].join('-');
    }
    throw new Error('Unknown scope ' + scope);
}

function getStore(options, key) {
    const ds = new Dataservice($.extend(true, {}, options, {
        root: key
    }));
    return ds;
}

/**
 * @typedef {object} TimerOptions
 * @name TimerOptions
 * @property {string} [account] The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
 * @property {string} [project] The project id. Defaults to empty string. If left undefined, taken from the URL.
 * @property {string} [token] For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
 * @property {object} [transport] Options to pass on to the underlying transport layer
 * @property {string} [name] Key to associate with this specific timer, use to disassociate multiple timers with the same scope
 * @property {GROUP|USER|RUN} [scope] Determines the specificity of the timer, or at what level the timer applies to.
 * @property {object} [scopeOptions] Use to pass runid for RUN scope, ignored otherwise
 */

class TimerService {
    /**
     * @param {TimerOptions} options 
     */
    constructor(options) {
        const defaults = {
            account: undefined,
            project: undefined,
            token: undefined,
            transport: {},
            name: 'timer',
            scope: SCOPES.RUN,
            scopeOptions: {},
        };

        this.ACTIONS = ACTIONS;

        /** @type {TimerOptions} */
        this.options = $.extend(true, {}, defaults, options); 
        this.sessionManager = new SessionManager(this.options);
        this.channel = new Channel();

        this.interval = null;
        this.dataChannelSubid = null;
    }

    /**
     * @param {{timeLimit: number}} createParams Timer limit, in milliseconds
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    create(createParams, opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        if (!createParams || isNaN(+createParams.timeLimit)) {
            throw new Error('Timer: expected integer timeLimit, received ' + createParams.timeLimit);
        }
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        return ds.saveAs(merged.name, { actions: [{ type: ACTIONS.CREATE, timeLimit: createParams.timeLimit, user: merged.user }] });
    }

    /**
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    cancel(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);

        clearInterval(this.interval);
        this.interval = null;
        if (this.dataChannelSubid) {
            const channel = ds.getChannel();
            channel.unsubscribe(this.dataChannelSubid);
        }
        return ds.remove(merged.name);
    }
    
    /**
     * @param {string} action
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    addTimerAction(action, opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        return this.getCurrentTime(opts).then(function (t) {
            const ds = getStore(merged, key);
            return ds.pushToArray(`${merged.name}/actions`, { 
                type: action, 
                time: t.toISOString(),
                user: merged.user,
            }).catch(function (res) {
                if (res.status === 404) {
                    const errorMsg = 'TimerService: ' + key + ' not found. Did you call Timer.create yet?';
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
                throw res;
            });
        });
    }

    /**
     * Start the timer
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    start(opts) {
        return this.addTimerAction(ACTIONS.START, opts);
    }

    /**
     * Pause the timer
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    pause(opts) {
        return this.addTimerAction(ACTIONS.PAUSE, opts);
    }

     /**
     * Resumes a paused timer
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    resume(opts) {
        return this.addTimerAction(ACTIONS.RESUME, opts);
    }

     /**
     * Helper method to return current server time
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise<Date>
     */
    getCurrentTime(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const ts = new TimeService(merged);
        return ts.getTime();
    }

     /**
     * Resumes current state of the timer, including time elapsed and remaining
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Promise
     */
    getState(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        return this.getCurrentTime(opts).then(function (currentTime) {
            const ds = getStore(merged, key);
            return ds.load(merged.name).then(function calculateTimeLeft(doc) {
                if (!doc) {
                    throw new Error('Timer has not been created yet');
                }
                const actions = doc.actions;
                const state = reduceActions(actions, currentTime);
                return $.extend(true, {}, doc, state);
            });
        });
    }

    /**
     * Resumes a channel to hook into for timer notifications.
     * 
     * @param {TimerOptions} [opts] overrides for service options
     * @returns Channel
     */
    getChannel(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        const dataChannel = ds.getChannel();
        const me = this;

        function cancelTimer() {
            clearInterval(me.interval);
            me.interval = null;
        }
        function createTimer(actions, currentTime) {
            if (me.interval || !merged.tickInterval) {
                return;
            }
            me.interval = setInterval(function () {
                currentTime = currentTime + merged.tickInterval;
                const state = reduceActions(actions, currentTime);
                if (state.remaining.time === 0) {
                    me.channel.publish(ACTIONS.COMPLETE, state);

                    dataChannel.unsubscribe(me.dataChannelSubid);
                    cancelTimer();
                }
                me.channel.publish(ACTIONS.TICK, state);
            }, merged.tickInterval);

            const state = reduceActions(actions, currentTime);
            me.channel.publish(ACTIONS.TICK, state);
        }

        me.dataChannelSubid = dataChannel.subscribe('', function (res, meta) {
            if (meta.dataPath.indexOf('/actions') === -1) { //create
                if (meta.subType === 'delete') {
                    me.channel.publish(ACTIONS.RESET);
                    cancelTimer();
                } else {
                    const createAction = res.actions[0];
                    me.channel.publish(ACTIONS.CREATE, createAction);
                }
            } else {
                const actions = res; //you only get the array back
                const lastAction = actions[actions.length - 1];

                me.channel.publish(lastAction.type, lastAction);
                
                if (lastAction.type === ACTIONS.START || lastAction.type === ACTIONS.RESUME) {
                    return me.getCurrentTime(opts).then(function (currentTime) {
                        createTimer(actions, +currentTime);
                    });
                } else if (lastAction.type === ACTIONS.PAUSE) {
                    cancelTimer();
                }
            }
        });

        //TODO: Don't do the ajax request till someone calls subscribe
        me.getState(merged).then(function (state) {
            //failure means timer hasn't been created, in which case the datachannel subscription should handle 
            if (state.isStarted) {
                if (state.isPaused || state.remaining.time <= 0) {
                    me.channel.publish(ACTIONS.TICK, state);
                } else {
                    createTimer(state.actions, state.currentTime); 
                }
            }
        });

        return this.channel;
    }
}

TimerService.ACTIONS = ACTIONS;
TimerService.SCOPES = SCOPES;
TimerService._private = {
    reduceActions: reduceActions
};
export default TimerService;