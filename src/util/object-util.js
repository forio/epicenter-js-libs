/**
 * Return selected keys from obj
 * 
 * @param {object} obj
 * @param {string[]} keys
 * @return {object}
 */
export function pick(obj, keys) {
    var res = {};
    for (var p in obj) {
        if (keys.indexOf(p) !== -1) {
            res[p] = obj[p];
        }
    }
    return res;
}
export function isEmpty(value) {
    return (!value || ($.isPlainObject(value) && Object.keys(value).length === 0));
}

/**
 * Confirms presence of keys or throws error
 * 
 * @param {Object} obj
 * @param {string[]} keysList
 * @param {string} [context] Prefix to add to error message
 * @throws {Error}
 * @return {boolean}
 */
export function ensureKeysPresent(obj, keysList, context) {
    keysList.forEach((key)=> {
        if (obj[key] === null || obj[key] === undefined) {
            throw new Error(`${context || ''} Missing required parameter '${key}'' in ${JSON.stringify(obj)} `);
        }
    });
    return true;
}