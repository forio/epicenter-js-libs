(function(){
var root = this;
var F = root.F;

var promisify= function (context) {
    var pending = [];

    var $d = $.Deferred();
    var $prom = $d.promise(context);

    var isCurrentlyExecuting = false;

    var executeSingle = function() {
        var me = this;

        isCurrentlyExecuting = true;
        var item = pending.shift();
        // console.log("Doing", item.name, item.args);

        return item.fn.apply(me, item.args).then(function() {
            // console.log("Done", item, pending);
            item.$promise.resolve.apply(me, arguments);

            if (pending.length) {
                executeSingle.call(me);
            } else {
                isCurrentlyExecuting = false;
                // console.log('All ops complete');
            }
            return me;
        });
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
                    args: passedInParams,
                    $promise: $d
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
