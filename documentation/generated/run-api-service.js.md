

#run-api-service

<!-- module desc -->

All API calls take in an "options" object as the last parameter. The options can be used to extend/override whatever was provided as the API Defaults

```
 
 var rs = require('run-service')({
 
 });

```

##Configuration Options

###token
For operations which require authentication, pass in token

###model
Model file to create the run with

###account
Account to create the run in

###project
Project to create the run in

###success
Called when the call completes successfully *

###error
Called when the call fails *

###complete
Called when the call completes, regardless of success or failure *

###progress
Called at any significant point in the progress of the call, usually before and after server requests *

##Methods

###create
Create a new run

- qs: {Object} Query

- options: {object} Overrides for configuration options

````

rs.create({

model: 'model.jl'

})

````

###query
Parameters to filter the list of runs by

- qs: {Object} Query

- limit: {Object} | page | sort @see <TBD>

- options: {object} Overrides for configuration options

````

rs.query({

'saved': 'true',

'.price': '>1'

}, // All Matrix parameters

{

limit: 5,

page: 2

}); //All Querystring params

````

###filter
Similar to query, except merges parameters instead of over-writing them

- filter: {Object} 

- limit: {Object} | page | sort @see <TBD>

- options: {object} Overrides for configuration options

````

rs.query({

saved: true

}) //Get all saved runs

.filter({

'.price': '>1'

}) //Get all saved runs with price > 1

.filter({

'user': 'john'

}) //Get all saved runs with price > 1 belonging to user John

````

###load
Get data for a specific run

- runID: {String} 

- filters: {Object} & op modifiers

- options: {object} Overrides for configuration options

````

rs.get('<runid>', {include: '.score', set: 'xyz'});

````

###save
Save attributes on the run

- attributes: {Object} Run attributes to save

- options: {object} Overrides for configuration options

````

rs.save({completed: true});

rs.save({saved: true, variables: {a: 23, b: 23}});

rs.save({saved: true, '.a': 23, '.b': 23}}); //equivalent to above

````

###variable
Returns a variable object

- variableSet: {String} (Optional)

- filters: {Object} (Optional)

- outputModifier: {Object} Options to include as part of the query string @see <TBD>

- options: {object} Overrides for configuration options

````

rs.variable(["Price", "Sales"])

rs.variable()

````

###do
Call an operation on the model

- operation: {String} Name of operation

- params: {*} (Optional) Any parameters the operation takes

- options: {object} Overrides for configuration options

````

rs.do('solve');

rs.do('add', [1,2]);

rs.do({name:'add', arguments:[2,4]})

````

###serial
Call a bunch of operations in serial

- operations: {Array<string>} List of operations

- params: {params} Parameters for each operation

- options: {object} Overrides for configuration options

````

rs.serial(['initialize', 'solve', 'reset']);

rs.serial([{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]});

````

###parallel
Executes operations in parallel

- operations: {Array|Object} List of operations and arguments (if object)

- options: {object} Overrides for configuration options

````

rs.parallel({add: [1,2], subtract: [2,4]});

rs.parallel([{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]});

rs.parallel(['solve', 'reset']);

````

