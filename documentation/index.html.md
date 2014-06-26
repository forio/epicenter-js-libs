---
title: "API Adapters"
layout: "default"
isPage: true
---

##API Adapters

The Epicenter API Adapters are a JavaScript library that abstracts the underlying Epicenter RESTful APIs ([Run](../aggregate_run_api/), [Data](../data_api/), and [Model](../model_apis/)) into a set of services and utilities. 

If you are most comfortable with JavaScript, this library is the easiest way to connect your project's [model](../writing_your_model/) and [user interface](../creating_your_interface).

This overview highlights some information common to working with all of the API Adapters, including some [example code](#example). For details on particular services, select the service reference page from the left.


###Using API Adapters

####Including
The Epicenter API Adapters library is available from our CDN: [cdn-common.forio.com/js-libs/1.0/epicenter.min.js](https://cdn-common.forio.com/js-libs/1.0/epicenter.min.js). To use it in your project, simply add

	<script src="https://cdn-common.forio.com/js-libs/1.0/epicenter.min.js"></script>
	
into any of your [interface](../creating_your_interface/) files (e.g. .html and .js files). 

The Epicenter API Adapters library depends on jQuery, so you'll also need to download jQuery for yourself, or use a hosted version. To use a hosted version, add

	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>


####Accessing

Within your interface file, each service can be accessed using the `F` namespace. 

For example:

	var rs = F.service.Run();

<a name="example"></a>
####Examples of usage: Callbacks and Promises

Often the best way to get started is by looking at some example code. Within Epicenter, you can [create a new project](../project_admin/) and select to use one of the example projects. Each example project is written using the Epicenter API Adapters.

There are two different patterns for using the service adapters: using callbacks or using promises. The example projects use promises.

**Callbacks**

All services take in an ["options" configuration object](#configuration) as the final parameter. Among other things, the options object contains the following properties:

* `onSuccess`: Called when the call completes successfully
* `onError`: Called when the call fails
* `onComplete`: Called when the the call completes, regardless of success or failure
* `onProgress`: Called at any significant point in the progress of the call, usually before and after server requests

For example, you might write a sequence of operations using callbacks:

	var rs = new F.service.Run({
		account: 'myTeamId', 
		project: 'sales_forecaster'
	});
	rs.create({'sales_forecaster.jl'}, {
	    onSuccess: function (data, $run){
	        $run.do('initialize_inputs', {
	            onSuccess: function (data, $run){
	                $run.do('calculate_input_totals', {
	                    onSuccess: function (data, $run){
	                        $run.do('forecast_monthly_profit', {
	                        	onSuccess: function (data, $run){
	                        		var vs = $run.variables();
        							vs.load('profit_histogram'); 
	                        	}
	                        });
	                    }
	                });
	            }
	        });
	    }
	});	

Callbacks work well for one-off operations, but can become difficult to follow when used for a longer sequence of steps as in the example above.

**Promises**

Every service call returns a promise. All services support the [jQuery Deferred Object functions](http://api.jquery.com/category/deferred-object/), including the following most common functions: 

* `then`: Add handlers to be called when the object is resolved, rejected, or still in progress
* `done`: Add handlers to be called when the object is resolved

For example, you might write the same sequence of operations as above using promises:

	var rs = new F.service.Run({
		account: 'myTeamId', 
		project: 'sales_forecaster'
	});
	rs.create('sales_forecaster.jl')
      .then(function() { rs.do('initialize_inputs'); })
      .then(function() { rs.do('calculate_input_totals'); })
      .then(function() { rs.do('forecast_monthly_profit'); })
      .done(function() {
        var vs = rs.variables();
        vs.load('profit_histogram');
      });

See for example [this blog](http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/) for more background on how promises work in JavaScript.


<a name="configuration"></a>
####Configuration Options

Every service takes in a configuration options object as the last parameter. This optional parameter allows you to override any of the default configuration options.

Default configuration options are described for each service on the service reference page. You can override them when you create a service object, and again whenever you make a call. 
