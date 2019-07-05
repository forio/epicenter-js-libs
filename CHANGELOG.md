<a name="2.11.0"></a>
### 2.11.0

### Features
- login.js now supports multifactor authentication.  See ```src/components/login/index.html``` for the necessary HTML components that must be on the login page.

<a name="2.10.0"></a>
### 2.10.0

### Features
- Added a `keepOnline` flag to Presence Service. 
```js
var pr = new F.service.Presence();
pr.markOnline('0000015a68d806bc09cd0a7d207f44ba5f74', { keepOnline: true });
```
This will register your presence with the server every 5 minutes. Use `cancelKeepOnline` to stop doing so.
- Added sensitivity helper method to State Service (only applicable to Vensim)
- Added **Multiplayer** support to the Settings Manager. Pass in `multiplayer: true` to the constructor, and you'll now get a multiplayer settings strategy from `getUserRunStrategy`
- `reuse-by-tracking-key` is now more efficient; only does network call to get run count if you explicitly have a run limit set in your settings.

### Bug-fixes
- Multiplayer strategy was still mixing up world-id and run-id in some cases.
- Scenario/RunManager were not correctly passing through the `server` config option, so if you wanted to run the scenario manager against a different server it would not work. It now correctly passes through relevant options to intermediate services.

### Improvements
- Generated docs for Time Service
- Each run from tracking-key strategy now returns the associated settings as an object on the run. i.e., you can access `run.settings` to access to the settings that run was created with.

<a name="2.9.1"></a>
### Bug-fixes
- The multiplayer strategy reset function was sometimes using the wrong run id. This may have been a regression in `2.9.0`, and so **All multiplayer simulations should use 2.9.1 instead **.
- Listening to `TOPICS.RUN_RESET` on the channel instance returned by `getWorldChannel` wasn't working, now does.
- EPICENTER-3942 Variable service `query` mutated it's inputs for large GETs. Now properly clones.
- The `onCreate` parameter to `settingsManager.getUserRunStrategy` should've been optional but was actually required. Now is optional for real.
- Data service added a leading `/` if a custom `baseURL` was set while using an API proxy, now uses the correct path.

### Improvements
- Removed `objectAssign` polyfill, which was only used in the AuthManager. This is replaced with `$.extend` which is what the rest of the code uses anyway, and makes the file-size slightly smaller.

### Features
- Though technically a bug-fix release, this release also adds a `rewind` operation to the State service.

<a name="2.9.0"></a>

### Features

#### AssetService has a new `getTargetUploadURL` method

The new method provides a URL to an Amazon S3 endpoint to which you can upload directly, thereby skipping the middleman (Epicenter). This also allows you to set a expiration data on the asset beyond which it can no longer be accessed.

#### New 'use-specific-run' strategy

This is useful if you already know the id of the run you want the run-manager to return. This is typically used for impersonation.

Example:
```js
var runOptions = window.location.search.indexOf('impersonate') === -1 ? 'reuse-across-sessions': {
    strategy: 'use-specific-run',
    strategyOptions: {
        runId: 'runidToImpersonate' //usually passed on in the url
    }
}
var rs = new F.Manager.Run(runOptions);
```

#### `SavedRunsManager#getRuns` now follows pages and passes partial results to `onData`

The Epicenter APIs typically limit to providing 100 records (runs) at a time. You can explicitly as for more but the longer the dataset the slower the performance, and sometimes you may just forget to account for more than 100 runs when you make the call.

`getRuns` now follows pages and returns *all* the runs when it resolves. It fetches runs 100 at a time (controllable by a `recordsPerFetch` parameter), and provides progressive partial data if you pass in an `onData` parameter.

Example
```js
var sm = new F.manager.SavedRunsManager({ run: ..});
sm.getRuns(['Price', 'OtherVariable'], { saved: true }, { sort: 'desc' }, { 
    recordsPerFetch: 50,
    onData: (partialRuns)=> { //will be called with 50 runs at a time }
}).then((allRuns)=> { //Will be resolved with *all* runs, regardless of however many there are. Pass in `endRecord` if you do want to limit it. })
```

#### New SettingsManager

The Settings Manager is designed for controlling in-game settings - which can be model variables, or text descriptions, or any combination - within a group, for authenticated turn-by-turn projects.

