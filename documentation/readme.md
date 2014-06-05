
## CommonJS & Globals
Every Epicenter service/utility is also a CommonJS module (http://dailyjs.com/2010/10/18/modules/). This means this can be used directly within Node, or within the browser using tools like Browserify.

If you prefer not to use CommonJS, or if the Browserify library is not available for your project, the libraries can also be accessed using the F namespace.

var rs = require('run-service')

is equivalent to

var rs = F.RunService()



## Call-backs and promises

There are two different patterns for using the service adapters  - using callbacks or using promises

### Callbacks
All services take in an "options" object as the final parameter. Among other things, the options object contains the following properties:

onSuccess /** Called when the call completes successfully **/

onError /** Called when the call fails **/

onComplete /** Called when the call completes, regardless of success or failure **/

onProgress /** Called at any significant point in the progress of the call, usually before and after server requests **/

An example of a sequence of operations involving callbacks would be:

var rs = require('run-service');
rs.create({model: 'model.jl'}, {
    onSuccess: function (data, $run) {
        console.log('Run Created');
        $run.do("initialize",  {
            onSuccess: function (data, $run){
                console.log('Initialized');
                $run.do("add", [1,2], {
                    onSuccess: function (data, $run){
                        console.log('1 + 2 is', data);
                    }
                });
            }
        });
    }
});

Callbacks work great for one-off operations, but as can be seen in the previous example, can get messy for a complicated sequence of steps.

### Promises
Every service call returns a promise, and service calls can also be chained. See http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/ for more details on how promises work

The above call can then be re-written as

rs
    .create({model: 'model.jl'})
    .do('initialize')
    .then(function (){ console.log('initialized'); })
    .do('add', [1,2])
    .done(function (data, $run){
        console.log('1 + 2 is', data);
    });
