## Run API Service

The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.

When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly. This is because the Run Manager (and associated [run strategies](../strategies/)) gives you control over run creation depending on run states.

The Run API Service is useful for building an interface where you want to show data across multiple runs (this is easy using the `filter()` and `query()` methods). For instance, you would probably use a Run Service to build a page for a facilitator. This is because a facilitator typically wants to evaluate performance from multiple end users, each of whom have been working with their own run.

To use the Run API Service, instantiate it by passing in:
`account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
`project`: Epicenter project id.

If you know in advance that you would like to work with particular, existing run(s), you can optionally pass in:

`filter`: (Optional) Criteria by which to filter for existing runs. 
`id`: (Optional) The run id of an existing run. This is a convenience alias for using filter, in the case where you only want to work with one run.

For example:

```js
var rs = new F.service.Run({
    account: 'acme-simulations',
    project: 'supply-chain-game',
});
rs.create('supply_chain_game.py').then(function(run) {
    rs.do('someOperation');
});
```

Additionally, all API calls take in an `options` object as the last parameter. The options can be used to extend/override the Run API Service defaults listed below. In particular, passing `{ id: 'a-run-id' }` in this `options` object allows you to make calls to an existing run.

Note that in addition to the `account`, `project`, and `model`, the Run Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).

```js
var rm = new F.manager.RunManager({
    run: {
        account: 'acme-simulations',
        project: 'supply-chain-game',
        model: 'supply_chain_game.py',
        server: { host: 'api.forio.com' }
    }
});
rm.getRun()
    .then(function(run) {
        // the RunManager.run contains the instantiated Run Service,
        // so any Run Service method is valid here
        var rs = rm.run;
        rs.do('someOperation');
    });
```