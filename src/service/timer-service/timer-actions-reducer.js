import { ACTIONS } from './timer-constants';

function toDetailedTime(ts) {
    const time = Math.max(0, ts);

    const secs = Math.floor(time / 1000);
    const minutesRemaining = Math.floor(secs / 60);
    const secondsRemaining = Math.floor(secs % 60);
    return {
        time: ts,
        minutes: minutesRemaining,
        seconds: secondsRemaining,
    };
}

/**
 * @param {object[]} actions 
 * @param {function} startTimeReducer
 * @param {string} [currentTime] 
 */
export default function reduceActions(actions, startTimeReducer, currentTime) {
    if (!actions || !actions.length) {
        return {};
    }
    const start = startTimeReducer(actions);
    const initialState = $.extend({}, {
        lastPausedTime: 0, 
        totalPauseTime: 0, 
        elapsedTime: 0, 
        timeLimit: 0,
        isPaused: false,
        isStarted: !!start.startTime,
    }, start);
    const reduced = actions.reduce(function (accum, action) {
        const ts = +(new Date(action.time));
        if (action.type === ACTIONS.CREATE) {
            accum.timeLimit = action.timeLimit;
        } else if (action.type === ACTIONS.PAUSE && !accum.lastPausedTime) {
            accum.lastPausedTime = ts;
            accum.elapsedTime = ts - accum.startTime;
            accum.isPaused = true;
        } else if (action.type === ACTIONS.RESUME && accum.lastPausedTime) {
            const pausedTime = ts - accum.lastPausedTime;
            accum.totalPauseTime += pausedTime;
            accum.lastPausedTime = 0;
            accum.elapsedTime = 0;
            accum.isPaused = false;
        }
        return accum;
    }, initialState);

    let elapsed = 0;

    const base = {};

    if (currentTime) {
        const current = +currentTime;
        base.currentTime = current;

        if (reduced.isPaused) {
            elapsed = reduced.elapsedTime;
        } else if (reduced.isStarted) {
            elapsed = current - reduced.startTime - reduced.totalPauseTime;
        } 
    }

    const remaining = Math.max(0, reduced.timeLimit - elapsed);

    return {
        isPaused: reduced.isPaused,
        isStarted: reduced.isStarted,
        elapsed: toDetailedTime(elapsed),
        remaining: toDetailedTime(remaining),
    };
}