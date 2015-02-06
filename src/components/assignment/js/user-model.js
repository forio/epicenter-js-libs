'use strict';

var User = function (attr, options) {
    this._data = {};
    this.set(attr, options);
};

User.prototype = {
    set: function (attr, options) {
        if (attr) {
            _.extend(this._data, attr);
        }
    },

    toJSON: function () {
        return this._data;
    }

};

module.exports = User;