(function(){
var root = this;
var F = root.F;

var URLService= function (config) {
    //TODO: urlutils to get host, since no window on node

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    return $.extend(true, {}, {
        protocol: API_PROTOCOL,

        host: (function() {
            host = window.location.host;
            return HOST_API_MAPPING[host] || 'api.forio.com';
        }()),

        accountPath: (function () {
            return 'test';
        }()),

        projectPath: (function () {
            return 'test';
        }()),

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data'];
            var apiPath = this.protocol + '://' + this.host + '/' + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath  + '/';
            }
            return apiPath;
        }
    }, config);
};

if (typeof exports !== 'undefined') {
    module.exports = URLService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.URL = URLService;
}

}).call(this);
