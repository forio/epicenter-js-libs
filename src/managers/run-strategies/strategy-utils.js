import RunService from 'service/run-api-service';

export function mergeRunOptions(run, options) {
    if (run instanceof RunService) {
        run.updateConfig(options);
        return run;
    }
    return $.extend(true, {}, run, options);
}
export function injectFiltersFromSession(currentFilter, session, options) {
    const defaults = {
        scopeByGroup: true,
        scopeByUser: true,
    };
    const opts = $.extend(true, {}, defaults, options);
    const newFilter = {};
    if (opts.scopeByGroup && session && session.groupName) {
        newFilter.scope = { group: session.groupName };
    }
    if (opts.scopeByUser && session && session.userId) {
        newFilter['user.id'] = session.userId;
    }
    const filter = $.extend(true, {}, currentFilter, newFilter);
    return filter;
}
export function injectScopeFromSession(currentParams, session) {
    const group = session && session.groupName;
    const params = $.extend(true, {}, currentParams);
    if (group) {
        $.extend(true, params, {
            scope: { group: group }
        });
    }
    return params;
}