(function () {
    /*jshint forin:false */
    'use strict';

    var root = this;

    function inherit(C, P) {
        var F = function () {};
        F.prototype = P.prototype;
        C.prototype = new F();
        C.__super = P.prototype;
        C.prototype.constructor = C;
    }

    /**
    * Shallow copy of an object
    */
    var extend = function (dest /*, var_args*/) {
        var obj = Array.prototype.slice.call(arguments, 1);
        var current;
        for (var j=0; j<obj.length; j++) {
            if (!(current = obj[j])) {
                continue;
            }

            // do not wrap inner in dest.hasOwnProperty or bad things will happen
            for (var key in current) {
                dest[key] = current[key];
            }
        }

        return dest;
    };

    /**
    /* Inherit from a class (using prototype borrowing)
    */
    function classFrom(base, props, staticProps) {
        var parent = base;
        var child;

        child = props && props.hasOwnProperty('constructor') ? props.constructor : function () { return parent.apply(this, arguments); };

        // add static properties to the child constructor function
        extend(child, parent, staticProps);

        // associate prototype chain
        inherit(child, parent);

        // add instance properties
        if (props) {
            extend(child.prototype, props);
        }

        // done
        return child;
    }

    if (typeof require !== 'undefined') {
        module.exports = classFrom;
    } else {
        if (!root.F) { root.F = {};}
        if (!root.F.util) { root.F.util = {};}
        root.F.util.classFrom = classFrom;
    }
}).call(this);