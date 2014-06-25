/**
 * Utilities for working with the run service
*/
(function(){
var root = this;

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
            var returnList = {
                ops: [],
                args: []
            };

            //{add: [1,2], subtract: [2,4]}
            var _normalizePlainObjects = function(operations, returnList) {
                if (!returnList) returnList = {ops: [], args: []};
                $.each(operations, function(opn, arg) {
                    returnList.ops.push(opn);
                    returnList.args.push([].concat(arg));
                });
                return returnList;
            };


            if ($.isPlainObject(operations)) {
                _normalizePlainObjects(operations, returnList);
            }
            else if($.isArray(operations)) {
                // ['solve', 'reset']
                $.each(operations, function(index, opn) {
                    if ($.isPlainObject(opn)) {
                        //{name: add, params: [1,2]]}, {name: 'subtract', params:[2,3]}
                        if (opn.name) {
                            returnList.ops.push(opn.name);
                            returnList.args.push([].concat(opn.params));
                        }
                        else {
                            //{add: [1,2], subtract: [2,4]}
                            _normalizePlainObjects(opn, returnList);
                        }
                    }
                    else {
                        //'solve'
                        returnList.ops.push(opn);
                        returnList.args.push([].concat(args[index]));
                    }
                });
            }
            else {
                //String opname;
                returnList.ops.push(operations);
                returnList.args.push([].concat(args));
            }

            // if (returnList.ops.length === 1) returnList.ops = returnList.ops[0];
            return returnList;
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
