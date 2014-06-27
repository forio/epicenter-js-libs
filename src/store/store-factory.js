/**
    Decides type of store to provide
*/

(function(storeType){
    'use strict';

    var root = this;
    var F = root.F;

    var dataStore;
    var isNode = false;
    if (typeof require !== 'undefined') {
        dataStore =  (isNode) ? require('./session-store.js') : require('./cookie-store.js');
    }
    else {
        dataStore =  F.store.Cookie;
    }

    if (typeof exports !== 'undefined') {
        module.exports = dataStore;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.factory) { root.F.factory = {};}
        root.F.factory.Store = dataStore;
    }

}).call(this);
