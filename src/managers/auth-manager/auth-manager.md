## Authorization Manager

The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.

The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).

#### Using the Authorization Manager

To use the Authorization Manager, instantiate it. Then, make calls to any of the methods you need:

```js
var authMgr = new F.manager.AuthManager({
   account: 'acme-simulations',
   userName: 'enduser1',
   password: 'passw0rd'
});
authMgr.login().then(function () {
   authMgr.getCurrentUserSessionInfo();
});
```

If you prefer starting from a template, the Epicenter JS Libs [Login Component](../../#components) uses the Authorization Manager as well. This sample HTML page (and associated CSS and JS files) provides a login form for team members and end users of your project. It also includes a group selector for end users that are members of multiple groups.