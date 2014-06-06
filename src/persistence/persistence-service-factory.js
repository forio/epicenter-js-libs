/**
    Decides type of persistence store to provide
*/

(function(){
var root = this;
var F = root.F;

var dataStore;
var isNode = false;
if (typeof require !== 'undefined') {
    dataStore =  (isNode) ? require('./cookie-persistence-service.js') : require('./session-persistence-service.js');
}
else {
    dataStore =  F.Service.Ajax;
}

if (typeof exports !== 'undefined') {
    module.exports = HTTPService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Persistence = dataStore;
}

}).call(this);
