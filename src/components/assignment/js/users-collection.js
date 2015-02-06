'use strict';

var Model = require('./user-model');


var tok = 'eyJhbGciOiJSUzI1NiJ9.eyJqdGkiOiJlZmUwMDdiMS1mOTc3LTRmZDgtYjE5NC1mYmIzMDRmZDI1MGEiLCJzdWIiOiI2N2U5YzFiMC0xN2Y2LTQ3MTEtYTRmZS0wM2U3OTI3ODRhMTQiLCJzY29wZSI6WyJvYXV0aC5hcHByb3ZhbHMiLCJvcGVuaWQiXSwiY2xpZW50X2lkIjoibG9naW4iLCJjaWQiOiJsb2dpbiIsImdyYW50X3R5cGUiOiJwYXNzd29yZCIsInVzZXJfaWQiOiI2N2U5YzFiMC0xN2Y2LTQ3MTEtYTRmZS0wM2U3OTI3ODRhMTQiLCJ1c2VyX25hbWUiOiJqYWltZWRlbHBhbGFjaW9AZm9yaW8uY29tIiwiZW1haWwiOiJqYWltZWRlbHBhbGFjaW9AZm9yaW8uY29tIiwiaWF0IjoxNDIyOTA0MTQ1LCJleHAiOjE0MjI5NDczNDUsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTc2My91YWEvb2F1dGgvdG9rZW4iLCJhdWQiOlsib2F1dGgiLCJvcGVuaWQiXX0.S4NyIGecQ8jegBLqdPfJHUuRbHsRvMTql1xPfjGaJ-06ebiK3BXGSMwXKpiMcKl0RHjTiHONBk0Bw97gNHDeMCSaIx1COCn4Qe7aktNLHOv8HUUgCYzznQCHLeCjmekG1f8LQKKrdE5Tw4clYLZDiCFhezJuVjYAKTwVdUu2hh9_3Yp_Th4xWRb-8TJ3qtfr3nCGZ4JLitdmHzMc8rgDxu6uXEGYsDywYcgOJ3xziB8fl9Yiw5i8LCftFIWMJqymejJGZSTeC2rl6RsLxa9XXOuGJuDHy_MHu12fTunyciqh486WksGu3Ay2iqkbRhn266X2RwEsdhJQ00rycUqo2A';
var account = 'forio-dev';
var project = 'rdemo';
var groupName = 'forio-demo-dec-2014';
var groupId = 'd07c5990-e705-463f-aa0b-8f557c5dfe95';

var worldApi = new F.service.World({ account: account, project: project, group: groupName });

var Collection = function (models, options) {
    this._models = [];
    this.options = options;
    this.initialize();
};


Collection.prototype = {

    model: Model,

    initialize: function () {

    },

    fetch: function () {
        var dtd = $.Deferred();
        var _this = this;
        var _users;
        var _worlds;

        var getGroupUsers = function () {
            var memberApi = new F.service.Member({ groupId: groupId });
            var userApi = new F.service.User({ account: account, token: tok });

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
            return worldApi.list({ group: groupName })
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
    },


    set: function (models) {
        if (!models) {
            return;
        }

        if (!_.isArray(models)) {
            throw new Error('Don\'t know what to set');
        }

        _.each(models, function (m) {
            if (!(m instanceof this.model)) {
                m = new this.model(m);
            }

            this._models.push(m);
        }, this);

        return models;
    },

    each: function (cb, ctx) {
        return _.each(this._models, cb, ctx);
    },

    toJSON: function () {
        return _.invoke(this._models, 'toJSON');
    }

};


module.exports = Collection;