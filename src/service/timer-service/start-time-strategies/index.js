import startOnFirstUser from './start-on-first-user';
import startOnAllUsers from './start-on-all-users';

import { STRATEGY } from '../timer-constants';

const list = {
    [STRATEGY.START_BY_FIRST_USER]: startOnFirstUser,
    [STRATEGY.START_BY_LAST_USER]: startOnAllUsers,
};
export default function getStrategy(strategy) {
    if (typeof strategy === 'function') {
        return strategy;
    } else if (list[strategy]) {
        return list[strategy];
    }
    throw new Error('Invalid timer strategy ' + strategy);
}