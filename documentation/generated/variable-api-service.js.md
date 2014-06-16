

#variable-api-service

<!-- module desc -->

variable-api

To be usually used in conjunction with the Run API Service, though can also be used stand-alone if paired with the right run

```
 
 var rs = require('service/run-api-service')
 var vs = require('service/variable-api-service')({runService: rs.create();})

```

##Configuration Options

###runService
The runs object to apply the variable filters to

##Methods

###load
Get values for a variable

- Variable: {String} to load

- filters: {Object} filters & op modifiers

- options: {object} Overrides for configuration options

````

vs.load('price');

````

###query
Parameters to filter the list of runs by

- |: {Object} Array} Query

- filters: {Object} filters & op modifiers

- options: {object} Overrides for configuration options

````

vs.query(['Price', 'Sales'])

vs.query({set: 'variableSet', include:['price', 'sales']});

vs.query({set: ['set1', 'set2'], include:['price', 'sales']});

````

###save
Save values to the api. Over-writes whatever is on there currently

- variable: {Object|String} Object with attributes, or string key

- val: {Object} Optional if prev parameter was a string, set value here

- options: {object} Overrides for configuration options

````

vs.save({price: 4, quantity: 5, products: [2,3,4]})

vs.save('price', 4);

````

###merge
Save values to the api. Merges arrays, but otherwise same as save

- variable: {Object|String} Object with attributes, or string key

- val: {Object} Optional if prev parameter was a string, set value here

- options: {object} Overrides for configuration options

````

vs.merge({price: 4, quantity: 5, products: [2,3,4]})

vs.merge('price', 4);

````

