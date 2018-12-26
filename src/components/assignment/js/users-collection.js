'use strict';

var classFrom = require('../../../util/inherit');

var Model = require('./user-model');
var Base = require('./base-collection');
var env = require('./defaults');
var serviceLocator = require('./service-locator');


module.exports = classFrom(Base, {
    model: Model,

    sortFn: function (a, b) {
        var aw = a.get('world').toLowerCase();
        var bw = b.get('world').toLowerCase();
        if (aw !== bw) {
            return aw < bw ? -1 : 1;
        }

        return b.get('userName') > a.get('userName') ? -1 : 1;
    },

    initialize: function () {
        const am = new F.manager.AuthManager();
        const session = am.getCurrentUserSessionInfo();
        const token = session.auth_token;
        if (token) {
            $.ajaxSetup({
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
        }
    },

    allUsersAssigned: function () {
        return this.all(function (u) {
            return !!u.get('world');
        });
    },

    getUnassignedUsersCount: function () {
        return this.filter(function (u) {
            return !u.get('world');
        }).length;
    },

    fetch: function () {
        var dtd = $.Deferred();
        var me = this;
        var groupId = env.get().groupId;

        var getGroupUsers = function () {
            var memberApi = serviceLocator.memberApi();
            var userApi = serviceLocator.userApi();

            var loadGroupMembers = function () {
                return memberApi.getGroupDetails();
            };

            var splitIdChunks = function (userIds) {
                var idGroupSize = 100;
                var idGroups = [];
                while (userIds.length >= idGroupSize) {
                    idGroups.push(userIds.splice(0, idGroupSize));
                }

                if (userIds.length) {
                    idGroups.push(userIds);
                }

                return idGroups;
            };

            var loadUsersInfo = function (group) {
                var nonFacAndActive = function (u) { return u.active && u.role !== 'facilitator'; };
                const endUsers = group.members.filter((m)=> nonFacAndActive(m));
                const endUserIds = endUsers.map((u)=> u.userId);
                var chunkedUsers = splitIdChunks(endUserIds);
                var chunkedPromises = chunkedUsers.map(function (users) {
                    return userApi.get({ id: users });
                });
                return $.when.apply($, chunkedPromises).then(function (userGroups) {
                    var totalUsers = userGroups.reduce(function (acc, userGroup) {
                        return acc.concat(userGroup);
                    }, []);

                    return totalUsers;
                });
            };

            return loadGroupMembers()
                .then(loadUsersInfo)
                .fail(dtd.reject);
        };

        getGroupUsers()
            .then(function (users) {
                users = users.map(function (u) { return $.extend(u, { groupId: groupId }); });
                me.set(users);
                dtd.resolve(users);
            });

        return dtd.promise();
    }

});
