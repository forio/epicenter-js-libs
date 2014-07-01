/**
 * Utilities for working with query strings
*/
(function() {
    'use strict';

    var root = this;
    var $;
    if (typeof require !== 'undefined') {
        $ = require('jQuery');
    }
    else {
        $ = root.jQuery;
    }

    var query= (function () {

        return {
            /**
             * Converts to matrix format
             * @param  {Object} qs Object to convert to query string
             * @return {String}    Matrix-format query parameters
             */
            toMatrixFormat: function(qs) {
                if (qs === null || qs === undefined || qs === '') {
                    return ';';
                }
                if (typeof qs === 'string' || qs instanceof String) {
                    return qs;
                }

                var returnArray = [];
                var OPERATORS = ['<', '>', '!'];
                $.each(qs, function(key, value) {
                    if (typeof value !== 'string' || $.inArray($.trim(value).charAt(0), OPERATORS) === -1) {
                        value = '=' + value;
                    }
                    returnArray.push(key + value);
                });

                var mtrx = ';' + returnArray.join(';');
                return mtrx;
            },

            /**
             * Converts strings/arrays/objects to type 'a=b&b=c'
             * @param  {String|Array|Object} qs
             * @return {String}
             */
            toQueryFormat: function(qs) {
                if (qs === null || qs === undefined) {
                    return '';
                }
                if (typeof qs === 'string' || qs instanceof String) {
                    return qs;
                }

                var returnArray = [];
                $.each(qs, function(key, value) {
                    if ($.isArray(value)) {
                        value = value.join(',');
                    }
                    if ($.isPlainObject(value)) {
                        //Mostly for data api
                        value = JSON.stringify(value);
                    }
                    returnArray.push(key + '=' + value);
                });

                var result = returnArray.join('&');
                return result;
            },

            /**
             * Converts strings of type 'a=b&b=c' to {a:b, b:c}
             * @param  {string} qs
             * @return {object}
             */
            qsToObject: function(qs) {
                if (qs === null || qs === undefined || qs === '') {
                    return {};
                }

                var qsArray = qs.split('&');
                var returnObj = {};
                $.each(qsArray, function(index, value) {
                    var qKey = value.split('=')[0];
                    var qVal = value.split('=')[1];

                    if (qVal.indexOf(',') !== -1) {
                        qVal = qVal.split(',');
                    }

                    returnObj[qKey] = qVal;
                });

                return returnObj;
            },

            /**
             * Normalizes and merges strings of type 'a=b', {b:c} to {a:b, b:c}
             * @param  {String|Array|Object} qs1
             * @param  {String|Array|Object} qs2
             * @return {Object}
             */
            mergeQS: function(qs1, qs2) {
                var obj1 = this.qsToObject(this.toQueryFormat(qs1));
                var obj2 = this.qsToObject(this.toQueryFormat(qs2));
                return $.extend(true, {}, obj1, obj2);
            }
        };
    }());

    if (typeof exports !== 'undefined') {
        module.exports = query;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.util) { root.F.util = {};}
        root.F.util.query = query;
    }
}).call(this);

