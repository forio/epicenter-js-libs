'use strict';

var env = {
    account: '',
    project: '',
    group: '',
    groupId: '',
    token: '',
    server: {
        host: 'api.forio.com',
        protocol: 'https'
    }
};

module.exports = {
    set: function (options) {
        env = _.merge(env, options);
    },

    get: function () {
        return env;
    }
};