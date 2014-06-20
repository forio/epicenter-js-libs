(function(){
var root = this;
var F = root.F;

var promisify= function (api) {
    var me = this;
    var pending = [];

    var loopStarted = false;
    var doSingleOp = function() {
        var me = this;
        loopStarted = true;

        var item = pending.shift();

        console.log("Doing", item.name, item.args);
        // item.$promise.resolve.apply(me);

        item.fn.apply(me, item.args).done(function() {
            console.log("Done", item, pending);
            item.$promise.resolve.apply(this, arguments);
            if (pending.length) {
                doSingleOp.call(me);
            } else {
                loopStarted = false;
                console.log('All ops complete');
            }
        });
    };

    _.each(api, function(value, name) {
        if ($.isFunction(value)) {
            api[name] = _.wrap(value, function(func) {
                var $d = $.Deferred();
                var $prom = $d.promise(me);

                var myid = _.uniqueId(name);
                var passedInParams = _.toArray(arguments).slice(1);
                // $d.resolve.apply(me, passedInParams);

                var item = {
                    fn: func,
                    name: name,
                    args: passedInParams,
                    $promise: $d
                };
                pending.push(item);
                console.log("pushing", item, pending);
                if (!loopStarted) {
                    doSingleOp.call(me);
                }
                return me;
            });
        }
    });

    return api;
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
