/**
 * Epicenter Javascript libraries
 * v<%= version %>
 * https://github.com/forio/epicenter-js-libs
 */

var F = {
    _private: {}, //need this hook now because tests expect everything to be global. Delete once tests are browserified
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    },

};

F.load = require('./env-load');

if (!global.SKIP_ENV_LOAD) {
    F.load();
}

F.util.query = require('./util/query-util');
F.util.run = require('./util/run-util');
F.util.classFrom = require('./util/inherit');
F._private.strategyutils = require('./managers/strategy-utils');

F.factory.Transport = require('./transport/http-transport-factory');
F.transport.Ajax = require('./transport/ajax-http-transport');

F.service.URL = require('./service/url-config-service');
F.service.Config = require('./service/configuration-service');
F.service.Run = require('./service/run-api-service');
F.service.File = require('./service/admin-file-service');
F.service.Variables = require('./service/variables-api-service');
F.service.Data = require('./service/data-api-service');
F.service.Auth = require('./service/auth-api-service');
F.service.World = require('./service/world-api-adapter');
F.service.State = require('./service/state-api-adapter');
F.service.User = require('./service/user-api-adapter');
F.service.Member = require('./service/member-api-adapter');
F.service.Asset = require('./service/asset-api-adapter');
F.service.Group = require('./service/group-api-service');
F.service.Introspect = require('./service/introspection-api-service');
F.service.Presence = require('./service/presence-api-service');

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager');
F.manager.RunManager = require('./managers/run-manager');
F.manager.AuthManager = require('./managers/auth-manager');
F.manager.WorldManager = require('./managers/world-manager');
F.manager.SavedRunsManager = require('./managers/saved-runs-manager');

var strategies = require('./managers/run-strategies');
F.manager.strategy = strategies.list; //TODO: this is not really a manager so namespace this better

F.manager.ChannelManager = require('./managers/epicenter-channel-manager');
F.service.Channel = require('./service/channel-service');

F.version = '<%= version %>';
F.api = require('./api-version.json');

F.constants = require('./managers/key-names');

global.F = F;
module.exports = F;
