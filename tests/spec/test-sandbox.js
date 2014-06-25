(function() {

/* ********** Auth API Service ************************** */

/*
	var auth = new F.service.Auth({account: 'first-team', project: 'hello_world_aggpublic2', logLevel: 'DEBUG', server: {host: 'api.epicenter-stable.foriodev.com'}});
	auth.login('mjonesJune2@forio.com', 'passw0rd')
		.then(function() {
			//auth.getToken();
			//auth.logout();
			//auth.getUserInfo();
		});
*/

/* ********** Variables API Service ************************** */

	/*
	var rs = new F.service.Run({account: 'first-team', project: 'hello_world_aggpublic2', logLevel: 'DEBUG', server: {host: 'api.epicenter-stable.foriodev.com'}});
	rs.create('hello_world.jl')
		.then(function() {
			var vs = rs.variables();
			//PASS
			//vs.save({sample_int: 4});
			//PASS
			//vs.save({sample_int: 5, sample_string: 'goodbye world'});
			//PASS
			//vs.load('sample_int');
			//PASS, returns an object with sample_int, sample_string, and their values
			//vs.query({include:['sample_int', 'sample_string']});
			//PASS, same as above
			//vs.query(['sample_int', 'sample_string']);
		});
	*/

/* ********** Data API Service ************************** */
	//var ds = new F.service.Data({account: 'first-team', project: 'hello_world_aggpublic2', logLevel: 'DEBUG', server: {host: 'api.epicenter-stable.foriodev.com'}, root: 'survey-responses'});


/* data.query */
	// should return array of all elements of root collection 
	//PASS.
	//ds.query(); 

	//PASS. (note that actual query is to /user1/?q=undefined)
	//ds.query('user1');

	// should return array of matching documents from root collection
	// in our case, with just user1, b/c user2.question2 = 8 and xxx.question2 = 9
	//PASS
	//ds.query('',{'question2': {'$gt': 9}}); 
		// note that ds.query('',{'question2': '>9'}) purposely searches for string '>9'
	//PASS
	//ds.query('', {'question2': 9});

	//should return just user2
	//PASS
	//ds.query('', {'$and': [ {'question2': {'$lt':10}}, {'question3': false}]});


/* data.saveAs */
	//PASS - basic
	//ds.saveAs('user1', {'question1': 2, 'question2': 10, 'question3': false, 'question4': 'sometimes'} );
	//ds.saveAs('user2', {'question1': 3, 'question2': 8, 'question3': true, 'question4': 'always'} );

	//PASS - replace whole user2 document
	//ds.saveAs('user2', {'question1': 3, 'question2': 8, 'question3': false, 'question4': 'always'} );  
	
	//future release only --MJ add improvement
	//ds.saveAs('user2/question1', 4);

	//note: can't add multiple documents at once (put can in regular data api) --MJ add improvement

	//note: can we add to arrays w/ post? see regular data api/post --MJ add improvement

/* data.save */
	//PASS: autogenerate document id
	//ds.save({'question1': 4, 'question2': 9, 'question3': true, 'question4': 'never'});

/* data.load */
	//PASS
	//ds.load('user1');
	//ds.load('user1/question3');
	//KNOWN FAIL -- data api doesn't support paging yet
	//ds.load('',{startrecord: 2, endrecord:3});

/* data.remove */
	//PASS
	//ds.remove('1723c98e-fc93-11e3-9c87-5254007910b2');


/* ********** Run API Service ************************** */

	var rs = new F.service.Run({account: 'first-team', project: 'hello_world_aggpublic2', logLevel: 'DEBUG', server: {host: 'api.epicenter-stable.foriodev.com'}});

	/* run.load */
	//PASS. look up in Postman and see change from true --> false and back as edit below
	//rs.load('9ff68251-a47f-4c24-9c82-d9e117d2a212').then(function() {rs.save({saved: true})});
	//PASS
	//rs.load('9ff68251-a47f-4c24-9c82-d9e117d2a212', {include: '.sample_int'});
	//PASS
	//rs.load('9ff68251-a47f-4c24-9c82-d9e117d2a212', {include: 'sample_int'});
	//FAILS, only includes one (is this the design?)
	//rs.load('67d5d05a-6a9c-459e-acc2-18d74c8f925c', {include: 'sample_int', include: 'sample_string'});
	//PASS
	//rs.load('c3c3d8d6-05a8-46f3-8179-2c0da3b935bb', {include: 'sample_int,sample_string'});


	/* run.create */
	//PASS, HOWEVER -- no user in run record. probably ok for this test b/c public sim, no user. but, need to check other use cases. TODO:Naren.
	//rs.create('hello_world.jl');


	/* run.query */
	//PASS
	//rs.query({'saved': true});
	//PASS
	//rs.query({}, {startrecord: 2, endrecord: 3}) 
	//PASS
	//rs.query({'saved': false}, {startrecord: 2, endrecord: 3, sort: 'id', direction: 'desc'})
	//PASS
	//rs.query({'saved': false, '.sample_int': '>5'});
	//rs.query({'saved': false, 'sample_int': 11}); //searching for top-level data in run called "sample_int"
	//rs.query({'.sample_int': 11});
	//rs.query({'saved': true, '.sample_int': '>=12'});
	//UNTESTED (pending chaining)
	//rs.query({'saved': false, '.sample_int': '>10'}).query({'saved': true});
	//UNTESTED (pending chaining)
	//rs.filter({'saved': false}).filter{'.sample_int': '>10'}


	/* run.save */
	//rs.load('d2e88bc0-f33d-4f4f-9526-ccdbb0601d09');
	//PASS
	//rs.save({saved: true, variables: {sample_int: 20}});
	//rs.save({variables: {sample_int: 18}});
	//PASS
	//rs.save({variables: {'sample_string': 'hi again, world'}});	
	//PASS (SLOW). it takes a little bit to see this in the lookup.
	//rs.save({'sample_string': 'goodbye, world'});
	//FAIL. Naren is fixing.
	//rs.save({'.sample_int': 35});

	/* run.filter */
	//PASS
	//rs.filter({'saved': true});
	//rs.filter({'saved': false, '.sample_int': '>5'});

	/* run.do */
	//PASS. 
	//rs.load('d7962759-7d35-4175-8b59-2864f2f00338').then(function() {rs.do('init', [4])});
	//FAILS. is treating "name" as the method name. 
	//rs.load('c3c3d8d6-05a8-46f3-8179-2c0da3b935bb').then(function() {rs.do({name: 'init', params: [3]} )});
	//PASS
	//rs.load('c3c3d8d6-05a8-46f3-8179-2c0da3b935bb').then(function() {rs.do('addone')});

	/* run.serial */
	//PASS (presumably -- both functions called, but I haven't confirmed which is called first)
	//rs.load('3c38e165-dc72-4474-8e47-ae5ce6547474').then(function() {rs.serial(['addone', 'addone'])});
	//expecting FAIL. retest after "name" bug above is fixed.
	//rs.load('ID').then(function() {rs.serial( [ {name: 'addone', params: []}, {name: 'init', params: [4]}] )});

	/* run.parallel */
	//PASS
	//rs.load('3c38e165-dc72-4474-8e47-ae5ce6547474').then(function() {rs.parallel(['addone','addone'])});
	//expecting FAIL. retest after "name" bug above is fixed.
	//rs.load('ID').then(function() {rs.parallel({init: [3], addone: []})});
	//rs.load('ID').then(function() {rs.parallel([ {name: 'addone', params: []}, {name: 'init', params: [4]}])});

	/* run.variables */
	//PASS
	//rs.load('c3c3d8d6-05a8-46f3-8179-2c0da3b935bb');
	//var vs = rs.variables();
	//vs.load('sample_int');

})();
