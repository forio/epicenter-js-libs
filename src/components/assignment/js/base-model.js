'use strict';


var BaseModel = function (attr, options) {
    attr = _.defaults({}, attr, _.result(this, 'defaults'));
    this._data = {};
    this.set(attr, options);
    this.initialize.apply(this, arguments);
};

_.extend(BaseModel.prototype, {
    initialize: function (attr, options) {

    },

    set: function (key, val, options) {

        if (key == null) {
            return this;
        }

        var attrs;
        if (typeof key === 'object') {
            attrs = key;
            options = val;
        } else {
            (attrs = {})[key] = val;
        }

        options = options || {};

        _.extend(this._data, attrs);

        return this;
    },

    get: function (key, options) {
        return this._data[key];
    },

    toJSON: function () {
        return this._data;
    }

});

module.exports = BaseModel;