## Channel Service

The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.

If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) directly. The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use.

The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.

You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. See [Including Epicenter.js](../../#include).

To use the Channel Service, instantiate it, then make calls to any of the methods you need.

```js
var cs = new F.service.Channel();
cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
```
If you are working through the [Epicenter Channel Manager](../epicenter-channel-manager/), when you ask to "get" a particular channel, you are really asking for an instance of the Channel Service with a topic already set, for example to the appropriate group or world:

```js
var cm = new F.manager.ChannelManager();
var gc = cm.getGroupChannel();
// because we used an Epicenter Channel Manager to get the group channel,
// subscribe() and publish() here default to the base topic for the group
gc.subscribe('', function(data) { console.log(data); });
gc.publish('', { message: 'a new message to the group' });
```