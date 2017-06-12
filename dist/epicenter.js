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
 * v2.2.1
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

F.version = '2.2.1';
F.api = require('./api-version.json');

global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./api-version.json":3,"./env-load":5,"./managers/auth-manager":6,"./managers/epicenter-channel-manager":8,"./managers/run-manager":10,"./managers/run-strategies":14,"./managers/saved-runs-manager":21,"./managers/scenario-manager":22,"./managers/strategy-utils":26,"./managers/world-manager":27,"./service/admin-file-service":28,"./service/asset-api-adapter":29,"./service/auth-api-service":30,"./service/channel-service":31,"./service/configuration-service":32,"./service/data-api-service":33,"./service/group-api-service":34,"./service/introspection-api-service":35,"./service/member-api-adapter":36,"./service/presence-api-service":37,"./service/run-api-service":38,"./service/state-api-adapter":40,"./service/url-config-service":41,"./service/user-api-adapter":42,"./service/variables-api-service":43,"./service/world-api-adapter":44,"./store/cookie-store":45,"./store/store-factory":47,"./transport/ajax-http-transport":48,"./transport/http-transport-factory":49,"./util/inherit":50,"./util/query-util":53,"./util/run-util":54}],5:[function(require,module,exports){
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

        var handleGroupError = function (message, statusCode, data) {
            // logout the user since it's in an invalid state with no group selected
            me.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode });
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

            var sessionInfo = {
                auth_token: token,
                account: adapterOptions.account,
                project: project,
                userId: userInfo.user_id,
                groups: oldGroups,
                isTeamMember: isTeamMember
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
                    handleGroupError('The user has no groups associated in this account', 401, data);
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
                    handleGroupError('This user is associated with more than one group. Please specify a group id to log into and try again', 403, data);
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
                        handleGroupList(groups);
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
        return __super.getChannel.call(this, { base: baseTopic });
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
                if (actualData.data) { //Delete notifications are one data-level behind of course
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

},{"../service/configuration-service":32,"../store/session-manager":46,"../util/inherit":50,"./channel-manager":7}],9:[function(require,module,exports){
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

function sessionKeyFromOptions(options) {
    var sessionKey = $.isFunction(options.sessionKey) ? options.sessionKey() : options.sessionKey;
    return sessionKey;
}

function setRunInSession(sessionKey, run, sessionManager) {
    if (sessionKey) {
        delete run.variables;
        sessionManager.getStore().set(sessionKey, JSON.stringify(run));
    }
}

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,
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

        var sessionContents = sessionStore.get(sessionKeyFromOptions(this.options));
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
                        setRunInSession(sessionKeyFromOptions(me.options), run, me.sessionManager);
                        me.run.updateConfig({ filter: run.id });

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
                setRunInSession(sessionKeyFromOptions(me.options), run.id, me.sessionManager);
                me.run.updateConfig({ filter: run.id });
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

    reset: function (runService, session) {
        var curUserId = session.userId;
        var curGroupName = session.groupName;

        return this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(function (world) {
                return this.worldApi.newRunForWorld(world.id);
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
            // startrecord: 0, //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
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
        var filter = injectFiltersFromSession(this.options.flag, userSession);
        var me = this;
        return runService.query(filter, { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
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

        var scopedFilter = injectFiltersFromSession($.extend(true, {}, {
            saved: true, 
            trashed: false,
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
*       var sm = new F.manager.ScenarioManager();
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
        sessionKey: 'sm-baseline-run',
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
        sessionKey: 'sm-current-run',
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

    reset: function (runService, userSession) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt).then(function (createResponse) {
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse, { freshlyCreated: true });
            });
        });
    },

    getRun: function (runService, userSession) {
        var filter = injectFiltersFromSession({ 
            saved: false,
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }, userSession);
        var me = this;
        var outputModifiers = { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
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
        *       wMgr.getCurrentRun({model: 'myModel.py'})
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
var ChannelManager = require('../managers/epicenter-channel-manager');

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
            var runApiParams = ['model', 'scope', 'files', 'ephemeral'];
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
            // var session = getStore(options).get(EPI_SESSION_KEY) || '{}';
            // return JSON.parse(session);
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
                userId: session.userId
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQmFzZTY0L2Jhc2U2NC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwic3JjL2FwaS12ZXJzaW9uLmpzb24iLCJzcmMvYXBwLmpzIiwic3JjL2Vudi1sb2FkLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvZGVwcmVjYXRlZC9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvZGVwcmVjYXRlZC9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2luZGV4LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL211bHRpcGxheWVyLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25vbmUtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtYWNyb3NzLXNlc3Npb25zLmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtbmV2ZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvcmV1c2UtcGVyLXNlc3Npb24uanMiLCJzcmMvbWFuYWdlcnMvc2F2ZWQtcnVucy1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tc3RyYXRlZ2llcy9iYXNlbGluZS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9zY2VuYXJpby1zdHJhdGVnaWVzL3JldXNlLWxhc3QtdW5zYXZlZC5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvc3RyYXRlZ3ktdXRpbHMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9ncm91cC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9wcmVzZW5jZS1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3J1bi1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3NlcnZpY2UtdXRpbHMuanMiLCJzcmMvc2VydmljZS9zdGF0ZS1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3VzZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS93b3JsZC1hcGktYWRhcHRlci5qcyIsInNyYy9zdG9yZS9jb29raWUtc3RvcmUuanMiLCJzcmMvc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyLmpzIiwic3JjL3N0b3JlL3N0b3JlLWZhY3RvcnkuanMiLCJzcmMvdHJhbnNwb3J0L2FqYXgtaHR0cC10cmFuc3BvcnQuanMiLCJzcmMvdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnkuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIiwic3JjL3V0aWwvb2JqZWN0LXV0aWwuanMiLCJzcmMvdXRpbC9vcHRpb24tdXRpbHMuanMiLCJzcmMvdXRpbC9xdWVyeS11dGlsLmpzIiwic3JjL3V0aWwvcnVuLXV0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0dkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiOyhmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIG9iamVjdCA9IHR5cGVvZiBleHBvcnRzICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IHNlbGY7IC8vICM4OiB3ZWIgd29ya2Vyc1xuICB2YXIgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuXG4gIGZ1bmN0aW9uIEludmFsaWRDaGFyYWN0ZXJFcnJvcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgfVxuICBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IucHJvdG90eXBlID0gbmV3IEVycm9yO1xuICBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IucHJvdG90eXBlLm5hbWUgPSAnSW52YWxpZENoYXJhY3RlckVycm9yJztcblxuICAvLyBlbmNvZGVyXG4gIC8vIFtodHRwczovL2dpc3QuZ2l0aHViLmNvbS85OTkxNjZdIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vbmlnbmFnXVxuICBvYmplY3QuYnRvYSB8fCAoXG4gIG9iamVjdC5idG9hID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIHN0ciA9IFN0cmluZyhpbnB1dCk7XG4gICAgZm9yIChcbiAgICAgIC8vIGluaXRpYWxpemUgcmVzdWx0IGFuZCBjb3VudGVyXG4gICAgICB2YXIgYmxvY2ssIGNoYXJDb2RlLCBpZHggPSAwLCBtYXAgPSBjaGFycywgb3V0cHV0ID0gJyc7XG4gICAgICAvLyBpZiB0aGUgbmV4dCBzdHIgaW5kZXggZG9lcyBub3QgZXhpc3Q6XG4gICAgICAvLyAgIGNoYW5nZSB0aGUgbWFwcGluZyB0YWJsZSB0byBcIj1cIlxuICAgICAgLy8gICBjaGVjayBpZiBkIGhhcyBubyBmcmFjdGlvbmFsIGRpZ2l0c1xuICAgICAgc3RyLmNoYXJBdChpZHggfCAwKSB8fCAobWFwID0gJz0nLCBpZHggJSAxKTtcbiAgICAgIC8vIFwiOCAtIGlkeCAlIDEgKiA4XCIgZ2VuZXJhdGVzIHRoZSBzZXF1ZW5jZSAyLCA0LCA2LCA4XG4gICAgICBvdXRwdXQgKz0gbWFwLmNoYXJBdCg2MyAmIGJsb2NrID4+IDggLSBpZHggJSAxICogOClcbiAgICApIHtcbiAgICAgIGNoYXJDb2RlID0gc3RyLmNoYXJDb2RlQXQoaWR4ICs9IDMvNCk7XG4gICAgICBpZiAoY2hhckNvZGUgPiAweEZGKSB7XG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IoXCInYnRvYScgZmFpbGVkOiBUaGUgc3RyaW5nIHRvIGJlIGVuY29kZWQgY29udGFpbnMgY2hhcmFjdGVycyBvdXRzaWRlIG9mIHRoZSBMYXRpbjEgcmFuZ2UuXCIpO1xuICAgICAgfVxuICAgICAgYmxvY2sgPSBibG9jayA8PCA4IHwgY2hhckNvZGU7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH0pO1xuXG4gIC8vIGRlY29kZXJcbiAgLy8gW2h0dHBzOi8vZ2lzdC5naXRodWIuY29tLzEwMjAzOTZdIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vYXRrXVxuICBvYmplY3QuYXRvYiB8fCAoXG4gIG9iamVjdC5hdG9iID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIHN0ciA9IFN0cmluZyhpbnB1dCkucmVwbGFjZSgvPSskLywgJycpO1xuICAgIGlmIChzdHIubGVuZ3RoICUgNCA9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENoYXJhY3RlckVycm9yKFwiJ2F0b2InIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBkZWNvZGVkIGlzIG5vdCBjb3JyZWN0bHkgZW5jb2RlZC5cIik7XG4gICAgfVxuICAgIGZvciAoXG4gICAgICAvLyBpbml0aWFsaXplIHJlc3VsdCBhbmQgY291bnRlcnNcbiAgICAgIHZhciBiYyA9IDAsIGJzLCBidWZmZXIsIGlkeCA9IDAsIG91dHB1dCA9ICcnO1xuICAgICAgLy8gZ2V0IG5leHQgY2hhcmFjdGVyXG4gICAgICBidWZmZXIgPSBzdHIuY2hhckF0KGlkeCsrKTtcbiAgICAgIC8vIGNoYXJhY3RlciBmb3VuZCBpbiB0YWJsZT8gaW5pdGlhbGl6ZSBiaXQgc3RvcmFnZSBhbmQgYWRkIGl0cyBhc2NpaSB2YWx1ZTtcbiAgICAgIH5idWZmZXIgJiYgKGJzID0gYmMgJSA0ID8gYnMgKiA2NCArIGJ1ZmZlciA6IGJ1ZmZlcixcbiAgICAgICAgLy8gYW5kIGlmIG5vdCBmaXJzdCBvZiBlYWNoIDQgY2hhcmFjdGVycyxcbiAgICAgICAgLy8gY29udmVydCB0aGUgZmlyc3QgOCBiaXRzIHRvIG9uZSBhc2NpaSBjaGFyYWN0ZXJcbiAgICAgICAgYmMrKyAlIDQpID8gb3V0cHV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjU1ICYgYnMgPj4gKC0yICogYmMgJiA2KSkgOiAwXG4gICAgKSB7XG4gICAgICAvLyB0cnkgdG8gZmluZCBjaGFyYWN0ZXIgaW4gdGFibGUgKDAtNjMsIG5vdCBmb3VuZCA9PiAtMSlcbiAgICAgIGJ1ZmZlciA9IGNoYXJzLmluZGV4T2YoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSk7XG5cbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJ2ZXJzaW9uXCI6IFwidjJcIlxufVxuIiwiLyoqXG4gKiBFcGljZW50ZXIgSmF2YXNjcmlwdCBsaWJyYXJpZXNcbiAqIHY8JT0gdmVyc2lvbiAlPlxuICogaHR0cHM6Ly9naXRodWIuY29tL2ZvcmlvL2VwaWNlbnRlci1qcy1saWJzXG4gKi9cblxudmFyIEYgPSB7XG4gICAgX3ByaXZhdGU6IHt9LCAvL25lZWQgdGhpcyBob29rIG5vdyBiZWNhdXNlIHRlc3RzIGV4cGVjdCBldmVyeXRoaW5nIHRvIGJlIGdsb2JhbC4gRGVsZXRlIG9uY2UgdGVzdHMgYXJlIGJyb3dzZXJpZmllZFxuICAgIHV0aWw6IHt9LFxuICAgIGZhY3Rvcnk6IHt9LFxuICAgIHRyYW5zcG9ydDoge30sXG4gICAgc3RvcmU6IHt9LFxuICAgIHNlcnZpY2U6IHt9LFxuICAgIG1hbmFnZXI6IHtcbiAgICAgICAgc3RyYXRlZ3k6IHt9XG4gICAgfSxcblxufTtcblxuRi5sb2FkID0gcmVxdWlyZSgnLi9lbnYtbG9hZCcpO1xuXG5pZiAoIWdsb2JhbC5TS0lQX0VOVl9MT0FEKSB7XG4gICAgRi5sb2FkKCk7XG59XG5cbkYudXRpbC5xdWVyeSA9IHJlcXVpcmUoJy4vdXRpbC9xdWVyeS11dGlsJyk7XG5GLnV0aWwucnVuID0gcmVxdWlyZSgnLi91dGlsL3J1bi11dGlsJyk7XG5GLnV0aWwuY2xhc3NGcm9tID0gcmVxdWlyZSgnLi91dGlsL2luaGVyaXQnKTtcbkYuX3ByaXZhdGUuc3RyYXRlZ3l1dGlscyA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc3RyYXRlZ3ktdXRpbHMnKTtcblxuRi5mYWN0b3J5LlRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbkYudHJhbnNwb3J0LkFqYXggPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5cbkYuc2VydmljZS5VUkwgPSByZXF1aXJlKCcuL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuQ29uZmlnID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuRi5zZXJ2aWNlLlJ1biA9IHJlcXVpcmUoJy4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5GaWxlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZScpO1xuRi5zZXJ2aWNlLlZhcmlhYmxlcyA9IHJlcXVpcmUoJy4vc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5EYXRhID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5BdXRoID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2F1dGgtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5Xb3JsZCA9IHJlcXVpcmUoJy4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLlN0YXRlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuVXNlciA9IHJlcXVpcmUoJy4vc2VydmljZS91c2VyLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuTWVtYmVyID0gcmVxdWlyZSgnLi9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLkFzc2V0ID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuR3JvdXAgPSByZXF1aXJlKCcuL3NlcnZpY2UvZ3JvdXAtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5JbnRyb3NwZWN0ID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5QcmVzZW5jZSA9IHJlcXVpcmUoJy4vc2VydmljZS9wcmVzZW5jZS1hcGktc2VydmljZScpO1xuXG5GLnN0b3JlLkNvb2tpZSA9IHJlcXVpcmUoJy4vc3RvcmUvY29va2llLXN0b3JlJyk7XG5GLmZhY3RvcnkuU3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcblxuRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc2NlbmFyaW8tbWFuYWdlcicpO1xuRi5tYW5hZ2VyLlJ1bk1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL2F1dGgtbWFuYWdlcicpO1xuRi5tYW5hZ2VyLldvcmxkTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvd29ybGQtbWFuYWdlcicpO1xuRi5tYW5hZ2VyLlNhdmVkUnVuc01hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3NhdmVkLXJ1bnMtbWFuYWdlcicpO1xuXG52YXIgc3RyYXRlZ2llcyA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMnKTtcbkYubWFuYWdlci5zdHJhdGVneSA9IHN0cmF0ZWdpZXMubGlzdDsgLy9UT0RPOiB0aGlzIGlzIG5vdCByZWFsbHkgYSBtYW5hZ2VyIHNvIG5hbWVzcGFjZSB0aGlzIGJldHRlclxuXG5GLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXInKTtcbkYuc2VydmljZS5DaGFubmVsID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xuXG5GLnZlcnNpb24gPSAnPCU9IHZlcnNpb24gJT4nO1xuRi5hcGkgPSByZXF1aXJlKCcuL2FwaS12ZXJzaW9uLmpzb24nKTtcblxuZ2xvYmFsLkYgPSBGO1xubW9kdWxlLmV4cG9ydHMgPSBGO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVVJMQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxudmFyIGVudkxvYWQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdXJsU2VydmljZSA9IG5ldyBVUkxDb25maWdTZXJ2aWNlKCk7XG4gICAgdmFyIGluZm9VcmwgPSB1cmxTZXJ2aWNlLmdldEFQSVBhdGgoJ2NvbmZpZycpO1xuICAgIHZhciBlbnZQcm9taXNlID0gJC5hamF4KHsgdXJsOiBpbmZvVXJsLCBhc3luYzogZmFsc2UgfSk7XG4gICAgZW52UHJvbWlzZSA9IGVudlByb21pc2UudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIHZhciBvdmVycmlkZXMgPSByZXMuYXBpO1xuICAgICAgICBVUkxDb25maWdTZXJ2aWNlLmRlZmF1bHRzID0gJC5leHRlbmQoVVJMQ29uZmlnU2VydmljZS5kZWZhdWx0cywgb3ZlcnJpZGVzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW52UHJvbWlzZS50aGVuKGNhbGxiYWNrKS5mYWlsKGNhbGxiYWNrKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZW52TG9hZDtcbiIsIi8qKlxuKiAjIyBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBwcm92aWRlcyBhbiBlYXN5IHdheSB0byBtYW5hZ2UgdXNlciBhdXRoZW50aWNhdGlvbiAobG9nZ2luZyBpbiBhbmQgb3V0KSBhbmQgYXV0aG9yaXphdGlvbiAoa2VlcGluZyB0cmFjayBvZiB0b2tlbnMsIHNlc3Npb25zLCBhbmQgZ3JvdXBzKSBmb3IgcHJvamVjdHMuXG4qXG4qIFRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgaXMgbW9zdCB1c2VmdWwgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgd2l0aCBhbiBhY2Nlc3MgbGV2ZWwgb2YgW0F1dGhlbnRpY2F0ZWRdKC4uLy4uLy4uL2dsb3NzYXJ5LyNhY2Nlc3MpLiBUaGVzZSBwcm9qZWN0cyBhcmUgYWNjZXNzZWQgYnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2Ygb25lIG9yIG1vcmUgW2dyb3Vwc10oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuXG4qXG4qICMjIyMgVXNpbmcgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlclxuKlxuKiBUbyB1c2UgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQuIFRoZW4sIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkOlxuKlxuKiAgICAgICB2YXIgYXV0aE1nciA9IG5ldyBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4qICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJ1xuKiAgICAgICB9KTtcbiogICAgICAgYXV0aE1nci5sb2dpbigpLnRoZW4oZnVuY3Rpb24gKCkge1xuKiAgICAgICAgICAgYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4qICAgICAgIH0pO1xuKlxuKlxuKiBUaGUgYG9wdGlvbnNgIG9iamVjdCBwYXNzZWQgdG8gdGhlIGBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoKWAgY2FsbCBjYW4gaW5jbHVkZTpcbipcbiogICAqIGBhY2NvdW50YDogVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4qICAgKiBgdXNlck5hbWVgOiBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4qICAgKiBgcGFzc3dvcmRgOiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLiBPcHRpb25hbC5cbiogICAqIGBncm91cElkYDogSWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIGB1c2VyTmFtZWAgYmVsb25ncy4gUmVxdWlyZWQgZm9yIGVuZCB1c2VycyBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZC5cbipcbiogSWYgeW91IHByZWZlciBzdGFydGluZyBmcm9tIGEgdGVtcGxhdGUsIHRoZSBFcGljZW50ZXIgSlMgTGlicyBbTG9naW4gQ29tcG9uZW50XSguLi8uLi8jY29tcG9uZW50cykgdXNlcyB0aGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyIGFzIHdlbGwuIFRoaXMgc2FtcGxlIEhUTUwgcGFnZSAoYW5kIGFzc29jaWF0ZWQgQ1NTIGFuZCBKUyBmaWxlcykgcHJvdmlkZXMgYSBsb2dpbiBmb3JtIGZvciB0ZWFtIG1lbWJlcnMgYW5kIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3QuIEl0IGFsc28gaW5jbHVkZXMgYSBncm91cCBzZWxlY3RvciBmb3IgZW5kIHVzZXJzIHRoYXQgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgZ3JvdXBzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIEF1dGhBZGFwdGVyID0gcmVxdWlyZSgnLi4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG52YXIgTWVtYmVyQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG52YXIgR3JvdXBTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ncm91cC1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgYXRvYiA9IHdpbmRvdy5hdG9iIHx8IHJlcXVpcmUoJ0Jhc2U2NCcpLmF0b2I7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICByZXF1aXJlc0dyb3VwOiB0cnVlXG59O1xuXG5mdW5jdGlvbiBBdXRoTWFuYWdlcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcihvcHRpb25zKTtcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoKTtcblxuICAgIHRoaXMuYXV0aEFkYXB0ZXIgPSBuZXcgQXV0aEFkYXB0ZXIodGhpcy5vcHRpb25zKTtcbn1cblxudmFyIF9maW5kVXNlckluR3JvdXAgPSBmdW5jdGlvbiAobWVtYmVycywgaWQpIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1lbWJlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKG1lbWJlcnNbal0udXNlcklkID09PSBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnNbal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5BdXRoTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChBdXRoTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIGluLlxuICAgICpcbiAgICAqICoqRXhhbXBsZSoqXG4gICAgKlxuICAgICogICAgICAgYXV0aE1nci5sb2dpbih7XG4gICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4gICAgKiAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCdcbiAgICAqICAgICAgIH0pXG4gICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc3RhdHVzT2JqKSB7XG4gICAgKiAgICAgICAgICAgICAgIC8vIGlmIGVuZHVzZXIxIGJlbG9uZ3MgdG8gZXhhY3RseSBvbmUgZ3JvdXBcbiAgICAqICAgICAgICAgICAgICAgLy8gKG9yIGlmIHRoZSBsb2dpbigpIGNhbGwgaXMgbW9kaWZpZWQgdG8gaW5jbHVkZSB0aGUgZ3JvdXAgaWQpXG4gICAgKiAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlIGhlcmVcbiAgICAqICAgICAgICAgICB9KVxuICAgICogICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHN0YXR1c09iaikge1xuICAgICogICAgICAgICAgICAgICAvLyBpZiBlbmR1c2VyMSBiZWxvbmdzIHRvIG11bHRpcGxlIGdyb3VwcyxcbiAgICAqICAgICAgICAgICAgICAgLy8gdGhlIGxvZ2luKCkgY2FsbCBmYWlsc1xuICAgICogICAgICAgICAgICAgICAvLyBhbmQgcmV0dXJucyBhbGwgZ3JvdXBzIG9mIHdoaWNoIHRoZSB1c2VyIGlzIGEgbWVtYmVyXG4gICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IHN0YXR1c09iai51c2VyR3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5uYW1lLCBzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5ncm91cElkKTtcbiAgICAqICAgICAgICAgICAgICAgfVxuICAgICogICAgICAgICAgIH0pO1xuICAgICpcbiAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gSWYgbm90IHBhc3NlZCBpbiB3aGVuIGNyZWF0aW5nIGFuIGluc3RhbmNlIG9mIHRoZSBtYW5hZ2VyIChgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKClgKSwgdGhlc2Ugb3B0aW9ucyBzaG91bGQgaW5jbHVkZTpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmFjY291bnQgVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51c2VyTmFtZSBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5wYXNzd29yZCBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5wcm9qZWN0IChPcHRpb25hbCkgVGhlICoqUHJvamVjdCBJRCoqIGZvciB0aGUgcHJvamVjdCB0byBsb2cgdGhpcyB1c2VyIGludG8uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5ncm91cElkIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggYHVzZXJOYW1lYCBiZWxvbmdzLiBSZXF1aXJlZCBmb3IgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZCBhbmQgaWYgdGhlIGVuZCB1c2VycyBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBbZ3JvdXBzXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3RoZXJ3aXNlIG9wdGlvbmFsLlxuICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IHRoaXMuc2Vzc2lvbk1hbmFnZXI7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoeyBzdWNjZXNzOiAkLm5vb3AsIGVycm9yOiAkLm5vb3AgfSwgb3B0aW9ucyk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgdmFyIG91dEVycm9yID0gYWRhcHRlck9wdGlvbnMuZXJyb3I7XG4gICAgICAgIHZhciBncm91cElkID0gYWRhcHRlck9wdGlvbnMuZ3JvdXBJZDtcblxuICAgICAgICB2YXIgZGVjb2RlVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIHZhciBlbmNvZGVkID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHdoaWxlIChlbmNvZGVkLmxlbmd0aCAlIDQgIT09IDApIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgZW5jb2RlZCArPSAnPSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShhdG9iKGVuY29kZWQpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlR3JvdXBFcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gICAgICAgICAgICAvLyBsb2dvdXQgdGhlIHVzZXIgc2luY2UgaXQncyBpbiBhbiBpbnZhbGlkIHN0YXRlIHdpdGggbm8gZ3JvdXAgc2VsZWN0ZWRcbiAgICAgICAgICAgIG1lLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkYXRhLCB7IHN0YXR1c1RleHQ6IG1lc3NhZ2UsIHN0YXR1czogc3RhdHVzQ29kZSB9KTtcbiAgICAgICAgICAgICAgICAkZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciB0b2tlbiA9IHJlc3BvbnNlLmFjY2Vzc190b2tlbjtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IGRlY29kZVRva2VuKHRva2VuKTtcbiAgICAgICAgICAgIHZhciBvbGRHcm91cHMgPSBzZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKS5ncm91cHMgfHwge307XG4gICAgICAgICAgICB2YXIgdXNlckdyb3VwT3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBhZGFwdGVyT3B0aW9ucywgeyBzdWNjZXNzOiAkLm5vb3AgfSk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHsgYXV0aDogcmVzcG9uc2UsIHVzZXI6IHVzZXJJbmZvIH07XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG4gICAgICAgICAgICB2YXIgaXNUZWFtTWVtYmVyID0gdXNlckluZm8ucGFyZW50X2FjY291bnRfaWQgPT09IG51bGw7XG4gICAgICAgICAgICB2YXIgcmVxdWlyZXNHcm91cCA9IGFkYXB0ZXJPcHRpb25zLnJlcXVpcmVzR3JvdXAgJiYgcHJvamVjdDtcblxuICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvID0ge1xuICAgICAgICAgICAgICAgIGF1dGhfdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgICAgIGFjY291bnQ6IGFkYXB0ZXJPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBvbGRHcm91cHMsXG4gICAgICAgICAgICAgICAgaXNUZWFtTWVtYmVyOiBpc1RlYW1NZW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBUaGUgZ3JvdXAgaXMgbm90IHJlcXVpcmVkIGlmIHRoZSB1c2VyIGlzIG5vdCBsb2dnaW5nIGludG8gYSBwcm9qZWN0XG4gICAgICAgICAgICBpZiAoIXJlcXVpcmVzR3JvdXApIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mbyk7XG4gICAgICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbZGF0YV0pO1xuICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaGFuZGxlR3JvdXBMaXN0ID0gZnVuY3Rpb24gKGdyb3VwTGlzdCkge1xuICAgICAgICAgICAgICAgIGRhdGEudXNlckdyb3VwcyA9IGdyb3VwTGlzdDtcblxuICAgICAgICAgICAgICAgIHZhciBncm91cCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhlIHVzZXIgaGFzIG5vIGdyb3VwcyBhc3NvY2lhdGVkIGluIHRoaXMgYWNjb3VudCcsIDQwMSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBvbmx5IGdyb3VwXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwID0gZ3JvdXBMaXN0WzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEdyb3VwcyA9ICQuZ3JlcChncm91cExpc3QsIGZ1bmN0aW9uIChyZXNHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNHcm91cC5ncm91cElkID09PSBncm91cElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cCA9IGZpbHRlcmVkR3JvdXBzLmxlbmd0aCA9PT0gMSA/IGZpbHRlcmVkR3JvdXBzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHRlYW0gbWVtYmVyIGRvZXMgbm90IGdldCB0aGUgZ3JvdXAgbWVtYmVycyBiZWNhdXNlIGlzIGNhbGxpbmcgdGhlIEdyb3VwIEFQSVxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgaXQncyBhdXRvbWF0aWNhbGx5IGEgZmFjIHVzZXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmFjID0gaXNUZWFtTWVtYmVyID8gdHJ1ZSA6IF9maW5kVXNlckluR3JvdXAoZ3JvdXAubWVtYmVycywgdXNlckluZm8udXNlcl9pZCkucm9sZSA9PT0gJ2ZhY2lsaXRhdG9yJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwLmdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cE5hbWU6IGdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0ZhYzogaXNGYWNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvV2l0aEdyb3VwID0gb2JqZWN0QXNzaWduKHt9LCBzZXNzaW9uSW5mbywgZ3JvdXBEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbkluZm8uZ3JvdXBzW3Byb2plY3RdID0gZ3JvdXBEYXRhO1xuICAgICAgICAgICAgICAgICAgICBtZS5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mb1dpdGhHcm91cCwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhpcyB1c2VyIGlzIGFzc29jaWF0ZWQgd2l0aCBtb3JlIHRoYW4gb25lIGdyb3VwLiBQbGVhc2Ugc3BlY2lmeSBhIGdyb3VwIGlkIHRvIGxvZyBpbnRvIGFuZCB0cnkgYWdhaW4nLCA0MDMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghaXNUZWFtTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbWUuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogdXNlckluZm8udXNlcl9pZCwgdG9rZW46IHRva2VuIH0sIHVzZXJHcm91cE9wdHMpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGhhbmRsZUdyb3VwTGlzdCwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSBvYmplY3RBc3NpZ24oe30sIHVzZXJHcm91cE9wdHMsIHsgdG9rZW46IHRva2VuIH0pO1xuICAgICAgICAgICAgICAgIHZhciBncm91cFNlcnZpY2UgPSBuZXcgR3JvdXBTZXJ2aWNlKG9wdHMpO1xuICAgICAgICAgICAgICAgIGdyb3VwU2VydmljZS5nZXRHcm91cHMoeyBhY2NvdW50OiBhZGFwdGVyT3B0aW9ucy5hY2NvdW50LCBwcm9qZWN0OiBwcm9qZWN0IH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdyb3VwIEFQSSByZXR1cm5zIGlkIGluc3RlYWQgb2YgZ3JvdXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBJZCA9IGdyb3VwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cExpc3QoZ3JvdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gaGFuZGxlU3VjY2VzcztcbiAgICAgICAgYWRhcHRlck9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChhZGFwdGVyT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGxvZ2luIGFzIGEgc3lzdGVtIHVzZXJcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5hY2NvdW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgbWUuYXV0aEFkYXB0ZXIubG9naW4oYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdXRoQWRhcHRlci5sb2dpbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIG91dCBieSBjbGVhcmluZyBhbGwgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICAqXG4gICAgKiAqKkV4YW1wbGUqKlxuICAgICpcbiAgICAqICAgICAgIGF1dGhNZ3IubG9nb3V0KCk7XG4gICAgKlxuICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciByZW1vdmVDb29raWVGbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbWUuc2Vzc2lvbk1hbmFnZXIucmVtb3ZlU2Vzc2lvbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmF1dGhBZGFwdGVyLmxvZ291dChhZGFwdGVyT3B0aW9ucykudGhlbihyZW1vdmVDb29raWVGbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGV4aXN0aW5nIHVzZXIgYWNjZXNzIHRva2VuIGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluLiBPdGhlcndpc2UsIGxvZ3MgdGhlIHVzZXIgaW4sIGNyZWF0aW5nIGEgbmV3IHVzZXIgYWNjZXNzIHRva2VuLCBhbmQgcmV0dXJucyB0aGUgbmV3IHRva2VuLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmdldFRva2VuKClcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ015IHRva2VuIGlzICcsIHRva2VuKTtcbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGdldFRva2VuOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24oaHR0cE9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIGlmIChzZXNzaW9uLmF1dGhfdG9rZW4pIHtcbiAgICAgICAgICAgICRkLnJlc29sdmUoc2Vzc2lvbi5hdXRoX3Rva2VuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9naW4oaHR0cE9wdGlvbnMpLnRoZW4oJGQucmVzb2x2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBncm91cCByZWNvcmRzLCBvbmUgZm9yIGVhY2ggZ3JvdXAgb2Ygd2hpY2ggdGhlIGN1cnJlbnQgdXNlciBpcyBhIG1lbWJlci4gRWFjaCBncm91cCByZWNvcmQgaW5jbHVkZXMgdGhlIGdyb3VwIGBuYW1lYCwgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgZ3JvdXBJZGAuXG4gICAgICpcbiAgICAgKiBJZiBzb21lIGVuZCB1c2VycyBpbiB5b3VyIHByb2plY3QgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgZ3JvdXBzLCB0aGlzIGlzIGEgdXNlZnVsIG1ldGhvZCB0byBjYWxsIG9uIHlvdXIgcHJvamVjdCdzIGxvZ2luIHBhZ2UuIFdoZW4gdGhlIHVzZXIgYXR0ZW1wdHMgdG8gbG9nIGluLCB5b3UgY2FuIHVzZSB0aGlzIHRvIGRpc3BsYXkgdGhlIGdyb3VwcyBvZiB3aGljaCB0aGUgdXNlciBpcyBtZW1iZXIsIGFuZCBoYXZlIHRoZSB1c2VyIHNlbGVjdCB0aGUgY29ycmVjdCBncm91cCB0byBsb2cgaW4gdG8gZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIC8vIGdldCBncm91cHMgZm9yIGN1cnJlbnQgdXNlclxuICAgICAqICAgICAgdmFyIHNlc3Npb25PYmogPSBhdXRoTWdyLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgKiAgICAgIGF1dGhNZ3IuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogc2Vzc2lvbk9iai51c2VySWQsIHRva2VuOiBzZXNzaW9uT2JqLmF1dGhfdG9rZW4gfSlcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZ3JvdXBzKSB7XG4gICAgICogICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKylcbiAgICAgKiAgICAgICAgICAgICAgICAgIHsgY29uc29sZS5sb2coZ3JvdXBzW2ldLm5hbWUpOyB9XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIGdldCBncm91cHMgZm9yIHBhcnRpY3VsYXIgdXNlclxuICAgICAqICAgICAgYXV0aE1nci5nZXRVc2VyR3JvdXBzKHt1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB0b2tlbjogc2F2ZWRQcm9qQWNjZXNzVG9rZW4gfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgT2JqZWN0IHdpdGggYSB1c2VySWQgYW5kIHRva2VuIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmFtcy51c2VySWQgVGhlIHVzZXJJZC4gSWYgbG9va2luZyB1cCBncm91cHMgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIsIHRoaXMgaXMgaW4gdGhlIHNlc3Npb24gaW5mb3JtYXRpb24uIE90aGVyd2lzZSwgcGFzcyBhIHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyYW1zLnRva2VuIFRoZSBhdXRob3JpemF0aW9uIGNyZWRlbnRpYWxzIChhY2Nlc3MgdG9rZW4pIHRvIHVzZSBmb3IgY2hlY2tpbmcgdGhlIGdyb3VwcyBmb3IgdGhpcyB1c2VyLiBJZiBsb29raW5nIHVwIGdyb3VwcyBmb3IgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlciwgdGhpcyBpcyBpbiB0aGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi4gQSB0ZWFtIG1lbWJlcidzIHRva2VuIG9yIGEgcHJvamVjdCBhY2Nlc3MgdG9rZW4gY2FuIGFjY2VzcyBhbGwgdGhlIGdyb3VwcyBmb3IgYWxsIGVuZCB1c2VycyBpbiB0aGUgdGVhbSBvciBwcm9qZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXRVc2VyR3JvdXBzOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh7IHN1Y2Nlc3M6ICQubm9vcCB9LCBvcHRpb25zKTtcbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgb3V0U3VjY2VzcyA9IGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3M7XG5cbiAgICAgICAgYWRhcHRlck9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChtZW1iZXJJbmZvKSB7XG4gICAgICAgICAgICAvLyBUaGUgbWVtYmVyIEFQSSBpcyBhdCB0aGUgYWNjb3VudCBzY29wZSwgd2UgZmlsdGVyIGJ5IHByb2plY3RcbiAgICAgICAgICAgIGlmIChhZGFwdGVyT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgbWVtYmVySW5mbyA9ICQuZ3JlcChtZW1iZXJJbmZvLCBmdW5jdGlvbiAoZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnByb2plY3QgPT09IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW21lbWJlckluZm9dKTtcbiAgICAgICAgICAgICRkLnJlc29sdmUobWVtYmVySW5mbyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG1lbWJlckFkYXB0ZXIgPSBuZXcgTWVtYmVyQWRhcHRlcih7IHRva2VuOiBwYXJhbXMudG9rZW4sIHNlcnZlcjogYWRhcHRlck9wdGlvbnMuc2VydmVyIH0pO1xuICAgICAgICBtZW1iZXJBZGFwdGVyLmdldEdyb3Vwc0ZvclVzZXIocGFyYW1zLCBhZGFwdGVyT3B0aW9ucykuZmFpbCgkZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHNlc3Npb24gaW5mb3JtYXRpb24gZm9yIHRoZSBjdXJyZW50IHVzZXIsIGluY2x1ZGluZyB0aGUgYHVzZXJJZGAsIGBhY2NvdW50YCwgYHByb2plY3RgLCBgZ3JvdXBJZGAsIGBncm91cE5hbWVgLCBgaXNGYWNgICh3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBhIGZhY2lsaXRhdG9yIG9mIHRoaXMgZ3JvdXApLCBhbmQgYGF1dGhfdG9rZW5gICh1c2VyIGFjY2VzcyB0b2tlbikuXG4gICAgICpcbiAgICAgKiAqSW1wb3J0YW50KjogVGhpcyBtZXRob2QgaXMgc3luY2hyb25vdXMuIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIGlzIHJldHVybmVkIGltbWVkaWF0ZWx5IGluIGFuIG9iamVjdDsgbm8gY2FsbGJhY2tzIG9yIHByb21pc2VzIGFyZSBuZWVkZWQuXG4gICAgICpcbiAgICAgKiBTZXNzaW9uIGluZm9ybWF0aW9uIGlzIHN0b3JlZCBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHsgc3VjY2VzczogJC5ub29wIH0sIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBBZGRzIG9uZSBvciBtb3JlIGdyb3VwcyB0byB0aGUgY3VycmVudCBzZXNzaW9uLiBcbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGFzc3VtZXMgdGhhdCB0aGUgcHJvamVjdCBhbmQgZ3JvdXAgZXhpc3QgYW5kIHRoZSB1c2VyIHNwZWNpZmllZCBpbiB0aGUgc2Vzc2lvbiBpcyBwYXJ0IG9mIHRoaXMgcHJvamVjdCBhbmQgZ3JvdXAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBuZXcgc2Vzc2lvbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmFkZEdyb3Vwcyh7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9KTtcbiAgICAgKiAgICAgIGF1dGhNZ3IuYWRkR3JvdXBzKFt7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9LCB7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJy4uLicgfV0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge29iamVjdHxhcnJheX0gZ3JvdXBzIChSZXF1aXJlZCkgVGhlIGdyb3VwIG9iamVjdCBtdXN0IGNvbnRhaW4gdGhlIGBwcm9qZWN0YCAoKipQcm9qZWN0IElEKiopIGFuZCBgZ3JvdXBOYW1lYCBwcm9wZXJ0aWVzLiBJZiBwYXNzaW5nIGFuIGFycmF5IG9mIHN1Y2ggb2JqZWN0cywgYWxsIG9mIHRoZSBvYmplY3RzIG11c3QgY29udGFpbiAqZGlmZmVyZW50KiBgcHJvamVjdGAgKCoqUHJvamVjdCBJRCoqKSB2YWx1ZXM6IGFsdGhvdWdoIGVuZCB1c2VycyBtYXkgYmUgbG9nZ2VkIGluIHRvIG11bHRpcGxlIHByb2plY3RzIGF0IG9uY2UsIHRoZXkgbWF5IG9ubHkgYmUgbG9nZ2VkIGluIHRvIG9uZSBncm91cCBwZXIgcHJvamVjdCBhdCBhIHRpbWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwLmlzRmFjIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gYGZhbHNlYC4gU2V0IHRvIGB0cnVlYCBpZiB0aGUgdXNlciBpbiB0aGUgc2Vzc2lvbiBzaG91bGQgYmUgYSBmYWNpbGl0YXRvciBpbiB0aGlzIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cC5ncm91cElkIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gdW5kZWZpbmVkLiBOZWVkZWQgbW9zdGx5IGZvciB0aGUgTWVtYmVycyBBUEkuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgKi9cbiAgICBhZGRHcm91cHM6IGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGdyb3Vwcyk7XG4gICAgICAgIGdyb3VwcyA9IGlzQXJyYXkgPyBncm91cHMgOiBbZ3JvdXBzXTtcblxuICAgICAgICAkLmVhY2goZ3JvdXBzLCBmdW5jdGlvbiAoaW5kZXgsIGdyb3VwKSB7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kZWRHcm91cCA9ICQuZXh0ZW5kKHt9LCB7IGlzRmFjOiBmYWxzZSB9LCBncm91cCk7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGV4dGVuZGVkR3JvdXAucHJvamVjdDtcbiAgICAgICAgICAgIHZhciB2YWxpZFByb3BzID0gWydncm91cE5hbWUnLCAnZ3JvdXBJZCcsICdpc0ZhYyddO1xuICAgICAgICAgICAgaWYgKCFwcm9qZWN0IHx8ICFleHRlbmRlZEdyb3VwLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcHJvamVjdCBvciBncm91cE5hbWUgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZmlsdGVyIG9iamVjdFxuICAgICAgICAgICAgZXh0ZW5kZWRHcm91cCA9IF9waWNrKGV4dGVuZGVkR3JvdXAsIHZhbGlkUHJvcHMpO1xuICAgICAgICAgICAgc2Vzc2lvbi5ncm91cHNbcHJvamVjdF0gPSBleHRlbmRlZEdyb3VwO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogIyMgQ2hhbm5lbCBNYW5hZ2VyXG4gKlxuICogVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogSWYgeW91IGFyZSBkZXZlbG9waW5nIHdpdGggRXBpY2VudGVyLmpzLCB5b3Ugc2hvdWxkIHVzZSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSByYXRoZXIgdGhhbiB0aGlzIG1vcmUgZ2VuZXJpYyBDaGFubmVsIE1hbmFnZXIuIChUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgdGhhdCBpbnN0YW50aWF0ZXMgYSBDaGFubmVsIE1hbmFnZXIgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuKSBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBkb2N1bWVudGF0aW9uIGFsc28gaGFzIG1vcmUgW2JhY2tncm91bmRdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvI2JhY2tncm91bmQpIGluZm9ybWF0aW9uIG9uIGNoYW5uZWxzIGFuZCB0aGVpciB1c2UuIFxuICpcbiAqIEhvd2V2ZXIsIHlvdSBjYW4gd29yayBkaXJlY3RseSB3aXRoIHRoZSBDaGFubmVsIE1hbmFnZXIgaWYgeW91IGxpa2UuIChUaGlzIG1pZ2h0IGJlIHVzZWZ1bCBpZiB5b3UgYXJlIHdvcmtpbmcgdGhyb3VnaCBOb2RlLmpzLCBmb3IgZXhhbXBsZSwgYHJlcXVpcmUoJ21hbmFnZXIvY2hhbm5lbC1tYW5hZ2VyJylgLilcbiAqXG4gKiBUaGUgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciBhcm91bmQgdGhlIGRlZmF1bHQgW2NvbWV0ZCBKYXZhU2NyaXB0IGxpYnJhcnldKGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvMi9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sKSwgYCQuY29tZXRkYC4gSXQgcHJvdmlkZXMgYSBmZXcgbmljZSBmZWF0dXJlcyB0aGF0IGAkLmNvbWV0ZGAgZG9lc24ndCwgaW5jbHVkaW5nOlxuICpcbiAqICogQXV0b21hdGljIHJlLXN1YnNjcmlwdGlvbiB0byBjaGFubmVscyBpZiB5b3UgbG9zZSB5b3VyIGNvbm5lY3Rpb25cbiAqICogT25saW5lIC8gT2ZmbGluZSBub3RpZmljYXRpb25zXG4gKiAqICdFdmVudHMnIGZvciBjb21ldGQgbm90aWZpY2F0aW9ucyAoaW5zdGVhZCBvZiBoYXZpbmcgdG8gbGlzdGVuIG9uIHNwZWNpZmljIG1ldGEgY2hhbm5lbHMpXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyLiAoU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuKVxuICpcbiAqIFRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyIGluIGNsaWVudC1zaWRlIEphdmFTY3JpcHQsIGluc3RhbnRpYXRlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pLCBnZXQgYSBwYXJ0aWN1bGFyIGNoYW5uZWwgLS0gdGhhdCBpcywgYW4gaW5zdGFuY2Ugb2YgYSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSAtLSB0aGVuIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAqICAgICAgLy8gYmVjYXVzZSB3ZSB1c2VkIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgdG8gZ2V0IHRoZSBncm91cCBjaGFubmVsLFxuICogICAgICAvLyBzdWJzY3JpYmUoKSBhbmQgcHVibGlzaCgpIGhlcmUgZGVmYXVsdCB0byB0aGUgYmFzZSB0b3BpYyBmb3IgdGhlIGdyb3VwO1xuICogICAgICBnYy5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uKGRhdGEpIHsgY29uc29sZS5sb2coZGF0YSk7IH0pO1xuICogICAgICBnYy5wdWJsaXNoKCcnLCB7IG1lc3NhZ2U6ICdhIG5ldyBtZXNzYWdlIHRvIHRoZSBncm91cCcgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIE1hbmFnZXIgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIE1hbmFnZXIuIEJlc2lkZXMgdGhlIGNvbW1vbiBvcHRpb25zIGxpc3RlZCBoZXJlLCBzZWUgaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sIGZvciBvdGhlciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAqICogYG9wdGlvbnMudXJsYCBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAqICogYG9wdGlvbnMud2Vic29ja2V0RW5hYmxlZGAgV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUgKGJvb2xlYW4pLlxuICogKiBgb3B0aW9ucy5jaGFubmVsYCBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBDaGFubmVsIFNlcnZpY2UuIFNlZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSBmb3IgZGV0YWlscy5cbiAqXG4gKi9cblxudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBDaGFubmVsTWFuYWdlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCEkLmNvbWV0ZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbWV0ZCBsaWJyYXJ5IG5vdCBmb3VuZC4gUGxlYXNlIGluY2x1ZGUgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qcycpO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMudXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYW4gdXJsIGZvciB0aGUgY29tZXRkIHNlcnZlcicpO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBDb21ldGQgZW5kcG9pbnQgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGxvZyBsZXZlbCBmb3IgdGhlIGNoYW5uZWwgKGxvZ3MgdG8gY29uc29sZSkuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBsb2dMZXZlbDogJ2luZm8nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHdlYnNvY2tldCBzdXBwb3J0IGlzIGFjdGl2ZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHdlYnNvY2tldEVuYWJsZWQ6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIEFDSyBleHRlbnNpb24gaXMgZW5hYmxlZC4gRGVmYXVsdHMgdG8gYHRydWVgLiBTZWUgW2h0dHBzOi8vZG9jcy5jb21ldGQub3JnL2N1cnJlbnQvcmVmZXJlbmNlLyNfZXh0ZW5zaW9uc19hY2tub3dsZWRnZV0oaHR0cHM6Ly9kb2NzLmNvbWV0ZC5vcmcvY3VycmVudC9yZWZlcmVuY2UvI19leHRlbnNpb25zX2Fja25vd2xlZGdlKSBmb3IgbW9yZSBpbmZvLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGFja0VuYWJsZWQ6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGZhbHNlIGVhY2ggaW5zdGFuY2Ugb2YgQ2hhbm5lbCB3aWxsIGhhdmUgYSBzZXBhcmF0ZSBjb21ldGQgY29ubmVjdGlvbiB0byBzZXJ2ZXIsIHdoaWNoIGNvdWxkIGJlIG5vaXN5LiBTZXQgdG8gdHJ1ZSB0byByZS11c2UgdGhlIHNhbWUgY29ubmVjdGlvbiBhY3Jvc3MgaW5zdGFuY2VzLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHNoYXJlQ29ubmVjdGlvbjogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE90aGVyIGRlZmF1bHRzIHRvIHBhc3Mgb24gdG8gaW5zdGFuY2VzIG9mIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLCB3aGljaCBhcmUgY3JlYXRlZCB0aHJvdWdoIGBnZXRDaGFubmVsKClgLlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgY2hhbm5lbDoge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyB0byB0aGUgY2hhbm5lbCBoYW5kc2hha2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlLCB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSBwYXNzZXMgYGV4dGAgYW5kIGF1dGhvcml6YXRpb24gaW5mb3JtYXRpb24uIE1vcmUgaW5mb3JtYXRpb24gb24gcG9zc2libGUgb3B0aW9ucyBpcyBpbiB0aGUgZGV0YWlscyBvZiB0aGUgdW5kZXJseWluZyBbUHVzaCBDaGFubmVsIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvKS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGhhbmRzaGFrZTogdW5kZWZpbmVkXG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIGRlZmF1bHRDb21ldE9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0Q29tZXRPcHRpb25zO1xuXG4gICAgaWYgKGRlZmF1bHRDb21ldE9wdGlvbnMuc2hhcmVDb25uZWN0aW9uICYmIENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkKSB7XG4gICAgICAgIHRoaXMuY29tZXRkID0gQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgY29tZXRkID0gbmV3ICQuQ29tZXREKCk7XG4gICAgQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQgPSBjb21ldGQ7XG5cbiAgICBjb21ldGQud2Vic29ja2V0RW5hYmxlZCA9IGRlZmF1bHRDb21ldE9wdGlvbnMud2Vic29ja2V0RW5hYmxlZDtcbiAgICBjb21ldGQuYWNrRW5hYmxlZCA9IGRlZmF1bHRDb21ldE9wdGlvbnMuYWNrRW5hYmxlZDtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB2YXIgY29ubmVjdGlvbkJyb2tlbiA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignZGlzY29ubmVjdCcsIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgdmFyIGNvbm5lY3Rpb25TdWNjZWVkZWQgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nvbm5lY3QnLCBtZXNzYWdlKTtcbiAgICB9O1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICBjb21ldGQuY29uZmlndXJlKGRlZmF1bHRDb21ldE9wdGlvbnMpO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9jb25uZWN0JywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHdhc0Nvbm5lY3RlZCA9IHRoaXMuaXNDb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSAobWVzc2FnZS5zdWNjZXNzZnVsID09PSB0cnVlKTtcbiAgICAgICAgaWYgKCF3YXNDb25uZWN0ZWQgJiYgdGhpcy5pc0Nvbm5lY3RlZCkgeyAvL0Nvbm5lY3RpbmcgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgICBjb25uZWN0aW9uU3VjY2VlZGVkLmNhbGwodGhpcywgbWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAod2FzQ29ubmVjdGVkICYmICF0aGlzLmlzQ29ubmVjdGVkKSB7IC8vT25seSB0aHJvdyBkaXNjb25uZWN0ZWQgbWVzc2FnZSBmcm8gdGhlIGZpcnN0IGRpc2Nvbm5lY3QsIG5vdCBvbmNlIHBlciB0cnlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25Ccm9rZW4uY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2Rpc2Nvbm5lY3QnLCBjb25uZWN0aW9uQnJva2VuKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvaGFuZHNoYWtlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc3VjY2Vzc2Z1bCkge1xuICAgICAgICAgICAgLy9odHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0X3N1YnNjcmliZS5odG1sI2phdmFzY3JpcHRfc3Vic2NyaWJlX21ldGFfY2hhbm5lbHNcbiAgICAgICAgICAgIC8vIF4gXCJkeW5hbWljIHN1YnNjcmlwdGlvbnMgYXJlIGNsZWFyZWQgKGxpa2UgYW55IG90aGVyIHN1YnNjcmlwdGlvbikgYW5kIHRoZSBhcHBsaWNhdGlvbiBuZWVkcyB0byBmaWd1cmUgb3V0IHdoaWNoIGR5bmFtaWMgc3Vic2NyaXB0aW9uIG11c3QgYmUgcGVyZm9ybWVkIGFnYWluXCJcbiAgICAgICAgICAgIGNvbWV0ZC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJChtZS5jdXJyZW50U3Vic2NyaXB0aW9ucykuZWFjaChmdW5jdGlvbiAoaW5kZXgsIHN1YnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tZXRkLnJlc3Vic2NyaWJlKHN1YnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vT3RoZXIgaW50ZXJlc3RpbmcgZXZlbnRzIGZvciByZWZlcmVuY2VcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3N1YnNjcmliZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3N1YnNjcmliZScsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvdW5zdWJzY3JpYmUnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCd1bnN1YnNjcmliZScsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvcHVibGlzaCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3B1Ymxpc2gnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3Vuc3VjY2Vzc2Z1bCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ2Vycm9yJywgbWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICBjb21ldGQuaGFuZHNoYWtlKGRlZmF1bHRDb21ldE9wdGlvbnMuaGFuZHNoYWtlKTtcblxuICAgIHRoaXMuY29tZXRkID0gY29tZXRkO1xufTtcblxuXG5DaGFubmVsTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChDaGFubmVsTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBjaGFubmVsLCB0aGF0IGlzLCBhbiBpbnN0YW5jZSBvZiBhIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICAgdmFyIGNoYW5uZWwgPSBjbS5nZXRDaGFubmVsKCk7XG4gICAgICpcbiAgICAgKiAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCd0b3BpYycsIGNhbGxiYWNrKTtcbiAgICAgKiAgICAgIGNoYW5uZWwucHVibGlzaCgndG9waWMnLCB7IG15RGF0YTogMTAwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IG9wdGlvbnMgKE9wdGlvbmFsKSBJZiBzdHJpbmcsIGFzc3VtZWQgdG8gYmUgdGhlIGJhc2UgY2hhbm5lbCB1cmwuIElmIG9iamVjdCwgYXNzdW1lZCB0byBiZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0Q2hhbm5lbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy9JZiB5b3UganVzdCB3YW50IHRvIHBhc3MgaW4gYSBzdHJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgISQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBiYXNlOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydDogdGhpcy5jb21ldGRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5vcHRpb25zLmNoYW5uZWwsIGRlZmF1bHRzLCBvcHRpb25zKSk7XG5cblxuICAgICAgICAvL1dyYXAgc3VicyBhbmQgdW5zdWJzIHNvIHdlIGNhbiB1c2UgaXQgdG8gcmUtYXR0YWNoIGhhbmRsZXJzIGFmdGVyIGJlaW5nIGRpc2Nvbm5lY3RlZFxuICAgICAgICB2YXIgc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzdWJpZCA9IHN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMgPSB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLmNvbmNhdChzdWJpZCk7XG4gICAgICAgICAgICByZXR1cm4gc3ViaWQ7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuXG4gICAgICAgIHZhciB1bnN1YnMgPSBjaGFubmVsLnVuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSB1bnN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zW2ldLmlkID09PSByZW1vdmVkLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZW1vdmVkO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgZXZlbnRzIGFuZCBleGVjdXRlIGhhbmRsZXJzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhbm5lbE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogIyMgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlclxuICpcbiAqIFRoZSBFcGljZW50ZXIgcGxhdGZvcm0gcHJvdmlkZXMgYSBwdXNoIGNoYW5uZWwsIHdoaWNoIGFsbG93cyB5b3UgdG8gcHVibGlzaCBhbmQgc3Vic2NyaWJlIHRvIG1lc3NhZ2VzIHdpdGhpbiBhIFtwcm9qZWN0XSguLi8uLi8uLi9nbG9zc2FyeS8jcHJvamVjdHMpLCBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLCBvciBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkuXG4gKlxuICogPGEgbmFtZT1cImJhY2tncm91bmRcIj48L2E+XG4gKiAjIyMgQ2hhbm5lbCBCYWNrZ3JvdW5kXG4gKlxuICogQ2hhbm5lbCBub3RpZmljYXRpb25zIGFyZSBvbmx5IGF2YWlsYWJsZSBmb3IgW3RlYW0gcHJvamVjdHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKS4gVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIHB1c2ggY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiAjIyMjIEV2ZW50IE5vdGlmaWNhdGlvbnNcbiAqXG4gKiBXaXRoaW4gYSBbbXVsdGlwbGF5ZXIgc2ltdWxhdGlvbiBvciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKSwgaXQgaXMgb2Z0ZW4gdXNlZnVsIGZvciB5b3VyIHByb2plY3QncyBbbW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pIHRvIGFsZXJ0IHRoZSBbdXNlciBpbnRlcmZhY2UgKGJyb3dzZXIpXSguLi8uLi8uLi9jcmVhdGluZ195b3VyX2ludGVyZmFjZS8pIHRoYXQgc29tZXRoaW5nIG5ldyBoYXMgaGFwcGVuZWQuXG4gKlxuICogVXN1YWxseSwgdGhpcyBcInNvbWV0aGluZyBuZXdcIiBpcyBhbiBldmVudCB3aXRoaW4gdGhlIHByb2plY3QsIGdyb3VwLCBvciB3b3JsZCwgc3VjaCBhczpcbiAqXG4gKiAqIEFuIGVuZCB1c2VyIGNvbWVzIG9ubGluZSAobG9ncyBpbikgb3IgZ29lcyBvZmZsaW5lLiAoVGhpcyBpcyBlc3BlY2lhbGx5IGludGVyZXN0aW5nIGluIGEgbXVsdGlwbGF5ZXIgd29ybGQ7IG9ubHkgYXZhaWxhYmxlIGlmIHlvdSBoYXZlIFtlbmFibGVkIGF1dGhvcml6YXRpb25dKC4uLy4uLy4uL3VwZGF0aW5nX3lvdXJfc2V0dGluZ3MvI2dlbmVyYWwtc2V0dGluZ3MpIGZvciB0aGUgY2hhbm5lbC4pXG4gKiAqIEFuIGVuZCB1c2VyIGlzIGFzc2lnbmVkIHRvIGEgd29ybGQuXG4gKiAqIEFuIGVuZCB1c2VyIHVwZGF0ZXMgYSB2YXJpYWJsZSAvIG1ha2VzIGEgZGVjaXNpb24uXG4gKiAqIEFuIGVuZCB1c2VyIGNyZWF0ZXMgb3IgdXBkYXRlcyBkYXRhIHN0b3JlZCBpbiB0aGUgW0RhdGEgQVBJXSguLi9kYXRhLWFwaS1zZXJ2aWNlLykuXG4gKiAqIEFuIG9wZXJhdGlvbiAobWV0aG9kKSBpcyBjYWxsZWQuIChUaGlzIGlzIGVzcGVjaWFsbHkgaW50ZXJlc3RpbmcgaWYgdGhlIG1vZGVsIGlzIGFkdmFuY2VkLCBmb3IgaW5zdGFuY2UsIHRoZSBWZW5zaW0gYHN0ZXBgIG9wZXJhdGlvbiBpcyBjYWxsZWQuKVxuICpcbiAqIFdoZW4gdGhlc2UgZXZlbnRzIG9jY3VyLCB5b3Ugb2Z0ZW4gd2FudCB0byBoYXZlIHRoZSB1c2VyIGludGVyZmFjZSBmb3Igb25lIG9yIG1vcmUgZW5kIHVzZXJzIGF1dG9tYXRpY2FsbHkgdXBkYXRlIHdpdGggbmV3IGluZm9ybWF0aW9uLlxuICpcbiAqICMjIyMgQ2hhdCBNZXNzYWdlc1xuICpcbiAqIEFub3RoZXIgcmVhc29uIHRvIHVzZSB0aGUgcHVzaCBjaGFubmVsIGlzIHRvIGFsbG93IHBsYXllcnMgKGVuZCB1c2VycykgdG8gc2VuZCBjaGF0IG1lc3NhZ2VzIHRvIG90aGVyIHBsYXllcnMsIGFuZCB0byBoYXZlIHRob3NlIG1lc3NhZ2VzIGFwcGVhciBpbW1lZGlhdGVseS5cbiAqXG4gKiAjIyMjIEdldHRpbmcgU3RhcnRlZFxuICpcbiAqIEZvciBib3RoIHRoZSBldmVudCBub3RpZmljYXRpb24gYW5kIGNoYXQgbWVzc2FnZSB1c2UgY2FzZXM6XG4gKlxuICogKiBGaXJzdCwgZW5hYmxlIGNoYW5uZWwgbm90aWZpY2F0aW9ucyBmb3IgeW91ciBwcm9qZWN0LlxuICogICAgICAqIENoYW5uZWwgbm90aWZpY2F0aW9ucyBhcmUgb25seSBhdmFpbGFibGUgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkuIFRvIGVuYWJsZSBub3RpZmljYXRpb25zIGZvciB5b3VyIHByb2plY3QsIFt1cGRhdGUgeW91ciBwcm9qZWN0IHNldHRpbmdzXSguLi8uLi8uLi91cGRhdGluZ195b3VyX3NldHRpbmdzLyNnZW5lcmFsLXNldHRpbmdzKSB0byB0dXJuIG9uIHRoZSAqKlB1c2ggQ2hhbm5lbCoqIHNldHRpbmcsIGFuZCBvcHRpb25hbGx5IHJlcXVpcmUgYXV0aG9yaXphdGlvbiBmb3IgdGhlIGNoYW5uZWwuXG4gKiAqIFRoZW4sIGluc3RhbnRpYXRlIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIuXG4gKiAqIE5leHQsIGdldCB0aGUgY2hhbm5lbCB3aXRoIHRoZSBzY29wZSB5b3Ugd2FudCAodXNlciwgd29ybGQsIGdyb3VwLCBkYXRhKS5cbiAqICogRmluYWxseSwgdXNlIHRoZSBjaGFubmVsJ3MgYHN1YnNjcmliZSgpYCBhbmQgYHB1Ymxpc2goKWAgbWV0aG9kcyB0byBzdWJzY3JpYmUgdG8gdG9waWNzIG9yIHB1Ymxpc2ggZGF0YSB0byB0b3BpY3MuXG4gKlxuICogSGVyZSdzIGFuIGV4YW1wbGUgb2YgdGhvc2UgbGFzdCB0aHJlZSBzdGVwcyAoaW5zdGFudGlhdGUsIGdldCBjaGFubmVsLCBzdWJzY3JpYmUpOlxuICpcbiAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gKiAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gKiAgICAgZ2Muc3Vic2NyaWJlKCcnLCBmdW5jdGlvbihkYXRhKSB7IGNvbnNvbGUubG9nKGRhdGEpOyB9KTtcbiAqICAgICBnYy5wdWJsaXNoKCcnLCB7IG1lc3NhZ2U6ICdhIG5ldyBtZXNzYWdlIHRvIHRoZSBncm91cCcgfSk7XG4gKiBcbiAqIEZvciBhIG1vcmUgZGV0YWlsZWQgZXhhbXBsZSwgc2VlIGEgW2NvbXBsZXRlIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSBleGFtcGxlXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8jZXBpanMtZXhhbXBsZSkuXG4gKlxuICogRm9yIGRldGFpbHMgb24gd2hhdCBkYXRhIGlzIHB1Ymxpc2hlZCBhdXRvbWF0aWNhbGx5IHRvIHdoaWNoIGNoYW5uZWxzLCBzZWUgW0F1dG9tYXRpYyBQdWJsaXNoaW5nIG9mIEV2ZW50c10oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvI3B1Ymxpc2gtbWVzc2FnZS1hdXRvKS5cbiAqXG4gKiAjIyMjIENyZWF0aW5nIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJcbiAqXG4gKiBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgYXJvdW5kIHRoZSAobW9yZSBnZW5lcmljKSBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSwgdG8gaW5zdGFudGlhdGUgaXQgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuIElmIHlvdSBhcmUgaW50ZXJlc3RlZCBpbiBpbmNsdWRpbmcgYSBub3RpZmljYXRpb24gb3IgY2hhdCBmZWF0dXJlIGluIHlvdXIgcHJvamVjdCwgdXNpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gZ2V0IHN0YXJ0ZWQuXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlci4gU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuXG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpbmNsdWRlOlxuICpcbiAqICogYG9wdGlvbnNgIE9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIEVwaWNlbnRlciBwcm9qZWN0IGZvciB0aGlzIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaW5zdGFuY2UuXG4gKiAqIGBvcHRpb25zLmFjY291bnRgIFRoZSBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBvcHRpb25zLnByb2plY3RgIEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICogKiBgb3B0aW9ucy51c2VyTmFtZWAgRXBpY2VudGVyIHVzZXJOYW1lIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICogKiBgb3B0aW9ucy51c2VySWRgIEVwaWNlbnRlciB1c2VyIGlkIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLiBPcHRpb25hbDsgYG9wdGlvbnMudXNlck5hbWVgIGlzIHByZWZlcnJlZC5cbiAqICogYG9wdGlvbnMudG9rZW5gIEVwaWNlbnRlciB0b2tlbiB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi4gKFlvdSBjYW4gcmV0cmlldmUgdGhpcyB1c2luZyBgYXV0aE1hbmFnZXIuZ2V0VG9rZW4oKWAgZnJvbSB0aGUgW0F1dGhvcml6YXRpb24gTWFuYWdlcl0oLi4vYXV0aC1tYW5hZ2VyLykuKVxuICogKiBgb3B0aW9ucy5hbGxvd0FsbENoYW5uZWxzYCBJZiBub3QgaW5jbHVkZWQgb3IgaWYgc2V0IHRvIGBmYWxzZWAsIGFsbCBjaGFubmVsIHBhdGhzIGFyZSB2YWxpZGF0ZWQ7IGlmIHlvdXIgcHJvamVjdCByZXF1aXJlcyBbUHVzaCBDaGFubmVsIEF1dGhvcml6YXRpb25dKC4uLy4uLy4uL3VwZGF0aW5nX3lvdXJfc2V0dGluZ3MvKSwgeW91IHNob3VsZCB1c2UgdGhpcyBvcHRpb24uIElmIHlvdSB3YW50IHRvIGFsbG93IG90aGVyIGNoYW5uZWwgcGF0aHMsIHNldCB0byBgdHJ1ZWA7IHRoaXMgaXMgbm90IGNvbW1vbi5cbiAqL1xuXG52YXIgQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL2NoYW5uZWwtbWFuYWdlcicpO1xudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciB2YWxpZFR5cGVzID0ge1xuICAgIHByb2plY3Q6IHRydWUsXG4gICAgZ3JvdXA6IHRydWUsXG4gICAgd29ybGQ6IHRydWUsXG4gICAgdXNlcjogdHJ1ZSxcbiAgICBkYXRhOiB0cnVlLFxuICAgIGdlbmVyYWw6IHRydWUsXG4gICAgY2hhdDogdHJ1ZVxufTtcbnZhciBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IgPSBmdW5jdGlvbiAodmFsdWUsIHNlc3Npb25LZXlOYW1lLCBzZXR0aW5ncykge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgaWYgKHNldHRpbmdzICYmIHNldHRpbmdzW3Nlc3Npb25LZXlOYW1lXSkge1xuICAgICAgICAgICAgdmFsdWUgPSBzZXR0aW5nc1tzZXNzaW9uS2V5TmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc2Vzc2lvbktleU5hbWUgKyAnIG5vdCBmb3VuZC4gUGxlYXNlIGxvZy1pbiBhZ2Fpbiwgb3Igc3BlY2lmeSAnICsgc2Vzc2lvbktleU5hbWUgKyAnIGV4cGxpY2l0bHknKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgaXNQcmVzZW5jZURhdGEgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIHJldHVybiBwYXlsb2FkLmRhdGEgJiYgcGF5bG9hZC5kYXRhLnR5cGUgPT09ICd1c2VyJyAmJiBwYXlsb2FkLmRhdGEudXNlcjtcbn07XG5cbnZhciBfX3N1cGVyID0gQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlO1xudmFyIEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyID0gY2xhc3NGcm9tKENoYW5uZWxNYW5hZ2VyLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIob3B0aW9ucyk7XG4gICAgICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShkZWZhdWx0Q29tZXRPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgICAgICBpZiAoIWRlZmF1bHRDb21ldE9wdGlvbnMudXJsKSB7XG4gICAgICAgICAgICBkZWZhdWx0Q29tZXRPcHRpb25zLnVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdjaGFubmVsJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVmYXVsdENvbWV0T3B0aW9ucy5oYW5kc2hha2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHVzZXJOYW1lID0gZGVmYXVsdENvbWV0T3B0aW9ucy51c2VyTmFtZTtcbiAgICAgICAgICAgIHZhciB1c2VySWQgPSBkZWZhdWx0Q29tZXRPcHRpb25zLnVzZXJJZDtcbiAgICAgICAgICAgIHZhciB0b2tlbiA9IGRlZmF1bHRDb21ldE9wdGlvbnMudG9rZW47XG4gICAgICAgICAgICBpZiAoKHVzZXJOYW1lIHx8IHVzZXJJZCkgJiYgdG9rZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlclByb3AgPSB1c2VyTmFtZSA/ICd1c2VyTmFtZScgOiAndXNlcklkJztcbiAgICAgICAgICAgICAgICB2YXIgZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICBhdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tlblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZXh0W3VzZXJQcm9wXSA9IHVzZXJOYW1lID8gdXNlck5hbWUgOiB1c2VySWQ7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0Q29tZXRPcHRpb25zLmhhbmRzaGFrZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXh0OiBleHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdENvbWV0T3B0aW9ucztcbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBkZWZhdWx0Q29tZXRPcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIGNoYW5uZWwsIHRoYXQgaXMsIGFuIGluc3RhbmNlIG9mIGEgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBlbmZvcmNlcyBFcGljZW50ZXItc3BlY2lmaWMgY2hhbm5lbCBuYW1pbmc6IGFsbCBjaGFubmVscyByZXF1ZXN0ZWQgbXVzdCBiZSBpbiB0aGUgZm9ybSBgL3t0eXBlfS97YWNjb3VudCBpZH0ve3Byb2plY3QgaWR9L3suLi59YCwgd2hlcmUgYHR5cGVgIGlzIG9uZSBvZiBgcnVuYCwgYGRhdGFgLCBgdXNlcmAsIGB3b3JsZGAsIG9yIGBjaGF0YC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuRXBpY2VudGVyQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgIHZhciBjaGFubmVsID0gY20uZ2V0Q2hhbm5lbCgnL2dyb3VwL2FjbWUvc3VwcGx5LWNoYWluLWdhbWUvJyk7XG4gICAgICpcbiAgICAgKiAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCd0b3BpYycsIGNhbGxiYWNrKTtcbiAgICAgKiAgICAgIGNoYW5uZWwucHVibGlzaCgndG9waWMnLCB7IG15RGF0YTogMTAwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IG9wdGlvbnMgKE9wdGlvbmFsKSBJZiBzdHJpbmcsIGFzc3VtZWQgdG8gYmUgdGhlIGJhc2UgY2hhbm5lbCB1cmwuIElmIG9iamVjdCwgYXNzdW1lZCB0byBiZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0Q2hhbm5lbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGJhc2U6IG9wdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoYW5uZWxPcHRzID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHZhciBiYXNlID0gY2hhbm5lbE9wdHMuYmFzZTtcbiAgICAgICAgaWYgKCFiYXNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGJhc2UgdG9waWMgd2FzIHByb3ZpZGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNoYW5uZWxPcHRzLmFsbG93QWxsQ2hhbm5lbHMpIHtcbiAgICAgICAgICAgIHZhciBiYXNlUGFydHMgPSBiYXNlLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICB2YXIgY2hhbm5lbFR5cGUgPSBiYXNlUGFydHNbMV07XG4gICAgICAgICAgICBpZiAoYmFzZVBhcnRzLmxlbmd0aCA8IDQpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNoYW5uZWwgYmFzZSBuYW1lLCBpdCBtdXN0IGJlIGluIHRoZSBmb3JtIC97dHlwZX0ve2FjY291bnQgaWR9L3twcm9qZWN0IGlkfS97Li4ufScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF2YWxpZFR5cGVzW2NoYW5uZWxUeXBlXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsIHR5cGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBnaXZlbiBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLiBUaGUgZ3JvdXAgbXVzdCBleGlzdCBpbiB0aGUgYWNjb3VudCAodGVhbSkgYW5kIHByb2plY3QgcHJvdmlkZWQuXG4gICAgICpcbiAgICAgKiBUaGVyZSBhcmUgbm8gbm90aWZpY2F0aW9ucyBmcm9tIEVwaWNlbnRlciBvbiB0aGlzIGNoYW5uZWw7IGFsbCBtZXNzYWdlcyBhcmUgdXNlci1vcmlnaW5hdGVkLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBnYyA9IGNtLmdldEdyb3VwQ2hhbm5lbCgpO1xuICAgICAqICAgICBnYy5zdWJzY3JpYmUoJ2Jyb2FkY2FzdHMnLCBjYWxsYmFjayk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdG8gYnJvYWRjYXN0IHRvLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0R3JvdXBDaGFubmVsOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50Jywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHNlc3Npb24pO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9ncm91cCcsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZV0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuICAgICAgICB2YXIgb2xkc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICh0b3BpYywgY2FsbGJhY2ssIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja1dpdGhvdXRQcmVzZW5jZURhdGEgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIGlmICghaXNQcmVzZW5jZURhdGEocGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG9sZHN1YnMuY2FsbChjaGFubmVsLCB0b3BpYywgY2FsbGJhY2tXaXRob3V0UHJlc2VuY2VEYXRhLCBjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBnaXZlbiBbd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIHR5cGljYWxseSB1c2VkIHRvZ2V0aGVyIHdpdGggdGhlIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgd29ybGRNYW5hZ2VyID0gbmV3IEYubWFuYWdlci5Xb3JsZE1hbmFnZXIoe1xuICAgICAqICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAqICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgKiAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAqICAgICAgICAgcnVuOiB7IG1vZGVsOiAnbW9kZWwuZXFuJyB9XG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkQWRhcHRlcikge1xuICAgICAqICAgICAgICAgdmFyIHdvcmxkQ2hhbm5lbCA9IGNtLmdldFdvcmxkQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICB3b3JsZENoYW5uZWwuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gd29ybGQgVGhlIHdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIEdyb3VwIHRoZSB3b3JsZCBleGlzdHMgaW4uIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgZ3JvdXAgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXRXb3JsZENoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50Jywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHNlc3Npb24pO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy93b3JsZCcsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBjdXJyZW50IFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpbiB0aGF0IHVzZXIncyBjdXJyZW50IFt3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdHlwaWNhbGx5IHVzZWQgdG9nZXRoZXIgd2l0aCB0aGUgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIpLiBOb3RlIHRoYXQgdGhpcyBjaGFubmVsIG9ubHkgZ2V0cyBub3RpZmljYXRpb25zIGZvciB3b3JsZHMgY3VycmVudGx5IGluIG1lbW9yeS4gKFNlZSBtb3JlIGJhY2tncm91bmQgb24gW3BlcnNpc3RlbmNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UpLilcbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgd29ybGRNYW5hZ2VyID0gbmV3IEYubWFuYWdlci5Xb3JsZE1hbmFnZXIoe1xuICAgICAqICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAqICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgKiAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAqICAgICAgICAgcnVuOiB7IG1vZGVsOiAnbW9kZWwuZXFuJyB9XG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkQWRhcHRlcikge1xuICAgICAqICAgICAgICAgdmFyIHVzZXJDaGFubmVsID0gY20uZ2V0VXNlckNoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgdXNlckNoYW5uZWwuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCBXb3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gdXNlciAoT3B0aW9uYWwpIFVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldFVzZXJDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIHVzZXIsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgdXNlcmlkID0gKCQuaXNQbGFpbk9iamVjdCh1c2VyKSAmJiB1c2VyLmlkKSA/IHVzZXIuaWQgOiB1c2VyO1xuICAgICAgICB1c2VyaWQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IodXNlcmlkLCAndXNlcklkJywgc2Vzc2lvbik7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3VzZXInLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWQsIHVzZXJpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgdGhhdCBhdXRvbWF0aWNhbGx5IHRyYWNrcyB0aGUgcHJlc2VuY2Ugb2YgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGF0IGlzLCB3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBjdXJyZW50bHkgb25saW5lIGluIHRoaXMgZ3JvdXAuIE5vdGlmaWNhdGlvbnMgYXJlIGF1dG9tYXRpY2FsbHkgc2VudCB3aGVuIHRoZSBlbmQgdXNlciBjb21lcyBvbmxpbmUsIGFuZCB3aGVuIHRoZSBlbmQgdXNlciBnb2VzIG9mZmxpbmUgKG5vdCBwcmVzZW50IGZvciBtb3JlIHRoYW4gMiBtaW51dGVzKS4gVXNlZnVsIGluIG11bHRpcGxheWVyIGdhbWVzIGZvciBsZXR0aW5nIGVhY2ggZW5kIHVzZXIga25vdyB3aGV0aGVyIG90aGVyIHVzZXJzIGluIHRoZWlyIGdyb3VwIGFyZSBhbHNvIG9ubGluZS5cbiAgICAgKlxuICAgICAqIE5vdGUgdGhhdCB0aGUgcHJlc2VuY2UgY2hhbm5lbCBpcyB0cmFja2luZyBhbGwgZW5kIHVzZXJzIGluIGEgZ3JvdXAuIEluIHBhcnRpY3VsYXIsIGlmIHRoZSBwcm9qZWN0IGFkZGl0aW9uYWxseSBzcGxpdHMgZWFjaCBncm91cCBpbnRvIFt3b3JsZHNdKC4uL3dvcmxkLW1hbmFnZXIvKSwgdGhpcyBjaGFubmVsIGNvbnRpbnVlcyB0byBzaG93IG5vdGlmaWNhdGlvbnMgZm9yIGFsbCBlbmQgdXNlcnMgaW4gdGhlIGdyb3VwIChub3QgcmVzdHJpY3RlZCBieSB3b3JsZHMpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBwYyA9IGNtLmdldFByZXNlbmNlQ2hhbm5lbCgpOyBcbiAgICAgKiAgICAgcGMuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgIC8vICdkYXRhJyBpcyB0aGUgZW50aXJlIG1lc3NhZ2Ugb2JqZWN0IHRvIHRoZSBjaGFubmVsOyBcbiAgICAgKiAgICAgICAgICAvLyBwYXJzZSBmb3IgaW5mb3JtYXRpb24gb2YgaW50ZXJlc3RcbiAgICAgKiAgICAgICAgICBpZiAoZGF0YS5kYXRhLnN1YlR5cGUgPT09ICdkaXNjb25uZWN0Jykge1xuICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzZXIgJywgZGF0YS5kYXRhLnVzZXIudXNlck5hbWUsICdkaXNjb25uZWN0ZWQgYXQgJywgZGF0YS5kYXRhLmRhdGUpO1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgICAgICBpZiAoZGF0YS5kYXRhLnN1YlR5cGUgPT09ICdjb25uZWN0Jykge1xuICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzZXIgJywgZGF0YS5kYXRhLnVzZXIudXNlck5hbWUsICdjb25uZWN0ZWQgYXQgJywgZGF0YS5kYXRhLmRhdGUpO1xuICAgICAqICAgICAgICAgIH1cbiAgICAgKiAgICAgfSk7XG4gICAgICpcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgZW5kIHVzZXIgaXMgaW4uIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgZ3JvdXAgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXRQcmVzZW5jZUNoYW5uZWw6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHNlc3Npb24pO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL2dyb3VwJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lXS5qb2luKCcvJyk7XG4gICAgICAgIHZhciBjaGFubmVsID0gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgICAgIHZhciBvbGRzdWJzID0gY2hhbm5lbC5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrV2l0aE9ubHlQcmVzZW5jZURhdGEgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1ByZXNlbmNlRGF0YShwYXlsb2FkKSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhPbmx5UHJlc2VuY2VEYXRhLCBjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBnaXZlbiBjb2xsZWN0aW9uLiAoVGhlIGNvbGxlY3Rpb24gbmFtZSBpcyBzcGVjaWZpZWQgaW4gdGhlIGByb290YCBhcmd1bWVudCB3aGVuIHRoZSBbRGF0YSBTZXJ2aWNlXSguLi9kYXRhLWFwaS1zZXJ2aWNlLykgaXMgaW5zdGFudGlhdGVkLikgTXVzdCBiZSBvbmUgb2YgdGhlIGNvbGxlY3Rpb25zIGluIHRoaXMgYWNjb3VudCAodGVhbSkgYW5kIHByb2plY3QuXG4gICAgICpcbiAgICAgKiBUaGVyZSBhcmUgYXV0b21hdGljIG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsIHdoZW4gZGF0YSBpcyBjcmVhdGVkLCB1cGRhdGVkLCBvciBkZWxldGVkIGluIHRoaXMgY29sbGVjdGlvbi4gU2VlIG1vcmUgb24gW2F1dG9tYXRpYyBtZXNzYWdlcyB0byB0aGUgZGF0YSBjaGFubmVsXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8jZGF0YS1tZXNzYWdlcykuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIGRjID0gY20uZ2V0RGF0YUNoYW5uZWwoJ3N1cnZleS1yZXNwb25zZXMnKTtcbiAgICAgKiAgICAgZGMuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbihkYXRhLCBtZXRhKSB7XG4gICAgICogICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLmRhdGUgaXMgdGltZSBvZiBjaGFuZ2UsXG4gICAgICogICAgICAgICAgLy8gbWV0YS5zdWJUeXBlIGlzIHRoZSBraW5kIG9mIGNoYW5nZTogbmV3LCB1cGRhdGUsIG9yIGRlbGV0ZVxuICAgICAqICAgICAgICAgIC8vIG1ldGEucGF0aCBpcyB0aGUgZnVsbCBwYXRoIHRvIHRoZSBjaGFuZ2VkIGRhdGFcbiAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhtZXRhKTtcbiAgICAgKiAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gY29sbGVjdGlvbiBOYW1lIG9mIGNvbGxlY3Rpb24gd2hvc2UgYXV0b21hdGljIG5vdGlmaWNhdGlvbnMgeW91IHdhbnQgdG8gcmVjZWl2ZS5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0RGF0YUNoYW5uZWw6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIGNvbGxlY3Rpb24gdG8gbGlzdGVuIG9uLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50Jywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvZGF0YScsIGFjY291bnQsIHByb2plY3QsIGNvbGxlY3Rpb25dLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcblxuICAgICAgICAvL1RPRE86IEZpeCBhZnRlciBFcGljZW50ZXIgYnVnIGlzIHJlc29sdmVkXG4gICAgICAgIHZhciBvbGRzdWJzID0gY2hhbm5lbC5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrV2l0aENsZWFuRGF0YSA9IGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1ldGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHBheWxvYWQuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgc3ViVHlwZTogcGF5bG9hZC5kYXRhLnN1YlR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGU6IHBheWxvYWQuZGF0YS5kYXRlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhUGF0aDogcGF5bG9hZC5kYXRhLmRhdGEucGF0aCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxEYXRhID0gcGF5bG9hZC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbERhdGEuZGF0YSkgeyAvL0RlbGV0ZSBub3RpZmljYXRpb25zIGFyZSBvbmUgZGF0YS1sZXZlbCBiZWhpbmQgb2YgY291cnNlXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbERhdGEgPSBhY3R1YWxEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBhY3R1YWxEYXRhLCBtZXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhDbGVhbkRhdGEsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUElfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXJqcy5zZXNzaW9uJyxcbiAgICBTVFJBVEVHWV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07IiwiLyoqXG4qICMjIFJ1biBNYW5hZ2VyXG4qXG4qIFRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgYWNjZXNzIHRvIHJ1bnMgZm9yIHlvdXIgcHJvamVjdC4gVGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgYW5kIHVwZGF0ZSB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLiBBZGRpdGlvbmFsbHksIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy4gU3BlY2lmaWNhbGx5LCB5b3UgY2FuIHNlbGVjdCBbcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKV0oLi4vc3RyYXRlZ2llcy8pIGZvciB3aGljaCBydW5zIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3Qgd29yayB3aXRoIHdoZW4gdGhleSBsb2cgaW4gdG8geW91ciBwcm9qZWN0LlxuKlxuKiBUaGVyZSBhcmUgbWFueSB3YXlzIHRvIGNyZWF0ZSBuZXcgcnVucywgaW5jbHVkaW5nIHRoZSBFcGljZW50ZXIuanMgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBhbmQgdGhlIFJFU0ZUZnVsIFtSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkpLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sOiB5b3VyIGNhbGwgdG8gYGdldFJ1bigpYCwgcmF0aGVyIHRoYW4gYWx3YXlzIHJldHVybmluZyBhIG5ldyBydW4sIHJldHVybnMgYSBydW4gYmFzZWQgb24gdGhlIHN0cmF0ZWd5IHlvdSd2ZSBzcGVjaWZpZWQuXG4qXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gY3JlYXRlIGFuZCBhY2Nlc3MgcnVuc1xuKlxuKiBUbyB1c2UgdGhlIFJ1biBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCBieSBwYXNzaW5nIGluOlxuKlxuKiAgICogYHJ1bmA6IChyZXF1aXJlZCkgUnVuIG9iamVjdC4gTXVzdCBjb250YWluOlxuKiAgICAgICAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICAgICAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4qICAgICAgICogYG1vZGVsYDogVGhlIG5hbWUgb2YgeW91ciBwcmltYXJ5IG1vZGVsIGZpbGUuIChTZWUgbW9yZSBvbiBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4pXG4qICAgICAgICogYHNjb3BlYDogKG9wdGlvbmFsKSBTY29wZSBvYmplY3QgZm9yIHRoZSBydW4sIGZvciBleGFtcGxlIGBzY29wZS5ncm91cGAgd2l0aCB2YWx1ZSBvZiB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAuXG4qICAgICAgICogYHNlcnZlcmA6IChvcHRpb25hbCkgQW4gb2JqZWN0IHdpdGggb25lIGZpZWxkLCBgaG9zdGAuIFRoZSB2YWx1ZSBvZiBgaG9zdGAgaXMgdGhlIHN0cmluZyBgYXBpLmZvcmlvLmNvbWAsIHRoZSBVUkkgb2YgdGhlIEZvcmlvIHNlcnZlci4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCwgYnV0IHlvdSBjYW4gcGFzcyBpdCBleHBsaWNpdGx5IGlmIGRlc2lyZWQuIEl0IGlzIG1vc3QgY29tbW9ubHkgdXNlZCBmb3IgY2xhcml0eSB3aGVuIHlvdSBhcmUgW2hvc3RpbmcgYW4gRXBpY2VudGVyIHByb2plY3Qgb24geW91ciBvd24gc2VydmVyXSguLi8uLi8uLi9ob3dfdG8vc2VsZl9ob3N0aW5nLykuXG4qICAgICAgICogYGZpbGVzYDogKG9wdGlvbmFsKSBJZiBhbmQgb25seSBpZiB5b3UgYXJlIHVzaW5nIGEgVmVuc2ltIG1vZGVsIGFuZCB5b3UgaGF2ZSBhZGRpdGlvbmFsIGRhdGEgdG8gcGFzcyBpbiB0byB5b3VyIG1vZGVsLCB5b3UgY2FuIG9wdGlvbmFsbHkgcGFzcyBhIGBmaWxlc2Agb2JqZWN0IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBmaWxlcywgZm9yIGV4YW1wbGU6IGBcImZpbGVzXCI6IHtcImRhdGFcIjogXCJteUV4dHJhRGF0YS54bHNcIn1gLiAoU2VlIG1vcmUgb24gW1VzaW5nIEV4dGVybmFsIERhdGEgaW4gVmVuc2ltXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS92ZW5zaW1fZXhhbXBsZV94bHMvKS4pXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBUaGlzIGlzICpvcHRpb25hbCo7IGJ5IGRlZmF1bHQsIHRoZSBSdW4gTWFuYWdlciBzZWxlY3RzIGByZXVzZS1wZXItc2Vzc2lvbmAsIG9yIGByZXVzZS1sYXN0LWluaXRpYWxpemVkYCBpZiB5b3UgYWxzbyBwYXNzIGluIGFuIGluaXRpYWwgb3BlcmF0aW9uLiBTZWUgW2JlbG93XSgjdXNpbmctdGhlLXJ1bi1tYW5hZ2VyLXRvLWFjY2Vzcy1hbmQtcmVnaXN0ZXItc3RyYXRlZ2llcykgZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gc3RyYXRlZ2llcy5cbipcbiogICAqIGBzdHJhdGVneU9wdGlvbnNgOiAob3B0aW9uYWwpIEFkZGl0aW9uYWwgb3B0aW9ucyBwYXNzZWQgZGlyZWN0bHkgdG8gdGhlIFtydW4gY3JlYXRpb24gc3RyYXRlZ3ldKC4uL3N0cmF0ZWdpZXMvKS5cbipcbiogICAqIGBzZXNzaW9uS2V5YDogKG9wdGlvbmFsKSBOYW1lIG9mIGJyb3dzZXIgY29va2llIGluIHdoaWNoIHRvIHN0b3JlIHJ1biBpbmZvcm1hdGlvbiwgaW5jbHVkaW5nIHJ1biBpZC4gTWFueSBjb25kaXRpb25hbCBzdHJhdGVnaWVzLCBpbmNsdWRpbmcgdGhlIHByb3ZpZGVkIHN0cmF0ZWdpZXMsIHJlbHkgb24gdGhpcyBicm93c2VyIGNvb2tpZSB0byBzdG9yZSB0aGUgcnVuIGlkIGFuZCBoZWxwIG1ha2UgdGhlIGRlY2lzaW9uIG9mIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lLiBUaGUgbmFtZSBvZiB0aGlzIGNvb2tpZSBkZWZhdWx0cyB0byBgZXBpY2VudGVyLXNjZW5hcmlvYCBhbmQgY2FuIGJlIHNldCB3aXRoIHRoZSBgc2Vzc2lvbktleWAgcGFyYW1ldGVyLiBUaGlzIGNhbiBhbHNvIGJlIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHN0cmluZywgaWYgeW91J2QgbGlrZSB0byBjb250cm9sIHRoaXMgYXQgcnVudGltZS5cbipcbipcbiogQWZ0ZXIgaW5zdGFudGlhdGluZyBhIFJ1biBNYW5hZ2VyLCBtYWtlIGEgY2FsbCB0byBgZ2V0UnVuKClgIHdoZW5ldmVyIHlvdSBuZWVkIHRvIGFjY2VzcyBhIHJ1biBmb3IgdGhpcyBlbmQgdXNlci4gVGhlIGBSdW5NYW5hZ2VyLnJ1bmAgY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBbUnVuIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLiBUaGUgUnVuIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBhY2Nlc3MgdmFyaWFibGVzLCBjYWxsIG9wZXJhdGlvbnMsIGV0Yy5cbipcbiogKipFeGFtcGxlKipcbipcbiogICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiogICAgICAgICAgIHJ1bjoge1xuKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJyxcbiogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiogICAgICAgICAgIH0sXG4qICAgICAgICAgICBzdHJhdGVneTogJ3JldXNlLW5ldmVyJyxcbiogICAgICAgICAgIHNlc3Npb25LZXk6ICdlcGljZW50ZXItc2Vzc2lvbidcbiogICAgICAgfSk7XG4qICAgICAgIHJtLmdldFJ1bigpXG4qICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiogICAgICAgICAgICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIGdldFJ1bigpIGlzIGEgcnVuIG9iamVjdFxuKiAgICAgICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4qICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGFsc28gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiogICAgICAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4qICAgICAgIH0pXG4qXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gYWNjZXNzIGFuZCByZWdpc3RlciBzdHJhdGVnaWVzXG4qXG4qIFRoZSBgc3RyYXRlZ3lgIGZvciBhIFJ1biBNYW5hZ2VyIGRlc2NyaWJlcyB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4gYW5kIHdoZW4gdG8gcmV1c2UgYW4gZW5kIHVzZXIncyBleGlzdGluZyBydW4uIFRoZSBSdW4gTWFuYWdlciBpcyByZXNwb25zaWJsZSBmb3IgcGFzc2luZyBhIHN0cmF0ZWd5IGV2ZXJ5dGhpbmcgaXQgbWlnaHQgbmVlZCB0byBkZXRlcm1pbmUgdGhlICdjb3JyZWN0JyBydW4sIHRoYXQgaXMsIGhvdyB0byBmaW5kIHRoZSBiZXN0IGV4aXN0aW5nIHJ1biBhbmQgaG93IHRvIGRlY2lkZSB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4uXG4qXG4qIFRoZXJlIGFyZSBzZXZlcmFsIGNvbW1vbiBzdHJhdGVnaWVzIHByb3ZpZGVkIGFzIHBhcnQgb2YgRXBpY2VudGVyLmpzLCB3aGljaCB5b3UgY2FuIGxpc3QgYnkgYWNjZXNzaW5nIGBGLm1hbmFnZXIuUnVuTWFuYWdlci5zdHJhdGVnaWVzYC4gWW91IGNhbiBhbHNvIGNyZWF0ZSB5b3VyIG93biBzdHJhdGVnaWVzLCBhbmQgcmVnaXN0ZXIgdGhlbSB0byB1c2Ugd2l0aCBSdW4gTWFuYWdlcnMuIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pIGZvciBkZXRhaWxzLlxuKiBcbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBzdHJhdGVnaWVzID0gcmVxdWlyZSgnLi9ydW4tc3RyYXRlZ2llcycpO1xudmFyIHNwZWNpYWxPcGVyYXRpb25zID0gcmVxdWlyZSgnLi9zcGVjaWFsLW9wZXJhdGlvbnMnKTtcblxudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi9rZXktbmFtZXMnKTtcblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5mdW5jdGlvbiBzZXNzaW9uS2V5RnJvbU9wdGlvbnMob3B0aW9ucykge1xuICAgIHZhciBzZXNzaW9uS2V5ID0gJC5pc0Z1bmN0aW9uKG9wdGlvbnMuc2Vzc2lvbktleSkgPyBvcHRpb25zLnNlc3Npb25LZXkoKSA6IG9wdGlvbnMuc2Vzc2lvbktleTtcbiAgICByZXR1cm4gc2Vzc2lvbktleTtcbn1cblxuZnVuY3Rpb24gc2V0UnVuSW5TZXNzaW9uKHNlc3Npb25LZXksIHJ1biwgc2Vzc2lvbk1hbmFnZXIpIHtcbiAgICBpZiAoc2Vzc2lvbktleSkge1xuICAgICAgICBkZWxldGUgcnVuLnZhcmlhYmxlcztcbiAgICAgICAgc2Vzc2lvbk1hbmFnZXIuZ2V0U3RvcmUoKS5zZXQoc2Vzc2lvbktleSwgSlNPTi5zdHJpbmdpZnkocnVuKSk7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgc2Vzc2lvbktleToga2V5TmFtZXMuU1RSQVRFR1lfU0VTU0lPTl9LRVksXG59O1xuXG5mdW5jdGlvbiBSdW5NYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMucnVuID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9IGVsc2UgaWYgKCF1dGlsLmlzRW1wdHkodGhpcy5vcHRpb25zLnJ1bikpIHtcbiAgICAgICAgdGhpcy5ydW4gPSBuZXcgUnVuU2VydmljZSh0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJ1biBvcHRpb25zIHBhc3NlZCB0byBSdW5NYW5hZ2VyJyk7XG4gICAgfVxuICAgIHBhdGNoUnVuU2VydmljZSh0aGlzLnJ1biwgdGhpcyk7XG5cbiAgICB0aGlzLnN0cmF0ZWd5ID0gc3RyYXRlZ2llcy5nZXRCZXN0U3RyYXRlZ3kodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKHRoaXMub3B0aW9ucyk7XG59XG5cblJ1bk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIHRoZSAnY29ycmVjdCcgcnVuLiBUaGUgY29ycmVjdCBydW4gaXMgZGVmaW5lZCBieSB0aGUgc3RyYXRlZ3kuIFxuICAgICAqXG4gICAgICogRm9yIGV4YW1wbGUsIGlmIHRoZSBzdHJhdGVneSBpcyBgcmV1c2UtbmV2ZXJgLCB0aGUgY2FsbFxuICAgICAqIHRvIGBnZXRSdW4oKWAgYWx3YXlzIHJldHVybnMgYSBuZXdseSBjcmVhdGVkIHJ1bjsgaWYgdGhlIHN0cmF0ZWd5IGlzIGByZXVzZS1wZXItc2Vzc2lvbmAsXG4gICAgICogYGdldFJ1bigpYCByZXR1cm5zIHRoZSBydW4gY3VycmVudGx5IHJlZmVyZW5jZWQgaW4gdGhlIGJyb3dzZXIgY29va2llLCBhbmQgaWYgdGhlcmUgaXMgbm9uZSwgY3JlYXRlcyBhIG5ldyBydW4uIFxuICAgICAqIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pIGZvciBtb3JlIG9uIHN0cmF0ZWdpZXMuXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0uZ2V0UnVuKCkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBydW4gb2JqZWN0XG4gICAgICogICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgUnVuIFNlcnZpY2Ugb2JqZWN0XG4gICAgICogICAgICAgICAgcm0ucnVuLmRvKCdydW5Nb2RlbCcpO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIHJtLmdldFJ1bihbJ3NhbXBsZV9pbnQnXSkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAvLyBhbiBvYmplY3Qgd2hvc2UgZmllbGRzIGFyZSB0aGUgbmFtZSA6IHZhbHVlIHBhaXJzIG9mIHRoZSB2YXJpYWJsZXMgcGFzc2VkIHRvIGdldFJ1bigpXG4gICAgICogICAgICAgICBjb25zb2xlLmxvZyhydW4udmFyaWFibGVzKTtcbiAgICAgKiAgICAgICAgIC8vIHRoZSB2YWx1ZSBvZiBzYW1wbGVfaW50XG4gICAgICogICAgICAgICBjb25zb2xlLmxvZyhydW4udmFyaWFibGVzLnNhbXBsZV9pbnQpOyBcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gdmFyaWFibGVzIChPcHRpb25hbCkgVGhlIHJ1biBvYmplY3QgaXMgcG9wdWxhdGVkIHdpdGggdGhlIHByb3ZpZGVkIG1vZGVsIHZhcmlhYmxlcywgaWYgcHJvdmlkZWQuIE5vdGU6IGBnZXRSdW4oKWAgZG9lcyBub3QgdGhyb3cgYW4gZXJyb3IgaWYgeW91IHRyeSB0byBnZXQgYSB2YXJpYWJsZSB3aGljaCBkb2Vzbid0IGV4aXN0LiBJbnN0ZWFkLCB0aGUgdmFyaWFibGVzIGxpc3QgaXMgZW1wdHksIGFuZCBhbnkgZXJyb3JzIGFyZSBsb2dnZWQgdG8gdGhlIGNvbnNvbGUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBDb25maWd1cmF0aW9uIG9wdGlvbnM7IHBhc3NlZCBvbiB0byBbUnVuU2VydmljZSNjcmVhdGVdKC4uL3J1bi1hcGktc2VydmljZS8jY3JlYXRlKSBpZiB0aGUgc3RyYXRlZ3kgZG9lcyBjcmVhdGUgYSBuZXcgcnVuLlxuICAgICAqIEByZXR1cm4geyRwcm9taXNlfSBQcm9taXNlIHRvIGNvbXBsZXRlIHRoZSBjYWxsLlxuICAgICAqL1xuICAgIGdldFJ1bjogZnVuY3Rpb24gKHZhcmlhYmxlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc2Vzc2lvblN0b3JlID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTdG9yZSgpO1xuXG4gICAgICAgIHZhciBzZXNzaW9uQ29udGVudHMgPSBzZXNzaW9uU3RvcmUuZ2V0KHNlc3Npb25LZXlGcm9tT3B0aW9ucyh0aGlzLm9wdGlvbnMpKTtcbiAgICAgICAgdmFyIHJ1blNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb25Db250ZW50cyB8fCAne30nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChydW5TZXNzaW9uLnJ1bklkKSB7XG4gICAgICAgICAgICAvL0VwaUpTIDwgMi4yIHVzZWQgcnVuSWQgYXMga2V5LCBzbyBtYWludGFpbiBjb21wdGFpYmlsaXR5LiBSZW1vdmUgYXQgc29tZSBmdXR1cmUgZGF0ZSAoU3VtbWVyIGAxNz8pXG4gICAgICAgICAgICBydW5TZXNzaW9uLmlkID0gcnVuU2Vzc2lvbi5ydW5JZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdXRoU2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbigpO1xuICAgICAgICBpZiAodGhpcy5zdHJhdGVneS5yZXF1aXJlc0F1dGggJiYgdXRpbC5pc0VtcHR5KGF1dGhTZXNzaW9uKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gdXNlci1zZXNzaW9uIGF2YWlsYWJsZScsIHRoaXMub3B0aW9ucy5zdHJhdGVneSwgJ3JlcXVpcmVzIGF1dGhlbnRpY2F0aW9uLicpO1xuICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoJ05vIHVzZXItc2Vzc2lvbiBhdmFpbGFibGUnKS5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3lcbiAgICAgICAgICAgICAgICAuZ2V0UnVuKHRoaXMucnVuLCBhdXRoU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChydW4gJiYgcnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSdW5JblNlc3Npb24oc2Vzc2lvbktleUZyb21PcHRpb25zKG1lLm9wdGlvbnMpLCBydW4sIG1lLnNlc3Npb25NYW5hZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnJ1bi51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHJ1bi5pZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlcyAmJiB2YXJpYWJsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJ1bi52YXJpYWJsZXMoKS5xdWVyeSh2YXJpYWJsZXMpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuLnZhcmlhYmxlcyA9IHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciBhICdyZXNldCcgcnVuLiBUaGUgZGVmaW5pdGlvbiBvZiBhIHJlc2V0IGlzIGRlZmluZWQgYnkgdGhlIHN0cmF0ZWd5LCBidXQgdHlwaWNhbGx5IG1lYW5zIGZvcmNpbmcgdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHJ1bi4gRm9yIGV4YW1wbGUsIGByZXNldCgpYCBmb3IgdGhlIGRlZmF1bHQgc3RyYXRlZ2llcyBgcmV1c2UtcGVyLXNlc3Npb25gIGFuZCBgcmV1c2UtbGFzdC1pbml0aWFsaXplZGAgYm90aCBjcmVhdGUgbmV3IHJ1bnMuXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0ucmVzZXQoKS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIChuZXcpIHJ1biBvYmplY3RcbiAgICAgKiAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBSdW4gU2VydmljZSBvYmplY3RcbiAgICAgKiAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBDb25maWd1cmF0aW9uIG9wdGlvbnM7IHBhc3NlZCBvbiB0byBbUnVuU2VydmljZSNjcmVhdGVdKC4uL3J1bi1hcGktc2VydmljZS8jY3JlYXRlKS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgYXV0aFNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24oKTtcbiAgICAgICAgaWYgKHRoaXMuc3RyYXRlZ3kucmVxdWlyZXNBdXRoICYmIHV0aWwuaXNFbXB0eShhdXRoU2Vzc2lvbikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIHVzZXItc2Vzc2lvbiBhdmFpbGFibGUnLCB0aGlzLm9wdGlvbnMuc3RyYXRlZ3ksICdyZXF1aXJlcyBhdXRoZW50aWNhdGlvbi4nKTtcbiAgICAgICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCdObyB1c2VyLXNlc3Npb24gYXZhaWxhYmxlJykucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmF0ZWd5LnJlc2V0KHRoaXMucnVuLCBhdXRoU2Vzc2lvbiwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICBpZiAocnVuICYmIHJ1bi5pZCkge1xuICAgICAgICAgICAgICAgIHNldFJ1bkluU2Vzc2lvbihzZXNzaW9uS2V5RnJvbU9wdGlvbnMobWUub3B0aW9ucyksIHJ1bi5pZCwgbWUuc2Vzc2lvbk1hbmFnZXIpO1xuICAgICAgICAgICAgICAgIG1lLnJ1bi51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHJ1bi5pZCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblJ1bk1hbmFnZXIuc3RyYXRlZ2llcyA9IHN0cmF0ZWdpZXM7XG5tb2R1bGUuZXhwb3J0cyA9IFJ1bk1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9ub25lLXN0cmF0ZWd5Jyk7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG5cbi8qKlxuKiAjIyBDb25kaXRpb25hbCBDcmVhdGlvbiBTdHJhdGVneVxuKlxuKiBUaGlzIHN0cmF0ZWd5IHdpbGwgdHJ5IHRvIGdldCB0aGUgcnVuIHN0b3JlZCBpbiB0aGUgY29va2llIGFuZFxuKiBldmFsdWF0ZSBpZiBpdCBuZWVkcyB0byBjcmVhdGUgYSBuZXcgcnVuIGJ5IGNhbGxpbmcgdGhlIGBjb25kaXRpb25gIGZ1bmN0aW9uLlxuKi9cblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3koY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT0gbnVsbCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZGl0aW9uYWwgc3RyYXRlZ3kgbmVlZHMgYSBjb25kaXRpb24gdG8gY3JlYXRlIGEgcnVuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb25kaXRpb24gPSB0eXBlb2YgY29uZGl0aW9uICE9PSAnZnVuY3Rpb24nID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZGl0aW9uOyB9IDogY29uZGl0aW9uO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgbmV3ICdjb3JyZWN0JyBydW4sIG9yIHVwZGF0ZXMgdGhlIGV4aXN0aW5nIG9uZSAodGhlIGRlZmluaXRpb24gb2YgJ2NvcnJlY3QnIGRlcGVuZHMgb24gc3RyYXRlZ3kgaW1wbGVtZW50YXRpb24pLlxuICAgICAqIEBwYXJhbSAge1J1blNlcnZpY2V9IHJ1blNlcnZpY2UgQSBSdW4gU2VydmljZSBpbnN0YW5jZSBmb3IgdGhlIGN1cnJlbnQgcnVuLCBhcyBkZXRlcm1pbmVkIGJ5IHRoZSBSdW4gTWFuYWdlci5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHVzZXJTZXNzaW9uIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIgc2Vzc2lvbi4gU2VlIFtBdXRoTWFuYWdlciNnZXRDdXJyZW50VXNlclNlc3Npb25JbmZvXSguLi9hdXRoLW1hbmFnZXIvI2dldGN1cnJlbnR1c2Vyc2Vzc2lvbmluZm8pIGZvciBmb3JtYXQuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgU2VlIFtSdW5TZXJ2aWNlI2NyZWF0ZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyNjcmVhdGUpIGZvciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICBcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBncm91cCA9IHVzZXJTZXNzaW9uICYmIHVzZXJTZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHNjb3BlOiB7IGdyb3VwOiBncm91cCB9XG4gICAgICAgIH0sIHJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpKTtcblxuICAgICAgICByZXR1cm4gcnVuU2VydmljZVxuICAgICAgICAgICAgICAgIC5jcmVhdGUob3B0LCBvcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcnVuLmZyZXNobHlDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgJ2NvcnJlY3QnIHJ1biAodGhlIGRlZmluaXRpb24gb2YgJ2NvcnJlY3QnIGRlcGVuZHMgb24gc3RyYXRlZ3kgaW1wbGVtZW50YXRpb24pLlxuICAgICAqIEBwYXJhbSAge1J1blNlcnZpY2V9IHJ1blNlcnZpY2UgQSBSdW4gU2VydmljZSBpbnN0YW5jZSBmb3IgdGhlIGN1cnJlbnQgcnVuLCBhcyBkZXRlcm1pbmVkIGJ5IHRoZSBSdW4gTWFuYWdlci5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHVzZXJTZXNzaW9uIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIgc2Vzc2lvbi4gU2VlIFtBdXRoTWFuYWdlciNnZXRDdXJyZW50VXNlclNlc3Npb25JbmZvXSguLi9hdXRoLW1hbmFnZXIvI2dldGN1cnJlbnR1c2Vyc2Vzc2lvbmluZm8pIGZvciBmb3JtYXQuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBydW5TZXNzaW9uIFRoZSBSdW4gTWFuYWdlciBzdG9yZXMgdGhlICdsYXN0IGFjY2Vzc2VkJyBydW4gaW4gYSBjb29raWUgYW5kIHBhc3NlcyBpdCBiYWNrIGhlcmUuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgU2VlIFtSdW5TZXJ2aWNlI2NyZWF0ZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyNjcmVhdGUpIGZvciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICBcbiAgICAgKi9cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBpZiAocnVuU2Vzc2lvbiAmJiBydW5TZXNzaW9uLmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkQW5kQ2hlY2socnVuU2VydmljZSwgdXNlclNlc3Npb24sIHJ1blNlc3Npb24sIG9wdGlvbnMpLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpOyAvL2lmIGl0IGdvdCB0aGUgd3JvbmcgY29va2llIGZvciBlLmcuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBsb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc2hvdWxkQ3JlYXRlID0gZmFsc2U7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2VcbiAgICAgICAgICAgIC5sb2FkKHJ1blNlc3Npb24uaWQsIG51bGwsIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocnVuLCBtc2csIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkQ3JlYXRlID0gbWUuY29uZGl0aW9uKHJ1biwgaGVhZGVycywgdXNlclNlc3Npb24sIHJ1blNlc3Npb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZENyZWF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqIFRoZSBgbmV3LWlmLWluaXRpYWxpemVkYCBzdHJhdGVneSBjcmVhdGVzIGEgbmV3IHJ1biBpZiB0aGUgY3VycmVudCBvbmUgaXMgaW4gbWVtb3J5IG9yIGhhcyBpdHMgYGluaXRpYWxpemVkYCBmaWVsZCBzZXQgdG8gYHRydWVgLiBUaGUgYGluaXRpYWxpemVkYCBmaWVsZCBpbiB0aGUgcnVuIHJlY29yZCBpcyBhdXRvbWF0aWNhbGx5IHNldCB0byBgdHJ1ZWAgYXQgcnVuIGNyZWF0aW9uLCBidXQgY2FuIGJlIGNoYW5nZWQuXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdXIgcHJvamVjdCBpcyBzdHJ1Y3R1cmVkIHN1Y2ggdGhhdCBpbW1lZGlhdGVseSBhZnRlciBhIHJ1biBpcyBjcmVhdGVkLCB0aGUgbW9kZWwgaXMgZXhlY3V0ZWQgY29tcGxldGVseSAoZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIGlzIHN0ZXBwZWQgdG8gdGhlIGVuZCkuIEl0IGlzIHNpbWlsYXIgdG8gdGhlIGBuZXctaWYtbWlzc2luZ2Agc3RyYXRlZ3ksIGV4Y2VwdCB0aGF0IGl0IGNoZWNrcyBhIGZpZWxkIG9mIHRoZSBydW4gcmVjb3JkLlxuICogXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIENoZWNrIHRoZSBgc2Vzc2lvbktleWAgY29va2llLiBcbiAqICAqIFRoaXMgY29va2llIGlzIHNldCBieSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCBjb25maWd1cmFibGUgdGhyb3VnaCBpdHMgb3B0aW9ucy5cbiAqICAqIElmIHRoZSBjb29raWUgZXhpc3RzLCBjaGVjayB3aGV0aGVyIHRoZSBydW4gaXMgaW4gbWVtb3J5IG9yIG9ubHkgcGVyc2lzdGVkIGluIHRoZSBkYXRhYmFzZS4gQWRkaXRpb25hbGx5LCBjaGVjayB3aGV0aGVyIHRoZSBydW4ncyBgaW5pdGlhbGl6ZWRgIGZpZWxkIGlzIGB0cnVlYC4gXG4gKiAgICAgICogSWYgdGhlIHJ1biBpcyBpbiBtZW1vcnksIGNyZWF0ZSBhIG5ldyBydW4uXG4gKiAgICAgICogSWYgdGhlIHJ1bidzIGBpbml0aWFsaXplZGAgZmllbGQgaXMgYHRydWVgLCBjcmVhdGUgYSBuZXcgcnVuLlxuICogICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBleGlzdGluZyBydW4uXG4gKiAgKiBJZiB0aGUgY29va2llIGRvZXMgbm90IGV4aXN0LCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLlxuICogIFxuICogIEBkZXByZWNhdGVkIENvbnNpZGVyIHVzaW5nIGByZXVzZS1sYXN0LWluaXRpYWxpemVkYCBpbnN0ZWFkXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUud2FybignVGhpcyBzdHJhdGVneSBpcyBkZXByZWNhdGVkOyBhbGwgcnVucyBub3cgZGVmYXVsdCB0byBiZWluZyBpbml0aWFsaXplZCBieSBkZWZhdWx0IG1ha2luZyB0aGlzIHJlZHVuZGFudC4gQ29uc2lkZXIgdXNpbmcgYHJldXNlLWxhc3QtaW5pdGlhbGl6ZWRgIGluc3RlYWQuJyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnIHx8IHJ1bi5pbml0aWFsaXplZDtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGBuZXctaWYtcGVyc2lzdGVkYCBzdHJhdGVneSBjcmVhdGVzIGEgbmV3IHJ1biB3aGVuIHRoZSBjdXJyZW50IG9uZSBiZWNvbWVzIHBlcnNpc3RlZCAoZW5kIHVzZXIgaXMgaWRsZSBmb3IgYSBzZXQgcGVyaW9kKSwgYnV0IG90aGVyd2lzZSB1c2VzIHRoZSBjdXJyZW50IG9uZS4gXG4gKiBcbiAqIFVzaW5nIHRoaXMgc3RyYXRlZ3kgbWVhbnMgdGhhdCB3aGVuIGVuZCB1c2VycyBuYXZpZ2F0ZSBiZXR3ZWVuIHBhZ2VzIGluIHlvdXIgcHJvamVjdCwgb3IgcmVmcmVzaCB0aGVpciBicm93c2VycywgdGhleSB3aWxsIHN0aWxsIGJlIHdvcmtpbmcgd2l0aCB0aGUgc2FtZSBydW4uIFxuICogXG4gKiBIb3dldmVyLCBpZiB0aGV5IGFyZSBpZGxlIGZvciBsb25nZXIgdGhhbiB5b3VyIHByb2plY3QncyAqKk1vZGVsIFNlc3Npb24gVGltZW91dCoqIChjb25maWd1cmVkIGluIHlvdXIgcHJvamVjdCdzIFtTZXR0aW5nc10oLi4vLi4vLi4vdXBkYXRpbmdfeW91cl9zZXR0aW5ncy8pKSwgdGhlbiB0aGVpciBydW4gaXMgcGVyc2lzdGVkOyB0aGUgbmV4dCB0aW1lIHRoZXkgaW50ZXJhY3Qgd2l0aCB0aGUgcHJvamVjdCwgdGhleSB3aWxsIGdldCBhIG5ldyBydW4uIChTZWUgbW9yZSBiYWNrZ3JvdW5kIG9uIFtSdW4gUGVyc2lzdGVuY2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8pLilcbiAqIFxuICogVGhpcyBzdHJhdGVneSBpcyB1c2VmdWwgZm9yIG11bHRpLXBhZ2UgcHJvamVjdHMgd2hlcmUgZW5kIHVzZXJzIHBsYXkgdGhyb3VnaCBhIHNpbXVsYXRpb24gaW4gb25lIHNpdHRpbmcsIHN0ZXBwaW5nIHRocm91Z2ggdGhlIG1vZGVsIHNlcXVlbnRpYWxseSAoZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIHRoYXQgdXNlcyB0aGUgYHN0ZXBgIG9wZXJhdGlvbikgb3IgY2FsbGluZyBzcGVjaWZpYyBmdW5jdGlvbnMgdW50aWwgdGhlIG1vZGVsIGlzIFwiY29tcGxldGUuXCIgSG93ZXZlciwgeW91IHdpbGwgbmVlZCB0byBndWFyYW50ZWUgdGhhdCB5b3VyIGVuZCB1c2VycyB3aWxsIHJlbWFpbiBlbmdhZ2VkIHdpdGggdGhlIHByb2plY3QgZnJvbSBiZWdpbm5pbmcgdG8gZW5kICZtZGFzaDsgb3IgYXQgbGVhc3QsIHRoYXQgaWYgdGhleSBhcmUgaWRsZSBmb3IgbG9uZ2VyIHRoYW4gdGhlICoqTW9kZWwgU2Vzc2lvbiBUaW1lb3V0KiosIGl0IGlzIG9rYXkgZm9yIHRoZW0gdG8gc3RhcnQgdGhlIHByb2plY3QgZnJvbSBzY3JhdGNoICh3aXRoIGFuIHVuaW5pdGlhbGl6ZWQgbW9kZWwpLiBcbiAqIFxuICogU3BlY2lmaWNhbGx5LCB0aGUgc3RyYXRlZ3kgaXM6XG4gKlxuICogKiBDaGVjayB0aGUgYHNlc3Npb25LZXlgIGNvb2tpZS5cbiAqICAgKiBUaGlzIGNvb2tpZSBpcyBzZXQgYnkgdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgY29uZmlndXJhYmxlIHRocm91Z2ggaXRzIG9wdGlvbnMuXG4gKiAgICogSWYgdGhlIGNvb2tpZSBleGlzdHMsIGNoZWNrIHdoZXRoZXIgdGhlIHJ1biBpcyBpbiBtZW1vcnkgb3Igb25seSBwZXJzaXN0ZWQgaW4gdGhlIGRhdGFiYXNlLiBcbiAqICAgICAgKiBJZiB0aGUgcnVuIGlzIGluIG1lbW9yeSwgdXNlIHRoZSBydW4uXG4gKiAgICAgICogSWYgdGhlIHJ1biBpcyBvbmx5IHBlcnNpc3RlZCAoYW5kIG5vdCBzdGlsbCBpbiBtZW1vcnkpLCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLlxuICogICAgICAqIElmIHRoZSBjb29raWUgZG9lcyBub3QgZXhpc3QsIGNyZWF0ZSBhIG5ldyBydW4gZm9yIHRoaXMgZW5kIHVzZXIuXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhlIHJ1bi1zZXJ2aWNlIG5vdyBzZXRzIGEgaGVhZGVyIHRvIGF1dG9tYXRpY2FsbHkgYnJpbmcgYmFjayBydW5zIGludG8gbWVtb3J5XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUud2FybignVGhpcyBzdHJhdGVneSBpcyBkZXByZWNhdGVkOyB0aGUgcnVuLXNlcnZpY2Ugbm93IHNldHMgYSBoZWFkZXIgdG8gYXV0b21hdGljYWxseSBicmluZyBiYWNrIHJ1bnMgaW50byBtZW1vcnknKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCc7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqICMjIyBXb3JraW5nIHdpdGggUnVuIFN0cmF0ZWdpZXNcbiAqXG4gKiBZb3UgY2FuIGFjY2VzcyBhIGxpc3Qgb2YgYXZhaWxhYmxlIHN0cmF0ZWdpZXMgdXNpbmcgYEYubWFuYWdlci5SdW5NYW5hZ2VyLnN0cmF0ZWdpZXMubGlzdGAuIFlvdSBjYW4gYWxzbyBhc2sgZm9yIGEgcGFydGljdWxhciBzdHJhdGVneSBieSBuYW1lLlxuICpcbiAqIElmIHlvdSBkZWNpZGUgdG8gW2NyZWF0ZSB5b3VyIG93biBydW4gc3RyYXRlZ3ldKCNjcmVhdGUteW91ci1vd24pLCB5b3UgY2FuIHJlZ2lzdGVyIHlvdXIgc3RyYXRlZ3kuIFJlZ2lzdGVyaW5nIHlvdXIgc3RyYXRlZ3kgbWVhbnMgdGhhdDpcbiAqXG4gKiAqIFlvdSBjYW4gcGFzcyB0aGUgc3RyYXRlZ3kgYnkgbmFtZSB0byBhIFJ1biBNYW5hZ2VyIChhcyBvcHBvc2VkIHRvIHBhc3NpbmcgdGhlIHN0cmF0ZWd5IGZ1bmN0aW9uKTogYG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7IHN0cmF0ZWd5OiAnbXluZXduYW1lJ30pYC5cbiAqICogWW91IGNhbiBwYXNzIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyB0byB5b3VyIHN0cmF0ZWd5LlxuICogKiBZb3UgY2FuIHNwZWNpZnkgd2hldGhlciBvciBub3QgeW91ciBzdHJhdGVneSByZXF1aXJlcyBhdXRob3JpemF0aW9uIChhIHZhbGlkIHVzZXIgc2Vzc2lvbikgdG8gd29yay5cbiAqL1xuXG5cbnZhciBsaXN0ID0ge1xuICAgICdjb25kaXRpb25hbC1jcmVhdGlvbic6IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLWluaXRpYWxpemVkJzogcmVxdWlyZSgnLi9kZXByZWNhdGVkL25ldy1pZi1pbml0aWFsaXplZC1zdHJhdGVneScpLCAvL2RlcHJlY2F0ZWRcbiAgICAnbmV3LWlmLXBlcnNpc3RlZCc6IHJlcXVpcmUoJy4vZGVwcmVjYXRlZC9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5JyksIC8vZGVwcmVjYXRlZFxuXG4gICAgbm9uZTogcmVxdWlyZSgnLi9ub25lLXN0cmF0ZWd5JyksXG5cbiAgICBtdWx0aXBsYXllcjogcmVxdWlyZSgnLi9tdWx0aXBsYXllci1zdHJhdGVneScpLFxuICAgICdyZXVzZS1uZXZlcic6IHJlcXVpcmUoJy4vcmV1c2UtbmV2ZXInKSxcbiAgICAncmV1c2UtcGVyLXNlc3Npb24nOiByZXF1aXJlKCcuL3JldXNlLXBlci1zZXNzaW9uJyksXG4gICAgJ3JldXNlLWFjcm9zcy1zZXNzaW9ucyc6IHJlcXVpcmUoJy4vcmV1c2UtYWNyb3NzLXNlc3Npb25zJyksXG4gICAgJ3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnOiByZXF1aXJlKCcuL3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnKSxcbn07XG5cbi8vQWRkIGJhY2sgb2xkZXIgYWxpYXNlc1xubGlzdFsnYWx3YXlzLW5ldyddID0gbGlzdFsncmV1c2UtbmV2ZXInXTtcbmxpc3RbJ25ldy1pZi1taXNzaW5nJ10gPSBsaXN0WydyZXVzZS1wZXItc2Vzc2lvbiddO1xubGlzdFsncGVyc2lzdGVudC1zaW5nbGUtcGxheWVyJ10gPSBsaXN0WydyZXVzZS1hY3Jvc3Mtc2Vzc2lvbnMnXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBMaXN0IG9mIGF2YWlsYWJsZSBzdHJhdGVnaWVzLiBXaXRoaW4gdGhpcyBvYmplY3QsIGVhY2gga2V5IGlzIHRoZSBzdHJhdGVneSBuYW1lIGFuZCB0aGUgYXNzb2NpYXRlZCB2YWx1ZSBpcyB0aGUgc3RyYXRlZ3kgY29uc3RydWN0b3IuXG4gICAgICogQHR5cGUge09iamVjdH0gXG4gICAgICovXG4gICAgbGlzdDogbGlzdCxcblxuICAgIC8qKlxuICAgICAqIEdldHMgc3RyYXRlZ3kgYnkgbmFtZS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciByZXVzZVN0cmF0ID0gRi5tYW5hZ2VyLlJ1bk1hbmFnZXIuc3RyYXRlZ2llcy5ieU5hbWUoJ3JldXNlLWFjcm9zcy1zZXNzaW9ucycpO1xuICAgICAqICAgICAgLy8gc2hvd3Mgc3RyYXRlZ3kgZnVuY3Rpb25cbiAgICAgKiAgICAgIGNvbnNvbGUubG9nKCdyZXVzZVN0cmF0ID0gJywgcmV1c2VTdHJhdCk7XG4gICAgICogICAgICAvLyBjcmVhdGUgYSBuZXcgcnVuIG1hbmFnZXIgdXNpbmcgdGhpcyBzdHJhdGVneVxuICAgICAqICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtzdHJhdGVneTogcmV1c2VTdHJhdCwgcnVuOiB7IG1vZGVsOiAnbW9kZWwudm1mJ30gfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gc3RyYXRlZ3lOYW1lIE5hbWUgb2Ygc3RyYXRlZ3kgdG8gZ2V0LlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBTdHJhdGVneSBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBieU5hbWU6IGZ1bmN0aW9uIChzdHJhdGVneU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rbc3RyYXRlZ3lOYW1lXTtcbiAgICB9LFxuXG4gICAgZ2V0QmVzdFN0cmF0ZWd5OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgc3RyYXRlZ3kgPSBvcHRpb25zLnN0cmF0ZWd5O1xuICAgICAgICBpZiAoIXN0cmF0ZWd5KSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdHJhdGVneU9wdGlvbnMgJiYgb3B0aW9ucy5zdHJhdGVneU9wdGlvbnMuaW5pdE9wZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHN0cmF0ZWd5ID0gJ3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHJhdGVneSA9ICdyZXVzZS1wZXItc2Vzc2lvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyYXRlZ3kuZ2V0UnVuKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyYXRlZ3k7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFN0cmF0ZWd5Q3RvciA9IHR5cGVvZiBzdHJhdGVneSA9PT0gJ2Z1bmN0aW9uJyA/IHN0cmF0ZWd5IDogdGhpcy5ieU5hbWUoc3RyYXRlZ3kpO1xuICAgICAgICBpZiAoIVN0cmF0ZWd5Q3Rvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTcGVjaWZpZWQgcnVuIGNyZWF0aW9uIHN0cmF0ZWd5IHdhcyBpbnZhbGlkOicsIHN0cmF0ZWd5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHJhdGVneUluc3RhbmNlID0gbmV3IFN0cmF0ZWd5Q3RvcihvcHRpb25zKTtcbiAgICAgICAgaWYgKCFzdHJhdGVneUluc3RhbmNlLmdldFJ1biB8fCAhc3RyYXRlZ3lJbnN0YW5jZS5yZXNldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgc3RyYXRlZ2llcyBzaG91bGQgaW1wbGVtZW50IGEgYGdldFJ1bmAgYW5kIGByZXNldGAgaW50ZXJmYWNlJywgb3B0aW9ucy5zdHJhdGVneSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyYXRlZ3lJbnN0YW5jZS5yZXF1aXJlc0F1dGggPSBTdHJhdGVneUN0b3IucmVxdWlyZXNBdXRoO1xuXG4gICAgICAgIHJldHVybiBzdHJhdGVneUluc3RhbmNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHN0cmF0ZWd5LlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gdGhpcyBcImZhdm9yaXRlIHJ1blwiIHN0cmF0ZWd5IGFsd2F5cyByZXR1cm5zIHRoZSBzYW1lIHJ1biwgbm8gbWF0dGVyIHdoYXRcbiAgICAgKiAgICAgIC8vIChub3QgYSB1c2VmdWwgc3RyYXRlZ3ksIGV4Y2VwdCBhcyBhbiBleGFtcGxlKVxuICAgICAqICAgICAgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIuc3RyYXRlZ2llcy5yZWdpc3RlcihcbiAgICAgKiAgICAgICAgICAnZmF2UnVuJywgXG4gICAgICogICAgICAgICAgZnVuY3Rpb24oKSB7IFxuICAgICAqICAgICAgICAgICAgICByZXR1cm4geyBnZXRSdW46IGZ1bmN0aW9uKCkgeyByZXR1cm4gJzAwMDAwMTVhNGNkMTcwMDIwOWNkMGE3ZDIwN2Y0NGJhYzI4OSc7IH0sXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJzAwMDAwMTVhNGNkMTcwMDIwOWNkMGE3ZDIwN2Y0NGJhYzI4OSc7IH0gXG4gICAgICogICAgICAgICAgICAgIH0gXG4gICAgICogICAgICAgICAgfSwgXG4gICAgICogICAgICAgICAgeyByZXF1aXJlc0F1dGg6IHRydWUgfVxuICAgICAqICAgICAgKTtcbiAgICAgKiAgICAgIFxuICAgICAqICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtzdHJhdGVneTogJ2ZhdlJ1bicsIHJ1bjogeyBtb2RlbDogJ21vZGVsLnZtZid9IH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgTmFtZSBmb3Igc3RyYXRlZ3kuIFRoaXMgc3RyaW5nIGNhbiB0aGVuIGJlIHBhc3NlZCB0byBhIFJ1biBNYW5hZ2VyIGFzIGBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoeyBzdHJhdGVneTogJ215bmV3bmFtZSd9KWAuXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IHN0cmF0ZWd5IFRoZSBzdHJhdGVneSBjb25zdHJ1Y3Rvci4gV2lsbCBiZSBjYWxsZWQgd2l0aCBgbmV3YCBvbiBSdW4gTWFuYWdlciBpbml0aWFsaXphdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIE9wdGlvbnMgZm9yIHN0cmF0ZWd5LlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IG9wdGlvbnMucmVxdWlyZXNBdXRoIFNwZWNpZnkgaWYgdGhlIHN0cmF0ZWd5IHJlcXVpcmVzIGEgdmFsaWQgdXNlciBzZXNzaW9uIHRvIHdvcmsuXG4gICAgICovXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uIChuYW1lLCBzdHJhdGVneSwgb3B0aW9ucykge1xuICAgICAgICBzdHJhdGVneS5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgbGlzdFtuYW1lXSA9IHN0cmF0ZWd5O1xuICAgIH1cbn07IiwiLyoqXG4gKiBUaGUgYG11bHRpcGxheWVyYCBzdHJhdGVneSBpcyBmb3IgdXNlIHdpdGggW211bHRpcGxheWVyIHdvcmxkc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gSXQgY2hlY2tzIHRoZSBjdXJyZW50IHdvcmxkIGZvciB0aGlzIGVuZCB1c2VyLCBhbmQgYWx3YXlzIHJldHVybnMgdGhlIGN1cnJlbnQgcnVuIGZvciB0aGF0IHdvcmxkLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcigpYCBhbmQgdGhlbiBgZ2V0Q3VycmVudFJ1bklkKClgIGZyb20gdGhlIFtXb3JsZCBBUEkgQWRhcGF0ZXJdKC4uL3dvcmxkLWFwaS1hZGFwdGVyLykuIElmIHlvdSB1c2UgdGhlIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyLyksIHlvdSBhcmUgYXV0b21hdGljYWxseSB1c2luZyB0aGlzIHN0cmF0ZWd5LlxuICogXG4gKiBVc2luZyB0aGlzIHN0cmF0ZWd5IG1lYW5zIHRoYXQgZW5kIHVzZXJzIGluIHByb2plY3RzIHdpdGggbXVsdGlwbGF5ZXIgd29ybGRzIGFsd2F5cyBzZWUgdGhlIG1vc3QgY3VycmVudCB3b3JsZCBhbmQgcnVuLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGV5IGFyZSBpbiBzeW5jIHdpdGggdGhlIG90aGVyIGVuZCB1c2VycyBzaGFyaW5nIHRoZWlyIHdvcmxkIGFuZCBydW4uIEluIHR1cm4sIHRoaXMgYWxsb3dzIGZvciBjb21wZXRpdGl2ZSBvciBjb2xsYWJvcmF0aXZlIG11bHRpcGxheWVyIHByb2plY3RzLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL25vbmUtc3RyYXRlZ3knKTtcbnZhciBXb3JsZEFwaUFkYXB0ZXIgPSByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyJyk7XG5cbnZhciBkZWZhdWx0cyA9IHt9O1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oSWRlbnRpdHlTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLndvcmxkQXBpID0gbmV3IFdvcmxkQXBpQWRhcHRlcih0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBzZXNzaW9uKSB7XG4gICAgICAgIHZhciBjdXJVc2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgdmFyIGN1ckdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuXG4gICAgICAgIHJldHVybiB0aGlzLndvcmxkQXBpXG4gICAgICAgICAgICAuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcihjdXJVc2VySWQsIGN1ckdyb3VwTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndvcmxkQXBpLm5ld1J1bkZvcldvcmxkKHdvcmxkLmlkKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHNlc3Npb24pIHtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgIHZhciB3b3JsZEFwaSA9IHRoaXMud29ybGRBcGk7XG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMub3B0aW9ucy5tb2RlbDtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICBpZiAoIWN1clVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoeyBzdGF0dXNDb2RlOiA0MDAsIGVycm9yOiAnV2UgbmVlZCBhbiBhdXRoZW50aWNhdGVkIHVzZXIgdG8gam9pbiBhIG11bHRpcGxheWVyIHdvcmxkLiAoRVJSOiBubyB1c2VySWQgaW4gc2Vzc2lvbiknIH0sIHNlc3Npb24pLnByb21pc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2FkUnVuRnJvbVdvcmxkID0gZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoeyBzdGF0dXNDb2RlOiA0MDQsIGVycm9yOiAnVGhlIHVzZXIgaXMgbm90IGluIGFueSB3b3JsZC4nIH0sIHsgb3B0aW9uczogbWUub3B0aW9ucywgc2Vzc2lvbjogc2Vzc2lvbiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogbW9kZWwsIGZpbHRlcjogd29ybGQuaWQgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UubG9hZChpZCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihkdGQucmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc2VydmVyRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIGlzIHRoaXMgcG9zc2libGU/XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdChlcnJvciwgc2Vzc2lvbiwgbWUub3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihsb2FkUnVuRnJvbVdvcmxkKVxuICAgICAgICAgICAgLmZhaWwoc2VydmVyRXJyb3IpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiLyoqXG4gKiBUaGUgYG5vbmVgIHN0cmF0ZWd5IG5ldmVyIHJldHVybnMgYSBydW4gb3IgdHJpZXMgdG8gY3JlYXRlIGEgbmV3IHJ1bi4gSXQgc2ltcGx5IHJldHVybnMgdGhlIGNvbnRlbnRzIG9mIHRoZSBjdXJyZW50IFtSdW4gU2VydmljZSBpbnN0YW5jZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIG1hbnVhbGx5IGRlY2lkZSBob3cgdG8gY3JlYXRlIHlvdXIgb3duIHJ1bnMgYW5kIGRvbid0IHdhbnQgYW55IGF1dG9tYXRpYyBhc3Npc3RhbmNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSB7fTtcblxuLy8gSW50ZXJmYWNlIHRoYXQgYWxsIHN0cmF0ZWdpZXMgbmVlZCB0byBpbXBsZW1lbnRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSBuZXdseSBjcmVhdGVkIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoKS5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgdXNhYmxlIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUocnVuU2VydmljZSkucHJvbWlzZSgpO1xuICAgIH1cbn0pO1xuIiwiLyoqXG4gKiBUaGUgYHJldXNlLWFjcm9zcy1zZXNzaW9uc2Agc3RyYXRlZ3kgcmV0dXJucyB0aGUgbGF0ZXN0IChtb3N0IHJlY2VudCkgcnVuIGZvciB0aGlzIHVzZXIsIHdoZXRoZXIgaXQgaXMgaW4gbWVtb3J5IG9yIG5vdC4gSWYgdGhlcmUgYXJlIG5vIHJ1bnMgZm9yIHRoaXMgdXNlciwgaXQgY3JlYXRlcyBhIG5ldyBvbmUuXG4gKlxuICogVGhpcyBzdHJhdGVneSBpcyB1c2VmdWwgaWYgZW5kIHVzZXJzIGFyZSB1c2luZyB5b3VyIHByb2plY3QgZm9yIGFuIGV4dGVuZGVkIHBlcmlvZCBvZiB0aW1lLCBwb3NzaWJseSBvdmVyIHNldmVyYWwgc2Vzc2lvbnMuIFRoaXMgaXMgbW9zdCBjb21tb24gaW4gY2FzZXMgd2hlcmUgYSB1c2VyIG9mIHlvdXIgcHJvamVjdCBleGVjdXRlcyB0aGUgbW9kZWwgc3RlcCBieSBzdGVwIChhcyBvcHBvc2VkIHRvIGEgcHJvamVjdCB3aGVyZSB0aGUgbW9kZWwgaXMgZXhlY3V0ZWQgY29tcGxldGVseSwgZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIHRoYXQgaXMgaW1tZWRpYXRlbHkgc3RlcHBlZCB0byB0aGUgZW5kKS5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqIFxuICogKiBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHJ1bnMgZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgICAgKiBJZiB0aGVyZSBhcmUgbm8gcnVucyAoZWl0aGVyIGluIG1lbW9yeSBvciBpbiB0aGUgZGF0YWJhc2UpLCBjcmVhdGUgYSBuZXcgb25lLlxuICogICAgICogSWYgdGhlcmUgYXJlIHJ1bnMsIHRha2UgdGhlIGxhdGVzdCAobW9zdCByZWNlbnQpIG9uZS5cbiAqXG4gKiBAbmFtZSBwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXJcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBJZGVudGl0eVN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9ub25lLXN0cmF0ZWd5Jyk7XG52YXIgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uID0gcmVxdWlyZSgnLi4vc3RyYXRlZ3ktdXRpbHMnKS5pbmplY3RGaWx0ZXJzRnJvbVNlc3Npb247XG52YXIgaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbjtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIChPcHRpb25hbCkgQWRkaXRpb25hbCBjcml0ZXJpYSB0byB1c2Ugd2hpbGUgc2VsZWN0aW5nIHRoZSBsYXN0IHJ1blxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZmlsdGVyOiB7fSxcbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmF0ZWd5T3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucyA6IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHN0cmF0ZWd5T3B0aW9ucyk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG9wdCA9IGluamVjdFNjb3BlRnJvbVNlc3Npb24ocnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCksIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2VcbiAgICAgICAgICAgIC5jcmVhdGUob3B0LCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmlsdGVyID0gaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uKHRoaXMub3B0aW9ucy5maWx0ZXIsIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UucXVlcnkoZmlsdGVyLCB7IFxuICAgICAgICAgICAgLy8gc3RhcnRyZWNvcmQ6IDAsIC8vVE9ETzogVW5jb21tZW50IHdoZW4gRVBJQ0VOVEVSLTI1NjkgaXMgZml4ZWRcbiAgICAgICAgICAgIC8vIGVuZHJlY29yZDogMCxcbiAgICAgICAgICAgIHNvcnQ6ICdjcmVhdGVkJywgXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgICAgICBpZiAoIXJ1bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5zWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGByZXVzZS1sYXN0LWluaXRpYWxpemVkYCBzdHJhdGVneSBsb29rcyBmb3IgdGhlIG1vc3QgcmVjZW50IHJ1biB0aGF0IG1hdGNoZXMgcGFydGljdWxhciBjcml0ZXJpYTsgaWYgaXQgY2Fubm90IGZpbmQgb25lLCBpdCBjcmVhdGVzIGEgbmV3IHJ1biBhbmQgaW1tZWRpYXRlbHkgZXhlY3V0ZXMgYSBzZXQgb2YgXCJpbml0aWFsaXphdGlvblwiIG9wZXJhdGlvbnMuIFxuICpcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdSBoYXZlIGEgdGltZS1iYXNlZCBtb2RlbCBhbmQgYWx3YXlzIHdhbnQgdGhlIHJ1biB5b3UncmUgb3BlcmF0aW5nIG9uIHRvIHN0YXJ0IGF0IGEgcGFydGljdWxhciBzdGVwLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICBzdHJhdGVneTogJ3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnLFxuICogICAgICAgICAgc3RyYXRlZ3lPcHRpb25zOiB7XG4gKiAgICAgICAgICAgICAgaW5pdE9wZXJhdGlvbjogW3sgc3RlcDogMTAgfV1cbiAqICAgICAgICAgIH1cbiAqICAgICAgfSk7XG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgYWxzbyB1c2VmdWwgaWYgeW91IGhhdmUgYSBjdXN0b20gaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24gaW4geW91ciBtb2RlbCwgYW5kIHdhbnQgdG8gbWFrZSBzdXJlIGl0J3MgYWx3YXlzIGV4ZWN1dGVkIGZvciBuZXcgcnVucy5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIExvb2sgZm9yIHRoZSBtb3N0IHJlY2VudCBydW4gdGhhdCBtYXRjaGVzIHRoZSAob3B0aW9uYWwpIGBmbGFnYCBjcml0ZXJpYVxuICogKiBJZiB0aGVyZSBhcmUgbm8gcnVucyB0aGF0IG1hdGNoIHRoZSBgZmxhZ2AgY3JpdGVyaWEsIGNyZWF0ZSBhIG5ldyBydW4uIEltbWVkaWF0ZWx5IFwiaW5pdGlhbGl6ZVwiIHRoaXMgbmV3IHJ1biBieTpcbiAqICAgICAqICBDYWxsaW5nIHRoZSBtb2RlbCBvcGVyYXRpb24ocykgc3BlY2lmaWVkIGluIHRoZSBgaW5pdE9wZXJhdGlvbmAgYXJyYXkuXG4gKiAgICAgKiAgT3B0aW9uYWxseSwgc2V0dGluZyBhIGBmbGFnYCBpbiB0aGUgcnVuLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uID0gcmVxdWlyZSgnLi4vc3RyYXRlZ3ktdXRpbHMnKS5pbmplY3RGaWx0ZXJzRnJvbVNlc3Npb247XG52YXIgaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbjtcblxudmFyIEJhc2UgPSB7fTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIE9wZXJhdGlvbnMgdG8gZXhlY3V0ZSBpbiB0aGUgbW9kZWwgZm9yIGluaXRpYWxpemF0aW9uIHRvIGJlIGNvbnNpZGVyZWQgY29tcGxldGUuXG4gICAgICogQHR5cGUge0FycmF5fSBDYW4gYmUgaW4gYW55IG9mIHRoZSBmb3JtYXRzIFtSdW4gU2VydmljZSdzIGBzZXJpYWwoKWBdKC4uL3J1bi1hcGktc2VydmljZS8jc2VyaWFsKSBzdXBwb3J0cy5cbiAgICAgKi9cbiAgICBpbml0T3BlcmF0aW9uOiBbXSxcblxuICAgIC8qKlxuICAgICAqIChPcHRpb25hbCkgRmxhZyB0byBzZXQgaW4gcnVuIGFmdGVyIGluaXRpYWxpemF0aW9uIG9wZXJhdGlvbnMgYXJlIHJ1bi4gWW91IHR5cGljYWxseSB3b3VsZCBub3Qgb3ZlcnJpZGUgdGhpcyB1bmxlc3MgeW91IG5lZWRlZCB0byBzZXQgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGFzIHdlbGwuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBmbGFnOiBudWxsLFxufTtcbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmF0ZWd5T3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucyA6IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHN0cmF0ZWd5T3B0aW9ucyk7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmluaXRPcGVyYXRpb24gfHwgIXRoaXMub3B0aW9ucy5pbml0T3BlcmF0aW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTcGVjaWZ5aW5nIGFuIGluaXQgZnVuY3Rpb24gaXMgcmVxdWlyZWQgZm9yIHRoaXMgc3RyYXRlZ3knKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5mbGFnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZmxhZyA9IHtcbiAgICAgICAgICAgICAgICBpc0luaXRDb21wbGV0ZTogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBvcHQgPSBpbmplY3RTY29wZUZyb21TZXNzaW9uKHJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpLCB1c2VyU2Vzc2lvbik7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlLmNyZWF0ZShvcHQsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24gKGNyZWF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5zZXJpYWwoW10uY29uY2F0KG1lLm9wdGlvbnMuaW5pdE9wZXJhdGlvbikpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChjcmVhdGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2Uuc2F2ZShtZS5vcHRpb25zLmZsYWcpLnRoZW4oZnVuY3Rpb24gKHBhdGNoUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIGNyZWF0ZVJlc3BvbnNlLCBwYXRjaFJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24sIHJ1blNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZpbHRlciA9IGluamVjdEZpbHRlcnNGcm9tU2Vzc2lvbih0aGlzLm9wdGlvbnMuZmxhZywgdXNlclNlc3Npb24pO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5xdWVyeShmaWx0ZXIsIHsgXG4gICAgICAgICAgICAvLyBzdGFydHJlY29yZDogMCwgIC8vVE9ETzogVW5jb21tZW50IHdoZW4gRVBJQ0VOVEVSLTI1NjkgaXMgZml4ZWRcbiAgICAgICAgICAgIC8vIGVuZHJlY29yZDogMCxcbiAgICAgICAgICAgIHNvcnQ6ICdjcmVhdGVkJywgXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgICAgICBpZiAoIXJ1bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5zWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG59KTsiLCIvKipcbiAqIFRoZSBgcmV1c2UtbmV2ZXJgIHN0cmF0ZWd5IGFsd2F5cyBjcmVhdGVzIGEgbmV3IHJ1biBmb3IgdGhpcyBlbmQgdXNlciBpcnJlc3BlY3RpdmUgb2YgY3VycmVudCBzdGF0ZS4gVGhpcyBpcyBlcXVpdmFsZW50IHRvIGNhbGxpbmcgYEYuc2VydmljZS5SdW4uY3JlYXRlKClgIGZyb20gdGhlIFtSdW4gU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZXZlcnkgdGltZS4gXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgbWVhbnMgdGhhdCBldmVyeSB0aW1lIHlvdXIgZW5kIHVzZXJzIHJlZnJlc2ggdGhlaXIgYnJvd3NlcnMsIHRoZXkgZ2V0IGEgbmV3IHJ1bi4gXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgY2FuIGJlIHVzZWZ1bCBmb3IgYmFzaWMsIHNpbmdsZS1wYWdlIHByb2plY3RzLiBUaGlzIHN0cmF0ZWd5IGlzIGFsc28gdXNlZnVsIGZvciBwcm90b3R5cGluZyBvciBwcm9qZWN0IGRldmVsb3BtZW50OiBpdCBjcmVhdGVzIGEgbmV3IHJ1biBlYWNoIHRpbWUgeW91IHJlZnJlc2ggdGhlIHBhZ2UsIGFuZCB5b3UgY2FuIGVhc2lseSBjaGVjayB0aGUgb3V0cHV0cyBvZiB0aGUgbW9kZWwuIEhvd2V2ZXIsIHR5cGljYWxseSB5b3Ugd2lsbCB1c2Ugb25lIG9mIHRoZSBvdGhlciBzdHJhdGVnaWVzIGZvciBhIHByb2R1Y3Rpb24gcHJvamVjdC5cbiAqXG4gKiBAbmFtZSBhbHdheXMtbmV3XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBhbHdheXMgY3JlYXRlIGEgbmV3IHJ1biFcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqIFRoZSBgcmV1c2UtcGVyLXNlc3Npb25gIHN0cmF0ZWd5IGNyZWF0ZXMgYSBuZXcgcnVuIHdoZW4gdGhlIGN1cnJlbnQgb25lIGlzIG5vdCBpbiB0aGUgYnJvd3NlciBjb29raWUuXG4gKiBcbiAqIFVzaW5nIHRoaXMgc3RyYXRlZ3kgbWVhbnMgdGhhdCB3aGVuIGVuZCB1c2VycyBuYXZpZ2F0ZSBiZXR3ZWVuIHBhZ2VzIGluIHlvdXIgcHJvamVjdCwgb3IgcmVmcmVzaCB0aGVpciBicm93c2VycywgdGhleSB3aWxsIHN0aWxsIGJlIHdvcmtpbmcgd2l0aCB0aGUgc2FtZSBydW4uIEhvd2V2ZXIsIGlmIGVuZCB1c2VycyBsb2cgb3V0IGFuZCByZXR1cm4gdG8gdGhlIHByb2plY3QgYXQgYSBsYXRlciBkYXRlLCBhIG5ldyBydW4gaXMgY3JlYXRlZC5cbiAqXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIHVzZWZ1bCBpZiB5b3VyIHByb2plY3QgaXMgc3RydWN0dXJlZCBzdWNoIHRoYXQgaW1tZWRpYXRlbHkgYWZ0ZXIgYSBydW4gaXMgY3JlYXRlZCwgdGhlIG1vZGVsIGlzIGV4ZWN1dGVkIGNvbXBsZXRlbHkgKGZvciBleGFtcGxlLCBhIFZlbnNpbSBtb2RlbCB0aGF0IGlzIHN0ZXBwZWQgdG8gdGhlIGVuZCBhcyBzb29uIGFzIGl0IGlzIGNyZWF0ZWQpLiBJbiBjb250cmFzdCwgaWYgZW5kIHVzZXJzIHBsYXkgd2l0aCB5b3VyIHByb2plY3QgZm9yIGFuIGV4dGVuZGVkIHBlcmlvZCBvZiB0aW1lLCBleGVjdXRpbmcgdGhlIG1vZGVsIHN0ZXAgYnkgc3RlcCwgdGhlIGByZXVzZS1hY3Jvc3Mtc2Vzc2lvbnNgIHN0cmF0ZWd5IGlzIHByb2JhYmx5IGEgYmV0dGVyIGNob2ljZSAoaXQgYWxsb3dzIGVuZCB1c2VycyB0byBwaWNrIHVwIHdoZXJlIHRoZXkgbGVmdCBvZmYsIHJhdGhlciB0aGFuIHN0YXJ0aW5nIGZyb20gc2NyYXRjaCBlYWNoIGJyb3dzZXIgc2Vzc2lvbikuXG4gKiBcbiAqIFNwZWNpZmljYWxseSwgdGhlIHN0cmF0ZWd5IGlzOlxuICpcbiAqICogQ2hlY2sgdGhlIGBzZXNzaW9uS2V5YCBjb29raWUuXG4gKiAgICAgKiBUaGlzIGNvb2tpZSBpcyBzZXQgYnkgdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgY29uZmlndXJhYmxlIHRocm91Z2ggaXRzIG9wdGlvbnMuIFxuICogICAgICogSWYgdGhlIGNvb2tpZSBleGlzdHMsIHVzZSB0aGUgcnVuIGlkIHN0b3JlZCB0aGVyZS4gXG4gKiAgICAgKiBJZiB0aGUgY29va2llIGRvZXMgbm90IGV4aXN0LCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLlxuICpcbiAqIEBuYW1lIG5ldy1pZi1taXNzaW5nXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxuLypcbiogIGNyZWF0ZSBhIG5ldyBydW4gb25seSBpZiBub3RoaW5nIGlzIHN0b3JlZCBpbiB0aGUgY29va2llXG4qICB0aGlzIGlzIHVzZWZ1bCBmb3IgYmFzZVJ1bnMuXG4qL1xudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBpZiB3ZSBhcmUgaGVyZSwgaXQgbWVhbnMgdGhhdCB0aGUgcnVuIGV4aXN0cy4uLiBzbyB3ZSBkb24ndCBuZWVkIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqICMjIFNhdmVkIFJ1bnMgTWFuYWdlclxuICpcbiAqIFRoZSBTYXZlZCBSdW5zIE1hbmFnZXIgaXMgYSBzcGVjaWZpYyB0eXBlIG9mIFtSdW4gTWFuYWdlcl0oLi4vLi4vcnVuLW1hbmFnZXIvKSB3aGljaCBwcm92aWRlcyBhY2Nlc3MgdG8gYSBsaXN0IG9mIHJ1bnMgKHJhdGhlciB0aGFuIGp1c3Qgb25lIHJ1bikuIEl0IGFsc28gcHJvdmlkZXMgdXRpbGl0eSBmdW5jdGlvbnMgZm9yIGRlYWxpbmcgd2l0aCBtdWx0aXBsZSBydW5zIChlLmcuIHNhdmluZywgZGVsZXRpbmcsIGxpc3RpbmcpLlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIGEgU2F2ZWQgUnVucyBNYW5hZ2VyIGlzIGluY2x1ZGVkIGF1dG9tYXRpY2FsbHkgaW4gZXZlcnkgaW5zdGFuY2Ugb2YgYSBbU2NlbmFyaW8gTWFuYWdlcl0oLi4vKSwgYW5kIGlzIGFjY2Vzc2libGUgZnJvbSB0aGUgU2NlbmFyaW8gTWFuYWdlciBhdCBgLnNhdmVkUnVuc2AuIFNlZSBbbW9yZSBpbmZvcm1hdGlvbl0oLi4vI3Byb3BlcnRpZXMpIG9uIHVzaW5nIGAuc2F2ZWRSdW5zYCB3aXRoaW4gdGhlIFNjZW5hcmlvIE1hbmFnZXIuXG4gKlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG52YXIgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uID0gcmVxdWlyZSgnLi9zdHJhdGVneS11dGlscycpLmluamVjdEZpbHRlcnNGcm9tU2Vzc2lvbjtcblxudmFyIFNhdmVkUnVuc01hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogSWYgc2V0LCB3aWxsIG9ubHkgcHVsbCBydW5zIGZyb20gY3VycmVudCBncm91cC4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHNjb3BlQnlHcm91cDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgc2V0LCB3aWxsIG9ubHkgcHVsbCBydW5zIGZyb20gY3VycmVudCB1c2VyLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBtdWx0aXBsYXllciBydW4gY29tcGFyaXNvbiBwcm9qZWN0cywgc2V0IHRoaXMgdG8gZmFsc2Ugc28gdGhhdCBhbGwgZW5kIHVzZXJzIGluIGEgZ3JvdXAgY2FuIHZpZXcgdGhlIHNoYXJlZCBzZXQgb2Ygc2F2ZWQgcnVucy5cbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBzY29wZUJ5VXNlcjogdHJ1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKG9wdGlvbnMucnVuKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMucnVuU2VydmljZSA9IG9wdGlvbnMucnVuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gbmV3IFJ1blNlcnZpY2Uob3B0aW9ucy5ydW4pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBydW4gb3B0aW9ucyBwYXNzZWQgdG8gU2F2ZWRSdW5zTWFuYWdlcicpO1xuICAgIH1cbn07XG5cblNhdmVkUnVuc01hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIE1hcmtzIGEgcnVuIGFzIHNhdmVkLiBcbiAgICAgKlxuICAgICAqIE5vdGUgdGhhdCB3aGlsZSBhbnkgcnVuIGNhbiBiZSBzYXZlZCwgb25seSBydW5zIHdoaWNoIGFsc28gbWF0Y2ggdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBgc2NvcGVCeUdyb3VwYCBhbmQgYHNjb3BlQnlVc2VyYCBhcmUgcmV0dXJuZWQgYnkgdGhlIGBnZXRSdW5zKClgIG1ldGhvZC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzbSA9IG5ldyBGLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyKCk7XG4gICAgICogICAgICBzbS5zYXZlZFJ1bnMuc2F2ZSgnMDAwMDAxNWE0Y2QxNzAwMjA5Y2QwYTdkMjA3ZjQ0YmFjMjg5Jyk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8UnVuU2VydmljZX0gcnVuIFJ1biB0byBzYXZlLiBQYXNzIGluIGVpdGhlciB0aGUgcnVuIGlkLCBhcyBhIHN0cmluZywgb3IgdGhlIFtSdW4gU2VydmljZV0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvdGhlckZpZWxkcyAoT3B0aW9uYWwpIEFueSBvdGhlciBtZXRhLWRhdGEgdG8gc2F2ZSB3aXRoIHRoZSBydW4uXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBzYXZlOiBmdW5jdGlvbiAocnVuLCBvdGhlckZpZWxkcykge1xuICAgICAgICB2YXIgcGFyYW0gPSAkLmV4dGVuZCh0cnVlLCB7fSwgb3RoZXJGaWVsZHMsIHsgc2F2ZWQ6IHRydWUsIHRyYXNoZWQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrKHJ1biwgcGFyYW0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogTWFya3MgYSBydW4gYXMgcmVtb3ZlZDsgdGhlIGludmVyc2Ugb2YgbWFya2luZyBhcyBzYXZlZC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzbSA9IG5ldyBGLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyKCk7XG4gICAgICogICAgICBzbS5zYXZlZFJ1bnMucmVtb3ZlKCcwMDAwMDE1YTRjZDE3MDAyMDljZDBhN2QyMDdmNDRiYWMyODknKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xSdW5TZXJ2aWNlfSBydW4gUnVuIHRvIHJlbW92ZS4gUGFzcyBpbiBlaXRoZXIgdGhlIHJ1biBpZCwgYXMgYSBzdHJpbmcsIG9yIHRoZSBbUnVuIFNlcnZpY2VdKC4uLy4uL3J1bi1hcGktc2VydmljZS8pLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gb3RoZXJGaWVsZHMgKE9wdGlvbmFsKSBhbnkgb3RoZXIgbWV0YS1kYXRhIHRvIHNhdmUgd2l0aCB0aGUgcnVuLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAocnVuLCBvdGhlckZpZWxkcykge1xuICAgICAgICB2YXIgcGFyYW0gPSAkLmV4dGVuZCh0cnVlLCB7fSwgb3RoZXJGaWVsZHMsIHsgc2F2ZWQ6IGZhbHNlLCB0cmFzaGVkOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrKHJ1biwgcGFyYW0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIFNldHMgYWRkaXRpb25hbCBmaWVsZHMgb24gYSBydW4uIFRoaXMgaXMgYSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIFtSdW5TZXJ2aWNlI3NhdmVdKC4uLy4uL3J1bi1hcGktc2VydmljZS8jc2F2ZSkuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgc20gPSBuZXcgRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlcigpO1xuICAgICAqICAgICAgc20uc2F2ZWRSdW5zLm1hcmsoJzAwMDAwMTVhNGNkMTcwMDIwOWNkMGE3ZDIwN2Y0NGJhYzI4OScsIFxuICAgICAqICAgICAgICAgIHsgJ215UnVuTmFtZSc6ICdzYW1wbGUgcG9saWN5IGRlY2lzaW9ucycgfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8UnVuU2VydmljZX0gcnVuICBSdW4gdG8gb3BlcmF0ZSBvbi4gUGFzcyBpbiBlaXRoZXIgdGhlIHJ1biBpZCwgYXMgYSBzdHJpbmcsIG9yIHRoZSBbUnVuIFNlcnZpY2VdKC4uLy4uL3J1bi1hcGktc2VydmljZS8pLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gdG9NYXJrIEZpZWxkcyB0byBzZXQsIGFzIG5hbWUgOiB2YWx1ZSBwYWlycy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIG1hcms6IGZ1bmN0aW9uIChydW4sIHRvTWFyaykge1xuICAgICAgICB2YXIgcnM7XG4gICAgICAgIHZhciBleGlzdGluZ09wdGlvbnMgPSB0aGlzLnJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpO1xuICAgICAgICBpZiAocnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICAgICAgcnMgPSBydW47XG4gICAgICAgIH0gZWxzZSBpZiAocnVuICYmICh0eXBlb2YgcnVuID09PSAnc3RyaW5nJykpIHtcbiAgICAgICAgICAgIHJzID0gbmV3IFJ1blNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIGV4aXN0aW5nT3B0aW9ucywgeyBpZDogcnVuLCBhdXRvUmVzdG9yZTogZmFsc2UgfSkpO1xuICAgICAgICB9IGVsc2UgaWYgKCQuaXNBcnJheShydW4pKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHByb21zID0gcnVuLm1hcChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5tYXJrKHIsIHRvTWFyayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAkLndoZW4uYXBwbHkobnVsbCwgcHJvbXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHJ1biBvYmplY3QgcHJvdmlkZWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnMuc2F2ZSh0b01hcmspO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBzYXZlZCBydW5zLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNtID0gbmV3IEYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIoKTtcbiAgICAgKiAgICAgIHNtLnNhdmVkUnVucy5nZXRSdW5zKCkudGhlbihmdW5jdGlvbiAocnVucykge1xuICAgICAqICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxydW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdydW4gaWQgb2Ygc2F2ZWQgcnVuOiAnLCBydW5zW2ldLmlkKTtcbiAgICAgKiAgICAgICAgICB9XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge0FycmF5fSB2YXJpYWJsZXMgKE9wdGlvbmFsKSBJZiBwcm92aWRlZCwgaW4gdGhlIHJldHVybmVkIGxpc3Qgb2YgcnVucywgZWFjaCBydW4gd2lsbCBoYXZlIGEgYC52YXJpYWJsZXNgIHByb3BlcnR5IHdpdGggdGhlc2Ugc2V0LlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gZmlsdGVyICAgIChPcHRpb25hbCkgQW55IGZpbHRlcnMgdG8gYXBwbHkgd2hpbGUgZmV0Y2hpbmcgdGhlIHJ1bi4gU2VlIFtSdW5TZXJ2aWNlI2ZpbHRlcl0oLi4vLi4vcnVuLWFwaS1zZXJ2aWNlLyNmaWx0ZXIpIGZvciBkZXRhaWxzLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gbW9kaWZpZXJzIChPcHRpb25hbCkgVXNlIGZvciBwYWdpbmcvc29ydGluZyBldGMuIFNlZSBbUnVuU2VydmljZSNmaWx0ZXJdKC4uLy4uL3J1bi1hcGktc2VydmljZS8jZmlsdGVyKSBmb3IgZGV0YWlscy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGdldFJ1bnM6IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGZpbHRlciwgbW9kaWZpZXJzKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKHRoaXMucnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCkpO1xuXG4gICAgICAgIHZhciBzY29wZWRGaWx0ZXIgPSBpbmplY3RGaWx0ZXJzRnJvbVNlc3Npb24oJC5leHRlbmQodHJ1ZSwge30sIHtcbiAgICAgICAgICAgIHNhdmVkOiB0cnVlLCBcbiAgICAgICAgICAgIHRyYXNoZWQ6IGZhbHNlLFxuICAgICAgICB9LCBmaWx0ZXIpLCBzZXNzaW9uLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBvcE1vZGlmaWVycyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICBzb3J0OiAnY3JlYXRlZCcsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnLFxuICAgICAgICB9LCBtb2RpZmllcnMpO1xuICAgICAgICBpZiAodmFyaWFibGVzKSB7XG4gICAgICAgICAgICBvcE1vZGlmaWVycy5pbmNsdWRlID0gW10uY29uY2F0KHZhcmlhYmxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU2VydmljZS5xdWVyeShzY29wZWRGaWx0ZXIsIG9wTW9kaWZpZXJzKTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBTYXZlZFJ1bnNNYW5hZ2VyO1xuIiwiLyoqXG4qICMjIFNjZW5hcmlvIE1hbmFnZXJcbipcbiogSW4gc29tZSBwcm9qZWN0cywgb2Z0ZW4gY2FsbGVkIFwidHVybi1ieS10dXJuXCIgcHJvamVjdHMsIGVuZCB1c2VycyBhZHZhbmNlIHRocm91Z2ggdGhlIHByb2plY3QncyBtb2RlbCBzdGVwLWJ5LXN0ZXAsIHdvcmtpbmcgZWl0aGVyIGluZGl2aWR1YWxseSBvciB0b2dldGhlciB0byBtYWtlIGRlY2lzaW9ucyBhdCBlYWNoIHN0ZXAuIFxuKlxuKiBJbiBvdGhlciBwcm9qZWN0cywgb2Z0ZW4gY2FsbGVkIFwicnVuIGNvbXBhcmlzb25cIiBvciBcInNjZW5hcmlvIGNvbXBhcmlzb25cIiBwcm9qZWN0cywgZW5kIHVzZXJzIHNldCBzb21lIGluaXRpYWwgZGVjaXNpb25zLCB0aGVuIHNpbXVsYXRlIHRoZSBtb2RlbCB0byBpdHMgZW5kLiBUeXBpY2FsbHkgZW5kIHVzZXJzIHdpbGwgZG8gdGhpcyBzZXZlcmFsIHRpbWVzLCBjcmVhdGluZyBzZXZlcmFsIHJ1bnMsIGFuZCBjb21wYXJlIHRoZSByZXN1bHRzLiBcbipcbiogVGhlIFNjZW5hcmlvIE1hbmFnZXIgbWFrZXMgaXQgZWFzeSB0byBjcmVhdGUgdGhlc2UgXCJydW4gY29tcGFyaXNvblwiIHByb2plY3RzLiBFYWNoIFNjZW5hcmlvIE1hbmFnZXIgYWxsb3dzIHlvdSB0byBjb21wYXJlIHRoZSByZXN1bHRzIG9mIHNldmVyYWwgcnVucy4gVGhpcyBpcyBtb3N0bHkgdXNlZnVsIGZvciB0aW1lLWJhc2VkIG1vZGVsczsgYnkgZGVmYXVsdCwgeW91IGNhbiB1c2UgdGhlIFNjZW5hcmlvIE1hbmFnZXIgd2l0aCBbVmVuc2ltXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLCBbUG93ZXJzaW1dKC4uLy4uLy4uL21vZGVsX2NvZGUvcG93ZXJzaW0vKSwgYW5kIFtTaW1MYW5nXSguLi8uLi8uLi9tb2RlbF9jb2RlL2ZvcmlvX3NpbWxhbmcpLiAoWW91IGNhbiB1c2UgdGhlIFNjZW5hcmlvIE1hbmFnZXIgd2l0aCBvdGhlciBsYW5ndWFnZXMgYXMgd2VsbCwgYnkgdXNpbmcgdGhlIFNjZW5hcmlvIE1hbmFnZXIncyBbY29uZmlndXJhdGlvbiBvcHRpb25zXSgjY29uZmlndXJhdGlvbi1vcHRpb25zKSB0byBjaGFuZ2UgdGhlIGBhZHZhbmNlT3BlcmF0aW9uYC4pXG4qXG4qIFRoZSBTY2VuYXJpbyBNYW5hZ2VyIGNhbiBiZSB0aG91Z2h0IG9mIGFzIGEgY29sbGVjdGlvbiBvZiBbUnVuIE1hbmFnZXJzXSguLi9ydW4tbWFuYWdlci8pIHdpdGggcHJlLWNvbmZpZ3VyZWQgW3N0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKS4gSnVzdCBhcyB0aGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdXNlIGNhc2UgLWJhc2VkIGFic3RyYWN0aW9ucyBhbmQgdXRpbGl0aWVzIGZvciBtYW5hZ2luZyB0aGUgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSwgdGhlIFNjZW5hcmlvIE1hbmFnZXIgZG9lcyB0aGUgc2FtZSBmb3IgdGhlIFJ1biBNYW5hZ2VyLlxuKlxuKiBUaGVyZSBhcmUgdHlwaWNhbGx5IHRocmVlIGNvbXBvbmVudHMgdG8gYnVpbGRpbmcgYSBydW4gY29tcGFyaXNvbjpcbipcbiogKiBBIGBjdXJyZW50YCBydW4gaW4gd2hpY2ggdG8gbWFrZSBkZWNpc2lvbnM7IHRoaXMgaXMgZGVmaW5lZCBhcyBhIHJ1biB0aGF0IGhhc24ndCBiZWVuIGFkdmFuY2VkIHlldCwgYW5kIHNvIGNhbiBiZSB1c2VkIHRvIHNldCBpbml0aWFsIGRlY2lzaW9ucy4gVGhlIGN1cnJlbnQgcnVuIG1haW50YWlucyBzdGF0ZSBhY3Jvc3MgZGlmZmVyZW50IHNlc3Npb25zLlxuKiAqIEEgbGlzdCBvZiBgc2F2ZWRgIHJ1bnMsIHRoYXQgaXMsIGFsbCBydW5zIHRoYXQgeW91IHdhbnQgdG8gdXNlIGZvciBjb21wYXJpc29ucy5cbiogKiBBIGBiYXNlbGluZWAgcnVuIHRvIGNvbXBhcmUgYWdhaW5zdDsgdGhpcyBpcyBkZWZpbmVkIGFzIGEgcnVuIFwiYWR2YW5jZWQgdG8gdGhlIGVuZFwiIG9mIHlvdXIgbW9kZWwgdXNpbmcganVzdCB0aGUgbW9kZWwgZGVmYXVsdHMuIENvbXBhcmluZyBhZ2FpbnN0IGEgYmFzZWxpbmUgcnVuIGlzIG9wdGlvbmFsOyB5b3UgY2FuIFtjb25maWd1cmVdKCNjb25maWd1cmF0aW9uLW9wdGlvbnMpIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIHRvIG5vdCBpbmNsdWRlIG9uZS5cbipcbiogVG8gc2F0aXNmeSB0aGVzZSBuZWVkcyBhIFNjZW5hcmlvIE1hbmFnZXIgaW5zdGFuY2UgaGFzIHRocmVlIFJ1biBNYW5hZ2VyczogW2Jhc2VsaW5lXSguL2Jhc2VsaW5lLyksIFtjdXJyZW50XSguL2N1cnJlbnQvKSwgYW5kIFtzYXZlZFJ1bnNdKC4vc2F2ZWQvKS5cbipcbiogIyMjIFVzaW5nIHRoZSBTY2VuYXJpbyBNYW5hZ2VyIHRvIGNyZWF0ZSBhIHJ1biBjb21wYXJpc29uIHByb2plY3RcbipcbiogVG8gdXNlIHRoZSBTY2VuYXJpbyBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCwgdGhlbiBhY2Nlc3MgaXRzIFJ1biBNYW5hZ2VycyBhcyBuZWVkZWQgdG8gY3JlYXRlIHlvdXIgcHJvamVjdCdzIHVzZXIgaW50ZXJmYWNlOlxuKlxuKiAqKkV4YW1wbGUqKlxuKlxuKiAgICAgICB2YXIgc20gPSBuZXcgRi5tYW5hZ2VyLlNjZW5hcmlvTWFuYWdlcigpO1xuKlxuKiAgICAgICAvLyBUaGUgY3VycmVudCBpcyBhbiBpbnN0YW5jZSBvZiBhIFJ1biBNYW5hZ2VyLFxuKiAgICAgICAvLyB3aXRoIGEgc3RyYXRlZ3kgd2hpY2ggcGlja3MgdXAgdGhlIG1vc3QgcmVjZW50IHVuc2F2ZWQgcnVuLlxuKiAgICAgICAvLyBJdCBpcyB0eXBpY2FsbHkgdXNlZCB0byBzdG9yZSB0aGUgZGVjaXNpb25zIGJlaW5nIG1hZGUgYnkgdGhlIGVuZCB1c2VyLiBcbiogICAgICAgdmFyIGN1cnJlbnRSTSA9IHNtLmN1cnJlbnQ7XG4qXG4qICAgICAgIC8vIFRoZSBSdW4gTWFuYWdlciBvcGVyYXRpb24sIHdoaWNoIHJldHJpZXZlcyB0aGUgY3VycmVudCBydW4uXG4qICAgICAgIHNtLmN1cnJlbnQuZ2V0UnVuKCk7XG4qICAgICAgIC8vIFRoZSBSdW4gTWFuYWdlciBvcGVyYXRpb24sIHdoaWNoIHJlc2V0cyB0aGUgZGVjaXNpb25zIG1hZGUgb24gdGhlIGN1cnJlbnQgcnVuLlxuKiAgICAgICBzbS5jdXJyZW50LnJlc2V0KCk7XG4qICAgICAgIC8vIEEgc3BlY2lhbCBtZXRob2Qgb24gdGhlIGN1cnJlbnQgcnVuLFxuKiAgICAgICAvLyB3aGljaCBjbG9uZXMgdGhlIGN1cnJlbnQgcnVuLCB0aGVuIGFkdmFuY2VzIGFuZCBzYXZlcyB0aGlzIGNsb25lXG4qICAgICAgIC8vIChpdCBiZWNvbWVzIHBhcnQgb2YgdGhlIHNhdmVkIHJ1bnMgbGlzdCkuXG4qICAgICAgIC8vIFRoZSBjdXJyZW50IHJ1biBpcyB1bmNoYW5nZWQgYW5kIGNhbiBjb250aW51ZSB0byBiZSB1c2VkXG4qICAgICAgIC8vIHRvIHN0b3JlIGRlY2lzaW9ucyBiZWluZyBtYWRlIGJ5IHRoZSBlbmQgdXNlci5cbiogICAgICAgc20uY3VycmVudC5zYXZlQW5kQWR2YW5jZSgpO1xuKlxuKiAgICAgICAvLyBUaGUgc2F2ZWRSdW5zIGlzIGFuIGluc3RhbmNlIG9mIGEgU2F2ZWQgUnVucyBNYW5hZ2VyIFxuKiAgICAgICAvLyAoaXRzZWxmIGEgdmFyaWFudCBvZiBhIFJ1biBNYW5hZ2VyKS5cbiogICAgICAgLy8gSXQgaXMgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiogICAgICAgdmFyIHNhdmVkUk0gPSBzbS5zYXZlZFJ1bnM7XG4qICAgICAgIC8vIE1hcmsgYSBydW4gYXMgc2F2ZWQsIGFkZGluZyBpdCB0byB0aGUgc2V0IG9mIHNhdmVkIHJ1bnMuXG4qICAgICAgIHNtLnNhdmVkUnVucy5zYXZlKHJ1bik7XG4qICAgICAgIC8vIE1hcmsgYSBydW4gYXMgcmVtb3ZlZCwgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgc2V0IG9mIHNhdmVkIHJ1bnMuXG4qICAgICAgIHNtLnNhdmVkUnVucy5yZW1vdmUocnVuKTtcbiogICAgICAgLy8gTGlzdCB0aGUgc2F2ZWQgcnVucywgb3B0aW9uYWxseSBpbmNsdWRpbmcgc29tZSBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMgZm9yIGVhY2guXG4qICAgICAgIHNtLnNhdmVkUnVucy5nZXRSdW5zKCk7XG4qXG4qICAgICAgIC8vIFRoZSBiYXNlbGluZSBpcyBhbiBpbnN0YW5jZSBvZiBhIFJ1biBNYW5hZ2VyLFxuKiAgICAgICAvLyB3aXRoIGEgc3RyYXRlZ3kgd2hpY2ggbG9jYXRlcyB0aGUgbW9zdCByZWNlbnQgYmFzZWxpbmUgcnVuXG4qICAgICAgIC8vICh0aGF0IGlzLCBmbGFnZ2VkIGFzIGBzYXZlZGAgYW5kIG5vdCBgdHJhc2hlZGApLCBvciBjcmVhdGVzIGEgbmV3IG9uZS5cbiogICAgICAgLy8gSXQgaXMgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiogICAgICAgdmFyIGJhc2VsaW5lUk0gPSBzbS5iYXNlbGluZTtcbipcbiogICAgICAgLy8gVGhlIFJ1biBNYW5hZ2VyIG9wZXJhdGlvbiwgd2hpY2ggcmV0cmlldmVzIHRoZSBiYXNlbGluZSBydW4uXG4qICAgICAgIHNtLmJhc2VsaW5lLmdldFJ1bigpO1xuKiAgICAgICAvLyBUaGUgUnVuIE1hbmFnZXIgb3BlcmF0aW9uLCB3aGljaCByZXNldHMgdGhlIGJhc2VsaW5lIHJ1bi5cbiogICAgICAgLy8gVXNlZnVsIGlmIHRoZSBtb2RlbCBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgYmFzZWxpbmUgcnVuIHdhcyBjcmVhdGVkLlxuKiAgICAgICBzbS5iYXNlbGluZS5yZXNldCgpOyBcbiovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gU2VlIGludGVncmF0aW9uLXRlc3Qtc2NlbmFyaW8tbWFuYWdlciBmb3IgdXNhZ2UgZXhhbXBsZXNcbnZhciBSdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9ydW4tbWFuYWdlcicpO1xudmFyIFNhdmVkUnVuc01hbmFnZXIgPSByZXF1aXJlKCcuL3NhdmVkLXJ1bnMtbWFuYWdlcicpO1xudmFyIHN0cmF0ZWd5VXRpbHMgPSByZXF1aXJlKCcuL3N0cmF0ZWd5LXV0aWxzJyk7XG52YXIgcnV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3J1bi11dGlsJyk7XG5cbnZhciBOb25lU3RyYXRlZ3kgPSByZXF1aXJlKCcuL3J1bi1zdHJhdGVnaWVzL25vbmUtc3RyYXRlZ3knKTtcblxudmFyIFN0YXRlU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxudmFyIEJhc2VsaW5lU3RyYXRlZ3kgPSByZXF1aXJlKCcuL3NjZW5hcmlvLXN0cmF0ZWdpZXMvYmFzZWxpbmUtc3RyYXRlZ3knKTtcbnZhciBMYXN0VW5zYXZlZFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9zY2VuYXJpby1zdHJhdGVnaWVzL3JldXNlLWxhc3QtdW5zYXZlZCcpO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogT3BlcmF0aW9ucyB0byBwZXJmb3JtIG9uIGVhY2ggcnVuIHRvIGluZGljYXRlIHRoYXQgdGhlIHJ1biBpcyBjb21wbGV0ZS4gT3BlcmF0aW9ucyBhcmUgZXhlY3V0ZWQgW3NlcmlhbGx5XSguLi9ydW4tYXBpLXNlcnZpY2UvI3NlcmlhbCkuIERlZmF1bHRzIHRvIGNhbGxpbmcgdGhlIG1vZGVsIG9wZXJhdGlvbiBgc3RlcFRvKCdlbmQnKWAsIHdoaWNoIGFkdmFuY2VzIFZlbnNpbSwgUG93ZXJzaW0sIGFuZCBTaW1MYW5nIG1vZGVscyB0byB0aGUgZW5kLiBcbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgYWR2YW5jZU9wZXJhdGlvbjogW3sgbmFtZTogJ3N0ZXBUbycsIHBhcmFtczogWydlbmQnXSB9XSxcblxuICAgIC8qKlxuICAgICAqIEFkZGl0aW9uYWwgb3B0aW9ucyB0byBwYXNzIHRocm91Z2ggdG8gcnVuIGNyZWF0aW9uIChmb3IgZS5nLiwgYGZpbGVzYCwgZXRjLikuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHJ1bjoge30sXG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIGEgYmFzZWxpbmUgcnVuIGluIHRoaXMgU2NlbmFyaW8gTWFuYWdlci4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIGluY2x1ZGVCYXNlTGluZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEFkZGl0aW9uYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlIGBiYXNlbGluZWAgcnVuLiBcbiAgICAgKlxuICAgICAqICogYGJhc2VsaW5lLnJ1bk5hbWVgOiBOYW1lIG9mIHRoZSBiYXNlbGluZSBydW4uIERlZmF1bHRzIHRvICdCYXNlbGluZScuIFxuICAgICAqICogYGJhc2VsaW5lLnJ1bmA6IEFkZGl0aW9uYWwgb3B0aW9ucyB0byBwYXNzIHRocm91Z2ggdG8gcnVuIGNyZWF0aW9uLCBzcGVjaWZpY2FsbHkgZm9yIHRoZSBiYXNlbGluZSBydW4uIFRoZXNlIHdpbGwgb3ZlcnJpZGUgYW55IG9wdGlvbnMgcHJvdmlkZWQgdW5kZXIgYHJ1bmAuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC4gXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBiYXNlbGluZToge1xuICAgICAgICBydW5OYW1lOiAnQmFzZWxpbmUnLFxuICAgICAgICBydW46IHt9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZGl0aW9uYWwgY29uZmlndXJhdGlvbiBmb3IgdGhlIGBjdXJyZW50YCBydW4uIFxuICAgICAqXG4gICAgICogKiBgY3VycmVudC5ydW5gOiBBZGRpdGlvbmFsIG9wdGlvbnMgdG8gcGFzcyB0aHJvdWdoIHRvIHJ1biBjcmVhdGlvbiwgc3BlY2lmaWNhbGx5IGZvciB0aGUgY3VycmVudCBydW4uIFRoZXNlIHdpbGwgb3ZlcnJpZGUgYW55IG9wdGlvbnMgcHJvdmlkZWQgdW5kZXIgYHJ1bmAuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIGN1cnJlbnQ6IHtcbiAgICAgICAgcnVuOiB7fVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcHRpb25zIHRvIHBhc3MgdGhyb3VnaCB0byB0aGUgYHNhdmVkUnVuc2AgbGlzdC4gU2VlIHRoZSBbU2F2ZWQgUnVucyBNYW5hZ2VyXSguL3NhdmVkLykgZm9yIGNvbXBsZXRlIGRlc2NyaXB0aW9uIG9mIGF2YWlsYWJsZSBvcHRpb25zLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBzYXZlZFJ1bnM6IHt9XG59O1xuXG5mdW5jdGlvbiBTY2VuYXJpb01hbmFnZXIoY29uZmlnKSB7XG4gICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcuYWR2YW5jZU9wZXJhdGlvbikge1xuICAgICAgICBvcHRzLmFkdmFuY2VPcGVyYXRpb24gPSBjb25maWcuYWR2YW5jZU9wZXJhdGlvbjsgLy9qcXVlcnkuZXh0ZW5kIGRvZXMgYSBwb29yIGpvYiB0cnlpbmcgdG8gbWVyZ2UgYXJyYXlzXG4gICAgfVxuXG4gICAgdmFyIEJhc2VsaW5lU3RyYXRlZ3lUb1VzZSA9IG9wdHMuaW5jbHVkZUJhc2VMaW5lID8gQmFzZWxpbmVTdHJhdGVneSA6IE5vbmVTdHJhdGVneTtcbiAgICAvKipcbiAgICAgKiBBIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBpbnN0YW5jZSBjb250YWluaW5nIGEgJ2Jhc2VsaW5lJyBydW4gdG8gY29tcGFyZSBhZ2FpbnN0OyB0aGlzIGlzIGRlZmluZWQgYXMgYSBydW4gXCJhZHZhbmNlZCB0byB0aGUgZW5kXCIgb2YgeW91ciBtb2RlbCB1c2luZyBqdXN0IHRoZSBtb2RlbCBkZWZhdWx0cy4gQnkgZGVmYXVsdCB0aGUgXCJhZHZhbmNlXCIgb3BlcmF0aW9uIGlzIGFzc3VtZWQgdG8gYmUgYHN0ZXBUbzogZW5kYCwgd2hpY2ggd29ya3MgZm9yIHRpbWUtYmFzZWQgbW9kZWxzIGluIFtWZW5zaW1dKC4uLy4uLy4uL21vZGVsX2NvZGUvdmVuc2ltLyksIFtQb3dlcnNpbV0oLi4vLi4vLi4vbW9kZWxfY29kZS9wb3dlcnNpbS8pLCBhbmQgW1NpbUxhbmddKC4uLy4uLy4uL21vZGVsX2NvZGUvZm9yaW9fc2ltbGFuZykuIElmIHlvdSdyZSB1c2luZyBhIGRpZmZlcmVudCBsYW5ndWFnZSwgb3IgbmVlZCB0byBjaGFuZ2UgdGhpcywganVzdCBwYXNzIGluIGEgZGlmZmVyZW50IGBhZHZhbmNlT3BlcmF0aW9uYCBvcHRpb24gd2hpbGUgY3JlYXRpbmcgdGhlIFNjZW5hcmlvIE1hbmFnZXIuIFRoZSBiYXNlbGluZSBydW4gaXMgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiAgICAgKiBAcmV0dXJuIHtSdW5NYW5hZ2VyfVxuICAgICAqL1xuICAgIHRoaXMuYmFzZWxpbmUgPSBuZXcgUnVuTWFuYWdlcih7XG4gICAgICAgIHN0cmF0ZWd5OiBCYXNlbGluZVN0cmF0ZWd5VG9Vc2UsXG4gICAgICAgIHNlc3Npb25LZXk6ICdzbS1iYXNlbGluZS1ydW4nLFxuICAgICAgICBydW46IHN0cmF0ZWd5VXRpbHMubWVyZ2VSdW5PcHRpb25zKG9wdHMucnVuLCBvcHRzLmJhc2VsaW5lLnJ1biksXG4gICAgICAgIHN0cmF0ZWd5T3B0aW9uczoge1xuICAgICAgICAgICAgYmFzZWxpbmVOYW1lOiBvcHRzLmJhc2VsaW5lLnJ1bk5hbWUsXG4gICAgICAgICAgICBpbml0T3BlcmF0aW9uOiBvcHRzLmFkdmFuY2VPcGVyYXRpb25cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQSBbU2F2ZWRSdW5zTWFuYWdlcl0oLi4vc2F2ZWQtcnVucy1tYW5hZ2VyLykgaW5zdGFuY2UgY29udGFpbmluZyBhIGxpc3Qgb2Ygc2F2ZWQgcnVucywgdGhhdCBpcywgYWxsIHJ1bnMgdGhhdCB5b3Ugd2FudCB0byB1c2UgZm9yIGNvbXBhcmlzb25zLiBUaGUgc2F2ZWQgcnVucyBhcmUgdHlwaWNhbGx5IGRpc3BsYXllZCBpbiB0aGUgcHJvamVjdCdzIFVJIGFzIHBhcnQgb2YgYSBydW4gY29tcGFyaXNvbiB0YWJsZSBvciBjaGFydC5cbiAgICAgKiBAcmV0dXJuIHtTYXZlZFJ1bnNNYW5hZ2VyfVxuICAgICAqL1xuICAgIHRoaXMuc2F2ZWRSdW5zID0gbmV3IFNhdmVkUnVuc01hbmFnZXIoJC5leHRlbmQodHJ1ZSwge30sIHtcbiAgICAgICAgcnVuOiBvcHRzLnJ1bixcbiAgICB9LCBvcHRzLnNhdmVkUnVucykpO1xuXG4gICAgdmFyIG9yaWdHZXRSdW5zID0gdGhpcy5zYXZlZFJ1bnMuZ2V0UnVucztcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHRoaXMuc2F2ZWRSdW5zLmdldFJ1bnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIG1lLmJhc2VsaW5lLmdldFJ1bigpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdHZXRSdW5zLmFwcGx5KG1lLnNhdmVkUnVucywgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBpbnN0YW5jZSBjb250YWluaW5nIGEgJ2N1cnJlbnQnIHJ1bjsgdGhpcyBpcyBkZWZpbmVkIGFzIGEgcnVuIHRoYXQgaGFzbid0IGJlZW4gYWR2YW5jZWQgeWV0LCBhbmQgc28gY2FuIGJlIHVzZWQgdG8gc2V0IGluaXRpYWwgZGVjaXNpb25zLiBUaGUgY3VycmVudCBydW4gaXMgdHlwaWNhbGx5IHVzZWQgdG8gc3RvcmUgdGhlIGRlY2lzaW9ucyBiZWluZyBtYWRlIGJ5IHRoZSBlbmQgdXNlci5cbiAgICAgKiBAcmV0dXJuIHtSdW5NYW5hZ2VyfVxuICAgICAqL1xuICAgIHRoaXMuY3VycmVudCA9IG5ldyBSdW5NYW5hZ2VyKHtcbiAgICAgICAgc3RyYXRlZ3k6IExhc3RVbnNhdmVkU3RyYXRlZ3ksXG4gICAgICAgIHNlc3Npb25LZXk6ICdzbS1jdXJyZW50LXJ1bicsXG4gICAgICAgIHJ1bjogc3RyYXRlZ3lVdGlscy5tZXJnZVJ1bk9wdGlvbnMob3B0cy5ydW4sIG9wdHMuY3VycmVudC5ydW4pXG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDbG9uZXMgdGhlIGN1cnJlbnQgcnVuLCBhZHZhbmNlcyB0aGlzIGNsb25lIGJ5IGNhbGxpbmcgdGhlIGBhZHZhbmNlT3BlcmF0aW9uYCwgYW5kIHNhdmVzIHRoZSBjbG9uZWQgcnVuIChpdCBiZWNvbWVzIHBhcnQgb2YgdGhlIGBzYXZlZFJ1bnNgIGxpc3QpLiBBZGRpdGlvbmFsbHksIGFkZHMgYW55IHByb3ZpZGVkIG1ldGFkYXRhIHRvIHRoZSBjbG9uZWQgcnVuOyB0eXBpY2FsbHkgdXNlZCBmb3IgbmFtaW5nIHRoZSBydW4uIFRoZSBjdXJyZW50IHJ1biBpcyB1bmNoYW5nZWQgYW5kIGNhbiBjb250aW51ZSB0byBiZSB1c2VkIHRvIHN0b3JlIGRlY2lzaW9ucyBiZWluZyBtYWRlIGJ5IHRoZSBlbmQgdXNlci5cbiAgICAgKlxuICAgICAqIEF2YWlsYWJsZSBvbmx5IGZvciB0aGUgU2NlbmFyaW8gTWFuYWdlcidzIGBjdXJyZW50YCBwcm9wZXJ0eSAoUnVuIE1hbmFnZXIpLiBcbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzbSA9IG5ldyBGLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyKCk7XG4gICAgICogICAgICBzbS5jdXJyZW50LnNhdmVBbmRBZHZhbmNlKHsnbXlSdW5OYW1lJzogJ3NhbXBsZSBwb2xpY3kgZGVjaXNpb25zJ30pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG1ldGFkYXRhICAgTWV0YWRhdGEgdG8gc2F2ZSwgZm9yIGV4YW1wbGUsIHRoZSBydW4gbmFtZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHRoaXMuY3VycmVudC5zYXZlQW5kQWR2YW5jZSA9IGZ1bmN0aW9uIChtZXRhZGF0YSkge1xuICAgICAgICBmdW5jdGlvbiBjbG9uZShydW4pIHtcbiAgICAgICAgICAgIHZhciBzYSA9IG5ldyBTdGF0ZVNlcnZpY2UoKTtcbiAgICAgICAgICAgIHZhciBhZHZhbmNlT3BucyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3B0cy5hZHZhbmNlT3BlcmF0aW9uKTsgXG4gICAgICAgICAgICAvL3J1biBpJ20gY2xvbmluZyBzaG91bGRuJ3QgaGF2ZSB0aGUgYWR2YW5jZSBvcGVyYXRpb25zIHRoZXJlIGJ5IGRlZmF1bHQsIGJ1dCBqdXN0IGluIGNhc2VcbiAgICAgICAgICAgIHJldHVybiBzYS5jbG9uZSh7IHJ1bklkOiBydW4uaWQsIGV4Y2x1ZGU6IGFkdmFuY2VPcG5zLm9wcyB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBycyA9IG5ldyBSdW5TZXJ2aWNlKG1lLmN1cnJlbnQucnVuLmdldEN1cnJlbnRDb25maWcoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJzLmxvYWQocmVzcG9uc2UucnVuKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG1hcmtTYXZlZChydW4pIHtcbiAgICAgICAgICAgIHJldHVybiBtZS5zYXZlZFJ1bnMuc2F2ZShydW4uaWQsIG1ldGFkYXRhKS50aGVuKGZ1bmN0aW9uIChzYXZlZFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBydW4sIHNhdmVkUmVzcG9uc2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gYWR2YW5jZShydW4pIHtcbiAgICAgICAgICAgIHZhciBycyA9IG5ldyBSdW5TZXJ2aWNlKHJ1bik7XG4gICAgICAgICAgICByZXR1cm4gcnMuc2VyaWFsKG9wdHMuYWR2YW5jZU9wZXJhdGlvbikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZS5jdXJyZW50XG4gICAgICAgICAgICAgICAgLmdldFJ1bigpXG4gICAgICAgICAgICAgICAgLnRoZW4oY2xvbmUpXG4gICAgICAgICAgICAgICAgLnRoZW4oYWR2YW5jZSlcbiAgICAgICAgICAgICAgICAudGhlbihtYXJrU2F2ZWQpO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmFyaW9NYW5hZ2VyO1xuIiwiLyoqXG4gKiAjIyBCYXNlbGluZVxuICpcbiAqIEFuIGluc3RhbmNlIG9mIGEgW1J1biBNYW5hZ2VyXSguLi8uLi9ydW4tbWFuYWdlci8pIHdpdGggYSBiYXNlbGluZSBzdHJhdGVneSBpcyBpbmNsdWRlZCBhdXRvbWF0aWNhbGx5IGluIGV2ZXJ5IGluc3RhbmNlIG9mIGEgW1NjZW5hcmlvIE1hbmFnZXJdKC4uLyksIGFuZCBpcyBhY2Nlc3NpYmxlIGZyb20gdGhlIFNjZW5hcmlvIE1hbmFnZXIgYXQgYC5iYXNlbGluZWAuXG4gKlxuICogQSBiYXNlbGluZSBpcyBkZWZpbmVkIGFzIGEgcnVuIFwiYWR2YW5jZWQgdG8gdGhlIGVuZFwiIHVzaW5nIGp1c3QgdGhlIG1vZGVsIGRlZmF1bHRzLiBUaGUgYmFzZWxpbmUgcnVuIGlzIHR5cGljYWxseSBkaXNwbGF5ZWQgaW4gdGhlIHByb2plY3QncyBVSSBhcyBwYXJ0IG9mIGEgcnVuIGNvbXBhcmlzb24gdGFibGUgb3IgY2hhcnQuXG4gKlxuICogVGhlIGBiYXNlbGluZWAgc3RyYXRlZ3kgbG9va3MgZm9yIHRoZSBtb3N0IHJlY2VudCBydW4gbmFtZWQgYXMgJ0Jhc2VsaW5lJyAob3IgbmFtZWQgYXMgc3BlY2lmaWVkIGluIHRoZSBgYmFzZWxpbmUucnVuTmFtZWAgW2NvbmZpZ3VyYXRpb24gb3B0aW9uIG9mIHRoZSBTY2VuYXJpbyBNYW5hZ2VyXSguLi8jY29uZmlndXJhdGlvbi1vcHRpb25zKSkgdGhhdCBpcyBmbGFnZ2VkIGFzIGBzYXZlZGAgYW5kIG5vdCBgdHJhc2hlZGAuIElmIHRoZSBzdHJhdGVneSBjYW5ub3QgZmluZCBzdWNoIGEgcnVuLCBpdCBjcmVhdGVzIGEgbmV3IHJ1biBhbmQgaW1tZWRpYXRlbHkgZXhlY3V0ZXMgYSBzZXQgb2YgaW5pdGlhbGl6YXRpb24gb3BlcmF0aW9ucy4gXG4gKlxuICogQ29tcGFyaW5nIGFnYWluc3QgYSBiYXNlbGluZSBydW4gaXMgb3B0aW9uYWwgaW4gYSBTY2VuYXJpbyBNYW5hZ2VyOyB5b3UgY2FuIFtjb25maWd1cmVdKC4uLyNjb25maWd1cmF0aW9uLW9wdGlvbnMpIHlvdXIgU2NlbmFyaW8gTWFuYWdlciB0byBub3QgaW5jbHVkZSBvbmUuIFNlZSBbbW9yZSBpbmZvcm1hdGlvbl0oLi4vI3Byb3BlcnRpZXMpIG9uIHVzaW5nIGAuYmFzZWxpbmVgIHdpdGhpbiB0aGUgU2NlbmFyaW8gTWFuYWdlci5cbiAqXG4gKiBTZWUgYWxzbzogW2FkZGl0aW9uYWwgaW5mb3JtYXRpb24gb24gcnVuIHN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWdpZXMvKS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmV1c2Vpbml0U3RyYXRlZ3kgPSByZXF1aXJlKCcuLi9ydW4tc3RyYXRlZ2llcy9yZXVzZS1sYXN0LWluaXRpYWxpemVkJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGJhc2VsaW5lTmFtZTogJ0Jhc2VsaW5lJyxcbiAgICAgICAgaW5pdE9wZXJhdGlvbjogW3sgc3RlcFRvOiAnZW5kJyB9XVxuICAgIH07XG4gICAgdmFyIHN0cmF0ZWd5T3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zLnN0cmF0ZWd5T3B0aW9ucyA6IHt9O1xuICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBzdHJhdGVneU9wdGlvbnMpO1xuICAgIHJldHVybiBuZXcgUmV1c2Vpbml0U3RyYXRlZ3koe1xuICAgICAgICBzdHJhdGVneU9wdGlvbnM6IHtcbiAgICAgICAgICAgIGluaXRPcGVyYXRpb246IG9wdHMuaW5pdE9wZXJhdGlvbixcbiAgICAgICAgICAgIGZsYWc6IHtcbiAgICAgICAgICAgICAgICBzYXZlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0cmFzaGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lOiBvcHRzLmJhc2VsaW5lTmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwiLyoqXG4gKiAjIyBDdXJyZW50IChyZXVzZS1sYXN0LXVuc2F2ZWQpXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgYSBbUnVuIE1hbmFnZXJdKC4uLy4uL3J1bi1tYW5hZ2VyLykgd2l0aCB0aGlzIHN0cmF0ZWd5IGlzIGluY2x1ZGVkIGF1dG9tYXRpY2FsbHkgaW4gZXZlcnkgaW5zdGFuY2Ugb2YgYSBbU2NlbmFyaW8gTWFuYWdlcl0oLi4vKSwgYW5kIGlzIGFjY2Vzc2libGUgZnJvbSB0aGUgU2NlbmFyaW8gTWFuYWdlciBhdCBgLmN1cnJlbnRgLlxuICpcbiAqIFRoZSBgcmV1c2UtbGFzdC11bnNhdmVkYCBzdHJhdGVneSByZXR1cm5zIHRoZSBtb3N0IHJlY2VudCBydW4gdGhhdCBpcyBub3QgZmxhZ2dlZCBhcyBgdHJhc2hlZGAgYW5kIGFsc28gbm90IGZsYWdnZWQgYXMgYHNhdmVkYC5cbiAqIFxuICogVXNpbmcgdGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IGVuZCB1c2VycyBjb250aW51ZSB3b3JraW5nIHdpdGggdGhlIG1vc3QgcmVjZW50IHJ1biB0aGF0IGhhcyBub3QgYmVlbiBleHBsaWNpdGx5IGZsYWdnZWQgYnkgdGhlIHByb2plY3QuIEhvd2V2ZXIsIGlmIHRoZXJlIGFyZSBubyBydW5zIGZvciB0aGlzIGVuZCB1c2VyLCBhIG5ldyBydW4gaXMgY3JlYXRlZC5cbiAqIFxuICogU3BlY2lmaWNhbGx5LCB0aGUgc3RyYXRlZ3kgaXM6XG4gKlxuICogKiBDaGVjayB0aGUgYHNhdmVkYCBhbmQgYHRyYXNoZWRgIGZpZWxkcyBvZiB0aGUgcnVuIHRvIGRldGVybWluZSBpZiB0aGUgcnVuIGhhcyBiZWVuIGV4cGxpY2l0bHkgc2F2ZWQgb3IgZXhwbGljaXRseSBmbGFnZ2VkIGFzIG5vIGxvbmdlciB1c2VmdWwuXG4gKiAgICAgKiBSZXR1cm4gdGhlIG1vc3QgcmVjZW50IHJ1biB0aGF0IGlzIG5vdCBgdHJhc2hlZGAgYW5kIGFsc28gbm90IGBzYXZlZGAuXG4gKiAgICAgKiBJZiB0aGVyZSBhcmUgbm8gcnVucywgY3JlYXRlIGEgbmV3IHJ1biBmb3IgdGhpcyBlbmQgdXNlci4gXG4gKlxuICogU2VlIFttb3JlIGluZm9ybWF0aW9uXSguLi8jcHJvcGVydGllcykgb24gdXNpbmcgYC5jdXJyZW50YCB3aXRoaW4gdGhlIFNjZW5hcmlvIE1hbmFnZXIuXG4gKlxuICogU2VlIGFsc286IFthZGRpdGlvbmFsIGluZm9ybWF0aW9uIG9uIHJ1biBzdHJhdGVnaWVzXSguLi8uLi9zdHJhdGVnaWVzLykuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIGluamVjdEZpbHRlcnNGcm9tU2Vzc2lvbiA9IHJlcXVpcmUoJy4uL3N0cmF0ZWd5LXV0aWxzJykuaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uO1xudmFyIGluamVjdFNjb3BlRnJvbVNlc3Npb24gPSByZXF1aXJlKCcuLi9zdHJhdGVneS11dGlscycpLmluamVjdFNjb3BlRnJvbVNlc3Npb247XG5cbnZhciBCYXNlID0ge307XG5cbi8vVE9ETzogTWFrZSBhIG1vcmUgZ2VuZXJpYyB2ZXJzaW9uIG9mIHRoaXMgY2FsbGVkICdyZXVzZS1ieS1tYXRjaGluZy1maWx0ZXInO1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgc3RyYXRlZ3lPcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMuc3RyYXRlZ3lPcHRpb25zIDoge307XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHN0cmF0ZWd5T3B0aW9ucztcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbikge1xuICAgICAgICB2YXIgb3B0ID0gaW5qZWN0U2NvcGVGcm9tU2Vzc2lvbihydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKSwgdXNlclNlc3Npb24pO1xuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5jcmVhdGUob3B0KS50aGVuKGZ1bmN0aW9uIChjcmVhdGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2Uuc2F2ZSh7IHRyYXNoZWQ6IGZhbHNlIH0pLnRoZW4oZnVuY3Rpb24gKHBhdGNoUmVzcG9uc2UpIHsgLy9UT0RPIHJlbW92ZSB0aGlzIG9uY2UgRVBJQ0VOVEVSLTI1MDAgaXMgZml4ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIGNyZWF0ZVJlc3BvbnNlLCBwYXRjaFJlc3BvbnNlLCB7IGZyZXNobHlDcmVhdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbikge1xuICAgICAgICB2YXIgZmlsdGVyID0gaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uKHsgXG4gICAgICAgICAgICBzYXZlZDogZmFsc2UsXG4gICAgICAgICAgICB0cmFzaGVkOiBmYWxzZSwgLy9UT0RPIGNoYW5nZSB0byAnIT10cnVlJyBvbmNlIEVQSUNFTlRFUi0yNTAwIGlzIGZpeGVkXG4gICAgICAgIH0sIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIG91dHB1dE1vZGlmaWVycyA9IHsgXG4gICAgICAgICAgICAvLyBzdGFydHJlY29yZDogMCwgIC8vVE9ETzogVW5jb21tZW50IHdoZW4gRVBJQ0VOVEVSLTI1NjkgaXMgZml4ZWRcbiAgICAgICAgICAgIC8vIGVuZHJlY29yZDogMCxcbiAgICAgICAgICAgIHNvcnQ6ICdjcmVhdGVkJywgXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5xdWVyeShmaWx0ZXIsIG91dHB1dE1vZGlmaWVycykudGhlbihmdW5jdGlvbiAocnVucykge1xuICAgICAgICAgICAgaWYgKCFydW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXNldChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVuc1swXTtcbiAgICAgICAgfSk7XG4gICAgfVxufSwgeyByZXF1aXJlc0F1dGg6IGZhbHNlIH0pOyIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZXNldDogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcikge1xuICAgICAgICByZXR1cm4gbWFuYWdlci5yZXNldChvcHRpb25zKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1lcmdlUnVuT3B0aW9uczogZnVuY3Rpb24gKHJ1biwgb3B0aW9ucykge1xuICAgICAgICBpZiAocnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICAgICAgcnVuLnVwZGF0ZUNvbmZpZyhvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgIH0gXG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgcnVuLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgaW5qZWN0RmlsdGVyc0Zyb21TZXNzaW9uOiBmdW5jdGlvbiAoY3VycmVudEZpbHRlciwgc2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICBzY29wZUJ5R3JvdXA6IHRydWUsXG4gICAgICAgICAgICBzY29wZUJ5VXNlcjogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBmaWx0ZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgY3VycmVudEZpbHRlcik7XG4gICAgICAgIGlmIChvcHRzLnNjb3BlQnlHcm91cCAmJiBzZXNzaW9uICYmIHNlc3Npb24uZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICBmaWx0ZXJbJ3Njb3BlLmdyb3VwJ10gPSBzZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5zY29wZUJ5VXNlciAmJiBzZXNzaW9uICYmIHNlc3Npb24udXNlcklkKSB7XG4gICAgICAgICAgICBmaWx0ZXJbJ3VzZXIuaWQnXSA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWx0ZXI7XG4gICAgfSxcblxuICAgIGluamVjdFNjb3BlRnJvbVNlc3Npb246IGZ1bmN0aW9uIChjdXJyZW50UGFyYW1zLCBzZXNzaW9uKSB7XG4gICAgICAgIHZhciBncm91cCA9IHNlc3Npb24gJiYgc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgY3VycmVudFBhcmFtcyk7XG4gICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgJC5leHRlbmQocGFyYW1zLCB7XG4gICAgICAgICAgICAgICAgc2NvcGU6IHsgZ3JvdXA6IGdyb3VwIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxufTsiLCIvKipcbiogIyMgV29ybGQgTWFuYWdlclxuKlxuKiBBcyBkaXNjdXNzZWQgdW5kZXIgdGhlIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKSwgYSBbcnVuXSguLi8uLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgZW5kIHVzZXIgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwuIEZvciBidWlsZGluZyBtdWx0aXBsYXllciBzaW11bGF0aW9ucyB5b3UgdHlwaWNhbGx5IHdhbnQgbXVsdGlwbGUgZW5kIHVzZXJzIHRvIHNoYXJlIHRoZSBzYW1lIHNldCBvZiBpbnRlcmFjdGlvbnMsIGFuZCB3b3JrIHdpdGhpbiBhIGNvbW1vbiBzdGF0ZS4gRXBpY2VudGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlIFwid29ybGRzXCIgdG8gaGFuZGxlIHN1Y2ggY2FzZXMuXG4qXG4qIFRoZSBXb3JsZCBNYW5hZ2VyIHByb3ZpZGVzIGFuIGVhc3kgd2F5IHRvIHRyYWNrIGFuZCBhY2Nlc3MgdGhlIGN1cnJlbnQgd29ybGQgYW5kIHJ1biBmb3IgcGFydGljdWxhciBlbmQgdXNlcnMuIEl0IGlzIHR5cGljYWxseSB1c2VkIGluIHBhZ2VzIHRoYXQgZW5kIHVzZXJzIHdpbGwgaW50ZXJhY3Qgd2l0aC4gKFRoZSByZWxhdGVkIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKSBoYW5kbGVzIGNyZWF0aW5nIG11bHRpcGxheWVyIHdvcmxkcywgYW5kIGFkZGluZyBhbmQgcmVtb3ZpbmcgZW5kIHVzZXJzIGFuZCBydW5zIGZyb20gYSB3b3JsZC4gQmVjYXVzZSBvZiB0aGlzLCB0eXBpY2FsbHkgdGhlIFdvcmxkIEFkYXB0ZXIgaXMgdXNlZCBmb3IgZmFjaWxpdGF0b3IgcGFnZXMgaW4geW91ciBwcm9qZWN0LilcbipcbiogIyMjIFVzaW5nIHRoZSBXb3JsZCBNYW5hZ2VyXG4qXG4qIFRvIHVzZSB0aGUgV29ybGQgTWFuYWdlciwgaW5zdGFudGlhdGUgaXQuIFRoZW4sIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkLlxuKlxuKiBXaGVuIHlvdSBpbnN0YW50aWF0ZSBhIFdvcmxkIE1hbmFnZXIsIHRoZSB3b3JsZCdzIGFjY291bnQgaWQsIHByb2plY3QgaWQsIGFuZCBncm91cCBhcmUgYXV0b21hdGljYWxseSB0YWtlbiBmcm9tIHRoZSBzZXNzaW9uICh0aGFua3MgdG8gdGhlIFtBdXRoZW50aWNhdGlvbiBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlKSkuXG4qXG4qIE5vdGUgdGhhdCB0aGUgV29ybGQgTWFuYWdlciBkb2VzICpub3QqIGNyZWF0ZSB3b3JsZHMgYXV0b21hdGljYWxseS4gKFRoaXMgaXMgZGlmZmVyZW50IHRoYW4gdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIpLikgSG93ZXZlciwgeW91IGNhbiBwYXNzIGluIHNwZWNpZmljIG9wdGlvbnMgdG8gYW55IHJ1bnMgY3JlYXRlZCBieSB0aGUgbWFuYWdlciwgdXNpbmcgYSBgcnVuYCBvYmplY3QuXG4qXG4qIFRoZSBwYXJhbWV0ZXJzIGZvciBjcmVhdGluZyBhIFdvcmxkIE1hbmFnZXIgYXJlOlxuKlxuKiAgICogYGFjY291bnRgOiBUaGUgKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYHByb2plY3RgOiBUaGUgKipQcm9qZWN0IElEKiogZm9yIHRoaXMgcHJvamVjdC5cbiogICAqIGBncm91cGA6IFRoZSAqKkdyb3VwIE5hbWUqKiBmb3IgdGhpcyB3b3JsZC5cbiogICAqIGBydW5gOiBPcHRpb25zIHRvIHVzZSB3aGVuIGNyZWF0aW5nIG5ldyBydW5zIHdpdGggdGhlIG1hbmFnZXIsIGUuZy4gYHJ1bjogeyBmaWxlczogWydkYXRhLnhscyddIH1gLlxuKiAgICogYHJ1bi5tb2RlbGA6IFRoZSBuYW1lIG9mIHRoZSBwcmltYXJ5IG1vZGVsIGZpbGUgZm9yIHRoaXMgcHJvamVjdC4gUmVxdWlyZWQgaWYgeW91IGhhdmUgbm90IGFscmVhZHkgcGFzc2VkIGl0IGluIGFzIHBhcnQgb2YgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgZm9yIGFuIGVuY2xvc2luZyBjYWxsLlxuKlxuKiBGb3IgZXhhbXBsZTpcbipcbiogICAgICAgdmFyIHdNZ3IgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4qICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiogICAgICAgICAgcnVuOiB7IG1vZGVsOiAnc3VwcGx5LWNoYWluLnB5JyB9LFxuKiAgICAgICAgICBncm91cDogJ3RlYW0xJ1xuKiAgICAgICB9KTtcbipcbiogICAgICAgd01nci5nZXRDdXJyZW50UnVuKCk7XG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBXb3JsZEFwaSA9IHJlcXVpcmUoJy4uL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcbnZhciBSdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9ydW4tbWFuYWdlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9hdXRoLW1hbmFnZXInKTtcbnZhciB3b3JsZEFwaTtcblxuZnVuY3Rpb24gYnVpbGRTdHJhdGVneSh3b3JsZElkLCBkdGQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbiBDdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgICAgICAkLmV4dGVuZCh0aGlzLCB7XG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGQuIE5lZWQgYXBpIGNoYW5nZXMnKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8vZ2V0IG9yIGNyZWF0ZSFcbiAgICAgICAgICAgICAgICAvLyBNb2RlbCBpcyByZXF1aXJlZCBpbiB0aGUgb3B0aW9uc1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoaXMub3B0aW9ucy5ydW4ubW9kZWwgfHwgdGhpcy5vcHRpb25zLm1vZGVsO1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogbW9kZWwsIGZpbHRlcjogd29ybGRJZCB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5TZXJ2aWNlLmxvYWQocnVuSWQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZVdpdGgobWUsIFtydW5dKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHsgcnVuOiB7fSwgd29ybGQ6IHt9IH07XG5cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm9wdGlvbnMsIHRoaXMub3B0aW9ucy5ydW4pO1xuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLndvcmxkKTtcblxuICAgIHdvcmxkQXBpID0gbmV3IFdvcmxkQXBpKHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICB2YXIgYXBpID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgd29ybGQgKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbV29ybGQgQVBJIEFkYXB0ZXJdKC4uL3dvcmxkLWFwaS1hZGFwdGVyLykuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgd01nci5nZXRDdXJyZW50V29ybGQoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICAgICogICAgICAgICAgICAgICBjb25zb2xlLmxvZyh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICB3b3JsZEFkYXB0ZXIuZ2V0Q3VycmVudFJ1bklkKCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIChPcHRpb25hbCkgVGhlIGlkIG9mIHRoZSB1c2VyIHdob3NlIHdvcmxkIGlzIGJlaW5nIGFjY2Vzc2VkLiBEZWZhdWx0cyB0byB0aGUgdXNlciBpbiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBUaGUgbmFtZSBvZiB0aGUgZ3JvdXAgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSBncm91cCBmb3IgdGhlIHVzZXIgaW4gdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50V29ybGQ6IGZ1bmN0aW9uICh1c2VySWQsIGdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIGdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRXb3JsZEZvclVzZXIodXNlcklkLCBncm91cE5hbWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgcnVuIChvYmplY3QpIGFuZCBhbiBpbnN0YW5jZSBvZiB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgd01nci5nZXRDdXJyZW50UnVuKHttb2RlbDogJ215TW9kZWwucHknfSlcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnVuLCBydW5TZXJ2aWNlKSB7XG4gICAgICAgICogICAgICAgICAgICAgICBjb25zb2xlLmxvZyhydW4uaWQpO1xuICAgICAgICAqICAgICAgICAgICAgICAgcnVuU2VydmljZS5kbygnc3RhcnRHYW1lJyk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kZWwgKE9wdGlvbmFsKSBUaGUgbmFtZSBvZiB0aGUgbW9kZWwgZmlsZS4gUmVxdWlyZWQgaWYgbm90IGFscmVhZHkgcGFzc2VkIGluIGFzIGBydW4ubW9kZWxgIHdoZW4gdGhlIFdvcmxkIE1hbmFnZXIgaXMgY3JlYXRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50UnVuOiBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICAgICAgdmFyIGN1ckdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRBbmRSZXN0b3JlTGF0ZXN0UnVuKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3b3JsZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IGVycm9yOiAnVGhlIHVzZXIgaXMgbm90IHBhcnQgb2YgYW55IHdvcmxkIScgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXb3JsZElkID0gd29ybGQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJ1bk9wdHMgPSAkLmV4dGVuZCh0cnVlLCBtZS5vcHRpb25zLCB7IG1vZGVsOiBtb2RlbCB9KTtcbiAgICAgICAgICAgICAgICB2YXIgc3RyYXRlZ3kgPSBidWlsZFN0cmF0ZWd5KGN1cnJlbnRXb3JsZElkLCBkdGQpO1xuICAgICAgICAgICAgICAgIHZhciBvcHQgPSAkLmV4dGVuZCh0cnVlLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICBzdHJhdGVneTogc3RyYXRlZ3ksXG4gICAgICAgICAgICAgICAgICAgIHJ1bjogcnVuT3B0c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBybSA9IG5ldyBSdW5NYW5hZ2VyKG9wdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJtLmdldFJ1bigpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKHJ1biwgcm0ucnVuU2VydmljZSwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5nZXRDdXJyZW50V29ybGQoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZ2V0QW5kUmVzdG9yZUxhdGVzdFJ1bik7XG5cbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIGFwaSk7XG59O1xuIiwiLyoqXG4gKiAjIyBGaWxlIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIEZpbGUgQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byB1cGxvYWQgYW5kIGRvd25sb2FkIGZpbGVzIGRpcmVjdGx5IG9udG8gRXBpY2VudGVyLCBhbmFsb2dvdXMgdG8gdXNpbmcgdGhlIEZpbGUgTWFuYWdlciBVSSBpbiBFcGljZW50ZXIgZGlyZWN0bHkgb3IgU0ZUUGluZyBmaWxlcyBpbi4gSXQgaXMgYmFzZWQgb24gdGhlIEVwaWNlbnRlciBGaWxlIEFQSS5cbiAqXG4gKiAgICAgICB2YXIgZmEgPSBuZXcgRi5zZXJ2aWNlLkZpbGUoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgIH0pO1xuICogICAgICAgZmEuY3JlYXRlKCd0ZXN0LnR4dCcsICd0aGVzZSBhcmUgbXkgZmlsZWNvbnRlbnRzJyk7XG4gKlxuICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgY3JlYXRlIGEgbmV3IGZpbGUgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmaWxlIGlucHV0XG4gKiAgICAgICAvLyA8aW5wdXQgaWQ9XCJmaWxldXBsb2FkXCIgdHlwZT1cImZpbGVcIj5cbiAqICAgICAgIC8vXG4gKiAgICAgICAkKCcjZmlsZXVwbG9hZCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoZSkge1xuICogICAgICAgICAgdmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcbiAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gKiAgICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUsIGZpbGUubmFtZSk7XG4gKiAgICAgICAgICBmYS5jcmVhdGUoZmlsZS5uYW1lLCBkYXRhKTtcbiAqICAgICAgIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBmb2xkZXIgdHlwZS4gIE9uZSBvZiBgbW9kZWxgIHwgYHN0YXRpY2AgfCBgbm9kZWAuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmb2xkZXJUeXBlOiAnc3RhdGljJyxcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuXG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIHVwbG9hZEJvZHkoZmlsZU5hbWUsIGNvbnRlbnRzKSB7XG4gICAgICAgIHZhciBib3VuZGFyeSA9ICctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS03ZGEyNGYyZTUwMDQ2JztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYm9keTogJy0tJyArIGJvdW5kYXJ5ICsgJ1xcclxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1EaXNwb3NpdGlvbjogZm9ybS1kYXRhOyBuYW1lPVwiZmlsZVwiOycgK1xuICAgICAgICAgICAgICAgICAgICAnZmlsZW5hbWU9XCInICsgZmlsZU5hbWUgKyAnXCJcXHJcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtdHlwZTogdGV4dC9odG1sXFxyXFxuXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRzICsgJ1xcclxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnLS0nICsgYm91bmRhcnkgKyAnLS0nLFxuICAgICAgICAgICAgYm91bmRhcnk6IGJvdW5kYXJ5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBsb2FkRmlsZU9wdGlvbnMoZmlsZVBhdGgsIGNvbnRlbnRzLCBvcHRpb25zKSB7XG4gICAgICAgIGZpbGVQYXRoID0gZmlsZVBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgdmFyIGZpbGVOYW1lID0gZmlsZVBhdGgucG9wKCk7XG4gICAgICAgIGZpbGVQYXRoID0gZmlsZVBhdGguam9pbignLycpO1xuICAgICAgICB2YXIgcGF0aCA9IHNlcnZpY2VPcHRpb25zLmZvbGRlclR5cGUgKyAnLycgKyBmaWxlUGF0aDtcblxuICAgICAgICB2YXIgZXh0cmFQYXJhbXMgPSB7fTtcbiAgICAgICAgaWYgKGNvbnRlbnRzIGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgIGV4dHJhUGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGNvbnRlbnRzLFxuICAgICAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHVwbG9hZCA9IHVwbG9hZEJvZHkoZmlsZU5hbWUsIGNvbnRlbnRzKTtcbiAgICAgICAgICAgIGV4dHJhUGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IHVwbG9hZC5ib2R5LFxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JyArIHVwbG9hZC5ib3VuZGFyeVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKSArIHBhdGgsXG4gICAgICAgIH0sIGV4dHJhUGFyYW1zKTtcbiAgICB9XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYSBkaXJlY3RvcnkgbGlzdGluZywgb3IgY29udGVudHMgb2YgYSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmlsZVBhdGggIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGdldENvbnRlbnRzOiBmdW5jdGlvbiAoZmlsZVBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVwbGFjZXMgdGhlIGZpbGUgYXQgdGhlIGdpdmVuIGZpbGUgcGF0aC5cbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlUGF0aCBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZyB8IEZvcm1EYXRhIH0gY29udGVudHMgQ29udGVudHMgdG8gd3JpdGUgdG8gZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9IHVwbG9hZEZpbGVPcHRpb25zKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wdXQoaHR0cE9wdGlvbnMuZGF0YSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgZmlsZSBpbiB0aGUgZ2l2ZW4gZmlsZSBwYXRoLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nIHwgRm9ybURhdGEgfSBjb250ZW50cyBDb250ZW50cyB0byB3cml0ZSB0byBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IHJlcGxhY2VFeGlzdGluZyBSZXBsYWNlIGZpbGUgaWYgaXQgYWxyZWFkeSBleGlzdHM7IGRlZmF1bHRzIHRvIGZhbHNlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgY29udGVudHMsIHJlcGxhY2VFeGlzdGluZywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gdXBsb2FkRmlsZU9wdGlvbnMoZmlsZVBhdGgsIGNvbnRlbnRzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBwcm9tID0gaHR0cC5wb3N0KGh0dHBPcHRpb25zLmRhdGEsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICBpZiAocmVwbGFjZUV4aXN0aW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcHJvbSA9IHByb20udGhlbihudWxsLCBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb25mbGljdFN0YXR1cyA9IDQwOTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IGNvbmZsaWN0U3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVwbGFjZShmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvbTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyB0aGUgZmlsZS5cbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlUGF0aCBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoZmlsZVBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUobnVsbCwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW5hbWVzIHRoZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBuZXdOYW1lICBOZXcgbmFtZSBvZiBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcmVuYW1lOiBmdW5jdGlvbiAoZmlsZVBhdGgsIG5ld05hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaCh7IG5hbWU6IG5ld05hbWUgfSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbn07XG4iLCIvKipcbiAqICMjIEFzc2V0IEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIEFzc2V0IEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gc3RvcmUgYXNzZXRzIC0tIHJlc291cmNlcyBvciBmaWxlcyBvZiBhbnkga2luZCAtLSB1c2VkIGJ5IGEgcHJvamVjdCB3aXRoIGEgc2NvcGUgdGhhdCBpcyBzcGVjaWZpYyB0byBwcm9qZWN0LCBncm91cCwgb3IgZW5kIHVzZXIuXG4gKlxuICogQXNzZXRzIGFyZSB1c2VkIHdpdGggW3RlYW0gcHJvamVjdHNdKC4uLy4uLy4uL3Byb2plY3RfYWRtaW4vI3RlYW0pLiBPbmUgY29tbW9uIHVzZSBjYXNlIGlzIGhhdmluZyBlbmQgdXNlcnMgaW4gYSBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpIG9yIGluIGEgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpIHVwbG9hZCBkYXRhIC0tIHZpZGVvcyBjcmVhdGVkIGR1cmluZyBnYW1lIHBsYXksIHByb2ZpbGUgcGljdHVyZXMgZm9yIGN1c3RvbWl6aW5nIHRoZWlyIGV4cGVyaWVuY2UsIGV0Yy4gLS0gYXMgcGFydCBvZiBwbGF5aW5nIHRocm91Z2ggdGhlIHByb2plY3QuXG4gKlxuICogUmVzb3VyY2VzIGNyZWF0ZWQgdXNpbmcgdGhlIEFzc2V0IEFkYXB0ZXIgYXJlIHNjb3BlZDpcbiAqXG4gKiAgKiBQcm9qZWN0IGFzc2V0cyBhcmUgd3JpdGFibGUgb25seSBieSBbdGVhbSBtZW1iZXJzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSksIHRoYXQgaXMsIEVwaWNlbnRlciBhdXRob3JzLlxuICogICogR3JvdXAgYXNzZXRzIGFyZSB3cml0YWJsZSBieSBhbnlvbmUgd2l0aCBhY2Nlc3MgdG8gdGhlIHByb2plY3QgdGhhdCBpcyBwYXJ0IG9mIHRoYXQgcGFydGljdWxhciBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLiBUaGlzIGluY2x1ZGVzIGFsbCBbdGVhbSBtZW1iZXJzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgKEVwaWNlbnRlciBhdXRob3JzKSBhbmQgYW55IFtlbmQgdXNlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2Vycykgd2hvIGFyZSBtZW1iZXJzIG9mIHRoZSBncm91cCAtLSBib3RoIGZhY2lsaXRhdG9ycyBhbmQgc3RhbmRhcmQgZW5kIHVzZXJzLlxuICogICogVXNlciBhc3NldHMgYXJlIHdyaXRhYmxlIGJ5IHRoZSBzcGVjaWZpYyBlbmQgdXNlciwgYW5kIGJ5IHRoZSBmYWNpbGl0YXRvciBvZiB0aGUgZ3JvdXAuXG4gKiAgKiBBbGwgYXNzZXRzIGFyZSByZWFkYWJsZSBieSBhbnlvbmUgd2l0aCB0aGUgZXhhY3QgVVJJLlxuICpcbiAqIFRvIHVzZSB0aGUgQXNzZXQgQWRhcHRlciwgaW5zdGFudGlhdGUgaXQgYW5kIHRoZW4gYWNjZXNzIHRoZSBtZXRob2RzIHByb3ZpZGVkLiBJbnN0YW50aWF0aW5nIHJlcXVpcmVzIHRoZSBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlKSBhbmQgcHJvamVjdCBpZCAoKipQcm9qZWN0IElEKiopLiBUaGUgZ3JvdXAgbmFtZSBpcyByZXF1aXJlZCBmb3IgYXNzZXRzIHdpdGggYSBncm91cCBzY29wZSwgYW5kIHRoZSBncm91cCBuYW1lIGFuZCB1c2VySWQgYXJlIHJlcXVpcmVkIGZvciBhc3NldHMgd2l0aCBhIHVzZXIgc2NvcGUuIElmIG5vdCBpbmNsdWRlZCwgdGhleSBhcmUgdGFrZW4gZnJvbSB0aGUgbG9nZ2VkIGluIHVzZXIncyBzZXNzaW9uIGluZm9ybWF0aW9uIGlmIG5lZWRlZC5cbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGFuIGFzc2V0LCB5b3UgY2FuIHBhc3MgaW4gdGV4dCAoZW5jb2RlZCBkYXRhKSB0byB0aGUgYGNyZWF0ZSgpYCBjYWxsLiBBbHRlcm5hdGl2ZWx5LCB5b3UgY2FuIG1ha2UgdGhlIGBjcmVhdGUoKWAgY2FsbCBhcyBwYXJ0IG9mIGFuIEhUTUwgZm9ybSBhbmQgcGFzcyBpbiBhIGZpbGUgdXBsb2FkZWQgdmlhIHRoZSBmb3JtLlxuICpcbiAqICAgICAgIC8vIGluc3RhbnRpYXRlIHRoZSBBc3NldCBBZGFwdGVyXG4gKiAgICAgICB2YXIgYWEgPSBuZXcgRi5zZXJ2aWNlLkFzc2V0KHtcbiAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAqICAgICAgICAgIHVzZXJJZDogJzEyMzQ1J1xuICogICAgICAgfSk7XG4gKlxuICogICAgICAgLy8gY3JlYXRlIGEgbmV3IGFzc2V0IHVzaW5nIGVuY29kZWQgdGV4dFxuICogICAgICAgYWEuY3JlYXRlKCd0ZXN0LnR4dCcsIHtcbiAqICAgICAgICAgICBlbmNvZGluZzogJ0JBU0VfNjQnLFxuICogICAgICAgICAgIGRhdGE6ICdWR2hwY3lCcGN5QmhJSFJsYzNRZ1ptbHNaUzQ9JyxcbiAqICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXG4gKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gKlxuICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgY3JlYXRlIGEgbmV3IGFzc2V0IHVzaW5nIGEgZmlsZSB1cGxvYWRlZCB0aHJvdWdoIGEgZm9ybVxuICogICAgICAgLy8gdGhpcyBzYW1wbGUgY29kZSBnb2VzIHdpdGggYW4gaHRtbCBmb3JtIHRoYXQgbG9va3MgbGlrZSB0aGlzOlxuICogICAgICAgLy9cbiAqICAgICAgIC8vIDxmb3JtIGlkPVwidXBsb2FkLWZpbGVcIj5cbiAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZVwiIHR5cGU9XCJmaWxlXCI+XG4gKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIm15RmlsZS50eHRcIj5cbiAqICAgICAgIC8vICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+VXBsb2FkIG15RmlsZTwvYnV0dG9uPlxuICogICAgICAgLy8gPC9mb3JtPlxuICogICAgICAgLy9cbiAqICAgICAgICQoJyN1cGxvYWQtZmlsZScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkge1xuICogICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICogICAgICAgICAgdmFyIGZpbGVuYW1lID0gJCgnI2ZpbGVuYW1lJykudmFsKCk7XG4gKiAgICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICogICAgICAgICAgdmFyIGlucHV0Q29udHJvbCA9ICQoJyNmaWxlJylbMF07XG4gKiAgICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGlucHV0Q29udHJvbC5maWxlc1swXSwgZmlsZW5hbWUpO1xuICpcbiAqICAgICAgICAgIGFhLmNyZWF0ZShmaWxlbmFtZSwgZGF0YSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICogICAgICAgfSk7XG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBhcGlFbmRwb2ludCA9ICdhc3NldCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIERlZmF1bHRzIHRvIHNlc3Npb24ncyBgZ3JvdXBOYW1lYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwOiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdXNlciBpZC4gRGVmYXVsdHMgdG8gc2Vzc2lvbidzIGB1c2VySWRgLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlcklkOiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgc2NvcGUgZm9yIHRoZSBhc3NldC4gVmFsaWQgdmFsdWVzIGFyZTogYHVzZXJgLCBgZ3JvdXBgLCBhbmQgYHByb2plY3RgLiBTZWUgYWJvdmUgZm9yIHRoZSByZXF1aXJlZCBwZXJtaXNzaW9ucyB0byB3cml0ZSB0byBlYWNoIHNjb3BlLiBEZWZhdWx0cyB0byBgdXNlcmAsIG1lYW5pbmcgdGhlIGN1cnJlbnQgZW5kIHVzZXIgb3IgYSBmYWNpbGl0YXRvciBpbiB0aGUgZW5kIHVzZXIncyBncm91cCBjYW4gZWRpdCB0aGUgYXNzZXQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBzY29wZTogJ3VzZXInLFxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lcyBpZiBhIHJlcXVlc3QgdG8gbGlzdCB0aGUgYXNzZXRzIGluIGEgc2NvcGUgaW5jbHVkZXMgdGhlIGNvbXBsZXRlIFVSTCBmb3IgZWFjaCBhc3NldCAoYHRydWVgKSwgb3Igb25seSB0aGUgZmlsZSBuYW1lcyBvZiB0aGUgYXNzZXRzIChgZmFsc2VgKS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bGxVcmw6IHRydWUsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdHJhbnNwb3J0IG9iamVjdCBjb250YWlucyB0aGUgb3B0aW9ucyBwYXNzZWQgdG8gdGhlIFhIUiByZXF1ZXN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7XG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2VcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMuYWNjb3VudCA9IHVybENvbmZpZy5hY2NvdW50UGF0aDtcbiAgICB9XG5cbiAgICBpZiAoIXNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMucHJvamVjdCA9IHVybENvbmZpZy5wcm9qZWN0UGF0aDtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgYXNzZXRBcGlQYXJhbXMgPSBbJ2VuY29kaW5nJywgJ2RhdGEnLCAnY29udGVudFR5cGUnXTtcbiAgICB2YXIgc2NvcGVDb25maWcgPSB7XG4gICAgICAgIHVzZXI6IFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJywgJ3VzZXJJZCddLFxuICAgICAgICBncm91cDogWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSxcbiAgICAgICAgcHJvamVjdDogWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnXSxcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZW5hbWUgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgaWYgKCFmaWxlbmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmaWxlbmFtZSBpcyBuZWVkZWQuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlVXJsUGFyYW1zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHBhcnRLZXlzID0gc2NvcGVDb25maWdbb3B0aW9ucy5zY29wZV07XG4gICAgICAgIGlmICghcGFydEtleXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2NvcGUgcGFyYW1ldGVyIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQuZWFjaChwYXJ0S2V5cywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zW3RoaXNdKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMgKyAnIHBhcmFtZXRlciBpcyBuZWVkZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYnVpbGRVcmwgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsaWRhdGVVcmxQYXJhbXMob3B0aW9ucyk7XG4gICAgICAgIHZhciBwYXJ0S2V5cyA9IHNjb3BlQ29uZmlnW29wdGlvbnMuc2NvcGVdO1xuICAgICAgICB2YXIgcGFydHMgPSAkLm1hcChwYXJ0S2V5cywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnNba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBhZGRpbmcgYSB0cmFpbGluZyAvIGluIHRoZSBVUkwgYXMgdGhlIEFzc2V0IEFQSVxuICAgICAgICAgICAgLy8gZG9lcyBub3Qgd29yayBjb3JyZWN0bHkgd2l0aCBpdFxuICAgICAgICAgICAgZmlsZW5hbWUgPSAnLycgKyBmaWxlbmFtZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcGFydHMuam9pbignLycpICsgZmlsZW5hbWU7XG4gICAgfTtcblxuICAgIC8vIFByaXZhdGUgZnVuY3Rpb24sIGFsbCByZXF1ZXN0cyBmb2xsb3cgYSBtb3JlIG9yIGxlc3Mgc2FtZSBhcHByb2FjaCB0b1xuICAgIC8vIHVzZSB0aGUgQXNzZXQgQVBJIGFuZCB0aGUgZGlmZmVyZW5jZSBpcyB0aGUgSFRUUCB2ZXJiXG4gICAgLy9cbiAgICAvLyBAcGFyYW0ge3N0cmluZ30gbWV0aG9kYCAoUmVxdWlyZWQpIEhUVFAgdmVyYlxuICAgIC8vIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZWAgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGRlbGV0ZS9yZXBsYWNlL2NyZWF0ZVxuICAgIC8vIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNgIChPcHRpb25hbCkgQm9keSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIEFzc2V0IEFQSVxuICAgIC8vIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgIHZhciB1cGxvYWQgPSBmdW5jdGlvbiAobWV0aG9kLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhbGlkYXRlRmlsZW5hbWUoZmlsZW5hbWUpO1xuICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHBhcmFtZXRlciBpcyBjbGVhblxuICAgICAgICBtZXRob2QgPSBtZXRob2QudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGNvbnRlbnRUeXBlID0gcGFyYW1zIGluc3RhbmNlb2YgRm9ybURhdGEgPT09IHRydWUgPyBmYWxzZSA6ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgaWYgKGNvbnRlbnRUeXBlID09PSAnYXBwbGljYXRpb24vanNvbicpIHtcbiAgICAgICAgICAgIC8vIHdoaXRlbGlzdCB0aGUgZmllbGRzIHRoYXQgd2UgYWN0dWFsbHkgY2FuIHNlbmQgdG8gdGhlIGFwaVxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBhc3NldEFwaVBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2Ugd2UncmUgc2VuZGluZyBmb3JtIGRhdGEgd2hpY2ggZ29lcyBkaXJlY3RseSBpbiByZXF1ZXN0IGJvZHlcbiAgICAgICAgICAgIC8vIEZvciBtdWx0aXBhcnQvZm9ybS1kYXRhIHVwbG9hZHMgdGhlIGZpbGVuYW1lIGlzIG5vdCBzZXQgaW4gdGhlIFVSTCxcbiAgICAgICAgICAgIC8vIGl0J3MgZ2V0dGluZyBwaWNrZWQgYnkgdGhlIEZvcm1EYXRhIGZpZWxkIGZpbGVuYW1lLlxuICAgICAgICAgICAgZmlsZW5hbWUgPSBtZXRob2QgPT09ICdwb3N0JyB8fCBtZXRob2QgPT09ICdwdXQnID8gJycgOiBmaWxlbmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHZhciB1cmwgPSBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwsIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB9KTtcblxuICAgICAgICByZXR1cm4gaHR0cFttZXRob2RdKHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBmaWxlIGluIHRoZSBBc3NldCBBUEkuIFRoZSBzZXJ2ZXIgcmV0dXJucyBhbiBlcnJvciAoc3RhdHVzIGNvZGUgYDQwOWAsIGNvbmZsaWN0KSBpZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0cywgc29cbiAgICAgICAgKiBjaGVjayBmaXJzdCB3aXRoIGEgYGxpc3QoKWAgb3IgYSBgZ2V0KClgLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgYWEgPSBuZXcgRi5zZXJ2aWNlLkFzc2V0KHtcbiAgICAgICAgKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAgICAgICAgKiAgICAgICAgICB1c2VySWQ6ICcnXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gICAgICAgICogICAgICAgYWEuY3JlYXRlKCd0ZXN0LnR4dCcsIHtcbiAgICAgICAgKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElIUmxjM1FnWm1sc1pTND0nLFxuICAgICAgICAqICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXG4gICAgICAgICogICAgICAgfSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgY3JlYXRlIGEgbmV3IGFzc2V0IHVzaW5nIGEgZmlsZSB1cGxvYWRlZCB0aHJvdWdoIGEgZm9ybVxuICAgICAgICAqICAgICAgIC8vIHRoaXMgc2FtcGxlIGNvZGUgZ29lcyB3aXRoIGFuIGh0bWwgZm9ybSB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgIC8vIDxmb3JtIGlkPVwidXBsb2FkLWZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVcIiB0eXBlPVwiZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+VXBsb2FkIG15RmlsZTwvYnV0dG9uPlxuICAgICAgICAqICAgICAgIC8vIDwvZm9ybT5cbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgICQoJyN1cGxvYWQtZmlsZScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAqICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjZmlsZW5hbWUnKS52YWwoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBpbnB1dENvbnRyb2wgPSAkKCcjZmlsZScpWzBdO1xuICAgICAgICAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICBhYS5jcmVhdGUoZmlsZW5hbWUsIGRhdGEsIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byBjcmVhdGUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUEkuIFJlcXVpcmVkIGlmIHRoZSBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYCwgb3RoZXJ3aXNlIGlnbm9yZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5lbmNvZGluZyBFaXRoZXIgYEhFWGAgb3IgYEJBU0VfNjRgLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmRhdGEgVGhlIGVuY29kZWQgZGF0YSBmb3IgdGhlIGZpbGUuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGVudFR5cGUgVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gT3B0aW9uYWwuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdwb3N0JywgZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhIGZpbGUgZnJvbSB0aGUgQXNzZXQgQVBJLCBmZXRjaGluZyB0aGUgYXNzZXQgY29udGVudC4gKFRvIGdldCBhIGxpc3RcbiAgICAgICAgKiBvZiB0aGUgYXNzZXRzIGluIGEgc2NvcGUsIHVzZSBgbGlzdCgpYC4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIHJldHJpZXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBnZXRTZXJ2aWNlT3B0aW9ucyA9IF9waWNrKHNlcnZpY2VPcHRpb25zLCBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCcsICd1c2VySWQnXSk7XG4gICAgICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBnZXRTZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gYnVpbGRVcmwoZmlsZW5hbWUsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBsaXN0IG9mIHRoZSBhc3NldHMgaW4gYSBzY29wZS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBhYS5saXN0KHsgZnVsbFVybDogdHJ1ZSB9KS50aGVuKGZ1bmN0aW9uKGZpbGVMaXN0KXtcbiAgICAgICAgKiAgICAgICAgICAgY29uc29sZS5sb2coJ2FycmF5IG9mIGZpbGVzID0gJywgZmlsZUxpc3QpO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zY29wZSAoT3B0aW9uYWwpIFRoZSBzY29wZSAoYHVzZXJgLCBgZ3JvdXBgLCBgcHJvamVjdGApLlxuICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5mdWxsVXJsIChPcHRpb25hbCkgRGV0ZXJtaW5lcyBpZiB0aGUgbGlzdCBvZiBhc3NldHMgaW4gYSBzY29wZSBpbmNsdWRlcyB0aGUgY29tcGxldGUgVVJMIGZvciBlYWNoIGFzc2V0IChgdHJ1ZWApLCBvciBvbmx5IHRoZSBmaWxlIG5hbWVzIG9mIHRoZSBhc3NldHMgKGBmYWxzZWApLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGxpc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSBidWlsZFVybCgnJywgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB1cmxPcHRpb25zLCB7IHVybDogdXJsIH0pO1xuICAgICAgICAgICAgdmFyIGZ1bGxVcmwgPSBnZXRPcHRpb25zLmZ1bGxVcmw7XG5cbiAgICAgICAgICAgIGlmICghZnVsbFVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnVsbFBhdGhGaWxlcyA9ICQubWFwKGZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkVXJsKGZpbGUsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmVXaXRoKG1lLCBbZnVsbFBhdGhGaWxlc10pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlcGxhY2VzIGFuIGV4aXN0aW5nIGZpbGUgaW4gdGhlIEFzc2V0IEFQSS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyByZXBsYWNlIGFuIGFzc2V0IHVzaW5nIGVuY29kZWQgdGV4dFxuICAgICAgICAqICAgICAgIGFhLnJlcGxhY2UoJ3Rlc3QudHh0Jywge1xuICAgICAgICAqICAgICAgICAgICBlbmNvZGluZzogJ0JBU0VfNjQnLFxuICAgICAgICAqICAgICAgICAgICBkYXRhOiAnVkdocGN5QnBjeUJoSUhObFkyOXVaQ0IwWlhOMElHWnBiR1V1JyxcbiAgICAgICAgKiAgICAgICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3BsYWluJ1xuICAgICAgICAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIGFsdGVybmF0aXZlbHksIHJlcGxhY2UgYW4gYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gICAgICAgICogICAgICAgLy8gdGhpcyBzYW1wbGUgY29kZSBnb2VzIHdpdGggYW4gaHRtbCBmb3JtIHRoYXQgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgLy8gPGZvcm0gaWQ9XCJyZXBsYWNlLWZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVcIiB0eXBlPVwiZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwicmVwbGFjZS1maWxlbmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJteUZpbGUudHh0XCI+XG4gICAgICAgICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5SZXBsYWNlIG15RmlsZTwvYnV0dG9uPlxuICAgICAgICAqICAgICAgIC8vIDwvZm9ybT5cbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgICQoJyNyZXBsYWNlLWZpbGUnKS5vbignc3VibWl0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgKiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGZpbGVuYW1lID0gJCgnI3JlcGxhY2UtZmlsZW5hbWUnKS52YWwoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBpbnB1dENvbnRyb2wgPSAkKCcjZmlsZScpWzBdO1xuICAgICAgICAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICBhYS5yZXBsYWNlKGZpbGVuYW1lLCBkYXRhLCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIGJlaW5nIHJlcGxhY2VkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJLiBSZXF1aXJlZCBpZiB0aGUgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAsIG90aGVyd2lzZSBpZ25vcmVkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZW5jb2RpbmcgRWl0aGVyIGBIRVhgIG9yIGBCQVNFXzY0YC4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5kYXRhIFRoZSBlbmNvZGVkIGRhdGEgZm9yIHRoZSBmaWxlLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmNvbnRlbnRUeXBlIFRoZSBtaW1lIHR5cGUgb2YgdGhlIGZpbGUuIE9wdGlvbmFsLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgcmVwbGFjZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ3B1dCcsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgYSBmaWxlIGZyb20gdGhlIEFzc2V0IEFQSS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBhYS5kZWxldGUoc2FtcGxlRmlsZU5hbWUpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byBkZWxldGUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwbG9hZCgnZGVsZXRlJywgZmlsZW5hbWUsIHt9LCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3NldFVybDogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gYnVpbGRVcmwoZmlsZW5hbWUsIHVybE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIEF1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIEF1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlIHByb3ZpZGVzIGEgbWV0aG9kIGZvciBsb2dnaW5nIGluLCB3aGljaCBjcmVhdGVzIGFuZCByZXR1cm5zIGEgdXNlciBhY2Nlc3MgdG9rZW4uXG4gKlxuICogVXNlciBhY2Nlc3MgdG9rZW5zIGFyZSByZXF1aXJlZCBmb3IgZWFjaCBjYWxsIHRvIEVwaWNlbnRlci4gKFNlZSBbUHJvamVjdCBBY2Nlc3NdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykgZm9yIG1vcmUgaW5mb3JtYXRpb24uKVxuICpcbiAqIElmIHlvdSBuZWVkIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eSAtLSBzdWNoIGFzIHRyYWNraW5nIHNlc3Npb24gaW5mb3JtYXRpb24sIGVhc2lseSByZXRyaWV2aW5nIHRoZSB1c2VyIHRva2VuLCBvciBnZXR0aW5nIHRoZSBncm91cHMgdG8gd2hpY2ggYW4gZW5kIHVzZXIgYmVsb25ncyAtLSBjb25zaWRlciB1c2luZyB0aGUgW0F1dGhvcml6YXRpb24gTWFuYWdlcl0oLi4vYXV0aC1tYW5hZ2VyLykgaW5zdGVhZC5cbiAqXG4gKiAgICAgIHZhciBhdXRoID0gbmV3IEYuc2VydmljZS5BdXRoKCk7XG4gKiAgICAgIGF1dGgubG9naW4oeyB1c2VyTmFtZTogJ2pzbWl0aEBhY21lc2ltdWxhdGlvbnMuY29tJyxcbiAqICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCcgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVtYWlsIG9yIHVzZXJuYW1lIHRvIHVzZSBmb3IgbG9nZ2luZyBpbi4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlck5hbWU6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHBhc3N3b3JkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIFJlcXVpcmVkIGlmIHRoZSBgdXNlck5hbWVgIGlzIGZvciBhbiBbZW5kIHVzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnYXV0aGVudGljYXRpb24nKVxuICAgIH0pO1xuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgaW4sIHJldHVybmluZyB0aGUgdXNlciBhY2Nlc3MgdG9rZW4uXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIG5vIGB1c2VyTmFtZWAgb3IgYHBhc3N3b3JkYCB3ZXJlIHByb3ZpZGVkIGluIHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucywgdGhleSBhcmUgcmVxdWlyZWQgaW4gdGhlIGBvcHRpb25zYCBoZXJlLiBJZiBubyBgYWNjb3VudGAgd2FzIHByb3ZpZGVkIGluIHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBhbmQgdGhlIGB1c2VyTmFtZWAgaXMgZm9yIGFuIFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSwgdGhlIGBhY2NvdW50YCBpcyByZXF1aXJlZCBhcyB3ZWxsLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGF1dGgubG9naW4oe1xuICAgICAgICAgKiAgICAgICAgICB1c2VyTmFtZTogJ2pzbWl0aCcsXG4gICAgICAgICAqICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnLFxuICAgICAgICAgKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycgfSlcbiAgICAgICAgICogICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICogICAgICAgICAgY29uc29sZS5sb2coXCJ1c2VyIGFjY2VzcyB0b2tlbiBpczogXCIsIHRva2VuLmFjY2Vzc190b2tlbik7XG4gICAgICAgICAqICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBsb2dpbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHsgc3VjY2VzczogJC5ub29wIH0sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaHR0cE9wdGlvbnMudXNlck5hbWUgfHwgIWh0dHBPcHRpb25zLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3AgPSB7IHN0YXR1czogNDAxLCBzdGF0dXNNZXNzYWdlOiAnTm8gdXNlcm5hbWUgb3IgcGFzc3dvcmQgc3BlY2lmaWVkLicgfTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yLmNhbGwodGhpcywgcmVzcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QocmVzcCkucHJvbWlzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcG9zdFBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogaHR0cE9wdGlvbnMudXNlck5hbWUsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6IGh0dHBPcHRpb25zLnBhc3N3b3JkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChodHRwT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy9wYXNzIGluIG51bGwgZm9yIGFjY291bnQgdW5kZXIgb3B0aW9ucyBpZiB5b3UgZG9uJ3Qgd2FudCBpdCB0byBiZSBzZW50XG4gICAgICAgICAgICAgICAgcG9zdFBhcmFtcy5hY2NvdW50ID0gaHR0cE9wdGlvbnMuYWNjb3VudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwb3N0UGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gKHJlcGxhY2Ugd2l0aCAvKiAqLyBjb21tZW50IGJsb2NrLCB0byBtYWtlIHZpc2libGUgaW4gZG9jcywgb25jZSB0aGlzIGlzIG1vcmUgdGhhbiBhIG5vb3ApXG4gICAgICAgIC8vXG4gICAgICAgIC8vIExvZ3MgdXNlciBvdXQgZnJvbSBzcGVjaWZpZWQgYWNjb3VudHMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEVwaWNlbnRlciBsb2dvdXQgaXMgbm90IGltcGxlbWVudGVkIHlldCwgc28gZm9yIG5vdyB0aGlzIGlzIGEgZHVtbXkgcHJvbWlzZSB0aGF0IGdldHMgYXV0b21hdGljYWxseSByZXNvbHZlZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gKipFeGFtcGxlKipcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICBhdXRoLmxvZ291dCgpO1xuICAgICAgICAvL1xuICAgICAgICAvLyAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAvLyBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgIC8vXG4gICAgICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICBkdGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqICMjIENoYW5uZWwgU2VydmljZVxuICpcbiAqIFRoZSBFcGljZW50ZXIgcGxhdGZvcm0gcHJvdmlkZXMgYSBwdXNoIGNoYW5uZWwsIHdoaWNoIGFsbG93cyB5b3UgdG8gcHVibGlzaCBhbmQgc3Vic2NyaWJlIHRvIG1lc3NhZ2VzIHdpdGhpbiBhIFtwcm9qZWN0XSguLi8uLi8uLi9nbG9zc2FyeS8jcHJvamVjdHMpLCBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLCBvciBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkuIFRoZXJlIGFyZSB0d28gbWFpbiB1c2UgY2FzZXMgZm9yIHRoZSBjaGFubmVsOiBldmVudCBub3RpZmljYXRpb25zIGFuZCBjaGF0IG1lc3NhZ2VzLlxuICpcbiAqIElmIHlvdSBhcmUgZGV2ZWxvcGluZyB3aXRoIEVwaWNlbnRlci5qcywgeW91IHNob3VsZCB1c2UgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykgZGlyZWN0bHkuIFRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGRvY3VtZW50YXRpb24gYWxzbyBoYXMgbW9yZSBbYmFja2dyb3VuZF0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8jYmFja2dyb3VuZCkgaW5mb3JtYXRpb24gb24gY2hhbm5lbHMgYW5kIHRoZWlyIHVzZS5cbiAqXG4gKiBUaGUgQ2hhbm5lbCBTZXJ2aWNlIGlzIGEgYnVpbGRpbmcgYmxvY2sgZm9yIHRoaXMgZnVuY3Rpb25hbGl0eS4gSXQgY3JlYXRlcyBhIHB1Ymxpc2gtc3Vic2NyaWJlIG9iamVjdCwgYWxsb3dpbmcgeW91IHRvIHB1Ymxpc2ggbWVzc2FnZXMsIHN1YnNjcmliZSB0byBtZXNzYWdlcywgb3IgdW5zdWJzY3JpYmUgZnJvbSBtZXNzYWdlcyBmb3IgYSBnaXZlbiAndG9waWMnIG9uIGEgYCQuY29tZXRkYCB0cmFuc3BvcnQgaW5zdGFuY2UuXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLiBTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS5cbiAqXG4gKiBUbyB1c2UgdGhlIENoYW5uZWwgU2VydmljZSwgaW5zdGFudGlhdGUgaXQsIHRoZW4gbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4gKlxuICogICAgICAgIHZhciBjcyA9IG5ldyBGLnNlcnZpY2UuQ2hhbm5lbCgpO1xuICogICAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzJywgeyBwcmljZTogNTAgfSk7XG4gKlxuICogSWYgeW91IGFyZSB3b3JraW5nIHRocm91Z2ggdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyksIHdoZW4geW91IGFzayB0byBcImdldFwiIGEgcGFydGljdWxhciBjaGFubmVsLCB5b3UgYXJlIHJlYWxseSBhc2tpbmcgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBDaGFubmVsIFNlcnZpY2Ugd2l0aCBhIHRvcGljIGFscmVhZHkgc2V0LCBmb3IgZXhhbXBsZSB0byB0aGUgYXBwcm9wcmlhdGUgZ3JvdXAgb3Igd29ybGQ6XG4gKlxuICogICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gKiAgICAgIHZhciBnYyA9IGNtLmdldEdyb3VwQ2hhbm5lbCgpO1xuICogICAgICAvLyBiZWNhdXNlIHdlIHVzZWQgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciB0byBnZXQgdGhlIGdyb3VwIGNoYW5uZWwsXG4gKiAgICAgIC8vIHN1YnNjcmliZSgpIGFuZCBwdWJsaXNoKCkgaGVyZSBkZWZhdWx0IHRvIHRoZSBiYXNlIHRvcGljIGZvciB0aGUgZ3JvdXBcbiAqICAgICAgZ2Muc3Vic2NyaWJlKCcnLCBmdW5jdGlvbihkYXRhKSB7IGNvbnNvbGUubG9nKGRhdGEpOyB9KTtcbiAqICAgICAgZ2MucHVibGlzaCgnJywgeyBtZXNzYWdlOiAnYSBuZXcgbWVzc2FnZSB0byB0aGUgZ3JvdXAnIH0pO1xuICpcbiAqIFRoZSBwYXJhbWV0ZXJzIGZvciBpbnN0YW50aWF0aW5nIGEgQ2hhbm5lbCBTZXJ2aWNlIGluY2x1ZGU6XG4gKlxuICogKiBgb3B0aW9uc2AgVGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy5iYXNlYCBUaGUgYmFzZSB0b3BpYy4gVGhpcyBpcyBhZGRlZCBhcyBhIHByZWZpeCB0byBhbGwgZnVydGhlciB0b3BpY3MgeW91IHB1Ymxpc2ggb3Igc3Vic2NyaWJlIHRvIHdoaWxlIHdvcmtpbmcgd2l0aCB0aGlzIENoYW5uZWwgU2VydmljZS5cbiAqICogYG9wdGlvbnMudG9waWNSZXNvbHZlcmAgQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIFJldHVybnMgYSBTdHJpbmcuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAqICogYG9wdGlvbnMudHJhbnNwb3J0YCBUaGUgaW5zdGFuY2Ugb2YgYCQuY29tZXRkYCB0byBob29rIG9udG8uIFNlZSBodHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZCBvbiBjb21ldGQuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIENoYW5uZWwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGJhc2UgdG9waWMuIFRoaXMgaXMgYWRkZWQgYXMgYSBwcmVmaXggdG8gYWxsIGZ1cnRoZXIgdG9waWNzIHlvdSBwdWJsaXNoIG9yIHN1YnNjcmliZSB0byB3aGlsZSB3b3JraW5nIHdpdGggdGhpcyBDaGFubmVsIFNlcnZpY2UuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBiYXNlOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiBgdG9waWNgIFRvcGljIHRvIHBhcnNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICogKlN0cmluZyo6IFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhIHN0cmluZyB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgdG9waWMgdG8gcmVzb2x2ZVxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b3BpY1Jlc29sdmVyOiBmdW5jdGlvbiAodG9waWMpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3BpYztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGluc3RhbmNlIG9mIGAkLmNvbWV0ZGAgdG8gaG9vayBvbnRvLlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiBudWxsXG4gICAgfTtcbiAgICB0aGlzLmNoYW5uZWxPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbn07XG5cbnZhciBtYWtlTmFtZSA9IGZ1bmN0aW9uIChjaGFubmVsTmFtZSwgdG9waWMpIHtcbiAgICAvL1JlcGxhY2UgdHJhaWxpbmcvZG91YmxlIHNsYXNoZXNcbiAgICB2YXIgbmV3TmFtZSA9IChjaGFubmVsTmFtZSA/IChjaGFubmVsTmFtZSArICcvJyArIHRvcGljKSA6IHRvcGljKS5yZXBsYWNlKC9cXC9cXC8vZywgJy8nKS5yZXBsYWNlKC9cXC8kLywgJycpO1xuICAgIHJldHVybiBuZXdOYW1lO1xufTtcblxuXG5DaGFubmVsLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWwucHJvdG90eXBlLCB7XG5cbiAgICAvLyBmdXR1cmUgZnVuY3Rpb25hbGl0eTpcbiAgICAvLyAgICAgIC8vIFNldCB0aGUgY29udGV4dCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgLy8gICAgICBjcy5zdWJzY3JpYmUoJ3J1bicsIGZ1bmN0aW9uICgpIHsgdGhpcy5pbm5lckhUTUwgPSAnVHJpZ2dlcmVkJ30sIGRvY3VtZW50LmJvZHkpO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIENvbnRyb2wgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbnMgYnkgc2V0dGluZyB0aGUgYHByaW9yaXR5YFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgY2IsIHRoaXMsIHtwcmlvcml0eTogOX0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyA1MFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiLCB0aGlzLCB7cHJpb3JpdHk6IDMwLCB2YWx1ZTogNTB9KTtcbiAgICAgLy9cbiAgICAgLy8gICAgICAvLyBPbmx5IGV4ZWN1dGUgdGhlIGNhbGxiYWNrLCBgY2JgLCBpZiB0aGUgdmFsdWUgb2YgdGhlIGBwcmljZWAgdmFyaWFibGUgaXMgZ3JlYXRlciB0aGFuIDUwXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiAnPjUwJ30pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBldmVuXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiBmdW5jdGlvbiAodmFsKSB7cmV0dXJuIHZhbCAlIDIgPT09IDB9fSk7XG5cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiBUaGUgdG9waWMgc2hvdWxkIGluY2x1ZGUgdGhlIGZ1bGwgcGF0aCBvZiB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMpLCBwcm9qZWN0IGlkLCBhbmQgZ3JvdXAgbmFtZS4gKEluIG1vc3QgY2FzZXMsIGl0IGlzIHNpbXBsZXIgdG8gdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIGluc3RlYWQsIGluIHdoaWNoIGNhc2UgdGhpcyBpcyBjb25maWd1cmVkIGZvciB5b3UuKVxuICAgICAqXG4gICAgICogICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY2IgPSBmdW5jdGlvbih2YWwpIHsgY29uc29sZS5sb2codmFsLmRhdGEpOyB9O1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcC1sZXZlbCAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBjaGlsZHJlbiBvZiB0aGUgJ3J1bicgdG9waWMuIE5vdGUgdGhpcyB3aWxsIGFsc28gYmUgdHJpZ2dlcmVkIGZvciBjaGFuZ2VzIHRvIHJ1bi54Lnkuei5cbiAgICAgKiAgICAgIGNzLnN1YnNjcmliZSgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBib3RoIHRoZSB0b3AtbGV2ZWwgJ3J1bicgdG9waWMgYW5kIGl0cyBjaGlsZHJlblxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKFsnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsXG4gICAgICogICAgICAgICAgJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vKiddLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgcGFydGljdWxhciB2YXJpYWJsZVxuICAgICAqICAgICAgc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiKTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqU3RyaW5nKiBSZXR1cm5zIGEgdG9rZW4geW91IGNhbiBsYXRlciB1c2UgdG8gdW5zdWJzY3JpYmUuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xBcnJheX0gICB0b3BpYyAgICBMaXN0IG9mIHRvcGljcyB0byBsaXN0ZW4gZm9yIGNoYW5nZXMgb24uXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuIENhbGxiYWNrIGlzIGNhbGxlZCB3aXRoIHNpZ25hdHVyZSBgKGV2dCwgcGF5bG9hZCwgbWV0YWRhdGEpYC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgY29udGV4dCAgQ29udGV4dCBpbiB3aGljaCB0aGUgYGNhbGxiYWNrYCBpcyBleGVjdXRlZC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgb3B0aW9ucy5wcmlvcml0eSAgVXNlZCB0byBjb250cm9sIG9yZGVyIG9mIG9wZXJhdGlvbnMuIERlZmF1bHRzIHRvIDAuIENhbiBiZSBhbnkgK3ZlIG9yIC12ZSBudW1iZXIuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE51bWJlcnxGdW5jdGlvbn0gICBvcHRpb25zLnZhbHVlIFRoZSBgY2FsbGJhY2tgIGlzIG9ubHkgdHJpZ2dlcmVkIGlmIHRoaXMgY29uZGl0aW9uIG1hdGNoZXMuIFNlZSBleGFtcGxlcyBmb3IgZGV0YWlscy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN1YnNjcmlwdGlvbiBJRFxuICAgICAqL1xuICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuXG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uSWRzID0gW107XG4gICAgICAgIHZhciBvcHRzID0gbWUuY2hhbm5lbE9wdGlvbnM7XG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZHMucHVzaChvcHRzLnRyYW5zcG9ydC5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoc3Vic2NyaXB0aW9uSWRzWzFdID8gc3Vic2NyaXB0aW9uSWRzIDogc3Vic2NyaXB0aW9uSWRzWzBdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCBkYXRhIHRvIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bicgdG9waWNcbiAgICAgKiAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCB7IGNvbXBsZXRlZDogZmFsc2UgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFNlbmQgZGF0YSB0byBhbGwgc3Vic2NyaWJlcnMgb2YgdGhlICdydW4vdmFyaWFibGVzJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi92YXJpYWJsZXMnLCB7IHByaWNlOiA1MCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljIFRvcGljIHRvIHB1Ymxpc2ggdG8uXG4gICAgICogQHBhcmFtICB7Kn0gZGF0YSAgRGF0YSB0byBwdWJsaXNoIHRvIHRvcGljLlxuICAgICAqIEByZXR1cm4ge0FycmF5IHwgT2JqZWN0fSBSZXNwb25zZXMgdG8gcHVibGlzaGVkIGRhdGFcbiAgICAgKlxuICAgICAqL1xuICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYywgZGF0YSkge1xuICAgICAgICB2YXIgdG9waWNzID0gW10uY29uY2F0KHRvcGljKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHJldHVybk9ianMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuXG4gICAgICAgIG9wdHMudHJhbnNwb3J0LmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IG1ha2VOYW1lKG9wdHMuYmFzZSwgb3B0cy50b3BpY1Jlc29sdmVyKHRvcGljKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRvcGljLmNoYXJBdCh0b3BpYy5sZW5ndGggLSAxKSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMucmVwbGFjZSgvXFwqKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbiBjYW5ub3QgcHVibGlzaCB0byBjaGFubmVscyB3aXRoIHdpbGRjYXJkcy4gUHVibGlzaGluZyB0byAnLCB0b3BpYywgJ2luc3RlYWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuT2Jqcy5wdXNoKG9wdHMudHJhbnNwb3J0LnB1Ymxpc2godG9waWMsIGRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5PYmpzWzFdID8gcmV0dXJuT2JqcyA6IHJldHVybk9ianNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSBmcm9tIGNoYW5nZXMgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIGNzLnVuc3Vic2NyaWJlKCdzYW1wbGVUb2tlbicpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRva2VuIFRoZSB0b2tlbiBmb3IgdG9waWMgaXMgcmV0dXJuZWQgd2hlbiB5b3UgaW5pdGlhbGx5IHN1YnNjcmliZS4gUGFzcyBpdCBoZXJlIHRvIHVuc3Vic2NyaWJlIGZyb20gdGhhdCB0b3BpYy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHJlZmVyZW5jZSB0byBjdXJyZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICB0aGlzLmNoYW5uZWxPcHRpb25zLnRyYW5zcG9ydC51bnN1YnNjcmliZSh0b2tlbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKlxuICAgICAqIFN1cHBvcnRlZCBldmVudHMgYXJlOiBgY29ubmVjdGAsIGBkaXNjb25uZWN0YCwgYHN1YnNjcmliZWAsIGB1bnN1YnNjcmliZWAsIGBwdWJsaXNoYCwgYGVycm9yYC5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vbi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wIGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9mZi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGV2ZW50cyBhbmQgZXhlY3V0ZSBoYW5kbGVycy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICovXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlci5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhbm5lbDtcbiIsIi8qKlxuICogQGNsYXNzIENvbmZpZ3VyYXRpb25TZXJ2aWNlXG4gKlxuICogQWxsIHNlcnZpY2VzIHRha2UgaW4gYSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9iamVjdCB0byBjb25maWd1cmUgdGhlbXNlbHZlcy4gQSBKUyBoYXNoIHt9IGlzIGEgdmFsaWQgY29uZmlndXJhdGlvbiBvYmplY3QsIGJ1dCBvcHRpb25hbGx5IHlvdSBjYW4gdXNlIHRoZSBjb25maWd1cmF0aW9uIHNlcnZpY2UgdG8gdG9nZ2xlIGNvbmZpZ3MgYmFzZWQgb24gdGhlIGVudmlyb25tZW50XG4gKlxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgY3MgPSByZXF1aXJlKCdjb25maWd1cmF0aW9uLXNlcnZpY2UnKSh7XG4gKiAgICAgICAgICBkZXY6IHsgLy9lbnZpcm9ubWVudFxuICAgICAgICAgICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvZDoge1xuICAgICAgICAgICAgICAgIHBvcnQ6IDgwODAsXG4gICAgICAgICAgICAgICAgaG9zdDogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAgICAgICAgIGxvZ0xldmVsOiAnbm9uZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2dMZXZlbDogJ0RFQlVHJyAvL2dsb2JhbFxuICogICAgIH0pO1xuICpcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ0RFQlVHJ1xuICpcbiAqICAgICAgY3Muc2V0RW52KCdkZXYnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ0RFQlVHJ1xuICpcbiAqICAgICAgY3Muc2V0RW52KCdwcm9kJyk7XG4gKiAgICAgIGNzLmdldCgnbG9nTGV2ZWwnKTsgLy9yZXR1cm5zICdub25lJ1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgdXJsU2VydmljZSA9IHJlcXVpcmUoJy4vdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIC8vVE9ETzogRW52aXJvbm1lbnRzXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBsb2dMZXZlbDogJ05PTkUnXG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgc2VydmljZU9wdGlvbnMuc2VydmVyID0gdXJsU2VydmljZShzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIpO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBkYXRhOiBzZXJ2aWNlT3B0aW9ucyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBlbnZpcm9ubWVudCBrZXkgdG8gZ2V0IGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmcm9tXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30gZW52XG4gICAgICAgICAqL1xuICAgICAgICBzZXRFbnY6IGZ1bmN0aW9uIChlbnYpIHtcblxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ30gcHJvcGVydHkgb3B0aW9uYWxcbiAgICAgICAgICogQHJldHVybiB7Kn0gICAgICAgICAgVmFsdWUgb2YgcHJvcGVydHkgaWYgc3BlY2lmaWVkLCB0aGUgZW50aXJlIGNvbmZpZyBvYmplY3Qgb3RoZXJ3aXNlXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zW3Byb3BlcnR5XTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgaWYgYSBrZXkgaXMgcHJvdmlkZWQsIHNldCBhIGtleSB0byB0aGF0IHZhbHVlLiBPdGhlcndpc2UgbWVyZ2Ugb2JqZWN0IHdpdGggY3VycmVudCBjb25maWdcbiAgICAgICAgICogQHBhcmFtICB7Kn0gdmFsdWUgIHZhbHVlIGZvciBwcm92aWRlZCBrZXlcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4iLCIvKipcbiAqICMjIERhdGEgQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgRGF0YSBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgbWFuaXB1bGF0ZSBkYXRhIHJlbGF0ZWQgdG8gYW55IG9mIHlvdXIgcHJvamVjdHMuIERhdGEgYXJlIG9yZ2FuaXplZCBpbiBjb2xsZWN0aW9ucy4gRWFjaCBjb2xsZWN0aW9uIGNvbnRhaW5zIGEgZG9jdW1lbnQ7IGVhY2ggZWxlbWVudCBvZiB0aGlzIHRvcC1sZXZlbCBkb2N1bWVudCBpcyBhIEpTT04gb2JqZWN0LiAoU2VlIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gb24gdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKS4pXG4gKlxuICogQWxsIEFQSSBjYWxscyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgRGF0YSBBUEkgU2VydmljZSBkZWZhdWx0cy4gSW4gcGFydGljdWxhciwgdGhlcmUgYXJlIHRocmVlIHJlcXVpcmVkIHBhcmFtZXRlcnMgd2hlbiB5b3UgaW5zdGFudGlhdGUgdGhlIERhdGEgU2VydmljZTpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICogKiBgcm9vdGA6IFRoZSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbi4gSWYgeW91IGhhdmUgbXVsdGlwbGUgY29sbGVjdGlvbnMgd2l0aGluIGVhY2ggb2YgeW91ciBwcm9qZWN0cywgeW91IGNhbiBhbHNvIHBhc3MgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBhbiBvcHRpb24gZm9yIGVhY2ggY2FsbC5cbiAqXG4gKiAgICAgICB2YXIgZHMgPSBuZXcgRi5zZXJ2aWNlLkRhdGEoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIHJvb3Q6ICdzdXJ2ZXktcmVzcG9uc2VzJyxcbiAqICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuICogICAgICAgfSk7XG4gKiAgICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAqICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAqICAgICAgIGRzLnNhdmVBcygndXNlcjInLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMywgJ3F1ZXN0aW9uMic6IDgsXG4gKiAgICAgICAgICAncXVlc3Rpb24zJzogdHJ1ZSwgJ3F1ZXN0aW9uNCc6ICdhbHdheXMnIH0gKTtcbiAqICAgICAgIGRzLnF1ZXJ5KCcnLHsgJ3F1ZXN0aW9uMic6IHsgJyRndCc6IDl9IH0pO1xuICpcbiAqIE5vdGUgdGhhdCBpbiBhZGRpdGlvbiB0byB0aGUgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgcm9vdGAsIHRoZSBEYXRhIFNlcnZpY2UgcGFyYW1ldGVycyBvcHRpb25hbGx5IGluY2x1ZGUgYSBgc2VydmVyYCBvYmplY3QsIHdob3NlIGBob3N0YCBmaWVsZCBjb250YWlucyB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uLiBSZXF1aXJlZC4gRGVmYXVsdHMgdG8gYC9gLCB0aGF0IGlzLCB0aGUgcm9vdCBsZXZlbCBvZiB5b3VyIHByb2plY3QgYXQgYGZvcmlvLmNvbS9hcHAveW91ci1hY2NvdW50LWlkL3lvdXItcHJvamVjdC1pZC9gLCBidXQgbXVzdCBiZSBzZXQgdG8gYSBjb2xsZWN0aW9uIG5hbWUuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBvcGVyYXRpb25zIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvL09wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXJcbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoa2V5LCByb290KSB7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcm9vdCA9IHNlcnZpY2VPcHRpb25zLnJvb3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdkYXRhJykgKyBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKHJvb3QpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB1cmwgKz0gcXV0aWwuYWRkVHJhaWxpbmdTbGFzaChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiBnZXRVUkxcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VhcmNoIGZvciBkYXRhIHdpdGhpbiBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFNlYXJjaGluZyB1c2luZyBjb21wYXJpc29uIG9yIGxvZ2ljYWwgb3BlcmF0b3JzIChhcyBvcHBvc2VkIHRvIGV4YWN0IG1hdGNoZXMpIHJlcXVpcmVzIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZGF0YSBhc3NvY2lhdGVkIHdpdGggZG9jdW1lbnQgJ3VzZXIxJ1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGV4YWN0IG1hdGNoaW5nOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uIHdoZXJlICdxdWVzdGlvbjInIGlzIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogOX0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGNvbXBhcmlzb24gb3BlcmF0b3JzOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgZ3JlYXRlciB0aGFuIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbG9naWNhbCBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBsZXNzIHRoYW4gMTAsIGFuZCAncXVlc3Rpb24zJyBpcyBmYWxzZVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICckYW5kJzogWyB7ICdxdWVzdGlvbjInOiB7ICckbHQnOjEwfSB9LCB7ICdxdWVzdGlvbjMnOiBmYWxzZSB9XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZWd1bGFyIGV4cHJlc3NzaW9uczogdXNlIGFueSBQZXJsLWNvbXBhdGlibGUgcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uNScgY29udGFpbnMgdGhlIHN0cmluZyAnLipkYXknXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJ3F1ZXN0aW9uNSc6IHsgJyRyZWdleCc6ICcuKmRheScgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgZG9jdW1lbnQgdG8gc2VhcmNoLiBQYXNzIHRoZSBlbXB0eSBzdHJpbmcgKCcnKSB0byBzZWFyY2ggdGhlIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgVGhlIHF1ZXJ5IG9iamVjdC4gRm9yIGV4YWN0IG1hdGNoaW5nLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgZmllbGQgdmFsdWUgdG8gbWF0Y2guIEZvciBtYXRjaGluZyBiYXNlZCBvbiBjb21wYXJpc29uLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgdGhlIGNvbXBhcmlzb24gZXhwcmVzc2lvbi4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGxvZ2ljYWwgb3BlcmF0b3JzLCB0aGlzIG9iamVjdCBjb250YWlucyBhbiBleHByZXNzaW9uIHVzaW5nIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAoa2V5LCBxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IHE6IHF1ZXJ5IH0sIG91dHB1dE1vZGlmaWVyKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIGluIGFuIGFub255bW91cyBkb2N1bWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQuIEJ5IGRlZmF1bHQgdGhlIGByb290YCBpcyB0YWtlbiBmcm9tIHRoZSBEYXRhIFNlcnZpY2UgY29uZmlndXJhdGlvbiBvcHRpb25zOyB5b3UgY2FuIGFsc28gcGFzcyB0aGUgYHJvb3RgIHRvIHRoZSBgc2F2ZWAgY2FsbCBleHBsaWNpdGx5IGJ5IG92ZXJyaWRpbmcgdGhlIG9wdGlvbnMgKHRoaXJkIHBhcmFtZXRlcikuXG4gICAgICAgICAqXG4gICAgICAgICAqIChBZGRpdGlvbmFsIGJhY2tncm91bmQ6IERvY3VtZW50cyBhcmUgdG9wLWxldmVsIGVsZW1lbnRzIHdpdGhpbiBhIGNvbGxlY3Rpb24uIENvbGxlY3Rpb25zIG11c3QgYmUgdW5pcXVlIHdpdGhpbiB0aGlzIGFjY291bnQgKHRlYW0gb3IgcGVyc29uYWwgYWNjb3VudCkgYW5kIHByb2plY3QgYW5kIGFyZSBzZXQgd2l0aCB0aGUgYHJvb3RgIGZpZWxkIGluIHRoZSBgb3B0aW9uYCBwYXJhbWV0ZXIuIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLiBUaGUgYHNhdmVgIG1ldGhvZCBpcyBtYWtpbmcgYSBgUE9TVGAgcmVxdWVzdC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gQ3JlYXRlIGEgbmV3IGRvY3VtZW50LCB3aXRoIG9uZSBlbGVtZW50LCBhdCB0aGUgZGVmYXVsdCByb290IGxldmVsXG4gICAgICAgICAqICAgICAgZHMuc2F2ZSgncXVlc3Rpb24xJywgJ3llcycpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSBhIG5ldyBkb2N1bWVudCwgd2l0aCB0d28gZWxlbWVudHMsIGF0IHRoZSBkZWZhdWx0IHJvb3QgbGV2ZWxcbiAgICAgICAgICogICAgICBkcy5zYXZlKHsgcXVlc3Rpb24xOid5ZXMnLCBxdWVzdGlvbjI6IDMyIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSBhIG5ldyBkb2N1bWVudCwgd2l0aCB0d28gZWxlbWVudHMsIGF0IGAvc3R1ZGVudHMvYFxuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBuYW1lOidKb2huJywgY2xhc3NOYW1lOiAnQ1MxMDEnIH0sIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBrZXkgSWYgYGtleWAgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgZWxlbWVudCB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIG9iamVjdCBpcyB0aGUgZGF0YSB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIEluIGJvdGggY2FzZXMsIHRoZSBpZCBmb3IgdGhlIGRvY3VtZW50IGlzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLiBJZiBga2V5YCBpcyBhIHN0cmluZywgdGhpcyBpcyB0aGUgdmFsdWUgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgdmFsdWUocykgdG8gc2F2ZSBhcmUgYWxyZWFkeSBwYXJ0IG9mIGBrZXlgIGFuZCB0aGlzIGFyZ3VtZW50IGlzIG5vdCByZXF1aXJlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gSWYgeW91IHdhbnQgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgYHJvb3RgIG9mIHRoZSBjb2xsZWN0aW9uLCBkbyBzbyBoZXJlLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKCcnLCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIChjcmVhdGUgb3IgcmVwbGFjZSkgZGF0YSBpbiBhIG5hbWVkIGRvY3VtZW50IG9yIGVsZW1lbnQgd2l0aGluIHRoZSBjb2xsZWN0aW9uLiBcbiAgICAgICAgICogXG4gICAgICAgICAqIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQuIEJ5IGRlZmF1bHQgdGhlIGByb290YCBpcyB0YWtlbiBmcm9tIHRoZSBEYXRhIFNlcnZpY2UgY29uZmlndXJhdGlvbiBvcHRpb25zOyB5b3UgY2FuIGFsc28gcGFzcyB0aGUgYHJvb3RgIHRvIHRoZSBgc2F2ZUFzYCBjYWxsIGV4cGxpY2l0bHkgYnkgb3ZlcnJpZGluZyB0aGUgb3B0aW9ucyAodGhpcmQgcGFyYW1ldGVyKS5cbiAgICAgICAgICpcbiAgICAgICAgICogT3B0aW9uYWxseSwgdGhlIG5hbWVkIGRvY3VtZW50IG9yIGVsZW1lbnQgY2FuIGluY2x1ZGUgcGF0aCBpbmZvcm1hdGlvbiwgc28gdGhhdCB5b3UgYXJlIHNhdmluZyBqdXN0IHBhcnQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiAoQWRkaXRpb25hbCBiYWNrZ3JvdW5kOiBEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gVGhlIGBzYXZlQXNgIG1ldGhvZCBpcyBtYWtpbmcgYSBgUFVUYCByZXF1ZXN0LilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBDcmVhdGUgKG9yIHJlcGxhY2UpIHRoZSBgdXNlcjFgIGRvY3VtZW50IGF0IHRoZSBkZWZhdWx0IHJvb3QgbGV2ZWwuXG4gICAgICAgICAqICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgcmVwbGFjZXMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGB1c2VyMWAgZG9jdW1lbnQuXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gICAgICAgICAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAgICAgICAgICogICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBDcmVhdGUgKG9yIHJlcGxhY2UpIHRoZSBgc3R1ZGVudDFgIGRvY3VtZW50IGF0IHRoZSBgc3R1ZGVudHNgIHJvb3QsIFxuICAgICAgICAgKiAgICAgIC8vIHRoYXQgaXMsIHRoZSBkYXRhIGF0IGAvc3R1ZGVudHMvc3R1ZGVudDEvYC5cbiAgICAgICAgICogICAgICAvLyBOb3RlIHRoYXQgdGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgYC9zdHVkZW50cy9zdHVkZW50MS9gIGRvY3VtZW50LlxuICAgICAgICAgKiAgICAgIC8vIEhvd2V2ZXIsIHRoaXMgd2lsbCBrZWVwIGV4aXN0aW5nIGNvbnRlbnQgaW4gb3RoZXIgcGF0aHMgb2YgdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICAgKiAgICAgIC8vIEZvciBleGFtcGxlLCB0aGUgZGF0YSBhdCBgL3N0dWRlbnRzL3N0dWRlbnQyL2AgaXMgdW5jaGFuZ2VkIGJ5IHRoaXMgY2FsbC5cbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3N0dWRlbnQxJyxcbiAgICAgICAgICogICAgICAgICAgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSAob3IgcmVwbGFjZSkgdGhlIGBtZ210MTAwL2dyb3VwQmAgZG9jdW1lbnQgYXQgdGhlIGBteWNsYXNzZXNgIHJvb3QsXG4gICAgICAgICAqICAgICAgLy8gdGhhdCBpcywgdGhlIGRhdGEgYXQgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEIvYC5cbiAgICAgICAgICogICAgICAvLyBOb3RlIHRoYXQgdGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEIvYCBkb2N1bWVudC5cbiAgICAgICAgICogICAgICAvLyBIb3dldmVyLCB0aGlzIHdpbGwga2VlcCBleGlzdGluZyBjb250ZW50IGluIG90aGVyIHBhdGhzIG9mIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgICogICAgICAvLyBGb3IgZXhhbXBsZSwgdGhlIGRhdGEgYXQgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEEvYCBpcyB1bmNoYW5nZWQgYnkgdGhpcyBjYWxsLlxuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnbWdtdDEwMC9ncm91cEInLFxuICAgICAgICAgKiAgICAgICAgICB7IHNjZW5hcmlvWWVhcjogJzIwMTUnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ215Y2xhc3NlcycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgSWQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLCBpbiBrZXk6dmFsdWUgcGFpcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuIElmIHlvdSB3YW50IHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IGByb290YCBvZiB0aGUgY29sbGVjdGlvbiwgZG8gc28gaGVyZS5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlQXM6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnB1dCh2YWx1ZSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgZGF0YSBmb3IgYSBzcGVjaWZpYyBkb2N1bWVudCBvciBmaWVsZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMScpO1xuICAgICAgICAgKiAgICAgIGRzLmxvYWQoJ3VzZXIxL3F1ZXN0aW9uMycpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBrZXkgVGhlIGlkIG9mIHRoZSBkYXRhIHRvIHJldHVybi4gQ2FuIGJlIHRoZSBpZCBvZiBhIGRvY3VtZW50LCBvciBhIHBhdGggdG8gZGF0YSB3aXRoaW4gdGhhdCBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChrZXksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBkYXRhIGZyb20gY29sbGVjdGlvbi4gT25seSBkb2N1bWVudHMgKHRvcC1sZXZlbCBlbGVtZW50cyBpbiBlYWNoIGNvbGxlY3Rpb24pIGNhbiBiZSBkZWxldGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgZHMucmVtb3ZlKCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0ga2V5cyBUaGUgaWQgb2YgdGhlIGRvY3VtZW50IHRvIHJlbW92ZSBmcm9tIHRoaXMgY29sbGVjdGlvbiwgb3IgYW4gYXJyYXkgb2Ygc3VjaCBpZHMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5cywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBwYXJhbXM7XG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KGtleXMpKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBpZDoga2V5cyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5cywgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUocGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFcGljZW50ZXIgZG9lc24ndCBhbGxvdyBudWtpbmcgY29sbGVjdGlvbnNcbiAgICAgICAgLy8gICAgIC8qKlxuICAgICAgICAvLyAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgLy8gICAgICAqIEByZXR1cm4gbnVsbFxuICAgICAgICAvLyAgICAgICovXG4gICAgICAgIC8vICAgICBkZXN0cm95OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSgnJywgb3B0aW9ucyk7XG4gICAgICAgIC8vICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgR3JvdXAgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgR3JvdXAgQVBJIEFkYXB0ZXIgcHJvdmlkZXMgbWV0aG9kcyB0byBsb29rIHVwLCBjcmVhdGUsIGNoYW5nZSBvciByZW1vdmUgaW5mb3JtYXRpb24gYWJvdXQgZ3JvdXBzIGluIGEgcHJvamVjdC4gSXQgaXMgYmFzZWQgb24gcXVlcnkgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW0dyb3VwIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL3VzZXJfbWFuYWdlbWVudC9ncm91cC8pLlxuICpcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgZm9yIEF1dGhlbnRpY2F0ZWQgcHJvamVjdHMsIHRoYXQgaXMsIHRlYW0gcHJvamVjdHMgd2l0aCBbZW5kIHVzZXJzIGFuZCBncm91cHNdKC4uLy4uLy4uL2dyb3Vwc19hbmRfZW5kX3VzZXJzLykuXG4gKlxuICogICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLkdyb3VwKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBzRm9yUHJvamVjdCh7IGFjY291bnQ6ICdhY21lJywgcHJvamVjdDogJ3NhbXBsZScgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VydmljZVV0aWxzID0gcmVxdWlyZSgnLi9zZXJ2aWNlLXV0aWxzJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgYXBpRW5kcG9pbnQgPSAnZ3JvdXAvbG9jYWwnO1xuXG52YXIgR3JvdXBTZXJ2aWNlID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciBhY2NvdW50IG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIHByb2plY3QgbmFtZS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlcnZpY2VVdGlscy5nZXREZWZhdWx0T3B0aW9ucyhkZWZhdWx0cywgY29uZmlnLCB7IGFwaUVuZHBvaW50OiBhcGlFbmRwb2ludCB9KTtcbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9IHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydDtcbiAgICBkZWxldGUgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0O1xuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucywgc2VydmljZU9wdGlvbnMpO1xuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgaW5mb3JtYXRpb24gZm9yIGEgZ3JvdXAgb3IgbXVsdGlwbGUgZ3JvdXBzLlxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb2JqZWN0IHdpdGggcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMucSBwYXJ0aWFsIG1hdGNoIGZvciBuYW1lLCBvcmdhbml6YXRpb24gb3IgZXZlbnQuXG4gICAgICAgICogQHBhdGFtIHtzdHJpbmd9IHBhcmFtcy5hY2NvdW50IEVwaWNlbnRlcidzIFRlYW0gSURcbiAgICAgICAgKiBAcGF0YW0ge3N0cmluZ30gcGFyYW1zLnByb2plY3QgRXBpY2VudGVyJ3MgUHJvamVjdCBJRFxuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMubmFtZSBFcGljZW50ZXIncyBHcm91cCBOYW1lXG4gICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRHcm91cHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vZ3JvdXBJRCBpcyBwYXJ0IG9mIHRoZSBVUkxcbiAgICAgICAgICAgIC8vcSwgYWNjb3VudCBhbmQgcHJvamVjdCBhcmUgcGFydCBvZiB0aGUgcXVlcnkgc3RyaW5nXG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gb2JqZWN0QXNzaWduKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxQYXJhbXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9wdHMudXJsID0gc2VydmljZVV0aWxzLmdldEFwaVVybChhcGlFbmRwb2ludCArICcvJyArIHBhcmFtcywgZmluYWxPcHRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmluYWxQYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmluYWxQYXJhbXMsIGZpbmFsT3B0cyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG9iamVjdEFzc2lnbih0aGlzLCBwdWJsaWNBUEkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFNlcnZpY2U7XG4iLCIvKipcbiAqXG4gKiAjIyBJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIEludHJvc3BlY3Rpb24gQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byB2aWV3IGEgbGlzdCBvZiB0aGUgdmFyaWFibGVzIGFuZCBvcGVyYXRpb25zIGluIGEgbW9kZWwuIFR5cGljYWxseSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLlxuICpcbiAqIFRoZSBJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlIGlzIG5vdCBhdmFpbGFibGUgZm9yIEZvcmlvIFNpbUxhbmcuXG4gKlxuICogICAgICAgdmFyIGludHJvID0gbmV3IEYuc2VydmljZS5JbnRyb3NwZWN0KHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnXG4gKiAgICAgICB9KTtcbiAqICAgICAgIGludHJvLmJ5TW9kZWwoJ3N1cHBseS1jaGFpbi5weScpLnRoZW4oZnVuY3Rpb24oZGF0YSl7IC4uLiB9KTtcbiAqICAgICAgIGludHJvLmJ5UnVuSUQoJzJiNGQ4ZjcxLTVjMzQtNDM1YS04YzE2LTlkZTY3NGFiNzJlNicpLnRoZW4oZnVuY3Rpb24oZGF0YSl7IC4uLiB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIGFwaUVuZHBvaW50ID0gJ21vZGVsL2ludHJvc3BlY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgfTtcblxuICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGF2YWlsYWJsZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgZm9yIGEgZ2l2ZW4gbW9kZWwgZmlsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogVGhpcyBkb2VzIG5vdCB3b3JrIGZvciBhbnkgbW9kZWwgd2hpY2ggcmVxdWlyZXMgYWRkaXRpb25hbCBwYXJhbWV0ZXJzLCBzdWNoIGFzIGBmaWxlc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgaW50cm8uYnlNb2RlbCgnYWJjLnZtZicpXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIGRhdGEgY29udGFpbnMgYW4gb2JqZWN0IHdpdGggYXZhaWxhYmxlIGZ1bmN0aW9ucyAodXNlZCB3aXRoIG9wZXJhdGlvbnMgQVBJKSBhbmQgYXZhaWxhYmxlIHZhcmlhYmxlcyAodXNlZCB3aXRoIHZhcmlhYmxlcyBBUEkpXG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmZ1bmN0aW9ucyk7XG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnZhcmlhYmxlcyk7XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG1vZGVsRmlsZSBOYW1lIG9mIHRoZSBtb2RlbCBmaWxlIHRvIGludHJvc3BlY3QuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGJ5TW9kZWw6IGZ1bmN0aW9uIChtb2RlbEZpbGUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghb3B0cy5hY2NvdW50IHx8ICFvcHRzLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FjY291bnQgYW5kIHByb2plY3QgYXJlIHJlcXVpcmVkIHdoZW4gdXNpbmcgaW50cm9zcGVjdCNieU1vZGVsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW1vZGVsRmlsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kZWxGaWxlIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgaW50cm9zcGVjdCNieU1vZGVsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXJsID0geyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIFtvcHRzLmFjY291bnQsIG9wdHMucHJvamVjdCwgbW9kZWxGaWxlXS5qb2luKCcvJykgfTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGF2YWlsYWJsZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgZm9yIGEgZ2l2ZW4gbW9kZWwgZmlsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogVGhpcyBkb2VzIG5vdCB3b3JrIGZvciBhbnkgbW9kZWwgd2hpY2ggcmVxdWlyZXMgYWRkaXRpb25hbCBwYXJhbWV0ZXJzIHN1Y2ggYXMgYGZpbGVzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBpbnRyby5ieVJ1bklEKCcyYjRkOGY3MS01YzM0LTQzNWEtOGMxNi05ZGU2NzRhYjcyZTYnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyBkYXRhIGNvbnRhaW5zIGFuIG9iamVjdCB3aXRoIGF2YWlsYWJsZSBmdW5jdGlvbnMgKHVzZWQgd2l0aCBvcGVyYXRpb25zIEFQSSkgYW5kIGF2YWlsYWJsZSB2YXJpYWJsZXMgKHVzZWQgd2l0aCB2YXJpYWJsZXMgQVBJKVxuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5mdW5jdGlvbnMpO1xuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS52YXJpYWJsZXMpO1xuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBydW5JRCBJZCBvZiB0aGUgcnVuIHRvIGludHJvc3BlY3QuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGJ5UnVuSUQ6IGZ1bmN0aW9uIChydW5JRCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFydW5JRCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncnVuSUQgaXMgcmVxdWlyZWQgd2hlbiB1c2luZyBpbnRyb3NwZWN0I2J5TW9kZWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cmwgPSB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSUQgfTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIE1lbWJlciBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBNZW1iZXIgQVBJIEFkYXB0ZXIgcHJvdmlkZXMgbWV0aG9kcyB0byBsb29rIHVwIGluZm9ybWF0aW9uIGFib3V0IGVuZCB1c2VycyBmb3IgeW91ciBwcm9qZWN0IGFuZCBob3cgdGhleSBhcmUgZGl2aWRlZCBhY3Jvc3MgZ3JvdXBzLiBJdCBpcyBiYXNlZCBvbiBxdWVyeSBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbTWVtYmVyIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL3VzZXJfbWFuYWdlbWVudC9tZW1iZXIvKS5cbiAqXG4gKiBUaGlzIGlzIG9ubHkgbmVlZGVkIGZvciBBdXRoZW50aWNhdGVkIHByb2plY3RzLCB0aGF0IGlzLCB0ZWFtIHByb2plY3RzIHdpdGggW2VuZCB1c2VycyBhbmQgZ3JvdXBzXSguLi8uLi8uLi9ncm91cHNfYW5kX2VuZF91c2Vycy8pLiBGb3IgZXhhbXBsZSwgaWYgc29tZSBvZiB5b3VyIGVuZCB1c2VycyBhcmUgZmFjaWxpdGF0b3JzLCBvciBpZiB5b3VyIGVuZCB1c2VycyBzaG91bGQgYmUgdHJlYXRlZCBkaWZmZXJlbnRseSBiYXNlZCBvbiB3aGljaCBncm91cCB0aGV5IGFyZSBpbiwgdXNlIHRoZSBNZW1iZXIgQVBJIHRvIGZpbmQgdGhhdCBpbmZvcm1hdGlvbi5cbiAqXG4gKiAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBzRm9yVXNlcih7IHVzZXJJZDogJ2I2YjMxM2EzLWFiODQtNDc5Yy1iYWVhLTIwNmY2YmZmMzM3JyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzAwYjUzMzA4LTk4MzMtNDdmMi1iMjFlLTEyNzhjMDdkNTNiOCcgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBhcGlFbmRwb2ludCA9ICdtZW1iZXIvbG9jYWwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgdXNlciBpZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIGdyb3VwIGlkLiBEZWZhdWx0cyB0byBhIGJsYW5rIHN0cmluZy4gTm90ZSB0aGF0IHRoaXMgaXMgdGhlIGdyb3VwICppZCosIG5vdCB0aGUgZ3JvdXAgKm5hbWUqLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXBJZDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zLCBzZXJ2aWNlT3B0aW9ucyk7XG5cbiAgICB2YXIgZ2V0RmluYWxQYXJhbXMgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBwYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIHBhdGNoVXNlckFjdGl2ZUZpZWxkID0gZnVuY3Rpb24gKHBhcmFtcywgYWN0aXZlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcmFtcy5ncm91cElkICsgJy8nICsgcGFyYW1zLnVzZXJJZFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHR0cC5wYXRjaCh7IGFjdGl2ZTogYWN0aXZlIH0sIGh0dHBPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGFsbCBvZiB0aGUgZ3JvdXAgbWVtYmVyc2hpcHMgZm9yIG9uZSBlbmQgdXNlci4gVGhlIG1lbWJlcnNoaXAgZGV0YWlscyBhcmUgcmV0dXJuZWQgaW4gYW4gYXJyYXksIHdpdGggb25lIGVsZW1lbnQgKGdyb3VwIHJlY29yZCkgZm9yIGVhY2ggZ3JvdXAgdG8gd2hpY2ggdGhlIGVuZCB1c2VyIGJlbG9uZ3MuXG4gICAgICAgICpcbiAgICAgICAgKiBJbiB0aGUgbWVtYmVyc2hpcCBhcnJheSwgZWFjaCBncm91cCByZWNvcmQgaW5jbHVkZXMgdGhlIGdyb3VwIGlkLCBwcm9qZWN0IGlkLCBhY2NvdW50ICh0ZWFtKSBpZCwgYW5kIGFuIGFycmF5IG9mIG1lbWJlcnMuIEhvd2V2ZXIsIG9ubHkgdGhlIHVzZXIgd2hvc2UgdXNlcklkIGlzIGluY2x1ZGVkIGluIHRoZSBjYWxsIGlzIGxpc3RlZCBpbiB0aGUgbWVtYmVycyBhcnJheSAocmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZXJlIGFyZSBvdGhlciBtZW1iZXJzIGluIHRoaXMgZ3JvdXApLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKCc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihtZW1iZXJzaGlwcyl7XG4gICAgICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bWVtYmVyc2hpcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhtZW1iZXJzaGlwc1tpXS5ncm91cElkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIH1cbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBwYXJhbXMgVGhlIHVzZXIgaWQgZm9yIHRoZSBlbmQgdXNlci4gQWx0ZXJuYXRpdmVseSwgYW4gb2JqZWN0IHdpdGggZmllbGQgYHVzZXJJZGAgYW5kIHZhbHVlIHRoZSB1c2VyIGlkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0R3JvdXBzRm9yVXNlcjogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlcklkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdldFBhcm1zID0gaXNTdHJpbmcgPyB7IHVzZXJJZDogcGFyYW1zIH0gOiBfcGljayhvYmpQYXJhbXMsICd1c2VySWQnKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRQYXJtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgb25lIGdyb3VwLCBpbmNsdWRpbmcgYW4gYXJyYXkgb2YgYWxsIGl0cyBtZW1iZXJzLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cERldGFpbHMoJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGdyb3VwKXtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxncm91cC5tZW1iZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ3JvdXAubWVtYmVyc1tpXS51c2VyTmFtZSk7XG4gICAgICAgICogICAgICAgICAgICAgICB9XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gcGFyYW1zIFRoZSBncm91cCBpZC4gQWx0ZXJuYXRpdmVseSwgYW4gb2JqZWN0IHdpdGggZmllbGQgYGdyb3VwSWRgIGFuZCB2YWx1ZSB0aGUgZ3JvdXAgaWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRHcm91cERldGFpbHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGlmICghaXNTdHJpbmcgJiYgIW9ialBhcmFtcy5ncm91cElkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncm91cElkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdyb3VwSWQgPSBpc1N0cmluZyA/IHBhcmFtcyA6IG9ialBhcmFtcy5ncm91cElkO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBTZXQgYSBwYXJ0aWN1bGFyIGVuZCB1c2VyIGFzIGBhY3RpdmVgLiBBY3RpdmUgZW5kIHVzZXJzIGNhbiBiZSBhc3NpZ25lZCB0byBbd29ybGRzXSguLi93b3JsZC1tYW5hZ2VyLykgaW4gbXVsdGlwbGF5ZXIgZ2FtZXMgZHVyaW5nIGF1dG9tYXRpYyBhc3NpZ25tZW50LlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5tYWtlVXNlckFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBUaGUgZW5kIHVzZXIgYW5kIGdyb3VwIGluZm9ybWF0aW9uLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMudXNlcklkIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBhY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5ncm91cElkIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggdGhpcyBlbmQgdXNlciBiZWxvbmdzLCBhbmQgaW4gd2hpY2ggdGhlIGVuZCB1c2VyIHNob3VsZCBiZWNvbWUgYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbWFrZVVzZXJBY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIHRydWUsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFNldCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgYXMgYGluYWN0aXZlYC4gSW5hY3RpdmUgZW5kIHVzZXJzIGFyZSBub3QgYXNzaWduZWQgdG8gW3dvcmxkc10oLi4vd29ybGQtbWFuYWdlci8pIGluIG11bHRpcGxheWVyIGdhbWVzIGR1cmluZyBhdXRvbWF0aWMgYXNzaWdubWVudC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEubWFrZVVzZXJJbmFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBUaGUgZW5kIHVzZXIgYW5kIGdyb3VwIGluZm9ybWF0aW9uLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMudXNlcklkIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwSWQgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCB0aGlzIGVuZCB1c2VyIGJlbG9uZ3MsIGFuZCBpbiB3aGljaCB0aGUgZW5kIHVzZXIgc2hvdWxkIGJlY29tZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIG1ha2VVc2VySW5hY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIGZhbHNlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIFByZXNlbmNlIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIFByZXNlbmNlIEFQSSBTZXJ2aWNlIHByb3ZpZGVzIG1ldGhvZHMgdG8gZ2V0IGFuZCBzZXQgdGhlIHByZXNlbmNlIG9mIGFuIGVuZCB1c2VyIGluIGEgcHJvamVjdCwgdGhhdCBpcywgdG8gaW5kaWNhdGUgd2hldGhlciB0aGUgZW5kIHVzZXIgaXMgb25saW5lLiBUaGlzIGhhcHBlbnMgYXV0b21hdGljYWxseTogaW4gcHJvamVjdHMgdGhhdCB1c2UgW2NoYW5uZWxzXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyksIHRoZSBlbmQgdXNlcidzIHByZXNlbmNlIGlzIHB1Ymxpc2hlZCBhdXRvbWF0aWNhbGx5IG9uIGEgXCJwcmVzZW5jZVwiIGNoYW5uZWwgdGhhdCBpcyBzcGVjaWZpYyB0byBlYWNoIGdyb3VwLiBZb3UgY2FuIGFsc28gdXNlIHRoZSBQcmVzZW5jZSBBUEkgU2VydmljZSB0byBkbyB0aGlzIGV4cGxpY2l0bHk6IHlvdSBjYW4gbWFrZSBhIGNhbGwgdG8gaW5kaWNhdGUgdGhhdCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgaXMgb25saW5lIG9yIG9mZmxpbmUuIFxuICpcbiAqIFRoZSBQcmVzZW5jZSBBUEkgU2VydmljZSBpcyBvbmx5IG5lZWRlZCBmb3IgQXV0aGVudGljYXRlZCBwcm9qZWN0cywgdGhhdCBpcywgdGVhbSBwcm9qZWN0cyB3aXRoIFtlbmQgdXNlcnMgYW5kIGdyb3Vwc10oLi4vLi4vLi4vZ3JvdXBzX2FuZF9lbmRfdXNlcnMvKS4gSXQgaXMgdHlwaWNhbGx5IHVzZWQgb25seSBpbiBtdWx0aXBsYXllciBwcm9qZWN0cywgdG8gZmFjaWxpdGF0ZSBlbmQgdXNlcnMgY29tbXVuaWNhdGluZyB3aXRoIGVhY2ggb3RoZXIuIEl0IGlzIGJhc2VkIG9uIHRoZSBxdWVyeSBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbUHJlc2VuY2UgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvcHJlc2VuY2UvKS5cbiAqXG4gKiAgICAgIHZhciBwciA9IG5ldyBGLnNlcnZpY2UuUHJlc2VuY2UoKTtcbiAqICAgICAgcHIubWFya09ubGluZSgnZXhhbXBsZS11c2VySWQnKTtcbiAqICAgICAgcHIubWFya09mZmxpbmUoJ2V4YW1wbGUtdXNlcklkJyk7XG4gKiAgICAgIHByLmdldFN0YXR1cygpO1xuICovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIGFwaUVuZHBvaW50ID0gJ3ByZXNlbmNlJztcbnZhciBDaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTCBvciBzZXNzaW9uIG1hbmFnZXIuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwgb3Igc2Vzc2lvbiBtYW5hZ2VyLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgZ3JvdXAgbmFtZS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLiBOb3RlIHRoYXQgdGhpcyBpcyB0aGUgZ3JvdXAgKm5hbWUqLCBub3QgdGhlIGdyb3VwICppZCouIElmIGxlZnQgYmxhbmssIHRha2VuIGZyb20gdGhlIHNlc3Npb24gbWFuYWdlci5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwTmFtZTogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge30sXG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucywgc2VydmljZU9wdGlvbnMpO1xuXG5cbiAgICB2YXIgZ2V0RmluYWxQYXJhbXMgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnM7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXJrcyBhbiBlbmQgdXNlciBhcyBvbmxpbmUuXG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICB2YXIgcHIgPSBuZXcgRi5zZXJ2aWNlLlByZXNlbmNlKCk7XG4gICAgICAgICAqICAgICBwci5tYXJrT25saW5lKCcwMDAwMDE1YTY4ZDgwNmJjMDljZDBhN2QyMDdmNDRiYTVmNzQnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbihwcmVzZW5jZU9iaikge1xuICAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyICcsIHByZXNlbmNlT2JqLnVzZXJJZCwgXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAnIG5vdyBvbmxpbmUsIGFzIG9mICcsIHByZXNlbmNlT2JqLmxhc3RNb2RpZmllZCk7XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqIFByb21pc2Ugd2l0aCBwcmVzZW5jZSBpbmZvcm1hdGlvbiBmb3IgdXNlciBtYXJrZWQgb25saW5lLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHVzZXJJZCAob3B0aW9uYWwpIElmIG5vdCBwcm92aWRlZCwgdGFrZW4gZnJvbSBzZXNzaW9uIGNvb2tpZS5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEFkZGl0aW9uYWwgb3B0aW9ucyB0byBjaGFuZ2UgdGhlIHByZXNlbmNlIHNlcnZpY2UgZGVmYXVsdHMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2VcbiAgICAgICAgICovXG4gICAgICAgIG1hcmtPbmxpbmU6IGZ1bmN0aW9uICh1c2VySWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHVzZXJJZCA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXModXNlcklkKTtcbiAgICAgICAgICAgIGlmICghb2JqUGFyYW1zLmdyb3VwTmFtZSAmJiAhb3B0aW9ucy5ncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdyb3VwTmFtZSBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1c2VySWQgPSBpc1N0cmluZyA/IHVzZXJJZCA6IG9ialBhcmFtcy51c2VySWQ7XG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lID0gb3B0aW9ucy5ncm91cE5hbWUgfHwgb2JqUGFyYW1zLmdyb3VwTmFtZTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBOYW1lICsgJy8nICsgdXNlcklkIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgbWVzc2FnZTogJ29ubGluZScgfSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXJrcyBhbiBlbmQgdXNlciBhcyBvZmZsaW5lLlxuICAgICAgICAgKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgdmFyIHByID0gbmV3IEYuc2VydmljZS5QcmVzZW5jZSgpO1xuICAgICAgICAgKiAgICAgcHIubWFya09mZmxpbmUoJzAwMDAwMTVhNjhkODA2YmMwOWNkMGE3ZDIwN2Y0NGJhNWY3NCcpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqIFByb21pc2UgdG8gcmVtb3ZlIHByZXNlbmNlIHJlY29yZCBmb3IgZW5kIHVzZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gdXNlcklkIChvcHRpb25hbCkgSWYgbm90IHByb3ZpZGVkLCB0YWtlbiBmcm9tIHNlc3Npb24gY29va2llLlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIHRvIGNoYW5nZSB0aGUgcHJlc2VuY2Ugc2VydmljZSBkZWZhdWx0cy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZVxuICAgICAgICAgKi9cbiAgICAgICAgbWFya09mZmxpbmU6IGZ1bmN0aW9uICh1c2VySWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHVzZXJJZCA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXModXNlcklkKTtcbiAgICAgICAgICAgIGlmICghb2JqUGFyYW1zLmdyb3VwTmFtZSAmJiAhb3B0aW9ucy5ncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdyb3VwTmFtZSBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1c2VySWQgPSBpc1N0cmluZyA/IHVzZXJJZCA6IG9ialBhcmFtcy51c2VySWQ7XG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lID0gb3B0aW9ucy5ncm91cE5hbWUgfHwgb2JqUGFyYW1zLmdyb3VwTmFtZTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBOYW1lICsgJy8nICsgdXNlcklkIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUoe30sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIGVuZCB1c2VycyBpbiB0aGlzIGdyb3VwIHRoYXQgYXJlIGN1cnJlbnRseSBvbmxpbmUuXG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICB2YXIgcHIgPSBuZXcgRi5zZXJ2aWNlLlByZXNlbmNlKCk7XG4gICAgICAgICAqICAgICBwci5nZXRTdGF0dXMoJ2dyb3VwTmFtZScpLnRoZW4oZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgICAgICogICAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgb25saW5lVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICogICAgICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciAnLCBvbmxpbmVVc2Vyc1tpXS51c2VySWQsIFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgJyBpcyBvbmxpbmUgYXMgb2YgJywgb25saW5lVXNlcnNbaV0ubGFzdE1vZGlmaWVkKTtcbiAgICAgICAgICogICAgICAgICAgfVxuICAgICAgICAgKiAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogUHJvbWlzZSB3aXRoIHJlc3BvbnNlIG9mIG9ubGluZSB1c2Vyc1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwTmFtZSAob3B0aW9uYWwpIElmIG5vdCBwcm92aWRlZCwgdGFrZW4gZnJvbSBzZXNzaW9uIGNvb2tpZS5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEFkZGl0aW9uYWwgb3B0aW9ucyB0byBjaGFuZ2UgdGhlIHByZXNlbmNlIHNlcnZpY2UgZGVmYXVsdHMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldFN0YXR1czogZnVuY3Rpb24gKGdyb3VwTmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMoZ3JvdXBOYW1lKTtcbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lICYmICFvYmpQYXJhbXMuZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncm91cE5hbWUgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBOYW1lID0gZ3JvdXBOYW1lIHx8IG9ialBhcmFtcy5ncm91cE5hbWU7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIGdyb3VwTmFtZSB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVuZCB1c2VycyBhcmUgYXV0b21hdGljYWxseSBtYXJrZWQgb25saW5lIGFuZCBvZmZsaW5lIGluIGEgXCJwcmVzZW5jZVwiIGNoYW5uZWwgdGhhdCBpcyBzcGVjaWZpYyB0byBlYWNoIGdyb3VwLiBHZXRzIHRoaXMgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKSBmb3IgdGhlIGdpdmVuIGdyb3VwLiAoTm90ZSB0aGF0IHRoaXMgQ2hhbm5lbCBTZXJ2aWNlIGluc3RhbmNlIGlzIGFsc28gYXZhaWxhYmxlIGZyb20gdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGdldFByZXNlbmNlQ2hhbm5lbCgpXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyNnZXRQcmVzZW5jZUNoYW5uZWwpLilcbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHZhciBwciA9IG5ldyBGLnNlcnZpY2UuUHJlc2VuY2UoKTtcbiAgICAgICAgICogICAgIHZhciBjbSA9IHByLmdldENoYW5uZWwoJ2dyb3VwMScpO1xuICAgICAgICAgKiAgICAgY20ucHVibGlzaCgnJywgJ2EgbWVzc2FnZSB0byBwcmVzZW5jZSBjaGFubmVsJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogQ2hhbm5lbCBpbnN0YW5jZSBmb3IgUHJlc2VuY2UgY2hhbm5lbFxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwTmFtZSAob3B0aW9uYWwpIElmIG5vdCBwcm92aWRlZCwgdGFrZW4gZnJvbSBzZXNzaW9uIGNvb2tpZS5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEFkZGl0aW9uYWwgb3B0aW9ucyB0byBjaGFuZ2UgdGhlIHByZXNlbmNlIHNlcnZpY2UgZGVmYXVsdHNcbiAgICAgICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0Q2hhbm5lbDogZnVuY3Rpb24gKGdyb3VwTmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgZ3JvdXBOYW1lID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhncm91cE5hbWUpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3JvdXBOYW1lIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwTmFtZSA9IGlzU3RyaW5nID8gZ3JvdXBOYW1lIDogb2JqUGFyYW1zLmdyb3VwTmFtZTtcbiAgICAgICAgICAgIHZhciBjbSA9IG5ldyBDaGFubmVsTWFuYWdlcihvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBjbS5nZXRQcmVzZW5jZUNoYW5uZWwoZ3JvdXBOYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIFJ1biBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBSdW4gQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBwZXJmb3JtIGNvbW1vbiB0YXNrcyBhcm91bmQgY3JlYXRpbmcgYW5kIHVwZGF0aW5nIHJ1bnMsIHZhcmlhYmxlcywgYW5kIGRhdGEuXG4gKlxuICogV2hlbiBidWlsZGluZyBpbnRlcmZhY2VzIHRvIHNob3cgcnVuIG9uZSBhdCBhIHRpbWUgKGFzIGZvciBzdGFuZGFyZCBlbmQgdXNlcnMpLCB0eXBpY2FsbHkgeW91IGZpcnN0IGluc3RhbnRpYXRlIGEgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCB0aGVuIGFjY2VzcyB0aGUgUnVuIFNlcnZpY2UgdGhhdCBpcyBhdXRvbWF0aWNhbGx5IHBhcnQgb2YgdGhlIG1hbmFnZXIsIHJhdGhlciB0aGFuIGluc3RhbnRpYXRpbmcgdGhlIFJ1biBTZXJ2aWNlIGRpcmVjdGx5LiBUaGlzIGlzIGJlY2F1c2UgdGhlIFJ1biBNYW5hZ2VyIChhbmQgYXNzb2NpYXRlZCBbcnVuIHN0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKSkgZ2l2ZXMgeW91IGNvbnRyb2wgb3ZlciBydW4gY3JlYXRpb24gZGVwZW5kaW5nIG9uIHJ1biBzdGF0ZXMuXG4gKlxuICogVGhlIFJ1biBBUEkgU2VydmljZSBpcyB1c2VmdWwgZm9yIGJ1aWxkaW5nIGFuIGludGVyZmFjZSB3aGVyZSB5b3Ugd2FudCB0byBzaG93IGRhdGEgYWNyb3NzIG11bHRpcGxlIHJ1bnMgKHRoaXMgaXMgZWFzeSB1c2luZyB0aGUgYGZpbHRlcigpYCBhbmQgYHF1ZXJ5KClgIG1ldGhvZHMpLiBGb3IgaW5zdGFuY2UsIHlvdSB3b3VsZCBwcm9iYWJseSB1c2UgYSBSdW4gU2VydmljZSB0byBidWlsZCBhIHBhZ2UgZm9yIGEgZmFjaWxpdGF0b3IuIFRoaXMgaXMgYmVjYXVzZSBhIGZhY2lsaXRhdG9yIHR5cGljYWxseSB3YW50cyB0byBldmFsdWF0ZSBwZXJmb3JtYW5jZSBmcm9tIG11bHRpcGxlIGVuZCB1c2VycywgZWFjaCBvZiB3aG9tIGhhdmUgYmVlbiB3b3JraW5nIHdpdGggdGhlaXIgb3duIHJ1bi5cbiAqXG4gKiBUbyB1c2UgdGhlIFJ1biBBUEkgU2VydmljZSwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICpcbiAqIElmIHlvdSBrbm93IGluIGFkdmFuY2UgdGhhdCB5b3Ugd291bGQgbGlrZSB0byB3b3JrIHdpdGggcGFydGljdWxhciwgZXhpc3RpbmcgcnVuKHMpLCB5b3UgY2FuIG9wdGlvbmFsbHkgcGFzcyBpbjpcbiAqXG4gKiAqIGBmaWx0ZXJgOiAoT3B0aW9uYWwpIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciBmb3IgZXhpc3RpbmcgcnVucy4gXG4gKiAqIGBpZGA6IChPcHRpb25hbCkgVGhlIHJ1biBpZCBvZiBhbiBleGlzdGluZyBydW4uIFRoaXMgaXMgYSBjb252ZW5pZW5jZSBhbGlhcyBmb3IgdXNpbmcgZmlsdGVyLCBpbiB0aGUgY2FzZSB3aGVyZSB5b3Ugb25seSB3YW50IHRvIHdvcmsgd2l0aCBvbmUgcnVuLlxuICpcbiAqIEZvciBleGFtcGxlLFxuICpcbiAqICAgICAgIHZhciBycyA9IG5ldyBGLnNlcnZpY2UuUnVuKHtcbiAqICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICB9KTtcbiAqICAgICAgcnMuY3JlYXRlKCdzdXBwbHlfY2hhaW5fZ2FtZS5weScpLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4gKiAgICAgICAgICAgICBycy5kbygnc29tZU9wZXJhdGlvbicpO1xuICogICAgICB9KTtcbiAqXG4gKlxuICogQWRkaXRpb25hbGx5LCBhbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gYG9wdGlvbnNgIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgUnVuIEFQSSBTZXJ2aWNlIGRlZmF1bHRzIGxpc3RlZCBiZWxvdy4gSW4gcGFydGljdWxhciwgcGFzc2luZyBgeyBpZDogJ2EtcnVuLWlkJyB9YCBpbiB0aGlzIGBvcHRpb25zYCBvYmplY3QgYWxsb3dzIHlvdSB0byBtYWtlIGNhbGxzIHRvIGFuIGV4aXN0aW5nIHJ1bi5cbiAqXG4gKiBOb3RlIHRoYXQgaW4gYWRkaXRpb24gdG8gdGhlIGBhY2NvdW50YCwgYHByb2plY3RgLCBhbmQgYG1vZGVsYCwgdGhlIFJ1biBTZXJ2aWNlIHBhcmFtZXRlcnMgb3B0aW9uYWxseSBpbmNsdWRlIGEgYHNlcnZlcmAgb2JqZWN0LCB3aG9zZSBgaG9zdGAgZmllbGQgY29udGFpbnMgdGhlIFVSSSBvZiB0aGUgRm9yaW8gc2VydmVyLiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgc2V0LCBidXQgeW91IGNhbiBwYXNzIGl0IGV4cGxpY2l0bHkgaWYgZGVzaXJlZC4gSXQgaXMgbW9zdCBjb21tb25seSB1c2VkIGZvciBjbGFyaXR5IHdoZW4geW91IGFyZSBbaG9zdGluZyBhbiBFcGljZW50ZXIgcHJvamVjdCBvbiB5b3VyIG93biBzZXJ2ZXJdKC4uLy4uLy4uL2hvd190by9zZWxmX2hvc3RpbmcvKS5cbiAqXG4gKiAgICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuICogICAgICAgICAgIHJ1bjoge1xuICogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5X2NoYWluX2dhbWUucHknLFxuICogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiAqICAgICAgICAgICB9XG4gKiAgICAgICB9KTtcbiAqICAgICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4gKiAgICAgICAgICAgICAgIC8vIHRoZSBSdW5NYW5hZ2VyLnJ1biBjb250YWlucyB0aGUgaW5zdGFudGlhdGVkIFJ1biBTZXJ2aWNlLFxuICogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiAqICAgICAgICAgICAgICAgdmFyIHJzID0gcm0ucnVuO1xuICogICAgICAgICAgICAgICBycy5kbygnc29tZU9wZXJhdGlvbicpO1xuICogICAgICAgfSlcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBydXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcnVuLXV0aWwnKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBWYXJpYWJsZXNTZXJ2aWNlID0gcmVxdWlyZSgnLi92YXJpYWJsZXMtYXBpLXNlcnZpY2UnKTtcbnZhciBJbnRyb3NwZWN0aW9uU2VydmljZSA9IHJlcXVpcmUoJy4vaW50cm9zcGVjdGlvbi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byB1bmRlZmluZWQpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciBydW5zLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyLiBQYXNzIGluIGFuIGV4aXN0aW5nIHJ1biBpZCB0byBpbnRlcmFjdCB3aXRoIGEgcGFydGljdWxhciBydW4uXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsYWcgZGV0ZXJtaW5lcyBpZiBgWC1BdXRvUmVzdG9yZTogdHJ1ZWAgaGVhZGVyIGlzIHNlbnQgdG8gRXBpY2VudGVyLCBtZWFuaW5nIHJ1bnMgYXJlIGF1dG9tYXRpY2FsbHkgcHVsbGVkIGZyb20gdGhlIEVwaWNlbnRlciBiYWNrZW5kIGRhdGFiYXNlIGlmIG5vdCBjdXJyZW50bHkgaW4gbWVtb3J5IG9uIHRoZSBFcGljZW50ZXIgc2VydmVycy4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGF1dG9SZXN0b3JlOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5LiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgc3VjY2VzczogJC5ub29wLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBmYWlscy4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5pZCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBzZXJ2aWNlT3B0aW9ucy5pZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVVUkxDb25maWcob3B0cykge1xuICAgICAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uob3B0cykuZ2V0KCdzZXJ2ZXInKTtcbiAgICAgICAgaWYgKG9wdHMuYWNjb3VudCkge1xuICAgICAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gb3B0cy5hY2NvdW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IG9wdHMucHJvamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHVybENvbmZpZy5maWx0ZXIgPSAnOyc7XG4gICAgICAgIHVybENvbmZpZy5nZXRGaWx0ZXJVUkwgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3J1bicpO1xuICAgICAgICAgICAgdmFyIGZpbHRlck1hdHJpeCA9IHF1dGlsLnRvTWF0cml4Rm9ybWF0KGZpbHRlciB8fCBvcHRzLmZpbHRlcik7XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXJNYXRyaXgpIHtcbiAgICAgICAgICAgICAgICB1cmwgKz0gZmlsdGVyTWF0cml4ICsgJy8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgfTtcblxuICAgICAgICB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGZpbHRlciA9IG9wdHMuZmlsdGVyO1xuICAgICAgICAgICAgLy8gVGhlIHNlbWljb2xvbiBzZXBhcmF0ZWQgZmlsdGVyIGlzIHVzZWQgd2hlbiBmaWx0ZXIgaXMgYW4gb2JqZWN0XG4gICAgICAgICAgICB2YXIgaXNGaWx0ZXJSdW5JZCA9IGZpbHRlciAmJiAkLnR5cGUoZmlsdGVyKSA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICBpZiAob3B0cy5hdXRvUmVzdG9yZSAmJiBpc0ZpbHRlclJ1bklkKSB7XG4gICAgICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCBhdXRvcmVwbGF5IHRoZSBydW4gYnkgc2VuZGluZyB0aGlzIGhlYWRlciB0byBlcGljZW50ZXJcbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2ZvcmlvLmNvbS9lcGljZW50ZXIvZG9jcy9wdWJsaWMvcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNyZXRyaWV2aW5nXG4gICAgICAgICAgICAgICAgdmFyIGF1dG9yZXN0b3JlT3B0cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1gtQXV0b1Jlc3RvcmUnOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCBhdXRvcmVzdG9yZU9wdHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHVybENvbmZpZztcbiAgICB9XG5cbiAgICB2YXIgaHR0cDtcbiAgICB2YXIgaHR0cE9wdGlvbnM7IC8vRklYTUU6IE1ha2UgdGhpcyBzaWRlLWVmZmVjdC1sZXNzXG4gICAgZnVuY3Rpb24gdXBkYXRlSFRUUENvbmZpZyhzZXJ2aWNlT3B0aW9ucywgdXJsQ29uZmlnKSB7XG4gICAgICAgIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuICAgICAgICBodHRwLnNwbGl0R2V0ID0gcnV0aWwuc3BsaXRHZXRGYWN0b3J5KGh0dHBPcHRpb25zKTtcbiAgICB9XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gdXBkYXRlVVJMQ29uZmlnKHNlcnZpY2VPcHRpb25zKTsgLy9tYWtpbmcgYSBmdW5jdGlvbiBzbyAjdXBkYXRlQ29uZmlnIGNhbiBjYWxsIHRoaXM7IGNoYW5nZSB3aGVuIHJlZmFjdG9yZWRcbiAgICB1cGRhdGVIVFRQQ29uZmlnKHNlcnZpY2VPcHRpb25zLCB1cmxDb25maWcpO1xuICAgXG5cbiAgICBmdW5jdGlvbiBzZXRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5pZCkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gc2VydmljZU9wdGlvbnMuaWQgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gc2VydmljZU9wdGlvbnMuaWQgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBmaWx0ZXIgc3BlY2lmaWVkIHRvIGFwcGx5IG9wZXJhdGlvbnMgYWdhaW5zdCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHB1YmxpY0FzeW5jQVBJID0ge1xuICAgICAgICB1cmxDb25maWc6IHVybENvbmZpZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogTk9URTogVHlwaWNhbGx5IHRoaXMgaXMgbm90IHVzZWQhIFVzZSBgUnVuTWFuYWdlci5nZXRSdW4oKWAgd2l0aCBhIGBzdHJhdGVneWAgb2YgYHJldXNlLW5ldmVyYCwgb3IgdXNlIGBSdW5NYW5hZ2VyLnJlc2V0KClgLiBTZWUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHJzLmNyZWF0ZSgnaGVsbG9fd29ybGQuamwnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gcGFyYW1zIElmIGEgc3RyaW5nLCB0aGUgbmFtZSBvZiB0aGUgcHJpbWFyeSBbbW9kZWwgZmlsZV0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuIFRoaXMgaXMgdGhlIG9uZSBmaWxlIGluIHRoZSBwcm9qZWN0IHRoYXQgZXhwbGljaXRseSBleHBvc2VzIHZhcmlhYmxlcyBhbmQgbWV0aG9kcywgYW5kIGl0IG11c3QgYmUgc3RvcmVkIGluIHRoZSBNb2RlbCBmb2xkZXIgb2YgeW91ciBFcGljZW50ZXIgcHJvamVjdC4gSWYgYW4gb2JqZWN0LCBtYXkgaW5jbHVkZSBgbW9kZWxgLCBgc2NvcGVgLCBhbmQgYGZpbGVzYC4gKFNlZSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW5fbWFuYWdlci8pIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGBzY29wZWAgYW5kIGBmaWxlc2AuKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKSB9KTtcbiAgICAgICAgICAgIHZhciBydW5BcGlQYXJhbXMgPSBbJ21vZGVsJywgJ3Njb3BlJywgJ2ZpbGVzJywgJ2VwaGVtZXJhbCddO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBqdXN0IHRoZSBtb2RlbCBuYW1lXG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBtb2RlbDogcGFyYW1zIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHdoaXRlbGlzdCB0aGUgZmllbGRzIHRoYXQgd2UgYWN0dWFsbHkgY2FuIHNlbmQgdG8gdGhlIGFwaVxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcywgcnVuQXBpUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBjcmVhdGVPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgICAgICBjcmVhdGVPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSByZXNwb25zZS5pZDsgLy9hbGwgZnV0dXJlIGNoYWluZWQgY2FsbHMgdG8gb3BlcmF0ZSBvbiB0aGlzIGlkXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuaWQgPSByZXNwb25zZS5pZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgZWxlbWVudHMgb2YgdGhlIGBxc2Agb2JqZWN0IGFyZSBBTkRlZCB0b2dldGhlciB3aXRoaW4gYSBzaW5nbGUgY2FsbCB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybnMgcnVucyB3aXRoIHNhdmVkID0gdHJ1ZSBhbmQgdmFyaWFibGVzLnByaWNlID4gMSxcbiAgICAgICAgICogICAgICAvLyB3aGVyZSB2YXJpYWJsZXMucHJpY2UgaGFzIGJlZW4gcGVyc2lzdGVkIChyZWNvcmRlZClcbiAgICAgICAgICogICAgICAvLyBpbiB0aGUgbW9kZWwuXG4gICAgICAgICAqICAgICBycy5xdWVyeSh7XG4gICAgICAgICAqICAgICAgICAgICdzYXZlZCc6ICd0cnVlJyxcbiAgICAgICAgICogICAgICAgICAgJy5wcmljZSc6ICc+MSdcbiAgICAgICAgICogICAgICAgfSxcbiAgICAgICAgICogICAgICAge1xuICAgICAgICAgKiAgICAgICAgICBzdGFydHJlY29yZDogMixcbiAgICAgICAgICogICAgICAgICAgZW5kcmVjb3JkOiA1XG4gICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcXMgUXVlcnkgb2JqZWN0LiBFYWNoIGtleSBjYW4gYmUgYSBwcm9wZXJ0eSBvZiB0aGUgcnVuIG9yIHRoZSBuYW1lIG9mIHZhcmlhYmxlIHRoYXQgaGFzIGJlZW4gc2F2ZWQgaW4gdGhlIHJ1biAocHJlZmFjZWQgYnkgYHZhcmlhYmxlcy5gKS4gRWFjaCB2YWx1ZSBjYW4gYmUgYSBsaXRlcmFsIHZhbHVlLCBvciBhIGNvbXBhcmlzb24gb3BlcmF0b3IgYW5kIHZhbHVlLiAoU2VlIFttb3JlIG9uIGZpbHRlcmluZ10oLi4vLi4vLi4vcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNmaWx0ZXJzKSBhbGxvd2VkIGluIHRoZSB1bmRlcmx5aW5nIFJ1biBBUEkuKSBRdWVyeWluZyBmb3IgdmFyaWFibGVzIGlzIGF2YWlsYWJsZSBmb3IgcnVucyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBhbmQgZm9yIHJ1bnMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgaWYgdGhlIHZhcmlhYmxlcyBhcmUgcGVyc2lzdGVkIChlLmcuIHRoYXQgaGF2ZSBiZWVuIGByZWNvcmRgZWQgaW4geW91ciBtb2RlbCBvciBtYXJrZWQgZm9yIHNhdmluZyBpbiB5b3VyIFttb2RlbCBjb250ZXh0IGZpbGVdKC4uLy4uLy4uL21vZGVsX2NvZGUvY29udGV4dC8pKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHFzLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTChxcykgfSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnNwbGl0R2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucykudGhlbihmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoJC5pc1BsYWluT2JqZWN0KHIpICYmIE9iamVjdC5rZXlzKHIpLmxlbmd0aCA9PT0gMCkgPyBbXSA6IHI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHJ1bnMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXNgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogU2ltaWxhciB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZmlsdGVyIEZpbHRlciBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI2ZpbHRlcnMpIGFsbG93ZWQgaW4gdGhlIHVuZGVybHlpbmcgUnVuIEFQSS4pIEZpbHRlcmluZyBmb3IgdmFyaWFibGVzIGlzIGF2YWlsYWJsZSBmb3IgcnVucyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBhbmQgZm9yIHJ1bnMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgaWYgdGhlIHZhcmlhYmxlcyBhcmUgcGVyc2lzdGVkIChlLmcuIHRoYXQgaGF2ZSBiZWVuIGByZWNvcmRgZWQgaW4geW91ciBtb2RlbCBvciBtYXJrZWQgZm9yIHNhdmluZyBpbiB5b3VyIFttb2RlbCBjb250ZXh0IGZpbGVdKC4uLy4uLy4uL21vZGVsX2NvZGUvY29udGV4dC8pKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHNlcnZpY2VPcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIsIGZpbHRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpLnRoZW4oZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCQuaXNQbGFpbk9iamVjdChyKSAmJiBPYmplY3Qua2V5cyhyKS5sZW5ndGggPT09IDApID8gW10gOiByO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBkYXRhIGZvciBhIHNwZWNpZmljIHJ1bi4gVGhpcyBpbmNsdWRlcyBzdGFuZGFyZCBydW4gZGF0YSBzdWNoIGFzIHRoZSBhY2NvdW50LCBtb2RlbCwgcHJvamVjdCwgYW5kIGNyZWF0ZWQgYW5kIGxhc3QgbW9kaWZpZWQgZGF0ZXMuIFRvIHJlcXVlc3Qgc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzIG9yIHJ1biByZWNvcmQgdmFyaWFibGVzLCBwYXNzIHRoZW0gYXMgcGFydCBvZiB0aGUgYGZpbHRlcnNgIHBhcmFtZXRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IGlmIHRoZSBydW4gaXMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSksIGFueSBtb2RlbCB2YXJpYWJsZXMgYXJlIGF2YWlsYWJsZTsgaWYgdGhlIHJ1biBpcyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tZGIpLCBvbmx5IG1vZGVsIHZhcmlhYmxlcyB0aGF0IGhhdmUgYmVlbiBwZXJzaXN0ZWQgJm1kYXNoOyB0aGF0IGlzLCBgcmVjb3JkYGVkIG9yIHNhdmVkIGluIHlvdXIgbW9kZWwgJm1kYXNoOyBhcmUgYXZhaWxhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgcnMubG9hZCgnYmI1ODk2NzctZDQ3Ni00OTcxLWE2OGUtMGM1OGQxOTFlNDUwJywgeyBpbmNsdWRlOiBbJy5wcmljZScsICcuc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHJ1bklEIFRoZSBydW4gaWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJzIChPcHRpb25hbCkgT2JqZWN0IGNvbnRhaW5pbmcgZmlsdGVycyBhbmQgb3BlcmF0aW9uIG1vZGlmaWVycy4gVXNlIGtleSBgaW5jbHVkZWAgdG8gbGlzdCBtb2RlbCB2YXJpYWJsZXMgdGhhdCB5b3Ugd2FudCB0byBpbmNsdWRlIGluIHRoZSByZXNwb25zZS4gT3RoZXIgYXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocnVuSUQsIGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChydW5JRCkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJ1bklEOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBhdHRyaWJ1dGVzIChkYXRhLCBtb2RlbCB2YXJpYWJsZXMpIG9mIHRoZSBydW4uXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gYWRkICdjb21wbGV0ZWQnIGZpZWxkIHRvIHJ1biByZWNvcmRcbiAgICAgICAgICogICAgIHJzLnNhdmUoeyBjb21wbGV0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyB1cGRhdGUgJ3NhdmVkJyBmaWVsZCBvZiBydW4gcmVjb3JkLCBhbmQgdXBkYXRlIHZhbHVlcyBvZiBtb2RlbCB2YXJpYWJsZXMgZm9yIHRoaXMgcnVuXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgc2F2ZWQ6IHRydWUsIHZhcmlhYmxlczogeyBhOiAyMywgYjogMjMgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHVwZGF0ZSAnc2F2ZWQnIGZpZWxkIG9mIHJ1biByZWNvcmQgZm9yIGEgcGFydGljdWxhciBydW5cbiAgICAgICAgICogICAgIHJzLnNhdmUoeyBzYXZlZDogdHJ1ZSB9LCB7IGlkOiAnMDAwMDAxNWJmMmEwNDk5NTg4MGRmNmI4NjhkMjNlYjNkMjI5JyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgVGhlIHJ1biBkYXRhIGFuZCB2YXJpYWJsZXMgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMudmFyaWFibGVzIE1vZGVsIHZhcmlhYmxlcyBtdXN0IGJlIGluY2x1ZGVkIGluIGEgYHZhcmlhYmxlc2AgZmllbGQgd2l0aGluIHRoZSBgYXR0cmlidXRlc2Agb2JqZWN0LiAoT3RoZXJ3aXNlIHRoZXkgYXJlIHRyZWF0ZWQgYXMgcnVuIGRhdGEgYW5kIGFkZGVkIHRvIHRoZSBydW4gcmVjb3JkIGRpcmVjdGx5LilcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKGF0dHJpYnV0ZXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBhbiBvcGVyYXRpb24gZnJvbSB0aGUgbW9kZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgb3BlcmF0aW9uIChmdW5jdGlvbiBvciBtZXRob2QpIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBgcGFyYW1zYCBhcmd1bWVudCBpcyBub3JtYWxseSBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gdGhlIGBvcGVyYXRpb25gLiBJbiB0aGUgc3BlY2lhbCBjYXNlIHdoZXJlIGBvcGVyYXRpb25gIG9ubHkgdGFrZXMgb25lIGFyZ3VtZW50LCB5b3UgYXJlIG5vdCByZXF1aXJlZCB0byBwdXQgdGhhdCBhcmd1bWVudCBpbnRvIGFuIGFycmF5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgeW91IGNhbiBjb21iaW5lIHRoZSBgb3BlcmF0aW9uYCBhbmQgYHBhcmFtc2AgYXJndW1lbnRzIGludG8gYSBzaW5nbGUgb2JqZWN0IGlmIHlvdSBwcmVmZXIsIGFzIGluIHRoZSBsYXN0IGV4YW1wbGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbiBcInNvbHZlXCIgdGFrZXMgbm8gYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5kbygnc29sdmUnKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb24gXCJlY2hvXCIgdGFrZXMgb25lIGFyZ3VtZW50LCBhIHN0cmluZ1xuICAgICAgICAgKiAgICAgcnMuZG8oJ2VjaG8nLCBbJ2hlbGxvJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbiBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsICdoZWxsbycpO1xuICAgICAgICAgKiAgICAgIC8vIG9wZXJhdGlvbiBcInN1bUFycmF5XCIgdGFrZXMgb25lIGFyZ3VtZW50LCBhbiBhcnJheVxuICAgICAgICAgKiAgICAgcnMuZG8oJ3N1bUFycmF5JywgW1s0LDIsMV1dKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb24gXCJhZGRcIiB0YWtlcyB0d28gYXJndW1lbnRzLCBib3RoIGludGVnZXJzXG4gICAgICAgICAqICAgICBycy5kbyh7IG5hbWU6J2FkZCcsIHBhcmFtczpbMiw0XSB9KTtcbiAgICAgICAgICogICAgICAvLyBjYWxsIG9wZXJhdGlvbiBcInNvbHZlXCIgb24gYSBkaWZmZXJlbnQgcnVuIFxuICAgICAgICAgKiAgICAgcnMuZG8oJ3NvbHZlJywgeyBpZDogJzAwMDAwMTViZjJhMDQ5OTU4ODBkZjZiODY4ZDIzZWIzZDIyOScgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcGVyYXRpb24gTmFtZSBvZiBvcGVyYXRpb24uXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhcmFtcyAoT3B0aW9uYWwpIEFueSBwYXJhbWV0ZXJzIHRoZSBvcGVyYXRpb24gdGFrZXMsIHBhc3NlZCBhcyBhbiBhcnJheS4gSW4gdGhlIHNwZWNpYWwgY2FzZSB3aGVyZSBgb3BlcmF0aW9uYCBvbmx5IHRha2VzIG9uZSBhcmd1bWVudCwgeW91IGFyZSBub3QgcmVxdWlyZWQgdG8gcHV0IHRoYXQgYXJndW1lbnQgaW50byBhbiBhcnJheSwgYW5kIGNhbiBqdXN0IHBhc3MgaXQgZGlyZWN0bHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBkbzogZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZG8nLCBvcGVyYXRpb24sIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzQXJncztcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucztcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbXMpKSB7XG4gICAgICAgICAgICAgICAgb3BzQXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBwYXJhbXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBwYXJhbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb24sIG9wc0FyZ3MpO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBwb3N0T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHNldEZpbHRlck9yVGhyb3dFcnJvcihodHRwT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwcm1zID0gKHJlc3VsdC5hcmdzWzBdLmxlbmd0aCAmJiAocmVzdWx0LmFyZ3NbMF0gIT09IG51bGwgJiYgcmVzdWx0LmFyZ3NbMF0gIT09IHVuZGVmaW5lZCkpID8gcmVzdWx0LmFyZ3NbMF0gOiBbXTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBhcmd1bWVudHM6IHBybXMgfSwgJC5leHRlbmQodHJ1ZSwge30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMKCkgKyAnb3BlcmF0aW9ucy8nICsgcmVzdWx0Lm9wc1swXSArICcvJ1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIHNldmVyYWwgb3BlcmF0aW9ucyBmcm9tIHRoZSBtb2RlbCwgc2VxdWVudGlhbGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG9wZXJhdGlvbiAoZnVuY3Rpb24gb3IgbWV0aG9kKSBtYXkgbmVlZCB0byBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsKSBpbiB0aGUgbW9kZWwgZmlsZSBpbiBvcmRlciB0byBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgQVBJLiBTZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb25zIFwiaW5pdGlhbGl6ZVwiIGFuZCBcInNvbHZlXCIgZG8gbm90IHRha2UgYW55IGFyZ3VtZW50c1xuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsnaW5pdGlhbGl6ZScsICdzb2x2ZSddKTtcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb25zIFwiaW5pdFwiIGFuZCBcInJlc2V0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3Jlc2V0JywgcGFyYW1zOiBbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9uIFwiaW5pdFwiIHRha2VzIHR3byBhcmd1bWVudHMsXG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9uIFwicnVubW9kZWxcIiB0YWtlcyBub25lXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWyAgeyBuYW1lOiAnaW5pdCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICB7IG5hbWU6ICdydW5tb2RlbCcsIHBhcmFtczogW10gfV0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBvcGVyYXRpb25zIElmIG5vbmUgb2YgdGhlIG9wZXJhdGlvbnMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBvcGVyYXRpb24gbmFtZXMgKHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG9wZXJhdGlvbnMgZG8gdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYW4gb3BlcmF0aW9uIG5hbWUgYW5kIGl0cyBvd24gKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiBAcGFyYW0geyp9IHBhcmFtcyBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gb3BlcmF0aW9ucy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gVGhlIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2sgaXMgYW4gYXJyYXkuIEVhY2ggYXJyYXkgZWxlbWVudCBpcyBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgcmVzdWx0cyBvZiBvbmUgb3BlcmF0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgc2VyaWFsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcblxuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGRvU2luZ2xlT3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wID0gb3BzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3Muc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIG1lLmRvKG9wLCBhcmcsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9TaW5nbGVPcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlKHJlc3BvbnNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuc3VjY2VzcyhyZXNwb25zZXMsIG1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlcy5wdXNoKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QocmVzcG9uc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLmVycm9yKHJlc3BvbnNlcywgbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgc2V2ZXJhbCBvcGVyYXRpb25zIGZyb20gdGhlIG1vZGVsLCBleGVjdXRpbmcgdGhlbSBpbiBwYXJhbGxlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBvcGVyYXRpb24gKGZ1bmN0aW9uIG9yIG1ldGhvZCkgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBvcGVyYXRpb25zIFwic29sdmVcIiBhbmQgXCJyZXNldFwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsnc29sdmUnLCAncmVzZXQnXSk7XG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9ucyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsgeyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdzdWJ0cmFjdCcsIHBhcmFtczpbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gb3BlcmF0aW9ucyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKHsgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb3BlcmF0aW9ucyBJZiBub25lIG9mIHRoZSBvcGVyYXRpb25zIHRha2UgcGFyYW1ldGVycywgcGFzcyBhbiBhcnJheSBvZiB0aGUgb3BlcmF0aW9uIG5hbWVzIChhcyBzdHJpbmdzKS4gSWYgYW55IG9mIHRoZSBvcGVyYXRpb25zIGRvIHRha2UgcGFyYW1ldGVycywgeW91IGhhdmUgdHdvIG9wdGlvbnMuIFlvdSBjYW4gcGFzcyBhbiBhcnJheSBvZiBvYmplY3RzLCBlYWNoIG9mIHdoaWNoIGNvbnRhaW5zIGFuIG9wZXJhdGlvbiBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy4gQWx0ZXJuYXRpdmVseSwgeW91IGNhbiBwYXNzIGEgc2luZ2xlIG9iamVjdCB3aXRoIHRoZSBvcGVyYXRpb24gbmFtZSBhbmQgYSAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gcGFzcyB0byBvcGVyYXRpb25zLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBUaGUgcGFyYW1ldGVyIHRvIHRoZSBjYWxsYmFjayBpcyBhbiBhcnJheS4gRWFjaCBhcnJheSBlbGVtZW50IGlzIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSByZXN1bHRzIG9mIG9uZSBvcGVyYXRpb24uXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbGxlbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG8ob3BzW2ldLCBhcmdzW2ldKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAkLndoZW4uYXBwbHkodGhpcywgcXVldWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxSZXNwb25zZSA9IGFyZ3MubWFwKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYVswXTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoYWN0dWFsUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzKGFjdHVhbFJlc3BvbnNlLCBtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFJlc3BvbnNlID0gYXJncy5tYXAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhWzBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0KGFjdHVhbFJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IoYWN0dWFsUmVzcG9uc2UsIG1lKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hvcnRjdXQgdG8gdXNpbmcgdGhlIFtJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlXSguLi9pbnRyb3NwZWN0aW9uLWFwaS1zZXJ2aWNlLykuIEFsbG93cyB5b3UgdG8gdmlldyBhIGxpc3Qgb2YgdGhlIHZhcmlhYmxlcyBhbmQgb3BlcmF0aW9ucyBpbiBhIG1vZGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgcnMuaW50cm9zcGVjdCh7IHJ1bklEOiAnY2JmODU0MzctYjUzOS00OTc3LWExZmMtMjM1MTVjZjA3MWJiJyB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEuZnVuY3Rpb25zKTtcbiAgICAgICAgICogICAgICAgICAgY29uc29sZS5sb2coZGF0YS52YXJpYWJsZXMpO1xuICAgICAgICAgKiAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIGNhbiBlaXRoZXIgYmUgb2YgdGhlIGZvcm0gYHsgcnVuSUQ6IDxydW5pZD4gfWAgb3IgYHsgbW9kZWw6IDxtb2RlbEZpbGVOYW1lPiB9YC4gTm90ZSB0aGF0IHRoZSBgcnVuSURgIGlzIG9wdGlvbmFsIGlmIHRoZSBSdW4gU2VydmljZSBpcyBhbHJlYWR5IGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgcnVuIChiZWNhdXNlIGBpZGAgd2FzIHBhc3NlZCBpbiB3aGVuIHRoZSBSdW4gU2VydmljZSB3YXMgaW5pdGlhbGl6ZWQpLiBJZiBwcm92aWRlZCwgdGhlIGBydW5JRGAgb3ZlcnJpZGVzIHRoZSBgaWRgIGN1cnJlbnRseSBhc3NvY2lhdGVkIHdpdGggdGhlIFJ1biBTZXJ2aWNlLlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGludHJvc3BlY3Rpb25Db25maWcgKE9wdGlvbmFsKSBTZXJ2aWNlIG9wdGlvbnMgZm9yIEludHJvc3BlY3Rpb24gU2VydmljZVxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgaW50cm9zcGVjdDogZnVuY3Rpb24gKG9wdGlvbnMsIGludHJvc3BlY3Rpb25Db25maWcpIHtcbiAgICAgICAgICAgIHZhciBpbnRyb3NwZWN0aW9uID0gbmV3IEludHJvc3BlY3Rpb25TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgaW50cm9zcGVjdGlvbkNvbmZpZykpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5ydW5JRCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW50cm9zcGVjdGlvbi5ieVJ1bklEKG9wdGlvbnMucnVuSUQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5tb2RlbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW50cm9zcGVjdGlvbi5ieU1vZGVsKG9wdGlvbnMubW9kZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VydmljZU9wdGlvbnMuaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50cm9zcGVjdGlvbi5ieVJ1bklEKHNlcnZpY2VPcHRpb25zLmlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBlaXRoZXIgdGhlIG1vZGVsIG9yIHJ1bmlkIHRvIGludHJvc3BlY3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljU3luY0FQSSA9IHtcbiAgICAgICAgZ2V0Q3VycmVudENvbmZpZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcgJiYgY29uZmlnLmlkKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmZpbHRlciA9IGNvbmZpZy5pZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnICYmIGNvbmZpZy5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuaWQgPSBjb25maWcuZmlsdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIGNvbmZpZyk7XG4gICAgICAgICAgICB1cmxDb25maWcgPSB1cGRhdGVVUkxDb25maWcoc2VydmljZU9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy51cmxDb25maWcgPSB1cmxDb25maWc7XG4gICAgICAgICAgICB1cGRhdGVIVFRQQ29uZmlnKHNlcnZpY2VPcHRpb25zLCB1cmxDb25maWcpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICAqIFJldHVybnMgYSBWYXJpYWJsZXMgU2VydmljZSBpbnN0YW5jZS4gVXNlIHRoZSB2YXJpYWJsZXMgaW5zdGFuY2UgdG8gbG9hZCwgc2F2ZSwgYW5kIHF1ZXJ5IGZvciBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMuIFNlZSB0aGUgW1ZhcmlhYmxlIEFQSSBTZXJ2aWNlXSguLi92YXJpYWJsZXMtYXBpLXNlcnZpY2UvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgICAgICAqXG4gICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgICpcbiAgICAgICAgICAqICAgICAgdmFyIHZzID0gcnMudmFyaWFibGVzKCk7XG4gICAgICAgICAgKiAgICAgIHZzLnNhdmUoeyBzYW1wbGVfaW50OiA0IH0pO1xuICAgICAgICAgICpcbiAgICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHZhcmlhYmxlc1NlcnZpY2UgSW5zdGFuY2VcbiAgICAgICAgICAqL1xuICAgICAgICB2YXJpYWJsZXM6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciB2cyA9IG5ldyBWYXJpYWJsZXNTZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgY29uZmlnLCB7XG4gICAgICAgICAgICAgICAgcnVuU2VydmljZTogdGhpc1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmV0dXJuIHZzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNTeW5jQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIHNlcnZpY2VVdGlscyA9IHtcbiAgICAvKlxuICAgICogR2V0cyB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciBhIGFwaSBzZXJ2aWNlLlxuICAgICogSXQgd2lsbCBtZXJnZTpcbiAgICAqIC0gVGhlIFNlc3Npb24gb3B0aW9ucyAoVXNpbmcgdGhlIFNlc3Npb24gTWFuYWdlcilcbiAgICAqIC0gVGhlIEF1dGhvcml6YXRpb24gSGVhZGVyIGZyb20gdGhlIHRva2VuIG9wdGlvblxuICAgICogLSBUaGUgZnVsbCB1cmwgZnJvbSB0aGUgZW5kcG9pbnQgb3B0aW9uXG4gICAgKiBXaXRoIHRoZSBzdXBwbGllZCBvdmVycmlkZXMgYW5kIGRlZmF1bHRzXG4gICAgKlxuICAgICovXG4gICAgZ2V0RGVmYXVsdE9wdGlvbnM6IGZ1bmN0aW9uIChkZWZhdWx0cykge1xuICAgICAgICB2YXIgcmVzdCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgICAgICB2YXIgc2VydmljZU9wdGlvbnMgPSBzZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zLmFwcGx5KHNlc3Npb25NYW5hZ2VyLCBbZGVmYXVsdHNdLmNvbmNhdChyZXN0KSk7XG5cbiAgICAgICAgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0ID0gb2JqZWN0QXNzaWduKHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRBcGlVcmwoc2VydmljZU9wdGlvbnMuYXBpRW5kcG9pbnQsIHNlcnZpY2VPcHRpb25zKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydC5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9LFxuXG4gICAgZ2V0QXBpVXJsOiBmdW5jdGlvbiAoYXBpRW5kcG9pbnQsIHNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICAgICAgcmV0dXJuIHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlcnZpY2VVdGlsczsiLCIndXNlIHN0cmljdCc7XG4vKipcbiAqICMjIFN0YXRlIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIFN0YXRlIEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gdmlldyB0aGUgaGlzdG9yeSBvZiBhIHJ1biwgYW5kIHRvIHJlcGxheSBvciBjbG9uZSBydW5zLiBcbiAqXG4gKiBUaGUgU3RhdGUgQVBJIEFkYXB0ZXIgYnJpbmdzIGV4aXN0aW5nLCBwZXJzaXN0ZWQgcnVuIGRhdGEgZnJvbSB0aGUgZGF0YWJhc2UgYmFjayBpbnRvIG1lbW9yeSwgdXNpbmcgdGhlIHNhbWUgcnVuIGlkIChgcmVwbGF5YCkgb3IgYSBuZXcgcnVuIGlkIChgY2xvbmVgKS4gUnVucyBtdXN0IGJlIGluIG1lbW9yeSBpbiBvcmRlciBmb3IgeW91IHRvIHVwZGF0ZSB2YXJpYWJsZXMgb3IgY2FsbCBvcGVyYXRpb25zIG9uIHRoZW0uXG4gKlxuICogU3BlY2lmaWNhbGx5LCB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIgd29ya3MgYnkgXCJyZS1ydW5uaW5nXCIgdGhlIHJ1biAodXNlciBpbnRlcmFjdGlvbnMpIGZyb20gdGhlIGNyZWF0aW9uIG9mIHRoZSBydW4gdXAgdG8gdGhlIHRpbWUgaXQgd2FzIGxhc3QgcGVyc2lzdGVkIGluIHRoZSBkYXRhYmFzZS4gVGhpcyBwcm9jZXNzIHVzZXMgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgcnVuJ3MgbW9kZWwuIFRoZXJlZm9yZSwgaWYgdGhlIG1vZGVsIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBvcmlnaW5hbCBydW4gd2FzIGNyZWF0ZWQsIHRoZSByZXRyaWV2ZWQgcnVuIHdpbGwgdXNlIHRoZSBuZXcgbW9kZWwg4oCUIGFuZCBtYXkgZW5kIHVwIGhhdmluZyBkaWZmZXJlbnQgdmFsdWVzIG9yIGJlaGF2aW9yIGFzIGEgcmVzdWx0LiBVc2Ugd2l0aCBjYXJlIVxuICpcbiAqIFRvIHVzZSB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGNhbGwgaXRzIG1ldGhvZHM6XG4gKlxuICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnfSk7XG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIHRha2VzIGFuIG9wdGlvbmFsIGBvcHRpb25zYCBwYXJhbWV0ZXIgaW4gd2hpY2ggeW91IGNhbiBzcGVjaWZ5IHRoZSBgYWNjb3VudGAgYW5kIGBwcm9qZWN0YCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiAqXG4gKi9cblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgYXBpRW5kcG9pbnQgPSAnbW9kZWwvc3RhdGUnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcbiAgICB2YXIgcGFyc2VSdW5JZE9yRXJyb3IgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSAmJiBwYXJhbXMucnVuSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMucnVuSWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwYXNzIGluIGEgcnVuIGlkJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBWaWV3IHRoZSBoaXN0b3J5IG9mIGEgcnVuLlxuICAgICAgICAqIFxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gICAgICAgICogICAgICBzYS5sb2FkKCcwMDAwMDE1YTA2YmI1ODYxM2IyOGI1NzM2NTY3N2VjODllYzUnKS50aGVuKGZ1bmN0aW9uKGhpc3RvcnkpIHtcbiAgICAgICAgKiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdoaXN0b3J5ID0gJywgaGlzdG9yeSk7XG4gICAgICAgICogICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBydW5JZCBUaGUgaWQgb2YgdGhlIHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChydW5JZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBQYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwUGFyYW1zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXBsYXkgYSBydW4uIEFmdGVyIHRoaXMgY2FsbCwgdGhlIHJ1biwgd2l0aCBpdHMgb3JpZ2luYWwgcnVuIGlkLCBpcyBub3cgYXZhaWxhYmxlIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoSXQgY29udGludWVzIHRvIGJlIHBlcnNpc3RlZCBpbnRvIHRoZSBFcGljZW50ZXIgZGF0YWJhc2UgYXQgcmVndWxhciBpbnRlcnZhbHMuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnLCBzdG9wQmVmb3JlOiAnY2FsY3VsYXRlU2NvcmUnfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgb2JqZWN0LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMucnVuSWQgVGhlIGlkIG9mIHRoZSBydW4gdG8gYnJpbmcgYmFjayB0byBtZW1vcnkuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zdG9wQmVmb3JlIChPcHRpb25hbCkgVGhlIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoaXMgbWV0aG9kLlxuICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IHBhcmFtcy5leGNsdWRlIChPcHRpb25hbCkgQXJyYXkgb2YgbWV0aG9kcyB0byBleGNsdWRlIHdoZW4gYWR2YW5jaW5nIHRoZSBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZXBsYXk6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBydW5JZCA9IHBhcnNlUnVuSWRPckVycm9yKHBhcmFtcyk7XG5cbiAgICAgICAgICAgIHZhciByZXBsYXlPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBhY3Rpb246ICdyZXBsYXknIH0sIF9waWNrKHBhcmFtcywgWydzdG9wQmVmb3JlJywgJ2V4Y2x1ZGUnXSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgcmVwbGF5T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQ2xvbmUgYSBnaXZlbiBydW4gYW5kIHJldHVybiBhIG5ldyBydW4gaW4gdGhlIHNhbWUgc3RhdGUgYXMgdGhlIGdpdmVuIHJ1bi5cbiAgICAgICAgKlxuICAgICAgICAqIFRoZSBuZXcgcnVuIGlkIGlzIG5vdyBhdmFpbGFibGUgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIFRoZSBuZXcgcnVuIGluY2x1ZGVzIGEgY29weSBvZiBhbGwgb2YgdGhlIGRhdGEgZnJvbSB0aGUgb3JpZ2luYWwgcnVuLCBFWENFUFQ6XG4gICAgICAgICpcbiAgICAgICAgKiAqIFRoZSBgc2F2ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyBub3QgY29waWVkIGZyb20gdGhlIG9yaWdpbmFsIHJ1biByZWNvcmQuIEl0IGRlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICAgICAgICogKiBUaGUgYGluaXRpYWxpemVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgbm90IGNvcGllZCBmcm9tIHRoZSBvcmlnaW5hbCBydW4gcmVjb3JkLiBJdCBkZWZhdWx0cyB0byBgZmFsc2VgIGJ1dCBtYXkgY2hhbmdlIHRvIGB0cnVlYCBhcyB0aGUgbmV3IHJ1biBpcyBhZHZhbmNlZC4gRm9yIGV4YW1wbGUsIGlmIHRoZXJlIGhhcyBiZWVuIGEgY2FsbCB0byB0aGUgYHN0ZXBgIGZ1bmN0aW9uIChmb3IgVmVuc2ltIG1vZGVscyksIHRoZSBgaW5pdGlhbGl6ZWRgIGZpZWxkIGlzIHNldCB0byBgdHJ1ZWAuXG4gICAgICAgICogKiBUaGUgYGNyZWF0ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyB0aGUgZGF0ZSBhbmQgdGltZSBhdCB3aGljaCB0aGUgY2xvbmUgd2FzIGNyZWF0ZWQgKG5vdCB0aGUgdGltZSB0aGF0IHRoZSBvcmlnaW5hbCBydW4gd2FzIGNyZWF0ZWQuKVxuICAgICAgICAqXG4gICAgICAgICogVGhlIG9yaWdpbmFsIHJ1biByZW1haW5zIG9ubHkgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLWRiKS5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gICAgICAgICogICAgICBzYS5jbG9uZSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnLCBzdG9wQmVmb3JlOiAnY2FsY3VsYXRlU2NvcmUnLCBleGNsdWRlOiBbJ2ludGVyaW1DYWxjdWxhdGlvbiddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBQYXJhbWV0ZXJzIG9iamVjdC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnJ1bklkIFRoZSBpZCBvZiB0aGUgcnVuIHRvIGNsb25lIGZyb20gbWVtb3J5LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuc3RvcEJlZm9yZSAoT3B0aW9uYWwpIFRoZSBuZXdseSBjbG9uZWQgcnVuIGlzIGFkdmFuY2VkIG9ubHkgdXAgdG8gdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgdGhpcyBtZXRob2QuXG4gICAgICAgICogQHBhcmFtIHthcnJheX0gcGFyYW1zLmV4Y2x1ZGUgKE9wdGlvbmFsKSBBcnJheSBvZiBtZXRob2RzIHRvIGV4Y2x1ZGUgd2hlbiBhZHZhbmNpbmcgdGhlIG5ld2x5IGNsb25lZCBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJ1bklkID0gcGFyc2VSdW5JZE9yRXJyb3IocGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ2Nsb25lJyB9LCBfcGljayhwYXJhbXMsIFsnc3RvcEJlZm9yZScsICdleGNsdWRlJ10pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXBpVmVyc2lvbiA9IHJlcXVpcmUoJy4uL2FwaS12ZXJzaW9uLmpzb24nKTtcblxuLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcbnZhciBkZWZhdWx0cyA9IHtcbiAgICBob3N0OiB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICBwYXRobmFtZTogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXG59O1xuXG5mdW5jdGlvbiBnZXRMb2NhbEhvc3QoZXhpc3RpbmdGbiwgaG9zdCkge1xuICAgIHZhciBsb2NhbEhvc3RGbjtcbiAgICBpZiAoZXhpc3RpbmdGbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghJC5pc0Z1bmN0aW9uKGV4aXN0aW5nRm4pKSB7XG4gICAgICAgICAgICBsb2NhbEhvc3RGbiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGV4aXN0aW5nRm47IH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2NhbEhvc3RGbiA9IGV4aXN0aW5nRm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbEhvc3RGbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpc0xvY2FsID0gIWhvc3QgfHwgLy9waGFudG9tanNcbiAgICAgICAgICAgICAgICBob3N0ID09PSAnMTI3LjAuMC4xJyB8fCBcbiAgICAgICAgICAgICAgICBob3N0LmluZGV4T2YoJ2xvY2FsLicpID09PSAwIHx8IFxuICAgICAgICAgICAgICAgIGhvc3QuaW5kZXhPZignbG9jYWxob3N0JykgPT09IDA7XG4gICAgICAgICAgICByZXR1cm4gaXNMb2NhbDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsSG9zdEZuO1xufVxuXG52YXIgVXJsQ29uZmlnU2VydmljZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZW52Q29uZiA9IFVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHM7XG5cbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICBjb25maWcgPSB7fTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5kZWZhdWx0cyk7XG4gICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kKHt9LCBlbnZDb25mLCBjb25maWcpO1xuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBvdmVycmlkZXMpO1xuXG4gICAgb3ZlcnJpZGVzLmlzTG9jYWxob3N0ID0gb3B0aW9ucy5pc0xvY2FsaG9zdCA9IGdldExvY2FsSG9zdChvcHRpb25zLmlzTG9jYWxob3N0LCBvcHRpb25zLmhvc3QpO1xuICAgIFxuICAgIC8vIGNvbnNvbGUubG9nKGlzTG9jYWxob3N0KCksICdfX19fX19fX19fXycpO1xuICAgIHZhciBhY3RpbmdIb3N0ID0gY29uZmlnICYmIGNvbmZpZy5ob3N0O1xuICAgIGlmICghYWN0aW5nSG9zdCAmJiBvcHRpb25zLmlzTG9jYWxob3N0KCkpIHtcbiAgICAgICAgYWN0aW5nSG9zdCA9ICdmb3Jpby5jb20nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGluZ0hvc3QgPSBvcHRpb25zLmhvc3Q7XG4gICAgfVxuXG4gICAgdmFyIEFQSV9QUk9UT0NPTCA9ICdodHRwcyc7XG4gICAgdmFyIEhPU1RfQVBJX01BUFBJTkcgPSB7XG4gICAgICAgICdmb3Jpby5jb20nOiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICdmb3Jpb2Rldi5jb20nOiAnYXBpLmVwaWNlbnRlci5mb3Jpb2Rldi5jb20nXG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNFeHBvcnRzID0ge1xuICAgICAgICBwcm90b2NvbDogQVBJX1BST1RPQ09MLFxuXG4gICAgICAgIGFwaTogJycsXG5cbiAgICAgICAgLy9UT0RPOiB0aGlzIHNob3VsZCByZWFsbHkgYmUgY2FsbGVkICdhcGlob3N0JywgYnV0IGNhbid0IGJlY2F1c2UgdGhhdCB3b3VsZCBicmVhayB0b28gbWFueSB0aGluZ3NcbiAgICAgICAgaG9zdDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcGlIb3N0ID0gKEhPU1RfQVBJX01BUFBJTkdbYWN0aW5nSG9zdF0pID8gSE9TVF9BUElfTUFQUElOR1thY3RpbmdIb3N0XSA6IGFjdGluZ0hvc3Q7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhY3RpbmdIb3N0LCBjb25maWcsIGFwaUhvc3QpO1xuICAgICAgICAgICAgcmV0dXJuIGFwaUhvc3Q7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgaXNDdXN0b21Eb21haW46IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IG9wdGlvbnMucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgdmFyIHBhdGhIYXNBcHAgPSBwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnO1xuICAgICAgICAgICAgcmV0dXJuICghb3B0aW9ucy5pc0xvY2FsaG9zdCgpICYmICFwYXRoSGFzQXBwKTtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhcHBQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcblxuICAgICAgICAgICAgcmV0dXJuIHBhdGggJiYgcGF0aFsxXSB8fCAnJztcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhY2NvdW50UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhY2NudCA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgYWNjbnQgPSBwYXRoWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY250O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHByb2plY3RQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByaiA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgcHJqID0gcGF0aFszXTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmo7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgdmVyc2lvblBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IGVwaVZlcnNpb24udmVyc2lvbiA/IGVwaVZlcnNpb24udmVyc2lvbiArICcvJyA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgZ2V0QVBJUGF0aDogZnVuY3Rpb24gKGFwaSkge1xuICAgICAgICAgICAgdmFyIFBST0pFQ1RfQVBJUyA9IFsncnVuJywgJ2RhdGEnLCAnZmlsZScsICdwcmVzZW5jZSddO1xuICAgICAgICAgICAgdmFyIGFwaU1hcHBpbmcgPSB7XG4gICAgICAgICAgICAgICAgY2hhbm5lbDogJ2NoYW5uZWwvc3Vic2NyaWJlJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBhcGlFbmRwb2ludCA9IGFwaU1hcHBpbmdbYXBpXSB8fCBhcGk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChhcGlFbmRwb2ludCA9PT0gJ2NvbmZpZycpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsUHJvdG9jb2wgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wucmVwbGFjZSgnOicsICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgY29uZmlnUHJvdG9jb2wgPSAob3B0aW9ucy5pc0xvY2FsaG9zdCgpKSA/IHRoaXMucHJvdG9jb2wgOiBhY3R1YWxQcm90b2NvbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnUHJvdG9jb2wgKyAnOi8vJyArIGFjdGluZ0hvc3QgKyAnL2VwaWNlbnRlci8nICsgdGhpcy52ZXJzaW9uUGF0aCArICdjb25maWcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFwaVBhdGggPSB0aGlzLnByb3RvY29sICsgJzovLycgKyB0aGlzLmhvc3QgKyAnLycgKyB0aGlzLnZlcnNpb25QYXRoICsgYXBpRW5kcG9pbnQgKyAnLyc7XG5cbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkoYXBpRW5kcG9pbnQsIFBST0pFQ1RfQVBJUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXBpUGF0aCArPSB0aGlzLmFjY291bnRQYXRoICsgJy8nICsgdGhpcy5wcm9qZWN0UGF0aCArICcvJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcGlQYXRoO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgJC5leHRlbmQocHVibGljRXhwb3J0cywgb3ZlcnJpZGVzKTtcbiAgICByZXR1cm4gcHVibGljRXhwb3J0cztcbn07XG4vLyBUaGlzIGRhdGEgY2FuIGJlIHNldCBieSBleHRlcm5hbCBzY3JpcHRzLCBmb3IgbG9hZGluZyBmcm9tIGFuIGVudiBzZXJ2ZXIgZm9yIGVnO1xuVXJsQ29uZmlnU2VydmljZS5kZWZhdWx0cyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVybENvbmZpZ1NlcnZpY2U7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiogIyMgVXNlciBBUEkgQWRhcHRlclxuKlxuKiBUaGUgVXNlciBBUEkgQWRhcHRlciBhbGxvd3MgeW91IHRvIHJldHJpZXZlIGRldGFpbHMgYWJvdXQgZW5kIHVzZXJzIGluIHlvdXIgdGVhbSAoYWNjb3VudCkuIEl0IGlzIGJhc2VkIG9uIHRoZSBxdWVyeWluZyBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbVXNlciBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy91c2VyX21hbmFnZW1lbnQvdXNlci8pLlxuKlxuKiBUbyB1c2UgdGhlIFVzZXIgQVBJIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGNhbGwgaXRzIG1ldGhvZHMuXG4qXG4qICAgICAgIHZhciB1YSA9IG5ldyBGLnNlcnZpY2UuVXNlcih7XG4qICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4qICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4qICAgICAgIH0pO1xuKiAgICAgICB1YS5nZXRCeUlkKCc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnKTtcbiogICAgICAgdWEuZ2V0KHsgdXNlck5hbWU6ICdqc21pdGgnIH0pO1xuKiAgICAgICB1YS5nZXQoeyBpZDogWyc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnLFxuKiAgICAgICAgICAgICAgICAgICAnNGVhNzU2MzEtNGM4ZC00ODcyLTlkODAtYjQ2MDAxNDY0NzhlJ10gfSk7XG4qXG4qIFRoZSBjb25zdHJ1Y3RvciB0YWtlcyBhbiBvcHRpb25hbCBgb3B0aW9uc2AgcGFyYW1ldGVyIGluIHdoaWNoIHlvdSBjYW4gc3BlY2lmeSB0aGUgYGFjY291bnRgIGFuZCBgdG9rZW5gIGlmIHRoZXkgYXJlIG5vdCBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudCBjb250ZXh0LlxuKi9cblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjZXNzIHRva2VuIHRvIHVzZSB3aGVuIHNlYXJjaGluZyBmb3IgZW5kIHVzZXJzLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuXG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBwYXJ0aWN1bGFyIGVuZCB1c2VycyBpbiB5b3VyIHRlYW0sIGJhc2VkIG9uIHVzZXIgbmFtZSBvciB1c2VyIGlkLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciB1YSA9IG5ldyBGLnNlcnZpY2UuVXNlcih7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiAgICAgICAgKiAgICAgICB1YS5nZXQoeyBpZDogWyc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICc0ZWE3NTYzMS00YzhkLTQ4NzItOWQ4MC1iNDYwMDE0NjQ3OGUnXSB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBPYmplY3Qgd2l0aCBmaWVsZCBgdXNlck5hbWVgIGFuZCB2YWx1ZSBvZiB0aGUgdXNlcm5hbWUuIEFsdGVybmF0aXZlbHksIG9iamVjdCB3aXRoIGZpZWxkIGBpZGAgYW5kIHZhbHVlIG9mIGFuIGFycmF5IG9mIHVzZXIgaWRzLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cblxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChmaWx0ZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgZmlsdGVyID0gZmlsdGVyIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnNcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciB0b1FGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gQVBJIG9ubHkgc3VwcG9ydHMgZmlsdGVyaW5nIGJ5IHVzZXJuYW1lIGZvciBub3dcbiAgICAgICAgICAgICAgICBpZiAoZmlsdGVyLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5xID0gZmlsdGVyLnVzZXJOYW1lO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgdG9JZEZpbHRlcnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZCA9ICQuaXNBcnJheShpZCkgPyBpZCA6IFtpZF07XG4gICAgICAgICAgICAgICAgcmV0dXJuICdpZD0nICsgaWQuam9pbignJmlkPScpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIGdldEZpbHRlcnMgPSBbXG4gICAgICAgICAgICAgICAgJ2FjY291bnQ9JyArIGdldE9wdGlvbnMuYWNjb3VudCxcbiAgICAgICAgICAgICAgICB0b0lkRmlsdGVycyhmaWx0ZXIuaWQpLFxuICAgICAgICAgICAgICAgIHF1dGlsLnRvUXVlcnlGb3JtYXQodG9RRmlsdGVyKGZpbHRlcikpXG4gICAgICAgICAgICBdLmpvaW4oJyYnKTtcblxuICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBxdWVyaWVzIHdpdGggbGFyZ2UgbnVtYmVyIG9mIGlkc1xuICAgICAgICAgICAgLy8gbWFrZSBpdCBhcyBhIHBvc3Qgd2l0aCBHRVQgc2VtYW50aWNzXG4gICAgICAgICAgICB2YXIgdGhyZXNob2xkID0gMzA7XG4gICAgICAgICAgICBpZiAoZmlsdGVyLmlkICYmICQuaXNBcnJheShmaWx0ZXIuaWQpICYmIGZpbHRlci5pZC5sZW5ndGggPj0gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZ2V0T3B0aW9ucy51cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgndXNlcicpICsgJz9fbWV0aG9kPUdFVCc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdCh7IGlkOiBmaWx0ZXIuaWQgfSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRGaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGEgc2luZ2xlIGVuZCB1c2VyIGluIHlvdXIgdGVhbSwgYmFzZWQgb24gdXNlciBpZC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbidcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKiAgICAgICB1YS5nZXRCeUlkKCc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnKTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgdXNlciBpZCBmb3IgdGhlIGVuZCB1c2VyIGluIHlvdXIgdGVhbS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0QnlJZDogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHB1YmxpY0FQSS5nZXQoeyBpZDogdXNlcklkIH0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5cbiIsIi8qKlxuICpcbiAqICMjIFZhcmlhYmxlcyBBUEkgU2VydmljZVxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgdG8gcmVhZCwgd3JpdGUsIGFuZCBzZWFyY2ggZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy5cbiAqXG4gKiAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiAqICAgICAgICAgICBydW46IHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCdcbiAqICAgICAgICAgICB9XG4gKiAgICAgIH0pO1xuICogICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAqICAgICAgICAgIHZhciB2cyA9IHJtLnJ1bi52YXJpYWJsZXMoKTtcbiAqICAgICAgICAgIHZzLnNhdmUoe3NhbXBsZV9pbnQ6IDR9KTtcbiAqICAgICAgICB9KTtcbiAqXG4gKi9cblxuXG4gJ3VzZSBzdHJpY3QnO1xuXG4gdmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuIHZhciBydXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcnVuLXV0aWwnKTtcblxuIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcnVucyBvYmplY3QgdG8gd2hpY2ggdGhlIHZhcmlhYmxlIGZpbHRlcnMgYXBwbHkuIERlZmF1bHRzIHRvIG51bGwuXG4gICAgICAgICAqIEB0eXBlIHtydW5TZXJ2aWNlfVxuICAgICAgICAgKi9cbiAgICAgICAgIHJ1blNlcnZpY2U6IG51bGxcbiAgICAgfTtcbiAgICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vVE9ETzogUmVwbGFjZSB3aXRoIGdldEN1cnJlbnRjb25maWcgaW5zdGVhZD9cbiAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICd2YXJpYWJsZXMvJztcbiAgICAgfTtcblxuICAgICB2YXIgYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKG9wdGlvbnMpO1xuICAgICB9O1xuXG4gICAgIHZhciBodHRwT3B0aW9ucyA9IHtcbiAgICAgICAgIHVybDogZ2V0VVJMXG4gICAgIH07XG4gICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICAgfTtcbiAgICAgfVxuICAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcbiAgICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHZhbHVlcyBmb3IgYSB2YXJpYWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5sb2FkKCdzYW1wbGVfaW50JylcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKXtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIHZhbCBjb250YWlucyB0aGUgdmFsdWUgb2Ygc2FtcGxlX2ludFxuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZhcmlhYmxlIE5hbWUgb2YgdmFyaWFibGUgdG8gbG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgbG9hZDogZnVuY3Rpb24gKHZhcmlhYmxlLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSBhZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCAkLmV4dGVuZCh7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICAgfSkpO1xuICAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHZhcmlhYmxlcywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxdWVyeWAgb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KFsncHJpY2UnLCAnc2FsZXMnXSlcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyB2YWwgaXMgYW4gb2JqZWN0IHdpdGggdGhlIHZhbHVlcyBvZiB0aGUgcmVxdWVzdGVkIHZhcmlhYmxlczogdmFsLnByaWNlLCB2YWwuc2FsZXNcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMucXVlcnkoeyBpbmNsdWRlOlsncHJpY2UnLCAnc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IHF1ZXJ5IFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgIGh0dHBPcHRpb25zID0gYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgaWYgKCQuaXNBcnJheShxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgcXVlcnkgPSB7IGluY2x1ZGU6IHF1ZXJ5IH07XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgICQuZXh0ZW5kKHF1ZXJ5LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQocXVlcnksIGh0dHBPcHRpb25zKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgdmFsdWVzIHRvIG1vZGVsIHZhcmlhYmxlcy4gT3ZlcndyaXRlcyBleGlzdGluZyB2YWx1ZXMuIE5vdGUgdGhhdCB5b3UgY2FuIG9ubHkgdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoQW4gYWx0ZXJuYXRlIHdheSB0byB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlzIHRvIGNhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwgYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZSBtZXRob2QgcGVyc2lzdHMgdGhlIHZhcmlhYmxlcy4gU2VlIGBkb2AsIGBzZXJpYWxgLCBhbmQgYHBhcmFsbGVsYCBpbiB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIGNhbGxpbmcgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMuc2F2ZSgncHJpY2UnLCA0KTtcbiAgICAgICAgICogICAgICB2cy5zYXZlKHsgcHJpY2U6IDQsIHF1YW50aXR5OiA1LCBwcm9kdWN0czogWzIsMyw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YXJpYWJsZSBBbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIG1vZGVsIHZhcmlhYmxlcyBhbmQgdGhlIHZhbHVlcyB0byBzYXZlLiBBbHRlcm5hdGl2ZWx5LCBhIHN0cmluZyB3aXRoIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbCAoT3B0aW9uYWwpIElmIHBhc3NpbmcgYSBzdHJpbmcgZm9yIGB2YXJpYWJsZWAsIHVzZSB0aGlzIGFyZ3VtZW50IGZvciB0aGUgdmFsdWUgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgICBzYXZlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgICBpZiAodHlwZW9mIHZhcmlhYmxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICBhdHRycyA9IHZhcmlhYmxlO1xuICAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IEF2YWlsYWJsZSB1bnRpbCB1bmRlcmx5aW5nIEFQSSBzdXBwb3J0cyBQVVQuIE90aGVyd2lzZSBzYXZlIHdvdWxkIGJlIFBVVCBhbmQgbWVyZ2Ugd291bGQgYmUgUEFUQ0hcbiAgICAgICAgLy8gKlxuICAgICAgICAvLyAgKiBTYXZlIHZhbHVlcyB0byB0aGUgYXBpLiBNZXJnZXMgYXJyYXlzLCBidXQgb3RoZXJ3aXNlIHNhbWUgYXMgc2F2ZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhcmlhYmxlIE9iamVjdCB3aXRoIGF0dHJpYnV0ZXMsIG9yIHN0cmluZyBrZXlcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IHZhbCBPcHRpb25hbCBpZiBwcmV2IHBhcmFtZXRlciB3YXMgYSBzdHJpbmcsIHNldCB2YWx1ZSBoZXJlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSlcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKCdwcmljZScsIDQpO1xuXG4gICAgICAgIC8vIG1lcmdlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAvLyAgICAgdmFyIGF0dHJzO1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgLy8gICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIC8vIH1cbiAgICAgfTtcbiAgICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbiB9O1xuIiwiLyoqXG4gKiAjIyBXb3JsZCBBUEkgQWRhcHRlclxuICpcbiAqIEEgW3J1bl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3J1bikgaXMgYSBjb2xsZWN0aW9uIG9mIGVuZCB1c2VyIGludGVyYWN0aW9ucyB3aXRoIGEgcHJvamVjdCBhbmQgaXRzIG1vZGVsIC0tIGluY2x1ZGluZyBzZXR0aW5nIHZhcmlhYmxlcywgbWFraW5nIGRlY2lzaW9ucywgYW5kIGNhbGxpbmcgb3BlcmF0aW9ucy4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy4gT25seSBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pIGNhbiBiZSBtdWx0aXBsYXllci5cbiAqXG4gKiBUaGUgV29ybGQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgbXVsdGlwbGF5ZXIgd29ybGRzIHdpdGhpbiB5b3VyIEVwaWNlbnRlciBwcm9qZWN0LiBZb3UgY2FuIHVzZSB0aGlzIHRvIGFkZCBhbmQgcmVtb3ZlIGVuZCB1c2VycyBmcm9tIHRoZSB3b3JsZCwgYW5kIHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgcmVtb3ZlIHRoZWlyIHJ1bnMuIEJlY2F1c2Ugb2YgdGhpcywgdHlwaWNhbGx5IHRoZSBXb3JsZCBBZGFwdGVyIGlzIHVzZWQgZm9yIGZhY2lsaXRhdG9yIHBhZ2VzIGluIHlvdXIgcHJvamVjdC4gKFRoZSByZWxhdGVkIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyLykgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gYWNjZXNzIHJ1bnMgYW5kIHdvcmxkcyBmb3IgcGFydGljdWxhciBlbmQgdXNlcnMsIHNvIGlzIHR5cGljYWxseSB1c2VkIGluIHBhZ2VzIHRoYXQgZW5kIHVzZXJzIHdpbGwgaW50ZXJhY3Qgd2l0aC4pXG4gKlxuICogQXMgd2l0aCBhbGwgdGhlIG90aGVyIFtBUEkgQWRhcHRlcnNdKC4uLy4uLyksIGFsbCBtZXRob2RzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBXb3JsZCBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKiBUbyB1c2UgdGhlIFdvcmxkIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGFjY2VzcyB0aGUgbWV0aG9kcyBwcm92aWRlZC4gSW5zdGFudGlhdGluZyByZXF1aXJlcyB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSksIHByb2plY3QgaWQgKCoqUHJvamVjdCBJRCoqKSwgYW5kIGdyb3VwICgqKkdyb3VwIE5hbWUqKikuXG4gKlxuICogICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gKiAgICAgICB3YS5jcmVhdGUoKVxuICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAqICAgICAgICAgICAgICAvLyBjYWxsIG1ldGhvZHMsIGUuZy4gd2EuYWRkVXNlcnMoKVxuICogICAgICAgICAgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG4vLyB2YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xuXG52YXIgYXBpQmFzZSA9ICdtdWx0aXBsYXllci8nO1xudmFyIGFzc2lnbm1lbnRFbmRwb2ludCA9IGFwaUJhc2UgKyAnYXNzaWduJztcbnZhciBhcGlFbmRwb2ludCA9IGFwaUJhc2UgKyAnd29ybGQnO1xudmFyIHByb2plY3RFbmRwb2ludCA9IGFwaUJhc2UgKyAncHJvamVjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwOiB1bmRlZmluZWQsXG5cbiAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1vZGVsIGZpbGUgdG8gdXNlIHRvIGNyZWF0ZSBydW5zIGluIHRoaXMgd29ybGQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1vZGVsOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciB3b3JsZC4gQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgd29ybGQtaWRzIGFzIGZpbHRlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgY29tcGxldGVzIHN1Y2Nlc3NmdWxseS4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgZmFpbHMuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBlcnJvcjogJC5ub29wXG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBzZXRJZEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gd29ybGQgaWQgc3BlY2lmaWVkIHRvIGFwcGx5IG9wZXJhdGlvbnMgYWdhaW5zdC4gVGhpcyBjb3VsZCBoYXBwZW4gaWYgdGhlIHVzZXIgaXMgbm90IGFzc2lnbmVkIHRvIGEgd29ybGQgYW5kIGlzIHRyeWluZyB0byB3b3JrIHdpdGggcnVucyBmcm9tIHRoYXQgd29ybGQuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMubW9kZWwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbW9kZWwgc3BlY2lmaWVkIHRvIGdldCB0aGUgY3VycmVudCBydW4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBuZXcgV29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBVc2luZyB0aGlzIG1ldGhvZCBpcyByYXJlLiBJdCBpcyBtb3JlIGNvbW1vbiB0byBjcmVhdGUgd29ybGRzIGF1dG9tYXRpY2FsbHkgd2hpbGUgeW91IGBhdXRvQXNzaWduKClgIGVuZCB1c2VycyB0byB3b3JsZHMuIChJbiB0aGlzIGNhc2UsIGNvbmZpZ3VyYXRpb24gZGF0YSBmb3IgdGhlIHdvcmxkLCBzdWNoIGFzIHRoZSByb2xlcywgYXJlIHJlYWQgZnJvbSB0aGUgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uLCBmb3IgZXhhbXBsZSBieSBgZ2V0UHJvamVjdFNldHRpbmdzKClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSh7XG4gICAgICAgICogICAgICAgICAgIHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gY3JlYXRlIHRoZSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwIChPcHRpb25hbCkgVGhlICoqR3JvdXAgTmFtZSoqIHRvIGNyZWF0ZSB0aGlzIHdvcmxkIHVuZGVyLiBPbmx5IGVuZCB1c2VycyBpbiB0aGlzIGdyb3VwIGFyZSBlbGlnaWJsZSB0byBqb2luIHRoZSB3b3JsZC4gT3B0aW9uYWwgaGVyZTsgcmVxdWlyZWQgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBzZXJ2aWNlIChgbmV3IEYuc2VydmljZS5Xb3JsZCgpYCkuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfSk7XG4gICAgICAgICAgICB2YXIgd29ybGRBcGlQYXJhbXMgPSBbJ3Njb3BlJywgJ2ZpbGVzJywgJ3JvbGVzJywgJ29wdGlvbmFsUm9sZXMnLCAnbWluVXNlcnMnLCAnZ3JvdXAnLCAnbmFtZSddO1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFyYW1zID0gX3BpY2soc2VydmljZU9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIHdvcmxkQXBpUGFyYW1zKTtcblxuICAgICAgICAgICAgLy8gYWNjb3VudCBhbmQgcHJvamVjdCBnbyBpbiB0aGUgYm9keSwgbm90IGluIHRoZSB1cmxcbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHt9LCB2YWxpZFBhcmFtcywgcGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBjcmVhdGVPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgICAgICBjcmVhdGVPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSByZXNwb25zZS5pZDsgLy9hbGwgZnV0dXJlIGNoYWluZWQgY2FsbHMgdG8gb3BlcmF0ZSBvbiB0aGlzIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9sZFN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIGEgV29ybGQsIGZvciBleGFtcGxlIHRvIHJlcGxhY2UgdGhlIHJvbGVzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFR5cGljYWxseSwgeW91IGNvbXBsZXRlIHdvcmxkIGNvbmZpZ3VyYXRpb24gYXQgdGhlIHByb2plY3QgbGV2ZWwsIHJhdGhlciB0aGFuIGF0IHRoZSB3b3JsZCBsZXZlbC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguIEhvd2V2ZXIsIHRoaXMgbWV0aG9kIGlzIGF2YWlsYWJsZSBpZiB5b3UgbmVlZCB0byB1cGRhdGUgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYSBwYXJ0aWN1bGFyIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnVwZGF0ZSh7IHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyB0byB1cGRhdGUgdGhlIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMubmFtZSBBIHN0cmluZyBpZGVudGlmaWVyIGZvciB0aGUgbGlua2VkIGVuZCB1c2VycywgZm9yIGV4YW1wbGUsIFwibmFtZVwiOiBcIk91ciBUZWFtXCIuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHdoaXRlbGlzdCA9IFsncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycyddO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zIHx8IHt9LCB3aGl0ZWxpc3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChwYXJhbXMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgYW4gZXhpc3Rpbmcgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIG9wdGlvbmFsbHkgdGFrZXMgb25lIGFyZ3VtZW50LiBJZiB0aGUgYXJndW1lbnQgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLiBJZiB0aGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0LCBpdCBpcyB0aGUgb3ZlcnJpZGUgZm9yIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmRlbGV0ZSgpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIFRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLCBvciBvcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gKG9wdGlvbnMgJiYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykpID8geyBmaWx0ZXI6IG9wdGlvbnMgfSA6IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgV29ybGQgQVBJIEFkYXB0ZXIgKGluY2x1ZGluZyBhbGwgc3Vic2VxdWVudCBmdW5jdGlvbiBjYWxscywgdW50aWwgdGhlIGNvbmZpZ3VyYXRpb24gaXMgdXBkYXRlZCBhZ2FpbikuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHsuLi59KS51cGRhdGVDb25maWcoeyBmaWx0ZXI6ICcxMjMnIH0pLmFkZFVzZXIoeyB1c2VySWQ6ICcxMjMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIG9iamVjdCB0byB1c2UgaW4gdXBkYXRpbmcgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHJlZmVyZW5jZSB0byBjdXJyZW50IGluc3RhbmNlXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgJC5leHRlbmQoc2VydmljZU9wdGlvbnMsIGNvbmZpZyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIExpc3RzIGFsbCB3b3JsZHMgZm9yIGEgZ2l2ZW4gYWNjb3VudCwgcHJvamVjdCwgYW5kIGdyb3VwLiBBbGwgdGhyZWUgYXJlIHJlcXVpcmVkLCBhbmQgaWYgbm90IHNwZWNpZmllZCBhcyBwYXJhbWV0ZXJzLCBhcmUgcmVhZCBmcm9tIHRoZSBzZXJ2aWNlLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJ0ZWFtMVwiXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5saXN0KCk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJvdGhlci1ncm91cC1uYW1lXCJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmxpc3QoeyBncm91cDogJ290aGVyLWdyb3VwLW5hbWUnIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IF9waWNrKGdldE9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhbGwgd29ybGRzIHRoYXQgYW4gZW5kIHVzZXIgYmVsb25ncyB0byBmb3IgYSBnaXZlbiBhY2NvdW50ICh0ZWFtKSwgcHJvamVjdCwgYW5kIGdyb3VwLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldFdvcmxkc0ZvclVzZXIoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIHdvcmxkcyBhcmUgYmVpbmcgcmV0cmlldmVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0V29ybGRzRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gJC5leHRlbmQoXG4gICAgICAgICAgICAgICAgX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSksXG4gICAgICAgICAgICAgICAgeyB1c2VySWQ6IHVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgaW5mb3JtYXRpb24gZm9yIGEgc3BlY2lmaWMgd29ybGQuIEFsbCBmdXJ0aGVyIGNhbGxzIHRvIHRoZSB3b3JsZCBzZXJ2aWNlIHdpbGwgdXNlIHRoZSBpZCBwcm92aWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHdvcmxkSWQgVGhlIGlkIG9mIHRoZSB3b3JsZCB0byBsb2FkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIHdvcmxkaWQgdG8gbG9hZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy8nIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQWRkcyBhbiBlbmQgdXNlciBvciBsaXN0IG9mIGVuZCB1c2VycyB0byBhIGdpdmVuIHdvcmxkLiBUaGUgZW5kIHVzZXIgbXVzdCBiZSBhIG1lbWJlciBvZiB0aGUgYGdyb3VwYCB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBvbmUgdXNlclxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoWydiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnXSk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2Vycyh7IHVzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHJvbGU6ICdWUCBTYWxlcycgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBzZXZlcmFsIHVzZXJzXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycyhbXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgeyB1c2VySWQ6ICdhNmZlMGMxZS1mNGI4LTRmMDEtOWY1Zi0wMWNjZjRjMmVkNDQnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgcm9sZTogJ1ZQIE1hcmtldGluZycgfSxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICByb2xlOiAnVlAgRW5naW5lZXJpbmcnIH1cbiAgICAgICAgKiAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgICAgICAvLyBhZGQgb25lIHVzZXIgdG8gYSBzcGVjaWZpYyB3b3JsZFxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB7IGZpbHRlcjogd29ybGQuaWQgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdHxhcnJheX0gdXNlcnMgVXNlciBpZCwgYXJyYXkgb2YgdXNlciBpZHMsIG9iamVjdCwgb3IgYXJyYXkgb2Ygb2JqZWN0cyBvZiB0aGUgdXNlcnMgdG8gYWRkIHRvIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJzLnJvbGUgVGhlIGByb2xlYCB0aGUgdXNlciBzaG91bGQgaGF2ZSBpbiB0aGUgd29ybGQuIEl0IGlzIHVwIHRvIHRoZSBjYWxsZXIgdG8gZW5zdXJlLCBpZiBuZWVkZWQsIHRoYXQgdGhlIGByb2xlYCBwYXNzZWQgaW4gaXMgb25lIG9mIHRoZSBgcm9sZXNgIG9yIGBvcHRpb25hbFJvbGVzYCBvZiB0aGlzIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3b3JsZElkIFRoZSB3b3JsZCB0byB3aGljaCB0aGUgdXNlcnMgc2hvdWxkIGJlIGFkZGVkLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgZmlsdGVyIHBhcmFtZXRlciBvZiB0aGUgYG9wdGlvbnNgIG9iamVjdCBpcyB1c2VkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgYWRkVXNlcnM6IGZ1bmN0aW9uICh1c2Vycywgd29ybGRJZCwgb3B0aW9ucykge1xuXG4gICAgICAgICAgICBpZiAoIXVzZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIGxpc3Qgb2YgdXNlcnMgdG8gYWRkIHRvIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBub3JtYWxpemUgdGhlIGxpc3Qgb2YgdXNlcnMgdG8gYW4gYXJyYXkgb2YgdXNlciBvYmplY3RzXG4gICAgICAgICAgICB1c2VycyA9ICQubWFwKFtdLmNvbmNhdCh1c2VycyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KHUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1ICE9PSAnc3RyaW5nJyAmJiAhaXNPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTb21lIG9mIHRoZSB1c2VycyBpbiB0aGUgbGlzdCBhcmUgbm90IGluIHRoZSB2YWxpZCBmb3JtYXQ6ICcgKyB1KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaXNPYmplY3QgPyB1IDogeyB1c2VySWQ6IHUgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBvcHRpb25zIHdlcmUgcGFzc2VkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHdvcmxkSWQpICYmICFvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHdvcmxkSWQ7XG4gICAgICAgICAgICAgICAgd29ybGRJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICAvLyB3ZSBtdXN0IGhhdmUgb3B0aW9ucyBieSBub3dcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd29ybGRJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmZpbHRlciA9IHdvcmxkSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMnIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QodXNlcnMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgdGhlIHJvbGUgb2YgYW4gZW5kIHVzZXIgaW4gYSBnaXZlbiB3b3JsZC4gKFlvdSBjYW4gb25seSB1cGRhdGUgb25lIGVuZCB1c2VyIGF0IGEgdGltZS4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuY3JlYXRlKCkudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJyk7XG4gICAgICAgICogICAgICAgICAgIHdhLnVwZGF0ZVVzZXIoeyB1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCByb2xlOiAnbGVhZGVyJyB9KTtcbiAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gdXNlciBVc2VyIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCB0aGUgbmV3IGByb2xlYC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byB1cGRhdGUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwYXRjaE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChfcGljayh1c2VyLCAncm9sZScpLCBwYXRjaE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlbW92ZXMgYW4gZW5kIHVzZXIgZnJvbSBhIGdpdmVuIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFsnYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0JywgJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZSddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnJlbW92ZVVzZXIoJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcih7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fHN0cmluZ30gdXNlciBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHdvcmxkLCBvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgYHVzZXJJZGAgZmllbGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0geyB1c2VySWQ6IHVzZXIgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byByZW1vdmUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy91c2Vycy8nICsgdXNlci51c2VySWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHJ1biBpZCBvZiBjdXJyZW50IHJ1biBmb3IgdGhlIGdpdmVuIHdvcmxkLiBJZiB0aGUgd29ybGQgZG9lcyBub3QgaGF2ZSBhIHJ1biwgY3JlYXRlcyBhIG5ldyBvbmUgYW5kIHJldHVybnMgdGhlIHJ1biBpZC5cbiAgICAgICAgKlxuICAgICAgICAqIFJlbWVtYmVyIHRoYXQgYSBbcnVuXSguLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwuIEluIHRoZSBjYXNlIG9mIG11bHRpcGxheWVyIHByb2plY3RzLCB0aGUgcnVuIGlzIHNoYXJlZCBieSBhbGwgZW5kIHVzZXJzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogJ21vZGVsLnB5JyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50UnVuSWQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IoZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KF9waWNrKGdldE9wdGlvbnMsICdtb2RlbCcpLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBjdXJyZW50IChtb3N0IHJlY2VudCkgd29ybGQgZm9yIHRoZSBnaXZlbiBlbmQgdXNlciBpbiB0aGUgZ2l2ZW4gZ3JvdXAuIEJyaW5ncyB0aGlzIG1vc3QgcmVjZW50IHdvcmxkIGludG8gbWVtb3J5IGlmIG5lZWRlZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyB1c2UgZGF0YSBmcm9tIHdvcmxkXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIGN1cnJlbnQgKG1vc3QgcmVjZW50KSB3b3JsZCBpcyBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cC4gSWYgbm90IHByb3ZpZGVkLCBkZWZhdWx0cyB0byB0aGUgZ3JvdXAgdXNlZCB0byBjcmVhdGUgdGhlIHNlcnZpY2UuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZ2V0V29ybGRzRm9yVXNlcih1c2VySWQsIHsgZ3JvdXA6IGdyb3VwTmFtZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBtb3N0IHJlY2VudCB3b3JsZCBhcyB0aGUgJ2FjdGl2ZScgd29ybGRcbiAgICAgICAgICAgICAgICAgICAgd29ybGRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG5ldyBEYXRlKGIubGFzdE1vZGlmaWVkKSAtIG5ldyBEYXRlKGEubGFzdE1vZGlmaWVkKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGQgPSB3b3JsZHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gY3VycmVudFdvcmxkLmlkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmVXaXRoKG1lLCBbY3VycmVudFdvcmxkXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyB0aGUgY3VycmVudCBydW4gZnJvbSB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAoTm90ZSB0aGF0IHRoZSB3b3JsZCBpZCByZW1haW5zIHBhcnQgb2YgdGhlIHJ1biByZWNvcmQsIGluZGljYXRpbmcgdGhhdCB0aGUgcnVuIHdhcyBmb3JtZXJseSBhbiBhY3RpdmUgcnVuIGZvciB0aGUgd29ybGQuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5kZWxldGVSdW4oJ3NhbXBsZS13b3JsZC1pZCcpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgVGhlIGB3b3JsZElkYCBvZiB0aGUgd29ybGQgZnJvbSB3aGljaCB0aGUgY3VycmVudCBydW4gaXMgYmVpbmcgZGVsZXRlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVJ1bjogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAod29ybGRJZCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHJ1biBmb3IgdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKCc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB3YS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgd29ybGRJZCBpbiB3aGljaCB3ZSBjcmVhdGUgdGhlIG5ldyBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBuZXdSdW5Gb3JXb3JsZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UnVuT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyBmaWx0ZXI6IHdvcmxkSWQgfHwgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yKGN1cnJlbnRSdW5PcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlUnVuKHdvcmxkSWQsIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuZ2V0Q3VycmVudFJ1bklkKGN1cnJlbnRSdW5PcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBc3NpZ25zIGVuZCB1c2VycyB0byB3b3JsZHMsIGNyZWF0aW5nIG5ldyB3b3JsZHMgYXMgYXBwcm9wcmlhdGUsIGF1dG9tYXRpY2FsbHkuIEFzc2lnbnMgYWxsIGVuZCB1c2VycyBpbiB0aGUgZ3JvdXAsIGFuZCBjcmVhdGVzIG5ldyB3b3JsZHMgYXMgbmVlZGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gKHJvbGVzLCBvcHRpb25hbCByb2xlcywgYW5kIG1pbmltdW0gZW5kIHVzZXJzIHBlciB3b3JsZCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuYXV0b0Fzc2lnbigpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgYXV0b0Fzc2lnbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXNzaWdubWVudEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IG9wdC5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgIGdyb3VwOiBvcHQuZ3JvdXBcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChvcHQubWF4VXNlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMubWF4VXNlcnMgPSBvcHQubWF4VXNlcnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBvcHQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHByb2plY3QncyB3b3JsZCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCBldmVyeSBpbnRlcmFjdGlvbiB3aXRoIHlvdXIgcHJvamVjdCB1c2VzIHRoZSBzYW1lIGNvbmZpZ3VyYXRpb24gb2YgZWFjaCB3b3JsZC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguXG4gICAgICAgICpcbiAgICAgICAgKiAoVGhlIFtNdWx0aXBsYXllciBQcm9qZWN0IFJFU1QgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvbXVsdGlwbGF5ZXJfcHJvamVjdC8pIGFsbG93cyB5b3UgdG8gc2V0IHRoZXNlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbnMuIFRoZSBXb3JsZCBBZGFwdGVyIHNpbXBseSByZXRyaWV2ZXMgdGhlbSwgZm9yIGV4YW1wbGUgc28gdGhleSBjYW4gYmUgdXNlZCBpbiBhdXRvLWFzc2lnbm1lbnQgb2YgZW5kIHVzZXJzIHRvIHdvcmxkcy4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuZ2V0UHJvamVjdFNldHRpbmdzKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLnJvbGVzKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLm9wdGlvbmFsUm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRQcm9qZWN0U2V0dGluZ3M6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKHByb2plY3RFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgb3B0LnVybCArPSBbb3B0LmFjY291bnQsIG9wdC5wcm9qZWN0XS5qb2luKCcvJyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQobnVsbCwgb3B0KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29va2llIFN0b3JhZ2UgU2VydmljZVxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgIHZhciBwZW9wbGUgPSByZXF1aXJlKCdjb29raWUtc3RvcmUnKSh7IHJvb3Q6ICdwZW9wbGUnIH0pO1xuICAgICAgICBwZW9wbGVcbiAgICAgICAgICAgIC5zYXZlKHtsYXN0TmFtZTogJ3NtaXRoJyB9KVxuXG4gKi9cblxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRoaW4gZG9jdW1lbnQuY29va2llIHdyYXBwZXIgdG8gYWxsb3cgdW5pdCB0ZXN0aW5nXG52YXIgQ29va2llID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgIH07XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChuZXdDb29raWUpIHtcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmV3Q29va2llO1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgICB2YXIgdmFsaWRIb3N0ID0gaG9zdC5zcGxpdCgnLicpLmxlbmd0aCA+IDE7XG4gICAgdmFyIGRvbWFpbiA9IHZhbGlkSG9zdCA/ICcuJyArIGhvc3QgOiBudWxsO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogZG9tYWluLFxuICAgICAgICBjb29raWU6IG5ldyBDb29raWUoKVxuICAgIH07XG4gICAgdGhpcy5zZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8vICogVEJEXG4gICAgICAgIC8vICAqIFF1ZXJ5IGNvbGxlY3Rpb247IHVzZXMgTW9uZ29EQiBzeW50YXhcbiAgICAgICAgLy8gICogQHNlZSAgPFRCRDogRGF0YSBBUEkgVVJMPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IHFzIFF1ZXJ5IEZpbHRlclxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IGxpbWl0ZXJzIEBzZWUgPFRCRDogdXJsIGZvciBsaW1pdHMsIHBhZ2luZyBldGM+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICBjcy5xdWVyeShcbiAgICAgICAgLy8gICogICAgICB7IG5hbWU6ICdKb2huJywgY2xhc3NOYW1lOiAnQ1NDMTAxJyB9LFxuICAgICAgICAvLyAgKiAgICAgIHtsaW1pdDogMTB9XG4gICAgICAgIC8vICAqICAgICApXG5cbiAgICAgICAgLy8gcXVlcnk6IGZ1bmN0aW9uIChxcywgbGltaXRlcnMpIHtcblxuICAgICAgICAvLyB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIHNlcnZpY2Ugb3B0aW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBUaGUgc2F2ZWQgdmFsdWVcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLnNldCgncGVyc29uJywgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSk7XG4gICAgICAgICAqICAgICBjcy5zZXQoeyBuYW1lOidzbWl0aCcsIGFnZTonMzInIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSBzZXRPcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2V0T3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHNldE9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBjb29raWUgPSB0aGlzLnNlcnZpY2VPcHRpb25zLmNvb2tpZTtcbiAgICAgICAgICAgIHZhciBjb29raWVSZWcgPSBuZXcgUmVnRXhwKCcoPzpefDspXFxcXHMqJyArIGVuY29kZVVSSUNvbXBvbmVudChrZXkpLnJlcGxhY2UoL1tcXC1cXC5cXCtcXCpdL2csICdcXFxcJCYnKSArICdcXFxccypcXFxcPVxcXFxzKihbXjtdKikuKiQnKTtcbiAgICAgICAgICAgIHZhciByZXMgPSBjb29raWVSZWcuZXhlYyhjb29raWUuZ2V0KCkpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IHJlcyA/IGRlY29kZVVSSUNvbXBvbmVudChyZXNbMV0pIDogbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMga2V5IGZyb20gY29sbGVjdGlvblxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGtleSBrZXkgdG8gcmVtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSByZW1PcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcmVtT3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHJlbU9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPTsgZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgICogQHJldHVybiB7IGFycmF5fSBrZXlzIEFsbCB0aGUga2V5cyByZW1vdmVkXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29va2llID0gdGhpcy5zZXJ2aWNlT3B0aW9ucy5jb29raWU7XG4gICAgICAgICAgICB2YXIgYUtleXMgPSBjb29raWUuZ2V0KCkucmVwbGFjZSgvKCg/Ol58XFxzKjspW15cXD1dKykoPz07fCQpfF5cXHMqfFxccyooPzpcXD1bXjtdKik/KD86XFwxfCQpL2csICcnKS5zcGxpdCgvXFxzKig/OlxcPVteO10qKT87XFxzKi8pO1xuICAgICAgICAgICAgZm9yICh2YXIgbklkeCA9IDA7IG5JZHggPCBhS2V5cy5sZW5ndGg7IG5JZHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb29raWVLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoYUtleXNbbklkeF0pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNvb2tpZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYUtleXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL2tleS1uYW1lcycpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgb3B0aW9uVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL29wdGlvbi11dGlscycpO1xuXG52YXIgRVBJX1NFU1NJT05fS0VZID0ga2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZO1xudmFyIEVQSV9NQU5BR0VSX0tFWSA9ICdlcGljZW50ZXIudG9rZW4nOyAvL2Nhbid0IGJlIHVuZGVyIGtleS1uYW1lcywgb3IgbG9nb3V0IHdpbGwgY2xlYXIgdGhpcyB0b29cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFdoZXJlIHRvIHN0b3JlIHVzZXIgYWNjZXNzIHRva2VucyBmb3IgdGVtcG9yYXJ5IGFjY2Vzcy4gRGVmYXVsdHMgdG8gc3RvcmluZyBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0b3JlOiB7IHN5bmNocm9ub3VzOiB0cnVlIH1cbn07XG5cbnZhciBTZXNzaW9uTWFuYWdlciA9IGZ1bmN0aW9uIChtYW5hZ2VyT3B0aW9ucykge1xuICAgIG1hbmFnZXJPcHRpb25zID0gbWFuYWdlck9wdGlvbnMgfHwge307XG4gICAgZnVuY3Rpb24gZ2V0QmFzZU9wdGlvbnMob3ZlcnJpZGVzKSB7XG4gICAgICAgIG92ZXJyaWRlcyA9IG92ZXJyaWRlcyB8fCB7fTtcbiAgICAgICAgdmFyIGxpYk9wdGlvbnMgPSBvcHRpb25VdGlscy5nZXRPcHRpb25zKCk7XG4gICAgICAgIHZhciBmaW5hbE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGxpYk9wdGlvbnMsIG1hbmFnZXJPcHRpb25zLCBvdmVycmlkZXMpO1xuICAgICAgICByZXR1cm4gZmluYWxPcHRpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0b3JlKG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgYmFzZU9wdGlvbnMgPSBnZXRCYXNlT3B0aW9ucyhvdmVycmlkZXMpO1xuICAgICAgICB2YXIgc3RvcmVPcHRzID0gYmFzZU9wdGlvbnMuc3RvcmUgfHwge307XG4gICAgICAgIHZhciBpc0VwaWNlbnRlckRvbWFpbiA9ICFiYXNlT3B0aW9ucy5pc0xvY2FsICYmICFiYXNlT3B0aW9ucy5pc0N1c3RvbURvbWFpbjtcbiAgICAgICAgaWYgKHN0b3JlT3B0cy5yb290ID09PSB1bmRlZmluZWQgJiYgYmFzZU9wdGlvbnMuYWNjb3VudCAmJiBiYXNlT3B0aW9ucy5wcm9qZWN0ICYmIGlzRXBpY2VudGVyRG9tYWluKSB7XG4gICAgICAgICAgICBzdG9yZU9wdHMucm9vdCA9ICcvYXBwLycgKyBiYXNlT3B0aW9ucy5hY2NvdW50ICsgJy8nICsgYmFzZU9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFN0b3JhZ2VGYWN0b3J5KHN0b3JlT3B0cyk7XG4gICAgfVxuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgc2F2ZVNlc3Npb246IGZ1bmN0aW9uICh1c2VySW5mbywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeSh1c2VySW5mbyk7XG4gICAgICAgICAgICBnZXRTdG9yZShvcHRpb25zKS5zZXQoRVBJX1NFU1NJT05fS0VZLCBzZXJpYWxpemVkKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2Vzc2lvbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHZhciBzZXNzaW9uID0gZ2V0U3RvcmUob3B0aW9ucykuZ2V0KEVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9JztcbiAgICAgICAgICAgIC8vIHJldHVybiBKU09OLnBhcnNlKHNlc3Npb24pO1xuICAgICAgICAgICAgdmFyIHN0b3JlID0gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gc3RvcmUuc2VydmljZU9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZCA9IHN0b3JlLmdldChFUElfU0VTU0lPTl9LRVkpIHx8ICd7fSc7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGNvbnRhaW5zIHRoZSBwcm9qZWN0IGFuZCBhY2NvdW50XG4gICAgICAgICAgICAvLyB2YWxpZGF0ZSB0aGUgYWNjb3VudCBhbmQgcHJvamVjdCBpbiB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgLy8gYW5kIG92ZXJyaWRlIHByb2plY3QsIGdyb3VwTmFtZSwgZ3JvdXBJZCBhbmQgaXNGYWNcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSAoaS5lLiBsb2NhbGhvc3QpIHVzZSB0aGUgc2F2ZWQgc2Vzc2lvbiB2YWx1ZXNcbiAgICAgICAgICAgIHZhciBhY2NvdW50ID0gZmluYWxPcHRzLmFjY291bnQ7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGZpbmFsT3B0cy5wcm9qZWN0O1xuICAgICAgICAgICAgaWYgKGFjY291bnQgJiYgc2Vzc2lvbi5hY2NvdW50ICE9PSBhY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSB0b2tlbiB3YXMgbm90IHVzZWQgdG8gbG9naW4gdG8gdGhlIHNhbWUgYWNjb3VudFxuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLmdyb3VwcyAmJiBhY2NvdW50ICYmIHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBzZXNzaW9uLmdyb3Vwc1twcm9qZWN0XSB8fCB7IGdyb3VwSWQ6ICcnLCBncm91cE5hbWU6ICcnLCBpc0ZhYzogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXNzaW9uLCB7IHByb2plY3Q6IHByb2plY3QgfSwgZ3JvdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZVNlc3Npb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBnZXRTdG9yZShvcHRpb25zKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleU5hbWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb29raWVLZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29va2llTmFtZSA9IGtleU5hbWVzW2Nvb2tpZUtleV07XG4gICAgICAgICAgICAgICAgc3RvcmUucmVtb3ZlKGNvb2tpZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U3RvcmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWVyZ2VkT3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kLmFwcGx5KCQsIFt0cnVlLCB7fV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgIHZhciBiYXNlT3B0aW9ucyA9IGdldEJhc2VPcHRpb25zKG92ZXJyaWRlcyk7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuZ2V0U2Vzc2lvbihvdmVycmlkZXMpO1xuXG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBzZXNzaW9uLmF1dGhfdG9rZW47XG4gICAgICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZhY3RvcnkgPSBuZXcgU3RvcmFnZUZhY3RvcnkoKTtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGZhY3RvcnkuZ2V0KEVQSV9NQU5BR0VSX0tFWSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzZXNzaW9uRGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgYWNjb3VudC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgYWNjb3VudDogc2Vzc2lvbi5hY2NvdW50LFxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGhlIHByb2plY3QuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHByb2plY3Q6IHNlc3Npb24ucHJvamVjdCxcblxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGdyb3VwOiBzZXNzaW9uLmdyb3VwTmFtZSxcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBBbGlhcyBmb3IgZ3JvdXAuIFxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lOiBzZXNzaW9uLmdyb3VwTmFtZSwgLy9JdCdzIGEgbGl0dGxlIHdlaXJkIHRoYXQgaXQncyBjYWxsZWQgZ3JvdXBOYW1lIGluIHRoZSBjb29raWUsIGJ1dCAnZ3JvdXAnIGluIGFsbCB0aGUgc2VydmljZSBvcHRpb25zLCBzbyBub3JtYWxpemUgZm9yIGJvdGhcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgZ3JvdXAgaWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBjb29raWUgc2Vzc2lvbi5cbiAgICAgICAgICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlc3Npb24uZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHNlc3Npb24udXNlcklkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHNlc3Npb25EZWZhdWx0cywgYmFzZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXNzaW9uTWFuYWdlcjsiLCIvKipcbiAgICBEZWNpZGVzIHR5cGUgb2Ygc3RvcmUgdG8gcHJvdmlkZVxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLy8gdmFyIGlzTm9kZSA9IGZhbHNlOyBGSVhNRTogQnJvd3NlcmlmeS9taW5pZnlpZnkgaGFzIGlzc3VlcyB3aXRoIHRoZSBuZXh0IGxpbmtcbi8vIHZhciBzdG9yZSA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9zZXNzaW9uLXN0b3JlJykgOiByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnLi9jb29raWUtc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdG9yZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHF1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBoZWFkZXJzOiB7fSxcbiAgICAgICAgc3RhdHVzQ29kZToge1xuICAgICAgICAgICAgNDA0OiAkLm5vb3BcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT05MWSBmb3Igc3RyaW5ncyBpbiB0aGUgdXJsLiBBbGwgR0VUICYgREVMRVRFIHBhcmFtcyBhcmUgcnVuIHRocm91Z2ggdGhpc1xuICAgICAgICAgKiBAdHlwZSB7W3R5cGVdIH1cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFtZXRlclBhcnNlcjogcXV0aWxzLnRvUXVlcnlGb3JtYXQsXG5cbiAgICAgICAgLy8gVG8gYWxsb3cgZXBpY2VudGVyLnRva2VuIGFuZCBvdGhlciBzZXNzaW9uIGNvb2tpZXMgdG8gYmUgcGFzc2VkXG4gICAgICAgIC8vIHdpdGggdGhlIHJlcXVlc3RzXG4gICAgICAgIHhockZpZWxkczoge1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuICgkLmlzRnVuY3Rpb24oZCkpID8gZCgpIDogZDtcbiAgICB9O1xuXG4gICAgdmFyIGNvbm5lY3QgPSBmdW5jdGlvbiAobWV0aG9kLCBwYXJhbXMsIGNvbm5lY3RPcHRpb25zKSB7XG4gICAgICAgIHBhcmFtcyA9IHJlc3VsdChwYXJhbXMpO1xuICAgICAgICBwYXJhbXMgPSAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykgfHwgJC5pc0FycmF5KHBhcmFtcykpID8gSlNPTi5zdHJpbmdpZnkocGFyYW1zKSA6IHBhcmFtcztcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0cmFuc3BvcnRPcHRpb25zLCBjb25uZWN0T3B0aW9ucywge1xuICAgICAgICAgICAgdHlwZTogbWV0aG9kLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMgPSBbJ2RhdGEnLCAndXJsJ107XG4gICAgICAgICQuZWFjaChvcHRpb25zLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih2YWx1ZSkgJiYgJC5pbkFycmF5KGtleSwgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmxvZ0xldmVsICYmIG9wdGlvbnMubG9nTGV2ZWwgPT09ICdERUJVRycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzRm4gPSBvcHRpb25zLnN1Y2Nlc3MgfHwgJC5ub29wO1xuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBhamF4U3RhdHVzLCBhamF4UmVxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3NGbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVTZW5kID0gb3B0aW9ucy5iZWZvcmVTZW5kO1xuICAgICAgICBvcHRpb25zLmJlZm9yZVNlbmQgPSBmdW5jdGlvbiAoeGhyLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgeGhyLnJlcXVlc3RVcmwgPSAoY29ubmVjdE9wdGlvbnMgfHwge30pLnVybDtcbiAgICAgICAgICAgIGlmIChiZWZvcmVTZW5kKSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKHBhcmFtcywgYWpheE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIHRyYW5zcG9ydE9wdGlvbnMsIGFqYXhPcHRpb25zKTtcbiAgICAgICAgICAgIHBhcmFtcyA9IG9wdGlvbnMucGFyYW1ldGVyUGFyc2VyKHJlc3VsdChwYXJhbXMpKTtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmNhbGwodGhpcywgJ0dFVCcsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG4gICAgICAgIHNwbGl0R2V0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwb3N0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwYXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwYXRjaCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3B1dCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgLy9ERUxFVEUgZG9lc24ndCBzdXBwb3J0IGJvZHkgcGFyYW1zLCBidXQgalF1ZXJ5IHRoaW5rcyBpdCBkb2VzLlxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgaWYgKCQudHJpbShwYXJhbXMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlciA9IChyZXN1bHQob3B0aW9ucy51cmwpLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXJsID0gcmVzdWx0KG9wdGlvbnMudXJsKSArIGRlbGltaXRlciArIHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmNhbGwodGhpcywgJ0RFTEVURScsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICBoZWFkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ2hlYWQnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnb3B0aW9ucyddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIHZhciBpc05vZGUgPSBmYWxzZTsgRklYTUU6IEJyb3dzZXJpZnkvbWluaWZ5aWZ5IGhhcyBpc3N1ZXMgd2l0aCB0aGUgbmV4dCBsaW5rXG4vLyB2YXIgdHJhbnNwb3J0ID0gKGlzTm9kZSkgPyByZXF1aXJlKCcuL25vZGUtaHR0cC10cmFuc3BvcnQnKSA6IHJlcXVpcmUoJy4vYWpheC1odHRwLXRyYW5zcG9ydCcpO1xudmFyIHRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vYWpheC1odHRwLXRyYW5zcG9ydCcpO1xubW9kdWxlLmV4cG9ydHMgPSB0cmFuc3BvcnQ7XG4iLCIvKipcbi8qIEluaGVyaXQgZnJvbSBhIGNsYXNzICh1c2luZyBwcm90b3R5cGUgYm9ycm93aW5nKVxuKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5oZXJpdChDLCBQKSB7XG4gICAgdmFyIEYgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICBDLl9fc3VwZXIgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEM7XG59XG5cbi8qKlxuKiBTaGFsbG93IGNvcHkgb2YgYW4gb2JqZWN0XG4qIEBwYXJhbSB7T2JqZWN0fSBkZXN0IG9iamVjdCB0byBleHRlbmRcbiogQHJldHVybiB7T2JqZWN0fSBleHRlbmRlZCBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iai5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIShjdXJyZW50ID0gb2JqW2pdKSkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgZGVzdFtrZXldID0gY3VycmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChiYXNlLCBwcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICB2YXIgcGFyZW50ID0gYmFzZTtcbiAgICB2YXIgY2hpbGQ7XG5cbiAgICBjaGlsZCA9IHByb3BzICYmIHByb3BzLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpID8gcHJvcHMuY29uc3RydWN0b3IgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcblxuICAgIC8vIGFkZCBzdGF0aWMgcHJvcGVydGllcyB0byB0aGUgY2hpbGQgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAgICBleHRlbmQoY2hpbGQsIHBhcmVudCwgc3RhdGljUHJvcHMpO1xuXG4gICAgLy8gYXNzb2NpYXRlIHByb3RvdHlwZSBjaGFpblxuICAgIGluaGVyaXQoY2hpbGQsIHBhcmVudCk7XG5cbiAgICAvLyBhZGQgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgIGlmIChwcm9wcykge1xuICAgICAgICBleHRlbmQoY2hpbGQucHJvdG90eXBlLCBwcm9wcyk7XG4gICAgfVxuXG4gICAgLy8gZG9uZVxuICAgIHJldHVybiBjaGlsZDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIF9waWNrOiBmdW5jdGlvbiAob2JqLCBwcm9wcykge1xuICAgICAgICB2YXIgcmVzID0ge307XG4gICAgICAgIGZvciAodmFyIHAgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAocHJvcHMuaW5kZXhPZihwKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXNbcF0gPSBvYmpbcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG4gICAgaXNFbXB0eTogZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gKCF2YWx1ZSB8fCAoJC5pc1BsYWluT2JqZWN0KHZhbHVlKSAmJiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoID09PSAwKSk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuXG52YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2UoKS5nZXQoJ3NlcnZlcicpO1xudmFyIGN1c3RvbURlZmF1bHRzID0ge307XG52YXIgbGliRGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGFjY291bnQ6IHVybENvbmZpZy5hY2NvdW50UGF0aCB8fCB1bmRlZmluZWQsXG4gICAgLyoqXG4gICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIHByb2plY3Q6IHVybENvbmZpZy5wcm9qZWN0UGF0aCB8fCB1bmRlZmluZWQsXG4gICAgaXNMb2NhbDogdXJsQ29uZmlnLmlzTG9jYWxob3N0KCksXG4gICAgaXNDdXN0b21Eb21haW46IHVybENvbmZpZy5pc0N1c3RvbURvbWFpbixcbiAgICBzdG9yZToge31cbn07XG5cbnZhciBvcHRpb25VdGlscyA9IHtcbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBmaW5hbCBvcHRpb25zIGJ5IG92ZXJyaWRpbmcgdGhlIGdsb2JhbCBvcHRpb25zIHNldCB3aXRoXG4gICAgICogb3B0aW9uVXRpbHMjc2V0RGVmYXVsdHMoKSBhbmQgdGhlIGxpYiBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgZmluYWwgb3B0aW9ucyBvYmplY3QuXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBFeHRlbmRlZCBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIGxpYkRlZmF1bHRzLCBjdXN0b21EZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBnbG9iYWwgZGVmYXVsdHMgZm9yIHRoZSBvcHRpb25VdGlscyNnZXRPcHRpb25zKCkgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZWZhdWx0cyBUaGUgZGVmYXVsdHMgb2JqZWN0LlxuICAgICAqL1xuICAgIHNldERlZmF1bHRzOiBmdW5jdGlvbiAoZGVmYXVsdHMpIHtcbiAgICAgICAgY3VzdG9tRGVmYXVsdHMgPSBkZWZhdWx0cztcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBvcHRpb25VdGlscztcbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggcXVlcnkgc3RyaW5nc1xuKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHRvIG1hdHJpeCBmb3JtYXRcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBxcyBPYmplY3QgdG8gY29udmVydCB0byBxdWVyeSBzdHJpbmdcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICB0b01hdHJpeEZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCB8fCBxcyA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzsnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgdmFyIE9QRVJBVE9SUyA9IFsnPCcsICc+JywgJyEnXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAkLmluQXJyYXkoJC50cmltKHZhbHVlKS5jaGFyQXQoMCksIE9QRVJBVE9SUykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJz0nICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBtdHJ4ID0gJzsnICsgcmV0dXJuQXJyYXkuam9pbignOycpO1xuICAgICAgICAgICAgcmV0dXJuIG10cng7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHN0cmluZ3MvYXJyYXlzL29iamVjdHMgdG8gdHlwZSAnYT1iJmI9YydcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b1F1ZXJ5Rm9ybWF0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHFzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAvL01vc3RseSBmb3IgZGF0YSBhcGlcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgJz0nICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXR1cm5BcnJheS5qb2luKCcmJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzIG9mIHR5cGUgJ2E9YiZiPWMnIHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd9IHFzXG4gICAgICAgICAqIEByZXR1cm4ge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHFzVG9PYmplY3Q6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcXNBcnJheSA9IHFzLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0ge307XG4gICAgICAgICAgICAkLmVhY2gocXNBcnJheSwgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBxS2V5ID0gdmFsdWUuc3BsaXQoJz0nKVswXTtcbiAgICAgICAgICAgICAgICB2YXIgcVZhbCA9IHZhbHVlLnNwbGl0KCc9JylbMV07XG5cbiAgICAgICAgICAgICAgICBpZiAocVZhbC5pbmRleE9mKCcsJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHFWYWwgPSBxVmFsLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuT2JqW3FLZXldID0gcVZhbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb3JtYWxpemVzIGFuZCBtZXJnZXMgc3RyaW5ncyBvZiB0eXBlICdhPWInLCB7IGI6Y30gdG8geyBhOmIsIGI6Y31cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXMyXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIG1lcmdlUVM6IGZ1bmN0aW9uIChxczEsIHFzMikge1xuICAgICAgICAgICAgdmFyIG9iajEgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMSkpO1xuICAgICAgICAgICAgdmFyIG9iajIgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMikpO1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmoxLCBvYmoyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAodXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgPT09ICcvJykgPyB1cmwgOiAodXJsICsgJy8nKTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuXG5cbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggdGhlIHJ1biBzZXJ2aWNlXG4qL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHF1dGlsID0gcmVxdWlyZSgnLi9xdWVyeS11dGlsJyk7XG52YXIgTUFYX1VSTF9MRU5HVEggPSAyMDQ4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIG5vcm1hbGl6ZXMgZGlmZmVyZW50IHR5cGVzIG9mIG9wZXJhdGlvbiBpbnB1dHNcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fEFycmF5fFN0cmluZ30gb3BlcmF0aW9ucyBvcGVyYXRpb25zIHRvIHBlcmZvcm1cbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIGZvciBvcGVyYXRpb25cbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfSBvcGVyYXRpb25zIG9mIHRoZSBmb3JtIGB7IG9wczogW10sIGFyZ3M6IFtdIH1gXG4gICAgICAgICAqL1xuICAgICAgICBub3JtYWxpemVPcGVyYXRpb25zOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJncykge1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJldHVybkxpc3QgPSB7XG4gICAgICAgICAgICAgICAgb3BzOiBbXSxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9jb25jYXQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhcnIgIT09IG51bGwgJiYgYXJyICE9PSB1bmRlZmluZWQpID8gW10uY29uY2F0KGFycikgOiBbXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8veyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVQbGFpbk9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKG9wbiwgYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmcpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL3sgbmFtZTogJ2FkZCcsIHBhcmFtczogWzFdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQob3BlcmF0aW9uLnBhcmFtcykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVPYmplY3QgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgob3BlcmF0aW9uLm5hbWUpID8gX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzIDogX25vcm1hbGl6ZVBsYWluT2JqZWN0cykob3BlcmF0aW9uLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplTGl0ZXJhbHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCBhcmdzLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVBcnJheXMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJnLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAoaW5kZXgsIG9wbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BuLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcG4sIGFyZ3NbaW5kZXhdLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BlcmF0aW9ucywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuaXNBcnJheShvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVBcnJheXMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3BsaXRHZXRGYWN0b3J5OiBmdW5jdGlvbiAoaHR0cE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGh0dHAgPSB0aGlzOyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICB2YXIgZ2V0VmFsdWUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBvcHRpb25zW25hbWVdIHx8IGh0dHBPcHRpb25zW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGdldEZpbmFsVXJsID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gZ2V0VmFsdWUoJ3VybCcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgZWFzeSAob3Iga25vd24pIHdheSB0byBnZXQgdGhlIGZpbmFsIFVSTCBqcXVlcnkgaXMgZ29pbmcgdG8gc2VuZCBzb1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSByZXBsaWNhdGluZyBpdC4gVGhlIHByb2Nlc3MgbWlnaHQgY2hhbmdlIGF0IHNvbWUgcG9pbnQgYnV0IGl0IHByb2JhYmx5IHdpbGwgbm90LlxuICAgICAgICAgICAgICAgICAgICAvLyAxLiBSZW1vdmUgaGFzaFxuICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgvIy4qJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gQXBwZW5kIHF1ZXJ5IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlQYXJhbXMgPSBxdXRpbC50b1F1ZXJ5Rm9ybWF0KGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlc3Rpb25JZHggPSB1cmwuaW5kZXhPZignPycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlQYXJhbXMgJiYgcXVlc3Rpb25JZHggPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICcmJyArIHF1ZXJ5UGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXJ5UGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgJz8nICsgcXVlcnlQYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBnZXRGaW5hbFVybChwYXJhbXMpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG11c3Qgc3BsaXQgdGhlIEdFVCBpbiBtdWx0aXBsZSBzaG9ydCBVUkwnc1xuICAgICAgICAgICAgICAgIC8vIFRoZSBvbmx5IHByb3BlcnR5IGFsbG93ZWQgdG8gYmUgc3BsaXQgaXMgXCJpbmNsdWRlXCJcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5pbmNsdWRlICYmIGVuY29kZVVSSSh1cmwpLmxlbmd0aCA+IE1BWF9VUkxfTEVOR1RIKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXNDb3B5ID0gJC5leHRlbmQodHJ1ZSwge30sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbXNDb3B5LmluY2x1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmxOb0luY2x1ZGVzID0gZ2V0RmluYWxVcmwocGFyYW1zQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTUFYX1VSTF9MRU5HVEggLSB1cmxOb0luY2x1ZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3MgfHwgaHR0cE9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRFcnJvciA9IG9wdGlvbnMuZXJyb3IgfHwgaHR0cE9wdGlvbnMuZXJyb3IgfHwgJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIG9yaWdpbmFsIHN1Y2Nlc3MgYW5kIGVycm9yIGNhbGxiYWNrc1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IgPSAkLm5vb3A7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY2x1ZGUgPSBwYXJhbXMuaW5jbHVkZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJJbmNsdWRlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5jbHVkZU9wdHMgPSBbY3VyckluY2x1ZGVzXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJMZW5ndGggPSBlbmNvZGVVUklDb21wb25lbnQoJz9pbmNsdWRlPScpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFyTGVuZ2h0ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhcmlhYmxlKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgYSBncmVlZHkgYXBwcm9hY2ggZm9yIG5vdywgY2FuIGJlIG9wdGltaXplZCB0byBiZSBzb2x2ZWQgaW4gYSBtb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlZmZpY2llbnQgd2F5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyArIDEgaXMgdGhlIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyckxlbmd0aCArIHZhckxlbmdodCArIDEgPCBkaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzLnB1c2godmFyaWFibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggKz0gdmFyTGVuZ2h0ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzID0gW3ZhcmlhYmxlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlT3B0cy5wdXNoKGN1cnJJbmNsdWRlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyckxlbmd0aCA9ICc/aW5jbHVkZT0nLmxlbmd0aCArIHZhckxlbmdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxcyA9ICQubWFwKGluY2x1ZGVPcHRzLCBmdW5jdGlvbiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcVBhcmFtcyA9ICQuZXh0ZW5kKHt9LCBwYXJhbXMsIHsgaW5jbHVkZTogaW5jbHVkZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChyZXFQYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJC53aGVuLmFwcGx5KCQsIHJlcXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBhcmd1bWVudCBhcmUgYXJyYXlzIG9mIHRoZSBhcmd1bWVudHMgb2YgZWFjaCBkb25lIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvIHRoZSBmaXJzdCBhcmd1bWVudCBvZiB0aGUgZmlyc3QgYXJyYXkgb2YgYXJndW1lbnRzIGlzIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZCA9IGFyZ3VtZW50c1swXSAmJiBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG91bGQgbmV2ZXIgaGFwcGVuLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0UmVzcG9uc2UgPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNPYmplY3QgPSAkLmlzUGxhaW5PYmplY3QoZmlyc3RSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNSdW5BUEkgPSAoaXNPYmplY3QgJiYgJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UudmFyaWFibGVzKSkgfHwgIWlzT2JqZWN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUnVuQVBJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgdmFyaWFibGVzIHByb3BlcnR5IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFnZ3JlZ2F0ZVJ1biA9IGFyZ3VtZW50c1swXVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1biA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVSdW4udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlUnVuLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFycmF5IG9mIHJ1bnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWdyZWdhdGUgdmFyaWFibGVzIGluIGVhY2ggcnVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkUnVucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbiAoaWR4LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVucyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQuaXNBcnJheShydW5zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChydW5zLCBmdW5jdGlvbiAoaWR4UnVuLCBydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVuLmlkICYmICFhZ2dyZWdhdGVkUnVuc1tydW4uaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi52YXJpYWJsZXMgPSBydW4udmFyaWFibGVzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdID0gcnVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRSdW5zW3J1bi5pZF0udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHR1cm4gaXQgaW50byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVucyA9ICQubWFwKGFnZ3JlZ2F0ZWRSdW5zLCBmdW5jdGlvbiAocnVuKSB7IHJldHVybiBydW47IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpcyB2YXJpYWJsZXMgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWdncmVnYXRlIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkVmFyaWFibGVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFycyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIHZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlZFZhcmlhYmxlcywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IuYXBwbHkoaHR0cCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZWplY3QuYXBwbHkoZHRkLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuIl19
