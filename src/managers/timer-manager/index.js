import classFrom from 'util/inherit';
import Dataservice from 'service/data-api-service';
import TimeService from 'service/time-api-service';
import SessionManager from 'store/session-manager';
import Channel from 'util/channel';

const Base = {};

const SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER'
};
const STATES = {
    CREATED: 'CREATED',
    STARTED: 'STARTED',
    PAUSED: 'PAUSED',
    RESUMED: 'RESUMED',
};

function getAPIKeyName(options) {
    const scope = options.scope.toUpperCase();
    if (scope === SCOPES.GROUP) {
        return [options.name, options.groupName].join('-');
    } else if (scope === SCOPES.USER) {
        return [options.name, options.userName].join('-');
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
        return ds.pushToArray('time/actions', { 
            type: action, time: t.toISOString()
        }).catch(function (res) {
            if (res.status === 404) {
                const errorMsg = 'Timer: Collection ' + key + ' not found. Did you create it?';
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            throw res;
        });
    }, function (err) {
        console.error('Timermanager start: Timer error', err);
    });
}

function reduceActions(actions, currentTime) {
    const reduced = actions.reduce(function (accum, action) {
        const ts = +(new Date(action.time));
        if (action.type === STATES.CREATED) {
            accum.timeLimit = action.timeLimit;
        } else if (action.type === STATES.STARTED && !accum.startTime) {
            accum.startTime = ts;
        } else if (action.type === STATES.PAUSED && !accum.lastPausedTime) {
            accum.lastPausedTime = ts;
            accum.elapsedTime = ts - accum.startTime;
        } else if (action.type === STATES.RESUMED && accum.lastPausedTime) {
            const pausedTime = ts - accum.lastPausedTime;
            accum.totalPauseTime += pausedTime;
            accum.lastPausedTime = 0;
            accum.elapsedTime = 0;
        }
        return accum;
    }, { startTime: 0, lastPausedTime: 0, totalPauseTime: 0, elapsedTime: 0, timeLimit: 0 });

    const lastAction = actions[actions.length - 1];
    const isPaused = !!(lastAction && lastAction.type === STATES.PAUSED);

    const current = +currentTime;
    const elapsed = isPaused ? reduced.elapsedTime : (current - (reduced.startTime || current) + reduced.totalPauseTime);
    const remaining = Math.max(0, reduced.timeLimit - elapsed);

    const secs = Math.floor(remaining / 1000);
    const minutesRemaining = Math.floor(secs / 60);
    const secondsRemaining = Math.floor(secs % 60);
    return {
        elapsed: elapsed,
        isPaused: isPaused,
        currentTime: current,
        remaining: {
            time: remaining,
            minutes: minutesRemaining,
            seconds: secondsRemaining,
        },
    };
}
// Interface that all strategies need to implement
class Timermanager {
    constructo(options) {
        const defaults = {
            account: undefined,
            project: undefined,

            name: 'timer',
            scope: 'run',
        };

        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new SessionManager(this.options);
        this.channel = new Channel();
    }

    create(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        if (!merged.time || isNaN(+merged.time)) {
            throw new Error('Timer Manager: expected number time, received ' + merged.time);
        }
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        return ds.saveAs('time', { actions: [{ type: STATES.CREATED, timeLimit: merged.time }] });
    }
    cancel(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const key = getAPIKeyName(merged);
        const ds = getStore(merged, key);
        return ds.remove();
    }

    start(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.STARTED, merged);
    }
    pause(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.PAUSED, merged);
    }
    resume(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.RESUMED, merged);
    }

    getTime(opts) {
        const merged = this.sessionManager.getMergedOptions(this.options, opts);
        const ts = new TimeService(merged);
        const key = getAPIKeyName(merged);
        return ts.getTime().then(function (currentTime) {
            const ds = getStore(merged, key);
            return ds.load().then(function calculateTimeLeft(doc) {
                if (!doc || !doc[0]) {
                    throw new Error('Timer has not been started yet');
                }
                const actions = doc[0].actions;
                const reduced = reduceActions(actions, currentTime);
                return $.extend(true, {}, doc[0], reduced);
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
                    me.channel.publish('complete', reduced);
                    clearInterval(me.interval);
                    ///TODO: Unsubscribe from data channel
                    me.interval = null;
                }
                me.channel.publish('tick', reduced);
            }, merged.tickInterval);

            const reduced = reduceActions(actions, currentTime);
            me.channel.publish('tick', reduced);
        }

        me.subsid = dataChannel.subscribe('', function (res, meta) {
            if (meta.dataPath.indexOf('/actions') === -1) { //create
                const ts = new TimeService(merged);
                return ts.getTime().then(function (currentTime) {
                    const reduced = reduceActions(res.actions, currentTime);
                    me.channel.publish('create', reduced);
                    createTimer(res.actions, +currentTime);
                });
            } else if (meta.subType === 'delete') {
                clearInterval(me.interval);
                me.channel.publish('reset');

            } else {
                const actions = res; //you only get the array back
                const lastAction = actions[actions.length - 1];
                me.channel.publish(lastAction.type, lastAction);
            }
        });

        me.getTime(merged).then(function (res) {
            createTimer(res.actions, res.currentTime); //failure means timer hasn't been created, in which case the datachannel subscription should handle 
        });

        return this.channel;
    }
}

export default Timermanager;