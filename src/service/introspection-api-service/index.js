import TransportFactory from 'transport/http-transport-factory';
import { getURLConfig, getDefaultOptions } from '../service-utils';

var apiEndpoint = 'model/introspect';

/**
 * @description
 * 
 * ## Introspection API Service
 *
 * The Introspection API Service allows you to view a list of the variables and operations in a model. Typically used in conjunction with the [Run API Service](../run-api-service/).
 *
 * The Introspection API Service is not available for Forio SimLang.
 *
 * ```js
 * var intro = new F.service.Introspect({
 *         account: 'acme-simulations',
 *         project: 'supply-chain-game'
 * });
 * intro.byModel('supply-chain.py').then(function(data){ ... });
 * intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6').then(function(data){ ... });
 * ```
 * 
 * @param {AccountAPIServiceOptions} config 
 */
export default function (config) {
    var defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
    };

    const serviceOptions = getDefaultOptions(defaults, config, {
        apiEndpoint: apiEndpoint
    });
    const urlConfig = getURLConfig(serviceOptions);
    var http = new TransportFactory(serviceOptions.transport);

    var publicAPI = {
        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters, such as `files`.
         *
         * @example
         * intro.byModel('abc.vmf')
         *     .then(function(data) {
         *         // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *         console.log(data.functions);
         *         console.log(data.variables);
         *     });
         *
         * 
         * @param  {string} modelFile Name of the model file to introspect.
         * @param  {object} [options] Overrides for configuration options.
         * @return {Promise} 
         */
        byModel: function (modelFile, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            if (!opts.account || !opts.project) {
                throw new Error('Account and project are required when using introspect#byModel');
            }
            if (!modelFile) {
                throw new Error('modelFile is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + [opts.account, opts.project, modelFile].join('/') };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        },

        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters such as `files`.
         *
         * @example
         * intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6')
         *     .then(function(data) {
         *         // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *         console.log(data.functions);
         *         console.log(data.variables);
         *     });
         *
         * 
         * @param  {string} runID Id of the run to introspect.
         * @param  {object} [options] Overrides for configuration options.
         * @return {Promise} 
         */
        byRunID: function (runID, options) {
            if (!runID) {
                throw new Error('runID is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + runID };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        }
    };
    $.extend(this, publicAPI);
}
