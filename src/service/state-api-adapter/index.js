import TransportFactory from 'transport/http-transport-factory';
import { pick } from 'util/object-util';
import { getDefaultOptions, getURLConfig } from 'service/service-utils';
var apiEndpoint = 'model/state';

/**
 * @description
 * ## State API Adapter
 *
 * The State API Adapter allows you to view the history of a run, and to replay or clone runs. 
 *
 * The State API Adapter brings existing, persisted run data from the database back into memory, using the same run id (`replay`) or a new run id (`clone`). Runs must be in memory in order for you to update variables or call operations on them.
 *
 * Specifically, the State API Adapter works by "re-running" the run (user interactions) from the creation of the run up to the time it was last persisted in the database. This process uses the current version of the run's model. Therefore, if the model has changed since the original run was created, the retrieved run will use the new model — and may end up having different values or behavior as a result. Use with care!
 *
 * To use the State API Adapter, instantiate it and then call its methods:
 *
 *      var sa = new F.service.State();
 *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f'});
 *
 * @param {object} config
 */
export default function StateService(config) {
    var defaults = {};

    const serviceOptions = getDefaultOptions(defaults, config, {
        apiEndpoint: apiEndpoint
    });
    const urlConfig = getURLConfig(serviceOptions);
    var http = new TransportFactory(serviceOptions.transport);

    var parseRunIdOrError = function (params) {
        if ($.isPlainObject(params) && params.runId) {
            return params.runId;
        } else {
            throw new Error('Please pass in a run id');
        }
    };

    var publicAPI = {

        /**
        * View the history of a run.
        * 
        * @example
        * var sa = new F.service.State();
        * sa.load('0000015a06bb58613b28b57365677ec89ec5').then(function(history) {
        *       console.log('history = ', history);
        * });
        *
        *  
        * @param {string} runId The id of the run.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        load: function (runId, options) {
            var httpParams = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );
            return http.get('', httpParams);
        },

        /**
        * Replay a run. After this call, the run, with its original run id, is now available [in memory](../../../run_persistence/#runs-in-memory). (It continues to be persisted into the Epicenter database at regular intervals.)
        *
        * @example
        * var sa = new F.service.State();
        * sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore'});
        *
        *  
        * @param {object} params
        * @param {string} params.runId The id of the run to bring back to memory.
        * @param {string} [params.stopBefore] The run is advanced only up to the first occurrence of this method.
        * @param {string[]} [params.exclude] Array of methods to exclude when advancing the run.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        replay: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'replay' }, pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        },


        /**
        * 'Rewind' applies to time-based models; it replays the model and stops before the last instance of the rewind operation.
        * 
        *  Note that for this action to work, you need to define `"rewind":{"name": "step"}` in your model context file, where `step` is the name of the operation you typically use to advance your simulation.
        *  
        * @example
        * var sa = new F.service.State();
        * sa.rewind({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f' });
        *
        * @param {object} params
        * @param {string} params.runId The id of the run to rewind
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        rewind: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + 'rewind/' + runId }
            );
            return http.post({}, replayOptions);
        },

        /**
        * Clone a given run and return a new run in the same state as the given run.
        *
        * The new run id is now available [in memory](../../../run_persistence/#runs-in-memory). The new run includes a copy of all of the data from the original run, EXCEPT:
        *
        * * The `saved` field in the new run record is not copied from the original run record. It defaults to `false`.
        * * The `initialized` field in the new run record is not copied from the original run record. It defaults to `false` but may change to `true` as the new run is advanced. For example, if there has been a call to the `step` function (for Vensim models), the `initialized` field is set to `true`.
        * * The `created` field in the new run record is the date and time at which the clone was created (not the time that the original run was created.)
        *
        * The original run remains only [in the database](../../../run_persistence/#runs-in-db).
        *
        * @example
        * var sa = new F.service.State();
        * sa.clone({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore', exclude: ['interimCalculation'] });
        *  
        * @param {object} params
        * @param {string} params.runId The id of the run to clone from memory.
        * @param {string} [params.stopBefore] The newly cloned run is advanced only up to the first occurrence of this method.
        * @param {string[]} [params.exclude] Array of methods to exclude when advancing the newly cloned run.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        clone: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'clone' }, pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        }
    };

    $.extend(this, publicAPI);
}
