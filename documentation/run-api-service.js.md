

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

###onSuccess
Called when the call completes successfully *

###onError
Called when the call fails *

###onComplete
Called when the call completes, regardless of success or failure *

###onProgress
Called at any significant point in the progress of the call, usually before and after server requests *

##Methods

###query
Parameters to filter the list of runs by

- qs: {Object} Query

- limit: {Object} | page | sort @see <TBD>

###filter
Similar to query, except merges parameters instead of over-writing them

- filter: {Object} 

- limit: {Object} | page | sort @see <TBD>

###load
Get data for a specific run

- runID: {String} 

- filters: {Object} 

###variables
Returns a variables object

- variableSet: {String} (Optional)

- filters: {Object} (Optional)

###save
Save attributes on the run

- attributes: {Object} Run attributes to save

###do
Call an operation on the model

- operation: {String} Name of operation

- params: {*} (Optional) Any parameters the operation takes

###serial
Call a bunch of operations in serial

- operations: {Array<string>} List of operations

- params: {params} Parameters for each operation

###parallel
Executes operations in parallel

- operations: {Array|Object} List of operations and arguments (if object)

