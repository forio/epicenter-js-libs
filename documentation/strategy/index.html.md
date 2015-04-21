---
title: Run Manager Strategies
layout: "default"
isPage: true
---

## Run Manager Strategies

The [Run Manager](../generated/run-manager/) gives you control over run creation, depending on run state. You can select run creation stratgies (rules) for which runs end users of your project work with when they log in to your project.

There are several strategies included in epicenter.js:

* [always-new](#always-new)
* [multiplayer](#multiplayer)
* [new-if-persisted](#new-if-persisted)
* [new-if-missing](#new-if-missing)
* [new-if-initialized](#new-if-initialized)
* [none](#none)
* [persistent-single-player](#persistent-single-player)

You can also [create your own](#create-your-own).


<a name="always-new"></a>
#### always-new

The `always-new` strategy always creates a new run for this end user irrespective of current state. This is equivalent to calling `F.service.Run.create()` from the [Run Service](../generated/run-api-service/) every time. 

This strategy means that every time your end users refresh their browsers, they get a new run. 

This strategy can be useful for basic, single-page projects. This strategy is also useful for prototyping or project development: it creates a new run each time you refresh the page, and you can easily check the outputs of the model. However, typically you will use one of the other strategies for a production project.


<a name="multiplayer"></a>
#### multiplayer

The `multiplayer` strategy is for use with [multiplayer worlds](../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../generated/world-api-adapter/).

Using this strategy means that end users in projects with multiplayer worlds always see the most current run and world. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.


<a name="new-if-persisted"></a>
#### new-if-persisted

The `new-if-persisted` strategy creates a new run when the current one becomes persisted (end user is idle for a set period), but otherwise uses the current one. 

Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. 

However, if they are idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../updating_your_settings/)), then their run is persisted; the next time they interact with the project, they will get a new run. (See more background on [Run Persistence](../../run_persistence/).)

This strategy is useful for multi-page projects where end users play through a simulation in one sitting, stepping through the model sequentially (for example, a Vensim model that uses the `step` operation) or calling specific functions until the model is "complete." However, you will need  to guarantee that your end users will remain engaged with the project from beginning to end &mdash; or at least, if they are idle for longer than the **Model Session Timeout**, that it is okay for them to start the project from scratch (with an uninitialized model). 

Specifically, the strategy is:

* Check the `sessionKey` cookie.
	* This cookie is set by the [Run Manager](../generated/run-manager/) and configurable through its options.
	* If the cookie exists, check whether the run is in memory or only persisted in the database. 
		* If the run is in memory, use the run.
		* If the run is only persisted (and not still in memory), create a new run for this end user. 
	* If the cookie does not exist, create a new run for this end user.


<a name="new-if-missing"></a>
#### new-if-missing

The `new-if-missing` strategy creates a new run when the current one is not in the browser cookie.

Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run.

This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model that is stepped to the end as soon as it is created). In other words, you care whether you have a run, but as long as you have one, you are certain that this run is the one you are interested in. 

Specifically, the strategy is:

* Check the `sessionKey` cookie.
	* This cookie is set by the [Run Manager](../generated/run-manager/) and configurable through its options. 
	* If the cookie exists, use the run id stored there. 
	* If the cookie does not exist, create a new run for this end user. 


<a name="new-if-initialized"></a>
#### new-if-initialized

The `new-if-initialized` strategy creates a new run if the current one is in memory or has its `initialized` field set to `true`. The `initialized` field in the run record is automatically set to `true` at run creation for Vensim models; it can be set manually for other models.

This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model is stepped to the end). It is very similar to the `new-if-missing` strategy, except that it additionally checks a field of the run record. 

Specifically, the strategy is:

* Check the `sessionKey` cookie. 
	* This cookie is set by the [Run Manager](../generated/run-manager/) and configurable through its options.
	* If the cookie exists, check whether the run is in memory or only persisted in the database. Additionally, check whether the run's `initialized` field is `true`. 
		* If the run is in memory, use the run.
		* If the run's `initialized` field is `true`, use the run.
		* If the run is only persisted (and not still in memory), and it is not `initialized`, create a new run for this end user.
	* If the cookie does not exist, create a new run for this end user.


<a name="none"></a>
#### none

The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../generated/run-api-service/).

This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance. 

Also, this strategy is necessary if you are working with a multiplayer project and using the [World Manager](../generated/world-manager/) &mdash; or other, similar situations where you do not have direct control over creating the [Run Service](../generated/run-api-service/) instance.


<a name="persistent-single-player"></a>
#### persistent-single-player

The `persistent-single-player` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.

This strategy is useful if your project executes your model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end). It is useful if end users play with your project for an extended period of time, possibly over several sessions.

Specifically, the strategy is:

* Check if there are any runs for this end user.
	* If there are no runs (either in memory or in the database), create a new one.
	* If there are runs, take the latest (most recent) one.
		* If the most recent run is currently in the database, bring it back into memory so that the end user can continue working with it. (See more background on [Run Persistence](../../run_persistence/), or read more on the underlying [State API](../../rest_apis/other_apis/model_apis/state/) for bringing runs from the database back into memory.) 


<a name="create-your-own"></a>
#### Create your own

You can create your own strategy by passing in a function in the `strategy` parameter to the `F.manager.RunManager()` instantiation call. 

Strategy functions must return a boolean value for whether or not to create a new run.

