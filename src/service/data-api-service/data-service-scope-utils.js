export const SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER',
    CUSTOM: 'CUSTOM',
};

export function getCollectionName(prefix, scope, session) {
    const delimiter = '_';
    if (scope === SCOPES.GROUP) {
        return [prefix, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.USER) {
        return [prefix, 'user', session.userId, 'group', session.groupId].join(delimiter);
    } else if (scope === SCOPES.CUSTOM) {
        return prefix;
    }
    throw new Error('Unknown scope ' + scope);
}