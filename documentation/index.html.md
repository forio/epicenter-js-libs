---
title: "Epicenter.js: API Adapters"
layout: "default"
isPage: true
---

##Epicenter.js: API Adapters

The Epicenter API Adapters are part of the epicenter.js library. This library abstracts the underlying Epicenter RESTful APIs into a set of services and utilities.

If you are comfortable with JavaScript, the epicenter.js library is an easy way to connect your project's [model](../writing_your_model/), [data](../rest_apis/data_api/), and [user interface](../creating_your_interface).

* [Concepts in epicenter.js](#concepts)
* [Using epicenter.js](#using-epicenter-js)
	* [Including](#include)
	* [Provided Components](#components)
	* [Accessing](#access)
	* [Examples of usage: Callbacks and promises](#example)
	* [Configuration options](#configuration)

**The current version of Epicenter.js is 1.4**. See the [Including](#include) section below. You can also view the history of releases on <a href="https://github.com/forio/epicenter-js-libs/releases/" target="_blank">GitHub</a>.

<a name="concepts"></a>
###Concepts in Epicenter.js

The epicenter.js library is a set of services (adapters) and managers to help streamline your work with the underlying Epicenter APIs. 

Services encapsulate the [Epicenter REST APIs](../rest_apis/). Managers are responsible for configuring, sequencing, and synchronizing services to perform common application tasks. For example, the [Run Manager](./generated/run-manager/) lets you use different [run creation strategies](./strategy/) and returns a pre-configured [Run Service](./generated/run-api-service/) you can then use.

In most cases you'll work with the managers directly:

* [Authorization Manager](./generated/auth-manager/): The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
* [Run Manager](./generated/run-manager/): The Run Manager gives you control over run creation depending on run state. You can select run creation [strategies](./strategy/) (rules) for which runs end users of your project work with when they log in to your project. 
* [World Manager](./generated/world-manager/): For building multiplayer games you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases. The World Manager provides an easy way to track and access the current world and run for particular end users.
* [Epicenter Channel Manager](./generated/epicenter-channel-manager/) (and the underlying [Channel Manager](./generated/channel-manager/)): Once you've created "[worlds](../glossary/#world)" with the World Manager, you often want end users in each world to be able to communicate: to talk with each other (e.g. a user-to-user chat feature), or to receive updates when something changes in their world (e.g. variables associated with their shared run are updated). The Epicenter Channel Manager provides a publish/subscribe channel using cometd.


Although in most cases you'll work with the managers directly, the services are also available if you just want to communicate with the underlying [RESTful APIs](../rest_apis/):

* [Auth Service](./generated/auth-api-service)
* [Channel Service](./generated/channel-service/)
* [Run Service](./generated/run-api-service/)
* [Variables Service](./generated/variables-api-service/)
* [World Adapter](./generated/world-api-adapter/)
* [Data Service](./generated/data-api-service/)



<a name="using-epicenter-js"></a>
###Using Epicenter.js

<a name="include"></a>
####Including

**Epicenter.js**

The epicenter.js library is available from our tools: <a href="https://forio.com/tools/js-libs/1.4.0/epicenter.min.js" target="_blank">https://forio.com/tools/js-libs/1.4.0/epicenter.min.js</a>. To use it in your project, simply add

    <script src="https://forio.com/tools/js-libs/1.4.0/epicenter.min.js"></script>

into any of your [interface](../creating_your_interface/) files (e.g. .html and .js files).

**Dependencies**

The epicenter.js library depends on jQuery, so you'll also need to download jQuery for yourself, or use a hosted version. To use a hosted version, add

    <script src="//ajax.googleapis.com/ajax/libs/jquery/2.2/jquery.min.js"></script>

**Extensions**

If you are building a [multiplayer game](../glossary/#world), you'll also need to include the epicenter-multiplayer-dependencies.js library. This is available from our tools: <a href="https://forio.com/tools/js-libs/1.4.0/epicenter-multiplayer-dependencies.js" target="_blank">https://forio.com/tools/js-libs/1.4.0/epicenter-multiplayer-dependencies.js</a>. To use it in your project, simply add

	<script src="https://forio.com/tools/js-libs/1.4.0/epicenter-multiplayer-dependencies.js"></script>

into any of your [interface](../creating_your_interface/) files (e.g. .html and .js files).

<a name="components"></a>
####Provided Components

In addition to the epicenter.js library itself, the Epicenter JS Libs project also includes reusable components. These HTML, CSS, and JS files are templates you can use to perform common actions. They can be copied directly to your project, often without modification.

**Login Component**

Provides a login form for team members and end users of your project. Includes a group selector for end users that are members of multiple groups.

* `index.html`: The login form.
* `login.css`: Provides styling for the group selector pop over dialog.
* `login.js`: Uses the [Authorization Manager](./generated/auth-manager/) to log in users.
	
The login component is available from <a href="https://github.com/forio/epicenter-js-libs/tree/master/src/components/" target="_blank">GitHub</a>.

**Assignment Component**

Provides a form for automatically assigning end users to [worlds](../glossary/#world), for multiplayer projects. Includes the ability to set the number of end users per world, assign and unassign end users, and mark certain end users as inactive (e.g. if they are not present on the day the simulation game play is occurring). These features are all available within the Epicenter interface (see [Multiplayer Settings](../updating_your_settings/#multiplayer) and [Multiplayer Assignment](../groups_and_end_users/#multiplayer-assignment)); this component allows you to easily add them to your project. For example, this way a facilitator could make the end user assignments to worlds in your project's user interface, without needing to log into Epicenter directly.

* `index.html`: The form for automatic end user assignment to worlds.
* `assignment.css`: Styles and icons used in the form.
* `js/`: Uses the [World API Adapter](./generated/world-api-adapter/) while assigning end users to worlds. 
* `templates/`: HTML for creating rows (read-only and editable) for the assigned users.

The assignment component is available from <a href="https://github.com/forio/epicenter-js-libs/tree/master/src/components/" target="_blank">GitHub</a>.

<a name="access"></a>
####Accessing

Within your interface file, each service can be accessed using the `F` namespace.

For example:

    var rm = new F.service.RunManager();

<a name="example"></a>
####Examples of Usage: Callbacks and Promises

There are two different patterns for using the service adapters: using callbacks or using promises.

**Callbacks**

All services take in an ["options" configuration object](#configuration) as the final parameter. Among other things, the options object contains the following properties:

* `success`: Called when the call completes successfully
* `error`: Called when the call fails
* `complete`: Called when the the call completes, regardless of success or failure
* `progress`: Called at any significant point in the progress of the call, usually before and after server requests

For example, you might write a sequence of operations using callbacks:

    var rm = new F.service.RunManager({
    	run: {
        	account: 'myTeamId',
        	project: 'sales_forecaster',
        	model: 'sales_forecaster.jl'
        }
    });
    rm.getRun({
        success: function() {
            rm.getRun(function(run) {
            	run.serial(
            		['initialize_inputs', 'calculate_input_totals', 'forecast_monthly_profit'], 
            		null, 
            		{ success: function(data) {
                        displayUI(data, function () {
                            hideLoadingScreen(function () {
                                run.variables().load('profit_histogram');
                            });
                        });
                      },
                      error: function() {
                        console.log('Oops! Something went wrong with the operations');
                      }
                	}
                )
            });
        }
    });

Callbacks work well for one-off operations, but can become difficult to follow when used for a longer sequence of steps.

**Promises**

Every service call returns a promise. All services support the <a href="http://api.jquery.com/category/deferred-object/" target="_blank">jQuery Deferred Object functions</a>, including the following most common functions:

* `then`: Add handlers to be called when the object is resolved, rejected, or still in progress
* `done`: Add handlers to be called when the object is resolved
* `fail`: Add handlers to be called when the object is rejected

For example, you might write the same sequence of operations as above using promises:

	var rm = new F.service.RunManager({
		run: {
		    account: 'myTeamId',
	    	project: 'sales_forecaster',
	    	model: 'sales_forecaster.jl'
	    }
	});
	rm.getRun()
	    .then(function(run) {
	        run.serial(['initialize_inputs', 'calculate_input_totals', 'forecast_monthly_profit'])
	            .then(displayUI)
	            .then(hideLoadingScreen)
	            .then(function () {
	                run.variables().load('profit_histogram');
	            })
	            .fail(function() {
	                console.log('Oops! Something went wrong with the operations');
	            });
	    });

See for example <a href="http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/" target="_blank">this blog</a> for more background on how promises work in JavaScript.

<a name="configuration"></a>
####Configuration Options

Every service takes in a configuration options object as the last parameter. This optional parameter allows you to override any of the default configuration options.

Default configuration options are described for each service on the service reference page. You can override them when you create a service object, and again whenever you make a call.
