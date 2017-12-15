(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : self; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    var str = String(input);
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next str index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      str.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = str.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],2:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(require,module,exports){
module.exports={
    "version": "v2"
}

},{}],4:[function(require,module,exports){
(function (global){
/**
 * Epicenter Javascript libraries
 * v2.5.0
 * https://github.com/forio/epicenter-js-libs
 */

var F = {
    _private: {}, //need this hook now because tests expect everything to be global. Delete once tests are browserified
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    },

};

F.load = require('./env-load');

if (!global.SKIP_ENV_LOAD) {
    F.load();
}

F.util.query = require('./util/query-util');
F.util.run = require('./util/run-util');
F.util.classFrom = require('./util/inherit');
F._private.strategyutils = require('./managers/strategy-utils');

F.factory.Transport = require('./transport/http-transport-factory');
F.transport.Ajax = require('./transport/ajax-http-transport');

F.service.URL = require('./service/url-config-service');
F.service.Config = require('./service/configuration-service');
F.service.Run = require('./service/run-api-service');
F.service.File = require('./service/admin-file-service');
F.service.Variables = require('./service/variables-api-service');
F.service.Data = require('./service/data-api-service');
F.service.Auth = require('./service/auth-api-service');
F.service.World = require('./service/world-api-adapter');
F.service.State = require('./service/state-api-adapter');
F.service.User = require('./service/user-api-adapter');
F.service.Member = require('./service/member-api-adapter');
F.service.Asset = require('./service/asset-api-adapter');
F.service.Group = require('./service/group-api-service');
F.service.Introspect = require('./service/introspection-api-service');
F.service.Presence = require('./service/presence-api-service');

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager');
F.manager.RunManager = require('./managers/run-manager');
F.manager.AuthManager = require('./managers/auth-manager');
F.manager.WorldManager = require('./managers/world-manager');
F.manager.SavedRunsManager = require('./managers/saved-runs-manager');

var strategies = require('./managers/run-strategies');
F.manager.strategy = strategies.list; //TODO: this is not really a manager so namespace this better

F.manager.ChannelManager = require('./managers/epicenter-channel-manager');
F.service.Channel = require('./service/channel-service');

F.version = '2.5.0';
F.api = require('./api-version.json');

F.constants = require('./managers/key-names');

global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./api-version.json":3,"./env-load":5,"./managers/auth-manager":6,"./managers/epicenter-channel-manager":8,"./managers/key-names":9,"./managers/run-manager":10,"./managers/run-strategies":14,"./managers/saved-runs-manager":21,"./managers/scenario-manager":22,"./managers/strategy-utils":26,"./managers/world-manager":27,"./service/admin-file-service":28,"./service/asset-api-adapter":29,"./service/auth-api-service":30,"./service/channel-service":31,"./service/configuration-service":32,"./service/data-api-service":33,"./service/group-api-service":34,"./service/introspection-api-service":35,"./service/member-api-adapter":36,"./service/presence-api-service":37,"./service/run-api-service":38,"./service/state-api-adapter":40,"./service/url-config-service":41,"./service/user-api-adapter":42,"./service/variables-api-service":43,"./service/world-api-adapter":44,"./store/cookie-store":45,"./store/store-factory":47,"./transport/ajax-http-transport":48,"./transport/http-transport-factory":49,"./util/inherit":50,"./util/query-util":53,"./util/run-util":54}],5:[function(require,module,exports){
'use strict';

var URLConfigService = require('./service/url-config-service');

var envLoad = function (callback) {
    var urlService = new URLConfigService();
    var infoUrl = urlService.getAPIPath('config');
    var envPromise = $.ajax({ url: infoUrl, async: false });
    envPromise = envPromise.then(function (res) {
        var overrides = res.api;
        URLConfigService.defaults = $.extend(URLConfigService.defaults, overrides);
    });
    return envPromise.then(callback).fail(callback);
};

module.exports = envLoad;

},{"./service/url-config-service":41}],6:[function(require,module,exports){
/**
* ## Authorization Manager
*
* The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
*
* The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).
*
* #### Using the Authorization Manager
*
* To use the Authorization Manager, instantiate it. Then, make calls to any of the methods you need:
*
*       var authMgr = new F.manager.AuthManager({
*           account: 'acme-simulations',
*           userName: 'enduser1',
*           password: 'passw0rd'
*       });
*       authMgr.login().then(function () {
*           authMgr.getCurrentUserSessionInfo();
*       });
*
*
* The `options` object passed to the `F.manager.AuthManager()` call can include:
*
*   * `account`: The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
*   * `userName`: Email or username to use for logging in.
*   * `password`: Password for specified `userName`.
*   * `project`: The **Project ID** for the project to log this user into. Optional.
*   * `groupId`: Id of the group to which `userName` belongs. Required for end users if the `project` is specified.
*
* If you prefer starting from a template, the Epicenter JS Libs [Login Component](../../#components) uses the Authorization Manager as well. This sample HTML page (and associated CSS and JS files) provides a login form for team members and end users of your project. It also includes a group selector for end users that are members of multiple groups.
*/

'use strict';
var AuthAdapter = require('../service/auth-api-service');
var MemberAdapter = require('../service/member-api-adapter');
var GroupService = require('../service/group-api-service');
var SessionManager = require('../store/session-manager');
var _pick = require('../util/object-util')._pick;
var objectAssign = require('object-assign');

var atob = window.atob || require('Base64').atob;

var defaults = {
    requiresGroup: true
};

function AuthManager(options) {
    options = $.extend(true, {}, defaults, options);
    this.sessionManager = new SessionManager(options);
    this.options = this.sessionManager.getMergedOptions();

    this.authAdapter = new AuthAdapter(this.options);
}

var _findUserInGroup = function (members, id) {
    for (var j = 0; j < members.length; j++) {
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
    *           project: 'supply-chain-game',
    *           userName: 'enduser1',
    *           password: 'passw0rd'
    *       })
    *           .then(function(statusObj) {
    *               // if enduser1 belongs to exactly one group
    *               // (or if the login() call is modified to include the group id)
    *               // continue here
    *           })
    *           .fail(function(statusObj) {
    *               // if enduser1 belongs to multiple groups,
    *               // the login() call fails
    *               // and returns all groups of which the user is a member
    *               for (var i=0; i < statusObj.userGroups.length; i++) {
    *                   console.log(statusObj.userGroups[i].name, statusObj.userGroups[i].groupId);
    *               }
    *           });
    *
    * **Parameters**
    *
    * @param {Object} options (Optional) Overrides for configuration options. If not passed in when creating an instance of the manager (`F.manager.AuthManager()`), these options should include:
    * @param {string} options.account The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
    * @param {string} options.userName Email or username to use for logging in.
    * @param {string} options.password Password for specified `userName`.
    * @param {string} options.project (Optional) The **Project ID** for the project to log this user into.
    * @param {string} options.groupId The id of the group to which `userName` belongs. Required for [end users](../../../glossary/#users) if the `project` is specified and if the end users are members of multiple [groups](../../../glossary/#groups), otherwise optional.
    * @return {Promise}
    */
    login: function (options) {
        var me = this;
        var $d = $.Deferred();
        var sessionManager = this.sessionManager;
        var adapterOptions = sessionManager.getMergedOptions({ success: $.noop, error: $.noop }, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

        var decodeToken = function (token) {
            var encoded = token.split('.')[1];
            while (encoded.length % 4 !== 0) { //eslint-disable-line
                encoded += '=';
            }
            return JSON.parse(atob(encoded));
        };

        var handleGroupError = function (message, statusCode, data, type) {
            // logout the user since it's in an invalid state with no group selected
            me.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode, type: type });
                $d.reject(error);
            });
        };

        var handleSuccess = function (response) {
            var token = response.access_token;
            var userInfo = decodeToken(token);
            var oldGroups = sessionManager.getSession(adapterOptions).groups || {};
            var userGroupOpts = $.extend(true, {}, adapterOptions, { success: $.noop });
            var data = { auth: response, user: userInfo };
            var project = adapterOptions.project;
            var isTeamMember = userInfo.parent_account_id === null;
            var requiresGroup = adapterOptions.requiresGroup && project;

            var userName = (userInfo.user_name || '').split('/')[0]; //of form <user>/<team>
            var sessionInfo = {
                auth_token: token,
                account: adapterOptions.account,
                project: project,
                userId: userInfo.user_id,
                groups: oldGroups,
                isTeamMember: isTeamMember,
                userName: userName,
            };
            // The group is not required if the user is not logging into a project
            if (!requiresGroup) {
                sessionManager.saveSession(sessionInfo);
                outSuccess.apply(this, [data]);
                $d.resolve(data);
                return;
            }

            var handleGroupList = function (groupList) {
                data.userGroups = groupList;

                var group = null;
                if (groupList.length === 0) {
                    handleGroupError('The user has no groups associated in this account', 403, data, 'NO_GROUPS');
                    return;
                } else if (groupList.length === 1) {
                    // Select the only group
                    group = groupList[0];
                } else if (groupList.length > 1) {
                    if (groupId) {
                        var filteredGroups = $.grep(groupList, function (resGroup) {
                            return resGroup.groupId === groupId;
                        });
                        group = filteredGroups.length === 1 ? filteredGroups[0] : null;
                    }
                }

                if (group) {
                    // A team member does not get the group members because is calling the Group API
                    // but it's automatically a fac user
                    var isFac = isTeamMember ? true : _findUserInGroup(group.members, userInfo.user_id).role === 'facilitator';
                    var groupData = {
                        groupId: group.groupId,
                        groupName: group.name,
                        isFac: isFac
                    };
                    var sessionInfoWithGroup = objectAssign({}, sessionInfo, groupData);
                    sessionInfo.groups[project] = groupData;
                    me.sessionManager.saveSession(sessionInfoWithGroup, adapterOptions);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This user is associated with more than one group. Please specify a group id to log into and try again', 403, data, 'MULTIPLE_GROUPS');
                }
            };

            if (!isTeamMember) {
                me.getUserGroups({ userId: userInfo.user_id, token: token }, userGroupOpts)
                    .then(handleGroupList, $d.reject);
            } else {
                var opts = objectAssign({}, userGroupOpts, { token: token });
                var groupService = new GroupService(opts);
                groupService.getGroups({ account: adapterOptions.account, project: project })
                    .then(function (groups) {
                        // Group API returns id instead of groupId
                        groups.forEach(function (group) {
                            group.groupId = group.id;
                        });

                        if (groups.length) {
                            handleGroupList(groups);
                        } else {
                            //either it's a private project or there are no groups
                            sessionManager.saveSession(sessionInfo);
                            outSuccess.apply(this, [data]);
                            $d.resolve(data);
                            return;
                        }
                    }, $d.reject);
            }
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

                me.authAdapter.login(adapterOptions);
                return;
            }

            outError.apply(this, arguments);
            $d.reject(response);
        };

        this.authAdapter.login(adapterOptions);
        return $d.promise();
    },

    /**
    * Logs user out by clearing all session information.
    *
    * **Example**
    *
    *       authMgr.logout();
    *
    * **Parameters**
    *
    * @param {Object} options (Optional) Overrides for configuration options.
    * @return {Promise}
    */
    logout: function (options) {
        var me = this;
        var adapterOptions = this.sessionManager.getMergedOptions(options);

        var removeCookieFn = function (response) {
            me.sessionManager.removeSession();
        };

        return this.authAdapter.logout(adapterOptions).then(removeCookieFn);
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
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getToken: function (options) {
        var httpOptions = this.sessionManager.getMergedOptions(options);

        var session = this.sessionManager.getSession(httpOptions);
        var $d = $.Deferred();
        if (session.auth_token) {
            $d.resolve(session.auth_token);
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
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *      authMgr.getUserGroups({ userId: sessionObj.userId, token: sessionObj.auth_token })
     *          .then(function (groups) {
     *              for (var i=0; i < groups.length; i++)
     *                  { console.log(groups[i].name); }
     *          });
     *
     *      // get groups for particular user
     *      authMgr.getUserGroups({userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', token: savedProjAccessToken });
     *
     * **Parameters**
     * @param {Object} params Object with a userId and token properties.
     * @param {String} params.userId The userId. If looking up groups for the currently logged in user, this is in the session information. Otherwise, pass a string.
     * @param {String} params.token The authorization credentials (access token) to use for checking the groups for this user. If looking up groups for the currently logged in user, this is in the session information. A team member's token or a project access token can access all the groups for all end users in the team or project.
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getUserGroups: function (params, options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
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

        var memberAdapter = new MemberAdapter({ token: params.token, server: adapterOptions.server });
        memberAdapter.getGroupsForUser(params, adapterOptions).fail($d.reject);
        return $d.promise();
    },

    /**
     * Helper method to check if you're currently logged in
     *
     *  **Example**
     *  
     *      var amILoggedIn = authMgr.isLoggedIn();
     *
     * **Parameters**
     * @param {none} none
     * @return {Boolean} true if you're logged in
     */
    isLoggedIn: function () {
        var session = this.getCurrentUserSessionInfo();
        return !!(session && session.userId);
    },

    /**
     * Returns session information for the current user, including the `userId`, `account`, `project`, `groupId`, `groupName`, `isFac` (whether the end user is a facilitator of this group), and `auth_token` (user access token).
     *
     * *Important*: This method is synchronous. The session information is returned immediately in an object; no callbacks or promises are needed.
     *
     * Session information is stored in a cookie in the browser.
     *
     * **Example**
     *
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *
     * **Parameters**
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Object} session information
     */
    getCurrentUserSessionInfo: function (options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
        return this.sessionManager.getSession(adapterOptions);
    },

    /*
     * Adds one or more groups to the current session. 
     *
     * This method assumes that the project and group exist and the user specified in the session is part of this project and group.
     *
     * Returns the new session object.
     *
     * **Example**
     *
     *      authMgr.addGroups({ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' });
     *      authMgr.addGroups([{ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' }, { project: 'hello-world', groupName: '...' }]);
     *
     * **Parameters**
     * @param {object|array} groups (Required) The group object must contain the `project` (**Project ID**) and `groupName` properties. If passing an array of such objects, all of the objects must contain *different* `project` (**Project ID**) values: although end users may be logged in to multiple projects at once, they may only be logged in to one group per project at a time.
     * @param {string} group.isFac (optional) Defaults to `false`. Set to `true` if the user in the session should be a facilitator in this group.
     * @param {string} group.groupId (optional) Defaults to undefined. Needed mostly for the Members API.
     * @return {Object} session information
    */
    addGroups: function (groups) {
        var session = this.getCurrentUserSessionInfo();
        var isArray = Array.isArray(groups);
        groups = isArray ? groups : [groups];

        $.each(groups, function (index, group) {
            var extendedGroup = $.extend({}, { isFac: false }, group);
            var project = extendedGroup.project;
            var validProps = ['groupName', 'groupId', 'isFac'];
            if (!project || !extendedGroup.groupName) {
                throw new Error('No project or groupName specified.');
            }
            // filter object
            extendedGroup = _pick(extendedGroup, validProps);
            session.groups[project] = extendedGroup;
        });
        this.sessionManager.saveSession(session);
        return session;
    }
});

module.exports = AuthManager;

},{"../service/auth-api-service":30,"../service/group-api-service":34,"../service/member-api-adapter":36,"../store/session-manager":46,"../util/object-util":51,"Base64":1,"object-assign":2}],7:[function(require,module,exports){
'use strict';

/**
 * ## Channel Manager
 *
 * There are two main use cases for the channel: event notifications and chat messages.
 *
 * If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) rather than this more generic Channel Manager. (The Epicenter Channel Manager is a wrapper that instantiates a Channel Manager with Epicenter-specific defaults.) The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use. 
 *
 * However, you can work directly with the Channel Manager if you like. (This might be useful if you are working through Node.js, for example, `require('manager/channel-manager')`.)
 *
 * The Channel Manager is a wrapper around the default [cometd JavaScript library](http://docs.cometd.org/2/reference/javascript.html), `$.cometd`. It provides a few nice features that `$.cometd` doesn't, including:
 *
 * * Automatic re-subscription to channels if you lose your connection
 * * Online / Offline notifications
 * * 'Events' for cometd notifications (instead of having to listen on specific meta channels)
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Manager. (See [Including Epicenter.js](../../#include).)
 *
 * To use the Channel Manager in client-side JavaScript, instantiate the [Epicenter Channel Manager](../epicenter-channel-manager/), get a particular channel -- that is, an instance of a [Channel Service](../channel-service/) -- then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *      var cm = new F.manager.ChannelManager();
 *      var gc = cm.getGroupChannel();
 *      // because we used an Epicenter Channel Manager to get the group channel,
 *      // subscribe() and publish() here default to the base topic for the group;
 *      gc.subscribe('', function(data) { console.log(data); });
 *      gc.publish('', { message: 'a new message to the group' });
 *
 * The parameters for instantiating a Channel Manager include:
 *
 * * `options` The options object to configure the Channel Manager. Besides the common options listed here, see http://docs.cometd.org/reference/javascript.html for other supported options.
 * * `options.url` The Cometd endpoint URL.
 * * `options.websocketEnabled` Whether websocket support is active (boolean).
 * * `options.channel` Other defaults to pass on to instances of the underlying Channel Service. See [Channel Service](../channel-service/) for details.
 *
 */

var Channel = require('../service/channel-service');
var SessionManager = require('../store/session-manager');

var ChannelManager = function (options) {
    if (!$.cometd) {
        console.error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var defaults = {
        /**
         * The Cometd endpoint URL.
         * @type {string}
         */
        url: '',

        /**
         * The log level for the channel (logs to console).
         * @type {string}
         */
        logLevel: 'info',

        /**
         * Whether websocket support is active. Defaults to `true`.
         * @type {boolean}
         */
        websocketEnabled: true,

        /**
         * Whether the ACK extension is enabled. Defaults to `true`. See [https://docs.cometd.org/current/reference/#_extensions_acknowledge](https://docs.cometd.org/current/reference/#_extensions_acknowledge) for more info.
         * @type {boolean}
         */
        ackEnabled: true,

        /**
         * If false each instance of Channel will have a separate cometd connection to server, which could be noisy. Set to true to re-use the same connection across instances.
         * @type {boolean}
         */
        shareConnection: false,

        /**
         * Other defaults to pass on to instances of the underlying [Channel Service](../channel-service/), which are created through `getChannel()`.
         * @type {object}
         */
        channel: {

        },

        /**
         * Options to pass to the channel handshake.
         *
         * For example, the [Epicenter Channel Manager](../epicenter-channel-manager/) passes `ext` and authorization information. More information on possible options is in the details of the underlying [Push Channel API](../../../rest_apis/multiplayer/channel/).
         *
         * @type {object}
         */
        handshake: undefined
    };
    this.sessionManager = new SessionManager();
    var defaultCometOptions = this.sessionManager.getMergedOptions(defaults, options);
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

    if (defaultCometOptions.shareConnection && ChannelManager.prototype._cometd) {
        this.cometd = ChannelManager.prototype._cometd;
        return this;
    }
    var cometd = new $.CometD();
    ChannelManager.prototype._cometd = cometd;

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;
    cometd.ackEnabled = defaultCometOptions.ackEnabled;

    this.isConnected = false;
    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };
    var me = this;

    cometd.configure(defaultCometOptions);

    cometd.addListener('/meta/connect', function (message) {
        var wasConnected = this.isConnected;
        this.isConnected = (message.successful === true);
        if (!wasConnected && this.isConnected) { //Connecting for the first time
            connectionSucceeded.call(this, message);
        } else if (wasConnected && !this.isConnected) { //Only throw disconnected message fro the first disconnect, not once per try
            connectionBroken.call(this, message);
        }
    }.bind(this));

    cometd.addListener('/meta/disconnect', connectionBroken);

    cometd.addListener('/meta/handshake', function (message) {
        if (message.successful) {
            //http://docs.cometd.org/reference/javascript_subscribe.html#javascript_subscribe_meta_channels
            // ^ "dynamic subscriptions are cleared (like any other subscription) and the application needs to figure out which dynamic subscription must be performed again"
            cometd.batch(function () {
                $(me.currentSubscriptions).each(function (index, subs) {
                    cometd.resubscribe(subs);
                });
            });
        }
    });

    //Other interesting events for reference
    cometd.addListener('/meta/subscribe', function (message) {
        $(me).trigger('subscribe', message);
    });
    cometd.addListener('/meta/unsubscribe', function (message) {
        $(me).trigger('unsubscribe', message);
    });
    cometd.addListener('/meta/publish', function (message) {
        $(me).trigger('publish', message);
    });
    cometd.addListener('/meta/unsuccessful', function (message) {
        $(me).trigger('error', message);
    });

    cometd.handshake(defaultCometOptions.handshake);

    this.cometd = cometd;
};


ChannelManager.prototype = $.extend(ChannelManager.prototype, {

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * **Example**
     *
     *      var cm = new F.manager.ChannelManager();
     *      var channel = cm.getChannel();
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        //If you just want to pass in a string
        if (options && !$.isPlainObject(options)) {
            options = {
                base: options
            };
        }
        var defaults = {
            transport: this.cometd
        };
        var channel = new Channel($.extend(true, {}, this.options.channel, defaults, options));


        //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
        var subs = channel.subscribe;
        channel.subscribe = function () {
            var subid = subs.apply(channel, arguments);
            this.currentSubscriptions = this.currentSubscriptions.concat(subid);
            return subid;
        }.bind(this);


        var unsubs = channel.unsubscribe;
        channel.unsubscribe = function () {
            var removed = unsubs.apply(channel, arguments);
            for (var i = 0; i < this.currentSubscriptions.length; i++) {
                if (this.currentSubscriptions[i].id === removed.id) {
                    this.currentSubscriptions.splice(i, 1);
                }
            }
            return removed;
        }.bind(this);

        return channel;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }
});

module.exports = ChannelManager;

},{"../service/channel-service":31,"../store/session-manager":46}],8:[function(require,module,exports){
'use strict';

/**
 * ## Epicenter Channel Manager
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world).
 *
 * <a name="background"></a>
 * ### Channel Background
 *
 * Channel notifications are only available for [team projects](../../../glossary/#team). There are two main use cases for the push channel: event notifications and chat messages.
 *
 * #### Event Notifications
 *
 * Within a [multiplayer simulation or world](../../../glossary/#world), it is often useful for your project's [model](../../../writing_your_model/) to alert the [user interface (browser)](../../../creating_your_interface/) that something new has happened.
 *
 * Usually, this "something new" is an event within the project, group, or world, such as:
 *
 * * An end user comes online (logs in) or goes offline. (This is especially interesting in a multiplayer world; only available if you have [enabled authorization](../../../updating_your_settings/#general-settings) for the channel.)
 * * An end user is assigned to a world.
 * * An end user updates a variable / makes a decision.
 * * An end user creates or updates data stored in the [Data API](../data-api-service/).
 * * An operation (method) is called. (This is especially interesting if the model is advanced, for instance, the Vensim `step` operation is called.)
 *
 * When these events occur, you often want to have the user interface for one or more end users automatically update with new information.
 *
 * #### Chat Messages
 *
 * Another reason to use the push channel is to allow players (end users) to send chat messages to other players, and to have those messages appear immediately.
 *
 * #### Getting Started
 *
 * For both the event notification and chat message use cases:
 *
 * * First, enable channel notifications for your project.
 *      * Channel notifications are only available for [team projects](../../../glossary/#team). To enable notifications for your project, [update your project settings](../../../updating_your_settings/#general-settings) to turn on the **Push Channel** setting, and optionally require authorization for the channel.
 * * Then, instantiate an Epicenter Channel Manager.
 * * Next, get the channel with the scope you want (user, world, group, data).
 * * Finally, use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 * Here's an example of those last three steps (instantiate, get channel, subscribe):
 *
 *     var cm = new F.manager.ChannelManager();
 *     var gc = cm.getGroupChannel();
 *     gc.subscribe('', function(data) { console.log(data); });
 *     gc.publish('', { message: 'a new message to the group' });
 *
 * For a more detailed example, see a [complete publish and subscribe example](../../../rest_apis/multiplayer/channel/#epijs-example).
 *
 * For details on what data is published automatically to which channels, see [Automatic Publishing of Events](../../../rest_apis/multiplayer/channel/#publish-message-auto).
 *
 * #### Creating an Epicenter Channel Manager
 *
 * The Epicenter Channel Manager is a wrapper around the (more generic) [Channel Manager](../channel-manager/), to instantiate it with Epicenter-specific defaults. If you are interested in including a notification or chat feature in your project, using an Epicenter Channel Manager is the easiest way to get started.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Epicenter Channel Manager. See [Including Epicenter.js](../../#include).
 *
 * The parameters for instantiating an Epicenter Channel Manager include:
 *
 * * `options` Object with details about the Epicenter project for this Epicenter Channel Manager instance.
 * * `options.account` The Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `options.project` Epicenter project id.
 * * `options.userName` Epicenter userName used for authentication.
 * * `options.userId` Epicenter user id used for authentication. Optional; `options.userName` is preferred.
 * * `options.token` Epicenter token used for authentication. (You can retrieve this using `authManager.getToken()` from the [Authorization Manager](../auth-manager/).)
 * * `options.allowAllChannels` If not included or if set to `false`, all channel paths are validated; if your project requires [Push Channel Authorization](../../../updating_your_settings/), you should use this option. If you want to allow other channel paths, set to `true`; this is not common.
 */

var ChannelManager = require('./channel-manager');
var ConfigService = require('../service/configuration-service');
var classFrom = require('../util/inherit');
var SessionManager = require('../store/session-manager');

var WorldService = require('../service/world-api-adapter');
var PresenceService = require('../service/presence-api-service');

var validTypes = {
    project: true,
    group: true,
    world: true,
    user: true,
    data: true,
    general: true,
    chat: true
};
var getFromSessionOrError = function (value, sessionKeyName, settings) {
    if (!value) {
        if (settings && settings[sessionKeyName]) {
            value = settings[sessionKeyName];
        } else {
            throw new Error(sessionKeyName + ' not found. Please log-in again, or specify ' + sessionKeyName + ' explicitly');
        }
    }
    return value;
};

var isPresenceData = function (payload) {
    return payload.data && payload.data.type === 'user' && payload.data.user;
};

var __super = ChannelManager.prototype;
var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        this.sessionManager = new SessionManager(options);
        var defaultCometOptions = this.sessionManager.getMergedOptions(options);

        var urlConfig = new ConfigService(defaultCometOptions).get('server');
        if (!defaultCometOptions.url) {
            defaultCometOptions.url = urlConfig.getAPIPath('channel');
        }

        if (defaultCometOptions.handshake === undefined) {
            var userName = defaultCometOptions.userName;
            var userId = defaultCometOptions.userId;
            var token = defaultCometOptions.token;
            if ((userName || userId) && token) {
                var userProp = userName ? 'userName' : 'userId';
                var ext = {
                    authorization: 'Bearer ' + token
                };
                ext[userProp] = userName ? userName : userId;

                defaultCometOptions.handshake = {
                    ext: ext
                };
            }
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
    },

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * This method enforces Epicenter-specific channel naming: all channels requested must be in the form `/{type}/{account id}/{project id}/{...}`, where `type` is one of `run`, `data`, `user`, `world`, or `chat`.
     *
     * **Example**
     *
     *      var cm = new F.manager.EpicenterChannelManager();
     *      var channel = cm.getChannel('/group/acme/supply-chain-game/');
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        if (options && typeof options !== 'object') {
            options = {
                base: options
            };
        }
        var channelOpts = $.extend({}, this.options, options);
        var base = channelOpts.base;
        if (!base) {
            throw new Error('No base topic was provided');
        }

        if (!channelOpts.allowAllChannels) {
            var baseParts = base.split('/');
            var channelType = baseParts[1];
            if (baseParts.length < 4) { //eslint-disable-line
                throw new Error('Invalid channel base name, it must be in the form /{type}/{account id}/{project id}/{...}');
            }
            if (!validTypes[channelType]) {
                throw new Error('Invalid channel type');
            }
        }
        return __super.getChannel.apply(this, arguments);
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [group](../../../glossary/#groups). The group must exist in the account (team) and project provided.
     *
     * There are no notifications from Epicenter on this channel; all messages are user-originated.
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var gc = cm.getGroupChannel();
     *     gc.subscribe('broadcasts', callback);
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} groupName (Optional) Group to broadcast to. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getGroupChannel: function (groupName) {
        var session = this.sessionManager.getMergedOptions(this.options);
        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/group', account, project, groupName].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithoutPresenceData = function (payload) {
                if (!isPresenceData(payload)) {
                    callback.call(context, payload);
                }
            };
            return oldsubs.call(channel, topic, callbackWithoutPresenceData, context, options);
        };
        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world The world object or id.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var session = this.sessionManager.getMergedOptions(this.options);

        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/world', account, project, groupName, worldid].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            if (!topic) {
                return oldsubs.call(channel, topic, callback, context, options);
            }

            var defaults = {
                includeMine: true
            };
            var opts = $.extend({}, defaults, options);
            var topicAliases = {
                reset: ['new'],
                roles: ['assign', 'unassign', 'assignchange'],
                operations: ['operation'],
                presence: ['connect', 'disconnect'],
            };
            if (topic === 'presence') {
                var wm = new WorldService({ 
                    account: account,
                    project: project,
                    filter: worldid
                });
                var pres = new PresenceService({
                    account: account,
                    project: project,
                });
                var worldLoadPromise = wm.load();
                var presenceLoadPromise = pres.getStatus();
                //FIXME: Cache promise
                $.when(worldLoadPromise, presenceLoadPromise).then(function (worldRes, presenceRes) {
                    var world = worldRes[0];
                    var presenceList = presenceRes[0];

                    world.users.forEach(function (user) {
                        var id = user.userId;
                        var matchingStatus = $.grep(presenceList || [], function (status) {
                            return status.userId === id;
                        });
                        if (matchingStatus[0]) {
                            var fakeMeta = {
                                date: Date.now(),
                                channel: baseTopic,
                                type: 'presence',
                                subType: 'connect',
                                source: 'presenceAPI',
                            };
                            var fakeUser = {
                                account: account,
                                id: id,
                                isOnline: true,
                                lastName: user.lastName,
                                userName: user.userName,
                            };
                            callback(fakeUser, fakeMeta); //eslint-disable-line callback-return
                        }
                    });
                });
            }
            var filterByType = function (res) {
                var subType = res.data.subType;
                var topicMatch = subType === topic || (topicAliases[topic] && topicAliases[topic].indexOf(subType) !== -1);
                var notificationFrom = res.data.user || {};
                var payload = res.data.data;
                if (topic === 'reset') {
                    notificationFrom = payload.run.user; //reset doesn't give back user info otherwise
                }

                var isMine = session.userId === notificationFrom.id;
                var initiatorMatch = isMine && opts.includeMine || !isMine;
                if (topicMatch && initiatorMatch) {
                    var meta = {
                        user: res.data.user,
                        date: res.data.date,
                        channel: res.channel,
                        type: topic,
                        subType: subType,
                    };
                    if (topic === 'variables' || topic === 'operation') {
                        return callback(payload[topic], meta);
                    } else if (subType === 'new') {
                        return callback(payload.run, meta);
                    } else if (topic === 'roles') {
                        //FIXME: this doesn't work
                        return callback(payload.user, meta);
                    } else if (topic === 'presence') {
                        var user = res.data.user;
                        user.isOnline = subType === 'connect';
                        return callback(user, meta);
                    } else if (topic === 'reset') {
                        return callback(payload, meta);
                    }
                    return callback.call(context, res);
                }
            };
            return oldsubs.call(channel, '', filterByType, context, options);

        };
        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the current [end user](../../../glossary/#users) in that user's current [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager). Note that this channel only gets notifications for worlds currently in memory. (See more background on [persistence](../../../run_persistence).)
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var userChannel = cm.getUserChannel(worldObject);
     *         userChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world World object or id.
     * @param  {String|Object} user (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getUserChannel: function (world, user, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var session = this.sessionManager.getMergedOptions(this.options);

        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        userid = getFromSessionOrError(userid, 'userId', session);
        groupName = getFromSessionOrError(groupName, 'groupName', session);

        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/user', account, project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) that automatically tracks the presence of an [end user](../../../glossary/#users), that is, whether the end user is currently online in this group. Notifications are automatically sent when the end user comes online, and when the end user goes offline (not present for more than 2 minutes). Useful in multiplayer games for letting each end user know whether other users in their group are also online.
     *
     * Note that the presence channel is tracking all end users in a group. In particular, if the project additionally splits each group into [worlds](../world-manager/), this channel continues to show notifications for all end users in the group (not restricted by worlds).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var pc = cm.getPresenceChannel();
     *     pc.subscribe('', function (data) {
     *          // 'data' is the entire message object to the channel;
     *          // parse for information of interest
     *          if (data.data.subType === 'disconnect') {
     *               console.log('user ', data.data.user.userName, 'disconnected at ', data.data.date);
     *          }
     *          if (data.data.subType === 'connect') {
     *               console.log('user ', data.data.user.userName, 'connected at ', data.data.date);
     *          }
     *     });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} groupName (Optional) Group the end user is in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getPresenceChannel: function (groupName) {
        var session = this.sessionManager.getMergedOptions(this.options);
        groupName = getFromSessionOrError(groupName, 'groupName', session);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/group', account, project, groupName].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithOnlyPresenceData = function (payload) {
                if (isPresenceData(payload)) {
                    callback.call(context, payload);
                }
            };
            return oldsubs.call(channel, topic, callbackWithOnlyPresenceData, context, options);
        };
        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given collection. (The collection name is specified in the `root` argument when the [Data Service](../data-api-service/) is instantiated.) Must be one of the collections in this account (team) and project.
     *
     * There are automatic notifications from Epicenter on this channel when data is created, updated, or deleted in this collection. See more on [automatic messages to the data channel](../../../rest_apis/multiplayer/channel/#data-messages).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var dc = cm.getDataChannel('survey-responses');
     *     dc.subscribe('', function(data, meta) {
     *          console.log(data);
     *
     *          // meta.date is time of change,
     *          // meta.subType is the kind of change: new, update, or delete
     *          // meta.path is the full path to the changed data
     *          console.log(meta);
     *     });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} collection Name of collection whose automatic notifications you want to receive.
     * @return {Channel} Channel instance
     */
    getDataChannel: function (collection) {
        if (!collection) {
            throw new Error('Please specify a collection to listen on.');
        }

        var session = this.sessionManager.getMergedOptions(this.options);
        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);
        var baseTopic = ['/data', account, project, collection].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        //TODO: Fix after Epicenter bug is resolved
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithCleanData = function (payload) {
                var meta = {
                    path: payload.channel,
                    subType: payload.data.subType,
                    date: payload.data.date,
                    dataPath: payload.data.data.path,
                };
                var actualData = payload.data.data;
                if (actualData.data !== undefined) { //Delete notifications are one data-level behind of course
                    actualData = actualData.data;
                }

                callback.call(context, actualData, meta);
            };
            return oldsubs.call(channel, topic, callbackWithCleanData, context, options);
        };

        return channel;
    }
});

module.exports = EpicenterChannelManager;

},{"../service/configuration-service":32,"../service/presence-api-service":37,"../service/world-api-adapter":44,"../store/session-manager":46,"../util/inherit":50,"./channel-manager":7}],9:[function(require,module,exports){
'use strict';

module.exports = {
    EPI_SESSION_KEY: 'epicenterjs.session',
    STRATEGY_SESSION_KEY: 'epicenter-scenario'
};
},{}],10:[function(require,module,exports){
/**
* ## Run Manager
*
* The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../strategies/) for which runs end users of your project work with when they log in to your project.
*
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/) and the RESFTful [Run API](../../../rest_apis/aggregate_run_api). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified.
*
*
* ### Using the Run Manager to create and access runs
*
* To use the Run Manager, instantiate it by passing in:
*
*   * `run`: (required) Run object. Must contain:
*       * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
*       * `project`: Epicenter project id.
*       * `model`: The name of your primary model file. (See more on [Writing your Model](../../../writing_your_model/).)
*       * `scope`: (optional) Scope object for the run, for example `scope.group` with value of the name of the group.
*       * `server`: (optional) An object with one field, `host`. The value of `host` is the string `api.forio.com`, the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can optionally pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (See more on [Using External Data in Vensim](../../../model_code/vensim/vensim_example_xls/).)
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. This is *optional*; by default, the Run Manager selects `reuse-per-session`, or `reuse-last-initialized` if you also pass in an initial operation. See [below](#using-the-run-manager-to-access-and-register-strategies) for more information on strategies.
*
*   * `strategyOptions`: (optional) Additional options passed directly to the [run creation strategy](../strategies/).
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter. This can also be a function which returns a string, if you'd like to control this at runtime.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.
*
* **Example**
*
*       var rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'reuse-never',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is a run object
*               var thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*
* ### Using the Run Manager to access and register strategies
*
* The `strategy` for a Run Manager describes when to create a new run and when to reuse an end user's existing run. The Run Manager is responsible for passing a strategy everything it might need to determine the 'correct' run, that is, how to find the best existing run and how to decide when to create a new run.
*
* There are several common strategies provided as part of Epicenter.js, which you can list by accessing `F.manager.RunManager.strategies`. You can also create your own strategies, and register them to use with Run Managers. See [Run Manager Strategies](../strategies/) for details.
* 
*/

'use strict';
var strategies = require('./run-strategies');
var specialOperations = require('./special-operations');

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var util = require('../util/object-util');
var keyNames = require('./key-names');

function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function (operation, params, options) {
        var reservedOps = Object.keys(specialOperations);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return specialOperations[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}

function sessionKeyFromOptions(options, runService) {
    var config = runService.getCurrentConfig();
    var sessionKey = $.isFunction(options.sessionKey) ? options.sessionKey(config) : options.sessionKey;
    return sessionKey;
}

function setRunInSession(sessionKey, run, sessionManager) {
    if (sessionKey) {
        delete run.variables;
        sessionManager.getStore().set(sessionKey, JSON.stringify(run));
    }
}

var defaults = {
    sessionKey: function (config) { 
        var baseKey = keyNames.STRATEGY_SESSION_KEY;
        var key = ['account', 'project', 'model'].reduce(function (accum, key) {
            return config[key] ? accum + '-' + config[key] : accum; 
        }, baseKey);
        return key;
    }
};

function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else if (!util.isEmpty(this.options.run)) {
        this.run = new RunService(this.options.run);
    } else {
        throw new Error('No run options passed to RunManager');
    }
    patchRunService(this.run, this);

    this.strategy = strategies.getBestStrategy(this.options);
    this.sessionManager = new SessionManager(this.options);
}

RunManager.prototype = {
    /**
     * Returns the run object for the 'correct' run. The correct run is defined by the strategy. 
     *
     * For example, if the strategy is `reuse-never`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `reuse-per-session`,
     * `getRun()` returns the run currently referenced in the browser cookie, and if there is none, creates a new run. 
     * See [Run Manager Strategies](../strategies/) for more on strategies.
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     *      rm.getRun(['sample_int']).then(function (run) {
     *         // an object whose fields are the name : value pairs of the variables passed to getRun()
     *         console.log(run.variables);
     *         // the value of sample_int
     *         console.log(run.variables.sample_int); 
     *      });
     *
     * @param {Array} variables (Optional) The run object is populated with the provided model variables, if provided. Note: `getRun()` does not throw an error if you try to get a variable which doesn't exist. Instead, the variables list is empty, and any errors are logged to the console.
     * @param {Object} options (Optional) Configuration options; passed on to [RunService#create](../run-api-service/#create) if the strategy does create a new run.
     * @return {$promise} Promise to complete the call.
     */
    getRun: function (variables, options) {
        var me = this;
        var sessionStore = this.sessionManager.getStore();

        var sessionContents = sessionStore.get(sessionKeyFromOptions(this.options, me.run));
        var runSession = JSON.parse(sessionContents || '{}');
        
        if (runSession.runId) {
            //EpiJS < 2.2 used runId as key, so maintain comptaibility. Remove at some future date (Summer `17?)
            runSession.id = runSession.runId;
        }

        var authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && util.isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject('No user-session available').promise();
        }
        return this.strategy
                .getRun(this.run, authSession, runSession, options).then(function (run) {
                    if (run && run.id) {
                        me.run.updateConfig({ filter: run.id });
                        var sessionKey = sessionKeyFromOptions(me.options, me.run);
                        setRunInSession(sessionKey, run, me.sessionManager);

                        if (variables && variables.length) {
                            return me.run.variables().query(variables).then(function (results) {
                                run.variables = results;
                                return run;
                            }).catch(function (err) {
                                run.variables = {};
                                console.error(err);
                                return run;
                            });
                        }
                    }
                    return run;
                });
    },

    /**
     * Returns the run object for a 'reset' run. The definition of a reset is defined by the strategy, but typically means forcing the creation of a new run. For example, `reset()` for the default strategies `reuse-per-session` and `reuse-last-initialized` both create new runs.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the (new) run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {Object} options (Optional) Configuration options; passed on to [RunService#create](../run-api-service/#create).
     * @return {Promise}
     */
    reset: function (options) {
        var me = this;
        var authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && util.isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject('No user-session available').promise();
        }
        return this.strategy.reset(this.run, authSession, options).then(function (run) {
            if (run && run.id) {
                me.run.updateConfig({ filter: run.id });
                var sessionKey = sessionKeyFromOptions(me.options, me.run);
                setRunInSession(sessionKey, run.id, me.sessionManager);
            }
            return run;
        });
    }
};

RunManager.strategies = strategies;
module.exports = RunManager;

},{"../service/run-api-service":38,"../store/session-manager":46,"../util/object-util":51,"./key-names":9,"./run-strategies":14,"./special-operations":25}],11:[function(require,module,exports){
'use strict';

var Base = require('./none-strategy');
var classFrom = require('../../util/inherit');

/**
* ## Conditional Creation Strategy
*
* This strategy will try to get the run stored in the cookie and
* evaluate if it needs to create a new run by calling the `condition` function.
*/

var Strategy = classFrom(Base, {
    constructor: function Strategy(condition) {
        if (condition == null) { //eslint-disable-line
            throw new Error('Conditional strategy needs a condition to create a run');
        }
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
    },

    /**
     * Gets a new 'correct' run, or updates the existing one (the definition of 'correct' depends on strategy implementation).
     * @param  {RunService} runService A Run Service instance for the current run, as determined by the Run Manager.
     * @param  {Object} userSession Information about the current user session. See [AuthManager#getCurrentUserSessionInfo](../auth-manager/#getcurrentusersessioninfo) for format.
     * @param  {Object} options (Optional) See [RunService#create](../run-api-service/#create) for supported options.
     * @return {Promise}             
     */
    reset: function (runService, userSession, options) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService
                .create(opt, options)
                .then(function (run) {
                    run.freshlyCreated = true;
                    return run;
                });
    },

    /**
     * Gets the 'correct' run (the definition of 'correct' depends on strategy implementation).
     * @param  {RunService} runService A Run Service instance for the current run, as determined by the Run Manager.
     * @param  {Object} userSession Information about the current user session. See [AuthManager#getCurrentUserSessionInfo](../auth-manager/#getcurrentusersessioninfo) for format.
     * @param  {Object} runSession The Run Manager stores the 'last accessed' run in a cookie and passes it back here.
     * @param  {Object} options (Optional) See [RunService#create](../run-api-service/#create) for supported options.
     * @return {Promise}             
     */
    getRun: function (runService, userSession, runSession, options) {
        var me = this;
        if (runSession && runSession.id) {
            return this.loadAndCheck(runService, userSession, runSession, options).catch(function () {
                return me.reset(runService, userSession, options); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService, userSession, options);
        }
    },

    loadAndCheck: function (runService, userSession, runSession, options) {
        var shouldCreate = false;
        var me = this;

        return runService
            .load(runSession.id, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers, userSession, runSession);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    return me.reset(runService, userSession, options);
                }
                return run;
            });
    }
});

module.exports = Strategy;

},{"../../util/inherit":50,"./none-strategy":16}],12:[function(require,module,exports){
/**
 * The `new-if-initialized` strategy creates a new run if the current one is in memory or has its `initialized` field set to `true`. The `initialized` field in the run record is automatically set to `true` at run creation, but can be changed.
 * 
 * This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model is stepped to the end). It is similar to the `new-if-missing` strategy, except that it checks a field of the run record.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie. 
 *  * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options.
 *  * If the cookie exists, check whether the run is in memory or only persisted in the database. Additionally, check whether the run's `initialized` field is `true`. 
 *      * If the run is in memory, create a new run.
 *      * If the run's `initialized` field is `true`, create a new run.
 *      * Otherwise, use the existing run.
 *  * If the cookie does not exist, create a new run for this end user.
 *  
 *  @deprecated Consider using `reuse-last-initialized` instead
 */

'use strict';
var classFrom = require('../../../util/inherit');
var ConditionalStrategy = require('../conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
        console.warn('This strategy is deprecated; all runs now default to being initialized by default making this redundant. Consider using `reuse-last-initialized` instead.');
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent' || run.initialized;
    }
});

module.exports = Strategy;

},{"../../../util/inherit":50,"../conditional-creation-strategy":11}],13:[function(require,module,exports){
/**
 * The `new-if-persisted` strategy creates a new run when the current one becomes persisted (end user is idle for a set period), but otherwise uses the current one. 
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. 
 * 
 * However, if they are idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../../updating_your_settings/)), then their run is persisted; the next time they interact with the project, they will get a new run. (See more background on [Run Persistence](../../../run_persistence/).)
 * 
 * This strategy is useful for multi-page projects where end users play through a simulation in one sitting, stepping through the model sequentially (for example, a Vensim model that uses the `step` operation) or calling specific functions until the model is "complete." However, you will need to guarantee that your end users will remain engaged with the project from beginning to end &mdash; or at least, that if they are idle for longer than the **Model Session Timeout**, it is okay for them to start the project from scratch (with an uninitialized model). 
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *   * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options.
 *   * If the cookie exists, check whether the run is in memory or only persisted in the database. 
 *      * If the run is in memory, use the run.
 *      * If the run is only persisted (and not still in memory), create a new run for this end user.
 *      * If the cookie does not exist, create a new run for this end user.
 *
 * @deprecated The run-service now sets a header to automatically bring back runs into memory
 */

'use strict';
var classFrom = require('../../../util/inherit');
var ConditionalStrategy = require('../conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
        console.warn('This strategy is deprecated; the run-service now sets a header to automatically bring back runs into memory');
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;

},{"../../../util/inherit":50,"../conditional-creation-strategy":11}],14:[function(require,module,exports){
/**
 * ### Working with Run Strategies
 *
 * You can access a list of available strategies using `F.manager.RunManager.strategies.list`. You can also ask for a particular strategy by name.
 *
 * If you decide to [create your own run strategy](#create-your-own), you can register your strategy. Registering your strategy means that:
 *
 * * You can pass the strategy by name to a Run Manager (as opposed to passing the strategy function): `new F.manager.RunManager({ strategy: 'mynewname'})`.
 * * You can pass configuration options to your strategy.
 * * You can specify whether or not your strategy requires authorization (a valid user session) to work.
 */


var list = {
    'conditional-creation': require('./conditional-creation-strategy'),
    'new-if-initialized': require('./deprecated/new-if-initialized-strategy'), //deprecated
    'new-if-persisted': require('./deprecated/new-if-persisted-strategy'), //deprecated

    none: require('./none-strategy'),

    multiplayer: require('./multiplayer-strategy'),
    'reuse-never': require('./reuse-never'),
    'reuse-per-session': require('./reuse-per-session'),
    'reuse-across-sessions': require('./reuse-across-sessions'),
    'reuse-last-initialized': require('./reuse-last-initialized'),
};

//Add back older aliases
list['always-new'] = list['reuse-never'];
list['new-if-missing'] = list['reuse-per-session'];
list['persistent-single-player'] = list['reuse-across-sessions'];


module.exports = {
    /**
     * List of available strategies. Within this object, each key is the strategy name and the associated value is the strategy constructor.
     * @type {Object} 
     */
    list: list,

    /**
     * Gets strategy by name.
     *
     * **Example**
     *
     *      var reuseStrat = F.manager.RunManager.strategies.byName('reuse-across-sessions');
     *      // shows strategy function
     *      console.log('reuseStrat = ', reuseStrat);
     *      // create a new run manager using this strategy
     *      var rm = new F.manager.RunManager({strategy: reuseStrat, run: { model: 'model.vmf'} });
     *
     * **Parameters**
     * @param  {String} strategyName Name of strategy to get.
     * @return {Function} Strategy function.
     */
    byName: function (strategyName) {
        return list[strategyName];
    },

    getBestStrategy: function (options) {
        var strategy = options.strategy;
        if (!strategy) {
            if (options.strategyOptions && options.strategyOptions.initOperation) {
                strategy = 'reuse-last-initialized';
            } else {
                strategy = 'reuse-per-session';
            }
        }

        if (strategy.getRun) {
            return strategy;
        }
        var StrategyCtor = typeof strategy === 'function' ? strategy : this.byName(strategy);
        if (!StrategyCtor) {
            throw new Error('Specified run creation strategy was invalid:', strategy);
        }

        var strategyInstance = new StrategyCtor(options);
        if (!strategyInstance.getRun || !strategyInstance.reset) {
            throw new Error('All strategies should implement a `getRun` and `reset` interface', options.strategy);
        }
        strategyInstance.requiresAuth = StrategyCtor.requiresAuth;

        return strategyInstance;
    },

    /**
     * Adds a new strategy.
     *
     * **Example**
     *
     *      // this "favorite run" strategy always returns the same run, no matter what
     *      // (not a useful strategy, except as an example)
     *      F.manager.RunManager.strategies.register(
     *          'favRun', 
     *          function() { 
     *              return { getRun: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; },
     *                      reset: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; } 
     *              } 
     *          }, 
     *          { requiresAuth: true }
     *      );
     *      
     *      var rm = new F.manager.RunManager({strategy: 'favRun', run: { model: 'model.vmf'} });
     *
     * **Parameters**
     * @param  {String} name Name for strategy. This string can then be passed to a Run Manager as `new F.manager.RunManager({ strategy: 'mynewname'})`.
     * @param  {Function} strategy The strategy constructor. Will be called with `new` on Run Manager initialization.
     * @param  {Object} options  Options for strategy.
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires a valid user session to work.
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};
},{"./conditional-creation-strategy":11,"./deprecated/new-if-initialized-strategy":12,"./deprecated/new-if-persisted-strategy":13,"./multiplayer-strategy":15,"./none-strategy":16,"./reuse-across-sessions":17,"./reuse-last-initialized":18,"./reuse-never":19,"./reuse-per-session":20}],15:[function(require,module,exports){
/**
 * The `multiplayer` strategy is for use with [multiplayer worlds](../../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../world-api-adapter/). If you use the [World Manager](../world-manager/), you are automatically using this strategy.
 * 
 * Using this strategy means that end users in projects with multiplayer worlds always see the most current world and run. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.
 */
'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./none-strategy');
var WorldApiAdapter = require('../../service/world-api-adapter');

var defaults = {};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function (options) {
        this.options = $.extend(true, {}, defaults, options);
        this.worldApi = new WorldApiAdapter(this.options.run);
    },

    reset: function (runService, session, options) {
        var curUserId = session.userId;
        var curGroupName = session.groupName;

        var optionsToPassOn = $.extend(true, {}, options, {
            success: $.noop,
        });
        return this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(function (world) {
                return this.worldApi.newRunForWorld(world.id, optionsToPassOn).then(function (runid) {
                    var toReturn = {
                        id: runid
                    };
                    if (options && options.success) options.success(toReturn); 
                    return toReturn;
                });
            }.bind(this));
    },

    getRun: function (runService, session) {
        var curUserId = session.userId;
        var curGroupName = session.groupName;
        var worldApi = this.worldApi;
        var model = this.options.model;
        var me = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: me.options, session: session });
            }
            return worldApi.getCurrentRunId({ model: model, filter: world.id })
                .then(function (id) {
                    return runService.load(id);
                })
                .then(function (run) {
                    run.world = world;
                    return run;
                })
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            return dtd.reject(error, session, me.options);
        };

        this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(loadRunFromWorld)
            .fail(serverError);

        return dtd.promise();
    },

});

module.exports = Strategy;

},{"../../service/world-api-adapter":44,"../../util/inherit":50,"./none-strategy":16}],16:[function(require,module,exports){
/**
 * The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../run-api-service/).
 * 
 * This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance.
 */

'use strict';

var classFrom = require('../../util/inherit');
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (options) {

    },

    reset: function () {
        // return a newly created run
        return $.Deferred().resolve().promise();
    },

    getRun: function (runService) {
        // return a usable run
        return $.Deferred().resolve(runService).promise();
    }
});

},{"../../util/inherit":50}],17:[function(require,module,exports){
/**
 * The `reuse-across-sessions` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.
 *
 * This strategy is useful if end users are using your project for an extended period of time, possibly over several sessions. This is most common in cases where a user of your project executes the model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end).
 *
 * Specifically, the strategy is:
 * 
 * * Check if there are any runs for this end user.
 *     * If there are no runs (either in memory or in the database), create a new one.
 *     * If there are runs, take the latest (most recent) one.
 *
 * @name persistent-single-player
 */

'use strict';

var classFrom = require('../../util/inherit');
var IdentityStrategy = require('./none-strategy');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var defaults = {
    /**
     * (Optional) Additional criteria to use while selecting the last run
     * @type {Object}
     */
    filter: {},
};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService
            .create(opt, options)
            .then(function (run) {
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function (runService, userSession, runSession, options) {
        var filter = injectFiltersFromSession(this.options.filter, userSession);
        var me = this;
        return runService.query(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});

module.exports = Strategy;

},{"../../util/inherit":50,"../strategy-utils":26,"./none-strategy":16}],18:[function(require,module,exports){
/**
 * The `reuse-last-initialized` strategy looks for the most recent run that matches particular criteria; if it cannot find one, it creates a new run and immediately executes a set of "initialization" operations. 
 *
 * This strategy is useful if you have a time-based model and always want the run you're operating on to start at a particular step. For example:
 *
 *      var rm = new F.manager.RunManager({
 *          strategy: 'reuse-last-initialized',
 *          strategyOptions: {
 *              initOperation: [{ step: 10 }]
 *          }
 *      });
 * 
 * This strategy is also useful if you have a custom initialization function in your model, and want to make sure it's always executed for new runs.
 *
 * Specifically, the strategy is:
 *
 * * Look for the most recent run that matches the (optional) `flag` criteria
 * * If there are no runs that match the `flag` criteria, create a new run. Immediately "initialize" this new run by:
 *     *  Calling the model operation(s) specified in the `initOperation` array.
 *     *  Optionally, setting a `flag` in the run.
 *
 */

'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};

var defaults = {
    /**
     * Operations to execute in the model for initialization to be considered complete.
     * @type {Array} Can be in any of the formats [Run Service's `serial()`](../run-api-service/#serial) supports.
     */
    initOperation: [],

    /**
     * (Optional) Flag to set in run after initialization operations are run. You typically would not override this unless you needed to set additional properties as well.
     * @type {Object}
     */
    flag: null,
};
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
        if (!this.options.initOperation || !this.options.initOperation.length) {
            throw new Error('Specifying an init function is required for this strategy');
        }
        if (!this.options.flag) {
            this.options.flag = {
                isInitComplete: true
            };
        }
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        var me = this;
        return runService.create(opt, options).then(function (createResponse) {
            return runService.serial([].concat(me.options.initOperation)).then(function () {
                return createResponse;
            });
        }).then(function (createResponse) {
            return runService.save(me.options.flag).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession, runSession, options) {
        var sessionFilter = injectFiltersFromSession(this.options.flag, userSession);
        var runopts = runService.getCurrentConfig();
        var filter = $.extend(true, { trashed: false }, sessionFilter, { model: runopts.model });
        var me = this;
        return runService.query(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});
},{"../../util/inherit":50,"../strategy-utils":26}],19:[function(require,module,exports){
/**
 * The `reuse-never` strategy always creates a new run for this end user irrespective of current state. This is equivalent to calling `F.service.Run.create()` from the [Run Service](../run-api-service/) every time. 
 * 
 * This strategy means that every time your end users refresh their browsers, they get a new run. 
 * 
 * This strategy can be useful for basic, single-page projects. This strategy is also useful for prototyping or project development: it creates a new run each time you refresh the page, and you can easily check the outputs of the model. However, typically you will use one of the other strategies for a production project.
 *
 * @name always-new
 */

'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
    },

    createIf: function (run, headers) {
        // always create a new run!
        return true;
    }
});

module.exports = Strategy;

},{"../../util/inherit":50,"./conditional-creation-strategy":11}],20:[function(require,module,exports){
/**
 * The `reuse-per-session` strategy creates a new run when the current one is not in the browser cookie.
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. However, if end users log out and return to the project at a later date, a new run is created.
 *
 * This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model that is stepped to the end as soon as it is created). In contrast, if end users play with your project for an extended period of time, executing the model step by step, the `reuse-across-sessions` strategy is probably a better choice (it allows end users to pick up where they left off, rather than starting from scratch each browser session).
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *     * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options. 
 *     * If the cookie exists, use the run id stored there. 
 *     * If the cookie does not exist, create a new run for this end user.
 *
 * @name new-if-missing
 */

'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

/*
*  create a new run only if nothing is stored in the cookie
*  this is useful for baseRuns.
*/
var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (options) {
        __super.constructor.call(this, this.createIf, options);
    },

    createIf: function (run, headers) {
        // if we are here, it means that the run exists... so we don't need a new one
        return false;
    }
});

module.exports = Strategy;

},{"../../util/inherit":50,"./conditional-creation-strategy":11}],21:[function(require,module,exports){
/**
 * ## Saved Runs Manager
 *
 * The Saved Runs Manager is a specific type of [Run Manager](../../run-manager/) which provides access to a list of runs (rather than just one run). It also provides utility functions for dealing with multiple runs (e.g. saving, deleting, listing).
 *
 * An instance of a Saved Runs Manager is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.savedRuns`. See [more information](../#properties) on using `.savedRuns` within the Scenario Manager.
 *
 */
'use strict';

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var injectFiltersFromSession = require('./strategy-utils').injectFiltersFromSession;

var SavedRunsManager = function (config) {
    var defaults = {
        /**
         * If set, will only pull runs from current group. Defaults to `true`.
         * @type {Boolean}
         */
        scopeByGroup: true,

        /**
         * If set, will only pull runs from current user. Defaults to `true`.
         *
         * For multiplayer run comparison projects, set this to false so that all end users in a group can view the shared set of saved runs.
         * @type {Boolean}
         */
        scopeByUser: true,
    };

    this.sessionManager = new SessionManager();

    var options = $.extend(true, {}, defaults, config);
    if (options.run) {
        if (options.run instanceof RunService) {
            this.runService = options.run;
        } else {
            this.runService = new RunService(options.run);
        }
        this.options = options;
    } else {
        throw new Error('No run options passed to SavedRunsManager');
    }
};

SavedRunsManager.prototype = {
    /**
     * Marks a run as saved. 
     *
     * Note that while any run can be saved, only runs which also match the configuration options `scopeByGroup` and `scopeByUser` are returned by the `getRuns()` method.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.save('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService} run Run to save. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} otherFields (Optional) Any other meta-data to save with the run.
     * @return {Promise}
     */
    save: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    },
    /**
     * Marks a run as removed; the inverse of marking as saved.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.remove('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService} run Run to remove. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} otherFields (Optional) any other meta-data to save with the run.
     * @return {Promise}
     */
    remove: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    },


    /**
     * Sets additional fields on a run. This is a convenience method for [RunService#save](../../run-api-service/#save).
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.mark('0000015a4cd1700209cd0a7d207f44bac289', 
     *          { 'myRunName': 'sample policy decisions' });
     *
     * @param  {String|RunService} run  Run to operate on. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} toMark Fields to set, as name : value pairs.
     * @return {Promise}
     */
    mark: function (run, toMark) {
        var rs;
        var existingOptions = this.runService.getCurrentConfig();
        if (run instanceof RunService) {
            rs = run;
        } else if (run && (typeof run === 'string')) {
            rs = new RunService($.extend(true, {}, existingOptions, { id: run, autoRestore: false }));
        } else if ($.isArray(run)) {
            var me = this;
            var proms = run.map(function (r) {
                return me.mark(r, toMark);
            });
            return $.when.apply(null, proms);
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    },

    /**
     * Returns a list of saved runs.
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.savedRuns.getRuns().then(function (runs) {
     *          for (var i=0; i<runs.length; i++) {
     *              console.log('run id of saved run: ', runs[i].id);
     *          }
     *      });
     *
     * @param  {Array} variables (Optional) If provided, in the returned list of runs, each run will have a `.variables` property with these set.
     * @param  {Object} filter    (Optional) Any filters to apply while fetching the run. See [RunService#filter](../../run-api-service/#filter) for details.
     * @param  {Object} modifiers (Optional) Use for paging/sorting etc. See [RunService#filter](../../run-api-service/#filter) for details.
     * @return {Promise}
     */
    getRuns: function (variables, filter, modifiers) {
        var session = this.sessionManager.getSession(this.runService.getCurrentConfig());

        var runopts = this.runService.getCurrentConfig();
        var scopedFilter = injectFiltersFromSession($.extend(true, {}, {
            saved: true, 
            trashed: false,
            model: runopts.model,
        }, filter), session, this.options);

        var opModifiers = $.extend(true, {}, {
            sort: 'created',
            direction: 'asc',
        }, modifiers);
        if (variables) {
            opModifiers.include = [].concat(variables);
        }
        return this.runService.query(scopedFilter, opModifiers);
    }
};
module.exports = SavedRunsManager;

},{"../service/run-api-service":38,"../store/session-manager":46,"./strategy-utils":26}],22:[function(require,module,exports){
/**
* ## Scenario Manager
*
* In some projects, often called "turn-by-turn" projects, end users advance through the project's model step-by-step, working either individually or together to make decisions at each step. 
*
* In other projects, often called "run comparison" or "scenario comparison" projects, end users set some initial decisions, then simulate the model to its end. Typically end users will do this several times, creating several runs, and compare the results. 
*
* The Scenario Manager makes it easy to create these "run comparison" projects. Each Scenario Manager allows you to compare the results of several runs. This is mostly useful for time-based models; by default, you can use the Scenario Manager with [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). (You can use the Scenario Manager with other languages as well, by using the Scenario Manager's [configuration options](#configuration-options) to change the `advanceOperation`.)
*
* The Scenario Manager can be thought of as a collection of [Run Managers](../run-manager/) with pre-configured [strategies](../strategies/). Just as the Run Manager provides use case -based abstractions and utilities for managing the [Run Service](../run-api-service/), the Scenario Manager does the same for the Run Manager.
*
* There are typically three components to building a run comparison:
*
* * A `current` run in which to make decisions; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run maintains state across different sessions.
* * A list of `saved` runs, that is, all runs that you want to use for comparisons.
* * A `baseline` run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. Comparing against a baseline run is optional; you can [configure](#configuration-options) the Scenario Manager to not include one.
*
* To satisfy these needs a Scenario Manager instance has three Run Managers: [baseline](./baseline/), [current](./current/), and [savedRuns](./saved/).
*
* ### Using the Scenario Manager to create a run comparison project
*
* To use the Scenario Manager, instantiate it, then access its Run Managers as needed to create your project's user interface:
*
* **Example**
*
*       var sm = new F.manager.ScenarioManager({
*           run: {
*               model: 'mymodel.vmf'
*           }
*       });
*
*       // The current is an instance of a Run Manager,
*       // with a strategy which picks up the most recent unsaved run.
*       // It is typically used to store the decisions being made by the end user. 
*       var currentRM = sm.current;
*
*       // The Run Manager operation, which retrieves the current run.
*       sm.current.getRun();
*       // The Run Manager operation, which resets the decisions made on the current run.
*       sm.current.reset();
*       // A special method on the current run,
*       // which clones the current run, then advances and saves this clone
*       // (it becomes part of the saved runs list).
*       // The current run is unchanged and can continue to be used
*       // to store decisions being made by the end user.
*       sm.current.saveAndAdvance();
*
*       // The savedRuns is an instance of a Saved Runs Manager 
*       // (itself a variant of a Run Manager).
*       // It is typically displayed in the project's UI as part of a run comparison table or chart.
*       var savedRM = sm.savedRuns;
*       // Mark a run as saved, adding it to the set of saved runs.
*       sm.savedRuns.save(run);
*       // Mark a run as removed, removing it from the set of saved runs.
*       sm.savedRuns.remove(run);
*       // List the saved runs, optionally including some specific model variables for each.
*       sm.savedRuns.getRuns();
*
*       // The baseline is an instance of a Run Manager,
*       // with a strategy which locates the most recent baseline run
*       // (that is, flagged as `saved` and not `trashed`), or creates a new one.
*       // It is typically displayed in the project's UI as part of a run comparison table or chart.
*       var baselineRM = sm.baseline;
*
*       // The Run Manager operation, which retrieves the baseline run.
*       sm.baseline.getRun();
*       // The Run Manager operation, which resets the baseline run.
*       // Useful if the model has changed since the baseline run was created.
*       sm.baseline.reset(); 
*/

'use strict';

// See integration-test-scenario-manager for usage examples
var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-runs-manager');
var strategyUtils = require('./strategy-utils');
var rutil = require('../util/run-util');

var NoneStrategy = require('./run-strategies/none-strategy');

var StateService = require('../service/state-api-adapter');
var RunService = require('../service/run-api-service');

var BaselineStrategy = require('./scenario-strategies/baseline-strategy');
var LastUnsavedStrategy = require('./scenario-strategies/reuse-last-unsaved');

var defaults = {
    /**
     * Operations to perform on each run to indicate that the run is complete. Operations are executed [serially](../run-api-service/#serial). Defaults to calling the model operation `stepTo('end')`, which advances Vensim, Powersim, and SimLang models to the end. 
     * @type {Array}
     */
    advanceOperation: [{ name: 'stepTo', params: ['end'] }],

    /**
     * Additional options to pass through to run creation (for e.g., `files`, etc.). Defaults to empty object.
     * @type {Object}
     */
    run: {},

    /**
     * Whether or not to include a baseline run in this Scenario Manager. Defaults to `true`.
     * @type {Boolean}
     */
    includeBaseLine: true,

    /**
     * Additional configuration for the `baseline` run. 
     *
     * * `baseline.runName`: Name of the baseline run. Defaults to 'Baseline'. 
     * * `baseline.run`: Additional options to pass through to run creation, specifically for the baseline run. These will override any options provided under `run`. Defaults to empty object. 
     * @type {Object}
     */
    baseline: {
        runName: 'Baseline',
        run: {}
    },

    /**
     * Additional configuration for the `current` run. 
     *
     * * `current.run`: Additional options to pass through to run creation, specifically for the current run. These will override any options provided under `run`. Defaults to empty object.
     * @type {Object}
     */
    current: {
        run: {}
    },

    /**
     * Options to pass through to the `savedRuns` list. See the [Saved Runs Manager](./saved/) for complete description of available options. Defaults to empty object.
     * @type {Object}
     */
    savedRuns: {}
};

function cookieNameFromOptions(prefix, config) {
    var key = ['account', 'project', 'model'].reduce(function (accum, key) {
        return config[key] ? accum + '-' + config[key] : accum; 
    }, prefix);
    return key;
}

function ScenarioManager(config) {
    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }

    var BaselineStrategyToUse = opts.includeBaseLine ? BaselineStrategy : NoneStrategy;
    /**
     * A [Run Manager](../run-manager/) instance containing a 'baseline' run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. By default the "advance" operation is assumed to be `stepTo: end`, which works for time-based models in [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). If you're using a different language, or need to change this, just pass in a different `advanceOperation` option while creating the Scenario Manager. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {RunManager}
     */
    this.baseline = new RunManager({
        strategy: BaselineStrategyToUse,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-baseline-run'),
        run: strategyUtils.mergeRunOptions(opts.run, opts.baseline.run),
        strategyOptions: {
            baselineName: opts.baseline.runName,
            initOperation: opts.advanceOperation
        }
    });

    /**
     * A [SavedRunsManager](../saved-runs-manager/) instance containing a list of saved runs, that is, all runs that you want to use for comparisons. The saved runs are typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {SavedRunsManager}
     */
    this.savedRuns = new SavedRunsManager($.extend(true, {}, {
        run: opts.run,
    }, opts.savedRuns));

    var origGetRuns = this.savedRuns.getRuns;
    var me = this;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        return me.baseline.getRun().then(function () {
            return origGetRuns.apply(me.savedRuns, args);
        });
    };

    /**
     * A [Run Manager](../run-manager/) instance containing a 'current' run; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run is typically used to store the decisions being made by the end user.
     * @return {RunManager}
     */
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-current-run'),
        run: strategyUtils.mergeRunOptions(opts.run, opts.current.run)
    });

    /**
     * Clones the current run, advances this clone by calling the `advanceOperation`, and saves the cloned run (it becomes part of the `savedRuns` list). Additionally, adds any provided metadata to the cloned run; typically used for naming the run. The current run is unchanged and can continue to be used to store decisions being made by the end user.
     *
     * Available only for the Scenario Manager's `current` property (Run Manager). 
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.current.saveAndAdvance({'myRunName': 'sample policy decisions'});
     *
     * **Parameters**
     * @param  {Object} metadata   Metadata to save, for example, the run name.
     * @return {Promise}
     */
    this.current.saveAndAdvance = function (metadata) {
        function clone(run) {
            var sa = new StateService();
            var advanceOpns = rutil.normalizeOperations(opts.advanceOperation); 
            //run i'm cloning shouldn't have the advance operations there by default, but just in case
            return sa.clone({ runId: run.id, exclude: advanceOpns.ops }).then(function (response) {
                var rs = new RunService(me.current.run.getCurrentConfig());
                return rs.load(response.run);
            });
        }
        function markSaved(run) {
            return me.savedRuns.save(run.id, metadata).then(function (savedResponse) {
                return $.extend(true, {}, run, savedResponse);
            });
        }
        function advance(run) {
            var rs = new RunService(run);
            return rs.serial(opts.advanceOperation).then(function () {
                return run;
            });
        }
        return me.current
                .getRun()
                .then(clone)
                .then(advance)
                .then(markSaved);
    };
}

module.exports = ScenarioManager;

},{"../service/run-api-service":38,"../service/state-api-adapter":40,"../util/run-util":54,"./run-manager":10,"./run-strategies/none-strategy":16,"./saved-runs-manager":21,"./scenario-strategies/baseline-strategy":23,"./scenario-strategies/reuse-last-unsaved":24,"./strategy-utils":26}],23:[function(require,module,exports){
/**
 * ## Baseline
 *
 * An instance of a [Run Manager](../../run-manager/) with a baseline strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.baseline`.
 *
 * A baseline is defined as a run "advanced to the end" using just the model defaults. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
 *
 * The `baseline` strategy looks for the most recent run named as 'Baseline' (or named as specified in the `baseline.runName` [configuration option of the Scenario Manager](../#configuration-options)) that is flagged as `saved` and not `trashed`. If the strategy cannot find such a run, it creates a new run and immediately executes a set of initialization operations. 
 *
 * Comparing against a baseline run is optional in a Scenario Manager; you can [configure](../#configuration-options) your Scenario Manager to not include one. See [more information](../#properties) on using `.baseline` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 *
 */

'use strict';

var ReuseinitStrategy = require('../run-strategies/reuse-last-initialized');

module.exports = function (options) {
    var defaults = {
        baselineName: 'Baseline',
        initOperation: [{ stepTo: 'end' }]
    };
    var strategyOptions = options ? options.strategyOptions : {};
    var opts = $.extend({}, defaults, strategyOptions);
    return new ReuseinitStrategy({
        strategyOptions: {
            initOperation: opts.initOperation,
            flag: {
                saved: true,
                trashed: false,
                name: opts.baselineName
            }
        }
    });
};

},{"../run-strategies/reuse-last-initialized":18}],24:[function(require,module,exports){
/**
 * ## Current (reuse-last-unsaved)
 *
 * An instance of a [Run Manager](../../run-manager/) with this strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.current`.
 *
 * The `reuse-last-unsaved` strategy returns the most recent run that is not flagged as `trashed` and also not flagged as `saved`.
 * 
 * Using this strategy means that end users continue working with the most recent run that has not been explicitly flagged by the project. However, if there are no runs for this end user, a new run is created.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `saved` and `trashed` fields of the run to determine if the run has been explicitly saved or explicitly flagged as no longer useful.
 *     * Return the most recent run that is not `trashed` and also not `saved`.
 *     * If there are no runs, create a new run for this end user. 
 *
 * See [more information](../#properties) on using `.current` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 */

'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};

//TODO: Make a more generic version of this called 'reuse-by-matching-filter';
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt, options).then(function (createResponse) {
            return $.extend(true, {}, createResponse, { freshlyCreated: true });
        });
    },

    getRun: function (runService, userSession, opts) {
        var runopts = runService.getCurrentConfig();
        var filter = injectFiltersFromSession({ 
            saved: false,
            trashed: false,
            model: runopts.model,
        }, userSession);
        var me = this;
        var outputModifiers = { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.query(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            return runs[0];
        });
    }
}, { requiresAuth: false });
},{"../../util/inherit":50,"../strategy-utils":26}],25:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],26:[function(require,module,exports){
'use strict';

var RunService = require('../service/run-api-service');

module.exports = {
    mergeRunOptions: function (run, options) {
        if (run instanceof RunService) {
            run.updateConfig(options);
            return run;
        } 
        return $.extend(true, {}, run, options);
    },

    injectFiltersFromSession: function (currentFilter, session, options) {
        var defaults = {
            scopeByGroup: true,
            scopeByUser: true,
        };
        var opts = $.extend(true, {}, defaults, options);

        var filter = $.extend(true, {}, currentFilter);
        if (opts.scopeByGroup && session && session.groupName) {
            filter['scope.group'] = session.groupName;
        }
        if (opts.scopeByUser && session && session.userId) {
            filter['user.id'] = session.userId;
        }
        return filter;
    },

    injectScopeFromSession: function (currentParams, session) {
        var group = session && session.groupName;
        var params = $.extend(true, {}, currentParams);
        if (group) {
            $.extend(params, {
                scope: { group: group }
            });
        }
        return params;
    }
};
},{"../service/run-api-service":38}],27:[function(require,module,exports){
/**
* ## World Manager
*
* As discussed under the [World API Adapter](../world-api-adapter/), a [run](../../../glossary/#run) is a collection of end user interactions with a project and its model. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.
*
* The World Manager provides an easy way to track and access the current world and run for particular end users. It is typically used in pages that end users will interact with. (The related [World API Adapter](../world-api-adapter/) handles creating multiplayer worlds, and adding and removing end users and runs from a world. Because of this, typically the World Adapter is used for facilitator pages in your project.)
*
* ### Using the World Manager
*
* To use the World Manager, instantiate it. Then, make calls to any of the methods you need.
*
* When you instantiate a World Manager, the world's account id, project id, and group are automatically taken from the session (thanks to the [Authentication Service](../auth-api-service)).
*
* Note that the World Manager does *not* create worlds automatically. (This is different than the [Run Manager](../run-manager).) However, you can pass in specific options to any runs created by the manager, using a `run` object.
*
* The parameters for creating a World Manager are:
*
*   * `account`: The **Team ID** in the Epicenter user interface for this project.
*   * `project`: The **Project ID** for this project.
*   * `group`: The **Group Name** for this world.
*   * `run`: Options to use when creating new runs with the manager, e.g. `run: { files: ['data.xls'] }`.
*   * `run.model`: The name of the primary model file for this project. Required if you have not already passed it in as part of the `options` parameter for an enclosing call.
*
* For example:
*
*       var wMgr = new F.manager.WorldManager({
*          account: 'acme-simulations',
*          project: 'supply-chain-game',
*          run: { model: 'supply-chain.py' },
*          group: 'team1'
*       });
*
*       wMgr.getCurrentRun();
*/

'use strict';

var WorldApi = require('../service/world-api-adapter');
var RunManager = require('./run-manager');
var AuthManager = require('./auth-manager');
var worldApi;

function buildStrategy(worldId, dtd) {

    return function Ctor(options) {
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implementd. Need api changes');
            },

            getRun: function (runService) {
                var me = this;
                //get or create!
                // Model is required in the options
                var model = this.options.run.model || this.options.model;
                return worldApi.getCurrentRunId({ model: model, filter: worldId })
                    .then(function (runId) {
                        return runService.load(runId);
                    })
                    .then(function (run) {
                        dtd.resolveWith(me, [run]);
                    })
                    .fail(dtd.reject);
            }
        }
        );
    };
}


module.exports = function (options) {
    this.options = options || { run: {}, world: {} };

    $.extend(true, this.options, this.options.run);
    $.extend(true, this.options, this.options.world);

    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var me = this;

    var api = {

        /**
        * Returns the current world (object) and an instance of the [World API Adapter](../world-api-adapter/).
        *
        * **Example**
        *
        *       wMgr.getCurrentWorld()
        *           .then(function(world, worldAdapter) {
        *               console.log(world.id);
        *               worldAdapter.getCurrentRunId();
        *           });
        *
        * **Parameters**
        * @param {string} userId (Optional) The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} groupName (Optional) The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
        * @return {Promise}
        */
        getCurrentWorld: function (userId, groupName) {
            var session = this._auth.getCurrentUserSessionInfo();
            if (!userId) {
                userId = session.userId;
            }
            if (!groupName) {
                groupName = session.groupName;
            }
            return worldApi.getCurrentWorldForUser(userId, groupName);
        },

        /**
        * Returns the current run (object) and an instance of the [Run API Service](../run-api-service/).
        *
        * **Example**
        *
        *       wMgr.getCurrentRun('myModel.py')
        *           .then(function(run, runService) {
        *               console.log(run.id);
        *               runService.do('startGame');
        *           });
        *
        * **Parameters**
        * @param {string} model (Optional) The name of the model file. Required if not already passed in as `run.model` when the World Manager is created.
        * @return {Promise}
        */
        getCurrentRun: function (model) {
            var dtd = $.Deferred();
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            function getAndRestoreLatestRun(world) {
                if (!world) {
                    return dtd.reject({ error: 'The user is not part of any world!' });
                }

                var currentWorldId = world.id;
                var runOpts = $.extend(true, me.options, { model: model });
                var strategy = buildStrategy(currentWorldId, dtd);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: runOpts
                });
                var rm = new RunManager(opt);
                return rm.getRun()
                    .then(function (run) {
                        dtd.resolve(run, rm.runService, rm);
                    });
            }

            this.getCurrentWorld(curUserId, curGroupName)
                .then(getAndRestoreLatestRun);

            return dtd.promise();
        }
    };

    $.extend(this, api);
};

},{"../service/world-api-adapter":44,"./auth-manager":6,"./run-manager":10}],28:[function(require,module,exports){
/**
 * ## File API Service
 *
 * The File API Service allows you to upload and download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. It is based on the Epicenter File API.
 *
 *       var fa = new F.service.File({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *       });
 *       fa.create('test.txt', 'these are my filecontents');
 *
 *       // alternatively, create a new file using a file uploaded through a file input
 *       // <input id="fileupload" type="file">
 *       //
 *       $('#fileupload').on('change', function (e) {
 *          var file = e.target.files[0];
 *          var data = new FormData();
 *          data.append('file', file, file.name);
 *          fa.create(file.name, data);
 *       });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined.
         * @type {String}
         */
        project: undefined,

        /**
         * The folder type.  One of `model` | `static` | `node`.
         * @type {String}
         */
        folderType: 'static',


        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('file')
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    function uploadBody(fileName, contents) {
        var boundary = '---------------------------7da24f2e50046';

        return {
            body: '--' + boundary + '\r\n' +
                    'Content-Disposition: form-data; name="file";' +
                    'filename="' + fileName + '"\r\n' +
                    'Content-type: text/html\r\n\r\n' +
                    contents + '\r\n' +
                    '--' + boundary + '--',
            boundary: boundary
        };
    }

    function uploadFileOptions(filePath, contents, options) {
        filePath = filePath.split('/');
        var fileName = filePath.pop();
        filePath = filePath.join('/');
        var path = serviceOptions.folderType + '/' + filePath;

        var extraParams = {};
        if (contents instanceof FormData) {
            extraParams = {
                data: contents,
                processData: false,
                contentType: false,
            };
        } else {
            var upload = uploadBody(fileName, contents);
            extraParams = {
                data: upload.body,
                contentType: 'multipart/form-data; boundary=' + upload.boundary
            };
        }

        return $.extend(true, {}, serviceOptions, options, {
            url: urlConfig.getAPIPath('file') + path,
        }, extraParams);
    }

    var publicAsyncAPI = {
        /**
         * Get a directory listing, or contents of a file.
         * @param {String} filePath  Path to the file
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        getContents: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        },

        /**
         * Replaces the file at the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String | FormData } contents Contents to write to file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        replace: function (filePath, contents, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);
            return http.put(httpOptions.data, httpOptions);
        },

        /**
         * Creates a file in the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String | FormData } contents Contents to write to file
         * @param  {Boolean} replaceExisting Replace file if it already exists; defaults to false
         * @param  {Object} options (Optional) Overrides for configuration options
         * @return {Promise}
         */
        create: function (filePath, contents, replaceExisting, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);
            var prom = http.post(httpOptions.data, httpOptions);
            var me = this;
            if (replaceExisting === true) {
                prom = prom.then(null, function (xhr) {
                    var conflictStatus = 409;
                    if (xhr.status === conflictStatus) {
                        return me.replace(filePath, contents, options);
                    }
                });
            }
            return prom;
        },

        /**
         * Removes the file.
         * @param  {String} filePath Path to the file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        remove: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.delete(null, httpOptions);
        },

        /**
         * Renames the file.
         * @param  {String} filePath Path to the file
         * @param  {String} newName  New name of file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        rename: function (filePath, newName, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.patch({ name: newName }, httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"./configuration-service":32}],29:[function(require,module,exports){
/**
 * ## Asset API Adapter
 *
 * The Asset API Adapter allows you to store assets -- resources or files of any kind -- used by a project with a scope that is specific to project, group, or end user.
 *
 * Assets are used with [team projects](../../../project_admin/#team). One common use case is having end users in a [group](../../../glossary/#groups) or in a [multiplayer world](../../../glossary/#world) upload data -- videos created during game play, profile pictures for customizing their experience, etc. -- as part of playing through the project.
 *
 * Resources created using the Asset Adapter are scoped:
 *
 *  * Project assets are writable only by [team members](../../../glossary/#team), that is, Epicenter authors.
 *  * Group assets are writable by anyone with access to the project that is part of that particular [group](../../../glossary/#groups). This includes all [team members](../../../glossary/#team) (Epicenter authors) and any [end users](../../../glossary/#users) who are members of the group -- both facilitators and standard end users.
 *  * User assets are writable by the specific end user, and by the facilitator of the group.
 *  * All assets are readable by anyone with the exact URI.
 *
 * To use the Asset Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface) and project id (**Project ID**). The group name is required for assets with a group scope, and the group name and userId are required for assets with a user scope. If not included, they are taken from the logged in user's session information if needed.
 *
 * When creating an asset, you can pass in text (encoded data) to the `create()` call. Alternatively, you can make the `create()` call as part of an HTML form and pass in a file uploaded via the form.
 *
 *       // instantiate the Asset Adapter
 *       var aa = new F.service.Asset({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1',
 *          userId: '12345'
 *       });
 *
 *       // create a new asset using encoded text
 *       aa.create('test.txt', {
 *           encoding: 'BASE_64',
 *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
 *           contentType: 'text/plain'
 *       }, { scope: 'user' });
 *
 *       // alternatively, create a new asset using a file uploaded through a form
 *       // this sample code goes with an html form that looks like this:
 *       //
 *       // <form id="upload-file">
 *       //   <input id="file" type="file">
 *       //   <input id="filename" type="text" value="myFile.txt">
 *       //   <button type="submit">Upload myFile</button>
 *       // </form>
 *       //
 *       $('#upload-file').on('submit', function (e) {
 *          e.preventDefault();
 *          var filename = $('#filename').val();
 *          var data = new FormData();
 *          var inputControl = $('#file')[0];
 *          data.append('file', inputControl.files[0], filename);
 *
 *          aa.create(filename, data, { scope: 'user' });
 *       });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var SessionManager = require('../store/session-manager');

var apiEndpoint = 'asset';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,
        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,
        /**
         * The group name. Defaults to session's `groupName`.
         * @type {String}
         */
        group: undefined,
        /**
         * The user id. Defaults to session's `userId`.
         * @type {String}
         */
        userId: undefined,
        /**
         * The scope for the asset. Valid values are: `user`, `group`, and `project`. See above for the required permissions to write to each scope. Defaults to `user`, meaning the current end user or a facilitator in the end user's group can edit the asset.
         * @type {String}
         */
        scope: 'user',
        /**
         * Determines if a request to list the assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`). Defaults to `true`.
         * @type {boolean}
         */
        fullUrl: true,
        /**
         * The transport object contains the options passed to the XHR request.
         * @type {object}
         */
        transport: {
            processData: false
        }
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    if (!serviceOptions.project) {
        serviceOptions.project = urlConfig.projectPath;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var assetApiParams = ['encoding', 'data', 'contentType'];
    var scopeConfig = {
        user: ['scope', 'account', 'project', 'group', 'userId'],
        group: ['scope', 'account', 'project', 'group'],
        project: ['scope', 'account', 'project'],
    };

    var validateFilename = function (filename) {
        if (!filename) {
            throw new Error('filename is needed.');
        }
    };

    var validateUrlParams = function (options) {
        var partKeys = scopeConfig[options.scope];
        if (!partKeys) {
            throw new Error('scope parameter is needed.');
        }

        $.each(partKeys, function () {
            if (!options[this]) {
                throw new Error(this + ' parameter is needed.');
            }
        });
    };

    var buildUrl = function (filename, options) {
        validateUrlParams(options);
        var partKeys = scopeConfig[options.scope];
        var parts = $.map(partKeys, function (key) {
            return options[key];
        });
        if (filename) {
            // This prevents adding a trailing / in the URL as the Asset API
            // does not work correctly with it
            filename = '/' + filename;
        }
        return urlConfig.getAPIPath(apiEndpoint) + parts.join('/') + filename;
    };

    // Private function, all requests follow a more or less same approach to
    // use the Asset API and the difference is the HTTP verb
    //
    // @param {string} method` (Required) HTTP verb
    // @param {string} filename` (Required) Name of the file to delete/replace/create
    // @param {object} params` (Optional) Body parameters to send to the Asset API
    // @param {object} options` (Optional) Options object to override global options.
    var upload = function (method, filename, params, options) {
        validateFilename(filename);
        // make sure the parameter is clean
        method = method.toLowerCase();
        var contentType = params instanceof FormData === true ? false : 'application/json';
        if (contentType === 'application/json') {
            // whitelist the fields that we actually can send to the api
            params = _pick(params, assetApiParams);
        } else { // else we're sending form data which goes directly in request body
            // For multipart/form-data uploads the filename is not set in the URL,
            // it's getting picked by the FormData field filename.
            filename = method === 'post' || method === 'put' ? '' : filename;
        }
        var urlOptions = $.extend({}, serviceOptions, options);
        var url = buildUrl(filename, urlOptions);
        var createOptions = $.extend(true, {}, urlOptions, { url: url, contentType: contentType });

        return http[method](params, createOptions);
    };

    var publicAPI = {
        /**
        * Creates a file in the Asset API. The server returns an error (status code `409`, conflict) if the file already exists, so
        * check first with a `list()` or a `get()`.
        *
        *  **Example**
        *
        *       var aa = new F.service.Asset({
        *          account: 'acme-simulations',
        *          project: 'supply-chain-game',
        *          group: 'team1',
        *          userId: ''
        *       });
        *
        *       // create a new asset using encoded text
        *       aa.create('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, create a new asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="upload-file">
        *       //   <input id="file" type="file">
        *       //   <input id="filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Upload myFile</button>
        *       // </form>
        *       //
        *       $('#upload-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.create(filename, data, { scope: 'user' });
        *       });
        *
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to create.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (filename, params, options) {
            return upload('post', filename, params, options);
        },

        /**
        * Gets a file from the Asset API, fetching the asset content. (To get a list
        * of the assets in a scope, use `list()`.)
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to retrieve.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        get: function (filename, options) {
            var getServiceOptions = _pick(serviceOptions, ['scope', 'account', 'project', 'group', 'userId']);
            var urlOptions = $.extend({}, getServiceOptions, options);
            var url = buildUrl(filename, urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });

            return http.get({}, getOptions);
        },

        /**
        * Gets the list of the assets in a scope.
        *
        * **Example**
        *
        *       aa.list({ fullUrl: true }).then(function(fileList){
        *           console.log('array of files = ', fileList);
        *       });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @param {string} options.scope (Optional) The scope (`user`, `group`, `project`).
        * @param {boolean} options.fullUrl (Optional) Determines if the list of assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`).
        * @return {Promise}
        */
        list: function (options) {
            var dtd = $.Deferred();
            var me = this;
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl('', urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });
            var fullUrl = getOptions.fullUrl;

            if (!fullUrl) {
                return http.get({}, getOptions);
            }

            http.get({}, getOptions)
                .then(function (files) {
                    var fullPathFiles = $.map(files, function (file) {
                        return buildUrl(file, urlOptions);
                    });
                    dtd.resolveWith(me, [fullPathFiles]);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Replaces an existing file in the Asset API.
        *
        * **Example**
        *
        *       // replace an asset using encoded text
        *       aa.replace('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHNlY29uZCB0ZXN0IGZpbGUu',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, replace an asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="replace-file">
        *       //   <input id="file" type="file">
        *       //   <input id="replace-filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Replace myFile</button>
        *       // </form>
        *       //
        *       $('#replace-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#replace-filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.replace(filename, data, { scope: 'user' });
        *       });
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file being replaced.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        replace: function (filename, params, options) {
            return upload('put', filename, params, options);
        },

        /**
        * Deletes a file from the Asset API.
        *
        * **Example**
        *
        *       aa.delete(sampleFileName);
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to delete.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        delete: function (filename, options) {
            return upload('delete', filename, {}, options);
        },

        assetUrl: function (filename, options) {
            var urlOptions = $.extend({}, serviceOptions, options);
            return buildUrl(filename, urlOptions);
        }
    };
    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/object-util":51,"./configuration-service":32}],30:[function(require,module,exports){
/**
 *
 * ## Authentication API Service
 *
 * The Authentication API Service provides a method for logging in, which creates and returns a user access token.
 *
 * User access tokens are required for each call to Epicenter. (See [Project Access](../../../project_access/) for more information.)
 *
 * If you need additional functionality -- such as tracking session information, easily retrieving the user token, or getting the groups to which an end user belongs -- consider using the [Authorization Manager](../auth-manager/) instead.
 *
 *      var auth = new F.service.Auth();
 *      auth.login({ userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        /**
         * Email or username to use for logging in. Defaults to empty string.
         * @type {String}
         */
        userName: '',

        /**
         * Password for specified `userName`. Defaults to empty string.
         * @type {String}
         */
        password: '',

        /**
         * The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects). Required if the `userName` is for an [end user](../../../glossary/#users). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('authentication')
    });
    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
         * Logs user in, returning the user access token.
         *
         * If no `userName` or `password` were provided in the initial configuration options, they are required in the `options` here. If no `account` was provided in the initial configuration options and the `userName` is for an [end user](../../../glossary/#users), the `account` is required as well.
         *
         * **Example**
         *
         *      auth.login({
         *          userName: 'jsmith',
         *          password: 'passw0rd',
         *          account: 'acme-simulations' })
         *      .then(function (token) {
         *          console.log("user access token is: ", token.access_token);
         *      });
         *
         * **Parameters**
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        login: function (options) {
            var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);
            if (!httpOptions.userName || !httpOptions.password) {
                var resp = { status: 401, statusMessage: 'No username or password specified.' };
                if (options.error) {
                    options.error.call(this, resp);
                }

                return $.Deferred().reject(resp).promise();
            }

            var postParams = {
                userName: httpOptions.userName,
                password: httpOptions.password,
            };
            if (httpOptions.account) {
                //pass in null for account under options if you don't want it to be sent
                postParams.account = httpOptions.account;
            }

            return http.post(postParams, httpOptions);
        },

        // (replace with /* */ comment block, to make visible in docs, once this is more than a noop)
        //
        // Logs user out from specified accounts.
        //
        // Epicenter logout is not implemented yet, so for now this is a dummy promise that gets automatically resolved.
        //
        // **Example**
        //
        //      auth.logout();
        //
        // **Parameters**
        // @param {Object} `options` (Optional) Overrides for configuration options.
        //
        logout: function (options) {
            var dtd = $.Deferred();
            dtd.resolve();
            return dtd.promise();
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":49,"./configuration-service":32}],31:[function(require,module,exports){
/**
 * ## Channel Service
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * If you are developing with Epicenter.js, you should use the [Epicenter Channel Manager](../epicenter-channel-manager/) directly. The Epicenter Channel Manager documentation also has more [background](../epicenter-channel-manager/#background) information on channels and their use.
 *
 * The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. See [Including Epicenter.js](../../#include).
 *
 * To use the Channel Service, instantiate it, then make calls to any of the methods you need.
 *
 *        var cs = new F.service.Channel();
 *        cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
 *
 * If you are working through the [Epicenter Channel Manager](../epicenter-channel-manager/), when you ask to "get" a particular channel, you are really asking for an instance of the Channel Service with a topic already set, for example to the appropriate group or world:
 *
 *      var cm = new F.manager.ChannelManager();
 *      var gc = cm.getGroupChannel();
 *      // because we used an Epicenter Channel Manager to get the group channel,
 *      // subscribe() and publish() here default to the base topic for the group
 *      gc.subscribe('', function(data) { console.log(data); });
 *      gc.publish('', { message: 'a new message to the group' });
 *
 * The parameters for instantiating a Channel Service include:
 *
 * * `options` The options object to configure the Channel Service.
 * * `options.base` The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
 * * `options.topicResolver` A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. Returns a String. By default, it just echoes the topic.
 * * `options.transport` The instance of `$.cometd` to hook onto. See http://docs.cometd.org/reference/javascript.html for additional background on cometd.
 */

'use strict';
var Channel = function (options) {
    var defaults = {

        /**
         * The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
         * @type {string}
         */
        base: '',

        /**
         * A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. By default, it just echoes the topic.
         *
         * **Parameters**
         *
         * * `topic` Topic to parse.
         *
         * **Return Value**
         *
         * * *String*: This function should return a string topic.
         *
         * @type {function}
         * @param {String} topic topic to resolve
         * @return {String}
         */
        topicResolver: function (topic) {
            return topic;
        },

        /**
         * The instance of `$.cometd` to hook onto.
         * @type {object}
         */
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/, '');
    return newName;
};


Channel.prototype = $.extend(Channel.prototype, {

    // future functionality:
    //      // Set the context for the callback
    //      cs.subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body);
     //
     //      // Control the order of operations by setting the `priority`
     //      cs.subscribe('run', cb, this, {priority: 9});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is 50
     //      cs.subscribe('run/variables/price', cb, this, {priority: 30, value: 50});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is greater than 50
     //      subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is even
     //      subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 === 0}});


    /**
     * Subscribe to changes on a topic.
     *
     * The topic should include the full path of the account id (**Team ID** for team projects), project id, and group name. (In most cases, it is simpler to use the [Epicenter Channel Manager](../epicenter-channel-manager/) instead, in which case this is configured for you.)
     *
     *  **Examples**
     *
     *      var cb = function(val) { console.log(val.data); };
     *
     *      // Subscribe to changes on a top-level 'run' topic
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run', cb);
     *
     *      // Subscribe to changes on children of the 'run' topic. Note this will also be triggered for changes to run.x.y.z.
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/*', cb);
     *
     *      // Subscribe to changes on both the top-level 'run' topic and its children
     *      cs.subscribe(['/acme-simulations/supply-chain-game/fall-seminar/run',
     *          '/acme-simulations/supply-chain-game/fall-seminar/run/*'], cb);
     *
     *      // Subscribe to changes on a particular variable
     *      subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/variables/price', cb);
     *
     *
     * **Return Value**
     *
     * * *String* Returns a token you can later use to unsubscribe.
     *
     * **Parameters**
     * @param  {String|Array}   topic    List of topics to listen for changes on.
     * @param  {Function} callback Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   context  Context in which the `callback` is executed.
     * @param  {Object}   options  (Optional) Overrides for configuration options.
     * @param  {Number}   options.priority  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|Number|Function}   options.value The `callback` is only triggered if this condition matches. See examples for details.
     * @return {string} Subscription ID
     */
    subscribe: function (topic, callback, context, options) {

        var topics = [].concat(topic);
        var me = this;
        var subscriptionIds = [];
        var opts = me.channelOptions;

        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                subscriptionIds.push(opts.transport.subscribe(topic, callback));
            });
        });
        return (subscriptionIds[1] ? subscriptionIds : subscriptionIds[0]);
    },

    /**
     * Publish data to a topic.
     *
     * **Examples**
     *
     *      // Send data to all subscribers of the 'run' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run', { completed: false });
     *
     *      // Send data to all subscribers of the 'run/variables' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
     *
     * **Parameters**
     *
     * @param  {String} topic Topic to publish to.
     * @param  {*} data  Data to publish to topic.
     * @return {Array | Object} Responses to published data
     *
     */
    publish: function (topic, data) {
        var topics = [].concat(topic);
        var me = this;
        var returnObjs = [];
        var opts = me.channelOptions;


        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                if (topic.charAt(topic.length - 1) === '*') {
                    topic = topic.replace(/\*+$/, '');
                    console.warn('You can cannot publish to channels with wildcards. Publishing to ', topic, 'instead');
                }
                returnObjs.push(opts.transport.publish(topic, data));
            });
        });
        return (returnObjs[1] ? returnObjs : returnObjs[0]);
    },

    /**
     * Unsubscribe from changes to a topic.
     *
     * **Example**
     *
     *      cs.unsubscribe('sampleToken');
     *
     * **Parameters**
     * @param  {String} token The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     * @return {Object} reference to current instance
     */
    unsubscribe: function (token) {
        this.channelOptions.transport.unsubscribe(token);
        return this;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }

});

module.exports = Channel;

},{}],32:[function(require,module,exports){
/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     var cs = require('configuration-service')({
 *          dev: { //environment
                port: 3000,
                host: 'localhost',
            },
            prod: {
                port: 8080,
                host: 'api.forio.com',
                logLevel: 'none'
            },
            logLevel: 'DEBUG' //global
 *     });
 *
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('dev');
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('prod');
 *      cs.get('logLevel'); //returns 'none'
 *
 */

'use strict';
var urlService = require('./url-config-service');

module.exports = function (config) {
    //TODO: Environments
    var defaults = {
        logLevel: 'NONE'
    };
    var serviceOptions = $.extend({}, defaults, config);
    serviceOptions.server = urlService(serviceOptions.server);

    return {

        data: serviceOptions,

        /**
         * Set the environment key to get configuration options from
         * @param { string} env
         */
        setEnv: function (env) {

        },

        /**
         * Get configuration.
         * @param  { string} property optional
         * @return {*}          Value of property if specified, the entire config object otherwise
         */
        get: function (property) {
            return serviceOptions[property];
        },

        /**
         * Set configuration.
         * @param  { string|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
         * @param  {*} value  value for provided key
         */
        set: function (key, value) {
            serviceOptions[key] = value;
        }
    };
};


},{"./url-config-service":41}],33:[function(require,module,exports){
/**
 * ## Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, there are three required parameters when you instantiate the Data Service:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 * * `root`: The the name of the collection. If you have multiple collections within each of your projects, you can also pass the collection name as an option for each call.
 *
 *       var ds = new F.service.Data({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          root: 'survey-responses',
 *          server: { host: 'api.forio.com' }
 *       });
 *       ds.saveAs('user1',
 *          { 'question1': 2, 'question2': 10,
 *          'question3': false, 'question4': 'sometimes' } );
 *       ds.saveAs('user2',
 *          { 'question1': 3, 'question2': 8,
 *          'question3': true, 'question4': 'always' } );
 *       ds.query('',{ 'question2': { '$gt': 9} });
 *
 * Note that in addition to the `account`, `project`, and `root`, the Data Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 */

'use strict';

var ConfigService = require('./configuration-service');
var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * Name of collection. Required. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`, but must be set to a collection name.
         * @type {String}
         */
        root: '/',

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
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var getURL = function (key, root) {
        if (!root) {
            root = serviceOptions.root;
        }
        var url = urlConfig.getAPIPath('data') + qutil.addTrailingSlash(root);
        if (key) {
            url += qutil.addTrailingSlash(key);
        }
        return url;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: getURL
    });
    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Search for data within a collection.
         *
         * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional details.
         *
         * **Examples**
         *
         *      // request all data associated with document 'user1'
         *      ds.query('user1');
         *
         *      // exact matching:
         *      // request all documents in collection where 'question2' is 9
         *      ds.query('', { 'question2': 9});
         *
         *      // comparison operators:
         *      // request all documents in collection
         *      // where 'question2' is greater than 9
         *      ds.query('', { 'question2': { '$gt': 9} });
         *
         *      // logical operators:
         *      // request all documents in collection
         *      // where 'question2' is less than 10, and 'question3' is false
         *      ds.query('', { '$and': [ { 'question2': { '$lt':10} }, { 'question3': false }] });
         *
         *      // regular expresssions: use any Perl-compatible regular expressions
         *      // request all documents in collection
         *      // where 'question5' contains the string '.*day'
         *      ds.query('', { 'question5': { '$regex': '.*day' } });
         *
         * **Parameters**
         * @param {String} key The name of the document to search. Pass the empty string ('') to search the entire collection.
         * @param {Object} query The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional examples.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        query: function (key, query, outputModifier, options) {
            var params = $.extend(true, { q: query }, outputModifier);
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(params, httpOptions);
        },

        /**
         * Save data in an anonymous document within the collection.
         *
         * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `save` call explicitly by overriding the options (third parameter).
         *
         * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `save` method is making a `POST` request.)
         *
         * **Example**
         *
         *      // Create a new document, with one element, at the default root level
         *      ds.save('question1', 'yes');
         *
         *      // Create a new document, with two elements, at the default root level
         *      ds.save({ question1:'yes', question2: 32 });
         *
         *      // Create a new document, with two elements, at `/students/`
         *      ds.save({ name:'John', className: 'CS101' }, { root: 'students' });
         *
         * **Parameters**
         *
         * @param {String|Object} key If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
         * @param {Object} value (Optional) The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
         * @param {Object} options (Optional) Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
         * @return {Promise} 
         */
        save: function (key, value, options) {
            var attrs;
            if (typeof key === 'object') {
                attrs = key;
                options = value;
            } else {
                (attrs = {})[key] = value;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL('', httpOptions.root);

            return http.post(attrs, httpOptions);
        },

        /**
         * Save (create or replace) data in a named document or element within the collection. 
         * 
         * The `root` of the collection must be specified. By default the `root` is taken from the Data Service configuration options; you can also pass the `root` to the `saveAs` call explicitly by overriding the options (third parameter).
         *
         * Optionally, the named document or element can include path information, so that you are saving just part of the document.
         *
         * (Additional background: Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for more information. The `saveAs` method is making a `PUT` request.)
         *
         * **Example**
         *
         *      // Create (or replace) the `user1` document at the default root level.
         *      // Note that this replaces any existing content in the `user1` document.
         *      ds.saveAs('user1',
         *          { 'question1': 2, 'question2': 10,
         *           'question3': false, 'question4': 'sometimes' } );
         *
         *      // Create (or replace) the `student1` document at the `students` root, 
         *      // that is, the data at `/students/student1/`.
         *      // Note that this replaces any existing content in the `/students/student1/` document.
         *      // However, this will keep existing content in other paths of this collection.
         *      // For example, the data at `/students/student2/` is unchanged by this call.
         *      ds.saveAs('student1',
         *          { firstName: 'john', lastName: 'smith' },
         *          { root: 'students' });
         *
         *      // Create (or replace) the `mgmt100/groupB` document at the `myclasses` root,
         *      // that is, the data at `/myclasses/mgmt100/groupB/`.
         *      // Note that this replaces any existing content in the `/myclasses/mgmt100/groupB/` document.
         *      // However, this will keep existing content in other paths of this collection.
         *      // For example, the data at `/myclasses/mgmt100/groupA/` is unchanged by this call.
         *      ds.saveAs('mgmt100/groupB',
         *          { scenarioYear: '2015' },
         *          { root: 'myclasses' });
         *
         * **Parameters**
         *
         * @param {String} key Id of the document.
         * @param {Object} value (Optional) The data to save, in key:value pairs.
         * @param {Object} options (Optional) Overrides for configuration options. If you want to override the default `root` of the collection, do so here.
         * @return {Promise} 
         */
        saveAs: function (key, value, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);

            return http.put(value, httpOptions);
        },

        /**
         * Get data for a specific document or field.
         *
         * **Example**
         *
         *      ds.load('user1');
         *      ds.load('user1/question3');
         *
         * **Parameters**
         * @param  {String|Object} key The id of the data to return. Can be the id of a document, or a path to data within that document.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options Overrides for configuration options.
         * @return {Promise} 
         */
        load: function (key, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
         *
         * **Example**
         *
         *     ds.remove('user1');
         *
         *
         * **Parameters**
         *
         * @param {String|Array} keys The id of the document to remove from this collection, or an array of such ids.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        remove: function (keys, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params;
            if ($.isArray(keys)) {
                params = { id: keys };
            } else {
                params = '';
                httpOptions.url = getURL(keys, httpOptions.root);
            }
            return http.delete(params, httpOptions);
        }

        // Epicenter doesn't allow nuking collections
        //     /**
        //      * Removes collection being referenced
        //      * @return null
        //      */
        //     destroy: function (options) {
        //         return this.remove('', options);
        //     }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/query-util":53,"./configuration-service":32}],34:[function(require,module,exports){
/**
 *
 * ## Group API Adapter
 *
 * The Group API Adapter provides methods to look up, create, change or remove information about groups in a project. It is based on query capabilities of the underlying RESTful [Group API](../../../rest_apis/user_management/group/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var ma = new F.service.Group({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForProject({ account: 'acme', project: 'sample' });
 */

'use strict';

var serviceUtils = require('./service-utils');
var TransportFactory = require('../transport/http-transport-factory');
var objectAssign = require('object-assign');

var apiEndpoint = 'group/local';

var GroupService = function (config) {
    var defaults = {
        /**
         * Epicenter account name. Defaults to undefined.
         * @type {string}
         */
        account: undefined,

        /**
         * Epicenter project name. Defaults to undefined.
         * @type {string}
         */
        project: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = serviceUtils.getDefaultOptions(defaults, config, { apiEndpoint: apiEndpoint });
    var transportOptions = serviceOptions.transport;
    delete serviceOptions.transport;
    var http = new TransportFactory(transportOptions, serviceOptions);
    var publicAPI = {
        /**
        * Gets information for a group or multiple groups.
        * @param {Object} params object with query parameters
        * @patam {string} params.q partial match for name, organization or event.
        * @patam {string} params.account Epicenter's Team ID
        * @patam {string} params.project Epicenter's Project ID
        * @patam {string} params.name Epicenter's Group Name
        * @param {Object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroups: function (params, options) {
            //groupID is part of the URL
            //q, account and project are part of the query string
            var finalOpts = objectAssign({}, serviceOptions, options);
            var finalParams;
            if (typeof params === 'string') {
                finalOpts.url = serviceUtils.getApiUrl(apiEndpoint + '/' + params, finalOpts);
            } else {
                finalParams = params;
            }
            return http.get(finalParams, finalOpts);
        }
    };
    objectAssign(this, publicAPI);
};

module.exports = GroupService;

},{"../transport/http-transport-factory":49,"./service-utils":39,"object-assign":2}],35:[function(require,module,exports){
/**
 *
 * ## Introspection API Service
 *
 * The Introspection API Service allows you to view a list of the variables and operations in a model. Typically used in conjunction with the [Run API Service](../run-api-service/).
 *
 * The Introspection API Service is not available for Forio SimLang.
 *
 *       var intro = new F.service.Introspect({
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game'
 *       });
 *       intro.byModel('supply-chain.py').then(function(data){ ... });
 *       intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6').then(function(data){ ... });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

var apiEndpoint = 'model/introspect';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

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

    };

    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters, such as `files`.
         *
         * **Example**
         *
         *      intro.byModel('abc.vmf')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} modelFile Name of the model file to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byModel: function (modelFile, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            if (!opts.account || !opts.project) {
                throw new Error('Account and project are required when using introspect#byModel');
            }
            if (!modelFile) {
                throw new Error('modelFile is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + [opts.account, opts.project, modelFile].join('/') };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        },

        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters such as `files`.
         *
         * **Example**
         *
         *      intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} runID Id of the run to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byRunID: function (runID, options) {
            if (!runID) {
                throw new Error('runID is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + runID };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        }
    };
    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"./configuration-service":32}],36:[function(require,module,exports){
/**
 *
 * ## Member API Adapter
 *
 * The Member API Adapter provides methods to look up information about end users for your project and how they are divided across groups. It is based on query capabilities of the underlying RESTful [Member API](../../../rest_apis/user_management/member/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). For example, if some of your end users are facilitators, or if your end users should be treated differently based on which group they are in, use the Member API to find that information.
 *
 *      var ma = new F.service.Member({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      ma.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var _pick = require('../util/object-util')._pick;
var apiEndpoint = 'member/local';

module.exports = function (config) {
    var defaults = {
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
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions, serviceOptions);

    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, serviceOptions, params);
        }
        return serviceOptions;
    };

    var patchUserActiveField = function (params, active, options) {
        var httpOptions = $.extend(true, serviceOptions, options, {
            url: urlConfig.getAPIPath(apiEndpoint) + params.groupId + '/' + params.userId
        });

        return http.patch({ active: active }, httpOptions);
    };

    var publicAPI = {

        /**
        * Retrieve details about all of the group memberships for one end user. The membership details are returned in an array, with one element (group record) for each group to which the end user belongs.
        *
        * In the membership array, each group record includes the group id, project id, account (team) id, and an array of members. However, only the user whose userId is included in the call is listed in the members array (regardless of whether there are other members in this group).
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupsForUser('42836d4b-5b61-4fe4-80eb-3136e956ee5c')
        *           .then(function(memberships){
        *               for (var i=0; i<memberships.length; i++) {
        *                   console.log(memberships[i].groupId);
        *               }
        *           });
        *
        *       ma.getGroupsForUser({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c' });
        *
        * **Parameters**
        * @param {string|object} params The user id for the end user. Alternatively, an object with field `userId` and value the user id.
        * @param {object} options (Optional) Overrides for configuration options.
        */

        getGroupsForUser: function (params, options) {
            options = options || {};
            var httpOptions = $.extend(true, serviceOptions, options);
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.userId) {
                throw new Error('No userId specified.');
            }

            var getParms = isString ? { userId: params } : _pick(objParams, 'userId');
            return http.get(getParms, httpOptions);
        },

        /**
        * Retrieve details about one group, including an array of all its members.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupDetails('80257a25-aa10-4959-968b-fd053901f72f')
        *           .then(function(group){
        *               for (var i=0; i<group.members.length; i++) {
        *                   console.log(group.members[i].userName);
        *               }
        *           });
        *
        *       ma.getGroupDetails({ groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {string|object} params The group id. Alternatively, an object with field `groupId` and value the group id.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroupDetails: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupId) {
                throw new Error('No groupId specified.');
            }

            var groupId = isString ? params : objParams.groupId;
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupId }
            );

            return http.get({}, httpOptions);
        },

        /**
        * Set a particular end user as `active`. Active end users can be assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserActive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make active.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become active.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserActive: function (params, options) {
            return patchUserActiveField(params, true, options);
        },

        /**
        * Set a particular end user as `inactive`. Inactive end users are not assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserInactive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make inactive.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become inactive.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserInactive: function (params, options) {
            return patchUserActiveField(params, false, options);
        }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/object-util":51,"./configuration-service":32}],37:[function(require,module,exports){
/**
 *
 * ## Presence API Service
 *
 * The Presence API Service provides methods to get and set the presence of an end user in a project, that is, to indicate whether the end user is online. This happens automatically: in projects that use [channels](../epicenter-channel-manager/), the end user's presence is published automatically on a "presence" channel that is specific to each group. You can also use the Presence API Service to do this explicitly: you can make a call to indicate that a particular end user is online or offline. 
 *
 * The Presence API Service is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). It is typically used only in multiplayer projects, to facilitate end users communicating with each other. It is based on the query capabilities of the underlying RESTful [Presence API](../../../rest_apis/multiplayer/presence/).
 *
 *      var pr = new F.service.Presence();
 *      pr.markOnline('example-userId');
 *      pr.markOffline('example-userId');
 *      pr.getStatus();
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var apiEndpoint = 'presence';

module.exports = function (config) {
    var defaults = {
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        project: undefined,

        /**
         * Epicenter group name. Defaults to undefined. Note that this is the group *name*, not the group *id*. If left blank, taken from the session manager.
         * @type {string}
         */
        groupName: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {},
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions, serviceOptions);


    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, {}, serviceOptions, params);
        }
        return serviceOptions;
    };

    var publicAPI = {
        /**
         * Marks an end user as online.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOnline('0000015a68d806bc09cd0a7d207f44ba5f74')
         *          .then(function(presenceObj) {
         *               console.log('user ', presenceObj.userId, 
         *                    ' now online, as of ', presenceObj.lastModified);
         *          });
         *
         * **Return Value**
         *
         * Promise with presence information for user marked online.
         *
         * **Parameters**
         *
         * @param  {String} userId (optional) If not provided, taken from session cookie.
         * @param  {Object} options Additional options to change the presence service defaults.
         * @return {Promise} promise
         */
        markOnline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId }
            );
            return http.post({ message: 'online' }, httpOptions);
        },

        /**
         * Marks an end user as offline.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOffline('0000015a68d806bc09cd0a7d207f44ba5f74');
         *
         * **Return Value**
         *
         * Promise to remove presence record for end user.
         *
         * **Parameters**
         *
         * @param  {String} userId (optional) If not provided, taken from session cookie.
         * @param  {Object} options Additional options to change the presence service defaults.
         * @return {Promise} promise
         */
        markOffline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId }
            );
            return http.delete({}, httpOptions);
        },

        /**
         * Returns a list of all end users in this group that are currently online.
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.getStatus('groupName').then(function(onlineUsers) {
         *          for (var i=0; i < onlineUsers.length; i++) {
         *               console.log('user ', onlineUsers[i].userId, 
         *                    ' is online as of ', onlineUsers[i].lastModified);
         *          }
         *     });
         *
         * **Return Value**
         *
         * Promise with response of online users
         *
         * **Parameters**
         *
         * @param  {String} groupName (optional) If not provided, taken from session cookie.
         * @param  {Object} options Additional options to change the presence service defaults.
         * @return {Promise} promise
         */
        getStatus: function (groupName, options) {
            options = options || {};
            var objParams = getFinalParams(groupName);
            if (!groupName && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName }
            );
            return http.get({}, httpOptions);
        },

        /**
         * End users are automatically marked online and offline in a "presence" channel that is specific to each group. Gets this channel (an instance of the [Channel Service](../channel-service/)) for the given group. (Note that this Channel Service instance is also available from the [Epicenter Channel Manager getPresenceChannel()](../epicenter-channel-manager/#getPresenceChannel).)
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     var cm = pr.getChannel('group1');
         *     cm.publish('', 'a message to presence channel');
         *
         * **Return Value**
         *
         * Channel instance for Presence channel
         *
         * **Parameters**
         *
         * @param  {String} groupName (optional) If not provided, taken from session cookie.
         * @param  {Object} options Additional options to change the presence service defaults
         * @return {Channel} Channel instance
         */
        getChannel: function (groupName, options) {
            var ChannelManager = require('../managers/epicenter-channel-manager');
            options = options || {};
            var isString = typeof groupName === 'string';
            var objParams = getFinalParams(groupName);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = isString ? groupName : objParams.groupName;
            var cm = new ChannelManager(options);
            return cm.getPresenceChannel(groupName);
        }
    };

    $.extend(this, publicAPI);
};

},{"../managers/epicenter-channel-manager":8,"../store/session-manager":46,"../transport/http-transport-factory":49,"./configuration-service":32}],38:[function(require,module,exports){
/**
 *
 * ## Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly. This is because the Run Manager (and associated [run strategies](../strategies/)) gives you control over run creation depending on run states.
 *
 * The Run API Service is useful for building an interface where you want to show data across multiple runs (this is easy using the `filter()` and `query()` methods). For instance, you would probably use a Run Service to build a page for a facilitator. This is because a facilitator typically wants to evaluate performance from multiple end users, each of whom have been working with their own run.
 *
 * To use the Run API Service, instantiate it by passing in:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 *
 * If you know in advance that you would like to work with particular, existing run(s), you can optionally pass in:
 *
 * * `filter`: (Optional) Criteria by which to filter for existing runs. 
 * * `id`: (Optional) The run id of an existing run. This is a convenience alias for using filter, in the case where you only want to work with one run.
 *
 * For example,
 *
 *       var rs = new F.service.Run({
 *            account: 'acme-simulations',
 *            project: 'supply-chain-game',
 *      });
 *      rs.create('supply_chain_game.py').then(function(run) {
 *             rs.do('someOperation');
 *      });
 *
 *
 * Additionally, all API calls take in an `options` object as the last parameter. The options can be used to extend/override the Run API Service defaults listed below. In particular, passing `{ id: 'a-run-id' }` in this `options` object allows you to make calls to an existing run.
 *
 * Note that in addition to the `account`, `project`, and `model`, the Run Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply_chain_game.py',
 *               server: { host: 'api.forio.com' }
 *           }
 *       });
 *       rm.getRun()
 *           .then(function(run) {
 *               // the RunManager.run contains the instantiated Run Service,
 *               // so any Run Service method is valid here
 *               var rs = rm.run;
 *               rs.do('someOperation');
 *       })
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var qutil = require('../util/query-util');
var rutil = require('../util/run-util');
var _pick = require('../util/object-util')._pick;
var TransportFactory = require('../transport/http-transport-factory');
var VariablesService = require('./variables-api-service');
var IntrospectionService = require('./introspection-api-service');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to undefined). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter. Pass in an existing run id to interact with a particular run.
         * @type {String}
         */
        id: '',

        /**
         * Flag determines if `X-AutoRestore: true` header is sent to Epicenter, meaning runs are automatically pulled from the Epicenter backend database if not currently in memory on the Epicenter servers. Defaults to `true`.
         * @type {boolean}
         */
        autoRestore: true,

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         * @type {function}
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         * @type {function}
         */
        error: $.noop,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    function updateURLConfig(opts) {
        var urlConfig = new ConfigService(opts).get('server');
        if (opts.account) {
            urlConfig.accountPath = opts.account;
        }
        if (opts.project) {
            urlConfig.projectPath = opts.project;
        }

        urlConfig.filter = ';';
        urlConfig.getFilterURL = function (filter) {
            var url = urlConfig.getAPIPath('run');
            var filterMatrix = qutil.toMatrixFormat(filter || opts.filter);

            if (filterMatrix) {
                url += filterMatrix + '/';
            }
            return url;
        };

        urlConfig.addAutoRestoreHeader = function (options) {
            var filter = opts.filter;
            // The semicolon separated filter is used when filter is an object
            var isFilterRunId = filter && $.type(filter) === 'string';
            if (opts.autoRestore && isFilterRunId) {
                // By default autoreplay the run by sending this header to epicenter
                // https://forio.com/epicenter/docs/public/rest_apis/aggregate_run_api/#retrieving
                var autorestoreOpts = {
                    headers: {
                        'X-AutoRestore': true
                    }
                };
                return $.extend(true, autorestoreOpts, options);
            }

            return options;
        };
        return urlConfig;
    }

    var http;
    var httpOptions; //FIXME: Make this side-effect-less
    function updateHTTPConfig(serviceOptions, urlConfig) {
        httpOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getFilterURL
        });

        if (serviceOptions.token) {
            httpOptions.headers = {
                Authorization: 'Bearer ' + serviceOptions.token
            };
        }
        http = new TransportFactory(httpOptions);
        http.splitGet = rutil.splitGetFactory(httpOptions);
    }

    var urlConfig = updateURLConfig(serviceOptions); //making a function so #updateConfig can call this; change when refactored
    updateHTTPConfig(serviceOptions, urlConfig);
   

    function setFilterOrThrowError(options) {
        if (options.id) {
            serviceOptions.filter = serviceOptions.id = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = serviceOptions.id = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    }

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `reuse-never`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
         *
         *  **Example**
         *
         *      rs.create('hello_world.jl');
         *
         *  **Parameters**
         * @param {String|Object} params If a string, the name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project. If an object, may include `model`, `scope`, and `files`. (See the [Run Manager](../run_manager/) for more information on `scope` and `files`.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('run') });
            var runApiParams = ['model', 'scope', 'files', 'ephemeral', 'cinFiles'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, runApiParams);
            }

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                serviceOptions.id = response.id;
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * The elements of the `qs` object are ANDed together within a single call to `.query()`.
         *
         * **Example**
         *
         *      // returns runs with saved = true and variables.price > 1,
         *      // where variables.price has been persisted (recorded)
         *      // in the model.
         *     rs.query({
         *          'saved': 'true',
         *          '.price': '>1'
         *       },
         *       {
         *          startrecord: 2,
         *          endrecord: 5
         *       });
         *
         * **Parameters**
         * @param {Object} qs Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        query: function (qs, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, { url: urlConfig.getFilterURL(qs) }, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);

            return http.splitGet(outputModifier, httpOptions).then(function (r) {
                return ($.isPlainObject(r) && Object.keys(r).length === 0) ? [] : r;
            });
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`.
         *
         * **Parameters**
         * @param {Object} filter Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your model or marked for saving in your [model context file](../../../model_code/context/)).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            } else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.splitGet(outputModifier, httpOptions).then(function (r) {
                return ($.isPlainObject(r) && Object.keys(r).length === 0) ? [] : r;
            });
        },

        /**
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables or run record variables, pass them as part of the `filters` parameter.
         *
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed or saved in your model &mdash; are available.
         *
         * **Example**
         *
         *     rs.load('bb589677-d476-4971-a68e-0c58d191e450', { include: ['.price', '.sales'] });
         *
         * **Parameters**
         * @param {String} runID The run id.
         * @param {Object} filters (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        load: function (runID, filters, options) {
            if (runID) {
                serviceOptions.filter = runID; //shouldn't be able to over-ride
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.get(filters, httpOptions);
        },

        /**
         * Removes specified runid from memory
         *
         * **Example**
         *
         *     rs.removeFromMemory('bb589677-d476-4971-a68e-0c58d191e450');
         *
         * See [details on run persistence](../../../run_persistence/#runs-in-memory)
         * @param  {String} [runID]   id of run to remove
         * @param  {Object} [filters] (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param  {Object} [options] (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        removeFromMemory: function (runID, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            if (runID) {
                httpOptions.url = urlConfig.getAPIPath('run') + runID;
            }
            return http.delete({}, httpOptions);
        },

        /**
         * Save attributes (data, model variables) of the run.
         *
         * **Examples**
         *
         *     // add 'completed' field to run record
         *     rs.save({ completed: true });
         *
         *     // update 'saved' field of run record, and update values of model variables for this run
         *     rs.save({ saved: true, variables: { a: 23, b: 23 } });
         *
         *     // update 'saved' field of run record for a particular run
         *     rs.save({ saved: true }, { id: '0000015bf2a04995880df6b868d23eb3d229' });
         *
         * **Parameters**
         * @param {Object} attributes The run data and variables to save.
         * @param {Object} attributes.variables Model variables must be included in a `variables` field within the `attributes` object. (Otherwise they are treated as run data and added to the run record directly.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            return http.patch(attributes, httpOptions);
        },

        /**
         * Call an operation from the model.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *      // operation "solve" takes no arguments
         *     rs.do('solve');
         *      // operation "echo" takes one argument, a string
         *     rs.do('echo', ['hello']);
         *      // operation "echo" takes one argument, a string
         *     rs.do('echo', 'hello');
         *      // operation "sumArray" takes one argument, an array
         *     rs.do('sumArray', [[4,2,1]]);
         *      // operation "add" takes two arguments, both integers
         *     rs.do({ name:'add', params:[2,4] });
         *      // call operation "solve" on a different run 
         *     rs.do('solve', { id: '0000015bf2a04995880df6b868d23eb3d229' });
         *
         * **Parameters**
         * @param {String} operation Name of operation.
         * @param {Array} params (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else if ($.isPlainObject(params)) {
                opsArgs = null;
                postOptions = params;
            } else {
                opsArgs = params;
            }
            var result = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            return http.post({ arguments: prms }, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several operations from the model, sequentially.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Examples**
         *
         *      // operations "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // operations "init" and "reset" take two arguments each
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'reset', params: [2,3] }]);
         *      // operation "init" takes two arguments,
         *      // operation "runmodel" takes none
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'runmodel', params: [] }]);
         *
         * **Parameters**
         * @param {Array} operations If none of the operations take parameters, pass an array of the operation names (strings). If any of the operations do take parameters, pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var responses = [];
            var doSingleOp = function () {
                var op = ops.shift();
                var arg = args.shift();

                me.do(op, arg, {
                    success: function (result) {
                        responses.push(result);
                        if (ops.length) {
                            doSingleOp();
                        } else {
                            $d.resolve(responses);
                            postOptions.success(responses, me);
                        }
                    },
                    error: function (err) {
                        responses.push(err);
                        $d.reject(responses);
                        postOptions.error(responses, me);
                    }
                });
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Call several operations from the model, executing them in parallel.
         *
         * Depending on the language in which you have written your model, the operation (function or method) may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Example**
         *
         *      // operations "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']);
         *      // operations "add" and "subtract" take two arguments each
         *     rs.parallel([ { name: 'add', params: [1,2] },
         *                   { name: 'subtract', params:[2,3] }]);
         *      // operations "add" and "subtract" take two arguments each
         *     rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * **Parameters**
         * @param {Array|Object} operations If none of the operations take parameters, pass an array of the operation names (as strings). If any of the operations do take parameters, you have two options. You can pass an array of objects, each of which contains an operation name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the operation name and a (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} The parameter to the callback is an array. Each array element is an object containing the results of one operation.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue = [];
            for (var i = 0; i < ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }

            var me = this;
            $.when.apply(this, queue)
                .then(function () {
                    var args = Array.prototype.slice.call(arguments);
                    var actualResponse = args.map(function (a) {
                        return a[0];
                    });
                    $d.resolve(actualResponse);
                    postOptions.success(actualResponse, me);
                })
                .fail(function () {
                    var args = Array.prototype.slice.call(arguments);
                    var actualResponse = args.map(function (a) {
                        return a[0];
                    });
                    $d.reject(actualResponse);
                    postOptions.error(actualResponse, me);
                });

            return $d.promise();
        },

        /**
         * Shortcut to using the [Introspection API Service](../introspection-api-service/). Allows you to view a list of the variables and operations in a model.
         *
         * **Example**
         *
         *     rs.introspect({ runID: 'cbf85437-b539-4977-a1fc-23515cf071bb' }).then(function (data) {
         *          console.log(data.functions);
         *          console.log(data.variables);
         *     });
         *
         * **Parameters**
         * @param  {Object} options Options can either be of the form `{ runID: <runid> }` or `{ model: <modelFileName> }`. Note that the `runID` is optional if the Run Service is already associated with a particular run (because `id` was passed in when the Run Service was initialized). If provided, the `runID` overrides the `id` currently associated with the Run Service.
         * @param  {Object} introspectionConfig (Optional) Service options for Introspection Service
         * @return {Promise}
         */
        introspect: function (options, introspectionConfig) {
            var introspection = new IntrospectionService($.extend(true, {}, serviceOptions, introspectionConfig));
            if (options) {
                if (options.runID) {
                    return introspection.byRunID(options.runID);
                } else if (options.model) {
                    return introspection.byModel(options.model);
                }
            } else if (serviceOptions.id) {
                return introspection.byRunID(serviceOptions.id);
            } else {
                throw new Error('Please specify either the model or runid to introspect');
            }
        }
    };

    var publicSyncAPI = {
        getCurrentConfig: function () {
            return serviceOptions;
        },
        updateConfig: function (config) {
            if (config && config.id) {
                config.filter = config.id;
            } else if (config && config.filter) {
                config.id = config.filter;
            }
            serviceOptions = $.extend(true, {}, serviceOptions, config);
            urlConfig = updateURLConfig(serviceOptions);
            this.urlConfig = urlConfig;
            updateHTTPConfig(serviceOptions, urlConfig);
        },
        /**
          * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
          *
          * **Example**
          *
          *      var vs = rs.variables();
          *      vs.save({ sample_int: 4 });
          *
          * **Parameters**
          * @param {Object} config (Optional) Overrides for configuration options.
          * @return {Object} variablesService Instance
          */
        variables: function (config) {
            var vs = new VariablesService($.extend(true, {}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    $.extend(this, publicSyncAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/object-util":51,"../util/query-util":53,"../util/run-util":54,"./configuration-service":32,"./introspection-api-service":35,"./variables-api-service":43}],39:[function(require,module,exports){
'use strict';

var ConfigService = require('./configuration-service');
var SessionManager = require('../store/session-manager');
var objectAssign = require('object-assign');

var serviceUtils = {
    /*
    * Gets the default options for a api service.
    * It will merge:
    * - The Session options (Using the Session Manager)
    * - The Authorization Header from the token option
    * - The full url from the endpoint option
    * With the supplied overrides and defaults
    *
    */
    getDefaultOptions: function (defaults) {
        var rest = Array.prototype.slice.call(arguments, 1);
        var sessionManager = new SessionManager();
        var serviceOptions = sessionManager.getMergedOptions.apply(sessionManager, [defaults].concat(rest));

        serviceOptions.transport = objectAssign({}, serviceOptions.transport, {
            url: this.getApiUrl(serviceOptions.apiEndpoint, serviceOptions)
        });

        if (serviceOptions.token) {
            serviceOptions.transport.headers = {
                Authorization: 'Bearer ' + serviceOptions.token
            };
        }
        return serviceOptions;
    },

    getApiUrl: function (apiEndpoint, serviceOptions) {
        var urlConfig = new ConfigService(serviceOptions).get('server');
        return urlConfig.getAPIPath(apiEndpoint);
    }
};

module.exports = serviceUtils;
},{"../store/session-manager":46,"./configuration-service":32,"object-assign":2}],40:[function(require,module,exports){
'use strict';
/**
 * ## State API Adapter
 *
 * The State API Adapter allows you to view the history of a run, and to replay or clone runs. 
 *
 * The State API Adapter brings existing, persisted run data from the database back into memory, using the same run id (`replay`) or a new run id (`clone`). Runs must be in memory in order for you to update variables or call operations on them.
 *
 * Specifically, the State API Adapter works by "re-running" the run (user interactions) from the creation of the run up to the time it was last persisted in the database. This process uses the current version of the run's model. Therefore, if the model has changed since the original run was created, the retrieved run will use the new model — and may end up having different values or behavior as a result. Use with care!
 *
 * To use the State API Adapter, instantiate it and then call its methods:
 *
 *      var sa = new F.service.State();
 *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f'});
 *
 * The constructor takes an optional `options` parameter in which you can specify the `account` and `project` if they are not already available in the current context.
 *
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var SessionManager = require('../store/session-manager');
var apiEndpoint = 'model/state';

module.exports = function (config) {

    var defaults = {

    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);
    var parseRunIdOrError = function (params) {
        if ($.isPlainObject(params) && params.runId) {
            return params.runId;
        } else {
            throw new Error('Please pass in a run id');
        }
    };

    var publicAPI = {

        /**
        * View the history of a run.
        * 
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.load('0000015a06bb58613b28b57365677ec89ec5').then(function(history) {
        *            console.log('history = ', history);
        *      });
        *
        *  **Parameters**
        * @param {string} runId The id of the run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        load: function (runId, options) {
            var httpParams = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );
            return http.get('', httpParams);
        },

        /**
        * Replay a run. After this call, the run, with its original run id, is now available [in memory](../../../run_persistence/#runs-in-memory). (It continues to be persisted into the Epicenter database at regular intervals.)
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore'});
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to bring back to memory.
        * @param {string} params.stopBefore (Optional) The run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        replay: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'replay' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        },

        /**
        * Clone a given run and return a new run in the same state as the given run.
        *
        * The new run id is now available [in memory](../../../run_persistence/#runs-in-memory). The new run includes a copy of all of the data from the original run, EXCEPT:
        *
        * * The `saved` field in the new run record is not copied from the original run record. It defaults to `false`.
        * * The `initialized` field in the new run record is not copied from the original run record. It defaults to `false` but may change to `true` as the new run is advanced. For example, if there has been a call to the `step` function (for Vensim models), the `initialized` field is set to `true`.
        * * The `created` field in the new run record is the date and time at which the clone was created (not the time that the original run was created.)
        *
        * The original run remains only [in the database](../../../run_persistence/#runs-in-db).
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.clone({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore', exclude: ['interimCalculation'] });
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to clone from memory.
        * @param {string} params.stopBefore (Optional) The newly cloned run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the newly cloned run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        clone: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'clone' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/object-util":51,"./configuration-service":32}],41:[function(require,module,exports){
'use strict';

var epiVersion = require('../api-version.json');

//TODO: urlutils to get host, since no window on node
var defaults = {
    host: window.location.host,
    pathname: window.location.pathname
};

function getLocalHost(existingFn, host) {
    var localHostFn;
    if (existingFn !== undefined) {
        if (!$.isFunction(existingFn)) {
            localHostFn = function () { return existingFn; };
        } else {
            localHostFn = existingFn;
        }
    } else {
        localHostFn = function () {
            var isLocal = !host || //phantomjs
                host === '127.0.0.1' || 
                host.indexOf('local.') === 0 || 
                host.indexOf('ngrok') !== -1 || 
                host.indexOf('localhost') === 0;
            return isLocal;
        };
    }
    return localHostFn;
}

var UrlConfigService = function (config) {
    var envConf = UrlConfigService.defaults;

    if (!config) {
        config = {};
    }
    // console.log(this.defaults);
    var overrides = $.extend({}, envConf, config);
    var options = $.extend({}, defaults, overrides);

    overrides.isLocalhost = options.isLocalhost = getLocalHost(options.isLocalhost, options.host);
    
    // console.log(isLocalhost(), '___________');
    var actingHost = config && config.host;
    if (!actingHost && options.isLocalhost()) {
        actingHost = 'forio.com';
    } else {
        actingHost = options.host;
    }

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        //TODO: this should really be called 'apihost', but can't because that would break too many things
        host: (function () {
            var apiHost = (HOST_API_MAPPING[actingHost]) ? HOST_API_MAPPING[actingHost] : actingHost;
            // console.log(actingHost, config, apiHost);
            return apiHost;
        }()),

        isCustomDomain: (function () {
            var path = options.pathname.split('\/');
            var pathHasApp = path && path[1] === 'app';
            return (!options.isLocalhost() && !pathHasApp);
        }()),

        appPath: (function () {
            var path = options.pathname.split('\/');

            return path && path[1] || '';
        }()),

        accountPath: (function () {
            var accnt = '';
            var path = options.pathname.split('\/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }()),

        projectPath: (function () {
            var prj = '';
            var path = options.pathname.split('\/');
            if (path && path[1] === 'app') {
                prj = path[3]; //eslint-disable-line no-magic-numbers
            }
            return prj;
        }()),

        versionPath: (function () {
            var version = epiVersion.version ? epiVersion.version + '/' : '';
            return version;
        }()),

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data', 'file', 'presence'];
            var apiMapping = {
                channel: 'channel/subscribe'
            };
            var apiEndpoint = apiMapping[api] || api;
            
            if (apiEndpoint === 'config') {
                var actualProtocol = window.location.protocol.replace(':', '');
                var configProtocol = (options.isLocalhost()) ? this.protocol : actualProtocol;
                return configProtocol + '://' + actingHost + '/epicenter/' + this.versionPath + 'config';
            }
            var apiPath = this.protocol + '://' + this.host + '/' + this.versionPath + apiEndpoint + '/';

            if ($.inArray(apiEndpoint, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath + '/';
            }
            return apiPath;
        }
    };


    $.extend(publicExports, overrides);
    return publicExports;
};
// This data can be set by external scripts, for loading from an env server for eg;
UrlConfigService.defaults = {};

module.exports = UrlConfigService;

},{"../api-version.json":3}],42:[function(require,module,exports){
'use strict';
/**
* ## User API Adapter
*
* The User API Adapter allows you to retrieve details about end users in your team (account). It is based on the querying capabilities of the underlying RESTful [User API](../../../rest_apis/user_management/user/).
*
* To use the User API Adapter, instantiate it and then call its methods.
*
*       var ua = new F.service.User({
*           account: 'acme-simulations',
*           token: 'user-or-project-access-token'
*       });
*       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
*       ua.get({ userName: 'jsmith' });
*       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
*                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
*
* The constructor takes an optional `options` parameter in which you can specify the `account` and `token` if they are not already available in the current context.
*/

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var qutil = require('../util/query-util');

module.exports = function (config) {
    var defaults = {

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: undefined,

        /**
         * The access token to use when searching for end users. (See [more background on access tokens](../../../project_access/)).
         * @type {String}
         */
        token: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('user')
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
        * Retrieve details about particular end users in your team, based on user name or user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.get({ userName: 'jsmith' });
        *       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
        *
        * **Parameters**
        * @param {object} filter Object with field `userName` and value of the username. Alternatively, object with field `id` and value of an array of user ids.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        get: function (filter, options) {
            options = options || {};
            filter = filter || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options
            );

            var toQFilter = function (filter) {
                var res = {};

                // API only supports filtering by username for now
                if (filter.userName) {
                    res.q = filter.userName;
                }

                return res;
            };

            var toIdFilters = function (id) {
                if (!id) {
                    return '';
                }

                id = $.isArray(id) ? id : [id];
                return 'id=' + id.join('&id=');
            };

            var getFilters = [
                'account=' + getOptions.account,
                toIdFilters(filter.id),
                qutil.toQueryFormat(toQFilter(filter))
            ].join('&');

            // special case for queries with large number of ids
            // make it as a post with GET semantics
            var threshold = 30;
            if (filter.id && $.isArray(filter.id) && filter.id.length >= threshold) {
                getOptions.url = urlConfig.getAPIPath('user') + '?_method=GET';
                return http.post({ id: filter.id }, getOptions);
            } else {
                return http.get(getFilters, getOptions);
            }
        },

        /**
        * Retrieve details about a single end user in your team, based on user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
        *
        * **Parameters**
        * @param {string} userId The user id for the end user in your team.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        }
    };

    $.extend(this, publicAPI);
};



},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/query-util":53,"./configuration-service":32}],43:[function(require,module,exports){
/**
 *
 * ## Variables API Service
 *
 * Used in conjunction with the [Run API Service](../run-api-service/) to read, write, and search for specific model variables.
 *
 *     var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *      });
 *     rm.getRun()
 *       .then(function() {
 *          var vs = rm.run.variables();
 *          vs.save({sample_int: 4});
 *        });
 *
 */


 'use strict';

 var TransportFactory = require('../transport/http-transport-factory');
 var rutil = require('../util/run-util');

 module.exports = function (config) {
     var defaults = {
        /**
         * The runs object to which the variable filters apply. Defaults to null.
         * @type {runService}
         */
         runService: null
     };
     var serviceOptions = $.extend({}, defaults, config);

     var getURL = function () {
        //TODO: Replace with getCurrentconfig instead?
         return serviceOptions.runService.urlConfig.getFilterURL() + 'variables/';
     };

     var addAutoRestoreHeader = function (options) {
         return serviceOptions.runService.urlConfig.addAutoRestoreHeader(options);
     };

     var httpOptions = {
         url: getURL
     };
     if (serviceOptions.token) {
         httpOptions.headers = {
             Authorization: 'Bearer ' + serviceOptions.token
         };
     }
     var http = new TransportFactory(httpOptions);
     http.splitGet = rutil.splitGetFactory(httpOptions);

     var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int')
         *          .then(function(val){
         *              // val contains the value of sample_int
         *          });
         *
         * **Parameters**
         * @param {String} variable Name of variable to load.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         load: function (variable, outputModifier, options) {
             var httpOptions = $.extend(true, {}, serviceOptions, options);
             httpOptions = addAutoRestoreHeader(httpOptions);
             return http.get(outputModifier, $.extend({}, httpOptions, {
                 url: getURL() + variable + '/'
             }));
         },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales'])
         *          .then(function(val) {
         *              // val is an object with the values of the requested variables: val.price, val.sales
         *          });
         *
         *      vs.query({ include:['price', 'sales'] });
         *
         * **Parameters**
         * @param {Object|Array} query The names of the variables requested.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
             var httpOptions = $.extend(true, {}, serviceOptions, options);
             httpOptions = addAutoRestoreHeader(httpOptions);

             if ($.isArray(query)) {
                 query = { include: query };
             }
             $.extend(query, outputModifier);
             return http.splitGet(query, httpOptions);
         },

        /**
         * Save values to model variables. Overwrites existing values. Note that you can only update model variables if the run is [in memory](../../../run_persistence/#runs-in-memory). (An alternate way to update model variables is to call a method from the model and make sure that the method persists the variables. See `do`, `serial`, and `parallel` in the [Run API Service](../run-api-service/) for calling methods from the model.)
         *
         * **Example**
         *
         *      vs.save('price', 4);
         *      vs.save({ price: 4, quantity: 5, products: [2,3,4] });
         *
         * **Parameters**
         * @param {Object|String} variable An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} val (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         save: function (variable, val, options) {
             var attrs;
             if (typeof variable === 'object') {
                 attrs = variable;
                 options = val;
             } else {
                 (attrs = {})[variable] = val;
             }
             var httpOptions = $.extend(true, {}, serviceOptions, options);

             return http.patch.call(this, attrs, httpOptions);
         }

        // Not Available until underlying API supports PUT. Otherwise save would be PUT and merge would be PATCH
        // *
        //  * Save values to the api. Merges arrays, but otherwise same as save
        //  * @param {Object|String} variable Object with attributes, or string key
        //  * @param {Object} val Optional if prev parameter was a string, set value here
        //  * @param {Object} options Overrides for configuration options
        //  *
        //  * @example
        //  *     vs.merge({ price: 4, quantity: 5, products: [2,3,4] })
        //  *     vs.merge('price', 4);

        // merge: function (variable, val, options) {
        //     var attrs;
        //     if (typeof variable === 'object') {
        //       attrs = variable;
        //       options = val;
        //     } else {
        //       (attrs = {})[variable] = val;
        //     }
        //     var httpOptions = $.extend(true, {}, serviceOptions, options);

        //     return http.patch.call(this, attrs, httpOptions);
        // }
     };
     $.extend(this, publicAPI);
 };

},{"../transport/http-transport-factory":49,"../util/run-util":54}],44:[function(require,module,exports){
/**
 * ## World API Adapter
 *
 * A [run](../../../glossary/#run) is a collection of end user interactions with a project and its model -- including setting variables, making decisions, and calling operations. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases. Only [team projects](../../../glossary/#team) can be multiplayer.
 *
 * The World API Adapter allows you to create, access, and manipulate multiplayer worlds within your Epicenter project. You can use this to add and remove end users from the world, and to create, access, and remove their runs. Because of this, typically the World Adapter is used for facilitator pages in your project. (The related [World Manager](../world-manager/) provides an easy way to access runs and worlds for particular end users, so is typically used in pages that end users will interact with.)
 *
 * As with all the other [API Adapters](../../), all methods take in an "options" object as the last parameter. The options can be used to extend/override the World API Service defaults.
 *
 * To use the World Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface), project id (**Project ID**), and group (**Group Name**).
 *
 *       var wa = new F.service.World({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1' });
 *       wa.create()
 *          .then(function(world) {
 *              // call methods, e.g. wa.addUsers()
 *          });
 */

'use strict';

var ConfigService = require('./configuration-service');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var _pick = require('../util/object-util')._pick;

var apiBase = 'multiplayer/';
var assignmentEndpoint = apiBase + 'assign';
var apiEndpoint = apiBase + 'world';
var projectEndpoint = apiBase + 'project';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The group name. Defaults to undefined.
         * @type {String}
         */
        group: undefined,

        /**
         * The model file to use to create runs in this world. Defaults to undefined.
         * @type {String}
         */
        model: undefined,

        /**
         * Criteria by which to filter world. Currently only supports world-ids as filters.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter
         * @type {String}
         */
        id: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {},

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         * @type {function}
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         * @type {function}
         */
        error: $.noop
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    var urlConfig = new ConfigService(serviceOptions).get('server');

    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    if (!serviceOptions.project) {
        serviceOptions.project = urlConfig.projectPath;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var setIdFilterOrThrowError = function (options) {
        if (options.id) {
            serviceOptions.filter = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No world id specified to apply operations against. This could happen if the user is not assigned to a world and is trying to work with runs from that world.');
        }
    };

    var validateModelOrThrowError = function (options) {
        if (!options.model) {
            throw new Error('No model specified to get the current run');
        }
    };

    var publicAPI = {

        /**
        * Creates a new World.
        *
        * Using this method is rare. It is more common to create worlds automatically while you `autoAssign()` end users to worlds. (In this case, configuration data for the world, such as the roles, are read from the project-level world configuration information, for example by `getProjectSettings()`.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create({
        *           roles: ['VP Marketing', 'VP Sales', 'VP Engineering']
        *       });
        *
        *  **Parameters**
        * @param {object} params Parameters to create the world.
        * @param {string} params.group (Optional) The **Group Name** to create this world under. Only end users in this group are eligible to join the world. Optional here; required when instantiating the service (`new F.service.World()`).
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var worldApiParams = ['scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group', 'name'];
            var validParams = _pick(serviceOptions, ['account', 'project', 'group']);
            // whitelist the fields that we actually can send to the api
            params = _pick(params, worldApiParams);

            // account and project go in the body, not in the url
            params = $.extend({}, validParams, params);

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Updates a World, for example to replace the roles in the world.
        *
        * Typically, you complete world configuration at the project level, rather than at the world level. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both. However, this method is available if you need to update the configuration of a particular world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.update({ roles: ['VP Marketing', 'VP Sales', 'VP Engineering'] });
        *           });
        *
        *  **Parameters**
        * @param {object} params Parameters to update the world.
        * @param {string} params.name A string identifier for the linked end users, for example, "name": "Our Team".
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        update: function (params, options) {
            var whitelist = ['roles', 'optionalRoles', 'minUsers'];
            options = options || {};
            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            params = _pick(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        /**
        * Deletes an existing world.
        *
        * This function optionally takes one argument. If the argument is a string, it is the id of the world to delete. If the argument is an object, it is the override for global options.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.delete();
        *           });
        *
        *  **Parameters**
        * @param {String|Object} options (Optional) The id of the world to delete, or options object to override global options.
        * @return {Promise}
        */
        delete: function (options) {
            options = (options && (typeof options === 'string')) ? { filter: options } : {};
            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * Updates the configuration for the current instance of the World API Adapter (including all subsequent function calls, until the configuration is updated again).
        *
        * **Example**
        *
        *      var wa = new F.service.World({...}).updateConfig({ filter: '123' }).addUser({ userId: '123' });
        *
        * **Parameters**
        * @param {object} config The configuration object to use in updating existing configuration.
        * @return {Object} reference to current instance
        */
        updateConfig: function (config) {
            $.extend(serviceOptions, config);

            return this;
        },

        /**
        * Lists all worlds for a given account, project, and group. All three are required, and if not specified as parameters, are read from the service.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // lists all worlds in group "team1"
        *               wa.list();
        *
        *               // lists all worlds in group "other-group-name"
        *               wa.list({ group: 'other-group-name' });
        *           });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        list: function (options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = _pick(getOptions, ['account', 'project', 'group']);

            return http.get(filters, getOptions);
        },

        /**
        * Gets all worlds that an end user belongs to for a given account (team), project, and group.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getWorldsForUser('b1c19dda-2d2e-4777-ad5d-3929f17e86d3')
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose worlds are being retrieved.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getWorldsForUser: function (userId, options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = $.extend(
                _pick(getOptions, ['account', 'project', 'group']),
                { userId: userId }
            );

            return http.get(filters, getOptions);
        },

        /**
         * Load information for a specific world. All further calls to the world service will use the id provided.
         *
         * **Parameters**
         * @param {String} worldId The id of the world to load.
         * @param {Object} options (Optional) Options object to override global options.
         * @return {Promise}
         */
        load: function (worldId, options) {
            if (worldId) {
                serviceOptions.filter = worldId;
            }
            if (!serviceOptions.filter) {
                throw new Error('Please provide a worldid to load');
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/' });
            return http.get('', httpOptions);
        },

        /**
        * Adds an end user or list of end users to a given world. The end user must be a member of the `group` that is associated with this world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // add one user
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *               wa.addUsers(['b1c19dda-2d2e-4777-ad5d-3929f17e86d3']);
        *               wa.addUsers({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'VP Sales' });
        *
        *               // add several users
        *               wa.addUsers([
        *                   { userId: 'a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44',
        *                     role: 'VP Marketing' },
        *                   { userId: '8f2604cf-96cd-449f-82fa-e331530734ee',
        *                     role: 'VP Engineering' }
        *               ]);
        *
        *               // add one user to a specific world
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', world.id);
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', { filter: world.id });
        *           });
        *
        * ** Parameters **
        * @param {string|object|array} users User id, array of user ids, object, or array of objects of the users to add to this world.
        * @param {string} users.role The `role` the user should have in the world. It is up to the caller to ensure, if needed, that the `role` passed in is one of the `roles` or `optionalRoles` of this world.
        * @param {string} worldId The world to which the users should be added. If not specified, the filter parameter of the `options` object is used.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        addUsers: function (users, worldId, options) {

            if (!users) {
                throw new Error('Please provide a list of users to add to the world');
            }

            // normalize the list of users to an array of user objects
            users = $.map([].concat(users), function (u) {
                var isObject = $.isPlainObject(u);

                if (typeof u !== 'string' && !isObject) {
                    throw new Error('Some of the users in the list are not in the valid format: ' + u);
                }

                return isObject ? u : { userId: u };
            });

            // check if options were passed as the second parameter
            if ($.isPlainObject(worldId) && !options) {
                options = worldId;
                worldId = null;
            }

            options = options || {};

            // we must have options by now
            if (typeof worldId === 'string') {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' }
            );

            return http.post(users, updateOptions);
        },

        /**
        * Updates the role of an end user in a given world. (You can only update one end user at a time.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.create().then(function(world) {
        *           wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *           wa.updateUser({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'leader' });
        *      });
        *
        * **Parameters**
        * @param {object} user User object with `userId` and the new `role`.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        updateUser: function (user, options) {
            options = options || {};

            if (!user || !user.userId) {
                throw new Error('You need to pass a userId to update from the world');
            }

            setIdFilterOrThrowError(options);

            var patchOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId }
            );

            return http.patch(_pick(user, 'role'), patchOptions);
        },

        /**
        * Removes an end user from a given world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.addUsers(['a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44', '8f2604cf-96cd-449f-82fa-e331530734ee']);
        *               wa.removeUser('a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44');
        *               wa.removeUser({ userId: '8f2604cf-96cd-449f-82fa-e331530734ee' });
        *           });
        *
        * ** Parameters **
        * @param {object|string} user The `userId` of the user to remove from the world, or an object containing the `userId` field.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        removeUser: function (user, options) {
            options = options || {};

            if (typeof user === 'string') {
                user = { userId: user };
            }

            if (!user.userId) {
                throw new Error('You need to pass a userId to remove from the world');
            }

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId }
            );

            return http.delete(null, getOptions);
        },

        /**
        * Gets the run id of current run for the given world. If the world does not have a run, creates a new one and returns the run id.
        *
        * Remember that a [run](../../glossary/#run) is a collection of interactions with a project and its model. In the case of multiplayer projects, the run is shared by all end users in the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getCurrentRunId({ model: 'model.py' });
        *           });
        *
        * ** Parameters **
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        getCurrentRunId: function (options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            validateModelOrThrowError(getOptions);
            return http.post(_pick(getOptions, 'model'), getOptions);
        },

        /**
        * Gets the current (most recent) world for the given end user in the given group. Brings this most recent world into memory if needed.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function(world) {
        *               // use data from world
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose current (most recent) world is being retrieved.
        * @param {string} groupName (Optional) The name of the group. If not provided, defaults to the group used to create the service.
        * @return {Promise}
        */
        getCurrentWorldForUser: function (userId, groupName) {
            var dtd = $.Deferred();
            var me = this;
            this.getWorldsForUser(userId, { group: groupName })
                .then(function (worlds) {
                    // assume the most recent world as the 'active' world
                    worlds.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
                    var currentWorld = worlds[0];

                    if (currentWorld) {
                        serviceOptions.filter = currentWorld.id;
                    }

                    dtd.resolveWith(me, [currentWorld]);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Deletes the current run from the world.
        *
        * (Note that the world id remains part of the run record, indicating that the run was formerly an active run for the world.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.deleteRun('sample-world-id');
        *
        *  **Parameters**
        * @param {string} worldId The `worldId` of the world from which the current run is being deleted.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        deleteRun: function (worldId, options) {
            options = options || {};

            if (worldId) {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * Creates a new run for the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function (world) {
        *                   wa.newRunForWorld(world.id);
        *           });
        *
        *  **Parameters**
        * @param {string} worldId worldId in which we create the new run.
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        newRunForWorld: function (worldId, options) {
            var currentRunOptions = $.extend(true, {},
                serviceOptions,
                options,
                { filter: worldId || serviceOptions.filter }
            );
            var me = this;

            validateModelOrThrowError(currentRunOptions);

            return this.deleteRun(worldId, options)
                .then(function () {
                    return me.getCurrentRunId(currentRunOptions);
                });
        },

        /**
        * Assigns end users to worlds, creating new worlds as appropriate, automatically. Assigns all end users in the group, and creates new worlds as needed based on the project-level world configuration (roles, optional roles, and minimum end users per world).
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.autoAssign();
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @param {number} options.maxUsers Sets the maximum number of users in a world.
        * @param {string[]} options.userIds A list of users to be assigned be assigned instead of all end users in the group.
        * @return {Promise}
        *
        */
        autoAssign: function (options) {
            options = options || {};

            var opt = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(assignmentEndpoint) }
            );

            var params = {
                account: opt.account,
                project: opt.project,
                group: opt.group
            };

            if (opt.maxUsers) {
                params.maxUsers = opt.maxUsers;
            }

            if (opt.userIds) {
                params.userIds = opt.userIds;
            }

            return http.post(params, opt);
        },

        /**
        * Gets the project's world configuration.
        *
        * Typically, every interaction with your project uses the same configuration of each world. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both.
        *
        * (The [Multiplayer Project REST API](../../../rest_apis/multiplayer/multiplayer_project/) allows you to set these project-level world configurations. The World Adapter simply retrieves them, for example so they can be used in auto-assignment of end users to worlds.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getProjectSettings()
        *           .then(function(settings) {
        *               console.log(settings.roles);
        *               console.log(settings.optionalRoles);
        *           });
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getProjectSettings: function (options) {
            options = options || {};

            var opt = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(projectEndpoint) }
            );

            opt.url += [opt.account, opt.project].join('/');
            return http.get(null, opt);
        }

    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":46,"../transport/http-transport-factory":49,"../util/object-util":51,"./configuration-service":32}],45:[function(require,module,exports){
/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({ root: 'people' });
        people
            .save({lastName: 'smith' })

 */


'use strict';

// Thin document.cookie wrapper to allow unit testing
var Cookie = function () {
    this.get = function () {
        return document.cookie;
    };

    this.set = function (newCookie) {
        document.cookie = newCookie;
    };
};

module.exports = function (config) {
    var host = window.location.hostname;
    var validHost = host.split('.').length > 1;
    var domain = validHost ? '.' + host : null;

    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: domain,
        cookie: new Cookie()
    };
    this.serviceOptions = $.extend({}, defaults, config);

    var publicAPI = {
        // * TBD
        //  * Query collection; uses MongoDB syntax
        //  * @see  <TBD: Data API URL>
        //  *
        //  * @param { string} qs Query Filter
        //  * @param { string} limiters @see <TBD: url for limits, paging etc>
        //  *
        //  * @example
        //  *     cs.query(
        //  *      { name: 'John', className: 'CSC101' },
        //  *      {limit: 10}
        //  *     )

        // query: function (qs, limiters) {

        // },

        /**
         * Save cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         * @param {Object} options Overrides for service options
         *
         * @return {*} The saved value
         *
         * @example
         *     cs.set('person', { firstName: 'john', lastName: 'smith' });
         *     cs.set({ name:'smith', age:'32' });
         */
        set: function (key, value, options) {
            var setOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;
            var cookie = setOptions.cookie;

            cookie.set(encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '')
            );

            return value;
        },

        /**
         * Load cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @return {*} The value stored
         *
         * @example
         *     cs.get('person');
         */
        get: function (key) {
            var cookie = this.serviceOptions.cookie;
            var cookieReg = new RegExp('(?:^|;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$');
            var res = cookieReg.exec(cookie.get());
            var val = res ? decodeURIComponent(res[1]) : null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @param {object} options (optional) overrides for service options
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;
            var cookie = remOptions.cookie;

            cookie.set(encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            (domain ? '; domain=' + domain : '') +
                            (path ? '; path=' + path : '')
            );
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var cookie = this.serviceOptions.cookie;
            var aKeys = cookie.get().replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(cookieKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};

},{}],46:[function(require,module,exports){
'use strict';

var keyNames = require('../managers/key-names');
var StorageFactory = require('./store-factory');
var optionUtils = require('../util/option-utils');

var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var EPI_MANAGER_KEY = 'epicenter.token'; //can't be under key-names, or logout will clear this too

var defaults = {
    /**
     * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
     * @type {string}
     */
    store: { synchronous: true }
};

var SessionManager = function (managerOptions) {
    managerOptions = managerOptions || {};
    function getBaseOptions(overrides) {
        overrides = overrides || {};
        var libOptions = optionUtils.getOptions();
        var finalOptions = $.extend(true, {}, defaults, libOptions, managerOptions, overrides);
        return finalOptions;
    }

    function getStore(overrides) {
        var baseOptions = getBaseOptions(overrides);
        var storeOpts = baseOptions.store || {};
        var isEpicenterDomain = !baseOptions.isLocal && !baseOptions.isCustomDomain;
        if (storeOpts.root === undefined && baseOptions.account && baseOptions.project && isEpicenterDomain) {
            storeOpts.root = '/app/' + baseOptions.account + '/' + baseOptions.project;
        }
        return new StorageFactory(storeOpts);
    }

    var publicAPI = {
        saveSession: function (userInfo, options) {
            var serialized = JSON.stringify(userInfo);
            getStore(options).set(EPI_SESSION_KEY, serialized);
        },
        getSession: function (options) {
            var store = getStore(options);
            var finalOpts = store.serviceOptions;
            var serialized = store.get(EPI_SESSION_KEY) || '{}';
            var session = JSON.parse(serialized);
            // If the url contains the project and account
            // validate the account and project in the session
            // and override project, groupName, groupId and isFac
            // Otherwise (i.e. localhost) use the saved session values
            var account = finalOpts.account;
            var project = finalOpts.project;
            if (account && session.account !== account) {
                // This means that the token was not used to login to the same account
                return {};
            }
            if (session.groups && account && project) {
                var group = session.groups[project] || { groupId: '', groupName: '', isFac: false };
                $.extend(session, { project: project }, group);
            }
            return session;
        },
        removeSession: function (options) {
            var store = getStore(options);
            Object.keys(keyNames).forEach(function (cookieKey) {
                var cookieName = keyNames[cookieKey];
                store.remove(cookieName);
            });
            return true;
        },
        getStore: function (options) {
            return getStore(options);
        },

        getMergedOptions: function () {
            var args = Array.prototype.slice.call(arguments);
            var overrides = $.extend.apply($, [true, {}].concat(args));
            var baseOptions = getBaseOptions(overrides);
            var session = this.getSession(overrides);

            var token = session.auth_token;
            if (!token) {
                var factory = new StorageFactory();
                token = factory.get(EPI_MANAGER_KEY);
            }

            var sessionDefaults = {
                /**
                 * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
                 * @see [Authentication API Service](../auth-api-service/) for getting tokens.
                 * @type {String}
                 */
                token: token,

                /**
                 * The account. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                account: session.account,

                /**
                 * The project. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                project: session.project,


                /**
                 * The group name. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                group: session.groupName,
                /**
                 * Alias for group. 
                 * @type {String}
                 */
                groupName: session.groupName, //It's a little weird that it's called groupName in the cookie, but 'group' in all the service options, so normalize for both
                /**
                 * The group id. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                groupId: session.groupId,
                userId: session.userId,
                userName: session.userName,
            };
            return $.extend(true, sessionDefaults, baseOptions);
        }
    };
    $.extend(this, publicAPI);
};

module.exports = SessionManager;
},{"../managers/key-names":9,"../util/option-utils":52,"./store-factory":47}],47:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');
var store = require('./cookie-store');

module.exports = store;

},{"./cookie-store":45}],48:[function(require,module,exports){
'use strict';

var qutils = require('../util/query-util');

module.exports = function (config) {

    var defaults = {
        url: '',

        contentType: 'application/json',
        headers: {},
        statusCode: {
            404: $.noop
        },

        /**
         * ONLY for strings in the url. All GET & DELETE params are run through this
         * @type {[type] }
         */
        parameterParser: qutils.toQueryFormat,

        // To allow epicenter.token and other session cookies to be passed
        // with the requests
        xhrFields: {
            withCredentials: true
        }
    };

    var transportOptions = $.extend({}, defaults, config);

    var result = function (d) {
        return ($.isFunction(d)) ? d() : d;
    };

    var connect = function (method, params, connectOptions) {
        params = result(params);
        params = ($.isPlainObject(params) || $.isArray(params)) ? JSON.stringify(params) : params;

        var options = $.extend(true, {}, transportOptions, connectOptions, {
            type: method,
            data: params
        });
        var ALLOWED_TO_BE_FUNCTIONS = ['data', 'url'];
        $.each(options, function (key, value) {
            if ($.isFunction(value) && $.inArray(key, ALLOWED_TO_BE_FUNCTIONS) !== -1) {
                options[key] = value();
            }
        });

        if (options.logLevel && options.logLevel === 'DEBUG') {
            console.log(options.url);
            var oldSuccessFn = options.success || $.noop;
            options.success = function (response, ajaxStatus, ajaxReq) {
                console.log(response);
                oldSuccessFn.apply(this, arguments);
            };
        }

        var beforeSend = options.beforeSend;
        options.beforeSend = function (xhr, settings) {
            xhr.requestUrl = (connectOptions || {}).url;
            if (beforeSend) {
                beforeSend.apply(this, arguments);
            }
        };

        return $.ajax(options);
    };

    var publicAPI = {
        get: function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            return connect.call(this, 'GET', params, options);
        },
        splitGet: function () {

        },
        post: function () {
            return connect.apply(this, ['post'].concat([].slice.call(arguments)));
        },
        patch: function () {
            return connect.apply(this, ['patch'].concat([].slice.call(arguments)));
        },
        put: function () {
            return connect.apply(this, ['put'].concat([].slice.call(arguments)));
        },
        delete: function (params, ajaxOptions) {
            //DELETE doesn't support body params, but jQuery thinks it does.
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            if ($.trim(params)) {
                var delimiter = (result(options.url).indexOf('?') === -1) ? '?' : '&';
                options.url = result(options.url) + delimiter + params;
            }
            return connect.call(this, 'DELETE', null, options);
        },
        head: function () {
            return connect.apply(this, ['head'].concat([].slice.call(arguments)));
        },
        options: function () {
            return connect.apply(this, ['options'].concat([].slice.call(arguments)));
        }
    };

    return $.extend(this, publicAPI);
};

},{"../util/query-util":53}],49:[function(require,module,exports){
'use strict';

// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
var transport = require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":48}],50:[function(require,module,exports){
/**
/* Inherit from a class (using prototype borrowing)
*/
'use strict';

function inherit(C, P) {
    var F = function () {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.__super = P.prototype;
    C.prototype.constructor = C;
}

/**
* Shallow copy of an object
* @param {Object} dest object to extend
* @return {Object} extended object
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j < obj.length; j++) {
        if (!(current = obj[j])) { //eslint-disable-line
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        for (var key in current) { //eslint-disable-line
            dest[key] = current[key];
        }
    }

    return dest;
};

module.exports = function (base, props, staticProps) {
    var parent = base;
    var child;

    child = props && props.hasOwnProperty('constructor') ? props.constructor : function () { return parent.apply(this, arguments); };

    // add static properties to the child constructor function
    extend(child, parent, staticProps);

    // associate prototype chain
    inherit(child, parent);

    // add instance properties
    if (props) {
        extend(child.prototype, props);
    }

    // done
    return child;
};

},{}],51:[function(require,module,exports){
'use strict';

module.exports = {
    _pick: function (obj, props) {
        var res = {};
        for (var p in obj) {
            if (props.indexOf(p) !== -1) {
                res[p] = obj[p];
            }
        }

        return res;
    },
    isEmpty: function isEmpty(value) {
        return (!value || ($.isPlainObject(value) && Object.keys(value).length === 0));
    }
};

},{}],52:[function(require,module,exports){
'use strict';

var ConfigService = require('../service/configuration-service');

var urlConfig = new ConfigService().get('server');
var customDefaults = {};
var libDefaults = {
    /**
     * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
     * @type {String}
     */
    account: urlConfig.accountPath || undefined,
    /**
     * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
     * @type {String}
     */
    project: urlConfig.projectPath || undefined,
    isLocal: urlConfig.isLocalhost(),
    isCustomDomain: urlConfig.isCustomDomain,
    store: {}
};

var optionUtils = {
    /**
     * Gets the final options by overriding the global options set with
     * optionUtils#setDefaults() and the lib defaults.
     * @param {object} options The final options object.
     * @return {object} Extended object
     */
    getOptions: function (options) {
        return $.extend(true, {}, libDefaults, customDefaults, options);
    },
    /**
     * Sets the global defaults for the optionUtils#getOptions() method.
     * @param {object} defaults The defaults object.
     */
    setDefaults: function (defaults) {
        customDefaults = defaults;
    }
};
module.exports = optionUtils;

},{"../service/configuration-service":32}],53:[function(require,module,exports){
/**
 * Utilities for working with query strings
*/
'use strict';

module.exports = (function () {

    return {
        /**
         * Converts to matrix format
         * @param  {Object} qs Object to convert to query string
         * @return { string}    Matrix-format query parameters
         */
        toMatrixFormat: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return ';';
            }
            if (typeof qs === 'string' || qs instanceof String) {
                return qs;
            }

            var returnArray = [];
            var OPERATORS = ['<', '>', '!'];
            $.each(qs, function (key, value) {
                if (typeof value !== 'string' || $.inArray($.trim(value).charAt(0), OPERATORS) === -1) {
                    value = '=' + value;
                }
                returnArray.push(key + value);
            });

            var mtrx = ';' + returnArray.join(';');
            return mtrx;
        },

        /**
         * Converts strings/arrays/objects to type 'a=b&b=c'
         * @param  { string|Array|Object} qs
         * @return { string}
         */
        toQueryFormat: function (qs) {
            if (qs === null || qs === undefined) {
                return '';
            }
            if (typeof qs === 'string' || qs instanceof String) {
                return qs;
            }

            var returnArray = [];
            $.each(qs, function (key, value) {
                if ($.isArray(value)) {
                    value = value.join(',');
                }
                if ($.isPlainObject(value)) {
                    //Mostly for data api
                    value = JSON.stringify(value);
                }
                returnArray.push(key + '=' + value);
            });

            var result = returnArray.join('&');
            return result;
        },

        /**
         * Converts strings of type 'a=b&b=c' to { a:b, b:c}
         * @param  { string} qs
         * @return {object}
         */
        qsToObject: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return {};
            }

            var qsArray = qs.split('&');
            var returnObj = {};
            $.each(qsArray, function (index, value) {
                var qKey = value.split('=')[0];
                var qVal = value.split('=')[1];

                if (qVal.indexOf(',') !== -1) {
                    qVal = qVal.split(',');
                }

                returnObj[qKey] = qVal;
            });

            return returnObj;
        },

        /**
         * Normalizes and merges strings of type 'a=b', { b:c} to { a:b, b:c}
         * @param  { string|Array|Object} qs1
         * @param  { string|Array|Object} qs2
         * @return {Object}
         */
        mergeQS: function (qs1, qs2) {
            var obj1 = this.qsToObject(this.toQueryFormat(qs1));
            var obj2 = this.qsToObject(this.toQueryFormat(qs2));
            return $.extend(true, {}, obj1, obj2);
        },

        addTrailingSlash: function (url) {
            if (!url) {
                return '';
            }
            return (url.charAt(url.length - 1) === '/') ? url : (url + '/');
        }
    };
}());



},{}],54:[function(require,module,exports){
/**
 * Utilities for working with the run service
*/
'use strict';
var qutil = require('./query-util');
var MAX_URL_LENGTH = 2048;

module.exports = (function () {
    return {
        /**
         * normalizes different types of operation inputs
         * @param  {Object|Array|String} operations operations to perform
         * @param  {Array} args arguments for operation
         * @return {String} operations of the form `{ ops: [], args: [] }`
         */
        normalizeOperations: function (operations, args) {
            if (!args) {
                args = [];
            }
            var returnList = {
                ops: [],
                args: []
            };

            var _concat = function (arr) {
                return (arr !== null && arr !== undefined) ? [].concat(arr) : [];
            };

            //{ add: [1,2], subtract: [2,4] }
            var _normalizePlainObjects = function (operations, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                $.each(operations, function (opn, arg) {
                    returnList.ops.push(opn);
                    returnList.args.push(_concat(arg));
                });
                return returnList;
            };
            //{ name: 'add', params: [1] }
            var _normalizeStructuredObjects = function (operation, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                returnList.ops.push(operation.name);
                returnList.args.push(_concat(operation.params));
                return returnList;
            };

            var _normalizeObject = function (operation, returnList) {
                return ((operation.name) ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
            };

            var _normalizeLiterals = function (operation, args, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                returnList.ops.push(operation);
                returnList.args.push(_concat(args));
                return returnList;
            };


            var _normalizeArrays = function (operations, arg, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                $.each(operations, function (index, opn) {
                    if ($.isPlainObject(opn)) {
                        _normalizeObject(opn, returnList);
                    } else {
                        _normalizeLiterals(opn, args[index], returnList);
                    }
                });
                return returnList;
            };

            if ($.isPlainObject(operations)) {
                _normalizeObject(operations, returnList);
            } else if ($.isArray(operations)) {
                _normalizeArrays(operations, args, returnList);
            } else {
                _normalizeLiterals(operations, args, returnList);
            }

            return returnList;
        },

        splitGetFactory: function (httpOptions) {
            return function (params, options) {
                var http = this; //eslint-disable-line
                var getValue = function (name) {
                    var value = options[name] || httpOptions[name];
                    if (typeof value === 'function') {
                        value = value();
                    }
                    return value;
                };
                var getFinalUrl = function (params) {
                    var url = getValue('url', options);
                    var data = params;
                    // There is easy (or known) way to get the final URL jquery is going to send so
                    // we're replicating it. The process might change at some point but it probably will not.
                    // 1. Remove hash
                    url = url.replace(/#.*$/, '');
                    // 1. Append query string
                    var queryParams = qutil.toQueryFormat(data);
                    var questionIdx = url.indexOf('?');
                    if (queryParams && questionIdx > -1) {
                        return url + '&' + queryParams;
                    } else if (queryParams) {
                        return url + '?' + queryParams;
                    }
                    return url;
                };
                var url = getFinalUrl(params);
                // We must split the GET in multiple short URL's
                // The only property allowed to be split is "include"
                if (params && params.include && encodeURI(url).length > MAX_URL_LENGTH) {
                    var dtd = $.Deferred();
                    var paramsCopy = $.extend(true, {}, params);
                    delete paramsCopy.include;
                    var urlNoIncludes = getFinalUrl(paramsCopy);
                    var diff = MAX_URL_LENGTH - urlNoIncludes.length;
                    var oldSuccess = options.success || httpOptions.success || $.noop;
                    var oldError = options.error || httpOptions.error || $.noop;
                    // remove the original success and error callbacks
                    options.success = $.noop;
                    options.error = $.noop;

                    var include = params.include;
                    var currIncludes = [];
                    var includeOpts = [currIncludes];
                    var currLength = encodeURIComponent('?include=').length;
                    var variable = include.pop();
                    while (variable) {
                        var varLenght = encodeURIComponent(variable).length;
                        // Use a greedy approach for now, can be optimized to be solved in a more
                        // efficient way
                        // + 1 is the comma
                        if (currLength + varLenght + 1 < diff) {
                            currIncludes.push(variable);
                            currLength += varLenght + 1;
                        } else {
                            currIncludes = [variable];
                            includeOpts.push(currIncludes);
                            currLength = '?include='.length + varLenght;
                        }
                        variable = include.pop();
                    }
                    var reqs = $.map(includeOpts, function (include) {
                        var reqParams = $.extend({}, params, { include: include });
                        return http.get(reqParams, options);
                    });
                    $.when.apply($, reqs).then(function () {
                        // Each argument are arrays of the arguments of each done request
                        // So the first argument of the first array of arguments is the data
                        var isValid = arguments[0] && arguments[0][0];
                        if (!isValid) {
                            // Should never happen...
                            oldError();
                            return dtd.reject();
                        }
                        var firstResponse = arguments[0][0];
                        var isObject = $.isPlainObject(firstResponse);
                        var isRunAPI = (isObject && $.isPlainObject(firstResponse.variables)) || !isObject;
                        if (isRunAPI) {
                            if (isObject) {
                                // aggregate the variables property only
                                var aggregateRun = arguments[0][0];
                                $.each(arguments, function (idx, args) {
                                    var run = args[0];
                                    $.extend(true, aggregateRun.variables, run.variables);
                                });
                                oldSuccess(aggregateRun, arguments[0][1], arguments[0][2]);
                                dtd.resolve(aggregateRun, arguments[0][1], arguments[0][2]);
                            } else {
                                // array of runs
                                // Agregate variables in each run
                                var aggregatedRuns = {};
                                $.each(arguments, function (idx, args) {
                                    var runs = args[0];
                                    if (!$.isArray(runs)) {
                                        return;
                                    }
                                    $.each(runs, function (idxRun, run) {
                                        if (run.id && !aggregatedRuns[run.id]) {
                                            run.variables = run.variables || {};
                                            aggregatedRuns[run.id] = run;
                                        } else if (run.id) {
                                            $.extend(true, aggregatedRuns[run.id].variables, run.variables);
                                        }
                                    });
                                });
                                // turn it into an array
                                aggregatedRuns = $.map(aggregatedRuns, function (run) { return run; });
                                oldSuccess(aggregatedRuns, arguments[0][1], arguments[0][2]);
                                dtd.resolve(aggregatedRuns, arguments[0][1], arguments[0][2]);
                            }
                        } else {
                            // is variables API
                            // aggregate the response
                            var aggregatedVariables = {};
                            $.each(arguments, function (idx, args) {
                                var vars = args[0];
                                $.extend(true, aggregatedVariables, vars);
                            });
                            oldSuccess(aggregatedVariables, arguments[0][1], arguments[0][2]);
                            dtd.resolve(aggregatedVariables, arguments[0][1], arguments[0][2]);
                        }
                    }, function () {
                        oldError.apply(http, arguments);
                        dtd.reject.apply(dtd, arguments);
                    });
                    return dtd.promise();
                } else {
                    return http.get(params, options);
                }
            };
        }
    };
}());

},{"./query-util":53}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQmFzZTY0L2Jhc2U2NC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwic3JjL2FwaS12ZXJzaW9uLmpzb24iLCJzcmMvYXBwLmpzIiwic3JjL2Vudi1sb2FkLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvZGVwcmVjYXRlZC9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvZGVwcmVjYXRlZC9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2luZGV4LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL211bHRpcGxheWVyLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25vbmUtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtYWNyb3NzLXNlc3Npb25zLmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtbmV2ZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtcGVyLXNlc3Npb24uanMiLCJzcmMvbWFuYWdlcnMvc2F2ZWQtcnVucy1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tc3RyYXRlZ2llcy9iYXNlbGluZS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9zY2VuYXJpby1zdHJhdGVnaWVzL3JldXNlLWxhc3QtdW5zYXZlZC5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvc3RyYXRlZ3ktdXRpbHMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9ncm91cC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9wcmVzZW5jZS1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3J1bi1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3NlcnZpY2UtdXRpbHMuanMiLCJzcmMvc2VydmljZS9zdGF0ZS1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3VzZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS93b3JsZC1hcGktYWRhcHRlci5qcyIsInNyYy9zdG9yZS9jb29raWUtc3RvcmUuanMiLCJzcmMvc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyLmpzIiwic3JjL3N0b3JlL3N0b3JlLWZhY3RvcnkuanMiLCJzcmMvdHJhbnNwb3J0L2FqYXgtaHR0cC10cmFuc3BvcnQuanMiLCJzcmMvdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnkuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIiwic3JjL3V0aWwvb2JqZWN0LXV0aWwuanMiLCJzcmMvdXRpbC9vcHRpb24tdXRpbHMuanMiLCJzcmMvdXRpbC9xdWVyeS11dGlsLmpzIiwic3JjL3V0aWwvcnVuLXV0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7KGZ1bmN0aW9uICgpIHtcblxuICB2YXIgb2JqZWN0ID0gdHlwZW9mIGV4cG9ydHMgIT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogc2VsZjsgLy8gIzg6IHdlYiB3b3JrZXJzXG4gIHZhciBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPSc7XG5cbiAgZnVuY3Rpb24gSW52YWxpZENoYXJhY3RlckVycm9yKG1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICB9XG4gIEludmFsaWRDaGFyYWN0ZXJFcnJvci5wcm90b3R5cGUgPSBuZXcgRXJyb3I7XG4gIEludmFsaWRDaGFyYWN0ZXJFcnJvci5wcm90b3R5cGUubmFtZSA9ICdJbnZhbGlkQ2hhcmFjdGVyRXJyb3InO1xuXG4gIC8vIGVuY29kZXJcbiAgLy8gW2h0dHBzOi8vZ2lzdC5naXRodWIuY29tLzk5OTE2Nl0gYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9uaWduYWddXG4gIG9iamVjdC5idG9hIHx8IChcbiAgb2JqZWN0LmJ0b2EgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgc3RyID0gU3RyaW5nKGlucHV0KTtcbiAgICBmb3IgKFxuICAgICAgLy8gaW5pdGlhbGl6ZSByZXN1bHQgYW5kIGNvdW50ZXJcbiAgICAgIHZhciBibG9jaywgY2hhckNvZGUsIGlkeCA9IDAsIG1hcCA9IGNoYXJzLCBvdXRwdXQgPSAnJztcbiAgICAgIC8vIGlmIHRoZSBuZXh0IHN0ciBpbmRleCBkb2VzIG5vdCBleGlzdDpcbiAgICAgIC8vICAgY2hhbmdlIHRoZSBtYXBwaW5nIHRhYmxlIHRvIFwiPVwiXG4gICAgICAvLyAgIGNoZWNrIGlmIGQgaGFzIG5vIGZyYWN0aW9uYWwgZGlnaXRzXG4gICAgICBzdHIuY2hhckF0KGlkeCB8IDApIHx8IChtYXAgPSAnPScsIGlkeCAlIDEpO1xuICAgICAgLy8gXCI4IC0gaWR4ICUgMSAqIDhcIiBnZW5lcmF0ZXMgdGhlIHNlcXVlbmNlIDIsIDQsIDYsIDhcbiAgICAgIG91dHB1dCArPSBtYXAuY2hhckF0KDYzICYgYmxvY2sgPj4gOCAtIGlkeCAlIDEgKiA4KVxuICAgICkge1xuICAgICAgY2hhckNvZGUgPSBzdHIuY2hhckNvZGVBdChpZHggKz0gMy80KTtcbiAgICAgIGlmIChjaGFyQ29kZSA+IDB4RkYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRDaGFyYWN0ZXJFcnJvcihcIididG9hJyBmYWlsZWQ6IFRoZSBzdHJpbmcgdG8gYmUgZW5jb2RlZCBjb250YWlucyBjaGFyYWN0ZXJzIG91dHNpZGUgb2YgdGhlIExhdGluMSByYW5nZS5cIik7XG4gICAgICB9XG4gICAgICBibG9jayA9IGJsb2NrIDw8IDggfCBjaGFyQ29kZTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSk7XG5cbiAgLy8gZGVjb2RlclxuICAvLyBbaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMTAyMDM5Nl0gYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9hdGtdXG4gIG9iamVjdC5hdG9iIHx8IChcbiAgb2JqZWN0LmF0b2IgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgc3RyID0gU3RyaW5nKGlucHV0KS5yZXBsYWNlKC89KyQvLCAnJyk7XG4gICAgaWYgKHN0ci5sZW5ndGggJSA0ID09IDEpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IoXCInYXRvYicgZmFpbGVkOiBUaGUgc3RyaW5nIHRvIGJlIGRlY29kZWQgaXMgbm90IGNvcnJlY3RseSBlbmNvZGVkLlwiKTtcbiAgICB9XG4gICAgZm9yIChcbiAgICAgIC8vIGluaXRpYWxpemUgcmVzdWx0IGFuZCBjb3VudGVyc1xuICAgICAgdmFyIGJjID0gMCwgYnMsIGJ1ZmZlciwgaWR4ID0gMCwgb3V0cHV0ID0gJyc7XG4gICAgICAvLyBnZXQgbmV4dCBjaGFyYWN0ZXJcbiAgICAgIGJ1ZmZlciA9IHN0ci5jaGFyQXQoaWR4KyspO1xuICAgICAgLy8gY2hhcmFjdGVyIGZvdW5kIGluIHRhYmxlPyBpbml0aWFsaXplIGJpdCBzdG9yYWdlIGFuZCBhZGQgaXRzIGFzY2lpIHZhbHVlO1xuICAgICAgfmJ1ZmZlciAmJiAoYnMgPSBiYyAlIDQgPyBicyAqIDY0ICsgYnVmZmVyIDogYnVmZmVyLFxuICAgICAgICAvLyBhbmQgaWYgbm90IGZpcnN0IG9mIGVhY2ggNCBjaGFyYWN0ZXJzLFxuICAgICAgICAvLyBjb252ZXJ0IHRoZSBmaXJzdCA4IGJpdHMgdG8gb25lIGFzY2lpIGNoYXJhY3RlclxuICAgICAgICBiYysrICUgNCkgPyBvdXRwdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgyNTUgJiBicyA+PiAoLTIgKiBiYyAmIDYpKSA6IDBcbiAgICApIHtcbiAgICAgIC8vIHRyeSB0byBmaW5kIGNoYXJhY3RlciBpbiB0YWJsZSAoMC02Mywgbm90IGZvdW5kID0+IC0xKVxuICAgICAgYnVmZmVyID0gY2hhcnMuaW5kZXhPZihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9KTtcblxufSgpKTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcInZlcnNpb25cIjogXCJ2MlwiXG59XG4iLCIvKipcbiAqIEVwaWNlbnRlciBKYXZhc2NyaXB0IGxpYnJhcmllc1xuICogdjwlPSB2ZXJzaW9uICU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZm9yaW8vZXBpY2VudGVyLWpzLWxpYnNcbiAqL1xuXG52YXIgRiA9IHtcbiAgICBfcHJpdmF0ZToge30sIC8vbmVlZCB0aGlzIGhvb2sgbm93IGJlY2F1c2UgdGVzdHMgZXhwZWN0IGV2ZXJ5dGhpbmcgdG8gYmUgZ2xvYmFsLiBEZWxldGUgb25jZSB0ZXN0cyBhcmUgYnJvd3NlcmlmaWVkXG4gICAgdXRpbDoge30sXG4gICAgZmFjdG9yeToge30sXG4gICAgdHJhbnNwb3J0OiB7fSxcbiAgICBzdG9yZToge30sXG4gICAgc2VydmljZToge30sXG4gICAgbWFuYWdlcjoge1xuICAgICAgICBzdHJhdGVneToge31cbiAgICB9LFxuXG59O1xuXG5GLmxvYWQgPSByZXF1aXJlKCcuL2Vudi1sb2FkJyk7XG5cbmlmICghZ2xvYmFsLlNLSVBfRU5WX0xPQUQpIHtcbiAgICBGLmxvYWQoKTtcbn1cblxuRi51dGlsLnF1ZXJ5ID0gcmVxdWlyZSgnLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbkYudXRpbC5ydW4gPSByZXF1aXJlKCcuL3V0aWwvcnVuLXV0aWwnKTtcbkYudXRpbC5jbGFzc0Zyb20gPSByZXF1aXJlKCcuL3V0aWwvaW5oZXJpdCcpO1xuRi5fcHJpdmF0ZS5zdHJhdGVneXV0aWxzID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9zdHJhdGVneS11dGlscycpO1xuXG5GLmZhY3RvcnkuVHJhbnNwb3J0ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuRi50cmFuc3BvcnQuQWpheCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0L2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcblxuRi5zZXJ2aWNlLlVSTCA9IHJlcXVpcmUoJy4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcbkYuc2VydmljZS5Db25maWcgPSByZXF1aXJlKCcuL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuUnVuID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkZpbGUgPSByZXF1aXJlKCcuL3NlcnZpY2UvYWRtaW4tZmlsZS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuVmFyaWFibGVzID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkRhdGEgPSByZXF1aXJlKCcuL3NlcnZpY2UvZGF0YS1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkF1dGggPSByZXF1aXJlKCcuL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLldvcmxkID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuU3RhdGUgPSByZXF1aXJlKCcuL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5Vc2VyID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VzZXItYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5NZW1iZXIgPSByZXF1aXJlKCcuL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuQXNzZXQgPSByZXF1aXJlKCcuL3NlcnZpY2UvYXNzZXQtYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5Hcm91cCA9IHJlcXVpcmUoJy4vc2VydmljZS9ncm91cC1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkludHJvc3BlY3QgPSByZXF1aXJlKCcuL3NlcnZpY2UvaW50cm9zcGVjdGlvbi1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLlByZXNlbmNlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3ByZXNlbmNlLWFwaS1zZXJ2aWNlJyk7XG5cbkYuc3RvcmUuQ29va2llID0gcmVxdWlyZSgnLi9zdG9yZS9jb29raWUtc3RvcmUnKTtcbkYuZmFjdG9yeS5TdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xuXG5GLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9zY2VuYXJpby1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuUnVuTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLW1hbmFnZXInKTtcbkYubWFuYWdlci5BdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvYXV0aC1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuV29ybGRNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy93b3JsZC1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuU2F2ZWRSdW5zTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc2F2ZWQtcnVucy1tYW5hZ2VyJyk7XG5cbnZhciBzdHJhdGVnaWVzID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcycpO1xuRi5tYW5hZ2VyLnN0cmF0ZWd5ID0gc3RyYXRlZ2llcy5saXN0OyAvL1RPRE86IHRoaXMgaXMgbm90IHJlYWxseSBhIG1hbmFnZXIgc28gbmFtZXNwYWNlIHRoaXMgYmV0dGVyXG5cbkYubWFuYWdlci5DaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlcicpO1xuRi5zZXJ2aWNlLkNoYW5uZWwgPSByZXF1aXJlKCcuL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlJyk7XG5cbkYudmVyc2lvbiA9ICc8JT0gdmVyc2lvbiAlPic7XG5GLmFwaSA9IHJlcXVpcmUoJy4vYXBpLXZlcnNpb24uanNvbicpO1xuXG5GLmNvbnN0YW50cyA9IHJlcXVpcmUoJy4vbWFuYWdlcnMva2V5LW5hbWVzJyk7XG5cbmdsb2JhbC5GID0gRjtcbm1vZHVsZS5leHBvcnRzID0gRjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVSTENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5cbnZhciBlbnZMb2FkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHVybFNlcnZpY2UgPSBuZXcgVVJMQ29uZmlnU2VydmljZSgpO1xuICAgIHZhciBpbmZvVXJsID0gdXJsU2VydmljZS5nZXRBUElQYXRoKCdjb25maWcnKTtcbiAgICB2YXIgZW52UHJvbWlzZSA9ICQuYWpheCh7IHVybDogaW5mb1VybCwgYXN5bmM6IGZhbHNlIH0pO1xuICAgIGVudlByb21pc2UgPSBlbnZQcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICB2YXIgb3ZlcnJpZGVzID0gcmVzLmFwaTtcbiAgICAgICAgVVJMQ29uZmlnU2VydmljZS5kZWZhdWx0cyA9ICQuZXh0ZW5kKFVSTENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMsIG92ZXJyaWRlcyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGVudlByb21pc2UudGhlbihjYWxsYmFjaykuZmFpbChjYWxsYmFjayk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVudkxvYWQ7XG4iLCIvKipcbiogIyMgQXV0aG9yaXphdGlvbiBNYW5hZ2VyXG4qXG4qIFRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gbWFuYWdlIHVzZXIgYXV0aGVudGljYXRpb24gKGxvZ2dpbmcgaW4gYW5kIG91dCkgYW5kIGF1dGhvcml6YXRpb24gKGtlZXBpbmcgdHJhY2sgb2YgdG9rZW5zLCBzZXNzaW9ucywgYW5kIGdyb3VwcykgZm9yIHByb2plY3RzLlxuKlxuKiBUaGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyIGlzIG1vc3QgdXNlZnVsIGZvciBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pIHdpdGggYW4gYWNjZXNzIGxldmVsIG9mIFtBdXRoZW50aWNhdGVkXSguLi8uLi8uLi9nbG9zc2FyeS8jYWNjZXNzKS4gVGhlc2UgcHJvamVjdHMgYXJlIGFjY2Vzc2VkIGJ5IFtlbmQgdXNlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2Vycykgd2hvIGFyZSBtZW1iZXJzIG9mIG9uZSBvciBtb3JlIFtncm91cHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLlxuKlxuKiAjIyMjIFVzaW5nIHRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIsIGluc3RhbnRpYXRlIGl0LiBUaGVuLCBtYWtlIGNhbGxzIHRvIGFueSBvZiB0aGUgbWV0aG9kcyB5b3UgbmVlZDpcbipcbiogICAgICAgdmFyIGF1dGhNZ3IgPSBuZXcgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKHtcbiogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgIHVzZXJOYW1lOiAnZW5kdXNlcjEnLFxuKiAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCdcbiogICAgICAgfSk7XG4qICAgICAgIGF1dGhNZ3IubG9naW4oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiogICAgICAgICAgIGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuKiAgICAgICB9KTtcbipcbipcbiogVGhlIGBvcHRpb25zYCBvYmplY3QgcGFzc2VkIHRvIHRoZSBgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKClgIGNhbGwgY2FuIGluY2x1ZGU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICogYHVzZXJOYW1lYDogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLlxuKiAgICogYHBhc3N3b3JkYDogUGFzc3dvcmQgZm9yIHNwZWNpZmllZCBgdXNlck5hbWVgLlxuKiAgICogYHByb2plY3RgOiBUaGUgKipQcm9qZWN0IElEKiogZm9yIHRoZSBwcm9qZWN0IHRvIGxvZyB0aGlzIHVzZXIgaW50by4gT3B0aW9uYWwuXG4qICAgKiBgZ3JvdXBJZGA6IElkIG9mIHRoZSBncm91cCB0byB3aGljaCBgdXNlck5hbWVgIGJlbG9uZ3MuIFJlcXVpcmVkIGZvciBlbmQgdXNlcnMgaWYgdGhlIGBwcm9qZWN0YCBpcyBzcGVjaWZpZWQuXG4qXG4qIElmIHlvdSBwcmVmZXIgc3RhcnRpbmcgZnJvbSBhIHRlbXBsYXRlLCB0aGUgRXBpY2VudGVyIEpTIExpYnMgW0xvZ2luIENvbXBvbmVudF0oLi4vLi4vI2NvbXBvbmVudHMpIHVzZXMgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBhcyB3ZWxsLiBUaGlzIHNhbXBsZSBIVE1MIHBhZ2UgKGFuZCBhc3NvY2lhdGVkIENTUyBhbmQgSlMgZmlsZXMpIHByb3ZpZGVzIGEgbG9naW4gZm9ybSBmb3IgdGVhbSBtZW1iZXJzIGFuZCBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0LiBJdCBhbHNvIGluY2x1ZGVzIGEgZ3JvdXAgc2VsZWN0b3IgZm9yIGVuZCB1c2VycyB0aGF0IGFyZSBtZW1iZXJzIG9mIG11bHRpcGxlIGdyb3Vwcy5cbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBBdXRoQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZScpO1xudmFyIE1lbWJlckFkYXB0ZXIgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlcicpO1xudmFyIEdyb3VwU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvZ3JvdXAtYXBpLXNlcnZpY2UnKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIGF0b2IgPSB3aW5kb3cuYXRvYiB8fCByZXF1aXJlKCdCYXNlNjQnKS5hdG9iO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcmVxdWlyZXNHcm91cDogdHJ1ZVxufTtcblxuZnVuY3Rpb24gQXV0aE1hbmFnZXIob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIob3B0aW9ucyk7XG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKCk7XG5cbiAgICB0aGlzLmF1dGhBZGFwdGVyID0gbmV3IEF1dGhBZGFwdGVyKHRoaXMub3B0aW9ucyk7XG59XG5cbnZhciBfZmluZFVzZXJJbkdyb3VwID0gZnVuY3Rpb24gKG1lbWJlcnMsIGlkKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBtZW1iZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChtZW1iZXJzW2pdLnVzZXJJZCA9PT0gaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBtZW1iZXJzW2pdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0gJC5leHRlbmQoQXV0aE1hbmFnZXIucHJvdG90eXBlLCB7XG5cbiAgICAvKipcbiAgICAqIExvZ3MgdXNlciBpbi5cbiAgICAqXG4gICAgKiAqKkV4YW1wbGUqKlxuICAgICpcbiAgICAqICAgICAgIGF1dGhNZ3IubG9naW4oe1xuICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICogICAgICAgICAgIHVzZXJOYW1lOiAnZW5kdXNlcjEnLFxuICAgICogICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnXG4gICAgKiAgICAgICB9KVxuICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHN0YXR1c09iaikge1xuICAgICogICAgICAgICAgICAgICAvLyBpZiBlbmR1c2VyMSBiZWxvbmdzIHRvIGV4YWN0bHkgb25lIGdyb3VwXG4gICAgKiAgICAgICAgICAgICAgIC8vIChvciBpZiB0aGUgbG9naW4oKSBjYWxsIGlzIG1vZGlmaWVkIHRvIGluY2x1ZGUgdGhlIGdyb3VwIGlkKVxuICAgICogICAgICAgICAgICAgICAvLyBjb250aW51ZSBoZXJlXG4gICAgKiAgICAgICAgICAgfSlcbiAgICAqICAgICAgICAgICAuZmFpbChmdW5jdGlvbihzdGF0dXNPYmopIHtcbiAgICAqICAgICAgICAgICAgICAgLy8gaWYgZW5kdXNlcjEgYmVsb25ncyB0byBtdWx0aXBsZSBncm91cHMsXG4gICAgKiAgICAgICAgICAgICAgIC8vIHRoZSBsb2dpbigpIGNhbGwgZmFpbHNcbiAgICAqICAgICAgICAgICAgICAgLy8gYW5kIHJldHVybnMgYWxsIGdyb3VwcyBvZiB3aGljaCB0aGUgdXNlciBpcyBhIG1lbWJlclxuICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBzdGF0dXNPYmoudXNlckdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICogICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3RhdHVzT2JqLnVzZXJHcm91cHNbaV0ubmFtZSwgc3RhdHVzT2JqLnVzZXJHcm91cHNbaV0uZ3JvdXBJZCk7XG4gICAgKiAgICAgICAgICAgICAgIH1cbiAgICAqICAgICAgICAgICB9KTtcbiAgICAqXG4gICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuIElmIG5vdCBwYXNzZWQgaW4gd2hlbiBjcmVhdGluZyBhbiBpbnN0YW5jZSBvZiB0aGUgbWFuYWdlciAoYEYubWFuYWdlci5BdXRoTWFuYWdlcigpYCksIHRoZXNlIG9wdGlvbnMgc2hvdWxkIGluY2x1ZGU6XG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5hY2NvdW50IFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXNlck5hbWUgRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMucGFzc3dvcmQgUGFzc3dvcmQgZm9yIHNwZWNpZmllZCBgdXNlck5hbWVgLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMucHJvamVjdCAoT3B0aW9uYWwpIFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZ3JvdXBJZCBUaGUgaWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIGB1c2VyTmFtZWAgYmVsb25ncy4gUmVxdWlyZWQgZm9yIFtlbmQgdXNlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycykgaWYgdGhlIGBwcm9qZWN0YCBpcyBzcGVjaWZpZWQgYW5kIGlmIHRoZSBlbmQgdXNlcnMgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgW2dyb3Vwc10oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcyksIG90aGVyd2lzZSBvcHRpb25hbC5cbiAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgKi9cbiAgICBsb2dpbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgc2Vzc2lvbk1hbmFnZXIgPSB0aGlzLnNlc3Npb25NYW5hZ2VyO1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSBzZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHsgc3VjY2VzczogJC5ub29wLCBlcnJvcjogJC5ub29wIH0sIG9wdGlvbnMpO1xuICAgICAgICB2YXIgb3V0U3VjY2VzcyA9IGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgIHZhciBvdXRFcnJvciA9IGFkYXB0ZXJPcHRpb25zLmVycm9yO1xuICAgICAgICB2YXIgZ3JvdXBJZCA9IGFkYXB0ZXJPcHRpb25zLmdyb3VwSWQ7XG5cbiAgICAgICAgdmFyIGRlY29kZVRva2VuID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICB2YXIgZW5jb2RlZCA9IHRva2VuLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICB3aGlsZSAoZW5jb2RlZC5sZW5ndGggJSA0ICE9PSAwKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIGVuY29kZWQgKz0gJz0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYXRvYihlbmNvZGVkKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUdyb3VwRXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgc3RhdHVzQ29kZSwgZGF0YSwgdHlwZSkge1xuICAgICAgICAgICAgLy8gbG9nb3V0IHRoZSB1c2VyIHNpbmNlIGl0J3MgaW4gYW4gaW52YWxpZCBzdGF0ZSB3aXRoIG5vIGdyb3VwIHNlbGVjdGVkXG4gICAgICAgICAgICBtZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGF0YSwgeyBzdGF0dXNUZXh0OiBtZXNzYWdlLCBzdGF0dXM6IHN0YXR1c0NvZGUsIHR5cGU6IHR5cGUgfSk7XG4gICAgICAgICAgICAgICAgJGQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgdG9rZW4gPSByZXNwb25zZS5hY2Nlc3NfdG9rZW47XG4gICAgICAgICAgICB2YXIgdXNlckluZm8gPSBkZWNvZGVUb2tlbih0b2tlbik7XG4gICAgICAgICAgICB2YXIgb2xkR3JvdXBzID0gc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbihhZGFwdGVyT3B0aW9ucykuZ3JvdXBzIHx8IHt9O1xuICAgICAgICAgICAgdmFyIHVzZXJHcm91cE9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgYWRhcHRlck9wdGlvbnMsIHsgc3VjY2VzczogJC5ub29wIH0pO1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB7IGF1dGg6IHJlc3BvbnNlLCB1c2VyOiB1c2VySW5mbyB9O1xuICAgICAgICAgICAgdmFyIHByb2plY3QgPSBhZGFwdGVyT3B0aW9ucy5wcm9qZWN0O1xuICAgICAgICAgICAgdmFyIGlzVGVhbU1lbWJlciA9IHVzZXJJbmZvLnBhcmVudF9hY2NvdW50X2lkID09PSBudWxsO1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzR3JvdXAgPSBhZGFwdGVyT3B0aW9ucy5yZXF1aXJlc0dyb3VwICYmIHByb2plY3Q7XG5cbiAgICAgICAgICAgIHZhciB1c2VyTmFtZSA9ICh1c2VySW5mby51c2VyX25hbWUgfHwgJycpLnNwbGl0KCcvJylbMF07IC8vb2YgZm9ybSA8dXNlcj4vPHRlYW0+XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbkluZm8gPSB7XG4gICAgICAgICAgICAgICAgYXV0aF90b2tlbjogdG9rZW4sXG4gICAgICAgICAgICAgICAgYWNjb3VudDogYWRhcHRlck9wdGlvbnMuYWNjb3VudCxcbiAgICAgICAgICAgICAgICBwcm9qZWN0OiBwcm9qZWN0LFxuICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgICAgICBncm91cHM6IG9sZEdyb3VwcyxcbiAgICAgICAgICAgICAgICBpc1RlYW1NZW1iZXI6IGlzVGVhbU1lbWJlcixcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogdXNlck5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gVGhlIGdyb3VwIGlzIG5vdCByZXF1aXJlZCBpZiB0aGUgdXNlciBpcyBub3QgbG9nZ2luZyBpbnRvIGEgcHJvamVjdFxuICAgICAgICAgICAgaWYgKCFyZXF1aXJlc0dyb3VwKSB7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbk1hbmFnZXIuc2F2ZVNlc3Npb24oc2Vzc2lvbkluZm8pO1xuICAgICAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW2RhdGFdKTtcbiAgICAgICAgICAgICAgICAkZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGhhbmRsZUdyb3VwTGlzdCA9IGZ1bmN0aW9uIChncm91cExpc3QpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnVzZXJHcm91cHMgPSBncm91cExpc3Q7XG5cbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChncm91cExpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUdyb3VwRXJyb3IoJ1RoZSB1c2VyIGhhcyBubyBncm91cHMgYXNzb2NpYXRlZCBpbiB0aGlzIGFjY291bnQnLCA0MDMsIGRhdGEsICdOT19HUk9VUFMnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBMaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZWxlY3QgdGhlIG9ubHkgZ3JvdXBcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAgPSBncm91cExpc3RbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChncm91cExpc3QubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkR3JvdXBzID0gJC5ncmVwKGdyb3VwTGlzdCwgZnVuY3Rpb24gKHJlc0dyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc0dyb3VwLmdyb3VwSWQgPT09IGdyb3VwSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwID0gZmlsdGVyZWRHcm91cHMubGVuZ3RoID09PSAxID8gZmlsdGVyZWRHcm91cHNbMF0gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgdGVhbSBtZW1iZXIgZG9lcyBub3QgZ2V0IHRoZSBncm91cCBtZW1iZXJzIGJlY2F1c2UgaXMgY2FsbGluZyB0aGUgR3JvdXAgQVBJXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBpdCdzIGF1dG9tYXRpY2FsbHkgYSBmYWMgdXNlclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXNGYWMgPSBpc1RlYW1NZW1iZXIgPyB0cnVlIDogX2ZpbmRVc2VySW5Hcm91cChncm91cC5tZW1iZXJzLCB1c2VySW5mby51c2VyX2lkKS5yb2xlID09PSAnZmFjaWxpdGF0b3InO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXBEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXAuZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwTmFtZTogZ3JvdXAubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRmFjOiBpc0ZhY1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbkluZm9XaXRoR3JvdXAgPSBvYmplY3RBc3NpZ24oe30sIHNlc3Npb25JbmZvLCBncm91cERhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSW5mby5ncm91cHNbcHJvamVjdF0gPSBncm91cERhdGE7XG4gICAgICAgICAgICAgICAgICAgIG1lLnNlc3Npb25NYW5hZ2VyLnNhdmVTZXNzaW9uKHNlc3Npb25JbmZvV2l0aEdyb3VwLCBhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW2RhdGFdKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cEVycm9yKCdUaGlzIHVzZXIgaXMgYXNzb2NpYXRlZCB3aXRoIG1vcmUgdGhhbiBvbmUgZ3JvdXAuIFBsZWFzZSBzcGVjaWZ5IGEgZ3JvdXAgaWQgdG8gbG9nIGludG8gYW5kIHRyeSBhZ2FpbicsIDQwMywgZGF0YSwgJ01VTFRJUExFX0dST1VQUycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghaXNUZWFtTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbWUuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogdXNlckluZm8udXNlcl9pZCwgdG9rZW46IHRva2VuIH0sIHVzZXJHcm91cE9wdHMpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGhhbmRsZUdyb3VwTGlzdCwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSBvYmplY3RBc3NpZ24oe30sIHVzZXJHcm91cE9wdHMsIHsgdG9rZW46IHRva2VuIH0pO1xuICAgICAgICAgICAgICAgIHZhciBncm91cFNlcnZpY2UgPSBuZXcgR3JvdXBTZXJ2aWNlKG9wdHMpO1xuICAgICAgICAgICAgICAgIGdyb3VwU2VydmljZS5nZXRHcm91cHMoeyBhY2NvdW50OiBhZGFwdGVyT3B0aW9ucy5hY2NvdW50LCBwcm9qZWN0OiBwcm9qZWN0IH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdyb3VwIEFQSSByZXR1cm5zIGlkIGluc3RlYWQgb2YgZ3JvdXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBJZCA9IGdyb3VwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBMaXN0KGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZWl0aGVyIGl0J3MgYSBwcml2YXRlIHByb2plY3Qgb3IgdGhlcmUgYXJlIG5vIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25NYW5hZ2VyLnNhdmVTZXNzaW9uKHNlc3Npb25JbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sICRkLnJlamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYWRhcHRlck9wdGlvbnMuc3VjY2VzcyA9IGhhbmRsZVN1Y2Nlc3M7XG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoYWRhcHRlck9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBsb2dpbiBhcyBhIHN5c3RlbSB1c2VyXG4gICAgICAgICAgICAgICAgYWRhcHRlck9wdGlvbnMuYWNjb3VudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYWRhcHRlck9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dEVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIG1lLmF1dGhBZGFwdGVyLmxvZ2luKGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dEVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAkZC5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXV0aEFkYXB0ZXIubG9naW4oYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAqIExvZ3MgdXNlciBvdXQgYnkgY2xlYXJpbmcgYWxsIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAgKlxuICAgICogKipFeGFtcGxlKipcbiAgICAqXG4gICAgKiAgICAgICBhdXRoTWdyLmxvZ291dCgpO1xuICAgICpcbiAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgKi9cbiAgICBsb2dvdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICB2YXIgcmVtb3ZlQ29va2llRm4gPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIG1lLnNlc3Npb25NYW5hZ2VyLnJlbW92ZVNlc3Npb24oKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hdXRoQWRhcHRlci5sb2dvdXQoYWRhcHRlck9wdGlvbnMpLnRoZW4ocmVtb3ZlQ29va2llRm4pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBleGlzdGluZyB1c2VyIGFjY2VzcyB0b2tlbiBpZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbi4gT3RoZXJ3aXNlLCBsb2dzIHRoZSB1c2VyIGluLCBjcmVhdGluZyBhIG5ldyB1c2VyIGFjY2VzcyB0b2tlbiwgYW5kIHJldHVybnMgdGhlIG5ldyB0b2tlbi4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgYXV0aE1nci5nZXRUb2tlbigpXG4gICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNeSB0b2tlbiBpcyAnLCB0b2tlbik7XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXRUb2tlbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGh0dHBPcHRpb25zKTtcbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICBpZiAoc2Vzc2lvbi5hdXRoX3Rva2VuKSB7XG4gICAgICAgICAgICAkZC5yZXNvbHZlKHNlc3Npb24uYXV0aF90b2tlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luKGh0dHBPcHRpb25zKS50aGVuKCRkLnJlc29sdmUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgZ3JvdXAgcmVjb3Jkcywgb25lIGZvciBlYWNoIGdyb3VwIG9mIHdoaWNoIHRoZSBjdXJyZW50IHVzZXIgaXMgYSBtZW1iZXIuIEVhY2ggZ3JvdXAgcmVjb3JkIGluY2x1ZGVzIHRoZSBncm91cCBgbmFtZWAsIGBhY2NvdW50YCwgYHByb2plY3RgLCBhbmQgYGdyb3VwSWRgLlxuICAgICAqXG4gICAgICogSWYgc29tZSBlbmQgdXNlcnMgaW4geW91ciBwcm9qZWN0IGFyZSBtZW1iZXJzIG9mIG11bHRpcGxlIGdyb3VwcywgdGhpcyBpcyBhIHVzZWZ1bCBtZXRob2QgdG8gY2FsbCBvbiB5b3VyIHByb2plY3QncyBsb2dpbiBwYWdlLiBXaGVuIHRoZSB1c2VyIGF0dGVtcHRzIHRvIGxvZyBpbiwgeW91IGNhbiB1c2UgdGhpcyB0byBkaXNwbGF5IHRoZSBncm91cHMgb2Ygd2hpY2ggdGhlIHVzZXIgaXMgbWVtYmVyLCBhbmQgaGF2ZSB0aGUgdXNlciBzZWxlY3QgdGhlIGNvcnJlY3QgZ3JvdXAgdG8gbG9nIGluIHRvIGZvciB0aGlzIHNlc3Npb24uXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICAvLyBnZXQgZ3JvdXBzIGZvciBjdXJyZW50IHVzZXJcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICogICAgICBhdXRoTWdyLmdldFVzZXJHcm91cHMoeyB1c2VySWQ6IHNlc3Npb25PYmoudXNlcklkLCB0b2tlbjogc2Vzc2lvbk9iai5hdXRoX3Rva2VuIH0pXG4gICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGdyb3Vwcykge1xuICAgICAqICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspXG4gICAgICogICAgICAgICAgICAgICAgICB7IGNvbnNvbGUubG9nKGdyb3Vwc1tpXS5uYW1lKTsgfVxuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogICAgICAvLyBnZXQgZ3JvdXBzIGZvciBwYXJ0aWN1bGFyIHVzZXJcbiAgICAgKiAgICAgIGF1dGhNZ3IuZ2V0VXNlckdyb3Vwcyh7dXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgdG9rZW46IHNhdmVkUHJvakFjY2Vzc1Rva2VuIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9iamVjdCB3aXRoIGEgdXNlcklkIGFuZCB0b2tlbiBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMudXNlcklkIFRoZSB1c2VySWQuIElmIGxvb2tpbmcgdXAgZ3JvdXBzIGZvciB0aGUgY3VycmVudGx5IGxvZ2dlZCBpbiB1c2VyLCB0aGlzIGlzIGluIHRoZSBzZXNzaW9uIGluZm9ybWF0aW9uLiBPdGhlcndpc2UsIHBhc3MgYSBzdHJpbmcuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmFtcy50b2tlbiBUaGUgYXV0aG9yaXphdGlvbiBjcmVkZW50aWFscyAoYWNjZXNzIHRva2VuKSB0byB1c2UgZm9yIGNoZWNraW5nIHRoZSBncm91cHMgZm9yIHRoaXMgdXNlci4gSWYgbG9va2luZyB1cCBncm91cHMgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIsIHRoaXMgaXMgaW4gdGhlIHNlc3Npb24gaW5mb3JtYXRpb24uIEEgdGVhbSBtZW1iZXIncyB0b2tlbiBvciBhIHByb2plY3QgYWNjZXNzIHRva2VuIGNhbiBhY2Nlc3MgYWxsIHRoZSBncm91cHMgZm9yIGFsbCBlbmQgdXNlcnMgaW4gdGhlIHRlYW0gb3IgcHJvamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZ2V0VXNlckdyb3VwczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoeyBzdWNjZXNzOiAkLm5vb3AgfSwgb3B0aW9ucyk7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuXG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAobWVtYmVySW5mbykge1xuICAgICAgICAgICAgLy8gVGhlIG1lbWJlciBBUEkgaXMgYXQgdGhlIGFjY291bnQgc2NvcGUsIHdlIGZpbHRlciBieSBwcm9qZWN0XG4gICAgICAgICAgICBpZiAoYWRhcHRlck9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICAgICAgICAgIG1lbWJlckluZm8gPSAkLmdyZXAobWVtYmVySW5mbywgZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5wcm9qZWN0ID09PSBhZGFwdGVyT3B0aW9ucy5wcm9qZWN0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFttZW1iZXJJbmZvXSk7XG4gICAgICAgICAgICAkZC5yZXNvbHZlKG1lbWJlckluZm8pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJBZGFwdGVyID0gbmV3IE1lbWJlckFkYXB0ZXIoeyB0b2tlbjogcGFyYW1zLnRva2VuLCBzZXJ2ZXI6IGFkYXB0ZXJPcHRpb25zLnNlcnZlciB9KTtcbiAgICAgICAgbWVtYmVyQWRhcHRlci5nZXRHcm91cHNGb3JVc2VyKHBhcmFtcywgYWRhcHRlck9wdGlvbnMpLmZhaWwoJGQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIG1ldGhvZCB0byBjaGVjayBpZiB5b3UncmUgY3VycmVudGx5IGxvZ2dlZCBpblxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICogIFxuICAgICAqICAgICAgdmFyIGFtSUxvZ2dlZEluID0gYXV0aE1nci5pc0xvZ2dlZEluKCk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7bm9uZX0gbm9uZVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgeW91J3JlIGxvZ2dlZCBpblxuICAgICAqL1xuICAgIGlzTG9nZ2VkSW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgcmV0dXJuICEhKHNlc3Npb24gJiYgc2Vzc2lvbi51c2VySWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHNlc3Npb24gaW5mb3JtYXRpb24gZm9yIHRoZSBjdXJyZW50IHVzZXIsIGluY2x1ZGluZyB0aGUgYHVzZXJJZGAsIGBhY2NvdW50YCwgYHByb2plY3RgLCBgZ3JvdXBJZGAsIGBncm91cE5hbWVgLCBgaXNGYWNgICh3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBhIGZhY2lsaXRhdG9yIG9mIHRoaXMgZ3JvdXApLCBhbmQgYGF1dGhfdG9rZW5gICh1c2VyIGFjY2VzcyB0b2tlbikuXG4gICAgICpcbiAgICAgKiAqSW1wb3J0YW50KjogVGhpcyBtZXRob2QgaXMgc3luY2hyb25vdXMuIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIGlzIHJldHVybmVkIGltbWVkaWF0ZWx5IGluIGFuIG9iamVjdDsgbm8gY2FsbGJhY2tzIG9yIHByb21pc2VzIGFyZSBuZWVkZWQuXG4gICAgICpcbiAgICAgKiBTZXNzaW9uIGluZm9ybWF0aW9uIGlzIHN0b3JlZCBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHsgc3VjY2VzczogJC5ub29wIH0sIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBBZGRzIG9uZSBvciBtb3JlIGdyb3VwcyB0byB0aGUgY3VycmVudCBzZXNzaW9uLiBcbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGFzc3VtZXMgdGhhdCB0aGUgcHJvamVjdCBhbmQgZ3JvdXAgZXhpc3QgYW5kIHRoZSB1c2VyIHNwZWNpZmllZCBpbiB0aGUgc2Vzc2lvbiBpcyBwYXJ0IG9mIHRoaXMgcHJvamVjdCBhbmQgZ3JvdXAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBuZXcgc2Vzc2lvbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmFkZEdyb3Vwcyh7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9KTtcbiAgICAgKiAgICAgIGF1dGhNZ3IuYWRkR3JvdXBzKFt7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9LCB7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJy4uLicgfV0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge29iamVjdHxhcnJheX0gZ3JvdXBzIChSZXF1aXJlZCkgVGhlIGdyb3VwIG9iamVjdCBtdXN0IGNvbnRhaW4gdGhlIGBwcm9qZWN0YCAoKipQcm9qZWN0IElEKiopIGFuZCBgZ3JvdXBOYW1lYCBwcm9wZXJ0aWVzLiBJZiBwYXNzaW5nIGFuIGFycmF5IG9mIHN1Y2ggb2JqZWN0cywgYWxsIG9mIHRoZSBvYmplY3RzIG11c3QgY29udGFpbiAqZGlmZmVyZW50KiBgcHJvamVjdGAgKCoqUHJvamVjdCBJRCoqKSB2YWx1ZXM6IGFsdGhvdWdoIGVuZCB1c2VycyBtYXkgYmUgbG9nZ2VkIGluIHRvIG11bHRpcGxlIHByb2plY3RzIGF0IG9uY2UsIHRoZXkgbWF5IG9ubHkgYmUgbG9nZ2VkIGluIHRvIG9uZSBncm91cCBwZXIgcHJvamVjdCBhdCBhIHRpbWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwLmlzRmFjIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gYGZhbHNlYC4gU2V0IHRvIGB0cnVlYCBpZiB0aGUgdXNlciBpbiB0aGUgc2Vzc2lvbiBzaG91bGQgYmUgYSBmYWNpbGl0YXRvciBpbiB0aGlzIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cC5ncm91cElkIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gdW5kZWZpbmVkLiBOZWVkZWQgbW9zdGx5IGZvciB0aGUgTWVtYmVycyBBUEkuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgKi9cbiAgICBhZGRHcm91cHM6IGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGdyb3Vwcyk7XG4gICAgICAgIGdyb3VwcyA9IGlzQXJyYXkgPyBncm91cHMgOiBbZ3JvdXBzXTtcblxuICAgICAgICAkLmVhY2goZ3JvdXBzLCBmdW5jdGlvbiAoaW5kZXgsIGdyb3VwKSB7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kZWRHcm91cCA9ICQuZXh0ZW5kKHt9LCB7IGlzRmFjOiBmYWxzZSB9LCBncm91cCk7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGV4dGVuZGVkR3JvdXAucHJvamVjdDtcbiAgICAgICAgICAgIHZhciB2YWxpZFByb3BzID0gWydncm91cE5hbWUnLCAnZ3JvdXBJZCcsICdpc0ZhYyddO1xuICAgICAgICAgICAgaWYgKCFwcm9qZWN0IHx8ICFleHRlbmRlZEdyb3VwLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcHJvamVjdCBvciBncm91cE5hbWUgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZmlsdGVyIG9iamVjdFxuICAgICAgICAgICAgZXh0ZW5kZWRHcm91cCA9IF9waWNrKGV4dGVuZGVkR3JvdXAsIHZhbGlkUHJvcHMpO1xuICAgICAgICAgICAgc2Vzc2lvbi5ncm91cHNbcHJvamVjdF0gPSBleHRlbmRlZEdyb3VwO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogIyMgQ2hhbm5lbCBNYW5hZ2VyXG4gKlxuICogVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogSWYgeW91IGFyZSBkZXZlbG9waW5nIHdpdGggRXBpY2VudGVyLmpzLCB5b3Ugc2hvdWxkIHVzZSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSByYXRoZXIgdGhhbiB0aGlzIG1vcmUgZ2VuZXJpYyBDaGFubmVsIE1hbmFnZXIuIChUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgdGhhdCBpbnN0YW50aWF0ZXMgYSBDaGFubmVsIE1hbmFnZXIgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuKSBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBkb2N1bWVudGF0aW9uIGFsc28gaGFzIG1vcmUgW2JhY2tncm91bmRdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvI2JhY2tncm91bmQpIGluZm9ybWF0aW9uIG9uIGNoYW5uZWxzIGFuZCB0aGVpciB1c2UuIFxuICpcbiAqIEhvd2V2ZXIsIHlvdSBjYW4gd29yayBkaXJlY3RseSB3aXRoIHRoZSBDaGFubmVsIE1hbmFnZXIgaWYgeW91IGxpa2UuIChUaGlzIG1pZ2h0IGJlIHVzZWZ1bCBpZiB5b3UgYXJlIHdvcmtpbmcgdGhyb3VnaCBOb2RlLmpzLCBmb3IgZXhhbXBsZSwgYHJlcXVpcmUoJ21hbmFnZXIvY2hhbm5lbC1tYW5hZ2VyJylgLilcbiAqXG4gKiBUaGUgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciBhcm91bmQgdGhlIGRlZmF1bHQgW2NvbWV0ZCBKYXZhU2NyaXB0IGxpYnJhcnldKGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvMi9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sKSwgYCQuY29tZXRkYC4gSXQgcHJvdmlkZXMgYSBmZXcgbmljZSBmZWF0dXJlcyB0aGF0IGAkLmNvbWV0ZGAgZG9lc24ndCwgaW5jbHVkaW5nOlxuICpcbiAqICogQXV0b21hdGljIHJlLXN1YnNjcmlwdGlvbiB0byBjaGFubmVscyBpZiB5b3UgbG9zZSB5b3VyIGNvbm5lY3Rpb25cbiAqICogT25saW5lIC8gT2ZmbGluZSBub3RpZmljYXRpb25zXG4gKiAqICdFdmVudHMnIGZvciBjb21ldGQgbm90aWZpY2F0aW9ucyAoaW5zdGVhZCBvZiBoYXZpbmcgdG8gbGlzdGVuIG9uIHNwZWNpZmljIG1ldGEgY2hhbm5lbHMpXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyLiAoU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuKVxuICpcbiAqIFRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyIGluIGNsaWVudC1zaWRlIEphdmFTY3JpcHQsIGluc3RhbnRpYXRlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pLCBnZXQgYSBwYXJ0aWN1bGFyIGNoYW5uZWwgLS0gdGhhdCBpcywgYW4gaW5zdGFuY2Ugb2YgYSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSAtLSB0aGVuIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAqICAgICAgLy8gYmVjYXVzZSB3ZSB1c2VkIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgdG8gZ2V0IHRoZSBncm91cCBjaGFubmVsLFxuICogICAgICAvLyBzdWJzY3JpYmUoKSBhbmQgcHVibGlzaCgpIGhlcmUgZGVmYXVsdCB0byB0aGUgYmFzZSB0b3BpYyBmb3IgdGhlIGdyb3VwO1xuICogICAgICBnYy5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uKGRhdGEpIHsgY29uc29sZS5sb2coZGF0YSk7IH0pO1xuICogICAgICBnYy5wdWJsaXNoKCcnLCB7IG1lc3NhZ2U6ICdhIG5ldyBtZXNzYWdlIHRvIHRoZSBncm91cCcgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIE1hbmFnZXIgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIE1hbmFnZXIuIEJlc2lkZXMgdGhlIGNvbW1vbiBvcHRpb25zIGxpc3RlZCBoZXJlLCBzZWUgaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sIGZvciBvdGhlciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAqICogYG9wdGlvbnMudXJsYCBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAqICogYG9wdGlvbnMud2Vic29ja2V0RW5hYmxlZGAgV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUgKGJvb2xlYW4pLlxuICogKiBgb3B0aW9ucy5jaGFubmVsYCBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBDaGFubmVsIFNlcnZpY2UuIFNlZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSBmb3IgZGV0YWlscy5cbiAqXG4gKi9cblxudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBDaGFubmVsTWFuYWdlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCEkLmNvbWV0ZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb21ldGQgbGlicmFyeSBub3QgZm91bmQuIFBsZWFzZSBpbmNsdWRlIGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanMnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb21ldGQgbGlicmFyeSBub3QgZm91bmQuIFBsZWFzZSBpbmNsdWRlIGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanMnKTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnVybCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGFuIHVybCBmb3IgdGhlIGNvbWV0ZCBzZXJ2ZXInKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVybDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBsb2cgbGV2ZWwgZm9yIHRoZSBjaGFubmVsIChsb2dzIHRvIGNvbnNvbGUpLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9nTGV2ZWw6ICdpbmZvJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB3ZWJzb2NrZXRFbmFibGVkOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBBQ0sgZXh0ZW5zaW9uIGlzIGVuYWJsZWQuIERlZmF1bHRzIHRvIGB0cnVlYC4gU2VlIFtodHRwczovL2RvY3MuY29tZXRkLm9yZy9jdXJyZW50L3JlZmVyZW5jZS8jX2V4dGVuc2lvbnNfYWNrbm93bGVkZ2VdKGh0dHBzOi8vZG9jcy5jb21ldGQub3JnL2N1cnJlbnQvcmVmZXJlbmNlLyNfZXh0ZW5zaW9uc19hY2tub3dsZWRnZSkgZm9yIG1vcmUgaW5mby5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBhY2tFbmFibGVkOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBmYWxzZSBlYWNoIGluc3RhbmNlIG9mIENoYW5uZWwgd2lsbCBoYXZlIGEgc2VwYXJhdGUgY29tZXRkIGNvbm5lY3Rpb24gdG8gc2VydmVyLCB3aGljaCBjb3VsZCBiZSBub2lzeS4gU2V0IHRvIHRydWUgdG8gcmUtdXNlIHRoZSBzYW1lIGNvbm5lY3Rpb24gYWNyb3NzIGluc3RhbmNlcy5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBzaGFyZUNvbm5lY3Rpb246IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSwgd2hpY2ggYXJlIGNyZWF0ZWQgdGhyb3VnaCBgZ2V0Q2hhbm5lbCgpYC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNoYW5uZWw6IHtcblxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIGNoYW5uZWwgaGFuZHNoYWtlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykgcGFzc2VzIGBleHRgIGFuZCBhdXRob3JpemF0aW9uIGluZm9ybWF0aW9uLiBNb3JlIGluZm9ybWF0aW9uIG9uIHBvc3NpYmxlIG9wdGlvbnMgaXMgaW4gdGhlIGRldGFpbHMgb2YgdGhlIHVuZGVybHlpbmcgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBoYW5kc2hha2U6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zID0gW107XG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdENvbWV0T3B0aW9ucztcblxuICAgIGlmIChkZWZhdWx0Q29tZXRPcHRpb25zLnNoYXJlQ29ubmVjdGlvbiAmJiBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZCkge1xuICAgICAgICB0aGlzLmNvbWV0ZCA9IENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIGNvbWV0ZCA9IG5ldyAkLkNvbWV0RCgpO1xuICAgIENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkID0gY29tZXRkO1xuXG4gICAgY29tZXRkLndlYnNvY2tldEVuYWJsZWQgPSBkZWZhdWx0Q29tZXRPcHRpb25zLndlYnNvY2tldEVuYWJsZWQ7XG4gICAgY29tZXRkLmFja0VuYWJsZWQgPSBkZWZhdWx0Q29tZXRPcHRpb25zLmFja0VuYWJsZWQ7XG5cbiAgICB0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2U7XG4gICAgdmFyIGNvbm5lY3Rpb25Ccm9rZW4gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Rpc2Nvbm5lY3QnLCBtZXNzYWdlKTtcbiAgICB9O1xuICAgIHZhciBjb25uZWN0aW9uU3VjY2VlZGVkID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjb25uZWN0JywgbWVzc2FnZSk7XG4gICAgfTtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgY29tZXRkLmNvbmZpZ3VyZShkZWZhdWx0Q29tZXRPcHRpb25zKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvY29ubmVjdCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciB3YXNDb25uZWN0ZWQgPSB0aGlzLmlzQ29ubmVjdGVkO1xuICAgICAgICB0aGlzLmlzQ29ubmVjdGVkID0gKG1lc3NhZ2Uuc3VjY2Vzc2Z1bCA9PT0gdHJ1ZSk7XG4gICAgICAgIGlmICghd2FzQ29ubmVjdGVkICYmIHRoaXMuaXNDb25uZWN0ZWQpIHsgLy9Db25uZWN0aW5nIGZvciB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgY29ubmVjdGlvblN1Y2NlZWRlZC5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHdhc0Nvbm5lY3RlZCAmJiAhdGhpcy5pc0Nvbm5lY3RlZCkgeyAvL09ubHkgdGhyb3cgZGlzY29ubmVjdGVkIG1lc3NhZ2UgZnJvIHRoZSBmaXJzdCBkaXNjb25uZWN0LCBub3Qgb25jZSBwZXIgdHJ5XG4gICAgICAgICAgICBjb25uZWN0aW9uQnJva2VuLmNhbGwodGhpcywgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9kaXNjb25uZWN0JywgY29ubmVjdGlvbkJyb2tlbik7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2hhbmRzaGFrZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLnN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgICAgIC8vaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdF9zdWJzY3JpYmUuaHRtbCNqYXZhc2NyaXB0X3N1YnNjcmliZV9tZXRhX2NoYW5uZWxzXG4gICAgICAgICAgICAvLyBeIFwiZHluYW1pYyBzdWJzY3JpcHRpb25zIGFyZSBjbGVhcmVkIChsaWtlIGFueSBvdGhlciBzdWJzY3JpcHRpb24pIGFuZCB0aGUgYXBwbGljYXRpb24gbmVlZHMgdG8gZmlndXJlIG91dCB3aGljaCBkeW5hbWljIHN1YnNjcmlwdGlvbiBtdXN0IGJlIHBlcmZvcm1lZCBhZ2FpblwiXG4gICAgICAgICAgICBjb21ldGQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQobWUuY3VycmVudFN1YnNjcmlwdGlvbnMpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBzdWJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbWV0ZC5yZXN1YnNjcmliZShzdWJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvL090aGVyIGludGVyZXN0aW5nIGV2ZW50cyBmb3IgcmVmZXJlbmNlXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9zdWJzY3JpYmUnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdzdWJzY3JpYmUnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3Vuc3Vic2NyaWJlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcigndW5zdWJzY3JpYmUnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3B1Ymxpc2gnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdwdWJsaXNoJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS91bnN1Y2Nlc3NmdWwnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdlcnJvcicsIG1lc3NhZ2UpO1xuICAgIH0pO1xuXG4gICAgY29tZXRkLmhhbmRzaGFrZShkZWZhdWx0Q29tZXRPcHRpb25zLmhhbmRzaGFrZSk7XG5cbiAgICB0aGlzLmNvbWV0ZCA9IGNvbWV0ZDtcbn07XG5cblxuQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlID0gJC5leHRlbmQoQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLCB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgY2hhbm5lbCwgdGhhdCBpcywgYW4gaW5zdGFuY2Ugb2YgYSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgIHZhciBjaGFubmVsID0gY20uZ2V0Q2hhbm5lbCgpO1xuICAgICAqXG4gICAgICogICAgICBjaGFubmVsLnN1YnNjcmliZSgndG9waWMnLCBjYWxsYmFjayk7XG4gICAgICogICAgICBjaGFubmVsLnB1Ymxpc2goJ3RvcGljJywgeyBteURhdGE6IDEwMCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBvcHRpb25zIChPcHRpb25hbCkgSWYgc3RyaW5nLCBhc3N1bWVkIHRvIGJlIHRoZSBiYXNlIGNoYW5uZWwgdXJsLiBJZiBvYmplY3QsIGFzc3VtZWQgdG8gYmUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgY29uc3RydWN0b3IuXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldENoYW5uZWw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIC8vSWYgeW91IGp1c3Qgd2FudCB0byBwYXNzIGluIGEgc3RyaW5nXG4gICAgICAgIGlmIChvcHRpb25zICYmICEkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgYmFzZTogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQ6IHRoaXMuY29tZXRkXG4gICAgICAgIH07XG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IENoYW5uZWwoJC5leHRlbmQodHJ1ZSwge30sIHRoaXMub3B0aW9ucy5jaGFubmVsLCBkZWZhdWx0cywgb3B0aW9ucykpO1xuXG5cbiAgICAgICAgLy9XcmFwIHN1YnMgYW5kIHVuc3VicyBzbyB3ZSBjYW4gdXNlIGl0IHRvIHJlLWF0dGFjaCBoYW5kbGVycyBhZnRlciBiZWluZyBkaXNjb25uZWN0ZWRcbiAgICAgICAgdmFyIHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3ViaWQgPSBzdWJzLmFwcGx5KGNoYW5uZWwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zID0gdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5jb25jYXQoc3ViaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHN1YmlkO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cblxuICAgICAgICB2YXIgdW5zdWJzID0gY2hhbm5lbC51bnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVkID0gdW5zdWJzLmFwcGx5KGNoYW5uZWwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50U3Vic2NyaXB0aW9uc1tpXS5pZCA9PT0gcmVtb3ZlZC5pZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKlxuICAgICAqIFN1cHBvcnRlZCBldmVudHMgYXJlOiBgY29ubmVjdGAsIGBkaXNjb25uZWN0YCwgYHN1YnNjcmliZWAsIGB1bnN1YnNjcmliZWAsIGBwdWJsaXNoYCwgYGVycm9yYC5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vbi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wIGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9mZi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGV2ZW50cyBhbmQgZXhlY3V0ZSBoYW5kbGVycy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICovXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlci5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqICMjIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJcbiAqXG4gKiBUaGUgRXBpY2VudGVyIHBsYXRmb3JtIHByb3ZpZGVzIGEgcHVzaCBjaGFubmVsLCB3aGljaCBhbGxvd3MgeW91IHRvIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSB0byBtZXNzYWdlcyB3aXRoaW4gYSBbcHJvamVjdF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3Byb2plY3RzKSwgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3IgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICpcbiAqIDxhIG5hbWU9XCJiYWNrZ3JvdW5kXCI+PC9hPlxuICogIyMjIENoYW5uZWwgQmFja2dyb3VuZFxuICpcbiAqIENoYW5uZWwgbm90aWZpY2F0aW9ucyBhcmUgb25seSBhdmFpbGFibGUgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkuIFRoZXJlIGFyZSB0d28gbWFpbiB1c2UgY2FzZXMgZm9yIHRoZSBwdXNoIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogIyMjIyBFdmVudCBOb3RpZmljYXRpb25zXG4gKlxuICogV2l0aGluIGEgW211bHRpcGxheWVyIHNpbXVsYXRpb24gb3Igd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCksIGl0IGlzIG9mdGVuIHVzZWZ1bCBmb3IgeW91ciBwcm9qZWN0J3MgW21vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSB0byBhbGVydCB0aGUgW3VzZXIgaW50ZXJmYWNlIChicm93c2VyKV0oLi4vLi4vLi4vY3JlYXRpbmdfeW91cl9pbnRlcmZhY2UvKSB0aGF0IHNvbWV0aGluZyBuZXcgaGFzIGhhcHBlbmVkLlxuICpcbiAqIFVzdWFsbHksIHRoaXMgXCJzb21ldGhpbmcgbmV3XCIgaXMgYW4gZXZlbnQgd2l0aGluIHRoZSBwcm9qZWN0LCBncm91cCwgb3Igd29ybGQsIHN1Y2ggYXM6XG4gKlxuICogKiBBbiBlbmQgdXNlciBjb21lcyBvbmxpbmUgKGxvZ3MgaW4pIG9yIGdvZXMgb2ZmbGluZS4gKFRoaXMgaXMgZXNwZWNpYWxseSBpbnRlcmVzdGluZyBpbiBhIG11bHRpcGxheWVyIHdvcmxkOyBvbmx5IGF2YWlsYWJsZSBpZiB5b3UgaGF2ZSBbZW5hYmxlZCBhdXRob3JpemF0aW9uXSguLi8uLi8uLi91cGRhdGluZ195b3VyX3NldHRpbmdzLyNnZW5lcmFsLXNldHRpbmdzKSBmb3IgdGhlIGNoYW5uZWwuKVxuICogKiBBbiBlbmQgdXNlciBpcyBhc3NpZ25lZCB0byBhIHdvcmxkLlxuICogKiBBbiBlbmQgdXNlciB1cGRhdGVzIGEgdmFyaWFibGUgLyBtYWtlcyBhIGRlY2lzaW9uLlxuICogKiBBbiBlbmQgdXNlciBjcmVhdGVzIG9yIHVwZGF0ZXMgZGF0YSBzdG9yZWQgaW4gdGhlIFtEYXRhIEFQSV0oLi4vZGF0YS1hcGktc2VydmljZS8pLlxuICogKiBBbiBvcGVyYXRpb24gKG1ldGhvZCkgaXMgY2FsbGVkLiAoVGhpcyBpcyBlc3BlY2lhbGx5IGludGVyZXN0aW5nIGlmIHRoZSBtb2RlbCBpcyBhZHZhbmNlZCwgZm9yIGluc3RhbmNlLCB0aGUgVmVuc2ltIGBzdGVwYCBvcGVyYXRpb24gaXMgY2FsbGVkLilcbiAqXG4gKiBXaGVuIHRoZXNlIGV2ZW50cyBvY2N1ciwgeW91IG9mdGVuIHdhbnQgdG8gaGF2ZSB0aGUgdXNlciBpbnRlcmZhY2UgZm9yIG9uZSBvciBtb3JlIGVuZCB1c2VycyBhdXRvbWF0aWNhbGx5IHVwZGF0ZSB3aXRoIG5ldyBpbmZvcm1hdGlvbi5cbiAqXG4gKiAjIyMjIENoYXQgTWVzc2FnZXNcbiAqXG4gKiBBbm90aGVyIHJlYXNvbiB0byB1c2UgdGhlIHB1c2ggY2hhbm5lbCBpcyB0byBhbGxvdyBwbGF5ZXJzIChlbmQgdXNlcnMpIHRvIHNlbmQgY2hhdCBtZXNzYWdlcyB0byBvdGhlciBwbGF5ZXJzLCBhbmQgdG8gaGF2ZSB0aG9zZSBtZXNzYWdlcyBhcHBlYXIgaW1tZWRpYXRlbHkuXG4gKlxuICogIyMjIyBHZXR0aW5nIFN0YXJ0ZWRcbiAqXG4gKiBGb3IgYm90aCB0aGUgZXZlbnQgbm90aWZpY2F0aW9uIGFuZCBjaGF0IG1lc3NhZ2UgdXNlIGNhc2VzOlxuICpcbiAqICogRmlyc3QsIGVuYWJsZSBjaGFubmVsIG5vdGlmaWNhdGlvbnMgZm9yIHlvdXIgcHJvamVjdC5cbiAqICAgICAgKiBDaGFubmVsIG5vdGlmaWNhdGlvbnMgYXJlIG9ubHkgYXZhaWxhYmxlIGZvciBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pLiBUbyBlbmFibGUgbm90aWZpY2F0aW9ucyBmb3IgeW91ciBwcm9qZWN0LCBbdXBkYXRlIHlvdXIgcHJvamVjdCBzZXR0aW5nc10oLi4vLi4vLi4vdXBkYXRpbmdfeW91cl9zZXR0aW5ncy8jZ2VuZXJhbC1zZXR0aW5ncykgdG8gdHVybiBvbiB0aGUgKipQdXNoIENoYW5uZWwqKiBzZXR0aW5nLCBhbmQgb3B0aW9uYWxseSByZXF1aXJlIGF1dGhvcml6YXRpb24gZm9yIHRoZSBjaGFubmVsLlxuICogKiBUaGVuLCBpbnN0YW50aWF0ZSBhbiBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyLlxuICogKiBOZXh0LCBnZXQgdGhlIGNoYW5uZWwgd2l0aCB0aGUgc2NvcGUgeW91IHdhbnQgKHVzZXIsIHdvcmxkLCBncm91cCwgZGF0YSkuXG4gKiAqIEZpbmFsbHksIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIG9mIHRob3NlIGxhc3QgdGhyZWUgc3RlcHMgKGluc3RhbnRpYXRlLCBnZXQgY2hhbm5lbCwgc3Vic2NyaWJlKTpcbiAqXG4gKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgIHZhciBnYyA9IGNtLmdldEdyb3VwQ2hhbm5lbCgpO1xuICogICAgIGdjLnN1YnNjcmliZSgnJywgZnVuY3Rpb24oZGF0YSkgeyBjb25zb2xlLmxvZyhkYXRhKTsgfSk7XG4gKiAgICAgZ2MucHVibGlzaCgnJywgeyBtZXNzYWdlOiAnYSBuZXcgbWVzc2FnZSB0byB0aGUgZ3JvdXAnIH0pO1xuICpcbiAqIEZvciBhIG1vcmUgZGV0YWlsZWQgZXhhbXBsZSwgc2VlIGEgW2NvbXBsZXRlIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSBleGFtcGxlXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8jZXBpanMtZXhhbXBsZSkuXG4gKlxuICogRm9yIGRldGFpbHMgb24gd2hhdCBkYXRhIGlzIHB1Ymxpc2hlZCBhdXRvbWF0aWNhbGx5IHRvIHdoaWNoIGNoYW5uZWxzLCBzZWUgW0F1dG9tYXRpYyBQdWJsaXNoaW5nIG9mIEV2ZW50c10oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvI3B1Ymxpc2gtbWVzc2FnZS1hdXRvKS5cbiAqXG4gKiAjIyMjIENyZWF0aW5nIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJcbiAqXG4gKiBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgYXJvdW5kIHRoZSAobW9yZSBnZW5lcmljKSBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSwgdG8gaW5zdGFudGlhdGUgaXQgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuIElmIHlvdSBhcmUgaW50ZXJlc3RlZCBpbiBpbmNsdWRpbmcgYSBub3RpZmljYXRpb24gb3IgY2hhdCBmZWF0dXJlIGluIHlvdXIgcHJvamVjdCwgdXNpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gZ2V0IHN0YXJ0ZWQuXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlci4gU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuXG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpbmNsdWRlOlxuICpcbiAqICogYG9wdGlvbnNgIE9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIEVwaWNlbnRlciBwcm9qZWN0IGZvciB0aGlzIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaW5zdGFuY2UuXG4gKiAqIGBvcHRpb25zLmFjY291bnRgIFRoZSBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBvcHRpb25zLnByb2plY3RgIEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICogKiBgb3B0aW9ucy51c2VyTmFtZWAgRXBpY2VudGVyIHVzZXJOYW1lIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICogKiBgb3B0aW9ucy51c2VySWRgIEVwaWNlbnRlciB1c2VyIGlkIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLiBPcHRpb25hbDsgYG9wdGlvbnMudXNlck5hbWVgIGlzIHByZWZlcnJlZC5cbiAqICogYG9wdGlvbnMudG9rZW5gIEVwaWNlbnRlciB0b2tlbiB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi4gKFlvdSBjYW4gcmV0cmlldmUgdGhpcyB1c2luZyBgYXV0aE1hbmFnZXIuZ2V0VG9rZW4oKWAgZnJvbSB0aGUgW0F1dGhvcml6YXRpb24gTWFuYWdlcl0oLi4vYXV0aC1tYW5hZ2VyLykuKVxuICogKiBgb3B0aW9ucy5hbGxvd0FsbENoYW5uZWxzYCBJZiBub3QgaW5jbHVkZWQgb3IgaWYgc2V0IHRvIGBmYWxzZWAsIGFsbCBjaGFubmVsIHBhdGhzIGFyZSB2YWxpZGF0ZWQ7IGlmIHlvdXIgcHJvamVjdCByZXF1aXJlcyBbUHVzaCBDaGFubmVsIEF1dGhvcml6YXRpb25dKC4uLy4uLy4uL3VwZGF0aW5nX3lvdXJfc2V0dGluZ3MvKSwgeW91IHNob3VsZCB1c2UgdGhpcyBvcHRpb24uIElmIHlvdSB3YW50IHRvIGFsbG93IG90aGVyIGNoYW5uZWwgcGF0aHMsIHNldCB0byBgdHJ1ZWA7IHRoaXMgaXMgbm90IGNvbW1vbi5cbiAqL1xuXG52YXIgQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL2NoYW5uZWwtbWFuYWdlcicpO1xudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBXb3JsZFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyJyk7XG52YXIgUHJlc2VuY2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9wcmVzZW5jZS1hcGktc2VydmljZScpO1xuXG52YXIgdmFsaWRUeXBlcyA9IHtcbiAgICBwcm9qZWN0OiB0cnVlLFxuICAgIGdyb3VwOiB0cnVlLFxuICAgIHdvcmxkOiB0cnVlLFxuICAgIHVzZXI6IHRydWUsXG4gICAgZGF0YTogdHJ1ZSxcbiAgICBnZW5lcmFsOiB0cnVlLFxuICAgIGNoYXQ6IHRydWVcbn07XG52YXIgZ2V0RnJvbVNlc3Npb25PckVycm9yID0gZnVuY3Rpb24gKHZhbHVlLCBzZXNzaW9uS2V5TmFtZSwgc2V0dGluZ3MpIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncyAmJiBzZXR0aW5nc1tzZXNzaW9uS2V5TmFtZV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gc2V0dGluZ3Nbc2Vzc2lvbktleU5hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNlc3Npb25LZXlOYW1lICsgJyBub3QgZm91bmQuIFBsZWFzZSBsb2ctaW4gYWdhaW4sIG9yIHNwZWNpZnkgJyArIHNlc3Npb25LZXlOYW1lICsgJyBleHBsaWNpdGx5Jyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxudmFyIGlzUHJlc2VuY2VEYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICByZXR1cm4gcGF5bG9hZC5kYXRhICYmIHBheWxvYWQuZGF0YS50eXBlID09PSAndXNlcicgJiYgcGF5bG9hZC5kYXRhLnVzZXI7XG59O1xuXG52YXIgX19zdXBlciA9IENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZTtcbnZhciBFcGljZW50ZXJDaGFubmVsTWFuYWdlciA9IGNsYXNzRnJvbShDaGFubmVsTWFuYWdlciwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKG9wdGlvbnMpO1xuICAgICAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2UoZGVmYXVsdENvbWV0T3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICAgICAgaWYgKCFkZWZhdWx0Q29tZXRPcHRpb25zLnVybCkge1xuICAgICAgICAgICAgZGVmYXVsdENvbWV0T3B0aW9ucy51cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgnY2hhbm5lbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlZmF1bHRDb21ldE9wdGlvbnMuaGFuZHNoYWtlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciB1c2VyTmFtZSA9IGRlZmF1bHRDb21ldE9wdGlvbnMudXNlck5hbWU7XG4gICAgICAgICAgICB2YXIgdXNlcklkID0gZGVmYXVsdENvbWV0T3B0aW9ucy51c2VySWQ7XG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBkZWZhdWx0Q29tZXRPcHRpb25zLnRva2VuO1xuICAgICAgICAgICAgaWYgKCh1c2VyTmFtZSB8fCB1c2VySWQpICYmIHRva2VuKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJQcm9wID0gdXNlck5hbWUgPyAndXNlck5hbWUnIDogJ3VzZXJJZCc7XG4gICAgICAgICAgICAgICAgdmFyIGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW5cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGV4dFt1c2VyUHJvcF0gPSB1c2VyTmFtZSA/IHVzZXJOYW1lIDogdXNlcklkO1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdENvbWV0T3B0aW9ucy5oYW5kc2hha2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dDogZXh0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRDb21ldE9wdGlvbnM7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZGVmYXVsdENvbWV0T3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBjaGFubmVsLCB0aGF0IGlzLCBhbiBpbnN0YW5jZSBvZiBhIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgZW5mb3JjZXMgRXBpY2VudGVyLXNwZWNpZmljIGNoYW5uZWwgbmFtaW5nOiBhbGwgY2hhbm5lbHMgcmVxdWVzdGVkIG11c3QgYmUgaW4gdGhlIGZvcm0gYC97dHlwZX0ve2FjY291bnQgaWR9L3twcm9qZWN0IGlkfS97Li4ufWAsIHdoZXJlIGB0eXBlYCBpcyBvbmUgb2YgYHJ1bmAsIGBkYXRhYCwgYHVzZXJgLCBgd29ybGRgLCBvciBgY2hhdGAuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgICB2YXIgY2hhbm5lbCA9IGNtLmdldENoYW5uZWwoJy9ncm91cC9hY21lL3N1cHBseS1jaGFpbi1nYW1lLycpO1xuICAgICAqXG4gICAgICogICAgICBjaGFubmVsLnN1YnNjcmliZSgndG9waWMnLCBjYWxsYmFjayk7XG4gICAgICogICAgICBjaGFubmVsLnB1Ymxpc2goJ3RvcGljJywgeyBteURhdGE6IDEwMCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBvcHRpb25zIChPcHRpb25hbCkgSWYgc3RyaW5nLCBhc3N1bWVkIHRvIGJlIHRoZSBiYXNlIGNoYW5uZWwgdXJsLiBJZiBvYmplY3QsIGFzc3VtZWQgdG8gYmUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgY29uc3RydWN0b3IuXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldENoYW5uZWw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBiYXNlOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBjaGFubmVsT3B0cyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgYmFzZSA9IGNoYW5uZWxPcHRzLmJhc2U7XG4gICAgICAgIGlmICghYmFzZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBiYXNlIHRvcGljIHdhcyBwcm92aWRlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaGFubmVsT3B0cy5hbGxvd0FsbENoYW5uZWxzKSB7XG4gICAgICAgICAgICB2YXIgYmFzZVBhcnRzID0gYmFzZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgdmFyIGNoYW5uZWxUeXBlID0gYmFzZVBhcnRzWzFdO1xuICAgICAgICAgICAgaWYgKGJhc2VQYXJ0cy5sZW5ndGggPCA0KSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsIGJhc2UgbmFtZSwgaXQgbXVzdCBiZSBpbiB0aGUgZm9ybSAve3R5cGV9L3thY2NvdW50IGlkfS97cHJvamVjdCBpZH0vey4uLn0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdmFsaWRUeXBlc1tjaGFubmVsVHlwZV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hhbm5lbCB0eXBlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuZ2V0Q2hhbm5lbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKS4gVGhlIGdyb3VwIG11c3QgZXhpc3QgaW4gdGhlIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0IHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIG5vIG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsOyBhbGwgbWVzc2FnZXMgYXJlIHVzZXItb3JpZ2luYXRlZC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAgICAgKiAgICAgZ2Muc3Vic2NyaWJlKCdicm9hZGNhc3RzJywgY2FsbGJhY2spO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIEdyb3VwIHRvIGJyb2FkY2FzdCB0by4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldEdyb3VwQ2hhbm5lbDogZnVuY3Rpb24gKGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvZ3JvdXAnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWVdLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICAgICAgdmFyIG9sZHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tXaXRob3V0UHJlc2VuY2VEYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzUHJlc2VuY2VEYXRhKHBheWxvYWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBvbGRzdWJzLmNhbGwoY2hhbm5lbCwgdG9waWMsIGNhbGxiYWNrV2l0aG91dFByZXNlbmNlRGF0YSwgY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICogICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAgICAgKiAgICAgICAgIHJ1bjogeyBtb2RlbDogJ21vZGVsLmVxbicgfVxuICAgICAqICAgICB9KTtcbiAgICAgKiAgICAgd29ybGRNYW5hZ2VyLmdldEN1cnJlbnRXb3JsZCgpLnRoZW4oZnVuY3Rpb24gKHdvcmxkT2JqZWN0LCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgKiAgICAgICAgIHZhciB3b3JsZENoYW5uZWwgPSBjbS5nZXRXb3JsZENoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgd29ybGRDaGFubmVsLnN1YnNjcmliZSgnJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgKiAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKiAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IHdvcmxkIFRoZSB3b3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0V29ybGRDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcblxuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvd29ybGQnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWRdLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICAgICAgdmFyIG9sZHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXRvcGljKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9sZHN1YnMuY2FsbChjaGFubmVsLCB0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgaW5jbHVkZU1pbmU6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgdG9waWNBbGlhc2VzID0ge1xuICAgICAgICAgICAgICAgIHJlc2V0OiBbJ25ldyddLFxuICAgICAgICAgICAgICAgIHJvbGVzOiBbJ2Fzc2lnbicsICd1bmFzc2lnbicsICdhc3NpZ25jaGFuZ2UnXSxcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBbJ29wZXJhdGlvbiddLFxuICAgICAgICAgICAgICAgIHByZXNlbmNlOiBbJ2Nvbm5lY3QnLCAnZGlzY29ubmVjdCddLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0b3BpYyA9PT0gJ3ByZXNlbmNlJykge1xuICAgICAgICAgICAgICAgIHZhciB3bSA9IG5ldyBXb3JsZFNlcnZpY2UoeyBcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudDogYWNjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiB3b3JsZGlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHByZXMgPSBuZXcgUHJlc2VuY2VTZXJ2aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudDogYWNjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRMb2FkUHJvbWlzZSA9IHdtLmxvYWQoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJlc2VuY2VMb2FkUHJvbWlzZSA9IHByZXMuZ2V0U3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgLy9GSVhNRTogQ2FjaGUgcHJvbWlzZVxuICAgICAgICAgICAgICAgICQud2hlbih3b3JsZExvYWRQcm9taXNlLCBwcmVzZW5jZUxvYWRQcm9taXNlKS50aGVuKGZ1bmN0aW9uICh3b3JsZFJlcywgcHJlc2VuY2VSZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdvcmxkID0gd29ybGRSZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmVzZW5jZUxpc3QgPSBwcmVzZW5jZVJlc1swXTtcblxuICAgICAgICAgICAgICAgICAgICB3b3JsZC51c2Vycy5mb3JFYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSB1c2VyLnVzZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ1N0YXR1cyA9ICQuZ3JlcChwcmVzZW5jZUxpc3QgfHwgW10sIGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhdHVzLnVzZXJJZCA9PT0gaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ1N0YXR1c1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmYWtlTWV0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbDogYmFzZVRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncHJlc2VuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJUeXBlOiAnY29ubmVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3ByZXNlbmNlQVBJJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmYWtlVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudDogYWNjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc09ubGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE5hbWU6IHVzZXIubGFzdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJOYW1lOiB1c2VyLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFrZVVzZXIsIGZha2VNZXRhKTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBmaWx0ZXJCeVR5cGUgPSBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YlR5cGUgPSByZXMuZGF0YS5zdWJUeXBlO1xuICAgICAgICAgICAgICAgIHZhciB0b3BpY01hdGNoID0gc3ViVHlwZSA9PT0gdG9waWMgfHwgKHRvcGljQWxpYXNlc1t0b3BpY10gJiYgdG9waWNBbGlhc2VzW3RvcGljXS5pbmRleE9mKHN1YlR5cGUpICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgdmFyIG5vdGlmaWNhdGlvbkZyb20gPSByZXMuZGF0YS51c2VyIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gcmVzLmRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAodG9waWMgPT09ICdyZXNldCcpIHtcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uRnJvbSA9IHBheWxvYWQucnVuLnVzZXI7IC8vcmVzZXQgZG9lc24ndCBnaXZlIGJhY2sgdXNlciBpbmZvIG90aGVyd2lzZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpc01pbmUgPSBzZXNzaW9uLnVzZXJJZCA9PT0gbm90aWZpY2F0aW9uRnJvbS5pZDtcbiAgICAgICAgICAgICAgICB2YXIgaW5pdGlhdG9yTWF0Y2ggPSBpc01pbmUgJiYgb3B0cy5pbmNsdWRlTWluZSB8fCAhaXNNaW5lO1xuICAgICAgICAgICAgICAgIGlmICh0b3BpY01hdGNoICYmIGluaXRpYXRvck1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtZXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogcmVzLmRhdGEudXNlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHJlcy5kYXRhLmRhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsOiByZXMuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViVHlwZTogc3ViVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvcGljID09PSAndmFyaWFibGVzJyB8fCB0b3BpYyA9PT0gJ29wZXJhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhwYXlsb2FkW3RvcGljXSwgbWV0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3ViVHlwZSA9PT0gJ25ldycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhwYXlsb2FkLnJ1biwgbWV0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodG9waWMgPT09ICdyb2xlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vRklYTUU6IHRoaXMgZG9lc24ndCB3b3JrXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socGF5bG9hZC51c2VyLCBtZXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0b3BpYyA9PT0gJ3ByZXNlbmNlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXIgPSByZXMuZGF0YS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlci5pc09ubGluZSA9IHN1YlR5cGUgPT09ICdjb25uZWN0JztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh1c2VyLCBtZXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0b3BpYyA9PT0gJ3Jlc2V0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHBheWxvYWQsIG1ldGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHJlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBvbGRzdWJzLmNhbGwoY2hhbm5lbCwgJycsIGZpbHRlckJ5VHlwZSwgY29udGV4dCwgb3B0aW9ucyk7XG5cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBjdXJyZW50IFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpbiB0aGF0IHVzZXIncyBjdXJyZW50IFt3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdHlwaWNhbGx5IHVzZWQgdG9nZXRoZXIgd2l0aCB0aGUgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIpLiBOb3RlIHRoYXQgdGhpcyBjaGFubmVsIG9ubHkgZ2V0cyBub3RpZmljYXRpb25zIGZvciB3b3JsZHMgY3VycmVudGx5IGluIG1lbW9yeS4gKFNlZSBtb3JlIGJhY2tncm91bmQgb24gW3BlcnNpc3RlbmNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UpLilcbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgd29ybGRNYW5hZ2VyID0gbmV3IEYubWFuYWdlci5Xb3JsZE1hbmFnZXIoe1xuICAgICAqICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAqICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgKiAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAqICAgICAgICAgcnVuOiB7IG1vZGVsOiAnbW9kZWwuZXFuJyB9XG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkQWRhcHRlcikge1xuICAgICAqICAgICAgICAgdmFyIHVzZXJDaGFubmVsID0gY20uZ2V0VXNlckNoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgdXNlckNoYW5uZWwuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCBXb3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gdXNlciAoT3B0aW9uYWwpIFVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldFVzZXJDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIHVzZXIsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgdXNlcmlkID0gKCQuaXNQbGFpbk9iamVjdCh1c2VyKSAmJiB1c2VyLmlkKSA/IHVzZXIuaWQgOiB1c2VyO1xuICAgICAgICB1c2VyaWQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IodXNlcmlkLCAndXNlcklkJywgc2Vzc2lvbik7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3VzZXInLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWQsIHVzZXJpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgdGhhdCBhdXRvbWF0aWNhbGx5IHRyYWNrcyB0aGUgcHJlc2VuY2Ugb2YgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGF0IGlzLCB3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBjdXJyZW50bHkgb25saW5lIGluIHRoaXMgZ3JvdXAuIE5vdGlmaWNhdGlvbnMgYXJlIGF1dG9tYXRpY2FsbHkgc2VudCB3aGVuIHRoZSBlbmQgdXNlciBjb21lcyBvbmxpbmUsIGFuZCB3aGVuIHRoZSBlbmQgdXNlciBnb2VzIG9mZmxpbmUgKG5vdCBwcmVzZW50IGZvciBtb3JlIHRoYW4gMiBtaW51dGVzKS4gVXNlZnVsIGluIG11bHRpcGxheWVyIGdhbWVzIGZvciBsZXR0aW5nIGVhY2ggZW5kIHVzZXIga25vdyB3aGV0aGVyIG90aGVyIHVzZXJzIGluIHRoZWlyIGdyb3VwIGFyZSBhbHNvIG9ubGluZS5cbiAgICAgKlxuICAgICAqIE5vdGUgdGhhdCB0aGUgcHJlc2VuY2UgY2hhbm5lbCBpcyB0cmFja2luZyBhbGwgZW5kIHVzZXJzIGluIGEgZ3JvdXAuIEluIHBhcnRpY3VsYXIsIGlmIHRoZSBwcm9qZWN0IGFkZGl0aW9uYWxseSBzcGxpdHMgZWFjaCBncm91cCBpbnRvIFt3b3JsZHNdKC4uL3dvcmxkLW1hbmFnZXIvKSwgdGhpcyBjaGFubmVsIGNvbnRpbnVlcyB0byBzaG93IG5vdGlmaWNhdGlvbnMgZm9yIGFsbCBlbmQgdXNlcnMgaW4gdGhlIGdyb3VwIChub3QgcmVzdHJpY3RlZCBieSB3b3JsZHMpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBwYyA9IGNtLmdldFByZXNlbmNlQ2hhbm5lbCgpO1xuICAgICAqICAgICBwYy5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICogICAgICAgICAgLy8gJ2RhdGEnIGlzIHRoZSBlbnRpcmUgbWVzc2FnZSBvYmplY3QgdG8gdGhlIGNoYW5uZWw7XG4gICAgICogICAgICAgICAgLy8gcGFyc2UgZm9yIGluZm9ybWF0aW9uIG9mIGludGVyZXN0XG4gICAgICogICAgICAgICAgaWYgKGRhdGEuZGF0YS5zdWJUeXBlID09PSAnZGlzY29ubmVjdCcpIHtcbiAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyICcsIGRhdGEuZGF0YS51c2VyLnVzZXJOYW1lLCAnZGlzY29ubmVjdGVkIGF0ICcsIGRhdGEuZGF0YS5kYXRlKTtcbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgICAgICAgaWYgKGRhdGEuZGF0YS5zdWJUeXBlID09PSAnY29ubmVjdCcpIHtcbiAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyICcsIGRhdGEuZGF0YS51c2VyLnVzZXJOYW1lLCAnY29ubmVjdGVkIGF0ICcsIGRhdGEuZGF0YS5kYXRlKTtcbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgIH0pO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdGhlIGVuZCB1c2VyIGlzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0UHJlc2VuY2VDaGFubmVsOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50Jywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHNlc3Npb24pO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9ncm91cCcsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZV0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuICAgICAgICB2YXIgb2xkc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja1dpdGhPbmx5UHJlc2VuY2VEYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNQcmVzZW5jZURhdGEocGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG9sZHN1YnMuY2FsbChjaGFubmVsLCB0b3BpYywgY2FsbGJhY2tXaXRoT25seVByZXNlbmNlRGF0YSwgY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gY29sbGVjdGlvbi4gKFRoZSBjb2xsZWN0aW9uIG5hbWUgaXMgc3BlY2lmaWVkIGluIHRoZSBgcm9vdGAgYXJndW1lbnQgd2hlbiB0aGUgW0RhdGEgU2VydmljZV0oLi4vZGF0YS1hcGktc2VydmljZS8pIGlzIGluc3RhbnRpYXRlZC4pIE11c3QgYmUgb25lIG9mIHRoZSBjb2xsZWN0aW9ucyBpbiB0aGlzIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0LlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIGF1dG9tYXRpYyBub3RpZmljYXRpb25zIGZyb20gRXBpY2VudGVyIG9uIHRoaXMgY2hhbm5lbCB3aGVuIGRhdGEgaXMgY3JlYXRlZCwgdXBkYXRlZCwgb3IgZGVsZXRlZCBpbiB0aGlzIGNvbGxlY3Rpb24uIFNlZSBtb3JlIG9uIFthdXRvbWF0aWMgbWVzc2FnZXMgdG8gdGhlIGRhdGEgY2hhbm5lbF0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvI2RhdGEtbWVzc2FnZXMpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBkYyA9IGNtLmdldERhdGFDaGFubmVsKCdzdXJ2ZXktcmVzcG9uc2VzJyk7XG4gICAgICogICAgIGRjLnN1YnNjcmliZSgnJywgZnVuY3Rpb24oZGF0YSwgbWV0YSkge1xuICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gbWV0YS5kYXRlIGlzIHRpbWUgb2YgY2hhbmdlLFxuICAgICAqICAgICAgICAgIC8vIG1ldGEuc3ViVHlwZSBpcyB0aGUga2luZCBvZiBjaGFuZ2U6IG5ldywgdXBkYXRlLCBvciBkZWxldGVcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLnBhdGggaXMgdGhlIGZ1bGwgcGF0aCB0byB0aGUgY2hhbmdlZCBkYXRhXG4gICAgICogICAgICAgICAgY29uc29sZS5sb2cobWV0YSk7XG4gICAgICogICAgIH0pO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGNvbGxlY3Rpb24gTmFtZSBvZiBjb2xsZWN0aW9uIHdob3NlIGF1dG9tYXRpYyBub3RpZmljYXRpb25zIHlvdSB3YW50IHRvIHJlY2VpdmUuXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldERhdGFDaGFubmVsOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSBjb2xsZWN0aW9uIHRvIGxpc3RlbiBvbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL2RhdGEnLCBhY2NvdW50LCBwcm9qZWN0LCBjb2xsZWN0aW9uXS5qb2luKCcvJyk7XG4gICAgICAgIHZhciBjaGFubmVsID0gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG5cbiAgICAgICAgLy9UT0RPOiBGaXggYWZ0ZXIgRXBpY2VudGVyIGJ1ZyBpcyByZXNvbHZlZFxuICAgICAgICB2YXIgb2xkc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja1dpdGhDbGVhbkRhdGEgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIHZhciBtZXRhID0ge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXlsb2FkLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgICAgIHN1YlR5cGU6IHBheWxvYWQuZGF0YS5zdWJUeXBlLFxuICAgICAgICAgICAgICAgICAgICBkYXRlOiBwYXlsb2FkLmRhdGEuZGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVBhdGg6IHBheWxvYWQuZGF0YS5kYXRhLnBhdGgsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsRGF0YSA9IHBheWxvYWQuZGF0YS5kYXRhO1xuICAgICAgICAgICAgICAgIGlmIChhY3R1YWxEYXRhLmRhdGEgIT09IHVuZGVmaW5lZCkgeyAvL0RlbGV0ZSBub3RpZmljYXRpb25zIGFyZSBvbmUgZGF0YS1sZXZlbCBiZWhpbmQgb2YgY291cnNlXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbERhdGEgPSBhY3R1YWxEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBhY3R1YWxEYXRhLCBtZXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhDbGVhbkRhdGEsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUElfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXJqcy5zZXNzaW9uJyxcbiAgICBTVFJBVEVHWV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07IiwiLyoqXG4qICMjIFJ1biBNYW5hZ2VyXG4qXG4qIFRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgYWNjZXNzIHRvIHJ1bnMgZm9yIHlvdXIgcHJvamVjdC4gVGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgYW5kIHVwZGF0ZSB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLiBBZGRpdGlvbmFsbHksIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy4gU3BlY2lmaWNhbGx5LCB5b3UgY2FuIHNlbGVjdCBbcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKV0oLi4vc3RyYXRlZ2llcy8pIGZvciB3aGljaCBydW5zIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3Qgd29yayB3aXRoIHdoZW4gdGhleSBsb2cgaW4gdG8geW91ciBwcm9qZWN0LlxuKlxuKiBUaGVyZSBhcmUgbWFueSB3YXlzIHRvIGNyZWF0ZSBuZXcgcnVucywgaW5jbHVkaW5nIHRoZSBFcGljZW50ZXIuanMgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBhbmQgdGhlIFJFU0ZUZnVsIFtSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkpLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sOiB5b3VyIGNhbGwgdG8gYGdldFJ1bigpYCwgcmF0aGVyIHRoYW4gYWx3YXlzIHJldHVybmluZyBhIG5ldyBydW4sIHJldHVybnMgYSBydW4gYmFzZWQgb24gdGhlIHN0cmF0ZWd5IHlvdSd2ZSBzcGVjaWZpZWQuXG4qXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gY3JlYXRlIGFuZCBhY2Nlc3MgcnVuc1xuKlxuKiBUbyB1c2UgdGhlIFJ1biBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCBieSBwYXNzaW5nIGluOlxuKlxuKiAgICogYHJ1bmA6IChyZXF1aXJlZCkgUnVuIG9iamVjdC4gTXVzdCBjb250YWluOlxuKiAgICAgICAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICAgICAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4qICAgICAgICogYG1vZGVsYDogVGhlIG5hbWUgb2YgeW91ciBwcmltYXJ5IG1vZGVsIGZpbGUuIChTZWUgbW9yZSBvbiBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4pXG4qICAgICAgICogYHNjb3BlYDogKG9wdGlvbmFsKSBTY29wZSBvYmplY3QgZm9yIHRoZSBydW4sIGZvciBleGFtcGxlIGBzY29wZS5ncm91cGAgd2l0aCB2YWx1ZSBvZiB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAuXG4qICAgICAgICogYHNlcnZlcmA6IChvcHRpb25hbCkgQW4gb2JqZWN0IHdpdGggb25lIGZpZWxkLCBgaG9zdGAuIFRoZSB2YWx1ZSBvZiBgaG9zdGAgaXMgdGhlIHN0cmluZyBgYXBpLmZvcmlvLmNvbWAsIHRoZSBVUkkgb2YgdGhlIEZvcmlvIHNlcnZlci4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCwgYnV0IHlvdSBjYW4gcGFzcyBpdCBleHBsaWNpdGx5IGlmIGRlc2lyZWQuIEl0IGlzIG1vc3QgY29tbW9ubHkgdXNlZCBmb3IgY2xhcml0eSB3aGVuIHlvdSBhcmUgW2hvc3RpbmcgYW4gRXBpY2VudGVyIHByb2plY3Qgb24geW91ciBvd24gc2VydmVyXSguLi8uLi8uLi9ob3dfdG8vc2VsZl9ob3N0aW5nLykuXG4qICAgICAgICogYGZpbGVzYDogKG9wdGlvbmFsKSBJZiBhbmQgb25seSBpZiB5b3UgYXJlIHVzaW5nIGEgVmVuc2ltIG1vZGVsIGFuZCB5b3UgaGF2ZSBhZGRpdGlvbmFsIGRhdGEgdG8gcGFzcyBpbiB0byB5b3VyIG1vZGVsLCB5b3UgY2FuIG9wdGlvbmFsbHkgcGFzcyBhIGBmaWxlc2Agb2JqZWN0IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBmaWxlcywgZm9yIGV4YW1wbGU6IGBcImZpbGVzXCI6IHtcImRhdGFcIjogXCJteUV4dHJhRGF0YS54bHNcIn1gLiAoU2VlIG1vcmUgb24gW1VzaW5nIEV4dGVybmFsIERhdGEgaW4gVmVuc2ltXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS92ZW5zaW1fZXhhbXBsZV94bHMvKS4pXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBUaGlzIGlzICpvcHRpb25hbCo7IGJ5IGRlZmF1bHQsIHRoZSBSdW4gTWFuYWdlciBzZWxlY3RzIGByZXVzZS1wZXItc2Vzc2lvbmAsIG9yIGByZXVzZS1sYXN0LWluaXRpYWxpemVkYCBpZiB5b3UgYWxzbyBwYXNzIGluIGFuIGluaXRpYWwgb3BlcmF0aW9uLiBTZWUgW2JlbG93XSgjdXNpbmctdGhlLXJ1bi1tYW5hZ2VyLXRvLWFjY2Vzcy1hbmQtcmVnaXN0ZXItc3RyYXRlZ2llcykgZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gc3RyYXRlZ2llcy5cbipcbiogICAqIGBzdHJhdGVneU9wdGlvbnNgOiAob3B0aW9uYWwpIEFkZGl0aW9uYWwgb3B0aW9ucyBwYXNzZWQgZGlyZWN0bHkgdG8gdGhlIFtydW4gY3JlYXRpb24gc3RyYXRlZ3ldKC4uL3N0cmF0ZWdpZXMvKS5cbipcbiogICAqIGBzZXNzaW9uS2V5YDogKG9wdGlvbmFsKSBOYW1lIG9mIGJyb3dzZXIgY29va2llIGluIHdoaWNoIHRvIHN0b3JlIHJ1biBpbmZvcm1hdGlvbiwgaW5jbHVkaW5nIHJ1biBpZC4gTWFueSBjb25kaXRpb25hbCBzdHJhdGVnaWVzLCBpbmNsdWRpbmcgdGhlIHByb3ZpZGVkIHN0cmF0ZWdpZXMsIHJlbHkgb24gdGhpcyBicm93c2VyIGNvb2tpZSB0byBzdG9yZSB0aGUgcnVuIGlkIGFuZCBoZWxwIG1ha2UgdGhlIGRlY2lzaW9uIG9mIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lLiBUaGUgbmFtZSBvZiB0aGlzIGNvb2tpZSBkZWZhdWx0cyB0byBgZXBpY2VudGVyLXNjZW5hcmlvYCBhbmQgY2FuIGJlIHNldCB3aXRoIHRoZSBgc2Vzc2lvbktleWAgcGFyYW1ldGVyLiBUaGlzIGNhbiBhbHNvIGJlIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHN0cmluZywgaWYgeW91J2QgbGlrZSB0byBjb250cm9sIHRoaXMgYXQgcnVudGltZS5cbipcbipcbiogQWZ0ZXIgaW5zdGFudGlhdGluZyBhIFJ1biBNYW5hZ2VyLCBtYWtlIGEgY2FsbCB0byBgZ2V0UnVuKClgIHdoZW5ldmVyIHlvdSBuZWVkIHRvIGFjY2VzcyBhIHJ1biBmb3IgdGhpcyBlbmQgdXNlci4gVGhlIGBSdW5NYW5hZ2VyLnJ1bmAgY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBbUnVuIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLiBUaGUgUnVuIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBhY2Nlc3MgdmFyaWFibGVzLCBjYWxsIG9wZXJhdGlvbnMsIGV0Yy5cbipcbiogKipFeGFtcGxlKipcbipcbiogICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiogICAgICAgICAgIHJ1bjoge1xuKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJyxcbiogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiogICAgICAgICAgIH0sXG4qICAgICAgICAgICBzdHJhdGVneTogJ3JldXNlLW5ldmVyJyxcbiogICAgICAgICAgIHNlc3Npb25LZXk6ICdlcGljZW50ZXItc2Vzc2lvbidcbiogICAgICAgfSk7XG4qICAgICAgIHJtLmdldFJ1bigpXG4qICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiogICAgICAgICAgICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIGdldFJ1bigpIGlzIGEgcnVuIG9iamVjdFxuKiAgICAgICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4qICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGFsc28gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiogICAgICAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4qICAgICAgIH0pXG4qXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gYWNjZXNzIGFuZCByZWdpc3RlciBzdHJhdGVnaWVzXG4qXG4qIFRoZSBgc3RyYXRlZ3lgIGZvciBhIFJ1biBNYW5hZ2VyIGRlc2NyaWJlcyB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4gYW5kIHdoZW4gdG8gcmV1c2UgYW4gZW5kIHVzZXIncyBleGlzdGluZyBydW4uIFRoZSBSdW4gTWFuYWdlciBpcyByZXNwb25zaWJsZSBmb3IgcGFzc2luZyBhIHN0cmF0ZWd5IGV2ZXJ5dGhpbmcgaXQgbWlnaHQgbmVlZCB0byBkZXRlcm1pbmUgdGhlICdjb3JyZWN0JyBydW4sIHRoYXQgaXMsIGhvdyB0byBmaW5kIHRoZSBiZXN0IGV4aXN0aW5nIHJ1biBhbmQgaG93IHRvIGRlY2lkZSB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4uXG4qXG4qIFRoZXJlIGFyZSBzZXZlcmFsIGNvbW1vbiBzdHJhdGVnaWVzIHByb3ZpZGVkIGFzIHBhcnQgb2YgRXBpY2VudGVyLmpzLCB3aGljaCB5b3UgY2FuIGxpc3QgYnkgYWNjZXNzaW5nIGBGLm1hbmFnZXIuUnVuTWFuYWdlci5zdHJhdGVnaWVzYC4gWW91IGNhbiBhbHNvIGNyZWF0ZSB5b3VyIG93biBzdHJhdGVnaWVzLCBhbmQgcmVnaXN0ZXIgdGhlbSB0byB1c2Ugd2l0aCBSdW4gTWFuYWdlcnMuIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pIGZvciBkZXRhaWxzLlxuKiBcbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBzdHJhdGVnaWVzID0gcmVxdWlyZSgnLi9ydW4tc3RyYXRlZ2llcycpO1xudmFyIHNwZWNpYWxPcGVyYXRpb25zID0gcmVxdWlyZSgnLi9zcGVjaWFsLW9wZXJhdGlvbnMnKTtcblxudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi9rZXktbmFtZXMnKTtcblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5mdW5jdGlvbiBzZXNzaW9uS2V5RnJvbU9wdGlvbnMob3B0aW9ucywgcnVuU2VydmljZSkge1xuICAgIHZhciBjb25maWcgPSBydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKTtcbiAgICB2YXIgc2Vzc2lvbktleSA9ICQuaXNGdW5jdGlvbihvcHRpb25zLnNlc3Npb25LZXkpID8gb3B0aW9ucy5zZXNzaW9uS2V5KGNvbmZpZykgOiBvcHRpb25zLnNlc3Npb25LZXk7XG4gICAgcmV0dXJuIHNlc3Npb25LZXk7XG59XG5cbmZ1bmN0aW9uIHNldFJ1bkluU2Vzc2lvbihzZXNzaW9uS2V5LCBydW4sIHNlc3Npb25NYW5hZ2VyKSB7XG4gICAgaWYgKHNlc3Npb25LZXkpIHtcbiAgICAgICAgZGVsZXRlIHJ1bi52YXJpYWJsZXM7XG4gICAgICAgIHNlc3Npb25NYW5hZ2VyLmdldFN0b3JlKCkuc2V0KHNlc3Npb25LZXksIEpTT04uc3RyaW5naWZ5KHJ1bikpO1xuICAgIH1cbn1cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHNlc3Npb25LZXk6IGZ1bmN0aW9uIChjb25maWcpIHsgXG4gICAgICAgIHZhciBiYXNlS2V5ID0ga2V5TmFtZXMuU1RSQVRFR1lfU0VTU0lPTl9LRVk7XG4gICAgICAgIHZhciBrZXkgPSBbJ2FjY291bnQnLCAncHJvamVjdCcsICdtb2RlbCddLnJlZHVjZShmdW5jdGlvbiAoYWNjdW0sIGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ1trZXldID8gYWNjdW0gKyAnLScgKyBjb25maWdba2V5XSA6IGFjY3VtOyBcbiAgICAgICAgfSwgYmFzZUtleSk7XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gUnVuTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICB0aGlzLnJ1biA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgfSBlbHNlIGlmICghdXRpbC5pc0VtcHR5KHRoaXMub3B0aW9ucy5ydW4pKSB7XG4gICAgICAgIHRoaXMucnVuID0gbmV3IFJ1blNlcnZpY2UodGhpcy5vcHRpb25zLnJ1bik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBydW4gb3B0aW9ucyBwYXNzZWQgdG8gUnVuTWFuYWdlcicpO1xuICAgIH1cbiAgICBwYXRjaFJ1blNlcnZpY2UodGhpcy5ydW4sIHRoaXMpO1xuXG4gICAgdGhpcy5zdHJhdGVneSA9IHN0cmF0ZWdpZXMuZ2V0QmVzdFN0cmF0ZWd5KHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xufVxuXG5SdW5NYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciB0aGUgJ2NvcnJlY3QnIHJ1bi4gVGhlIGNvcnJlY3QgcnVuIGlzIGRlZmluZWQgYnkgdGhlIHN0cmF0ZWd5LiBcbiAgICAgKlxuICAgICAqIEZvciBleGFtcGxlLCBpZiB0aGUgc3RyYXRlZ3kgaXMgYHJldXNlLW5ldmVyYCwgdGhlIGNhbGxcbiAgICAgKiB0byBgZ2V0UnVuKClgIGFsd2F5cyByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBydW47IGlmIHRoZSBzdHJhdGVneSBpcyBgcmV1c2UtcGVyLXNlc3Npb25gLFxuICAgICAqIGBnZXRSdW4oKWAgcmV0dXJucyB0aGUgcnVuIGN1cnJlbnRseSByZWZlcmVuY2VkIGluIHRoZSBicm93c2VyIGNvb2tpZSwgYW5kIGlmIHRoZXJlIGlzIG5vbmUsIGNyZWF0ZXMgYSBuZXcgcnVuLiBcbiAgICAgKiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKSBmb3IgbW9yZSBvbiBzdHJhdGVnaWVzLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLmdldFJ1bigpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogICAgICBybS5nZXRSdW4oWydzYW1wbGVfaW50J10pLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgLy8gYW4gb2JqZWN0IHdob3NlIGZpZWxkcyBhcmUgdGhlIG5hbWUgOiB2YWx1ZSBwYWlycyBvZiB0aGUgdmFyaWFibGVzIHBhc3NlZCB0byBnZXRSdW4oKVxuICAgICAqICAgICAgICAgY29uc29sZS5sb2cocnVuLnZhcmlhYmxlcyk7XG4gICAgICogICAgICAgICAvLyB0aGUgdmFsdWUgb2Ygc2FtcGxlX2ludFxuICAgICAqICAgICAgICAgY29uc29sZS5sb2cocnVuLnZhcmlhYmxlcy5zYW1wbGVfaW50KTsgXG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHZhcmlhYmxlcyAoT3B0aW9uYWwpIFRoZSBydW4gb2JqZWN0IGlzIHBvcHVsYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBtb2RlbCB2YXJpYWJsZXMsIGlmIHByb3ZpZGVkLiBOb3RlOiBgZ2V0UnVuKClgIGRvZXMgbm90IHRocm93IGFuIGVycm9yIGlmIHlvdSB0cnkgdG8gZ2V0IGEgdmFyaWFibGUgd2hpY2ggZG9lc24ndCBleGlzdC4gSW5zdGVhZCwgdGhlIHZhcmlhYmxlcyBsaXN0IGlzIGVtcHR5LCBhbmQgYW55IGVycm9ycyBhcmUgbG9nZ2VkIHRvIHRoZSBjb25zb2xlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgQ29uZmlndXJhdGlvbiBvcHRpb25zOyBwYXNzZWQgb24gdG8gW1J1blNlcnZpY2UjY3JlYXRlXSguLi9ydW4tYXBpLXNlcnZpY2UvI2NyZWF0ZSkgaWYgdGhlIHN0cmF0ZWd5IGRvZXMgY3JlYXRlIGEgbmV3IHJ1bi5cbiAgICAgKiBAcmV0dXJuIHskcHJvbWlzZX0gUHJvbWlzZSB0byBjb21wbGV0ZSB0aGUgY2FsbC5cbiAgICAgKi9cbiAgICBnZXRSdW46IGZ1bmN0aW9uICh2YXJpYWJsZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHNlc3Npb25TdG9yZSA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U3RvcmUoKTtcblxuICAgICAgICB2YXIgc2Vzc2lvbkNvbnRlbnRzID0gc2Vzc2lvblN0b3JlLmdldChzZXNzaW9uS2V5RnJvbU9wdGlvbnModGhpcy5vcHRpb25zLCBtZS5ydW4pKTtcbiAgICAgICAgdmFyIHJ1blNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb25Db250ZW50cyB8fCAne30nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChydW5TZXNzaW9uLnJ1bklkKSB7XG4gICAgICAgICAgICAvL0VwaUpTIDwgMi4yIHVzZWQgcnVuSWQgYXMga2V5LCBzbyBtYWludGFpbiBjb21wdGFpYmlsaXR5LiBSZW1vdmUgYXQgc29tZSBmdXR1cmUgZGF0ZSAoU3VtbWVyIGAxNz8pXG4gICAgICAgICAgICBydW5TZXNzaW9uLmlkID0gcnVuU2Vzc2lvbi5ydW5JZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdXRoU2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbigpO1xuICAgICAgICBpZiAodGhpcy5zdHJhdGVneS5yZXF1aXJlc0F1dGggJiYgdXRpbC5pc0VtcHR5KGF1dGhTZXNzaW9uKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gdXNlci1zZXNzaW9uIGF2YWlsYWJsZScsIHRoaXMub3B0aW9ucy5zdHJhdGVneSwgJ3JlcXVpcmVzIGF1dGhlbnRpY2F0aW9uLicpO1xuICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoJ05vIHVzZXItc2Vzc2lvbiBhdmFpbGFibGUnKS5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3lcbiAgICAgICAgICAgICAgICAuZ2V0UnVuKHRoaXMucnVuLCBhdXRoU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChydW4gJiYgcnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5ydW4udXBkYXRlQ29uZmlnKHsgZmlsdGVyOiBydW4uaWQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbktleSA9IHNlc3Npb25LZXlGcm9tT3B0aW9ucyhtZS5vcHRpb25zLCBtZS5ydW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKHNlc3Npb25LZXksIHJ1biwgbWUuc2Vzc2lvbk1hbmFnZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVzICYmIHZhcmlhYmxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUucnVuLnZhcmlhYmxlcygpLnF1ZXJ5KHZhcmlhYmxlcykudGhlbihmdW5jdGlvbiAocmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0gcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi52YXJpYWJsZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIGEgJ3Jlc2V0JyBydW4uIFRoZSBkZWZpbml0aW9uIG9mIGEgcmVzZXQgaXMgZGVmaW5lZCBieSB0aGUgc3RyYXRlZ3ksIGJ1dCB0eXBpY2FsbHkgbWVhbnMgZm9yY2luZyB0aGUgY3JlYXRpb24gb2YgYSBuZXcgcnVuLiBGb3IgZXhhbXBsZSwgYHJlc2V0KClgIGZvciB0aGUgZGVmYXVsdCBzdHJhdGVnaWVzIGByZXVzZS1wZXItc2Vzc2lvbmAgYW5kIGByZXVzZS1sYXN0LWluaXRpYWxpemVkYCBib3RoIGNyZWF0ZSBuZXcgcnVucy5cbiAgICAgKlxuICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBybS5yZXNldCgpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgKG5ldykgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIENvbmZpZ3VyYXRpb24gb3B0aW9uczsgcGFzc2VkIG9uIHRvIFtSdW5TZXJ2aWNlI2NyZWF0ZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyNjcmVhdGUpLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBhdXRoU2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbigpO1xuICAgICAgICBpZiAodGhpcy5zdHJhdGVneS5yZXF1aXJlc0F1dGggJiYgdXRpbC5pc0VtcHR5KGF1dGhTZXNzaW9uKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gdXNlci1zZXNzaW9uIGF2YWlsYWJsZScsIHRoaXMub3B0aW9ucy5zdHJhdGVneSwgJ3JlcXVpcmVzIGF1dGhlbnRpY2F0aW9uLicpO1xuICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoJ05vIHVzZXItc2Vzc2lvbiBhdmFpbGFibGUnKS5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3kucmVzZXQodGhpcy5ydW4sIGF1dGhTZXNzaW9uLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgIGlmIChydW4gJiYgcnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgbWUucnVuLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogcnVuLmlkIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uS2V5ID0gc2Vzc2lvbktleUZyb21PcHRpb25zKG1lLm9wdGlvbnMsIG1lLnJ1bik7XG4gICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKHNlc3Npb25LZXksIHJ1bi5pZCwgbWUuc2Vzc2lvbk1hbmFnZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuUnVuTWFuYWdlci5zdHJhdGVnaWVzID0gc3RyYXRlZ2llcztcbm1vZHVsZS5leHBvcnRzID0gUnVuTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL25vbmUtc3RyYXRlZ3knKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxuLyoqXG4qICMjIENvbmRpdGlvbmFsIENyZWF0aW9uIFN0cmF0ZWd5XG4qXG4qIFRoaXMgc3RyYXRlZ3kgd2lsbCB0cnkgdG8gZ2V0IHRoZSBydW4gc3RvcmVkIGluIHRoZSBjb29raWUgYW5kXG4qIGV2YWx1YXRlIGlmIGl0IG5lZWRzIHRvIGNyZWF0ZSBhIG5ldyBydW4gYnkgY2FsbGluZyB0aGUgYGNvbmRpdGlvbmAgZnVuY3Rpb24uXG4qL1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTdHJhdGVneShjb25kaXRpb24pIHtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PSBudWxsKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25kaXRpb25hbCBzdHJhdGVneSBuZWVkcyBhIGNvbmRpdGlvbiB0byBjcmVhdGUgYSBydW4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbmRpdGlvbiA9IHR5cGVvZiBjb25kaXRpb24gIT09ICdmdW5jdGlvbicgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25kaXRpb247IH0gOiBjb25kaXRpb247XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldHMgYSBuZXcgJ2NvcnJlY3QnIHJ1biwgb3IgdXBkYXRlcyB0aGUgZXhpc3Rpbmcgb25lICh0aGUgZGVmaW5pdGlvbiBvZiAnY29ycmVjdCcgZGVwZW5kcyBvbiBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbikuXG4gICAgICogQHBhcmFtICB7UnVuU2VydmljZX0gcnVuU2VydmljZSBBIFJ1biBTZXJ2aWNlIGluc3RhbmNlIGZvciB0aGUgY3VycmVudCBydW4sIGFzIGRldGVybWluZWQgYnkgdGhlIFJ1biBNYW5hZ2VyLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gdXNlclNlc3Npb24gSW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlciBzZXNzaW9uLiBTZWUgW0F1dGhNYW5hZ2VyI2dldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm9dKC4uL2F1dGgtbWFuYWdlci8jZ2V0Y3VycmVudHVzZXJzZXNzaW9uaW5mbykgZm9yIGZvcm1hdC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBTZWUgW1J1blNlcnZpY2UjY3JlYXRlXSguLi9ydW4tYXBpLXNlcnZpY2UvI2NyZWF0ZSkgZm9yIHN1cHBvcnRlZCBvcHRpb25zLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgIFxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGdyb3VwID0gdXNlclNlc3Npb24gJiYgdXNlclNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgc2NvcGU6IHsgZ3JvdXA6IGdyb3VwIH1cbiAgICAgICAgfSwgcnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCkpO1xuXG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlXG4gICAgICAgICAgICAgICAgLmNyZWF0ZShvcHQsIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICBydW4uZnJlc2hseUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSAnY29ycmVjdCcgcnVuICh0aGUgZGVmaW5pdGlvbiBvZiAnY29ycmVjdCcgZGVwZW5kcyBvbiBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbikuXG4gICAgICogQHBhcmFtICB7UnVuU2VydmljZX0gcnVuU2VydmljZSBBIFJ1biBTZXJ2aWNlIGluc3RhbmNlIGZvciB0aGUgY3VycmVudCBydW4sIGFzIGRldGVybWluZWQgYnkgdGhlIFJ1biBNYW5hZ2VyLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gdXNlclNlc3Npb24gSW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlciBzZXNzaW9uLiBTZWUgW0F1dGhNYW5hZ2VyI2dldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm9dKC4uL2F1dGgtbWFuYWdlci8jZ2V0Y3VycmVudHVzZXJzZXNzaW9uaW5mbykgZm9yIGZvcm1hdC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHJ1blNlc3Npb24gVGhlIFJ1biBNYW5hZ2VyIHN0b3JlcyB0aGUgJ2xhc3QgYWNjZXNzZWQnIHJ1biBpbiBhIGNvb2tpZSBhbmQgcGFzc2VzIGl0IGJhY2sgaGVyZS5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBTZWUgW1J1blNlcnZpY2UjY3JlYXRlXSguLi9ydW4tYXBpLXNlcnZpY2UvI2NyZWF0ZSkgZm9yIHN1cHBvcnRlZCBvcHRpb25zLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgIFxuICAgICAqL1xuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5TZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIGlmIChydW5TZXNzaW9uICYmIHJ1blNlc3Npb24uaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvYWRBbmRDaGVjayhydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXNldChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucyk7IC8vaWYgaXQgZ290IHRoZSB3cm9uZyBjb29raWUgZm9yIGUuZy5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGxvYWRBbmRDaGVjazogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5TZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzaG91bGRDcmVhdGUgPSBmYWxzZTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcblxuICAgICAgICByZXR1cm4gcnVuU2VydmljZVxuICAgICAgICAgICAgLmxvYWQocnVuU2Vzc2lvbi5pZCwgbnVsbCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICBzaG91bGRDcmVhdGUgPSBtZS5jb25kaXRpb24ocnVuLCBoZWFkZXJzLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQ3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXNldChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGBuZXctaWYtaW5pdGlhbGl6ZWRgIHN0cmF0ZWd5IGNyZWF0ZXMgYSBuZXcgcnVuIGlmIHRoZSBjdXJyZW50IG9uZSBpcyBpbiBtZW1vcnkgb3IgaGFzIGl0cyBgaW5pdGlhbGl6ZWRgIGZpZWxkIHNldCB0byBgdHJ1ZWAuIFRoZSBgaW5pdGlhbGl6ZWRgIGZpZWxkIGluIHRoZSBydW4gcmVjb3JkIGlzIGF1dG9tYXRpY2FsbHkgc2V0IHRvIGB0cnVlYCBhdCBydW4gY3JlYXRpb24sIGJ1dCBjYW4gYmUgY2hhbmdlZC5cbiAqIFxuICogVGhpcyBzdHJhdGVneSBpcyB1c2VmdWwgaWYgeW91ciBwcm9qZWN0IGlzIHN0cnVjdHVyZWQgc3VjaCB0aGF0IGltbWVkaWF0ZWx5IGFmdGVyIGEgcnVuIGlzIGNyZWF0ZWQsIHRoZSBtb2RlbCBpcyBleGVjdXRlZCBjb21wbGV0ZWx5IChmb3IgZXhhbXBsZSwgYSBWZW5zaW0gbW9kZWwgaXMgc3RlcHBlZCB0byB0aGUgZW5kKS4gSXQgaXMgc2ltaWxhciB0byB0aGUgYG5ldy1pZi1taXNzaW5nYCBzdHJhdGVneSwgZXhjZXB0IHRoYXQgaXQgY2hlY2tzIGEgZmllbGQgb2YgdGhlIHJ1biByZWNvcmQuXG4gKiBcbiAqIFNwZWNpZmljYWxseSwgdGhlIHN0cmF0ZWd5IGlzOlxuICpcbiAqICogQ2hlY2sgdGhlIGBzZXNzaW9uS2V5YCBjb29raWUuIFxuICogICogVGhpcyBjb29raWUgaXMgc2V0IGJ5IHRoZSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgYW5kIGNvbmZpZ3VyYWJsZSB0aHJvdWdoIGl0cyBvcHRpb25zLlxuICogICogSWYgdGhlIGNvb2tpZSBleGlzdHMsIGNoZWNrIHdoZXRoZXIgdGhlIHJ1biBpcyBpbiBtZW1vcnkgb3Igb25seSBwZXJzaXN0ZWQgaW4gdGhlIGRhdGFiYXNlLiBBZGRpdGlvbmFsbHksIGNoZWNrIHdoZXRoZXIgdGhlIHJ1bidzIGBpbml0aWFsaXplZGAgZmllbGQgaXMgYHRydWVgLiBcbiAqICAgICAgKiBJZiB0aGUgcnVuIGlzIGluIG1lbW9yeSwgY3JlYXRlIGEgbmV3IHJ1bi5cbiAqICAgICAgKiBJZiB0aGUgcnVuJ3MgYGluaXRpYWxpemVkYCBmaWVsZCBpcyBgdHJ1ZWAsIGNyZWF0ZSBhIG5ldyBydW4uXG4gKiAgICAgICogT3RoZXJ3aXNlLCB1c2UgdGhlIGV4aXN0aW5nIHJ1bi5cbiAqICAqIElmIHRoZSBjb29raWUgZG9lcyBub3QgZXhpc3QsIGNyZWF0ZSBhIG5ldyBydW4gZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgXG4gKiAgQGRlcHJlY2F0ZWQgQ29uc2lkZXIgdXNpbmcgYHJldXNlLWxhc3QtaW5pdGlhbGl6ZWRgIGluc3RlYWRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4uL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICAgICAgY29uc29sZS53YXJuKCdUaGlzIHN0cmF0ZWd5IGlzIGRlcHJlY2F0ZWQ7IGFsbCBydW5zIG5vdyBkZWZhdWx0IHRvIGJlaW5nIGluaXRpYWxpemVkIGJ5IGRlZmF1bHQgbWFraW5nIHRoaXMgcmVkdW5kYW50LiBDb25zaWRlciB1c2luZyBgcmV1c2UtbGFzdC1pbml0aWFsaXplZGAgaW5zdGVhZC4nKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCcgfHwgcnVuLmluaXRpYWxpemVkO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiLyoqXG4gKiBUaGUgYG5ldy1pZi1wZXJzaXN0ZWRgIHN0cmF0ZWd5IGNyZWF0ZXMgYSBuZXcgcnVuIHdoZW4gdGhlIGN1cnJlbnQgb25lIGJlY29tZXMgcGVyc2lzdGVkIChlbmQgdXNlciBpcyBpZGxlIGZvciBhIHNldCBwZXJpb2QpLCBidXQgb3RoZXJ3aXNlIHVzZXMgdGhlIGN1cnJlbnQgb25lLiBcbiAqIFxuICogVXNpbmcgdGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IHdoZW4gZW5kIHVzZXJzIG5hdmlnYXRlIGJldHdlZW4gcGFnZXMgaW4geW91ciBwcm9qZWN0LCBvciByZWZyZXNoIHRoZWlyIGJyb3dzZXJzLCB0aGV5IHdpbGwgc3RpbGwgYmUgd29ya2luZyB3aXRoIHRoZSBzYW1lIHJ1bi4gXG4gKiBcbiAqIEhvd2V2ZXIsIGlmIHRoZXkgYXJlIGlkbGUgZm9yIGxvbmdlciB0aGFuIHlvdXIgcHJvamVjdCdzICoqTW9kZWwgU2Vzc2lvbiBUaW1lb3V0KiogKGNvbmZpZ3VyZWQgaW4geW91ciBwcm9qZWN0J3MgW1NldHRpbmdzXSguLi8uLi8uLi91cGRhdGluZ195b3VyX3NldHRpbmdzLykpLCB0aGVuIHRoZWlyIHJ1biBpcyBwZXJzaXN0ZWQ7IHRoZSBuZXh0IHRpbWUgdGhleSBpbnRlcmFjdCB3aXRoIHRoZSBwcm9qZWN0LCB0aGV5IHdpbGwgZ2V0IGEgbmV3IHJ1bi4gKFNlZSBtb3JlIGJhY2tncm91bmQgb24gW1J1biBQZXJzaXN0ZW5jZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLykuKVxuICogXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIHVzZWZ1bCBmb3IgbXVsdGktcGFnZSBwcm9qZWN0cyB3aGVyZSBlbmQgdXNlcnMgcGxheSB0aHJvdWdoIGEgc2ltdWxhdGlvbiBpbiBvbmUgc2l0dGluZywgc3RlcHBpbmcgdGhyb3VnaCB0aGUgbW9kZWwgc2VxdWVudGlhbGx5IChmb3IgZXhhbXBsZSwgYSBWZW5zaW0gbW9kZWwgdGhhdCB1c2VzIHRoZSBgc3RlcGAgb3BlcmF0aW9uKSBvciBjYWxsaW5nIHNwZWNpZmljIGZ1bmN0aW9ucyB1bnRpbCB0aGUgbW9kZWwgaXMgXCJjb21wbGV0ZS5cIiBIb3dldmVyLCB5b3Ugd2lsbCBuZWVkIHRvIGd1YXJhbnRlZSB0aGF0IHlvdXIgZW5kIHVzZXJzIHdpbGwgcmVtYWluIGVuZ2FnZWQgd2l0aCB0aGUgcHJvamVjdCBmcm9tIGJlZ2lubmluZyB0byBlbmQgJm1kYXNoOyBvciBhdCBsZWFzdCwgdGhhdCBpZiB0aGV5IGFyZSBpZGxlIGZvciBsb25nZXIgdGhhbiB0aGUgKipNb2RlbCBTZXNzaW9uIFRpbWVvdXQqKiwgaXQgaXMgb2theSBmb3IgdGhlbSB0byBzdGFydCB0aGUgcHJvamVjdCBmcm9tIHNjcmF0Y2ggKHdpdGggYW4gdW5pbml0aWFsaXplZCBtb2RlbCkuIFxuICogXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIENoZWNrIHRoZSBgc2Vzc2lvbktleWAgY29va2llLlxuICogICAqIFRoaXMgY29va2llIGlzIHNldCBieSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCBjb25maWd1cmFibGUgdGhyb3VnaCBpdHMgb3B0aW9ucy5cbiAqICAgKiBJZiB0aGUgY29va2llIGV4aXN0cywgY2hlY2sgd2hldGhlciB0aGUgcnVuIGlzIGluIG1lbW9yeSBvciBvbmx5IHBlcnNpc3RlZCBpbiB0aGUgZGF0YWJhc2UuIFxuICogICAgICAqIElmIHRoZSBydW4gaXMgaW4gbWVtb3J5LCB1c2UgdGhlIHJ1bi5cbiAqICAgICAgKiBJZiB0aGUgcnVuIGlzIG9ubHkgcGVyc2lzdGVkIChhbmQgbm90IHN0aWxsIGluIG1lbW9yeSksIGNyZWF0ZSBhIG5ldyBydW4gZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgICAgICogSWYgdGhlIGNvb2tpZSBkb2VzIG5vdCBleGlzdCwgY3JlYXRlIGEgbmV3IHJ1biBmb3IgdGhpcyBlbmQgdXNlci5cbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGUgcnVuLXNlcnZpY2Ugbm93IHNldHMgYSBoZWFkZXIgdG8gYXV0b21hdGljYWxseSBicmluZyBiYWNrIHJ1bnMgaW50byBtZW1vcnlcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4uL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICAgICAgY29uc29sZS53YXJuKCdUaGlzIHN0cmF0ZWd5IGlzIGRlcHJlY2F0ZWQ7IHRoZSBydW4tc2VydmljZSBub3cgc2V0cyBhIGhlYWRlciB0byBhdXRvbWF0aWNhbGx5IGJyaW5nIGJhY2sgcnVucyBpbnRvIG1lbW9yeScpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gaGVhZGVycy5nZXRSZXNwb25zZUhlYWRlcigncHJhZ21hJykgPT09ICdwZXJzaXN0ZW50JztcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogIyMjIFdvcmtpbmcgd2l0aCBSdW4gU3RyYXRlZ2llc1xuICpcbiAqIFlvdSBjYW4gYWNjZXNzIGEgbGlzdCBvZiBhdmFpbGFibGUgc3RyYXRlZ2llcyB1c2luZyBgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIuc3RyYXRlZ2llcy5saXN0YC4gWW91IGNhbiBhbHNvIGFzayBmb3IgYSBwYXJ0aWN1bGFyIHN0cmF0ZWd5IGJ5IG5hbWUuXG4gKlxuICogSWYgeW91IGRlY2lkZSB0byBbY3JlYXRlIHlvdXIgb3duIHJ1biBzdHJhdGVneV0oI2NyZWF0ZS15b3VyLW93biksIHlvdSBjYW4gcmVnaXN0ZXIgeW91ciBzdHJhdGVneS4gUmVnaXN0ZXJpbmcgeW91ciBzdHJhdGVneSBtZWFucyB0aGF0OlxuICpcbiAqICogWW91IGNhbiBwYXNzIHRoZSBzdHJhdGVneSBieSBuYW1lIHRvIGEgUnVuIE1hbmFnZXIgKGFzIG9wcG9zZWQgdG8gcGFzc2luZyB0aGUgc3RyYXRlZ3kgZnVuY3Rpb24pOiBgbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHsgc3RyYXRlZ3k6ICdteW5ld25hbWUnfSlgLlxuICogKiBZb3UgY2FuIHBhc3MgY29uZmlndXJhdGlvbiBvcHRpb25zIHRvIHlvdXIgc3RyYXRlZ3kuXG4gKiAqIFlvdSBjYW4gc3BlY2lmeSB3aGV0aGVyIG9yIG5vdCB5b3VyIHN0cmF0ZWd5IHJlcXVpcmVzIGF1dGhvcml6YXRpb24gKGEgdmFsaWQgdXNlciBzZXNzaW9uKSB0byB3b3JrLlxuICovXG5cblxudmFyIGxpc3QgPSB7XG4gICAgJ2NvbmRpdGlvbmFsLWNyZWF0aW9uJzogcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpLFxuICAgICduZXctaWYtaW5pdGlhbGl6ZWQnOiByZXF1aXJlKCcuL2RlcHJlY2F0ZWQvbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5JyksIC8vZGVwcmVjYXRlZFxuICAgICduZXctaWYtcGVyc2lzdGVkJzogcmVxdWlyZSgnLi9kZXByZWNhdGVkL25ldy1pZi1wZXJzaXN0ZWQtc3RyYXRlZ3knKSwgLy9kZXByZWNhdGVkXG5cbiAgICBub25lOiByZXF1aXJlKCcuL25vbmUtc3RyYXRlZ3knKSxcblxuICAgIG11bHRpcGxheWVyOiByZXF1aXJlKCcuL211bHRpcGxheWVyLXN0cmF0ZWd5JyksXG4gICAgJ3JldXNlLW5ldmVyJzogcmVxdWlyZSgnLi9yZXVzZS1uZXZlcicpLFxuICAgICdyZXVzZS1wZXItc2Vzc2lvbic6IHJlcXVpcmUoJy4vcmV1c2UtcGVyLXNlc3Npb24nKSxcbiAgICAncmV1c2UtYWNyb3NzLXNlc3Npb25zJzogcmVxdWlyZSgnLi9yZXVzZS1hY3Jvc3Mtc2Vzc2lvbnMnKSxcbiAgICAncmV1c2UtbGFzdC1pbml0aWFsaXplZCc6IHJlcXVpcmUoJy4vcmV1c2UtbGFzdC1pbml0aWFsaXplZCcpLFxufTtcblxuLy9BZGQgYmFjayBvbGRlciBhbGlhc2VzXG5saXN0WydhbHdheXMtbmV3J10gPSBsaXN0WydyZXVzZS1uZXZlciddO1xubGlzdFsnbmV3LWlmLW1pc3NpbmcnXSA9IGxpc3RbJ3JldXNlLXBlci1zZXNzaW9uJ107XG5saXN0WydwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXInXSA9IGxpc3RbJ3JldXNlLWFjcm9zcy1zZXNzaW9ucyddO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIExpc3Qgb2YgYXZhaWxhYmxlIHN0cmF0ZWdpZXMuIFdpdGhpbiB0aGlzIG9iamVjdCwgZWFjaCBrZXkgaXMgdGhlIHN0cmF0ZWd5IG5hbWUgYW5kIHRoZSBhc3NvY2lhdGVkIHZhbHVlIGlzIHRoZSBzdHJhdGVneSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fSBcbiAgICAgKi9cbiAgICBsaXN0OiBsaXN0LFxuXG4gICAgLyoqXG4gICAgICogR2V0cyBzdHJhdGVneSBieSBuYW1lLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHJldXNlU3RyYXQgPSBGLm1hbmFnZXIuUnVuTWFuYWdlci5zdHJhdGVnaWVzLmJ5TmFtZSgncmV1c2UtYWNyb3NzLXNlc3Npb25zJyk7XG4gICAgICogICAgICAvLyBzaG93cyBzdHJhdGVneSBmdW5jdGlvblxuICAgICAqICAgICAgY29uc29sZS5sb2coJ3JldXNlU3RyYXQgPSAnLCByZXVzZVN0cmF0KTtcbiAgICAgKiAgICAgIC8vIGNyZWF0ZSBhIG5ldyBydW4gbWFuYWdlciB1c2luZyB0aGlzIHN0cmF0ZWd5XG4gICAgICogICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe3N0cmF0ZWd5OiByZXVzZVN0cmF0LCBydW46IHsgbW9kZWw6ICdtb2RlbC52bWYnfSB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzdHJhdGVneU5hbWUgTmFtZSBvZiBzdHJhdGVneSB0byBnZXQuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFN0cmF0ZWd5IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGJ5TmFtZTogZnVuY3Rpb24gKHN0cmF0ZWd5TmFtZSkge1xuICAgICAgICByZXR1cm4gbGlzdFtzdHJhdGVneU5hbWVdO1xuICAgIH0sXG5cbiAgICBnZXRCZXN0U3RyYXRlZ3k6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBzdHJhdGVneSA9IG9wdGlvbnMuc3RyYXRlZ3k7XG4gICAgICAgIGlmICghc3RyYXRlZ3kpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucyAmJiBvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucy5pbml0T3BlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3RyYXRlZ3kgPSAncmV1c2UtbGFzdC1pbml0aWFsaXplZCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0cmF0ZWd5ID0gJ3JldXNlLXBlci1zZXNzaW9uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHJhdGVneS5nZXRSdW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJhdGVneTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgU3RyYXRlZ3lDdG9yID0gdHlwZW9mIHN0cmF0ZWd5ID09PSAnZnVuY3Rpb24nID8gc3RyYXRlZ3kgOiB0aGlzLmJ5TmFtZShzdHJhdGVneSk7XG4gICAgICAgIGlmICghU3RyYXRlZ3lDdG9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NwZWNpZmllZCBydW4gY3JlYXRpb24gc3RyYXRlZ3kgd2FzIGludmFsaWQ6Jywgc3RyYXRlZ3kpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0cmF0ZWd5SW5zdGFuY2UgPSBuZXcgU3RyYXRlZ3lDdG9yKG9wdGlvbnMpO1xuICAgICAgICBpZiAoIXN0cmF0ZWd5SW5zdGFuY2UuZ2V0UnVuIHx8ICFzdHJhdGVneUluc3RhbmNlLnJlc2V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBzdHJhdGVnaWVzIHNob3VsZCBpbXBsZW1lbnQgYSBgZ2V0UnVuYCBhbmQgYHJlc2V0YCBpbnRlcmZhY2UnLCBvcHRpb25zLnN0cmF0ZWd5KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJhdGVneUluc3RhbmNlLnJlcXVpcmVzQXV0aCA9IFN0cmF0ZWd5Q3Rvci5yZXF1aXJlc0F1dGg7XG5cbiAgICAgICAgcmV0dXJuIHN0cmF0ZWd5SW5zdGFuY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgc3RyYXRlZ3kuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICAvLyB0aGlzIFwiZmF2b3JpdGUgcnVuXCIgc3RyYXRlZ3kgYWx3YXlzIHJldHVybnMgdGhlIHNhbWUgcnVuLCBubyBtYXR0ZXIgd2hhdFxuICAgICAqICAgICAgLy8gKG5vdCBhIHVzZWZ1bCBzdHJhdGVneSwgZXhjZXB0IGFzIGFuIGV4YW1wbGUpXG4gICAgICogICAgICBGLm1hbmFnZXIuUnVuTWFuYWdlci5zdHJhdGVnaWVzLnJlZ2lzdGVyKFxuICAgICAqICAgICAgICAgICdmYXZSdW4nLCBcbiAgICAgKiAgICAgICAgICBmdW5jdGlvbigpIHsgXG4gICAgICogICAgICAgICAgICAgIHJldHVybiB7IGdldFJ1bjogZnVuY3Rpb24oKSB7IHJldHVybiAnMDAwMDAxNWE0Y2QxNzAwMjA5Y2QwYTdkMjA3ZjQ0YmFjMjg5JzsgfSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7IHJldHVybiAnMDAwMDAxNWE0Y2QxNzAwMjA5Y2QwYTdkMjA3ZjQ0YmFjMjg5JzsgfSBcbiAgICAgKiAgICAgICAgICAgICAgfSBcbiAgICAgKiAgICAgICAgICB9LCBcbiAgICAgKiAgICAgICAgICB7IHJlcXVpcmVzQXV0aDogdHJ1ZSB9XG4gICAgICogICAgICApO1xuICAgICAqICAgICAgXG4gICAgICogICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe3N0cmF0ZWd5OiAnZmF2UnVuJywgcnVuOiB7IG1vZGVsOiAnbW9kZWwudm1mJ30gfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSBOYW1lIGZvciBzdHJhdGVneS4gVGhpcyBzdHJpbmcgY2FuIHRoZW4gYmUgcGFzc2VkIHRvIGEgUnVuIE1hbmFnZXIgYXMgYG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7IHN0cmF0ZWd5OiAnbXluZXduYW1lJ30pYC5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gc3RyYXRlZ3kgVGhlIHN0cmF0ZWd5IGNvbnN0cnVjdG9yLiBXaWxsIGJlIGNhbGxlZCB3aXRoIGBuZXdgIG9uIFJ1biBNYW5hZ2VyIGluaXRpYWxpemF0aW9uLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgT3B0aW9ucyBmb3Igc3RyYXRlZ3kuXG4gICAgICogQHBhcmFtICB7Qm9vbGVhbn0gb3B0aW9ucy5yZXF1aXJlc0F1dGggU3BlY2lmeSBpZiB0aGUgc3RyYXRlZ3kgcmVxdWlyZXMgYSB2YWxpZCB1c2VyIHNlc3Npb24gdG8gd29yay5cbiAgICAgKi9cbiAgICByZWdpc3RlcjogZnVuY3Rpb24gKG5hbWUsIHN0cmF0ZWd5LCBvcHRpb25zKSB7XG4gICAgICAgIHN0cmF0ZWd5Lm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICBsaXN0W25hbWVdID0gc3RyYXRlZ3k7XG4gICAgfVxufTsiLCIvKipcbiAqIFRoZSBgbXVsdGlwbGF5ZXJgIHN0cmF0ZWd5IGlzIGZvciB1c2Ugd2l0aCBbbXVsdGlwbGF5ZXIgd29ybGRzXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLiBJdCBjaGVja3MgdGhlIGN1cnJlbnQgd29ybGQgZm9yIHRoaXMgZW5kIHVzZXIsIGFuZCBhbHdheXMgcmV0dXJucyB0aGUgY3VycmVudCBydW4gZm9yIHRoYXQgd29ybGQuIFRoaXMgaXMgZXF1aXZhbGVudCB0byBjYWxsaW5nIGBnZXRDdXJyZW50V29ybGRGb3JVc2VyKClgIGFuZCB0aGVuIGBnZXRDdXJyZW50UnVuSWQoKWAgZnJvbSB0aGUgW1dvcmxkIEFQSSBBZGFwYXRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKS4gSWYgeW91IHVzZSB0aGUgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIvKSwgeW91IGFyZSBhdXRvbWF0aWNhbGx5IHVzaW5nIHRoaXMgc3RyYXRlZ3kuXG4gKiBcbiAqIFVzaW5nIHRoaXMgc3RyYXRlZ3kgbWVhbnMgdGhhdCBlbmQgdXNlcnMgaW4gcHJvamVjdHMgd2l0aCBtdWx0aXBsYXllciB3b3JsZHMgYWx3YXlzIHNlZSB0aGUgbW9zdCBjdXJyZW50IHdvcmxkIGFuZCBydW4uIFRoaXMgZW5zdXJlcyB0aGF0IHRoZXkgYXJlIGluIHN5bmMgd2l0aCB0aGUgb3RoZXIgZW5kIHVzZXJzIHNoYXJpbmcgdGhlaXIgd29ybGQgYW5kIHJ1bi4gSW4gdHVybiwgdGhpcyBhbGxvd3MgZm9yIGNvbXBldGl0aXZlIG9yIGNvbGxhYm9yYXRpdmUgbXVsdGlwbGF5ZXIgcHJvamVjdHMuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xuXG52YXIgSWRlbnRpdHlTdHJhdGVneSA9IHJlcXVpcmUoJy4vbm9uZS1zdHJhdGVneScpO1xudmFyIFdvcmxkQXBpQWRhcHRlciA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcblxudmFyIGRlZmF1bHRzID0ge307XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMud29ybGRBcGkgPSBuZXcgV29ybGRBcGlBZGFwdGVyKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgdmFyIG9wdGlvbnNUb1Bhc3NPbiA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53b3JsZEFwaS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCwgb3B0aW9uc1RvUGFzc09uKS50aGVuKGZ1bmN0aW9uIChydW5pZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9SZXR1cm4gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcnVuaWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdWNjZXNzKSBvcHRpb25zLnN1Y2Nlc3ModG9SZXR1cm4pOyBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSwgc2Vzc2lvbikge1xuICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIHZhciBjdXJHcm91cE5hbWUgPSBzZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIHdvcmxkQXBpID0gdGhpcy53b3JsZEFwaTtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5vcHRpb25zLm1vZGVsO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIGlmICghY3VyVXNlcklkKSB7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwMCwgZXJyb3I6ICdXZSBuZWVkIGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBqb2luIGEgbXVsdGlwbGF5ZXIgd29ybGQuIChFUlI6IG5vIHVzZXJJZCBpbiBzZXNzaW9uKScgfSwgc2Vzc2lvbikucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvYWRSdW5Gcm9tV29ybGQgPSBmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIGlmICghd29ybGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwNCwgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgaW4gYW55IHdvcmxkLicgfSwgeyBvcHRpb25zOiBtZS5vcHRpb25zLCBzZXNzaW9uOiBzZXNzaW9uIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZC5pZCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5sb2FkKGlkKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcnVuLndvcmxkID0gd29ybGQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihkdGQucmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc2VydmVyRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIGlzIHRoaXMgcG9zc2libGU/XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdChlcnJvciwgc2Vzc2lvbiwgbWUub3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihsb2FkUnVuRnJvbVdvcmxkKVxuICAgICAgICAgICAgLmZhaWwoc2VydmVyRXJyb3IpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiLyoqXG4gKiBUaGUgYG5vbmVgIHN0cmF0ZWd5IG5ldmVyIHJldHVybnMgYSBydW4gb3IgdHJpZXMgdG8gY3JlYXRlIGEgbmV3IHJ1bi4gSXQgc2ltcGx5IHJldHVybnMgdGhlIGNvbnRlbnRzIG9mIHRoZSBjdXJyZW50IFtSdW4gU2VydmljZSBpbnN0YW5jZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIG1hbnVhbGx5IGRlY2lkZSBob3cgdG8gY3JlYXRlIHlvdXIgb3duIHJ1bnMgYW5kIGRvbid0IHdhbnQgYW55IGF1dG9tYXRpYyBhc3Npc3RhbmNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSB7fTtcblxuLy8gSW50ZXJmYWNlIHRoYXQgYWxsIHN0cmF0ZWdpZXMgbmVlZCB0byBpbXBsZW1lbnRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSBuZXdseSBjcmVhdGVkIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoKS5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgdXNhYmxlIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUocnVuU2VydmljZSkucHJvbWlzZSgpO1xuICAgIH1cbn0pO1xuIiwiLyoqXG4gKiBUaGUgYHJldXNlLWFjcm9zcy1zZXNzaW9uc2Agc3RyYXRlZ3kgcmV0dXJucyB0aGUgbGF0ZXN0IChtb3N0IHJlY2VudCkgcnVuIGZvciB0aGlzIHVzZXIsIHdoZXRoZXIgaXQgaXMgaW4gbWVtb3J5IG9yIG5vdC4gSWYgdGhlcmUgYXJlIG5vIHJ1bnMgZm9yIHRoaXMgdXNlciwgaXQgY3JlYXRlcyBhIG5ldyBvbmUuXG4gKlxuICogVGhpcyBzdHJhdGVneSBpcyB1c2VmdWwgaWYgZW5kIHVzZXJzIGFyZSB1c2luZyB5b3VyIHByb2plY3QgZm9yIGFuIGV4dGVuZGVkIHBlcmlvZCBvZiB0aW1lLCBwb3NzaWJseSBvdmVyIHNldmVyYWwgc2Vzc2lvbnMuIFRoaXMgaXMgbW9zdCBjb21tb24gaW4gY2FzZXMgd2hlcmUgYSB1c2VyIG9mIHlvdXIgcHJvamVjdCBleGVjdXRlcyB0aGUgbW9kZWwgc3RlcCBieSBzdGVwIChhcyBvcHBvc2VkIHRvIGEgcHJvamVjdCB3aGVyZSB0aGUgbW9kZWwgaXMgZXhlY3V0ZWQgY29tcGxldGVseSwgZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIHRoYXQgaXMgaW1tZWRpYXRlbHkgc3RlcHBlZCB0byB0aGUgZW5kKS5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqIFxuICogKiBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHJ1bnMgZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgICAgKiBJZiB0aGVyZSBhcmUgbm8gcnVucyAoZWl0aGVyIGluIG1lbW9yeSBvciBpbiB0aGUgZGF0YWJhc2UpLCBjcmVhdGUgYSBuZXcgb25lLlxuICogICAgICogSWYgdGhlcmUgYXJlIHJ1bnMsIHRha2UgdGhlIGxhdGVzdCAobW9zdCByZWNlbnQpIG9uZS5cbiAqXG4gKiBAbmFtZSBwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXJcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBJZGVudGl0eVN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9ub25lLXN0cmF0ZWd5Jyk7XG52YXIgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uID0gcmVxdWlyZSgnLi4vc3RyYXRlZ3ktdXRpbHMnKS5pbmplY3RGaWx0ZXJzRnJvbVNlc3Npb247XG52YXIgaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbjtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIChPcHRpb25hbCkgQWRkaXRpb25hbCBjcml0ZXJpYSB0byB1c2Ugd2hpbGUgc2VsZWN0aW5nIHRoZSBsYXN0IHJ1blxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZmlsdGVyOiB7fSxcbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmF0ZWd5T3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucyA6IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHN0cmF0ZWd5T3B0aW9ucyk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG9wdCA9IGluamVjdFNjb3BlRnJvbVNlc3Npb24ocnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCksIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2VcbiAgICAgICAgICAgIC5jcmVhdGUob3B0LCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmlsdGVyID0gaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uKHRoaXMub3B0aW9ucy5maWx0ZXIsIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UucXVlcnkoZmlsdGVyLCB7IFxuICAgICAgICAgICAgc3RhcnRyZWNvcmQ6IDAsXG4gICAgICAgICAgICBlbmRyZWNvcmQ6IDAsXG4gICAgICAgICAgICBzb3J0OiAnY3JlYXRlZCcsIFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocnVucykge1xuICAgICAgICAgICAgaWYgKCFydW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXNldChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVuc1swXTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqIFRoZSBgcmV1c2UtbGFzdC1pbml0aWFsaXplZGAgc3RyYXRlZ3kgbG9va3MgZm9yIHRoZSBtb3N0IHJlY2VudCBydW4gdGhhdCBtYXRjaGVzIHBhcnRpY3VsYXIgY3JpdGVyaWE7IGlmIGl0IGNhbm5vdCBmaW5kIG9uZSwgaXQgY3JlYXRlcyBhIG5ldyBydW4gYW5kIGltbWVkaWF0ZWx5IGV4ZWN1dGVzIGEgc2V0IG9mIFwiaW5pdGlhbGl6YXRpb25cIiBvcGVyYXRpb25zLiBcbiAqXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIHVzZWZ1bCBpZiB5b3UgaGF2ZSBhIHRpbWUtYmFzZWQgbW9kZWwgYW5kIGFsd2F5cyB3YW50IHRoZSBydW4geW91J3JlIG9wZXJhdGluZyBvbiB0byBzdGFydCBhdCBhIHBhcnRpY3VsYXIgc3RlcC4gRm9yIGV4YW1wbGU6XG4gKlxuICogICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuICogICAgICAgICAgc3RyYXRlZ3k6ICdyZXVzZS1sYXN0LWluaXRpYWxpemVkJyxcbiAqICAgICAgICAgIHN0cmF0ZWd5T3B0aW9uczoge1xuICogICAgICAgICAgICAgIGluaXRPcGVyYXRpb246IFt7IHN0ZXA6IDEwIH1dXG4gKiAgICAgICAgICB9XG4gKiAgICAgIH0pO1xuICogXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIGFsc28gdXNlZnVsIGlmIHlvdSBoYXZlIGEgY3VzdG9tIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9uIGluIHlvdXIgbW9kZWwsIGFuZCB3YW50IHRvIG1ha2Ugc3VyZSBpdCdzIGFsd2F5cyBleGVjdXRlZCBmb3IgbmV3IHJ1bnMuXG4gKlxuICogU3BlY2lmaWNhbGx5LCB0aGUgc3RyYXRlZ3kgaXM6XG4gKlxuICogKiBMb29rIGZvciB0aGUgbW9zdCByZWNlbnQgcnVuIHRoYXQgbWF0Y2hlcyB0aGUgKG9wdGlvbmFsKSBgZmxhZ2AgY3JpdGVyaWFcbiAqICogSWYgdGhlcmUgYXJlIG5vIHJ1bnMgdGhhdCBtYXRjaCB0aGUgYGZsYWdgIGNyaXRlcmlhLCBjcmVhdGUgYSBuZXcgcnVuLiBJbW1lZGlhdGVseSBcImluaXRpYWxpemVcIiB0aGlzIG5ldyBydW4gYnk6XG4gKiAgICAgKiAgQ2FsbGluZyB0aGUgbW9kZWwgb3BlcmF0aW9uKHMpIHNwZWNpZmllZCBpbiB0aGUgYGluaXRPcGVyYXRpb25gIGFycmF5LlxuICogICAgICogIE9wdGlvbmFsbHksIHNldHRpbmcgYSBgZmxhZ2AgaW4gdGhlIHJ1bi5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIGluamVjdEZpbHRlcnNGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uO1xudmFyIGluamVjdFNjb3BlRnJvbVNlc3Npb24gPSByZXF1aXJlKCcuLi9zdHJhdGVneS11dGlscycpLmluamVjdFNjb3BlRnJvbVNlc3Npb247XG5cbnZhciBCYXNlID0ge307XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBPcGVyYXRpb25zIHRvIGV4ZWN1dGUgaW4gdGhlIG1vZGVsIGZvciBpbml0aWFsaXphdGlvbiB0byBiZSBjb25zaWRlcmVkIGNvbXBsZXRlLlxuICAgICAqIEB0eXBlIHtBcnJheX0gQ2FuIGJlIGluIGFueSBvZiB0aGUgZm9ybWF0cyBbUnVuIFNlcnZpY2UncyBgc2VyaWFsKClgXSguLi9ydW4tYXBpLXNlcnZpY2UvI3NlcmlhbCkgc3VwcG9ydHMuXG4gICAgICovXG4gICAgaW5pdE9wZXJhdGlvbjogW10sXG5cbiAgICAvKipcbiAgICAgKiAoT3B0aW9uYWwpIEZsYWcgdG8gc2V0IGluIHJ1biBhZnRlciBpbml0aWFsaXphdGlvbiBvcGVyYXRpb25zIGFyZSBydW4uIFlvdSB0eXBpY2FsbHkgd291bGQgbm90IG92ZXJyaWRlIHRoaXMgdW5sZXNzIHlvdSBuZWVkZWQgdG8gc2V0IGFkZGl0aW9uYWwgcHJvcGVydGllcyBhcyB3ZWxsLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZmxhZzogbnVsbCxcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBzdHJhdGVneU9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucy5zdHJhdGVneU9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBzdHJhdGVneU9wdGlvbnMpO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbml0T3BlcmF0aW9uIHx8ICF0aGlzLm9wdGlvbnMuaW5pdE9wZXJhdGlvbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3BlY2lmeWluZyBhbiBpbml0IGZ1bmN0aW9uIGlzIHJlcXVpcmVkIGZvciB0aGlzIHN0cmF0ZWd5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuZmxhZykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZsYWcgPSB7XG4gICAgICAgICAgICAgICAgaXNJbml0Q29tcGxldGU6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgb3B0ID0gaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbihydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKSwgdXNlclNlc3Npb24pO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5jcmVhdGUob3B0LCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uIChjcmVhdGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2Uuc2VyaWFsKFtdLmNvbmNhdChtZS5vcHRpb25zLmluaXRPcGVyYXRpb24pKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoY3JlYXRlUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5TZXJ2aWNlLnNhdmUobWUub3B0aW9ucy5mbGFnKS50aGVuKGZ1bmN0aW9uIChwYXRjaFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBjcmVhdGVSZXNwb25zZSwgcGF0Y2hSZXNwb25zZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5TZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzZXNzaW9uRmlsdGVyID0gaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uKHRoaXMub3B0aW9ucy5mbGFnLCB1c2VyU2Vzc2lvbik7XG4gICAgICAgIHZhciBydW5vcHRzID0gcnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCk7XG4gICAgICAgIHZhciBmaWx0ZXIgPSAkLmV4dGVuZCh0cnVlLCB7IHRyYXNoZWQ6IGZhbHNlIH0sIHNlc3Npb25GaWx0ZXIsIHsgbW9kZWw6IHJ1bm9wdHMubW9kZWwgfSk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlLnF1ZXJ5KGZpbHRlciwgeyBcbiAgICAgICAgICAgIHN0YXJ0cmVjb3JkOiAwLFxuICAgICAgICAgICAgZW5kcmVjb3JkOiAwLFxuICAgICAgICAgICAgc29ydDogJ2NyZWF0ZWQnLCBcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgICAgIGlmICghcnVucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bnNbMF07XG4gICAgICAgIH0pO1xuICAgIH1cbn0pOyIsIi8qKlxuICogVGhlIGByZXVzZS1uZXZlcmAgc3RyYXRlZ3kgYWx3YXlzIGNyZWF0ZXMgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyIGlycmVzcGVjdGl2ZSBvZiBjdXJyZW50IHN0YXRlLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgRi5zZXJ2aWNlLlJ1bi5jcmVhdGUoKWAgZnJvbSB0aGUgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBldmVyeSB0aW1lLiBcbiAqIFxuICogVGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgeW91ciBlbmQgdXNlcnMgcmVmcmVzaCB0aGVpciBicm93c2VycywgdGhleSBnZXQgYSBuZXcgcnVuLiBcbiAqIFxuICogVGhpcyBzdHJhdGVneSBjYW4gYmUgdXNlZnVsIGZvciBiYXNpYywgc2luZ2xlLXBhZ2UgcHJvamVjdHMuIFRoaXMgc3RyYXRlZ3kgaXMgYWxzbyB1c2VmdWwgZm9yIHByb3RvdHlwaW5nIG9yIHByb2plY3QgZGV2ZWxvcG1lbnQ6IGl0IGNyZWF0ZXMgYSBuZXcgcnVuIGVhY2ggdGltZSB5b3UgcmVmcmVzaCB0aGUgcGFnZSwgYW5kIHlvdSBjYW4gZWFzaWx5IGNoZWNrIHRoZSBvdXRwdXRzIG9mIHRoZSBtb2RlbC4gSG93ZXZlciwgdHlwaWNhbGx5IHlvdSB3aWxsIHVzZSBvbmUgb2YgdGhlIG90aGVyIHN0cmF0ZWdpZXMgZm9yIGEgcHJvZHVjdGlvbiBwcm9qZWN0LlxuICpcbiAqIEBuYW1lIGFsd2F5cy1uZXdcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGFsd2F5cyBjcmVhdGUgYSBuZXcgcnVuIVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGByZXVzZS1wZXItc2Vzc2lvbmAgc3RyYXRlZ3kgY3JlYXRlcyBhIG5ldyBydW4gd2hlbiB0aGUgY3VycmVudCBvbmUgaXMgbm90IGluIHRoZSBicm93c2VyIGNvb2tpZS5cbiAqIFxuICogVXNpbmcgdGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IHdoZW4gZW5kIHVzZXJzIG5hdmlnYXRlIGJldHdlZW4gcGFnZXMgaW4geW91ciBwcm9qZWN0LCBvciByZWZyZXNoIHRoZWlyIGJyb3dzZXJzLCB0aGV5IHdpbGwgc3RpbGwgYmUgd29ya2luZyB3aXRoIHRoZSBzYW1lIHJ1bi4gSG93ZXZlciwgaWYgZW5kIHVzZXJzIGxvZyBvdXQgYW5kIHJldHVybiB0byB0aGUgcHJvamVjdCBhdCBhIGxhdGVyIGRhdGUsIGEgbmV3IHJ1biBpcyBjcmVhdGVkLlxuICpcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdXIgcHJvamVjdCBpcyBzdHJ1Y3R1cmVkIHN1Y2ggdGhhdCBpbW1lZGlhdGVseSBhZnRlciBhIHJ1biBpcyBjcmVhdGVkLCB0aGUgbW9kZWwgaXMgZXhlY3V0ZWQgY29tcGxldGVseSAoZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIHRoYXQgaXMgc3RlcHBlZCB0byB0aGUgZW5kIGFzIHNvb24gYXMgaXQgaXMgY3JlYXRlZCkuIEluIGNvbnRyYXN0LCBpZiBlbmQgdXNlcnMgcGxheSB3aXRoIHlvdXIgcHJvamVjdCBmb3IgYW4gZXh0ZW5kZWQgcGVyaW9kIG9mIHRpbWUsIGV4ZWN1dGluZyB0aGUgbW9kZWwgc3RlcCBieSBzdGVwLCB0aGUgYHJldXNlLWFjcm9zcy1zZXNzaW9uc2Agc3RyYXRlZ3kgaXMgcHJvYmFibHkgYSBiZXR0ZXIgY2hvaWNlIChpdCBhbGxvd3MgZW5kIHVzZXJzIHRvIHBpY2sgdXAgd2hlcmUgdGhleSBsZWZ0IG9mZiwgcmF0aGVyIHRoYW4gc3RhcnRpbmcgZnJvbSBzY3JhdGNoIGVhY2ggYnJvd3NlciBzZXNzaW9uKS5cbiAqIFxuICogU3BlY2lmaWNhbGx5LCB0aGUgc3RyYXRlZ3kgaXM6XG4gKlxuICogKiBDaGVjayB0aGUgYHNlc3Npb25LZXlgIGNvb2tpZS5cbiAqICAgICAqIFRoaXMgY29va2llIGlzIHNldCBieSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCBjb25maWd1cmFibGUgdGhyb3VnaCBpdHMgb3B0aW9ucy4gXG4gKiAgICAgKiBJZiB0aGUgY29va2llIGV4aXN0cywgdXNlIHRoZSBydW4gaWQgc3RvcmVkIHRoZXJlLiBcbiAqICAgICAqIElmIHRoZSBjb29raWUgZG9lcyBub3QgZXhpc3QsIGNyZWF0ZSBhIG5ldyBydW4gZm9yIHRoaXMgZW5kIHVzZXIuXG4gKlxuICogQG5hbWUgbmV3LWlmLW1pc3NpbmdcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG4vKlxuKiAgY3JlYXRlIGEgbmV3IHJ1biBvbmx5IGlmIG5vdGhpbmcgaXMgc3RvcmVkIGluIHRoZSBjb29raWVcbiogIHRoaXMgaXMgdXNlZnVsIGZvciBiYXNlUnVucy5cbiovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGlmIHdlIGFyZSBoZXJlLCBpdCBtZWFucyB0aGF0IHRoZSBydW4gZXhpc3RzLi4uIHNvIHdlIGRvbid0IG5lZWQgYSBuZXcgb25lXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogIyMgU2F2ZWQgUnVucyBNYW5hZ2VyXG4gKlxuICogVGhlIFNhdmVkIFJ1bnMgTWFuYWdlciBpcyBhIHNwZWNpZmljIHR5cGUgb2YgW1J1biBNYW5hZ2VyXSguLi8uLi9ydW4tbWFuYWdlci8pIHdoaWNoIHByb3ZpZGVzIGFjY2VzcyB0byBhIGxpc3Qgb2YgcnVucyAocmF0aGVyIHRoYW4ganVzdCBvbmUgcnVuKS4gSXQgYWxzbyBwcm92aWRlcyB1dGlsaXR5IGZ1bmN0aW9ucyBmb3IgZGVhbGluZyB3aXRoIG11bHRpcGxlIHJ1bnMgKGUuZy4gc2F2aW5nLCBkZWxldGluZywgbGlzdGluZykuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgYSBTYXZlZCBSdW5zIE1hbmFnZXIgaXMgaW5jbHVkZWQgYXV0b21hdGljYWxseSBpbiBldmVyeSBpbnN0YW5jZSBvZiBhIFtTY2VuYXJpbyBNYW5hZ2VyXSguLi8pLCBhbmQgaXMgYWNjZXNzaWJsZSBmcm9tIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIGF0IGAuc2F2ZWRSdW5zYC4gU2VlIFttb3JlIGluZm9ybWF0aW9uXSguLi8jcHJvcGVydGllcykgb24gdXNpbmcgYC5zYXZlZFJ1bnNgIHdpdGhpbiB0aGUgU2NlbmFyaW8gTWFuYWdlci5cbiAqXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBpbmplY3RGaWx0ZXJzRnJvbVNlc3Npb24gPSByZXF1aXJlKCcuL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uO1xuXG52YXIgU2F2ZWRSdW5zTWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBzZXQsIHdpbGwgb25seSBwdWxsIHJ1bnMgZnJvbSBjdXJyZW50IGdyb3VwLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgc2NvcGVCeUdyb3VwOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBzZXQsIHdpbGwgb25seSBwdWxsIHJ1bnMgZnJvbSBjdXJyZW50IHVzZXIuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIG11bHRpcGxheWVyIHJ1biBjb21wYXJpc29uIHByb2plY3RzLCBzZXQgdGhpcyB0byBmYWxzZSBzbyB0aGF0IGFsbCBlbmQgdXNlcnMgaW4gYSBncm91cCBjYW4gdmlldyB0aGUgc2hhcmVkIHNldCBvZiBzYXZlZCBydW5zLlxuICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHNjb3BlQnlVc2VyOiB0cnVlLFxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBpZiAob3B0aW9ucy5ydW4pIHtcbiAgICAgICAgaWYgKG9wdGlvbnMucnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gb3B0aW9ucy5ydW47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJ1blNlcnZpY2UgPSBuZXcgUnVuU2VydmljZShvcHRpb25zLnJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJ1biBvcHRpb25zIHBhc3NlZCB0byBTYXZlZFJ1bnNNYW5hZ2VyJyk7XG4gICAgfVxufTtcblxuU2F2ZWRSdW5zTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogTWFya3MgYSBydW4gYXMgc2F2ZWQuIFxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IHdoaWxlIGFueSBydW4gY2FuIGJlIHNhdmVkLCBvbmx5IHJ1bnMgd2hpY2ggYWxzbyBtYXRjaCB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGBzY29wZUJ5R3JvdXBgIGFuZCBgc2NvcGVCeVVzZXJgIGFyZSByZXR1cm5lZCBieSB0aGUgYGdldFJ1bnMoKWAgbWV0aG9kLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNtID0gbmV3IEYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIoKTtcbiAgICAgKiAgICAgIHNtLnNhdmVkUnVucy5zYXZlKCcwMDAwMDE1YTRjZDE3MDAyMDljZDBhN2QyMDdmNDRiYWMyODknKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xSdW5TZXJ2aWNlfSBydW4gUnVuIHRvIHNhdmUuIFBhc3MgaW4gZWl0aGVyIHRoZSBydW4gaWQsIGFzIGEgc3RyaW5nLCBvciB0aGUgW1J1biBTZXJ2aWNlXSguLi8uLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG90aGVyRmllbGRzIChPcHRpb25hbCkgQW55IG90aGVyIG1ldGEtZGF0YSB0byBzYXZlIHdpdGggdGhlIHJ1bi5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHNhdmU6IGZ1bmN0aW9uIChydW4sIG90aGVyRmllbGRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvdGhlckZpZWxkcywgeyBzYXZlZDogdHJ1ZSwgdHJhc2hlZDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmsocnVuLCBwYXJhbSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBNYXJrcyBhIHJ1biBhcyByZW1vdmVkOyB0aGUgaW52ZXJzZSBvZiBtYXJraW5nIGFzIHNhdmVkLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNtID0gbmV3IEYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIoKTtcbiAgICAgKiAgICAgIHNtLnNhdmVkUnVucy5yZW1vdmUoJzAwMDAwMTVhNGNkMTcwMDIwOWNkMGE3ZDIwN2Y0NGJhYzI4OScpO1xuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfFJ1blNlcnZpY2V9IHJ1biBSdW4gdG8gcmVtb3ZlLiBQYXNzIGluIGVpdGhlciB0aGUgcnVuIGlkLCBhcyBhIHN0cmluZywgb3IgdGhlIFtSdW4gU2VydmljZV0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvdGhlckZpZWxkcyAoT3B0aW9uYWwpIGFueSBvdGhlciBtZXRhLWRhdGEgdG8gc2F2ZSB3aXRoIHRoZSBydW4uXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChydW4sIG90aGVyRmllbGRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvdGhlckZpZWxkcywgeyBzYXZlZDogZmFsc2UsIHRyYXNoZWQ6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmsocnVuLCBwYXJhbSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogU2V0cyBhZGRpdGlvbmFsIGZpZWxkcyBvbiBhIHJ1bi4gVGhpcyBpcyBhIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgW1J1blNlcnZpY2Ujc2F2ZV0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLyNzYXZlKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzbSA9IG5ldyBGLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyKCk7XG4gICAgICogICAgICBzbS5zYXZlZFJ1bnMubWFyaygnMDAwMDAxNWE0Y2QxNzAwMjA5Y2QwYTdkMjA3ZjQ0YmFjMjg5JywgXG4gICAgICogICAgICAgICAgeyAnbXlSdW5OYW1lJzogJ3NhbXBsZSBwb2xpY3kgZGVjaXNpb25zJyB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xSdW5TZXJ2aWNlfSBydW4gIFJ1biB0byBvcGVyYXRlIG9uLiBQYXNzIGluIGVpdGhlciB0aGUgcnVuIGlkLCBhcyBhIHN0cmluZywgb3IgdGhlIFtSdW4gU2VydmljZV0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSB0b01hcmsgRmllbGRzIHRvIHNldCwgYXMgbmFtZSA6IHZhbHVlIHBhaXJzLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgbWFyazogZnVuY3Rpb24gKHJ1biwgdG9NYXJrKSB7XG4gICAgICAgIHZhciBycztcbiAgICAgICAgdmFyIGV4aXN0aW5nT3B0aW9ucyA9IHRoaXMucnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCk7XG4gICAgICAgIGlmIChydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgICAgICBycyA9IHJ1bjtcbiAgICAgICAgfSBlbHNlIGlmIChydW4gJiYgKHR5cGVvZiBydW4gPT09ICdzdHJpbmcnKSkge1xuICAgICAgICAgICAgcnMgPSBuZXcgUnVuU2VydmljZSgkLmV4dGVuZCh0cnVlLCB7fSwgZXhpc3RpbmdPcHRpb25zLCB7IGlkOiBydW4sIGF1dG9SZXN0b3JlOiBmYWxzZSB9KSk7XG4gICAgICAgIH0gZWxzZSBpZiAoJC5pc0FycmF5KHJ1bikpIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcHJvbXMgPSBydW4ubWFwKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLm1hcmsociwgdG9NYXJrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBwcm9tcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcnVuIG9iamVjdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBycy5zYXZlKHRvTWFyayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIHNhdmVkIHJ1bnMuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgc20gPSBuZXcgRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlcigpO1xuICAgICAqICAgICAgc20uc2F2ZWRSdW5zLmdldFJ1bnMoKS50aGVuKGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICogICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHJ1bnMubGVuZ3RoOyBpKyspIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3J1biBpZCBvZiBzYXZlZCBydW46ICcsIHJ1bnNbaV0uaWQpO1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtICB7QXJyYXl9IHZhcmlhYmxlcyAoT3B0aW9uYWwpIElmIHByb3ZpZGVkLCBpbiB0aGUgcmV0dXJuZWQgbGlzdCBvZiBydW5zLCBlYWNoIHJ1biB3aWxsIGhhdmUgYSBgLnZhcmlhYmxlc2AgcHJvcGVydHkgd2l0aCB0aGVzZSBzZXQuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBmaWx0ZXIgICAgKE9wdGlvbmFsKSBBbnkgZmlsdGVycyB0byBhcHBseSB3aGlsZSBmZXRjaGluZyB0aGUgcnVuLiBTZWUgW1J1blNlcnZpY2UjZmlsdGVyXSguLi8uLi9ydW4tYXBpLXNlcnZpY2UvI2ZpbHRlcikgZm9yIGRldGFpbHMuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBtb2RpZmllcnMgKE9wdGlvbmFsKSBVc2UgZm9yIHBhZ2luZy9zb3J0aW5nIGV0Yy4gU2VlIFtSdW5TZXJ2aWNlI2ZpbHRlcl0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLyNmaWx0ZXIpIGZvciBkZXRhaWxzLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZ2V0UnVuczogZnVuY3Rpb24gKHZhcmlhYmxlcywgZmlsdGVyLCBtb2RpZmllcnMpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24odGhpcy5ydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKSk7XG5cbiAgICAgICAgdmFyIHJ1bm9wdHMgPSB0aGlzLnJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpO1xuICAgICAgICB2YXIgc2NvcGVkRmlsdGVyID0gaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uKCQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICBzYXZlZDogdHJ1ZSwgXG4gICAgICAgICAgICB0cmFzaGVkOiBmYWxzZSxcbiAgICAgICAgICAgIG1vZGVsOiBydW5vcHRzLm1vZGVsLFxuICAgICAgICB9LCBmaWx0ZXIpLCBzZXNzaW9uLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBvcE1vZGlmaWVycyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICBzb3J0OiAnY3JlYXRlZCcsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnLFxuICAgICAgICB9LCBtb2RpZmllcnMpO1xuICAgICAgICBpZiAodmFyaWFibGVzKSB7XG4gICAgICAgICAgICBvcE1vZGlmaWVycy5pbmNsdWRlID0gW10uY29uY2F0KHZhcmlhYmxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU2VydmljZS5xdWVyeShzY29wZWRGaWx0ZXIsIG9wTW9kaWZpZXJzKTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBTYXZlZFJ1bnNNYW5hZ2VyO1xuIiwiLyoqXG4qICMjIFNjZW5hcmlvIE1hbmFnZXJcbipcbiogSW4gc29tZSBwcm9qZWN0cywgb2Z0ZW4gY2FsbGVkIFwidHVybi1ieS10dXJuXCIgcHJvamVjdHMsIGVuZCB1c2VycyBhZHZhbmNlIHRocm91Z2ggdGhlIHByb2plY3QncyBtb2RlbCBzdGVwLWJ5LXN0ZXAsIHdvcmtpbmcgZWl0aGVyIGluZGl2aWR1YWxseSBvciB0b2dldGhlciB0byBtYWtlIGRlY2lzaW9ucyBhdCBlYWNoIHN0ZXAuIFxuKlxuKiBJbiBvdGhlciBwcm9qZWN0cywgb2Z0ZW4gY2FsbGVkIFwicnVuIGNvbXBhcmlzb25cIiBvciBcInNjZW5hcmlvIGNvbXBhcmlzb25cIiBwcm9qZWN0cywgZW5kIHVzZXJzIHNldCBzb21lIGluaXRpYWwgZGVjaXNpb25zLCB0aGVuIHNpbXVsYXRlIHRoZSBtb2RlbCB0byBpdHMgZW5kLiBUeXBpY2FsbHkgZW5kIHVzZXJzIHdpbGwgZG8gdGhpcyBzZXZlcmFsIHRpbWVzLCBjcmVhdGluZyBzZXZlcmFsIHJ1bnMsIGFuZCBjb21wYXJlIHRoZSByZXN1bHRzLiBcbipcbiogVGhlIFNjZW5hcmlvIE1hbmFnZXIgbWFrZXMgaXQgZWFzeSB0byBjcmVhdGUgdGhlc2UgXCJydW4gY29tcGFyaXNvblwiIHByb2plY3RzLiBFYWNoIFNjZW5hcmlvIE1hbmFnZXIgYWxsb3dzIHlvdSB0byBjb21wYXJlIHRoZSByZXN1bHRzIG9mIHNldmVyYWwgcnVucy4gVGhpcyBpcyBtb3N0bHkgdXNlZnVsIGZvciB0aW1lLWJhc2VkIG1vZGVsczsgYnkgZGVmYXVsdCwgeW91IGNhbiB1c2UgdGhlIFNjZW5hcmlvIE1hbmFnZXIgd2l0aCBbVmVuc2ltXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLCBbUG93ZXJzaW1dKC4uLy4uLy4uL21vZGVsX2NvZGUvcG93ZXJzaW0vKSwgYW5kIFtTaW1MYW5nXSguLi8uLi8uLi9tb2RlbF9jb2RlL2ZvcmlvX3NpbWxhbmcpLiAoWW91IGNhbiB1c2UgdGhlIFNjZW5hcmlvIE1hbmFnZXIgd2l0aCBvdGhlciBsYW5ndWFnZXMgYXMgd2VsbCwgYnkgdXNpbmcgdGhlIFNjZW5hcmlvIE1hbmFnZXIncyBbY29uZmlndXJhdGlvbiBvcHRpb25zXSgjY29uZmlndXJhdGlvbi1vcHRpb25zKSB0byBjaGFuZ2UgdGhlIGBhZHZhbmNlT3BlcmF0aW9uYC4pXG4qXG4qIFRoZSBTY2VuYXJpbyBNYW5hZ2VyIGNhbiBiZSB0aG91Z2h0IG9mIGFzIGEgY29sbGVjdGlvbiBvZiBbUnVuIE1hbmFnZXJzXSguLi9ydW4tbWFuYWdlci8pIHdpdGggcHJlLWNvbmZpZ3VyZWQgW3N0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKS4gSnVzdCBhcyB0aGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdXNlIGNhc2UgLWJhc2VkIGFic3RyYWN0aW9ucyBhbmQgdXRpbGl0aWVzIGZvciBtYW5hZ2luZyB0aGUgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSwgdGhlIFNjZW5hcmlvIE1hbmFnZXIgZG9lcyB0aGUgc2FtZSBmb3IgdGhlIFJ1biBNYW5hZ2VyLlxuKlxuKiBUaGVyZSBhcmUgdHlwaWNhbGx5IHRocmVlIGNvbXBvbmVudHMgdG8gYnVpbGRpbmcgYSBydW4gY29tcGFyaXNvbjpcbipcbiogKiBBIGBjdXJyZW50YCBydW4gaW4gd2hpY2ggdG8gbWFrZSBkZWNpc2lvbnM7IHRoaXMgaXMgZGVmaW5lZCBhcyBhIHJ1biB0aGF0IGhhc24ndCBiZWVuIGFkdmFuY2VkIHlldCwgYW5kIHNvIGNhbiBiZSB1c2VkIHRvIHNldCBpbml0aWFsIGRlY2lzaW9ucy4gVGhlIGN1cnJlbnQgcnVuIG1haW50YWlucyBzdGF0ZSBhY3Jvc3MgZGlmZmVyZW50IHNlc3Npb25zLlxuKiAqIEEgbGlzdCBvZiBgc2F2ZWRgIHJ1bnMsIHRoYXQgaXMsIGFsbCBydW5zIHRoYXQgeW91IHdhbnQgdG8gdXNlIGZvciBjb21wYXJpc29ucy5cbiogKiBBIGBiYXNlbGluZWAgcnVuIHRvIGNvbXBhcmUgYWdhaW5zdDsgdGhpcyBpcyBkZWZpbmVkIGFzIGEgcnVuIFwiYWR2YW5jZWQgdG8gdGhlIGVuZFwiIG9mIHlvdXIgbW9kZWwgdXNpbmcganVzdCB0aGUgbW9kZWwgZGVmYXVsdHMuIENvbXBhcmluZyBhZ2FpbnN0IGEgYmFzZWxpbmUgcnVuIGlzIG9wdGlvbmFsOyB5b3UgY2FuIFtjb25maWd1cmVdKCNjb25maWd1cmF0aW9uLW9wdGlvbnMpIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIHRvIG5vdCBpbmNsdWRlIG9uZS5cbipcbiogVG8gc2F0aXNmeSB0aGVzZSBuZWVkcyBhIFNjZW5hcmlvIE1hbmFnZXIgaW5zdGFuY2UgaGFzIHRocmVlIFJ1biBNYW5hZ2VyczogW2Jhc2VsaW5lXSguL2Jhc2VsaW5lLyksIFtjdXJyZW50XSguL2N1cnJlbnQvKSwgYW5kIFtzYXZlZFJ1bnNdKC4vc2F2ZWQvKS5cbipcbiogIyMjIFVzaW5nIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIHRvIGNyZWF0ZSBhIHJ1biBjb21wYXJpc29uIHByb2plY3RcbipcbiogVG8gdXNlIHRoZSBTY2VuYXJpbyBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCwgdGhlbiBhY2Nlc3MgaXRzIFJ1biBNYW5hZ2VycyBhcyBuZWVkZWQgdG8gY3JlYXRlIHlvdXIgcHJvamVjdCdzIHVzZXIgaW50ZXJmYWNlOlxuKlxuKiAqKkV4YW1wbGUqKlxuKlxuKiAgICAgICB2YXIgc20gPSBuZXcgRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlcih7XG4qICAgICAgICAgICBydW46IHtcbiogICAgICAgICAgICAgICBtb2RlbDogJ215bW9kZWwudm1mJ1xuKiAgICAgICAgICAgfVxuKiAgICAgICB9KTtcbipcbiogICAgICAgLy8gVGhlIGN1cnJlbnQgaXMgYW4gaW5zdGFuY2Ugb2YgYSBSdW4gTWFuYWdlcixcbiogICAgICAgLy8gd2l0aCBhIHN0cmF0ZWd5IHdoaWNoIHBpY2tzIHVwIHRoZSBtb3N0IHJlY2VudCB1bnNhdmVkIHJ1bi5cbiogICAgICAgLy8gSXQgaXMgdHlwaWNhbGx5IHVzZWQgdG8gc3RvcmUgdGhlIGRlY2lzaW9ucyBiZWluZyBtYWRlIGJ5IHRoZSBlbmQgdXNlci4gXG4qICAgICAgIHZhciBjdXJyZW50Uk0gPSBzbS5jdXJyZW50O1xuKlxuKiAgICAgICAvLyBUaGUgUnVuIE1hbmFnZXIgb3BlcmF0aW9uLCB3aGljaCByZXRyaWV2ZXMgdGhlIGN1cnJlbnQgcnVuLlxuKiAgICAgICBzbS5jdXJyZW50LmdldFJ1bigpO1xuKiAgICAgICAvLyBUaGUgUnVuIE1hbmFnZXIgb3BlcmF0aW9uLCB3aGljaCByZXNldHMgdGhlIGRlY2lzaW9ucyBtYWRlIG9uIHRoZSBjdXJyZW50IHJ1bi5cbiogICAgICAgc20uY3VycmVudC5yZXNldCgpO1xuKiAgICAgICAvLyBBIHNwZWNpYWwgbWV0aG9kIG9uIHRoZSBjdXJyZW50IHJ1bixcbiogICAgICAgLy8gd2hpY2ggY2xvbmVzIHRoZSBjdXJyZW50IHJ1biwgdGhlbiBhZHZhbmNlcyBhbmQgc2F2ZXMgdGhpcyBjbG9uZVxuKiAgICAgICAvLyAoaXQgYmVjb21lcyBwYXJ0IG9mIHRoZSBzYXZlZCBydW5zIGxpc3QpLlxuKiAgICAgICAvLyBUaGUgY3VycmVudCBydW4gaXMgdW5jaGFuZ2VkIGFuZCBjYW4gY29udGludWUgdG8gYmUgdXNlZFxuKiAgICAgICAvLyB0byBzdG9yZSBkZWNpc2lvbnMgYmVpbmcgbWFkZSBieSB0aGUgZW5kIHVzZXIuXG4qICAgICAgIHNtLmN1cnJlbnQuc2F2ZUFuZEFkdmFuY2UoKTtcbipcbiogICAgICAgLy8gVGhlIHNhdmVkUnVucyBpcyBhbiBpbnN0YW5jZSBvZiBhIFNhdmVkIFJ1bnMgTWFuYWdlciBcbiogICAgICAgLy8gKGl0c2VsZiBhIHZhcmlhbnQgb2YgYSBSdW4gTWFuYWdlcikuXG4qICAgICAgIC8vIEl0IGlzIHR5cGljYWxseSBkaXNwbGF5ZWQgaW4gdGhlIHByb2plY3QncyBVSSBhcyBwYXJ0IG9mIGEgcnVuIGNvbXBhcmlzb24gdGFibGUgb3IgY2hhcnQuXG4qICAgICAgIHZhciBzYXZlZFJNID0gc20uc2F2ZWRSdW5zO1xuKiAgICAgICAvLyBNYXJrIGEgcnVuIGFzIHNhdmVkLCBhZGRpbmcgaXQgdG8gdGhlIHNldCBvZiBzYXZlZCBydW5zLlxuKiAgICAgICBzbS5zYXZlZFJ1bnMuc2F2ZShydW4pO1xuKiAgICAgICAvLyBNYXJrIGEgcnVuIGFzIHJlbW92ZWQsIHJlbW92aW5nIGl0IGZyb20gdGhlIHNldCBvZiBzYXZlZCBydW5zLlxuKiAgICAgICBzbS5zYXZlZFJ1bnMucmVtb3ZlKHJ1bik7XG4qICAgICAgIC8vIExpc3QgdGhlIHNhdmVkIHJ1bnMsIG9wdGlvbmFsbHkgaW5jbHVkaW5nIHNvbWUgc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzIGZvciBlYWNoLlxuKiAgICAgICBzbS5zYXZlZFJ1bnMuZ2V0UnVucygpO1xuKlxuKiAgICAgICAvLyBUaGUgYmFzZWxpbmUgaXMgYW4gaW5zdGFuY2Ugb2YgYSBSdW4gTWFuYWdlcixcbiogICAgICAgLy8gd2l0aCBhIHN0cmF0ZWd5IHdoaWNoIGxvY2F0ZXMgdGhlIG1vc3QgcmVjZW50IGJhc2VsaW5lIHJ1blxuKiAgICAgICAvLyAodGhhdCBpcywgZmxhZ2dlZCBhcyBgc2F2ZWRgIGFuZCBub3QgYHRyYXNoZWRgKSwgb3IgY3JlYXRlcyBhIG5ldyBvbmUuXG4qICAgICAgIC8vIEl0IGlzIHR5cGljYWxseSBkaXNwbGF5ZWQgaW4gdGhlIHByb2plY3QncyBVSSBhcyBwYXJ0IG9mIGEgcnVuIGNvbXBhcmlzb24gdGFibGUgb3IgY2hhcnQuXG4qICAgICAgIHZhciBiYXNlbGluZVJNID0gc20uYmFzZWxpbmU7XG4qXG4qICAgICAgIC8vIFRoZSBSdW4gTWFuYWdlciBvcGVyYXRpb24sIHdoaWNoIHJldHJpZXZlcyB0aGUgYmFzZWxpbmUgcnVuLlxuKiAgICAgICBzbS5iYXNlbGluZS5nZXRSdW4oKTtcbiogICAgICAgLy8gVGhlIFJ1biBNYW5hZ2VyIG9wZXJhdGlvbiwgd2hpY2ggcmVzZXRzIHRoZSBiYXNlbGluZSBydW4uXG4qICAgICAgIC8vIFVzZWZ1bCBpZiB0aGUgbW9kZWwgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGJhc2VsaW5lIHJ1biB3YXMgY3JlYXRlZC5cbiogICAgICAgc20uYmFzZWxpbmUucmVzZXQoKTsgXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFNlZSBpbnRlZ3JhdGlvbi10ZXN0LXNjZW5hcmlvLW1hbmFnZXIgZm9yIHVzYWdlIGV4YW1wbGVzXG52YXIgUnVuTWFuYWdlciA9IHJlcXVpcmUoJy4vcnVuLW1hbmFnZXInKTtcbnZhciBTYXZlZFJ1bnNNYW5hZ2VyID0gcmVxdWlyZSgnLi9zYXZlZC1ydW5zLW1hbmFnZXInKTtcbnZhciBzdHJhdGVneVV0aWxzID0gcmVxdWlyZSgnLi9zdHJhdGVneS11dGlscycpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xuXG52YXIgTm9uZVN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9ydW4tc3RyYXRlZ2llcy9ub25lLXN0cmF0ZWd5Jyk7XG5cbnZhciBTdGF0ZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cbnZhciBCYXNlbGluZVN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9zY2VuYXJpby1zdHJhdGVnaWVzL2Jhc2VsaW5lLXN0cmF0ZWd5Jyk7XG52YXIgTGFzdFVuc2F2ZWRTdHJhdGVneSA9IHJlcXVpcmUoJy4vc2NlbmFyaW8tc3RyYXRlZ2llcy9yZXVzZS1sYXN0LXVuc2F2ZWQnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIE9wZXJhdGlvbnMgdG8gcGVyZm9ybSBvbiBlYWNoIHJ1biB0byBpbmRpY2F0ZSB0aGF0IHRoZSBydW4gaXMgY29tcGxldGUuIE9wZXJhdGlvbnMgYXJlIGV4ZWN1dGVkIFtzZXJpYWxseV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyNzZXJpYWwpLiBEZWZhdWx0cyB0byBjYWxsaW5nIHRoZSBtb2RlbCBvcGVyYXRpb24gYHN0ZXBUbygnZW5kJylgLCB3aGljaCBhZHZhbmNlcyBWZW5zaW0sIFBvd2Vyc2ltLCBhbmQgU2ltTGFuZyBtb2RlbHMgdG8gdGhlIGVuZC4gXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIGFkdmFuY2VPcGVyYXRpb246IFt7IG5hbWU6ICdzdGVwVG8nLCBwYXJhbXM6IFsnZW5kJ10gfV0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIG9wdGlvbnMgdG8gcGFzcyB0aHJvdWdoIHRvIHJ1biBjcmVhdGlvbiAoZm9yIGUuZy4sIGBmaWxlc2AsIGV0Yy4pLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBydW46IHt9LFxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdG8gaW5jbHVkZSBhIGJhc2VsaW5lIHJ1biBpbiB0aGlzIFNjZW5hcmlvIE1hbmFnZXIuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBpbmNsdWRlQmFzZUxpbmU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBgYmFzZWxpbmVgIHJ1bi4gXG4gICAgICpcbiAgICAgKiAqIGBiYXNlbGluZS5ydW5OYW1lYDogTmFtZSBvZiB0aGUgYmFzZWxpbmUgcnVuLiBEZWZhdWx0cyB0byAnQmFzZWxpbmUnLiBcbiAgICAgKiAqIGBiYXNlbGluZS5ydW5gOiBBZGRpdGlvbmFsIG9wdGlvbnMgdG8gcGFzcyB0aHJvdWdoIHRvIHJ1biBjcmVhdGlvbiwgc3BlY2lmaWNhbGx5IGZvciB0aGUgYmFzZWxpbmUgcnVuLiBUaGVzZSB3aWxsIG92ZXJyaWRlIGFueSBvcHRpb25zIHByb3ZpZGVkIHVuZGVyIGBydW5gLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuIFxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgYmFzZWxpbmU6IHtcbiAgICAgICAgcnVuTmFtZTogJ0Jhc2VsaW5lJyxcbiAgICAgICAgcnVuOiB7fVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBgY3VycmVudGAgcnVuLiBcbiAgICAgKlxuICAgICAqICogYGN1cnJlbnQucnVuYDogQWRkaXRpb25hbCBvcHRpb25zIHRvIHBhc3MgdGhyb3VnaCB0byBydW4gY3JlYXRpb24sIHNwZWNpZmljYWxseSBmb3IgdGhlIGN1cnJlbnQgcnVuLiBUaGVzZSB3aWxsIG92ZXJyaWRlIGFueSBvcHRpb25zIHByb3ZpZGVkIHVuZGVyIGBydW5gLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBjdXJyZW50OiB7XG4gICAgICAgIHJ1bjoge31cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3B0aW9ucyB0byBwYXNzIHRocm91Z2ggdG8gdGhlIGBzYXZlZFJ1bnNgIGxpc3QuIFNlZSB0aGUgW1NhdmVkIFJ1bnMgTWFuYWdlcl0oLi9zYXZlZC8pIGZvciBjb21wbGV0ZSBkZXNjcmlwdGlvbiBvZiBhdmFpbGFibGUgb3B0aW9ucy4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgc2F2ZWRSdW5zOiB7fVxufTtcblxuZnVuY3Rpb24gY29va2llTmFtZUZyb21PcHRpb25zKHByZWZpeCwgY29uZmlnKSB7XG4gICAgdmFyIGtleSA9IFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ21vZGVsJ10ucmVkdWNlKGZ1bmN0aW9uIChhY2N1bSwga2V5KSB7XG4gICAgICAgIHJldHVybiBjb25maWdba2V5XSA/IGFjY3VtICsgJy0nICsgY29uZmlnW2tleV0gOiBhY2N1bTsgXG4gICAgfSwgcHJlZml4KTtcbiAgICByZXR1cm4ga2V5O1xufVxuXG5mdW5jdGlvbiBTY2VuYXJpb01hbmFnZXIoY29uZmlnKSB7XG4gICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcuYWR2YW5jZU9wZXJhdGlvbikge1xuICAgICAgICBvcHRzLmFkdmFuY2VPcGVyYXRpb24gPSBjb25maWcuYWR2YW5jZU9wZXJhdGlvbjsgLy9qcXVlcnkuZXh0ZW5kIGRvZXMgYSBwb29yIGpvYiB0cnlpbmcgdG8gbWVyZ2UgYXJyYXlzXG4gICAgfVxuXG4gICAgdmFyIEJhc2VsaW5lU3RyYXRlZ3lUb1VzZSA9IG9wdHMuaW5jbHVkZUJhc2VMaW5lID8gQmFzZWxpbmVTdHJhdGVneSA6IE5vbmVTdHJhdGVneTtcbiAgICAvKipcbiAgICAgKiBBIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBpbnN0YW5jZSBjb250YWluaW5nIGEgJ2Jhc2VsaW5lJyBydW4gdG8gY29tcGFyZSBhZ2FpbnN0OyB0aGlzIGlzIGRlZmluZWQgYXMgYSBydW4gXCJhZHZhbmNlZCB0byB0aGUgZW5kXCIgb2YgeW91ciBtb2RlbCB1c2luZyBqdXN0IHRoZSBtb2RlbCBkZWZhdWx0cy4gQnkgZGVmYXVsdCB0aGUgXCJhZHZhbmNlXCIgb3BlcmF0aW9uIGlzIGFzc3VtZWQgdG8gYmUgYHN0ZXBUbzogZW5kYCwgd2hpY2ggd29ya3MgZm9yIHRpbWUtYmFzZWQgbW9kZWxzIGluIFtWZW5zaW1dKC4uLy4uLy4uL21vZGVsX2NvZGUvdmVuc2ltLyksIFtQb3dlcnNpbV0oLi4vLi4vLi4vbW9kZWxfY29kZS9wb3dlcnNpbS8pLCBhbmQgW1NpbUxhbmddKC4uLy4uLy4uL21vZGVsX2NvZGUvZm9yaW9fc2ltbGFuZykuIElmIHlvdSdyZSB1c2luZyBhIGRpZmZlcmVudCBsYW5ndWFnZSwgb3IgbmVlZCB0byBjaGFuZ2UgdGhpcywganVzdCBwYXNzIGluIGEgZGlmZmVyZW50IGBhZHZhbmNlT3BlcmF0aW9uYCBvcHRpb24gd2hpbGUgY3JlYXRpbmcgdGhlIFNjZW5hcmlvIE1hbmFnZXIuIFRoZSBiYXNlbGluZSBydW4gaXMgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiAgICAgKiBAcmV0dXJuIHtSdW5NYW5hZ2VyfVxuICAgICAqL1xuICAgIHRoaXMuYmFzZWxpbmUgPSBuZXcgUnVuTWFuYWdlcih7XG4gICAgICAgIHN0cmF0ZWd5OiBCYXNlbGluZVN0cmF0ZWd5VG9Vc2UsXG4gICAgICAgIHNlc3Npb25LZXk6IGNvb2tpZU5hbWVGcm9tT3B0aW9ucy5iaW5kKG51bGwsICdzbS1iYXNlbGluZS1ydW4nKSxcbiAgICAgICAgcnVuOiBzdHJhdGVneVV0aWxzLm1lcmdlUnVuT3B0aW9ucyhvcHRzLnJ1biwgb3B0cy5iYXNlbGluZS5ydW4pLFxuICAgICAgICBzdHJhdGVneU9wdGlvbnM6IHtcbiAgICAgICAgICAgIGJhc2VsaW5lTmFtZTogb3B0cy5iYXNlbGluZS5ydW5OYW1lLFxuICAgICAgICAgICAgaW5pdE9wZXJhdGlvbjogb3B0cy5hZHZhbmNlT3BlcmF0aW9uXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEEgW1NhdmVkUnVuc01hbmFnZXJdKC4uL3NhdmVkLXJ1bnMtbWFuYWdlci8pIGluc3RhbmNlIGNvbnRhaW5pbmcgYSBsaXN0IG9mIHNhdmVkIHJ1bnMsIHRoYXQgaXMsIGFsbCBydW5zIHRoYXQgeW91IHdhbnQgdG8gdXNlIGZvciBjb21wYXJpc29ucy4gVGhlIHNhdmVkIHJ1bnMgYXJlIHR5cGljYWxseSBkaXNwbGF5ZWQgaW4gdGhlIHByb2plY3QncyBVSSBhcyBwYXJ0IG9mIGEgcnVuIGNvbXBhcmlzb24gdGFibGUgb3IgY2hhcnQuXG4gICAgICogQHJldHVybiB7U2F2ZWRSdW5zTWFuYWdlcn1cbiAgICAgKi9cbiAgICB0aGlzLnNhdmVkUnVucyA9IG5ldyBTYXZlZFJ1bnNNYW5hZ2VyKCQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgIHJ1bjogb3B0cy5ydW4sXG4gICAgfSwgb3B0cy5zYXZlZFJ1bnMpKTtcblxuICAgIHZhciBvcmlnR2V0UnVucyA9IHRoaXMuc2F2ZWRSdW5zLmdldFJ1bnM7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB0aGlzLnNhdmVkUnVucy5nZXRSdW5zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBtZS5iYXNlbGluZS5nZXRSdW4oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnR2V0UnVucy5hcHBseShtZS5zYXZlZFJ1bnMsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgaW5zdGFuY2UgY29udGFpbmluZyBhICdjdXJyZW50JyBydW47IHRoaXMgaXMgZGVmaW5lZCBhcyBhIHJ1biB0aGF0IGhhc24ndCBiZWVuIGFkdmFuY2VkIHlldCwgYW5kIHNvIGNhbiBiZSB1c2VkIHRvIHNldCBpbml0aWFsIGRlY2lzaW9ucy4gVGhlIGN1cnJlbnQgcnVuIGlzIHR5cGljYWxseSB1c2VkIHRvIHN0b3JlIHRoZSBkZWNpc2lvbnMgYmVpbmcgbWFkZSBieSB0aGUgZW5kIHVzZXIuXG4gICAgICogQHJldHVybiB7UnVuTWFuYWdlcn1cbiAgICAgKi9cbiAgICB0aGlzLmN1cnJlbnQgPSBuZXcgUnVuTWFuYWdlcih7XG4gICAgICAgIHN0cmF0ZWd5OiBMYXN0VW5zYXZlZFN0cmF0ZWd5LFxuICAgICAgICBzZXNzaW9uS2V5OiBjb29raWVOYW1lRnJvbU9wdGlvbnMuYmluZChudWxsLCAnc20tY3VycmVudC1ydW4nKSxcbiAgICAgICAgcnVuOiBzdHJhdGVneVV0aWxzLm1lcmdlUnVuT3B0aW9ucyhvcHRzLnJ1biwgb3B0cy5jdXJyZW50LnJ1bilcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENsb25lcyB0aGUgY3VycmVudCBydW4sIGFkdmFuY2VzIHRoaXMgY2xvbmUgYnkgY2FsbGluZyB0aGUgYGFkdmFuY2VPcGVyYXRpb25gLCBhbmQgc2F2ZXMgdGhlIGNsb25lZCBydW4gKGl0IGJlY29tZXMgcGFydCBvZiB0aGUgYHNhdmVkUnVuc2AgbGlzdCkuIEFkZGl0aW9uYWxseSwgYWRkcyBhbnkgcHJvdmlkZWQgbWV0YWRhdGEgdG8gdGhlIGNsb25lZCBydW47IHR5cGljYWxseSB1c2VkIGZvciBuYW1pbmcgdGhlIHJ1bi4gVGhlIGN1cnJlbnQgcnVuIGlzIHVuY2hhbmdlZCBhbmQgY2FuIGNvbnRpbnVlIHRvIGJlIHVzZWQgdG8gc3RvcmUgZGVjaXNpb25zIGJlaW5nIG1hZGUgYnkgdGhlIGVuZCB1c2VyLlxuICAgICAqXG4gICAgICogQXZhaWxhYmxlIG9ubHkgZm9yIHRoZSBTY2VuYXJpbyBNYW5hZ2VyJ3MgYGN1cnJlbnRgIHByb3BlcnR5IChSdW4gTWFuYWdlcikuIFxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNtID0gbmV3IEYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIoKTtcbiAgICAgKiAgICAgIHNtLmN1cnJlbnQuc2F2ZUFuZEFkdmFuY2UoeydteVJ1bk5hbWUnOiAnc2FtcGxlIHBvbGljeSBkZWNpc2lvbnMnfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gbWV0YWRhdGEgICBNZXRhZGF0YSB0byBzYXZlLCBmb3IgZXhhbXBsZSwgdGhlIHJ1biBuYW1lLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgdGhpcy5jdXJyZW50LnNhdmVBbmRBZHZhbmNlID0gZnVuY3Rpb24gKG1ldGFkYXRhKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNsb25lKHJ1bikge1xuICAgICAgICAgICAgdmFyIHNhID0gbmV3IFN0YXRlU2VydmljZSgpO1xuICAgICAgICAgICAgdmFyIGFkdmFuY2VPcG5zID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcHRzLmFkdmFuY2VPcGVyYXRpb24pOyBcbiAgICAgICAgICAgIC8vcnVuIGknbSBjbG9uaW5nIHNob3VsZG4ndCBoYXZlIHRoZSBhZHZhbmNlIG9wZXJhdGlvbnMgdGhlcmUgYnkgZGVmYXVsdCwgYnV0IGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgcmV0dXJuIHNhLmNsb25lKHsgcnVuSWQ6IHJ1bi5pZCwgZXhjbHVkZTogYWR2YW5jZU9wbnMub3BzIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJzID0gbmV3IFJ1blNlcnZpY2UobWUuY3VycmVudC5ydW4uZ2V0Q3VycmVudENvbmZpZygpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnMubG9hZChyZXNwb25zZS5ydW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbWFya1NhdmVkKHJ1bikge1xuICAgICAgICAgICAgcmV0dXJuIG1lLnNhdmVkUnVucy5zYXZlKHJ1bi5pZCwgbWV0YWRhdGEpLnRoZW4oZnVuY3Rpb24gKHNhdmVkUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIHJ1biwgc2F2ZWRSZXNwb25zZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBhZHZhbmNlKHJ1bikge1xuICAgICAgICAgICAgdmFyIHJzID0gbmV3IFJ1blNlcnZpY2UocnVuKTtcbiAgICAgICAgICAgIHJldHVybiBycy5zZXJpYWwob3B0cy5hZHZhbmNlT3BlcmF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lLmN1cnJlbnRcbiAgICAgICAgICAgICAgICAuZ2V0UnVuKClcbiAgICAgICAgICAgICAgICAudGhlbihjbG9uZSlcbiAgICAgICAgICAgICAgICAudGhlbihhZHZhbmNlKVxuICAgICAgICAgICAgICAgIC50aGVuKG1hcmtTYXZlZCk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuYXJpb01hbmFnZXI7XG4iLCIvKipcbiAqICMjIEJhc2VsaW5lXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgYSBbUnVuIE1hbmFnZXJdKC4uLy4uL3J1bi1tYW5hZ2VyLykgd2l0aCBhIGJhc2VsaW5lIHN0cmF0ZWd5IGlzIGluY2x1ZGVkIGF1dG9tYXRpY2FsbHkgaW4gZXZlcnkgaW5zdGFuY2Ugb2YgYSBbU2NlbmFyaW8gTWFuYWdlcl0oLi4vKSwgYW5kIGlzIGFjY2Vzc2libGUgZnJvbSB0aGUgU2NlbmFyaW8gTWFuYWdlciBhdCBgLmJhc2VsaW5lYC5cbiAqXG4gKiBBIGJhc2VsaW5lIGlzIGRlZmluZWQgYXMgYSBydW4gXCJhZHZhbmNlZCB0byB0aGUgZW5kXCIgdXNpbmcganVzdCB0aGUgbW9kZWwgZGVmYXVsdHMuIFRoZSBiYXNlbGluZSBydW4gaXMgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiAqXG4gKiBUaGUgYGJhc2VsaW5lYCBzdHJhdGVneSBsb29rcyBmb3IgdGhlIG1vc3QgcmVjZW50IHJ1biBuYW1lZCBhcyAnQmFzZWxpbmUnIChvciBuYW1lZCBhcyBzcGVjaWZpZWQgaW4gdGhlIGBiYXNlbGluZS5ydW5OYW1lYCBbY29uZmlndXJhdGlvbiBvcHRpb24gb2YgdGhlIFNjZW5hcmlvIE1hbmFnZXJdKC4uLyNjb25maWd1cmF0aW9uLW9wdGlvbnMpKSB0aGF0IGlzIGZsYWdnZWQgYXMgYHNhdmVkYCBhbmQgbm90IGB0cmFzaGVkYC4gSWYgdGhlIHN0cmF0ZWd5IGNhbm5vdCBmaW5kIHN1Y2ggYSBydW4sIGl0IGNyZWF0ZXMgYSBuZXcgcnVuIGFuZCBpbW1lZGlhdGVseSBleGVjdXRlcyBhIHNldCBvZiBpbml0aWFsaXphdGlvbiBvcGVyYXRpb25zLiBcbiAqXG4gKiBDb21wYXJpbmcgYWdhaW5zdCBhIGJhc2VsaW5lIHJ1biBpcyBvcHRpb25hbCBpbiBhIFNjZW5hcmlvIE1hbmFnZXI7IHlvdSBjYW4gW2NvbmZpZ3VyZV0oLi4vI2NvbmZpZ3VyYXRpb24tb3B0aW9ucykgeW91ciBTY2VuYXJpbyBNYW5hZ2VyIHRvIG5vdCBpbmNsdWRlIG9uZS4gU2VlIFttb3JlIGluZm9ybWF0aW9uXSguLi8jcHJvcGVydGllcykgb24gdXNpbmcgYC5iYXNlbGluZWAgd2l0aGluIHRoZSBTY2VuYXJpbyBNYW5hZ2VyLlxuICpcbiAqIFNlZSBhbHNvOiBbYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBvbiBydW4gc3RyYXRlZ2llc10oLi4vLi4vc3RyYXRlZ2llcy8pLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZXVzZWluaXRTdHJhdGVneSA9IHJlcXVpcmUoJy4uL3J1bi1zdHJhdGVnaWVzL3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgYmFzZWxpbmVOYW1lOiAnQmFzZWxpbmUnLFxuICAgICAgICBpbml0T3BlcmF0aW9uOiBbeyBzdGVwVG86ICdlbmQnIH1dXG4gICAgfTtcbiAgICB2YXIgc3RyYXRlZ3lPcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMuc3RyYXRlZ3lPcHRpb25zIDoge307XG4gICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHN0cmF0ZWd5T3B0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBSZXVzZWluaXRTdHJhdGVneSh7XG4gICAgICAgIHN0cmF0ZWd5T3B0aW9uczoge1xuICAgICAgICAgICAgaW5pdE9wZXJhdGlvbjogb3B0cy5pbml0T3BlcmF0aW9uLFxuICAgICAgICAgICAgZmxhZzoge1xuICAgICAgICAgICAgICAgIHNhdmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRyYXNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5hbWU6IG9wdHMuYmFzZWxpbmVOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG4iLCIvKipcbiAqICMjIEN1cnJlbnQgKHJldXNlLWxhc3QtdW5zYXZlZClcbiAqXG4gKiBBbiBpbnN0YW5jZSBvZiBhIFtSdW4gTWFuYWdlcl0oLi4vLi4vcnVuLW1hbmFnZXIvKSB3aXRoIHRoaXMgc3RyYXRlZ3kgaXMgaW5jbHVkZWQgYXV0b21hdGljYWxseSBpbiBldmVyeSBpbnN0YW5jZSBvZiBhIFtTY2VuYXJpbyBNYW5hZ2VyXSguLi8pLCBhbmQgaXMgYWNjZXNzaWJsZSBmcm9tIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIGF0IGAuY3VycmVudGAuXG4gKlxuICogVGhlIGByZXVzZS1sYXN0LXVuc2F2ZWRgIHN0cmF0ZWd5IHJldHVybnMgdGhlIG1vc3QgcmVjZW50IHJ1biB0aGF0IGlzIG5vdCBmbGFnZ2VkIGFzIGB0cmFzaGVkYCBhbmQgYWxzbyBub3QgZmxhZ2dlZCBhcyBgc2F2ZWRgLlxuICogXG4gKiBVc2luZyB0aGlzIHN0cmF0ZWd5IG1lYW5zIHRoYXQgZW5kIHVzZXJzIGNvbnRpbnVlIHdvcmtpbmcgd2l0aCB0aGUgbW9zdCByZWNlbnQgcnVuIHRoYXQgaGFzIG5vdCBiZWVuIGV4cGxpY2l0bHkgZmxhZ2dlZCBieSB0aGUgcHJvamVjdC4gSG93ZXZlciwgaWYgdGhlcmUgYXJlIG5vIHJ1bnMgZm9yIHRoaXMgZW5kIHVzZXIsIGEgbmV3IHJ1biBpcyBjcmVhdGVkLlxuICogXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIENoZWNrIHRoZSBgc2F2ZWRgIGFuZCBgdHJhc2hlZGAgZmllbGRzIG9mIHRoZSBydW4gdG8gZGV0ZXJtaW5lIGlmIHRoZSBydW4gaGFzIGJlZW4gZXhwbGljaXRseSBzYXZlZCBvciBleHBsaWNpdGx5IGZsYWdnZWQgYXMgbm8gbG9uZ2VyIHVzZWZ1bC5cbiAqICAgICAqIFJldHVybiB0aGUgbW9zdCByZWNlbnQgcnVuIHRoYXQgaXMgbm90IGB0cmFzaGVkYCBhbmQgYWxzbyBub3QgYHNhdmVkYC5cbiAqICAgICAqIElmIHRoZXJlIGFyZSBubyBydW5zLCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLiBcbiAqXG4gKiBTZWUgW21vcmUgaW5mb3JtYXRpb25dKC4uLyNwcm9wZXJ0aWVzKSBvbiB1c2luZyBgLmN1cnJlbnRgIHdpdGhpbiB0aGUgU2NlbmFyaW8gTWFuYWdlci5cbiAqXG4gKiBTZWUgYWxzbzogW2FkZGl0aW9uYWwgaW5mb3JtYXRpb24gb24gcnVuIHN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWdpZXMvKS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uID0gcmVxdWlyZSgnLi4vc3RyYXRlZ3ktdXRpbHMnKS5pbmplY3RGaWx0ZXJzRnJvbVNlc3Npb247XG52YXIgaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbjtcblxudmFyIEJhc2UgPSB7fTtcblxuLy9UT0RPOiBNYWtlIGEgbW9yZSBnZW5lcmljIHZlcnNpb24gb2YgdGhpcyBjYWxsZWQgJ3JldXNlLWJ5LW1hdGNoaW5nLWZpbHRlcic7XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBzdHJhdGVneU9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucy5zdHJhdGVneU9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gc3RyYXRlZ3lPcHRpb25zO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBvcHQgPSBpbmplY3RTY29wZUZyb21TZXNzaW9uKHJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpLCB1c2VyU2Vzc2lvbik7XG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlLmNyZWF0ZShvcHQsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24gKGNyZWF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIGNyZWF0ZVJlc3BvbnNlLCB7IGZyZXNobHlDcmVhdGVkOiB0cnVlIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdHMpIHtcbiAgICAgICAgdmFyIHJ1bm9wdHMgPSBydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKTtcbiAgICAgICAgdmFyIGZpbHRlciA9IGluamVjdEZpbHRlcnNGcm9tU2Vzc2lvbih7IFxuICAgICAgICAgICAgc2F2ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHJhc2hlZDogZmFsc2UsXG4gICAgICAgICAgICBtb2RlbDogcnVub3B0cy5tb2RlbCxcbiAgICAgICAgfSwgdXNlclNlc3Npb24pO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgb3V0cHV0TW9kaWZpZXJzID0geyBcbiAgICAgICAgICAgIHN0YXJ0cmVjb3JkOiAwLFxuICAgICAgICAgICAgZW5kcmVjb3JkOiAwLFxuICAgICAgICAgICAgc29ydDogJ2NyZWF0ZWQnLCBcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlLnF1ZXJ5KGZpbHRlciwgb3V0cHV0TW9kaWZpZXJzKS50aGVuKGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgICAgICBpZiAoIXJ1bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5zWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG59LCB7IHJlcXVpcmVzQXV0aDogZmFsc2UgfSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zLCBtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLnJlc2V0KG9wdGlvbnMpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWVyZ2VSdW5PcHRpb25zOiBmdW5jdGlvbiAocnVuLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgICAgICBydW4udXBkYXRlQ29uZmlnKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgfSBcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBydW4sIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBpbmplY3RGaWx0ZXJzRnJvbVNlc3Npb246IGZ1bmN0aW9uIChjdXJyZW50RmlsdGVyLCBzZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIHNjb3BlQnlHcm91cDogdHJ1ZSxcbiAgICAgICAgICAgIHNjb3BlQnlVc2VyOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGZpbHRlciA9ICQuZXh0ZW5kKHRydWUsIHt9LCBjdXJyZW50RmlsdGVyKTtcbiAgICAgICAgaWYgKG9wdHMuc2NvcGVCeUdyb3VwICYmIHNlc3Npb24gJiYgc2Vzc2lvbi5ncm91cE5hbWUpIHtcbiAgICAgICAgICAgIGZpbHRlclsnc2NvcGUuZ3JvdXAnXSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLnNjb3BlQnlVc2VyICYmIHNlc3Npb24gJiYgc2Vzc2lvbi51c2VySWQpIHtcbiAgICAgICAgICAgIGZpbHRlclsndXNlci5pZCddID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbHRlcjtcbiAgICB9LFxuXG4gICAgaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbjogZnVuY3Rpb24gKGN1cnJlbnRQYXJhbXMsIHNlc3Npb24pIHtcbiAgICAgICAgdmFyIGdyb3VwID0gc2Vzc2lvbiAmJiBzZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBjdXJyZW50UGFyYW1zKTtcbiAgICAgICAgaWYgKGdyb3VwKSB7XG4gICAgICAgICAgICAkLmV4dGVuZChwYXJhbXMsIHtcbiAgICAgICAgICAgICAgICBzY29wZTogeyBncm91cDogZ3JvdXAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG59OyIsIi8qKlxuKiAjIyBXb3JsZCBNYW5hZ2VyXG4qXG4qIEFzIGRpc2N1c3NlZCB1bmRlciB0aGUgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pLCBhIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy5cbipcbiogVGhlIFdvcmxkIE1hbmFnZXIgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gdHJhY2sgYW5kIGFjY2VzcyB0aGUgY3VycmVudCB3b3JsZCBhbmQgcnVuIGZvciBwYXJ0aWN1bGFyIGVuZCB1c2Vycy4gSXQgaXMgdHlwaWNhbGx5IHVzZWQgaW4gcGFnZXMgdGhhdCBlbmQgdXNlcnMgd2lsbCBpbnRlcmFjdCB3aXRoLiAoVGhlIHJlbGF0ZWQgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pIGhhbmRsZXMgY3JlYXRpbmcgbXVsdGlwbGF5ZXIgd29ybGRzLCBhbmQgYWRkaW5nIGFuZCByZW1vdmluZyBlbmQgdXNlcnMgYW5kIHJ1bnMgZnJvbSBhIHdvcmxkLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuKVxuKlxuKiAjIyMgVXNpbmcgdGhlIFdvcmxkIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBXb3JsZCBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdC4gVGhlbiwgbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4qXG4qIFdoZW4geW91IGluc3RhbnRpYXRlIGEgV29ybGQgTWFuYWdlciwgdGhlIHdvcmxkJ3MgYWNjb3VudCBpZCwgcHJvamVjdCBpZCwgYW5kIGdyb3VwIGFyZSBhdXRvbWF0aWNhbGx5IHRha2VuIGZyb20gdGhlIHNlc3Npb24gKHRoYW5rcyB0byB0aGUgW0F1dGhlbnRpY2F0aW9uIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UpKS5cbipcbiogTm90ZSB0aGF0IHRoZSBXb3JsZCBNYW5hZ2VyIGRvZXMgKm5vdCogY3JlYXRlIHdvcmxkcyBhdXRvbWF0aWNhbGx5LiAoVGhpcyBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlcikuKSBIb3dldmVyLCB5b3UgY2FuIHBhc3MgaW4gc3BlY2lmaWMgb3B0aW9ucyB0byBhbnkgcnVucyBjcmVhdGVkIGJ5IHRoZSBtYW5hZ2VyLCB1c2luZyBhIGBydW5gIG9iamVjdC5cbipcbiogVGhlIHBhcmFtZXRlcnMgZm9yIGNyZWF0aW5nIGEgV29ybGQgTWFuYWdlciBhcmU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSAqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlIGZvciB0aGlzIHByb2plY3QuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYGdyb3VwYDogVGhlICoqR3JvdXAgTmFtZSoqIGZvciB0aGlzIHdvcmxkLlxuKiAgICogYHJ1bmA6IE9wdGlvbnMgdG8gdXNlIHdoZW4gY3JlYXRpbmcgbmV3IHJ1bnMgd2l0aCB0aGUgbWFuYWdlciwgZS5nLiBgcnVuOiB7IGZpbGVzOiBbJ2RhdGEueGxzJ10gfWAuXG4qICAgKiBgcnVuLm1vZGVsYDogVGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgbW9kZWwgZmlsZSBmb3IgdGhpcyBwcm9qZWN0LiBSZXF1aXJlZCBpZiB5b3UgaGF2ZSBub3QgYWxyZWFkeSBwYXNzZWQgaXQgaW4gYXMgcGFydCBvZiB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciBmb3IgYW4gZW5jbG9zaW5nIGNhbGwuXG4qXG4qIEZvciBleGFtcGxlOlxuKlxuKiAgICAgICB2YXIgd01nciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICBydW46IHsgbW9kZWw6ICdzdXBwbHktY2hhaW4ucHknIH0sXG4qICAgICAgICAgIGdyb3VwOiAndGVhbTEnXG4qICAgICAgIH0pO1xuKlxuKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oKTtcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFdvcmxkQXBpID0gcmVxdWlyZSgnLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIFJ1bk1hbmFnZXIgPSByZXF1aXJlKCcuL3J1bi1tYW5hZ2VyJyk7XG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuL2F1dGgtbWFuYWdlcicpO1xudmFyIHdvcmxkQXBpO1xuXG5mdW5jdGlvbiBidWlsZFN0cmF0ZWd5KHdvcmxkSWQsIGR0ZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIEN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgICAgICQuZXh0ZW5kKHRoaXMsIHtcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZC4gTmVlZCBhcGkgY2hhbmdlcycpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLy9nZXQgb3IgY3JlYXRlIVxuICAgICAgICAgICAgICAgIC8vIE1vZGVsIGlzIHJlcXVpcmVkIGluIHRoZSBvcHRpb25zXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5vcHRpb25zLnJ1bi5tb2RlbCB8fCB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZElkIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UubG9hZChydW5JZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlV2l0aChtZSwgW3J1bl0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgeyBydW46IHt9LCB3b3JsZDoge30gfTtcblxuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLnJ1bik7XG4gICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5vcHRpb25zLCB0aGlzLm9wdGlvbnMud29ybGQpO1xuXG4gICAgd29ybGRBcGkgPSBuZXcgV29ybGRBcGkodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLl9hdXRoID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIHZhciBhcGkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCB3b3JsZCAob2JqZWN0KSBhbmQgYW4gaW5zdGFuY2Ugb2YgdGhlIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRXb3JsZCgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkLCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdvcmxkQWRhcHRlci5nZXRDdXJyZW50UnVuSWQoKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aG9zZSB3b3JsZCBpcyBiZWluZyBhY2Nlc3NlZC4gRGVmYXVsdHMgdG8gdGhlIGdyb3VwIGZvciB0aGUgdXNlciBpbiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRXb3JsZDogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgICAgICB1c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcih1c2VySWQsIGdyb3VwTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBydW4gKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oJ215TW9kZWwucHknKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4sIHJ1blNlcnZpY2UpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJ1bi5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICBydW5TZXJ2aWNlLmRvKCdzdGFydEdhbWUnKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlbCAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBtb2RlbCBmaWxlLiBSZXF1aXJlZCBpZiBub3QgYWxyZWFkeSBwYXNzZWQgaW4gYXMgYHJ1bi5tb2RlbGAgd2hlbiB0aGUgV29ybGQgTWFuYWdlciBpcyBjcmVhdGVkLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW46IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFuZFJlc3RvcmVMYXRlc3RSdW4od29ybGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgcGFydCBvZiBhbnkgd29ybGQhJyB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdvcmxkSWQgPSB3b3JsZC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcnVuT3B0cyA9ICQuZXh0ZW5kKHRydWUsIG1lLm9wdGlvbnMsIHsgbW9kZWw6IG1vZGVsIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBydW5PcHRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm0uZ2V0UnVuKClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmUocnVuLCBybS5ydW5TZXJ2aWNlLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmdldEN1cnJlbnRXb3JsZChjdXJVc2VySWQsIGN1ckdyb3VwTmFtZSlcbiAgICAgICAgICAgICAgICAudGhlbihnZXRBbmRSZXN0b3JlTGF0ZXN0UnVuKTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgYXBpKTtcbn07XG4iLCIvKipcbiAqICMjIEZpbGUgQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgRmlsZSBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIHVwbG9hZCBhbmQgZG93bmxvYWQgZmlsZXMgZGlyZWN0bHkgb250byBFcGljZW50ZXIsIGFuYWxvZ291cyB0byB1c2luZyB0aGUgRmlsZSBNYW5hZ2VyIFVJIGluIEVwaWNlbnRlciBkaXJlY3RseSBvciBTRlRQaW5nIGZpbGVzIGluLiBJdCBpcyBiYXNlZCBvbiB0aGUgRXBpY2VudGVyIEZpbGUgQVBJLlxuICpcbiAqICAgICAgIHZhciBmYSA9IG5ldyBGLnNlcnZpY2UuRmlsZSh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgfSk7XG4gKiAgICAgICBmYS5jcmVhdGUoJ3Rlc3QudHh0JywgJ3RoZXNlIGFyZSBteSBmaWxlY29udGVudHMnKTtcbiAqXG4gKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgZmlsZSB1c2luZyBhIGZpbGUgdXBsb2FkZWQgdGhyb3VnaCBhIGZpbGUgaW5wdXRcbiAqICAgICAgIC8vIDxpbnB1dCBpZD1cImZpbGV1cGxvYWRcIiB0eXBlPVwiZmlsZVwiPlxuICogICAgICAgLy9cbiAqICAgICAgICQoJyNmaWxldXBsb2FkJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChlKSB7XG4gKiAgICAgICAgICB2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuICogICAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSwgZmlsZS5uYW1lKTtcbiAqICAgICAgICAgIGZhLmNyZWF0ZShmaWxlLm5hbWUsIGRhdGEpO1xuICogICAgICAgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGZvbGRlciB0eXBlLiAgT25lIG9mIGBtb2RlbGAgfCBgc3RhdGljYCB8IGBub2RlYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZvbGRlclR5cGU6ICdzdGF0aWMnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gdXBsb2FkQm9keShmaWxlTmFtZSwgY29udGVudHMpIHtcbiAgICAgICAgdmFyIGJvdW5kYXJ5ID0gJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLTdkYTI0ZjJlNTAwNDYnO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBib2R5OiAnLS0nICsgYm91bmRhcnkgKyAnXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCJmaWxlXCI7JyArXG4gICAgICAgICAgICAgICAgICAgICdmaWxlbmFtZT1cIicgKyBmaWxlTmFtZSArICdcIlxcclxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC10eXBlOiB0ZXh0L2h0bWxcXHJcXG5cXHJcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudHMgKyAnXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICctLScgKyBib3VuZGFyeSArICctLScsXG4gICAgICAgICAgICBib3VuZGFyeTogYm91bmRhcnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGxvYWRGaWxlT3B0aW9ucyhmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpIHtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zcGxpdCgnLycpO1xuICAgICAgICB2YXIgZmlsZU5hbWUgPSBmaWxlUGF0aC5wb3AoKTtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5qb2luKCcvJyk7XG4gICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuXG4gICAgICAgIHZhciBleHRyYVBhcmFtcyA9IHt9O1xuICAgICAgICBpZiAoY29udGVudHMgaW5zdGFuY2VvZiBGb3JtRGF0YSkge1xuICAgICAgICAgICAgZXh0cmFQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogY29udGVudHMsXG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkID0gdXBsb2FkQm9keShmaWxlTmFtZSwgY29udGVudHMpO1xuICAgICAgICAgICAgZXh0cmFQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogdXBsb2FkLmJvZHksXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0nICsgdXBsb2FkLmJvdW5kYXJ5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aCxcbiAgICAgICAgfSwgZXh0cmFQYXJhbXMpO1xuICAgIH1cblxuICAgIHZhciBwdWJsaWNBc3luY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBhIGRpcmVjdG9yeSBsaXN0aW5nLCBvciBjb250ZW50cyBvZiBhIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlUGF0aCAgUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0Q29udGVudHM6IGZ1bmN0aW9uIChmaWxlUGF0aCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXBsYWNlcyB0aGUgZmlsZSBhdCB0aGUgZ2l2ZW4gZmlsZSBwYXRoLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nIHwgRm9ybURhdGEgfSBjb250ZW50cyBDb250ZW50cyB0byB3cml0ZSB0byBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcmVwbGFjZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gdXBsb2FkRmlsZU9wdGlvbnMoZmlsZVBhdGgsIGNvbnRlbnRzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnB1dChodHRwT3B0aW9ucy5kYXRhLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBmaWxlIGluIHRoZSBnaXZlbiBmaWxlIHBhdGguXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmcgfCBGb3JtRGF0YSB9IGNvbnRlbnRzIENvbnRlbnRzIHRvIHdyaXRlIHRvIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7Qm9vbGVhbn0gcmVwbGFjZUV4aXN0aW5nIFJlcGxhY2UgZmlsZSBpZiBpdCBhbHJlYWR5IGV4aXN0czsgZGVmYXVsdHMgdG8gZmFsc2VcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBjb250ZW50cywgcmVwbGFjZUV4aXN0aW5nLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSB1cGxvYWRGaWxlT3B0aW9ucyhmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHByb20gPSBodHRwLnBvc3QoaHR0cE9wdGlvbnMuZGF0YSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIGlmIChyZXBsYWNlRXhpc3RpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBwcm9tID0gcHJvbS50aGVuKG51bGwsIGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbmZsaWN0U3RhdHVzID0gNDA5O1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gY29uZmxpY3RTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXBsYWNlKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9tO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIHRoZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmFtZXMgdGhlIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG5ld05hbWUgIE5ldyBuYW1lIG9mIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICByZW5hbWU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgbmV3TmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKHsgbmFtZTogbmV3TmFtZSB9LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xufTtcbiIsIi8qKlxuICogIyMgQXNzZXQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgQXNzZXQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBzdG9yZSBhc3NldHMgLS0gcmVzb3VyY2VzIG9yIGZpbGVzIG9mIGFueSBraW5kIC0tIHVzZWQgYnkgYSBwcm9qZWN0IHdpdGggYSBzY29wZSB0aGF0IGlzIHNwZWNpZmljIHRvIHByb2plY3QsIGdyb3VwLCBvciBlbmQgdXNlci5cbiAqXG4gKiBBc3NldHMgYXJlIHVzZWQgd2l0aCBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vcHJvamVjdF9hZG1pbi8jdGVhbSkuIE9uZSBjb21tb24gdXNlIGNhc2UgaXMgaGF2aW5nIGVuZCB1c2VycyBpbiBhIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3Vwcykgb3IgaW4gYSBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkgdXBsb2FkIGRhdGEgLS0gdmlkZW9zIGNyZWF0ZWQgZHVyaW5nIGdhbWUgcGxheSwgcHJvZmlsZSBwaWN0dXJlcyBmb3IgY3VzdG9taXppbmcgdGhlaXIgZXhwZXJpZW5jZSwgZXRjLiAtLSBhcyBwYXJ0IG9mIHBsYXlpbmcgdGhyb3VnaCB0aGUgcHJvamVjdC5cbiAqXG4gKiBSZXNvdXJjZXMgY3JlYXRlZCB1c2luZyB0aGUgQXNzZXQgQWRhcHRlciBhcmUgc2NvcGVkOlxuICpcbiAqICAqIFByb2plY3QgYXNzZXRzIGFyZSB3cml0YWJsZSBvbmx5IGJ5IFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSwgdGhhdCBpcywgRXBpY2VudGVyIGF1dGhvcnMuXG4gKiAgKiBHcm91cCBhc3NldHMgYXJlIHdyaXRhYmxlIGJ5IGFueW9uZSB3aXRoIGFjY2VzcyB0byB0aGUgcHJvamVjdCB0aGF0IGlzIHBhcnQgb2YgdGhhdCBwYXJ0aWN1bGFyIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoaXMgaW5jbHVkZXMgYWxsIFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSAoRXBpY2VudGVyIGF1dGhvcnMpIGFuZCBhbnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2YgdGhlIGdyb3VwIC0tIGJvdGggZmFjaWxpdGF0b3JzIGFuZCBzdGFuZGFyZCBlbmQgdXNlcnMuXG4gKiAgKiBVc2VyIGFzc2V0cyBhcmUgd3JpdGFibGUgYnkgdGhlIHNwZWNpZmljIGVuZCB1c2VyLCBhbmQgYnkgdGhlIGZhY2lsaXRhdG9yIG9mIHRoZSBncm91cC5cbiAqICAqIEFsbCBhc3NldHMgYXJlIHJlYWRhYmxlIGJ5IGFueW9uZSB3aXRoIHRoZSBleGFjdCBVUkkuXG4gKlxuICogVG8gdXNlIHRoZSBBc3NldCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpIGFuZCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKikuIFRoZSBncm91cCBuYW1lIGlzIHJlcXVpcmVkIGZvciBhc3NldHMgd2l0aCBhIGdyb3VwIHNjb3BlLCBhbmQgdGhlIGdyb3VwIG5hbWUgYW5kIHVzZXJJZCBhcmUgcmVxdWlyZWQgZm9yIGFzc2V0cyB3aXRoIGEgdXNlciBzY29wZS4gSWYgbm90IGluY2x1ZGVkLCB0aGV5IGFyZSB0YWtlbiBmcm9tIHRoZSBsb2dnZWQgaW4gdXNlcidzIHNlc3Npb24gaW5mb3JtYXRpb24gaWYgbmVlZGVkLlxuICpcbiAqIFdoZW4gY3JlYXRpbmcgYW4gYXNzZXQsIHlvdSBjYW4gcGFzcyBpbiB0ZXh0IChlbmNvZGVkIGRhdGEpIHRvIHRoZSBgY3JlYXRlKClgIGNhbGwuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gbWFrZSB0aGUgYGNyZWF0ZSgpYCBjYWxsIGFzIHBhcnQgb2YgYW4gSFRNTCBmb3JtIGFuZCBwYXNzIGluIGEgZmlsZSB1cGxvYWRlZCB2aWEgdGhlIGZvcm0uXG4gKlxuICogICAgICAgLy8gaW5zdGFudGlhdGUgdGhlIEFzc2V0IEFkYXB0ZXJcbiAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICogICAgICAgICAgdXNlcklkOiAnMTIzNDUnXG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICAvLyBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElIUmxjM1FnWm1sc1pTND0nLFxuICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAqXG4gKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gKiAgICAgICAvL1xuICogICAgICAgLy8gPGZvcm0gaWQ9XCJ1cGxvYWQtZmlsZVwiPlxuICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5VcGxvYWQgbXlGaWxlPC9idXR0b24+XG4gKiAgICAgICAvLyA8L2Zvcm0+XG4gKiAgICAgICAvL1xuICogICAgICAgJCgnI3VwbG9hZC1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gKiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjZmlsZW5hbWUnKS52YWwoKTtcbiAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gKlxuICogICAgICAgICAgYWEuY3JlYXRlKGZpbGVuYW1lLCBkYXRhLCB7IHNjb3BlOiAndXNlcicgfSk7XG4gKiAgICAgICB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIGFwaUVuZHBvaW50ID0gJ2Fzc2V0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gRGVmYXVsdHMgdG8gc2Vzc2lvbidzIGBncm91cE5hbWVgLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXA6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB1c2VyIGlkLiBEZWZhdWx0cyB0byBzZXNzaW9uJ3MgYHVzZXJJZGAuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzY29wZSBmb3IgdGhlIGFzc2V0LiBWYWxpZCB2YWx1ZXMgYXJlOiBgdXNlcmAsIGBncm91cGAsIGFuZCBgcHJvamVjdGAuIFNlZSBhYm92ZSBmb3IgdGhlIHJlcXVpcmVkIHBlcm1pc3Npb25zIHRvIHdyaXRlIHRvIGVhY2ggc2NvcGUuIERlZmF1bHRzIHRvIGB1c2VyYCwgbWVhbmluZyB0aGUgY3VycmVudCBlbmQgdXNlciBvciBhIGZhY2lsaXRhdG9yIGluIHRoZSBlbmQgdXNlcidzIGdyb3VwIGNhbiBlZGl0IHRoZSBhc3NldC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHNjb3BlOiAndXNlcicsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRlcm1pbmVzIGlmIGEgcmVxdWVzdCB0byBsaXN0IHRoZSBhc3NldHMgaW4gYSBzY29wZSBpbmNsdWRlcyB0aGUgY29tcGxldGUgVVJMIGZvciBlYWNoIGFzc2V0IChgdHJ1ZWApLCBvciBvbmx5IHRoZSBmaWxlIG5hbWVzIG9mIHRoZSBhc3NldHMgKGBmYWxzZWApLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVsbFVybDogdHJ1ZSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB0cmFuc3BvcnQgb2JqZWN0IGNvbnRhaW5zIHRoZSBvcHRpb25zIHBhc3NlZCB0byB0aGUgWEhSIHJlcXVlc3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHtcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZVxuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBhc3NldEFwaVBhcmFtcyA9IFsnZW5jb2RpbmcnLCAnZGF0YScsICdjb250ZW50VHlwZSddO1xuICAgIHZhciBzY29wZUNvbmZpZyA9IHtcbiAgICAgICAgdXNlcjogWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnLCAndXNlcklkJ10sXG4gICAgICAgIGdyb3VwOiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddLFxuICAgICAgICBwcm9qZWN0OiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCddLFxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlbmFtZSA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICBpZiAoIWZpbGVuYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbGVuYW1lIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVVcmxQYXJhbXMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcGFydEtleXMgPSBzY29wZUNvbmZpZ1tvcHRpb25zLnNjb3BlXTtcbiAgICAgICAgaWYgKCFwYXJ0S2V5cykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzY29wZSBwYXJhbWV0ZXIgaXMgbmVlZGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgJC5lYWNoKHBhcnRLZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnNbdGhpc10pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcyArICcgcGFyYW1ldGVyIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBidWlsZFVybCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YWxpZGF0ZVVybFBhcmFtcyhvcHRpb25zKTtcbiAgICAgICAgdmFyIHBhcnRLZXlzID0gc2NvcGVDb25maWdbb3B0aW9ucy5zY29wZV07XG4gICAgICAgIHZhciBwYXJ0cyA9ICQubWFwKHBhcnRLZXlzLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIGFkZGluZyBhIHRyYWlsaW5nIC8gaW4gdGhlIFVSTCBhcyB0aGUgQXNzZXQgQVBJXG4gICAgICAgICAgICAvLyBkb2VzIG5vdCB3b3JrIGNvcnJlY3RseSB3aXRoIGl0XG4gICAgICAgICAgICBmaWxlbmFtZSA9ICcvJyArIGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBwYXJ0cy5qb2luKCcvJykgKyBmaWxlbmFtZTtcbiAgICB9O1xuXG4gICAgLy8gUHJpdmF0ZSBmdW5jdGlvbiwgYWxsIHJlcXVlc3RzIGZvbGxvdyBhIG1vcmUgb3IgbGVzcyBzYW1lIGFwcHJvYWNoIHRvXG4gICAgLy8gdXNlIHRoZSBBc3NldCBBUEkgYW5kIHRoZSBkaWZmZXJlbmNlIGlzIHRoZSBIVFRQIHZlcmJcbiAgICAvL1xuICAgIC8vIEBwYXJhbSB7c3RyaW5nfSBtZXRob2RgIChSZXF1aXJlZCkgSFRUUCB2ZXJiXG4gICAgLy8gQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lYCAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gZGVsZXRlL3JlcGxhY2UvY3JlYXRlXG4gICAgLy8gQHBhcmFtIHtvYmplY3R9IHBhcmFtc2AgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJXG4gICAgLy8gQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgdmFyIHVwbG9hZCA9IGZ1bmN0aW9uIChtZXRob2QsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZSk7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcGFyYW1ldGVyIGlzIGNsZWFuXG4gICAgICAgIG1ldGhvZCA9IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgY29udGVudFR5cGUgPSBwYXJhbXMgaW5zdGFuY2VvZiBGb3JtRGF0YSA9PT0gdHJ1ZSA/IGZhbHNlIDogJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICBpZiAoY29udGVudFR5cGUgPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIGFzc2V0QXBpUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSB3ZSdyZSBzZW5kaW5nIGZvcm0gZGF0YSB3aGljaCBnb2VzIGRpcmVjdGx5IGluIHJlcXVlc3QgYm9keVxuICAgICAgICAgICAgLy8gRm9yIG11bHRpcGFydC9mb3JtLWRhdGEgdXBsb2FkcyB0aGUgZmlsZW5hbWUgaXMgbm90IHNldCBpbiB0aGUgVVJMLFxuICAgICAgICAgICAgLy8gaXQncyBnZXR0aW5nIHBpY2tlZCBieSB0aGUgRm9ybURhdGEgZmllbGQgZmlsZW5hbWUuXG4gICAgICAgICAgICBmaWxlbmFtZSA9IG1ldGhvZCA9PT0gJ3Bvc3QnIHx8IG1ldGhvZCA9PT0gJ3B1dCcgPyAnJyA6IGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCwgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIH0pO1xuXG4gICAgICAgIHJldHVybiBodHRwW21ldGhvZF0ocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQ3JlYXRlcyBhIGZpbGUgaW4gdGhlIEFzc2V0IEFQSS4gVGhlIHNlcnZlciByZXR1cm5zIGFuIGVycm9yIChzdGF0dXMgY29kZSBgNDA5YCwgY29uZmxpY3QpIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLCBzb1xuICAgICAgICAqIGNoZWNrIGZpcnN0IHdpdGggYSBgbGlzdCgpYCBvciBhIGBnZXQoKWAuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAgICAqICAgICAgICAgIHVzZXJJZDogJydcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBhc3NldCB1c2luZyBlbmNvZGVkIHRleHRcbiAgICAgICAgKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICAgICAgICAqICAgICAgICAgICBlbmNvZGluZzogJ0JBU0VfNjQnLFxuICAgICAgICAqICAgICAgICAgICBkYXRhOiAnVkdocGN5QnBjeUJoSUhSbGMzUWdabWxzWlM0PScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gICAgICAgICogICAgICAgLy8gdGhpcyBzYW1wbGUgY29kZSBnb2VzIHdpdGggYW4gaHRtbCBmb3JtIHRoYXQgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgLy8gPGZvcm0gaWQ9XCJ1cGxvYWQtZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZVwiIHR5cGU9XCJmaWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlbmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJteUZpbGUudHh0XCI+XG4gICAgICAgICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5VcGxvYWQgbXlGaWxlPC9idXR0b24+XG4gICAgICAgICogICAgICAgLy8gPC9mb3JtPlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgJCgnI3VwbG9hZC1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICogICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICQoJyNmaWxlbmFtZScpLnZhbCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGlucHV0Q29udHJvbCA9ICQoJyNmaWxlJylbMF07XG4gICAgICAgICogICAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBpbnB1dENvbnRyb2wuZmlsZXNbMF0sIGZpbGVuYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgIGFhLmNyZWF0ZShmaWxlbmFtZSwgZGF0YSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGNyZWF0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIChPcHRpb25hbCkgQm9keSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIEFzc2V0IEFQSS4gUmVxdWlyZWQgaWYgdGhlIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLCBvdGhlcndpc2UgaWdub3JlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmVuY29kaW5nIEVpdGhlciBgSEVYYCBvciBgQkFTRV82NGAuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZGF0YSBUaGUgZW5jb2RlZCBkYXRhIGZvciB0aGUgZmlsZS4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZW50VHlwZSBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBPcHRpb25hbC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ3Bvc3QnLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIGEgZmlsZSBmcm9tIHRoZSBBc3NldCBBUEksIGZldGNoaW5nIHRoZSBhc3NldCBjb250ZW50LiAoVG8gZ2V0IGEgbGlzdFxuICAgICAgICAqIG9mIHRoZSBhc3NldHMgaW4gYSBzY29wZSwgdXNlIGBsaXN0KClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gcmV0cmlldmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGdldFNlcnZpY2VPcHRpb25zID0gX3BpY2soc2VydmljZU9wdGlvbnMsIFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJywgJ3VzZXJJZCddKTtcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIGdldFNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB1cmxPcHRpb25zLCB7IHVybDogdXJsIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIGxpc3Qgb2YgdGhlIGFzc2V0cyBpbiBhIHNjb3BlLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIGFhLmxpc3QoeyBmdWxsVXJsOiB0cnVlIH0pLnRoZW4oZnVuY3Rpb24oZmlsZUxpc3Qpe1xuICAgICAgICAqICAgICAgICAgICBjb25zb2xlLmxvZygnYXJyYXkgb2YgZmlsZXMgPSAnLCBmaWxlTGlzdCk7XG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnNjb3BlIChPcHRpb25hbCkgVGhlIHNjb3BlIChgdXNlcmAsIGBncm91cGAsIGBwcm9qZWN0YCkuXG4gICAgICAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmZ1bGxVcmwgKE9wdGlvbmFsKSBEZXRlcm1pbmVzIGlmIHRoZSBsaXN0IG9mIGFzc2V0cyBpbiBhIHNjb3BlIGluY2x1ZGVzIHRoZSBjb21wbGV0ZSBVUkwgZm9yIGVhY2ggYXNzZXQgKGB0cnVlYCksIG9yIG9ubHkgdGhlIGZpbGUgbmFtZXMgb2YgdGhlIGFzc2V0cyAoYGZhbHNlYCkuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKCcnLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwgfSk7XG4gICAgICAgICAgICB2YXIgZnVsbFVybCA9IGdldE9wdGlvbnMuZnVsbFVybDtcblxuICAgICAgICAgICAgaWYgKCFmdWxsVXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmdWxsUGF0aEZpbGVzID0gJC5tYXAoZmlsZXMsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGRVcmwoZmlsZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZVdpdGgobWUsIFtmdWxsUGF0aEZpbGVzXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmVwbGFjZXMgYW4gZXhpc3RpbmcgZmlsZSBpbiB0aGUgQXNzZXQgQVBJLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIHJlcGxhY2UgYW4gYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gICAgICAgICogICAgICAgYWEucmVwbGFjZSgndGVzdC50eHQnLCB7XG4gICAgICAgICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gICAgICAgICogICAgICAgICAgIGRhdGE6ICdWR2hwY3lCcGN5QmhJSE5sWTI5dVpDQjBaWE4wSUdacGJHVXUnLFxuICAgICAgICAqICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXG4gICAgICAgICogICAgICAgfSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgcmVwbGFjZSBhbiBhc3NldCB1c2luZyBhIGZpbGUgdXBsb2FkZWQgdGhyb3VnaCBhIGZvcm1cbiAgICAgICAgKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAvLyA8Zm9ybSBpZD1cInJlcGxhY2UtZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZVwiIHR5cGU9XCJmaWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJyZXBsYWNlLWZpbGVuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIm15RmlsZS50eHRcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlJlcGxhY2UgbXlGaWxlPC9idXR0b24+XG4gICAgICAgICogICAgICAgLy8gPC9mb3JtPlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgJCgnI3JlcGxhY2UtZmlsZScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAqICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjcmVwbGFjZS1maWxlbmFtZScpLnZhbCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGlucHV0Q29udHJvbCA9ICQoJyNmaWxlJylbMF07XG4gICAgICAgICogICAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBpbnB1dENvbnRyb2wuZmlsZXNbMF0sIGZpbGVuYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgIGFhLnJlcGxhY2UoZmlsZW5hbWUsIGRhdGEsIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgYmVpbmcgcmVwbGFjZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUEkuIFJlcXVpcmVkIGlmIHRoZSBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYCwgb3RoZXJ3aXNlIGlnbm9yZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5lbmNvZGluZyBFaXRoZXIgYEhFWGAgb3IgYEJBU0VfNjRgLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmRhdGEgVGhlIGVuY29kZWQgZGF0YSBmb3IgdGhlIGZpbGUuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGVudFR5cGUgVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gT3B0aW9uYWwuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZXBsYWNlOiBmdW5jdGlvbiAoZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwbG9hZCgncHV0JywgZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyBhIGZpbGUgZnJvbSB0aGUgQXNzZXQgQVBJLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIGFhLmRlbGV0ZShzYW1wbGVGaWxlTmFtZSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGRlbGV0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdkZWxldGUnLCBmaWxlbmFtZSwge30sIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzc2V0VXJsOiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2UgcHJvdmlkZXMgYSBtZXRob2QgZm9yIGxvZ2dpbmcgaW4sIHdoaWNoIGNyZWF0ZXMgYW5kIHJldHVybnMgYSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAqXG4gKiBVc2VyIGFjY2VzcyB0b2tlbnMgYXJlIHJlcXVpcmVkIGZvciBlYWNoIGNhbGwgdG8gRXBpY2VudGVyLiAoU2VlIFtQcm9qZWN0IEFjY2Vzc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4pXG4gKlxuICogSWYgeW91IG5lZWQgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IC0tIHN1Y2ggYXMgdHJhY2tpbmcgc2Vzc2lvbiBpbmZvcm1hdGlvbiwgZWFzaWx5IHJldHJpZXZpbmcgdGhlIHVzZXIgdG9rZW4sIG9yIGdldHRpbmcgdGhlIGdyb3VwcyB0byB3aGljaCBhbiBlbmQgdXNlciBiZWxvbmdzIC0tIGNvbnNpZGVyIHVzaW5nIHRoZSBbQXV0aG9yaXphdGlvbiBNYW5hZ2VyXSguLi9hdXRoLW1hbmFnZXIvKSBpbnN0ZWFkLlxuICpcbiAqICAgICAgdmFyIGF1dGggPSBuZXcgRi5zZXJ2aWNlLkF1dGgoKTtcbiAqICAgICAgYXV0aC5sb2dpbih7IHVzZXJOYW1lOiAnanNtaXRoQGFjbWVzaW11bGF0aW9ucy5jb20nLFxuICogICAgICAgICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VyTmFtZTogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFzc3dvcmQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZCBmb3IgdGhpcyBgdXNlck5hbWVgLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yIHRoZSAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gUmVxdWlyZWQgaWYgdGhlIGB1c2VyTmFtZWAgaXMgZm9yIGFuIFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdhdXRoZW50aWNhdGlvbicpXG4gICAgfSk7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvZ3MgdXNlciBpbiwgcmV0dXJuaW5nIHRoZSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgbm8gYHVzZXJOYW1lYCBvciBgcGFzc3dvcmRgIHdlcmUgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLCB0aGV5IGFyZSByZXF1aXJlZCBpbiB0aGUgYG9wdGlvbnNgIGhlcmUuIElmIG5vIGBhY2NvdW50YCB3YXMgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zIGFuZCB0aGUgYHVzZXJOYW1lYCBpcyBmb3IgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGUgYGFjY291bnRgIGlzIHJlcXVpcmVkIGFzIHdlbGwuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dpbih7XG4gICAgICAgICAqICAgICAgICAgIHVzZXJOYW1lOiAnanNtaXRoJyxcbiAgICAgICAgICogICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCcsXG4gICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyB9KVxuICAgICAgICAgKiAgICAgIC50aGVuKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXIgYWNjZXNzIHRva2VuIGlzOiBcIiwgdG9rZW4uYWNjZXNzX3Rva2VuKTtcbiAgICAgICAgICogICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AgfSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VyTmFtZSB8fCAhaHR0cE9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IHsgc3RhdHVzOiA0MDEsIHN0YXR1c01lc3NhZ2U6ICdObyB1c2VybmFtZSBvciBwYXNzd29yZCBzcGVjaWZpZWQuJyB9O1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IuY2FsbCh0aGlzLCByZXNwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChyZXNwKS5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwb3N0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBodHRwT3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogaHR0cE9wdGlvbnMucGFzc3dvcmQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGh0dHBPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvL3Bhc3MgaW4gbnVsbCBmb3IgYWNjb3VudCB1bmRlciBvcHRpb25zIGlmIHlvdSBkb24ndCB3YW50IGl0IHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICBwb3N0UGFyYW1zLmFjY291bnQgPSBodHRwT3B0aW9ucy5hY2NvdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBvc3RQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyAocmVwbGFjZSB3aXRoIC8qICovIGNvbW1lbnQgYmxvY2ssIHRvIG1ha2UgdmlzaWJsZSBpbiBkb2NzLCBvbmNlIHRoaXMgaXMgbW9yZSB0aGFuIGEgbm9vcClcbiAgICAgICAgLy9cbiAgICAgICAgLy8gTG9ncyB1c2VyIG91dCBmcm9tIHNwZWNpZmllZCBhY2NvdW50cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRXBpY2VudGVyIGxvZ291dCBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LCBzbyBmb3Igbm93IHRoaXMgaXMgYSBkdW1teSBwcm9taXNlIHRoYXQgZ2V0cyBhdXRvbWF0aWNhbGx5IHJlc29sdmVkLlxuICAgICAgICAvL1xuICAgICAgICAvLyAqKkV4YW1wbGUqKlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIGF1dGgubG9nb3V0KCk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vICoqUGFyYW1ldGVycyoqXG4gICAgICAgIC8vIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgLy9cbiAgICAgICAgbG9nb3V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICogIyMgQ2hhbm5lbCBTZXJ2aWNlXG4gKlxuICogVGhlIEVwaWNlbnRlciBwbGF0Zm9ybSBwcm92aWRlcyBhIHB1c2ggY2hhbm5lbCwgd2hpY2ggYWxsb3dzIHlvdSB0byBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgdG8gbWVzc2FnZXMgd2l0aGluIGEgW3Byb2plY3RdKC4uLy4uLy4uL2dsb3NzYXJ5LyNwcm9qZWN0cyksIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcyksIG9yIFttdWx0aXBsYXllciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogSWYgeW91IGFyZSBkZXZlbG9waW5nIHdpdGggRXBpY2VudGVyLmpzLCB5b3Ugc2hvdWxkIHVzZSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSBkaXJlY3RseS4gVGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgZG9jdW1lbnRhdGlvbiBhbHNvIGhhcyBtb3JlIFtiYWNrZ3JvdW5kXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyNiYWNrZ3JvdW5kKSBpbmZvcm1hdGlvbiBvbiBjaGFubmVscyBhbmQgdGhlaXIgdXNlLlxuICpcbiAqIFRoZSBDaGFubmVsIFNlcnZpY2UgaXMgYSBidWlsZGluZyBibG9jayBmb3IgdGhpcyBmdW5jdGlvbmFsaXR5LiBJdCBjcmVhdGVzIGEgcHVibGlzaC1zdWJzY3JpYmUgb2JqZWN0LCBhbGxvd2luZyB5b3UgdG8gcHVibGlzaCBtZXNzYWdlcywgc3Vic2NyaWJlIHRvIG1lc3NhZ2VzLCBvciB1bnN1YnNjcmliZSBmcm9tIG1lc3NhZ2VzIGZvciBhIGdpdmVuICd0b3BpYycgb24gYSBgJC5jb21ldGRgIHRyYW5zcG9ydCBpbnN0YW5jZS5cbiAqXG4gKiBZb3UnbGwgbmVlZCB0byBpbmNsdWRlIHRoZSBgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qc2AgbGlicmFyeSBpbiBhZGRpdGlvbiB0byB0aGUgYGVwaWNlbnRlci5qc2AgbGlicmFyeSBpbiB5b3VyIHByb2plY3QgdG8gdXNlIHRoZSBDaGFubmVsIFNlcnZpY2UuIFNlZSBbSW5jbHVkaW5nIEVwaWNlbnRlci5qc10oLi4vLi4vI2luY2x1ZGUpLlxuICpcbiAqIFRvIHVzZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLCBpbnN0YW50aWF0ZSBpdCwgdGhlbiBtYWtlIGNhbGxzIHRvIGFueSBvZiB0aGUgbWV0aG9kcyB5b3UgbmVlZC5cbiAqXG4gKiAgICAgICAgdmFyIGNzID0gbmV3IEYuc2VydmljZS5DaGFubmVsKCk7XG4gKiAgICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi92YXJpYWJsZXMnLCB7IHByaWNlOiA1MCB9KTtcbiAqXG4gKiBJZiB5b3UgYXJlIHdvcmtpbmcgdGhyb3VnaCB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSwgd2hlbiB5b3UgYXNrIHRvIFwiZ2V0XCIgYSBwYXJ0aWN1bGFyIGNoYW5uZWwsIHlvdSBhcmUgcmVhbGx5IGFza2luZyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIENoYW5uZWwgU2VydmljZSB3aXRoIGEgdG9waWMgYWxyZWFkeSBzZXQsIGZvciBleGFtcGxlIHRvIHRoZSBhcHByb3ByaWF0ZSBncm91cCBvciB3b3JsZDpcbiAqXG4gKiAgICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAqICAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gKiAgICAgIC8vIGJlY2F1c2Ugd2UgdXNlZCBhbiBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIHRvIGdldCB0aGUgZ3JvdXAgY2hhbm5lbCxcbiAqICAgICAgLy8gc3Vic2NyaWJlKCkgYW5kIHB1Ymxpc2goKSBoZXJlIGRlZmF1bHQgdG8gdGhlIGJhc2UgdG9waWMgZm9yIHRoZSBncm91cFxuICogICAgICBnYy5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uKGRhdGEpIHsgY29uc29sZS5sb2coZGF0YSk7IH0pO1xuICogICAgICBnYy5wdWJsaXNoKCcnLCB7IG1lc3NhZ2U6ICdhIG5ldyBtZXNzYWdlIHRvIHRoZSBncm91cCcgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIFNlcnZpY2UgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIFNlcnZpY2UuXG4gKiAqIGBvcHRpb25zLmJhc2VgIFRoZSBiYXNlIHRvcGljLiBUaGlzIGlzIGFkZGVkIGFzIGEgcHJlZml4IHRvIGFsbCBmdXJ0aGVyIHRvcGljcyB5b3UgcHVibGlzaCBvciBzdWJzY3JpYmUgdG8gd2hpbGUgd29ya2luZyB3aXRoIHRoaXMgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy50b3BpY1Jlc29sdmVyYCBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gUmV0dXJucyBhIFN0cmluZy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICogKiBgb3B0aW9ucy50cmFuc3BvcnRgIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by4gU2VlIGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIGNvbWV0ZC5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgQ2hhbm5lbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYmFzZSB0b3BpYy4gVGhpcyBpcyBhZGRlZCBhcyBhIHByZWZpeCB0byBhbGwgZnVydGhlciB0b3BpY3MgeW91IHB1Ymxpc2ggb3Igc3Vic2NyaWJlIHRvIHdoaWxlIHdvcmtpbmcgd2l0aCB0aGlzIENoYW5uZWwgU2VydmljZS5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGJhc2U6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqIGB0b3BpY2AgVG9waWMgdG8gcGFyc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiAqU3RyaW5nKjogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIGEgc3RyaW5nIHRvcGljLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyB0b3BpYyB0byByZXNvbHZlXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRvcGljUmVzb2x2ZXI6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgcmV0dXJuIHRvcGljO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgaW5zdGFuY2Ugb2YgYCQuY29tZXRkYCB0byBob29rIG9udG8uXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IG51bGxcbiAgICB9O1xuICAgIHRoaXMuY2hhbm5lbE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xufTtcblxudmFyIG1ha2VOYW1lID0gZnVuY3Rpb24gKGNoYW5uZWxOYW1lLCB0b3BpYykge1xuICAgIC8vUmVwbGFjZSB0cmFpbGluZy9kb3VibGUgc2xhc2hlc1xuICAgIHZhciBuZXdOYW1lID0gKGNoYW5uZWxOYW1lID8gKGNoYW5uZWxOYW1lICsgJy8nICsgdG9waWMpIDogdG9waWMpLnJlcGxhY2UoL1xcL1xcLy9nLCAnLycpLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG4gICAgcmV0dXJuIG5ld05hbWU7XG59O1xuXG5cbkNoYW5uZWwucHJvdG90eXBlID0gJC5leHRlbmQoQ2hhbm5lbC5wcm90b3R5cGUsIHtcblxuICAgIC8vIGZ1dHVyZSBmdW5jdGlvbmFsaXR5OlxuICAgIC8vICAgICAgLy8gU2V0IHRoZSBjb250ZXh0IGZvciB0aGUgY2FsbGJhY2tcbiAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgZnVuY3Rpb24gKCkgeyB0aGlzLmlubmVySFRNTCA9ICdUcmlnZ2VyZWQnfSwgZG9jdW1lbnQuYm9keSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gQ29udHJvbCB0aGUgb3JkZXIgb2Ygb3BlcmF0aW9ucyBieSBzZXR0aW5nIHRoZSBgcHJpb3JpdHlgXG4gICAgIC8vICAgICAgY3Muc3Vic2NyaWJlKCdydW4nLCBjYiwgdGhpcywge3ByaW9yaXR5OiA5fSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gT25seSBleGVjdXRlIHRoZSBjYWxsYmFjaywgYGNiYCwgaWYgdGhlIHZhbHVlIG9mIHRoZSBgcHJpY2VgIHZhcmlhYmxlIGlzIDUwXG4gICAgIC8vICAgICAgY3Muc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiA1MH0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBncmVhdGVyIHRoYW4gNTBcbiAgICAgLy8gICAgICBzdWJzY3JpYmUoJ3J1bi92YXJpYWJsZXMvcHJpY2UnLCBjYiwgdGhpcywge3ByaW9yaXR5OiAzMCwgdmFsdWU6ICc+NTAnfSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gT25seSBleGVjdXRlIHRoZSBjYWxsYmFjaywgYGNiYCwgaWYgdGhlIHZhbHVlIG9mIHRoZSBgcHJpY2VgIHZhcmlhYmxlIGlzIGV2ZW5cbiAgICAgLy8gICAgICBzdWJzY3JpYmUoJ3J1bi92YXJpYWJsZXMvcHJpY2UnLCBjYiwgdGhpcywge3ByaW9yaXR5OiAzMCwgdmFsdWU6IGZ1bmN0aW9uICh2YWwpIHtyZXR1cm4gdmFsICUgMiA9PT0gMH19KTtcblxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIGNoYW5nZXMgb24gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqIFRoZSB0b3BpYyBzaG91bGQgaW5jbHVkZSB0aGUgZnVsbCBwYXRoIG9mIHRoZSBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cyksIHByb2plY3QgaWQsIGFuZCBncm91cCBuYW1lLiAoSW4gbW9zdCBjYXNlcywgaXQgaXMgc2ltcGxlciB0byB1c2UgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykgaW5zdGVhZCwgaW4gd2hpY2ggY2FzZSB0aGlzIGlzIGNvbmZpZ3VyZWQgZm9yIHlvdS4pXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlcyoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjYiA9IGZ1bmN0aW9uKHZhbCkgeyBjb25zb2xlLmxvZyh2YWwuZGF0YSk7IH07XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9wLWxldmVsICdydW4nIHRvcGljXG4gICAgICogICAgICBjcy5zdWJzY3JpYmUoJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGNoaWxkcmVuIG9mIHRoZSAncnVuJyB0b3BpYy4gTm90ZSB0aGlzIHdpbGwgYWxzbyBiZSB0cmlnZ2VyZWQgZm9yIGNoYW5nZXMgdG8gcnVuLngueS56LlxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuLyonLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGJvdGggdGhlIHRvcC1sZXZlbCAncnVuJyB0b3BpYyBhbmQgaXRzIGNoaWxkcmVuXG4gICAgICogICAgICBjcy5zdWJzY3JpYmUoWycvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJyxcbiAgICAgKiAgICAgICAgICAnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJ10sIGNiKTtcbiAgICAgKlxuICAgICAqICAgICAgLy8gU3Vic2NyaWJlIHRvIGNoYW5nZXMgb24gYSBwYXJ0aWN1bGFyIHZhcmlhYmxlXG4gICAgICogICAgICBzdWJzY3JpYmUoJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzL3ByaWNlJywgY2IpO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpTdHJpbmcqIFJldHVybnMgYSB0b2tlbiB5b3UgY2FuIGxhdGVyIHVzZSB0byB1bnN1YnNjcmliZS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfEFycmF5fSAgIHRvcGljICAgIExpc3Qgb2YgdG9waWNzIHRvIGxpc3RlbiBmb3IgY2hhbmdlcyBvbi5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZS4gQ2FsbGJhY2sgaXMgY2FsbGVkIHdpdGggc2lnbmF0dXJlIGAoZXZ0LCBwYXlsb2FkLCBtZXRhZGF0YSlgLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICBjb250ZXh0ICBDb250ZXh0IGluIHdoaWNoIHRoZSBgY2FsbGJhY2tgIGlzIGV4ZWN1dGVkLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBvcHRpb25zLnByaW9yaXR5ICBVc2VkIHRvIGNvbnRyb2wgb3JkZXIgb2Ygb3BlcmF0aW9ucy4gRGVmYXVsdHMgdG8gMC4gQ2FuIGJlIGFueSArdmUgb3IgLXZlIG51bWJlci5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8TnVtYmVyfEZ1bmN0aW9ufSAgIG9wdGlvbnMudmFsdWUgVGhlIGBjYWxsYmFja2AgaXMgb25seSB0cmlnZ2VyZWQgaWYgdGhpcyBjb25kaXRpb24gbWF0Y2hlcy4gU2VlIGV4YW1wbGVzIGZvciBkZXRhaWxzLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3Vic2NyaXB0aW9uIElEXG4gICAgICovXG4gICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG5cbiAgICAgICAgdmFyIHRvcGljcyA9IFtdLmNvbmNhdCh0b3BpYyk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBzdWJzY3JpcHRpb25JZHMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuICAgICAgICBvcHRzLnRyYW5zcG9ydC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmVhY2godG9waWNzLCBmdW5jdGlvbiAoaW5kZXgsIHRvcGljKSB7XG4gICAgICAgICAgICAgICAgdG9waWMgPSBtYWtlTmFtZShvcHRzLmJhc2UsIG9wdHMudG9waWNSZXNvbHZlcih0b3BpYykpO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkcy5wdXNoKG9wdHMudHJhbnNwb3J0LnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChzdWJzY3JpcHRpb25JZHNbMV0gPyBzdWJzY3JpcHRpb25JZHMgOiBzdWJzY3JpcHRpb25JZHNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIGRhdGEgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICAvLyBTZW5kIGRhdGEgdG8gYWxsIHN1YnNjcmliZXJzIG9mIHRoZSAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsIHsgY29tcGxldGVkOiBmYWxzZSB9KTtcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bi92YXJpYWJsZXMnIHRvcGljXG4gICAgICogICAgICBjcy5wdWJsaXNoKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcycsIHsgcHJpY2U6IDUwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgVG9waWMgdG8gcHVibGlzaCB0by5cbiAgICAgKiBAcGFyYW0gIHsqfSBkYXRhICBEYXRhIHRvIHB1Ymxpc2ggdG8gdG9waWMuXG4gICAgICogQHJldHVybiB7QXJyYXkgfCBPYmplY3R9IFJlc3BvbnNlcyB0byBwdWJsaXNoZWQgZGF0YVxuICAgICAqXG4gICAgICovXG4gICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljLCBkYXRhKSB7XG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgcmV0dXJuT2JqcyA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IG1lLmNoYW5uZWxPcHRpb25zO1xuXG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBpZiAodG9waWMuY2hhckF0KHRvcGljLmxlbmd0aCAtIDEpID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9waWMgPSB0b3BpYy5yZXBsYWNlKC9cXCorJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdZb3UgY2FuIGNhbm5vdCBwdWJsaXNoIHRvIGNoYW5uZWxzIHdpdGggd2lsZGNhcmRzLiBQdWJsaXNoaW5nIHRvICcsIHRvcGljLCAnaW5zdGVhZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5PYmpzLnB1c2gob3B0cy50cmFuc3BvcnQucHVibGlzaCh0b3BpYywgZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gKHJldHVybk9ianNbMV0gPyByZXR1cm5PYmpzIDogcmV0dXJuT2Jqc1swXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVuc3Vic2NyaWJlIGZyb20gY2hhbmdlcyB0byBhIHRvcGljLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgY3MudW5zdWJzY3JpYmUoJ3NhbXBsZVRva2VuJyk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gdG9rZW4gVGhlIHRva2VuIGZvciB0b3BpYyBpcyByZXR1cm5lZCB3aGVuIHlvdSBpbml0aWFsbHkgc3Vic2NyaWJlLiBQYXNzIGl0IGhlcmUgdG8gdW5zdWJzY3JpYmUgZnJvbSB0aGF0IHRvcGljLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gcmVmZXJlbmNlIHRvIGN1cnJlbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIHRoaXMuY2hhbm5lbE9wdGlvbnMudHJhbnNwb3J0LnVuc3Vic2NyaWJlKHRva2VuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgZXZlbnRzIGFuZCBleGVjdXRlIGhhbmRsZXJzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29uZmlndXJhdGlvblNlcnZpY2VcbiAqXG4gKiBBbGwgc2VydmljZXMgdGFrZSBpbiBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGVtc2VsdmVzLiBBIEpTIGhhc2gge30gaXMgYSB2YWxpZCBjb25maWd1cmF0aW9uIG9iamVjdCwgYnV0IG9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdGhlIGNvbmZpZ3VyYXRpb24gc2VydmljZSB0byB0b2dnbGUgY29uZmlncyBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBjcyA9IHJlcXVpcmUoJ2NvbmZpZ3VyYXRpb24tc2VydmljZScpKHtcbiAqICAgICAgICAgIGRldjogeyAvL2Vudmlyb25tZW50XG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9kOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogODA4MCxcbiAgICAgICAgICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ0xldmVsOiAnREVCVUcnIC8vZ2xvYmFsXG4gKiAgICAgfSk7XG4gKlxuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ2RldicpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ3Byb2QnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ25vbmUnXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiBFbnZpcm9ubWVudHNcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvZ0xldmVsOiAnTk9ORSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIgPSB1cmxTZXJ2aWNlKHNlcnZpY2VPcHRpb25zLnNlcnZlcik7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGRhdGE6IHNlcnZpY2VPcHRpb25zLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGVudmlyb25tZW50IGtleSB0byBnZXQgY29uZmlndXJhdGlvbiBvcHRpb25zIGZyb21cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBlbnZcbiAgICAgICAgICovXG4gICAgICAgIHNldEVudjogZnVuY3Rpb24gKGVudikge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBwcm9wZXJ0eSBvcHRpb25hbFxuICAgICAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBWYWx1ZSBvZiBwcm9wZXJ0eSBpZiBzcGVjaWZpZWQsIHRoZSBlbnRpcmUgY29uZmlnIG9iamVjdCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnNbcHJvcGVydHldO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSBpZiBhIGtleSBpcyBwcm92aWRlZCwgc2V0IGEga2V5IHRvIHRoYXQgdmFsdWUuIE90aGVyd2lzZSBtZXJnZSBvYmplY3Qgd2l0aCBjdXJyZW50IGNvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0gIHsqfSB2YWx1ZSAgdmFsdWUgZm9yIHByb3ZpZGVkIGtleVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIi8qKlxuICogIyMgRGF0YSBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBEYXRhIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCBtYW5pcHVsYXRlIGRhdGEgcmVsYXRlZCB0byBhbnkgb2YgeW91ciBwcm9qZWN0cy4gRGF0YSBhcmUgb3JnYW5pemVkIGluIGNvbGxlY3Rpb25zLiBFYWNoIGNvbGxlY3Rpb24gY29udGFpbnMgYSBkb2N1bWVudDsgZWFjaCBlbGVtZW50IG9mIHRoaXMgdG9wLWxldmVsIGRvY3VtZW50IGlzIGEgSlNPTiBvYmplY3QuIChTZWUgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBvbiB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8pLilcbiAqXG4gKiBBbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBEYXRhIEFQSSBTZXJ2aWNlIGRlZmF1bHRzLiBJbiBwYXJ0aWN1bGFyLCB0aGVyZSBhcmUgdGhyZWUgcmVxdWlyZWQgcGFyYW1ldGVycyB3aGVuIHlvdSBpbnN0YW50aWF0ZSB0aGUgRGF0YSBTZXJ2aWNlOlxuICpcbiAqICogYGFjY291bnRgOiBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4gKiAqIGByb290YDogVGhlIHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uLiBJZiB5b3UgaGF2ZSBtdWx0aXBsZSBjb2xsZWN0aW9ucyB3aXRoaW4gZWFjaCBvZiB5b3VyIHByb2plY3RzLCB5b3UgY2FuIGFsc28gcGFzcyB0aGUgY29sbGVjdGlvbiBuYW1lIGFzIGFuIG9wdGlvbiBmb3IgZWFjaCBjYWxsLlxuICpcbiAqICAgICAgIHZhciBkcyA9IG5ldyBGLnNlcnZpY2UuRGF0YSh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgcm9vdDogJ3N1cnZleS1yZXNwb25zZXMnLFxuICogICAgICAgICAgc2VydmVyOiB7IGhvc3Q6ICdhcGkuZm9yaW8uY29tJyB9XG4gKiAgICAgICB9KTtcbiAqICAgICAgIGRzLnNhdmVBcygndXNlcjEnLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMiwgJ3F1ZXN0aW9uMic6IDEwLFxuICogICAgICAgICAgJ3F1ZXN0aW9uMyc6IGZhbHNlLCAncXVlc3Rpb240JzogJ3NvbWV0aW1lcycgfSApO1xuICogICAgICAgZHMuc2F2ZUFzKCd1c2VyMicsXG4gKiAgICAgICAgICB7ICdxdWVzdGlvbjEnOiAzLCAncXVlc3Rpb24yJzogOCxcbiAqICAgICAgICAgICdxdWVzdGlvbjMnOiB0cnVlLCAncXVlc3Rpb240JzogJ2Fsd2F5cycgfSApO1xuICogICAgICAgZHMucXVlcnkoJycseyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gKlxuICogTm90ZSB0aGF0IGluIGFkZGl0aW9uIHRvIHRoZSBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYW5kIGByb290YCwgdGhlIERhdGEgU2VydmljZSBwYXJhbWV0ZXJzIG9wdGlvbmFsbHkgaW5jbHVkZSBhIGBzZXJ2ZXJgIG9iamVjdCwgd2hvc2UgYGhvc3RgIGZpZWxkIGNvbnRhaW5zIHRoZSBVUkkgb2YgdGhlIEZvcmlvIHNlcnZlci4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCwgYnV0IHlvdSBjYW4gcGFzcyBpdCBleHBsaWNpdGx5IGlmIGRlc2lyZWQuIEl0IGlzIG1vc3QgY29tbW9ubHkgdXNlZCBmb3IgY2xhcml0eSB3aGVuIHlvdSBhcmUgW2hvc3RpbmcgYW4gRXBpY2VudGVyIHByb2plY3Qgb24geW91ciBvd24gc2VydmVyXSguLi8uLi8uLi9ob3dfdG8vc2VsZl9ob3N0aW5nLykuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb24uIFJlcXVpcmVkLiBEZWZhdWx0cyB0byBgL2AsIHRoYXQgaXMsIHRoZSByb290IGxldmVsIG9mIHlvdXIgcHJvamVjdCBhdCBgZm9yaW8uY29tL2FwcC95b3VyLWFjY291bnQtaWQveW91ci1wcm9qZWN0LWlkL2AsIGJ1dCBtdXN0IGJlIHNldCB0byBhIGNvbGxlY3Rpb24gbmFtZS5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHJvb3Q6ICcvJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIG9wZXJhdGlvbnMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8vT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllclxuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uIChrZXksIHJvb3QpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByb290ID0gc2VydmljZU9wdGlvbnMucm9vdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2RhdGEnKSArIHF1dGlsLmFkZFRyYWlsaW5nU2xhc2gocm9vdCk7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHVybCArPSBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9O1xuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IGdldFVSTFxuICAgIH0pO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZWFyY2ggZm9yIGRhdGEgd2l0aGluIGEgY29sbGVjdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogU2VhcmNoaW5nIHVzaW5nIGNvbXBhcmlzb24gb3IgbG9naWNhbCBvcGVyYXRvcnMgKGFzIG9wcG9zZWQgdG8gZXhhY3QgbWF0Y2hlcykgcmVxdWlyZXMgTW9uZ29EQiBzeW50YXguIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8jc2VhcmNoaW5nKSBmb3IgYWRkaXRpb25hbCBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBkb2N1bWVudCAndXNlcjEnXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJ3VzZXIxJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gZXhhY3QgbWF0Y2hpbmc6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb24gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiA5fSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gY29tcGFyaXNvbiBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBncmVhdGVyIHRoYW4gOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiB7ICckZ3QnOiA5fSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBsb2dpY2FsIG9wZXJhdG9yczpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkb2N1bWVudHMgaW4gY29sbGVjdGlvblxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlICdxdWVzdGlvbjInIGlzIGxlc3MgdGhhbiAxMCwgYW5kICdxdWVzdGlvbjMnIGlzIGZhbHNlXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJyRhbmQnOiBbIHsgJ3F1ZXN0aW9uMic6IHsgJyRsdCc6MTB9IH0sIHsgJ3F1ZXN0aW9uMyc6IGZhbHNlIH1dIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJlZ3VsYXIgZXhwcmVzc3Npb25zOiB1c2UgYW55IFBlcmwtY29tcGF0aWJsZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb241JyBjb250YWlucyB0aGUgc3RyaW5nICcuKmRheSdcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb241JzogeyAnJHJlZ2V4JzogJy4qZGF5JyB9IH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBuYW1lIG9mIHRoZSBkb2N1bWVudCB0byBzZWFyY2guIFBhc3MgdGhlIGVtcHR5IHN0cmluZyAoJycpIHRvIHNlYXJjaCB0aGUgZW50aXJlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSBUaGUgcXVlcnkgb2JqZWN0LiBGb3IgZXhhY3QgbWF0Y2hpbmcsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCBmaWVsZCB2YWx1ZSB0byBtYXRjaC4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGNvbXBhcmlzb24sIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCB0aGUgY29tcGFyaXNvbiBleHByZXNzaW9uLiBGb3IgbWF0Y2hpbmcgYmFzZWQgb24gbG9naWNhbCBvcGVyYXRvcnMsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIGFuIGV4cHJlc3Npb24gdXNpbmcgTW9uZ29EQiBzeW50YXguIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8jc2VhcmNoaW5nKSBmb3IgYWRkaXRpb25hbCBleGFtcGxlcy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChrZXksIHF1ZXJ5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHsgcTogcXVlcnkgfSwgb3V0cHV0TW9kaWZpZXIpO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGRhdGEgaW4gYW4gYW5vbnltb3VzIGRvY3VtZW50IHdpdGhpbiB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGByb290YCBvZiB0aGUgY29sbGVjdGlvbiBtdXN0IGJlIHNwZWNpZmllZC4gQnkgZGVmYXVsdCB0aGUgYHJvb3RgIGlzIHRha2VuIGZyb20gdGhlIERhdGEgU2VydmljZSBjb25maWd1cmF0aW9uIG9wdGlvbnM7IHlvdSBjYW4gYWxzbyBwYXNzIHRoZSBgcm9vdGAgdG8gdGhlIGBzYXZlYCBjYWxsIGV4cGxpY2l0bHkgYnkgb3ZlcnJpZGluZyB0aGUgb3B0aW9ucyAodGhpcmQgcGFyYW1ldGVyKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKEFkZGl0aW9uYWwgYmFja2dyb3VuZDogRG9jdW1lbnRzIGFyZSB0b3AtbGV2ZWwgZWxlbWVudHMgd2l0aGluIGEgY29sbGVjdGlvbi4gQ29sbGVjdGlvbnMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoaXMgYWNjb3VudCAodGVhbSBvciBwZXJzb25hbCBhY2NvdW50KSBhbmQgcHJvamVjdCBhbmQgYXJlIHNldCB3aXRoIHRoZSBgcm9vdGAgZmllbGQgaW4gdGhlIGBvcHRpb25gIHBhcmFtZXRlci4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykgZm9yIG1vcmUgaW5mb3JtYXRpb24uIFRoZSBgc2F2ZWAgbWV0aG9kIGlzIG1ha2luZyBhIGBQT1NUYCByZXF1ZXN0LilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBDcmVhdGUgYSBuZXcgZG9jdW1lbnQsIHdpdGggb25lIGVsZW1lbnQsIGF0IHRoZSBkZWZhdWx0IHJvb3QgbGV2ZWxcbiAgICAgICAgICogICAgICBkcy5zYXZlKCdxdWVzdGlvbjEnLCAneWVzJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gQ3JlYXRlIGEgbmV3IGRvY3VtZW50LCB3aXRoIHR3byBlbGVtZW50cywgYXQgdGhlIGRlZmF1bHQgcm9vdCBsZXZlbFxuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBxdWVzdGlvbjE6J3llcycsIHF1ZXN0aW9uMjogMzIgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gQ3JlYXRlIGEgbmV3IGRvY3VtZW50LCB3aXRoIHR3byBlbGVtZW50cywgYXQgYC9zdHVkZW50cy9gXG4gICAgICAgICAqICAgICAgZHMuc2F2ZSh7IG5hbWU6J0pvaG4nLCBjbGFzc05hbWU6ICdDUzEwMScgfSwgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGtleSBJZiBga2V5YCBpcyBhIHN0cmluZywgaXQgaXMgdGhlIGlkIG9mIHRoZSBlbGVtZW50IHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgb2JqZWN0IGlzIHRoZSBkYXRhIHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSW4gYm90aCBjYXNlcywgdGhlIGlkIGZvciB0aGUgZG9jdW1lbnQgaXMgZ2VuZXJhdGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSAoT3B0aW9uYWwpIFRoZSBkYXRhIHRvIHNhdmUuIElmIGBrZXlgIGlzIGEgc3RyaW5nLCB0aGlzIGlzIHRoZSB2YWx1ZSB0byBzYXZlLiBJZiBga2V5YCBpcyBhbiBvYmplY3QsIHRoZSB2YWx1ZShzKSB0byBzYXZlIGFyZSBhbHJlYWR5IHBhcnQgb2YgYGtleWAgYW5kIHRoaXMgYXJndW1lbnQgaXMgbm90IHJlcXVpcmVkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLiBJZiB5b3Ugd2FudCB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24sIGRvIHNvIGhlcmUuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoJycsIGh0dHBPcHRpb25zLnJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgKGNyZWF0ZSBvciByZXBsYWNlKSBkYXRhIGluIGEgbmFtZWQgZG9jdW1lbnQgb3IgZWxlbWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uIFxuICAgICAgICAgKiBcbiAgICAgICAgICogVGhlIGByb290YCBvZiB0aGUgY29sbGVjdGlvbiBtdXN0IGJlIHNwZWNpZmllZC4gQnkgZGVmYXVsdCB0aGUgYHJvb3RgIGlzIHRha2VuIGZyb20gdGhlIERhdGEgU2VydmljZSBjb25maWd1cmF0aW9uIG9wdGlvbnM7IHlvdSBjYW4gYWxzbyBwYXNzIHRoZSBgcm9vdGAgdG8gdGhlIGBzYXZlQXNgIGNhbGwgZXhwbGljaXRseSBieSBvdmVycmlkaW5nIHRoZSBvcHRpb25zICh0aGlyZCBwYXJhbWV0ZXIpLlxuICAgICAgICAgKlxuICAgICAgICAgKiBPcHRpb25hbGx5LCB0aGUgbmFtZWQgZG9jdW1lbnQgb3IgZWxlbWVudCBjYW4gaW5jbHVkZSBwYXRoIGluZm9ybWF0aW9uLCBzbyB0aGF0IHlvdSBhcmUgc2F2aW5nIGp1c3QgcGFydCBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIChBZGRpdGlvbmFsIGJhY2tncm91bmQ6IERvY3VtZW50cyBhcmUgdG9wLWxldmVsIGVsZW1lbnRzIHdpdGhpbiBhIGNvbGxlY3Rpb24uIENvbGxlY3Rpb25zIG11c3QgYmUgdW5pcXVlIHdpdGhpbiB0aGlzIGFjY291bnQgKHRlYW0gb3IgcGVyc29uYWwgYWNjb3VudCkgYW5kIHByb2plY3QgYW5kIGFyZSBzZXQgd2l0aCB0aGUgYHJvb3RgIGZpZWxkIGluIHRoZSBgb3B0aW9uYCBwYXJhbWV0ZXIuIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLiBUaGUgYHNhdmVBc2AgbWV0aG9kIGlzIG1ha2luZyBhIGBQVVRgIHJlcXVlc3QuKVxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSAob3IgcmVwbGFjZSkgdGhlIGB1c2VyMWAgZG9jdW1lbnQgYXQgdGhlIGRlZmF1bHQgcm9vdCBsZXZlbC5cbiAgICAgICAgICogICAgICAvLyBOb3RlIHRoYXQgdGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgYHVzZXIxYCBkb2N1bWVudC5cbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAgICAgICAgICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMiwgJ3F1ZXN0aW9uMic6IDEwLFxuICAgICAgICAgKiAgICAgICAgICAgJ3F1ZXN0aW9uMyc6IGZhbHNlLCAncXVlc3Rpb240JzogJ3NvbWV0aW1lcycgfSApO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSAob3IgcmVwbGFjZSkgdGhlIGBzdHVkZW50MWAgZG9jdW1lbnQgYXQgdGhlIGBzdHVkZW50c2Agcm9vdCwgXG4gICAgICAgICAqICAgICAgLy8gdGhhdCBpcywgdGhlIGRhdGEgYXQgYC9zdHVkZW50cy9zdHVkZW50MS9gLlxuICAgICAgICAgKiAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIHJlcGxhY2VzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBgL3N0dWRlbnRzL3N0dWRlbnQxL2AgZG9jdW1lbnQuXG4gICAgICAgICAqICAgICAgLy8gSG93ZXZlciwgdGhpcyB3aWxsIGtlZXAgZXhpc3RpbmcgY29udGVudCBpbiBvdGhlciBwYXRocyBvZiB0aGlzIGNvbGxlY3Rpb24uXG4gICAgICAgICAqICAgICAgLy8gRm9yIGV4YW1wbGUsIHRoZSBkYXRhIGF0IGAvc3R1ZGVudHMvc3R1ZGVudDIvYCBpcyB1bmNoYW5nZWQgYnkgdGhpcyBjYWxsLlxuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnc3R1ZGVudDEnLFxuICAgICAgICAgKiAgICAgICAgICB7IGZpcnN0TmFtZTogJ2pvaG4nLCBsYXN0TmFtZTogJ3NtaXRoJyB9LFxuICAgICAgICAgKiAgICAgICAgICB7IHJvb3Q6ICdzdHVkZW50cycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gQ3JlYXRlIChvciByZXBsYWNlKSB0aGUgYG1nbXQxMDAvZ3JvdXBCYCBkb2N1bWVudCBhdCB0aGUgYG15Y2xhc3Nlc2Agcm9vdCxcbiAgICAgICAgICogICAgICAvLyB0aGF0IGlzLCB0aGUgZGF0YSBhdCBgL215Y2xhc3Nlcy9tZ210MTAwL2dyb3VwQi9gLlxuICAgICAgICAgKiAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIHJlcGxhY2VzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBgL215Y2xhc3Nlcy9tZ210MTAwL2dyb3VwQi9gIGRvY3VtZW50LlxuICAgICAgICAgKiAgICAgIC8vIEhvd2V2ZXIsIHRoaXMgd2lsbCBrZWVwIGV4aXN0aW5nIGNvbnRlbnQgaW4gb3RoZXIgcGF0aHMgb2YgdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICAgKiAgICAgIC8vIEZvciBleGFtcGxlLCB0aGUgZGF0YSBhdCBgL215Y2xhc3Nlcy9tZ210MTAwL2dyb3VwQS9gIGlzIHVuY2hhbmdlZCBieSB0aGlzIGNhbGwuXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCdtZ210MTAwL2dyb3VwQicsXG4gICAgICAgICAqICAgICAgICAgIHsgc2NlbmFyaW9ZZWFyOiAnMjAxNScgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnbXljbGFzc2VzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBJZCBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSAoT3B0aW9uYWwpIFRoZSBkYXRhIHRvIHNhdmUsIGluIGtleTp2YWx1ZSBwYWlycy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gSWYgeW91IHdhbnQgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgYHJvb3RgIG9mIHRoZSBjb2xsZWN0aW9uLCBkbyBzbyBoZXJlLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHNhdmVBczogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucHV0KHZhbHVlLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBkYXRhIGZvciBhIHNwZWNpZmljIGRvY3VtZW50IG9yIGZpZWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGRzLmxvYWQoJ3VzZXIxJyk7XG4gICAgICAgICAqICAgICAgZHMubG9hZCgndXNlcjEvcXVlc3Rpb24zJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IGtleSBUaGUgaWQgb2YgdGhlIGRhdGEgdG8gcmV0dXJuLiBDYW4gYmUgdGhlIGlkIG9mIGEgZG9jdW1lbnQsIG9yIGEgcGF0aCB0byBkYXRhIHdpdGhpbiB0aGF0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0TW9kaWZpZXIgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKGtleSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGRhdGEgZnJvbSBjb2xsZWN0aW9uLiBPbmx5IGRvY3VtZW50cyAodG9wLWxldmVsIGVsZW1lbnRzIGluIGVhY2ggY29sbGVjdGlvbikgY2FuIGJlIGRlbGV0ZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBkcy5yZW1vdmUoJ3VzZXIxJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBrZXlzIFRoZSBpZCBvZiB0aGUgZG9jdW1lbnQgdG8gcmVtb3ZlIGZyb20gdGhpcyBjb2xsZWN0aW9uLCBvciBhbiBhcnJheSBvZiBzdWNoIGlkcy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIChrZXlzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHBhcmFtcztcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkoa2V5cykpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IGlkOiBrZXlzIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXlzLCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVwaWNlbnRlciBkb2Vzbid0IGFsbG93IG51a2luZyBjb2xsZWN0aW9uc1xuICAgICAgICAvLyAgICAgLyoqXG4gICAgICAgIC8vICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAvLyAgICAgICogQHJldHVybiBudWxsXG4gICAgICAgIC8vICAgICAgKi9cbiAgICAgICAgLy8gICAgIGRlc3Ryb3k6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKCcnLCBvcHRpb25zKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjIyBHcm91cCBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBHcm91cCBBUEkgQWRhcHRlciBwcm92aWRlcyBtZXRob2RzIHRvIGxvb2sgdXAsIGNyZWF0ZSwgY2hhbmdlIG9yIHJlbW92ZSBpbmZvcm1hdGlvbiBhYm91dCBncm91cHMgaW4gYSBwcm9qZWN0LiBJdCBpcyBiYXNlZCBvbiBxdWVyeSBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbR3JvdXAgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L2dyb3VwLykuXG4gKlxuICogVGhpcyBpcyBvbmx5IG5lZWRlZCBmb3IgQXV0aGVudGljYXRlZCBwcm9qZWN0cywgdGhhdCBpcywgdGVhbSBwcm9qZWN0cyB3aXRoIFtlbmQgdXNlcnMgYW5kIGdyb3Vwc10oLi4vLi4vLi4vZ3JvdXBzX2FuZF9lbmRfdXNlcnMvKS5cbiAqXG4gKiAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuR3JvdXAoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICogICAgICBtYS5nZXRHcm91cHNGb3JQcm9qZWN0KHsgYWNjb3VudDogJ2FjbWUnLCBwcm9qZWN0OiAnc2FtcGxlJyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzZXJ2aWNlVXRpbHMgPSByZXF1aXJlKCcuL3NlcnZpY2UtdXRpbHMnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBvYmplY3RBc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBhcGlFbmRwb2ludCA9ICdncm91cC9sb2NhbCc7XG5cbnZhciBHcm91cFNlcnZpY2UgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIGFjY291bnQgbmFtZS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgcHJvamVjdCBuYW1lLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gc2VydmljZVV0aWxzLmdldERlZmF1bHRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcsIHsgYXBpRW5kcG9pbnQ6IGFwaUVuZHBvaW50IH0pO1xuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gc2VydmljZU9wdGlvbnMudHJhbnNwb3J0O1xuICAgIGRlbGV0ZSBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQ7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zLCBzZXJ2aWNlT3B0aW9ucyk7XG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBpbmZvcm1hdGlvbiBmb3IgYSBncm91cCBvciBtdWx0aXBsZSBncm91cHMuXG4gICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvYmplY3Qgd2l0aCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICogQHBhdGFtIHtzdHJpbmd9IHBhcmFtcy5xIHBhcnRpYWwgbWF0Y2ggZm9yIG5hbWUsIG9yZ2FuaXphdGlvbiBvciBldmVudC5cbiAgICAgICAgKiBAcGF0YW0ge3N0cmluZ30gcGFyYW1zLmFjY291bnQgRXBpY2VudGVyJ3MgVGVhbSBJRFxuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMucHJvamVjdCBFcGljZW50ZXIncyBQcm9qZWN0IElEXG4gICAgICAgICogQHBhdGFtIHtzdHJpbmd9IHBhcmFtcy5uYW1lIEVwaWNlbnRlcidzIEdyb3VwIE5hbWVcbiAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEdyb3VwczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgLy9ncm91cElEIGlzIHBhcnQgb2YgdGhlIFVSTFxuICAgICAgICAgICAgLy9xLCBhY2NvdW50IGFuZCBwcm9qZWN0IGFyZSBwYXJ0IG9mIHRoZSBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgIHZhciBmaW5hbE9wdHMgPSBvYmplY3RBc3NpZ24oe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBmaW5hbFBhcmFtcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0cy51cmwgPSBzZXJ2aWNlVXRpbHMuZ2V0QXBpVXJsKGFwaUVuZHBvaW50ICsgJy8nICsgcGFyYW1zLCBmaW5hbE9wdHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaW5hbFBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaW5hbFBhcmFtcywgZmluYWxPcHRzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgb2JqZWN0QXNzaWduKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwU2VydmljZTtcbiIsIi8qKlxuICpcbiAqICMjIEludHJvc3BlY3Rpb24gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgSW50cm9zcGVjdGlvbiBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIHZpZXcgYSBsaXN0IG9mIHRoZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgaW4gYSBtb2RlbC4gVHlwaWNhbGx5IHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gKlxuICogVGhlIEludHJvc3BlY3Rpb24gQVBJIFNlcnZpY2UgaXMgbm90IGF2YWlsYWJsZSBmb3IgRm9yaW8gU2ltTGFuZy5cbiAqXG4gKiAgICAgICB2YXIgaW50cm8gPSBuZXcgRi5zZXJ2aWNlLkludHJvc3BlY3Qoe1xuICogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZSdcbiAqICAgICAgIH0pO1xuICogICAgICAgaW50cm8uYnlNb2RlbCgnc3VwcGx5LWNoYWluLnB5JykudGhlbihmdW5jdGlvbihkYXRhKXsgLi4uIH0pO1xuICogICAgICAgaW50cm8uYnlSdW5JRCgnMmI0ZDhmNzEtNWMzNC00MzVhLThjMTYtOWRlNjc0YWI3MmU2JykudGhlbihmdW5jdGlvbihkYXRhKXsgLi4uIH0pO1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG52YXIgYXBpRW5kcG9pbnQgPSAnbW9kZWwvaW50cm9zcGVjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICB9O1xuXG4gICAgdmFyIHNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgYXZhaWxhYmxlIHZhcmlhYmxlcyBhbmQgb3BlcmF0aW9ucyBmb3IgYSBnaXZlbiBtb2RlbCBmaWxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiBUaGlzIGRvZXMgbm90IHdvcmsgZm9yIGFueSBtb2RlbCB3aGljaCByZXF1aXJlcyBhZGRpdGlvbmFsIHBhcmFtZXRlcnMsIHN1Y2ggYXMgYGZpbGVzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBpbnRyby5ieU1vZGVsKCdhYmMudm1mJylcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gZGF0YSBjb250YWlucyBhbiBvYmplY3Qgd2l0aCBhdmFpbGFibGUgZnVuY3Rpb25zICh1c2VkIHdpdGggb3BlcmF0aW9ucyBBUEkpIGFuZCBhdmFpbGFibGUgdmFyaWFibGVzICh1c2VkIHdpdGggdmFyaWFibGVzIEFQSSlcbiAgICAgICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEuZnVuY3Rpb25zKTtcbiAgICAgICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEudmFyaWFibGVzKTtcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gbW9kZWxGaWxlIE5hbWUgb2YgdGhlIG1vZGVsIGZpbGUgdG8gaW50cm9zcGVjdC5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgYnlNb2RlbDogZnVuY3Rpb24gKG1vZGVsRmlsZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFvcHRzLmFjY291bnQgfHwgIW9wdHMucHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWNjb3VudCBhbmQgcHJvamVjdCBhcmUgcmVxdWlyZWQgd2hlbiB1c2luZyBpbnRyb3NwZWN0I2J5TW9kZWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbW9kZWxGaWxlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2RlbEZpbGUgaXMgcmVxdWlyZWQgd2hlbiB1c2luZyBpbnRyb3NwZWN0I2J5TW9kZWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cmwgPSB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgW29wdHMuYWNjb3VudCwgb3B0cy5wcm9qZWN0LCBtb2RlbEZpbGVdLmpvaW4oJy8nKSB9O1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB1cmwpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgYXZhaWxhYmxlIHZhcmlhYmxlcyBhbmQgb3BlcmF0aW9ucyBmb3IgYSBnaXZlbiBtb2RlbCBmaWxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiBUaGlzIGRvZXMgbm90IHdvcmsgZm9yIGFueSBtb2RlbCB3aGljaCByZXF1aXJlcyBhZGRpdGlvbmFsIHBhcmFtZXRlcnMgc3VjaCBhcyBgZmlsZXNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGludHJvLmJ5UnVuSUQoJzJiNGQ4ZjcxLTVjMzQtNDM1YS04YzE2LTlkZTY3NGFiNzJlNicpXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIGRhdGEgY29udGFpbnMgYW4gb2JqZWN0IHdpdGggYXZhaWxhYmxlIGZ1bmN0aW9ucyAodXNlZCB3aXRoIG9wZXJhdGlvbnMgQVBJKSBhbmQgYXZhaWxhYmxlIHZhcmlhYmxlcyAodXNlZCB3aXRoIHZhcmlhYmxlcyBBUEkpXG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmZ1bmN0aW9ucyk7XG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnZhcmlhYmxlcyk7XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHJ1bklEIElkIG9mIHRoZSBydW4gdG8gaW50cm9zcGVjdC5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgYnlSdW5JRDogZnVuY3Rpb24gKHJ1bklELCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXJ1bklEKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdydW5JRCBpcyByZXF1aXJlZCB3aGVuIHVzaW5nIGludHJvc3BlY3QjYnlNb2RlbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVybCA9IHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JRCB9O1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB1cmwpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgTWVtYmVyIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIE1lbWJlciBBUEkgQWRhcHRlciBwcm92aWRlcyBtZXRob2RzIHRvIGxvb2sgdXAgaW5mb3JtYXRpb24gYWJvdXQgZW5kIHVzZXJzIGZvciB5b3VyIHByb2plY3QgYW5kIGhvdyB0aGV5IGFyZSBkaXZpZGVkIGFjcm9zcyBncm91cHMuIEl0IGlzIGJhc2VkIG9uIHF1ZXJ5IGNhcGFiaWxpdGllcyBvZiB0aGUgdW5kZXJseWluZyBSRVNUZnVsIFtNZW1iZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L21lbWJlci8pLlxuICpcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgZm9yIEF1dGhlbnRpY2F0ZWQgcHJvamVjdHMsIHRoYXQgaXMsIHRlYW0gcHJvamVjdHMgd2l0aCBbZW5kIHVzZXJzIGFuZCBncm91cHNdKC4uLy4uLy4uL2dyb3Vwc19hbmRfZW5kX3VzZXJzLykuIEZvciBleGFtcGxlLCBpZiBzb21lIG9mIHlvdXIgZW5kIHVzZXJzIGFyZSBmYWNpbGl0YXRvcnMsIG9yIGlmIHlvdXIgZW5kIHVzZXJzIHNob3VsZCBiZSB0cmVhdGVkIGRpZmZlcmVudGx5IGJhc2VkIG9uIHdoaWNoIGdyb3VwIHRoZXkgYXJlIGluLCB1c2UgdGhlIE1lbWJlciBBUEkgdG8gZmluZCB0aGF0IGluZm9ybWF0aW9uLlxuICpcbiAqICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICogICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKHsgdXNlcklkOiAnYjZiMzEzYTMtYWI4NC00NzljLWJhZWEtMjA2ZjZiZmYzMzcnIH0pO1xuICogICAgICBtYS5nZXRHcm91cERldGFpbHMoeyBncm91cElkOiAnMDBiNTMzMDgtOTgzMy00N2YyLWIyMWUtMTI3OGMwN2Q1M2I4JyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIGFwaUVuZHBvaW50ID0gJ21lbWJlci9sb2NhbCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciB1c2VyIGlkLiBEZWZhdWx0cyB0byBhIGJsYW5rIHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVzZXJJZDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgZ3JvdXAgaWQuIERlZmF1bHRzIHRvIGEgYmxhbmsgc3RyaW5nLiBOb3RlIHRoYXQgdGhpcyBpcyB0aGUgZ3JvdXAgKmlkKiwgbm90IHRoZSBncm91cCAqbmFtZSouXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBncm91cElkOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMsIHNlcnZpY2VPcHRpb25zKTtcblxuICAgIHZhciBnZXRGaW5hbFBhcmFtcyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgIH07XG5cbiAgICB2YXIgcGF0Y2hVc2VyQWN0aXZlRmllbGQgPSBmdW5jdGlvbiAocGFyYW1zLCBhY3RpdmUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcGFyYW1zLmdyb3VwSWQgKyAnLycgKyBwYXJhbXMudXNlcklkXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBodHRwLnBhdGNoKHsgYWN0aXZlOiBhY3RpdmUgfSwgaHR0cE9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgYWxsIG9mIHRoZSBncm91cCBtZW1iZXJzaGlwcyBmb3Igb25lIGVuZCB1c2VyLiBUaGUgbWVtYmVyc2hpcCBkZXRhaWxzIGFyZSByZXR1cm5lZCBpbiBhbiBhcnJheSwgd2l0aCBvbmUgZWxlbWVudCAoZ3JvdXAgcmVjb3JkKSBmb3IgZWFjaCBncm91cCB0byB3aGljaCB0aGUgZW5kIHVzZXIgYmVsb25ncy5cbiAgICAgICAgKlxuICAgICAgICAqIEluIHRoZSBtZW1iZXJzaGlwIGFycmF5LCBlYWNoIGdyb3VwIHJlY29yZCBpbmNsdWRlcyB0aGUgZ3JvdXAgaWQsIHByb2plY3QgaWQsIGFjY291bnQgKHRlYW0pIGlkLCBhbmQgYW4gYXJyYXkgb2YgbWVtYmVycy4gSG93ZXZlciwgb25seSB0aGUgdXNlciB3aG9zZSB1c2VySWQgaXMgaW5jbHVkZWQgaW4gdGhlIGNhbGwgaXMgbGlzdGVkIGluIHRoZSBtZW1iZXJzIGFycmF5IChyZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlcmUgYXJlIG90aGVyIG1lbWJlcnMgaW4gdGhpcyBncm91cCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLmdldEdyb3Vwc0ZvclVzZXIoJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG1lbWJlcnNoaXBzKXtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxtZW1iZXJzaGlwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lbWJlcnNoaXBzW2ldLmdyb3VwSWQpO1xuICAgICAgICAqICAgICAgICAgICAgICAgfVxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIG1hLmdldEdyb3Vwc0ZvclVzZXIoeyB1c2VySWQ6ICc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHBhcmFtcyBUaGUgdXNlciBpZCBmb3IgdGhlIGVuZCB1c2VyLiBBbHRlcm5hdGl2ZWx5LCBhbiBvYmplY3Qgd2l0aCBmaWVsZCBgdXNlcklkYCBhbmQgdmFsdWUgdGhlIHVzZXIgaWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKi9cblxuICAgICAgICBnZXRHcm91cHNGb3JVc2VyOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBpc1N0cmluZyA9IHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgdmFyIG9ialBhcmFtcyA9IGdldEZpbmFsUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICBpZiAoIWlzU3RyaW5nICYmICFvYmpQYXJhbXMudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB1c2VySWQgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ2V0UGFybXMgPSBpc1N0cmluZyA/IHsgdXNlcklkOiBwYXJhbXMgfSA6IF9waWNrKG9ialBhcmFtcywgJ3VzZXJJZCcpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGdldFBhcm1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBvbmUgZ3JvdXAsIGluY2x1ZGluZyBhbiBhcnJheSBvZiBhbGwgaXRzIG1lbWJlcnMuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLmdldEdyb3VwRGV0YWlscygnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJylcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZ3JvdXApe1xuICAgICAgICAqICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGdyb3VwLm1lbWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhncm91cC5tZW1iZXJzW2ldLnVzZXJOYW1lKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIH1cbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cERldGFpbHMoeyBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBwYXJhbXMgVGhlIGdyb3VwIGlkLiBBbHRlcm5hdGl2ZWx5LCBhbiBvYmplY3Qgd2l0aCBmaWVsZCBgZ3JvdXBJZGAgYW5kIHZhbHVlIHRoZSBncm91cCBpZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEdyb3VwRGV0YWlsczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLmdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdyb3VwSWQgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ3JvdXBJZCA9IGlzU3RyaW5nID8gcGFyYW1zIDogb2JqUGFyYW1zLmdyb3VwSWQ7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBncm91cElkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFNldCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgYXMgYGFjdGl2ZWAuIEFjdGl2ZSBlbmQgdXNlcnMgY2FuIGJlIGFzc2lnbmVkIHRvIFt3b3JsZHNdKC4uL3dvcmxkLW1hbmFnZXIvKSBpbiBtdWx0aXBsYXllciBnYW1lcyBkdXJpbmcgYXV0b21hdGljIGFzc2lnbm1lbnQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLm1ha2VVc2VyQWN0aXZlKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFRoZSBlbmQgdXNlciBhbmQgZ3JvdXAgaW5mb3JtYXRpb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy51c2VySWQgVGhlIGlkIG9mIHRoZSBlbmQgdXNlciB0byBtYWtlIGFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwSWQgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCB0aGlzIGVuZCB1c2VyIGJlbG9uZ3MsIGFuZCBpbiB3aGljaCB0aGUgZW5kIHVzZXIgc2hvdWxkIGJlY29tZSBhY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBtYWtlVXNlckFjdGl2ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGNoVXNlckFjdGl2ZUZpZWxkKHBhcmFtcywgdHJ1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogU2V0IGEgcGFydGljdWxhciBlbmQgdXNlciBhcyBgaW5hY3RpdmVgLiBJbmFjdGl2ZSBlbmQgdXNlcnMgYXJlIG5vdCBhc3NpZ25lZCB0byBbd29ybGRzXSguLi93b3JsZC1tYW5hZ2VyLykgaW4gbXVsdGlwbGF5ZXIgZ2FtZXMgZHVyaW5nIGF1dG9tYXRpYyBhc3NpZ25tZW50LlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5tYWtlVXNlckluYWN0aXZlKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFRoZSBlbmQgdXNlciBhbmQgZ3JvdXAgaW5mb3JtYXRpb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy51c2VySWQgVGhlIGlkIG9mIHRoZSBlbmQgdXNlciB0byBtYWtlIGluYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZ3JvdXBJZCBUaGUgaWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIHRoaXMgZW5kIHVzZXIgYmVsb25ncywgYW5kIGluIHdoaWNoIHRoZSBlbmQgdXNlciBzaG91bGQgYmVjb21lIGluYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbWFrZVVzZXJJbmFjdGl2ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGNoVXNlckFjdGl2ZUZpZWxkKHBhcmFtcywgZmFsc2UsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgUHJlc2VuY2UgQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgUHJlc2VuY2UgQVBJIFNlcnZpY2UgcHJvdmlkZXMgbWV0aG9kcyB0byBnZXQgYW5kIHNldCB0aGUgcHJlc2VuY2Ugb2YgYW4gZW5kIHVzZXIgaW4gYSBwcm9qZWN0LCB0aGF0IGlzLCB0byBpbmRpY2F0ZSB3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBvbmxpbmUuIFRoaXMgaGFwcGVucyBhdXRvbWF0aWNhbGx5OiBpbiBwcm9qZWN0cyB0aGF0IHVzZSBbY2hhbm5lbHNdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSwgdGhlIGVuZCB1c2VyJ3MgcHJlc2VuY2UgaXMgcHVibGlzaGVkIGF1dG9tYXRpY2FsbHkgb24gYSBcInByZXNlbmNlXCIgY2hhbm5lbCB0aGF0IGlzIHNwZWNpZmljIHRvIGVhY2ggZ3JvdXAuIFlvdSBjYW4gYWxzbyB1c2UgdGhlIFByZXNlbmNlIEFQSSBTZXJ2aWNlIHRvIGRvIHRoaXMgZXhwbGljaXRseTogeW91IGNhbiBtYWtlIGEgY2FsbCB0byBpbmRpY2F0ZSB0aGF0IGEgcGFydGljdWxhciBlbmQgdXNlciBpcyBvbmxpbmUgb3Igb2ZmbGluZS4gXG4gKlxuICogVGhlIFByZXNlbmNlIEFQSSBTZXJ2aWNlIGlzIG9ubHkgbmVlZGVkIGZvciBBdXRoZW50aWNhdGVkIHByb2plY3RzLCB0aGF0IGlzLCB0ZWFtIHByb2plY3RzIHdpdGggW2VuZCB1c2VycyBhbmQgZ3JvdXBzXSguLi8uLi8uLi9ncm91cHNfYW5kX2VuZF91c2Vycy8pLiBJdCBpcyB0eXBpY2FsbHkgdXNlZCBvbmx5IGluIG11bHRpcGxheWVyIHByb2plY3RzLCB0byBmYWNpbGl0YXRlIGVuZCB1c2VycyBjb21tdW5pY2F0aW5nIHdpdGggZWFjaCBvdGhlci4gSXQgaXMgYmFzZWQgb24gdGhlIHF1ZXJ5IGNhcGFiaWxpdGllcyBvZiB0aGUgdW5kZXJseWluZyBSRVNUZnVsIFtQcmVzZW5jZSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9wcmVzZW5jZS8pLlxuICpcbiAqICAgICAgdmFyIHByID0gbmV3IEYuc2VydmljZS5QcmVzZW5jZSgpO1xuICogICAgICBwci5tYXJrT25saW5lKCdleGFtcGxlLXVzZXJJZCcpO1xuICogICAgICBwci5tYXJrT2ZmbGluZSgnZXhhbXBsZS11c2VySWQnKTtcbiAqICAgICAgcHIuZ2V0U3RhdHVzKCk7XG4gKi9cblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgYXBpRW5kcG9pbnQgPSAncHJlc2VuY2UnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMIG9yIHNlc3Npb24gbWFuYWdlci5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTCBvciBzZXNzaW9uIG1hbmFnZXIuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciBncm91cCBuYW1lLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuIE5vdGUgdGhhdCB0aGlzIGlzIHRoZSBncm91cCAqbmFtZSosIG5vdCB0aGUgZ3JvdXAgKmlkKi4gSWYgbGVmdCBibGFuaywgdGFrZW4gZnJvbSB0aGUgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXBOYW1lOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fSxcbiAgICB9O1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zLCBzZXJ2aWNlT3B0aW9ucyk7XG5cblxuICAgIHZhciBnZXRGaW5hbFBhcmFtcyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBwYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1hcmtzIGFuIGVuZCB1c2VyIGFzIG9ubGluZS5cbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHZhciBwciA9IG5ldyBGLnNlcnZpY2UuUHJlc2VuY2UoKTtcbiAgICAgICAgICogICAgIHByLm1hcmtPbmxpbmUoJzAwMDAwMTVhNjhkODA2YmMwOWNkMGE3ZDIwN2Y0NGJhNWY3NCcpXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHByZXNlbmNlT2JqKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzZXIgJywgcHJlc2VuY2VPYmoudXNlcklkLCBcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICcgbm93IG9ubGluZSwgYXMgb2YgJywgcHJlc2VuY2VPYmoubGFzdE1vZGlmaWVkKTtcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogUHJvbWlzZSB3aXRoIHByZXNlbmNlIGluZm9ybWF0aW9uIGZvciB1c2VyIG1hcmtlZCBvbmxpbmUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gdXNlcklkIChvcHRpb25hbCkgSWYgbm90IHByb3ZpZGVkLCB0YWtlbiBmcm9tIHNlc3Npb24gY29va2llLlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIHRvIGNoYW5nZSB0aGUgcHJlc2VuY2Ugc2VydmljZSBkZWZhdWx0cy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZVxuICAgICAgICAgKi9cbiAgICAgICAgbWFya09ubGluZTogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgdXNlcklkID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyh1c2VySWQpO1xuICAgICAgICAgICAgaWYgKCFvYmpQYXJhbXMuZ3JvdXBOYW1lICYmICFvcHRpb25zLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3JvdXBOYW1lIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVzZXJJZCA9IGlzU3RyaW5nID8gdXNlcklkIDogb2JqUGFyYW1zLnVzZXJJZDtcbiAgICAgICAgICAgIHZhciBncm91cE5hbWUgPSBvcHRpb25zLmdyb3VwTmFtZSB8fCBvYmpQYXJhbXMuZ3JvdXBOYW1lO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBncm91cE5hbWUgKyAnLycgKyB1c2VySWQgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBtZXNzYWdlOiAnb25saW5lJyB9LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1hcmtzIGFuIGVuZCB1c2VyIGFzIG9mZmxpbmUuXG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICB2YXIgcHIgPSBuZXcgRi5zZXJ2aWNlLlByZXNlbmNlKCk7XG4gICAgICAgICAqICAgICBwci5tYXJrT2ZmbGluZSgnMDAwMDAxNWE2OGQ4MDZiYzA5Y2QwYTdkMjA3ZjQ0YmE1Zjc0Jyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogUHJvbWlzZSB0byByZW1vdmUgcHJlc2VuY2UgcmVjb3JkIGZvciBlbmQgdXNlci5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSB1c2VySWQgKG9wdGlvbmFsKSBJZiBub3QgcHJvdmlkZWQsIHRha2VuIGZyb20gc2Vzc2lvbiBjb29raWUuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgdG8gY2hhbmdlIHRoZSBwcmVzZW5jZSBzZXJ2aWNlIGRlZmF1bHRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlXG4gICAgICAgICAqL1xuICAgICAgICBtYXJrT2ZmbGluZTogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgdXNlcklkID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyh1c2VySWQpO1xuICAgICAgICAgICAgaWYgKCFvYmpQYXJhbXMuZ3JvdXBOYW1lICYmICFvcHRpb25zLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3JvdXBOYW1lIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVzZXJJZCA9IGlzU3RyaW5nID8gdXNlcklkIDogb2JqUGFyYW1zLnVzZXJJZDtcbiAgICAgICAgICAgIHZhciBncm91cE5hbWUgPSBvcHRpb25zLmdyb3VwTmFtZSB8fCBvYmpQYXJhbXMuZ3JvdXBOYW1lO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBncm91cE5hbWUgKyAnLycgKyB1c2VySWQgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZSh7fSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgZW5kIHVzZXJzIGluIHRoaXMgZ3JvdXAgdGhhdCBhcmUgY3VycmVudGx5IG9ubGluZS5cbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHZhciBwciA9IG5ldyBGLnNlcnZpY2UuUHJlc2VuY2UoKTtcbiAgICAgICAgICogICAgIHByLmdldFN0YXR1cygnZ3JvdXBOYW1lJykudGhlbihmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgICAgICAgKiAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBvbmxpbmVVc2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyICcsIG9ubGluZVVzZXJzW2ldLnVzZXJJZCwgXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAnIGlzIG9ubGluZSBhcyBvZiAnLCBvbmxpbmVVc2Vyc1tpXS5sYXN0TW9kaWZpZWQpO1xuICAgICAgICAgKiAgICAgICAgICB9XG4gICAgICAgICAqICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBQcm9taXNlIHdpdGggcmVzcG9uc2Ugb2Ygb25saW5lIHVzZXJzXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChvcHRpb25hbCkgSWYgbm90IHByb3ZpZGVkLCB0YWtlbiBmcm9tIHNlc3Npb24gY29va2llLlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIHRvIGNoYW5nZSB0aGUgcHJlc2VuY2Ugc2VydmljZSBkZWZhdWx0cy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbiAoZ3JvdXBOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhncm91cE5hbWUpO1xuICAgICAgICAgICAgaWYgKCFncm91cE5hbWUgJiYgIW9ialBhcmFtcy5ncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdyb3VwTmFtZSBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncm91cE5hbWUgPSBncm91cE5hbWUgfHwgb2JqUGFyYW1zLmdyb3VwTmFtZTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBOYW1lIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRW5kIHVzZXJzIGFyZSBhdXRvbWF0aWNhbGx5IG1hcmtlZCBvbmxpbmUgYW5kIG9mZmxpbmUgaW4gYSBcInByZXNlbmNlXCIgY2hhbm5lbCB0aGF0IGlzIHNwZWNpZmljIHRvIGVhY2ggZ3JvdXAuIEdldHMgdGhpcyBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpIGZvciB0aGUgZ2l2ZW4gZ3JvdXAuIChOb3RlIHRoYXQgdGhpcyBDaGFubmVsIFNlcnZpY2UgaW5zdGFuY2UgaXMgYWxzbyBhdmFpbGFibGUgZnJvbSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgZ2V0UHJlc2VuY2VDaGFubmVsKCldKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvI2dldFByZXNlbmNlQ2hhbm5lbCkuKVxuICAgICAgICAgKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgdmFyIHByID0gbmV3IEYuc2VydmljZS5QcmVzZW5jZSgpO1xuICAgICAgICAgKiAgICAgdmFyIGNtID0gcHIuZ2V0Q2hhbm5lbCgnZ3JvdXAxJyk7XG4gICAgICAgICAqICAgICBjbS5wdWJsaXNoKCcnLCAnYSBtZXNzYWdlIHRvIHByZXNlbmNlIGNoYW5uZWwnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBDaGFubmVsIGluc3RhbmNlIGZvciBQcmVzZW5jZSBjaGFubmVsXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChvcHRpb25hbCkgSWYgbm90IHByb3ZpZGVkLCB0YWtlbiBmcm9tIHNlc3Npb24gY29va2llLlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIHRvIGNoYW5nZSB0aGUgcHJlc2VuY2Ugc2VydmljZSBkZWZhdWx0c1xuICAgICAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBnZXRDaGFubmVsOiBmdW5jdGlvbiAoZ3JvdXBOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuLi9tYW5hZ2Vycy9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyJyk7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHZhciBpc1N0cmluZyA9IHR5cGVvZiBncm91cE5hbWUgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgdmFyIG9ialBhcmFtcyA9IGdldEZpbmFsUGFyYW1zKGdyb3VwTmFtZSk7XG4gICAgICAgICAgICBpZiAoIWlzU3RyaW5nICYmICFvYmpQYXJhbXMuZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncm91cE5hbWUgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBOYW1lID0gaXNTdHJpbmcgPyBncm91cE5hbWUgOiBvYmpQYXJhbXMuZ3JvdXBOYW1lO1xuICAgICAgICAgICAgdmFyIGNtID0gbmV3IENoYW5uZWxNYW5hZ2VyKG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGNtLmdldFByZXNlbmNlQ2hhbm5lbChncm91cE5hbWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgUnVuIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIFJ1biBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIHBlcmZvcm0gY29tbW9uIHRhc2tzIGFyb3VuZCBjcmVhdGluZyBhbmQgdXBkYXRpbmcgcnVucywgdmFyaWFibGVzLCBhbmQgZGF0YS5cbiAqXG4gKiBXaGVuIGJ1aWxkaW5nIGludGVyZmFjZXMgdG8gc2hvdyBydW4gb25lIGF0IGEgdGltZSAoYXMgZm9yIHN0YW5kYXJkIGVuZCB1c2VycyksIHR5cGljYWxseSB5b3UgZmlyc3QgaW5zdGFudGlhdGUgYSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgYW5kIHRoZW4gYWNjZXNzIHRoZSBSdW4gU2VydmljZSB0aGF0IGlzIGF1dG9tYXRpY2FsbHkgcGFydCBvZiB0aGUgbWFuYWdlciwgcmF0aGVyIHRoYW4gaW5zdGFudGlhdGluZyB0aGUgUnVuIFNlcnZpY2UgZGlyZWN0bHkuIFRoaXMgaXMgYmVjYXVzZSB0aGUgUnVuIE1hbmFnZXIgKGFuZCBhc3NvY2lhdGVkIFtydW4gc3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pKSBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy5cbiAqXG4gKiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGlzIHVzZWZ1bCBmb3IgYnVpbGRpbmcgYW4gaW50ZXJmYWNlIHdoZXJlIHlvdSB3YW50IHRvIHNob3cgZGF0YSBhY3Jvc3MgbXVsdGlwbGUgcnVucyAodGhpcyBpcyBlYXN5IHVzaW5nIHRoZSBgZmlsdGVyKClgIGFuZCBgcXVlcnkoKWAgbWV0aG9kcykuIEZvciBpbnN0YW5jZSwgeW91IHdvdWxkIHByb2JhYmx5IHVzZSBhIFJ1biBTZXJ2aWNlIHRvIGJ1aWxkIGEgcGFnZSBmb3IgYSBmYWNpbGl0YXRvci4gVGhpcyBpcyBiZWNhdXNlIGEgZmFjaWxpdGF0b3IgdHlwaWNhbGx5IHdhbnRzIHRvIGV2YWx1YXRlIHBlcmZvcm1hbmNlIGZyb20gbXVsdGlwbGUgZW5kIHVzZXJzLCBlYWNoIG9mIHdob20gaGF2ZSBiZWVuIHdvcmtpbmcgd2l0aCB0aGVpciBvd24gcnVuLlxuICpcbiAqIFRvIHVzZSB0aGUgUnVuIEFQSSBTZXJ2aWNlLCBpbnN0YW50aWF0ZSBpdCBieSBwYXNzaW5nIGluOlxuICpcbiAqICogYGFjY291bnRgOiBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4gKlxuICogSWYgeW91IGtub3cgaW4gYWR2YW5jZSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRvIHdvcmsgd2l0aCBwYXJ0aWN1bGFyLCBleGlzdGluZyBydW4ocyksIHlvdSBjYW4gb3B0aW9uYWxseSBwYXNzIGluOlxuICpcbiAqICogYGZpbHRlcmA6IChPcHRpb25hbCkgQ3JpdGVyaWEgYnkgd2hpY2ggdG8gZmlsdGVyIGZvciBleGlzdGluZyBydW5zLiBcbiAqICogYGlkYDogKE9wdGlvbmFsKSBUaGUgcnVuIGlkIG9mIGFuIGV4aXN0aW5nIHJ1bi4gVGhpcyBpcyBhIGNvbnZlbmllbmNlIGFsaWFzIGZvciB1c2luZyBmaWx0ZXIsIGluIHRoZSBjYXNlIHdoZXJlIHlvdSBvbmx5IHdhbnQgdG8gd29yayB3aXRoIG9uZSBydW4uXG4gKlxuICogRm9yIGV4YW1wbGUsXG4gKlxuICogICAgICAgdmFyIHJzID0gbmV3IEYuc2VydmljZS5SdW4oe1xuICogICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgIH0pO1xuICogICAgICBycy5jcmVhdGUoJ3N1cHBseV9jaGFpbl9nYW1lLnB5JykudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgIH0pO1xuICpcbiAqXG4gKiBBZGRpdGlvbmFsbHksIGFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBgb3B0aW9uc2Agb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBSdW4gQVBJIFNlcnZpY2UgZGVmYXVsdHMgbGlzdGVkIGJlbG93LiBJbiBwYXJ0aWN1bGFyLCBwYXNzaW5nIGB7IGlkOiAnYS1ydW4taWQnIH1gIGluIHRoaXMgYG9wdGlvbnNgIG9iamVjdCBhbGxvd3MgeW91IHRvIG1ha2UgY2FsbHMgdG8gYW4gZXhpc3RpbmcgcnVuLlxuICpcbiAqIE5vdGUgdGhhdCBpbiBhZGRpdGlvbiB0byB0aGUgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgbW9kZWxgLCB0aGUgUnVuIFNlcnZpY2UgcGFyYW1ldGVycyBvcHRpb25hbGx5IGluY2x1ZGUgYSBgc2VydmVyYCBvYmplY3QsIHdob3NlIGBob3N0YCBmaWVsZCBjb250YWlucyB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuICpcbiAqICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHlfY2hhaW5fZ2FtZS5weScsXG4gKiAgICAgICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuICogICAgICAgICAgIH1cbiAqICAgICAgIH0pO1xuICogICAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4gKiAgICAgICAgICAgICAgIC8vIHNvIGFueSBSdW4gU2VydmljZSBtZXRob2QgaXMgdmFsaWQgaGVyZVxuICogICAgICAgICAgICAgICB2YXIgcnMgPSBybS5ydW47XG4gKiAgICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xudmFyIEludHJvc3BlY3Rpb25TZXJ2aWNlID0gcmVxdWlyZSgnLi9pbnRyb3NwZWN0aW9uLWFwaS1zZXJ2aWNlJyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIHVuZGVmaW5lZCkuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JpdGVyaWEgYnkgd2hpY2ggdG8gZmlsdGVyIHJ1bnMuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZpbHRlcjogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlbmllbmNlIGFsaWFzIGZvciBmaWx0ZXIuIFBhc3MgaW4gYW4gZXhpc3RpbmcgcnVuIGlkIHRvIGludGVyYWN0IHdpdGggYSBwYXJ0aWN1bGFyIHJ1bi5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGlkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmxhZyBkZXRlcm1pbmVzIGlmIGBYLUF1dG9SZXN0b3JlOiB0cnVlYCBoZWFkZXIgaXMgc2VudCB0byBFcGljZW50ZXIsIG1lYW5pbmcgcnVucyBhcmUgYXV0b21hdGljYWxseSBwdWxsZWQgZnJvbSB0aGUgRXBpY2VudGVyIGJhY2tlbmQgZGF0YWJhc2UgaWYgbm90IGN1cnJlbnRseSBpbiBtZW1vcnkgb24gdGhlIEVwaWNlbnRlciBzZXJ2ZXJzLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgYXV0b1Jlc3RvcmU6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGNvbXBsZXRlcyBzdWNjZXNzZnVsbHkuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGZhaWxzLiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3I6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVVSTENvbmZpZyhvcHRzKSB7XG4gICAgICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShvcHRzKS5nZXQoJ3NlcnZlcicpO1xuICAgICAgICBpZiAob3B0cy5hY2NvdW50KSB7XG4gICAgICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBvcHRzLmFjY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdHMucHJvamVjdCkge1xuICAgICAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gb3B0cy5wcm9qZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgdXJsQ29uZmlnLmZpbHRlciA9ICc7JztcbiAgICAgICAgdXJsQ29uZmlnLmdldEZpbHRlclVSTCA9IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgncnVuJyk7XG4gICAgICAgICAgICB2YXIgZmlsdGVyTWF0cml4ID0gcXV0aWwudG9NYXRyaXhGb3JtYXQoZmlsdGVyIHx8IG9wdHMuZmlsdGVyKTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlck1hdHJpeCkge1xuICAgICAgICAgICAgICAgIHVybCArPSBmaWx0ZXJNYXRyaXggKyAnLyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gb3B0cy5maWx0ZXI7XG4gICAgICAgICAgICAvLyBUaGUgc2VtaWNvbG9uIHNlcGFyYXRlZCBmaWx0ZXIgaXMgdXNlZCB3aGVuIGZpbHRlciBpcyBhbiBvYmplY3RcbiAgICAgICAgICAgIHZhciBpc0ZpbHRlclJ1bklkID0gZmlsdGVyICYmICQudHlwZShmaWx0ZXIpID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIGlmIChvcHRzLmF1dG9SZXN0b3JlICYmIGlzRmlsdGVyUnVuSWQpIHtcbiAgICAgICAgICAgICAgICAvLyBCeSBkZWZhdWx0IGF1dG9yZXBsYXkgdGhlIHJ1biBieSBzZW5kaW5nIHRoaXMgaGVhZGVyIHRvIGVwaWNlbnRlclxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZm9yaW8uY29tL2VwaWNlbnRlci9kb2NzL3B1YmxpYy9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI3JldHJpZXZpbmdcbiAgICAgICAgICAgICAgICB2YXIgYXV0b3Jlc3RvcmVPcHRzID0ge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnWC1BdXRvUmVzdG9yZSc6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIGF1dG9yZXN0b3JlT3B0cywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdXJsQ29uZmlnO1xuICAgIH1cblxuICAgIHZhciBodHRwO1xuICAgIHZhciBodHRwT3B0aW9uczsgLy9GSVhNRTogTWFrZSB0aGlzIHNpZGUtZWZmZWN0LWxlc3NcbiAgICBmdW5jdGlvbiB1cGRhdGVIVFRQQ29uZmlnKHNlcnZpY2VPcHRpb25zLCB1cmxDb25maWcpIHtcbiAgICAgICAgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG4gICAgICAgIGh0dHAuc3BsaXRHZXQgPSBydXRpbC5zcGxpdEdldEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSB1cGRhdGVVUkxDb25maWcoc2VydmljZU9wdGlvbnMpOyAvL21ha2luZyBhIGZ1bmN0aW9uIHNvICN1cGRhdGVDb25maWcgY2FuIGNhbGwgdGhpczsgY2hhbmdlIHdoZW4gcmVmYWN0b3JlZFxuICAgIHVwZGF0ZUhUVFBDb25maWcoc2VydmljZU9wdGlvbnMsIHVybENvbmZpZyk7XG4gICBcblxuICAgIGZ1bmN0aW9uIHNldEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBzZXJ2aWNlT3B0aW9ucy5pZCA9IG9wdGlvbnMuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBzZXJ2aWNlT3B0aW9ucy5pZCA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGZpbHRlciBzcGVjaWZpZWQgdG8gYXBwbHkgb3BlcmF0aW9ucyBhZ2FpbnN0Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIHVybENvbmZpZzogdXJsQ29uZmlnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOT1RFOiBUeXBpY2FsbHkgdGhpcyBpcyBub3QgdXNlZCEgVXNlIGBSdW5NYW5hZ2VyLmdldFJ1bigpYCB3aXRoIGEgYHN0cmF0ZWd5YCBvZiBgcmV1c2UtbmV2ZXJgLCBvciB1c2UgYFJ1bk1hbmFnZXIucmVzZXQoKWAuIFNlZSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgcnMuY3JlYXRlKCdoZWxsb193b3JsZC5qbCcpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBwYXJhbXMgSWYgYSBzdHJpbmcsIHRoZSBuYW1lIG9mIHRoZSBwcmltYXJ5IFttb2RlbCBmaWxlXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4gVGhpcyBpcyB0aGUgb25lIGZpbGUgaW4gdGhlIHByb2plY3QgdGhhdCBleHBsaWNpdGx5IGV4cG9zZXMgdmFyaWFibGVzIGFuZCBtZXRob2RzLCBhbmQgaXQgbXVzdCBiZSBzdG9yZWQgaW4gdGhlIE1vZGVsIGZvbGRlciBvZiB5b3VyIEVwaWNlbnRlciBwcm9qZWN0LiBJZiBhbiBvYmplY3QsIG1heSBpbmNsdWRlIGBtb2RlbGAsIGBzY29wZWAsIGFuZCBgZmlsZXNgLiAoU2VlIHRoZSBbUnVuIE1hbmFnZXJdKC4uL3J1bl9tYW5hZ2VyLykgZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gYHNjb3BlYCBhbmQgYGZpbGVzYC4pXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3J1bicpIH0pO1xuICAgICAgICAgICAgdmFyIHJ1bkFwaVBhcmFtcyA9IFsnbW9kZWwnLCAnc2NvcGUnLCAnZmlsZXMnLCAnZXBoZW1lcmFsJywgJ2NpbkZpbGVzJ107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgdGhlIG1vZGVsIG5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IG1vZGVsOiBwYXJhbXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBydW5BcGlQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5pZCA9IHJlc3BvbnNlLmlkO1xuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciBydW5zLCBiYXNlZCBvbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgYHFzYCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBlbGVtZW50cyBvZiB0aGUgYHFzYCBvYmplY3QgYXJlIEFORGVkIHRvZ2V0aGVyIHdpdGhpbiBhIHNpbmdsZSBjYWxsIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJucyBydW5zIHdpdGggc2F2ZWQgPSB0cnVlIGFuZCB2YXJpYWJsZXMucHJpY2UgPiAxLFxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlIHZhcmlhYmxlcy5wcmljZSBoYXMgYmVlbiBwZXJzaXN0ZWQgKHJlY29yZGVkKVxuICAgICAgICAgKiAgICAgIC8vIGluIHRoZSBtb2RlbC5cbiAgICAgICAgICogICAgIHJzLnF1ZXJ5KHtcbiAgICAgICAgICogICAgICAgICAgJ3NhdmVkJzogJ3RydWUnLFxuICAgICAgICAgKiAgICAgICAgICAnLnByaWNlJzogJz4xJ1xuICAgICAgICAgKiAgICAgICB9LFxuICAgICAgICAgKiAgICAgICB7XG4gICAgICAgICAqICAgICAgICAgIHN0YXJ0cmVjb3JkOiAyLFxuICAgICAgICAgKiAgICAgICAgICBlbmRyZWNvcmQ6IDVcbiAgICAgICAgICogICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBxcyBRdWVyeSBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI2ZpbHRlcnMpIGFsbG93ZWQgaW4gdGhlIHVuZGVybHlpbmcgUnVuIEFQSS4pIFF1ZXJ5aW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIG1vZGVsIG9yIG1hcmtlZCBmb3Igc2F2aW5nIGluIHlvdXIgW21vZGVsIGNvbnRleHQgZmlsZV0oLi4vLi4vLi4vbW9kZWxfY29kZS9jb250ZXh0LykpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0TW9kaWZpZXIgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMKHFzKSB9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKS50aGVuKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkLmlzUGxhaW5PYmplY3QocikgJiYgT2JqZWN0LmtleXMocikubGVuZ3RoID09PSAwKSA/IFtdIDogcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBTaW1pbGFyIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXIgRmlsdGVyIG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgRmlsdGVyaW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIG1vZGVsIG9yIG1hcmtlZCBmb3Igc2F2aW5nIGluIHlvdXIgW21vZGVsIGNvbnRleHQgZmlsZV0oLi4vLi4vLi4vbW9kZWxfY29kZS9jb250ZXh0LykpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0TW9kaWZpZXIgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24gKGZpbHRlciwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qoc2VydmljZU9wdGlvbnMuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHNlcnZpY2VPcHRpb25zLmZpbHRlciwgZmlsdGVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnNwbGl0R2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucykudGhlbihmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoJC5pc1BsYWluT2JqZWN0KHIpICYmIE9iamVjdC5rZXlzKHIpLmxlbmd0aCA9PT0gMCkgPyBbXSA6IHI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgcnVuLiBUaGlzIGluY2x1ZGVzIHN0YW5kYXJkIHJ1biBkYXRhIHN1Y2ggYXMgdGhlIGFjY291bnQsIG1vZGVsLCBwcm9qZWN0LCBhbmQgY3JlYXRlZCBhbmQgbGFzdCBtb2RpZmllZCBkYXRlcy4gVG8gcmVxdWVzdCBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMgb3IgcnVuIHJlY29yZCB2YXJpYWJsZXMsIHBhc3MgdGhlbSBhcyBwYXJ0IG9mIHRoZSBgZmlsdGVyc2AgcGFyYW1ldGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgaWYgdGhlIHJ1biBpcyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSwgYW55IG1vZGVsIHZhcmlhYmxlcyBhcmUgYXZhaWxhYmxlOyBpZiB0aGUgcnVuIGlzIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1kYiksIG9ubHkgbW9kZWwgdmFyaWFibGVzIHRoYXQgaGF2ZSBiZWVuIHBlcnNpc3RlZCAmbWRhc2g7IHRoYXQgaXMsIGByZWNvcmRgZWQgb3Igc2F2ZWQgaW4geW91ciBtb2RlbCAmbWRhc2g7IGFyZSBhdmFpbGFibGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5sb2FkKCdiYjU4OTY3Ny1kNDc2LTQ5NzEtYTY4ZS0wYzU4ZDE5MWU0NTAnLCB7IGluY2x1ZGU6IFsnLnByaWNlJywgJy5zYWxlcyddIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gcnVuSUQgVGhlIHJ1biBpZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGZpbHRlcnMgKE9wdGlvbmFsKSBPYmplY3QgY29udGFpbmluZyBmaWx0ZXJzIGFuZCBvcGVyYXRpb24gbW9kaWZpZXJzLiBVc2Uga2V5IGBpbmNsdWRlYCB0byBsaXN0IG1vZGVsIHZhcmlhYmxlcyB0aGF0IHlvdSB3YW50IHRvIGluY2x1ZGUgaW4gdGhlIHJlc3BvbnNlLiBPdGhlciBhdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChydW5JRCwgZmlsdGVycywgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHJ1bklEKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcnVuSUQ7IC8vc2hvdWxkbid0IGJlIGFibGUgdG8gb3Zlci1yaWRlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGZpbHRlcnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBzcGVjaWZpZWQgcnVuaWQgZnJvbSBtZW1vcnlcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHJzLnJlbW92ZUZyb21NZW1vcnkoJ2JiNTg5Njc3LWQ0NzYtNDk3MS1hNjhlLTBjNThkMTkxZTQ1MCcpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBTZWUgW2RldGFpbHMgb24gcnVuIHBlcnNpc3RlbmNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IFtydW5JRF0gICBpZCBvZiBydW4gdG8gcmVtb3ZlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gW2ZpbHRlcnNdIChPcHRpb25hbCkgT2JqZWN0IGNvbnRhaW5pbmcgZmlsdGVycyBhbmQgb3BlcmF0aW9uIG1vZGlmaWVycy4gVXNlIGtleSBgaW5jbHVkZWAgdG8gbGlzdCBtb2RlbCB2YXJpYWJsZXMgdGhhdCB5b3Ugd2FudCB0byBpbmNsdWRlIGluIHRoZSByZXNwb25zZS4gT3RoZXIgYXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gW29wdGlvbnNdIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmVGcm9tTWVtb3J5OiBmdW5jdGlvbiAocnVuSUQsIGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAocnVuSUQpIHtcbiAgICAgICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgncnVuJykgKyBydW5JRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZSh7fSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGF0dHJpYnV0ZXMgKGRhdGEsIG1vZGVsIHZhcmlhYmxlcykgb2YgdGhlIHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBhZGQgJ2NvbXBsZXRlZCcgZmllbGQgdG8gcnVuIHJlY29yZFxuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IGNvbXBsZXRlZDogdHJ1ZSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHVwZGF0ZSAnc2F2ZWQnIGZpZWxkIG9mIHJ1biByZWNvcmQsIGFuZCB1cGRhdGUgdmFsdWVzIG9mIG1vZGVsIHZhcmlhYmxlcyBmb3IgdGhpcyBydW5cbiAgICAgICAgICogICAgIHJzLnNhdmUoeyBzYXZlZDogdHJ1ZSwgdmFyaWFibGVzOiB7IGE6IDIzLCBiOiAyMyB9IH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gdXBkYXRlICdzYXZlZCcgZmllbGQgb2YgcnVuIHJlY29yZCBmb3IgYSBwYXJ0aWN1bGFyIHJ1blxuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IHNhdmVkOiB0cnVlIH0sIHsgaWQ6ICcwMDAwMDE1YmYyYTA0OTk1ODgwZGY2Yjg2OGQyM2ViM2QyMjknIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyBUaGUgcnVuIGRhdGEgYW5kIHZhcmlhYmxlcyB0byBzYXZlLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcy52YXJpYWJsZXMgTW9kZWwgdmFyaWFibGVzIG11c3QgYmUgaW5jbHVkZWQgaW4gYSBgdmFyaWFibGVzYCBmaWVsZCB3aXRoaW4gdGhlIGBhdHRyaWJ1dGVzYCBvYmplY3QuIChPdGhlcndpc2UgdGhleSBhcmUgdHJlYXRlZCBhcyBydW4gZGF0YSBhbmQgYWRkZWQgdG8gdGhlIHJ1biByZWNvcmQgZGlyZWN0bHkuKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGF0dHJpYnV0ZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBzZXRGaWx0ZXJPclRocm93RXJyb3IoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2goYXR0cmlidXRlcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIGFuIG9wZXJhdGlvbiBmcm9tIHRoZSBtb2RlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBvcGVyYXRpb24gKGZ1bmN0aW9uIG9yIG1ldGhvZCkgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGBwYXJhbXNgIGFyZ3VtZW50IGlzIG5vcm1hbGx5IGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byB0aGUgYG9wZXJhdGlvbmAuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCB5b3UgY2FuIGNvbWJpbmUgdGhlIGBvcGVyYXRpb25gIGFuZCBgcGFyYW1zYCBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBvYmplY3QgaWYgeW91IHByZWZlciwgYXMgaW4gdGhlIGxhc3QgZXhhbXBsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9uIFwic29sdmVcIiB0YWtlcyBubyBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLmRvKCdzb2x2ZScpO1xuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbiBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsIFsnaGVsbG8nXSk7XG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9uIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgJ2hlbGxvJyk7XG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9uIFwic3VtQXJyYXlcIiB0YWtlcyBvbmUgYXJndW1lbnQsIGFuIGFycmF5XG4gICAgICAgICAqICAgICBycy5kbygnc3VtQXJyYXknLCBbWzQsMiwxXV0pO1xuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbiBcImFkZFwiIHRha2VzIHR3byBhcmd1bWVudHMsIGJvdGggaW50ZWdlcnNcbiAgICAgICAgICogICAgIHJzLmRvKHsgbmFtZTonYWRkJywgcGFyYW1zOlsyLDRdIH0pO1xuICAgICAgICAgKiAgICAgIC8vIGNhbGwgb3BlcmF0aW9uIFwic29sdmVcIiBvbiBhIGRpZmZlcmVudCBydW4gXG4gICAgICAgICAqICAgICBycy5kbygnc29sdmUnLCB7IGlkOiAnMDAwMDAxNWJmMmEwNDk5NTg4MGRmNmI4NjhkMjNlYjNkMjI5JyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG9wZXJhdGlvbiBOYW1lIG9mIG9wZXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gcGFyYW1zIChPcHRpb25hbCkgQW55IHBhcmFtZXRlcnMgdGhlIG9wZXJhdGlvbiB0YWtlcywgcGFzc2VkIGFzIGFuIGFycmF5LiBJbiB0aGUgc3BlY2lhbCBjYXNlIHdoZXJlIGBvcGVyYXRpb25gIG9ubHkgdGFrZXMgb25lIGFyZ3VtZW50LCB5b3UgYXJlIG5vdCByZXF1aXJlZCB0byBwdXQgdGhhdCBhcmd1bWVudCBpbnRvIGFuIGFycmF5LCBhbmQgY2FuIGp1c3QgcGFzcyBpdCBkaXJlY3RseS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGRvOiBmdW5jdGlvbiAob3BlcmF0aW9uLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdkbycsIG9wZXJhdGlvbiwgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHNBcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBvcHNBcmdzID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgICBvcHNBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucyA9IHBhcmFtcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbiwgb3BzQXJncyk7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIHBvc3RPcHRpb25zKTtcblxuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHBybXMgPSAocmVzdWx0LmFyZ3NbMF0ubGVuZ3RoICYmIChyZXN1bHQuYXJnc1swXSAhPT0gbnVsbCAmJiByZXN1bHQuYXJnc1swXSAhPT0gdW5kZWZpbmVkKSkgPyByZXN1bHQuYXJnc1swXSA6IFtdO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdCh7IGFyZ3VtZW50czogcHJtcyB9LCAkLmV4dGVuZCh0cnVlLCB7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICdvcGVyYXRpb25zLycgKyByZXN1bHQub3BzWzBdICsgJy8nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgc2V2ZXJhbCBvcGVyYXRpb25zIGZyb20gdGhlIG1vZGVsLCBzZXF1ZW50aWFsbHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgb3BlcmF0aW9uIChmdW5jdGlvbiBvciBtZXRob2QpIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbnMgXCJpbml0aWFsaXplXCIgYW5kIFwic29sdmVcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWydpbml0aWFsaXplJywgJ3NvbHZlJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbnMgXCJpbml0XCIgYW5kIFwicmVzZXRcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXQnLCBwYXJhbXM6IFsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb24gXCJpbml0XCIgdGFrZXMgdHdvIGFyZ3VtZW50cyxcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb24gXCJydW5tb2RlbFwiIHRha2VzIG5vbmVcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3J1bm1vZGVsJywgcGFyYW1zOiBbXSB9XSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IG9wZXJhdGlvbnMgSWYgbm9uZSBvZiB0aGUgb3BlcmF0aW9ucyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG9wZXJhdGlvbiBuYW1lcyAoc3RyaW5ncykuIElmIGFueSBvZiB0aGUgb3BlcmF0aW9ucyBkbyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhbiBvcGVyYXRpb24gbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gcGFzcyB0byBvcGVyYXRpb25zLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBUaGUgcGFyYW1ldGVyIHRvIHRoZSBjYWxsYmFjayBpcyBhbiBhcnJheS4gRWFjaCBhcnJheSBlbGVtZW50IGlzIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSByZXN1bHRzIG9mIG9uZSBvcGVyYXRpb24uXG4gICAgICAgICAqL1xuICAgICAgICBzZXJpYWw6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2VzID0gW107XG4gICAgICAgICAgICB2YXIgZG9TaW5nbGVPcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJncy5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgbWUuZG8ob3AsIGFyZywge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZXMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUocmVzcG9uc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzKHJlc3BvbnNlcywgbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VzLnB1c2goZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IocmVzcG9uc2VzLCBtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvU2luZ2xlT3AoKTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG9wZXJhdGlvbnMgZnJvbSB0aGUgbW9kZWwsIGV4ZWN1dGluZyB0aGVtIGluIHBhcmFsbGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG9wZXJhdGlvbiAoZnVuY3Rpb24gb3IgbWV0aG9kKSBtYXkgbmVlZCB0byBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsKSBpbiB0aGUgbW9kZWwgZmlsZSBpbiBvcmRlciB0byBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgQVBJLiBTZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbnMgXCJzb2x2ZVwiIGFuZCBcInJlc2V0XCIgZG8gbm90IHRha2UgYW55IGFyZ3VtZW50c1xuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoWydzb2x2ZScsICdyZXNldCddKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb25zIFwiYWRkXCIgYW5kIFwic3VidHJhY3RcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoWyB7IG5hbWU6ICdhZGQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3N1YnRyYWN0JywgcGFyYW1zOlsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb25zIFwiYWRkXCIgYW5kIFwic3VidHJhY3RcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoeyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBvcGVyYXRpb25zIElmIG5vbmUgb2YgdGhlIG9wZXJhdGlvbnMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBvcGVyYXRpb24gbmFtZXMgKGFzIHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG9wZXJhdGlvbnMgZG8gdGFrZSBwYXJhbWV0ZXJzLCB5b3UgaGF2ZSB0d28gb3B0aW9ucy4gWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYW4gb3BlcmF0aW9uIG5hbWUgYW5kIGl0cyBvd24gKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLiBBbHRlcm5hdGl2ZWx5LCB5b3UgY2FuIHBhc3MgYSBzaW5nbGUgb2JqZWN0IHdpdGggdGhlIG9wZXJhdGlvbiBuYW1lIGFuZCBhIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBwYXJhbXMgUGFyYW1ldGVycyB0byBwYXNzIHRvIG9wZXJhdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFRoZSBwYXJhbWV0ZXIgdG8gdGhlIGNhbGxiYWNrIGlzIGFuIGFycmF5LiBFYWNoIGFycmF5IGVsZW1lbnQgaXMgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHJlc3VsdHMgb2Ygb25lIG9wZXJhdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFsbGVsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcXVldWUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kbyhvcHNbaV0sIGFyZ3NbaV0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgICQud2hlbi5hcHBseSh0aGlzLCBxdWV1ZSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFJlc3BvbnNlID0gYXJncy5tYXAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhWzBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZShhY3R1YWxSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLnN1Y2Nlc3MoYWN0dWFsUmVzcG9uc2UsIG1lKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsUmVzcG9uc2UgPSBhcmdzLm1hcChmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFbMF07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QoYWN0dWFsUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5lcnJvcihhY3R1YWxSZXNwb25zZSwgbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaG9ydGN1dCB0byB1c2luZyB0aGUgW0ludHJvc3BlY3Rpb24gQVBJIFNlcnZpY2VdKC4uL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UvKS4gQWxsb3dzIHlvdSB0byB2aWV3IGEgbGlzdCBvZiB0aGUgdmFyaWFibGVzIGFuZCBvcGVyYXRpb25zIGluIGEgbW9kZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5pbnRyb3NwZWN0KHsgcnVuSUQ6ICdjYmY4NTQzNy1iNTM5LTQ5NzctYTFmYy0yMzUxNWNmMDcxYmInIH0pLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICogICAgICAgICAgY29uc29sZS5sb2coZGF0YS5mdW5jdGlvbnMpO1xuICAgICAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnZhcmlhYmxlcyk7XG4gICAgICAgICAqICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgY2FuIGVpdGhlciBiZSBvZiB0aGUgZm9ybSBgeyBydW5JRDogPHJ1bmlkPiB9YCBvciBgeyBtb2RlbDogPG1vZGVsRmlsZU5hbWU+IH1gLiBOb3RlIHRoYXQgdGhlIGBydW5JRGAgaXMgb3B0aW9uYWwgaWYgdGhlIFJ1biBTZXJ2aWNlIGlzIGFscmVhZHkgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBydW4gKGJlY2F1c2UgYGlkYCB3YXMgcGFzc2VkIGluIHdoZW4gdGhlIFJ1biBTZXJ2aWNlIHdhcyBpbml0aWFsaXplZCkuIElmIHByb3ZpZGVkLCB0aGUgYHJ1bklEYCBvdmVycmlkZXMgdGhlIGBpZGAgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGUgUnVuIFNlcnZpY2UuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gaW50cm9zcGVjdGlvbkNvbmZpZyAoT3B0aW9uYWwpIFNlcnZpY2Ugb3B0aW9ucyBmb3IgSW50cm9zcGVjdGlvbiBTZXJ2aWNlXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBpbnRyb3NwZWN0OiBmdW5jdGlvbiAob3B0aW9ucywgaW50cm9zcGVjdGlvbkNvbmZpZykge1xuICAgICAgICAgICAgdmFyIGludHJvc3BlY3Rpb24gPSBuZXcgSW50cm9zcGVjdGlvblNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBpbnRyb3NwZWN0aW9uQ29uZmlnKSk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJ1bklEKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5UnVuSUQob3B0aW9ucy5ydW5JRCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLm1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5TW9kZWwob3B0aW9ucy5tb2RlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChzZXJ2aWNlT3B0aW9ucy5pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5UnVuSUQoc2VydmljZU9wdGlvbnMuaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGVpdGhlciB0aGUgbW9kZWwgb3IgcnVuaWQgdG8gaW50cm9zcGVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNTeW5jQVBJID0ge1xuICAgICAgICBnZXRDdXJyZW50Q29uZmlnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnM7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKGNvbmZpZyAmJiBjb25maWcuaWQpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuZmlsdGVyID0gY29uZmlnLmlkO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25maWcgJiYgY29uZmlnLmZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5pZCA9IGNvbmZpZy5maWx0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgY29uZmlnKTtcbiAgICAgICAgICAgIHVybENvbmZpZyA9IHVwZGF0ZVVSTENvbmZpZyhzZXJ2aWNlT3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLnVybENvbmZpZyA9IHVybENvbmZpZztcbiAgICAgICAgICAgIHVwZGF0ZUhUVFBDb25maWcoc2VydmljZU9wdGlvbnMsIHVybENvbmZpZyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgICogUmV0dXJucyBhIFZhcmlhYmxlcyBTZXJ2aWNlIGluc3RhbmNlLiBVc2UgdGhlIHZhcmlhYmxlcyBpbnN0YW5jZSB0byBsb2FkLCBzYXZlLCBhbmQgcXVlcnkgZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy4gU2VlIHRoZSBbVmFyaWFibGUgQVBJIFNlcnZpY2VdKC4uL3ZhcmlhYmxlcy1hcGktc2VydmljZS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgICAgICAgICpcbiAgICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAgKlxuICAgICAgICAgICogICAgICB2YXIgdnMgPSBycy52YXJpYWJsZXMoKTtcbiAgICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHNhbXBsZV9pbnQ6IDQgfSk7XG4gICAgICAgICAgKlxuICAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0gdmFyaWFibGVzU2VydmljZSBJbnN0YW5jZVxuICAgICAgICAgICovXG4gICAgICAgIHZhcmlhYmxlczogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHZzID0gbmV3IFZhcmlhYmxlc1NlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBjb25maWcsIHtcbiAgICAgICAgICAgICAgICBydW5TZXJ2aWNlOiB0aGlzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gdnM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY1N5bmNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgc2VydmljZVV0aWxzID0ge1xuICAgIC8qXG4gICAgKiBHZXRzIHRoZSBkZWZhdWx0IG9wdGlvbnMgZm9yIGEgYXBpIHNlcnZpY2UuXG4gICAgKiBJdCB3aWxsIG1lcmdlOlxuICAgICogLSBUaGUgU2Vzc2lvbiBvcHRpb25zIChVc2luZyB0aGUgU2Vzc2lvbiBNYW5hZ2VyKVxuICAgICogLSBUaGUgQXV0aG9yaXphdGlvbiBIZWFkZXIgZnJvbSB0aGUgdG9rZW4gb3B0aW9uXG4gICAgKiAtIFRoZSBmdWxsIHVybCBmcm9tIHRoZSBlbmRwb2ludCBvcHRpb25cbiAgICAqIFdpdGggdGhlIHN1cHBsaWVkIG92ZXJyaWRlcyBhbmQgZGVmYXVsdHNcbiAgICAqXG4gICAgKi9cbiAgICBnZXREZWZhdWx0T3B0aW9uczogZnVuY3Rpb24gKGRlZmF1bHRzKSB7XG4gICAgICAgIHZhciByZXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgdmFyIHNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMuYXBwbHkoc2Vzc2lvbk1hbmFnZXIsIFtkZWZhdWx0c10uY29uY2F0KHJlc3QpKTtcblxuICAgICAgICBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQgPSBvYmplY3RBc3NpZ24oe30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICAgICAgdXJsOiB0aGlzLmdldEFwaVVybChzZXJ2aWNlT3B0aW9ucy5hcGlFbmRwb2ludCwgc2VydmljZU9wdGlvbnMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgIH0sXG5cbiAgICBnZXRBcGlVcmw6IGZ1bmN0aW9uIChhcGlFbmRwb2ludCwgc2VydmljZU9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgICAgICByZXR1cm4gdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VydmljZVV0aWxzOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogIyMgU3RhdGUgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgU3RhdGUgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byB2aWV3IHRoZSBoaXN0b3J5IG9mIGEgcnVuLCBhbmQgdG8gcmVwbGF5IG9yIGNsb25lIHJ1bnMuIFxuICpcbiAqIFRoZSBTdGF0ZSBBUEkgQWRhcHRlciBicmluZ3MgZXhpc3RpbmcsIHBlcnNpc3RlZCBydW4gZGF0YSBmcm9tIHRoZSBkYXRhYmFzZSBiYWNrIGludG8gbWVtb3J5LCB1c2luZyB0aGUgc2FtZSBydW4gaWQgKGByZXBsYXlgKSBvciBhIG5ldyBydW4gaWQgKGBjbG9uZWApLiBSdW5zIG11c3QgYmUgaW4gbWVtb3J5IGluIG9yZGVyIGZvciB5b3UgdG8gdXBkYXRlIHZhcmlhYmxlcyBvciBjYWxsIG9wZXJhdGlvbnMgb24gdGhlbS5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBTdGF0ZSBBUEkgQWRhcHRlciB3b3JrcyBieSBcInJlLXJ1bm5pbmdcIiB0aGUgcnVuICh1c2VyIGludGVyYWN0aW9ucykgZnJvbSB0aGUgY3JlYXRpb24gb2YgdGhlIHJ1biB1cCB0byB0aGUgdGltZSBpdCB3YXMgbGFzdCBwZXJzaXN0ZWQgaW4gdGhlIGRhdGFiYXNlLiBUaGlzIHByb2Nlc3MgdXNlcyB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIHRoZSBydW4ncyBtb2RlbC4gVGhlcmVmb3JlLCBpZiB0aGUgbW9kZWwgaGFzIGNoYW5nZWQgc2luY2UgdGhlIG9yaWdpbmFsIHJ1biB3YXMgY3JlYXRlZCwgdGhlIHJldHJpZXZlZCBydW4gd2lsbCB1c2UgdGhlIG5ldyBtb2RlbCDigJQgYW5kIG1heSBlbmQgdXAgaGF2aW5nIGRpZmZlcmVudCB2YWx1ZXMgb3IgYmVoYXZpb3IgYXMgYSByZXN1bHQuIFVzZSB3aXRoIGNhcmUhXG4gKlxuICogVG8gdXNlIHRoZSBTdGF0ZSBBUEkgQWRhcHRlciwgaW5zdGFudGlhdGUgaXQgYW5kIHRoZW4gY2FsbCBpdHMgbWV0aG9kczpcbiAqXG4gKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAqICAgICAgc2EucmVwbGF5KHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0Zid9KTtcbiAqXG4gKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgYG9wdGlvbnNgIHBhcmFtZXRlciBpbiB3aGljaCB5b3UgY2FuIHNwZWNpZnkgdGhlIGBhY2NvdW50YCBhbmQgYHByb2plY3RgIGlmIHRoZXkgYXJlIG5vdCBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudCBjb250ZXh0LlxuICpcbiAqL1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBhcGlFbmRwb2ludCA9ICdtb2RlbC9zdGF0ZSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuICAgIHZhciBwYXJzZVJ1bklkT3JFcnJvciA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbXMpICYmIHBhcmFtcy5ydW5JZCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5ydW5JZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHBhc3MgaW4gYSBydW4gaWQnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFZpZXcgdGhlIGhpc3Rvcnkgb2YgYSBydW4uXG4gICAgICAgICogXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLmxvYWQoJzAwMDAwMTVhMDZiYjU4NjEzYjI4YjU3MzY1Njc3ZWM4OWVjNScpLnRoZW4oZnVuY3Rpb24oaGlzdG9yeSkge1xuICAgICAgICAqICAgICAgICAgICAgY29uc29sZS5sb2coJ2hpc3RvcnkgPSAnLCBoaXN0b3J5KTtcbiAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJ1bklkIFRoZSBpZCBvZiB0aGUgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHJ1bklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cFBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHJ1bklkIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBQYXJhbXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlcGxheSBhIHJ1bi4gQWZ0ZXIgdGhpcyBjYWxsLCB0aGUgcnVuLCB3aXRoIGl0cyBvcmlnaW5hbCBydW4gaWQsIGlzIG5vdyBhdmFpbGFibGUgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIChJdCBjb250aW51ZXMgdG8gYmUgcGVyc2lzdGVkIGludG8gdGhlIEVwaWNlbnRlciBkYXRhYmFzZSBhdCByZWd1bGFyIGludGVydmFscy4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHNhID0gbmV3IEYuc2VydmljZS5TdGF0ZSgpO1xuICAgICAgICAqICAgICAgc2EucmVwbGF5KHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0ZicsIHN0b3BCZWZvcmU6ICdjYWxjdWxhdGVTY29yZSd9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyBvYmplY3QuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5ydW5JZCBUaGUgaWQgb2YgdGhlIHJ1biB0byBicmluZyBiYWNrIHRvIG1lbW9yeS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnN0b3BCZWZvcmUgKE9wdGlvbmFsKSBUaGUgcnVuIGlzIGFkdmFuY2VkIG9ubHkgdXAgdG8gdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgdGhpcyBtZXRob2QuXG4gICAgICAgICogQHBhcmFtIHthcnJheX0gcGFyYW1zLmV4Y2x1ZGUgKE9wdGlvbmFsKSBBcnJheSBvZiBtZXRob2RzIHRvIGV4Y2x1ZGUgd2hlbiBhZHZhbmNpbmcgdGhlIHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHJlcGxheTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJ1bklkID0gcGFyc2VSdW5JZE9yRXJyb3IocGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ3JlcGxheScgfSwgX3BpY2socGFyYW1zLCBbJ3N0b3BCZWZvcmUnLCAnZXhjbHVkZSddKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCByZXBsYXlPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDbG9uZSBhIGdpdmVuIHJ1biBhbmQgcmV0dXJuIGEgbmV3IHJ1biBpbiB0aGUgc2FtZSBzdGF0ZSBhcyB0aGUgZ2l2ZW4gcnVuLlxuICAgICAgICAqXG4gICAgICAgICogVGhlIG5ldyBydW4gaWQgaXMgbm93IGF2YWlsYWJsZSBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KS4gVGhlIG5ldyBydW4gaW5jbHVkZXMgYSBjb3B5IG9mIGFsbCBvZiB0aGUgZGF0YSBmcm9tIHRoZSBvcmlnaW5hbCBydW4sIEVYQ0VQVDpcbiAgICAgICAgKlxuICAgICAgICAqICogVGhlIGBzYXZlZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIG5vdCBjb3BpZWQgZnJvbSB0aGUgb3JpZ2luYWwgcnVuIHJlY29yZC4gSXQgZGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAgICAgICAgKiAqIFRoZSBgaW5pdGlhbGl6ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyBub3QgY29waWVkIGZyb20gdGhlIG9yaWdpbmFsIHJ1biByZWNvcmQuIEl0IGRlZmF1bHRzIHRvIGBmYWxzZWAgYnV0IG1heSBjaGFuZ2UgdG8gYHRydWVgIGFzIHRoZSBuZXcgcnVuIGlzIGFkdmFuY2VkLiBGb3IgZXhhbXBsZSwgaWYgdGhlcmUgaGFzIGJlZW4gYSBjYWxsIHRvIHRoZSBgc3RlcGAgZnVuY3Rpb24gKGZvciBWZW5zaW0gbW9kZWxzKSwgdGhlIGBpbml0aWFsaXplZGAgZmllbGQgaXMgc2V0IHRvIGB0cnVlYC5cbiAgICAgICAgKiAqIFRoZSBgY3JlYXRlZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIHRoZSBkYXRlIGFuZCB0aW1lIGF0IHdoaWNoIHRoZSBjbG9uZSB3YXMgY3JlYXRlZCAobm90IHRoZSB0aW1lIHRoYXQgdGhlIG9yaWdpbmFsIHJ1biB3YXMgY3JlYXRlZC4pXG4gICAgICAgICpcbiAgICAgICAgKiBUaGUgb3JpZ2luYWwgcnVuIHJlbWFpbnMgb25seSBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tZGIpLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLmNsb25lKHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0ZicsIHN0b3BCZWZvcmU6ICdjYWxjdWxhdGVTY29yZScsIGV4Y2x1ZGU6IFsnaW50ZXJpbUNhbGN1bGF0aW9uJ10gfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgb2JqZWN0LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMucnVuSWQgVGhlIGlkIG9mIHRoZSBydW4gdG8gY2xvbmUgZnJvbSBtZW1vcnkuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zdG9wQmVmb3JlIChPcHRpb25hbCkgVGhlIG5ld2x5IGNsb25lZCBydW4gaXMgYWR2YW5jZWQgb25seSB1cCB0byB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGlzIG1ldGhvZC5cbiAgICAgICAgKiBAcGFyYW0ge2FycmF5fSBwYXJhbXMuZXhjbHVkZSAoT3B0aW9uYWwpIEFycmF5IG9mIG1ldGhvZHMgdG8gZXhjbHVkZSB3aGVuIGFkdmFuY2luZyB0aGUgbmV3bHkgY2xvbmVkIHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcnVuSWQgPSBwYXJzZVJ1bklkT3JFcnJvcihwYXJhbXMpO1xuXG4gICAgICAgICAgICB2YXIgcmVwbGF5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHJ1bklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHsgYWN0aW9uOiAnY2xvbmUnIH0sIF9waWNrKHBhcmFtcywgWydzdG9wQmVmb3JlJywgJ2V4Y2x1ZGUnXSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgcmVwbGF5T3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBlcGlWZXJzaW9uID0gcmVxdWlyZSgnLi4vYXBpLXZlcnNpb24uanNvbicpO1xuXG4vL1RPRE86IHVybHV0aWxzIHRvIGdldCBob3N0LCBzaW5jZSBubyB3aW5kb3cgb24gbm9kZVxudmFyIGRlZmF1bHRzID0ge1xuICAgIGhvc3Q6IHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgIHBhdGhuYW1lOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcbn07XG5cbmZ1bmN0aW9uIGdldExvY2FsSG9zdChleGlzdGluZ0ZuLCBob3N0KSB7XG4gICAgdmFyIGxvY2FsSG9zdEZuO1xuICAgIGlmIChleGlzdGluZ0ZuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCEkLmlzRnVuY3Rpb24oZXhpc3RpbmdGbikpIHtcbiAgICAgICAgICAgIGxvY2FsSG9zdEZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZXhpc3RpbmdGbjsgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvY2FsSG9zdEZuID0gZXhpc3RpbmdGbjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsSG9zdEZuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlzTG9jYWwgPSAhaG9zdCB8fCAvL3BoYW50b21qc1xuICAgICAgICAgICAgICAgIGhvc3QgPT09ICcxMjcuMC4wLjEnIHx8IFxuICAgICAgICAgICAgICAgIGhvc3QuaW5kZXhPZignbG9jYWwuJykgPT09IDAgfHwgXG4gICAgICAgICAgICAgICAgaG9zdC5pbmRleE9mKCduZ3JvaycpICE9PSAtMSB8fCBcbiAgICAgICAgICAgICAgICBob3N0LmluZGV4T2YoJ2xvY2FsaG9zdCcpID09PSAwO1xuICAgICAgICAgICAgcmV0dXJuIGlzTG9jYWw7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBsb2NhbEhvc3RGbjtcbn1cblxudmFyIFVybENvbmZpZ1NlcnZpY2UgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGVudkNvbmYgPSBVcmxDb25maWdTZXJ2aWNlLmRlZmF1bHRzO1xuXG4gICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgY29uZmlnID0ge307XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGVmYXVsdHMpO1xuICAgIHZhciBvdmVycmlkZXMgPSAkLmV4dGVuZCh7fSwgZW52Q29uZiwgY29uZmlnKTtcbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3ZlcnJpZGVzKTtcblxuICAgIG92ZXJyaWRlcy5pc0xvY2FsaG9zdCA9IG9wdGlvbnMuaXNMb2NhbGhvc3QgPSBnZXRMb2NhbEhvc3Qob3B0aW9ucy5pc0xvY2FsaG9zdCwgb3B0aW9ucy5ob3N0KTtcbiAgICBcbiAgICAvLyBjb25zb2xlLmxvZyhpc0xvY2FsaG9zdCgpLCAnX19fX19fX19fX18nKTtcbiAgICB2YXIgYWN0aW5nSG9zdCA9IGNvbmZpZyAmJiBjb25maWcuaG9zdDtcbiAgICBpZiAoIWFjdGluZ0hvc3QgJiYgb3B0aW9ucy5pc0xvY2FsaG9zdCgpKSB7XG4gICAgICAgIGFjdGluZ0hvc3QgPSAnZm9yaW8uY29tJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhY3RpbmdIb3N0ID0gb3B0aW9ucy5ob3N0O1xuICAgIH1cblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIC8vVE9ETzogdGhpcyBzaG91bGQgcmVhbGx5IGJlIGNhbGxlZCAnYXBpaG9zdCcsIGJ1dCBjYW4ndCBiZWNhdXNlIHRoYXQgd291bGQgYnJlYWsgdG9vIG1hbnkgdGhpbmdzXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXBpSG9zdCA9IChIT1NUX0FQSV9NQVBQSU5HW2FjdGluZ0hvc3RdKSA/IEhPU1RfQVBJX01BUFBJTkdbYWN0aW5nSG9zdF0gOiBhY3RpbmdIb3N0O1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYWN0aW5nSG9zdCwgY29uZmlnLCBhcGlIb3N0KTtcbiAgICAgICAgICAgIHJldHVybiBhcGlIb3N0O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGlzQ3VzdG9tRG9tYWluOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIHZhciBwYXRoSGFzQXBwID0gcGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJztcbiAgICAgICAgICAgIHJldHVybiAoIW9wdGlvbnMuaXNMb2NhbGhvc3QoKSAmJiAhcGF0aEhhc0FwcCk7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYXBwUGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwYXRoICYmIHBhdGhbMV0gfHwgJyc7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYWNjb3VudFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWNjbnQgPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIGFjY250ID0gcGF0aFsyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2NudDtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBwcm9qZWN0UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwcmogPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIHByaiA9IHBhdGhbM107IC8vZXNsaW50LWRpc2FibGUtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJqO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHZlcnNpb25QYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBlcGlWZXJzaW9uLnZlcnNpb24gPyBlcGlWZXJzaW9uLnZlcnNpb24gKyAnLycgOiAnJztcbiAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGdldEFQSVBhdGg6IGZ1bmN0aW9uIChhcGkpIHtcbiAgICAgICAgICAgIHZhciBQUk9KRUNUX0FQSVMgPSBbJ3J1bicsICdkYXRhJywgJ2ZpbGUnLCAncHJlc2VuY2UnXTtcbiAgICAgICAgICAgIHZhciBhcGlNYXBwaW5nID0ge1xuICAgICAgICAgICAgICAgIGNoYW5uZWw6ICdjaGFubmVsL3N1YnNjcmliZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgYXBpRW5kcG9pbnQgPSBhcGlNYXBwaW5nW2FwaV0gfHwgYXBpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoYXBpRW5kcG9pbnQgPT09ICdjb25maWcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdHVhbFByb3RvY29sID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sLnJlcGxhY2UoJzonLCAnJyk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbmZpZ1Byb3RvY29sID0gKG9wdGlvbnMuaXNMb2NhbGhvc3QoKSkgPyB0aGlzLnByb3RvY29sIDogYWN0dWFsUHJvdG9jb2w7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ1Byb3RvY29sICsgJzovLycgKyBhY3RpbmdIb3N0ICsgJy9lcGljZW50ZXIvJyArIHRoaXMudmVyc2lvblBhdGggKyAnY29uZmlnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhcGlQYXRoID0gdGhpcy5wcm90b2NvbCArICc6Ly8nICsgdGhpcy5ob3N0ICsgJy8nICsgdGhpcy52ZXJzaW9uUGF0aCArIGFwaUVuZHBvaW50ICsgJy8nO1xuXG4gICAgICAgICAgICBpZiAoJC5pbkFycmF5KGFwaUVuZHBvaW50LCBQUk9KRUNUX0FQSVMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGFwaVBhdGggKz0gdGhpcy5hY2NvdW50UGF0aCArICcvJyArIHRoaXMucHJvamVjdFBhdGggKyAnLyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXBpUGF0aDtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgICQuZXh0ZW5kKHB1YmxpY0V4cG9ydHMsIG92ZXJyaWRlcyk7XG4gICAgcmV0dXJuIHB1YmxpY0V4cG9ydHM7XG59O1xuLy8gVGhpcyBkYXRhIGNhbiBiZSBzZXQgYnkgZXh0ZXJuYWwgc2NyaXB0cywgZm9yIGxvYWRpbmcgZnJvbSBhbiBlbnYgc2VydmVyIGZvciBlZztcblVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcmxDb25maWdTZXJ2aWNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qICMjIFVzZXIgQVBJIEFkYXB0ZXJcbipcbiogVGhlIFVzZXIgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGVuZCB1c2VycyBpbiB5b3VyIHRlYW0gKGFjY291bnQpLiBJdCBpcyBiYXNlZCBvbiB0aGUgcXVlcnlpbmcgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW1VzZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L3VzZXIvKS5cbipcbiogVG8gdXNlIHRoZSBVc2VyIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzLlxuKlxuKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuKiAgICAgICB9KTtcbiogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4qICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuKlxuKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgYG9wdGlvbnNgIHBhcmFtZXRlciBpbiB3aGljaCB5b3UgY2FuIHNwZWNpZnkgdGhlIGBhY2NvdW50YCBhbmQgYHRva2VuYCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY2VzcyB0b2tlbiB0byB1c2Ugd2hlbiBzZWFyY2hpbmcgZm9yIGVuZCB1c2Vycy4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCd1c2VyJylcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgcGFydGljdWxhciBlbmQgdXNlcnMgaW4geW91ciB0ZWFtLCBiYXNlZCBvbiB1c2VyIG5hbWUgb3IgdXNlciBpZC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbidcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKiAgICAgICB1YS5nZXQoeyB1c2VyTmFtZTogJ2pzbWl0aCcgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAnNGVhNzU2MzEtNGM4ZC00ODcyLTlkODAtYjQ2MDAxNDY0NzhlJ10gfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgT2JqZWN0IHdpdGggZmllbGQgYHVzZXJOYW1lYCBhbmQgdmFsdWUgb2YgdGhlIHVzZXJuYW1lLiBBbHRlcm5hdGl2ZWx5LCBvYmplY3Qgd2l0aCBmaWVsZCBgaWRgIGFuZCB2YWx1ZSBvZiBhbiBhcnJheSBvZiB1c2VyIGlkcy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoZmlsdGVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIGZpbHRlciA9IGZpbHRlciB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgdG9RRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIEFQSSBvbmx5IHN1cHBvcnRzIGZpbHRlcmluZyBieSB1c2VybmFtZSBmb3Igbm93XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlci51c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucSA9IGZpbHRlci51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHRvSWRGaWx0ZXJzID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWQgPSAkLmlzQXJyYXkoaWQpID8gaWQgOiBbaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiAnaWQ9JyArIGlkLmpvaW4oJyZpZD0nKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBnZXRGaWx0ZXJzID0gW1xuICAgICAgICAgICAgICAgICdhY2NvdW50PScgKyBnZXRPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgdG9JZEZpbHRlcnMoZmlsdGVyLmlkKSxcbiAgICAgICAgICAgICAgICBxdXRpbC50b1F1ZXJ5Rm9ybWF0KHRvUUZpbHRlcihmaWx0ZXIpKVxuICAgICAgICAgICAgXS5qb2luKCcmJyk7XG5cbiAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgcXVlcmllcyB3aXRoIGxhcmdlIG51bWJlciBvZiBpZHNcbiAgICAgICAgICAgIC8vIG1ha2UgaXQgYXMgYSBwb3N0IHdpdGggR0VUIHNlbWFudGljc1xuICAgICAgICAgICAgdmFyIHRocmVzaG9sZCA9IDMwO1xuICAgICAgICAgICAgaWYgKGZpbHRlci5pZCAmJiAkLmlzQXJyYXkoZmlsdGVyLmlkKSAmJiBmaWx0ZXIuaWQubGVuZ3RoID49IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGdldE9wdGlvbnMudXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKSArICc/X21ldGhvZD1HRVQnO1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBpZDogZmlsdGVyLmlkIH0sIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZ2V0RmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBhIHNpbmdsZSBlbmQgdXNlciBpbiB5b3VyIHRlYW0sIGJhc2VkIG9uIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIHVzZXIgaWQgZm9yIHRoZSBlbmQgdXNlciBpbiB5b3VyIHRlYW0uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuXG4gICAgICAgIGdldEJ5SWQ6IGZ1bmN0aW9uICh1c2VySWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwdWJsaWNBUEkuZ2V0KHsgaWQ6IHVzZXJJZCB9LCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcblxuXG4iLCIvKipcbiAqXG4gKiAjIyBWYXJpYWJsZXMgQVBJIFNlcnZpY2VcbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIHRvIHJlYWQsIHdyaXRlLCBhbmQgc2VhcmNoIGZvciBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMuXG4gKlxuICogICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnXG4gKiAgICAgICAgICAgfVxuICogICAgICB9KTtcbiAqICAgICBybS5nZXRSdW4oKVxuICogICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gKiAgICAgICAgICB2YXIgdnMgPSBybS5ydW4udmFyaWFibGVzKCk7XG4gKiAgICAgICAgICB2cy5zYXZlKHtzYW1wbGVfaW50OiA0fSk7XG4gKiAgICAgICAgfSk7XG4gKlxuICovXG5cblxuICd1c2Ugc3RyaWN0JztcblxuIHZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbiB2YXIgcnV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3J1bi11dGlsJyk7XG5cbiBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHJ1bnMgb2JqZWN0IHRvIHdoaWNoIHRoZSB2YXJpYWJsZSBmaWx0ZXJzIGFwcGx5LiBEZWZhdWx0cyB0byBudWxsLlxuICAgICAgICAgKiBAdHlwZSB7cnVuU2VydmljZX1cbiAgICAgICAgICovXG4gICAgICAgICBydW5TZXJ2aWNlOiBudWxsXG4gICAgIH07XG4gICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgICB2YXIgZ2V0VVJMID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL1RPRE86IFJlcGxhY2Ugd2l0aCBnZXRDdXJyZW50Y29uZmlnIGluc3RlYWQ/XG4gICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnMucnVuU2VydmljZS51cmxDb25maWcuZ2V0RmlsdGVyVVJMKCkgKyAndmFyaWFibGVzLyc7XG4gICAgIH07XG5cbiAgICAgdmFyIGFkZEF1dG9SZXN0b3JlSGVhZGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihvcHRpb25zKTtcbiAgICAgfTtcblxuICAgICB2YXIgaHR0cE9wdGlvbnMgPSB7XG4gICAgICAgICB1cmw6IGdldFVSTFxuICAgICB9O1xuICAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgIH07XG4gICAgIH1cbiAgICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG4gICAgIGh0dHAuc3BsaXRHZXQgPSBydXRpbC5zcGxpdEdldEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB2YWx1ZXMgZm9yIGEgdmFyaWFibGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMubG9hZCgnc2FtcGxlX2ludCcpXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHZhbCl7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyB2YWwgY29udGFpbnMgdGhlIHZhbHVlIG9mIHNhbXBsZV9pbnRcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YXJpYWJsZSBOYW1lIG9mIHZhcmlhYmxlIHRvIGxvYWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgIGxvYWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgIGh0dHBPcHRpb25zID0gYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgJC5leHRlbmQoe30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgIHVybDogZ2V0VVJMKCkgKyB2YXJpYWJsZSArICcvJ1xuICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciB2YXJpYWJsZXMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXVlcnlgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5xdWVyeShbJ3ByaWNlJywgJ3NhbGVzJ10pXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gdmFsIGlzIGFuIG9iamVjdCB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIHJlcXVlc3RlZCB2YXJpYWJsZXM6IHZhbC5wcmljZSwgdmFsLnNhbGVzXG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KHsgaW5jbHVkZTpbJ3ByaWNlJywgJ3NhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBxdWVyeSBUaGUgbmFtZXMgb2YgdGhlIHZhcmlhYmxlcyByZXF1ZXN0ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAocXVlcnksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvL1F1ZXJ5IGFuZCBvdXRwdXRNb2RpZmllciBhcmUgYm90aCBxdWVyeXN0cmluZ3MgaW4gdGhlIHVybDsgb25seSBjYWxsaW5nIHRoZW0gb3V0IHNlcGFyYXRlbHkgaGVyZSB0byBiZSBjb25zaXN0ZW50IHdpdGggdGhlIG90aGVyIGNhbGxzXG4gICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgICBodHRwT3B0aW9ucyA9IGFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkocXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgIHF1ZXJ5ID0geyBpbmNsdWRlOiBxdWVyeSB9O1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAkLmV4dGVuZChxdWVyeSwgb3V0cHV0TW9kaWZpZXIpO1xuICAgICAgICAgICAgIHJldHVybiBodHRwLnNwbGl0R2V0KHF1ZXJ5LCBodHRwT3B0aW9ucyk7XG4gICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIHZhbHVlcyB0byBtb2RlbCB2YXJpYWJsZXMuIE92ZXJ3cml0ZXMgZXhpc3RpbmcgdmFsdWVzLiBOb3RlIHRoYXQgeW91IGNhbiBvbmx5IHVwZGF0ZSBtb2RlbCB2YXJpYWJsZXMgaWYgdGhlIHJ1biBpcyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KS4gKEFuIGFsdGVybmF0ZSB3YXkgdG8gdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpcyB0byBjYWxsIGEgbWV0aG9kIGZyb20gdGhlIG1vZGVsIGFuZCBtYWtlIHN1cmUgdGhhdCB0aGUgbWV0aG9kIHBlcnNpc3RzIHRoZSB2YXJpYWJsZXMuIFNlZSBgZG9gLCBgc2VyaWFsYCwgYW5kIGBwYXJhbGxlbGAgaW4gdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIGZvciBjYWxsaW5nIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwuKVxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnNhdmUoJ3ByaWNlJywgNCk7XG4gICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gdmFyaWFibGUgQW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBtb2RlbCB2YXJpYWJsZXMgYW5kIHRoZSB2YWx1ZXMgdG8gc2F2ZS4gQWx0ZXJuYXRpdmVseSwgYSBzdHJpbmcgd2l0aCB0aGUgbmFtZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgKE9wdGlvbmFsKSBJZiBwYXNzaW5nIGEgc3RyaW5nIGZvciBgdmFyaWFibGVgLCB1c2UgdGhpcyBhcmd1bWVudCBmb3IgdGhlIHZhbHVlIHRvIHNhdmUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgc2F2ZTogZnVuY3Rpb24gKHZhcmlhYmxlLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAoYXR0cnMgPSB7fSlbdmFyaWFibGVdID0gdmFsO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2guY2FsbCh0aGlzLCBhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdCBBdmFpbGFibGUgdW50aWwgdW5kZXJseWluZyBBUEkgc3VwcG9ydHMgUFVULiBPdGhlcndpc2Ugc2F2ZSB3b3VsZCBiZSBQVVQgYW5kIG1lcmdlIHdvdWxkIGJlIFBBVENIXG4gICAgICAgIC8vICpcbiAgICAgICAgLy8gICogU2F2ZSB2YWx1ZXMgdG8gdGhlIGFwaS4gTWVyZ2VzIGFycmF5cywgYnV0IG90aGVyd2lzZSBzYW1lIGFzIHNhdmVcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YXJpYWJsZSBPYmplY3Qgd2l0aCBhdHRyaWJ1dGVzLCBvciBzdHJpbmcga2V5XG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgT3B0aW9uYWwgaWYgcHJldiBwYXJhbWV0ZXIgd2FzIGEgc3RyaW5nLCBzZXQgdmFsdWUgaGVyZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgdnMubWVyZ2UoeyBwcmljZTogNCwgcXVhbnRpdHk6IDUsIHByb2R1Y3RzOiBbMiwzLDRdIH0pXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSgncHJpY2UnLCA0KTtcblxuICAgICAgICAvLyBtZXJnZTogZnVuY3Rpb24gKHZhcmlhYmxlLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gICAgIHZhciBhdHRycztcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2YgdmFyaWFibGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vICAgICAgIGF0dHJzID0gdmFyaWFibGU7XG4gICAgICAgIC8vICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAoYXR0cnMgPSB7fSlbdmFyaWFibGVdID0gdmFsO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyAgICAgcmV0dXJuIGh0dHAucGF0Y2guY2FsbCh0aGlzLCBhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICAvLyB9XG4gICAgIH07XG4gICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG4gfTtcbiIsIi8qKlxuICogIyMgV29ybGQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBBIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbCAtLSBpbmNsdWRpbmcgc2V0dGluZyB2YXJpYWJsZXMsIG1ha2luZyBkZWNpc2lvbnMsIGFuZCBjYWxsaW5nIG9wZXJhdGlvbnMuIEZvciBidWlsZGluZyBtdWx0aXBsYXllciBzaW11bGF0aW9ucyB5b3UgdHlwaWNhbGx5IHdhbnQgbXVsdGlwbGUgZW5kIHVzZXJzIHRvIHNoYXJlIHRoZSBzYW1lIHNldCBvZiBpbnRlcmFjdGlvbnMsIGFuZCB3b3JrIHdpdGhpbiBhIGNvbW1vbiBzdGF0ZS4gRXBpY2VudGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlIFwid29ybGRzXCIgdG8gaGFuZGxlIHN1Y2ggY2FzZXMuIE9ubHkgW3RlYW0gcHJvamVjdHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSBjYW4gYmUgbXVsdGlwbGF5ZXIuXG4gKlxuICogVGhlIFdvcmxkIEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCBtYW5pcHVsYXRlIG11bHRpcGxheWVyIHdvcmxkcyB3aXRoaW4geW91ciBFcGljZW50ZXIgcHJvamVjdC4gWW91IGNhbiB1c2UgdGhpcyB0byBhZGQgYW5kIHJlbW92ZSBlbmQgdXNlcnMgZnJvbSB0aGUgd29ybGQsIGFuZCB0byBjcmVhdGUsIGFjY2VzcywgYW5kIHJlbW92ZSB0aGVpciBydW5zLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuIChUaGUgcmVsYXRlZCBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlci8pIHByb3ZpZGVzIGFuIGVhc3kgd2F5IHRvIGFjY2VzcyBydW5zIGFuZCB3b3JsZHMgZm9yIHBhcnRpY3VsYXIgZW5kIHVzZXJzLCBzbyBpcyB0eXBpY2FsbHkgdXNlZCBpbiBwYWdlcyB0aGF0IGVuZCB1c2VycyB3aWxsIGludGVyYWN0IHdpdGguKVxuICpcbiAqIEFzIHdpdGggYWxsIHRoZSBvdGhlciBbQVBJIEFkYXB0ZXJzXSguLi8uLi8pLCBhbGwgbWV0aG9kcyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgV29ybGQgQVBJIFNlcnZpY2UgZGVmYXVsdHMuXG4gKlxuICogVG8gdXNlIHRoZSBXb3JsZCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpLCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKiksIGFuZCBncm91cCAoKipHcm91cCBOYW1lKiopLlxuICpcbiAqICAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICogICAgICAgd2EuY3JlYXRlKClcbiAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gKiAgICAgICAgICAgICAgLy8gY2FsbCBtZXRob2RzLCBlLmcuIHdhLmFkZFVzZXJzKClcbiAqICAgICAgICAgIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuLy8gdmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcblxudmFyIGFwaUJhc2UgPSAnbXVsdGlwbGF5ZXIvJztcbnZhciBhc3NpZ25tZW50RW5kcG9pbnQgPSBhcGlCYXNlICsgJ2Fzc2lnbic7XG52YXIgYXBpRW5kcG9pbnQgPSBhcGlCYXNlICsgJ3dvcmxkJztcbnZhciBwcm9qZWN0RW5kcG9pbnQgPSBhcGlCYXNlICsgJ3Byb2plY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBncm91cCBuYW1lLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBncm91cDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIHJ1bnMgaW4gdGhpcyB3b3JsZC4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbW9kZWw6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JpdGVyaWEgYnkgd2hpY2ggdG8gZmlsdGVyIHdvcmxkLiBDdXJyZW50bHkgb25seSBzdXBwb3J0cyB3b3JsZC1pZHMgYXMgZmlsdGVycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZpbHRlcjogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlbmllbmNlIGFsaWFzIGZvciBmaWx0ZXJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGlkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5LiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgc3VjY2VzczogJC5ub29wLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBmYWlscy4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yOiAkLm5vb3BcbiAgICB9O1xuXG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuaWQpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gc2VydmljZU9wdGlvbnMuaWQ7XG4gICAgfVxuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmFjY291bnQgPSB1cmxDb25maWcuYWNjb3VudFBhdGg7XG4gICAgfVxuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLnByb2plY3QgPSB1cmxDb25maWcucHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWQpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB3b3JsZCBpZCBzcGVjaWZpZWQgdG8gYXBwbHkgb3BlcmF0aW9ucyBhZ2FpbnN0LiBUaGlzIGNvdWxkIGhhcHBlbiBpZiB0aGUgdXNlciBpcyBub3QgYXNzaWduZWQgdG8gYSB3b3JsZCBhbmQgaXMgdHJ5aW5nIHRvIHdvcmsgd2l0aCBydW5zIGZyb20gdGhhdCB3b3JsZC4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVNb2RlbE9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5tb2RlbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtb2RlbCBzcGVjaWZpZWQgdG8gZ2V0IHRoZSBjdXJyZW50IHJ1bicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQ3JlYXRlcyBhIG5ldyBXb3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFVzaW5nIHRoaXMgbWV0aG9kIGlzIHJhcmUuIEl0IGlzIG1vcmUgY29tbW9uIHRvIGNyZWF0ZSB3b3JsZHMgYXV0b21hdGljYWxseSB3aGlsZSB5b3UgYGF1dG9Bc3NpZ24oKWAgZW5kIHVzZXJzIHRvIHdvcmxkcy4gKEluIHRoaXMgY2FzZSwgY29uZmlndXJhdGlvbiBkYXRhIGZvciB0aGUgd29ybGQsIHN1Y2ggYXMgdGhlIHJvbGVzLCBhcmUgcmVhZCBmcm9tIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24sIGZvciBleGFtcGxlIGJ5IGBnZXRQcm9qZWN0U2V0dGluZ3MoKWAuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKHtcbiAgICAgICAgKiAgICAgICAgICAgcm9sZXM6IFsnVlAgTWFya2V0aW5nJywgJ1ZQIFNhbGVzJywgJ1ZQIEVuZ2luZWVyaW5nJ11cbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyB0byBjcmVhdGUgdGhlIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZ3JvdXAgKE9wdGlvbmFsKSBUaGUgKipHcm91cCBOYW1lKiogdG8gY3JlYXRlIHRoaXMgd29ybGQgdW5kZXIuIE9ubHkgZW5kIHVzZXJzIGluIHRoaXMgZ3JvdXAgYXJlIGVsaWdpYmxlIHRvIGpvaW4gdGhlIHdvcmxkLiBPcHRpb25hbCBoZXJlOyByZXF1aXJlZCB3aGVuIGluc3RhbnRpYXRpbmcgdGhlIHNlcnZpY2UgKGBuZXcgRi5zZXJ2aWNlLldvcmxkKClgKS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zLnJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptdXN0KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgcm9sZXMgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zLm9wdGlvbmFsUm9sZXMgKE9wdGlvbmFsKSBUaGUgbGlzdCBvZiBvcHRpb25hbCByb2xlcyAoc3RyaW5ncykgZm9yIHRoaXMgd29ybGQuIFNvbWUgd29ybGRzIGhhdmUgc3BlY2lmaWMgcm9sZXMgdGhhdCAqKm1heSoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIG9wdGlvbmFsIHJvbGVzIGFzIHBhcnQgb2YgdGhlIHdvcmxkIG9iamVjdCBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gdXNlcnMgdG8gd29ybGRzIGFuZCBlbnN1cmUgdGhhdCBhbGwgcm9sZXMgYXJlIGZpbGxlZCBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gcGFyYW1zLm1pblVzZXJzIChPcHRpb25hbCkgVGhlIG1pbmltdW0gbnVtYmVyIG9mIHVzZXJzIGZvciB0aGUgd29ybGQuIEluY2x1ZGluZyB0aGlzIG51bWJlciBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gZW5kIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGNvcnJlY3QgbnVtYmVyIG9mIHVzZXJzIGFyZSBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9KTtcbiAgICAgICAgICAgIHZhciB3b3JsZEFwaVBhcmFtcyA9IFsnc2NvcGUnLCAnZmlsZXMnLCAncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycycsICdncm91cCcsICduYW1lJ107XG4gICAgICAgICAgICB2YXIgdmFsaWRQYXJhbXMgPSBfcGljayhzZXJ2aWNlT3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSk7XG4gICAgICAgICAgICAvLyB3aGl0ZWxpc3QgdGhlIGZpZWxkcyB0aGF0IHdlIGFjdHVhbGx5IGNhbiBzZW5kIHRvIHRoZSBhcGlcbiAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcywgd29ybGRBcGlQYXJhbXMpO1xuXG4gICAgICAgICAgICAvLyBhY2NvdW50IGFuZCBwcm9qZWN0IGdvIGluIHRoZSBib2R5LCBub3QgaW4gdGhlIHVybFxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQoe30sIHZhbGlkUGFyYW1zLCBwYXJhbXMpO1xuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgYSBXb3JsZCwgZm9yIGV4YW1wbGUgdG8gcmVwbGFjZSB0aGUgcm9sZXMgaW4gdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCB5b3UgY29tcGxldGUgd29ybGQgY29uZmlndXJhdGlvbiBhdCB0aGUgcHJvamVjdCBsZXZlbCwgcmF0aGVyIHRoYW4gYXQgdGhlIHdvcmxkIGxldmVsLiBGb3IgZXhhbXBsZSwgZWFjaCB3b3JsZCBpbiB5b3VyIHByb2plY3QgcHJvYmFibHkgaGFzIHRoZSBzYW1lIHJvbGVzIGZvciBlbmQgdXNlcnMuIEFuZCB5b3VyIHByb2plY3QgaXMgcHJvYmFibHkgZWl0aGVyIGNvbmZpZ3VyZWQgc28gdGhhdCBhbGwgZW5kIHVzZXJzIHNoYXJlIHRoZSBzYW1lIHdvcmxkIChhbmQgcnVuKSwgb3Igc21hbGxlciBzZXRzIG9mIGVuZCB1c2VycyBzaGFyZSB3b3JsZHMg4oCUIGJ1dCBub3QgYm90aC4gSG93ZXZlciwgdGhpcyBtZXRob2QgaXMgYXZhaWxhYmxlIGlmIHlvdSBuZWVkIHRvIHVwZGF0ZSB0aGUgY29uZmlndXJhdGlvbiBvZiBhIHBhcnRpY3VsYXIgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EudXBkYXRlKHsgcm9sZXM6IFsnVlAgTWFya2V0aW5nJywgJ1ZQIFNhbGVzJywgJ1ZQIEVuZ2luZWVyaW5nJ10gfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBQYXJhbWV0ZXJzIHRvIHVwZGF0ZSB0aGUgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5uYW1lIEEgc3RyaW5nIGlkZW50aWZpZXIgZm9yIHRoZSBsaW5rZWQgZW5kIHVzZXJzLCBmb3IgZXhhbXBsZSwgXCJuYW1lXCI6IFwiT3VyIFRlYW1cIi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zLnJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptdXN0KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgcm9sZXMgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zLm9wdGlvbmFsUm9sZXMgKE9wdGlvbmFsKSBUaGUgbGlzdCBvZiBvcHRpb25hbCByb2xlcyAoc3RyaW5ncykgZm9yIHRoaXMgd29ybGQuIFNvbWUgd29ybGRzIGhhdmUgc3BlY2lmaWMgcm9sZXMgdGhhdCAqKm1heSoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIG9wdGlvbmFsIHJvbGVzIGFzIHBhcnQgb2YgdGhlIHdvcmxkIG9iamVjdCBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gdXNlcnMgdG8gd29ybGRzIGFuZCBlbnN1cmUgdGhhdCBhbGwgcm9sZXMgYXJlIGZpbGxlZCBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gcGFyYW1zLm1pblVzZXJzIChPcHRpb25hbCkgVGhlIG1pbmltdW0gbnVtYmVyIG9mIHVzZXJzIGZvciB0aGUgd29ybGQuIEluY2x1ZGluZyB0aGlzIG51bWJlciBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gZW5kIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGNvcnJlY3QgbnVtYmVyIG9mIHVzZXJzIGFyZSBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgd2hpdGVsaXN0ID0gWydyb2xlcycsICdvcHRpb25hbFJvbGVzJywgJ21pblVzZXJzJ107XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMgfHwge30sIHdoaXRlbGlzdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKHBhcmFtcywgdXBkYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyBhbiBleGlzdGluZyB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFRoaXMgZnVuY3Rpb24gb3B0aW9uYWxseSB0YWtlcyBvbmUgYXJndW1lbnQuIElmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgaXQgaXMgdGhlIGlkIG9mIHRoZSB3b3JsZCB0byBkZWxldGUuIElmIHRoZSBhcmd1bWVudCBpcyBhbiBvYmplY3QsIGl0IGlzIHRoZSBvdmVycmlkZSBmb3IgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuZGVsZXRlKCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgVGhlIGlkIG9mIHRoZSB3b3JsZCB0byBkZWxldGUsIG9yIG9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSAob3B0aW9ucyAmJiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSkgPyB7IGZpbHRlcjogb3B0aW9ucyB9IDoge307XG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRlbGV0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGRlbGV0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBXb3JsZCBBUEkgQWRhcHRlciAoaW5jbHVkaW5nIGFsbCBzdWJzZXF1ZW50IGZ1bmN0aW9uIGNhbGxzLCB1bnRpbCB0aGUgY29uZmlndXJhdGlvbiBpcyB1cGRhdGVkIGFnYWluKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoey4uLn0pLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogJzEyMycgfSkuYWRkVXNlcih7IHVzZXJJZDogJzEyMycgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgVGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHRvIHVzZSBpbiB1cGRhdGluZyBleGlzdGluZyBjb25maWd1cmF0aW9uLlxuICAgICAgICAqIEByZXR1cm4ge09iamVjdH0gcmVmZXJlbmNlIHRvIGN1cnJlbnQgaW5zdGFuY2VcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucywgY29uZmlnKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogTGlzdHMgYWxsIHdvcmxkcyBmb3IgYSBnaXZlbiBhY2NvdW50LCBwcm9qZWN0LCBhbmQgZ3JvdXAuIEFsbCB0aHJlZSBhcmUgcmVxdWlyZWQsIGFuZCBpZiBub3Qgc3BlY2lmaWVkIGFzIHBhcmFtZXRlcnMsIGFyZSByZWFkIGZyb20gdGhlIHNlcnZpY2UuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgLy8gbGlzdHMgYWxsIHdvcmxkcyBpbiBncm91cCBcInRlYW0xXCJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmxpc3QoKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgICAgICAgLy8gbGlzdHMgYWxsIHdvcmxkcyBpbiBncm91cCBcIm90aGVyLWdyb3VwLW5hbWVcIlxuICAgICAgICAqICAgICAgICAgICAgICAgd2EubGlzdCh7IGdyb3VwOiAnb3RoZXItZ3JvdXAtbmFtZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBsaXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIGFsbCB3b3JsZHMgdGhhdCBhbiBlbmQgdXNlciBiZWxvbmdzIHRvIGZvciBhIGdpdmVuIGFjY291bnQgKHRlYW0pLCBwcm9qZWN0LCBhbmQgZ3JvdXAuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuZ2V0V29ybGRzRm9yVXNlcignYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJylcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGRzIGFyZSBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRXb3JsZHNGb3JVc2VyOiBmdW5jdGlvbiAodXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSAkLmV4dGVuZChcbiAgICAgICAgICAgICAgICBfcGljayhnZXRPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddKSxcbiAgICAgICAgICAgICAgICB7IHVzZXJJZDogdXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9hZCBpbmZvcm1hdGlvbiBmb3IgYSBzcGVjaWZpYyB3b3JsZC4gQWxsIGZ1cnRoZXIgY2FsbHMgdG8gdGhlIHdvcmxkIHNlcnZpY2Ugd2lsbCB1c2UgdGhlIGlkIHByb3ZpZGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gd29ybGRJZCBUaGUgaWQgb2YgdGhlIHdvcmxkIHRvIGxvYWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAod29ybGRJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHdvcmxkSWQpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSB3b3JsZElkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGEgd29ybGRpZCB0byBsb2FkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnLycgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBZGRzIGFuIGVuZCB1c2VyIG9yIGxpc3Qgb2YgZW5kIHVzZXJzIHRvIGEgZ2l2ZW4gd29ybGQuIFRoZSBlbmQgdXNlciBtdXN0IGJlIGEgbWVtYmVyIG9mIHRoZSBgZ3JvdXBgIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgLy8gYWRkIG9uZSB1c2VyXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJyk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycyhbJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMyddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKHsgdXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgcm9sZTogJ1ZQIFNhbGVzJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgICAgICAgLy8gYWRkIHNldmVyYWwgdXNlcnNcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IHVzZXJJZDogJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICByb2xlOiAnVlAgTWFya2V0aW5nJyB9LFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgIHsgdXNlcklkOiAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgIHJvbGU6ICdWUCBFbmdpbmVlcmluZycgfVxuICAgICAgICAqICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBvbmUgdXNlciB0byBhIHNwZWNpZmljIHdvcmxkXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgd29ybGQuaWQpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHsgZmlsdGVyOiB3b3JsZC5pZCB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fGFycmF5fSB1c2VycyBVc2VyIGlkLCBhcnJheSBvZiB1c2VyIGlkcywgb2JqZWN0LCBvciBhcnJheSBvZiBvYmplY3RzIG9mIHRoZSB1c2VycyB0byBhZGQgdG8gdGhpcyB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcnMucm9sZSBUaGUgYHJvbGVgIHRoZSB1c2VyIHNob3VsZCBoYXZlIGluIHRoZSB3b3JsZC4gSXQgaXMgdXAgdG8gdGhlIGNhbGxlciB0byBlbnN1cmUsIGlmIG5lZWRlZCwgdGhhdCB0aGUgYHJvbGVgIHBhc3NlZCBpbiBpcyBvbmUgb2YgdGhlIGByb2xlc2Agb3IgYG9wdGlvbmFsUm9sZXNgIG9mIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgVGhlIHdvcmxkIHRvIHdoaWNoIHRoZSB1c2VycyBzaG91bGQgYmUgYWRkZWQuIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBmaWx0ZXIgcGFyYW1ldGVyIG9mIHRoZSBgb3B0aW9uc2Agb2JqZWN0IGlzIHVzZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBhZGRVc2VyczogZnVuY3Rpb24gKHVzZXJzLCB3b3JsZElkLCBvcHRpb25zKSB7XG5cbiAgICAgICAgICAgIGlmICghdXNlcnMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGEgbGlzdCBvZiB1c2VycyB0byBhZGQgdG8gdGhlIHdvcmxkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSB0aGUgbGlzdCBvZiB1c2VycyB0byBhbiBhcnJheSBvZiB1c2VyIG9iamVjdHNcbiAgICAgICAgICAgIHVzZXJzID0gJC5tYXAoW10uY29uY2F0KHVzZXJzKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNPYmplY3QgPSAkLmlzUGxhaW5PYmplY3QodSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHUgIT09ICdzdHJpbmcnICYmICFpc09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbWUgb2YgdGhlIHVzZXJzIGluIHRoZSBsaXN0IGFyZSBub3QgaW4gdGhlIHZhbGlkIGZvcm1hdDogJyArIHUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpc09iamVjdCA/IHUgOiB7IHVzZXJJZDogdSB9O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIG9wdGlvbnMgd2VyZSBwYXNzZWQgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qod29ybGRJZCkgJiYgIW9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gd29ybGRJZDtcbiAgICAgICAgICAgICAgICB3b3JsZElkID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIC8vIHdlIG11c3QgaGF2ZSBvcHRpb25zIGJ5IG5vd1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3b3JsZElkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciB1cGRhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy91c2VycycgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdCh1c2VycywgdXBkYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVXBkYXRlcyB0aGUgcm9sZSBvZiBhbiBlbmQgdXNlciBpbiBhIGdpdmVuIHdvcmxkLiAoWW91IGNhbiBvbmx5IHVwZGF0ZSBvbmUgZW5kIHVzZXIgYXQgYSB0aW1lLilcbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKS50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnKTtcbiAgICAgICAgKiAgICAgICAgICAgd2EudXBkYXRlVXNlcih7IHVzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHJvbGU6ICdsZWFkZXInIH0pO1xuICAgICAgICAqICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB1c2VyIFVzZXIgb2JqZWN0IHdpdGggYHVzZXJJZGAgYW5kIHRoZSBuZXcgYHJvbGVgLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlVXNlcjogZnVuY3Rpb24gKHVzZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAoIXVzZXIgfHwgIXVzZXIudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byBwYXNzIGEgdXNlcklkIHRvIHVwZGF0ZSBmcm9tIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHBhdGNoT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMvJyArIHVzZXIudXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKF9waWNrKHVzZXIsICdyb2xlJyksIHBhdGNoT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmVtb3ZlcyBhbiBlbmQgdXNlciBmcm9tIGEgZ2l2ZW4gd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoWydhNmZlMGMxZS1mNGI4LTRmMDEtOWY1Zi0wMWNjZjRjMmVkNDQnLCAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJ10pO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcignYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0Jyk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5yZW1vdmVVc2VyKHsgdXNlcklkOiAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R8c3RyaW5nfSB1c2VyIFRoZSBgdXNlcklkYCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgd29ybGQsIG9yIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBgdXNlcklkYCBmaWVsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHJlbW92ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB1c2VyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHVzZXIgPSB7IHVzZXJJZDogdXNlciB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXVzZXIudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byBwYXNzIGEgdXNlcklkIHRvIHJlbW92ZSBmcm9tIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUobnVsbCwgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgcnVuIGlkIG9mIGN1cnJlbnQgcnVuIGZvciB0aGUgZ2l2ZW4gd29ybGQuIElmIHRoZSB3b3JsZCBkb2VzIG5vdCBoYXZlIGEgcnVuLCBjcmVhdGVzIGEgbmV3IG9uZSBhbmQgcmV0dXJucyB0aGUgcnVuIGlkLlxuICAgICAgICAqXG4gICAgICAgICogUmVtZW1iZXIgdGhhdCBhIFtydW5dKC4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gSW4gdGhlIGNhc2Ugb2YgbXVsdGlwbGF5ZXIgcHJvamVjdHMsIHRoZSBydW4gaXMgc2hhcmVkIGJ5IGFsbCBlbmQgdXNlcnMgaW4gdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiAnbW9kZWwucHknIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqIFBhcmFtZXRlcnMgKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLm1vZGVsIFRoZSBtb2RlbCBmaWxlIHRvIHVzZSB0byBjcmVhdGUgYSBydW4gaWYgbmVlZGVkLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW5JZDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3J1bicgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFsaWRhdGVNb2RlbE9yVGhyb3dFcnJvcihnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoX3BpY2soZ2V0T3B0aW9ucywgJ21vZGVsJyksIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIGN1cnJlbnQgKG1vc3QgcmVjZW50KSB3b3JsZCBmb3IgdGhlIGdpdmVuIGVuZCB1c2VyIGluIHRoZSBnaXZlbiBncm91cC4gQnJpbmdzIHRoaXMgbW9zdCByZWNlbnQgd29ybGQgaW50byBtZW1vcnkgaWYgbmVlZGVkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcignOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJylcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIHVzZSBkYXRhIGZyb20gd29ybGRcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgd2hvc2UgY3VycmVudCAobW9zdCByZWNlbnQpIHdvcmxkIGlzIGJlaW5nIHJldHJpZXZlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIGdyb3VwLiBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIHRoZSBncm91cCB1c2VkIHRvIGNyZWF0ZSB0aGUgc2VydmljZS5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50V29ybGRGb3JVc2VyOiBmdW5jdGlvbiAodXNlcklkLCBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5nZXRXb3JsZHNGb3JVc2VyKHVzZXJJZCwgeyBncm91cDogZ3JvdXBOYW1lIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgdGhlIG1vc3QgcmVjZW50IHdvcmxkIGFzIHRoZSAnYWN0aXZlJyB3b3JsZFxuICAgICAgICAgICAgICAgICAgICB3b3JsZHMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbmV3IERhdGUoYi5sYXN0TW9kaWZpZWQpIC0gbmV3IERhdGUoYS5sYXN0TW9kaWZpZWQpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXb3JsZCA9IHdvcmxkc1swXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBjdXJyZW50V29ybGQuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZVdpdGgobWUsIFtjdXJyZW50V29ybGRdKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBEZWxldGVzIHRoZSBjdXJyZW50IHJ1biBmcm9tIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIChOb3RlIHRoYXQgdGhlIHdvcmxkIGlkIHJlbWFpbnMgcGFydCBvZiB0aGUgcnVuIHJlY29yZCwgaW5kaWNhdGluZyB0aGF0IHRoZSBydW4gd2FzIGZvcm1lcmx5IGFuIGFjdGl2ZSBydW4gZm9yIHRoZSB3b3JsZC4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHdhLmRlbGV0ZVJ1bignc2FtcGxlLXdvcmxkLWlkJyk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gd29ybGRJZCBUaGUgYHdvcmxkSWRgIG9mIHRoZSB3b3JsZCBmcm9tIHdoaWNoIHRoZSBjdXJyZW50IHJ1biBpcyBiZWluZyBkZWxldGVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZGVsZXRlUnVuOiBmdW5jdGlvbiAod29ybGRJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWx0ZXIgPSB3b3JsZElkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRlbGV0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3J1bicgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGRlbGV0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBuZXcgcnVuIGZvciB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIHdhLm5ld1J1bkZvcldvcmxkKHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gd29ybGRJZCB3b3JsZElkIGluIHdoaWNoIHdlIGNyZWF0ZSB0aGUgbmV3IHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLm1vZGVsIFRoZSBtb2RlbCBmaWxlIHRvIHVzZSB0byBjcmVhdGUgYSBydW4gaWYgbmVlZGVkLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIG5ld1J1bkZvcldvcmxkOiBmdW5jdGlvbiAod29ybGRJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRSdW5PcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IGZpbHRlcjogd29ybGRJZCB8fCBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IoY3VycmVudFJ1bk9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGVSdW4od29ybGRJZCwgb3B0aW9ucylcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5nZXRDdXJyZW50UnVuSWQoY3VycmVudFJ1bk9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEFzc2lnbnMgZW5kIHVzZXJzIHRvIHdvcmxkcywgY3JlYXRpbmcgbmV3IHdvcmxkcyBhcyBhcHByb3ByaWF0ZSwgYXV0b21hdGljYWxseS4gQXNzaWducyBhbGwgZW5kIHVzZXJzIGluIHRoZSBncm91cCwgYW5kIGNyZWF0ZXMgbmV3IHdvcmxkcyBhcyBuZWVkZWQgYmFzZWQgb24gdGhlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbiAocm9sZXMsIG9wdGlvbmFsIHJvbGVzLCBhbmQgbWluaW11bSBlbmQgdXNlcnMgcGVyIHdvcmxkKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5hdXRvQXNzaWduKCk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9wdGlvbnMubWF4VXNlcnMgU2V0cyB0aGUgbWF4aW11bSBudW1iZXIgb2YgdXNlcnMgaW4gYSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBvcHRpb25zLnVzZXJJZHMgQSBsaXN0IG9mIHVzZXJzIHRvIGJlIGFzc2lnbmVkIGJlIGFzc2lnbmVkIGluc3RlYWQgb2YgYWxsIGVuZCB1c2VycyBpbiB0aGUgZ3JvdXAuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBhdXRvQXNzaWduOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBvcHQgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhc3NpZ25tZW50RW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudDogb3B0LmFjY291bnQsXG4gICAgICAgICAgICAgICAgcHJvamVjdDogb3B0LnByb2plY3QsXG4gICAgICAgICAgICAgICAgZ3JvdXA6IG9wdC5ncm91cFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKG9wdC5tYXhVc2Vycykge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5tYXhVc2VycyA9IG9wdC5tYXhVc2VycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdC51c2VySWRzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnVzZXJJZHMgPSBvcHQudXNlcklkcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIG9wdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgcHJvamVjdCdzIHdvcmxkIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICpcbiAgICAgICAgKiBUeXBpY2FsbHksIGV2ZXJ5IGludGVyYWN0aW9uIHdpdGggeW91ciBwcm9qZWN0IHVzZXMgdGhlIHNhbWUgY29uZmlndXJhdGlvbiBvZiBlYWNoIHdvcmxkLiBGb3IgZXhhbXBsZSwgZWFjaCB3b3JsZCBpbiB5b3VyIHByb2plY3QgcHJvYmFibHkgaGFzIHRoZSBzYW1lIHJvbGVzIGZvciBlbmQgdXNlcnMuIEFuZCB5b3VyIHByb2plY3QgaXMgcHJvYmFibHkgZWl0aGVyIGNvbmZpZ3VyZWQgc28gdGhhdCBhbGwgZW5kIHVzZXJzIHNoYXJlIHRoZSBzYW1lIHdvcmxkIChhbmQgcnVuKSwgb3Igc21hbGxlciBzZXRzIG9mIGVuZCB1c2VycyBzaGFyZSB3b3JsZHMg4oCUIGJ1dCBub3QgYm90aC5cbiAgICAgICAgKlxuICAgICAgICAqIChUaGUgW011bHRpcGxheWVyIFByb2plY3QgUkVTVCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9tdWx0aXBsYXllcl9wcm9qZWN0LykgYWxsb3dzIHlvdSB0byBzZXQgdGhlc2UgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9ucy4gVGhlIFdvcmxkIEFkYXB0ZXIgc2ltcGx5IHJldHJpZXZlcyB0aGVtLCBmb3IgZXhhbXBsZSBzbyB0aGV5IGNhbiBiZSB1c2VkIGluIGF1dG8tYXNzaWdubWVudCBvZiBlbmQgdXNlcnMgdG8gd29ybGRzLilcbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRQcm9qZWN0U2V0dGluZ3MoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihzZXR0aW5ncykge1xuICAgICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2V0dGluZ3Mucm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2V0dGluZ3Mub3B0aW9uYWxSb2xlcyk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldFByb2plY3RTZXR0aW5nczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgocHJvamVjdEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBvcHQudXJsICs9IFtvcHQuYWNjb3VudCwgb3B0LnByb2plY3RdLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChudWxsLCBvcHQpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqIEBjbGFzcyBDb29raWUgU3RvcmFnZSBTZXJ2aWNlXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAgdmFyIHBlb3BsZSA9IHJlcXVpcmUoJ2Nvb2tpZS1zdG9yZScpKHsgcm9vdDogJ3Blb3BsZScgfSk7XG4gICAgICAgIHBlb3BsZVxuICAgICAgICAgICAgLnNhdmUoe2xhc3ROYW1lOiAnc21pdGgnIH0pXG5cbiAqL1xuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gVGhpbiBkb2N1bWVudC5jb29raWUgd3JhcHBlciB0byBhbGxvdyB1bml0IHRlc3RpbmdcbnZhciBDb29raWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jb29raWU7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKG5ld0Nvb2tpZSkge1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuZXdDb29raWU7XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIHZhciB2YWxpZEhvc3QgPSBob3N0LnNwbGl0KCcuJykubGVuZ3RoID4gMTtcbiAgICB2YXIgZG9tYWluID0gdmFsaWRIb3N0ID8gJy4nICsgaG9zdCA6IG51bGw7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgZG9tYWluOiBkb21haW4sXG4gICAgICAgIGNvb2tpZTogbmV3IENvb2tpZSgpXG4gICAgfTtcbiAgICB0aGlzLnNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLy8gKiBUQkRcbiAgICAgICAgLy8gICogUXVlcnkgY29sbGVjdGlvbjsgdXNlcyBNb25nb0RCIHN5bnRheFxuICAgICAgICAvLyAgKiBAc2VlICA8VEJEOiBEYXRhIEFQSSBVUkw+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBwYXJhbSB7IHN0cmluZ30gcXMgUXVlcnkgRmlsdGVyXG4gICAgICAgIC8vICAqIEBwYXJhbSB7IHN0cmluZ30gbGltaXRlcnMgQHNlZSA8VEJEOiB1cmwgZm9yIGxpbWl0cywgcGFnaW5nIGV0Yz5cbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQGV4YW1wbGVcbiAgICAgICAgLy8gICogICAgIGNzLnF1ZXJ5KFxuICAgICAgICAvLyAgKiAgICAgIHsgbmFtZTogJ0pvaG4nLCBjbGFzc05hbWU6ICdDU0MxMDEnIH0sXG4gICAgICAgIC8vICAqICAgICAge2xpbWl0OiAxMH1cbiAgICAgICAgLy8gICogICAgIClcblxuICAgICAgICAvLyBxdWVyeTogZnVuY3Rpb24gKHFzLCBsaW1pdGVycykge1xuXG4gICAgICAgIC8vIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgY29va2llIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSB2YWx1ZSAoT3B0aW9uYWwpXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3Igc2VydmljZSBvcHRpb25zXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSBzYXZlZCB2YWx1ZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3Muc2V0KCdwZXJzb24nLCB7IGZpcnN0TmFtZTogJ2pvaG4nLCBsYXN0TmFtZTogJ3NtaXRoJyB9KTtcbiAgICAgICAgICogICAgIGNzLnNldCh7IG5hbWU6J3NtaXRoJywgYWdlOiczMicgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLnNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHNldE9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXRPcHRpb25zLnJvb3Q7XG4gICAgICAgICAgICB2YXIgY29va2llID0gc2V0T3B0aW9ucy5jb29raWU7XG5cbiAgICAgICAgICAgIGNvb2tpZS5zZXQoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgY29va2llIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIHN0b3JlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MuZ2V0KCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHRoaXMuc2VydmljZU9wdGlvbnMuY29va2llO1xuICAgICAgICAgICAgdmFyIGNvb2tpZVJlZyA9IG5ldyBSZWdFeHAoJyg/Ol58OylcXFxccyonICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkucmVwbGFjZSgvW1xcLVxcLlxcK1xcKl0vZywgJ1xcXFwkJicpICsgJ1xcXFxzKlxcXFw9XFxcXHMqKFteO10qKS4qJCcpO1xuICAgICAgICAgICAgdmFyIHJlcyA9IGNvb2tpZVJlZy5leGVjKGNvb2tpZS5nZXQoKSk7XG4gICAgICAgICAgICB2YXIgdmFsID0gcmVzID8gZGVjb2RlVVJJQ29tcG9uZW50KHJlc1sxXSkgOiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBrZXkgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30ga2V5IGtleSB0byByZW1vdmVcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvdmVycmlkZXMgZm9yIHNlcnZpY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSBrZXkgVGhlIGtleSByZW1vdmVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5yZW1vdmUoJ3BlcnNvbicpO1xuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVtT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLnNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHJlbU9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSByZW1PcHRpb25zLnJvb3Q7XG4gICAgICAgICAgICB2YXIgY29va2llID0gcmVtT3B0aW9ucy5jb29raWU7XG5cbiAgICAgICAgICAgIGNvb2tpZS5zZXQoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc9OyBleHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aCA/ICc7IHBhdGg9JyArIHBhdGggOiAnJylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAgKiBAcmV0dXJuIHsgYXJyYXl9IGtleXMgQWxsIHRoZSBrZXlzIHJlbW92ZWRcbiAgICAgICAgICovXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb29raWUgPSB0aGlzLnNlcnZpY2VPcHRpb25zLmNvb2tpZTtcbiAgICAgICAgICAgIHZhciBhS2V5cyA9IGNvb2tpZS5nZXQoKS5yZXBsYWNlKC8oKD86XnxcXHMqOylbXlxcPV0rKSg/PTt8JCl8Xlxccyp8XFxzKig/OlxcPVteO10qKT8oPzpcXDF8JCkvZywgJycpLnNwbGl0KC9cXHMqKD86XFw9W147XSopPztcXHMqLyk7XG4gICAgICAgICAgICBmb3IgKHZhciBuSWR4ID0gMDsgbklkeCA8IGFLZXlzLmxlbmd0aDsgbklkeCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb2tpZUtleSA9IGRlY29kZVVSSUNvbXBvbmVudChhS2V5c1tuSWR4XSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoY29va2llS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhS2V5cztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi4vbWFuYWdlcnMva2V5LW5hbWVzJyk7XG52YXIgU3RvcmFnZUZhY3RvcnkgPSByZXF1aXJlKCcuL3N0b3JlLWZhY3RvcnknKTtcbnZhciBvcHRpb25VdGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvb3B0aW9uLXV0aWxzJyk7XG5cbnZhciBFUElfU0VTU0lPTl9LRVkgPSBrZXlOYW1lcy5FUElfU0VTU0lPTl9LRVk7XG52YXIgRVBJX01BTkFHRVJfS0VZID0gJ2VwaWNlbnRlci50b2tlbic7IC8vY2FuJ3QgYmUgdW5kZXIga2V5LW5hbWVzLCBvciBsb2dvdXQgd2lsbCBjbGVhciB0aGlzIHRvb1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogV2hlcmUgdG8gc3RvcmUgdXNlciBhY2Nlc3MgdG9rZW5zIGZvciB0ZW1wb3JhcnkgYWNjZXNzLiBEZWZhdWx0cyB0byBzdG9yaW5nIGluIGEgY29va2llIGluIHRoZSBicm93c2VyLlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RvcmU6IHsgc3luY2hyb25vdXM6IHRydWUgfVxufTtcblxudmFyIFNlc3Npb25NYW5hZ2VyID0gZnVuY3Rpb24gKG1hbmFnZXJPcHRpb25zKSB7XG4gICAgbWFuYWdlck9wdGlvbnMgPSBtYW5hZ2VyT3B0aW9ucyB8fCB7fTtcbiAgICBmdW5jdGlvbiBnZXRCYXNlT3B0aW9ucyhvdmVycmlkZXMpIHtcbiAgICAgICAgb3ZlcnJpZGVzID0gb3ZlcnJpZGVzIHx8IHt9O1xuICAgICAgICB2YXIgbGliT3B0aW9ucyA9IG9wdGlvblV0aWxzLmdldE9wdGlvbnMoKTtcbiAgICAgICAgdmFyIGZpbmFsT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgbGliT3B0aW9ucywgbWFuYWdlck9wdGlvbnMsIG92ZXJyaWRlcyk7XG4gICAgICAgIHJldHVybiBmaW5hbE9wdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U3RvcmUob3ZlcnJpZGVzKSB7XG4gICAgICAgIHZhciBiYXNlT3B0aW9ucyA9IGdldEJhc2VPcHRpb25zKG92ZXJyaWRlcyk7XG4gICAgICAgIHZhciBzdG9yZU9wdHMgPSBiYXNlT3B0aW9ucy5zdG9yZSB8fCB7fTtcbiAgICAgICAgdmFyIGlzRXBpY2VudGVyRG9tYWluID0gIWJhc2VPcHRpb25zLmlzTG9jYWwgJiYgIWJhc2VPcHRpb25zLmlzQ3VzdG9tRG9tYWluO1xuICAgICAgICBpZiAoc3RvcmVPcHRzLnJvb3QgPT09IHVuZGVmaW5lZCAmJiBiYXNlT3B0aW9ucy5hY2NvdW50ICYmIGJhc2VPcHRpb25zLnByb2plY3QgJiYgaXNFcGljZW50ZXJEb21haW4pIHtcbiAgICAgICAgICAgIHN0b3JlT3B0cy5yb290ID0gJy9hcHAvJyArIGJhc2VPcHRpb25zLmFjY291bnQgKyAnLycgKyBiYXNlT3B0aW9ucy5wcm9qZWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgU3RvcmFnZUZhY3Rvcnkoc3RvcmVPcHRzKTtcbiAgICB9XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICBzYXZlU2Vzc2lvbjogZnVuY3Rpb24gKHVzZXJJbmZvLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZCA9IEpTT04uc3RyaW5naWZ5KHVzZXJJbmZvKTtcbiAgICAgICAgICAgIGdldFN0b3JlKG9wdGlvbnMpLnNldChFUElfU0VTU0lPTl9LRVksIHNlcmlhbGl6ZWQpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRTZXNzaW9uOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHN0b3JlID0gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gc3RvcmUuc2VydmljZU9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZCA9IHN0b3JlLmdldChFUElfU0VTU0lPTl9LRVkpIHx8ICd7fSc7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGNvbnRhaW5zIHRoZSBwcm9qZWN0IGFuZCBhY2NvdW50XG4gICAgICAgICAgICAvLyB2YWxpZGF0ZSB0aGUgYWNjb3VudCBhbmQgcHJvamVjdCBpbiB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgLy8gYW5kIG92ZXJyaWRlIHByb2plY3QsIGdyb3VwTmFtZSwgZ3JvdXBJZCBhbmQgaXNGYWNcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSAoaS5lLiBsb2NhbGhvc3QpIHVzZSB0aGUgc2F2ZWQgc2Vzc2lvbiB2YWx1ZXNcbiAgICAgICAgICAgIHZhciBhY2NvdW50ID0gZmluYWxPcHRzLmFjY291bnQ7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGZpbmFsT3B0cy5wcm9qZWN0O1xuICAgICAgICAgICAgaWYgKGFjY291bnQgJiYgc2Vzc2lvbi5hY2NvdW50ICE9PSBhY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSB0b2tlbiB3YXMgbm90IHVzZWQgdG8gbG9naW4gdG8gdGhlIHNhbWUgYWNjb3VudFxuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLmdyb3VwcyAmJiBhY2NvdW50ICYmIHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBzZXNzaW9uLmdyb3Vwc1twcm9qZWN0XSB8fCB7IGdyb3VwSWQ6ICcnLCBncm91cE5hbWU6ICcnLCBpc0ZhYzogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXNzaW9uLCB7IHByb2plY3Q6IHByb2plY3QgfSwgZ3JvdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZVNlc3Npb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBnZXRTdG9yZShvcHRpb25zKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleU5hbWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb29raWVLZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29va2llTmFtZSA9IGtleU5hbWVzW2Nvb2tpZUtleV07XG4gICAgICAgICAgICAgICAgc3RvcmUucmVtb3ZlKGNvb2tpZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U3RvcmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWVyZ2VkT3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kLmFwcGx5KCQsIFt0cnVlLCB7fV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgIHZhciBiYXNlT3B0aW9ucyA9IGdldEJhc2VPcHRpb25zKG92ZXJyaWRlcyk7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuZ2V0U2Vzc2lvbihvdmVycmlkZXMpO1xuXG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBzZXNzaW9uLmF1dGhfdG9rZW47XG4gICAgICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZhY3RvcnkgPSBuZXcgU3RvcmFnZUZhY3RvcnkoKTtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGZhY3RvcnkuZ2V0KEVQSV9NQU5BR0VSX0tFWSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzZXNzaW9uRGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgYWNjb3VudC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgYWNjb3VudDogc2Vzc2lvbi5hY2NvdW50LFxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGhlIHByb2plY3QuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHByb2plY3Q6IHNlc3Npb24ucHJvamVjdCxcblxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGdyb3VwOiBzZXNzaW9uLmdyb3VwTmFtZSxcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBbGlhcyBmb3IgZ3JvdXAuIFxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lOiBzZXNzaW9uLmdyb3VwTmFtZSwgLy9JdCdzIGEgbGl0dGxlIHdlaXJkIHRoYXQgaXQncyBjYWxsZWQgZ3JvdXBOYW1lIGluIHRoZSBjb29raWUsIGJ1dCAnZ3JvdXAnIGluIGFsbCB0aGUgc2VydmljZSBvcHRpb25zLCBzbyBub3JtYWxpemUgZm9yIGJvdGhcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgZ3JvdXAgaWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlc3Npb24uZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHNlc3Npb24udXNlcklkLFxuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBzZXNzaW9uLnVzZXJOYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCBzZXNzaW9uRGVmYXVsdHMsIGJhc2VPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2Vzc2lvbk1hbmFnZXI7IiwiLyoqXG4gICAgRGVjaWRlcyB0eXBlIG9mIHN0b3JlIHRvIHByb3ZpZGVcbiovXG5cbid1c2Ugc3RyaWN0Jztcbi8vIHZhciBpc05vZGUgPSBmYWxzZTsgRklYTUU6IEJyb3dzZXJpZnkvbWluaWZ5aWZ5IGhhcyBpc3N1ZXMgd2l0aCB0aGUgbmV4dCBsaW5rXG4vLyB2YXIgc3RvcmUgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vc2Vzc2lvbi1zdG9yZScpIDogcmVxdWlyZSgnLi9jb29raWUtc3RvcmUnKTtcbnZhciBzdG9yZSA9IHJlcXVpcmUoJy4vY29va2llLXN0b3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc3RvcmU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBxdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHVybDogJycsXG5cbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgIHN0YXR1c0NvZGU6IHtcbiAgICAgICAgICAgIDQwNDogJC5ub29wXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9OTFkgZm9yIHN0cmluZ3MgaW4gdGhlIHVybC4gQWxsIEdFVCAmIERFTEVURSBwYXJhbXMgYXJlIHJ1biB0aHJvdWdoIHRoaXNcbiAgICAgICAgICogQHR5cGUge1t0eXBlXSB9XG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbWV0ZXJQYXJzZXI6IHF1dGlscy50b1F1ZXJ5Rm9ybWF0LFxuXG4gICAgICAgIC8vIFRvIGFsbG93IGVwaWNlbnRlci50b2tlbiBhbmQgb3RoZXIgc2Vzc2lvbiBjb29raWVzIHRvIGJlIHBhc3NlZFxuICAgICAgICAvLyB3aXRoIHRoZSByZXF1ZXN0c1xuICAgICAgICB4aHJGaWVsZHM6IHtcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiAoJC5pc0Z1bmN0aW9uKGQpKSA/IGQoKSA6IGQ7XG4gICAgfTtcblxuICAgIHZhciBjb25uZWN0ID0gZnVuY3Rpb24gKG1ldGhvZCwgcGFyYW1zLCBjb25uZWN0T3B0aW9ucykge1xuICAgICAgICBwYXJhbXMgPSByZXN1bHQocGFyYW1zKTtcbiAgICAgICAgcGFyYW1zID0gKCQuaXNQbGFpbk9iamVjdChwYXJhbXMpIHx8ICQuaXNBcnJheShwYXJhbXMpKSA/IEpTT04uc3RyaW5naWZ5KHBhcmFtcykgOiBwYXJhbXM7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdHJhbnNwb3J0T3B0aW9ucywgY29ubmVjdE9wdGlvbnMsIHtcbiAgICAgICAgICAgIHR5cGU6IG1ldGhvZCxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtc1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIEFMTE9XRURfVE9fQkVfRlVOQ1RJT05TID0gWydkYXRhJywgJ3VybCddO1xuICAgICAgICAkLmVhY2gob3B0aW9ucywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24odmFsdWUpICYmICQuaW5BcnJheShrZXksIEFMTE9XRURfVE9fQkVfRlVOQ1RJT05TKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zW2tleV0gPSB2YWx1ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3B0aW9ucy5sb2dMZXZlbCAmJiBvcHRpb25zLmxvZ0xldmVsID09PSAnREVCVUcnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvcHRpb25zLnVybCk7XG4gICAgICAgICAgICB2YXIgb2xkU3VjY2Vzc0ZuID0gb3B0aW9ucy5zdWNjZXNzIHx8ICQubm9vcDtcbiAgICAgICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSwgYWpheFN0YXR1cywgYWpheFJlcSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBvbGRTdWNjZXNzRm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlU2VuZCA9IG9wdGlvbnMuYmVmb3JlU2VuZDtcbiAgICAgICAgb3B0aW9ucy5iZWZvcmVTZW5kID0gZnVuY3Rpb24gKHhociwgc2V0dGluZ3MpIHtcbiAgICAgICAgICAgIHhoci5yZXF1ZXN0VXJsID0gKGNvbm5lY3RPcHRpb25zIHx8IHt9KS51cmw7XG4gICAgICAgICAgICBpZiAoYmVmb3JlU2VuZCkge1xuICAgICAgICAgICAgICAgIGJlZm9yZVNlbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gJC5hamF4KG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChwYXJhbXMsIGFqYXhPcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0cmFuc3BvcnRPcHRpb25zLCBhamF4T3B0aW9ucyk7XG4gICAgICAgICAgICBwYXJhbXMgPSBvcHRpb25zLnBhcmFtZXRlclBhcnNlcihyZXN1bHQocGFyYW1zKSk7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5jYWxsKHRoaXMsICdHRVQnLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICBzcGxpdEdldDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIH0sXG4gICAgICAgIHBvc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncG9zdCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGF0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncGF0Y2gnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHB1dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwdXQnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKHBhcmFtcywgYWpheE9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vREVMRVRFIGRvZXNuJ3Qgc3VwcG9ydCBib2R5IHBhcmFtcywgYnV0IGpRdWVyeSB0aGlua3MgaXQgZG9lcy5cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIHRyYW5zcG9ydE9wdGlvbnMsIGFqYXhPcHRpb25zKTtcbiAgICAgICAgICAgIHBhcmFtcyA9IG9wdGlvbnMucGFyYW1ldGVyUGFyc2VyKHJlc3VsdChwYXJhbXMpKTtcbiAgICAgICAgICAgIGlmICgkLnRyaW0ocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWxpbWl0ZXIgPSAocmVzdWx0KG9wdGlvbnMudXJsKS5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJztcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVybCA9IHJlc3VsdChvcHRpb25zLnVybCkgKyBkZWxpbWl0ZXIgKyBwYXJhbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5jYWxsKHRoaXMsICdERUxFVEUnLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydoZWFkJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBvcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ29wdGlvbnMnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyB2YXIgaXNOb2RlID0gZmFsc2U7IEZJWE1FOiBCcm93c2VyaWZ5L21pbmlmeWlmeSBoYXMgaXNzdWVzIHdpdGggdGhlIG5leHQgbGlua1xuLy8gdmFyIHRyYW5zcG9ydCA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9ub2RlLWh0dHAtdHJhbnNwb3J0JykgOiByZXF1aXJlKCcuL2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcbnZhciB0cmFuc3BvcnQgPSByZXF1aXJlKCcuL2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcbm1vZHVsZS5leHBvcnRzID0gdHJhbnNwb3J0O1xuIiwiLyoqXG4vKiBJbmhlcml0IGZyb20gYSBjbGFzcyAodXNpbmcgcHJvdG90eXBlIGJvcnJvd2luZylcbiovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaGVyaXQoQywgUCkge1xuICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgQy5fX3N1cGVyID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDO1xufVxuXG4vKipcbiogU2hhbGxvdyBjb3B5IG9mIGFuIG9iamVjdFxuKiBAcGFyYW0ge09iamVjdH0gZGVzdCBvYmplY3QgdG8gZXh0ZW5kXG4qIEByZXR1cm4ge09iamVjdH0gZXh0ZW5kZWQgb2JqZWN0XG4qL1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIChkZXN0IC8qLCB2YXJfYXJncyovKSB7XG4gICAgdmFyIG9iaiA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvIG5vdCB3cmFwIGlubmVyIGluIGRlc3QuaGFzT3duUHJvcGVydHkgb3IgYmFkIHRoaW5ncyB3aWxsIGhhcHBlblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZSwgcHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IGJhc2U7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgY2hpbGQgPSBwcm9wcyAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/IHByb3BzLmNvbnN0cnVjdG9yIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cbiAgICAvLyBhZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNoaWxkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgZXh0ZW5kKGNoaWxkLCBwYXJlbnQsIHN0YXRpY1Byb3BzKTtcblxuICAgIC8vIGFzc29jaWF0ZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpbmhlcml0KGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgLy8gYWRkIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIGRvbmVcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBfcGljazogZnVuY3Rpb24gKG9iaiwgcHJvcHMpIHtcbiAgICAgICAgdmFyIHJlcyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHByb3BzLmluZGV4T2YocCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVzW3BdID0gb2JqW3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuICAgIGlzRW1wdHk6IGZ1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICghdmFsdWUgfHwgKCQuaXNQbGFpbk9iamVjdCh2YWx1ZSkgJiYgT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCA9PT0gMCkpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcblxudmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKCkuZ2V0KCdzZXJ2ZXInKTtcbnZhciBjdXN0b21EZWZhdWx0cyA9IHt9O1xudmFyIGxpYkRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICBhY2NvdW50OiB1cmxDb25maWcuYWNjb3VudFBhdGggfHwgdW5kZWZpbmVkLFxuICAgIC8qKlxuICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICBwcm9qZWN0OiB1cmxDb25maWcucHJvamVjdFBhdGggfHwgdW5kZWZpbmVkLFxuICAgIGlzTG9jYWw6IHVybENvbmZpZy5pc0xvY2FsaG9zdCgpLFxuICAgIGlzQ3VzdG9tRG9tYWluOiB1cmxDb25maWcuaXNDdXN0b21Eb21haW4sXG4gICAgc3RvcmU6IHt9XG59O1xuXG52YXIgb3B0aW9uVXRpbHMgPSB7XG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgZmluYWwgb3B0aW9ucyBieSBvdmVycmlkaW5nIHRoZSBnbG9iYWwgb3B0aW9ucyBzZXQgd2l0aFxuICAgICAqIG9wdGlvblV0aWxzI3NldERlZmF1bHRzKCkgYW5kIHRoZSBsaWIgZGVmYXVsdHMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIGZpbmFsIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge29iamVjdH0gRXh0ZW5kZWQgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBsaWJEZWZhdWx0cywgY3VzdG9tRGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZ2xvYmFsIGRlZmF1bHRzIGZvciB0aGUgb3B0aW9uVXRpbHMjZ2V0T3B0aW9ucygpIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGVmYXVsdHMgVGhlIGRlZmF1bHRzIG9iamVjdC5cbiAgICAgKi9cbiAgICBzZXREZWZhdWx0czogZnVuY3Rpb24gKGRlZmF1bHRzKSB7XG4gICAgICAgIGN1c3RvbURlZmF1bHRzID0gZGVmYXVsdHM7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gb3B0aW9uVXRpbHM7XG4iLCIvKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHF1ZXJ5IHN0cmluZ3NcbiovXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyB0byBtYXRyaXggZm9ybWF0XG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gcXMgT2JqZWN0IHRvIGNvbnZlcnQgdG8gcXVlcnkgc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9ICAgIE1hdHJpeC1mb3JtYXQgcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdG9NYXRyaXhGb3JtYXQ6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICc7JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIHZhciBPUEVSQVRPUlMgPSBbJzwnLCAnPicsICchJ107XG4gICAgICAgICAgICAkLmVhY2gocXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgJC5pbkFycmF5KCQudHJpbSh2YWx1ZSkuY2hhckF0KDApLCBPUEVSQVRPUlMpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICc9JyArIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgbXRyeCA9ICc7JyArIHJldHVybkFycmF5LmpvaW4oJzsnKTtcbiAgICAgICAgICAgIHJldHVybiBtdHJ4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzL2FycmF5cy9vYmplY3RzIHRvIHR5cGUgJ2E9YiZiPWMnXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9RdWVyeUZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9Nb3N0bHkgZm9yIGRhdGEgYXBpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArICc9JyArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmV0dXJuQXJyYXkuam9pbignJicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgc3RyaW5ncyBvZiB0eXBlICdhPWImYj1jJyB0byB7IGE6YiwgYjpjfVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBxc1RvT2JqZWN0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkIHx8IHFzID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHFzQXJyYXkgPSBxcy5zcGxpdCgnJicpO1xuICAgICAgICAgICAgdmFyIHJldHVybk9iaiA9IHt9O1xuICAgICAgICAgICAgJC5lYWNoKHFzQXJyYXksIGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcUtleSA9IHZhbHVlLnNwbGl0KCc9JylbMF07XG4gICAgICAgICAgICAgICAgdmFyIHFWYWwgPSB2YWx1ZS5zcGxpdCgnPScpWzFdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHFWYWwuaW5kZXhPZignLCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBxVmFsID0gcVZhbC5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybk9ialtxS2V5XSA9IHFWYWw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9ybWFsaXplcyBhbmQgbWVyZ2VzIHN0cmluZ3Mgb2YgdHlwZSAnYT1iJywgeyBiOmN9IHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxczFcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMlxuICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZVFTOiBmdW5jdGlvbiAocXMxLCBxczIpIHtcbiAgICAgICAgICAgIHZhciBvYmoxID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczEpKTtcbiAgICAgICAgICAgIHZhciBvYmoyID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczIpKTtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqMSwgb2JqMik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVHJhaWxpbmdTbGFzaDogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpID09PSAnLycpID8gdXJsIDogKHVybCArICcvJyk7XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcblxuXG4iLCIvKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHRoZSBydW4gc2VydmljZVxuKi9cbid1c2Ugc3RyaWN0JztcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4vcXVlcnktdXRpbCcpO1xudmFyIE1BWF9VUkxfTEVOR1RIID0gMjA0ODtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBub3JtYWxpemVzIGRpZmZlcmVudCB0eXBlcyBvZiBvcGVyYXRpb24gaW5wdXRzXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdHxBcnJheXxTdHJpbmd9IG9wZXJhdGlvbnMgb3BlcmF0aW9ucyB0byBwZXJmb3JtXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSBhcmdzIGFyZ3VtZW50cyBmb3Igb3BlcmF0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ30gb3BlcmF0aW9ucyBvZiB0aGUgZm9ybSBgeyBvcHM6IFtdLCBhcmdzOiBbXSB9YFxuICAgICAgICAgKi9cbiAgICAgICAgbm9ybWFsaXplT3BlcmF0aW9uczogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXR1cm5MaXN0ID0ge1xuICAgICAgICAgICAgICAgIG9wczogW10sXG4gICAgICAgICAgICAgICAgYXJnczogW11cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfY29uY2F0ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoYXJyICE9PSBudWxsICYmIGFyciAhPT0gdW5kZWZpbmVkKSA/IFtdLmNvbmNhdChhcnIpIDogW107XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL3sgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplUGxhaW5PYmplY3RzID0gZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5lYWNoKG9wZXJhdGlvbnMsIGZ1bmN0aW9uIChvcG4sIGFyZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQoYXJnKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy97IG5hbWU6ICdhZGQnLCBwYXJhbXM6IFsxXSB9XG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wZXJhdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KG9wZXJhdGlvbi5wYXJhbXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplT2JqZWN0ID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKG9wZXJhdGlvbi5uYW1lKSA/IF9ub3JtYWxpemVTdHJ1Y3R1cmVkT2JqZWN0cyA6IF9ub3JtYWxpemVQbGFpbk9iamVjdHMpKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZUxpdGVyYWxzID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgYXJncywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wZXJhdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplQXJyYXlzID0gZnVuY3Rpb24gKG9wZXJhdGlvbnMsIGFyZywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKGluZGV4LCBvcG4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcG4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfbm9ybWFsaXplT2JqZWN0KG9wbiwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfbm9ybWFsaXplTGl0ZXJhbHMob3BuLCBhcmdzW2luZGV4XSwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3BlcmF0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplT2JqZWN0KG9wZXJhdGlvbnMsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmlzQXJyYXkob3BlcmF0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplQXJyYXlzKG9wZXJhdGlvbnMsIGFyZ3MsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplTGl0ZXJhbHMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNwbGl0R2V0RmFjdG9yeTogZnVuY3Rpb24gKGh0dHBPcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBodHRwID0gdGhpczsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgdmFyIGdldFZhbHVlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb3B0aW9uc1tuYW1lXSB8fCBodHRwT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBnZXRGaW5hbFVybCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGdldFZhbHVlKCd1cmwnLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVhc3kgKG9yIGtub3duKSB3YXkgdG8gZ2V0IHRoZSBmaW5hbCBVUkwganF1ZXJ5IGlzIGdvaW5nIHRvIHNlbmQgc29cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgcmVwbGljYXRpbmcgaXQuIFRoZSBwcm9jZXNzIG1pZ2h0IGNoYW5nZSBhdCBzb21lIHBvaW50IGJ1dCBpdCBwcm9iYWJseSB3aWxsIG5vdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gUmVtb3ZlIGhhc2hcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoLyMuKiQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIEFwcGVuZCBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5UGFyYW1zID0gcXV0aWwudG9RdWVyeUZvcm1hdChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXN0aW9uSWR4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5UGFyYW1zICYmIHF1ZXN0aW9uSWR4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAnJicgKyBxdWVyeVBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVyeVBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICc/JyArIHF1ZXJ5UGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gZ2V0RmluYWxVcmwocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBtdXN0IHNwbGl0IHRoZSBHRVQgaW4gbXVsdGlwbGUgc2hvcnQgVVJMJ3NcbiAgICAgICAgICAgICAgICAvLyBUaGUgb25seSBwcm9wZXJ0eSBhbGxvd2VkIHRvIGJlIHNwbGl0IGlzIFwiaW5jbHVkZVwiXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuaW5jbHVkZSAmJiBlbmNvZGVVUkkodXJsKS5sZW5ndGggPiBNQVhfVVJMX0xFTkdUSCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zQ29weSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGFyYW1zQ29weS5pbmNsdWRlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsTm9JbmNsdWRlcyA9IGdldEZpbmFsVXJsKHBhcmFtc0NvcHkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IE1BWF9VUkxfTEVOR1RIIC0gdXJsTm9JbmNsdWRlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzIHx8IGh0dHBPcHRpb25zLnN1Y2Nlc3MgfHwgJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkRXJyb3IgPSBvcHRpb25zLmVycm9yIHx8IGh0dHBPcHRpb25zLmVycm9yIHx8ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBvcmlnaW5hbCBzdWNjZXNzIGFuZCBlcnJvciBjYWxsYmFja3NcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yID0gJC5ub29wO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmNsdWRlID0gcGFyYW1zLmluY2x1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJySW5jbHVkZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY2x1ZGVPcHRzID0gW2N1cnJJbmNsdWRlc107XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyTGVuZ3RoID0gZW5jb2RlVVJJQ29tcG9uZW50KCc/aW5jbHVkZT0nKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhckxlbmdodCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YXJpYWJsZSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGEgZ3JlZWR5IGFwcHJvYWNoIGZvciBub3csIGNhbiBiZSBvcHRpbWl6ZWQgdG8gYmUgc29sdmVkIGluIGEgbW9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWZmaWNpZW50IHdheVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKyAxIGlzIHRoZSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJMZW5ndGggKyB2YXJMZW5naHQgKyAxIDwgZGlmZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcy5wdXNoKHZhcmlhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyTGVuZ3RoICs9IHZhckxlbmdodCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcyA9IFt2YXJpYWJsZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU9wdHMucHVzaChjdXJySW5jbHVkZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggPSAnP2luY2x1ZGU9Jy5sZW5ndGggKyB2YXJMZW5naHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcXMgPSAkLm1hcChpbmNsdWRlT3B0cywgZnVuY3Rpb24gKGluY2x1ZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXFQYXJhbXMgPSAkLmV4dGVuZCh7fSwgcGFyYW1zLCB7IGluY2x1ZGU6IGluY2x1ZGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocmVxUGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQud2hlbi5hcHBseSgkLCByZXFzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggYXJndW1lbnQgYXJlIGFycmF5cyBvZiB0aGUgYXJndW1lbnRzIG9mIGVhY2ggZG9uZSByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyB0aGUgZmlyc3QgYXJndW1lbnQgb2YgdGhlIGZpcnN0IGFycmF5IG9mIGFyZ3VtZW50cyBpcyB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBhcmd1bWVudHNbMF0gJiYgYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIG5ldmVyIGhhcHBlbi4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdFJlc3BvbnNlID0gYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzUnVuQVBJID0gKGlzT2JqZWN0ICYmICQuaXNQbGFpbk9iamVjdChmaXJzdFJlc3BvbnNlLnZhcmlhYmxlcykpIHx8ICFpc09iamVjdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1J1bkFQSSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZ2dyZWdhdGUgdGhlIHZhcmlhYmxlcyBwcm9wZXJ0eSBvbmx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVSdW4gPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydW4gPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgYWdncmVnYXRlUnVuLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVSdW4sIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcnJheSBvZiBydW5zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFncmVnYXRlIHZhcmlhYmxlcyBpbiBlYWNoIHJ1blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFJ1bnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkLmlzQXJyYXkocnVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocnVucywgZnVuY3Rpb24gKGlkeFJ1biwgcnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bi5pZCAmJiAhYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0gcnVuLnZhcmlhYmxlcyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSA9IHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bi5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0dXJuIGl0IGludG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnMgPSAkLm1hcChhZ2dyZWdhdGVkUnVucywgZnVuY3Rpb24gKHJ1bikgeyByZXR1cm4gcnVuOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkU3VjY2VzcyhhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgdmFyaWFibGVzIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFZhcmlhYmxlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkVmFyaWFibGVzLCB2YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkVmFyaWFibGVzLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yLmFwcGx5KGh0dHAsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVqZWN0LmFwcGx5KGR0ZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcbiJdfQ==
