import startOnFirstUser from './start-on-first-user';
import startWhenAllUsers from './start-when-all-users';

export const STRATEGIES = {
    START_BY_FIRST_USER: 'first-user',
    START_WHEN_ALL_USERS: 'all-users',
};

const list = {
    [STRATEGIES.START_BY_FIRST_USER]: startOnFirstUser,
    [STRATEGIES.START_WHEN_ALL_USERS]: startWhenAllUsers,
};

export default function getStrategy(strategy) {
    if (typeof strategy === 'function') {
        return strategy;
    } else if (list[strategy]) {
        return list[strategy];
    }
    throw new Error('Invalid timer strategy ' + strategy);
}