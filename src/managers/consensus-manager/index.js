import WorldManager from 'managers/world-manager';
import ConsensusGroupService from 'service/consensus-api-service/consensus-group-service';

import strategy from './strategies/mandatory-consensus-strategy';

function getCurrentWorld(opts) {
    const wm = new WorldManager(opts);
    return wm.getCurrentWorld();
}
export default class ConsensusManager {
    constructor() {
        const opts = {
            account: undefined,
            project: undefined,
            worldId: '',
            name: 'default',
        };
    }

    getCurrent() {
        const opts = {
            account: 'team-naren',
            project: 'multiplayer-test',
            model: 'bikes-multiplayer.xlsx',
        };

        return getCurrentWorld(opts).then((world)=> {
            const cm = new ConsensusGroupService($.extend({}, opts, {
                worldId: world.id
            }));
            return strategy(cm, {
                roles: world.roles,
            });
        });
    }
}