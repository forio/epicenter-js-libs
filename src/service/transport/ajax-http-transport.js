module.exports = function (config) {

    var defaults = {
        contentType: 'application/json',
        headers: {},
        statusCode: {
            404: $.noop
        },
    };
    var options = $.extend({}, defaults, config);

    var connect = function (method, params, ajaxOptions) {
      return  $.ajax($.extend(true, {
        type: method,
        data: JSON.stringify(params)
      }, ajaxOptions);
    };

    return {
        /** All method paths will be relative to this **/
        basePath: '',

        statusHandlers: {

        },


        get:function () {
            return connect.apply(this, ['get'].concat(arguments));
        },
        post: function () {
            return connect.apply(this, ['post'].concat(arguments));
        },
        put: function () {
            return connect.apply(this, ['put'].concat(arguments));
        },
        delete: function () {
            return connect.apply(this, ['delete'].concat(arguments));
        },
        head: function () {
            return connect.apply(this, ['head'].concat(arguments));
        },
        options: function () {
            return connect.apply(this, ['options'].concat(arguments));
        }
    }
};
