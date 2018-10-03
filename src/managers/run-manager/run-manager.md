## Run Manager

The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../strategies/) for which runs end users of your project work with when they log in to your project.

There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/) and the RESFTful [Run API](../../../rest_apis/aggregate_run_api). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified.

### Using the Run Manager to create and access runs

After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.

```js
const rm = new F.manager.RunManager({
    run: {
        account: 'acme-simulations',
        project: 'supply-chain-game',
        model: 'supply-chain-model.jl',
        server: { host: 'api.forio.com' }
    },
    strategy: 'reuse-never',
    sessionKey: 'epicenter-session'
});
rm.getRun()
    .then(function(run) {
        // the return value of getRun() is a run object
        const thisRunId = run.id;
        // the RunManager.run also contains the instantiated Run Service,
        // so any Run Service method is valid here
        rm.run.do('runModel');
})
```

### Using the Run Manager to access and register strategies

The `strategy` for a Run Manager describes when to create a new run and when to reuse an end user's existing run. The Run Manager is responsible for passing a strategy everything it might need to determine the 'correct' run, that is, how to find the best existing run and how to decide when to create a new run.

There are several common strategies provided as part of Epicenter.js, which you can list by accessing `F.manager.RunManager.strategies`. You can also create your own strategies, and register them to use with Run Managers. See [Run Manager Strategies](../strategies/) for details.