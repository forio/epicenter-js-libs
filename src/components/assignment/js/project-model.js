'use strict';

var serviceLocator = require('./service-locator');

var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
// var __super = Base.prototype;

module.exports = classFrom(Base, {

    isDynamicAssignment: function () {
        return this.get('worlds') === 'dynamic';
    },

    fetch: function () {
        var api = serviceLocator.worldApi();

        return api.getProjectSettings().then(function (settings) {
            this.set(settings);
        }.bind(this));
    }
});