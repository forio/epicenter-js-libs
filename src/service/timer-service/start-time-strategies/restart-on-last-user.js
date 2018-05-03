import { ACTIONS } from '../timer-constants';

export default function reduceActions(actions, options) {
    const initialState = {
        startTime: 0, 
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
            accum.startedUsers[user.userName] = ts;
        }
        return accum;
    }, initialState);

    return reduced;
}