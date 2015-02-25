'use strict';

var classFrom = require('../../../util/inherit');

var Model = require('./user-model');
var Base = require('./base-collection');
var tok = 'bG9naW46bG9naW5zZWNyZXQ=';
var env = require('./defaults');

$.ajaxSetup({
    headers: {
        Authorization: 'Basic ' + tok
    }
});


var worldApi = new F.service.World(env);

module.exports = classFrom(Base, {
    model: Model,

    initialize: function () {

    },

    fetch: function () {
        var dtd = $.Deferred();
        var _this = this;
        var _users;
        var _worlds;

        var getGroupUsers = function () {
            var memberApi = new F.service.Member(_.pick(env, ['groupId', 'server']));
            var userApi = new F.service.User(_.pick(env, ['account', 'server']));

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

        var getWorlds = function () {
            return worldApi.list(_.pick(env, ['group']))
                .fail(dtd.reject);
        };

        var join = _.after(2, function () {

            var usersHash = {};
            _.each(_users, function (u) {
                u.world = '';
                u.role = '';
                return (usersHash[u.id] = u);
            });

            _.each(_worlds, function (w, i) {
                w.index = i;
                _.each(w.users, function (u) {
                    _.extend(usersHash[u.userId], { world: w.index + 1, role: u.role });
                });
            }, this);

            _users.sort(function (a, b) { return +a.world - +b.world; });

            _this.set(_users);
            dtd.resolve(_users);
        });

        var usersLoaded = function (users) {
            _users = users;
            join();
        };

        var worldsLoaded = function (worlds) {
            _worlds = worlds;
            join();
        };

        getWorlds().then(worldsLoaded);
        getGroupUsers().then(usersLoaded);

        return dtd.promise();
    }

});
