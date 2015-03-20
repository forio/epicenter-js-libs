'use strict';

/**
* Utility class to make ajax calls sequencial
*/
function AjaxQueue () {
    this.queue = [];
}

$.extend(AjaxQueue.prototype, {
    add: function (fn) {
        return this.queue.push(fn);
    },

    execute: function (context) {
        var dtd = $.Deferred();
        var _this = this;
        context = context || this;

        function next() {
            if (_this.queue.length) {
                var fn = _this.queue.shift();

                fn.call(context)
                    .then(next)
                    .fail(dtd.reject);
            } else {
                dtd.resolve();
            }
        }

        next();

        return dtd.promise();
    }
});


module.exports = AjaxQueue;