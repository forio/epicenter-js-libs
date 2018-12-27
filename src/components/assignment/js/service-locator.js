'use strict';

var env = require('./defaults.js');

var cache = {};

module.exports = {
    worldApi: function () {
        if (!cache.worldApi) {
            cache.worldApi = new F.service.World(env.get());
        }
        return cache.worldApi;
    },

    memberApi: function () {
        if (!cache.memberApi) {
            cache.memberApi = new F.service.Member(_.pick(env.get(), ['groupId', 'server']));
        }

        return cache.memberApi;
    },

    userApi: function () {
        if (!cache.userApi) {
            cache.userApi = new F.service.User(_.pick(env.get(), ['account', 'server']));
        }

        return cache.userApi;
    }
};