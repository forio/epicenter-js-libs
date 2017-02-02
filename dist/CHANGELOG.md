
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
