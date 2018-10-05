import AuthManager from 'managers/auth-manager';
import { normalizeSlashes } from 'util/query-util';
import { getURLConfig } from 'service/service-utils';

export const SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER',
    PROJECT: 'PROJECT',
    FACILITATOR: 'FACILITATOR',
    CUSTOM: 'CUSTOM',
};

/**
 * 
 * @param {string} key to prefix
 * @param {string} scope 
 * @param {object} session 
 * 
 * @returns {string} scoped name
 */
export function addScopeToCollection(key, scope, session) {
    const publicAccessScopes = [SCOPES.CUSTOM];
    const allowPublicAccess = publicAccessScopes.indexOf(scope) !== -1;
    if (!Object.keys(session || {}).length && !allowPublicAccess) {
        throw new Error(`DataService Authorization error: ${scope} for ${key} requires an authenticated user`);
    }
    scope = scope.toUpperCase();
    const delimiter = '_';
    if (scope === SCOPES.GROUP) {
        return [key, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.USER) {
        return [key, 'user', session.userId, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.FACILITATOR) {
        const isFac = session.isTeamMember || session.isFac;
        if (!isFac) {
            throw new Error(`DataService Authorization error: ${scope} for ${key} requires a Facilitator user`);
        }
        return [key, 'fac', 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.PROJECT) {
        return [key, 'project', 'scope'].join(delimiter);
    } else if (scope === SCOPES.CUSTOM) {
        return key;
    }
    throw new Error('Unknown scope ' + scope);
}

/**
 * Takes name for form collection/doc/.. and adds scope to just collection name
 * 
 * @param {string} name 
 * @param {string} scope 
 * @param {object} [session] 
 * @returns {string}
 */
export function getScopedName(name, scope, session) {
    if (!session) {
        const am = new AuthManager();
        session = am.getCurrentUserSessionInfo();
    }
    const split = name.split('/');
    const collection = split[0];
   
    split[0] = addScopeToCollection(collection, scope, session);

    const newURL = split.join('/');
    return newURL;
}

export function getURL(API_ENDPOINT, collection, doc, options) {
    const scopedCollection = getScopedName(collection || options.root, options.scope);

    const urlConfig = getURLConfig(options);
    const baseURL = urlConfig.getAPIPath(API_ENDPOINT);

    const fullURL = `${baseURL}/${scopedCollection}/${doc || ''}`;
    return normalizeSlashes(fullURL, { leading: true, trailing: true });
}