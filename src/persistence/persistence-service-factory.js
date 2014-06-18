/**
    Decides type of persistence store to provide
*/

(function(storeType){
var root = this;
var F = root.F;

var dataStore;
var isNode = false;
if (typeof require !== 'undefined') {
    dataStore =  (isNode) ? require('./session-persistence-service.js') : require('./cookie-persistence-service.js');
}
else {
    dataStore =  F.service.Cookie;
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
