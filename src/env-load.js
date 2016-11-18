'use strict';

var urlConfigService = require('./service/url-config-service');

var envLoad = function (callback) {
    var urlService = urlConfigService();
    var infoUrl = urlService.getAPIPath('config');
    var envPromise = $.ajax({ url: infoUrl, async: false });
    envPromise = envPromise.then(function (res) {
        var overrides = res.api;
        urlConfigService.defaults = $.extend(urlConfigService.defaults, overrides);
    });
    return envPromise.then(callback).fail(callback);
};

module.exports = envLoad;
