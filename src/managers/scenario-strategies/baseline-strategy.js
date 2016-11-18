'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('../run-strategies/conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    loadAndCheck: function (run, headers) {

    },

    reset: function () {
        var prom = __super.reset.apply(this, arguments);
        prom.then(function (run) {
            return run.save({
                saved: true,
                name: 'BASELINE'
            });
        }).then(function (run) {
            return run.do({ stepTo: 'end' });
        }).then(function () {
            
        });
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;
