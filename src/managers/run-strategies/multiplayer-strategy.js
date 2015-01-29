'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./identity-strategy');
var StorageFactory = require('../../store/store-factory');
var GameApiAdapter = require('../../service/game-api-adapter');
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

        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer game. (ERR: no userId in session)' }, session).promise();
        }

        var game = new GameApiAdapter(opt);

        var restoreInitRun = function (games, msg, xhr) {
            if (!games || !games.length) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any game.' }, { options: opt, session: session, xhr: xhr });
            }

            // assume the most recent game as the 'active' game
            games.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });

            return game.getCurrentRun({ filter: games[0].id })
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            dtd.reject(error, session, opt);
        };

        game.getGamesForUser({ userId: curUserId })
            .then(restoreInitRun)
            .fail(serverError);

        return dtd.promise();
    }
});

module.exports = Strategy;
