---
title: "API Adapters"
layout: "default"
isPage: true
---

##API Adapters: epicenter.js

The Epicenter API Adapters are part of the epicenter.js library. This library abstracts the underlying Epicenter RESTful APIs into a set of services and utilities.

If you are comfortable with JavaScript, the epicenter.js library is an easy way to connect your project's [model](../writing_your_model/), [data](../data_api/), and [user interface](../creating_your_interface).

* [Concepts in epicenter.js](#concepts)
* [Using epicenter.js](#using-epicenter-js)
	* [Including](#include)
	* [Accessing](#access)
	* [Examples of usage: Callbacks and promises](#example)
	* [Configuration options](#configuration)


<a name="concepts"></a>
###Concepts in epicenter.js

The epicenter.js library is a set of services and managers to help streamline your work with the underlying Epicenter APIs.

* The [Run Service](./generated/run-api-service/), [Data Service](./generated/data-service/), [Auth Service](./generated/auth-api-service), and [Variables Service](./generated/variables-api-service/) are direct adaptations of the underlying [Run](../aggregate_run_api/), [Data](../data_api/), [Authentication](../project_access/), and [Variable](../model_apis/variable/) RESTful APIs.

* The [Run Manager](./generated/run-manager/) adds functionality on top of the Run Service. Specifically, the Run Manager gives you control over run creation depending on run state. You can select run creation [stratgies](./strategy/) (rules) for which runs end users of your project work with when they log in to your project. 


<a name="using-epicenter-js"></a>
###Using epicenter.js

<a name="include"></a>
####Including
The epicenter.js library is available from our CDN: [cdn-common.forio.com/js-libs/1.1.2/epicenter.min.js](https://cdn-common.forio.com/js-libs/1.1.2/epicenter.min.js). To use it in your project, simply add

    <script src="https://cdn-common.forio.com/js-libs/1.1.2/epicenter.min.js"></script>

into any of your [interface](../creating_your_interface/) files (e.g. .html and .js files).

The epicenter.js library depends on jQuery, so you'll also need to download jQuery for yourself, or use a hosted version. To use a hosted version, add

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>


<a name="access"></a>
####Accessing

Within your interface file, each service can be accessed using the `F` namespace.

For example:

    var rm = new F.service.RunManager();

<a name="example"></a>
####Examples of usage: Callbacks and Promises

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
            rm.serial(['initialize_inputs', 'calculate_input_totals', 'forecast_monthly_profit'], null, {
                success: function(data) {
                    displayUI(data, function () {
                        hideLoadingScreen(function () {
                            rm.variables().load('profit_histogram');
                        });
                    });
                },
                error: function() {
                    console.log('Oops! Something went wrong with the operations');
                }
            });
        }
    });

Callbacks work well for one-off operations, but can become difficult to follow when used for a longer sequence of steps.

**Promises**

Every service call returns a promise. All services support the [jQuery Deferred Object functions](http://api.jquery.com/category/deferred-object/), including the following most common functions:

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

See for example [this blog](http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/) for more background on how promises work in JavaScript.

<a name="configuration"></a>
####Configuration options

Every service takes in a configuration options object as the last parameter. This optional parameter allows you to override any of the default configuration options.

Default configuration options are described for each service on the service reference page. You can override them when you create a service object, and again whenever you make a call.
