## Run Manager Strategies

The [Run Manager](../run-manager/) gives you control over run creation, depending on run state. You can select run creation strategies (rules) for which runs end users of your project work with when they log in to your project.

There are several strategies included in Epicenter.js:
<% docs.forEach((doc)=> { %>
* [<%= doc.name %>](#<%= doc.name %>)<% }) %>

You can also [create your own strategy](#create-your-own) and see [more details on working with Run Strategies](#working-with-run-strategies).
<% docs.forEach((doc)=> { %>
#### <%= doc.name %>
<%= doc.description || (doc.type_declaration && doc.type_declaration[0] && doc.type_declaration[0].description) %>
<% if (doc.constructorOptionsTable) { %> 
##### Strategy Options
<%= doc.constructorOptionsTable %><% } %>
<% }) %>
### Create your Own

You can create your own strategy by passing in a function as the `strategy` parameter to the `F.manager.RunManager()` instantiation call. Strategy functions must return objects of the form:

```js
{
    getRun: function() {},
    reset: function() {}
}
```

Some strategies have options you can specify through `strategyOptions` in the [Run Manager](../run-manager/). If you create your own strategy, this options object is passed in to your strategy function constructor. 

For example:
```js
// example create-your-own strategy provides a new run every minute
var ConditionalStrategy = F.manager.RunManager.strategies.byName('conditional-creation');
var myNewStrategy = new ConditionalStrategy(function (run, headers, usersession, runsession) { 
    var created = (new Date(run.created)).valueOf();
    var timeAgo = Date.now() - created;
    var runLifetime = 1;
    var minsAgo = timeAgo / (1000 * 60);
    return minsAgo > runLifetime;
});

var rm = new F.manager.RunManager({
    strategy: myNewStrategy,
    run: { ... }
});
```
### Working with Run Strategies

You can access a list of available strategies using `F.manager.RunManager.strategies.list`. You can also ask for a particular strategy by name.

If you decide to [create your own run strategy](#create-your-own), you can register your strategy. Registering your strategy means that:

* You can pass the strategy by name to a Run Manager (as opposed to passing the strategy function): `new F.manager.RunManager({ strategy: 'mynewname'})`.
* You can pass configuration options to your strategy.
* You can specify whether or not your strategy requires authorization (a valid user session) to work.
