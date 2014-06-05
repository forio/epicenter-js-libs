

#configuration-service

<!-- module desc -->

@class ConfigurationService

All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment

```
 
 var cs = require('configuration-service')({
 dev: { //environment
 port: 3000,
 host: 'localhost',
 },
 prod: {
 port: 8080,
 host: 'api.forio.com',
 logLevel: 'none'
 },
 logLevel: 'DEBUG' //global
 });
 
 cs.get('logLevel'); //returns 'DEBUG'
 
 cs.setEnv('dev');
 cs.get('logLevel'); //returns 'DEBUG'
 
 cs.setEnv('prod');
 cs.get('logLevel'); //returns 'none'

```

##Configuration Options

##Methods

###setEnv
Set the environment key to get configuration options from

- env: {String} 

###get
Get configuration.

- property: {String} optional

###set
Set configuration.

- key: {String|Object} if a key is provided, set a key to that value. Otherwise merge object with current config

- value: {*} value for provided key

