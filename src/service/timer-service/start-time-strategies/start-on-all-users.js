import startWhenCondition from './start-when-user-condition';
import { intersection } from 'util/array-utils';

export default function reduceActions(actions, options) {
    const opts = $.extend({
        requiredUsernames: []
    }, options);
    return startWhenCondition(actions, {
        condition: function (joinedUsers) {
            const joinedNames = joinedUsers.map((u)=> u.userName);
            const requiredUsersJoined = intersection(opts.requiredUsernames, joinedNames);
            return requiredUsersJoined.length >= opts.requiredUsernames.length;
        }
    });
}