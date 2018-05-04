import { ACTIONS } from '../timer-constants';

export default function reduceActions(actions, options) {
    const defaults = $.extend({
        condition: ()=> true
    }, options);

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
        if (!accum.startedUsers[user.userName] && !accum.ts) {
            accum.startedUsers[user.userName] = ts;

            const areUserRequirementsMet = defaults.condition(Object.keys(accum.startedUsers));
            if (areUserRequirementsMet) {
                accum.startTime = ts;
            }
        }
        return accum;
    }, initialState);

    return reduced;
}