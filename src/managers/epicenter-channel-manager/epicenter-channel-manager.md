 ## Epicenter Channel Manager

 The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world).

 <a name="background"></a>
 ### Channel Background

 Channel notifications are only available for [team projects](../../../glossary/#team). There are two main use cases for the push channel: event notifications and chat messages.

 #### Event Notifications

 Within a [multiplayer simulation or world](../../../glossary/#world), it is often useful for your project's [model](../../../writing_your_model/) to alert the [user interface (browser)](../../../creating_your_interface/) that something new has happened.

 Usually, this "something new" is an event within the project, group, or world, such as:

 * An end user comes online (logs in) or goes offline. (This is especially interesting in a multiplayer world; only available if you have [enabled authorization](../../../updating_your_settings/#general-settings) for the channel.)
 * An end user is assigned to a world.
 * An end user updates a variable / makes a decision.
 * An end user creates or updates data stored in the [Data API](../data-api-service/).
 * An operation (method) is called. (This is especially interesting if the model is advanced, for instance, the Vensim `step` operation is called.)

 When these events occur, you often want to have the user interface for one or more end users automatically update with new information.

 #### Chat Messages

 Another reason to use the push channel is to allow players (end users) to send chat messages to other players, and to have those messages appear immediately.

 #### Getting Started

 For both the event notification and chat message use cases:

 * First, enable channel notifications for your project.
      * Channel notifications are only available for [team projects](../../../glossary/#team). To enable notifications for your project, [update your project settings](../../../updating_your_settings/#general-settings) to turn on the **Push Channel** setting, and optionally require authorization for the channel.
 * Then, instantiate an Epicenter Channel Manager.
 * Next, get the channel with the scope you want (user, world, group, data).
 * Finally, use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.

 Here's an example of those last three steps (instantiate, get channel, subscribe):

```js
 var cm = new F.manager.ChannelManager();
 var gc = cm.getGroupChannel();
 gc.subscribe('', function(data) { console.log(data); });
 gc.publish('', { message: 'a new message to the group' });
```
 For a more detailed example, see a [complete publish and subscribe example](../../../rest_apis/multiplayer/channel/#epijs-example).

 For details on what data is published automatically to which channels, see [Automatic Publishing of Events](../../../rest_apis/multiplayer/channel/#publish-message-auto).

 #### Creating an Epicenter Channel Manager

 The Epicenter Channel Manager is a wrapper around the (more generic) [Channel Manager](../channel-manager/), to instantiate it with Epicenter-specific defaults. If you are interested in including a notification or chat feature in your project, using an Epicenter Channel Manager is the easiest way to get started.

 You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Epicenter Channel Manager. See [Including Epicenter.js](../../#include).