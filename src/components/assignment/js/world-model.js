'use strict';
var env = require('./defaults');
var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
var __super = Base.prototype;

module.exports = classFrom(Base, {

    defaults: {
        users: [],
        model: 'model.eqn'
    },

    initialize: function () {
        __super.initialize.apply(this, arguments);

        this._worldApi = new F.service.World(env);

        var id = this.get('id');
        if (id) {
            this._worldApi.load(id);
        }
    },

    addUser: function (user) {
        var users = this.get('users');
        users.push(user);

        return this.save();
    },

    removeUser: function (user) {
        var users = _.remove(this.get('users'), function (u) {
            return u.get('id') === user.get('id');
        });

        this.set('users', users);

        return this._worldApi
            .removeUser({ userId: user.get('id') });
    },

    save: function () {
        var _this = this;
        var mapUsers = function () {
            return _.map(this.get('users'), function (u) {
                var res = { userId: u.get('id') };
                var role = u.get('role');

                if (role) {
                    res.role = role;
                }

                return res;
            });
        }.bind(this);

        var createWorld = _.partial(this._worldApi.create, this.pick(['model', 'name', 'minUsers']));
        var addUsers = _.partial(_this._worldApi.addUsers, mapUsers(), { filter: _this.get('id') });
        if (this.isNew()) {
            // we need to create the world in the API and then add the users
            return createWorld()
                .then(function (world) {
                    _this.set(world);
                    _this._worldApi.load(world.id);
                })
                .then(addUsers)
                .then(function (users) {
                    // since we re-set the world, re-set the users
                    _this.get('users').push(users);
                });
        } else {
            // the world is already created just add the users
            return addUsers();
        }
    },

    isNew: function () {
        return !this.get('lastModified');
    }

});