See (Documentation)[https://forio.com/epicenter/docs/public/api_adapters/generated/settings-manager/] for more.

### Improvements

#### RunManager now synchronizes (and warns about) parallel `getRun` calls.

e.g
```js
var rm = new F.Manager.RunManager({
   strategy: 'reuse-never' 
});
var prom1 = rm.getRun();
var prom2 = rm.getRun();

//prom1 === prom2, and only 1 run will be created.
```
To explicitly create 2 runs, use 2 different run manager instances, or chain your `getRun` calls.

#### RunManager Strategies are now exposed as constants
```js
new RunManager({ strategy: 'reuse-never' });
```
can now be written as
```js
new RunManager({ strategy: RunManager.STRATEGY.REUSE_NEVER })
```

This helps prevent typos / provides better editor auto-complete.


#### DataService allows passing in a custom user id for user scoped data
This is useful if you need to read user-scoped data as a facilitator user.

```js
var ds = new F.service.Data({
   root: 'scores',
   scope: F.service.Data.SCOPES.USER
});
ds.load('firstScore', {}, { userId: 'customUserid' })
```

#### RunService#save allows passing in `scope` as an object
In previous versions, to update, say the tracking for a run, you'd need to do

```js
rs.save({ 'scope.trackingKey': 'foo' });
```
This release allows you to express that more idiomatically as:
```js
rs.save({ scope: { trackingKey: 'foo' }});
```

#### Strategies can now specify if the run-manager should set a cookie, 

Custom strategies can expose a static boolean `allowRunIDCache` property to control if the run manager should persist the result from `getRun` in a cookie. As a result, the 'reuse-never' strategy no longer sets a (redundant) cookie since it will always create a new run anyway.

#### Assignment component (Used by the manager and Interface Builder) has been updated to work with Lodash 4

### Bug-fixes
- DataService#remove allows providing an array of document ids to remove them all with a single call.
- WorldService#update alllows you to update the World name
- The URL service (which is used by all other services) now has safer defaults when working with non-https urls.

<a name="2.8.0"></a>

### Features

#### Share connections with the Channel Manager
- Different instances of the Channel Manager now use the same underlying websocket connection by default. This should drastically reduce network traffic if you were creating different instances to listen on different channels before. You can replicate the older behavior by setting the 'shareConnection' property to `false` when creating the Channel Manager. e.g.

```js
var cm = new F.manager.ChannelManager({
    shareConnection: false
});
```

#### New 'consensus' topics for the World Channel
You can now subscribe only to consensus updates on the world channel. e.g.

```js
var worldChannel = cm.getWorldChannel(worldObject);
worldChannel.subscribe(worldChannel.TOPICS.CONSENSUS, function (data) {
    console.log(data);
});
```

#### Scenario Manager changes

##### Control scope for baseline run in the Scenario Manager
The `baseline` strategy for the scenario manager used to create a new baseline run per *user* by default. You can now pass in strategy options to control this behavior, and create one for the group instead.

```js
var sm = new F.manager.ScenarioManager({
    run: {
        model: 'mymodel.vmf'
    },
    baseline: {
        scope: {
            scopeByUser: false
        }
    }
});
```
##### Control filters for the saved runs manager
The saved runs manager filters for saved runs by default; you can overrided that by passing in `saved: undefined`  as a filter. e.g.

```js
var sm = new F.manager.SavedRunsManager({
    scopeByUser: true,
    run: runParams
});
sm.getRuns(['Time'], {
    saved: undefined,
});
```   
#### User Management features:

##### New User Manager (F.manager.User)
This release includes a new 'User Manager' to help facilitate common user management issues (bulk upload users from a textarea for instance).

```js
var UserManager = F.manager.User;
var um = new UserManager(getRunParams());
um.uploadUsersToGroup($('#userTextarea').val()).then(function(){ alert('Upload sucess!'); }).catch(function (res) {
    if (res.type === UserManager.errors.EMPTY_USERS) {
        alert('No users specified to upload');
    } else if (res.type === UserManager.errors.NO_GROUP_PROVIDED) {
        alert('No group found. Create a group and login as a facilitator to upload users');
    } else {
        alert('Unknown error, please try again');
    }
});
```

##### User service has a new `createUsers` function to add users to your account.
```js
var ua = new F.service.User({
  account: 'acme-simulations',
});
ua.createUsers([{ userName: 'jsmith@forio.com', firstName: 'John', lastName: 'Smith', password: 'passw0rd' }]);
```

##### Member service has a new `addUsersToGroup` to add existing users into a group.
```js
const ma = new F.service.Member();
ma.addUsersToGroup(['42836d4b-5b61-4fe4-80eb-3136e956ee5c', '42836d4b-5b61-4fe4-80eb-3136e956ee5c'])
```

### Improvements:
- Renamed `un_authorized` to `unauthorized` in errors thrown by misc. services (Run Manager and Auth Manager) for consistency.
- The older lua based run api used to return `{}` instead of `[]` for empty results, and jslibs was translating `{}` to `[]` for consistency. The newer Java-based run api does not have this issue, so this workaround has been removed.
- The `current` run strategy for the `ScenarioManager` used to pick the last run which was not-saved/trashed as the 'current' run; it now sets a trackingKey called `current` and uses that instead to pick the current run.


<a name="2.7.0"></a>

### Features

#### Epicenter Channel Manager (F.manager.ChannelManager)

##### getWorldChannel: World Channel allows you to choose topics to subscribe to

You can now subscribe for specific "topics" on the World Channel. For e.g.

```js
const cm = new F.manager.ChannelManager();
const worldChannel = cm.getWorldChannel();
cm.subscribe(worldChannel.TOPICS.RUN, (data, meta)=> {
    //Gets all operations/variables/run reset notifications
});
```

The list of available topics are:

| Topic | Description |
| ------------- | ------------- |
| ALL | All events |
| RUN | All Run events |
| RUN_VARIABLES | Variable sets only |
| RUN_OPERATIONS | Operation executions only |
| RUN_RESET | New run attached to the world |
| PRESENCE | All Presence events |
| PRESENCE_ONLINE | Online notifications only |
| PRESENCE_OFFLINE | Offline notifications only |
| ROLES | All role events |
| ROLES_ASSIGN | Role assignments only |
| ROLES_UNASSIGN | Role unassignments |

##### getWorldChannel: Subscribing to the `PRESENCE` topic bootstraps info

Earlier the presence channel used to notify you of presence changes but you still needed to 'bootstrap' initial data for your current users in advance. Now the channel automatically queries for the status of the current users in the world and send it over. For e.g.

Example: Your world has users A,B, and C, out of who A&B are currently online.

```js
const worldChannel = cm.getWorldChannel();
cm.subscribe(worldChannel.TOPICS.PRESENCE, (data, meta)=> {
    //Will be called once for A, and once for B, as well as once for every future change to status of A,B, or C
});
```

#### Data API Scoping

```js  
const DataService = F.service.Data;    
const groupScopeDataService = new DataService({    
    name: 'some-name', 
    scope: DataService.SCOPES.GROUP,   
});    
const userScopeDataService = new DataService({     
    name: 'some-name', 
    scope: DataService.SCOPES.USER,    
});    
```
Available scopes are:

| Scope | Readable By | Writable By
| ------------- | ------------- | ------------- |
| GROUP | Facilitators & Users in that group | Faciliators in that group|
| USER | Faciliator in that group. User who created the collection | Faciliator in that group. User who created the collection |
| FACILITATOR | Faciliators in that group | Faciliators in that group |
| PROJECT (default, for legacy reasons) | Any user in the project | Any user in the project |
| CUSTOM (to opt out of naming conventions) | customize with Epicenter-api-proxy | customize with Epicenter-api-proxy |

#### Presence API: New method getStatusForUsers

This is similar to `getStatus`, except it takes in a whitelist of users to get presence for.
```js
var pr = new F.service.Presence();
pr.getStatusForUsers([{ userId: 'a', userId: 'b'}]).then(function(onlineUsers) {
     console.log(onlineUsers[a].isOnline);
});
```

#### PasswordService

The new password service allows you to reset user passwords.
```js
var ps = new F.service.Password();
ps.resetPassword('myuserName@gmail.com', {
    subject: 'Please reset your password'
});
```

#### Misc
- Promise rejection error message formats have been normalized to always have a `type` and `message` where possible.
- Added `normalizeSlashes` utils to remove invalid slashes in url strings

### Bug Fixes:
- Ajax Transport: Fixed bug which prepended username to url when logging in over http


<a name="2.6.0"></a>
#### Bug Fixes:
- World Service: `getCurrentRunId` and `newRunForWorld` calls were ignoring any `files` or `cinFiles` parameters passed in; they now correctly pass it through to the APIs, facilitating building multiplayer Vensim models relying on external files.
- Fixed bug where the muliplayer strategy was prematurely returning a success before a run was actually created. 

### Improvements:
- If you're using `ngrok` for testing your simulation locally, it is now identified as "local" (and defaults to using api.forio.com)

#### Features:
####New DataService methods:
- `getChannel`: returns a subscribable hook to the push channel. This is a convenience wrapper around the `getDataChannel` method of the `ChannelManager`
- `pushToArray`: Adds items to an underlying array structure on a document. See [REST API docs](https://forio.com/epicenter/docs/public/rest_apis/data_api/#adding-data-to-an-existing-array-variable-within-a-collection) for details.

### New Consensus Services
Two new (related) services have been added: `F.service.Consensus` and `F.service.ConsensusGroup`, as well as a helper `worldservice.consensus()` method. 

The Consensus Service allows you to build common features in multiplayer games like:
   - Delaying execution of an operation until all users within a world have 'submitted'
   - Enforcing timed 'rounds' within the game
   - Providing the model with default values for users who haven't submitted

See documentation for [Consensus Service](http://forio.com/epicenter/docs/public/api_adapters/generated/consensus/consensus-service/index.html.md) and [Consensus Group](http://forio.com/epicenter/docs/public/api_adapters/generated/consensus/consensus-group-service/index.html.md) for more details.

### Chores:
- The build process has been switched from browserify to webpack. This should have no visible difference except a slightly smaller bundle size.
- Now that ES6 usage is more common, parts of the codebase has been converted to ES6 and transpiled with Babel.

<a name="2.5.0"></a>
#### Bug Fixes:
- `reuse-last-initialized` strategy used to select the last initialized run even if it was trashed; now it ignores trashed runs.

#### Improvements:
- `reuse-last-initialized`, `reuse-last-unsaved`, `reuse-across-sessions` only query for the last run, instead of querying for every run and picking the last one. Should have no practical impact, except it'll be faster if you have a lot of runs.

#### Features:
- For Vensim models you can now pass in `cinFiles` as an option while creating a run. e.g.

```js
    var rs = new F.service.Run();
    rs.create({
        model: 'hello_world.jl',
        cinFiles: ['a.cin', 'b.cin']
    });
```

<a name="2.4.0"></a>
#### Bug Fixes:
- `AuthManager` incorrectly threw an "Invalid Password" error if you had an account for a project but weren't part of a group. It now correctly throws a `NO_GROUPS` error.

#### Features:
- `AuthManager` now includes a `isLoggedIn` helper method to check if you're currently logged in.
- `AuthManager` now supports logging into Private projects with your author account

- The `RunManager` and `ScenarioManager` now scope cookies by account, project, and model name. This helps differentiate cookies for different projects when you're working locally, and also eases workflow for working with multiple models within a project.
- `reuse-last-initialized` strategy, as well as all the `ScenarioManager` strategies now scope runs by model name.

- `RunService` now includes a `removeFromMemory` method as a performance optimization.
- 
<a name="2.3.1"></a>
#### Bug fixes:
* Fix inconsistent format for `getDataChannel`
Due to a bad falsy check, boolean values used to be incorrectly returned under `data.data` if it was `false` and under `data` for anything else. It's consistently returned under `data` now. Note that this is a **breaking change** if you were relying on the older incorrect format.

* Pass through `userIds` for the `autoAssign` method in the World API Adapter. It was being ignored before. 

<a name="2.3.0"></a>
### 2.3.0 (2017-08-18)

#### Features:
##### The `sessionKey` parameter of the RunManager can now optionally be provided a function instead of a string. 

This is useful if you want to optionally skip setting/over-writing a cookie based on an external flag. For instance, maybe you'd rather not save a cookie while impersonating another user:
```js
new F.manager.RunManager({
    sessionKey: function() {
        var session = window.getSession();
        return (session.isImpersonating) ? false : 'epicenterjs.session';
    }
});
```
  
##### Current session information now includes the `userName` of the currently logged in user.

```js
var am = new F.manager.AuthManager();
var session = am.getCurrentUserSessionInfo();
console.log(session.userName)
```

#### Bug fixes:

##### Scenario Manager: The `advance` operation is now explicitly excluded when cloning. This should be a no-op in most cases, but fixes cases where your base-run is corrupt.

##### Multiplayer strategy fixes:
* Multiplayer strategy correctly returns back a runid, to satisfy the strategy contract
* Run options are now correctly passed through to Multiplayer strategy

##### Fixed a documentation issue where `worldManager.getCurrentRun` incorrectly showed passing in an object instead of a string.


<a name="2.2.1"></a>
### 2.2.1 (2017-05-11)

This is a minor bugfix release. In previous releases, calls to `newRunForWorld` were not correctly picking up the configuration passed in to the WorldService constructor. This has been resolved.


<a name="2.2.0"></a>
### 2.2.0 (2017-03-15)

This is one of our biggest releases of Epicenter.js in a while. It includes:

* Several major changes to the run strategies and Run Manager.
* A new Scenario Manager for working with time-based projects involving run comparisons.
* A new Presence Service for tracking end users status (online, offline) in multiplayer games.
* A change in the jQuery version required.
* Several bug fixes.

### Run Strategy Changes: Consolidating Strategies

Over time we've added a lot of strategies to Epicenter.js to cover different use cases; as our platform grew, some of those strategies became redundant, and made it more difficult to choose which strategy to use. We're addressing this with some efficiency and usability improvements across strategies, namely:

#### Renamed Strategies
The following strategies have been renamed for clarity:

- `persistent-single-player` has been renamed to `reuse-across-sessions`
- `always-new` has been renamed to `reuse-never`
- `new-if-missing` has been renamed to `reuse-per-session`

The older names will continue to work, but may be removed in a future release.

#### Deprecated Strategies

The following strategies are now considered deprecated:

- `new-if-initialized`: All runs now default to being initialized by default, making this redundant.
- `new-if-persisted`: The Run Service now sets a header (the `autoRestore` configuration option) to automatically bring back runs into memory, making this redundant.

You can still use these strategies, but they may not accomplish what you expect, and will be removed in a future release.

#### New 'reuse-last-initialized' Strategy

This release adds a new `reuse-last-initialized` strategy. It is intended to be a more flexible replacement for the `new-if-initialized` strategy (which is now deprecated).

This strategy looks for the most recent run that matches particular criteria; if it cannot find one, it creates a new run and immediately executes a set of "initialization" operations.

@example:

- You have a time-based model and always want the run you're operating on to be at step 10:

```js
    var rm = new F.manager.RunManager({
        strategy: 'reuse-last-initialized',
        strategyOptions: {
            initOperation: [{ step: 10 }]
        }
    })
```

- You have a custom initialization function in your model, and want to make sure it's always executed for new runs.

`strategyOptions` is a field you can generally use to pass options to different strategies; while `reuse-last-initialized` is currently the only strategy which uses it, you can also use this field when creating your own strategies. 

#### Summary

The benefit of this consolidation is that deciding what strategy to use easier than ever:

- `reuse-per-session`: You reuse the same run until each time you use the Authentication Manager to log out; you get a new run the next time you log back in. Useful for projects designed to be completed in a single session.
- `reuse-across-sessions`: You reuse the same run until it is explicitly reset. Useful for projects designed to be played across a multiple sessions.
- `reuse-never`: You get a new run each time you refresh the page.
- `multiplayer`: The only strategy available for multiplayer projects. A run is shared by the end users in a multiplayer world.


### Run Manager Changes

New in this release, there are several changes to the Run Manager, primarily to support Run Strategy changes (described above) and the new Scenario Manager (described below). 

#### `getRun` Allows Populating Run with Variables

The Run Manager's `getRun` function now takes in an array of `variables` as an argument; if provided, it populates the run it gets with the provided variables. 

```js
    rm.getRun(['Price', 'Sales'], function (run) {
        console.log(run.variables.Price, run.variables.Sales);
    });
```

Note: The `getRun` method will *NOT* throw an error if you try to get a variable which doesn't exist. Instead, the variables list is empty, and any errors are logged to the console.

#### Better Validation

The Run Manager now catches common errors, such as passing in invalid strategy names, or missing run options.

#### More Context Available for Strategy Implementations

The original purpose of the Run Manager was to just find the right strategy and call it, leaving all the 'heavy lifting' (e.g. of authentication) to each individual strategy. Now, the Run Manager does more work up front and just passes in the appropriate information to each strategy, namely:

- Each strategy is mandated to have `getRun()` and `reset()` functions. These functions were initially called by the Run Manager with no arguments, but now their signature is:
```js
/**
 + Gets the 'correct' run (the definition of 'correct' depends on strategy implementation)
 + @param  {RunService} runService A Run Service instance for the 'correct' run as determined by the Run Manager
 + @param  {Object} userSession Information about the current user session. See AuthManager#getCurrentUserSession for format
 + @param  {Object} runSession The Run Manager serializes the 'last accessed' run in a cookie and provides it each time `getRun()` is called
 + @return {Promise}             
 */
getRun: function (runService, userSession, runSession){}


/**
 + Resets current run
 + @param  {RunService} runService  A Run Service instance for the 'correct' run as determined by the Run Manager
 + @param  {Object} userSession Information about the current user session. See AuthManager#getCurrentUserSession for format
 + @return {Promise}             
 */
reset: function (runService, userSession){}
```

- The run returned by the `getRun()` method is now serialized and stored in a session by the Run Manager, taking over the burden of session management from the individual strategies. This run is provided as a parameter to the next call to `strategy.getRun()`; the strategy can opt to validate this run (based on run id or any other parameters) and return it, or ignore it altogether depending on its goal.

- Each strategy can register itself as requiring authentication or not (see next section for how to register); if a strategy does so the Run Manager takes care of ensuring there's a valid user session before any of the methods on the strategy are called. This moves the responsibility from the strategy to the Run Manager. The strategy can still opt to handle this itself by not declaring `requiresAuth`, and do its own validation of the `userSession` object which is passed to its `getRun()` and `reset()` methods.


#### F.manager.RunManager.strategies

You can access a list of available strategies via `F.manager.RunManager.strategies.list`. 

This behavior mirrors getting the list through `F.manager.strategy`; however, `F.manager.strategy` is now considered **Deprecated** and may be removed in a future release.

The `F.manager.RunManager.strategies.register()` interface now introduces a new way to register named Run Strategies for use with the Run Manager. Note you can still bypass registering by calling the RunManager with a function, i.e., `new F.manager.RunManager({ strategy: function(){}})`, so this is a backwards compatible change which just additionally allows naming.

See the [run strategies](http://forio.com/epicenter/docs/public/api_adapters/generated/strategies/) page for more on strategies.

### Scenario Manager

This release introduces a new Scenario Manager, accessible as `F.manager.ScenarioManager`. 

Each Scenario Manager allows you to compare the results of several runs. This is mostly useful for time-based models (Vensim, Powersim, SimLang, Stella), but can be adapted to working with other languages as well.

The Scenario Manager can be thought of as a collection of Run Managers with pre-configured strategies. Just as the Run Manager provides use case -based abstractions and utilities for managing the Run Service, the Scenario Manager does the same for the Run Manager. 

There are typically three components to building a run comparison:

- A `current` run in which to make decisions;
- A list of `saved` runs, that is, all runs that you want to use for comparisons;
- A `baseline` run to compare against (optional).

See the [Scenario Manager docs](http://forio.com/epicenter/docs/public/api_adapters/generated/scenario-manager/) for examples and more details.

To satisfy these needs a Scenario Manager instance has three Run Managers:

#### Baseline
```js
var sm = new F.manager.ScenarioManager();
sm.baseline // An instance of a Run Manager with a strategy which locates the most recent baseline run (that is, flagged as `saved` and not `trashed`), or creates a new one.
sm.baseline.reset() // Reset the baseline run. Useful if the model has changed since the baseline run was created.
sm.baseline.getRun() // Typical Run Manager operation which retrieves the baseline run.
```

If you don't need a baseline for your particular case, you can disable auto-creation of baseline runs by passing in `includeBaseline: false` to your Scenario Manager options.

#### Current
```js
var sm = new F.manager.ScenarioManager();
sm.current // An instance of a Run Manager with a strategy which picks up the most recent run (`unsaved` implies a run which hasn't been advanced)
sm.current.reset() // Reset the decisions made on the current run
sm.current.getRun() // Typical Run Manager operation which retrieves the current run
```

The `current` Run Manager also has an additional utility method `saveAndAdvance`. This method clones the current run, then advances and saves this clone (it becomes part of the saved runs list). The current run is unchanged and can continue to be used to store decisions being made by the end user.

#### Saved Runs
```js
var sm = new F.manager.ScenarioManager();
sm.savedRuns // An instance of a Saved Runs Manager
```

The `savedRuns` manager gives you utility functions for dealing with multiple runs (saving, deleting, listing). See [more information on saved runs](http://forio.com/epicenter/docs/public/api_adapters/generated/scenario-manager/saved/), or the [Scenario Manager docs](http://forio.com/epicenter/docs/public/api_adapters/generated/scenario-manager/) for examples and more details.

### Presence Service

The Presence API Service provides methods to get and set the presence of an end user in a project, that is, to indicate whether the end user is online. This happens automatically: in projects that use channels, the end user's presence is published automatically on a "presence" channel that is specific to each group. You can also use the Presence API Service to do this explicitly: you can make a call to indicate that a particular end user is online or offline. See [complete details on the Presence Service](http://forio.com/epicenter/docs/public/api_adapters/generated/presence-api-service/) and also the updated [Epicenter Channel Manager's getPresenceChannel()](http://forio.com/epicenter/docs/public/api_adapters/generated/channels/epicenter-channel-manager/#getpresencechannel).


### jQuery Version Requirements

Starting in [Epicenter.js 2.0](https://github.com/forio/epicenter-js-libs/releases/tag/v2.0), we introduced support for jQuery 3.1.0. Changes are backwards compatible, so you could use either jQuery 2.1.4 (as for previous releases of Epicenter.js) or jQuery 3.1.0.

Epicenter.js 2.2.0 introduces breaking changes, however, so **for Epicenter.js 2.2.0 and later, jQuery 3.1.0 or later is required**.


### Bug Fixes

This release also includes several bug fixes.

#### Run Manager's current instance of the run is always valid/up-to-date.

The 'current run service' of the Run Manager can be accessed through `rm.run`; however, this was buggy in previous releases. This has been fixed. For instance:

```
    var rm = new F.manager.RunManager();
    var id = rm.run.getCurrentConfig().id; //assume id 1
    rm.reset().then(function () {
        var newid = rm.run.getCurrentConfig().id; //should be 2 but used to return 1 before
    })
```

#### `runService.query()` and `runService.filter()` return empty arrays for no results.

Due to a quirk in the Epicenter platform, in previous releases, `runService.query()` and `runService.filter()` returned an array of runs if they found any, or an empty _Object_ (`{}`), if no matching runs existed. These methods now correctly return empty arrays. However, this may be a **Breaking Change** if you were relying on the older behavior.

#### `runService.serial()` and `runService.parallel()` return arrays as callback parameters.

Previously, the callback parameter for `runService.serial()` or `runService.parallel()` contained only the result for the most recently executed operation. Now, the parameter to the callback is an array. Each array element is an object containing the results of one operation.

#### Channel calls respect version

All calls to the cometD channel now respect the versionPath of the rest of the Epicenter.js library.

<a name="2.1.0"></a>
### 2.1.0 (2017-01-25)

This release introduces the WebSocket protocol of the channel manager.

* **Improvement**: Epicenter.js now supports the websockets protocol for the cometd library used in the Channel Manager. 
	* By default, websocket support is enabled. You can change this in the Channel Manager configuration options.
	* When websocket support is enabled, the Channel Manager attempts to connect using websockets, and if it cannot, falls back to using the long poll transport.
* **Bug fix**: Epicenter.js now consistently uses the access token available in `epicenter.token` as part of the Authorization header for calls to the underlying Epicenter RESTful APIs. This was not working for some cases starting in Epicenter.js 1.8.0 but is now resolved.
* **Bug fix**: Epicenter.js now gets its protocol (`http` vs. `https`) from the URL of the page it is being run on.
* **Internal**: The automated test framework is updated; it no longer relies on `bower` and now supports Mac OS X through Sierra.


<a name="2.0.1"></a>
### 2.0.1 (2016-11-18)

This is a minor release, and includes two significant improvements:

* The library file size has been significantly reduced. In particular, `epicenter.min.js` is now less than 90KB.
* Development both in local environments and on custom domains has been streamlined. Previously, there were a few bugs in the checks for localhost and for local sessions/cookies; these have been resolved. 


<a name="2.0"></a>
### 2.0 (2016-09-20)

This is a major release, including several major features and a few bug fixes.

* **New Feature: Introspection**: You can now view a listing of all of the variables and operations (functions) exposed in your model. You can access this through the Introspection Service, or through `introspect` in the Run Service. 

* **New Feature: Epicenter APIs, v2**: New in this release, all calls are now routed to `v2` of the underlying Epicenter APIs. This is largely a transparent change -- probably the biggest difference you'll notice is that Run Ids have a slightly different format; they no longer contain hyphens. Under the hood, runs are now created on a new and improved distributed model service infrastructure, which provides increased stability and improved logging and error reporting.

* **New Feature: jQuery 3.1**: New in this release, you can include jQuery 3.1.0. Changes are backwards compatible, so you can use either jQuery 2.1.4 (as for previous releases of Epicenter.js) or jQuery 3.1.0, but you already be using the newer version of jQuery in your project for other reasons. In particular, jQuery 3 is A+ promises compatible so will play well with ES6 code.

* **Bug Fixes**: 
	* In some cases when multiple end users were logging into a project in the same browser (but not explicitly logging out), the `always-new` strategy was failing to create a new run. This has been corrected.
	* The `AuthManager`'s `logout()` call now correctly removes all managed cookies.


<a name="1.9.0"></a>
### 1.9.0 (2016-07-13)

This release includes improvements to the admin file service and is anticipated to be used internally only -- no customer-facing changes at this time.


<a name="1.8.1"></a>
### 1.8.1 (2016-07-07)

This release fixes a bug introduced 1.8.0. In some cases, when an end user logged in (using the `AuthManager`), the end user's group was not being correctly passed down to the scope of the runs being created by that user. This has been resolved. 


<a name="1.8.0"></a>
### 1.8.0 (2016-06-29)

This release cleans up session handling significantly, including making cookies appropriately specific to account and project.

Improvements:

 - All session information is now stored in a single cookie. The **epicenterjs.session** cookie now defaults to a path of `/app/{account id}/{project id}/`. 
 	* Making it specific to the account and project allows end users to log in to several different projects from the same team without session information being overridden. 
 	* As a developer, if you need to set the cookie path to something else, you can change it explicitly by passing `{ store: { root: 'other/path' } }` to the Authorization Manager.
 - When a user logs in, the access token is now automatically passed to the User, Member, and State API adapters, and to the Channel and Epicenter Channel managers. As a developer, you no longer need to worry about passing tokens once the user is logged in.
 - The Epicenter Channel manager now automatically validates channel names. They must be in the form `/{type}/{account id}/{project id}/{...}`, where `type` is one of `run`, `data`, `user`, `world`, or `chat`. (See the [underlying Push Channel API](https://forio.com/epicenter/docs/public/rest_apis/multiplayer/channel/) for additional details.) You can disable this validation if needed.


Bug Fixes:

 - When automatically splitting long queries into multiple pieces, the pieces were still a little too long for Microsoft Edge when all the URL-encoding was included. This was fixed by shortening the size of the pieces to account for any encoding. 
 - In some situations, the login component generated extraneous errors in the console. This has been fixed.


<a name="1.7.1"></a>
### 1.7.1 (2016-04-12)

- Bug fixes for the API configuration feature introduced in 1.7.0: make sure we first search for the API configuration on the current server; if it's not available, default to api.forio.com. This allows Epicenter.js to more easily be used on multiple Epicenter installations (not just forio.com), but still provides flexibility for local development.
- Upgraded test framework (sinon) version.

<a name="1.7.0"></a>
### 1.7.0 (2016-04-11)

 - The API configuration (that is, where the REST API calls should be sent) is now loaded from the server, rather than hard-coded in the library. This allows Epicenter.js to more easily be used on multiple Epicenter installations (not just forio.com).
 - In the Authorization Manager, improve how the path in the cookie is set to make local development easier. This is an extension of the improvement in v1.6.4. 


<a name="1.6.4"></a>
### 1.6.4 (2016-02-26)
 - In the Authorization Manager, set the path in the cookie based on the account and project name. This allows end users to log in to multiple Epicenter simulations at once without conflict.


<a name="1.6.3"></a>
### 1.6.3 (2016-02-24)
 - Updates for the [run strategies](https://forio.com/epicenter/docs/public/api_adapters/strategy/) to use group name rather than group id to create runs with specific scope. 
 - Addition of the `Auto-Restore` header to the Variables API Service `query()` call; previously it had only been set for the `load()` call. This header means that runs are automatically pulled from the Epicenter backend database into memory (and replayed) when they are queried. A run must be in memory in order to update model variables or call model operations.
 - Clean up of the Authentication API Service `logout()` call; it no longer calls the (unsupported) Epicenter delete. 
 - Documentation improvements, including more information on running Epicenter projects locally and additional examples when using Asset API Adapter.

<a name="1.6.2"></a>
### 1.6.2 (2015-12-29)
- Internal refactoring to add support for version numbers in upcoming Epicenter APIs.
- Bare-bones implementation of `F.service.File` to get contents of any file in your project. Used by Flow Inspector.

<a name="1.6.1"></a>
### 1.6.1 (2015-12-02)
Bug Fixes:
- State API Service did not allow you to pass in an `exclude` filter before, now it does
- Fixed issue with the `splitGet` feature in the previous release which broke up large Ajax requests.

<a name="1.6.0"></a>
## 1.6.0 (2015-11-17)
Features:
- The libraries now include an Asset Service (mapping to the underlying REST Asset API) to allow end-users manage files within projects.
- Run Service now auto-restores runs which go out of memory (#132). You can turn this off by setting `autoRestore` to `false. See https://forio.com/epicenter/docs/public/run_persistence for more information on Run Persistence.
- Run Service now automatically breaks apart long URLs into multiple GETs behind the scenes. Browsers typically have a URL length limit of 2048 characters, and it's easy to bump into that for GETs with lots of variables. There should be no change in behavior as a result of this change (#123).
- Run Service now supports `id` as an alias to `filter` as part of the options, to be more semantic you're only working with a single run.
- World Service: delete() now takes in an optional world id as first param #56
- World Service now supports `id` as an alias to `filter` as part of the options, to be more semantic you're only working with a single world.
- World Manager now takes in the model from the `run` if you don't specify it as part of the `world`.

Bug Fixes:
- Run manager sets cookie path to `/` if you're running it locally - this fixes an issue where cookies were never set locally and you always got a new run if you refreshed.

<a name="1.5.0"></a>
## 1.5.0 (2015-06-10)

Features:
- The World Service now has a `load` method, similar to the `Run` and `Data` services.

- We now have a 'presence channel' to get online/offline notifications for multiplayer worlds. Usage:
``` javascript
var presenceChannel = cm.getPresenceChannel(worldObject);
presenceChannel.on('presence', function (evt, notification) {
    console.log(notification); //Notification will be an object with { userId: StringID, online: Boolean }
});
```

This is currently implemented all client-side, and data will be correct to within 24 seconds. An upcoming epicenter update will make this happen much faster.

- You can now subscribe to Data API updates through the cometd channel. Usage:

```
var datachannel = cm.getDataChannel(collectionName);
datachannel.subscribe('', function (data, meta) {
    //data is the actual content added, meta  is of the form {path: nestedPathOfContentAdded, subType: 'new/update/delete', date: date}
date
}
```
You can only subscribe to top-level items (i.e. collections) currently, so the first parameter to `subscribe` should always be blank.

Bugs:
- RunManager: Fixed a bug with invalid session-cookie-names with the Persistent Single Player strategy

<a name="1.4.2"></a>
### 1.4.2 (2015-05-15)
Bug Fixes:
- Strategy creation was broken in the last release due to an invalid cookie name. If you use 1.4.1 you'd have always gotten a new run.
- Login component now properly re-enables the login button on invalid logins
- Fixed issue in assignment component where UI broke if the user didn't have a last name
- Fix bug in `newRunForWorld` in the World Service

<a name="1.4.1"></a>
### 1.4.1 (2015-04-15)
Features:
- Added `load` to F.Service.World. This works like the `load` on other services; use when you have a world id and want to construct a World Object with that
- This release adds a `components` folder to the distribution. The only production-ready component is the `login` component, but more components will be added later - components are meant to be "plug and play" applications using the libraries to solve common use-cases.

Bug Fixes:
- Fixed issue where `group` wasn't being sent as a scope to the Run Service by some strategies
- World Service now takes in `account` and `project` from the url if not provided explicitly on instatiation
- The `ChannelManager` has now been updated with better jsdocs

<a name="1.4.0"></a>
## 1.4.0 (2015-03-19)
Features:
- Added Member (F.service.Member) and State (F.service.State) services. This is mostly for internal use by other services, but use 'em if you need 'em.
- `WorldManager` now allows deleting/ resetting the run associated with the World
- If you've been using the `AuthManager` on `localhost` you might've noticed issues with cookies. There's no good way to handle cookies with `localhost` so the recommened way to develop is to change your vhosts to point localhost to `local.forio.com` and use that instead. If you do this, all requests will now automatically be routed to `api.forio.com` without having to specify it under the `server` tag.
- Slightly better validation and error messages for the World service and the WorldManager.

Bug fixes:
- Sourcemaps should now work as they should, and are also bundled separately from source-files. Thanks to conversion from browserify2->browserify + uglify.
- The `AuthManager` was not passing an authorization header to the Member API. Epicenter tightened permissions, so this broke. If you've been having login issues this is the version to use.
- The `game` REST Endpoint is now called `world`. This change should not impact any simulations using the libraries, except that runs created with older games, will no longer show up through the libraries.


<a name="1.3.0"></a>
## 1.3.0 (2015-02-05)
Multiplayer Game Manager

A run is a collection of end user interactions with a project and its model -- including setting variables, making decisions, and calling operations. For building multiplayer games you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.

The **World API Adapter** allows you to create, access, and manipulate multiplayer worlds within your Epicenter project. You can use this to add and remove end users from the world, and to create, access, and remove their runs. See http://forio.com/epicenter/docs/public/api_adapters/generated/world-api-adapter/ for additional background and documentation of methods and configuration options.

The **World Manager** provides an easy way to track and access the current world and run for particular end users. See http://forio.com/epicenter/docs/public/api_adapters/generated/world-manager/ for additional background and documentation of methods and configuration options.


<a name="1.2.0"></a>
## 1.2.0 (2015-01-30)
Authentication Manager and components.

This release provides support for managing user authentication, especially for [end users](http://forio.com/epicenter/docs/public/glossary/#users) of [authenticated](http://forio.com/epicenter/docs/public/glossary/#access) Epicenter projects.

#### Authentication API Service
The Authentication API Service provides methods for logging in and logging out. On login, this service creates and returns a user access token. (User access tokens are required for each call to Epicenter.) Details available here: http://forio.com/epicenter/docs/public/api_adapters/generated/auth/auth-service/

#### Authorization Manager

The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects. Details available here: http://forio.com/epicenter/docs/public/api_adapters/generated/auth/auth-manager/

#### Login Component

In addition to the epicenter.js library itself, the Epicenter JS Libs project now includes reusable components. These HTML, CSS, and JS files are templates you can use to perform common actions. They can be copied directly to your Epicenter project, often without modification.

The Login Component provides a login form for team members and end users of your project. Includes a group selector for end users that are members of multiple groups.

Details are available in GitHub: https://github.com/forio/epicenter-js-libs/tree/master/src/components/ and also in the Epicenter documentation: http://forio.com/epicenter/docs/public/api_adapters/#components

<a name="1.1.2"></a>
### 1.1.2 (2014-10-17)

Bug-fixes to the run manager

<a name="1.1.1"></a>
### 1.1.1 (2014-10-02)

Bug-fix to prevent passing in run-ids while creating a run

<a name="1.1.0"></a>
## 1.1.0 (2014-09-29)

- Epicenter.js now includes the Run Manager and the Scenario Manager (documentation pending)

<a name="1.0.2"></a>
## 1.0.2 (2014-09-22)
- Build process generates `epicenter.js` (un-minified concatenated file) in addition to `epicenter.min.js`
- Fixed bug where transport option for `complete` was not being passed through on Run API Service
- You can now set default transport options for Run Service and over-ride on a per-call level. For e.g.,

```javascript
var originalComplete = sinon.spy();
var complete = sinon.spy();
var rs = new RunService({account: 'forio', project: 'js-libs', transport: {complete: originalComplete}});
rs.create('model.jl', {complete: complete});

originalComplete.should.not.have.been.called;
complete.should.have.been.called;
```


<a name="1.0.1"></a>
## 1.0.1 (2014-09-09)

Changed the default token to `epicenter.project.token` from `epicenter.token`. This is to prevent conflicts for users who're logged into Epicenter through the manager. Use cases:

User logged into Epicenter, but not into project:
 - `epicenter.token` is set by Manager and passed along to all the APIs

 User logged into Epicenter, and also into project:
 - `epicenter.project.token` is also sent as an Authorization header, which overrides `epicenter.token`. In other words, project privileges override default epicenter privileges

 User not logged into Epicenter, but logged into project:
 - Authorization header is sent and respected
