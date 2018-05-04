import startWhenCondition from './start-when-user-condition';
import { intersection } from 'util/array-utils';

export default function reduceActions(actions, options) {
    const opts = $.extend({
        requiredUsernames: []
    }, options);
    return startWhenCondition(actions, {
        condition: function (joinedUsernames) {
            const requiredUsersJoined = intersection(opts.requiredUsernames, joinedUsernames);
            return requiredUsersJoined.length >= opts.requiredUsernames.length;
        }
    });
}