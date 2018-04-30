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

export default function reduceActions(actions, currentTime) {
    if (!actions || !actions.length) {
        return {};
    }
    const initialState = {
        startTime: 0, 
        lastPausedTime: 0, 
        totalPauseTime: 0, 
        elapsedTime: 0, 
        timeLimit: 0,
        isStarted: false,
        isPaused: false,
    };
    const reduced = actions.reduce(function (accum, action) {
        const ts = +(new Date(action.time));
        if (action.type === ACTIONS.CREATE) {
            accum.timeLimit = action.timeLimit;
        } else if (action.type === ACTIONS.START && !accum.startTime) {
            accum.startTime = ts;
            accum.isStarted = true;
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

    const current = +currentTime;
    let elapsed = 0;
    if (reduced.isPaused) {
        elapsed = reduced.elapsedTime;
    } else if (reduced.isStarted) {
        elapsed = current - reduced.startTime - reduced.totalPauseTime;
    } 

    const remaining = Math.max(0, reduced.timeLimit - elapsed);

    return {
        isPaused: reduced.isPaused,
        isStarted: reduced.isStarted,
        currentTime: current,
        elapsed: toDetailedTime(elapsed),
        remaining: toDetailedTime(remaining),
    };
}