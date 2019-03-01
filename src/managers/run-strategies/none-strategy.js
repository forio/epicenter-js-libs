/**
 * The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../run-api-service/).
 * 
 * This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance.
 */
export default class NoRunStrategy {
    reset() {
        // return a newly created run
        return $.Deferred().resolve().promise();
    }

    getRun(runService) {
        // return a usable run
        return $.Deferred().resolve(runService).promise();
    }
}
