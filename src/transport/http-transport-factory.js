'use strict';

var isNode = false;
var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
module.exports = transport;
