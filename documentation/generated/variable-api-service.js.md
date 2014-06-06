

#variable-api-service

<!-- module desc -->

variables-api

To be usually used in conjunction with the Run API Service, though can also be used stand-alone if paired with the right run

```
 
 var rs = require('service/run-api-service')
 var vs = require('service/variable-api-service')({runFilter: rs.create();})

```

##Configuration Options

###runFilter
The runs object to apply the variable filters to

##Methods

###get
Get values for a variable

- Variable: {String} to get

````

vs.get('price');

````

###query
Parameters to filter the list of runs by

- Query: {String} 

````

vs.query(['Price', 'Sales'])

vs.query({set: 'variableSet', include:['price', 'sales']});

vs.query({set: ['set1', 'set2'], include:['price', 'sales']});

````

###save
Save values to the api. Over-writes whatever is on there currently

- variables: {Object} 

````

vs.save({price: 4, quantity: 5, products: [2,3,4]})

````

###merge
Save values to the api. Merges arrays, but otherwise same as save

- variables: {Object} 

````

vs.merge({price: 4, quantity: 5, products: [2,3,4]})

````

