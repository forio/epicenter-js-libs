(function(){
var root = this;

var transport;
var isNode = false;
if (typeof require !== 'undefined') {
    transport =  (isNode) ? require('transport/node-http-transport') : require('transport/ajax-http-transport');
}
else {
    transport =  F.transport.Ajax;
}

if (typeof exports !== 'undefined') {
    module.exports = transport;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.factory) { root.F.factory = {};}
    root.F.factory.Transport = transport;
}

}).call(this);
