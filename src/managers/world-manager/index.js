import WorldApi from 'service/world-api-adapter';
import RunManager from 'managers/run-manager';
import AuthManager from 'managers/auth-manager';

var worldApi;
function buildStrategy(worldId) {
    return function Ctor(options) {
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implemented. Need api changes');
            },
            getRun: function (runService) {
                // Model is required in the options
                var model = this.options.run.model || this.options.model;
                return worldApi.getCurrentRunId({ model: model, filter: worldId })
                    .then(function (runId) {
                        return runService.load(runId);
                    });
            }
        });
    };
}


/**
 * @param {AccountAPIServiceOptions} options 
 * @property {string} [group] The group name to use for filters / new runs
 * @property {object} run Options to use when creating new runs with the manager, e.g. `run: { files: ['data.xls'] }`. See RunService for details.
 * @property {string} run.model The name of the primary model file for this project. 
 */
export default function WorldManager(options) {
    this.options = options || { run: {}, world: {} };

    $.extend(true, this.options, this.options.run);
    $.extend(true, this.options, this.options.world);

    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var me = this;

    var api = {

        /**
        * Returns the current world (object) and an instance of the [World API Adapter](../world-api-adapter/).
        *
        * @example
        * wMgr.getCurrentWorld()
        *     .then(function(world, worldAdapter) {
        *         console.log(world.id);
        *         worldAdapter.getCurrentRunId();
        *     });
        *
        * 
        * @param {string} [userId] The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} [groupName] The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
        * @return {Promise}
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
        * @example
        * wMgr.getCurrentRun('myModel.py')
        *     .then(function(run, runService) {
        *         console.log(run.id);
        *         runService.do('startGame');
        *     });
        *
        * @param {string} [model] The name of the model file. Required if not already passed in as `run.model` when the World Manager is created.
        * @return {Promise}
        */
        getCurrentRun: function (model) {
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            return this.getCurrentWorld(curUserId, curGroupName).then(function getAndRestoreLatestRun(world) {
                if (!world) {
                    return $.Deferred().reject({ error: 'The user is not part of any world!' }).promise();
                }
                var runOpts = $.extend(true, me.options, { model: model });
                var strategy = buildStrategy(world.id);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: runOpts
                });
                var rm = new RunManager(opt);
                return rm.getRun()
                    .then(function (run) {
                        run.world = world;
                        return run;
                    });
            });
        }
    };

    $.extend(this, api);
}
