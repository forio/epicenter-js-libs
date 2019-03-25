import WorldApiAdapter from 'service/world-api-adapter';
import { rejectPromise } from 'util/index';
import { omit } from 'util/object-util';

function worldFromRun(runService) {
    const config = omit(runService.getCurrentConfig(), ['filter', 'id']);
    const worldService = new WorldApiAdapter(config);
    return worldService;
}
/**
 * The `multiplayer` strategy is for use with [multiplayer worlds](../../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../world-api-adapter/). If you use the [World Manager](../world-manager/), you are automatically using this strategy.
 * 
 * Using this strategy means that end users in projects with multiplayer worlds always see the most current world and run. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.
 */
export default class MultiplayerStrategy {
    constructor(options) {
        const defaults = {};
        this.options = $.extend(true, {}, defaults, options);
    }

    reset(runService, session, options) {
        const { userId, groupName } = session;
        const optionsToPassOn = $.extend(true, {}, options, {
            success: $.noop,
        });
        const worldApi = worldFromRun(runService);
        return worldApi
            .getCurrentWorldForUser(userId, groupName)
            .then((world)=> {
                return worldApi.newRunForWorld(world.id, optionsToPassOn).then(function (runid) {
                    const toReturn = {
                        id: runid
                    };
                    if (options && options.success) options.success(toReturn); 
                    return toReturn;
                });
            });
    }

    getRun(runService, session) {
        const { userId, groupName } = session;
        const worldApi = worldFromRun(runService);
        const model = this.options.model;

        if (!userId) {
            return rejectPromise('UNAUTHORIZED', 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)');
        }

        const loadRunFromWorld = function (world) {
            if (!world) {
                return rejectPromise('NO_WORLD_FOR_USER', `User ${userId} not part of a world`);
            }
            return worldApi.getCurrentRunId({ model: model, filter: world.id })
                .then(function (id) {
                    return runService.load(id);
                })
                .then(function (run) {
                    run.world = world;
                    return run;
                });
        };

        return worldApi
            .getCurrentWorldForUser(userId, groupName)
            .then(loadRunFromWorld);
    }
}