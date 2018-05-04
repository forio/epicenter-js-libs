import startOnFirstUser from './start-on-first-user';
import startOnAllUsers from './start-on-all-users';

import { STRATEGY } from '../timer-constants';

export default function getStrategy(strategy) {
    if (strategy === STRATEGY.START_BY_FIRST_USER) {
        return startOnFirstUser;
    } else if (strategy === STRATEGY.START_BY_LAST_USER) {
        return startOnAllUsers;
    } else if (typeof strategy === 'function') {
        return strategy;
    }

    throw new Error('Invalid timer strategy ' + strategy);
}