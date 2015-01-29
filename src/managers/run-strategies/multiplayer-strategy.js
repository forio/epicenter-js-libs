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

var store = new StorageFactory();

var Strategy = classFrom(IdentityStrategy, {
    constructor: function (runService, options) {
        this.runService = runService;
        this.options = $.extend(true, {}, defaults, options);
        store = new StorageFactory(this.options.store);

    },

    reset: function () {

    },

    getRun: function () {
        var session = JSON.parse(store.get(keyNames.EPI_SESSION_KEY) || '{}');
        var opt = $.extend({
            account: session.account,
            project: session.project,
            group: session.groupName
        }, _pick(this.options, ['account', 'project', 'group']));
        var curUserId = session.userId;

        if (!curUserId) {
            throw new Error('We need an authenticated user to join a multiplayer game. (ERR: no userId in session)');
        }

        var game = new GameApiAdapter(opt);

        var restoreInitRun = function (games) {
            if (!games || !games.length) {
                throw new Error('The user is not in any game.');
            }

            games.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });

            return game.getCurrentRun({ filter: games[0].id });
        };

        var userNotInGame = function (error) {
            // is this possible?
            throw new Error('The current user is not in any game', error);
        };

        return game
            .getGamesForUser({ userId: curUserId })
            .then(restoreInitRun)
            .fail(userNotInGame);
    }
});

module.exports = Strategy;
