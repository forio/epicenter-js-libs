(function(){
var root = this;
var F = root.F;

var promisify= function (context) {
    var me = context;
    var pending = [];

    var $d = $.Deferred();
    var $prom = $d.promise(context);

    var loopStarted = false;
    var doSingleOp = function() {
        var me = this;
        loopStarted = true;

        var item = pending.shift();

        console.log("Doing", item.name, item.args);

        return item.fn.apply(me, item.args).then(function() {
            console.log("Done", item, pending);
            item.$promise.resolve.apply(me, arguments);
            if (pending.length) {
                doSingleOp.call(me);
            } else {
                loopStarted = false;
                console.log('All ops complete');
            }
            return me;
        });
    };


    _.each(context, function(value, name) {
        if ($.isFunction(value)) {
            context[name] = _.wrap(value, function(func) {

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
