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
        if (this.isNew()) {
            return this._worldApi.create(this.pick(['model', 'users']))
                .then(function (world) {
                    _this.set(world);
                });
        }
    },

    isNew: function () {
        return !this.get('lastModified');
    }

});