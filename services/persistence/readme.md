#Persistence



#Persistence Services

Implements all of underscore's methods natively

- query
-

##Usage:
    var dataService = require('persistence/cookie-service')(options);

    dataService.save('person', {firstName: 'john', lastName: 'smith'});
    dataService.get('person').then(function (person) {
        console.log(person.firstName === 'john'); //true
    });
    dataService.exists('person').then(function(isExisting){
        console.log(isExisting); //true
    });
    dataService.remove('person');

    dataService.remove('key')


    var errorHandler = function() {
        console.log('Something blew up!');
        };
    dataService.config('error', errorHandler);
    dataService.config({
        error: errorHandler,
        progress: progressHandler,
        root: 'people'
        })

    dataService.config('root') === 'people'; //true

##TODOs
    ? Implement https://github.com/crcn/sift.js for querying? Skip this for Data API but use for everything else instead?
    ? Implement data api as an adapter for https://github.com/brianleroux/lawnchair


var ds = require('data-service')({
    env: 'dev'
});
var people = ds.config({root: 'people'});
people
    .query({name: 'naren'})
    .save({lastName: 'ranjit'})
    .done(function() {
        console.log('Queried and saved!')
    });



var run = run({saved=true,account=mit}) -> Run object
    run.variables({price='<5'})

or

run.query({saved:tue, account:mit}).getVariables().query({price = '<4'});
run.query({saved: true, account:mit, variables: { price = '<4'}})

var op = require('operations-service');
    op.do('solve').then(function () {
        console.log('solved');
    });

var run = require('runs-service');
    run.operations.do('solve');
    run.operation('solve')
