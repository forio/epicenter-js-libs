/**
 * Utilities for working with the run service
 */

import { toQueryFormat } from './query-util';
import { pick } from 'util/object-util';

var MAX_URL_LENGTH = 2048;

export function extractValidRunParams(params) {
    const validParams = ['model', 'sensitivityMode', 'scope', 'files', 'ephemeral', 'cinFiles'];
    return pick(params, validParams);
}

/**
 * Parses content range header from ajax request
 * @example
 * parseContentRange(xhr.getResponseHeader('content-range'));
 * 
 * @param {string} range Of the form "records 0-99/3570"
 * @return {{start: Number, end: Number, total: Number }}
 */
export function parseContentRange(range) {
    if (!range) return null;

    range = range.replace('records ', '');
    const splitType = range.split('/');
    const splitRange = splitType[0].split('-');
    return {
        start: parseInt(splitRange[0], 10),
        end: parseInt(splitRange[1], 10),
        total: parseInt(splitType[1], 10),
    };
}
/**
 * normalizes different types of operation inputs
 * @param  {object|string[]|string} operations operations to perform
 * @param  {any[]} [args] arguments for operation
 * @return {{ops: string[], args: any[]}} operations of the form `{ ops: [], args: [] }`
 */
export function normalizeOperations(operations, args) {
    if (!args) {
        args = [];
    }
    var returnList = {
        ops: [],
        args: []
    };

    var _concat = function (arr) {
        return (arr !== null && arr !== undefined) ? [].concat(arr) : [];
    };

    //{ add: [1,2], subtract: [2,4] }
    var _normalizePlainObjects = function (operations, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        $.each(operations, function (opn, arg) {
            returnList.ops.push(opn);
            returnList.args.push(_concat(arg));
        });
        return returnList;
    };
    //{ name: 'add', params: [1] }
    var _normalizeStructuredObjects = function (operation, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        returnList.ops.push(operation.name);
        returnList.args.push(_concat(operation.params));
        return returnList;
    };

    var _normalizeObject = function (operation, returnList) {
        return ((operation.name) ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
    };

    var _normalizeLiterals = function (operation, args, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        returnList.ops.push(operation);
        returnList.args.push(_concat(args));
        return returnList;
    };


    var _normalizeArrays = function (operations, arg, returnList) {
        if (!returnList) {
            returnList = { ops: [], args: [] };
        }
        $.each(operations, function (index, opn) {
            if ($.isPlainObject(opn)) {
                _normalizeObject(opn, returnList);
            } else {
                _normalizeLiterals(opn, args[index], returnList);
            }
        });
        return returnList;
    };

    if ($.isPlainObject(operations)) {
        _normalizeObject(operations, returnList);
    } else if (Array.isArray(operations)) {
        _normalizeArrays(operations, args, returnList);
    } else {
        _normalizeLiterals(operations, args, returnList);
    }

    return returnList;
}

export function splitGetFactory(httpOptions) {
    return function (params, options) {
        var http = this; //eslint-disable-line
        var getValue = function (name, options) {
            var value = options[name] || httpOptions[name];
            if (typeof value === 'function') {
                value = value();
            }
            return value;
        };
        var getFinalUrl = function (params) {
            var url = getValue('url', options);
            var data = params;
            // There is easy (or known) way to get the final URL jquery is going to send so we're replicating it.
            url = url.replace(/#.*$/, '');
            var queryParams = toQueryFormat(data);
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
        if (params && params.include && encodeURI(url).length > MAX_URL_LENGTH) {
            var dtd = $.Deferred();
            var paramsCopy = $.extend(true, {}, params);
            delete paramsCopy.include;
            var urlNoIncludes = getFinalUrl(paramsCopy);
            var diff = MAX_URL_LENGTH - urlNoIncludes.length;
            var oldSuccess = options.success || httpOptions.success || $.noop;
            var oldError = options.error || httpOptions.error || $.noop;
            // remove the original success and error callbacks
            options.success = $.noop;
            options.error = $.noop;

            var include = [].concat(params.include);
            var currIncludes = [];
            var includeOpts = [currIncludes];
            var currLength = encodeURIComponent('?include=').length;
            var variable = include.pop();
            while (variable) {
                var varLenght = encodeURIComponent(variable).length;
                // Use a greedy approach for now, can be optimized to be solved in a more
                // efficient way
                // + 1 is the comma
                if (currLength + varLenght + 1 < diff) {
                    currIncludes.push(variable);
                    currLength += varLenght + 1;
                } else {
                    currIncludes = [variable];
                    includeOpts.push(currIncludes);
                    currLength = '?include='.length + varLenght;
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
                    // Should never happen...
                    oldError();
                    return dtd.reject();
                }
                var firstResponse = arguments[0][0];
                var isObject = $.isPlainObject(firstResponse);
                var isRunAPI = (isObject && $.isPlainObject(firstResponse.variables)) || !isObject;
                if (isRunAPI) {
                    if (isObject) {
                        // aggregate the variables property only
                        var aggregateRun = arguments[0][0];
                        $.each(arguments, function (idx, args) {
                            var run = args[0];
                            $.extend(true, aggregateRun.variables, run.variables);
                        });
                        oldSuccess(aggregateRun, arguments[0][1], arguments[0][2]);
                        dtd.resolve(aggregateRun, arguments[0][1], arguments[0][2]);
                    } else {
                        // array of runs
                        // Agregate variables in each run
                        var aggregatedRuns = {};
                        $.each(arguments, function (idx, args) {
                            var runs = args[0];
                            if (!Array.isArray(runs)) {
                                return;
                            }
                            $.each(runs, function (idxRun, run) {
                                if (run.id && !aggregatedRuns[run.id]) {
                                    run.variables = run.variables || {};
                                    aggregatedRuns[run.id] = run;
                                } else if (run.id) {
                                    $.extend(true, aggregatedRuns[run.id].variables, run.variables);
                                }
                            });
                        });
                        // turn it into an array
                        aggregatedRuns = $.map(aggregatedRuns, function (run) { return run; });
                        oldSuccess(aggregatedRuns, arguments[0][1], arguments[0][2]);
                        dtd.resolve(aggregatedRuns, arguments[0][1], arguments[0][2]);
                    }
                } else {
                    // is variables API
                    // aggregate the response
                    var aggregatedVariables = {};
                    $.each(arguments, function (idx, args) {
                        var vars = args[0];
                        $.extend(true, aggregatedVariables, vars);
                    });
                    oldSuccess(aggregatedVariables, arguments[0][1], arguments[0][2]);
                    dtd.resolve(aggregatedVariables, arguments[0][1], arguments[0][2]);
                }
            }, function () {
                oldError.apply(http, arguments);
                dtd.reject.apply(dtd, arguments);
            });
            return dtd.promise();
        } else {
            return http.get(params, options);
        }
    };
}