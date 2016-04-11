'use strict';

var urlConfigService = require('./service/url-config-service');

var envLoad = function (callback) {
    var envPromise;
    var host;
    var urlService = urlConfigService();
    var envPath = '/epicenter/v1/config';
    if (urlService.isLocalhost()) {
        envPromise = $.Deferred();
        envPromise.resolve();
        host = 'https://forio.com';
    } else {
        host = '';
    }
    var infoUrl = host + envPath;
    envPromise = $.ajax(infoUrl);
    envPromise.done(function (res) {
        var api = res.api;
        $.extend(urlConfigService, api);
    });
    envPromise.done(callback).fail(callback);
};

module.exports = envLoad;
