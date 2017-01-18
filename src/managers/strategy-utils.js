'use strict';

module.exports = {
    injectFiltersFromSession: function (currentFilter, session, options) {
        var defaults = {
            scopeByGroup: true,
            scopeByUser: true,
        };
        var opts = $.extend(true, {}, defaults, options);

        var filter = $.extend(true, {}, currentFilter);
        if (opts.scopeByGroup && session && session.groupName) {
            filter['scope.group'] = session.groupName;
        }
        if (opts.scopeByUser && session && session.userId) {
            filter['user.id'] = session.userId;
        }
        return filter;
    },

    injectScopeFromSession: function (currentParams, session) {
        var group = session && session.groupName;
        var params = $.extend(true, {}, currentParams);
        if (group) {
            $.extend(params, {
                scope: { group: group }
            });
        }
        return params;
    }
};