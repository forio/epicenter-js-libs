(function(){
var root = this;
var F = root.F;
var qutils = F.util.query;

var AjaxHTTP= function (ajaxOptions) {

    var result = function(d) {
        return ($.isFunction(d)) ? d() : d;
    };

    var defaults = {
        url: '',

        contentType: 'application/json',
        headers: {},
        statusCode: {
            404: $.noop
        },
        parameterParser: qutils.toQueryFormat
    };

    //TODO: Add config service to switch between locations by url
    var transportOptions = $.extend({}, defaults, ajaxOptions);

    var connect = function (method, params, connectOptions) {
        params = result(params);
        params = ($.isPlainObject(params) || $.isArray(params)) ? JSON.stringify(params) : params;

        var options = $.extend(true, {}, transportOptions, connectOptions, {
            type: method,
            data: params
        });
        var ALLOWED_TO_BE_FUNCTIONS = ['data', 'url'];
        $.each(options, function(key, value) {
            if ($.isFunction(value) && $.inArray(key, ALLOWED_TO_BE_FUNCTIONS) !== -1) {
                options[key] = value();
            }
        });

        if (options.logLevel && options.logLevel === 'DEBUG' ) {
            console.log(options.url);
            var oldSuccessFn = options.success || $.noop;
            var newSuccess = function(response, ajaxStatus, ajaxReq) {
                console.log(response);
                oldSuccessFn.apply(this, arguments);
            };
        }
        return $.ajax(options);
    };

    return {
        /** All method paths will be relative to this **/
        basePath: '',

        statusHandlers: {

        },

        get:function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            return connect.call(this, 'GET', params, options);
        },
        post: function () {
            return connect.apply(this, ['post'].concat([].slice.call(arguments)));
        },
        patch: function () {
            return connect.apply(this, ['patch'].concat([].slice.call(arguments)));
        },
        put: function () {
            return connect.apply(this, ['put'].concat([].slice.call(arguments)));
        },
        delete: function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            if ($.trim(params)) {
                var delimiter = (result(options.url).indexOf('?') === -1) ? '?' : '&';
                options.url = result(options.url) + delimiter + params;
            }
            return connect.call(this, 'DELETE', null, options);
        },
        head: function () {
            return connect.apply(this, ['head'].concat([].slice.call(arguments)));
        },
        options: function () {
            return connect.apply(this, ['options'].concat([].slice.call(arguments)));
        }
    };
};

if (typeof exports !== 'undefined') {
    module.exports = AjaxHTTP;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.transport) { root.F.transport = {};}
    root.F.transport.Ajax = AjaxHTTP;
}

}).call(this);
