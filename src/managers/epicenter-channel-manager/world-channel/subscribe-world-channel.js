import WorldService from 'service/world-api-adapter';
import { TOPICS, TOPIC_SUBTYPES } from './world-channel-constants';
import { pick } from 'util/object-util';


export default function subscribeToWorldChannel(worldid, channel, session, channelOptions) {
    const { account, project, baseTopic, } = channelOptions;

    channel.TOPICS = TOPICS;
    var oldsubs = channel.subscribe;
    channel.subscribe = function (fullTopic, callback, context, subscribeOptions) {
        if (!fullTopic) {
            return oldsubs.call(channel, fullTopic, callback, context, subscribeOptions);
        }

        const [subscribedTopic, subscribedSubTopic] = fullTopic.split('/');
        var defaults = {
            includeMine: true
        };

        var opts = $.extend({}, defaults, subscribeOptions);
        if (subscribedTopic === TOPICS.PRESENCE) { //fake-send initial online status
            var wm = new WorldService({ 
                account: account,
                project: project,
                filter: worldid
            });
            wm.getPresenceForUsers(worldid).then((users)=> {
                users.filter((u)=> u.isOnline).forEach(function (user) {
                    var fakeMeta = {
                        date: Date.now(),
                        channel: baseTopic,
                        type: TOPICS.PRESENCE,
                        subType: TOPIC_SUBTYPES.ONLINE,
                        source: 'presenceAPI',
                    };
                    const normalizedUser = pick(user, ['userName', 'lastName', 'isOnline', 'account']);
                    normalizedUser.id = user.userId; //regular presence notification has id, not userid
                    callback(normalizedUser, fakeMeta); //eslint-disable-line callback-return
                });
            });
        }
        /* eslint-disable complexity */
        var filterByType = function (res) {
            const { type, subType } = res.data;

            const isTopicMatch = subscribedTopic === type;
            const isSubTopicMatch = !subscribedSubTopic || subscribedSubTopic === subType;

            let notificationFrom = res.data.user || {};
            const payload = res.data.data;
            if (type === TOPICS.RUN && subType === TOPIC_SUBTYPES.RESET) {
                if (payload.run.user) {
                    //reset doesn't give back user info otherwise, and world api doesn't return anything regardless
                    notificationFrom = payload.run.user;
                }
            } else if (type === TOPICS.ROLES && !notificationFrom.id) {
                notificationFrom.id = session.userid; //unassign doesn't provide an user
            }
            
            const isMine = session.userId === notificationFrom.id;
            const isInitiatorMatch = isMine && opts.includeMine || !isMine;

            const shouldPassOn = isTopicMatch && isSubTopicMatch && isInitiatorMatch;
            if (!shouldPassOn) {
                return;
            }

            const meta = {
                user: notificationFrom,
                date: res.data.date,
                channel: res.channel,
                type: subscribedTopic,
                subType: subscribedSubTopic || subType,
            };

            switch (subscribedTopic) {
                case TOPICS.RUN: {
                    if (subscribedSubTopic === TOPIC_SUBTYPES.VARIABLES || subscribedSubTopic === TOPIC_SUBTYPES.OPERATIONS) {
                        return callback(payload[subType], meta);
                    } else if (subscribedSubTopic === TOPIC_SUBTYPES.RESET) {
                        return callback(payload.run, meta);
                    }
                    return callback(payload, meta);
                }
                case TOPICS.ROLES: {
                    if (subType === TOPIC_SUBTYPES.UNASSIGN) {
                        payload.users = payload.users.map((u)=> {
                            u.oldRole = u.role;
                            u.role = null;
                            return u;
                        });
                    }
                    return callback(payload.users, meta);
                }
                case TOPICS.PRESENCE: {
                    const user = res.data.user;
                    user.isOnline = subType === TOPIC_SUBTYPES.ONLINE;
                    return callback(user, meta);
                }
                case TOPICS.CONSENSUS: {
                    // const { name, stage } = payload;
                    return callback(payload, meta);
                }
                default:
                    callback.call(context, res);
                    break;
            }
        };
        return oldsubs.call(channel, '', filterByType, context, subscribeOptions);
    };
    return channel;
}