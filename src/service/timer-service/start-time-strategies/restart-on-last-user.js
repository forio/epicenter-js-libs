import { ACTIONS } from '../timer-constants';

export default function reduceActions(actions) {
    const initialState = {
        startTime: 0, 
        isStarted: false,

        startedUsers: {},
    };
    const reduced = actions.reduce(function (accum, action) {
        if (action.type !== ACTIONS.START) {
            return accum;
        }
        const ts = +(new Date(action.time));
        const user = action.user;
        if (Object.keys(accum.startedUsers).indexOf(user.userName) === -1) {
            accum.startTime = ts;
            accum.startUser[user.userName] = ts;
        }
        accum.isStarted = true;
        return accum;
    }, initialState);

    return reduced;
}