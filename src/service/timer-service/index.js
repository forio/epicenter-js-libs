import Dataservice from 'service/data-api-service';
import TimeService from 'service/time-api-service';
import SessionManager from 'store/session-manager';
import PubSub from 'util/pubsub';

import getStrategy from './start-time-strategies';

import reduceActions from './timer-actions-reducer';
import { SCOPES, ACTIONS, STRATEGY } from './timer-constants';

function getAPIKeyName(options) {
    const scope = options.scope.toUpperCase();
    const prefix = 'timer';
    if (scope === SCOPES.GROUP) {
        return [prefix, options.groupName].join('-');
    } else if (scope === SCOPES.USER) {
        return [prefix, options.groupName, options.userName].join('-');
    } else if (scope === SCOPES.RUN) {
        if (!options.scopeOptions || !options.scopeOptions.runid) {
            throw new Error('Run Scope requires passing in run options with scopeOptions: { runid: <id> }');
        }
        return [prefix, options.groupName, options.scopeOptions.runid].join('-');
    } else if (scope === SCOPES.CUSTOM) {
        if (!options.scopeOptions || !options.scopeOptions.customName) {
            throw new Error('Custom Scope requires passing in scopeOptions: { customName: <id> }');
        }
        return options.scopeOptions.customName;
    }
    throw new Error('Unknown scope ' + scope);
}

function getStore(options) {
    const key = getAPIKeyName(options);
    const ds = new Dataservice($.extend(true, {}, options, {
        root: key
    }));
    return ds;
}

