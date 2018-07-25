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
        $.ajaxSetup({
            headers: {
                Authorization: 'Bearer ' + env.get().token
            }
        });
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
                var users = _.pluck(_.filter(group.members, nonFacAndActive), 'userId');
                var chunkedUsers = splitIdChunks(users);
                var chunkedPromises = chunkedUsers.map(function (users) {
                    return userApi.get({ id: users });
                });
                return $.when.apply($, chunkedPromises).then(function (/** [ users[], ajaxStatus, promise ][] */) {
                    // Converting arguments object to an Array in order to map over them
                    var argumentsArray = Array.prototype.slice.call(arguments);

                    var userGroups = argumentsArray.map(function (arg) {
                        return arg[0];
                    });

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
                users = _.map(users, function (u) { return _.extend(u, { groupId: groupId }); });
                me.set(users);
                dtd.resolve(users);
            });

        return dtd.promise();
    }

});
