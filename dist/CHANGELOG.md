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
