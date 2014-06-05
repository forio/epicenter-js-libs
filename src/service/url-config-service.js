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

    return {
        protocol: API_PROTOCOL,

        apiBase: (function() {
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
            return this.protocol + '://' + this.apiBase + '/' + api + '/' + this.accountPath + '/' + this.projectPath  + '/';
        }
    };
}();

if (typeof exports !== 'undefined') {
    module.exports = URLService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.url = URLService;
}

}).call(this);
