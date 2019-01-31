/**
 * Use this strategy you already have a runid you want to use with the Run Manager (Usually used for impersonating a run)
 * 
 */
export default class UseSpecificRun {
    /**
     * @param {object} [options] 
     * @property {string} [options.runId] Id of Run to use
     */
    constructor(options) {
        const defaults = {
            runId: null
        };
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
        if (!this.options.runId) {
            throw new Error('Missing required parameter `runId`: Specifying an runId is required for "Use Run" strategy');
        }
    }

    reset(runService, userSession, options) {
        throw new Error('"Use Run" strategy does not support reset');
    }

    getRun(runService, userSession, runSession, options) {
        return runService.load(this.options.runId);
    }
}