## Channel Manager

There are two main use cases for the channel: event notifications and chat messages.

If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) rather than this more generic Channel Manager. (The Epicenter Channel Manager is a wrapper that instantiates a Channel Manager with Epicenter-specific defaults.) The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use. 

However, you can work directly with the Channel Manager if you like. (This might be useful if you are working through Node.js, for example, `require('manager/channel-manager')`.)

The Channel Manager is a wrapper around the default [cometd JavaScript library](http://docs.cometd.org/2/reference/javascript.html), `$.cometd`. It provides a few nice features that `$.cometd` doesn't, including:

* Automatic re-subscription to channels if you lose your connection
* Online / Offline notifications
* 'Events' for cometd notifications (instead of having to listen on specific meta channels)

You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Manager. (See [Including Epicenter.js](../../#include).)

To use the Channel Manager in client-side JavaScript, instantiate the [Epicenter Channel Manager](../epicenter-channel-manager/), get a particular channel -- that is, an instance of a [Channel Service](../channel-service/) -- then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.

```js
var cm = new F.manager.ChannelManager();
var gc = cm.getGroupChannel();
// because we used an Epicenter Channel Manager to get the group channel,
// subscribe() and publish() here default to the base topic for the group;
gc.subscribe('', function(data) { console.log(data); });
gc.publish('', { message: 'a new message to the group' });
```

