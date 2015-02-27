'use strict';

var classFrom = require('../../../util/inherit');

var Model = require('./user-model');
var Base = require('./base-collection');
var tok = 'bG9naW46bG9naW5zZWNyZXQ=';
var serviceLocator = require('./service-locator');

$.ajaxSetup({
    headers: {
        Authorization: 'Basic ' + tok
    }
});


module.exports = classFrom(Base, {
    model: Model,

    initialize: function () {

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
        var _this = this;

        var getGroupUsers = function () {
            var memberApi = serviceLocator.memberApi();
            var userApi = serviceLocator.userApi();

            var loadGroupMembers = function () {
                return memberApi.getGroupDetails();
            };

            var loadUsersInfo = function (group) {
                var users = _.pluck(group.members, 'userId');
                return userApi.get({ id: users });
            };

            return loadGroupMembers()
                .then(loadUsersInfo)
                .fail(dtd.reject);
        };

        var sortFn = function (a, b) { return +a.world - +b.world; };

        getGroupUsers()
            .then(function (users) {
                _this.set(users.sort(sortFn));
                dtd.resolve(users, _this);
            });

        return dtd.promise();
    }

});
