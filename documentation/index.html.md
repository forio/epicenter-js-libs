---
title: "API Adapters"
layout: "default"
isPage: true
---

##API Adapters

The Epicenter API Adapters are a JavaScript library that abstracts the underlying RESTful APIs ([Run](../aggregate_run_api/), [Data](../data_api/), and [Model](../model_apis/)) into a set of services and utilities. 

If you are most comfortable with JavaScript, this library is probably the easiest way to connect your project's model and user interface.

This overview highlights some information common to working with all of the API Adapaters. For details on particular services, select the reference page from the left.

###Using API Adapters

####Including
The Epicenter API Adapters library is available [here](TODO). To use it in your project, simply add

	TODO-pending CDN info
	
into any of your [interface](../creating_your_interface/) files (e.g. .html and .js files). 

The Epicenter API Adapters library depends on TODO (jQuery?), so you'll also need to add

	<script src = "TODOjquery?.js"></script>


####Accessing

Within your interface file, each service can be accessed using the `F` namespace. 

For example:

	var rs = F.service.Run()
	
is equivalent to

	var rs = require('run-service')


####Patterns of usage: Callbacks and Promises

There are two different patterns for using the service adapters: using callbacks or using promises.

**Callbacks**

All services take in an ["options" configuration object](#configuration) as the final parameter. Among other things, the options object contains the following properties:

* `onSuccess`: Called when the call completes successfully
* `onError`: Called when the call fails
* `onComplete`: Called when the the call completes, regardless of success or failure
* `onProgress`: Called at any significant point in the progress of the call, usually before and after server requests

For example, you might write a sequence of operations using callbacks:

	var RunService = F.service.Run; 
	var rs = new RunService({account: 'myTeamId', project: 'hello_world'});
	rs.create({model: 'hello_world.jl'}, {
	    onSuccess: function (data, $run) {
	        console.log('Run Created');
	        $run.do("initialize",  {
	            onSuccess: function (data, $run){
	                console.log('Initialized');
	                $run.do("add", [1,2], {
	                    onSuccess: function (data, $run){
	                        console.log('1 + 2 is', data);
	                    }
	                });
	            }
	        });
	    }
	});	

Callbacks work well for one-off operations, but can become difficult to follow when used for a longer sequence of steps as in the example above.

**Promises**

Every service call returns a promise, and the service calls can also be chained. All services support the [jQuery Deferred Object functions](http://api.jquery.com/category/deferred-object/), including the following most common functions: 

* `then`: Add handlers to be called when the object is resolved, rejected, or still in progress
* `done`: Add handlers to be called when the object is resolved

For example, you might write the same sequence of operations as above using promises:

	var RunService = F.service.Run; 
	var rs = new RunService({account: 'myTeamId', project: 'hello_world'});
	rs.create({model: 'hello_world.jl'})
	  .do('initialize')
      .then(function () { console.log('initialized'); })
      .do('add', [1,2])
      .done(function (data, $run){
        console.log('1 + 2 is', data);
      });

See for example [this blog](http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/) for more details on how promises work in JavaScript.


<a name="configuration"></a>
####Configuration Options

Every service takes in a configuration options object as the last parameter. This optional parameter allows you to override any of the default configuration options.

Default configuration options are described for each service on the service reference page. You can override them when you create a service object, and again whenever you make a call. 


<!-- TODO -->
<!--
<a name="filters"></a>
####Filters and Operation Modifiers

Many of the service methods take an optional `filters` parameter. 

<a name="paging"></a>
####Paging 

Limit, paging, etc. ... 

-->