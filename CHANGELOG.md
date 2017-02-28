<a name="2.2.0"></a>
### 2.2.0 (2017-03-01)

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

**Examples**:

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

The Presence API Service provides methods to get and set the presence of an end user in a project, that is, to indicate whether the end user is online. This can be done explicitly: you can make a call, using this service, to indicate that a particular end user is online or offline. This is also done automatically: in projects that use channels, the end user's presence is published automatically on a "presence" channel that is specific to each group. See [complete details on the Presence Service](http://forio.com/epicenter/docs/public/api_adapters/generated/presence-api-service/) and also the updated [Epicenter Channel Manager's getPresenceChannel()](http://forio.com/epicenter/docs/public/api_adapters/generated/epicenter-channel-manager/#getpresencechannel).


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
The Authentication API Service provides methods for logging in and logging out. On login, this service creates and returns a user access token. (User access tokens are required for each call to Epicenter.) Details available here: http://forio.com/epicenter/docs/public/api_adapters/generated/auth-api-service/

#### Authorization Manager

The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects. Details available here: http://forio.com/epicenter/docs/public/api_adapters/generated/auth-manager/

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
