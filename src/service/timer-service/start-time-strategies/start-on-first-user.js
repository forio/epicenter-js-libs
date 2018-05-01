import { ACTIONS } from '../timer-constants';

export default function reduceActions(actions) {
    const initialState = {
        startTime: 0, 
    };
    const reduced = actions.reduce(function (accum, action) {
        if (action.type !== ACTIONS.START) {
            return accum;
        }
        const ts = +(new Date(action.time));
        if (!accum.startTime) {
            accum.startTime = ts;
        }
        return accum;
    }, initialState);
    return reduced;
}