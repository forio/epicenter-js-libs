'use strict';

var BaseCollection = function (models, options) {
    this._models = [];
    this.options = options;
    this.initialize.apply(this, arguments);
};

_.extend(BaseCollection.prototype, {
    initialize: function (models, options) {
    },

    create: function (attr, options) {
        var m = new this.model(attr, options);
        this.set(m);
        return m;
    },

    reset: function (models, options) {
        this._models.length = 0;
        this.set(models);
    },

    set: function (models) {
        if (!models) {
            return;
        }

        models = [].concat(models);

        if (!models.length) {
            throw new Error('Don\'t know what to set');
        }

        _.each(models, function (m) {
            if (!(m instanceof this.model)) {
                m = new this.model(m);
            }

            this._models.push(m);
        }, this);

        return models;
    },

    each: function (cb, ctx) {
        return _.each(this._models, cb, ctx || this);
    },

    toJSON: function () {
        return _.invoke(this._models, 'toJSON');
    },

    find: function (fn) {
        return _.find(this._models, fn);
    },

    filter: function (fn) {
        return _.filter(this._models, fn);
    }

});

module.exports = BaseCollection;