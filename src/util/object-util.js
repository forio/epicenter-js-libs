export function pick(obj, props) {
    var res = {};
    for (var p in obj) {
        if (props.indexOf(p) !== -1) {
            res[p] = obj[p];
        }
    }
    return res;
}
export function isEmpty(value) {
    return (!value || ($.isPlainObject(value) && Object.keys(value).length === 0));
}
