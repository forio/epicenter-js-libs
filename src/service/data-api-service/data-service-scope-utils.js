export const SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER',
    CUSTOM: 'CUSTOM',
};

export function addScopeToCollection(key, scope, session) {
    const delimiter = '_';
    if (scope === SCOPES.GROUP) {
        return [key, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.USER) {
        return [key, 'user', session.userId, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.CUSTOM) {
        return key;
    }
    throw new Error('Unknown scope ' + scope);
}

export function getScopedName(name, serviceOptions) {
    const split = name.split('/');
    const collection = split[0];
    split[0] = addScopeToCollection(collection, serviceOptions.scope, serviceOptions);
    const newURL = split.join('/');
    return newURL;
}