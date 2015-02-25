'use strict';

var classFrom = require('../../../util/inherit');
var Model = require('./world-model');
var Base = require('./base-collection');

var doneFn = function (dtd, after) {
    return _.after(after, dtd.resolve);
};

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
        var userName = user.get('userName');
        return this.find(function (world) {
            return _.find(world.get('users'), function (u) {
                return u.get('userName') === userName;
            });
        });
    }
});