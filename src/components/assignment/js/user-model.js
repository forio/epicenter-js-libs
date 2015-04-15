'use strict';

var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
var serviceLocator = require('./service-locator');


module.exports = classFrom(Base, {
    defaults: {
        world: '',
        role: '',
        active: true,
        isWorldComplete: true
    },

    makeActive: function () {
        var memberApi = serviceLocator.memberApi();
        var params = {
            userId: this.get('id'),
            groupId: this.get('groupId')
        };

        var original = this.get('active');
        this.set('active', true);

        return memberApi.makeUserActive(params)
            .fail(function () {
                // revert the change
                this.set('active', original);
            }.bind(this));
    },

    makeInactive: function () {
        var memberApi = serviceLocator.memberApi();
        var params = {
            userId: this.get('id'),
            groupId: this.get('groupId')
        };

        var original = this.get('active');
        this.set('active', false);

        return memberApi.makeUserInactive(params)
            .fail(function () {
                // revert the change
                this.set('active', original);
            }.bind(this));
    }

});
