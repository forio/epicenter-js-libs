/**
 * 
 *  const UserManager = F.manager.User;
    const um = new UserManager(getRunParams());
    um.uploadUsersToGroup(contents).then(function(){ alert('Upload sucess!'); }).catch(function (res) {
        if (res.type === UserManager.errors.EMPTY_USERS) {
            alert('No users specified to upload');
        } else if (res.type === UserManager.errors.NO_GROUP_PROVIDED) {
            alert('No group found. Create a group and login as a facilitator to upload users');
        } else {
            alert('Unknown error, please try again');
            console.error('Upload users error', res);
        }
    })
 */

import UserService from 'service/user-api-adapter';
import MemberService from 'service/member-api-adapter';
import AuthManager from 'managers/auth-manager';

import { getDefaultOptions } from 'service/service-utils';

export function parseUsers(userList) {
    const expectedCols = [
        { label: 'Email', value: 'userName' },
        { label: 'First Name', value: 'firstName' },
        { label: 'Last Name', value: 'lastName' },
        { label: 'Password', value: 'password' }
    ];
    const parsed = userList.split(/\r\r|\r|\n/).reduce((accum, row, index)=> {
        const splitter = row && (/\t/).test(row) ? /\t/ : ',';
        const rowContents = row.split(splitter);
        if (!rowContents.length) {
            return accum;
        }
        const missingFields = expectedCols.filter((col, index)=> rowContents[index] === undefined || !rowContents[index].trim());
        if (missingFields.length) {
            const missingLabels = missingFields.map((f)=> f.label);
            accum.invalid.push({
                userName: rowContents[0] || `Line ${index + 1}`,
                message: `Missing ${missingLabels.join(', ')}`,
                reason: 'MISSING_FIELDS',
                context: { missingFields: missingLabels }
            });
            return accum;
        }
        const user = expectedCols.reduce((accum, col, index)=> {
            const val = rowContents[index].trim();
            accum[col.value] = val;
            return accum;
        }, {});

        accum.valid.push(user);
        return accum;
    }, {
        valid: [],
        invalid: [],
    });
    return parsed;
}

const ERROR_TYPES = {
    EMPTY_USERS: 'EMPTY_USERS',
    NO_GROUP_PROVIDED: 'NO_GROUP_PROVIDED',
    API_REJECT: 'API_REJECT',
    GROUP_LIMIT_EXCEEDED: 'GROUP_LIMIT_EXCEEDED',
};

class UserManager {
    constructor(config) {
        const defaults = {
            /**
             * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            account: undefined,
            /**
             * The project id. Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            project: undefined,
            /**
             * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
             * @see [Authentication API Service](../auth-api-service/) for getting tokens.
             * @type {String}
             */
            token: undefined,

            //Options to pass on to the underlying transport layer
            transport: {}
        };
        const serviceOptions = getDefaultOptions(defaults, config);
        this.serviceOptions = serviceOptions;
    }

    /**
     *  Bulk creates user accounts and adds them to a group. Input userlist is typically the string contents of a textarea with user data.
     * 
     * @param {string} userList list of users seperated by newlines, with each line containing email, firstname, lastname, password separated by tabs/commas
     * @param {string} [groupId] id of group to upload to. Defaults to getting current group from session
     * @param {object} [options]  overrides for service options
     * @returns {JQuery.Promise}
     */
    uploadUsersToGroup(userList, groupId, options) {
        if (!userList || !userList.trim()) {
            return $.Deferred().reject({ 
                type: ERROR_TYPES.EMPTY_USERS,
                message: 'uploadUsersToGroup: No users specified to upload.' 
            }).promise();
        }
        const serviceOptions = getDefaultOptions(this.serviceOptions, options);
        if (!groupId) {
            const am = new AuthManager(serviceOptions);
            const session = am.getCurrentUserSessionInfo();
            groupId = session.groupId;

            if (!groupId) {
                return $.Deferred().reject({ 
                    type: ERROR_TYPES.NO_GROUP_PROVIDED,
                    message: 'uploadUsersToGroup: No group specified, and no session available to pick from.' 
                }).promise();
            }
        }

        const usersToAdd = parseUsers(userList.trim());
        if (!usersToAdd.valid.length) {
            return $.Deferred().resolve({
                errors: usersToAdd.invalid,
                created: [],
                duplicates: []
            }).promise();
        }

        const userService = new UserService(serviceOptions);
        const memberService = new MemberService(serviceOptions);
        return userService.createUsers(usersToAdd.valid).then((userRes)=> {
            const validUsers = [].concat(userRes.saved, userRes.updated, userRes.duplicate);
            const validIds = validUsers.map((u)=> u.id);
            const userWithErrors = userRes.errors.map((e)=> {
                return $.extend(true, e, {
                    reason: ERROR_TYPES.API_REJECT,
                    context: e
                });
            });
            userRes.errors = [].concat(userWithErrors, usersToAdd.invalid);
            return memberService.addUsersToGroup(validIds, groupId).then(()=> userRes, function handleMemberError(memberXHR) {
                const memberErr = memberXHR.responseJSON;
                const isGroupLimitErr = memberErr && memberErr.message && memberErr.message.match(/exceeded your group limit\(([0-9]+)\)/i);
                if (!isGroupLimitErr) {
                    throw memberErr;
                }
                
                const groupLimit = +isGroupLimitErr[1];
                const skippedUsers = validUsers.slice(groupLimit).map((u)=> {
                    return $.extend({}, u, { reason: ERROR_TYPES.GROUP_LIMIT_EXCEEDED, message: 'Exceeded group limit' });
                });
                
                function excludingSkipped(users, skipped) {
                    return users.filter((u)=> {
                        const isValid = !skipped.find((su)=> su.userName === u.userName);
                        return isValid;
                    });
                }
                return {
                    errors: [].concat(userRes.errors, skippedUsers),
                    saved: excludingSkipped(userRes.saved, skippedUsers),
                    updated: excludingSkipped(userRes.updated, skippedUsers),
                    duplicate: excludingSkipped(userRes.duplicate, skippedUsers),
                };
            });
        }).then((res)=> {
            return {
                errors: res.errors,
                duplicates: res.duplicate, //pluralizing for consistency
                created: [].concat(res.saved, res.updated), //no real distinction between the two so combining
            };
        });
    }
}

UserManager.errors = ERROR_TYPES;

export default UserManager;