(function(){
var root = this;

var URLService= function (config) {
    //TODO: urlutils to get host, since no window on node

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var getAPIPath = function(api) {
        var PROJECT_APIS = ['run', 'data'];
        var apiPath = this.protocol + '://' + this.host + '/' + api + '/';

        if ($.inArray(api, PROJECT_APIS) !== -1) {
            apiPath += this.accountPath + '/' + this.projectPath  + '/';
        }
        return apiPath;
    };
    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        host: (function() {
            host = window.location.host;
            if (!host) host = 'forio.com';
            return (HOST_API_MAPPING[host]) ? HOST_API_MAPPING[host] : 'api.' + host;
        }()),

        accountPath: (function () {
            var accnt = 'test';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }()),

        projectPath: (function () {
            var prj = 'test';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                prj = path[3];
            }
            return prj;
        }()),

        getAPIPath: getAPIPath
    };
    publicExports.apiPath = getAPIPath(publicExports.api);

    $.extend(publicExports, config);
    return publicExports;
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
