(function(){
var root = this;
var F = root.F;

var promisify= function (context) {
    var pending = [];

    var isCurrentlyExecuting = false;
    var lastResult;


    $.extend(context, {
        then: function(fn) {
            return fn.call(this);
        }
    });

    var executeSingle = function() {
        var me = this;

        var doNext = function() {
            if (pending.length) {
                executeSingle.call(me);
            } else {
                isCurrentlyExecuting = false;
                // console.log('All ops complete');
            }
        };

        isCurrentlyExecuting = true;
        var item = pending.shift();
        if (item.args && $.isFunction(item.args[0])) {
            item.args[0] = _.wrap(item.args[0], function(fn) {
                var fnResult = fn.apply(me, [].concat(lastResult));
                return (fnResult !== null && fnResult !== undefined) ? fnResult : me;
            });
        }
        // console.log("Doing", item.name, item.args);
        var result = item.fn.apply(me, item.args);
        if (result && result.pipe) {
            result.then(function() {
                lastResult = _.toArray(arguments);
                doNext();
                return me;
            });
        }
        else {
            lastResult = result;
            doNext();
            return me;
        }
    };

    _.each(context, function(value, name) {
        if ($.isFunction(value)) {
            context[name] = _.wrap(value, function(func) {
                var myid = _.uniqueId(name);
                var passedInParams = _.toArray(arguments).slice(1);

                var item = {
                    id: myid,
                    fn: func,
                    name: name,
                    args: passedInParams
                };
                pending.push(item);
                // console.log("Queued", item, pending);
                if (!isCurrentlyExecuting) {
                    executeSingle.call(context);
                }
                return context;
            });
        }
    });
};


if (typeof exports !== 'undefined') {
    module.exports = promisify;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.util) { root.F.util = {};}
    root.F.util.promisify = promisify;
}
}).call(this);