function getStateFromActions(actions, currentTime, options) {
    const getStartTime = getStrategy(options.strategy);
    const startTime = getStartTime(actions, options.strategyOptions);
    const state = reduceActions(actions, startTime, currentTime);
    return state;
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
 * @property {object} [scopeOptions] Use to pass `runid` for RUN scope, or `customName` for CUSTOM scope ignored otherwise
 * @property {string|function} [strategy] strategy to use to resolve start time. Available strategies are 'first-user' (default) or 'last-user'. Can also take in a function to return a custom start time.
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
            strategy: STRATEGY.START_BY_FIRST_USER,
            strategyOptions: {},
        };

        this.ACTIONS = ACTIONS;

        /** @type {TimerOptions} */
        this.options = $.extend(true, {}, defaults, options); 
        this.sessionManager = new SessionManager(this.options);
        this.channel = new PubSub();

        this.interval = null;
        this.dataChannelSubid = null;
    }

    /**
     * Creates a new Timer. Call `start` to start ticking.
     * 
     * @param {object} createOptions
     * @param {number} createOptions.timeLimit Limit for the timer, in milliseconds
     * @param {boolean} createOptions.startImmediately Determines if the timer should start ticking immediately. If set to false (default) call timer.start to start ticking.
     * 
     * @returns {Promise}
     */
    create(createOptions) {
        const options = this.sessionManager.getMergedOptions(this.options, createOptions);
        if (!options || isNaN(+options.timeLimit)) {
            throw new Error('Timer: expected integer timeLimit, received ' + options.timeLimit);
        }
        const ds = getStore(options);
        const createAction = {
            type: ACTIONS.CREATE,
            timeLimit: options.timeLimit,
            user: options.user
        };

        const prom = options.startImmediately ? this.makeAction(ACTIONS.START) : $.Deferred().resolve([]).promise();

        return prom.then((actions)=> {
            return ds.saveAs(options.name, {
                actions: [].concat(createAction, actions) 
            });
        }).then((doc)=> {
            const actions = doc.actions;
            const lastAction = actions[actions.length - 1];
            const currentTime = lastAction.time; //Created won't have a time but that's okay, reduceActions handles it
            const state = getStateFromActions(actions, currentTime, this.options);
            return state;
        });
    }

    /**
     * Get the current timer, or create a new one and immediately start it
     * 
     * @param {object} options
     * @param {number} options.timeLimit Limit for the timer, in milliseconds
     * 
     * @returns {Promise}
     */
    autoStart(options) {
        return this.getState().catch(()=> {
            const createOpts = $.extend(true, {}, options, { startImmediately: true });
            return this.create(createOpts);
        });
    }
    

    /**
     * Cancels current timer. Need to call `create` again to restart.
     * 
     * @returns {Promise}
     */
    cancel() {
        const merged = this.sessionManager.getMergedOptions(this.options);
        const ds = getStore(merged);

        clearInterval(this.interval);
        this.interval = null;
        if (this.dataChannelSubid) {
            const channel = ds.getChannel();
            channel.unsubscribe(this.dataChannelSubid);
        }
        return ds.remove(merged.name);
    }
    
    makeAction(action) {
        const merged = this.sessionManager.getMergedOptions(this.options);
        return this.getCurrentTime().then(function (t) {
            return { 
                type: action, 
                time: t.toISOString(),
                user: merged.user,
            };
        });
    }

    /**
     * Adds a custom action to the timer state. Only relevant if you're implementing a custom strategy.
     * 
     * @param {string} action
     * @returns {Promise}
     */
    addTimerAction(action) {
        const merged = this.sessionManager.getMergedOptions(this.options);
        const ds = getStore(merged);

        return this.makeAction(action).then((action)=> {
            return ds.pushToArray(`${merged.name}/actions`, action)
                .then((actions)=> {
                    const state = getStateFromActions(actions, action.time, this.options);
                    return state;
                }, (res)=> {
                    if (res.status === 404) {
                        const errorMsg = 'Timer not found. Did you create it yet?';
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
     * @returns {Promise}
     */
    start() {
        return this.addTimerAction(ACTIONS.START);
    }

    /**
     * Pause the timer
     * 
     * @returns {Promise}
     */
    pause() {
        return this.addTimerAction(ACTIONS.PAUSE);
    }

    /**
     * Resumes a paused timer
     * 
     * @returns {Promise}
     */
    resume() {
        return this.addTimerAction(ACTIONS.RESUME);
    }

    /**
     * Helper method to return current server time
     * 
     * @returns {Promise<Date>}
     */
    getCurrentTime() {
        const merged = this.sessionManager.getMergedOptions(this.options);
        const ts = new TimeService(merged);
        return ts.getTime();
    }

    /**
     * Resumes current state of the timer, including time elapsed and remaining
     * 
     * @returns {Promise}
     */
    getState() {
        const merged = this.sessionManager.getMergedOptions(this.options);
        const ds = getStore(merged);
        return ds.load(merged.name).then(function calculateTimeLeft(doc) {
            return this.getCurrentTime().then(function (currentTime) {
                const actions = doc.actions;
                const state = getStateFromActions(actions, currentTime, this.options);
                return $.extend(true, {}, doc, state);
            });
        }, ()=> {
            throw new Error('Timer has not been created yet');
        });
    }

    /**
     * Resumes a channel to hook into for timer notifications.
     * 
     * @returns {object}
     */
    getChannel() {
        const merged = this.sessionManager.getMergedOptions(this.options);
        const ds = getStore(merged);
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
                const state = getStateFromActions(actions, currentTime, this.options);
                if (state.remaining.time === 0) {
                    me.channel.publish(ACTIONS.COMPLETE, state);

                    dataChannel.unsubscribe(me.dataChannelSubid);
                    cancelTimer();
                }
                me.channel.publish(ACTIONS.TICK, state);
            }, merged.tickInterval);

            const state = getStateFromActions(actions, currentTime, this.options);
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
                    return me.getCurrentTime().then(function (currentTime) {
                        createTimer(actions, +currentTime);
                    });
                } else if (lastAction.type === ACTIONS.PAUSE) {
                    cancelTimer();
                }
            }
        });

        //TODO: Don't do the ajax request till someone calls subscribe
        me.getState().then(function (state) {
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
TimerService.STRATEGY = STRATEGY;

export default TimerService;