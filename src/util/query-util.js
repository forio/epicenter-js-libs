/**
 * Utilities for working with query strings
*/
var query= function () {

    return {
        /**
         * Converts to matrix format
         * @param  {Object} qs Object to convert to query string
         * @return {String}    Matrix-format query parameters
         */
        toMatrixFormat: function(qs) {
            var returnArray = [];
            $.each(qs, function(key, value) {
                returnArray.push(key + '=' + value);
            });

            var mtrx = ';' + returnArray.join(';');
            return mtrx;
        },

        toQueryFormat: function(qs) {
            if (qs === null || qs === undefined) return '';
            if (typeof qs === 'string' || qs instanceof String) return qs;

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

        qsToObject: function(qs) {
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

        mergeQS: function(qs1, qs2) {
            var obj1 = this.qsToObject(this.toQueryFormat(qs1));
            var obj2 = this.qsToObject(this.toQueryFormat(qs2));
            return $.extend(true, {}, obj1, obj2);
        }
    };
}();

if (!window.F) window.F = {};
if (!window.F.util) window.F.util = {};
F.util.query = query;
