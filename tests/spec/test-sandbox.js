(function() {

	/* auth */
	//ERRORS: Uncaught ReferenceError: require is not defined
	/*
	var auth = require('authentication-service')();
	console.log(auth.login('mjonesJune2@forio.com', 'passw0rd'));

	console.log(auth.getToken());
	*/

/* ********** Run API Service ************************** */

	var rs = F.service.Run({account: 'first-team', project: 'hello_world', model: 'hello_world.jl', logLevel: 'DEBUG', server: {host: 'api.epicenter-stable.foriodev.com'}});

	/* run.load */
	//PASS. look up in Postman and see change from true --> false and back as edit below
	//rs.load('82f0aee8-16c7-480e-a7ad-ac5826fe2740').then(function() {rs.save({saved: false})});
	
	//FAIL, the "." here should work as an alternate format, pending Unicorn-1130.
	//rs.load('9626632a-36b2-4930-822c-4faaf1bc3a38', {include: '.sample_int'});
	
	//PASS
	//rs.load('9626632a-36b2-4930-822c-4faaf1bc3a38', {include: 'sample_int'});


	/* run.create */
	//PASS, HOWEVER -- no user in run record. probably ok for this test b/c public sim, no user. but, need to check other use cases. TODO:Naren.
	//TODO:Molly -- fix docs, no "model" needed here.
	//rs.create('hello_world.jl');


	/* run.query */
	//PASS
	//rs.query({'saved': false});

	//PASS, but TODO:Molly -- fix docs.
	//rs.query({}, {startrecord: 2, endrecord: 3}) 
	//PASS
	//rs.query({'saved': false}, {startrecord: 2, endrecord: 3})

	//Retest -- ONLY PERSISTED VARs. but, watch for Unicorn-1131.
	//rs.query({'saved': true, 'sample_int': 10});
	//rs.query({'saved': true, 'sample_int': 15});
	//rs.query({'sample_int': 15});
	//rs.query({'saved': true, '.sample_int': '>10'}); //TODO:Naren -- the query string here should not have "=" in it.
	//UNTESTED (pending chaining)
	//rs.query({'saved': false, '.sample_int': '>10'}).query({'saved': true});
	//UNTESTED (pending chaining)
	//rs.filter({'saved': false}).filter{'.sample_int': '>10'}

	/* run.save */
	//rs.load('eee8c8fb-60db-41cb-bdcc-ba611cb00b5a');
	//PASS
	//rs.save({saved: true, variables: {sample_int: 13}});
	//PASS
	//rs.save({variables: {'sample_string': 'hi again, world'}});	
	//RETEST. Possibly failing, possibly pending Unicorn-1124 (?), possibly adding to top level and not visible.
	//rs.save({'sample_string': 'goodbye, world'});

})();
