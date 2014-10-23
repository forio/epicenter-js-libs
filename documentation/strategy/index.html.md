---
title: Run Manager Strategies
layout: "default"
isPage: true
---

## Run Manager Strategies

The [Run Manager](../generated/run-manager/) gives you control over run creation, depending on run state. You can select run creation stratgies (rules) for which runs end users of your project work with when they log in to your project.

There are several strategies included in epicenter.js:

* [always-new](#always-new)
* [new-if-persisted](#new-if-persisted)
* [new-if-missing](#new-if-missing)
* [new-if-simulated](#new-if-simulated)

You can also [create your own](#create-your-own).


<a name="always-new"></a>
#### always-new

The `always-new` strategy always creates a new run for this end user. This is equivalent to calling `F.service.Run.create()` every time. 

This strategy is useful for single-page projects, if you can guarantee both: 

* that your end users will never refresh their browsers, and

* that your end users will remain engaged with the project from beginning to end, that is, they will never be idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../../updating_your_settings/)). 

This strategy is also sometimes useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model is stepped to the end).


<a name="new-if-persisted"></a>
#### new-if-persisted

The `new-if-persisted` strategy creates a new run when the current one becomes persisted (user is idle for a set period), but otherwise uses the current one. 

Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. 

However, if they are idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../../updating_your_settings/)), then their run is persisted; the next time they interact with the project, they will get a new run. (See more background on [Run Persistence](../../../run_persistence/).) 

This strategy is useful for multi-page projects, if you can guarantee that your end users will remain engaged with the project from beginning to end &mdash; or at least, if they are idle for longer than the **Model Session Timeout**, that it is okay for them to start the project from scratch (with an uninitialized model). 

This strategy is often used in projects where end users play through a simulation in one sitting, stepping through the model sequentially (e.g. Vensim 'step') or calling specific functions until the model is "complete." 

Specifically, the strategy is:

* Check the `sessionKey` cookie. 
	* If the cookie exists, check whether the run is in memory or only persisted in the database. 
		* If the run is in memory, use the run.
		* If the run is only persisted (and not still in memory), create a new run for this end user. 
	* If the cookie does not exist, create a new run for this end user.


<a name="new-if-missing"></a>
#### new-if-missing

The `new-if-missing` strategy creates a new run when the current one is not in the browser cookie. 

This strategy is similar to `new-if-persisted` except that it does not bother to check where the run is stored (memory or database). 

Like the `new-if-persisted` strategy, this strategy is useful for multi-page projects where end users play through a simulation in one sitting, stepping through the model sequentially (e.g. Vensim 'step') or calling specific functions until the model is "complete." 

Specifically, the strategy is:

* Check the `epicenter-scenario` cookie. 
	* If the cookie exists, use the run id stored there. 
	* If the cookie does not exist, create a new run for this end user. 


<a name="new-if-simulated"></a>
#### new-if-simulated

The `new-if-simulated` strategy creates a new run if the current one is in memory or has its `initialized` field set to `true`. This field in the run record is automatically set to `true` at run creation for Vensim models; it can be set manually for other models. 

This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model is stepped to the end). 

Specifically, the strategy is:

* Check the `epicenter-scenario` cookie. 
	* If the cookie exists, check whether the run is in memory or only persisted in the database. Additionally, check whether the run's `initialized` field is `true`. 
		* If the run is in memory, use the run.
		* If the run's `initialized` field is `true`, use the run.
		* If the run is only persisted (and not still in memory), and it is not `initialized`, create a new run for this end user.
	* If the cookie does not exist, create a new run for this end user.


<a name="create-your-own"></a>
#### Create your own

Additionally, you can create your own strategy by passing in a function in the `strategy` parameter to the `F.manager.RunManager()` instantiation call. 

Strategy functions must return a boolean value for whether or not to create a new run.
