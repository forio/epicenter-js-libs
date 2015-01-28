'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./identity-strategy');
// var StorageFactory = require('../store/store-factory');
var GameApiAdapter = require('../../service/game-api-adapter');

var defaults = {};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function (runService, options) {
        this.runService = runService;
        this.options = $.extend(true, {}, defaults, options);
    },

    reset: function () {

    },

    getRun: function () {
        var curUserId = this.options.userId;
        // var groupName = this.options.group;
        var game = new GameApiAdapter(this.options);

        var restoreInitRun = function (games) {
            games.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
            return game.getCurrentRun(games[0].id, { filter: games[0].id });
        };

        var userNotInGame = function (error) {
            throw new Error('The current user is not in any game', error);
        };

        return game
            .getGamesForUser({ userId: curUserId })
            .then(restoreInitRun)
            .fail(userNotInGame);
    }
});

module.exports = Strategy;
