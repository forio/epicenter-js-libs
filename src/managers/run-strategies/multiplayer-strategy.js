import WorldApiAdapter from 'service/world-api-adapter';
import { rejectPromise } from 'util/index';
import { omit } from 'util/object-util';

function worldFromRun(runService) {
    const config = omit(runService.getCurrentConfig(), ['filter', 'id']);
    const worldService = new WorldApiAdapter(config);
    return worldService;
}

export function reset(runService, session, options) {
    const { userId, groupName } = session;
    const optionsToPassOn = $.extend(true, {}, options, {
        success: $.noop,
    });
    const worldApi = worldFromRun(runService);
    return worldApi
        .getCurrentWorldForUser(userId, groupName)
        .then((world)=> {
            return worldApi.newRunForWorld(world.id, optionsToPassOn).then(function (runid) {
                return runService.load(runid);
            }).then((run)=> {
                run.freshlyCreated = true;
                run.world = world;
                return run;
            });
        });
}
export function getCurrentWorld(runService, session) {
    const { userId, groupName } = session;
    const worldApi = worldFromRun(runService);
    return worldApi
        .getCurrentWorldForUser(userId, groupName);
}

export function getRun(runService, session, options) {
    const { userId } = session;
    const worldApi = worldFromRun(runService);
    const model = runService.getCurrentConfig().model;

    if (!userId) {
        return rejectPromise('UNAUTHORIZED', 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)');
    }

    function loadRunFromWorld(world) {
        if (!world) {
            return rejectPromise('NO_WORLD_FOR_USER', `User ${userId} is not part of a world`);
        }
        const createOptions = $.extend(true, {}, options, { model: model, filter: world.id });
        return worldApi.getCurrentRunId(createOptions)
            .then(function (id, status, xhr) {
                return runService.load(id).then((run)=> {
                    const RUN_CREATION_STATUS = 201;
                    run.freslyCreated = xhr.status === RUN_CREATION_STATUS;
                    return run;
                });
            })
            .then(function (run) {
                run.world = world;
                return run;
            });
    }

    return getCurrentWorld(runService, session)
        .then(loadRunFromWorld);
}
/**
 * The `multiplayer` strategy is for use with [multiplayer worlds](../../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../world-api-adapter/). If you use the [World Manager](../world-manager/), you are automatically using this strategy.
 * 
 * Using this strategy means that end users in projects with multiplayer worlds always see the most current world and run. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.
 */
export default class MultiplayerStrategy {
    reset(runService, session, options) {
        return reset(runService, session, options);
    }

    getRun(runService, session, options) {
        return getRun(runService, session, options);
    }
}