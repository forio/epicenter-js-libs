'use strict';

var qutil = require('../../util/query-util');
var MAX_URL_LENGTH = 2048;

module.exports = function (httpOptions) {
    return {
        runAPI: function (params, options) {
            var http = this;
            var getValue = function (name) {
                var value = options[name] || httpOptions[name];
                if (typeof value === 'function') {
                    value = value();
                }
                return value;
            };
            var getFinalUrl = function (params) {
                var url = getValue('url', options);
                var data = params;
                // There is easy (or known) way to get the final URL jquery is going to send so
                // we're replicating it. The process might change at some point but it probably will not.
                // 1. Remove hash
                url = url.replace(/#.*$/, '');
                // 1. Append query string
                var queryParams = qutil.toQueryFormat(data);
                var questionIdx = url.indexOf('?');
                if (queryParams && questionIdx > -1) {
                    return url + '&' + queryParams;
                } else if (queryParams) {
                    return url + '?' + queryParams;
                }
                return url;
            };
            var url = getFinalUrl(params);
            // We must split the GET in multiple short URL's
            // The only property allowed to be split is "include"
            if (params && params.include && url.length > MAX_URL_LENGTH) {
                var dtd = $.Deferred();
                var paramsCopy = $.extend(true, {}, params);
                delete paramsCopy.include;
                var urlNoIncludes = getFinalUrl(paramsCopy);
                var diff = MAX_URL_LENGTH - urlNoIncludes.length;

                var include = params.include;
                var currIncludes = [];
                var includeOpts = [currIncludes];
                var currLength = '?include='.length;
                var variable = include.pop();
                while (variable) {
                    // Use a greedy approach for now, can be optimized to be solved in a more
                    // efficient way
                    // + 1 is the comma
                    if (currLength + variable.length + 1 < diff) {
                        currIncludes.push(variable);
                        currLength += variable.length + 1;
                    } else {
                        currIncludes = [variable];
                        includeOpts.push(currIncludes);
                        currLength = '?include='.length + variable.length;
                    }
                    variable = include.pop();
                }
                var reqs = $.map(includeOpts, function (include) {
                    var reqParams = $.extend({}, params, { include: include });
                    return http.get(reqParams, options);
                });
                $.when.apply($, reqs).then(function () {
                    // Each argument are arrays of the arguments of each done request
                    // So the first argument of the first array of arguments is the data
                    var isValid = arguments[0] && arguments[0][0];
                    if (!isValid) {
                        return dtd.resolve.apply(dtd, arguments[0]);
                    }
                    var isObject = $.isPlainObject(arguments[0][0]);
                    if (isObject) {
                        // aggregate the variables property only
                        var aggregateRun = arguments[0][0];
                        $.each(arguments, function (idx, args) {
                            var run = args[0];
                            $.extend(true, aggregateRun.variables, run.variables);
                        });
                        dtd.resolve(aggregateRun, arguments[0][1], arguments[0][2]);
                    } else {
                        // Agregate variables in each run
                        var runs = {};
                        $.each(arguments, function (idx, args) {
                            var runs = args[0];
                            $.each(runs, function (idxRun, run) {
                                if (!runs[run.id]) {
                                    runs[run.id] = run;
                                } else {
                                    $.extend(true, runs[run.id].variables, run.variables);
                                }
                            });
                        });
                        dtd.resolve(runs, arguments[0][1], arguments[0][2]);
                    }
                }, function () {
                    dtd.fail.apply(dtd, arguments[0]);
                });
                return dtd.promise();
            } else {
                return http.get(params, options);
            }
        },

        get: function (implementation) {
            return this[implementation];
        }
    };
};