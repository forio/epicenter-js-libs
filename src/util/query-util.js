/**
 * Utilities for working with query strings
*/

/**
 * Converts to matrix format
 * @param  {object} qs Object to convert to query string
 * @return {string}    Matrix-format query parameters
 */
export function toMatrixFormat(qs) {
    if (qs === null || qs === undefined || qs === '') {
        return ';';
    }
    if (typeof qs === 'string') {
        return qs;
    }
    function translateParts(ip) {
        function translateRawValue(val) {
            const OPERATORS = ['<', '>', '!'];
            const alreadyHasOperator = OPERATORS.some((o)=> `${val}`.charAt(0) === o);
            const withPrefix = alreadyHasOperator ? val : `=${val}`;
            return withPrefix;
        }
    
        const parts = Object.keys(ip).reduce((accum, key)=> {
            const val = ip[key];
            if (Array.isArray(val)) {
                const mapped = val.map((v)=> {
                    const translated = translateRawValue(v);
                    return `${key}${translated}`;
                });
                accum = accum.concat(mapped);
            } else if (val !== null && typeof val === 'object') {
                const translated = translateParts(val);
                const prefixed = translated.map((t)=> {
                    return `${key}.${t}`;
                });
                accum = accum.concat(prefixed);
            } else {
                const translated = translateRawValue(val);
                accum.push(`${key}${translated}`);
            }
            return accum;
        }, []);
        return parts;
    }

    const parts = translateParts(qs);
    return `;${parts.join(';')}`;
}

/**
 * Converts strings/arrays/objects to type 'a=b&b=c'
 * @param  { string|Array|Object} qs
 * @return { string}
 */
export function toQueryFormat(qs) {
    if (qs === null || qs === undefined) {
        return '';
    }
    if (typeof qs === 'string') {
        return qs;
    }

    var returnArray = [];
    $.each(qs, function (key, value) {
        if (Array.isArray(value)) {
            value = value.join(',');
        }

        if ($.isPlainObject(value)) {
            //Mostly for data api
            value = JSON.stringify(value);
        }
        returnArray.push(key + '=' + value);
    });

    var result = returnArray.join('&');
    return result;
}

/**
 * Converts strings of type 'a=b&b=c' to { a:b, b:c}
 * @param  { string} qs
 * @return {object}
 */
export function qsToObject(qs) {
    if (qs === null || qs === undefined || qs === '') {
        return {};
    }

    var qsArray = qs.split('&');
    var returnObj = {};
    qsArray.forEach(function (value, index) {
        var qKey = value.split('=')[0];
        var qVal = value.split('=')[1];

        if (qVal.indexOf(',') !== -1) {
            qVal = qVal.split(',');
        }

        returnObj[qKey] = qVal;
    });

    return returnObj;
}

/**
 * Normalizes and merges strings of type 'a=b', { b:c} to { a:b, b:c}
 * @param  { string|Array|Object} qs1
 * @param  { string|Array|Object} qs2
 * @return {Object}
 */
export function mergeQS(qs1, qs2) {
    var obj1 = qsToObject(toQueryFormat(qs1));
    var obj2 = qsToObject(toQueryFormat(qs2));
    return $.extend(true, {}, obj1, obj2);
}

/**
 *
 * @param {string} url url to sanitize
 * @param {object} [options] determines if leading/trailing slashes are expected
 * @param {boolean} [options.leading]
 * @param {boolean} [options.trailing]
 *
 * @returns {string}
 */
export function normalizeSlashes(url, options) {
    if (!url) {
        if (url === '') return '';
        throw new Error(`normalizeSlashes: Unknown url ${url}`);
    }
    const opts = $.extend({}, {
        leading: false,
        trailing: false,
    }, options);

    const protocolMatch = url.match(/^(https?:\/\/)(.*)/);
    const [protocol, rest] = protocolMatch ? [protocolMatch[1], protocolMatch[2]] : ['', url];

    let cleaned = rest.replace(/\/{2,}/g, '/');
    if (opts.leading && cleaned.charAt(0) !== '/' && !protocol) {
        cleaned = `/${cleaned}`;
    }
    if (opts.trailing && cleaned.charAt(cleaned.length - 1) !== '/') {
        cleaned = `${cleaned}/`;
    }
    return `${protocol}${cleaned}`;
}

