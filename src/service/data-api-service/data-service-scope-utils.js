import AuthManager from 'managers/auth-manager';
import qutil from 'util/query-util';
import { getURLConfig } from 'service/service-utils';

export const SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER',
    PROJECT: 'PROJECT',
    CUSTOM: 'CUSTOM',
};

export function addScopeToCollection(key, scope, session) {
    const publicAccessScopes = [SCOPES.CUSTOM];
    const allowPublicAccess = publicAccessScopes.indexOf(scope) !== -1;
    if (!Object.keys(session || {}).length && !allowPublicAccess) {
        throw new Error(`${scope} requires an authenticated user`);
    }
    const delimiter = '_';
    if (scope === SCOPES.GROUP) {
        return [key, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.USER) {
        return [key, 'user', session.userId, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.PROJECT) {
        return [key, 'project', 'scope'].join(delimiter);
    } else if (scope === SCOPES.CUSTOM) {
        return key;
    }
    throw new Error('Unknown scope ' + scope);
}

export function getScopedName(name, scope) {
    const split = name.split('/');
    const collection = split[0];
    const am = new AuthManager();
    const session = am.getCurrentUserSessionInfo();
    split[0] = addScopeToCollection(collection, scope, session);
    const newURL = split.join('/');
    return newURL;
}

export function getURL(API_ENDPOINT, collection, doc, options) {
    const urlConfig = getURLConfig(options);
    const rootPath = getScopedName(collection || options.root, options.scope);
    var url = urlConfig.getAPIPath(API_ENDPOINT) + qutil.addTrailingSlash(rootPath);
    if (doc) {
        url += qutil.addTrailingSlash(doc);
    }
    return url;
}