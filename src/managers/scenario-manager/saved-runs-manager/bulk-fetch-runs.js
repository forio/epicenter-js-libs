import { parseContentRange } from 'util/run-util';

/**
 * @param {Function} fetchFn 
 * @param {{ startRecord:? Number, endRecord:? Number, recordsPerFetch:? Number, onData:? Function }} options 
 * @return {Promise.<object[]>}
 */
export default function bulkFetchRecords(fetchFn, options) {
    const ops = $.extend({}, {
        startRecord: 0,
        endRecord: Infinity,
        
        recordsPerFetch: 100,

        onData: ()=> {}
    }, options);

    function getRecords(fetchFn, options, recordsFoundSoFar) {
        const endRecord = Math.min(options.startRecord + options.recordsPerFetch - 1, options.endRecord);
        return fetchFn(options, endRecord).then(function (currentRecords, status, xhr) {
            const allFound = (recordsFoundSoFar || []).concat(currentRecords);
            const recordsLeft = xhr && parseContentRange(xhr.getResponseHeader('content-range'));

            options.onData(currentRecords, recordsLeft);
    
            if (recordsLeft && recordsLeft.total > recordsLeft.end + 1) {
                const nextFetchOptions = $.extend({}, options, {
                    startRecord: endRecord,
                });
                return getRecords(endRecord, nextFetchOptions, allFound);
            }
            return allFound;
        });
    }

    const runLoadPromise = getRecords(fetchFn, ops);
    return runLoadPromise;
} 