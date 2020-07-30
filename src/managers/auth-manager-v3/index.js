import AuthService from 'service/v3/auth-api-service-v3';
import MemberService from 'service/v3/member-api-adapter-v3';
import { rejectPromise } from 'util/index';

import SessionManager from 'store/session-manager';


const errorCodes = {
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
    MFA_REQUIRED: 'MFA_REQUIRED',
    MULTIPLE_GROUPS: 'MULTIPLE_GROUPS',
};
export default class AuthManagerV3 {

    constructor(config) {
        const defaults = {

        };
        const serviceOptions = $.extend({}, defaults, config);
        this.serviceOptions = serviceOptions;

        this.errors = errorCodes;
    }


    getAuthService(config) {
        const opts = $.extend({}, this.serviceOptions, config);
        const as = new AuthService(opts);
        return as;
    }
    getMemberService(config) {
        const opts = $.extend({}, this.serviceOptions, config);
        const ms = new MemberService(opts);
        return ms;
    }
    login(loginParams, options) {
        const overridenServiceOptions = $.extend(true, {}, this.serviceOptions, options);
        const as = this.getAuthService(overridenServiceOptions);

        const params = Object.assign({}, loginParams, { objectType: 'user' });
        return as.login(params).catch((err, a, b, c)=> {
            if (err.responseJSON) err = err.responseJSON;
            const code = err && err.information && err.information.code;
            if (code === 'AUTHORIZATION_FAILURE') {
                return rejectPromise(code, 'Could not login, please check username / password and try again.');
            } else if (code === 'PASSWORD_EXPIRATION') {
                return rejectPromise(code, 'Your password has expired.  Please contact your administrator and request a password reset.');
            } else if (code === 'MULTI_FACTOR_AUTHENTICATION_MISSING') {
                return rejectPromise(code, 'Multi factor authentication has been enabled for this project.');
            } else if (code === 'MULTI_FACTOR_AUTHENTICATION_FAILURE') {
                return rejectPromise(code, 'The provided Authorization Code is invalid.');
            } else if (code === 'MULTI_FACTOR_AUTHENTICATION_REQUIRED') {
                return rejectPromise(code, 'This project requires multi factor authentication.');
            }
            throw err;

            // if (err.sta)
            // handle multi group error
            // handle mfa error
        }).then((res)=> {
            if (!res.groupKey && !res.multipleGroups) {
                return rejectPromise('NO_GROUPS', 'User is not a member of a simulation group.');
            }
            if (!res.groupKey && res.multipleGroups && res.token) {
                const overridenServiceOptions = $.extend(true, { token: res.token }, this.serviceOptions, options);
                const ms = this.getMemberService(overridenServiceOptions);
                return ms.getGroupsForUser().then((groups)=> rejectPromise('MULTIPLE_GROUPS', 'User is part of multiple groups for this project. Please choose one.', {
                    possibleGroups: groups.map((group)=> {
                        group.id = group.groupKey;
                        return group;
                    }),
                }));
            }

            const groupInfo = {
                groupId: res.groupKey,
                groupName: res.groupName,
                isFac: res.groupRole && res.groupRole !== 'PARTICIPANT'
            };
            const sessionInfo = Object.assign({}, groupInfo, {
                auth_token: res.session,
                userName: res.userHandle,
                account: res.accountShortName,
                project: res.projectShortName,
                userId: res.userKey,

                groups: [groupInfo],
                isTeamMember: false,
            });

            const sm = new SessionManager(overridenServiceOptions);
            sm.saveSession(sessionInfo);

            return sessionInfo;
        });
    }

    logout(options) {
        const overridenServiceOptions = $.extend(true, {}, this.serviceOptions, options);
        const sm = new SessionManager(overridenServiceOptions);
        sm.removeSession();
        return Promise.resolve();
    }
    isLoggedIn() {
        var session = this.getCurrentUserSessionInfo();
        return !!(session && session.userId);
    }
    getCurrentUserSessionInfo(options) {
        const overridenServiceOptions = $.extend(true, {}, this.serviceOptions, options);
        const sm = new SessionManager(overridenServiceOptions);
        return sm.getSession();
    }
}
