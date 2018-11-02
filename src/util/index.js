export function result(item) {
    if (typeof item === 'function') {
        return item();
    }
    return item;
}

/**
 * @param {string} type 
 * @param {string} message 
 * @returns {Promise}
 */
export function rejectPromise(type, message) {
    return $.Deferred().reject({ type: type, message: message }).promise();
}
/**
 * @param {any} val 
 * @returns {Promise}
 */
export function makePromise(val) {
    //Can be replaced with Promise.resolve when we drop IE11;
    // if (isFunction(val)) {
    //     return Promise.resolve(val());
    // }
    // return Promise.resolve(val);
    if (val.then) {
        return val;
    }
    const $def = $.Deferred();
    if (typeof val === 'function') {
        try {
            const toReturn = val();
            if (toReturn && toReturn.then) {
                return toReturn.then((r)=> $def.resolve(r)).catch(((e)=> $def.reject(e)));
            }
            $def.resolve(toReturn);
        } catch (e) {
            $def.reject(e);
        }
    } else {
        $def.resolve(val);
    }
    return $def.promise();
}