import ConfigService from 'service/configuration-service';
import { toMatrixFormat } from 'util/query-util';
import { splitGetFactory, extractValidRunParams, normalizeOperations } from 'util/run-util';
import TransportFactory from 'transport/http-transport-factory';
import VariablesService from './variables-api-service';
import IntrospectionService from 'service/introspection-api-service';
import SessionManager from 'store/session-manager';

/**
 * @constructor
 * @param {AccountAPIServiceOptions} config 
 * @property {string} filter Criteria by which to filter runs.
 * @property {string} [id] Convenience alias for filter. Pass in an existing run id to interact with a particular run.
 * @property {string} [autoRestore] Flag determines if `X-AutoRestore: true` header is sent to Epicenter, meaning runs are automatically pulled from the Epicenter backend database if not currently in memory on the Epicenter servers. Defaults to true.
 */
export default function RunService(config) {

    var defaults = {
        filter: '',
        id: '',
        autoRestore: true,

        account: undefined,
        project: undefined,
        token: undefined,
        transport: {},

        success: $.noop,
        error: $.noop,
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    function updateURLConfig(opts) {
        var urlConfig = new ConfigService(opts).get('server');
        if (opts.account) {
            urlConfig.accountPath = opts.account;
        }
        if (opts.project) {
            urlConfig.projectPath = opts.project;
        }

        urlConfig.filter = ';';
        urlConfig.getFilterURL = function (filter) {
            var url = urlConfig.getAPIPath('run');
            var filterMatrix = toMatrixFormat(filter || opts.filter);

            if (filterMatrix) {
                url += filterMatrix + '/';
            }
            return url;
        };

        urlConfig.addAutoRestoreHeader = function (options) {
            var filter = opts.filter;
            // The semicolon separated filter is used when filter is an object
            var isFilterRunId = filter && $.type(filter) === 'string';
            if (opts.autoRestore && isFilterRunId) {
                // By default autoreplay the run by sending this header to epicenter
                // https://forio.com/epicenter/docs/public/rest_apis/aggregate_run_api/#retrieving
                var autorestoreOpts = {
                    headers: {
                        'X-AutoRestore': 'true'
                    }
                };
                return $.extend(true, autorestoreOpts, options);
            }

            return options;
        };
        return urlConfig;
    }

    var http;
    var httpOptions; //FIXME: Make this side-effect-less
    function updateHTTPConfig(serviceOptions, urlConfig) {
        httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getFilterURL
        });

        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: 'Bearer ' + serviceOptions.token
            };
        }
        http = new TransportFactory(httpOptions);
        http.splitGet = splitGetFactory(httpOptions);
    }

    var urlConfig = updateURLConfig(serviceOptions); //making a function so #updateConfig can call this; change when refactored
    updateHTTPConfig(serviceOptions, urlConfig);
   

    function setFilterOrThrowError(options) {
        if (options.id) {
            serviceOptions.filter = serviceOptions.id = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = serviceOptions.id = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    }

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `reuse-never`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
         *
         * @example
         * rs.create('hello_world.jl');
         *  
         * @param {String|Object} params If a string, the name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project. If an object, may include `model`, `scope`, and `files`. (See the [Run Manager](../run_manager/) for more information on `scope` and `files`.)
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('run') });
            if (typeof params === 'string') {
                params = { model: params };
            } else {
                params = extractValidRunParams(params);
            }

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                serviceOptions.id = response.id;
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         * The elements of the `qs` object are ANDed together within a single call to `.query()`.
         *
         * @example
         * // returns runs with saved = true where variables.price has been persisted (recorded) in the model.
         * rs.query({
         *  saved: true,
         * }, {
         *  include: ['Price', 'MyOtherVariable']
         * }, {
         *  startrecord: 2,
         *  endrecord: 5
         * });
         * 
         * @param {Object} qs Query object. Each key should be a property of the run (saved/trashed/custom metadata saved with `.save`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise.<object[]>}
         */
        query: function (qs, outputModifier, options) {
            const mergedOptions = $.extend(true, {}, serviceOptions, options);
            const mergedQuery = $.extend(true, {}, qs);
            if (mergedOptions.scope) {
                mergedQuery.scope = mergedOptions.scope;
            }

            let httpOptions = $.extend(true, {}, mergedOptions, { url: urlConfig.getFilterURL(mergedQuery) });
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);

            return http.splitGet(outputModifier, httpOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         * Similar to `.query()`.
         * 
         * @param {Object} filter Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} [outputModifier] Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            } else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.splitGet(outputModifier, httpOptions);
        },

        /**
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables or run record variables, pass them as part of the `filters` parameter.
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed or saved in your model &mdash; are available.
         *
         * @example
         * rs.load('bb589677-d476-4971-a68e-0c58d191e450', { include: ['.price', '.sales'] });
         *
         * 
         * @param {String} runID The run id.
         * @param {Object} [filters] Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        load: function (runID, filters, options) {
            if (runID) {
                serviceOptions.filter = runID; //shouldn't be able to over-ride
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.get(filters, httpOptions);
        },

        /**
         * Removes specified runid from memory. See [details on run persistence](../../../run_persistence/#runs-in-memory)
         *
         * @example
         * rs.removeFromMemory('bb589677-d476-4971-a68e-0c58d191e450');
         *
         * @param  {String} runID   id of run to remove
         * @param  {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        removeFromMemory: function (runID, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            if (runID) {
                httpOptions.url = urlConfig.getAPIPath('run') + runID;
            }
            return http.delete({}, httpOptions);
        },

        /**
         * Save attributes (data, model variables) of the run.
         *
         * @example
         * // add 'completed' field to run record
         * rs.save({ completed: true });
         * // update 'saved' field of run record, and update values of model variables for this run
         * rs.save({ saved: true, variables: { a: 23, b: 23 } });
         * // update 'saved' field of run record for a particular run
         * rs.save({ saved: true }, { id: '0000015bf2a04995880df6b868d23eb3d229' });
         *
         * @param {Object} attributes The run data and variables to save.
         * @param {Object} attributes.variables Model variables must be included in a `variables` field within the `attributes` object. (Otherwise they are treated as run data and added to the run record directly.)
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            const saveable = Object.keys(attributes).reduce((accum, key)=> {
                const val = attributes[key];
                if (key === 'scope' && $.isPlainObject(val)) { //Epicenter cannot handle { scope: { trackingKey: 'foo' }}, needs 'scope.trackingKey': foo 
                    Object.keys(val).forEach((k)=> {
                        const nestedVal = val[k];
                        accum[`${key}.${k}`] = nestedVal;
                    });
                } else {
                    accum[key] = val;
                }
                return accum;
            }, {});
            return http.patch(saveable, httpOptions);
        },

        /**
         * Call an operation from the model.
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * @example
         * // operation "solve" takes no arguments
         * rs.do('solve');
         * // operation "echo" takes one argument, a string
         * rs.do('echo', ['hello']);
         * // operation "echo" takes one argument, a string
         * rs.do('echo', 'hello');
         * // operation "sumArray" takes one argument, an array
         * rs.do('sumArray', [[4,2,1]]);
         * // operation "add" takes two arguments, both integers
         * rs.do({ name:'add', params:[2,4] });
         * // call operation "solve" on a different run 
         * rs.do('solve', { id: '0000015bf2a04995880df6b868d23eb3d229' });
         * 
         * @param {String} operation Name of operation.
         * @param {Array} [params] Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} [options] Overrides for configuration options.
         * @return {Promise}
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else if ($.isPlainObject(params)) {
                opsArgs = null;
                postOptions = params;
            } else {
                opsArgs = params;
            }
            var result = normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            return http.post({ arguments: prms }, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several operations from the model, sequentially.
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * @example
         * // operations "initialize" and "solve" do not take any arguments
         * rs.serial(['initialize', 'solve']);
         * // operations "init" and "reset" take two arguments each
         * rs.serial([  { name: 'init', params: [1,2] }, { name: 'reset', params: [2,3] }]);
         * // operation "init" takes two arguments,
         * // operation "runmodel" takes none
         * rs.serial([  { name: 'init', params: [1,2] }, { name: 'runmodel', params: [] }]);
         * 
         * @param {Array} operations If none of the operations take parameters, pass an array of the operation names (strings). If any of the operations do take parameters, pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} [options] Overrides for configuration options.
         * @return {JQuery.Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        serial: function (operations, params, options) {
            var opParams = normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var responses = [];
            var doSingleOp = function () {
                var op = ops.shift();
                var arg = args.shift();

                me.do(op, arg, {
                    success: function (result) {
                        responses.push(result);
                        if (ops.length) {
                            doSingleOp();
                        } else {
                            $d.resolve(responses);
                            postOptions.success(responses, me);
                        }
                    },
                    error: function (err) {
                        responses.push(err);
                        $d.reject(responses);
                        postOptions.error(responses, me);
                    }
                });
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Call several operations from the model, executing them in parallel.
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * @example
         * // operations "solve" and "reset" do not take any arguments
         * rs.parallel(['solve', 'reset']);
         * // operations "add" and "subtract" take two arguments each
         * rs.parallel([ { name: 'add', params: [1,2] }, { name: 'subtract', params:[2,3] }]);
         * // operations "add" and "subtract" take two arguments each
         * rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * @param {Array|Object} operations If none of the operations take parameters, pass an array of the operation names (as strings). If any of the operations do take parameters, you have two options. You can pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the operation name and a (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} [options] Overrides for configuration options.
         * @return {JQuery.Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue = [];
            for (var i = 0; i < ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }

            var me = this;
            $.when.apply(this, queue)
                .then(function () {
                    var args = Array.prototype.slice.call(arguments);
                    var actualResponse = args.map(function (a) {
                        return a[0];
                    });
                    $d.resolve(actualResponse);
                    postOptions.success(actualResponse, me);
                })
                .fail(function () {
                    var args = Array.prototype.slice.call(arguments);
                    var actualResponse = args.map(function (a) {
                        return a[0];
                    });
                    $d.reject(actualResponse);
                    postOptions.error(actualResponse, me);
                });

            return $d.promise();
        },

        /**
         * Shortcut to using the [Introspection API Service](../introspection-api-service/). Allows you to view a list of the variables and operations in a model.
         *
         * @example
         * rs.introspect({ runID: 'cbf85437-b539-4977-a1fc-23515cf071bb' }).then(function (data) {
         *      console.log(data.functions);
         *      console.log(data.variables);
         * });
         * 
         * @param  {Object} options Options can either be of the form `{ runID: <runid> }` or `{ model: <modelFileName> }`. Note that the `runID` is optional if the Run Service is already associated with a particular run (because `id` was passed in when the Run Service was initialized). If provided, the `runID` overrides the `id` currently associated with the Run Service.
         * @param  {Object} [introspectionConfig] Service options for Introspection Service
         * @return {Promise}
         */
        introspect: function (options, introspectionConfig) {
            var introspection = new IntrospectionService($.extend(true, {}, serviceOptions, introspectionConfig));
            if (options) {
                if (options.runID) {
                    return introspection.byRunID(options.runID);
                } else if (options.model) {
                    return introspection.byModel(options.model);
                }
            } else if (serviceOptions.id) {
                return introspection.byRunID(serviceOptions.id);
            }
            throw new Error('Please specify either the model or runid to introspect');
        }
    };

    var publicSyncAPI = {
        getCurrentConfig: function () {
            return serviceOptions;
        },
        updateConfig: function (config) {
            if (config && config.id) {
                config.filter = config.id;
            } else if (config && config.filter) {
                config.id = config.filter;
            }
            serviceOptions = $.extend(true, {}, serviceOptions, config);
            urlConfig = updateURLConfig(serviceOptions);
            this.urlConfig = urlConfig;
            updateHTTPConfig(serviceOptions, urlConfig);
        },
        /**
          * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
          *
          * @example
          * var vs = rs.variables();
          * vs.save({ sample_int: 4 });
          *
          * @param {Object} [config] Overrides for configuration options.
          * @return {Object} variablesService Instance
          */
        variables: function (config) {
            var vs = new VariablesService($.extend(true, {}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    $.extend(this, publicSyncAPI);
}
