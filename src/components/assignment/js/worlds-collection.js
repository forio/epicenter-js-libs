'use strict';

var classFrom = require('../../../util/inherit');
var Model = require('./world-model');
var UserModel = require('./user-model');
var Base = require('./base-collection');
var env = require('./defaults');

var doneFn = function (dtd, after) {
    return _.after(after, dtd.resolve);
};

var worldApi = new F.service.World(env);


module.exports = classFrom(Base, {
    model: Model,

    updateUser: function (user) {
        var worldName = user.get('world');
        var dtd = $.Deferred();
        var done = doneFn(dtd, 2);
        var prevWorld = this.getWorldByUser(user);
        var curWorld = this.getOrCreateWorldById(worldName);

        if (prevWorld) {
            prevWorld.removeUser(user)
                .then(done);
        }

        if (curWorld) {
            curWorld.addUser(user)
                .then(done);
        }

        return dtd.promise();
    },

    getOrCreateWorldById: function (worldName) {
        var world = this.getWordById(worldName);

        if (!world) {
            world = this.create({ name: worldName });
        }

        return world;
    },

    getWordById: function (worldName) {
        return this.find(function (world) {
            return world.get('name') === worldName;
        });
    },

    getWorldByUser: function (user) {
        var id = user.get('id');
        return this.find(function (world) {
            return _.find(world.get('users'), function (u) {
                return u.get('id') === id;
            });
        });
    },

    joinUsers: function (usersCollection) {
        var usersHash = {};

        usersCollection.each(function (u) {
            return (usersHash[u.get('id')] = u);
        });

        this.each(function (w, i) {
            var name = w.get('name');
            w.set({ index: i, name: name || (i + 1) + '' });
            _.each(w.get('users'), function (u) {
                usersHash[u.get('userId')].set({ world: name, role: u.get('role') });
            });
        }, this);
    },

    fetch: function () {
        var _this = this;
        return worldApi.list(_.pick(env, ['group']))
            .then(function (worlds) {
                if (worlds.length) {
                    worlds = _.map(worlds, function (w) {
                        var users = _.map(w.users, function (u) {
                            // in the world api users Ids comes as userId
                            // make sure we add it as id so we can use the
                            // same code to access models that come from the
                            // member/local api as with the world api
                            u.id = u.userId;
                            return new UserModel(u);
                        });

                        w.users = users;

                        return w;
                    });

                    _this.set(worlds);
                }
            });
    }
});