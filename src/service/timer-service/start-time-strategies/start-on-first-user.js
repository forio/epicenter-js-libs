import startWhenCondition from './start-when-user-condition';

export default function reduceActions(actions) {
    return startWhenCondition(actions, {
        condition: (users)=> users.length > 0
    });
}