/**
* ## World Manager
*
* As discussed under the [World API Adapter](../world-api-adapter/), a [run](../../../glossary/#run) is a collection of end user interactions with a project and its model. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.
*
* The [World API Adapter](../world-api-adapter/) handles creating multiplayer worlds, and adding and removing end users and runs from a world.
*
* The World Manager provides an easy way to track and access the current world and run for particular end users.
*
* ### Using the World Manager
*
* To use the World Manager, instantiate it. Then, make calls to any of the methods you need:
*
*       var wMgr = new F.manager.WorldManager()
*       wMgr.getCurrentWorld();
*       wMgr.getCurrentRun();
*
* Note that the World Manager does *not* create worlds automatically. (This is different than the [Run Manager](../run-manager).) However, you can pass in specific options to any runs created by the manager, using a `run` object.
*
* When you instantiate a World Manager, the world's account id, project id, and group are automatically taken from the session (thanks to the [Authentication Service](../auth-api-service)). However, you can override these by optionally passing in:
*
*   * `account`: The **Team ID** in the Epicenter user interface for this project.
*   * `project`: The **Project ID** for this project.
*   * `group`: The **Group Name** for this world.
*   * `run`: Options to use when creating new runs with the manager, e.g. `run: {files: ['data.xls']}`.
*
* For example:
*
*       var wMgr = new F.manager.WorldManager({
*          account: 'acme-simulations',
*          project: 'supply-chain-game',
*          group: 'team1'
*       });
*
*/

'use strict';

var WorldApi = require('../service/world-api-adapter');
var RunManager =  require('./run-manager');
var AuthManager = require('./auth-manager');
// var _pick = require('../util/object-util')._pick;
var worldApi;

// var defaults = {
//  account: '',
//  project: '',
//  group: '',
//  transport: {
//  }
// };


function buildStrategy(worldId, dtd) {

    return function Ctor(runService, options) {
        this.runService = runService;
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implementd. Need api changes');
            },

            getRun: function () {
                var _this = this;
                //get or create!
                // Model is required in the options
                return worldApi.getCurrentRunId({ model: this.options.model, filter: worldId })
                    .then(function (runId) {
                        return _this.runService.load(runId);
                    })
                    .then(function (run) {
                        dtd.resolve.call(this, run, _this.runService);
                    })
                    .fail(dtd.reject);
                }
            }
        );
    };
}


module.exports = function (options) {
    this.options = options || { run: {}, world: {} };

    $.extend(true, this.options, this.options.run);
    $.extend(true, this.options, this.options.world);


    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var _this = this;

    var api = {

        /**
        * Returns the current world (object) and an instance of the [World API Adapter](../world-api-adapter/).
        *
        * **Example**
        *
        *       var wMgr = new F.manager.WorldManager()
        *       wMgr.getCurrentWorld()
        *           .then(function(world, worldAdapter) {
        *               console.log(world.id);
        *               worldAdapter.getCurrentRunId();
        *           });
        *
        * **Parameters**
        * @param {string} `userId` (Optional) The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} `groupName` (Optional) The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
        */
        getCurrentWorld: function (userId, groupName) {
            var session = this._auth.getCurrentUserSessionInfo();
            if (!userId) {
                userId = session.userId;
            }
            if (!groupName) {
                groupName = session.groupName;
            }
            return worldApi.getCurrentWorldForUser(userId, groupName);
        },

        /**
        * Returns the current run (object) and an instance of the [Run API Service](../run-api-service/).
        *
        * **Example**
        *
        *       var wMgr = new F.manager.WorldManager()
        *       wMgr.getCurrentRun()
        *           .then(function(run, runService) {
        *               console.log(run.id);
        *               runService.do('runModel');
        *           });
        *
        * **Parameters**
        * @param {string} `model` The name of the model file.
        */
        getCurrentRun: function (model) {
            var dtd = $.Deferred();
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            function getAndRestoreLatestRun(world) {
                var currentWorldId = world.id;
                var runOpts = $.extend(true, _this.options, { model: model });
                var strategy = buildStrategy(currentWorldId, dtd);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: runOpts
                });
                var rm = new RunManager(opt);

                return rm.getRun()
                    .then(function (run) {
                        dtd.resolve(run, rm.runService, rm);
                    });
            }

            this.getCurrentWorld(curUserId, curGroupName)
                .then(getAndRestoreLatestRun);

            return dtd.promise();
        }
    };

    $.extend(this, api);
};
