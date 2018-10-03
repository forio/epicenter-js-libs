## World Manager

As discussed under the [World API Adapter](../world-api-adapter/), a [run](../../../glossary/#run) is a collection of end user interactions with a project and its model. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.

The World Manager provides an easy way to track and access the current world and run for particular end users. It is typically used in pages that end users will interact with. (The related [World API Adapter](../world-api-adapter/) handles creating multiplayer worlds, and adding and removing end users and runs from a world. Because of this, typically the World Adapter is used for facilitator pages in your project.)

### Using the World Manager

When you instantiate a World Manager, the world's account id, project id, and group are automatically taken from the session (thanks to the [Authentication Service](../auth/auth-service)).

Note that the World Manager does *not* create worlds automatically. (This is different than the [Run Manager](../run-manager).) However, you can pass in specific options to any runs created by the manager, using a `run` object.

For example:

```js
var wMgr = new F.manager.WorldManager({
    account: 'acme-simulations',
    project: 'supply-chain-game',
    run: { model: 'supply-chain.py' },
    group: 'team1'
});

wMgr.getCurrentRun();
```