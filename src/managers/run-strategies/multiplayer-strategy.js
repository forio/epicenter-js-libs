'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./identity-strategy');
var WorldApiAdapter = require('../../service/world-api-adapter');
var AuthManager = require('../auth-manager');

var defaults = {
    store: {
        synchronous: true
    }
};

var Strategy = classFrom(IdentityStrategy, {

    constructor: function (runService, options) {
        this.runService = runService;
        this.options = $.extend(true, {}, defaults, options);
        this._auth = new AuthManager();
        this._loadRun = this._loadRun.bind(this);
        this.worldApi = new WorldApiAdapter(this.options.run);
    },

    reset: function () {
        var session = this._auth.getCurrentUserSessionInfo();
        var curUserId = session.userId;
        var curGroupName = session.groupName;

        return this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(function (world) {
                return this.worldApi.newRunForWorld(world.id);
            }.bind(this));
    },

    getRun: function () {
        var session = this._auth.getCurrentUserSessionInfo();
        var curUserId = session.userId;
        var curGroupName = session.groupName;
        var worldApi = this.worldApi;
        var _this = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: this.options, session: session });
            }

            return worldApi.getCurrentRunId({ filter: world.id })
                .then(_this._loadRun)
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            dtd.reject(error, session, this.options);
        };

        this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(loadRunFromWorld)
            .fail(serverError);

        return dtd.promise();
    },

    _loadRun: function (id, options) {
        return this.runService.load(id, null, options);
    }
});

module.exports = Strategy;
