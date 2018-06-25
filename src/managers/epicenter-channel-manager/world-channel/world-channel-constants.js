export const TOPIC_SUBTYPES = {
    VARIABLES: 'variables',
    OPERATIONS: 'operation',
    RESET: 'new',
    ONLINE: 'connect',
    OFFLINE: 'disconnect',
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
};

export const TOPICS = {
    ALL: '',
    RUN: 'run',
    RUN_VARIABLES: `run/${TOPIC_SUBTYPES.VARIABLES}`,
    RUN_OPERATIONS: `run/${TOPIC_SUBTYPES.OPERATIONS}`,
    RUN_RESET: `run/${TOPIC_SUBTYPES.RESET}`,
    PRESENCE: 'user',
    PRESENCE_ONLINE: `user/${TOPIC_SUBTYPES.ONLINE}`,
    PRESENCE_OFFLINE: `user/${TOPIC_SUBTYPES.OFFLINE}`,
    ROLES: 'world',
    ROLES_ASSIGN: `world/${TOPIC_SUBTYPES.ASSIGN}`,
    ROLES_UNASSIGN: `world/${TOPIC_SUBTYPES.UNASSIGN}`,
};