import AuthService from 'service/v3/auth-api-service-v3';
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
    login(loginParams, options) {
        const overridenServiceOptions = $.extend(true, {}, this.serviceOptions, options);
        const as = this.getAuthService(overridenServiceOptions);

        const params = Object.assign({}, loginParams, { objectType: 'user' });
        return as.login(params).catch((err, a, b)=> {
            console.log(err, a, b);
            const code = err && err.information && err.information.code;
            if (code === 'AUTHORIZATION_FAILURE') {
                return rejectPromise(code, 'Could not login, please check username/ password and try again');
            } else if (code === 'MULTI_FACTOR_AUTHENTICATION_REQUIRED') {
                return rejectPromise(code, 'Two Factor authentication has been enabled for this project.');
            } 
            throw err;

            // if (err.sta)
            // handle multi group error
            // handle mfa error
        }).then((res)=> {
            if (res.possibleGroups && res.possibleGroups.length) {
                return rejectPromise('MULTIPLE_GROUPS', 'User is part of multiple groups for this project. Please choose one', {
                    possibleGroups: res.possibleGroups
                });
            }
            const groupInfo = {
                groupId: res.groupKey,
                groupName: res.groupName,
                isFac: res.groupRole !== 'PARTICIPANT'
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