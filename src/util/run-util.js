/**
 * Utilities for working with the run service
*/
(function(){
var root = this;
var F = root.F;

var run= function () {

    return {
        /**
         * returns operations of the form [[op1,op2], [arg1, arg2]]
         * @param  {Object|Array|String} operations operations to perform
         * @param  {Array} arugments for operation
         * @return {String}    Matrix-format query parameters
         */
        normalizeOperations: function(operations, args) {
            if (!args) args = [];

            var opsList = [];
            var argsList = [];

            if ($.isPlainObject(operations)) {
                //{add: [1,2], subtract: [2,4]}
                $.each(operations, function(opn, arg) {
                    opsList.push(opn);
                    argsList.push(arg);
                });
            }
            else if($.isArray(operations)) {
                // ['solve', 'reset']
                $.each(operations, function(index, opn) {
                    if ($.isPlainObject(opn)) {
                        //{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]}
                        if (opn.name) {
                            opsList.push(opn.name);
                            argsList.push(opn.params);
                        }
                        else {
                            //{add: [1,2], subtract: [2,4]}
                            $.each(opn, function(op, arg) {
                                opsList.push(op);
                                argsList.push(arg);
                            });
                        }
                    }
                    else {
                        //'solve'
                        opsList.push(opn);
                        argsList.push(args[index]);
                    }
                });
            }
            else {
                //String opname;
                opsList.push(operations);
                argsList = argsList.concat(args);
            }
            return [opsList, argsList];
        }
    };
}();


if (typeof exports !== 'undefined') {
    module.exports = run;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.util) { root.F.util = {};}
    root.F.util.run = run;
}

}).call(this);
