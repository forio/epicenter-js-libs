'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./identity-strategy');
var StorageFactory = require('../../store/store-factory');
var WorldApiAdapter = require('../../service/world-api-adapter');
var keyNames = require('../key-names');
var _pick = require('../../util/object-util')._pick;

var defaults = {
    store: {
        synchronous: true
    }
};

var Strategy = classFrom(IdentityStrategy, {

    constructor: function (runService, options) {
        this.runService = runService;
        this.options = $.extend(true, {}, defaults, options);
        this._store = new StorageFactory(this.options.store);
        this._loadRun = this._loadRun.bind(this);
    },

    reset: function () {
        throw new Error('Not supported. Reset should not be called from the end-user side');
    },

    getRun: function () {
        var session = JSON.parse(this._store.get(keyNames.EPI_SESSION_KEY) || '{}');
        var curUserId = session.userId;
        var opt = $.extend({
            account: session.account,
            project: session.project,
            group: session.groupName
        }, _pick(this.options, ['account', 'project', 'group']));

        var _this = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var worldApi = new WorldApiAdapter(opt);

        var restoreInitRun = function (worlds, msg, xhr) {
            if (!worlds || !worlds.length) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: opt, session: session, xhr: xhr });
            }

            // assume the most recent world as the 'active' world
            worlds.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });

            return worldApi.getCurrentRunId({ filter: worlds[0].id })
                .then(function (runId) {
                    return _this._loadRun(runId);
                })
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            dtd.reject(error, session, opt);
        };

        worldApi.getWorldsForUser(curUserId)
            .then(restoreInitRun)
            .fail(serverError);

        return dtd.promise();
    },

    _loadRun: function (id, options) {
        return this.runService.load(id, null, options);
    }
});

module.exports = Strategy;
