import { ACTIONS } from '../timer-constants';

export default function reduceActions(actions, options) {
    const defaults = $.extend({
        condition: ()=> true
    }, options);

    const initialState = {
        startTime: 0, 
        startedUsers: [],
    };
    const reduced = actions.reduce(function (accum, action) {
        if (action.type !== ACTIONS.START || accum.startTime) {
            return accum;
        }
        const ts = +(new Date(action.time));
        const user = action.user;
        const isUserAlreadyCounted = !!(accum.startedUsers.find((u)=> u.userName === user.userName));
        if (!isUserAlreadyCounted) {
            accum.startedUsers.push(user);
        }
        const areUserRequirementsMet = defaults.condition([].concat(accum.startedUsers));
        if (areUserRequirementsMet) {
            accum.startTime = ts;
        }
        return accum;
    }, initialState);

    return reduced.startTime;
}