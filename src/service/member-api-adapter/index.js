/**
 *
 * ## Member API Adapter
 *
 * The Member API Adapter provides methods to look up information about end users for your project and how they are divided across groups. It is based on query capabilities of the underlying RESTful [Member API](../../../rest_apis/user_management/member/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). For example, if some of your end users are facilitators, or if your end users should be treated differently based on which group they are in, use the Member API to find that information.
 *
 *      const ma = new F.service.Member();
 *      ma.getGroupsForUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      ma.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */

import TransportFactory from 'transport/http-transport-factory';
import { pick } from 'util/object-util';
import { getURLConfig, getDefaultOptions } from '../service-utils';

const API_ENDPOINT = 'member/local';

export default function MemberAPIService(config) {
    const defaults = {
        /**
         * Epicenter user id. Defaults to a blank string.
         * @type {string}
         */
        userId: undefined,

        /**
         * Epicenter group id. Defaults to a blank string. Note that this is the group *id*, not the group *name*.
         * @type {string}
         */
        groupId: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };

    const serviceOptions = getDefaultOptions(defaults, config, { apiEndpoint: API_ENDPOINT });
    const urlConfig = getURLConfig(serviceOptions);
    const http = new TransportFactory(serviceOptions.transport);

    const getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, serviceOptions, params);
        }
        return serviceOptions;
    };

    const patchUserActiveField = function (params, active, options) {
        const httpOptions = $.extend(true, serviceOptions, options, {
            url: urlConfig.getAPIPath(API_ENDPOINT) + params.groupId + '/' + params.userId
        });

        return http.patch({ active: active }, httpOptions);
    };

    const publicAPI = {

        /**
        * Retrieve details about all of the group memberships for one end user. The membership details are returned in an array, with one element (group record) for each group to which the end user belongs.
        *
        * In the membership array, each group record includes the group id, project id, account (team) id, and an array of members. However, only the user whose userId is included in the call is listed in the members array (regardless of whether there are other members in this group).
        *
        * @example
        *       const ma = new F.service.Member();
        *       ma.getGroupsForUser('42836d4b-5b61-4fe4-80eb-3136e956ee5c')
        *           .then(function(memberships){
        *               for (const i=0; i<memberships.length; i++) {
        *                   console.log(memberships[i].groupId);
        *               }
        *           });
        *
        *       ma.getGroupsForUser({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c' });
        *
        * 
        * @param {string|object} params The user id for the end user. Alternatively, an object with field `userId` and value the user id.
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        getGroupsForUser: function (params, options) {
            options = options || {};
            const httpOptions = $.extend(true, serviceOptions, options);
            const isString = typeof params === 'string';
            const objParams = getFinalParams(params);
            if (!isString && !objParams.userId) {
                throw new Error('No userId specified.');
            }

            const getParms = isString ? { userId: params } : pick(objParams, ['userId']);
            return http.get(getParms, httpOptions);
        },

        /**
         * Add given userids to group
         *
         * @example
         *       const ma = new F.service.Member();
         *       ma.addUsersToGroup(['42836d4b-5b61-4fe4-80eb-3136e956ee5c', '42836d4b-5b61-4fe4-80eb-3136e956ee5c'])
         *
         * @param {string[] | {userId:string}[]} userlist list of users to add to group. [userId1,userId2..] or [{userid: userId},{userId: userId2}...]
         * @param {string} [groupId] Group to add users to. Pulls current group from session if not provided
         * @param {object} [options] Overrides for configuration options.
         * @returns {JQuery.Promise}
         */
        addUsersToGroup: function (userlist, groupId, options) {
            const httpOptions = getDefaultOptions(serviceOptions, options, { groupId: groupId });
            if (!httpOptions.groupId) {
                throw new Error('addUsersToGroup: No group provided, and cannot retrieve from session');
            }
            if (!userlist || !Array.isArray(userlist)) {
                throw new Error('addUsersToGroup: No userlist provided. Provide a list of userids to upload');
            }

            const params = userlist.map((u)=> ($.isPlainObject(u) ? u : { userId: u }));
            httpOptions.url = `${urlConfig.getAPIPath(API_ENDPOINT)}${httpOptions.groupId}`;
            return http.post(params, httpOptions);
        },
        
        /**
        * Retrieve details about one group, including an array of all its members.
        *
        * @example
        *       const ma = new F.service.Member();
        *       ma.getGroupDetails('80257a25-aa10-4959-968b-fd053901f72f')
        *           .then(function(group){
        *               for (const i=0; i<group.members.length; i++) {
        *                   console.log(group.members[i].userName);
        *               }
        *           });
        *
        *       ma.getGroupDetails({ groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * 
        * @param {string|object} params The group id. Alternatively, an object with field `groupId` and value the group id.
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        getGroupDetails: function (params, options) {
            options = options || {};
            const isString = typeof params === 'string';
            const objParams = getFinalParams(params);
            if (!isString && !objParams.groupId) {
                throw new Error('No groupId specified.');
            }

            const groupId = isString ? params : objParams.groupId;
            const httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(API_ENDPOINT) + groupId }
            );

            return http.get({}, httpOptions);
        },

        /**
        * Set a particular end user as `active`. Active end users can be assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * @example
        *       const ma = new F.service.Member();
        *       ma.makeUserActive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * 
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make active.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become active.
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        makeUserActive: function (params, options) {
            return patchUserActiveField(params, true, options);
        },

        /**
        * Set a particular end user as `inactive`. Inactive end users are not assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * @example
        *       const ma = new F.service.Member();
        *       ma.makeUserInactive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * 
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make inactive.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become inactive.
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        makeUserInactive: function (params, options) {
            return patchUserActiveField(params, false, options);
        }
    };

    $.extend(this, publicAPI);
}
