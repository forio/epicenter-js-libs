(function(){
var root = this;
var F = root.F;

var transport;
var isNode = false;
if (typeof require !== 'undefined') {
    transport =  (isNode) ? require('transport/node-http-transport') : require('transport/ajax-http-transport');
}
else {
    transport =  F.transport.Ajax;
}

if (typeof exports !== 'undefined') {
    module.exports = HTTPService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.transport) { root.F.transport = {};}
    root.F.transport.HTTP = transport;
}

}).call(this);
