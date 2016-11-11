'use strict';

var urlConfigService = require('./service/url-config-service');

var envLoad = function (callback) {
    var envPromise;
    var host;
    var urlService = urlConfigService();
    var envPath = '/epicenter/v1/config';
    if (urlService.isLocalhost()) {
        host = 'https://forio.com';
    } else {
        host = '';
    }
    var infoUrl = host + envPath;
    envPromise = $.ajax({ url: infoUrl, async: false });
    envPromise.then(function (res) {
        var overrides = res.api;
        urlConfigService.defaults = $.extend(urlConfigService.defaults, overrides);
    }).fail(function (res) {
        // Epicenter/webserver not properly configured
        // fallback to api.forio.com
        urlConfigService.defaults = $.extend(urlConfigService.defaults, { protocol: 'https', host: 'api.forio.com' });
    });
    return envPromise.then(callback).fail(callback);
};

module.exports = envLoad;
