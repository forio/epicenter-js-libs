import WorldManager from 'managers/world-manager';
import WorldService from 'service/world-api-adapter';

import ConsensusGroupService from 'service/consensus-api-service/consensus-group-service';
import strategy from './strategies/mandatory-consensus-strategy';

function getCurrentWorldIdAndRoles(opts) {
    if (opts.id && opts.roles) {
        return $.Deferred().resolve({
            id: opts.id,
            roles: opts.roles
        }).promise();
    } else if (opts.worldId) {
        const ws = new WorldService();
        return ws.load(opts.worldId);
    } else {
        const wm = new WorldManager(opts);
        return wm.getCurrentWorld();
    }
  
}
export default class ConsensusManager {
    constructor(config) {
        const opts = {
            name: 'default',
            strategy: '',
            strategyOptions: {

            }
        };
        this.serviceOptions = $.extend(true, {}, opts, config);
    }

    getCurrent() {
        return getCurrentWorldIdAndRoles(this.serviceOptions).then((world)=> {
            const cg = new ConsensusGroupService($.extend({}, this.serviceOptions, {
                worldId: world.id
            }));
            return strategy(cg, {
                roles: world.roles,
            });
        });
    }
}