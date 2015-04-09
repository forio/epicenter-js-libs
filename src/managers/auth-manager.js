/**
* ## Authorization Manager
*
* The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
*
* The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).
*
* ####Using the Authorization Manager
*
* To use the Authorization Manager, instantiate it. Then, make calls to any of the methods you need:
*
*       var authMgr = new F.manager.AuthManager({
*           account: 'acme-simulations',
*           userName: 'enduser1',
*           password: 'passw0rd'
*       });
*       authMgr.login();
*       authMgr.getCurrentUserSessionInfo();
*
* The `options` object passed to the `F.manager.AuthManager()` call can include:
*
*   * `account`: The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
*   * `userName`: Email or username to use for logging in.
*   * `password`: Password for specified `userName`.
*   * `project`: The **Project ID** for the project to log this user into. Optional.
*   * `group`: Name of the group to which `userName` belongs. Required for end users if the `project` is specified.
*
* If you prefer starting from a template, the Epicenter JS Libs [Login Component](../../#components) uses the Authorization Manager as well. This sample HTML page (and associated CSS and JS files) provides a login form for team members and end users of your project. It also includes a group selector for end users that are members of multiple groups.
*/

'use strict';
var ConfigService = require('../service/configuration-service');
var AuthAdapter = require('../service/auth-api-service');
var MemberAdapter = require('../service/member-api-adapter');
var StorageFactory = require('../store/store-factory');
var Buffer = require('buffer').Buffer;
var keyNames = require('./key-names');

var defaults = {
    /**
     * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
     * @type {string}
     */
    store: { synchronous: true }
};

var EPI_COOKIE_KEY = keyNames.EPI_COOKIE_KEY;
var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var store;
var token;
var session;

function saveSession(userInfo) {
    var serialized = JSON.stringify(userInfo);
    store.set(EPI_SESSION_KEY, serialized);

    //jshint camelcase: false
    //jscs:disable
    store.set(EPI_COOKIE_KEY, userInfo.auth_token);
}

function getSession() {
    var session = store.get(EPI_SESSION_KEY) || '{}';
    return JSON.parse(session);
}

function AuthManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    var urlConfig = new ConfigService(this.options).get('server');
    if (!this.options.account) {
        this.options.account = urlConfig.accountPath;
    }

    // null might specified to disable project filtering
    if (this.options.project === undefined) {
        this.options.project = urlConfig.projectPath;
    }

    store = new StorageFactory(this.options.store);
    session = getSession();
    token = store.get(EPI_COOKIE_KEY) || '';
    //jshint camelcase: false
    //jscs:disable
    this.authAdapter = new AuthAdapter(this.options, { token: session.auth_token });
}

var _findUserInGroup = function (members, id) {
    for (var j = 0; j<members.length; j++) {
        if (members[j].userId === id) {
            return members[j];
        }
    }


    return null;
};

