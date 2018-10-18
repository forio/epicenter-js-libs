import { parseContentRange } from 'util/run-util';

/**
 * Recursively fetches from any API which supports content-range
 * 
 * @param {function(Number, Number):Promise<object[], string, XMLHttpRequest>} fetchFn Function which returns a promise (presumably an API call)
 * @param {object} [options] 
 * @param {Number} [options.startRecord]
 * @param {Number} [options.endRecord]
 * @param {Number} [options.recordsPerFetch]
 * @param {function(Number, Number):Promise<object[]>} [options.recordsPerFetch]
 * @param {Function} [options.contentRangeParser]
 * @return {Promise.<object[]>}
 */
export default function bulkFetchRecords(fetchFn, options) {
    const ops = $.extend({}, {
        startRecord: 0,
        endRecord: Infinity,
        
        recordsPerFetch: 100,
        contentRangeParser: (currentRecords, xhr)=> xhr && parseContentRange(xhr.getResponseHeader('content-range')),

        onData: ()=> {}
    }, options);

    function getRecords(fetchFn, options, recordsFoundSoFar) {
        const endRecord = Math.min(options.startRecord + options.recordsPerFetch, options.endRecord);
        return fetchFn(options.startRecord, endRecord).then(function (currentRecords, status, xhr) {
            const allFound = (recordsFoundSoFar || []).concat(currentRecords);
            const recordsLeft = ops.contentRangeParser(allFound, xhr);
            options.onData(currentRecords, recordsLeft);
            
            const recordsNeeded = Math.min(recordsLeft.total, ops.endRecord - ops.startRecord);
            if (recordsLeft && recordsNeeded > recordsLeft.end + 1) {
                const nextFetchOptions = $.extend({}, options, {
                    startRecord: recordsLeft.end + 1,
                });
                return getRecords(fetchFn, nextFetchOptions, allFound);
            }
            return allFound;
        });
    }

    const prom = getRecords(fetchFn, ops);
    return prom;
} 