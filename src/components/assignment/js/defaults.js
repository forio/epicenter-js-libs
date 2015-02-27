'use strict';


var account = '';
var project = '';
var groupName = '';
var groupId = '';



var env = {
    account: account,
    project: project,
    group: groupName,
    groupId: groupId,
    server: {
        host: 'localhost:8080',
        protocol: 'http'
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