AuthManager.prototype = $.extend(AuthManager.prototype, {

    /**
    * Logs user in.
    *
    * **Example**
    *
    *       authMgr.login({
    *           account: 'acme-simulations', 
    *           userName: 'enduser1', 
    *           password: 'passw0rd' 
    *       });
    *
    *       authMgr.login()
    *           .then(function(authAdapter) {
    *               // if enduser1 belongs to exactly one group
    *               // (or if the login() call is modified to include the group)
    *               // continue here
    *           })
    *           .fail(function(authAdapter) {
    *               // if enduser1 belongs to multiple groups, 
    *               // the login() call fails 
    *               // and returns all groups of which the user is a member
    *           });
    *
    * **Parameters**
    *
    * @param {Object} `options` (Optional) Overrides for configuration options. If not passed in when creating an instance of the manager (`F.manager.AuthManager()`), these options should include: 
    * @param {string} `options.account` The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
    * @param {string} `options.userName` Email or username to use for logging in.
    * @param {string} `options.password` Password for specified `userName`.
    * @param {string} `options.project` (Optional) The **Project ID** for the project to log this user into.
    * @param {string} `options.group` Name of the group to which `userName` belongs. Required for [end users](../../../glossary/#users) if the `project` is specified, and for end users that are members of multiple [groups](../../../glossary/#groups), otherwise optional.
    */
    login: function (options) {
        var _this = this;
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, { success: $.noop, error: $.noop }, this.options, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

        var decodeToken = function (token) {
            var encoded = token.split('.')[1];
            while (encoded.length % 4 !== 0) {
                encoded += '=';
            }

            var decode = window.atob ? window.atob : function (encoded) { return new Buffer(encoded, 'base64').toString('ascii'); };

            return JSON.parse(decode(encoded));
        };

        var handleGroupError = function (message, statusCode, data) {
            // logout the user since it's in an invalid state with no group selected
            _this.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode });
                $d.reject(error);
            });
        };

        var handleSuccess = function (response) {
            //jshint camelcase: false
            //jscs:disable
            token = response.access_token;

            var userInfo = decodeToken(token);
            var userGroupOpts = $.extend(true, {}, adapterOptions, { success: $.noop, token: token });
            _this.getUserGroups({ userId: userInfo.user_id, token: token }, userGroupOpts).done( function (memberInfo) {
                var data = {auth: response, user: userInfo, userGroups: memberInfo, groupSelection: {} };

                var sessionInfo = {
                    'auth_token': token,
                    'account': adapterOptions.account,
                    'project': adapterOptions.project,
                    'userId': userInfo.user_id
                };
                // The group is not required if the user is not logging into a project
                if (!adapterOptions.project) {
                    saveSession(sessionInfo);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                    return;
                }

                var group = null;
                if (memberInfo.length === 0) {
                    handleGroupError('The user has no groups associated in this account', 401, data);
                    return;
                } else if (memberInfo.length === 1) {
                    // Select the only group
                    group = memberInfo[0];
                } else if (memberInfo.length > 1) {
                    if (groupId) {
                        var filteredGroups = $.grep(memberInfo, function (resGroup) {
                            return resGroup.groupId === groupId;
                        });
                        group = filteredGroups.length === 1 ? filteredGroups[0] : null;
                    }
                }

                if (group) {
                    var groupSelection = group.groupId;
                    data.groupSelection[adapterOptions.project] = groupSelection;
                    var sessionInfoWithGroup = $.extend({}, sessionInfo, {
                        'groupId': group.groupId,
                        'groupName': group.name,
                        'isFac': _findUserInGroup(group.members, userInfo.user_id).role === 'facilitator'
                    });
                    saveSession(sessionInfoWithGroup);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This account is associated with more that one group. Please specify a group id to log into and try again', 403, data);
                }
            }).fail($d.reject);
        };

        adapterOptions.success = handleSuccess;
        adapterOptions.error = function (response) {
            if (adapterOptions.account) {
                // Try to login as a system user
                adapterOptions.account = null;
                adapterOptions.error = function () {
                    outError.apply(this, arguments);
                    $d.reject(response);
                };

                _this.authAdapter.login(adapterOptions);
                return;
            }

            outError.apply(this, arguments);
            $d.reject(response);
        };

        this.authAdapter.login(adapterOptions);
        return $d.promise();
    },

    /**
    * Logs user out.
    *
    * **Example**
    *
    *       authMgr.logout();
    *
    * **Parameters**
    *
    * @param {Object} `options` (Optional) Overrides for configuration options.
    */
    logout: function (options) {
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, {success: $.noop, token: token }, this.options, options);

        var removeCookieFn = function (response) {
            store.remove(EPI_COOKIE_KEY, adapterOptions);
            store.remove(EPI_SESSION_KEY, adapterOptions);
            token = '';
        };

        var outSuccess = adapterOptions.success;
        adapterOptions.success = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
        };

        // Epicenter returns a bad request when trying to delete a token. It seems like the API call is not implemented yet
        // Once it's implemented this error handler should not be necessary.
        adapterOptions.error = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
            $d.resolve();
        };

        this.authAdapter.logout(adapterOptions).done($d.resolve);
        return $d.promise();
    },

    /**
     * Returns the existing user access token if the user is already logged in. Otherwise, logs the user in, creating a new user access token, and returns the new token. (See [more background on access tokens](../../../project_access/)).
     *
     * **Example**
     *
     *      authMgr.getToken()
     *          .then(function (token) { 
     *              console.log('My token is ', token); 
     *          });
     *
     * **Parameters**
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getToken: function (options) {
        var httpOptions = $.extend(true, this.options, options);

        var $d = $.Deferred();
        if (token) {
            $d.resolve(token);
        } else {
            this.login(httpOptions).then($d.resolve);
        }
        return $d.promise();
    },

    /**
     * Returns an array of group records, one for each group of which the current user is a member. Each group record includes the group `name`, `account`, `project`, and `groupId`.
     *
     * If some end users in your project are members of multiple groups, this is a useful method to call on your project's login page. When the user attempts to log in, you can use this to display the groups of which the user is member, and have the user select the correct group to log in to for this session.
     *
     * **Example**
     *
     *      // get groups for current user
     *      authMgr.getUserGroups()
     *          .then(function (groups) { 
     *              for (var i=0; i < groups.length; i++) 
     *                  { console.log(groups[i].name); }
     *          });
     *
     *      // get groups for particular user
     *      authMgr.getUserGroups({userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3'});
     *
     * **Parameters**
     * @param {Object} `params` (Optional) Object with a userId and token properties.
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getUserGroups: function (params, options) {
        var adapterOptions = $.extend(true, { success: $.noop }, this.options, options);
        var $d = $.Deferred();
        var outSuccess = adapterOptions.success;

        adapterOptions.success = function (memberInfo) {
            // The member API is at the account scope, we filter by project
            if (adapterOptions.project) {
                memberInfo = $.grep(memberInfo, function (group) {
                    return group.project === adapterOptions.project;
                });
            }

            outSuccess.apply(this, [memberInfo]);
            $d.resolve(memberInfo);
        };

        var memberAdapter = new MemberAdapter({ token: params.token });
        memberAdapter.getGroupsByUser(params, adapterOptions).fail($d.reject);
        return $d.promise();
    },

    /**
     * Returns session information for the current user, including the `userId`, `account`, `project`, `groupId`, `groupName`, `isFac` (whether the end user is a facilitator of this group), and `auth_token` (user access token).
     *
     * *Important*: This method is synchronous. The session information is returned immediately in an object; no callbacks or promises are needed.
     *
     * By default, session information is stored in a cookie in the browser. You can change this with the `store` configuration option. 
     *
     * **Example**
     *
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *
     * **Parameters**
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getCurrentUserSessionInfo: function (options) {
        return getSession(options);
    }
});

module.exports = AuthManager;
