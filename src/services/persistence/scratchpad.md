
##Usage:
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
