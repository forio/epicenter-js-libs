var F = {
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    },
};

F.load = require('./service/url-config-service/env-load');

if (!window.SKIP_ENV_LOAD) {
    F.load();
}

F.util.query = require('./util/query-util');
F.util.run = require('./util/run-util');
F.util.classFrom = require('./util/inherit');

F.factory.Transport = require('./transport/http-transport-factory').default;
F.transport.Ajax = require('./transport/ajax-http-transport');

F.service.URL = require('./service/url-config-service');
F.service.Config = require('./service/configuration-service').default;
F.service.Run = require('./service/run-api-service').default;
F.service.File = require('./service/admin-file-service');
F.service.Variables = require('./service/run-api-service/variables-api-service').default;
F.service.Data = require('./service/data-api-service').default;
F.service.Auth = require('./service/auth-api-service').default;
F.service.World = require('./service/world-api-adapter').default;
F.service.State = require('./service/state-api-adapter').default;
F.service.User = require('./service/user-api-adapter').default;
F.service.Member = require('./service/member-api-adapter').default;
F.service.Asset = require('./service/asset-api-adapter').default;
F.service.Group = require('./service/group-api-service').default;
F.service.Introspect = require('./service/introspection-api-service').default;
F.service.Presence = require('./service/presence-api-service').default;
F.service.Time = require('./service/time-api-service').default;
F.service.Timer = require('./service/timer-service').default;
F.service.Password = require('./service/password-api-service').default;

F.service.Account = require('./service/account-api-service').default;

F.service.Consensus = require('./service/consensus-api-service/consensus-service').default;
F.service.ConsensusGroup = require('./service/consensus-api-service/consensus-group-service').default;

F.service.Project = require('./service/project-api-service').default;

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager').default;
F.manager.RunManager = require('./managers/run-manager').default;
F.manager.User = require('./managers/user-manager').default;
F.manager.AuthManager = require('./managers/auth-manager').default;

F.v3 = { manager: {}, service: {} };
F.v3.manager.AuthManager = require('./managers/auth-manager-v3').default;

F.manager.WorldManager = require('./managers/world-manager').default;
F.manager.SavedRunsManager = require('./managers/saved-runs-manager').default;

var strategies = require('./managers/run-strategies').default;
F.manager.strategy = strategies.list; //TODO: this is not really a manager so namespace this better

F.manager.Settings = require('./managers/settings-manager').default;

F.manager.ChannelManager = require('./managers/epicenter-channel-manager').default;
F.service.Channel = require('./service/channel-service').default;

F.manager.ConsensusManager = require('./managers/consensus-manager').default;

if (RELEASE_VERSION) F.version = RELEASE_VERSION; //eslint-disable-line no-undef
F.api = require('./api-version.json');

F.constants = require('./managers/key-names');

module.exports = F;
