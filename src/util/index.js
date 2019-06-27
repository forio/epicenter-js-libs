export function result(item) {
    if (typeof item === 'function') {
        const rest = Array.prototype.slice.call(arguments, 1);
        return item.apply(item, rest);
    }
    return item;
}

/**
 * @param {string} type 
 * @param {string} message 
 * @param {any} [context] 
 * @returns {Promise}
 */
export function rejectPromise(type, message, context) {
    const payload = { type: type, message: message, context: context };
    return $.Deferred().reject(payload).promise();
}
/**
 * @param {string} val 
 * @returns {Promise}
 */
export function resolvePromise(val) {
    return $.Deferred().resolve(val).promise();
}


/**
 * @param {string} type
 * @param {string} message
 */
export class CustomError extends Error {
    constructor(type, message) {
        super(message);
        this.message = message;
        this.type = type;
    }
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
    if (val && val.then) {
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