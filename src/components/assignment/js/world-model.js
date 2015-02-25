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
    },

    addUser: function (user) {
        var users = this.get('users');
        users.push(user);

        return this.save();
    },

    removeUser: function (user) {

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
        // we need to create the world in the API and then add the users
        if (this.isNew()) {
            return createWorld()
                .then(function (world) {
                    _this.set(world);
                })
                .then(addUsers)
                .then(function (users) {
                    _this.get('users').push(users);
                });
        } else {
            return addUsers();
        }
    },

    isNew: function () {
        return !this.get('lastModified');
    }

});