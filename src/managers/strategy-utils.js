'use strict';

module.exports = {
    injectFiltersFromSession: function (currentFilter, session, options) {
        var defaults = {
            scopeByGroup: true,
            scopeByUser: true,
        };
        var opts = $.extend(true, {}, defaults, options);

        if (opts.scopeByGroup && session && session.groupName) {
            currentFilter['scope.group'] = session.groupName;
        }
        if (opts.scopeByUser && session && session.userId) {
            currentFilter['user.id'] = session.userId;
        }
        return currentFilter;
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