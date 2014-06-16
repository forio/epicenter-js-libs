

#data-api-persistence-service

<!-- module desc -->

Data API Service

```
 
 var people = require('data-service')({root: 'people'});
 people
 .query({firstName: 'john'})
 .save({lastName: 'smith'})
 .done(function(data) {
 console.log('Queried and saved!')
 });

```

##Configuration Options

###root
Name of collection

###token
For operations which require authentication, pass in token

###destroy
Removes collection being referenced

##Methods

###query
Query collection; uses MongoDB syntax

- qs: {String} Query Filter

- limiters: {String} @see <TBD: url for limits, paging etc>

````

ds.query(

{name: 'John', className: 'CSC101'},

{limit: 10}

)

````

###save
Save values to the server

- key: {String|Object} If given a key save values under it, if given an object directly, save to top-level api

- value: {Object} (Optional)

````

ds.save('person', {firstName: 'john', lastName: 'smith'});

ds.save({name:'smith', age:'32'});

````

###remove
Removes key from collection

- key: {String} key to remove

````

ds.remove('person');

````

