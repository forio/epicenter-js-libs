/**
 * 
 * @param {array} a 
 * @param {array} b 
 * @returns {array}
 */
export function intersection(a, b) {
    var t;
    if (b.length > a.length) {
        t = b;
        b = a;
        a = t; 
    }// indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}