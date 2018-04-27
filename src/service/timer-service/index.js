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
        // if (!options.scopeOptions) {
        //     throw new Error('Run Scope requires passing in run options' + scope);
        // }
        // const rm = new RunManager(options.scopeOptions);
        // return rm.getRun().then(function (run) {
        //     return [options.name, 'run', run.id].join('-');
        // });
    }
    throw new Error('Unknown scope ' + scope);
}

function getStore(options, key) {
    const ds = new Dataservice($.extend(true, {}, options, {
        root: key
    }));
    return ds;
}

function doAction(action, merged) {
    const ts = new TimeService(merged);
    const key = getAPIKeyName(merged);
    return ts.getTime().then(function (t) {
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
    }, function (err) {
        console.error('TimerService: Timer error', err);
    });
}


// Interface that all strategies need to implement
class TimerService {
    constructor(options) {
        const defaults = {
            account: undefined,
            project: undefined,

            name: 'timer',
            scope: 'run',
        };

        this.ACTIONS = ACTIONS;

        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new SessionManager(this.options);
        this.channel = new Channel();

        this.interval = null;
        this.dataChannelSubid = null;
    }

    create(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        if (!merged.time || isNaN(+merged.time)) {
            throw new Error('Timer: expected number time, received ' + merged.time);
        }
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        return ds.saveAs(merged.name, { actions: [{ type: ACTIONS.CREATE, timeLimit: merged.time, user: merged.user }] });
    }
    cancel(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        return ds.remove(merged.name);
    }

    start(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(ACTIONS.START, merged);
    }
    pause(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(ACTIONS.PAUSE, merged);
    }
    resume(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(ACTIONS.RESUME, merged);
    }

    getTime(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const ts = new TimeService(merged);
        const key = getAPIKeyName(merged);
        return ts.getTime().then(function (currentTime) {
            const ds = getStore(merged, key);
            return ds.load(merged.name).then(function calculateTimeLeft(doc) {
                if (!doc) {
                    throw new Error('Timer has not been started yet');
                }
                const actions = doc.actions;
                const reduced = reduceActions(actions, currentTime);
                return $.extend(true, {}, doc, reduced);
            });
        });
    }

    getChannel(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        const dataChannel = ds.getChannel();
        const me = this;

        function createTimer(actions, currentTime) {
            if (me.interval || !merged.tickInterval) {
                return;
            }
            me.interval = setInterval(function () {
                currentTime = currentTime + merged.tickInterval;
                const reduced = reduceActions(actions, currentTime);
                if (reduced.remaining.time === 0) {
                    me.channel.publish(ACTIONS.COMPLETE, reduced);

                    dataChannel.unsubscribe(me.dataChannelSubid);
                    clearInterval(me.interval);
                    me.interval = null;
                }
                me.channel.publish(ACTIONS.TICK, reduced);
            }, merged.tickInterval);

            const reduced = reduceActions(actions, currentTime);
            me.channel.publish(ACTIONS.TICK, reduced);
        }

        me.dataChannelSubid = dataChannel.subscribe('', function (res, meta) {
            if (meta.dataPath.indexOf('/actions') === -1) { //create
                const createAction = res.actions[0];
                me.channel.publish(ACTIONS.CREATE, createAction);
            } else if (meta.subType === 'delete') {
                clearInterval(me.interval);
                me.interval = null;
                me.channel.publish(ACTIONS.RESET);
            } else {
                const actions = res; //you only get the array back
                const lastAction = actions[actions.length - 1];

                me.channel.publish(lastAction.type, lastAction);
                if (lastAction.type === ACTIONS.START || lastAction.type === ACTIONS.RESUME) {
                    const ts = new TimeService(merged);
                    return ts.getTime().then(function (currentTime) {
                        createTimer(actions, +currentTime);
                    });
                } else if (lastAction.type === ACTIONS.PAUSE) {
                    clearInterval(me.interval);
                    me.interval = null;
                }
            }
        });

        me.getTime(merged).then(function (res) {
            //failure means timer hasn't been created, in which case the datachannel subscription should handle 
            const reduced = reduceActions(res.actions, res.currentTime);
            if (reduced.isStarted && !reduced.isPaused) {
                createTimer(res.actions, res.currentTime); 
            }
        });

        return this.channel;
    }
}

TimerService._private = {
    reduceActions: reduceActions
};
export default TimerService;