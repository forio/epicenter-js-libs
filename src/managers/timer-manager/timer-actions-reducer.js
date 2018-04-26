import { ACTIONS } from './timer-constants';

export default function reduceActions(actions, currentTime) {
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
    const elapsed = reduced.isPaused ? reduced.elapsedTime : (current - (reduced.startTime || current) + reduced.totalPauseTime);
    const remaining = Math.max(0, reduced.timeLimit - elapsed);

    const secs = Math.floor(remaining / 1000);
    const minutesRemaining = Math.floor(secs / 60);
    const secondsRemaining = Math.floor(secs % 60);
    return {
        elapsed: elapsed,
        isPaused: reduced.isPaused,
        isStarted: reduced.isStarted,
        currentTime: current,
        remaining: {
            time: remaining,
            minutes: minutesRemaining,
            seconds: secondsRemaining,
        },
    };
}