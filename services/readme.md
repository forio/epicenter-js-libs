
##Configuration

All services take in a configuration object as the first parameter. i.e.

var rs = require('runs-service')({
    logLevel: 'debug',
    onComplete: function (){
        console.log('service complete')
    }
});


var cs = require('config-service')(
    dev: { //environment
         port: 3000,
         host: 'localhost',
     },
     prod: {
         port: 8080,
         host: 'api.forio.com',
         logLevel: 'none'
     },
);
var rs = require('runs-service')(cs);

Any options passed in here are assumed to be globally applicable to any future calls to the service.

Instead of passing in an object you can also pass in a @ConfigurationService instance if you'd like to change configuration based on the environment (i.e., different configurations based on dev or production instances)

These configuration options can also be over-ridden on a per-call basis

i.e., you could do

rs
    .create({model: 'model.jl'},
        {onComplete: function() { console.log('Over-riding the base completion')}})
